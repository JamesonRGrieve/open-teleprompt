import { NextResponse } from 'next/server';
import verifyJWT from '../user/AuthProvider';

interface UserSession {
  isMain: boolean;
  clientID: string;
  stream: ReadableStream;
  sendMessage: (data: any) => void;
  heartbeat: Date;
}

const clients = {};
export async function GET(request) {
  const user = await verifyJWT(request);
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const newClientID = request.nextUrl.searchParams.get('clientID');
      const toBeMain = !clients[user.id] || !clients[user.id].find((client) => client.isMain);
      if (clients[user.id] && clients[user.id].findIndex((client) => client.clientID === newClientID) !== -1) {
        console.error('This client already exists!!!');
      } else {
        const newClient: UserSession = {
          clientID: newClientID,
          isMain: toBeMain,
          stream: this,
          sendMessage: (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          },
          heartbeat: new Date(),
        };
        console.log('Created new client: ', newClient);
        if (!Object.keys(clients).includes(user.id)) {
          console.log(`Initializing session array for user ${user.email}.`);
          clients[user.id] = [];
        }
        clients[user.id].push(newClient);
        console.log('Updated clients list: ', clients[user.id]);
        const mainClient = clients[user.id].find((client) => client.isMain);
        newClient.sendMessage({ main: mainClient.clientID });
      }
    },
    cancel(reason) {
      console.log(this);
      clients[user.id].splice(
        clients[user.id].findIndex((session) => session.stream === this),
        1,
      );
      console.log(
        `Connection closed for user ${user.email} because of ${reason}, total remaining: ${clients[user.id].length}.`,
      );
      if (clients[user.id].findIndex((client) => client.isMain) === -1) {
        const newMain = clients[user.id][0];
        console.log(`Main connection closed, promoting client ${newMain.clientID} to main.`);
        newMain.sendMessage({ main: newMain.clientID });
      }
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
  console.log(data);
  console.log(clients);
  const mainClientList = clients[user.id].filter((client) => client.isMain);
  console.log(`Received request from ${data.clientID}: `);
  const mainClient = [0];
  console.log(
    mainClientList.length === 1 ? 'Found main client.' : 'Did not find main client, length: ' + mainClientList.length,
  );
  const thisClientList = clients[user.id].filter((client) => client.clientID === data.clientID);
  const thisClient = thisClientList[0];
  console.log(
    thisClientList.length === 1 ? 'Found this client.' : 'Did not find this client, length: ' + thisClientList.length,
  );
  const now = new Date();
  if ((mainClient === thisClient && (Object.keys(data).length > 1 || Object.keys(data)[0] !== 'clientID')) || data.main) {
    if (data.main) {
      console.log(`Updating main client to ${data.main}.`);
      clients[user.id].find((client) => client.clientID === data.main).isMain = true;
      clients[user.id].find((client) => client.isMain).isMain = false;
    } else {
      console.log(`Request received from main client.`);
    }
    for (const client of clients[user.id]) {
      client.sendMessage(data);
    }
  } else {
    console.log(`Client ${thisClient.clientID}'s heart has beaten.`);
    thisClient.heartbeat = now;
  }

  for (const client of clients[user.id]) {
    if ((now.getTime() - client.heartbeat.getTime()) / 1000 >= 60) {
      console.log(`Disconnecting client ${client.clientID} whose heart has not beaten for 60 seconds.`);
      client.stream.cancel('Heart has not beaten for 60 seconds.');
    }
  }
  return NextResponse.json({ success: true });
}
