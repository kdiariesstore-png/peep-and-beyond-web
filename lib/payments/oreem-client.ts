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

export interface ShippingRateParcel {
  chargeableWeightKg: number;
  qty: number;
}

export interface ShippingRateOption {
  serviceName: string;
  serviceCode: string;
  amountBhd: number;
}

export interface CityOption {
  name: string;
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

export async function fetchShippingRates(params: {
  destCountryCode: string;
  destCity: string;
  parcels: ShippingRateParcel[];
}): Promise<ShippingRateOption[]> {
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
        city_name: process.env.SHIP_ORIGIN_CITY ?? "Manama",
        postal_code: null,
      },
      dest: {
        country_code: params.destCountryCode,
        city_name: params.destCity,
        postal_code: params.destCountryCode === "BH" ? null : "00000",
      },
      parcels: params.parcels.map((parcel) => ({
        qty: parcel.qty,
        item_qty: 1,
        chargeable_weight: parcel.chargeableWeightKg.toFixed(3),
        weight_unit: "kg",
      })),
      delivery_method_code: null,
      cod: false,
      currency: "BHD",
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // The status is still enough to fail closed when Oreem returns no readable body.
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
    if (
      typeof amount === "number" &&
      Number.isFinite(amount) &&
      typeof service?.code === "string"
    ) {
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
