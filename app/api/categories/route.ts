import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { taxonomyInputSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api";

export async function GET() {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const body = await request.json();
    const parsed = taxonomyInputSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const category = await prisma.category.upsert({
        where: { name: parsed.data.name },
        update: {},
        create: { name: parsed.data.name },
    });

    return NextResponse.json(category, { status: 201 });
}
