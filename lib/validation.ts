import { z } from "zod";

export const articleInputSchema = z.object({
    title: z.string().min(3).max(160),
    excerpt: z.string().max(240).optional().or(z.literal("")),
    content: z.string().min(20),
    categoryId: z.number().int().positive().nullable(),
    tagIds: z.array(z.number().int().positive()).max(10),
});

export const statusInputSchema = z.object({
    status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const taxonomyInputSchema = z.object({
    name: z.string().min(2).max(60),
});
