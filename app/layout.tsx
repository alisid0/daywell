import type { Metadata } from "next";
import "./globals.css";
import "./everyday.css";
import "./welcome.css";

export const metadata: Metadata = {
  title: "Daywell — Your day, in balance",
  description: "Your personal space for focus, food, sleep, movement and a better everyday.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
