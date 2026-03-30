import type { Metadata } from "next";

import { GuideCard } from "@/components/public/guide-card";
import {
    MinecraftButton,
    MinecraftButtonLabel,
    MinecraftLinkButton,
} from "@/components/ui/minecraft-button";
import { getPublicArticles, getPublicFilters, PublicListParams } from "@/lib/public-content";
import {
    buildGuidesCatalogStructuredData,
    JsonLdScript,
} from "@/lib/seo/structured-data";

type Props = {
    searchParams: Promise<PublicListParams>;
};

function buildQueryString(params: PublicListParams) {
    const query = new URLSearchParams();

    if (params.q) {
        query.set("q", params.q);
    }
    if (params.tag) {
        query.set("tag", params.tag);
    }
    if (params.category) {
        query.set("category", params.category);
    }
    if (params.page) {
        query.set("page", params.page);
    }

    return query.toString();
}

function getGuidesPageDescription(filters: PublicListParams) {
    return filters.q
        ? `Výsledky hledání pro ${filters.q} v Minecraft Portal katalogu.`
        : "Katalog publikovaných Minecraft guideů, server entries a build doporučení.";
}

function getGuidesPageTitle(filters: PublicListParams) {
    return filters.q ? `Hledání: ${filters.q}` : "Guide katalog";
}

function getGuidesCanonicalPath(filters: PublicListParams) {
    const canonicalQuery = buildQueryString(filters);
    return canonicalQuery ? `/guides?${canonicalQuery}` : "/guides";
}

export async function generateMetadata({
    searchParams,
}: Props): Promise<Metadata> {
    const filters = await searchParams;
    const description = getGuidesPageDescription(filters);
    const canonicalPath = getGuidesCanonicalPath(filters);

    return {
        title: getGuidesPageTitle(filters),
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: filters.q ? `Hledání: ${filters.q}` : "Minecraft guide katalog",
            description,
            url: canonicalPath,
            type: "website",
        },
    };
}

export default async function GuidesPage({ searchParams }: Props) {
    const filters = await searchParams;
    const [{ items, page, totalPages }, { categories, tags }] =
        await Promise.all([getPublicArticles(filters), getPublicFilters()]);
    const description = getGuidesPageDescription(filters);
    const canonicalPath = getGuidesCanonicalPath(filters);

    const prevParams = buildQueryString({
        ...filters,
        page: String(Math.max(1, page - 1)),
    });
    const nextParams = buildQueryString({
        ...filters,
        page: String(Math.min(totalPages, page + 1)),
    });

    return (
        <>
            <JsonLdScript
                id="guides-structured-data"
                data={buildGuidesCatalogStructuredData({
                    canonicalPath,
                    description,
                    items,
                    searchQuery: filters.q?.trim() || undefined,
                })}
            />
            <main className="container ui-page">
                <section className="guides-hero">
                    <div>
                        <p className="portal-kicker mb-2">Full catalog</p>
                        <h1 className="display-5 fw-semibold mb-2 ui-title">
                            Katalog guideů, serverů a build entry
                        </h1>
                        <p className="ui-subtitle mb-0">
                            Search přes title i text, filtry podle typu obsahu a
                            tagů, stránkování a SEO-friendly detail každé
                            položky.
                        </p>
                    </div>
                    <MinecraftLinkButton href="/" variant="secondary">
                        Zpět na homepage
                    </MinecraftLinkButton>
                </section>

                <section className="ui-surface portal-filters mb-4">
                    <form className="row g-3" method="GET">
                        <div className="col-lg-5">
                            <label htmlFor="q" className="form-label">
                                Hledání
                            </label>
                            <input
                                id="q"
                                type="text"
                                name="q"
                                className="form-control"
                                defaultValue={filters.q ?? ""}
                                placeholder="Hledat podle názvu nebo obsahu"
                            />
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="category" className="form-label">
                                Typ obsahu
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="form-select"
                                defaultValue={filters.category ?? ""}
                            >
                                <option value="">Všechny typy</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.name}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="tag" className="form-label">
                                Tag
                            </label>
                            <select
                                id="tag"
                                name="tag"
                                className="form-select"
                                defaultValue={filters.tag ?? ""}
                            >
                                <option value="">Všechny tagy</option>
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.name}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <MinecraftButton
                                type="submit"
                                variant="primary"
                                block
                            >
                                Go
                            </MinecraftButton>
                        </div>
                    </form>
                </section>

                {items.length === 0 ? (
                    <section className="ui-surface portal-empty-state">
                        <h2 className="h4 ui-title">
                            Žádný guide neodpovídá filtru
                        </h2>
                        <p className="ui-subtitle mb-0">
                            Zkus jiný tag, typ obsahu nebo vymaž textové
                            hledání.
                        </p>
                    </section>
                ) : (
                    <section className="guide-grid">
                        {items.map((article) => (
                            <GuideCard article={article} key={article.id} />
                        ))}
                    </section>
                )}

                <nav
                    className="dashboard-pagination justify-content-center mt-4"
                    aria-label="Pagination"
                >
                    {page <= 1 ? (
                        <MinecraftButtonLabel variant="secondary" disabled>
                            Předchozí
                        </MinecraftButtonLabel>
                    ) : (
                        <MinecraftLinkButton
                            href={`/guides?${prevParams}`}
                            variant="secondary"
                        >
                            Předchozí
                        </MinecraftLinkButton>
                    )}
                    <MinecraftButtonLabel variant="secondary">{`${page} / ${totalPages}`}</MinecraftButtonLabel>
                    {page >= totalPages ? (
                        <MinecraftButtonLabel variant="secondary" disabled>
                            Další
                        </MinecraftButtonLabel>
                    ) : (
                        <MinecraftLinkButton
                            href={`/guides?${nextParams}`}
                            variant="secondary"
                        >
                            Další
                        </MinecraftLinkButton>
                    )}
                </nav>
            </main>
        </>
    );
}
