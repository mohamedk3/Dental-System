const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle uncaught exceptions (sync)
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!, shutting down the app..');
  process.exit(1);
});

// Loading env variables and importing express app
dotenv.config({ path: './config.env' });
const app = require('./app');

// DB Connection
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASS);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('db connected! ✅');
  });

// Initializing server
const PORT_NUM = process.env.PORT || 3000;
const CURRENT_TIME = new Date().toLocaleTimeString('default', {
  hour: '2-digit',
  minute: '2-digit',
});

// Initializing the server
const server = app.listen(PORT_NUM, () => {
  console.log(`${CURRENT_TIME} - App is running on port ${PORT_NUM}`);
});

// Initializing socket.io
const io = require('./utils/socket').init(server);
io.on('connection', socket => {
  console.log('Client Connected 🚀🚀🚀');
});

// Handle  the unhandled promise rejections (async)
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!, shutting down the app..');
  server.close(() => {
    process.exit(1);
  });
});
