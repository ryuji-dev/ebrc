import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://ebrc.vercel.app'),
  title: "EBRC | 에스라성경통독사경회",
  description: "총신대학교 성경통독 동아리 EBRC를 위한 성경통독 관리 앱",
  openGraph: {
    title: "EBRC | 에스라성경통독사경회",
    description: "총신대학교 성경통독 동아리 EBRC를 위한 성경통독 관리 앱",
    images: [
      {
        url: "/og-image-v1.png",
        width: 1200,
        height: 630,
        alt: "총신대학교 EBRC",
      },
    ],
    type: "website",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
