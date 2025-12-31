"use client"

import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Ban, CheckCircle2, MoreVertical, Smartphone } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await api.admin.getUsers(page, search)
            setUsers(res.data)
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers()
        }, 300)
        return () => clearTimeout(timeout)
    }, [page, search])

    const handleBan = async (userId: string) => {
        if (!confirm('Tem certeza que deseja banir este usuário?')) return;
        try {
            await api.admin.banUser(userId)
            alert('Usuário banido com sucesso')
        } catch (error) {
            alert('Erro ao banir usuário')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-zinc-100">Gerenciar Usuários</h1>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Usuário</TableHead>
                                <TableHead className="text-zinc-400">Plano</TableHead>
                                <TableHead className="text-zinc-400">Instâncias</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                                <TableHead className="text-zinc-400">Criado em</TableHead>
                                <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map(user => (
                                    <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50 text-zinc-300">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-100">{user.name}</span>
                                                <span className="text-xs text-zinc-500">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10">
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Smartphone className="w-3 h-3" />
                                                <span>{user.instanceCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-zinc-700 text-zinc-400"}>
                                                {user.status || 'Free'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(user.created_at || new Date()), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleBan(user.id)}
                                            >
                                                <Ban className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={users.length < 20}
                            onClick={() => setPage(page + 1)}
                            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                        >
                            Próximo
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
