import type { Metadata } from "next";
import "./globals.css";
import { DemoBanner } from "@/components/demo-banner";

export const metadata: Metadata = {
  title: "STASH — Turn saves into action",
  description:
    "Transform your Instagram saved posts into a searchable personal library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
