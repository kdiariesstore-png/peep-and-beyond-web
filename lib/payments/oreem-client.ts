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
  return { verified, status };
}
