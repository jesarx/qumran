import NextAuth from "next-auth";
import { AuthConfig } from "@/auth";

export default NextAuth(AuthConfig).auth;

export const config = {
  /*
   * Only run the auth middleware on protected routes. Access control
   * (auth.ts -> authorized) only ever restricts /dashboard, so the public
   * catalog (/, /books, /authors, ...) does not need to go through NextAuth
   * on every request. Server actions still enforce auth on their own via
   * auth(), so this does not relax any protection.
   */
  matcher: ["/dashboard/:path*"],
};
