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

    const categories = await Promise.all(
        ["Tech", "Business", "Lifestyle"].map((name) =>
            prisma.category.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        ),
    );

    const tags = await Promise.all(
        ["Next.js", "Prisma", "SEO", "React", "TypeScript"].map((name) =>
            prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        ),
    );

    await prisma.article.upsert({
        where: { slug: "jak-postavit-cms-v-nextjs" },
        update: {
            title: "Jak postavit CMS v Next.js",
            excerpt: "Kompletni workflow od auth az po SEO metadata.",
            content:
                "<p>Toto je ukazkovy publikovany clanek. Obsahuje HTML z WYSIWYG editoru.</p><p>Umoznuje otestovat public list, detail i metadata.</p>",
            status: ArticleStatus.PUBLISHED,
            publishedAt: new Date(),
            authorId: user.id,
            categoryId: categories[0].id,
            tags: {
                set: [
                    { id: tags[0].id },
                    { id: tags[1].id },
                    { id: tags[2].id },
                ],
            },
        },
        create: {
            slug: "jak-postavit-cms-v-nextjs",
            title: "Jak postavit CMS v Next.js",
            excerpt: "Kompletni workflow od auth az po SEO metadata.",
            content:
                "<p>Toto je ukazkovy publikovany clanek. Obsahuje HTML z WYSIWYG editoru.</p><p>Umoznuje otestovat public list, detail i metadata.</p>",
            status: ArticleStatus.PUBLISHED,
            publishedAt: new Date(),
            authorId: user.id,
            categoryId: categories[0].id,
            tags: {
                connect: [
                    { id: tags[0].id },
                    { id: tags[1].id },
                    { id: tags[2].id },
                ],
            },
        },
    });

    await prisma.article.upsert({
        where: { slug: "muj-prvni-draft" },
        update: {
            title: "Muj prvni draft",
            excerpt: "Rozpracovany interni obsah.",
            content:
                "<p>Tento clanek je ve stavu draft a je viditelny pouze v dashboardu.</p>",
            status: ArticleStatus.DRAFT,
            publishedAt: null,
            authorId: user.id,
            categoryId: categories[1].id,
            tags: {
                set: [{ id: tags[3].id }, { id: tags[4].id }],
            },
        },
        create: {
            slug: "muj-prvni-draft",
            title: "Muj prvni draft",
            excerpt: "Rozpracovany interni obsah.",
            content:
                "<p>Tento clanek je ve stavu draft a je viditelny pouze v dashboardu.</p>",
            status: ArticleStatus.DRAFT,
            authorId: user.id,
            categoryId: categories[1].id,
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[4].id }],
            },
        },
    });

    console.log({ user: user.username, password: "password123" });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
