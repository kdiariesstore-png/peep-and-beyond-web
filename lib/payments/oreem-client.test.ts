import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createHostedPayment, verifyTransaction, fetchTransactionByOreemReference } from "./oreem-client";

beforeEach(() => {
  process.env.OREEM_API_TOKEN = "test-token";
  process.env.OREEM_BASE_URL = "https://app.oreem.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHostedPayment", () => {
  it("posts to the hosted-payments endpoint with a bearer token and returns the payment url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { payment_url: "https://app.oreem.com/pay/xyz" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createHostedPayment({
      txnRef: "peep_abc123",
      amountBhd: 23.9,
      customerName: "سارة أحمد",
      customerEmail: "sara@example.com",
      customerPhone: "33001122",
      redirectUrl: "https://peepandbeyond.example/order/confirmation?order=xyz",
    });

    expect(result.paymentUrl).toBe("https://app.oreem.com/pay/xyz");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.oreem.com/api/v1/hosted-payments");
    expect(options.headers.Authorization).toBe("Bearer test-token");
    const body = JSON.parse(options.body);
    expect(body.currency).toBe("BHD");
    expect(body.txn_ref).toBe("peep_abc123");
  });

  it("throws a clear error when Oreem responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) })
    );

    await expect(
      createHostedPayment({
        txnRef: "peep_bad",
        amountBhd: 10,
        customerName: "Test",
        customerEmail: "t@example.com",
        customerPhone: "000",
        redirectUrl: "https://example.com",
      })
    ).rejects.toThrow(/status 401/);
  });
});

describe("verifyTransaction", () => {
  it("reports verified=true for a successful transaction status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { status: "success" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyTransaction("peep_abc123");
    expect(result.verified).toBe(true);
    expect(result.status).toBe("success");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://app.oreem.com/api/v1/transactions/verify_by_reference/hosted_payment/peep_abc123"
    );
  });

  it("returns the amount Oreem confirms was paid, coerced from Oreem's decimal string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { status: "success", amount: "23.900" } }),
      })
    );

    const result = await verifyTransaction("peep_abc123");
    expect(result.verified).toBe(true);
    expect(result.amountBhd).toBe(23.9);
  });

  it("leaves amountBhd undefined when Oreem does not report an amount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { status: "success" } }),
      })
    );

    const result = await verifyTransaction("peep_abc123");
    expect(result.amountBhd).toBeUndefined();
  });

  it("reports verified=false for a failed transaction status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { status: "failed" } }),
      })
    );

    const result = await verifyTransaction("peep_abc123");
    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
  });
});

describe("fetchTransactionByOreemReference", () => {
  it("looks the transaction up by Oreem's own reference and returns the raw response", async () => {
    const providerBody = { data: { status: "success", amount: "2.990", txn_ref: "peepdigi_abc123" } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(providerBody) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchTransactionByOreemReference("AP-6a8408cf413c3f24a");

    expect(result).toEqual(providerBody);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.oreem.com/api/v1/transactions/AP-6a8408cf413c3f24a/verify");
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });

  it("throws a clear error when Oreem responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) })
    );

    await expect(fetchTransactionByOreemReference("AP-unknown")).rejects.toThrow(/status 404/);
  });
});
