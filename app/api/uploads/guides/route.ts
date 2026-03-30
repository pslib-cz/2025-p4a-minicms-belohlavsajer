import { put } from "@vercel/blob";
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

function isRunningOnVercel() {
    return process.env.VERCEL === "1";
}

function getBlobToken() {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    return token ? token : null;
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
    const blobToken = getBlobToken();
    const shouldUseBlobStorage = isRunningOnVercel() || Boolean(blobToken);
    let imageSource: string;

    if (shouldUseBlobStorage) {
        if (!blobToken) {
            return NextResponse.json(
                {
                    error: "Vercel Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in project environment variables.",
                },
                { status: 503 },
            );
        }

        try {
            const blob = await put(`guides/${fileName}`, fileEntry, {
                access: "public",
                addRandomSuffix: false,
                contentType: fileEntry.type,
                token: blobToken,
            });

            imageSource = blob.url;
        } catch {
            return NextResponse.json(
                { error: "Image upload failed in Vercel Blob storage" },
                { status: 500 },
            );
        }
    } else {
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

        imageSource = `/uploads/guides/${fileName}`;
    }

    const alt =
        typeof altEntry === "string" && altEntry.trim().length > 0
            ? altEntry.trim()
            : null;

    return NextResponse.json({
        src: imageSource,
        alt,
        mimeType: fileEntry.type,
        size: fileEntry.size,
    });
}
