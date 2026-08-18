import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const fetchTransactionMock = vi.fn();
vi.mock("../../../../lib/payments/oreem-client", () => ({
  fetchTransactionByOreemReference: (...args: unknown[]) => fetchTransactionMock(...args),
}));

function buildRequest(params: Record<string, string | undefined>, headers?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/admin/oreem-lookup");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  process.env.ADMIN_TOOLS_SECRET = "test-admin-secret";
  fetchTransactionMock.mockReset();
});

describe("GET /api/admin/oreem-lookup", () => {
  it("returns 401 when no secret is provided", async () => {
    const response = await GET(buildRequest({ reference: "AP-abc123" }));
    expect(response.status).toBe(401);
    expect(fetchTransactionMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the provided secret does not match", async () => {
    const response = await GET(buildRequest({ reference: "AP-abc123", secret: "wrong" }));
    expect(response.status).toBe(401);
  });

  it("returns 401 for any secret when ADMIN_TOOLS_SECRET is not configured", async () => {
    delete process.env.ADMIN_TOOLS_SECRET;
    const response = await GET(buildRequest({ reference: "AP-abc123", secret: "test-admin-secret" }));
    expect(response.status).toBe(401);
  });

  it("accepts the secret as a query param", async () => {
    fetchTransactionMock.mockResolvedValue({ data: { status: "success" } });
    const response = await GET(buildRequest({ reference: "AP-abc123", secret: "test-admin-secret" }));
    expect(response.status).toBe(200);
    expect(fetchTransactionMock).toHaveBeenCalledWith("AP-abc123");
  });

  it("accepts the secret as a bearer token", async () => {
    fetchTransactionMock.mockResolvedValue({ data: { status: "success" } });
    const response = await GET(
      buildRequest({ reference: "AP-abc123" }, { authorization: "Bearer test-admin-secret" })
    );
    expect(response.status).toBe(200);
  });

  it("returns 400 when the reference param is missing", async () => {
    const response = await GET(buildRequest({ secret: "test-admin-secret" }));
    expect(response.status).toBe(400);
    expect(fetchTransactionMock).not.toHaveBeenCalled();
  });

  it("returns the provider's raw lookup result on success", async () => {
    const providerResult = { data: { status: "success", amount: "2.990", some_other_field: "x" } };
    fetchTransactionMock.mockResolvedValue(providerResult);
    const response = await GET(buildRequest({ reference: "AP-abc123", secret: "test-admin-secret" }));
    expect(await response.json()).toEqual({ data: providerResult });
  });

  it("returns 502 when the Oreem lookup throws", async () => {
    fetchTransactionMock.mockRejectedValue(new Error("boom"));
    const response = await GET(buildRequest({ reference: "AP-abc123", secret: "test-admin-secret" }));
    expect(response.status).toBe(502);
  });
});
