import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { PushPromptModal } from "@/components/dashboard/PushPromptModal";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

const SITE_URL = "https://zapbroker.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ZapBroker — Disparo em Massa no WhatsApp para Corretores de Imóveis",
    template: "%s | ZapBroker",
  },
  description:
    "O ZapBroker dispara mensagem pra toda sua lista de leads de uma vez — direto no seu WhatsApp. Ative em 2 minutos, sem trocar de chip.",
  keywords: [
    "disparo whatsapp corretor",
    "disparo em massa whatsapp",
    "envio em massa whatsapp corretor de imóveis",
    "ferramenta para corretores",
    "whatsapp para imobiliária",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "ZapBroker",
    title: "ZapBroker — Disparo em Massa no WhatsApp para Corretores de Imóveis",
    description:
      "Dispara mensagem pra toda sua lista de leads de uma vez. Ative em 2 minutos, sem trocar de chip.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZapBroker — Disparo em Massa no WhatsApp para Corretores de Imóveis",
    description:
      "Dispara mensagem pra toda sua lista de leads de uma vez, direto no seu WhatsApp.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZapBroker",
  },
  icons: {
    apple: "/icon-512.svg",
  },
};

export const viewport = {
  themeColor: "#2E7CF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.className} ${bricolage.variable} ${manrope.variable}`}>
        <ThemeProvider>
          {children}
          <ToastProvider />
          <PushPromptModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
