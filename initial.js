class Point {
  constructor(xOrPoint, y) {
    if (xOrPoint.x && xOrPoint.y) {
      this.x = xOrPoint.x;
      this.y = xOrPoint.y;
    } else {
      this.x = xOrPoint;
      this.y = y;
    }
  }
}

class DrawingState {
  constructor(position, direction) {
    this.position = position && new Point(position.x, position.y) || new Point(0, 0);
    this.direction = direction || 0; // right
    this.stack = [];
  }

  push() {
    this.stack.push({
      position: new Point(this.position),
      direction: this.direction
    });
  }

  pop() {
    let saved = this.stack.pop();
    if (saved) {
      let {position, direction} = saved;
      this.position = position;
      this.direction = direction;
    }
  }

  depth() {
    return this.stack.length;
  }
}

let drawForward = (drawingState, params) => {
  let {x, y} = drawingState.position;
  let d = drawingState.direction;
  let newX = x + params.length * cos(d);
  let newY = y + params.length * sin(d);
  line(x, y, newX, newY);
  drawingState.position.x = newX;
  drawingState.position.y = newY;
};

let tree = {
  params: {
    angle: 25,
    length: 1,
  },
  axiom: 'X',
  rules: {
    X: 'F[-X][X]F[-X]+FX',
    F: 'FF',
  },
  commands: {
    'F': drawForward,
    '-'(drawingState, params) {
      drawingState.direction -= params.angle;
    },
    '+'(drawingState, params) {
      drawingState.direction += params.angle;
    },
    '['(drawingState, params) {
      drawingState.push();
    },
    ']'(drawingState, params) {
      drawingState.pop();
    },
  }
}

const CANVAS_BOUNDS = new Point(1000, 1000);

let system = tree;

const applyRule = (char, rules) => {
  return rules[char] || char;
}

const evolve = (state, rules) => {
  let out = '';
  for (let i = 0; i < state.length; i++) {
    out += applyRule(state.charAt(i), rules);
  }
  return out;
};

let growLSystem = (system, iters=1) => {
  let systemState = system.axiom;
  for (let i = 0; i < iters; i++) {
    systemState = evolve(systemState, system.rules);
  }
  return systemState;
};

let STATE;
let origin = new Point(0, 0);
let numIters = 1;

function setup() {
  createCanvas(CANVAS_BOUNDS.x, CANVAS_BOUNDS.y);
  angleMode(DEGREES);
  STATE = growLSystem(system, numIters);
}

let drawLSystem = (system, systemState, initialDrawingState) => {
  const drawingState = initialDrawingState || new DrawingState(new Point(50, 500), 0);
  for (let i = 0; i < systemState.length; i++) {
    let command = system.commands[systemState.charAt(i)];
    command && command(drawingState, system.params);
  }
};

function mouseClicked() {
  origin = new Point(mouseX, mouseY);
};

function mouseWheel(event) {
  numIters += event.delta < 0 ? 1 : -1;
  console.log(`${numIters} iterations`);
  STATE = growLSystem(system, numIters);
}

function draw() {
  background(255);
  drawLSystem(system, STATE, new DrawingState(origin, 0));
}
