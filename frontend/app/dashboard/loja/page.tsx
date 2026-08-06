"use client"

import { useState } from "react"
import {
  Flame, Shield, ShieldCheck, MessageCircle, Building2, Stethoscope,
  Home, Check, ArrowRight, Sparkles, AlertTriangle, Clock, TrendingUp,
  Heart, RefreshCcw
} from "lucide-react"
import { cn } from "@/lib/utils"

const WHATSAPP_SALES_NUMBER = "5551980985330"

function buildWhatsAppLink(message: string) {
  return `https://wa.me/${WHATSAPP_SALES_NUMBER}?text=${encodeURIComponent(message)}`
}

const CHIP_PLANS = [
  {
    id: "starter",
    name: "Starter",
    color: "blue",
    days: 30,
    price: 97,
    desc: "Pra quem tá começando a diversificar número e quer o básico de segurança.",
    featured: false,
  },
  {
    id: "premium",
    name: "Premium",
    color: "amber",
    days: 60,
    price: 127,
    desc: "Aquecimento mais longo — indicado se você já teve chip bloqueado antes.",
    featured: true,
  },
  {
    id: "ultra",
    name: "Ultra",
    color: "emerald",
    days: 90,
    price: 147,
    desc: "Máxima maturação — pra quem vai operar com volume alto desde o primeiro dia.",
    featured: false,
  },
] as const

const PLAN_COLOR_CLASSES: Record<string, { dot: string; badge: string; border: string }> = {
  blue: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-500", border: "border-blue-500/30" },
  amber: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-500", border: "border-amber-500/30" },
  emerald: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500", border: "border-emerald-500/30" },
}

const WARMUP_PRACTICES = [
  {
    icon: Clock,
    title: "Espere 24h após conectar",
    desc: "Assim que o número entra no seu WhatsApp, evite mandar mensagem, mudar foto/nome ou conectar em automações no primeiro dia. O ZapBroker já avisa automaticamente quando um número está nesse período.",
  },
  {
    icon: TrendingUp,
    title: "Suba o volume aos poucos",
    desc: "Nas primeiras semanas, o ideal é começar com poucas mensagens por dia e ir aumentando gradualmente. O agente do ZapBroker calcula esse limite recomendado sozinho, com base em há quantos dias o número está conectado, e avisa se você tentar passar disso.",
  },
  {
    icon: Heart,
    title: "Priorize conversa humanizada",
    desc: "Números com boa taxa de resposta e interação real duram muito mais. Varie as mensagens (o ZapBroker já gera variações automáticas) e evite parecer robótico.",
  },
  {
    icon: RefreshCcw,
    title: "Dê descanso ao chip",
    desc: "Depois de um período de uso intenso, alterne com dias de só atendimento humanizado antes de voltar a disparar forte. Isso mantém a reputação do número em dia por muito mais tempo.",
  },
  {
    icon: Shield,
    title: "Cuidado ao trocar um número banido",
    desc: "Evite conectar o novo chip no mesmo aparelho/rede Wi-Fi de um número que já foi banido, e não reutilize a mesma lista de contatos nem a mesma foto de perfil logo de cara.",
  },
]

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
  const [chipQty, setChipQty] = useState<Record<string, number>>({ starter: 1, premium: 1, ultra: 1 })

  const setQtyFor = (planId: string, delta: number) => {
    setChipQty((prev) => ({ ...prev, [planId]: Math.max(1, (prev[planId] || 1) + delta) }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
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

      {/* Chip Aquecido — 3 planos */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center size-11 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
            <Flame className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Chip Aquecido</h2>
            <p className="text-xs text-muted-foreground">Número de WhatsApp com histórico real de uso, entregue de forma virtual</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Chips novos, recém-cadastrados, costumam ser os primeiros alvos de bloqueio quando entram
          em disparo em massa. O chip aquecido já passou por um processo de maturação simulando uso real
          antes de chegar até você — isso <strong className="text-foreground">reduz significativamente o risco</strong> de
          bloqueio logo nos primeiros disparos. Quanto mais tempo de aquecimento, maior a reputação do número.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {CHIP_PLANS.map((plan) => {
            const colors = PLAN_COLOR_CLASSES[plan.color]
            const qty = chipQty[plan.id] || 1
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-card border rounded-2xl p-6 flex flex-col",
                  plan.featured ? cn("shadow-lg", colors.border) : "border-border"
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Mais Escolhido
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("size-2 rounded-full", colors.dot)} />
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                </div>

                <div className={cn("inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4", colors.badge)}>
                  {plan.days} dias de aquecimento
                </div>

                <div className="mb-3">
                  <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                  <span className="text-xs text-muted-foreground"> /chip</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-5 flex-1">{plan.desc}</p>

                <div className="flex items-center gap-3 mb-4">
                  <label className="text-xs font-medium text-foreground">Quantidade:</label>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQtyFor(plan.id, -1)}
                      className="px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      −
                    </button>
                    <span className="px-4 py-1.5 text-sm font-medium min-w-[2.5rem] text-center">{qty}</span>
                    <button
                      onClick={() => setQtyFor(plan.id, 1)}
                      className="px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <a
                  href={buildWhatsAppLink(
                    `Olá! Tenho interesse em ${qty} chip(s) ${plan.name} (${plan.days} dias de aquecimento) pro ZapBroker.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-primary/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar com a gente
                </a>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">Desconto a partir de 3 unidades — consulte no WhatsApp.</p>

        <div className="flex items-start gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl px-3.5 py-3 text-xs max-w-2xl">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Importante: chip aquecido <strong>reduz o risco</strong> de bloqueio, mas nenhum
            fornecedor pode garantir imunidade total — o WhatsApp pode banir qualquer número que
            envie volume alto de mensagens. Use com bom senso no ritmo de disparo.
          </p>
        </div>

        <div className="flex items-start gap-2 bg-muted/50 text-muted-foreground rounded-xl px-3.5 py-3 text-xs max-w-2xl">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Entrega 100% virtual: você recebe o número, cadastra no seu WhatsApp e solicita o SMS de
            confirmação — acesso normal direto no seu celular, sem espera de chip físico chegando pelo correio.
          </p>
        </div>
      </section>

      {/* Boas práticas de aquecimento */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center size-11 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Shield className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Boas Práticas de Aquecimento</h2>
            <p className="text-xs text-muted-foreground">Como fazer seu chip durar o máximo possível</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-2xl">
          Comprou um chip aquecido ou já tem um número maduro? Essas práticas fazem a diferença entre
          um número que dura meses e um que é bloqueado nas primeiras semanas. Boa parte delas o
          próprio ZapBroker já aplica automaticamente pra você.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {WARMUP_PRACTICES.map((practice) => (
            <div key={practice.title} className="flex items-start gap-3 border border-border rounded-xl p-4">
              <span className="flex items-center justify-center size-9 rounded-lg bg-muted text-foreground/70 shrink-0">
                <practice.icon className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{practice.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{practice.desc}</p>
              </div>
            </div>
          ))}
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
