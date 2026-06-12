import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../shared/config/env";
import type { AuthUser, UserRole } from "./auth.types";

interface TokenPayload extends AuthUser {
  exp: number;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(payload: string) {
  return base64Url(createHmac("sha256", env.authTokenSecret).update(payload).digest());
}

export function createAuthToken(user: AuthUser) {
  const payload: TokenPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAuthToken(token: string): AuthUser | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as TokenPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}
