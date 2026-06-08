import "~/styles/globals.css";

import { type Metadata } from "next";

import { TRPCReactProvider } from "../trpc/react.tsx";

export const metadata: Metadata = {
  title: "WiseQRPay",
  description: "Get paid from abroad with QR payments.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inter, loaded at runtime (not next/font) so the build never depends on a font fetch. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
