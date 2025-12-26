import { SimpleTooltip } from '@/components/ui/simple-tooltip'
import { HelpCircle } from 'lucide-react'

interface HelpBadgeProps {
    className?: string
    size?: 'sm' | 'md' | 'lg'
    customMessage?: string
}

export function HelpBadge({
    className = '',
    size = 'md',
    customMessage
}: HelpBadgeProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    }

    const defaultMessage = "🚧 Estamos em desenvolvimento! Caso encontre algum bug ou problema, entre em contato com o suporte."

    return (
        <SimpleTooltip content={customMessage || defaultMessage} side="top">
            <div className={`inline-flex items-center justify-center rounded-full bg-primary/10 p-1.5 cursor-help hover:bg-primary/20 transition-colors ${className}`}>
                <HelpCircle className={`${sizeClasses[size]} text-primary`} />
            </div>
        </SimpleTooltip>
    )
}
