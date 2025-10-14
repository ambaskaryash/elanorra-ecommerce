import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Ensure this route runs on the Node.js runtime since Prisma adapter
// does not support the Edge runtime.
export const runtime = "nodejs";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

