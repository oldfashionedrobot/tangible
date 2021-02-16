
const socket = io();

const fire = `
<div class="fire">
  <div class="fire-left">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-main">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-right">
    <div class="main-fire"></div>
    <div class="particle-fire"></div>
  </div>
  <div class="fire-bottom">
    <div class="main-fire"></div>
  </div>
</div>
`;

var squares = document.querySelectorAll('.square');
const gameView = document.querySelector('#game');
const lobbyView = document.querySelector('#lobby');
const roomInput = document.querySelector('#roomInput');
let currentRoom;
let gameTurn;

// start
gameView.style.display = 'none';
lobbyView.style.display = 'block';

function createGame() {
  const roomName = roomInput.value;
  socket.emit('create-room', roomName);

  socket.once('room-create-result', result => {
    if (result === true) {
      // console.log(`Created Game "${roomName}"`);
      startGame(roomName);
    } else {
      alert('Game "' + roomName + '" already exists');
    }
  });
}

function joinGame() {
  const roomName = roomInput.value;
  socket.emit('join-room', roomName);

  socket.once('room-join-result', result => {
    if (result === true) {
      // console.log(`Joined Game "${roomName}"`);
      startGame(roomName);
    } else {
      alert('Game "' + roomName + '" not found');
    }
  })
}

function listenForRoomMessages() {
  socket.on('room-closing', msg => {
    gameView.styles.display = 'none';
    lobbyView.styles.display = 'block';
    document.querySelector('#lobby-msg').textContent = `A player left, game is canceled.`;
  });

  socket.on('private-msg', msg => {
    console.log('private', msg);
    document.querySelector('#game-msg').textContent = msg;
  });
}

function restartGame() {

  socket.emit('restart-game');
}

function startGame(roomName) {
  currentRoom = roomName;
  socket.on('game-info', gameInfo => {
    switch (gameInfo.state) {
      case 'MISSILE':
        console.log('firing missile');
        break;
      case 'FISH':
        console.log('placing fish');
        // start game
        lobbyView.style.display = 'none';
        gameView.style.display = 'block';
        document.querySelector('#gameName').textContent = roomName;
        document.title = `Battle Fish: ${roomName}`;
        break;
      default:
        document.querySelectorAll('.form-group .btn').forEach(btn => {
          btn.classList.add('loading');
        })
        document.querySelector('#lobby-msg').textContent = `Game "${roomName}" created, Waiting for another player...`;
        break;
    }


  });

  listenForRoomMessages();
}



// server tells players what to do
socket.on('place-fish', msg => {
  gameTurn = 'PLACE_FISH';
});

socket.on('fire-missiles', msg => {
  gameTurn = 'FIRE_MISSILES';
});

socket.on('missile-launched', idx => {
  const sq = document.querySelector(`.square[data-index="${idx}"]`);
  if (sq.classList.contains('fish')) {
    sq.classList.add('hit');
    sq.append(fire);
  } else { sq.classList.add('missile'); }
})

socket.on('fish-hit', idx => {
  const sq = document.querySelector(`.square[data-index="${idx}"]`);
  sq.classList.add('hit');
  sq.append(fire);
})

socket.on('game-over', () => {
  document.querySelector('#game-msg').text('Game over!!!');
  document.querySelector('#restartButton').show();
});

socket.on('restart-game', () => {
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove('hit');
  })
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove('missile');
  })
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove('fish');
  })
  document.querySelectorAll('.fire').remove();
  document.querySelector('#restartButton').styles.display = 'none';
});

socket.on('fish-destroyed', () => {
  document.querySelector('#game-msg').textContent = 'Fish destroyed!!!';
  document.querySelector('#restartButton').styles.display = 'block';
});



//-------------------------//
// Event Listeners
//-------------------------//

