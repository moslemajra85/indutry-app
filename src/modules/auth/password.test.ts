import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a password against its stored hash", () => {
    const storedHash = hashPassword("IndustryOps123!", "fixed-test-salt");

    expect(verifyPassword("IndustryOps123!", storedHash)).toBe(true);
    expect(verifyPassword("wrong-password", storedHash)).toBe(false);
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyPassword("IndustryOps123!", "not-a-valid-hash")).toBe(false);
  });
});
