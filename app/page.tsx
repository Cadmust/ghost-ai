"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.push("/editor");
      } else {
        router.push("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  return null; // Redirects happen in useEffect, so we return null
}