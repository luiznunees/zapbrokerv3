"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FolderFavouriteStar,
    MagniferZoomIn,
    AltArrowLeft,
    MenuDots,
    UserCircle,
    Smartphone,
    TrashBinTrash,
    ShareCircle,
    Restart,
    MagicStick
} from '@solar-icons/react'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { LeadImporterModal } from '@/components/dashboard/LeadImporterModal'

type ContactList = {
    id: string
    name: string
    created_at: string
    _count?: number
}

type Contact = {
    id: string
    name: string
    phone: string
    created_at: string
}

export default function LeadsPage() {
    const [view, setView] = useState<'folders' | 'contacts'>('folders')
    const [lists, setLists] = useState<ContactList[]>([])
    const [selectedList, setSelectedList] = useState<ContactList | null>(null)
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Menu & Action State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isRenaming, setIsRenaming] = useState<string | null>(null)
    const [newName, setNewName] = useState('')

    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isCreatingContact, setIsCreatingContact] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [newContactData, setNewContactData] = useState({ name: '', phone: '' })

    useEffect(() => {
        fetchLists()
    }, [])

    const checkOnboarding = () => {
        try {
            const saved = localStorage.getItem('onboarding-checklist')
            const savedData = saved ? JSON.parse(saved) : {}

            if (!savedData['import-contacts']) {
                const newData = { ...savedData, 'import-contacts': true }
                localStorage.setItem('onboarding-checklist', JSON.stringify(newData))
                window.dispatchEvent(new Event('onboarding-update'))
            }
        } catch (e) {
            console.error('Error updating onboarding status:', e)
        }
    }

    const fetchLists = async () => {
        setLoading(true)
        try {
            const data = await api.contacts.list()
            setLists(data)
            if (data.length > 0) {
                checkOnboarding()
            }
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return
        setIsSubmitting(true)
        try {
            await api.contacts.createList(newFolderName)
            await fetchLists() // Refresh list
            checkOnboarding() // Mark step as complete
            setIsCreatingFolder(false)
            setNewFolderName('')
        } catch (error) {
            console.error('Failed to create folder:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateContact = async () => {
        if (!newContactData.name.trim() || !newContactData.phone.trim() || !selectedList) return
        setIsSubmitting(true)
        try {
            await api.contacts.create({
                ...newContactData,
                listId: selectedList.id
            })
            // Refresh contacts
            const data = await api.contacts.getAll({ listId: selectedList.id })
            setContacts(data)

            setIsCreatingContact(false)
            setNewContactData({ name: '', phone: '' })
        } catch (error) {
            console.error('Failed to create contact:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenFolder = async (list: ContactList) => {
        setSelectedList(list)
        setView('contacts')
        setLoading(true)
        try {
            const data = await api.contacts.getAll({ listId: list.id })
            setContacts(data)
        } catch (error) {
            console.error('Error fetching contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteList = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta pasta e todos os seus contatos?')) return
        try {
            await api.contacts.deleteList(id)
            setLists(prev => prev.filter(l => l.id !== id))
            setOpenMenuId(null)
            // Success feedback
            // Folder deleted successfully
        } catch (error: any) {
            console.error('Error deleting list:', error)
            const errorMessage = error?.message || 'Erro desconhecido ao excluir pasta'

            // If list not found, it might have been deleted already - remove from UI
            if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
                setLists(prev => prev.filter(l => l.id !== id))
                setOpenMenuId(null)
                console.warn('Folder not found or already deleted');
            } else {
                console.error('Failed to delete folder:', errorMessage);
            }
        }
    }

    const handleRenameList = async () => {
        if (!isRenaming || !newName.trim()) return
        setIsSubmitting(true)
        try {
            await api.contacts.updateList(isRenaming, newName)
            setLists(prev => prev.map(l => l.id === isRenaming ? { ...l, name: newName } : l))
            setIsRenaming(null)
            setNewName('')
            setOpenMenuId(null)
        } catch (error) {
            console.error('Failed to rename folder');
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteContact = async (id: string) => {
        if (!confirm('Deseja excluir este contato?')) return
        try {
            await api.contacts.delete(id)
            setContacts(prev => prev.filter(c => c.id !== id))
        } catch (error) {
            console.error('Failed to delete contact');
        }
    }

    const handleExportCSV = () => {
        if (!contacts || contacts.length === 0) return

        const headers = ['Nome', 'Telefone', 'Data de Cadastro']
        const rows = contacts.map(c => [
            c.name,
            c.phone,
            new Date(c.created_at).toLocaleDateString()
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `leads_${selectedList?.name || 'export'}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredLists = lists.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    )

    if (loading && view === 'folders' && lists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Restart className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Carregando suas pastas...</p>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Create Contact Modal */}
            <AnimatePresence>
                {isCreatingContact && (
                    <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border p-8 rounded-3xl shadow-2xl w-full max-w-md"
                        >
                            <h3 className="text-2xl font-bold mb-2">Novo Contato</h3>
                            <p className="text-muted-foreground mb-6">Adicione um novo contato à pasta {selectedList?.name}.</p>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-muted-foreground mb-2">Nome</label>
                                    <input
                                        type="text"
                                        value={newContactData.name}
                                        onChange={(e) => setNewContactData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-5 py-3 bg-accent/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        placeholder="Nome do contato"
                                        autoFocus
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-muted-foreground mb-2">WhatsApp</label>
                                    <input
                                        type="text"
                                        value={newContactData.phone}
                                        onChange={(e) => setNewContactData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-5 py-3 bg-accent/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        placeholder="ex: 5511999999999"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCreatingContact(false)}
                                    className="px-6 py-3 text-muted-foreground hover:bg-accent rounded-xl transition-colors font-bold"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateContact}
                                    disabled={isSubmitting || !newContactData.name || !newContactData.phone}
                                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Restart className="w-5 h-5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Criar Contato'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Folder Modal */}
            <AnimatePresence>
                {isCreatingFolder && (
                    <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border p-8 rounded-3xl shadow-2xl w-full max-w-md"
                        >
                            <h3 className="text-2xl font-bold mb-2">Nova Pasta</h3>
                            <p className="text-muted-foreground mb-6">Crie uma nova pasta para organizar seus contatos.</p>

                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full px-5 py-3 bg-accent/50 border border-border rounded-2xl mb-8 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                placeholder="Nome da pasta"
                                autoFocus
                                disabled={isSubmitting}
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCreatingFolder(false)}
                                    className="px-6 py-3 text-muted-foreground hover:bg-accent rounded-xl transition-colors font-bold"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateFolder}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Restart className="w-5 h-5 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        'Criar Pasta'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rename Modal */}
            <AnimatePresence>
                {isRenaming && (
                    <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border p-8 rounded-3xl shadow-2xl w-full max-w-md"
                        >
                            <h3 className="text-2xl font-bold mb-2">Renomear Pasta</h3>
                            <p className="text-muted-foreground mb-6">Escolha um novo nome para sua lista de contatos.</p>

                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-5 py-3 bg-accent/50 border border-border rounded-2xl mb-8 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                placeholder="Novo nome da pasta"
                                autoFocus
                                disabled={isSubmitting}
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsRenaming(null)}
                                    className="px-6 py-3 text-muted-foreground hover:bg-accent rounded-xl transition-colors font-bold"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRenameList}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Restart className="w-5 h-5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Alterações'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        {view === 'contacts' && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setView('folders')}
                                className="p-3 hover:bg-accent rounded-2xl transition-colors border border-border/50 shadow-sm"
                            >
                                <AltArrowLeft className="w-6 h-6" />
                            </motion.button>
                        )}
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                {view === 'folders' ? 'Minhas Pastas' : selectedList?.name}
                            </h1>
                            <p className="text-muted-foreground font-medium">
                                {view === 'folders'
                                    ? 'Gerencie seus contatos por listas inteligentes'
                                    : `${contacts.length} contatos nesta lista`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full max-w-md">
                        {view === 'folders' && (
                            <>
                                <button
                                    onClick={() => setIsImporting(true)}
                                    className="px-6 py-3 bg-accent text-accent-foreground font-bold rounded-2xl hover:bg-accent/80 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap border border-border"
                                >
                                    <MagicStick className="w-5 h-5 text-primary" />
                                    Importar PDF
                                </button>
                                <button
                                    onClick={() => setIsCreatingFolder(true)}
                                    className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <FolderFavouriteStar className="w-5 h-5" />
                                    Nova Pasta
                                </button>
                            </>
                        )}
                        {view === 'contacts' && (
                            <>
                                <button
                                    onClick={handleExportCSV}
                                    disabled={contacts.length === 0}
                                    className="px-6 py-3 bg-accent text-accent-foreground font-bold rounded-2xl hover:bg-accent/80 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap border border-border disabled:opacity-50"
                                >
                                    <ShareCircle className="w-5 h-5 text-primary" />
                                    Exportar CSV
                                </button>
                                <button
                                    onClick={() => setIsImporting(true)}
                                    className="px-6 py-3 bg-accent text-accent-foreground font-bold rounded-2xl hover:bg-accent/80 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap border border-border"
                                >
                                    <MagicStick className="w-5 h-5 text-primary" />
                                    Importar Lista
                                </button>
                                <button
                                    onClick={() => setIsCreatingContact(true)}
                                    className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <UserCircle className="w-5 h-5" />
                                    Novo Contato
                                </button>
                            </>
                        )}
                        <div className="relative w-full group">
                            <MagniferZoomIn className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={view === 'folders' ? "Buscar pasta..." : "Buscar contato..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-medium shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {view === 'folders' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl shadow-primary/5"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-accent/30 border-b border-border">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Nome da Pasta</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Criada em</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <AnimatePresence mode="popLayout">
                                    {filteredLists.map((list, index) => (
                                        <motion.tr
                                            key={list.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-primary/5 transition-colors group cursor-pointer"
                                            onClick={() => handleOpenFolder(list)}
                                        >
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary transition-all group-hover:bg-primary/20">
                                                        <FolderFavouriteStar className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-sm text-foreground">{list.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-xs font-medium text-muted-foreground">
                                                {new Date(list.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenMenuId(openMenuId === list.id ? null : list.id)
                                                        }}
                                                        className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                    >
                                                        <MenuDots className="w-4 h-4" />
                                                    </button>
                                                    {/* Dropdown Menu */}
                                                    <AnimatePresence>
                                                        {openMenuId === list.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                                                            >
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setIsRenaming(list.id)
                                                                        setNewName(list.name)
                                                                        setOpenMenuId(null)
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                                                                >
                                                                    Renomear
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteList(list.id)
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-500/10 text-red-500 flex items-center gap-2 transition-colors"
                                                                >
                                                                    Excluir
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredLists.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FolderFavouriteStar className="w-10 h-10 text-muted-foreground/20 mb-3" />
                                                <p className="text-muted-foreground font-bold text-sm">Nenhuma pasta encontrada.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl shadow-primary/5"
                >
                    {loading ? (
                        <div className="p-24 text-center">
                            <Restart className="w-10 h-10 animate-spin text-primary mx-auto mb-6" />
                            <p className="text-muted-foreground font-bold">Carregando contatos...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-accent/30 border-b border-border">
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground/70">Nome</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground/70">WhatsApp</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground/70">Adicionado em</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground/70 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    <AnimatePresence mode="popLayout">
                                        {filteredContacts.map((contact, index) => (
                                            <motion.tr
                                                key={contact.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="hover:bg-primary/5 transition-colors group"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-inner">
                                                            {contact.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-foreground">{contact.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3 text-muted-foreground font-medium">
                                                        <Smartphone className="w-4 h-4 text-primary/60" />
                                                        <span className="text-sm">{contact.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-bold text-muted-foreground/60">
                                                    {new Date(contact.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <a
                                                            href={`https://wa.me/${contact.phone}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all hover:scale-110 active:scale-95"
                                                            title="Ver no WhatsApp"
                                                        >
                                                            <ShareCircle className="w-5 h-5" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteContact(contact.id)}
                                                            className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                            title="Excluir"
                                                        >
                                                            <TrashBinTrash className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {filteredContacts.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center text-muted-foreground font-bold italic bg-accent/5">
                                                Nenhum contato encontrado nesta pasta.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}


            <LeadImporterModal
                isOpen={isImporting}
                onClose={() => setIsImporting(false)}
                onSuccess={() => {
                    fetchLists() // Always refresh lists
                    if (selectedList) {
                        handleOpenFolder(selectedList) // Refresh current list context if any
                    }
                }}
            />
        </div>
    )
}
