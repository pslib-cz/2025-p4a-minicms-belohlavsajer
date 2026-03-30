"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Col,
    Container,
    Form,
    Pagination,
    Row,
    Table,
} from "react-bootstrap";

import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusAlert } from "@/components/ui/status-alert";
import { articleInputSchema } from "@/lib/validation";

type TaxonomyItem = {
    id: number;
    name: string;
};

type ArticleItem = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: "DRAFT" | "PUBLISHED";
    updatedAt: string;
    categoryId: number | null;
    category: TaxonomyItem | null;
    tags: TaxonomyItem[];
};

type ArticlesResponse = {
    items: ArticleItem[];
    page: number;
    totalPages: number;
};

type FormState = {
    id?: number;
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    tagIds: number[];
};

const defaultContent = "";

function toFormState(article?: ArticleItem): FormState {
    if (!article) {
        return {
            title: "",
            excerpt: "",
            content: defaultContent,
            categoryId: "",
            tagIds: [],
        };
    }

    return {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt ?? "",
        content: article.content,
        categoryId: article.categoryId ? String(article.categoryId) : "",
        tagIds: article.tags.map((tag) => tag.id),
    };
}

export function DashboardClient() {
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [categories, setCategories] = useState<TaxonomyItem[]>([]);
    const [tags, setTags] = useState<TaxonomyItem[]>([]);
    const [form, setForm] = useState<FormState>(toFormState());
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const submitLabel = useMemo(() => {
        return form.id ? "Ulozit zmeny" : "Vytvorit clanek";
    }, [form.id]);

    async function loadTaxonomy() {
        const [categoriesResponse, tagsResponse] = await Promise.all([
            fetch("/api/categories", { cache: "no-store" }),
            fetch("/api/tags", { cache: "no-store" }),
        ]);

        if (!categoriesResponse.ok || !tagsResponse.ok) {
            throw new Error("Nepodarilo se nacist tagy a kategorie.");
        }

        const [categoriesData, tagsData] = await Promise.all([
            categoriesResponse.json() as Promise<TaxonomyItem[]>,
            tagsResponse.json() as Promise<TaxonomyItem[]>,
        ]);

        setCategories(categoriesData);
        setTags(tagsData);
    }

    async function loadArticles(nextPage: number, nextQuery: string) {
        setLoading(true);

        try {
            const params = new URLSearchParams({
                page: String(nextPage),
            });

            if (nextQuery.trim()) {
                params.set("q", nextQuery.trim());
            }

            const response = await fetch(`/api/articles?${params.toString()}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Nepodarilo se nacist seznam clanku.");
            }

            const data = (await response.json()) as ArticlesResponse;
            setArticles(data.items);
            setPage(data.page);
            setTotalPages(data.totalPages);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void (async () => {
            try {
                await loadTaxonomy();
                await loadArticles(1, "");
            } catch (loadError) {
                const message =
                    loadError instanceof Error
                        ? loadError.message
                        : "Nepodarilo se nacist data dashboardu.";
                setError(message);
            }
        })();
    }, []);

    async function refreshList(overridePage?: number) {
        await loadArticles(overridePage ?? page, query);
    }

    function handleTagChange(tagId: number, checked: boolean) {
        setForm((prev) => ({
            ...prev,
            tagIds: checked
                ? [...prev.tagIds, tagId]
                : prev.tagIds.filter((id) => id !== tagId),
        }));
    }

    async function submitArticle(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const payload = {
            title: form.title,
            excerpt: form.excerpt,
            content: form.content,
            categoryId: form.categoryId ? Number(form.categoryId) : null,
            tagIds: form.tagIds,
        };

        const validation = articleInputSchema.safeParse(payload);

        if (!validation.success) {
            setError(
                validation.error.issues[0]?.message ??
                    "Neplatna data formulare.",
            );
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                form.id ? `/api/articles/${form.id}` : "/api/articles",
                {
                    method: form.id ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                throw new Error(data.error ?? "Ulozeni selhalo.");
            }

            setForm(toFormState());
            await refreshList(1);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Ulozeni selhalo.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function removeArticle(id: number) {
        if (!window.confirm("Opravdu chcete clanek smazat?")) {
            return;
        }

        const response = await fetch(`/api/articles/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            setError("Mazani selhalo.");
            return;
        }

        if (form.id === id) {
            setForm(toFormState());
        }

        await refreshList();
    }

    async function toggleStatus(article: ArticleItem) {
        const nextStatus = article.status === "DRAFT" ? "PUBLISHED" : "DRAFT";

        const response = await fetch(`/api/articles/${article.id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
            setError("Zmena statusu selhala.");
            return;
        }

        await refreshList();
    }

    async function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await loadArticles(1, query);
    }

    return (
        <Container className="ui-page">
            <PageHeader title="Články" loading={loading} />

            <Row className="g-4">
                <Col lg={5}>
                    <SectionCard
                        title={form.id ? "Editace clanku" : "Novy clanek"}
                        headingClassName="h4"
                    >
                        <StatusAlert message={error} />

                        <Form onSubmit={submitArticle}>
                            <FormField controlId="title" label="Titulek">
                                <Form.Control
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            title: event.target.value,
                                        }))
                                    }
                                    required
                                    minLength={3}
                                />
                            </FormField>

                            <FormField controlId="excerpt" label="Perex">
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={form.excerpt}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            excerpt: event.target.value,
                                        }))
                                    }
                                />
                            </FormField>

                            <FormField controlId="categoryId" label="Kategorie">
                                <Form.Select
                                    value={form.categoryId}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            categoryId: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Bez kategorie</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </FormField>

                            <FormField controlId="tags" label="Tagy">
                                <div className="d-flex flex-wrap gap-2">
                                    {tags.map((tag) => {
                                        const checked = form.tagIds.includes(
                                            tag.id,
                                        );

                                        return (
                                            <Form.Check
                                                inline
                                                key={tag.id}
                                                type="checkbox"
                                                id={`tag-${tag.id}`}
                                                label={tag.name}
                                                checked={checked}
                                                onChange={(event) =>
                                                    handleTagChange(
                                                        tag.id,
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </FormField>

                            <FormField
                                controlId="content"
                                label="Obsah (WYSIWYG)"
                                className="mb-4"
                            >
                                <RichTextEditor
                                    value={form.content}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            content: value,
                                        }))
                                    }
                                />
                            </FormField>

                            <div className="d-flex gap-2">
                                <Button
                                    type="submit"
                                    variant="dark"
                                    disabled={saving}
                                >
                                    {saving ? "Ukladam..." : submitLabel}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline-dark"
                                    onClick={() => setForm(toFormState())}
                                >
                                    Reset
                                </Button>
                            </div>
                        </Form>
                    </SectionCard>
                </Col>

                <Col lg={7}>
                    <SectionCard
                        title="Moje clanky"
                        headingClassName="h4"
                        loading={loading}
                    >
                        <Form
                            className="d-flex gap-2 mb-3"
                            onSubmit={handleSearch}
                        >
                            <Form.Control
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Hledat podle titulku nebo textu"
                            />
                            <Button type="submit" variant="outline-dark">
                                Hledat
                            </Button>
                        </Form>

                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>Titulek</th>
                                    <th>Status</th>
                                    <th>Taxonomie</th>
                                    <th>Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center text-muted py-4"
                                        >
                                            Zadne clanky
                                        </td>
                                    </tr>
                                ) : (
                                    articles.map((article) => (
                                        <tr key={article.id}>
                                            <td>
                                                <div className="fw-semibold">
                                                    {article.title}
                                                </div>
                                                <div className="text-muted small">
                                                    /{article.slug}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        article.status ===
                                                        "PUBLISHED"
                                                            ? "success"
                                                            : "secondary"
                                                    }
                                                >
                                                    {article.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="small">
                                                    {article.category?.name ??
                                                        "Bez kategorie"}
                                                </div>
                                                <div className="small text-muted">
                                                    {article.tags
                                                        .map((tag) => tag.name)
                                                        .join(", ") ||
                                                        "Bez tagu"}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={() =>
                                                            setForm(
                                                                toFormState(
                                                                    article,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={() =>
                                                            void toggleStatus(
                                                                article,
                                                            )
                                                        }
                                                    >
                                                        {article.status ===
                                                        "DRAFT"
                                                            ? "Publikovat"
                                                            : "Draft"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={() =>
                                                            void removeArticle(
                                                                article.id,
                                                            )
                                                        }
                                                    >
                                                        Smazat
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>

                        <Pagination className="mb-0 dashboard-pagination">
                            <Pagination.Prev
                                disabled={page <= 1}
                                onClick={() =>
                                    void loadArticles(page - 1, query)
                                }
                            />
                            <Pagination.Item
                                active
                            >{`${page} / ${totalPages}`}</Pagination.Item>
                            <Pagination.Next
                                disabled={page >= totalPages}
                                onClick={() =>
                                    void loadArticles(page + 1, query)
                                }
                            />
                        </Pagination>
                    </SectionCard>
                </Col>
            </Row>
        </Container>
    );
}
