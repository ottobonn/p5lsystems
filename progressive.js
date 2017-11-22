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
};

const applyRule = (char, rules) => {
  return rules[char] || char;
}

function *ruleGenerator(system, systemState) {
  for (let i = 0, len = systemState.length; i < len; i++) {
    yield applyRule(systemState.charAt(i), system.rules);
  }
}

const progressiveRender = (system, systemState, initialDrawingState, draw=true) => {
  const drawingState = initialDrawingState || new DrawingState(new Point(50, 500), 0);
  let out = '';
  let chain = Promise.resolve();
  for (let fragment of ruleGenerator(system, systemState)) {
    out += fragment;
    for (let i = 0, len = fragment.length; i < len; i++) {
      const command = system.commands[fragment.charAt(i)];
      if (draw) {
        chain.then(() => new Promise((resolve, reject) => {
          setTimeout(() => {
            command && command(drawingState, system.params, 0);
            resolve();
          }, 0);
        }));
      }
    }
  }
  return out;
}

const CANVAS_BOUNDS = new Point(1000, 1000);
let system = tree;
let numIters = 1;

function setup() {
  createCanvas(CANVAS_BOUNDS.x, CANVAS_BOUNDS.y);
  angleMode(DEGREES);
  noLoop();
}

function mouseClicked() {
  background(255);
  let origin = new Point(mouseX, mouseY);
  let systemState = system.axiom;
  for (let i = 0; i < numIters; i++) {
    systemState = progressiveRender(system, systemState, new DrawingState(origin, 0), i === numIters - 1);
  }
};

function mouseWheel(event) {
  numIters += event.delta < 0 ? 1 : -1;
  console.log(`${numIters} iterations`);
}

function draw() {
  // Do nothing
}
