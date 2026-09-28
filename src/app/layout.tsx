import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skinstric",
  description: "Sophisticated skincare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
