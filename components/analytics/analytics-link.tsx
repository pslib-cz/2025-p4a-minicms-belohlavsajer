"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";

import {
    trackSelectContent,
    type SelectContentPayload,
} from "@/lib/analytics/google-tag-manager";

type AnalyticsLinkProps = ComponentProps<typeof Link> & {
    selectContent?: SelectContentPayload;
};

export function AnalyticsLink({
    selectContent,
    onClick,
    ...props
}: AnalyticsLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        onClick?.(event);

        if (event.defaultPrevented || !selectContent) {
            return;
        }

        trackSelectContent(selectContent);
    }

    return <Link {...props} onClick={handleClick} />;
}
