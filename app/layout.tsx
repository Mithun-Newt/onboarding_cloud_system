import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = { className: "font-sans" };

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "Student Onboarding Platform",
  description: "Staff-operated student onboarding platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
