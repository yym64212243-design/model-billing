import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playable — 把喜欢的歌变成能弹的钢琴",
  description: "上传或录制音频，自动生成可弹的钢琴版本，支持瀑布流跟弹与 iPad 琴架模式。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-playable-surface text-gray-100">
        {children}
      </body>
    </html>
  );
}
