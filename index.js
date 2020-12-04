var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('assets'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


let rooms = ['testo', 'spagetho'];
const gameInfo = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('create-room', msg => {
    console.log('creating', msg);
    if (rooms.includes(msg)) {
      socket.emit('room-create-result', false);
    } else {
      // create room
      rooms.push(msg);
      gameInfo[msg] = {
        players: [socket.id],
        state: null
      }
      startGame();
      socket.join(msg);
      socket.emit('room-create-result', true);
    }
  });

  socket.on('join-room', msg => {
    console.log('joining', msg);
    if (rooms.includes(msg)) {
      // join room
      gameInfo[msg].players.push(socket.id);
      socket.join(msg);
      socket.emit('room-join-result', true);
    } else {
      socket.emit('room-join-result', false);
    }
  });

  socket.on('fish-placed', (msg) => {
    const info = gameInfo[Array.from(socket.rooms)[1]];

    info.fishPlacement = msg;
  })

  socket.on('missile-placed', (msg) => {
    const room = Array.from(socket.rooms)[1];
    const info = gameInfo[room];

    info.missilesLeft--;

    io.to(info.fishPlayer).emit('missile-launched', msg);
    if (info.fishPlacement.includes(msg)) {
      // tell missile player he got a hit
      io.to(info.missilePlayer).emit('fish-hit', msg);
      info.hits++;
    }


    if (info.hits >= 2) {
      io.to(room).emit('fish-destroyed');

    } else {
      io.to(info.fishPlayer).emit('private-msg', `Your opponent has ${info.missilesLeft} more missile${info.missilesLeft != 1 ? 's' : ''}.`);
      io.to(info.missilePlayer).emit('private-msg', `You have ${info.missilesLeft} missile${info.missilesLeft != 1 ? 's' : ''} left.`);

      if (info.missilesLeft > 0) {
        // tell player to launch again
        io.to(info.missilePlayer).emit('fire-missiles');
      } else {
        // missiles finished
        io.to(room).emit('game-over');
      }
    }
  })

  socket.on('restart-game', () => {
    const room = Array.from(socket.rooms)[1];
    const info = gameInfo[room];
    io.to(room).emit('restart-game');

    info.state = null;
    info.fishPlacement = undefined;
    info.missilesLeft = undefined;

    const oldFishPlayer = info.fishPlayer;
    const oldMissilePlayer = info.missilePlayer;

    info.missilePlayer = oldFishPlayer;
    info.fishPlayer = oldMissilePlayer;
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach(r => {
      io.to(r).emit('room-closing');
      delete gameInfo[r];
    });
    rooms = rooms.filter(r => !socket.rooms.has(r));
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log('listening on *:' + port);
});


function startGame() {
  let lastState = null;
  setInterval(() => {
    rooms.forEach(r => {
      const info = gameInfo[r];

      if (info != null) {

        if (info.state === null && info.players.length > 1) {
          // start game, place fish
          info.state = lastState = 'FISH';

          if (!info.fishPlayer || !info.missilePlayer) {
            // default roles if not set
            info.fishPlayer = info.players[0];
            info.missilePlayer = info.players[1];
          }

          io.to(info.fishPlayer).emit('private-msg', 'Place your fish.');
          io.to(info.fishPlayer).emit('place-fish');
          io.to(info.missilePlayer).emit('private-msg', 'Wait for your opponent to place their fish.');
        }

        if (info.state === 'FISH' && info.fishPlacement) {
          // fish placed, start missiles
          info.state = lastState = 'MISSILE';
          info.missilesLeft = 4;
          info.hits = 0;

          io.to(info.fishPlayer).emit('private-msg', 'Wait for your opponent to fire their missiles.');
          io.to(info.missilePlayer).emit('fire-missiles');
          io.to(info.missilePlayer).emit('private-msg', 'Place your missiles to fire them.');
        }

        console.log(info);
        io.to(r).emit('game-info', { state: info.state, players: info.players });
      }

    })
  }, 500)
}