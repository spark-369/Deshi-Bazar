import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Vercel's filesystem is read-only except /tmp, and public/uploads is not
// persisted between invocations. The neutral placeholder below is stored in
// the DB so the rest of the upload flow (products, avatars, categories) keeps
// working; set UPLOAD_BASE_URL to an external bucket (S3, Cloudinary, ...)
// that exposes an POST endpoint returning {"url": "..."} to fully restore
// file uploads in production.
const UPLOAD_PLACEHOLDER = "/uploads/placeholder.svg";

function sanitizeFolder(folder) {
  return String(folder || "categories").replace(/[^a-zA-Z0-9_-]/g, "");
}

async function uploadToExternalBucket(buffer, filename, contentType) {
  const baseUrl = process.env.UPLOAD_BASE_URL;
  if (!baseUrl) return null;

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "x-filename": filename,
    },
    body: buffer,
  });
  if (!response.ok) {
    throw new Error(`External upload failed with status ${response.status}`);
  }
  const data = await response.json();
  return typeof data?.url === "string" ? data.url : null;
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const folder = sanitizeFolder(request.nextUrl.searchParams.get("folder"));

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = (file.name.split(".").pop() || "bin").replace(
      /[^a-zA-Z0-9]/g,
      "",
    );
    const filename = `${folder}-${uuidv4()}.${extension}`;

    // Prefer an external upload endpoint when configured.
    try {
      const externalUrl = await uploadToExternalBucket(
        buffer,
        filename,
        file.type,
      );
      if (externalUrl) {
        return NextResponse.json({ url: externalUrl });
      }
    } catch (uploadError) {
      console.error("External upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 },
      );
    }

    if (process.env.NODE_ENV === "production") {
      // Ephemeral filesystem: write to /tmp (works locally / self-hosted),
      // but never return a URL that Vercel would serve, since the file is
      // lost on the next invocation. Return the neutral placeholder instead.
      const folderPath = path.join("/tmp", "uploads", folder);
      await mkdir(folderPath, { recursive: true });
      await writeFile(path.join(folderPath, filename), buffer);
      return NextResponse.json({ url: UPLOAD_PLACEHOLDER });
    }

    const folderPath = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(folderPath, { recursive: true });
    await writeFile(path.join(folderPath, filename), buffer);

    return NextResponse.json({ url: `/uploads/${folder}/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
