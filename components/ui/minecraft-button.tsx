import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { AnalyticsLink } from "@/components/analytics/analytics-link";
import type { SelectContentPayload } from "@/lib/analytics/google-tag-manager";

type MinecraftVariant = "primary" | "secondary" | "clear";

type MinecraftButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
    className?: string;
    variant?: MinecraftVariant;
    block?: boolean;
    small?: boolean;
};

type MinecraftLinkButtonProps = Omit<ComponentProps<typeof Link>, "children"> & {
    children: ReactNode;
    className?: string;
    variant?: MinecraftVariant;
    block?: boolean;
    small?: boolean;
    disabled?: boolean;
    fullReload?: boolean;
    selectContent?: SelectContentPayload;
};

type MinecraftButtonLabelProps = {
    children: ReactNode;
    className?: string;
    variant?: MinecraftVariant;
    block?: boolean;
    small?: boolean;
    disabled?: boolean;
};

function buildMinecraftUtilityClassName(
    className?: string,
    block?: boolean,
    small?: boolean,
    disabled?: boolean,
) {
    return [
        block ? "mc-button-block" : "",
        small ? "mc-button-small" : "",
        disabled ? "Button_disabled" : "",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");
}

export function MinecraftButton({
    children,
    className,
    variant = "secondary",
    block,
    small,
    disabled,
    ...props
}: MinecraftButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={[
                "Button",
                `Button_${variant}`,
                buildMinecraftUtilityClassName(
                    className,
                    block,
                    small,
                    disabled,
                ),
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <span className="ButtonText">{children}</span>
        </button>
    );
}

export function MinecraftLinkButton({
    href,
    children,
    className,
    variant = "secondary",
    block,
    small,
    disabled,
    fullReload,
    selectContent,
    ...props
}: MinecraftLinkButtonProps) {
    const utilityClassName = buildMinecraftUtilityClassName(
        `mc-link-button ${className ?? ""}`.trim(),
        block,
        small,
        disabled,
    );
    const buttonClassName = ["Button", `Button_${variant}`, utilityClassName]
        .filter(Boolean)
        .join(" ");

    if (disabled) {
        return (
            <span className={buttonClassName} aria-disabled="true">
                <span className="ButtonText">{children}</span>
            </span>
        );
    }

    if (fullReload) {
        return (
            <a href={href.toString()} className={buttonClassName}>
                <span className="ButtonText">{children}</span>
            </a>
        );
    }

    if (selectContent) {
        return (
            <AnalyticsLink
                href={href}
                {...props}
                className={buttonClassName}
                selectContent={selectContent}
            >
                <span className="ButtonText">{children}</span>
            </AnalyticsLink>
        );
    }

    return (
        <Link href={href} {...props} className={buttonClassName}>
            <span className="ButtonText">{children}</span>
        </Link>
    );
}

export function MinecraftButtonLabel({
    children,
    className,
    variant = "secondary",
    block,
    small,
    disabled,
}: MinecraftButtonLabelProps) {
    return (
        <span
            className={[
                "Button",
                `Button_${variant}`,
                buildMinecraftUtilityClassName(
                    `mc-button-static ${className ?? ""}`.trim(),
                    block,
                    small,
                    disabled,
                ),
            ]
                .filter(Boolean)
                .join(" ")}
            aria-disabled={disabled ? "true" : undefined}
        >
            <span className="ButtonText">{children}</span>
        </span>
    );
}
