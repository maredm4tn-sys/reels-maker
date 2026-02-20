import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "صانع مقاطع الريلز الاحترافية",
  description: "أنشئ فيديوهات لليوتيوب والتيك توك بسهولة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} ${cairo.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
