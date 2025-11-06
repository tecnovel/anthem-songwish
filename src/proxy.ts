import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy-based replacement for the deprecated `middleware.ts` convention.
 * Keeps the same basic-auth guard for `/admin` and `/api/admin` paths and
 * preserves the diagnostic `x-middleware-run` header for testing.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminPath) {
    return NextResponse.next();
  }

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    console.warn(
      "ADMIN_USER or ADMIN_PASSWORD not set. Allowing access without auth."
    );
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    const resp = new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
    resp.headers.set("x-middleware-run", "1");
    return resp;
  }

  const base64Credentials = authHeader.split(" ")[1] ?? "";

  const decodeCredentials = (value: string): string => {
    if (typeof atob === "function") {
      return atob(value);
    }

    return Buffer.from(value, "base64").toString("utf-8");
  };

  let decoded = "";

  try {
    decoded = decodeCredentials(base64Credentials);
  } catch (error) {
    console.error("Failed to decode auth credentials", error);
    const resp = new NextResponse("Invalid authentication header", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
    resp.headers.set("x-middleware-run", "1");
    return resp;
  }

  const separatorIndex = decoded.indexOf(":");

  const user = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : "";
  const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

  if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
    const resp = NextResponse.next();
    resp.headers.set("x-middleware-run", "1");
    return resp;
  }

  const resp = new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area"',
    },
  });
  resp.headers.set("x-middleware-run", "1");
  return resp;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
