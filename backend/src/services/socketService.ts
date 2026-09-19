import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { supabase, supabaseAnon } from '../config/supabase';

interface AuthedSocket extends Socket {
    userId?: string;
}

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000', 'http://192.168.0.242:3000', 'https://zapbroker.dev', 'https://www.zapbroker.dev', 'https://app.zapbroker.dev'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Sem isso, qualquer um que alcançasse o socket (CORS não protege chamada não-browser)
    // podia entrar em `campaign:<id>` de qualquer corretor só adivinhando/vazando um UUID
    // e escutar status de disparo/lead de dado de outro usuário.
    io.use(async (socket: AuthedSocket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('unauthorized'));

        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        if (error || !user) return next(new Error('unauthorized'));

        socket.userId = user.id;
        next();
    });

    io.on('connection', (socket: AuthedSocket) => {
        console.log('New client connected:', socket.id, 'user:', socket.userId);

        socket.on('join_campaign', async (campaignId) => {
            const { data: campaign } = await supabase
                .from('campaigns')
                .select('id')
                .eq('id', campaignId)
                .eq('user_id', socket.userId)
                .maybeSingle();

            if (!campaign) {
                console.warn(`Socket ${socket.id} (user ${socket.userId}) tentou entrar em campaign:${campaignId} sem ser dono`);
                return;
            }

            socket.join(`campaign:${campaignId}`);
            console.log(`Socket ${socket.id} joined campaign:${campaignId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
