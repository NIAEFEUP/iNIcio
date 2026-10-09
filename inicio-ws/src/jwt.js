// @ts-nocheck
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

export function generateServerJWT() {
  return jwt.sign({ id: "server", role: "server" }, jwtSecret, {
    expiresIn: "1h",
  });
}
