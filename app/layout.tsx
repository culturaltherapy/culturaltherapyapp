import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cultural Therapy",
    template: "%s · Cultural Therapy"
  },
  description:
    "Building Lived Experience Support Systems. Find people who've been where you've been.",
  applicationName: "Cultural Therapy",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Cultural Therapy",
    statusBarStyle: "default"
  },
  icons: [
    { rel: "icon", url: "/logo.png" },
    { rel: "apple-touch-icon", url: "/logo.png" }
  ],
  openGraph: {
    title: "Cultural Therapy",
    description: "Find people who've been where you've been.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#f4ece1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-palette="earth" data-motif="subtle">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
