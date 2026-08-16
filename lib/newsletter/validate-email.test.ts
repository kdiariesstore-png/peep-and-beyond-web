import { describe, expect, it } from "vitest";
import { isValidEmail } from "./validate-email";

describe("isValidEmail", () => {
  it("accepts a normal email address", () => {
    expect(isValidEmail("sara@example.com")).toBe(true);
  });

  it("rejects a string with no @", () => {
    expect(isValidEmail("sara.example.com")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects an email with no domain", () => {
    expect(isValidEmail("sara@")).toBe(false);
  });
});
