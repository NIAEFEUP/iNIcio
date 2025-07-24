import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";

export async function POST(req: NextApiRequest) {
  console.log(req);


  return NextResponse.json({ "hello": "world" });
}
