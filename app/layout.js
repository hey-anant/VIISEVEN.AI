import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import ConvexClientProvider from "./ConvexClientProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VIISEVEN — AI-Powered Code Generation",
  description: "Generate, edit, and deploy full-stack React applications with AI — all inside your browser.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ConvexClientProvider>
        <Provider>
          {children}
          <Toaster/>
          </Provider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
