import type { Metadata } from "next";
import { Pixelify_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "minecraft-react-ui/dist/esm/minecraft-react-ui.css";
/* Force Next.js HMR reload for CSS changes */
import { ClarityProvider } from "@/components/analytics/clarity-provider";
import { CookieConsentProvider } from "@/components/analytics/cookie-consent-provider";
import { GoogleTagManagerProvider } from "@/components/analytics/google-tag-manager-provider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

const pixelifySans = Pixelify_Sans({
    variable: "--font-pixelify-sans",
    subsets: ["latin"],
    weight: ["500", "700"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Minecraft Portal",
        template: "%s | Minecraft Portal",
    },
    description:
        "Minecraft hub pro tutorialy, servery, build guidey a curated content.",
    openGraph: {
        title: "Minecraft Portal",
        description:
            "Minecraft hub pro tutorialy, servery, build guidey a curated content.",
        type: "website",
        url: "/",
    },
    verification: {
        google: "SRC0SGMkE5Lp-FKK_18ytX3pAVfo_rbTJD2gvDW-zvE",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="cs"
            data-scroll-behavior="smooth"
            className={`${spaceGrotesk.variable} ${pixelifySans.variable} h-full antialiased`}
        >
            <head>
                <meta
                    name="google-site-verification"
                    content="SRC0SGMkE5Lp-FKK_18ytX3pAVfo_rbTJD2gvDW-zvE"
                />
            </head>
            <body
                className="min-h-full d-flex flex-column"
                style={{ position: "relative" }}
            >
                <CookieConsentProvider />
                <ClarityProvider />
                <GoogleTagManagerProvider />
                <header className="app-header">
                    <nav className="container py-3 d-flex justify-content-between align-items-center gap-3 flex-wrap">
                        <Link
                            href="/"
                            className="app-brand text-decoration-none"
                        >
                            MINECRAFT PORTAL
                        </Link>

                        <div className="header-nav-center d-none d-md-flex align-items-center gap-4">
                            <Link href="/" className="header-nav-item">
                                HOME
                            </Link>
                            <Link href="/guides" className="header-nav-item">
                                GUIDES
                            </Link>
                        </div>

                        <div className="d-flex gap-3 align-items-center">
                            {/* Force a fresh document load when leaving the public analytics scope. */}
                            <a
                                href="/dashboard"
                                className="header-btn-action d-inline-flex align-items-center gap-2"
                            >
                                DASHBOARD <span className="chevron">&gt;</span>
                            </a>
                        </div>
                    </nav>
                </header>
                {children}
            </body>
        </html>
    );
}
