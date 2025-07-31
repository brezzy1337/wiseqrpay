// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../api/db.ts";

export const { handlers, auth, signIn, signOut } = NextAuth({
     adapter: PrismaAdapter(prisma),
     providers: [
          Google({
               // forces Google to include a hosted domain claim
               // TODO: This seems to be apart of the OpenID Connect specifiction
               // https://developers.google.com/identity/openid-connect/openid-connect
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
          jwt: async ({ token, account, profile }) => {
               token.bussiness = profile?.hd? true : false;
               return token;
          },
          session: async ({ session, user }) => {
               session.user.id = user.id;
               return session;
          },
     },
});