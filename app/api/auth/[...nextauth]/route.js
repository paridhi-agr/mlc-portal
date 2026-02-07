import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma"

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile"
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            const authorizedUser = await prisma.authorizedUser.findUnique({
                where: { email: user.email }
            })

            if (!authorizedUser) {
                console.log(`Access denied for: ${user.email}`);
                return `/auth/access-denied?email=${encodeURIComponent(user.email)}`
            }

            try {
                const result = await prisma.user.upsert({
                    where: { email: user.email },
                    update: {
                        role: authorizedUser.role,
                        name: user.name || authorizedUser.name
                    },
                    create: {
                        email: user.email,
                        name: user.name || authorizedUser.name,
                        role: authorizedUser.role,
                        image: user.image
                    }
                });
            } catch (error) {
                console.error('❌ UPSERT FAILED:', error);
                return false;
            }

            // Auto-link Google if email matches an existing user
            if (account?.provider === "google") {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (existingUser) {
                    // Create missing account entry
                    await prisma.account.upsert({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        },
                        update: {},
                        create: {
                            userId: existingUser.id,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            type: account.type,
                            access_token: account.access_token,
                            id_token: account.id_token,
                        },
                    });
                    return true;
                }
            }

            return true;
        },
        async session({ session, user }) {
            console.log('📍 Session callback triggered');

            // Get role from whitelist
            const authorized = await prisma.authorizedUser.findUnique({
                where: { email: user.email }
            });

            // Update user role if it doesn't match whitelist
            if (authorized && user.role !== authorized.role) {
                console.log(`🔄 Fixing role: ${user.role} → ${authorized.role}`);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: authorized.role }
                });

                user.role = authorized.role; // Update in-memory too
            }

            // Add to session
            if (session?.user) {
                session.user.id = user.id;
                session.user.role = user.role;
            }

            return session;
        }
    },
    session: {
        strategy: 'database'
    },
    // pages: {
    //     signIn: '/auth/signin',
    //     error: '/auth/error',
    // },
    secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

