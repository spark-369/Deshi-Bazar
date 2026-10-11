import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const folder = request.nextUrl.searchParams.get("folder") || "categories";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split('.').pop();
    const filename = `${folder}-${uuidv4()}.${extension}`;
    const folderPath = path.join(process.cwd(), "public", "uploads", folder);
    
    await mkdir(folderPath, { recursive: true });
    
    const filepath = path.join(folderPath, filename);
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${folder}/${filename}`;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
