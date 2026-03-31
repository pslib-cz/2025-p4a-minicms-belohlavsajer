"use client";

import { usePathname } from "next/navigation";

import { useAnalyticsConsent } from "@/components/analytics/use-analytics-consent";
import { openCookiePreferences } from "@/lib/analytics/consent-state";
import { isPublicAnalyticsPath } from "@/lib/analytics/public-routes";

export function CookiePreferencesButton() {
    const pathname = usePathname();
    const { initialized, consentDefined } = useAnalyticsConsent();
    const hasConsentUi = Boolean(
        process.env.NEXT_PUBLIC_GTM_ID?.trim() ||
            process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ||
            process.env.NODE_ENV !== "production",
    );

    if (!hasConsentUi || !initialized || !isPublicAnalyticsPath(pathname)) {
        return null;
    }

    return (
        <button
            type="button"
            className="cookie-preferences-button"
            onClick={openCookiePreferences}
        >
            {consentDefined ? "Nastavení cookies" : "Volba cookies"}
        </button>
    );
}
