import type { Metadata } from "next";

import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { GuideCard } from "@/components/public/guide-card";
import { MinecraftLinkButton } from "@/components/ui/minecraft-button";
import {
    homepageGuideTypeHighlights,
    getGuideTypeMeta,
} from "@/lib/minecraft-portal";
import { getHomepageSections } from "@/lib/public-content";
import {
    buildHomeStructuredData,
    JsonLdScript,
} from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Minecraft hub pro guidey a servery",
    description:
        "Minecraft Portal spojuje tutorialy, server picks, build guidey a farm setupy do jednoho rychlého katalogu.",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "Minecraft Portal",
        description:
            "Minecraft hub pro tutorialy, servery, build guidey a curated content.",
        type: "website",
        url: "/",
    },
};

export default async function Home() {
    const { featuredGuides, serverPicks, starterGuides, buildSpotlights } =
        await getHomepageSections();

    return (
        <>
            <JsonLdScript
                id="home-structured-data"
                data={buildHomeStructuredData()}
            />
            <main className="portal-home">
                <section className="portal-home-hero">
                    <div className="portal-home-hero-media">
                        <iframe
                            src="https://www.youtube.com/embed/7A5YWn33eps?autoplay=1&mute=1&loop=1&playlist=7A5YWn33eps&controls=0&showinfo=0&rel=0&modestbranding=1"
                            allow="autoplay; encrypted-media"
                            className="portal-home-hero-video"
                            tabIndex={-1}
                            aria-hidden="true"
                        />
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="https://media.tenor.com/R2HKzxROnhIAAAAd/minecraft-steve.gif"
                        alt=""
                        aria-hidden="true"
                        className="hero-steve-dance"
                    />

                    <div className="container portal-home-hero-shell">
                        <div className="portal-home-copy">
                            <p className="portal-kicker">
                                Minecraft knowledge hub
                            </p>
                            <h1>Minecraft Portal pro návody, servery a buildy.</h1>
                            <p className="portal-home-subtitle">
                                Kurátorovaný obsah pro survival start, server
                                picks, farm efektivitu i build inspiraci. Méně
                                chaosu, víc použitelného obsahu.
                            </p>
                            <div className="portal-home-actions">
                                <MinecraftLinkButton
                                    href="/guides"
                                    variant="primary"
                                    selectContent={{
                                        contentType: "catalog_cta",
                                        contentId: "home_hero_guides",
                                        contentName: "Prozkoumat guidey",
                                    }}
                                >
                                    Prozkoumat guidey
                                </MinecraftLinkButton>
                                <MinecraftLinkButton
                                    href="/guides?category=Server"
                                    variant="secondary"
                                    selectContent={{
                                        contentType: "catalog_cta",
                                        contentId: "home_hero_servers",
                                        contentName: "Nejlepsi servery",
                                    }}
                                >
                                    Nejlepší servery
                                </MinecraftLinkButton>
                            </div>
                        </div>

                        <div className="portal-home-sidepanel">
                            <p className="portal-kicker">V jednom flow</p>
                            <ul className="portal-checklist">
                                <li>Tutorialy pro rychlý start</li>
                                <li>Server entries s jasným filtrováním</li>
                                <li>Build a farm guidey s praktickým obsahem</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="container ui-page">
                    <div className="portal-strip-header">
                        <div>
                            <p className="portal-kicker mb-2">Obsahové typy</p>
                            <h2 className="ui-title h2 mb-0">
                                Jedna databáze, několik vstupních cest do hry
                            </h2>
                        </div>
                        <MinecraftLinkButton
                            href="/guides"
                            variant="secondary"
                            selectContent={{
                                contentType: "catalog_cta",
                                contentId: "home_content_types_catalog",
                                contentName: "Otevrit katalog",
                            }}
                        >
                            Otevřít katalog
                        </MinecraftLinkButton>
                    </div>

                    <div className="content-type-grid">
                        {homepageGuideTypeHighlights.map((item) => {
                            const typeMeta = getGuideTypeMeta(item.categoryName);

                            return (
                                <AnalyticsLink
                                    href={`/guides?category=${encodeURIComponent(
                                        item.categoryName,
                                    )}`}
                                    key={item.categoryName}
                                    className={`content-type-tile content-type-tile-${typeMeta.key}`}
                                    selectContent={{
                                        contentType: "guide_category",
                                        contentId: typeMeta.key,
                                        contentName: item.categoryName,
                                    }}
                                >
                                    <span className="guide-type-pill">
                                        {typeMeta.label}
                                    </span>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </AnalyticsLink>
                            );
                        })}
                    </div>
                </section>

                <section className="container ui-page pt-0">
                    <div className="portal-section-heading">
                        <div>
                            <p className="portal-kicker mb-2">Featured guides</p>
                            <h2 className="ui-title h2 mb-0">
                                To nejdůležitější pro aktuální survival loop
                            </h2>
                        </div>
                    </div>
                    <div className="guide-swiper-wrapper">
                        <div className="guide-grid">
                            {featuredGuides.map((article) => (
                                <GuideCard article={article} key={article.id} />
                            ))}
                        </div>
                        <div className="guide-swiper-dots" aria-hidden="true">
                            {featuredGuides.map((_: unknown, i: number) => (
                                <span key={i} className="guide-swiper-dot" />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="container ui-page pt-0">
                    <div className="portal-duo-grid">
                        <div>
                            <div className="portal-section-heading">
                                <div>
                                    <p className="portal-kicker mb-2">
                                        Server picks
                                    </p>
                                    <h2 className="ui-title h3 mb-0">
                                        Kam se připojit podle stylu hraní
                                    </h2>
                                </div>
                            </div>
                            <div className="guide-grid guide-grid-compact">
                                {serverPicks.map((article) => (
                                    <GuideCard
                                        article={article}
                                        key={article.id}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="portal-section-heading">
                                <div>
                                    <p className="portal-kicker mb-2">
                                        Začni tady
                                    </p>
                                    <h2 className="ui-title h3 mb-0">
                                        Obsah pro nové hráče a rychlý onboarding
                                    </h2>
                                </div>
                            </div>
                            <div className="guide-grid guide-grid-compact">
                                {starterGuides.map((article) => (
                                    <GuideCard
                                        article={article}
                                        key={article.id}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="container ui-page pt-0">
                    <div className="portal-section-heading">
                        <div>
                            <p className="portal-kicker mb-2">
                                Build & farm focus
                            </p>
                            <h2 className="ui-title h2 mb-0">
                                Praktické setupy pro efektivní a čistý svět
                            </h2>
                        </div>
                        <MinecraftLinkButton
                            href="/guides?category=Build%20Guide"
                            variant="secondary"
                            selectContent={{
                                contentType: "catalog_cta",
                                contentId: "home_build_catalog",
                                contentName: "Build katalog",
                            }}
                        >
                            Build katalog
                        </MinecraftLinkButton>
                    </div>
                    <div className="guide-grid">
                        {buildSpotlights.map((article) => (
                            <GuideCard article={article} key={article.id} />
                        ))}
                    </div>
                </section>

                <section className="container ui-page pt-0">
                    <div className="portal-final-cta">
                        <div>
                            <p className="portal-kicker mb-2">Full catalog</p>
                            <h2 className="ui-title h2 mb-2">
                                Hledej podle typu, tagů a herního stylu
                            </h2>
                            <p className="ui-subtitle mb-0">
                                Katalog guideů drží search, filtry, stránkování
                                i detailní metadata. Přesně to, co zadání chce,
                                jen v silnější produktové identitě.
                            </p>
                        </div>
                        <MinecraftLinkButton
                            href="/guides"
                            variant="primary"
                            selectContent={{
                                contentType: "catalog_cta",
                                contentId: "home_full_catalog",
                                contentName: "Otevrit cely katalog",
                            }}
                        >
                            Otevřít celý katalog
                        </MinecraftLinkButton>
                    </div>
                </section>
            </main>
        </>
    );
}
