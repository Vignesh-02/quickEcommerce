import type { Metadata } from "next";
import { Navbar, Footer } from "@/components";

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
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
