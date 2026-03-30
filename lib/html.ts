import sanitizeHtml from "sanitize-html";

const articleSanitizerConfig: sanitizeHtml.IOptions = {
    allowedTags: [
        ...sanitizeHtml.defaults.allowedTags,
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "img",
    ],
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title"],
    },
    transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
            rel: "nofollow noopener noreferrer",
        }),
    },
};

export function sanitizeArticleHtml(content: string): string {
    return sanitizeHtml(content, articleSanitizerConfig).trim();
}
