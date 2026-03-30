import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
    username: z.string().min(2),
    password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(rawCredentials) {
                const parsed = credentialsSchema.safeParse(rawCredentials);

                if (!parsed.success) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { username: parsed.data.username },
                });

                if (!user) {
                    return null;
                }

                const isValid = await bcrypt.compare(
                    parsed.data.password,
                    user.passwordHash,
                );

                if (!isValid) {
                    return null;
                }

                return {
                    id: String(user.id),
                    name: user.username,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) {
                token.userId = user.id;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token.userId) {
                session.user.id = token.userId;
            }

            return session;
        },
    },
};

export async function getOptionalServerSession(): Promise<Session | null> {
    try {
        return await getServerSession(authOptions);
    } catch (error) {
        console.error("Failed to resolve server session.", error);
        return null;
    }
}
