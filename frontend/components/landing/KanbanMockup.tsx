"use client"

import { cn } from "@/lib/utils"

export function KanbanMockup() {
    return (
        <div className="w-full h-full bg-zinc-900 flex flex-col p-4 overflow-hidden relative select-none">
            {/* Header Mockup */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-purple-500" />
                    <span className="text-zinc-400 text-[10px] font-medium">Gestão de Leads</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-3 h-full">
                {/* Column 1: Novos */}
                <div className="flex-1 rounded-lg bg-zinc-800/50 border border-white/5 p-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-400 font-medium">Novos</span>
                        <span className="text-[8px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">3</span>
                    </div>
                    {/* Card 1 */}
                    <div className="bg-zinc-800 border border-white/5 p-2 rounded shadow-sm">
                        <div className="w-8 h-1 bg-zinc-700 rounded-full mb-2" />
                        <div className="h-2 w-16 bg-zinc-600 rounded mb-1" />
                        <div className="h-1.5 w-12 bg-zinc-700 rounded" />
                        <div className="mt-2 flex items-center justify-between">
                            <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px]">R</div>
                            <div className="text-[8px] bg-green-500/10 text-green-500 px-1 rounded">Whatsapp</div>
                        </div>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-zinc-800 border border-white/5 p-2 rounded shadow-sm opacity-60">
                        <div className="w-8 h-1 bg-purple-500/20 rounded-full mb-2" />
                        <div className="h-2 w-14 bg-zinc-600 rounded mb-1" />
                        <div className="h-1.5 w-10 bg-zinc-700 rounded" />
                    </div>
                </div>

                {/* Column 2: Qualificados (Active) */}
                <div className="flex-1 rounded-lg bg-zinc-800/50 border border-white/5 p-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-brand-purple-400 font-medium">Qualificados</span>
                        <span className="text-[8px] bg-brand-purple-500/10 text-brand-purple-400 px-1 py-0.5 rounded">2</span>
                    </div>
                    {/* Card Active */}
                    <div className="bg-zinc-800 border-l-2 border-l-brand-purple-500 border-y border-r border-white/10 p-2 rounded shadow-lg relative">
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-zinc-700 flex-shrink-0" />
                            <div>
                                <div className="h-2 w-12 bg-zinc-300 rounded mb-0.5" />
                                <div className="h-1.5 w-8 bg-zinc-500 rounded" />
                            </div>
                        </div>
                        <div className="space-y-1 mb-2">
                            <div className="h-1.5 w-full bg-zinc-700/50 rounded" />
                            <div className="h-1.5 w-2/3 bg-zinc-700/50 rounded" />
                        </div>
                        <div className="flex gap-1">
                            <span className="text-[6px] bg-zinc-700 px-1 rounded text-zinc-300">Apto 3q</span>
                            <span className="text-[6px] bg-zinc-700 px-1 rounded text-zinc-300">R$ 500k</span>
                        </div>
                    </div>
                </div>

                {/* Column 3: Visita */}
                <div className="flex-1 rounded-lg bg-zinc-800/50 border border-white/5 p-2 flex flex-col gap-2 opacity-50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-400 font-medium">Visita</span>
                        <span className="text-[8px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">0</span>
                    </div>
                    <div className="border border-dashed border-white/10 rounded h-16 flex items-center justify-center">
                        <span className="text-[8px] text-zinc-600">+</span>
                    </div>
                </div>
            </div>

            {/* Floating Cursor/Action to make it alive */}
            <div className="absolute bottom-6 right-8 pointer-events-none">
                <div className="bg-brand-green-500 text-white text-[8px] px-2 py-1 rounded-full shadow-lg shadow-brand-green-500/20 translate-x-2 translate-y-2 animate-bounce">
                    Nova Proposta!
                </div>
            </div>

            {/* Gradient Overlay for integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none" />
        </div>
    )
}
