import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { articleInputSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api";

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

    const body = await request.json();
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

    const slug = await generateUniqueArticleSlug(parsed.data.title, articleId);

    const updated = await prisma.article.update({
        where: { id: articleId },
        data: {
            title: parsed.data.title,
            slug,
            excerpt: parsed.data.excerpt || null,
            content: parsed.data.content,
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

    await prisma.article.delete({ where: { id: articleId } });

    return NextResponse.json({ success: true });
}
