import { NextResponse } from "next/server";

export async function GET() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  return NextResponse.json({
    present: !!dsn,
    prefix: dsn ? dsn.slice(0, 20) : null,
  });
}
