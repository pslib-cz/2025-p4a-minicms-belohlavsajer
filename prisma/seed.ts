import { PrismaClient, ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("password123", 10);

    const user = await prisma.user.upsert({
        where: { username: "test" },
        update: {
            passwordHash,
        },
        create: {
            username: "test",
            passwordHash,
        },
    });

    const categoryNames = [
        "Tutorial",
        "Server",
        "Build Guide",
        "Farm Guide",
        "Modpack",
    ];

    const categories = await Promise.all(
        categoryNames.map((name) =>
            prisma.category.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        ),
    );

    const categoryMap = new Map(categories.map((category) => [category.name, category]));

    const tagNames = [
        "Java",
        "Bedrock",
        "Survival",
        "Creative",
        "Hardcore",
        "Redstone",
        "Beginner",
        "Advanced",
        "1.21",
        "Multiplayer",
    ];

    const tags = await Promise.all(
        tagNames.map((name) =>
            prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        ),
    );

    const tagMap = new Map(tags.map((tag) => [tag.name, tag]));

    const entries = [
        {
            slug: "survival-prvnich-10-minut",
            title: "Survival: prvních 10 minut bez chaosu",
            excerpt:
                "Rychlý onboarding guide pro dřevo, stone tools, jídlo a první bezpečný přístřešek.",
            content:
                "<p>Tenhle guide je určený pro hráče, kteří chtějí po spuštění světa rychle přejít od spawn pointu k bezpečnému survival loopu.</p><h2>Co udělat jako první</h2><ul><li>Nasbírej dřevo a craftni crafting table.</li><li>Vyrob stone pickaxe, axe a furnace.</li><li>Zajisti jídlo a světlo ještě před první nocí.</li></ul><h2>Proč tenhle postup funguje</h2><p>Místo chaotického běhání kolem spawnu máš během pár minut stabilní základ, ze kterého můžeš jít do dolu, začít trade loop nebo připravit první farmu.</p>",
            status: ArticleStatus.PUBLISHED,
            publishDate: new Date("2026-03-10T08:00:00.000Z"),
            categoryName: "Tutorial",
            tagNames: ["Java", "Survival", "Beginner", "1.21"],
            coverImage: "/covers/starter-camp.svg",
        },
        {
            slug: "nejlepsi-ceske-survival-servery",
            title: "Nejlepší survival servery pro komunitní start",
            excerpt:
                "Výběr server entries podle stylu hraní, přístupnosti a toho, jak rychle se dá zapadnout do aktivní komunity.",
            content:
                "<p>Server entry není jen seznam IP adres. Cílem je vysvětlit, pro jaký typ hráče server dává smysl, jaký má rytmus a kde bude onboarding nejméně bolestivý.</p><h2>Na co koukat</h2><ul><li>Verze klienta a podpora Java nebo Bedrock.</li><li>Pravidla griefingu a ekonomiky.</li><li>Jak aktivní je komunita a moderace.</li></ul><p>Pokud chceš survival s dlouhým horizontem, hledej stabilní mapu, dobrý onboarding a přehledný Discord ekosystém.</p>",
            status: ArticleStatus.PUBLISHED,
            publishDate: new Date("2026-03-12T10:30:00.000Z"),
            categoryName: "Server",
            tagNames: ["Java", "Survival", "Multiplayer", "Beginner"],
            coverImage: "/covers/server-hub.svg",
        },
        {
            slug: "medieval-base-z-kamene-a-smrku",
            title: "Medieval base z kamene a smrku",
            excerpt:
                "Build guide pro středně velkou survival základnu s čistou siluetou, kontrastem materiálů a prostorovou rezervou pro expanzi.",
            content:
                "<p>Tahle stavba funguje, pokud chceš rychle postavit základnu, která nepůsobí jako kostka z prvních dvou stacků cobblu.</p><h2>Materiálový mix</h2><ul><li>Stone bricks na nosné linie.</li><li>Spruce logs a trapdoors pro rytmus fasády.</li><li>Lanterny pro teplé světlo a čitelný večerní kontrast.</li></ul><p>Klíčem je rozdělit hmotu střechy, nevytvářet ploché stěny a myslet na průhledy už při základním layoutu.</p>",
            status: ArticleStatus.PUBLISHED,
            publishDate: new Date("2026-03-15T09:15:00.000Z"),
            categoryName: "Build Guide",
            tagNames: ["Creative", "Survival", "Advanced", "1.21"],
            coverImage: "/covers/build-atlas.svg",
        },
        {
            slug: "iron-farma-bez-zbytecne-komplikace",
            title: "Iron farma bez zbytečné komplikace",
            excerpt:
                "Farm guide zaměřený na jednoduchou a stabilní iron farmu pro early až mid game survival.",
            content:
                "<p>Iron je bottleneck pro hoppers, rails i redstone utility. Cílem je mít farmu, která se dá postavit rychle a není přestřelená na počet bloků.</p><h2>Checklist</h2><ul><li>Vyber plochu mimo hlavní village traffic.</li><li>Udrž villagery i zombie pathing pod kontrolou.</li><li>Testuj spawn platformu dřív, než uzavřeš dekorativní shell.</li></ul><p>Jakmile farma běží stabilně, můžeš ji obalit buildovým pláštěm a propojit s hlavní základnou.</p>",
            status: ArticleStatus.PUBLISHED,
            publishDate: new Date("2026-03-18T07:45:00.000Z"),
            categoryName: "Farm Guide",
            tagNames: ["Java", "Survival", "Redstone", "Advanced"],
            coverImage: "/covers/farm-loop.svg",
        },
        {
            slug: "modpacky-ktere-nezahltia-prvni-vecer",
            title: "Modpacky, které tě nezahltí první večer",
            excerpt:
                "Výběr modpacků pro hráče, kteří chtějí nový loop a lepší quality of life bez totálního přetížení systému i hlavy.",
            content:
                "<p>Ne každý modpack musí být 200hodinový závazek. Tenhle entry typ slouží jako rychlá orientace v tom, co je vhodné pro pohodový začátek a co už chce zkušenější hráče.</p><h2>Jak vybírat</h2><ul><li>Počet modů a nároky na klienta.</li><li>Jestli modpack mění combat, progression nebo ekonomiku.</li><li>Jak rychle se v něm dá zorientovat bez wiki rabbit hole.</li></ul><p>Nejlepší start je vždy modpack, který má čitelný early game a netrestá hráče za každé špatné rozhodnutí.</p>",
            status: ArticleStatus.PUBLISHED,
            publishDate: new Date("2026-03-20T11:00:00.000Z"),
            categoryName: "Modpack",
            tagNames: ["Java", "Beginner", "Advanced", "1.21"],
            coverImage: "/covers/modpack-lab.svg",
        },
        {
            slug: "draft-nether-hub-plan",
            title: "Draft: Nether hub layout pro rychlou logistiku",
            excerpt:
                "Interní draft pro budoucí guide o propojení hlavních lokací přes čistý nether transit systém.",
            content:
                "<p>Tento draft je neveřejný a slouží jen pro dashboard flow. Obsah připravuje strukturu guideu, který později vysvětlí rozvržení portálů, osu chodeb a orientaci mezi základnou, farmami a trading zónou.</p>",
            status: ArticleStatus.DRAFT,
            publishDate: null,
            categoryName: "Build Guide",
            tagNames: ["Survival", "Advanced", "Multiplayer"],
            coverImage: "/covers/build-atlas.svg",
        },
    ];

    for (const entry of entries) {
        const category = categoryMap.get(entry.categoryName);

        if (!category) {
            throw new Error(`Missing category ${entry.categoryName}`);
        }

        const connectedTags = entry.tagNames.map((name) => {
            const tag = tagMap.get(name);

            if (!tag) {
                throw new Error(`Missing tag ${name}`);
            }

            return { id: tag.id };
        });

        await prisma.article.upsert({
            where: { slug: entry.slug },
            update: {
                title: entry.title,
                excerpt: entry.excerpt,
                content: entry.content,
                status: entry.status,
                publishDate: entry.publishDate,
                authorId: user.id,
                categoryId: category.id,
                coverImage: entry.coverImage,
                tags: {
                    set: connectedTags,
                },
            },
            create: {
                slug: entry.slug,
                title: entry.title,
                excerpt: entry.excerpt,
                content: entry.content,
                status: entry.status,
                publishDate: entry.publishDate,
                authorId: user.id,
                categoryId: category.id,
                coverImage: entry.coverImage,
                tags: {
                    connect: connectedTags,
                },
            },
        });
    }

    console.log({ user: user.username });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
