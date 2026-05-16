import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { upsertUserFromOAuth } from "@/lib/auth/user-sync";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      await upsertUserFromOAuth({
        email: user.email,
        name: user.name,
        image: user.image,
        googleId: account?.providerAccountId,
      });
      return true;
    },
    async jwt({ token, account, user }) {
      if (account?.providerAccountId) {
        token.googleId = account.providerAccountId;
      }
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        (session.user as { googleId?: string }).googleId =
          token.googleId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
