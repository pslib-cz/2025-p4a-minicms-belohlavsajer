import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    let articles: Array<{ slug: string; updatedAt: Date }> = [];

    try {
        articles = await prisma.article.findMany({
            where: { status: "PUBLISHED" },
            select: {
                slug: true,
                updatedAt: true,
            },
        });
    } catch {
        // Keep sitemap functional before local migrations are applied.
    }

    return [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        ...articles.map((article) => ({
            url: `${baseUrl}/articles/${article.slug}`,
            lastModified: article.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        })),
    ];
}
