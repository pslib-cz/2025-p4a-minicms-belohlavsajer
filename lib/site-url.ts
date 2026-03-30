const LOCAL_DEV_URL = "http://localhost:3000";

function normalizeSiteUrl(rawUrl: string) {
    const withProtocol = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`;

    return new URL(withProtocol).origin;
}

export function getSiteUrl() {
    const rawUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXTAUTH_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : undefined) ||
        (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : undefined) ||
        LOCAL_DEV_URL;

    return normalizeSiteUrl(rawUrl);
}

export function toAbsoluteUrl(pathOrUrl: string, siteUrl = getSiteUrl()) {
    return new URL(pathOrUrl, siteUrl).toString();
}
