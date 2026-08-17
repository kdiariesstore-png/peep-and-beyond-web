import { describe, expect, it, beforeEach } from "vitest";
import {
  serializeDigitalCart,
  deserializeDigitalCart,
  loadDigitalCart,
  saveDigitalCart,
} from "./cart-storage";
import type { DigitalCartItem } from "./types";

const item: DigitalCartItem = { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 };

beforeEach(() => {
  window.localStorage.clear();
});

describe("serializeDigitalCart / deserializeDigitalCart", () => {
  it("round-trips a list of items", () => {
    expect(deserializeDigitalCart(serializeDigitalCart([item]))).toEqual([item]);
  });

  it("returns an empty array for null, garbage, or non-array JSON", () => {
    expect(deserializeDigitalCart(null)).toEqual([]);
    expect(deserializeDigitalCart("not json")).toEqual([]);
    expect(deserializeDigitalCart(JSON.stringify({ not: "an array" }))).toEqual([]);
  });

  it("drops entries with an unknown id, bad language, or non-numeric price", () => {
    const bad = [
      { id: "not-a-real-product", language: "ar", unitPriceBhd: 2.7 },
      { id: "sleep-bedtime", language: "fr", unitPriceBhd: 2.7 },
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: "2.7" },
    ];
    expect(deserializeDigitalCart(JSON.stringify(bad))).toEqual([]);
  });
});

describe("loadDigitalCart / saveDigitalCart", () => {
  it("persists and reloads items via localStorage", () => {
    saveDigitalCart([item]);
    expect(loadDigitalCart()).toEqual([item]);
  });
});
