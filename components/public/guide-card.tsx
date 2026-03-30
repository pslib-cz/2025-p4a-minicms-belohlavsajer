import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { getGuideTypeMeta } from "@/lib/minecraft-portal";
import { buildExcerpt, PublicGuide } from "@/lib/public-content";
import { extractFirstImageSource, formatDate } from "@/lib/utils";

type GuideCardProps = {
    article: PublicGuide;
    compact?: boolean;
};

export function GuideCard({ article, compact = false }: GuideCardProps) {
    const typeMeta = getGuideTypeMeta(article.category?.name);
    const description = article.excerpt || buildExcerpt(article.content, 132);
    const previewImage =
        article.coverImage || extractFirstImageSource(article.content);

    return (
        <article
            className={`guide-card guide-card-${typeMeta.key} ${
                compact ? "guide-card-compact" : ""
            }`}
        >
            <div className="guide-card-media">
                {previewImage ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImage}
                            alt={article.title}
                            loading="lazy"
                            className="guide-card-image"
                        />
                    </>
                ) : (
                    <div className="guide-card-fallback">
                        <span>{typeMeta.label}</span>
                    </div>
                )}
            </div>

            <div className="guide-card-body">
                <div className="guide-meta-row">
                    <span className="guide-type-pill">{typeMeta.label}</span>
                    <span className="guide-date">
                        {formatDate(article.publishDate)}
                    </span>
                </div>

                <h2 className={compact ? "h5" : "h4"}>{article.title}</h2>
                <p className="guide-card-copy">{description}</p>

                <div className="guide-tag-row">
                    {article.tags.slice(0, 3).map((tag) => (
                        <span className="guide-tag-pill" key={tag.id}>
                            {tag.name}
                        </span>
                    ))}
                </div>

                <div className="guide-card-footer">
                    <span className="guide-author">Autor: {article.author.username}</span>
                    <AnalyticsLink
                        href={`/guides/${article.slug}`}
                        className="guide-card-link"
                        selectContent={{
                            contentType: "guide",
                            contentId: article.slug,
                            contentName: article.title,
                        }}
                    >
                        {typeMeta.ctaLabel}
                    </AnalyticsLink>
                </div>
            </div>
        </article>
    );
}
