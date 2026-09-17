# Animation improvement plans — zapbrokerv3/frontend

Gerados a partir do sweep `find-animation-opportunities` (5 oportunidades)
+ 1 bug encontrado durante o audit (`QRCodeModal`'s exit animation nunca
rodava de verdade). Todos carimbados no commit `e8c256d`.

| # | Título | Severidade | Categoria | Escopo | Status |
|---|---|---|---|---|---|
| [001](001-modal-entrance-exit-motion.md) | Modais sem transição (HowItWorksModal + PushPromptModal) | HIGH | Missed opportunity | 2 arquivos | TODO |
| [002](002-chat-action-button-press-feedback.md) | Feedback de clique nos botões de ação do chat | MEDIUM | Physicality | 1 arquivo | TODO |
| [003](003-agent-chat-mockup-sequence.md) | Sequência das bolhas do AgentChatMockup | LOW | Missed opportunity | 1 arquivo | TODO |
| [004](004-whatsapp-mockup-sequence.md) | Sequência das mensagens do WhatsAppMockup | LOW | Missed opportunity | 1 arquivo | TODO |
| [005](005-bio-page-entrance-stagger.md) | Stagger dos links da página /bio | LOW | Missed opportunity | 2 arquivos (1 novo) | TODO |
| [006](006-qrcode-modal-exit-animation-bug.md) | Bug: exit do QRCodeModal nunca roda | HIGH | Interruptibility | 1 arquivo | TODO |

## Ordem recomendada de execução

1. **001 e 006 juntos primeiro** — mesma categoria (modais), mesmo padrão
   de correção (`AnimatePresence` mal posicionado / ausente). Implementar
   os dois na mesma passada evita ter 3 modais com motion levemente
   diferente entre si (001 cobre 2 modais que não tinham nada, 006 conserta
   o 3º que tinha configuração mas nunca rodava — depois dos dois, os 3
   modais do dashboard ficam consistentes).
2. **002** — independente, isolado, rápido (1 className).
3. **003 e 004 juntos** — mesma categoria (sequência de mockup de
   marketing), mesmos valores de easing/duration, fazem sentido revisar
   lado a lado pra manter coerência entre os dois mockups.
4. **005** — o único que exige criar um arquivo novo (split
   server/client component por causa do `export const metadata`). Fazer
   por último porque é o mais estrutural, não porque é menos importante.

## Dependências

- Nenhum plano depende de outro ser executado primeiro (todos são
  self-contained), mas 001 e 006 devem usar os **mesmos valores** de
  duration/easing (`200ms`, `cubic-bezier(0.23, 1, 0.32, 1)`) — se 001 for
  ajustado durante a implementação, replicar o ajuste em 006 antes de
  considerar os dois prontos.
- 003 e 004 compartilham o mesmo padrão de stagger — mesma lógica.

## Convenção de tokens observada

Esse repo **não tem** tokens de easing/duration em CSS (`app/globals.css`
não define `--ease-*`). Todos os planos usam o cubic-bezier
`[0.23, 1, 0.32, 1]` (AUDIT.md — strong ease-out) inline no `transition`
prop do framer-motion, seguindo a convenção já existente no próprio código
(`dashboard/page.tsx` já passa `transition={{ delay: i * 0.05, duration: 0.2 }}`
inline, sem token). Se um dia isso virar token compartilhado, é um plano à
parte de consolidação (AUDIT.md §7), não algo pra introduzir de
carona aqui.
