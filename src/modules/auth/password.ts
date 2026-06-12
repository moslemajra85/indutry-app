import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const iterations = 120_000;
const keyLength = 32;
const digest = "sha256";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, storedIterations, salt, hash] = storedHash.split("$");

  if (scheme !== "pbkdf2" || !storedIterations || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(
    password,
    salt,
    Number(storedIterations),
    keyLength,
    digest,
  ).toString("hex");

  const storedBuffer = Buffer.from(hash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");

  return (
    storedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(storedBuffer, candidateBuffer)
  );
}
