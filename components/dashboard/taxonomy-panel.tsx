import { FormEvent } from "react";
import { Badge, Button, Form, ListGroup, Spinner } from "react-bootstrap";

import { SectionCard } from "@/components/ui/section-card";

type TaxonomyItem = {
    id: number;
    name: string;
};

type TaxonomyPanelProps = {
    title: string;
    items: TaxonomyItem[];
    inputValue: string;
    inputPlaceholder: string;
    emptyLabel: string;
    deletingPrefix: "categories" | "tags";
    deletingKey: string | null;
    disabled: boolean;
    onInputChange: (value: string) => void;
    onCreate: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
    onDelete: (item: TaxonomyItem) => void | Promise<void>;
};

export function TaxonomyPanel({
    title,
    items,
    inputValue,
    inputPlaceholder,
    emptyLabel,
    deletingPrefix,
    deletingKey,
    disabled,
    onInputChange,
    onCreate,
    onDelete,
}: TaxonomyPanelProps) {
    return (
        <SectionCard
            title={title}
            headingClassName="h5"
            className="h-100"
            headerRight={<Badge bg="secondary">{items.length}</Badge>}
        >
            <Form
                onSubmit={(event) => void onCreate(event)}
                className="d-flex gap-2 mb-3"
            >
                <Form.Control
                    value={inputValue}
                    onChange={(event) => onInputChange(event.target.value)}
                    placeholder={inputPlaceholder}
                    maxLength={60}
                />
                <Button type="submit" variant="dark" disabled={disabled}>
                    Pridat
                </Button>
            </Form>

            <ListGroup>
                {items.length === 0 ? (
                    <ListGroup.Item className="text-muted">
                        {emptyLabel}
                    </ListGroup.Item>
                ) : (
                    items.map((item) => {
                        const isDeleting =
                            deletingKey === `${deletingPrefix}-${item.id}`;

                        return (
                            <ListGroup.Item
                                key={item.id}
                                className="d-flex justify-content-between align-items-center gap-2"
                            >
                                <span>{item.name}</span>
                                <Button
                                    type="button"
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => void onDelete(item)}
                                    disabled={disabled}
                                >
                                    {isDeleting ? (
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
                        );
                    })
                )}
            </ListGroup>
        </SectionCard>
    );
}
