import { Server } from 'socket.io';

export function GET(req) {
  if (!req.socket.server.io) {
    console.log('Socket is initializing');
    const io = new Server(req.socket.server);
    req.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('scroll', (data) => {
        socket.broadcast.emit('scroll', data);
      });
    });
  }
  return new Response('Socket is running', {
    status: 200,
  });
}
