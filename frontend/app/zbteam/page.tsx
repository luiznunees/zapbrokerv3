// Login de admin — rota deliberadamente sem link em lugar nenhum do site (nem no /login
// de cliente, nem em nav nenhuma). "Discreta" por não aparecer, não por senha diferente —
// a autenticação real segue sendo a mesma (Supabase Auth) + requireAdmin no backend.
// noindex/nofollow pra não vazar a URL via Google mesmo se algum crawler passar por aqui.
import type { Metadata } from "next"
import { AdminLoginForm } from "./AdminLoginForm"

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <AdminLoginForm />
        </div>
    )
}
