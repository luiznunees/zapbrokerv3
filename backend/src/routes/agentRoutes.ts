import { Router, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { chat, executeAction, createSession, listSessions, deleteSession, getSessionMessages, getSuggestions } from '../services/agentService';

const router = Router();

interface ChatBody {
  message: string;
  history?: Array<{ role: string; content: string }>;
  sessionId?: string;
}

interface ExecuteBody {
  actionType: string;
  data?: any;
}

router.post('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Usuário não autenticado.' }); return; }
    const { title } = req.body || {};
    const session = await createSession(userId, title);
    res.json(session);
  } catch (error: any) {
    console.error('[AgentRoutes] Error creating session:', error.message);
    res.status(500).json({ error: 'Erro ao criar sessão.' });
  }
});

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Usuário não autenticado.' }); return; }
    const sessions = await listSessions(userId);
    res.json(sessions);
  } catch (error: any) {
    console.error('[AgentRoutes] Error listing sessions:', error.message);
    res.status(500).json({ error: 'Erro ao listar sessões.' });
  }
});

router.delete('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Usuário não autenticado.' }); return; }
    await deleteSession(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[AgentRoutes] Error deleting session:', error.message);
    res.status(500).json({ error: 'Erro ao deletar sessão.' });
  }
});

router.get('/sessions/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Usuário não autenticado.' }); return; }
    const messages = await getSessionMessages(userId, req.params.id);
    res.json(messages);
  } catch (error: any) {
    console.error('[AgentRoutes] Error getting session messages:', error.message);
    res.status(500).json({ error: 'Erro ao carregar mensagens.' });
  }
});

router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message, history, sessionId } = req.body as ChatBody;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Mensagem é obrigatória.' });
      return;
    }

    console.log(`[AgentRoutes] /agent/chat - user=${userId} session=${sessionId || 'new'} message="${message.substring(0, 50)}..."`);

    const safeHistory: Array<{ role: 'user' | 'system' | 'assistant'; content: string }> = (history || []).map((msg: any) => ({
      role: msg.role as 'user' | 'system' | 'assistant',
      content: msg.content,
    }));
    const result = await chat(userId, message.trim(), safeHistory, sessionId);

    res.json(result);
  } catch (error: any) {
    console.error('[AgentRoutes] Error in /agent/chat:', error.message);
    res.status(500).json({ error: 'Erro interno ao processar mensagem do agente.' });
  }
});

router.post('/chat/stream', async (req: AuthRequest, res: Response) => {
  const { message, sessionId } = req.body as ChatBody;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Mensagem é obrigatória.' });
    return;
  }

  console.log(`[AgentRoutes] /agent/chat/stream - user=${userId} session=${sessionId || 'new'}`);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await chat(
      userId,
      message.trim(),
      [],
      sessionId,
      (token) => send('token', { token }),
      () => send('reset', {})
    );
    send('done', result);
  } catch (error: any) {
    console.error('[AgentRoutes] Error in /agent/chat/stream:', error.message);
    send('error', { error: 'Erro interno ao processar mensagem do agente.' });
  } finally {
    res.end();
  }
});

router.get('/suggestions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: 'Usuário não autenticado.' }); return; }

    const suggestions = await getSuggestions(userId);
    res.json({ suggestions });
  } catch (error: any) {
    console.error('[AgentRoutes] Error getting suggestions:', error.message);
    res.status(500).json({ error: 'Erro ao gerar sugestões.' });
  }
});

router.post('/execute', async (req: AuthRequest, res: Response) => {
  try {
    const { actionType, data } = req.body as ExecuteBody;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    if (!actionType || typeof actionType !== 'string') {
      res.status(400).json({ error: 'actionType é obrigatório.' });
      return;
    }

    console.log(`[AgentRoutes] /agent/execute - user=${userId} action=${actionType}`);

    const result = await executeAction(userId, actionType, data || {});

    res.json(result);
  } catch (error: any) {
    console.error('[AgentRoutes] Error in /agent/execute:', error.message);
    res.status(500).json({ error: 'Erro interno ao executar ação do agente.' });
  }
});

export default router;
