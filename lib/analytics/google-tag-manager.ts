import { isPublicAnalyticsPath } from "@/lib/analytics/public-routes";
import { hasGtmConsent } from "@/lib/analytics/consent-state";

export type SelectContentPayload = {
    contentType: string;
    contentId: string;
    contentName?: string;
};

type DataLayerEvent = Record<string, unknown>;

function getDataLayer() {
    if (typeof window === "undefined") {
        return null;
    }

    window.dataLayer = window.dataLayer ?? [];

    return window.dataLayer;
}

function pushDataLayerEvent(event: DataLayerEvent) {
    const dataLayer = getDataLayer();

    if (!dataLayer) {
        return;
    }

    dataLayer.push(event);
}

export function trackSelectContent({
    contentType,
    contentId,
    contentName,
}: SelectContentPayload) {
    if (typeof window === "undefined") {
        return;
    }

    if (!isPublicAnalyticsPath(window.location.pathname)) {
        return;
    }

    if (!hasGtmConsent()) {
        return;
    }

    pushDataLayerEvent({
        event: "select_content",
        content_type: contentType,
        content_id: contentId,
        ...(contentName ? { content_name: contentName } : {}),
    });
}
