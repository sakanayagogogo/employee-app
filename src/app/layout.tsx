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
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/kizuna-color.svg?v=1" },
            { url: "/favicon.ico?v=1", themes: "light" },
        ],
        apple: "/apple-touch-icon.png?v=1",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "KIZUNA",
    },
};

export const viewport: Viewport = {
    themeColor: "#ea580c",
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
