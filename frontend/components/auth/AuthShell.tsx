"use client"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { AUTH_PAGE_BG, AUTH_GRADIENT, GradientBlobs } from './AuthFormControls'

// Split-card layout — used by the login screen specifically (its "signature" look).
// Other auth screens use their own layout so the family doesn't feel like four copies
// of the same template, but they all share color/typography from AuthFormControls.
interface AuthShellProps {
    bannerEyebrow: string
    bannerTitle: string
    title: string
    subtitle: string
    children: React.ReactNode
    backHref?: string
}

export function AuthShell({ bannerEyebrow, bannerTitle, title, subtitle, children, backHref = '/' }: AuthShellProps) {
    return (
        <div className={`min-h-screen w-full flex items-center justify-center ${AUTH_PAGE_BG} p-4 sm:p-8`}>
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-xl">

                <div className={`hidden lg:flex relative flex-col justify-between p-10 overflow-hidden m-3 rounded-2xl ${AUTH_GRADIENT}`}>
                    <GradientBlobs />

                    <BrandLogo className="relative z-10 h-9 w-auto text-white" monochrome />

                    <div className="relative z-10">
                        <p className="text-white/70 text-base mb-3">{bannerEyebrow}</p>
                        <h2 className="text-3xl font-bold text-white leading-tight">{bannerTitle}</h2>
                    </div>
                </div>

                <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12">
                    <div className="absolute top-6 left-6 lg:hidden">
                        <Link href={backHref} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-xs">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Link>
                    </div>

                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-8">
                            <BrandLogo className="h-9 w-auto text-primary mb-6 lg:hidden" />
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
                            <p className="text-muted-foreground mt-3 text-base">{subtitle}</p>
                        </div>

                        {children}
                    </div>
                </div>

            </div>
        </div>
    )
}
