import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSD201 Lab — Trực quan hóa cấu trúc dữ liệu",
  description:
    "Sân chơi cấu trúc dữ liệu tương tác cho CSD201. Animation linked list, stack, queue, tree, heap — học qua trực quan.",
  keywords: [
    "CSD201",
    "Cấu trúc dữ liệu",
    "Linked List",
    "Stack",
    "Queue",
    "Binary Tree",
    "AVL",
    "Heap",
    "Trực quan hóa",
  ],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
