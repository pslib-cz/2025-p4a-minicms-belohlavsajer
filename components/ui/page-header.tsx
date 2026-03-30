import { ElementType, ReactNode } from "react";
import { Spinner } from "react-bootstrap";

type PageHeaderProps = {
    title: string;
    as?: ElementType;
    titleClassName?: string;
    className?: string;
    loading?: boolean;
    actions?: ReactNode;
};

export function PageHeader({
    title,
    as: TitleTag = "h1",
    titleClassName = "h3",
    className,
    loading = false,
    actions,
}: PageHeaderProps) {
    return (
        <div
            className={[
                "d-flex justify-content-between align-items-center mb-4",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <TitleTag className={`${titleClassName} m-0 ui-title`}>
                {title}
            </TitleTag>

            <div className="d-flex align-items-center gap-2">
                {actions}
                {loading ? <Spinner size="sm" /> : null}
            </div>
        </div>
    );
}
