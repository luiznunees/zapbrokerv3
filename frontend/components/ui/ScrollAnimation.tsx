"use client"
import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface ScrollAnimationProps {
    children: React.ReactNode
    className?: string
    animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-right'
    delay?: number
}

export default function ScrollAnimation({ children, className, animation = 'fade-up', delay = 0 }: ScrollAnimationProps) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(entry.target)
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [])

    const getAnimationClass = () => {
        switch (animation) {
            case 'fade-up': return 'translate-y-10 opacity-0'
            case 'fade-in': return 'opacity-0'
            case 'scale-up': return 'scale-95 opacity-0'
            case 'slide-right': return '-translate-x-10 opacity-0'
            default: return 'opacity-0'
        }
    }

    const getVisibleClass = () => {
        switch (animation) {
            case 'fade-up': return 'translate-y-0 opacity-100'
            case 'fade-in': return 'opacity-100'
            case 'scale-up': return 'scale-100 opacity-100'
            case 'slide-right': return 'translate-x-0 opacity-100'
            default: return 'opacity-100'
        }
    }

    return (
        <div
            ref={ref}
            className={twMerge(
                clsx(
                    "transition-all duration-1000 ease-out",
                    isVisible ? getVisibleClass() : getAnimationClass(),
                    className
                )
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    )
}
