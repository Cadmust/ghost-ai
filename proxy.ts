import { clerkMiddleware } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
// Using existing Clerk env vars for sign-in and sign-up paths
const isPublicRoute = clerkMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/editor",
    "/api/webhook/clerk",
    "/api/webhooks/*",
  ],
});

export default isPublicRoute;