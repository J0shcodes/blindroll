import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsmono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blindroll - Encrypted Onchain Payroll",
  description: "Encrypted payroll platform for Web3 teams and DAOs",
  generator: "Blindroll"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerObj = await headers()
  const cookies = headerObj.get("cookie")
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsmono.variable} antialiased`}
      >
        <ContextProvider cookies={cookies} >
        {children}
        </ContextProvider>
      </body>
    </html>
  );
}
