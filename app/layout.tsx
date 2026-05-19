import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Override Clerk appearance variables with app's CSS variables
const appearance = {
  ...dark,
  variables: {
    ...dark.variables,
    fontFamily: "var(--font-sans)",
    backgroundColor: "var(--background)",
    foregroundColor: "var(--foreground)",
    primaryColor: "#00c8d4",
    primaryForegroundColor: "#080809",
    secondaryColor: "var(--secondary)",
    secondaryForegroundColor: "var(--secondary-foreground)",
    mutedColor: "var(--muted)",
    mutedForegroundColor: "var(--muted-foreground)",
    accentColor: "#00c8d4",
    accentForegroundColor: "#080809",
    destructiveColor: "var(--destructive)",
    borderColor: "var(--border)",
    inputColor: "var(--input)",
    ringColor: "var(--ring)",
  },
};

export const metadata: Metadata = {
  title: "Ghost AI - Design Systems at the Speed of Thought",
  description: "Collaborative real-time system design workspace powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={appearance}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}