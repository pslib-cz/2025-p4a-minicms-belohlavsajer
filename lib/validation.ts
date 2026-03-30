import { z } from "zod";

import { isValidImageSource } from "@/lib/utils";

const coverImageSchema = z
    .string()
    .trim()
    .max(500)
    .refine(
        (value) => value.length === 0 || isValidImageSource(value),
        "Obrázek musí být relativní cesta nebo http/https URL.",
    );

export const articleInputSchema = z.object({
    title: z.string().trim().min(3).max(160),
    excerpt: z.string().trim().max(240).optional().or(z.literal("")),
    content: z.string().min(20),
    coverImage: coverImageSchema.optional().or(z.literal("")),
    categoryId: z.number().int().positive().nullable(),
    tagIds: z.array(z.number().int().positive()).max(10),
});

export const statusInputSchema = z.object({
    status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const taxonomyInputSchema = z.object({
    name: z.string().trim().min(2).max(60),
});
