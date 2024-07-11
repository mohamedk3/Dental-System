const AppError = require('./appError');

let io;

module.exports = {
  init: httpServer => {
    // noinspection JSValidateTypes
    io = require('socket.io')(httpServer, {
      cors: {
        origin: process.env.FE_URL,
        methods: ['GET', 'POST'],
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new AppError('Socket.io is not initialized');

    return io;
  },
};
