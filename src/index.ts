import { Server } from 'socket.io';

const io = new Server({
  cors: {
    origin: ['https://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

type User = {
  id: string;
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

let users: User[] = [];

io.on('connection', (socket) => {
  console.log('====== new connection', socket.id);
  const exist = users.find((user) => user.id === socket.id);
  if (exist) {
    return;
  }

  const newUser = {
    id: socket.id,
  };
  users.push(newUser);

  socket.emit('user-list', {
    users: users.filter((user) => user.id !== newUser.id),
  });

  socket.broadcast.emit('add-user', {
    user: newUser,
  });

  socket.on('disconnect', () => {
    users = users.filter((user) => user.id !== newUser.id);
    socket.broadcast.emit('remove-user', {
      userId: newUser.id,
    });
  });

  socket.on('call-user', (data: CallUserData) => {
    socket.to(data.to).emit('new-call', {
      from: newUser.id,
      offer: data.offer,
    });
  });

  socket.on('answer-user', (data: AnswerUserData) => {
    socket.to(data.to).emit('new-answer', {
      from: newUser.id,
      answer: data.answer,
    });
  });

  socket.on('new-ice-candidate', (data: NewIceCandidateData) => {
    socket.to(data.to).emit('new-ice-candidate', {
      from: newUser.id,
      candidate: data.candidate,
    });
  });
});

io.listen(8888);
