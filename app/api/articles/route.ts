import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parsePage, slugify } from "@/lib/utils";
import { articleInputSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api";

const PAGE_SIZE = 10;

async function generateUniqueArticleSlug(title: string): Promise<string> {
    const baseSlug = slugify(title) || "article";
    let candidate = baseSlug;
    let index = 2;

    while (true) {
        const existing = await prisma.article.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing) {
            return candidate;
        }

        candidate = `${baseSlug}-${index}`;
        index += 1;
    }
}

export async function GET(request: NextRequest) {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const page = parsePage(request.nextUrl.searchParams.get("page"));
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    const where: Prisma.ArticleWhereInput = {
        authorId: userIdResult,
        ...(query
            ? {
                  OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { content: { contains: query, mode: "insensitive" } },
                  ],
              }
            : {}),
    };

    const [items, total] = await Promise.all([
        prisma.article.findMany({
            where,
            include: {
                category: true,
                tags: true,
            },
            orderBy: { updatedAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.article.count({ where }),
    ]);

    return NextResponse.json({
        items,
        page,
        total,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
}

export async function POST(request: NextRequest) {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
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

    const slug = await generateUniqueArticleSlug(parsed.data.title);

    const created = await prisma.article.create({
        data: {
            title: parsed.data.title,
            slug,
            excerpt: parsed.data.excerpt || null,
            content: parsed.data.content,
            authorId: userIdResult,
            categoryId: parsed.data.categoryId,
            tags: {
                connect: parsed.data.tagIds.map((id) => ({ id })),
            },
        },
        include: {
            category: true,
            tags: true,
        },
    });

    return NextResponse.json(created, { status: 201 });
}
