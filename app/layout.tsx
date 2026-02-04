import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiny CMS",
  description: "Wiki-style knowledge base CMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
