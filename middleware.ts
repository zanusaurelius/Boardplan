import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { SESSION_COOKIE } from "@/lib/session";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, uuidv4(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 48,
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
