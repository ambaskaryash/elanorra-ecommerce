import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Conditionally import prisma to avoid build-time initialization
let prisma: any;
let PrismaAdapter_: any;

if (process.env.DATABASE_URL) {
  const { prisma: prismaClient } = require("@/lib/prisma");
  const { PrismaAdapter: PrismaAdapterImport } = require("@next-auth/prisma-adapter");
  prisma = prismaClient;
  PrismaAdapter_ = PrismaAdapterImport;
} else {
  // Mock adapter for build time
  PrismaAdapter_ = () => ({
    createUser: () => Promise.resolve(null),
    getUser: () => Promise.resolve(null),
    getUserByEmail: () => Promise.resolve(null),
    getUserByAccount: () => Promise.resolve(null),
    updateUser: () => Promise.resolve(null),
    deleteUser: () => Promise.resolve(null),
    linkAccount: () => Promise.resolve(null),
    unlinkAccount: () => Promise.resolve(null),
    createSession: () => Promise.resolve(null),
    getSessionAndUser: () => Promise.resolve(null),
    updateSession: () => Promise.resolve(null),
    deleteSession: () => Promise.resolve(null),
    createVerificationToken: () => Promise.resolve(null),
    useVerificationToken: () => Promise.resolve(null),
  });
  prisma = {
    user: {
      findUnique: () => Promise.resolve(null),
    }
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter_(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            return null;
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("Please verify your email before signing in");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isAdmin: user.isAdmin,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Dynamic based on environment
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).phone = token.phone;
      }
      return session;
    }
  }
};