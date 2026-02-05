import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
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
        className={`${montserrat.variable} ${cormorant.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
