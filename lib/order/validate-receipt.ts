export const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

export interface ReceiptValidationResult {
  valid: boolean;
  error?: "receipt_required" | "receipt_invalid_type" | "receipt_too_large";
}

export function validateReceiptFile(
  file: { type: string; size: number } | null
): ReceiptValidationResult {
  if (!file) return { valid: false, error: "receipt_required" };
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { valid: false, error: "receipt_invalid_type" };
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { valid: false, error: "receipt_too_large" };
  }
  return { valid: true };
}
