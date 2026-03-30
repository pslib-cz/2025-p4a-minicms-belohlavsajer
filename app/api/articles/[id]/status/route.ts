import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { statusInputSchema } from "@/lib/validation";
import { mapPrismaError, parseJsonBody, requireUserId } from "@/lib/api";

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

    const bodyResult = await parseJsonBody<unknown>(request);

    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    const parsed = statusInputSchema.safeParse(bodyResult.data);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const isPublishing = parsed.data.status === "PUBLISHED";

    try {
        const updated = await prisma.article.update({
            where: { id: articleId },
            data: {
                status: parsed.data.status,
                publishDate: isPublishing
                    ? (article.publishDate ?? new Date())
                    : null,
            },
            include: {
                category: true,
                tags: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        const prismaResponse = mapPrismaError(error);

        if (prismaResponse) {
            return prismaResponse;
        }

        throw error;
    }
}
