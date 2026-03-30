import { ElementType, ReactNode } from "react";
import { Card, Spinner } from "react-bootstrap";

type SectionCardProps = {
    title?: string;
    titleAs?: ElementType;
    headingClassName?: string;
    className?: string;
    bodyClassName?: string;
    headerClassName?: string;
    loading?: boolean;
    headerRight?: ReactNode;
    children: ReactNode;
};

export function SectionCard({
    title,
    titleAs: TitleTag = "h2",
    headingClassName = "h4",
    className,
    bodyClassName,
    headerClassName,
    loading = false,
    headerRight,
    children,
}: SectionCardProps) {
    const shouldRenderHeader = Boolean(title || headerRight || loading);

    return (
        <Card className={["ui-card", className].filter(Boolean).join(" ")}>
            <Card.Body className={bodyClassName}>
                {shouldRenderHeader ? (
                    <div
                        className={[
                            "d-flex justify-content-between align-items-center mb-3",
                            headerClassName,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {title ? (
                            <TitleTag
                                className={`${headingClassName} m-0 ui-title`}
                            >
                                {title}
                            </TitleTag>
                        ) : (
                            <div />
                        )}

                        <div className="d-flex align-items-center gap-2">
                            {headerRight}
                            {loading ? <Spinner size="sm" /> : null}
                        </div>
                    </div>
                ) : null}

                {children}
            </Card.Body>
        </Card>
    );
}
