import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|sandbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
