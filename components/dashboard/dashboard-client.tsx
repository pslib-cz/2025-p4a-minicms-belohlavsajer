"use client";

import {
    type ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Badge,
    Col,
    Container,
    Form,
    Row,
    Table,
} from "react-bootstrap";

import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { FormField } from "@/components/ui/form-field";
import {
    MinecraftButton,
    MinecraftButtonLabel,
    MinecraftLinkButton,
} from "@/components/ui/minecraft-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusAlert } from "@/components/ui/status-alert";
import { isValidImageSource } from "@/lib/utils";
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
    coverImage: string | null;
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
    coverImage: string;
    categoryId: string;
    tagIds: number[];
};

type UploadImageResponse = {
    src?: string;
    error?: string;
};

const defaultContent = "";

function toFormState(article?: ArticleItem): FormState {
    if (!article) {
        return {
            title: "",
            excerpt: "",
            content: defaultContent,
            coverImage: "",
            categoryId: "",
            tagIds: [],
        };
    }

    return {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt ?? "",
        content: article.content,
        coverImage: article.coverImage ?? "",
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
    const [coverUploadError, setCoverUploadError] = useState<string | null>(
        null,
    );
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(
        null,
    );
    const [selectedCoverPreviewUrl, setSelectedCoverPreviewUrl] = useState<
        string | null
    >(null);
    const coverFileInputRef = useRef<HTMLInputElement | null>(null);

    const submitLabel = useMemo(() => {
        return form.id ? "Uložit změny" : "Vytvořit guide";
    }, [form.id]);

    const publishedCount = useMemo(
        () => articles.filter((article) => article.status === "PUBLISHED").length,
        [articles],
    );
    const draftCount = useMemo(
        () => articles.filter((article) => article.status === "DRAFT").length,
        [articles],
    );
    const normalizedCoverImage = form.coverImage.trim();
    const coverPreview =
        selectedCoverPreviewUrl ||
        (normalizedCoverImage && isValidImageSource(normalizedCoverImage)
            ? normalizedCoverImage
            : null);

    useEffect(() => {
        if (!selectedCoverFile) {
            setSelectedCoverPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedCoverFile);
        setSelectedCoverPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedCoverFile]);

    async function loadTaxonomy() {
        const [categoriesResponse, tagsResponse] = await Promise.all([
            fetch("/api/categories", { cache: "no-store" }),
            fetch("/api/tags", { cache: "no-store" }),
        ]);

        if (!categoriesResponse.ok || !tagsResponse.ok) {
            throw new Error("Nepodařilo se načíst tagy a typy obsahu.");
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
                throw new Error("Nepodařilo se načíst seznam guideů.");
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
                        : "Nepodařilo se načíst data dashboardu.";
                setError(message);
            }
        })();
    }, []);

    async function refreshList(overridePage?: number) {
        await loadArticles(overridePage ?? page, query);
    }

    function resetCoverUploadState() {
        setCoverUploadError(null);
        setSelectedCoverFile(null);

        if (coverFileInputRef.current) {
            coverFileInputRef.current.value = "";
        }
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
            coverImage: form.coverImage,
            categoryId: form.categoryId ? Number(form.categoryId) : null,
            tagIds: form.tagIds,
        };

        const validation = articleInputSchema.safeParse(payload);

        if (!validation.success) {
            setError(
                validation.error.issues[0]?.message ??
                    "Neplatná data formuláře.",
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
                throw new Error(data.error ?? "Uložení selhalo.");
            }

            setForm(toFormState());
            resetCoverUploadState();
            await refreshList(1);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Uložení selhalo.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function removeArticle(id: number) {
        if (!window.confirm("Opravdu chcete guide smazat?")) {
            return;
        }

        const response = await fetch(`/api/articles/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            setError("Mazání selhalo.");
            return;
        }

        if (form.id === id) {
            setForm(toFormState());
            resetCoverUploadState();
        }

        await refreshList();
    }

    async function toggleStatus(article: ArticleItem) {
        const nextStatus = article.status === "DRAFT" ? "PUBLISHED" : "DRAFT";

        const response = await fetch(`/api/articles/${article.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as {
                error?: string;
            };
            setError(data.error ?? "Změna statusu selhala.");
            return;
        }

        await refreshList();
    }

    async function uploadCoverImage() {
        if (!selectedCoverFile) {
            setCoverUploadError("Vyber obrázek, který chceš nahrát.");
            return;
        }

        setUploadingCover(true);
        setCoverUploadError(null);

        const formData = new FormData();
        formData.append("file", selectedCoverFile);

        if (form.title.trim()) {
            formData.append("alt", form.title.trim());
        }

        try {
            const response = await fetch("/api/uploads/guides", {
                method: "POST",
                body: formData,
            });
            const data = (await response.json()) as UploadImageResponse;

            if (!response.ok || !data.src) {
                throw new Error(data.error ?? "Nahrání hero obrázku selhalo.");
            }

            setForm((prev) => ({
                ...prev,
                coverImage: data.src ?? "",
            }));
            resetCoverUploadState();
        } catch (uploadError) {
            setCoverUploadError(
                uploadError instanceof Error
                    ? uploadError.message
                    : "Nahrání hero obrázku selhalo.",
            );
        } finally {
            setUploadingCover(false);
        }
    }

    async function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await loadArticles(1, query);
    }

    return (
        <Container className="ui-page">
            <PageHeader
                title="Guide Control"
                eyebrow="Portal Ops"
                subtitle="Spravuj vlastní tutorialy, server entries a build guidey přes jednu redakční konzoli."
                loading={loading}
                actions={
                    <MinecraftLinkButton href="/guides" variant="secondary">
                        Veřejný katalog
                    </MinecraftLinkButton>
                }
            />

            <section className="dashboard-stat-grid">
                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">Na stránce</span>
                    <strong>{articles.length}</strong>
                </div>
                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">Published</span>
                    <strong>{publishedCount}</strong>
                </div>
                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">Draft</span>
                    <strong>{draftCount}</strong>
                </div>
            </section>

            <Row className="g-4">
                <Col lg={5}>
                    <SectionCard
                        title={form.id ? "Editor guideu" : "Nový guide"}
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

                            <FormField controlId="excerpt" label="Krátké shrnutí">
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

                            <FormField controlId="coverImage" label="Hero obrázek">
                                <div className="dashboard-cover-grid">
                                    <div className="dashboard-cover-fields">
                                        <Form.Control
                                            value={form.coverImage}
                                            onChange={(event) => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    coverImage:
                                                        event.target.value,
                                                }));
                                                setCoverUploadError(null);
                                            }}
                                            placeholder="/uploads/guides/... nebo https://..."
                                        />
                                        <Form.Control
                                            ref={coverFileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                            onChange={(
                                                event: ChangeEvent<HTMLInputElement>,
                                            ) => {
                                                setSelectedCoverFile(
                                                    event.currentTarget.files?.[0] ??
                                                        null,
                                                );
                                                setCoverUploadError(null);
                                            }}
                                        />
                                        {selectedCoverFile ? (
                                            <Form.Text className="text-muted">
                                                Vybraný soubor:{" "}
                                                {selectedCoverFile.name}
                                            </Form.Text>
                                        ) : null}
                                        <div className="mc-button-row">
                                            <MinecraftButton
                                                type="button"
                                                variant="secondary"
                                                onClick={() =>
                                                    void uploadCoverImage()
                                                }
                                                disabled={uploadingCover}
                                            >
                                                {uploadingCover
                                                    ? "Nahrávám..."
                                                    : "Nahrát hero obrázek"}
                                            </MinecraftButton>
                                            <MinecraftButton
                                                type="button"
                                                variant="secondary"
                                                onClick={() => {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        coverImage: "",
                                                    }));
                                                    resetCoverUploadState();
                                                }}
                                            >
                                                Vymazat obrázek
                                            </MinecraftButton>
                                        </div>
                                        <Form.Text className="text-muted">
                                            Hero obrázek se ukáže v kartách i v
                                            horní hero sekci detailu guideu.
                                            Když ho nenastavíš, veřejná část
                                            zkusí použít první obrázek z obsahu.
                                        </Form.Text>
                                        {coverUploadError ? (
                                            <div className="dashboard-cover-error">
                                                {coverUploadError}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="dashboard-cover-preview">
                                        {coverPreview ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={coverPreview}
                                                    alt={
                                                        form.title ||
                                                        "Hero preview"
                                                    }
                                                    className="dashboard-cover-preview-image"
                                                />
                                                <div className="dashboard-cover-meta">
                                                    <strong>
                                                        Aktuální preview
                                                    </strong>
                                                    <span className="dashboard-cover-path">
                                                        {selectedCoverFile
                                                            ? selectedCoverFile.name
                                                            : normalizedCoverImage}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="dashboard-cover-placeholder">
                                                Po vložení nebo nahrání se tady
                                                ukáže hero preview.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </FormField>

                            <FormField controlId="categoryId" label="Typ obsahu">
                                <Form.Select
                                    value={form.categoryId}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            categoryId: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Bez typu</option>
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
                                label="Obsah guideu (WYSIWYG)"
                                className="mb-4"
                            >
                                <>
                                    <RichTextEditor
                                        value={form.content}
                                        onChange={(value) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                content: value,
                                            }))
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Editor ukládá formátovaný HTML obsah,
                                        který se po publikaci propíše do detailu
                                        guideu včetně vložených a nahraných
                                        obrázků.
                                    </Form.Text>
                                </>
                            </FormField>

                            <div className="mc-button-row">
                                <MinecraftButton
                                    type="submit"
                                    variant="primary"
                                    disabled={saving}
                                >
                                    {saving ? "Ukládám..." : submitLabel}
                                </MinecraftButton>
                                <MinecraftButton
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setForm(toFormState());
                                        resetCoverUploadState();
                                    }}
                                >
                                    Reset
                                </MinecraftButton>
                            </div>
                        </Form>
                    </SectionCard>
                </Col>

                <Col lg={7}>
                    <SectionCard
                        title="Moje guidey"
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
                                placeholder="Hledat podle názvu nebo obsahu guideu"
                            />
                            <MinecraftButton type="submit" variant="secondary">
                                Hledat
                            </MinecraftButton>
                        </Form>

                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>Titulek</th>
                                    <th>Status</th>
                                    <th>Typ a tagy</th>
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
                                            Žádné guidey
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
                                                    {article.status ===
                                                    "PUBLISHED"
                                                        ? "Published"
                                                        : "Draft"}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="small fw-semibold">
                                                    {article.category?.name ??
                                                        "Bez typu"}
                                                </div>
                                                <div className="small text-muted">
                                                    {article.tags
                                                        .map((tag) => tag.name)
                                                        .join(", ") ||
                                                        "Bez tagů"}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="mc-button-row">
                                                    <MinecraftButton
                                                        small
                                                        variant="secondary"
                                                        onClick={() =>
                                                            {
                                                                setForm(
                                                                    toFormState(
                                                                        article,
                                                                    ),
                                                                );
                                                                resetCoverUploadState();
                                                            }
                                                        }
                                                    >
                                                        Edit
                                                    </MinecraftButton>
                                                    {article.status ===
                                                    "PUBLISHED" ? (
                                                        <MinecraftLinkButton
                                                            href={`/guides/${article.slug}`}
                                                            variant="secondary"
                                                            small
                                                        >
                                                            Preview
                                                        </MinecraftLinkButton>
                                                    ) : null}
                                                    <MinecraftButton
                                                        small
                                                        variant="secondary"
                                                        onClick={() =>
                                                            void toggleStatus(
                                                                article,
                                                            )
                                                        }
                                                    >
                                                        {article.status ===
                                                        "DRAFT"
                                                            ? "Publikovat"
                                                            : "Stáhnout"}
                                                    </MinecraftButton>
                                                    <MinecraftButton
                                                        small
                                                        variant="secondary"
                                                        onClick={() =>
                                                            void removeArticle(
                                                                article.id,
                                                            )
                                                        }
                                                    >
                                                        Smazat
                                                    </MinecraftButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>

                        <nav className="dashboard-pagination" aria-label="Pagination">
                            <MinecraftButton
                                type="button"
                                variant="secondary"
                                disabled={page <= 1}
                                onClick={() =>
                                    void loadArticles(page - 1, query)
                                }
                            >
                                Předchozí
                            </MinecraftButton>
                            <MinecraftButtonLabel variant="secondary">
                                {`${page} / ${totalPages}`}
                            </MinecraftButtonLabel>
                            <MinecraftButton
                                type="button"
                                variant="secondary"
                                disabled={page >= totalPages}
                                onClick={() =>
                                    void loadArticles(page + 1, query)
                                }
                            >
                                Další
                            </MinecraftButton>
                        </nav>
                    </SectionCard>
                </Col>
            </Row>
        </Container>
    );
}
