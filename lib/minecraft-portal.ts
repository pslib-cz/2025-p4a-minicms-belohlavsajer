type GuideTypeMeta = {
    key: string;
    label: string;
    eyebrow: string;
    description: string;
    ctaLabel: string;
};

const guideTypeMap: Record<string, GuideTypeMeta> = {
    Tutorial: {
        key: "tutorial",
        label: "Tutorial",
        eyebrow: "Quick Start",
        description:
            "Krátké a jasné návody pro první kroky, survival rutiny i ovládnutí základních systémů.",
        ctaLabel: "Otevřít tutorial",
    },
    Server: {
        key: "server",
        label: "Server",
        eyebrow: "Server Pick",
        description:
            "Kurátorovaný výběr serverů, herních módů a tipů, kde začít podle stylu hraní.",
        ctaLabel: "Prozkoumat server",
    },
    "Build Guide": {
        key: "build",
        label: "Build Guide",
        eyebrow: "Creative Focus",
        description:
            "Inspirace pro base layouty, tematické stavby a blokové kombinace, které vypadají čistě i ve velkém měřítku.",
        ctaLabel: "Zobrazit build",
    },
    "Farm Guide": {
        key: "farm",
        label: "Farm Guide",
        eyebrow: "Efficiency",
        description:
            "Farmy, automatizace a praktické survival setupy pro lepší resource loop bez zbytečné vaty.",
        ctaLabel: "Otevřít farmu",
    },
    Modpack: {
        key: "modpack",
        label: "Modpack",
        eyebrow: "Loadout",
        description:
            "Doporučené modpacky, co od nich čekat a pro jaký typ hráče dávají smysl.",
        ctaLabel: "Zobrazit modpack",
    },
};

const fallbackGuideType: GuideTypeMeta = {
    key: "guide",
    label: "Guide",
    eyebrow: "Portal Entry",
    description:
        "Obsahová položka portálu se zaměřením na orientaci, postup nebo doporučení.",
    ctaLabel: "Otevřít guide",
};

export function getGuideTypeMeta(categoryName?: string | null): GuideTypeMeta {
    if (!categoryName) {
        return fallbackGuideType;
    }

    return guideTypeMap[categoryName] ?? fallbackGuideType;
}

export const homepageGuideTypeHighlights = [
    {
        categoryName: "Tutorial",
        title: "Tutorialy pro rychlý start",
        description:
            "Krátké postupy, které tě pošlou rovnou do survivalu bez zbytečného scrollování.",
    },
    {
        categoryName: "Server",
        title: "Vybrané servery",
        description:
            "Přehled, kam jít podle stylu hraní, verze klienta a chuti na PvE nebo komunitní survival.",
    },
    {
        categoryName: "Build Guide",
        title: "Build inspirace",
        description:
            "Praktické layouty, materiálové kombinace a kompozice, které fungují i ve větším měřítku.",
    },
    {
        categoryName: "Farm Guide",
        title: "Farmy a efektivita",
        description:
            "Funkční survival setupy pro iron, food, trading i automatizované rutiny.",
    },
];

export const dashboardTypeHints = [
    "Tutorialy pro začátečníky a survival postupy",
    "Server entries s kurátorovaným doporučením",
    "Build a farm guidey s jasnou strukturou kroků",
];
