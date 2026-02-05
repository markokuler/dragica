import type { Metadata } from "next";
import { Source_Sans_3, DM_Serif_Display, Geist_Mono } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-dm-serif",
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
        className={`${sourceSans.variable} ${dmSerif.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
