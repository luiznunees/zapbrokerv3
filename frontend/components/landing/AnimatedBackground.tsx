"use client"

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Base Background */}
            <div className="absolute inset-0 bg-background transition-colors duration-300" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px),
                                     linear-gradient(to bottom, #888 1px, transparent 1px)`,
                    backgroundSize: '4rem 4rem',
                    maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                }}
            />

            {/* Glowing Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow mix-blend-screen dark:mix-blend-overlay" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-slower mix-blend-screen dark:mix-blend-overlay" />

            {/* Floating Particles (CSS only) */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float-1" />
                <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-foreground rounded-full animate-float-2" />
                <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-primary rounded-full animate-float-3" />
            </div>

            {/* Floating Emojis / Elements - Livening up the background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[15%] left-[10%] text-4xl opacity-10 animate-float-slow select-none">🏠</div>
                <div className="absolute top-[40%] right-[15%] text-5xl opacity-10 animate-float-slow select-none" style={{ animationDelay: '1s' }}>⚡</div>
                <div className="absolute bottom-[20%] left-[20%] text-3xl opacity-10 animate-float-slow select-none" style={{ animationDelay: '2s' }}>💼</div>
                <div className="absolute top-[60%] left-[5%] text-2xl opacity-5 animate-pulse-slow select-none">📈</div>
                <div className="absolute bottom-[10%] right-[30%] text-4xl opacity-5 animate-float-3 select-none">🔑</div>
            </div>
        </div>
    )
}
