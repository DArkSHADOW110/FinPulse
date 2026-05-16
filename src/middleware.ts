export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/send/:path*",
    "/receive/:path*",
    "/transactions/:path*",
    "/bills/:path*",
    "/topup/:path*",
    "/jars/:path*",
    "/contacts/:path*",
    "/schedules/:path*",
    "/insights/:path*",
    "/api/accounts/:path*",
    "/api/transactions/:path*",
    "/api/transfers/:path*",
    "/api/bills/:path*",
    "/api/topup/:path*",
    "/api/jars/:path*",
    "/api/contacts/:path*",
    "/api/scheduled-payments/:path*",
    "/api/chat/:path*",
    "/api/expense-analysis/:path*",
  ],
};
