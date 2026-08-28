export interface ShippingRateParcel {
  chargeableWeightKg: number;
  // Number of identical parcels at this weight (e.g. box quantity in the order).
  qty: number;
}

export interface ShippingRateParams {
  destCountryCode: string;
  destCity?: string;
  // One entry per distinct package weight in the order (e.g. boxes and standalone
  // stories ship as separate parcel lines within the same rate request).
  parcels: ShippingRateParcel[];
}

export interface ShippingRateOption {
  serviceName: string;
  serviceCode: string;
  amountBhd: number;
}

export interface CityOption {
  name: string;
}

export interface CreateHostedPaymentParams {
  txnRef: string;
  amountBhd: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  redirectUrl: string;
}

export interface CreateHostedPaymentResult {
  paymentUrl: string;
}

export interface VerifyTransactionResult {
  verified: boolean;
  status: string;
  // The amount Oreem itself confirms was paid, in BHD. Undefined when Oreem's
  // response carries no usable amount. Callers must use this — never the amount
  // in their own (unsigned, client-round-tripped) order payload — to decide what
  // the customer actually paid for.
  amountBhd?: number;
}

function getBaseUrl(): string {
  return process.env.OREEM_BASE_URL ?? "https://app.oreem.com";
}

function getToken(): string {
  const token = process.env.OREEM_API_TOKEN;
  if (!token) throw new Error("OREEM_API_TOKEN is not set");
  return token;
}

export async function createHostedPayment(
  params: CreateHostedPaymentParams
): Promise<CreateHostedPaymentResult> {
  const response = await fetch(`${getBaseUrl()}/api/v1/hosted-payments`, {
    method: "POST",
    // Never serve a memoized response for a payment call, and never hang forever: a
    // stalled connection must fall into the caller's friendly failure path instead.
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      txn_ref: params.txnRef,
      amount: params.amountBhd.toFixed(3),
      currency: "BHD",
      redirect_url: params.redirectUrl,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      fee_bearer: "merchant",
    }),
  });

  if (!response.ok) {
    throw new Error(`Oreem hosted-payments request failed with status ${response.status}`);
  }

  const json = await response.json();
  const paymentUrl = json?.data?.payment_url;
  if (typeof paymentUrl !== "string") {
    throw new Error("Oreem response missing data.payment_url");
  }
  return { paymentUrl };
}

// Verifies a transaction by our own txn_ref (the reference we generated when creating
// the hosted payment), using Oreem's "verify by reference" endpoint. Oreem also exposes
// a `GET /api/v1/transactions/{transaction_reference}/verify` endpoint keyed on *their*
// transaction_reference (only known after a payment attempt, via redirect/webhook), but
// since callers of this function only have our txn_ref, verify_by_reference is the right
// endpoint. `hosted_payment` is the payment-source type since createHostedPayment is the
// only way this client creates payments. Confirmed against https://app.oreem.com/docs
// on 2026-08-16; response status lives at data.status (e.g. "completed").
export async function verifyTransaction(txnRef: string): Promise<VerifyTransactionResult> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/transactions/verify_by_reference/hosted_payment/${encodeURIComponent(txnRef)}`,
    {
      // This function's entire job is "what is the status right now", so a cached GET
      // would be worse than useless — Next.js caches fetch() by default in the App
      // Router. The timeout keeps a hung provider from blocking the confirmation page.
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${getToken()}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Oreem transaction verification failed with status ${response.status}`);
  }

  const json = await response.json();
  // Only ever read data.status here, never the top-level envelope status: Oreem's
  // top-level `status` is "success" for any successful HTTP call regardless of the
  // underlying transaction's outcome (it means "the API call succeeded," not "the
  // payment succeeded"). Falling back to it would report verified: true for a
  // transaction whose real state is unknown - fail closed instead.
  const status: string = json?.data?.status ?? "unknown";
  const verified = status === "success" || status === "paid" || status === "completed";

  // Oreem documents data.amount as a decimal, serialized as a string ("23.900") in
  // practice. Coerce it, but only surface it when it parses to a finite number —
  // a bogus/absent amount must read as "unknown", not as 0 (which would look like
  // a mismatch against every real order total).
  // (Note the empty-string guard: Number("") is 0, which would masquerade as a real
  // verified amount of zero and wrongly fail the caller's amount comparison.)
  const rawAmount = json?.data?.amount;
  const parsedAmount =
    rawAmount === null || rawAmount === undefined || (typeof rawAmount === "string" && rawAmount.trim() === "")
      ? NaN
      : Number(rawAmount);
  const amountBhd = Number.isFinite(parsedAmount) ? parsedAmount : undefined;

  return { verified, status, amountBhd };
}

