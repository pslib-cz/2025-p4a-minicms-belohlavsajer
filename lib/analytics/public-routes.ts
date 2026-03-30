const EXCLUDED_PATHS = new Set(["/login"]);
const EXCLUDED_PREFIXES = ["/dashboard", "/api"];

export function isPublicAnalyticsPath(pathname: string | null): pathname is string {
    if (!pathname) {
        return false;
    }

    if (EXCLUDED_PATHS.has(pathname)) {
        return false;
    }

    return !EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
