import jwt from "jsonwebtoken";

export type Role = "recruiter" | "admin" | "candidate";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export async function generateJWT(
  id: string,
  role: Role,
  rooms: string[] = [],
) {
  const payload = {
    id,
    role,
    rooms,
  };

  return jwt.sign(payload, getSecret(), {
    expiresIn: "1d",
  });
}
