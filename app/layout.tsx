import type { Metadata, Viewport } from "next";
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
import "./about-you.css";
import "./sleep-sounds.css";
import "./ai-report.css";
import "./sign-in.css";
import "./food.css";
import "./kitchen.css";
import "./areas.css";
import "./move-guides.css";
import "./move.css";
import "./assistant.css";
import "./capture.css";
import "./audio-library.css";
import "./meditation.css";
import "./mic-states.css";
import "./navigation.css";
import "./bottom-menu.css";
import "./companion-motion.css";
import "./typography.css";
import "./time-wheels.css";
import "./personality.css";

export const metadata: Metadata = {
  title: "Daywell — Your day, in balance",
  description: "Your personal space for focus, food, sleep, movement and a better everyday.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  // The web app (docs/web-app.md): added to a phone's home screen, Daywell opens full screen with its own icon.
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Daywell", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fae7ef",
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
