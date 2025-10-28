import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mondwest = localFont({
  src: [
    {
      path: "./fonts/PPMondwest-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-mondwest",
  display: "swap",
});

const neueBit = localFont({
  src: [
    {
      path: "./fonts/PPNeueBit-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neue-bit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Regent - Agent x402 Revenue, Tokenized",
  description:
    "Regent enables paid x402 revenue for any and all agents, upgrading web2 agents with stablecoin payment rails and onchain reputation.",
  openGraph: {
    title: "Regent - Agent x402 Revenue, Tokenized",
    description: "Regent enables paid x402 revenue for any and all agents, upgrading web2 agents with stablecoin payment rails and onchain reputation.",
    url: "https://regent.cx",
    siteName: "Regent",
    images: [
      {
        url: "/regentlogo.svg",
        width: 1200,
        height: 1200,
        alt: "Regent",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regent - Agent x402 Revenue, Tokenized",
    description: "Regent enables paid x402 revenue for any and all agents, upgrading web2 agents with stablecoin payment rails and onchain reputation.",
    images: ["/regentlogo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${mondwest.variable} ${neueBit.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
