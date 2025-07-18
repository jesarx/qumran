import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Footer from "@/components/footer";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: '%s | qumran.cc',
    default: 'Qumran.cc'
  },
  description: "biblioteca personal de eduardo partida",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${raleway.variable} antialiased bg-background text-foreground`}>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full flex flex-col bg-background min-h-screen">
            <div className="flex items-center p-0">
              <SidebarTrigger />
            </div>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
