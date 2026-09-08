// app/api/cloudinary/sign/route.ts
// Signs a Cloudinary upload request server-side so the API secret never reaches
// the browser. The client sends the returned fields (plus the file) straight to
// Cloudinary's upload endpoint.
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = "lofi-finance/tasks";

const configured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

// Lightweight probe so the UI can show a "not configured" hint without exposing
// any credentials.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ configured });
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!configured) {
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signature: every signed param except file / api_key / cloud_name,
  // sorted alphabetically, joined with &, then api_secret appended, then SHA-1.
  const toSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(toSign + API_SECRET)
    .digest("hex");

  return NextResponse.json({
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: FOLDER,
    signature,
  });
}
