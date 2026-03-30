import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
    buildExcerpt,
    getPublicArticles,
    getPublicFilters,
} from "@/lib/public-content";

type SearchParams = {
    q?: string;
    tag?: string;
    category?: string;
    page?: string;
};

type Props = {
    searchParams: Promise<SearchParams>;
};

function buildQueryString(params: SearchParams) {
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

export async function generateMetadata({
    searchParams,
}: Props): Promise<Metadata> {
    const filters = await searchParams;
    const description = filters.q
        ? `Vysledky hledani pro: ${filters.q}`
        : "Seznam publikovanych clanku";

    const canonicalQuery = buildQueryString(filters);

    return {
        title: filters.q ? `Hledani: ${filters.q}` : "Publikovany obsah",
        description,
        alternates: {
            canonical: canonicalQuery ? `/?${canonicalQuery}` : "/",
        },
        openGraph: {
            title: filters.q ? `Hledani: ${filters.q}` : "Publikovany obsah",
            description,
            url: canonicalQuery ? `/?${canonicalQuery}` : "/",
            type: "website",
        },
    };
}

export default async function Home({ searchParams }: Props) {
    const filters = await searchParams;
    const [{ items, page, totalPages }, { categories, tags }] =
        await Promise.all([getPublicArticles(filters), getPublicFilters()]);

    const prevParams = buildQueryString({
        ...filters,
        page: String(Math.max(1, page - 1)),
    });
    const nextParams = buildQueryString({
        ...filters,
        page: String(Math.min(totalPages, page + 1)),
    });

    return (
        <main className="container ui-page">
            <section className="ui-hero mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <div>
                    <p className="ui-eyebrow mb-2">Verejna cast</p>
                    <h1 className="display-6 fw-semibold mb-2 ui-title">
                        Publikovany obsah
                    </h1>
                    <p className="ui-subtitle m-0">
                        Server Components + SEO + filtrovani a strankovani
                    </p>
                </div>
                <Image
                    src="/next.svg"
                    alt="Next.js"
                    width={120}
                    height={24}
                    priority
                />
            </section>

            <section className="card ui-card mb-4">
                <div className="card-body">
                    <form className="row g-3" method="GET">
                        <div className="col-md-5">
                            <label htmlFor="q" className="form-label">
                                Vyhledavani
                            </label>
                            <input
                                id="q"
                                type="text"
                                name="q"
                                className="form-control"
                                defaultValue={filters.q ?? ""}
                                placeholder="Hledat podle title/textu"
                            />
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="category" className="form-label">
                                Kategorie
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="form-select"
                                defaultValue={filters.category ?? ""}
                            >
                                <option value="">Vsechny</option>
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
                                <option value="">Vsechny</option>
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.name}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            <button
                                type="submit"
                                className="btn btn-dark w-100"
                            >
                                Go
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="row g-4">
                {items.length === 0 ? (
                    <div className="col-12">
                        <div className="alert alert-secondary mb-0">
                            Nebyly nalezeny zadne publikovane clanky.
                        </div>
                    </div>
                ) : (
                    items.map((article) => (
                        <div className="col-md-6 col-xl-4" key={article.id}>
                            <article className="card h-100 ui-card">
                                <div className="card-body d-flex flex-column">
                                    <p className="ui-eyebrow mb-2">
                                        {article.category?.name ??
                                            "Bez kategorie"}
                                    </p>
                                    <h2 className="h5">{article.title}</h2>
                                    <p className="text-secondary grow">
                                        {article.excerpt ||
                                            buildExcerpt(article.content, 120)}
                                    </p>
                                    <p className="small text-muted mb-3">
                                        {article.tags
                                            .map((tag) => tag.name)
                                            .join(", ") || "Bez tagu"}
                                    </p>
                                    <Link
                                        href={`/articles/${article.slug}`}
                                        className="btn btn-outline-dark btn-sm"
                                    >
                                        Otevrit detail
                                    </Link>
                                </div>
                            </article>
                        </div>
                    ))
                )}
            </section>

            <nav
                className="d-flex justify-content-center gap-2 mt-4"
                aria-label="Pagination"
            >
                {page <= 1 ? (
                    <span
                        className="btn btn-outline-dark disabled"
                        aria-disabled
                    >
                        Predchozi
                    </span>
                ) : (
                    <Link
                        href={`/?${prevParams}`}
                        className="btn btn-outline-dark"
                    >
                        Predchozi
                    </Link>
                )}
                <span className="btn btn-light border">{`${page} / ${totalPages}`}</span>
                {page >= totalPages ? (
                    <span
                        className="btn btn-outline-dark disabled"
                        aria-disabled
                    >
                        Dalsi
                    </span>
                ) : (
                    <Link
                        href={`/?${nextParams}`}
                        className="btn btn-outline-dark"
                    >
                        Dalsi
                    </Link>
                )}
            </nav>
        </main>
    );
}
