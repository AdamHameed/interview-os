import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { db } from "@/lib/db";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";
import type { CommandIndexItem } from "@/components/command-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Interview OS",
    template: "%s · Interview OS",
  },
  description:
    "A personal technical interview training platform for serious SWE and quant-dev preparation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const problemIndex = (await db.problem.findMany({
    select: { slug: true, title: true, type: true },
    orderBy: { title: "asc" },
  })) as CommandIndexItem[];

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <TopBar problems={problemIndex} />
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
