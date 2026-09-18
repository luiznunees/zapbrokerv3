"use client"

import { useState } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Settings, Rocket } from 'lucide-react'

export default function AdminSettingsPage() {
    const [deploying, setDeploying] = useState<'api' | 'app' | null>(null)
    const [deployMessage, setDeployMessage] = useState<string | null>(null)

    const handleDeploy = async (service: 'api' | 'app') => {
        setDeploying(service)
        setDeployMessage(null)
        try {
            await api.admin.triggerDeploy(service)
            setDeployMessage(`Deploy do ${service === 'api' ? 'backend (API)' : 'frontend (App)'} acionado. Leva alguns minutos pra terminar.`)
        } catch (error: any) {
            setDeployMessage(`Erro ao acionar deploy: ${error?.message || 'tente novamente.'}`)
        } finally {
            setDeploying(null)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="text-zinc-500" />
                Configurações do Sistema
            </h1>

            <Card className="bg-zinc-900 border-zinc-800 opacity-50 pointer-events-none">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Manutenção & Acesso</CardTitle>
                    <CardDescription className="text-zinc-500">Controle global de acesso ao sistema — planejado, ainda não implementado. Os controles abaixo são apenas ilustrativos.</CardDescription>
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

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Rocket className="size-4 text-primary" />
                        Deploy (EasyPanel)
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Aciona um redeploy do serviço a partir do último código enviado pro git. Leva
                        alguns minutos até o serviço voltar no ar com o código novo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            disabled={deploying !== null}
                            onClick={() => handleDeploy('api')}
                        >
                            {deploying === 'api' ? 'Acionando...' : 'Deploy da API (backend)'}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            disabled={deploying !== null}
                            onClick={() => handleDeploy('app')}
                        >
                            {deploying === 'app' ? 'Acionando...' : 'Deploy do App (frontend)'}
                        </Button>
                    </div>
                    {deployMessage && <p className="text-sm text-zinc-400">{deployMessage}</p>}
                </CardContent>
            </Card>
        </div>
    )
}
