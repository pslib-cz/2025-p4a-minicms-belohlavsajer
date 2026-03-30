import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/api";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const allowedImageTypes = new Map<string, string>([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["image/avif", "avif"],
]);

function buildFileName(file: File, extension: string) {
    const originalBaseName = file.name.replace(/\.[^.]+$/, "");
    const safeBaseName = slugify(originalBaseName) || "guide-image";
    return `${safeBaseName}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}

export async function POST(request: Request) {
    const userIdResult = await requireUserId();

    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    let formData: FormData;

    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json(
            { error: "Invalid multipart form data" },
            { status: 400 },
        );
    }

    const fileEntry = formData.get("file");
    const altEntry = formData.get("alt");

    if (!(fileEntry instanceof File)) {
        return NextResponse.json(
            { error: "Image file is required" },
            { status: 400 },
        );
    }

    if (fileEntry.size <= 0) {
        return NextResponse.json(
            { error: "Uploaded file is empty" },
            { status: 400 },
        );
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
            { error: "Image exceeds 5 MB limit" },
            { status: 400 },
        );
    }

    const extension = allowedImageTypes.get(fileEntry.type);

    if (!extension) {
        return NextResponse.json(
            {
                error: "Unsupported image type. Use JPG, PNG, WebP, GIF, or AVIF.",
            },
            { status: 400 },
        );
    }

    const fileName = buildFileName(fileEntry, extension);
    const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "guides",
    );
    const targetPath = path.join(uploadDirectory, fileName);
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());

    try {
        await mkdir(uploadDirectory, { recursive: true });
        await writeFile(targetPath, fileBuffer);
    } catch {
        return NextResponse.json(
            { error: "Image upload failed on server filesystem" },
            { status: 500 },
        );
    }

    const alt =
        typeof altEntry === "string" && altEntry.trim().length > 0
            ? altEntry.trim()
            : null;

    return NextResponse.json({
        src: `/uploads/guides/${fileName}`,
        alt,
        mimeType: fileEntry.type,
        size: fileEntry.size,
    });
}
