const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
const staticPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../public/views');
const uuid = require("uuid");
const port = process.env.PORT || 3000;
var app = express();
var engine = require('consolidate');
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

io.on('connection', (socket) => {
  socket.on('join', (params, callback) => {

    if (!isRealString(params.name) || !isRealString(params.room)) {
      return callback('Name and room name are required.');
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage(null, 'Bienvenido'));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage(null, `${params.name} se ha sumado a la conversación.`));
    callback();
  });

  socket.on('createMessage', (message, callback) => {
    var user = users.getUser(socket.id);

    if (user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
    }

    callback();
  });

  socket.on('createLocationMessage', (coords) => {
    var user = users.getUser(socket.id);
    if (user) {
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));  
    }
  });

  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage(null, `${user.name} ha abandonado la conversación.`));
    }
  });
});

app.use(express.static(staticPath));
app.set('views', viewsPath);
app.engine('html', engine.mustache);
app.set('view engine', 'html');
app.get('*', function(req, res) {
  res.render('index',{ 
    room : uuid.v4() 
  });
});

server.listen(port, () => {
  console.log(`Server is up on http://localhost:${port}`);
});
