import { describe, expect, it } from "vitest";
import { validateReceiptFile, MAX_RECEIPT_BYTES } from "./validate-receipt";

describe("validateReceiptFile", () => {
  it("rejects a missing file", () => {
    expect(validateReceiptFile(null)).toEqual({ valid: false, error: "receipt_required" });
  });

  it("rejects an unsupported file type", () => {
    expect(validateReceiptFile({ type: "text/plain", size: 100 })).toEqual({
      valid: false,
      error: "receipt_invalid_type",
    });
  });

  it("rejects a file over the size limit", () => {
    expect(
      validateReceiptFile({ type: "image/png", size: MAX_RECEIPT_BYTES + 1 })
    ).toEqual({ valid: false, error: "receipt_too_large" });
  });

  it("accepts a valid png under the size limit", () => {
    expect(validateReceiptFile({ type: "image/png", size: 1000 })).toEqual({ valid: true });
  });

  it("accepts a valid pdf", () => {
    expect(
      validateReceiptFile({ type: "application/pdf", size: 1000 })
    ).toEqual({ valid: true });
  });
});
