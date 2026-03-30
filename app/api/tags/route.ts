import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { taxonomyInputSchema } from "@/lib/validation";
import { mapPrismaError, parseJsonBody, requireUserId } from "@/lib/api";

export async function GET() {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const bodyResult = await parseJsonBody<unknown>(request);

    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    const parsed = taxonomyInputSchema.safeParse(bodyResult.data);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }

    try {
        const tag = await prisma.tag.upsert({
            where: { name: parsed.data.name },
            update: {},
            create: { name: parsed.data.name },
        });

        return NextResponse.json(tag);
    } catch (error) {
        const prismaResponse = mapPrismaError(error);

        if (prismaResponse) {
            return prismaResponse;
        }

        throw error;
    }
}
