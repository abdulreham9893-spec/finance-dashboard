import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    authenticated: !!session?.user,
    user: session?.user ?? null,
    secretSet: !!process.env.AUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
