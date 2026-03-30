import { Prisma } from "@prisma/client";

import {
    isPrismaConnectionError,
    prisma,
    withPrismaRetry,
} from "@/lib/prisma";
import { parsePage, stripHtml } from "@/lib/utils";

export const publicGuideInclude = Prisma.validator<Prisma.ArticleInclude>()({
    category: true,
    tags: true,
    author: true,
});

export type PublicGuide = Prisma.ArticleGetPayload<{
    include: typeof publicGuideInclude;
}>;

const PAGE_SIZE = 6;

export type PublicListParams = {
    q?: string;
    tag?: string;
    category?: string;
    page?: string;
};

const publishedOrderBy: Prisma.ArticleOrderByWithRelationInput[] = [
    { publishDate: "desc" },
    { updatedAt: "desc" },
];

async function withPublicContentFallback<T>(
    label: string,
    operation: () => Promise<T>,
    fallback: T,
) {
    try {
        return await withPrismaRetry(operation, { label });
    } catch (error) {
        if (!isPrismaConnectionError(error)) {
            throw error;
        }

        console.error(
            `${label} failed because the database is temporarily unreachable. Falling back to empty public content.`,
            error,
        );

        return fallback;
    }
}

export async function getPublicFilters() {
    return withPublicContentFallback(
        "getPublicFilters",
        async () => {
            const [categories, tags] = await Promise.all([
                prisma.category.findMany({ orderBy: { name: "asc" } }),
                prisma.tag.findMany({ orderBy: { name: "asc" } }),
            ]);

            return { categories, tags };
        },
        { categories: [], tags: [] },
    );
}

export async function getHomepageSections() {
    return withPublicContentFallback(
        "getHomepageSections",
        async () => {
            const [featuredGuides, serverPicks, starterGuides, buildSpotlights] =
                await Promise.all([
                    prisma.article.findMany({
                        where: { status: "PUBLISHED" },
                        include: publicGuideInclude,
                        orderBy: publishedOrderBy,
                        take: 3,
                    }),
                    prisma.article.findMany({
                        where: {
                            status: "PUBLISHED",
                            category: { name: "Server" },
                        },
                        include: publicGuideInclude,
                        orderBy: publishedOrderBy,
                        take: 3,
                    }),
                    prisma.article.findMany({
                        where: {
                            status: "PUBLISHED",
                            OR: [
                                { category: { name: "Tutorial" } },
                                { tags: { some: { name: "Beginner" } } },
                            ],
                        },
                        include: publicGuideInclude,
                        orderBy: publishedOrderBy,
                        take: 3,
                    }),
                    prisma.article.findMany({
                        where: {
                            status: "PUBLISHED",
                            category: {
                                name: {
                                    in: ["Build Guide", "Farm Guide"],
                                },
                            },
                        },
                        include: publicGuideInclude,
                        orderBy: publishedOrderBy,
                        take: 3,
                    }),
                ]);

            return {
                featuredGuides,
                serverPicks,
                starterGuides,
                buildSpotlights,
            };
        },
        {
            featuredGuides: [],
            serverPicks: [],
            starterGuides: [],
            buildSpotlights: [],
        },
    );
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
                      { title: { contains: query } },
                      { content: { contains: query } },
                  ],
              }
            : {}),
        ...(tag ? { tags: { some: { name: tag } } } : {}),
        ...(category ? { category: { name: category } } : {}),
    };

    return withPublicContentFallback(
        "getPublicArticles",
        async () => {
            const [items, total] = await Promise.all([
                prisma.article.findMany({
                    where,
                    include: publicGuideInclude,
                    orderBy: publishedOrderBy,
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
        },
        {
            items: [],
            page,
            pageSize: PAGE_SIZE,
            total: 0,
            totalPages: 1,
        },
    );
}

export async function getPublishedArticleBySlug(slug: string) {
    return withPublicContentFallback(
        "getPublishedArticleBySlug",
        () =>
            prisma.article.findFirst({
                where: {
                    slug,
                    status: "PUBLISHED",
                },
                include: publicGuideInclude,
            }),
        null,
    );
}

export async function getRelatedPublishedArticles(article: PublicGuide) {
    const relatedClauses: Prisma.ArticleWhereInput[] = [];

    if (article.categoryId) {
        relatedClauses.push({ categoryId: article.categoryId });
    }

    if (article.tags.length) {
        relatedClauses.push({
            tags: {
                some: {
                    id: { in: article.tags.map((tag) => tag.id) },
                },
            },
        });
    }

    return withPublicContentFallback(
        "getRelatedPublishedArticles",
        () =>
            prisma.article.findMany({
                where: {
                    status: "PUBLISHED",
                    NOT: { id: article.id },
                    ...(relatedClauses.length ? { OR: relatedClauses } : {}),
                },
                include: publicGuideInclude,
                orderBy: publishedOrderBy,
                take: 3,
            }),
        [],
    );
}

export function buildExcerpt(htmlContent: string, maxLength = 150) {
    const plain = stripHtml(htmlContent);
    if (plain.length <= maxLength) {
        return plain;
    }

    return `${plain.slice(0, maxLength - 1)}...`;
}
