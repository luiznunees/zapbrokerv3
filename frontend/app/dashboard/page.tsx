"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatedAIChat, type AttachType } from "@/components/ui/animated-ai-chat"
import { BrandLoader } from "@/components/ui/BrandLoader"
import { LeadImporterModal } from "@/components/dashboard/LeadImporterModal"
import {
  Bot, Send, Users, Target, Import, Phone, Rocket,
  Sparkles, TrendingUp, Wifi, AlertCircle, Plus, ListChecks
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { ChatHistory, type ChatSession } from "@/components/dashboard/ChatHistory"
import { ChatWhatsAppQR, type WhatsAppQrStatus } from "@/components/dashboard/ChatWhatsAppQR"
import { CampaignDraftPanel, type CampaignDraft } from "@/components/dashboard/CampaignDraftPanel"
import { ChatListPicker } from "@/components/dashboard/ChatListPicker"
import { ChatFileUpload } from "@/components/dashboard/ChatFileUpload"
import { ChatTimingConfirm, type TimingValues } from "@/components/dashboard/ChatTimingConfirm"
import { ChatSchedulePicker } from "@/components/dashboard/ChatSchedulePicker"
import { ChatInstancePicker } from "@/components/dashboard/ChatInstancePicker"
import { ChatCampaignSummaryConfirm } from "@/components/dashboard/ChatCampaignSummaryConfirm"
import { ChatAntiBanWarningConfirm } from "@/components/dashboard/ChatAntiBanWarningConfirm"
import { ChatDuplicateCampaignConfirm } from "@/components/dashboard/ChatDuplicateCampaignConfirm"
import { ChatQuotaConfirm } from "@/components/dashboard/ChatQuotaConfirm"
import { ChatFollowUpScheduler } from "@/components/dashboard/ChatFollowUpScheduler"
import { ChatLeadPicker } from "@/components/dashboard/ChatLeadPicker"
import { ChatContactExclusionPicker } from "@/components/dashboard/ChatContactExclusionPicker"
import { ChatOnboardingBriefing, type OnboardingResult } from "@/components/dashboard/ChatOnboardingBriefing"
import { useDashboard } from "@/contexts/dashboard-context"
import { useUser } from "@/contexts/user-context"

type Action = {
  label: string
  type: string
  data?: any
}

type WhatsAppQrState = {
  instanceId: string
  qrCode: string | null
  pairingCode: string | null
  status: WhatsAppQrStatus
}

type AgentComponent = {
  type: "list_picker" | "file_upload" | "timing_confirm" | "schedule_picker" | "instance_picker"
    | "message_editor" | "campaign_summary" | "antiban_warning" | "duplicate_campaign_confirm"
    | "quota_confirm" | "followup_scheduler" | "lead_picker" | "contact_exclusion" | "onboarding_briefing"
  purpose?: string
}

type Message = {
  id: string
  role: "user" | "agent"
  content: string
  actions?: Action[]
  whatsapp?: WhatsAppQrState
  component?: AgentComponent
  timestamp: Date
}

type PendingAttachment = {
  name: string
  url: string
  mediaType: string
}

type SuggestionCard = {
  icon: string
  title: string
  desc: string
  action: string
}

const ICON_MAP: Record<string, React.ReactNode> = {
  rocket: <Rocket className="size-5" />,
  upload: <Import className="size-5" />,
  wifi: <Wifi className="size-5" />,
  target: <Target className="size-5" />,
  trending: <TrendingUp className="size-5" />,
  alert: <AlertCircle className="size-5" />,
  send: <Send className="size-5" />,
}

const FALLBACK_SUGGESTIONS: SuggestionCard[] = [
  { icon: "wifi", title: "Conectar WhatsApp", desc: "Vincule seu número à plataforma", action: "connect_whatsapp" },
  { icon: "upload", title: "Importar contatos", desc: "Adicione leads à sua base", action: "import_leads" },
  { icon: "rocket", title: "Criar campanha", desc: "Comece um disparo para seus leads", action: "start_dispatch" },
]

// Ações de sugestão que já sabem o que fazer sem precisar perguntar pro LLM
const DIRECT_ACTIONS = new Set(["connect_whatsapp", "import_leads"])

// O título do card é gerado pela IA (getSuggestions no backend) e pode sair vago ou
// "de boas-vindas" (ex: "Começar a usar o ZapBroker") mesmo quando a ação por trás é bem
// específica — mandar esse texto solto pro agente faz ele perder o fio e responder genérico
// em vez de ir direto ao ponto. Por isso a mensagem de fato enviada usa uma instrução clara
// por ação, não o título livre do card.
const ACTION_MESSAGES: Record<string, string> = {
  start_dispatch: "Quero criar uma campanha de disparo agora.",
  view_campaigns: "Quero ver como estão minhas campanhas.",
  suggest_followup: "Quero criar um follow-up para leads que não responderam.",
  follow_up_stalled: "Quero criar um follow-up para os leads que estão parados.",
}
const WHATSAPP_QR_TIMEOUT_MS = 30_000
const WHATSAPP_POLL_INTERVAL_MS = 3_000

const ATTACH_ACCEPT: Record<Exclude<AttachType, "contacts">, string> = {
  files: ".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt",
  media: "image/*,video/*",
  audio: "audio/*",
}

const WELCOME_TITLE = "Como posso ajudar hoje?"

export default function DashboardPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const [stats, setStats] = useState({ leads: 0, campaigns: 0, remaining: 0, stalledLeads: 0 })
  const [statusBar, setStatusBar] = useState<{
    connectedInstances: number
    totalInstances: number
    listCount: number
    lastCampaign: { name: string; status: string; createdAt: string } | null
  }>({ connectedInstances: 0, totalInstances: 0, listCount: 0, lastCampaign: null })
  const [suggestionCards, setSuggestionCards] = useState<SuggestionCard[]>(FALLBACK_SUGGESTIONS)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const recentCampaigns: any[] = []
  const { newChatTrigger } = useDashboard()
  const router = useRouter()
  const [isNewChatAnimating, setIsNewChatAnimating] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [isLeadImporterOpen, setIsLeadImporterOpen] = useState(false)
  const [currentDraft, setCurrentDraft] = useState<CampaignDraft | null>(null)
  const [autoEditMessageTrigger, setAutoEditMessageTrigger] = useState(0)
  const [isConfirmingCampaign, setIsConfirmingCampaign] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const whatsappPollersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})
  // Guard síncrono contra Enter segurado/repetido: setIsLoading(true) só reflete no
  // estado depois de um re-render, então vários keydown antes disso passariam pelo
  // "isLoading" antigo e disparariam a mesma mensagem várias vezes. Um ref é síncrono.
  const isSendingRef = useRef(false)
  // React 18 Strict Mode roda o efeito de montagem 2x em dev — sem essa guarda, a carga
  // inicial cria DUAS sessões novas por reload (uma órfã, some da lista mas continua no
  // banco e reaparece depois), efeito colateral real do "sempre abrir chat novo".
  const hasLoadedInitialRef = useRef(false)
  const filesInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      Object.values(whatsappPollersRef.current).forEach(clearInterval)
    }
  }, [])

  useEffect(() => {
    if (hasLoadedInitialRef.current) return
    hasLoadedInitialRef.current = true

    const loadInitial = async () => {
      try {
        const [countData, campaignsData, quotaData, sessionData, stalledData, profileData, instancesData, listsData] =
          await Promise.all([
            api.contacts.getCount().catch(() => ({ count: 0 })),
            api.campaigns.list().catch(() => []),
            api.quotas.current().catch(() => ({ remainingMessages: 0 })),
            api.sessions.list().catch(() => []),
            api.campaigns.getStalledCount().catch(() => ({ count: 0 })),
            api.auth.me().catch(() => null),
            api.instances.list().catch(() => []),
            api.contacts.list().catch(() => []),
          ])

        setStats({
          leads: countData.count || 0,
          campaigns: campaignsData.length || 0,
          remaining: quotaData.remainingMessages || 0,
          stalledLeads: stalledData.count || 0,
        })
        setSessions(sessionData || [])

        const instancesList = instancesData || []
        setStatusBar({
          connectedInstances: instancesList.filter((i: any) => i.status === "connected").length,
          totalInstances: instancesList.length,
          listCount: (listsData || []).length,
          lastCampaign: campaignsData?.[0]
            ? { name: campaignsData[0].name, status: campaignsData[0].status, createdAt: campaignsData[0].created_at }
            : null,
        })

        const profileUser = (profileData as any)?.user || profileData
        const onboardingDone = !!profileUser?.onboarding_steps?.completed
        setNeedsOnboarding(!onboardingDone)

        // Não cria sessão nenhuma ainda — só quando a primeira mensagem for enviada
        // (ver sendMessage). Entrar no dashboard e sair sem escrever nada não deveria
        // deixar uma "Nova conversa" vazia pra sempre no histórico.
        if (!onboardingDone) {
          setMessages([{
            id: `agent-onboarding-${Date.now()}`,
            role: "agent",
            content: "Antes de começar, deixa eu te conhecer melhor — leva menos de 1 minuto e me ajuda a te dar sugestões mais certeiras.",
            timestamp: new Date(),
            component: { type: "onboarding_briefing" },
          }])
        }
      } catch {
        console.error("Failed to load initial data")
      } finally {
        setPageLoading(false)
      }
    }
    loadInitial()

    const landingIntent = sessionStorage.getItem("landingChatIntent")
    if (landingIntent) {
      sessionStorage.removeItem("landingChatIntent")
      setInput(landingIntent)
    }
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `suggestions_${today}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try { setSuggestionCards(JSON.parse(cached)); return } catch {}
    }

    setSuggestionsLoading(true)
    api.agent.suggestions()
      .then((res: any) => {
        const cards: SuggestionCard[] = res?.suggestions || FALLBACK_SUGGESTIONS
        setSuggestionCards(cards)
        localStorage.setItem(cacheKey, JSON.stringify(cards))
      })
      .catch(() => setSuggestionCards(FALLBACK_SUGGESTIONS))
      .finally(() => setSuggestionsLoading(false))
  }, [stats.leads, stats.campaigns])

  useEffect(() => {
    // O agente chamou request_message_variations_editor — em vez de um card solto na
    // bolha, abre o campo "Mensagem" do painel lateral já em modo de edição.
    const last = messages[messages.length - 1]
    if (last?.role === "agent" && last.component?.type === "message_editor") {
      setAutoEditMessageTrigger((v) => v + 1)
    }
  }, [messages])

  useEffect(() => {
    const viewport = messagesEndRef.current?.closest(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null
    if (!viewport) return

    // Only auto-scroll if the user is already near the bottom — otherwise,
    // scrolling up to read history shouldn't get yanked back down on every
    // streamed token update.
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    if (distanceFromBottom < 150) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (newChatTrigger > 0) handleNewSession()
  }, [newChatTrigger])

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const data = await api.sessions.getMessages(sessionId)
      const msgs: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        actions: m.metadata?.actions || undefined,
        timestamp: new Date(m.created_at),
      }))
      setMessages(msgs)
    } catch {
      console.error("Failed to load session messages")
    }
  }

  const handleNewSession = useCallback(async () => {
    setIsNewChatAnimating(true)

    await new Promise((r) => setTimeout(r, 150))

    // Sem sessão nenhuma ainda — só é criada de verdade quando a primeira mensagem for
    // enviada (ver sendMessage). Clicar em "Novo chat" e não escrever nada não deveria
    // deixar uma sessão vazia no histórico.
    setMessages([])
    setCurrentSessionId(null)
    setCurrentDraft(null)

    if (needsOnboarding) {
      setMessages([{
        id: `agent-onboarding-${Date.now()}`,
        role: "agent",
        content: "Antes de continuar, deixa eu te conhecer melhor — leva menos de 1 minuto.",
        timestamp: new Date(),
        component: { type: "onboarding_briefing" },
      }])
    }

    setIsNewChatAnimating(false)
  }, [needsOnboarding])

  const handleSelectSession = async (session: ChatSession) => {
    setCurrentSessionId(session.id)
    setMessages([])
    setCurrentDraft(null)
    await loadSessionMessages(session.id)
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await api.sessions.delete(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
        setMessages([])
        setCurrentDraft(null)
      }
    } catch (error: any) {
      console.error("Failed to delete session", error)
      alert(error?.message || "Não foi possível excluir essa conversa. Tente novamente.")
    }
  }

  // Cria a sessão só quando ela realmente vai ser usada (primeira mensagem, seja pelo
  // composer ou por um card de sugestão) — evita sessões vazias no histórico.
  const ensureSessionId = async (): Promise<string> => {
    if (currentSessionId) return currentSessionId
    const session = await api.sessions.create()
    setCurrentSessionId(session.id)
    setSessions((prev) => [session, ...prev])
    return session.id
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isSendingRef.current) return
    isSendingRef.current = true

    const messageText = input.trim()
    const attachmentNote = pendingAttachment
      ? `\n\n[Anexo disponível: ${pendingAttachment.name} (${pendingAttachment.mediaType}) em ${pendingAttachment.url}]`
      : ""

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const agentMessageId = `agent-${Date.now()}`
    // Cria a bolha vazia (mostra as bolinhas de "digitando") já aqui, antes de qualquer
    // await — senão, no primeiro envio de uma conversa nova, a criação da sessão
    // (ensureSessionId) deixa um instante sem nenhum feedback visual.
    setMessages((prev) => [
      ...prev,
      { id: agentMessageId, role: "agent", content: "", timestamp: new Date() },
    ])

    try {
      const sessionId = await ensureSessionId()

      const response = await api.agent.chatStream(
        messageText + attachmentNote,
        sessionId,
        (token: string) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === agentMessageId ? { ...m, content: m.content + token } : m))
          )
        },
        () => {
          // O modelo narrou algo antes de decidir chamar uma ferramenta — descarta esse
          // texto intermediário (não é a resposta final) e recomeça limpo.
          setMessages((prev) =>
            prev.map((m) => (m.id === agentMessageId ? { ...m, content: "" } : m))
          )
        }
      )

      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessageId
            ? {
                ...m,
                content: response.reply || response.message || m.content || "OK!",
                actions: response.actions,
                component: response.component ?? undefined,
              }
            : m
        )
      )
      setCurrentDraft(response.draft ?? null)
      if (pendingAttachment) setPendingAttachment(null)
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== agentMessageId))
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Desculpe, tive um problema ao processar sua mensagem. Pode tentar de novo?",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      isSendingRef.current = false
    }
  }

  const stopWhatsAppPolling = (messageId: string) => {
    const interval = whatsappPollersRef.current[messageId]
    if (interval) {
      clearInterval(interval)
      delete whatsappPollersRef.current[messageId]
    }
  }

  const updateWhatsAppState = (messageId: string, patch: Partial<WhatsAppQrState>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId && m.whatsapp ? { ...m, whatsapp: { ...m.whatsapp, ...patch } } : m))
    )
  }

  const startWhatsAppPolling = (messageId: string, instanceId: string) => {
    stopWhatsAppPolling(messageId)
    const startedAt = Date.now()

    whatsappPollersRef.current[messageId] = setInterval(async () => {
      if (Date.now() - startedAt > WHATSAPP_QR_TIMEOUT_MS) {
        stopWhatsAppPolling(messageId)
        updateWhatsAppState(messageId, { status: "expired" })
        return
      }
      try {
        const instances = await api.instances.list()
        const instance = instances.find((i: any) => i.id === instanceId)
        if (instance?.status === "connected") {
          stopWhatsAppPolling(messageId)
          updateWhatsAppState(messageId, { status: "connected" })
          if (currentSessionId && currentDraft?.instanceId !== instanceId) {
            handleAction({
              type: "set_draft_instances",
              data: { sessionId: currentSessionId, instanceIds: [instanceId], instanceNames: [instance.name] },
              label: instance.name,
            })
          }
        }
      } catch {
        // silencioso — tenta de novo no próximo tick
      }
    }, WHATSAPP_POLL_INTERVAL_MS)
  }

  const regenerateWhatsAppQr = async (messageId: string, instanceId: string) => {
    try {
      const data = await api.instances.connect(instanceId)
      updateWhatsAppState(messageId, { qrCode: data.base64 || null, pairingCode: null, status: "connecting" })
      startWhatsAppPolling(messageId, instanceId)
    } catch {
      updateWhatsAppState(messageId, { status: "expired" })
    }
  }

  const requestWhatsAppPairingCode = async (messageId: string, instanceId: string, phoneNumber: string) => {
    try {
      const data = await api.instances.connect(instanceId, phoneNumber)
      updateWhatsAppState(messageId, { pairingCode: data.pairingCode || null, qrCode: null, status: "connecting" })
      startWhatsAppPolling(messageId, instanceId)
    } catch {
      updateWhatsAppState(messageId, { status: "expired" })
    }
  }

  const handleSelectAttachType = (type: AttachType) => {
    if (type === "contacts") {
      setIsLeadImporterOpen(true)
      return
    }
    if (type === "files") filesInputRef.current?.click()
    if (type === "media") mediaInputRef.current?.click()
    if (type === "audio") audioInputRef.current?.click()
  }

  const handleConfirmCampaign = () => {
    if (!currentSessionId) return
    handleAction({ type: "confirm_campaign", data: { sessionId: currentSessionId }, label: "Confirmar e disparar" })
  }

  const handleOnboardingComplete = async (result: OnboardingResult) => {
    try {
      await api.auth.updateProfile(result)
    } catch {
      console.error("Failed to save onboarding profile")
    }
    setNeedsOnboarding(false)
    setMessages((prev) => [
      ...prev,
      {
        id: `agent-onboarding-followup-${Date.now()}`,
        role: "agent",
        content: "Perfeito, anotado! Agora sim — quer criar sua primeira campanha, importar contatos ou conectar seu WhatsApp?",
        timestamp: new Date(),
      },
    ])
  }

  const handleSelectDraftList = (list: { id: string; name: string; leadCount: number }) => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_list", data: { sessionId: currentSessionId, contactListId: list.id }, label: list.name })
  }

  const handleDraftMediaUploaded = (file: { url: string; mediaType: string; name: string }) => {
    if (!currentSessionId) return
    handleAction({
      type: "set_draft_media",
      data: { sessionId: currentSessionId, mediaUrl: file.url, mediaType: file.mediaType },
      label: "Anexar mídia",
    })
  }

  const handleRemoveDraftMedia = () => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_media", data: { sessionId: currentSessionId, mediaUrl: null }, label: "Remover mídia" })
  }

  const handleConfirmDraftTiming = (values: TimingValues) => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_timing", data: { sessionId: currentSessionId, ...values }, label: "Confirmar timing" })
  }

  const handleConfirmDraftSchedule = (values: { scheduledAt: string | null }) => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_schedule", data: { sessionId: currentSessionId, ...values }, label: "Confirmar agendamento" })
  }

  const handleConfirmDraftInstances = (values: { instanceIds: string[]; instanceNames: string[] }) => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_instances", data: { sessionId: currentSessionId, ...values }, label: values.instanceNames.join(" + ") })
  }

  const handleConfirmDraftMessages = (values: { messageVariations: string[] }) => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_messages", data: { sessionId: currentSessionId, ...values }, label: "Salvar mensagens" })
  }

  const handleAcknowledgeAntiBan = () => {
    if (!currentSessionId) return
    handleAction({ type: "acknowledge_antiban_warning", data: { sessionId: currentSessionId }, label: "Continuar assim mesmo" })
  }

  const handleAcknowledgeQuota = () => {
    if (!currentSessionId) return
    handleAction({ type: "acknowledge_quota_warning", data: { sessionId: currentSessionId }, label: "Continuar mesmo assim" })
  }

  const handleApplyDuplicatedCampaign = (values: { sourceName: string; pendingDraft: any }) => {
    if (!currentSessionId) return
    handleAction({ type: "apply_duplicated_campaign", data: { sessionId: currentSessionId, ...values }, label: "Usar como base" })
  }

  const handleCancelDuplicatedCampaign = () => {
    if (!currentSessionId) return
    handleAction({ type: "cancel_duplicated_campaign", data: { sessionId: currentSessionId }, label: "Cancelar" })
  }

  const handleConfirmExclusions = (values: { excludedContactIds: string[] }) => {
    if (!currentSessionId) return
    handleAction({ type: "set_draft_exclusions", data: { sessionId: currentSessionId, ...values }, label: "Salvar exclusões" })
  }

  const handleCreateFollowUp = (values: { contactIds: string[]; message: string; scheduledAt: string | null }) => {
    if (!currentSessionId) return
    handleAction({ type: "create_followup", data: { sessionId: currentSessionId, ...values }, label: "Criar follow-up" })
  }

  const handleSelectLead = async (lead: { id: string; name: string; phone: string }) => {
    if (!currentSessionId) return
    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: `Esse aqui: ${lead.name}`, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    try {
      const response = await api.agent.chat(`Esse aqui: ${lead.name} (${lead.phone})`, currentSessionId)
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: response.reply || response.message || "OK!",
          actions: response.actions,
          component: response.component ?? undefined,
          timestamp: new Date(),
        },
      ])
      setCurrentDraft(response.draft ?? null)
    } catch {
      // erro silencioso — usuário pode tentar de novo digitando
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setIsUploadingAttachment(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const data = await api.uploads.media(formData)
      setPendingAttachment({ name: data.filename || file.name, url: data.url, mediaType: data.mediaType })
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Não consegui anexar esse arquivo. Verifique o tipo/tamanho (máx. 16MB) e tente de novo.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const handleAction = async (action: Action) => {
    const isConfirmCampaign = action.type === "confirm_campaign"
    if (isConfirmCampaign) setIsConfirmingCampaign(true)
    setIsLoading(true)
    try {
      const response = await api.agent.execute(action.type, action.data)

      const resultMessage: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: response.message || response.text || "Pronto! Feito.",
        actions: response.result?.actions?.length ? response.result.actions : undefined,
        component: response.result?.component ?? undefined,
        timestamp: new Date(),
      }

      if (response.result?.type === "whatsapp_qr") {
        resultMessage.whatsapp = {
          instanceId: response.result.instanceId,
          qrCode: response.result.qrCode || null,
          pairingCode: response.result.pairingCode || null,
          status: response.result.alreadyConnected ? "connected" : "connecting",
        }
      }

      setMessages((prev) => [...prev, resultMessage])

      if (resultMessage.whatsapp && resultMessage.whatsapp.status === "connecting") {
        startWhatsAppPolling(resultMessage.id, resultMessage.whatsapp.instanceId)
      }

      if (isConfirmCampaign && response.success) {
        setCurrentDraft(null)
      } else if (response.result?.draft) {
        setCurrentDraft(response.result.draft)
      }

      const redirect = response.result?.redirect
      if (redirect && !resultMessage.whatsapp) {
        setTimeout(() => router.push(redirect), 800)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Ops, não consegui executar essa ação. Vamos tentar de novo?",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      if (isConfirmCampaign) setIsConfirmingCampaign(false)
    }
  }

  const handleSuggestionClick = async (card: SuggestionCard) => {
    await handleNewSession()
    await new Promise((r) => setTimeout(r, 400))

    const messageText = ACTION_MESSAGES[card.action] || card.title

    const msg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])

    if (DIRECT_ACTIONS.has(card.action)) {
      await handleAction({ type: card.action, data: undefined, label: card.title })
      return
    }

    setIsLoading(true)

    try {
      const sessionId = await ensureSessionId()
      const response = await api.agent.chat(messageText, sessionId)
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: response.reply || response.message || "OK!",
        actions: response.actions,
        component: response.component ?? undefined,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMessage])
      setCurrentDraft(response.draft ?? null)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Desculpe, tive um problema. Pode tentar de novo?",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return "agora"
    if (minutes < 60) return `há ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `há ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `há ${days}d`
    return new Date(iso).toLocaleDateString("pt-BR")
  }

  const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
    COMPLETED: "concluída",
    RUNNING: "enviando",
    PENDING: "pendente",
    PAUSED: "pausada",
    FAILED: "falhou",
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const userName = user?.nome || user?.name || "Corretor"
  // Sem sessão criada ainda não significa "sem conversa" — só significa que a primeira
  // mensagem não foi enviada. O que decide a tela de boas-vindas é não ter mensagens.
  const showWelcome = messages.length === 0 && !isLoading

  if (pageLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <BrandLoader size="md" />
      </div>
    )
  }


  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-6">
      {/* Mobile-only header: new chat (history is pinned, lg+ only — NavRail has "Novo Chat" on lg) */}
      <div className="flex lg:hidden items-center justify-end gap-2 pb-3">
        <button
          onClick={handleNewSession}
          title="Novo Chat"
          className="flex items-center justify-center size-9 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Chat history — pinned side column, always visible on lg+, no way to collapse it */}
      <div className="hidden lg:block w-[260px] shrink-0">
        <div className="w-[260px] h-full py-1 pr-1">
          <ChatHistory
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelect={handleSelectSession}
            onNew={handleNewSession}
            onDelete={handleDeleteSession}
            isNewChatAnimating={isNewChatAnimating}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">

        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-100/80 border border-zinc-200/80">
            <span className={cn(
              "flex items-center justify-center size-[26px] rounded-lg shrink-0",
              statusBar.connectedInstances > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-200 text-zinc-400"
            )}>
              <Wifi className="size-3.5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-foreground">
                {statusBar.connectedInstances}/{statusBar.totalInstances}
              </span>
              <span className="text-[11px] text-muted-foreground/70">WhatsApp{statusBar.totalInstances === 1 ? "" : "s"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-100/80 border border-zinc-200/80">
            <span className="flex items-center justify-center size-[26px] rounded-lg shrink-0 bg-purple-500/10 text-purple-500">
              <ListChecks className="size-3.5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-foreground">{statusBar.listCount} lista{statusBar.listCount === 1 ? "" : "s"}</span>
              <span className="text-[11px] text-muted-foreground/70">{stats.leads} leads</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-100/80 border border-zinc-200/80">
            <span className="flex items-center justify-center size-[26px] rounded-lg shrink-0 bg-purple-500/10 text-purple-500">
              <Target className="size-3.5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-foreground">{stats.remaining} disparo{stats.remaining === 1 ? "" : "s"}</span>
              <span className="text-[11px] text-muted-foreground/70">restante{stats.remaining === 1 ? "" : "s"}</span>
            </span>
          </div>

          {statusBar.lastCampaign && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-100/80 border border-zinc-200/80 min-w-0">
              <span className="flex items-center justify-center size-[26px] rounded-lg shrink-0 bg-purple-500/10 text-purple-500">
                <Rocket className="size-3.5" />
              </span>
              <span className="flex flex-col leading-tight min-w-0">
                <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">"{statusBar.lastCampaign.name}"</span>
                <span className="text-[11px] text-muted-foreground/70">
                  {CAMPAIGN_STATUS_LABELS[statusBar.lastCampaign.status] || statusBar.lastCampaign.status.toLowerCase()} · {formatRelativeTime(statusBar.lastCampaign.createdAt)}
                </span>
              </span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showWelcome ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-12"
            >
              <div className="w-full max-w-[768px] mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-primary text-xs font-medium mb-6">
                  <Sparkles className="size-3.5" />
                  Assistente ZapBroker
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
                  {WELCOME_TITLE}
                </h1>
                <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                  {stats.leads > 0
                    ? `Você tem ${stats.leads} leads e ${stats.campaigns} campanhas. O que vamos fazer hoje?`
                    : "Comece importando seus contatos para enviar mensagens automáticas."}
                </p>

                {suggestionCards.length > 0 && (
                  <div className="flex flex-nowrap justify-center gap-3 max-w-2xl mx-auto overflow-x-auto">
                    {suggestionCards.map((card, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        whileHover={{ y: -2 }}
                        onClick={() => handleSuggestionClick(card)}
                        disabled={isNewChatAnimating}
                        className="group flex flex-1 basis-0 min-w-[160px] flex-col items-start gap-1.5 p-4 rounded-2xl glass-card text-left text-sm border border-transparent transition-all duration-200 hover:border-primary/40 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-primary/10 disabled:opacity-50"
                      >
                        <span className="text-primary mb-1 transition-transform duration-200 group-hover:scale-110">{ICON_MAP[card.icon] ?? <Bot className="size-5" />}</span>
                        <span className="font-medium text-foreground">{card.title}</span>
                        <span className="text-xs text-muted-foreground">{card.desc}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ScrollArea className="flex-1 px-4 py-4">
                <div className="max-w-[768px] mx-auto space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex gap-4",
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "size-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                            msg.role === "agent"
                              ? "bg-gradient-to-br from-primary/80 to-sky-500/80 shadow-lg shadow-primary/20"
                              : "bg-primary shadow-lg shadow-primary/20"
                          )}
                        >
                          {msg.role === "agent" ? (
                            <Bot className="size-4 text-white" />
                          ) : (
                            <span className="text-xs font-bold text-white">
                              {getInitials(userName)}
                            </span>
                          )}
                        </div>

                        <div className={cn(
                          "space-y-3 max-w-[85%]",
                          msg.role === "user" ? "items-end" : "items-start"
                        )}>
                          <div
                            className={cn(
                              "px-4 py-3 text-sm leading-relaxed",
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-3xl rounded-tr-sm shadow-lg shadow-primary/20"
                                : "glass rounded-3xl rounded-tl-sm text-accent-foreground"
                            )}
                          >
                            {msg.role === "agent" && msg.content === "" && isLoading ? (
                              <div className="flex gap-1.5 py-0.5">
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>

                          {msg.whatsapp && (
                            <ChatWhatsAppQR
                              qrCode={msg.whatsapp.qrCode}
                              pairingCode={msg.whatsapp.pairingCode}
                              status={msg.whatsapp.status}
                              onRegenerate={() => regenerateWhatsAppQr(msg.id, msg.whatsapp!.instanceId)}
                              onRequestPairingCode={(phoneNumber) => requestWhatsAppPairingCode(msg.id, msg.whatsapp!.instanceId, phoneNumber)}
                            />
                          )}

                          {msg.component?.type === "onboarding_briefing" && (
                            <ChatOnboardingBriefing onComplete={handleOnboardingComplete} disabled={isLoading} />
                          )}

                          {msg.component?.type === "list_picker" && (
                            <ChatListPicker onSelect={handleSelectDraftList} disabled={isLoading} />
                          )}

                          {msg.component?.type === "file_upload" && (
                            <ChatFileUpload onUploaded={handleDraftMediaUploaded} disabled={isLoading} />
                          )}

                          {msg.component?.type === "timing_confirm" && (
                            <ChatTimingConfirm purpose={msg.component.purpose} onConfirm={handleConfirmDraftTiming} disabled={isLoading} />
                          )}

                          {msg.component?.type === "schedule_picker" && (
                            <ChatSchedulePicker purpose={msg.component.purpose} onConfirm={handleConfirmDraftSchedule} disabled={isLoading} />
                          )}

                          {msg.component?.type === "instance_picker" && (
                            <ChatInstancePicker onConfirm={handleConfirmDraftInstances} disabled={isLoading} />
                          )}

                          {msg.component?.type === "campaign_summary" && (
                            <ChatCampaignSummaryConfirm
                              purpose={msg.component.purpose}
                              onConfirm={handleConfirmCampaign}
                              disabled={isLoading}
                              isConfirming={isConfirmingCampaign}
                            />
                          )}

                          {msg.component?.type === "antiban_warning" && (
                            <ChatAntiBanWarningConfirm purpose={msg.component.purpose} onConfirm={handleAcknowledgeAntiBan} disabled={isLoading} />
                          )}

                          {msg.component?.type === "quota_confirm" && (
                            <ChatQuotaConfirm purpose={msg.component.purpose} onConfirm={handleAcknowledgeQuota} disabled={isLoading} />
                          )}

                          {msg.component?.type === "duplicate_campaign_confirm" && (
                            <ChatDuplicateCampaignConfirm
                              purpose={msg.component.purpose}
                              onConfirm={handleApplyDuplicatedCampaign}
                              onCancel={handleCancelDuplicatedCampaign}
                              disabled={isLoading}
                            />
                          )}

                          {msg.component?.type === "contact_exclusion" && (
                            <ChatContactExclusionPicker purpose={msg.component.purpose} onConfirm={handleConfirmExclusions} disabled={isLoading} />
                          )}

                          {msg.component?.type === "followup_scheduler" && (
                            <ChatFollowUpScheduler purpose={msg.component.purpose} onConfirm={handleCreateFollowUp} disabled={isLoading} />
                          )}

                          {msg.component?.type === "lead_picker" && (
                            <ChatLeadPicker purpose={msg.component.purpose} onSelect={handleSelectLead} disabled={isLoading} />
                          )}

                          {msg.actions && msg.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {msg.actions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleAction(action)}
                                  disabled={isLoading}
                                  className="px-4 py-1.5 text-xs font-medium rounded-full glass text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && !(messages[messages.length - 1]?.role === "agent" && messages[messages.length - 1]?.content === "") && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="size-9 rounded-2xl bg-gradient-to-br from-primary/80 to-sky-500/80 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="size-4 text-white" />
                      </div>
                      <div className="glass rounded-3xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent backdrop-blur-md">
          <div className="max-w-[768px] mx-auto">
            <AnimatedAIChat
              value={input}
              onChange={(v) => setInput(v)}
              onSend={sendMessage}
              onSelectAttachType={handleSelectAttachType}
              attachment={pendingAttachment}
              onRemoveAttachment={() => setPendingAttachment(null)}
              placeholder={isUploadingAttachment ? "Enviando anexo..." : "Envie uma mensagem..."}
              disabled={false}
              isLoading={isLoading}
            />
            <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
              O ZapBroker pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>

        <input ref={filesInputRef} type="file" accept={ATTACH_ACCEPT.files} onChange={handleFileSelected} className="hidden" />
        <input ref={mediaInputRef} type="file" accept={ATTACH_ACCEPT.media} onChange={handleFileSelected} className="hidden" />
        <input ref={audioInputRef} type="file" accept={ATTACH_ACCEPT.audio} onChange={handleFileSelected} className="hidden" />

        <LeadImporterModal
          isOpen={isLeadImporterOpen}
          onClose={() => setIsLeadImporterOpen(false)}
          onSuccess={() => setIsLeadImporterOpen(false)}
        />
      </div>

      {currentDraft && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setCurrentDraft(null)}
          />
          <CampaignDraftPanel
            draft={currentDraft}
            onConfirm={handleConfirmCampaign}
            onRemoveMedia={currentDraft.mediaUrl ? handleRemoveDraftMedia : undefined}
            onSaveMessages={(variations) => handleConfirmDraftMessages({ messageVariations: variations })}
            autoEditMessageTrigger={autoEditMessageTrigger}
            isConfirming={isConfirmingCampaign}
          />
        </>
      )}
    </div>
  )
}
