import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andex Fitness AI",
  description: "ジム記録 × AIメニュー提案",
  manifest: "/manifest.json",
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
