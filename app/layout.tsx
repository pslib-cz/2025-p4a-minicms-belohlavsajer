import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
        default: "Mini CMS",
        template: "%s | Mini CMS",
    },
    description:
        "Publikacni platforma s verejnou casti a internim dashboardem.",
    openGraph: {
        title: "Mini CMS",
        description:
            "Publikacni platforma s verejnou casti a internim dashboardem.",
        type: "website",
        url: "/",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full d-flex flex-column">
                <header className="app-header">
                    <nav className="container py-3 d-flex justify-content-between align-items-center">
                        <Link
                            href="/"
                            className="app-brand text-decoration-none"
                        >
                            Mini CMS
                        </Link>
                        <div className="d-flex gap-3">
                            <Link href="/" className="app-nav-link">
                                Public
                            </Link>
                            <Link href="/dashboard" className="app-nav-link">
                                Dashboard
                            </Link>
                        </div>
                    </nav>
                </header>
                {children}
            </body>
        </html>
    );
}
