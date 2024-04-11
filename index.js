import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));


// Milliforrit sem bætir breytunni requestTime við req hlutinn/objectinn
var requestTime = (req, res, next) => {
  req.requestTime = new Date();
  // köllum á næsta milliforriti í röðinni 
  next();
};

app.use(requestTime);

// Milliforrit sem bætir breytunni requestTime við socket.request hlutinn/objectinn
// Sjá grein á socket.io síðunni um notkun milliforrita með socket.io 
// https://socket.io/docs/v3/middlewares/
var requestTimeSocket = (socket, next) => {
	socket.request.requestTime = new Date();
	// köllum á næsta milliforriti í röðinni 
	next();
};

// biðjum um að requestTimeSocket milliforritið sé notað
io.use(requestTimeSocket);

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
  console.log('visitor arrived at: ', req.requestTime);
});

let userList = [];

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('chooseName');
    socket.on('chooseName', (userName) => {
      socket.userName = userName;    
      userList.push(userName);
      io.emit('updateUsers', userList);
    });
    socket.on('disconnect', () => {
      console.log(socket.userName+' disconnected');
      let userNumber;
      for (let i=0; i<userList.length; i++) {
        if (userList[i] === socket.userName) {
          userNumber = i;
        }
      }
      userList.splice(userNumber, 1);

    });
    socket.on('chat message', (msg) => {
      let customDate = socket.request.requestTime.getHours()+':'+socket.request.requestTime.getMinutes()+':'+socket.request.requestTime.getSeconds();
      io.emit('chat message', socket.userName+' wrote: '+msg, customDate);
    });    
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});