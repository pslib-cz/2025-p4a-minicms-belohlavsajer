"use client";

import { FormEvent, useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    ListGroup,
    Row,
    Spinner,
} from "react-bootstrap";

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
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 m-0 ui-title">
                    Tag &amp; Category Management
                </h1>
                {loading ? <Spinner size="sm" /> : null}
            </div>

            {error ? <Alert variant="danger">{error}</Alert> : null}

            <Row className="g-4">
                <Col lg={6}>
                    <Card className="ui-card h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h2 className="h5 m-0 ui-title">Kategorie</h2>
                                <Badge bg="secondary">
                                    {categories.length}
                                </Badge>
                            </div>

                            <Form
                                onSubmit={handleCreateCategory}
                                className="d-flex gap-2 mb-3"
                            >
                                <Form.Control
                                    value={newCategoryName}
                                    onChange={(event) =>
                                        setNewCategoryName(event.target.value)
                                    }
                                    placeholder="Nova kategorie"
                                    maxLength={60}
                                />
                                <Button
                                    type="submit"
                                    variant="dark"
                                    disabled={saving || deletingKey !== null}
                                >
                                    Pridat
                                </Button>
                            </Form>

                            <ListGroup>
                                {categories.length === 0 ? (
                                    <ListGroup.Item className="text-muted">
                                        Zadne kategorie
                                    </ListGroup.Item>
                                ) : (
                                    categories.map((category) => (
                                        <ListGroup.Item
                                            key={category.id}
                                            className="d-flex justify-content-between align-items-center gap-2"
                                        >
                                            <span>{category.name}</span>
                                            <Button
                                                type="button"
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() =>
                                                    void handleDeleteCategory(
                                                        category,
                                                    )
                                                }
                                                disabled={
                                                    saving ||
                                                    deletingKey !== null
                                                }
                                            >
                                                {deletingKey ===
                                                `categories-${category.id}` ? (
                                                    <>
                                                        <Spinner
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Mazu...
                                                    </>
                                                ) : (
                                                    "Smazat"
                                                )}
                                            </Button>
                                        </ListGroup.Item>
                                    ))
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={6}>
                    <Card className="ui-card h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h2 className="h5 m-0 ui-title">Tagy</h2>
                                <Badge bg="secondary">{tags.length}</Badge>
                            </div>

                            <Form
                                onSubmit={handleCreateTag}
                                className="d-flex gap-2 mb-3"
                            >
                                <Form.Control
                                    value={newTagName}
                                    onChange={(event) =>
                                        setNewTagName(event.target.value)
                                    }
                                    placeholder="Novy tag"
                                    maxLength={60}
                                />
                                <Button
                                    type="submit"
                                    variant="dark"
                                    disabled={saving || deletingKey !== null}
                                >
                                    Pridat
                                </Button>
                            </Form>

                            <ListGroup>
                                {tags.length === 0 ? (
                                    <ListGroup.Item className="text-muted">
                                        Zadne tagy
                                    </ListGroup.Item>
                                ) : (
                                    tags.map((tag) => (
                                        <ListGroup.Item
                                            key={tag.id}
                                            className="d-flex justify-content-between align-items-center gap-2"
                                        >
                                            <span>{tag.name}</span>
                                            <Button
                                                type="button"
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() =>
                                                    void handleDeleteTag(tag)
                                                }
                                                disabled={
                                                    saving ||
                                                    deletingKey !== null
                                                }
                                            >
                                                {deletingKey ===
                                                `tags-${tag.id}` ? (
                                                    <>
                                                        <Spinner
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Mazu...
                                                    </>
                                                ) : (
                                                    "Smazat"
                                                )}
                                            </Button>
                                        </ListGroup.Item>
                                    ))
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
