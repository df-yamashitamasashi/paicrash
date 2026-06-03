import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/invite", // Redirect to login page if unauthenticated
  },
});

export const config = {
  matcher: [
    // すべてのパスをマッチ（APIや静的ファイルはNext.jsが自動的に除外するケースもあるが、安全のため）
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
