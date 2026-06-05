// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../api/prisma.ts";

export const { handlers, auth, signIn, signOut } = NextAuth({
     adapter: PrismaAdapter(prisma),
     secret: process.env.AUTH_SECRET,
     // https://next-auth.js.org/configuration/options#session
     session: {
          strategy: "database",
          maxAge: 30 * 24 * 60 * 60, // 30 days
     },
     providers: [Google],
     callbacks: {
          // Database strategy passes `user`; expose its id on the session.
          session: async ({ session, user }) => {
               session.user.id = user.id;
               return session;
          },
     },
});
