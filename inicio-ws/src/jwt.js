// @ts-nocheck
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "inicio";

export function generateServerJWT() {
  return jwt.sign({ id: "server", role: "server" }, jwtSecret, {
    expiresIn: "1h",
  });
}
