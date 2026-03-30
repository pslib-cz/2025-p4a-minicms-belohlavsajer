import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sanitizeArticleHtml } from "@/lib/html";
import { parsePage, slugify, stripHtml } from "@/lib/utils";
import { articleInputSchema } from "@/lib/validation";
import { mapPrismaError, parseJsonBody, requireUserId } from "@/lib/api";

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
        const slug = await generateUniqueArticleSlug(parsed.data.title);

        try {
            const created = await prisma.article.create({
                data: {
                    title: parsed.data.title,
                    slug,
                    excerpt: parsed.data.excerpt || null,
                    content: sanitizedContent,
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
