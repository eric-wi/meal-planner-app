import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith("/admin")) return token?.role === "ADMIN";
      return Boolean(token);
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/preferences/:path*", "/planner/:path*", "/groceries/:path*", "/decider/:path*", "/prep-guide/:path*", "/billing/:path*", "/admin/:path*"],
};
