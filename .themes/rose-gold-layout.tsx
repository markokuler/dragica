import type { Metadata } from "next";
import { Lato, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
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
        className={`${lato.variable} ${playfair.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
