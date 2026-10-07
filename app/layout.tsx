import type { Metadata } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next";
// Reading comfort font options. Browsers only download a font's files when someone picks it.
import "@fontsource-variable/lexend";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import { readingComfortScript } from "@/lib/reading-comfort";
import "./globals.css";
import "./everyday.css";
import "./welcome.css";
import "./companions.css";
import "./host.css";
import "./calendar.css";
import "./design-switcher.css";
import "./stillwater.css";
import "./nook.css";
import "./appearance-mixes.css";
import "./design-iterations.css";
import "./appearance-studio.css";
import "./wellbeing.css";
import "./food.css";
import "./audio-library.css";
import "./meditation.css";
import "./mic-states.css";
import "./navigation.css";
import "./companion-motion.css";
import "./typography.css";

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
    <html lang="en" suppressHydrationWarning>
      {/* Applies the saved Reading comfort choice before the first paint. */}
      <head><script dangerouslySetInnerHTML={{ __html: readingComfortScript }} /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
