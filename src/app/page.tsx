import type { Metadata } from "next";
import SessionWrapper from "../components/SessionWrapper";
import "./globals.css";
import "./fontawesome";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "My Next.js App with Font Awesome",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}

