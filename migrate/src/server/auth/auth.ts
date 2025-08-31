// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authPrisma } from "../api/db.ts";

export const { handlers, auth, signIn, signOut } = NextAuth({
     adapter: PrismaAdapter(authPrisma),
     secret: process.env.AUTH_SECRET,
     // https://next-auth.js.org/configuration/options#session
     session: {
          strategy: "database",
          maxAge: 15 * 60, // 15 minutes - sessions expire after 15 minutes
          updateAge: 5 * 60, // refresh if session is older than 5 minutes
     },
     providers: [
          Google({
               // forces Google to include a hosted domain claim
               // TODO: This seems to be apart of the OpenID Connect specifiction
               // https://developers..com/identity/openid-connect/openid-connect
               // hostedDomain: '*',
               // optional: request the directory scope for a hard proof
               authorization: {
                    params: {
                         scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/admin.directory.user.readonly',
                    },
               },
          })
     ],
     callbacks: {
          // Database Strategy Callback
          signIn: async ({ user, account, profile }) => {
               if (account?.provider === "google") {
                    // Update user record with business status based on Google hosted domain
                    const business = profile?.hd ? true : false;
                    await authPrisma.user.update({
                         where: { id: user.id },
                         data: { isBusiness: business }
                    });
               }
               return true;
          },
          // Browser Session Cookie
          /*
          /  session.user.id – primary key you’ll pass to tRPC calls.
          / session.user.name, email, image.
          / Light Boolean flags (isBusiness, hasCompletedOnboarding).
          /Never provider access_token, refresh_token, database primary keys other than the user’s own ID, or payment identifiers.
          */
          session: async ({ session, user }) => {
               // Database strategy uses user object instead of token
               session.user.id = user.id;
               // For database strategy, business status should be stored in user table
               // You'll need to add 'business' field to your User model in Prisma
               session.bussiness = (user as any).isBusiness ?? false;
               return session;
          },
     },
});