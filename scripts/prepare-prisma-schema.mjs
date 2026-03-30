import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const target = process.env.DATABASE_TARGET === "postgres" ? "postgres" : "sqlite";
const sourcePath = path.join(projectRoot, "prisma", `schema.${target}.prisma`);
const destinationPath = path.join(projectRoot, "prisma", "schema.prisma");

const sourceContent = await readFile(sourcePath, "utf8");
const currentContent = await readFile(destinationPath, "utf8").catch(() => "");

if (sourceContent !== currentContent) {
    await writeFile(destinationPath, sourceContent, "utf8");
}

console.log(`Prepared Prisma schema for ${target}.`);
