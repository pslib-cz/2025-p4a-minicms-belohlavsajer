import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["error", "warn"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

const RETRYABLE_PRISMA_CODES = new Set(["P1001"]);

function isRetryablePrismaError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return true;
    }

    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        RETRYABLE_PRISMA_CODES.has(error.code)
    ) {
        return true;
    }

    return false;
}

function wait(delayMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs);
    });
}

type PrismaRetryOptions = {
    attempts?: number;
    initialDelayMs?: number;
    label?: string;
};

export async function withPrismaRetry<T>(
    operation: () => Promise<T>,
    {
        attempts = 3,
        initialDelayMs = 250,
        label = "Prisma operation",
    }: PrismaRetryOptions = {},
) {
    let attempt = 0;

    while (attempt < attempts) {
        try {
            return await operation();
        } catch (error) {
            attempt += 1;

            if (!isRetryablePrismaError(error) || attempt >= attempts) {
                throw error;
            }

            const delayMs = initialDelayMs * attempt;
            console.warn(
                `${label} failed with a transient database error, retrying in ${delayMs}ms.`,
                error,
            );
            await wait(delayMs);
        }
    }

    throw new Error(`${label} exhausted retry attempts.`);
}

export function isPrismaConnectionError(error: unknown) {
    return isRetryablePrismaError(error);
}
