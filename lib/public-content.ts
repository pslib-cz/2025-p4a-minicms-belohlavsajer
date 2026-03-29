import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parsePage, stripHtml } from "@/lib/utils";

const PAGE_SIZE = 6;

type PublicListParams = {
    q?: string;
    tag?: string;
    category?: string;
    page?: string;
};

export async function getPublicFilters() {
    const [categories, tags] = await Promise.all([
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ]);

    return { categories, tags };
}

export async function getPublicArticles(params: PublicListParams) {
    const page = parsePage(params.page);
    const query = params.q?.trim() ?? "";
    const tag = params.tag?.trim() ?? "";
    const category = params.category?.trim() ?? "";

    const where: Prisma.ArticleWhereInput = {
        status: "PUBLISHED",
        ...(query
            ? {
                  OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { content: { contains: query, mode: "insensitive" } },
                  ],
              }
            : {}),
        ...(tag ? { tags: { some: { name: tag } } } : {}),
        ...(category ? { category: { name: category } } : {}),
    };

    const [items, total] = await Promise.all([
        prisma.article.findMany({
            where,
            include: {
                category: true,
                tags: true,
                author: true,
            },
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.article.count({ where }),
    ]);

    return {
        items,
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
}

export async function getPublishedArticleBySlug(slug: string) {
    return prisma.article.findFirst({
        where: {
            slug,
            status: "PUBLISHED",
        },
        include: {
            category: true,
            tags: true,
            author: true,
        },
    });
}

export function buildExcerpt(htmlContent: string, maxLength = 150) {
    const plain = stripHtml(htmlContent);
    if (plain.length <= maxLength) {
        return plain;
    }

    return `${plain.slice(0, maxLength - 1)}...`;
}
