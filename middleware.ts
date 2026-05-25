import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to auth sign out and password change API
    if (path === "/api/auth/signout" || path === "/api/staff/change-password") {
      return NextResponse.next();
    }

    // Redirect to change-password if mustChangePassword is true
    if (token?.mustChangePassword && path !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    const roles = (token?.roles ?? []) as string[];
    const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
    const isTransportStaff = roles.includes("TRANSPORT_STAFF");
    const isCashier = roles.includes("CASHIER");
    const isAdmissionStaff = roles.includes("ADMISSION_STAFF");
    const isReadOnly = roles.includes("READ_ONLY_MANAGEMENT");

    if (isSysAdminOrTic) {
      return NextResponse.next();
    }

    if (isTransportStaff) {
      // TRANSPORT_STAFF can only access admissions list or detail page, and change-password
      if (!path.startsWith("/admissions") && path !== "/change-password") {
        return NextResponse.redirect(new URL("/admissions", req.url));
      }
      return NextResponse.next();
    }

    if (isCashier) {
      // CASHIER cannot see documents, reports, settings, registrations/new, registrations/[id]/edit
      if (
        path.startsWith("/documents") ||
        path.startsWith("/reports") ||
        path.startsWith("/settings") ||
        path === "/registrations/new" ||
        (path.startsWith("/registrations/") && path.endsWith("/edit"))
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (isReadOnly) {
      // READ_ONLY_MANAGEMENT cannot see settings, registrations/new, registrations/[id]/edit
      if (
        path.startsWith("/settings") ||
        path === "/registrations/new" ||
        (path.startsWith("/registrations/") && path.endsWith("/edit"))
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (isAdmissionStaff) {
      // ADMISSION_STAFF cannot see settings
      if (path.startsWith("/settings")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|storage|logo).*)",
  ],
};
