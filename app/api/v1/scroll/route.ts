import { NextResponse } from 'next/server';
import verifyJWT from '../user/AuthProvider';

interface UserSession {
  stream: ReadableStream;
  sendMessage: (data: any) => void;
}

const clients = {};
export async function GET(request) {
  const user = await verifyJWT(request);
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const newClient: UserSession = {
        stream: this,
        sendMessage: (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        },
      };
      newClient.sendMessage(!clients[user.id] || clients[user.id].length === 0);
      clients[user.id] = [...(clients[user.id] ? clients[user.id] : []), newClient];
    },
    cancel(reason) {
      console.log(this);
      clients[user.id] = [...clients[user.id].filter((session) => session.stream !== this)];
      if (clients[user.id].length === 1) {
        clients[user.id][0].sendMessage(true);
      }
      console.log(`Connection closed for user ${user.email}, total remaining: ${clients[user.id].length}.`);
      console.log(`Total remaining active connections: ${Object.values(clients).flat().length}`);
    },
  });

  console.log(`New connection established for user ${user.email}, total: ${clients[user.id].length}.`);
  console.log(`Total active connections: ${Object.values(clients).flat().length}`);

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  const user = await verifyJWT(request);
  const data = await request.json();
  for (const client of clients[user.id]) {
    client.sendMessage(data);
  }
  return NextResponse.json({ success: true });
}
