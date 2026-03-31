"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAnalyticsConsent } from "@/components/analytics/use-analytics-consent";
import { getConfiguredClarityProjectId } from "@/lib/analytics/config";
import {
    updateClarityConsentMode,
    type ClarityFn,
} from "@/lib/analytics/consent-state";
import { isPublicAnalyticsPath } from "@/lib/analytics/public-routes";

const CLARITY_SCRIPT_ID = "microsoft-clarity-tag";

declare global {
    interface Window {
        __clarityProjectId?: string;
    }
}

function injectClarity(projectId: string) {
    if (!window.clarity) {
        const clarityQueue: ClarityFn = (...args: unknown[]) => {
            clarityQueue.q = clarityQueue.q ?? [];
            clarityQueue.q.push(args);
        };

        window.clarity = clarityQueue;
    }

    const existingScript = document.getElementById(CLARITY_SCRIPT_ID);
    if (existingScript) {
        return;
    }

    const script = document.createElement("script");
    script.id = CLARITY_SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
    if (!firstScript?.parentNode) {
        document.head.appendChild(script);
    }

    window.__clarityProjectId = projectId;
}

export function ClarityProvider() {
    const pathname = usePathname();
    const { clarityAccepted } = useAnalyticsConsent();
    const projectId = getConfiguredClarityProjectId();

    useEffect(() => {
        if (!projectId) {
            return;
        }

        if (!isPublicAnalyticsPath(pathname)) {
            updateClarityConsentMode(false);
            return;
        }

        if (window.__clarityProjectId !== projectId) {
            injectClarity(projectId);
        }

        updateClarityConsentMode(clarityAccepted);
    }, [pathname, projectId, clarityAccepted]);

    return null;
}
