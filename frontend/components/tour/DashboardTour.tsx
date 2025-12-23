import { useState } from 'react'
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'

interface DashboardTourProps {
    run: boolean
    onFinish: () => void
}

export function DashboardTour({ run, onFinish }: DashboardTourProps) {
    const [stepIndex, setStepIndex] = useState(0)

    const steps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h2 className="text-xl font-bold mb-2">👋 Bem-vindo ao ZapBroker!</h2>
                    <p>Vamos fazer um tour rápido pelas principais funcionalidades</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '[data-tour="onboarding-checklist"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">📋 Checklist de Onboarding</h3>
                    <p>Acompanhe seu progresso aqui. Complete todas as tarefas para aproveitar ao máximo o ZapBroker!</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="stats-leads"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">👥 Total de Leads</h3>
                    <p>Veja quantos contatos você tem cadastrados</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="stats-campaigns"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">📤 Campanhas Enviadas</h3>
                    <p>Acompanhe quantas campanhas você já criou</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="quota-widget"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">📊 Quota Semanal</h3>
                    <p>Monitore quantas mensagens você pode enviar esta semana</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="whatsapp-status"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">💚 Status WhatsApp</h3>
                    <p>Verifique se sua instância está conectada</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="sidebar-campaigns"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">🚀 Campanhas</h3>
                    <p>Crie e gerencie suas campanhas de envio em massa</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '[data-tour="sidebar-leads"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">📇 Leads</h3>
                    <p>Importe e organize suas listas de contatos</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: 'body',
            content: (
                <div>
                    <h2 className="text-xl font-bold mb-2">🎉 Tour Concluído!</h2>
                    <p>Agora você está pronto para começar. Boa sorte com suas campanhas!</p>
                </div>
            ),
            placement: 'center',
        },
    ]

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, index, action } = data

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            // Tour finished or skipped
            localStorage.setItem('has-completed-tour', 'true')
            onFinish()
        }

        if (action === 'next') {
            setStepIndex(index + 1)
        } else if (action === 'prev') {
            setStepIndex(index - 1)
        }
    }

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            stepIndex={stepIndex}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: 'hsl(var(--primary))',
                    zIndex: 10000,
                },
                tooltip: {
                    borderRadius: 12,
                    padding: 20,
                },
                buttonNext: {
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 'bold',
                },
                buttonBack: {
                    borderRadius: 8,
                    padding: '8px 16px',
                },
                buttonSkip: {
                    borderRadius: 8,
                    padding: '8px 16px',
                },
            }}
            locale={{
                back: 'Voltar',
                close: 'Fechar',
                last: 'Finalizar',
                next: 'Próximo',
                skip: 'Pular Tour',
            }}
        />
    )
}
