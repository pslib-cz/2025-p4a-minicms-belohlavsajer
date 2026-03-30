import type { PublicGuide } from "@/lib/public-content";

import { extractFirstImageSource } from "@/lib/utils";

const SITE_NAME = "Minecraft Portal";
const SITE_DESCRIPTION =
    "Minecraft hub pro tutorialy, servery, build guidey a curated content.";
const SITE_LANGUAGE = "cs-CZ";

type JsonLdNode = {
    "@id"?: string;
    "@type": string;
    [key: string]: unknown;
};

type BreadcrumbInput = {
    name: string;
    path: string;
};

type GuidesCatalogSchemaInput = {
    canonicalPath: string;
    description: string;
    items: PublicGuide[];
    searchQuery?: string;
};

type GuideSchemaInput = {
    article: PublicGuide;
    description: string;
};

function getSiteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function buildAbsoluteUrl(path: string) {
    return new URL(path, getSiteUrl()).toString();
}

function toAbsoluteUrl(value: string) {
    return new URL(value, getSiteUrl()).toString();
}

function getOrganizationId() {
    return `${buildAbsoluteUrl("/")}#organization`;
}

function getWebsiteId() {
    return `${buildAbsoluteUrl("/")}#website`;
}

function escapeJsonLd(value: unknown) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

function buildInlineOrganization(): JsonLdNode {
    return {
        "@type": "Organization",
        "@id": getOrganizationId(),
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
    };
}

function buildInlineWebsite(): JsonLdNode {
    return {
        "@type": "WebSite",
        "@id": getWebsiteId(),
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
        inLanguage: SITE_LANGUAGE,
    };
}

function buildBreadcrumbList(
    canonicalPath: string,
    items: BreadcrumbInput[],
): JsonLdNode {
    return {
        "@type": "BreadcrumbList",
        "@id": `${buildAbsoluteUrl(canonicalPath)}#breadcrumb`,
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: buildAbsoluteUrl(item.path),
        })),
    };
}

export function JsonLdScript({
    data,
    id,
}: {
    data: JsonLdNode | JsonLdNode[];
    id?: string;
}) {
    const nodes = Array.isArray(data) ? data : [data];
    const payload =
        nodes.length === 1
            ? {
                  "@context": "https://schema.org",
                  ...nodes[0],
              }
            : {
                  "@context": "https://schema.org",
                  "@graph": nodes,
              };

    return (
        <script
            id={id}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: escapeJsonLd(payload) }}
        />
    );
}

export function buildHomeStructuredData(): JsonLdNode[] {
    const organization = buildInlineOrganization();
    const website = {
        ...buildInlineWebsite(),
        description: SITE_DESCRIPTION,
        publisher: {
            "@id": getOrganizationId(),
        },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: buildAbsoluteUrl(
                    "/guides?q={search_term_string}",
                ),
            },
            "query-input": "required name=search_term_string",
        },
    };

    return [organization, website];
}

export function buildGuidesCatalogStructuredData({
    canonicalPath,
    description,
    items,
    searchQuery,
}: GuidesCatalogSchemaInput): JsonLdNode[] {
    const pageUrl = buildAbsoluteUrl(canonicalPath);
    const breadcrumb = buildBreadcrumbList(canonicalPath, [
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
    ]);

    const itemList = {
        "@type": "ItemList",
        "@id": `${pageUrl}#items`,
        url: pageUrl,
        name: searchQuery
            ? `Výsledky hledání pro ${searchQuery}`
            : "Seznam guideů Minecraft Portal",
        numberOfItems: items.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: items.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: buildAbsoluteUrl(`/guides/${article.slug}`),
            name: article.title,
        })),
    };

    const page = {
        "@type": searchQuery ? "SearchResultsPage" : "CollectionPage",
        "@id": `${pageUrl}#page`,
        url: pageUrl,
        name: searchQuery ? `Hledání: ${searchQuery}` : "Guide katalog",
        description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: buildInlineWebsite(),
        breadcrumb: {
            "@id": `${pageUrl}#breadcrumb`,
        },
        mainEntity: {
            "@id": `${pageUrl}#items`,
        },
    };

    return [page, breadcrumb, itemList];
}

export function buildGuideStructuredData({
    article,
    description,
}: GuideSchemaInput): JsonLdNode[] {
    const guidePath = `/guides/${article.slug}`;
    const pageUrl = buildAbsoluteUrl(guidePath);
    const heroImage =
        article.coverImage || extractFirstImageSource(article.content);
    const breadcrumb = buildBreadcrumbList(guidePath, [
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: article.title, path: guidePath },
    ]);

    const guide = {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        url: pageUrl,
        headline: article.title,
        description,
        inLanguage: SITE_LANGUAGE,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": pageUrl,
        },
        author: {
            "@type": "Person",
            name: article.author.username,
        },
        publisher: buildInlineOrganization(),
        isPartOf: buildInlineWebsite(),
        dateModified: article.updatedAt.toISOString(),
        ...(article.publishDate
            ? { datePublished: article.publishDate.toISOString() }
            : {}),
        ...(heroImage
            ? { image: [toAbsoluteUrl(heroImage)] }
            : {}),
        ...(article.category?.name
            ? { articleSection: article.category.name }
            : {}),
        ...(article.tags.length
            ? { keywords: article.tags.map((tag) => tag.name).join(", ") }
            : {}),
    };

    return [guide, breadcrumb];
}
