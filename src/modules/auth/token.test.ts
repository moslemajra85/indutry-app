import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { env } from "../../shared/config/env";
import type { AuthUser } from "./auth.types";
import { createAuthToken, verifyAuthToken } from "./token";

const testUser: AuthUser = {
  id: "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
  name: "Factory Supervisor",
  email: "supervisor@industryops.local",
  role: "supervisor",
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function signedToken(payload: object) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = base64Url(createHmac("sha256", env.authTokenSecret).update(encodedPayload).digest());
  return `${encodedPayload}.${signature}`;
}

describe("auth token", () => {
  it("round-trips an authenticated user", () => {
    const token = createAuthToken(testUser);

    expect(verifyAuthToken(token)).toEqual(testUser);
  });

  it("rejects tampered tokens", () => {
    const token = createAuthToken(testUser);
    const [payload, signature] = token.split(".");
    const tamperedToken = `${payload}.x${signature.slice(1)}`;

    expect(verifyAuthToken(tamperedToken)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = signedToken({
      ...testUser,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    expect(verifyAuthToken(token)).toBeNull();
  });
});
