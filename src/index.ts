import { nanoid } from 'nanoid';
import WebSocket, { WebSocketServer } from 'ws';

type User = {
  id: string;
  socket: WebSocket;
};

type CallUserData = {
  to: string;
  offer: unknown;
};

type AnswerUserData = {
  to: string;
  answer: unknown;
};

type NewIceCandidateData = {
  to: string;
  candidate: unknown;
};

function serialize(data: { type: string; payload: any }) {
  return JSON.stringify(data);
}

function deserialize(data: any): { type: string; payload: any } {
  return JSON.parse(data.toString());
}

const server = new WebSocketServer({
  port: 8888,
});

const userMap = new Map<string, User>();

server.on('connection', (ws) => {
  const userId = nanoid();
  const newUser = {
    id: userId,
    socket: ws,
  };
  console.log('====== new connection', userId);

  ws.send(
    serialize({
      type: 'user-list',
      payload: {
        userIds: [...userMap.keys()],
      },
    })
  );

  userMap.set(userId, newUser);

  server.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      const data = serialize({
        type: 'add-user',
        payload: {
          userId,
        },
      });
      client.send(data);
    }
  });

  ws.on('close', () => {
    server.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          serialize({
            type: 'remove-user',
            payload: {
              userId,
            },
          })
        );
      }
    });
    userMap.delete(userId);
  });

  const onCallUser = (data: CallUserData) => {
    const { to, offer } = data;
    userMap.get(to)?.socket.send(
      serialize({
        type: 'new-call',
        payload: {
          from: userId,
          offer,
        },
      })
    );
  };

  const onAnswerUser = (data: AnswerUserData) => {
    const { to, answer } = data;
    userMap.get(to)?.socket.send(
      serialize({
        type: 'new-answer',
        payload: {
          from: userId,
          answer,
        },
      })
    );
  };

  const onNewIceCandidate = (data: NewIceCandidateData) => {
    const { to, candidate } = data;
    userMap.get(to)?.socket.send(
      serialize({
        type: 'new-ice-candidate',
        payload: {
          from: userId,
          candidate,
        },
      })
    );
  };

  ws.on('message', (data) => {
    const { type, payload } = deserialize(data);
    switch (type) {
      case 'call-user': {
        onCallUser(payload);
        break;
      }
      case 'answer-user': {
        onAnswerUser(payload);
        break;
      }
      case 'new-ice-candidate': {
        onNewIceCandidate(payload);
        break;
      }
    }
  });
});
