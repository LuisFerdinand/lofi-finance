// utils/cloudinary.ts
// Signed browser uploads to Cloudinary. The API secret stays on the server — the
// browser first asks /api/cloudinary/sign for a one-time signature, then POSTs
// the file straight to Cloudinary. Configure with three SERVER-only env vars in
// .env.local (no NEXT_PUBLIC_ prefix):
//   CLOUDINARY_CLOUD_NAME=<your cloud name>
//   CLOUDINARY_API_KEY=<your api key>
//   CLOUDINARY_API_SECRET=<your api secret>

/** 10 MB — well under Cloudinary's free-tier limit, keeps the todos table light. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Whether Cloudinary env vars are set on the server (for showing a setup hint). */
export async function checkCloudinaryConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/cloudinary/sign", { method: "GET" });
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  } catch {
    return false;
  }
}

/**
 * Upload an image file to Cloudinary and return its hosted `secure_url`.
 * Throws when Cloudinary isn't configured, the file is too big / not an image,
 * or the request fails.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("that's not an image");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("image is larger than 10MB");
  }

  const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
  if (!signRes.ok) {
    throw new Error(
      signRes.status === 503 ? "Cloudinary is not configured" : "could not authorize upload"
    );
  }
  const { cloudName, apiKey, timestamp, folder, signature } =
    (await signRes.json()) as SignResponse;

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body }
  );

  if (!res.ok) {
    let message = "upload failed";
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("upload failed");
  return data.secure_url;
}
