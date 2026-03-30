"use client";

import { useSyncExternalStore } from "react";

import {
    DEFAULT_ANALYTICS_CONSENT_SNAPSHOT,
    getConsentSnapshot,
    subscribeConsentSnapshot,
} from "@/lib/analytics/consent-state";

export function useAnalyticsConsent() {
    return useSyncExternalStore(
        subscribeConsentSnapshot,
        getConsentSnapshot,
        () => DEFAULT_ANALYTICS_CONSENT_SNAPSHOT,
    );
}
