import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "diamond-f.co.jp";
      if (user.email && user.email.endsWith(`@${allowedDomain}`)) {
        return true;
      }
      return false; // アクセス拒否
    },
  },
  pages: {
    signIn: '/invite', // ログイン画面として再利用
    error: '/invite',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