squares.forEach((s, idx) => s.addEventListener('touchstart', (e) => {
  e.preventDefault();

  if (gameTurn === 'PLACE_FISH') {
    if (e.touches.length > 1) {
      let touch1 = e.touches[0];
      let touch2 = e.touches[1];

      if (touch1.target == touch2.target) {
        return;
      }

      touch1.target.className = 'square fish';
      touch2.target.className = 'square fish';

      gameTurn = null;
      socket.emit(
        'fish-placed', [parseInt(touch1.target.getAttribute('data-index')), parseInt(touch2.target.getAttribute('data-index'))]
      );
    }
  } else if (gameTurn === 'FIRE_MISSILES') {
    let touch1 = e.touches[0];

    if (document.querySelectorAll(touch1.target).hasClass('missile')) {
      // dont re-fire on spot
      return;
    }

    touch1.target.className = 'square missile';

    gameTurn = null;
    socket.emit('missile-placed', parseInt(touch1.target.getAttribute('data-index')));
  }
}));


function oldTouchListener(e) {

  console.log('start');
  e.preventDefault();

  if (e.touches.length >= 3) {
    console.log('three');
    let touch1 = e.touches[0];
    let touch2 = e.touches[1];
    let touch3 = e.touches[2];

    let center = getTriangleCentroid(touch1, touch2, touch3);
    let apex = findApexPoint(center, touch1, touch2, touch3);
    let dir = getPointDirection(apex, center);

    let xDir = '';
    let yDir = '';
    let faceDir = '';
    if (dir.pageX < 0) {
      //left
      xDir = 'left';
    } else {
      //right
      xDir = 'right';
    }

    if (dir.pageY > 0) {
      //up
      yDir = 'down';
    } else {
      // down
      yDir = 'up';
    }

    if (Math.abs(dir.pageY) > Math.abs(dir.pageX)) {
      // use yDir
      faceDir = yDir;
    } else {
      // use xDir
      faceDir = xDir;
    }

    e.target.className = 'square ' + faceDir;
    socket.emit('object-placed', idx + " " + faceDir);

  }
}

function getPointDirection(pointA, pointB) {
  return normalize({
    pageX: pointA.pageX - pointB.pageX,
    pageY: pointA.pageY - pointB.pageY
  });
}


function getTriangleCentroid(touch1, touch2, touch3) {
  // let xOff = ctx.canvas.offsetLeft;
  // let yOff = ctx.canvas.offsetTop;

  var centerX = (touch1.pageX + touch2.pageX + touch3.pageX) / 3;
  var centerY = (touch1.pageY + touch2.pageY + touch3.pageY) / 3;

  // ctx.beginPath();
  // ctx.arc(centerX - xOff, centerY - yOff, 2.5, Math.PI * 2, false);
  // ctx.fillStyle = randomColor();
  // ctx.fill();

  return { pageX: centerX, pageY: centerY };
}

function drawTriangle(ctx, touch1, touch2, touch3) {
  let xOff = ctx.canvas.offsetLeft;
  let yOff = ctx.canvas.offsetTop;
  // Stroked triangle
  ctx.beginPath();
  ctx.moveTo(touch1.pageX - xOff, touch1.pageY - yOff);
  ctx.lineTo(touch2.pageX - xOff, touch2.pageY - yOff);
  ctx.lineTo(touch3.pageX - xOff, touch3.pageY - yOff);
  ctx.closePath();
  ctx.stroke();
}

function findApexPoint(center, touch1, touch2, touch3) {
  let dist1 = dist(center.pageX, center.pageY, touch1.pageX, touch1.pageY);
  let dist2 = dist(center.pageX, center.pageY, touch2.pageX, touch2.pageY);
  let dist3 = dist(center.pageX, center.pageY, touch3.pageX, touch3.pageY);

  let max = (Math.max(dist1, dist2, dist3));

  switch (max) {
    case dist1:
      return touch1;
    case dist2:
      return touch2;
    case dist3:
      return touch3;
    default:
      return 0;
  }

}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}


function diff(num1, num2) {
  if (num1 > num2) {
    return (num1 - num2);
  } else {
    return (num2 - num1);
  }
};

function dist(x1, y1, x2, y2) {
  var deltaX = diff(x1, x2);
  var deltaY = diff(y1, y2);
  var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  return (dist);
};

function mag(x, y) {
  return Math.sqrt(x * x + y * y);
}

function normalize(vec) {
  let m = mag(vec.pageX, vec.pageY);

  return {
    pageX: vec.pageX / m,
    pageY: vec.pageY / m
  }
}