import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export async function requireUserId(): Promise<number | NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = Number.parseInt(session?.user?.id ?? "", 10);

    if (!session?.user?.id || Number.isNaN(userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return userId;
}

type ParsedJsonResult<T> =
    | { ok: true; data: T }
    | { ok: false; response: NextResponse };

export async function parseJsonBody<T>(
    request: NextRequest,
): Promise<ParsedJsonResult<T>> {
    try {
        return { ok: true, data: (await request.json()) as T };
    } catch {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Invalid JSON payload" },
                { status: 400 },
            ),
        };
    }
}

export function mapPrismaError(error: unknown): NextResponse | null {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        return null;
    }

    if (error.code === "P2002") {
        return NextResponse.json(
            { error: "Conflict: record already exists" },
            { status: 409 },
        );
    }

    if (error.code === "P2003") {
        return NextResponse.json(
            { error: "Invalid relation reference" },
            { status: 400 },
        );
    }

    if (error.code === "P2025") {
        return NextResponse.json(
            { error: "Record not found" },
            { status: 404 },
        );
    }

    return null;
}
