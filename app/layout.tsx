import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/app/components/Sidebar";
import { YouTubePlayer } from "@/app/components/YouTubePlayer";
import { PlayerProvider } from "@/app/context/PlayerContext";
import { Header } from "@/app/components/Header";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeX | Music Streaming",
  description: "Stream real music using YouTube Data API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} h-full dark`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface-container-lowest text-on-surface font-body selection:bg-primary selection:text-on-primary overflow-x-hidden min-h-screen">
        <PlayerProvider>
          <Header />
          <Sidebar />
          <div className="lg:pl-64 pt-20 pb-32 lg:pb-28">
            {children}
          </div>
          <YouTubePlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
