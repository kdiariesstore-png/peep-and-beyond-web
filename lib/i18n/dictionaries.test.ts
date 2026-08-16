import { describe, expect, it } from "vitest";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

describe("i18n dictionaries", () => {
  it("have exactly the same set of keys in Arabic and English", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("have no empty string values in either dictionary", () => {
    const allValues = [...Object.values(ar), ...Object.values(en)];
    expect(allValues.every((value) => value.trim().length > 0)).toBe(true);
  });
});
