import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

// Using Outfit for display as well (bold weight)
// Clash Display would be ideal but needs local font file
const clashDisplay = Outfit({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-clash",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dragica - Salon Management",
  description: "Professional salon management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body
        className={`${outfit.variable} ${clashDisplay.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
