export type AppHomeRoute = "/dashboard" | "/trainer/dashboard" | "/assistant/schedule" | "/customer/dashboard";

export function getHomeRouteForRole(role: string | null): AppHomeRoute | null {
  const roles = role?.split(",") ?? [];

  if (roles.includes("platform_admin") || roles.includes("admin")) return "/dashboard";
  if (roles.includes("trainer")) return "/trainer/dashboard";
  if (roles.includes("assistant")) return "/assistant/schedule";
  if (roles.includes("handler") || roles.includes("user")) return "/customer/dashboard";

  return null;
}