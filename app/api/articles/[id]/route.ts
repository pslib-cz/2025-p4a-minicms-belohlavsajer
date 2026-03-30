import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { sanitizeArticleHtml } from "@/lib/html";
import { prisma } from "@/lib/prisma";
import { slugify, stripHtml } from "@/lib/utils";
import { articleInputSchema } from "@/lib/validation";
import { mapPrismaError, parseJsonBody, requireUserId } from "@/lib/api";

async function generateUniqueArticleSlug(
    title: string,
    excludeArticleId: number,
): Promise<string> {
    const baseSlug = slugify(title) || "article";
    let candidate = baseSlug;
    let index = 2;

    while (true) {
        const existing = await prisma.article.findFirst({
            where: {
                slug: candidate,
                NOT: { id: excludeArticleId },
            },
            select: { id: true },
        });

        if (!existing) {
            return candidate;
        }

        candidate = `${baseSlug}-${index}`;
        index += 1;
    }
}

async function ensureOwnership(articleId: number, userId: number) {
    const article = await prisma.article.findUnique({
        where: { id: articleId },
    });

    if (!article) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (article.authorId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return article;
}

function isSlugConflict(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        return false;
    }

    if (error.code !== "P2002") {
        return false;
    }

    const target = error.meta?.target;

    if (!Array.isArray(target)) {
        return false;
    }

    return target.includes("slug");
}

export async function GET(
    _request: NextRequest,
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

    const ownership = await ensureOwnership(articleId, userIdResult);
    if (ownership instanceof NextResponse) {
        return ownership;
    }

    const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
            category: true,
            tags: true,
        },
    });

    return NextResponse.json(article);
}

export async function PUT(
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

    const ownership = await ensureOwnership(articleId, userIdResult);
    if (ownership instanceof NextResponse) {
        return ownership;
    }

    const bodyResult = await parseJsonBody<unknown>(request);

    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    if (
        typeof bodyResult.data !== "object" ||
        bodyResult.data === null ||
        Array.isArray(bodyResult.data)
    ) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const body = bodyResult.data as Record<string, unknown>;
    const parsed = articleInputSchema.safeParse({
        ...body,
        categoryId: body.categoryId ?? null,
        tagIds: body.tagIds ?? [],
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const sanitizedContent = sanitizeArticleHtml(parsed.data.content);

    if (stripHtml(sanitizedContent).length < 20) {
        return NextResponse.json(
            {
                error: "Validation failed",
                details: {
                    fieldErrors: {
                        content: [
                            "Content must include at least 20 characters.",
                        ],
                    },
                },
            },
            { status: 400 },
        );
    }

    const maxSlugAttempts = 5;

    for (let attempt = 0; attempt < maxSlugAttempts; attempt += 1) {
        const slug = await generateUniqueArticleSlug(
            parsed.data.title,
            articleId,
        );

        try {
            const updated = await prisma.article.update({
                where: { id: articleId },
                data: {
                    title: parsed.data.title,
                    slug,
                    excerpt: parsed.data.excerpt || null,
                    content: sanitizedContent,
                    categoryId: parsed.data.categoryId,
                    tags: {
                        set: parsed.data.tagIds.map((tagId) => ({ id: tagId })),
                    },
                },
                include: {
                    category: true,
                    tags: true,
                },
            });

            return NextResponse.json(updated);
        } catch (error) {
            if (isSlugConflict(error)) {
                continue;
            }

            const prismaResponse = mapPrismaError(error);

            if (prismaResponse) {
                return prismaResponse;
            }

            throw error;
        }
    }

    return NextResponse.json(
        { error: "Could not generate unique slug. Please retry." },
        { status: 409 },
    );
}

export async function DELETE(
    _request: NextRequest,
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

    const ownership = await ensureOwnership(articleId, userIdResult);
    if (ownership instanceof NextResponse) {
        return ownership;
    }

    try {
        await prisma.article.delete({ where: { id: articleId } });
    } catch (error) {
        const prismaResponse = mapPrismaError(error);

        if (prismaResponse) {
            return prismaResponse;
        }

        throw error;
    }

    return NextResponse.json({ success: true });
}
