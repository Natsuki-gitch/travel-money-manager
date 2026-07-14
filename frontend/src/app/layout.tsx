import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "海外買い物管理システム",
  description: "海外旅行中の買い物を円換算・手数料込みで記録・管理する",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
