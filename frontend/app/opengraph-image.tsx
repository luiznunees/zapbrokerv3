import { ImageResponse } from "next/og";

export const alt = "ZapBroker — Agente de IA para Corretores de Imóveis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 80,
          fontFamily: "sans-serif",
          color: "#ffffff",
          background:
            "linear-gradient(135deg, #2E7CF6 0%, #0B3B82 55%, #071B40 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
            padding: "12px 28px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.12)",
            fontSize: 30,
            fontWeight: 700,
            color: "#D4FF3F",
          }}
        >
          Feito para corretores de imóveis
        </div>
        <div
          style={{
            fontSize: 72,
            lineHeight: 1.12,
            fontWeight: 800,
            maxWidth: 950,
            letterSpacing: "-0.02em",
          }}
        >
          Cada mensagem que você atrasa vira uma{" "}
          <span style={{ color: "#D4FF3F" }}>venda perdida.</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            color: "rgba(255,255,255,0.8)",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Dispara mensagem pra toda sua lista de leads de uma vez, direto no
          seu WhatsApp.
        </div>
      </div>
    ),
    size
  );
}