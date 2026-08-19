import { describe, expect, it } from "vitest";
import { getHomeRouteForRole } from "./roleRouting";

describe("getHomeRouteForRole", () => {
  it("routes each supported role to its home", () => {
    expect(getHomeRouteForRole("platform_admin")).toBe("/dashboard");
    expect(getHomeRouteForRole("admin")).toBe("/dashboard");
    expect(getHomeRouteForRole("trainer")).toBe("/trainer/dashboard");
    expect(getHomeRouteForRole("assistant")).toBe("/assistant/schedule");
    expect(getHomeRouteForRole("handler")).toBe("/customer/dashboard");
    expect(getHomeRouteForRole("user")).toBe("/customer/dashboard");
  });

  it("uses staff priority for multi-role accounts", () => {
    expect(getHomeRouteForRole("assistant,trainer")).toBe("/trainer/dashboard");
    expect(getHomeRouteForRole("handler,admin")).toBe("/dashboard");
  });

  it("returns no destination for a missing or unknown role", () => {
    expect(getHomeRouteForRole(null)).toBeNull();
    expect(getHomeRouteForRole("unknown")).toBeNull();
  });
});