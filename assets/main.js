




// Get the canvas.
// var canvas = document.querySelectorAll('canvas');
var squares = document.querySelectorAll('.square');

var socket = io();

socket.on('object-placed', msg => {
  let [idx, dir] = msg.split(' ');

  squares[idx].className = 'square ' + dir;
})


// Get a 2d drawing context.
// var ctx = canvas.getContext('2d');

// Used to keep track of active touches.
// var currentTouches = new Array;


//-------------------------//
// Helper Methods
//-------------------------//


// Returns a random color from an array.
// var randomColor = function () {
//   var colors = ['#3F3F3F', '#929292', '#00A3EE', '#F5D908', '#D80351'];
//   return colors[Math.floor(Math.random() * colors.length)];
// };


// // Finds the array index of a touch in the currentTouches array.
// var findCurrentTouchIndex = function (id) {
//   for (var i = 0; i < currentTouches.length; i++) {
//     if (currentTouches[i].id === id) {
//       return i;
//     }
//   }

//   // Touch not found! Return -1.
//   return -1;
// };


//-------------------------//
// Handler Methods
//-------------------------//


// Creates a new touch in the currentTouches array and draws the starting
// point on the canvas.
// var touchStarted = function (event) {
//   var touches = event.changedTouches;

//   for (var i = 0; i < touches.length; i++) {
//     var touch = touches[i];
//     var touchColor = randomColor();

//     currentTouches.push({
//       id: touch.identifier,
//       pageX: touch.pageX,
//       pageY: touch.pageY,
//       color: touchColor
//     });

//     ctx.beginPath();
//     ctx.arc(touch.pageX, touch.pageY, 2.5, Math.PI * 2, false);
//     ctx.fillStyle = touchColor;
//     ctx.fill();
//   }

// };


// // Draws a line on the canvas between the previous touch location and
// // the new location.
// var touchMoved = function (event) {
//   var touches = event.changedTouches;

//   for (var i = 0; i < touches.length; i++) {
//     var touch = touches[i];
//     var currentTouchIndex = findCurrentTouchIndex(touch.identifier);

//     if (currentTouchIndex >= 0) {
//       var currentTouch = currentTouches[currentTouchIndex];

//       ctx.beginPath();
//       ctx.moveTo(currentTouch.pageX, currentTouch.pageY);
//       ctx.lineTo(touch.pageX, touch.pageY);
//       ctx.lineWidth = 4;
//       ctx.strokeStyle = currentTouch.color;
//       ctx.stroke();

//       // Update the touch record.
//       currentTouch.pageX = touch.pageX;
//       currentTouch.pageY = touch.pageY;

//       // Store the record.
//       currentTouches.splice(currentTouchIndex, 1, currentTouch);
//     } else {
//       console.log('Touch was not found!');
//     }

//   }

// };


// // Draws a line to the final touch position on the canvas and then
// // removes the touh from the currentTouches array.
// var touchEnded = function (event) {
//   var touches = event.changedTouches;

//   for (var i = 0; i < touches.length; i++) {
//     var touch = touches[i];
//     var currentTouchIndex = findCurrentTouchIndex(touch.identifier);

//     if (currentTouchIndex >= 0) {
//       var currentTouch = currentTouches[currentTouchIndex];

//       ctx.beginPath();
//       ctx.moveTo(currentTouch.pageX, currentTouch.pageY);
//       ctx.lineTo(touch.pageX, touch.pageY);
//       ctx.lineWidth = 4;
//       ctx.strokeStyle = currentTouch.color;
//       ctx.stroke();

//       // Remove the record.
//       currentTouches.splice(currentTouchIndex, 1);
//     } else {
//       console.log('Touch was not found!');
//     }

//   }

// };


// // Removes cancelled touches from the currentTouches array.
// var touchCancelled = function (event) {
//   var touches = event.changedTouches;

//   for (var i = 0; i < touches.length; i++) {
//     var currentTouchIndex = findCurrentTouchIndex(touches[i].identifier);

//     if (currentTouchIndex >= 0) {
//       // Remove the touch record.
//       currentTouches.splice(currentTouchIndex, 1);
//     } else {
//       console.log('Touch was not found!');
//     }
//   }
// };





//-------------------------//
// Event Listeners
//-------------------------//

squares.forEach((s, idx) => s.addEventListener('touchstart', (e) => {

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
}));

// // Set up an event listener for new touches.
// canvas.forEach(c => c.addEventListener('touchstart', function (e) {

//   var ctx = e.target.getContext('2d');

//   console.log('start');
//   e.preventDefault();
//   // touchStarted(e);
//   if (e.touches.length >= 3) {
//     console.log('three');
//     let touch1 = e.touches[0];
//     let touch2 = e.touches[1];
//     let touch3 = e.touches[2];

//     drawTriangle(ctx, touch1, touch2, touch3);
//     let center = getTriangleCentroid(ctx, touch1, touch2, touch3);
//     let apex = findApexPoint(center, touch1, touch2, touch3);


//     let xOff = ctx.canvas.offsetLeft;
//     let yOff = ctx.canvas.offsetTop;
//     ctx.beginPath();
//     ctx.arc(apex.pageX - xOff, apex.pageY - yOff, 5, Math.PI * 2, false);
//     ctx.fillStyle = randomColor();
//     ctx.fill();
//   }

// }));


// Set up an event listener for when a touch ends.
// canvas.forEach(c => c.addEventListener('touchend', function (e) {
//   var ctx = e.target.getContext('2d');
//   console.log('end');
//   e.preventDefault();
//   // touchEnded(e);
//   if (e.touches.length < 3) {
//     // clearCanvas();
//   }
// }));

// // Set up an event listener for when the touch instrument is moved.
// canvas.forEach(c => c.addEventListener('touchmove', function (e) {
//   var ctx = e.target.getContext('2d');
//   console.log('move');
//   e.preventDefault();
//   // touchMoved(e);

//   if (e.touches.length >= 3) {
//     let touch1 = e.touches[0];
//     let touch2 = e.touches[1];
//     let touch3 = e.touches[2];

//     // clearCanvas();
//     // drawTriangle(touch1, touch2, touch3);
//   }

// }));

// // Set up an event listener to catch cancelled touches.
// canvas.addEventListener('touchcancel', function (e) {
//   // console.log('cancel');
//   touchCancelled(e);
// });

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