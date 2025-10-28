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
  title: "x402 AI Starter Kit",
  description:
    "A demo of agentic payments powered by x402 using Next.js, AI SDK, AI Elements, AI Gateway, and the Coinbase CDP",
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
