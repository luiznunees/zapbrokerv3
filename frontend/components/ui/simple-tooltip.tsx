
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SimpleTooltipProps {
    children: React.ReactNode
    content: string
    side?: "top" | "right" | "bottom" | "left"
    delayDuration?: number
    className?: string
}

export function SimpleTooltip({
    children,
    content,
    side = "top",
    delayDuration = 200,
    className
}: SimpleTooltipProps) {
    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent side={side} className={className}>
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
