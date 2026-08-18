import { describe, expect, it, vi, beforeEach } from "vitest";

const store = new Map<string, unknown>();
let lastSetOptions: Record<string, unknown> | undefined;

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn((key: string) => Promise.resolve(store.has(key) ? store.get(key) : null)),
    set: vi.fn((key: string, value: unknown, options?: Record<string, unknown>) => {
      store.set(key, value);
      lastSetOptions = options;
      return Promise.resolve("OK");
    }),
  },
}));

import { storePendingOrder, getPendingOrder } from "./pending-order-store";

beforeEach(() => {
  store.clear();
  lastSetOptions = undefined;
});

describe("storePendingOrder / getPendingOrder", () => {
  it("round-trips an arbitrary JSON-serializable payload by txnRef", async () => {
    const payload = { txnRef: "peepdigi_abc123", buyer: { fullName: "سارة" }, items: [1, 2, 3] };
    await storePendingOrder("peepdigi_abc123", payload);
    expect(await getPendingOrder("peepdigi_abc123")).toEqual(payload);
  });

  it("returns null for a txnRef that was never stored", async () => {
    expect(await getPendingOrder("peepdigi_never-stored")).toBeNull();
  });

  it("sets a TTL so abandoned pending orders don't accumulate forever", async () => {
    await storePendingOrder("peepdigi_ttl-check", { a: 1 });
    expect(lastSetOptions).toMatchObject({ ex: expect.any(Number) });
  });

  it("keys physical and digital orders independently even with similar prefixes", async () => {
    await storePendingOrder("peep_abc", { kind: "physical" });
    await storePendingOrder("peepdigi_abc", { kind: "digital" });
    expect(await getPendingOrder("peep_abc")).toEqual({ kind: "physical" });
    expect(await getPendingOrder("peepdigi_abc")).toEqual({ kind: "digital" });
  });
});
