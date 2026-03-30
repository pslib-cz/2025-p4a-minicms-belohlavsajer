import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideCard } from "@/components/public/guide-card";
import { sanitizeArticleHtml } from "@/lib/html";
import { getGuideTypeMeta } from "@/lib/minecraft-portal";
import {
    buildExcerpt,
    getPublishedArticleBySlug,
    getRelatedPublishedArticles,
} from "@/lib/public-content";
import {
    buildGuideStructuredData,
    JsonLdScript,
} from "@/lib/seo/structured-data";
import { extractFirstImageSource, formatDate } from "@/lib/utils";

type Props = {
    params: Promise<{ slug: string }>;
};

function getGuideDescription(article: { content: string; excerpt: string | null }) {
    return article.excerpt || buildExcerpt(article.content);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);

    if (!article) {
        return {
            title: "Guide nenalezen",
            description: "Požadovaný guide nebyl nalezen.",
        };
    }

    const description = getGuideDescription(article);
    const heroImage =
        article.coverImage || extractFirstImageSource(article.content);

    return {
        title: article.title,
        description,
        alternates: {
            canonical: `/guides/${article.slug}`,
        },
        openGraph: {
            title: article.title,
            description,
            type: "article",
            url: `/guides/${article.slug}`,
            publishedTime: article.publishDate?.toISOString(),
            tags: article.tags.map((tag) => tag.name),
            images: heroImage ? [heroImage] : undefined,
        },
    };
}

export default async function GuideDetailPage({ params }: Props) {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    const typeMeta = getGuideTypeMeta(article.category?.name);
    const relatedArticles = await getRelatedPublishedArticles(article);
    const safeContent = sanitizeArticleHtml(article.content);
    const description = getGuideDescription(article);
    const heroImage =
        article.coverImage || extractFirstImageSource(article.content);

    return (
        <>
            <JsonLdScript
                id="guide-structured-data"
                data={buildGuideStructuredData({
                    article,
                    description,
                })}
            />
            <main className="guide-detail-page">
                <section
                    className={`guide-detail-hero guide-detail-hero-${typeMeta.key}`}
                >
                    {heroImage ? (
                        <div className="guide-detail-media">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={heroImage}
                                alt={article.title}
                                loading="eager"
                                className="guide-detail-image"
                            />
                        </div>
                    ) : null}

                    <div className="container guide-detail-shell">
                        <div className="guide-detail-copy">
                            <p className="portal-kicker mb-2">
                                {typeMeta.eyebrow}
                            </p>
                            <span className="guide-type-pill mb-3">
                                {typeMeta.label}
                            </span>
                            <h1 className="display-4 fw-semibold ui-title mb-3">
                                {article.title}
                            </h1>
                            <p className="guide-detail-summary">
                                {article.excerpt || buildExcerpt(safeContent, 220)}
                            </p>
                            <div className="guide-detail-meta">
                                <span>
                                    Publikováno: {formatDate(article.publishDate)}
                                </span>
                                <span>Autor: {article.author.username}</span>
                                {article.category ? (
                                    <span>Typ: {article.category.name}</span>
                                ) : null}
                            </div>
                            <div className="guide-tag-row mt-3">
                                {article.tags.map((tag) => (
                                    <span className="guide-tag-pill" key={tag.id}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="container ui-page">
                    <article className="guide-detail-content ui-surface">
                        <div
                            className="article-content"
                            dangerouslySetInnerHTML={{ __html: safeContent }}
                        />
                    </article>
                </section>

                {relatedArticles.length > 0 ? (
                    <section className="container ui-page pt-0">
                        <div className="portal-section-heading">
                            <div>
                                <p className="portal-kicker mb-2">
                                    Related guides
                                </p>
                                <h2 className="ui-title h3 mb-0">
                                    Další entry ze stejného okruhu
                                </h2>
                            </div>
                        </div>
                        <div className="guide-grid guide-grid-compact">
                            {relatedArticles.map((related) => (
                                <GuideCard
                                    article={related}
                                    key={related.id}
                                    compact
                                />
                            ))}
                        </div>
                    </section>
                ) : null}
            </main>
        </>
    );
}
