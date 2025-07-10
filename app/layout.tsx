import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

import { auth } from "@/auth"
import DashboardNavbar from "@/components/dashboard-navbar";
import Footer from "@/components/footer";

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
    template: '%s | Pirateca.com',
    default: 'Pirateca.com'
  },
  description: "Los libros no se roban, ¡se expropian!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />

          <main className="w-full flex flex-col bg-gray-100">

            {isAuthenticated && <DashboardNavbar />}
            <SidebarTrigger />
            {children}
            <Footer />

          </main>
        </SidebarProvider>

      </body>
    </html>
  );
}
