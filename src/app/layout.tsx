import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Admin Dashboard | Women of Influence",
  description: "Manage content, applications, and settings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${poppins.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ConvexClientProvider>
          <ConvexQueryCacheProvider expiration={300000}>
            <AuthGuard>
              <DashboardLayout>
                {children}
              </DashboardLayout>
            </AuthGuard>
          </ConvexQueryCacheProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
