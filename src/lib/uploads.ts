import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-disk storage for uploaded photos. Fine for local dev and a
// single always-on server; won't survive a serverless deploy with an
// ephemeral filesystem (e.g. Vercel) — swap this for real object storage
// (Supabase Storage, S3, etc.) before deploying there. Every other part
// of the app only deals in the `url` this returns, so that swap only
// touches this file.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads/";
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
};

export async function saveUploadedPhoto(file: File): Promise<string> {
  if (!(file.type in ALLOWED_TYPES)) {
    throw new Error(`Unsupported image type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name || "Photo"} is larger than 8MB`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = ALLOWED_TYPES[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `${PUBLIC_PREFIX}${filename}`;
}

/** Deletes a previously uploaded photo from disk. No-ops for anything that isn't one of our own uploads (e.g. a pasted external URL). */
export async function deleteUploadedPhoto(url: string): Promise<void> {
  if (!/^\/uploads\/[\w-]+\.\w+$/.test(url)) return;

  const filename = url.slice(PUBLIC_PREFIX.length);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // Already gone — fine.
  }
}
