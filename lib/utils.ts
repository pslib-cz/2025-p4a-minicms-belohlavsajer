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
