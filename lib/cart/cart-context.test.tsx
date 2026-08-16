import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "./cart-context";

function TestHarness() {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <div data-testid="qty">{items[0]?.quantity ?? 0}</div>
      <button
        onClick={() =>
          addItem({
            id: "item-1",
            customization: {
              storyLanguage: "ar",
              cardLanguage: "ar",
              cupColor: "pink",
              childName: "سارة",
              giftCard: false,
            },
            unitPriceBhd: 21.9,
            quantity: 1,
          })
        }
      >
        add
      </button>
      <button onClick={() => updateQuantity("item-1", 3)}>bump</button>
      <button onClick={() => removeItem("item-1")}>remove</button>
    </div>
  );
}

describe("CartProvider / useCart", () => {
  it("adds, updates quantity, and removes an item", () => {
    render(
      <CartProvider>
        <TestHarness />
      </CartProvider>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");

    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("count").textContent).toBe("1");

    fireEvent.click(screen.getByText("bump"));
    expect(screen.getByTestId("qty").textContent).toBe("3");

    fireEvent.click(screen.getByText("remove"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
