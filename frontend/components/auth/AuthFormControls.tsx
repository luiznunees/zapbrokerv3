"use client"

// Shared brand primitives for auth screens — same color (primary/sky-blue gradient),
// typography scale and control styling everywhere, even when each page's layout differs.
export function AuthInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label htmlFor={props.id} className="block text-sm font-medium text-foreground mb-2">
                {label}
            </label>
            <input
                {...props}
                className="w-full px-4 py-3.5 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
            />
        </div>
    )
}

export function AuthError({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 px-3 rounded-xl">
            {children}
        </div>
    )
}

export function AuthButton({ loading, children, ...props }: { loading?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className="w-full px-4 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {children}
        </button>
    )
}

// The same three-blob gradient wash used on the login banner, reused at smaller scale
// wherever a page wants a bit of that identity without the full split layout.
export function GradientBlobs({ className = '' }: { className?: string }) {
    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-blue-900/30 blur-3xl" />
            <div className="absolute top-1/3 left-1/4 w-56 h-56 rounded-full bg-sky-300/40 blur-3xl" />
        </div>
    )
}

export const AUTH_PAGE_BG = 'bg-[#eef2fb]'
export const AUTH_GRADIENT = 'bg-gradient-to-br from-primary via-sky-500 to-primary/60'
