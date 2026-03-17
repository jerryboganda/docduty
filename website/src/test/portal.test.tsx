import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PortalLoginRedirect from "@/components/shared/PortalLoginRedirect";
import PortalRegisterRedirect from "@/components/shared/PortalRegisterRedirect";
import { getPortalLoginUrl, getPortalOrigin, getPortalRegisterUrl } from "@/lib/portal";

describe("portal URL helpers", () => {
  it("returns localhost portal origin for localhost hostname", () => {
    expect(getPortalOrigin("localhost")).toBe("http://localhost:3000");
  });

  it("returns localhost portal origin for 127.0.0.1 hostname", () => {
    expect(getPortalOrigin("127.0.0.1")).toBe("http://127.0.0.1:3000");
  });

  it("returns production portal origin for non-local hosts", () => {
    expect(getPortalOrigin("marketing.docduty.com.pk")).toBe("https://portal.docduty.com.pk");
  });

  it("builds register URL with mode and role", () => {
    const url = new URL(getPortalRegisterUrl("doctor", "localhost"));
    expect(url.origin).toBe("http://localhost:3000");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("mode")).toBe("register");
    expect(url.searchParams.get("role")).toBe("doctor");
  });

  it("builds login URL consistently", () => {
    expect(getPortalLoginUrl("localhost")).toBe("http://localhost:3000/login");
  });
});

describe("portal redirect components", () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    replaceMock.mockReset();
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        hostname: "localhost",
        replace: replaceMock,
      },
      writable: true,
    });
  });

  it("redirects login route to portal login", () => {
    render(<PortalLoginRedirect />);
    expect(replaceMock).toHaveBeenCalledWith("http://localhost:3000/login");
  });

  it("redirects register route to portal register mode", () => {
    render(<PortalRegisterRedirect />);
    expect(replaceMock).toHaveBeenCalledWith("http://localhost:3000/login?mode=register");
  });
});
