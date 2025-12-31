"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="text-zinc-500" />
                Configurações do Sistema
            </h1>

            <Card className="bg-zinc-900 border-zinc-800 opacity-50 pointer-events-none">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Manutenção & Acesso</CardTitle>
                    <CardDescription className="text-zinc-500">Controle global de acesso ao sistema (Em Breve).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-zinc-300">Modo de Manutenção</Label>
                            <p className="text-xs text-zinc-500">Impede login de novos usuários.</p>
                        </div>
                        <Switch disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-zinc-300">Novos Cadastros</Label>
                            <p className="text-xs text-zinc-500">Permitir que novos usuários se registrem.</p>
                        </div>
                        <Switch checked disabled />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Cache do Servidor</CardTitle>
                    <CardDescription className="text-zinc-500">Ações de manutenção.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => window.location.reload()}>
                        Recarregar Aplicação
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
