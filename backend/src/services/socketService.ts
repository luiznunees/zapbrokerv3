import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000', 'http://192.168.0.242:3000', 'https://zapbroker.dev', 'https://www.zapbroker.dev', 'https://app.zapbroker.dev'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_campaign', (campaignId) => {
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
