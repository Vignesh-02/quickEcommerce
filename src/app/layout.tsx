import type { Metadata } from "next";
import "./globals.css";
import { Jost } from "next/font/google";
import { Toaster } from "sonner";

const jost = Jost({
    variable: "--font-jost",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Quick Ecommerce",
    description: "Get your sneakers in a snap",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${jost.className} antialiased`}>
                {children}
                <Toaster position="top-center" richColors />
            </body>
        </html>
    );
}
