import { withAuth } from "next-auth/middleware";
import { isRouteAuthorized } from "@/lib/authorization";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => isRouteAuthorized(req.nextUrl.pathname, token),
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/preferences/:path*", "/planner/:path*", "/groceries/:path*", "/decider/:path*", "/prep-guide/:path*", "/billing/:path*", "/admin/:path*"],
};
