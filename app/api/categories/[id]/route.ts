import { NextRequest, NextResponse } from "next/server";

import { mapPrismaError, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const userIdResult = await requireUserId();
    if (userIdResult instanceof NextResponse) {
        return userIdResult;
    }

    const { id } = await context.params;
    const categoryId = Number.parseInt(id, 10);

    if (Number.isNaN(categoryId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
    });

    if (!category) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.category.delete({ where: { id: categoryId } });
    } catch (error) {
        const prismaResponse = mapPrismaError(error);

        if (prismaResponse) {
            return prismaResponse;
        }

        throw error;
    }

    return NextResponse.json({ success: true });
}
