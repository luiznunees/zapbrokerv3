
import { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, AlertCircle } from "lucide-react"
import { api } from '@/services/api'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Contact {
    id: string
    name: string
    phone: string
    email?: string
}

interface ContactExclusionModalProps {
    isOpen: boolean
    onClose: () => void
    listId: string
    initialExcludedIds: string[]
    onSave: (excludedIds: string[]) => void
}

export function ContactExclusionModal({
    isOpen,
    onClose,
    listId,
    initialExcludedIds,
    onSave
}: ContactExclusionModalProps) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Store excluded IDs. If an ID is in this set, it is unchecked (excluded).
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set(initialExcludedIds))

    useEffect(() => {
        if (isOpen && listId) {
            fetchContacts()
            setExcludedIds(new Set(initialExcludedIds))
        }
    }, [isOpen, listId])

    const fetchContacts = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await api.contacts.getAll({ listId })
            // Assuming API returns array or { data: array }
            const list = Array.isArray(data) ? data : (data.data || [])
            setContacts(list)
        } catch (err: any) {
            setError('Falha ao carregar contatos. Tente novamente.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredContacts = useMemo(() => {
        if (!searchTerm) return contacts
        const lower = searchTerm.toLowerCase()
        return contacts.filter(c =>
            (c.name && c.name.toLowerCase().includes(lower)) ||
            c.phone.includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(lower))
        )
    }, [contacts, searchTerm])

    const toggleContact = (id: string) => {
        const newExcluded = new Set(excludedIds)
        if (newExcluded.has(id)) {
            newExcluded.delete(id) // Re-include
        } else {
            newExcluded.add(id) // Exclude
        }
        setExcludedIds(newExcluded)
    }

    const handleSave = () => {
        onSave(Array.from(excludedIds))
        onClose()
    }

    // Bulk actions for filtered view
    const toggleAllVisible = () => {
        // If all visible are included (not in excluded), then exclude all
        // If some are excluded, include all
        const visibleIds = filteredContacts.map(c => c.id)
        const allVisibleIncluded = visibleIds.every(id => !excludedIds.has(id))

        const newExcluded = new Set(excludedIds)

        if (allVisibleIncluded) {
            // Exclude all visible
            visibleIds.forEach(id => newExcluded.add(id))
        } else {
            // Include all visible (remove from excluded)
            visibleIds.forEach(id => newExcluded.delete(id))
        }
        setExcludedIds(newExcluded)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Filtrar Destinatários</DialogTitle>
                    <DialogDescription>
                        Desmarque os contatos que você <strong>não deseja</strong> enviar nesta campanha.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome, telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                        <span>{filteredContacts.length} contatos encontrados</span>
                        <div className="space-x-2">
                            <Button variant="ghost" size="sm" onClick={toggleAllVisible} className="h-auto py-1 px-2 text-xs">
                                {filteredContacts.every(c => !excludedIds.has(c.id)) ? 'Desmarcar Todos' : 'Marcar Todos'}
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-md flex-1 overflow-hidden relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : null}

                        <ScrollArea className="h-[400px]">
                            <div className="p-4 space-y-2">
                                {filteredContacts.length === 0 && !loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum contato encontrado.
                                    </div>
                                ) : (
                                    filteredContacts.map(contact => {
                                        const isExcluded = excludedIds.has(contact.id)
                                        const isChecked = !isExcluded

                                        return (
                                            <div
                                                key={contact.id}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${isChecked ? 'bg-background border-border' : 'bg-muted/50 border-transparent opacity-60'}`}
                                            >
                                                <Checkbox
                                                    id={`contact-${contact.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleContact(contact.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none flex-1 cursor-pointer" onClick={() => toggleContact(contact.id)}>
                                                    <label
                                                        htmlFor={`contact-${contact.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {contact.name || 'Sem Nome'}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {contact.phone}
                                                    </p>
                                                </div>
                                                {isExcluded && (
                                                    <span className="text-xs font-medium text-destructive px-2 py-1 rounded bg-destructive/10">
                                                        Excluído
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex justify-between items-center text-sm px-1">
                        <span className="text-muted-foreground">
                            Total na lista: {contacts.length}
                        </span>
                        <span className="font-medium text-destructive">
                            {excludedIds.size} excluídos
                        </span>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar Filtro
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
