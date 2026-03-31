const HARDCODED_CLARITY_PROJECT_ID = "w4371ncx8v";

export function getConfiguredGtmId() {
    return process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
}

export function getConfiguredClarityProjectId() {
    return (
        process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ??
        HARDCODED_CLARITY_PROJECT_ID
    );
}
