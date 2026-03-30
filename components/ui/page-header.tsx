import { ElementType, ReactNode } from "react";
import { Spinner } from "react-bootstrap";

type PageHeaderProps = {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    as?: ElementType;
    titleClassName?: string;
    className?: string;
    loading?: boolean;
    actions?: ReactNode;
};

export function PageHeader({
    title,
    eyebrow,
    subtitle,
    as: TitleTag = "h1",
    titleClassName = "h3",
    className,
    loading = false,
    actions,
}: PageHeaderProps) {
    return (
        <div
            className={[
                "page-header d-flex justify-content-between align-items-center mb-4",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div>
                {eyebrow ? <p className="portal-kicker mb-2">{eyebrow}</p> : null}
                <TitleTag className={`${titleClassName} m-0 ui-title`}>
                    {title}
                </TitleTag>
                {subtitle ? (
                    <p className="ui-subtitle page-header-subtitle mb-0 mt-2">
                        {subtitle}
                    </p>
                ) : null}
            </div>

            <div className="d-flex align-items-center gap-2">
                {actions}
                {loading ? <Spinner size="sm" /> : null}
            </div>
        </div>
    );
}
