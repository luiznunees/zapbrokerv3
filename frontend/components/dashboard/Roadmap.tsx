"use client";

import { motion } from "framer-motion";
import { ArrowUp, CheckCircle2, FlaskConical, MessageSquarePlus, Timer } from "lucide-react";
import { useState } from "react";

type Proposal = {
    id: string;
    title: string;
    description: string;
    votes: number;
    status: "planned" | "in-progress" | "completed";
    myVote: boolean;
};

const INITIAL_PROPOSALS: Proposal[] = [
    {
        id: "1",
        title: "App Mobile Nativo (iOS/Android)",
        description: "Versão nativa para gerenciar disparos direto do celular com notificações push.",
        votes: 142,
        status: "planned",
        myVote: false,
    },
    {
        id: "2",
        title: "Integração com ChatGPT-4",
        description: "Melhorar a IA de respostas usando o modelo mais recente da OpenAI.",
        votes: 89,
        status: "in-progress",
        myVote: true,
    },
    {
        id: "3",
        title: "Disparo de Áudio Gravado",
        description: "Simular envio de áudio como se fosse gravado na hora.",
        votes: 312,
        status: "planned",
        myVote: false,
    },
    {
        id: "4",
        title: "Integração CRM (Salesforce/Hubspot)",
        description: "Envie leads diretamente para seu CRM favorito.",
        votes: 56,
        status: "completed",
        myVote: false,
    },
];

export function Roadmap() {
    const [proposals, setProposals] = useState(INITIAL_PROPOSALS);

    const toggleVote = (id: string) => {
        setProposals((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    return {
                        ...p,
                        votes: p.myVote ? p.votes - 1 : p.votes + 1,
                        myVote: !p.myVote,
                    };
                }
                return p;
            })
        );
    };

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Column 1: Planned */}
            <StatusColumn
                title="Em Breve"
                icon={<Timer className="h-5 w-5 text-blue-500" />}
                proposals={proposals.filter((p) => p.status === "planned")}
                onVote={toggleVote}
            />

            {/* Column 2: In Progress */}
            <StatusColumn
                title="Em Desenvolvimento"
                icon={<FlaskConical className="h-5 w-5 text-amber-500" />}
                proposals={proposals.filter((p) => p.status === "in-progress")}
                onVote={toggleVote}
            />

            {/* Column 3: Completed */}
            <StatusColumn
                title="Concluído"
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                proposals={proposals.filter((p) => p.status === "completed")}
                onVote={toggleVote}
                readonly
            />

            {/* CTA for New Suggestion */}
            <div className="lg:col-span-3 mt-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
                <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-white/20 rounded-full">
                        <MessageSquarePlus className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Tem uma ideia brilhante?</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Ajudamos você a vender mais. Diga-nos o que falta para o Zapbroker ser perfeito para você.
                </p>
                <button className="px-6 py-3 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                    Sugerir Funcionalidade
                </button>
            </div>
        </div>
    );
}

function StatusColumn({
    title,
    icon,
    proposals,
    onVote,
    readonly = false,
}: {
    title: string;
    icon: React.ReactNode;
    proposals: Proposal[];
    onVote: (id: string) => void;
    readonly?: boolean;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h3 className="font-bold text-foreground">{title}</h3>
                <span className="ml-auto text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {proposals.length}
                </span>
            </div>

            {proposals.map((proposal) => (
                <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-xl border border-border bg-card text-card-foreground shadow-sm ${proposal.myVote ? "ring-2 ring-primary/20" : ""
                        }`}
                >
                    <h4 className="font-bold mb-2">{proposal.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {proposal.description}
                    </p>

                    <div className="flex items-center justify-between">
                        {!readonly ? (
                            <button
                                onClick={() => onVote(proposal.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${proposal.myVote
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                            >
                                <ArrowUp className="h-3 w-3" />
                                {proposal.votes}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Entregue
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
