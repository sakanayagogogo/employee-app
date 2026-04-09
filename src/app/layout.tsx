import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist",
});

export const metadata: Metadata = {
    title: "KIZUNA - とりせん労働組合連絡システム",
    description: "とりせん労働組合向けの連絡・エンゲージメントプラットフォーム",
    manifest: "/manifest.json?v=5",
    icons: {
        icon: [
            { url: "/kizuna-color.svg?v=5" },
            { url: "/favicon.ico?v=5" },
        ],
        apple: "/apple-touch-icon-color.png?v=5",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "KIZUNA",
    },
};

export const viewport: Viewport = {
    themeColor: "#10b981",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <body className={`${geist.variable} font-sans antialiased`}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
