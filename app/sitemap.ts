import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

const GUIDE_CATALOG_PAGE_SIZE = 6;

type SitemapArticle = {
    slug: string;
    updatedAt: Date;
    publishDate: Date | null;
    coverImage: string | null;
};

function getArticleLastModified(article: SitemapArticle) {
    if (article.publishDate && article.publishDate > article.updatedAt) {
        return article.publishDate;
    }

    return article.updatedAt;
}

function buildGuideListingPages(
    baseUrl: string,
    totalPages: number,
    lastModified: Date,
): MetadataRoute.Sitemap {
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => {
        const page = index + 2;

        return {
            url: `${baseUrl}/guides?page=${page}`,
            lastModified,
            changeFrequency: "weekly",
            priority: 0.65,
        };
    });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getSiteUrl();

    let articles: SitemapArticle[] = [];
    let publishedCount = 0;

    try {
        [articles, publishedCount] = await Promise.all([
            prisma.article.findMany({
                where: { status: "PUBLISHED" },
                select: {
                    slug: true,
                    updatedAt: true,
                    publishDate: true,
                    coverImage: true,
                },
                orderBy: [{ publishDate: "desc" }, { updatedAt: "desc" }],
            }),
            prisma.article.count({
                where: { status: "PUBLISHED" },
            }),
        ]);
    } catch {
        // Keep sitemap functional before local migrations are applied.
    }

    const latestArticleDate =
        articles.length > 0
            ? articles.reduce((latest, article) => {
                  const articleDate = getArticleLastModified(article);
                  return articleDate > latest ? articleDate : latest;
              }, getArticleLastModified(articles[0]))
            : new Date();

    const totalPages = Math.max(
        1,
        Math.ceil(publishedCount / GUIDE_CATALOG_PAGE_SIZE),
    );

    return [
        {
            url: `${baseUrl}/`,
            lastModified: latestArticleDate,
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/guides`,
            lastModified: latestArticleDate,
            changeFrequency: "daily",
            priority: 0.9,
        },
        ...buildGuideListingPages(baseUrl, totalPages, latestArticleDate),
        ...articles.map((article) => ({
            url: `${baseUrl}/guides/${article.slug}`,
            lastModified: getArticleLastModified(article),
            changeFrequency: "monthly" as const,
            priority: 0.8,
            images: article.coverImage
                ? [toAbsoluteUrl(article.coverImage, baseUrl)]
                : undefined,
        })),
    ];
}
