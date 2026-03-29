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
    const [error, setError] = useState<string | null>(null);

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
                throw new Error("Nepodarilo se ulozit taxonomii.");
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

    async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createTaxonomy("categories", newCategoryName);
    }

    async function handleCreateTag(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createTaxonomy("tags", newTagName);
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
                                <Button type="submit" disabled={saving}>
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
                                        <ListGroup.Item key={category.id}>
                                            {category.name}
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
                                <Button type="submit" disabled={saving}>
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
                                        <ListGroup.Item key={tag.id}>
                                            {tag.name}
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
