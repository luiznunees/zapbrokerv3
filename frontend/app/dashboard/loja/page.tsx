"use client"

import { useState } from "react"
import {
  Flame, Shield, ShieldCheck, MessageCircle, Building2, Stethoscope,
  Home, Check, ArrowRight, Sparkles, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

const WHATSAPP_SALES_NUMBER = "5551980985330"

function buildWhatsAppLink(message: string) {
  return `https://wa.me/${WHATSAPP_SALES_NUMBER}?text=${encodeURIComponent(message)}`
}

const LISTING_CATEGORIES = [
  {
    icon: Building2,
    title: "Moradores de condomínio",
    desc: "Contatos segmentados por condomínio específico — ideal pra prospectar dentro de um empreendimento que você já conhece.",
  },
  {
    icon: Stethoscope,
    title: "Médicos e profissionais de saúde",
    desc: "Base de contatos de profissionais liberais com alto poder aquisitivo, público clássico pra imóveis de médio/alto padrão.",
  },
  {
    icon: Home,
    title: "Outras segmentações",
    desc: "Tem um perfil de lead específico em mente? Conta pra gente o que você precisa e vemos disponibilidade.",
  },
]

export default function LojaPage() {
  const [chipQty, setChipQty] = useState(1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Loja de Extras
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Turbine seus disparos
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-xl">
          Chips aquecidos pra reduzir o risco de bloqueio e listagens prontas de leads segmentados —
          fale com a gente e a gente cuida do resto.
        </p>
      </div>

      {/* Chip Aquecido */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center size-11 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">Chip Aquecido</h2>
                <p className="text-xs text-muted-foreground">Número de WhatsApp com histórico real de uso</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Chips novos, recém-cadastrados, costumam ser os primeiros alvos de bloqueio quando entram
              em disparo em massa. O chip aquecido já tem um histórico de conversas e atividade real antes
              de chegar até você — isso <strong className="text-foreground">reduz significativamente o risco</strong> de
              bloqueio logo nos primeiros disparos.
            </p>

            <ul className="space-y-2">
              {[
                "Número com histórico de uso real antes da entrega",
                "Pronto pra conectar direto na sua conta ZapBroker",
                "Ideal pra quem já teve chip bloqueado recentemente",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl px-3.5 py-3 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Importante: chip aquecido <strong>reduz o risco</strong> de bloqueio, mas nenhum
                fornecedor pode garantir imunidade total — o WhatsApp pode banir qualquer número que
                envie volume alto de mensagens. Use com bom senso no ritmo de disparo.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-muted/50 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">A partir de</div>
              <div className="text-3xl font-bold text-foreground">Sob consulta</div>
              <p className="text-xs text-muted-foreground mt-1">Preço varia conforme quantidade e disponibilidade</p>

              <div className="flex items-center gap-3 mt-5">
                <label className="text-sm font-medium text-foreground">Quantidade:</label>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setChipQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-sm font-medium min-w-[2.5rem] text-center">{chipQty}</span>
                  <button
                    onClick={() => setChipQty((q) => q + 1)}
                    className="px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <a
              href={buildWhatsAppLink(`Olá! Tenho interesse em ${chipQty} chip(s) aquecido(s) pro ZapBroker.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com a gente
            </a>
          </div>
        </div>
      </section>

      {/* Listagens */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center size-11 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Listagens Prontas de Leads</h2>
            <p className="text-xs text-muted-foreground">Bases de contatos segmentadas, prontas pra importar</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-2xl">
          Sem tempo de captar leads do zero? A gente tem listagens segmentadas prontas pra você importar
          direto na sua conta e começar a disparar hoje mesmo.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {LISTING_CATEGORIES.map((cat) => (
            <div
              key={cat.title}
              className="border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <span className="flex items-center justify-center size-9 rounded-lg bg-muted text-foreground/70 mb-3">
                <cat.icon className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-sm text-foreground mb-1.5">{cat.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{cat.desc}</p>
              <a
                href={buildWhatsAppLink(`Olá! Tenho interesse em uma listagem de leads: ${cat.title}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:gap-2.5 transition-all"
              >
                Consultar disponibilidade
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
        <Shield className="w-3.5 h-3.5" />
        Dúvidas sobre qualquer um dos dois? É só chamar no WhatsApp que a gente te explica certinho.
      </div>
    </div>
  )
}
