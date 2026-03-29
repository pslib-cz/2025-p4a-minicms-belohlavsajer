import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { statusInputSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const { id } = await context.params;
    const articleId = Number.parseInt(id, 10);

    if (Number.isNaN(articleId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
        where: { id: articleId },
    });

    if (!article) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (article.authorId !== userIdResult) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = statusInputSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const isPublishing = parsed.data.status === "PUBLISHED";

    const updated = await prisma.article.update({
        where: { id: articleId },
        data: {
            status: parsed.data.status,
            publishedAt: isPublishing
                ? (article.publishedAt ?? new Date())
                : null,
        },
        include: {
            category: true,
            tags: true,
        },
    });

    return NextResponse.json(updated);
}