// Calls Oreem's shipping-rate calculator (POST /api/v1/shipments/rates) for one or more
// parcels shipped from our Bahrain origin to the given destination. Oreem only exports
// from Bahrain today, so origin.country_code is always "BH"; SHIP_ORIGIN_CITY is optional
// because the docs don't mark origin.city_name as required and rates appear to be priced
// by country pair. delivery_code is omitted (not a specific carrier) so Oreem returns every
// service it has rates for; the caller decides which one to use (e.g. the cheapest).
// Returns [] when Oreem has no rated service for that destination — callers should treat
// that the same as "no rate available" (matches the existing getShippingRate() null case).
export async function fetchShippingRates(params: ShippingRateParams): Promise<ShippingRateOption[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/shipments/rates`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin: {
        country_code: "BH",
        // Oreem's docs example always sends a real city for both origin and dest (only
        // postal_code is shown nullable) — a null city_name here is a likely cause of the
        // 422s seen in production, so this always sends a real city rather than null.
        city_name: process.env.SHIP_ORIGIN_CITY ?? "Manama",
        postal_code: null,
      },
      dest: {
        country_code: params.destCountryCode,
        city_name: params.destCity ?? null,
        // Oreem's validation confirmed in production: "The dest.postal_code field is
        // required unless dest.country_code is in BH" — a null postal_code is rejected
        // (422) for every non-Bahrain destination. We don't collect a real postal code
        // from the buyer, and Oreem's own docs example uses "00000" as a placeholder, so
        // this sends the same placeholder rather than adding a postal-code field to
        // checkout just to satisfy a presence check the rate calculation doesn't actually
        // use for precision.
        postal_code: params.destCountryCode === "BH" ? null : "00000",
      },
      parcels: params.parcels.map((parcel) => ({
        qty: parcel.qty,
        item_qty: 1,
        chargeable_weight: parcel.chargeableWeightKg.toFixed(3),
        weight_unit: "kg",
      })),
      // Oreem's own working example always sends a concrete delivery_code (never null) —
      // unlike delivery_method_code, which the same example does send as null. Omitting
      // the key entirely (rather than sending delivery_code: null) is the closer match to
      // "not asking for one specific carrier," and avoids a validation rule that accepts
      // an absent key but rejects an explicit null.
      delivery_method_code: null,
      cod: false,
      currency: "BHD",
    }),
  });

  if (!response.ok) {
    // Oreem's 4xx responses carry the actual validation reason (e.g. a missing/invalid
    // field) in the body — without it, every failure just looks like "status 422" with no
    // way to tell a bad request apart from an auth or server problem. Best-effort: body
    // reads can themselves fail (already-consumed stream, non-JSON error page).
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // ignore — fall back to the bare status in the error message below
    }
    throw new Error(
      `Oreem shipping-rates request failed with status ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  const json = await response.json();
  const rows = Array.isArray(json?.data) ? json.data : [];
  const options: ShippingRateOption[] = [];
  for (const row of rows) {
    const service = row?.delivery_service;
    const amount = service?.rate?.value;
    if (typeof amount === "number" && Number.isFinite(amount) && typeof service?.code === "string") {
      options.push({
        serviceName: typeof service?.name === "string" ? service.name : service.code,
        serviceCode: service.code,
        amountBhd: amount,
      });
    }
  }
  return options.sort((a, b) => a.amountBhd - b.amountBhd);
}

// Oreem's own list of city names it recognizes for a country (GET /shipments/cities) —
// letting the buyer pick from this instead of free-typing a city avoids the mismatched
// spelling that makes a perfectly good destination look "unavailable" (Oreem's rates
// endpoint matches on its own city_name values, not on whatever the buyer happens to type).
// Returns [] (never throws) on any failure so a flaky lookup or an unlisted country just
// falls back to the free-text field rather than breaking checkout.
export async function fetchCities(countryCode: string): Promise<CityOption[]> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/v1/shipments/cities?country_code=${encodeURIComponent(countryCode)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
    if (!response.ok) return [];
    const json = await response.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    return rows
      .map((row: unknown) => (row as Record<string, unknown>)?.name)
      .filter((name: unknown): name is string => typeof name === "string" && name.length > 0)
      .map((name: string) => ({ name }));
  } catch {
    return [];
  }
}

// The counterpart to verifyTransaction: looks a transaction up by Oreem's OWN transaction
// reference (the "AP-..." value shown in the Oreem merchant dashboard and in Oreem's
// redirect/webhook params) instead of our txn_ref. This is the reconciliation path for
// when a payment reached Oreem but our confirmation page never completed the order — e.g.
// the customer never made it back to our site — so we only have what the Oreem dashboard
// shows, not our own reference. Returns the provider's raw response body: this exists
// purely for a human to read (an admin tool), and Oreem's docs don't specify whether the
// merchant's txn_ref is echoed back here or under what field name, so callers are expected
// to eyeball the result rather than the caller assuming a shape.
export async function fetchTransactionByOreemReference(
  oreemReference: string
): Promise<unknown> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/transactions/${encodeURIComponent(oreemReference)}/verify`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${getToken()}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Oreem transaction lookup failed with status ${response.status}`);
  }

  return response.json();
}
