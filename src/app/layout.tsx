import "~/styles/globals.css";
import { Inter, Geist_Mono } from 'next/font/google';

import { ClerkProvider } from '@clerk/nextjs';
import { Metadata } from "next";
import ClientWrapper from "./components/ClientWrapper";

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: "CMUCal",
  description: "A scheduling app that consolidates resources and events on campus.",
  icons: [{ rel: "icon", url: "/Favicon.png" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased dark:#0F1115`}>
          <ClientWrapper>{children}</ClientWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
