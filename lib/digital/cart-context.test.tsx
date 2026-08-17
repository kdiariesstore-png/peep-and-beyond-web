import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DigitalCartProvider, useDigitalCart } from "./cart-context";

function TestHarness() {
  const { items, addOrReplaceItem, removeItem } = useDigitalCart();
  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <div data-testid="lang">{items[0]?.language ?? ""}</div>
      <button
        onClick={() => addOrReplaceItem({ id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 })}
      >
        add-ar
      </button>
      <button
        onClick={() => addOrReplaceItem({ id: "sleep-bedtime", language: "en", unitPriceBhd: 2.7 })}
      >
        add-en
      </button>
      <button onClick={() => removeItem("sleep-bedtime")}>remove</button>
    </div>
  );
}

describe("DigitalCartProvider / useDigitalCart", () => {
  it("adds an item, replaces it in place when the same id is added again, and removes it", () => {
    render(
      <DigitalCartProvider>
        <TestHarness />
      </DigitalCartProvider>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");

    fireEvent.click(screen.getByText("add-ar"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("lang").textContent).toBe("ar");

    fireEvent.click(screen.getByText("add-en"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("lang").textContent).toBe("en");

    fireEvent.click(screen.getByText("remove"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
