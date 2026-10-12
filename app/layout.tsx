import type { ReactNode } from "react";
import ThemeFromQuery from "@/components/ThemeFromQuery";
import "./globals.css";

export const metadata = { title: "JENNIFER × AI showcase" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ThemeFromQuery />
        {children}
      </body>
    </html>
  );
}
