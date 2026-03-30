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
    const tagId = Number.parseInt(id, 10);

    if (Number.isNaN(tagId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        select: { id: true },
    });

    if (!tag) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await prisma.tag.delete({ where: { id: tagId } });
    } catch (error) {
        const prismaResponse = mapPrismaError(error);

        if (prismaResponse) {
            return prismaResponse;
        }

        throw error;
    }

    return NextResponse.json({ success: true });
}
