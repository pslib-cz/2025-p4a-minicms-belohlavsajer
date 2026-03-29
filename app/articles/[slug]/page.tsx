import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildExcerpt, getPublishedArticleBySlug } from "@/lib/public-content";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);

    if (!article) {
        return {
            title: "Obsah nenalezen",
            description: "Pozadovany obsah nebyl nalezen.",
        };
    }

    const description = article.excerpt || buildExcerpt(article.content);

    return {
        title: article.title,
        description,
        alternates: {
            canonical: `/articles/${article.slug}`,
        },
        openGraph: {
            title: article.title,
            description,
            type: "article",
            url: `/articles/${article.slug}`,
            publishedTime: article.publishedAt?.toISOString(),
            tags: article.tags.map((tag) => tag.name),
        },
    };
}

export default async function ArticleDetailPage({ params }: Props) {
    const { slug } = await params;
    const article = await getPublishedArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    return (
        <main className="container ui-page">
            <article
                className="mx-auto ui-surface p-4 p-md-5"
                style={{ maxWidth: "840px" }}
            >
                <header className="mb-4">
                    <p className="ui-eyebrow mb-2">Publikovano</p>
                    <h1 className="display-5 fw-semibold mb-3 ui-title">
                        {article.title}
                    </h1>
                    <p className="lead ui-subtitle mb-2">
                        {article.excerpt || buildExcerpt(article.content, 220)}
                    </p>
                    <div className="small text-muted">
                        Autor: {article.author.username}
                        {article.category
                            ? ` | Kategorie: ${article.category.name}`
                            : ""}
                    </div>
                    <div className="small text-muted mt-1">
                        {article.tags.map((tag) => tag.name).join(", ") ||
                            "Bez tagu"}
                    </div>
                </header>

                <section
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </article>
        </main>
    );
}
