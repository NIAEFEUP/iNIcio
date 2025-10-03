import jwt from "jsonwebtoken";

export async function generateJWT(
  id: string,
  role: "recruiter" | "admin" | "candidate",
) {
  const payload = {
    id,
    role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}
