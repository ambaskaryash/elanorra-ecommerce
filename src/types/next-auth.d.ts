import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isAdmin?: boolean;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    isAdmin?: boolean;
    password?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  }
}