export function isRouteAuthorized(pathname: string, token: { role?: string } | null | undefined) {
  if (pathname.startsWith("/admin")) {
    return token?.role === "ADMIN";
  }
  return Boolean(token);
}
