import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: "买不买｜下单前先查查谁在控制你的手",
      template: "%s｜买不买",
    },
    authors: [{ name: "vigorxu", url: "https://github.com/vigorX777" }],
    creator: "vigorxu",
    publisher: "懂点儿AI",
    description: "5 道题，审审这次买、加、卖：到底是有计划，还是又上头了。不荐股，只帮你在下单前认清自己。",
    openGraph: {
      title: "下单前，测测你的手是不是又快过脑子",
      description: "5 道题，审审这次买、加、卖：到底是有计划，还是又上头了。",
      type: "website",
      locale: "zh_CN",
      siteName: "买不买",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "买不买交易心理测试" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "下单前，测测你的手是不是又快过脑子",
      description: "5 道题，审审这次买、加、卖：到底是有计划，还是又上头了。",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
