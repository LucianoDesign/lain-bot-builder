import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/", "/builder"]
const AUTH_PATHS = ["/login", "/register"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for Better Auth session cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token")

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p))
  )
  const isAuthPath = AUTH_PATHS.includes(pathname)

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthPath && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
