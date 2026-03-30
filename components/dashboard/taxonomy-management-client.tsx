"use client";

import { FormEvent, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { TaxonomyPanel } from "@/components/dashboard/taxonomy-panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatusAlert } from "@/components/ui/status-alert";

type TaxonomyItem = {
    id: number;
    name: string;
};

export function TaxonomyManagementClient() {
    const [categories, setCategories] = useState<TaxonomyItem[]>([]);
    const [tags, setTags] = useState<TaxonomyItem[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newTagName, setNewTagName] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function getErrorMessage(response: Response, fallback: string) {
        try {
            const payload = (await response.json()) as { error?: string };

            if (payload.error) {
                return payload.error;
            }
        } catch {
            // Ignore parsing errors and use fallback.
        }

        return fallback;
    }

    async function loadTaxonomy() {
        setLoading(true);
        setError(null);

        try {
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
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : "Nepodarilo se nacist taxonomii.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadTaxonomy();
    }, []);

    async function createTaxonomy(type: "categories" | "tags", name: string) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/${type}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: trimmedName }),
            });

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Nepodarilo se ulozit taxonomii.",
                    ),
                );
            }

            if (type === "categories") {
                setNewCategoryName("");
            } else {
                setNewTagName("");
            }

            await loadTaxonomy();
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Nepodarilo se ulozit taxonomii.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteTaxonomy(type: "categories" | "tags", id: number) {
        setDeletingKey(`${type}-${id}`);
        setError(null);

        try {
            const response = await fetch(`/api/${type}/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        "Nepodarilo se smazat taxonomii.",
                    ),
                );
            }

            await loadTaxonomy();
        } catch (deleteError) {
            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : "Nepodarilo se smazat taxonomii.",
            );
        } finally {
            setDeletingKey(null);
        }
    }

    async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createTaxonomy("categories", newCategoryName);
    }

    async function handleCreateTag(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createTaxonomy("tags", newTagName);
    }

    async function handleDeleteCategory(category: TaxonomyItem) {
        const shouldDelete = window.confirm(
            `Opravdu smazat kategorii "${category.name}"?`,
        );

        if (!shouldDelete) {
            return;
        }

        await deleteTaxonomy("categories", category.id);
    }

    async function handleDeleteTag(tag: TaxonomyItem) {
        const shouldDelete = window.confirm(
            `Opravdu smazat tag "${tag.name}"?`,
        );

        if (!shouldDelete) {
            return;
        }

        await deleteTaxonomy("tags", tag.id);
    }

    return (
        <Container className="ui-page">
            <PageHeader title="Tagy a Kategorie" loading={loading} />

            <StatusAlert message={error} />

            <Row className="g-4">
                <Col lg={6}>
                    <TaxonomyPanel
                        title="Kategorie"
                        items={categories}
                        inputValue={newCategoryName}
                        inputPlaceholder="Nova kategorie"
                        emptyLabel="Zadne kategorie"
                        deletingPrefix="categories"
                        deletingKey={deletingKey}
                        disabled={saving || deletingKey !== null}
                        onInputChange={setNewCategoryName}
                        onCreate={handleCreateCategory}
                        onDelete={handleDeleteCategory}
                    />
                </Col>

                <Col lg={6}>
                    <TaxonomyPanel
                        title="Tagy"
                        items={tags}
                        inputValue={newTagName}
                        inputPlaceholder="Novy tag"
                        emptyLabel="Zadne tagy"
                        deletingPrefix="tags"
                        deletingKey={deletingKey}
                        disabled={saving || deletingKey !== null}
                        onInputChange={setNewTagName}
                        onCreate={handleCreateTag}
                        onDelete={handleDeleteTag}
                    />
                </Col>
            </Row>
        </Container>
    );
}
