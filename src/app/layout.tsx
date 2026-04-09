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
            { url: "/kizuna-icon.svg?v=2" },
            { url: "/apple-touch-icon.png?v=4" },
        ],
        apple: "/apple-touch-icon.png?v=4",
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
