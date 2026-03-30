import { FormEvent } from "react";
import { Badge, Form, ListGroup, Spinner } from "react-bootstrap";

import { MinecraftButton } from "@/components/ui/minecraft-button";
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
                <MinecraftButton type="submit" variant="primary" disabled={disabled}>
                    Přidat
                </MinecraftButton>
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
                                <MinecraftButton
                                    type="button"
                                    variant="secondary"
                                    small
                                    onClick={() => void onDelete(item)}
                                    disabled={disabled}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Spinner
                                                size="sm"
                                                className="me-2"
                                            />
                                            Mažu...
                                        </>
                                    ) : (
                                        "Smazat"
                                    )}
                                </MinecraftButton>
                            </ListGroup.Item>
                        );
                    })
                )}
            </ListGroup>
        </SectionCard>
    );
}
