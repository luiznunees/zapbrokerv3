"use client"

import { useEffect } from 'react'
import { useUser } from '@/contexts/user-context'
import { crispPush } from '@/lib/crisp'

// Dentro do dashboard: amarra a conversa ao corretor logado, pra no Crisp aparecer
// nome, email e plano em vez de "visitante". O email vai com a assinatura HMAC gerada
// pelo backend (CRISP_IDENTITY_SECRET) — assim o Crisp marca o contato como verificado.
export function CrispIdentify() {
    const { user } = useUser()
    const name = user?.name || user?.nome
    const email = user?.email
    const signature = user?.crispEmailSignature
    const plan = user?.planName || 'Free'
    const status = user?.subscriptionStatus || 'free'

    useEffect(() => {
        if (!email) return
        crispPush(['set', 'user:email', signature ? [email, signature] : [email]])
        if (name) crispPush(['set', 'user:nickname', [name]])
        crispPush(['set', 'session:data', [[['plano', plan], ['status_assinatura', status]]]])
    }, [email, signature, name, plan, status])

    return null
}
