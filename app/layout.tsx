import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qsac-canh-bao.tracisextonuqazo.chatgpt.site"),
  title: { default: "QSAC - Giám sát chất lượng & phòng chống hàng giả", template: "%s | QSAC" },
  description: "Cổng cảnh báo, tra cứu và tiếp nhận phản ánh về hàng giả, gian lận thương mại và rủi ro số.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "vi_VN", siteName: "QSAC", images: [{ url: "/og.png", width: 1536, height: 1024, alt: "QSAC - Giám sát chất lượng và phòng chống hàng giả" }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
