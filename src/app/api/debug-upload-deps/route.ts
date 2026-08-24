import { NextResponse } from "next/server";

function errInfo(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  return String(err);
}

export async function GET() {
  const results: Record<string, string> = {};

  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "red" },
    })
      .jpeg()
      .toBuffer();
    results.sharp = `ok (${buf.length} bytes)`;
  } catch (err) {
    results.sharp = `FAIL: ${errInfo(err)}`;
  }

  try {
    const { RekognitionClient } = await import("@aws-sdk/client-rekognition");
    new RekognitionClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    results.rekognitionClient = "ok";
  } catch (err) {
    results.rekognitionClient = `FAIL: ${errInfo(err)}`;
  }

  try {
    await import("@sentry/nextjs");
    results.sentryImport = "ok";
  } catch (err) {
    results.sentryImport = `FAIL: ${errInfo(err)}`;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    createAdminClient();
    results.supabaseAdmin = "ok";
  } catch (err) {
    results.supabaseAdmin = `FAIL: ${errInfo(err)}`;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    await createClient();
    results.supabaseServer = "ok";
  } catch (err) {
    results.supabaseServer = `FAIL: ${errInfo(err)}`;
  }

  try {
    await import("@/lib/watermark");
    results.watermarkImport = "ok";
  } catch (err) {
    results.watermarkImport = `FAIL: ${errInfo(err)}`;
  }

  try {
    await import("@/lib/realtime");
    results.realtimeImport = "ok";
  } catch (err) {
    results.realtimeImport = `FAIL: ${errInfo(err)}`;
  }

  return NextResponse.json({ node: process.version, results });
}
