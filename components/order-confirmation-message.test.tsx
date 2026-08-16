import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderConfirmationMessage } from "./order-confirmation-message";

const RETRY_TEXT = "حاول مرة أخرى";

describe("OrderConfirmationMessage", () => {
  it("offers a retry link on a retryable failure", () => {
    render(<OrderConfirmationMessage success={false} title="لم يتم تأكيد الدفع" body="" />);

    const retry = screen.getByText(RETRY_TEXT);
    expect(retry).toBeTruthy();
    expect(retry.getAttribute("href")).toBe("/checkout");
  });

  // The point of the differentiated failure copy is telling a possibly-already-charged
  // customer NOT to pay again. A retry link on that page would contradict it.
  it("hides the retry link when the failure is not retryable", () => {
    render(
      <OrderConfirmationMessage
        success={false}
        title="تعذر التحقق من حالة الدفع"
        body="لا تدفع مرة أخرى"
        allowRetry={false}
      />
    );

    expect(screen.queryByText(RETRY_TEXT)).toBeNull();
  });

  it("never shows a retry link on success, even with the default allowRetry", () => {
    render(<OrderConfirmationMessage success={true} title="تم تأكيد طلبك بنجاح!" body="" />);

    expect(screen.queryByText(RETRY_TEXT)).toBeNull();
  });
});
