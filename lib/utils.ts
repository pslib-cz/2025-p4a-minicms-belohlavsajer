export function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function parsePage(value: string | null | undefined): number {
    const parsed = Number.parseInt(value ?? "1", 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function isValidImageSource(source: string): boolean {
    return (
        source.startsWith("/") ||
        source.startsWith("http://") ||
        source.startsWith("https://")
    );
}

export function extractFirstImageSource(html: string): string | null {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const source = match?.[1]?.trim();

    if (!source || !isValidImageSource(source)) {
        return null;
    }

    return source;
}

export function formatDate(value: Date | string | null | undefined): string {
    if (!value) {
        return "Nepublikováno";
    }

    const date = value instanceof Date ? value : new Date(value);

    return new Intl.DateTimeFormat("cs-CZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}
