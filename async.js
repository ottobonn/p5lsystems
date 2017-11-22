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
    this.state = Object.create(null);
    this.state.position = position && new Point(position.x, position.y) || new Point(0, 0);
    this.state.direction = direction || 0; // right
    this.stack = [];
  }

  push() {
    this.stack.push(JSON.stringify(this.state));
  }

  pop() {
    this.state = JSON.parse(this.stack.pop() || '{}');
  }

  get depth() {
    return this.stack.length;
  }
}

let drawForward = (drawingState, params) => {
  let {x, y} = drawingState.state.position;
  let d = drawingState.state.direction;
  let newX = x + params.length * cos(d);
  let newY = y + params.length * sin(d);
  push();
  // strokeWeight(1 / drawingState.depth)
  strokeWeight(drawingState.state.strokeWeight);
  line(x, y, newX, newY);
  pop();
  drawingState.state.position.x = newX;
  drawingState.state.position.y = newY;
};

let arrowhead = {
  params: {
    angle: 60,
    length: 1,
  },
  axiom: 'A',
  rules: {
    A: 'B-A-B',
    B: 'A+B+A',
  },
  commands: {
    'A': drawForward,
    'B': drawForward,
    '+'(drawingState, params) {
      drawingState.state.direction -= params.angle;
    },
    '-'(drawingState, params) {
      drawingState.state.direction += params.angle;
    },
  }
};

let dragon = {
  params: {
    angle: 90,
    length: 5,
  },
  axiom: 'FX',
  rules: {
    X: 'X+YF+',
    Y: '-FX-Y',
  },
  commands: {
    'F': drawForward,
    '-'(drawingState, params) {
      drawingState.state.direction -= params.angle;
    },
    '+'(drawingState, params) {
      drawingState.state.direction += params.angle;
    },
  }
}

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
      drawingState.state.direction -= params.angle;
    },
    '+'(drawingState, params) {
      drawingState.state.direction += params.angle;
    },
    '['(drawingState, params) {
      drawingState.push();
    },
    ']'(drawingState, params) {
      drawingState.pop();
    },
  }
}

let unicodeTree = {
  params: {
    angle: 25,
    length: 1,
  },
  axiom: '_',
  rules: {
  '_': '➔(↺_)(_)➔(↺_)↻➔_',
  '➔': '➔➔',
  },
  commands: {
    '➔': drawForward,
    '↺'(drawingState, params) {
      drawingState.state.direction -= params.angle;
    },
    '↻'(drawingState, params) {
      drawingState.state.direction += params.angle;
    },
    '('(drawingState, params) {
      drawingState.push();
    },
    ')'(drawingState, params) {
      drawingState.pop();
    },
  }
}

let mapNumber = (x, fromLow, fromHigh, toLow, toHigh) => {
  return (x - fromLow) / (fromHigh - fromLow) * (toHigh - toLow) + toLow;
};

let randomInInterval = (low, high) => {
  return mapNumber(Math.random(), 0, 1, low, high);
}

let stochasticTree = {
  params: {
    // Nondeterministic params
    get angle() {
      return randomInInterval(-60, 60);
    },
    get length() {
      return 3 * randomInInterval(1, 3)
    },
  },
  axiom: 'X',
  rules: {
    X: 'F[-X][X]F[-X]+FX',
    F: 'FF',
  },
  init(drawingState, params) {
    drawingState.state.strokeWeight = 3;
  },
  commands: {
    'F'(drawingState, params) {
      if (drawingState.depth < 10) {
        drawForward(drawingState, params);
        drawingState.state.strokeWeight /= 1.01;
      }
    },
    '-'(drawingState, params) {
      drawingState.state.direction -= params.angle;
      drawingState.state.strokeWeight /= 1.3;
    },
    '+'(drawingState, params) {
      drawingState.state.direction += params.angle;
      drawingState.state.strokeWeight /= 1.3;
    },
    '['(drawingState, params) {
      drawingState.push();
    },
    ']'(drawingState, params) {
      // "Forgetful" stack
      drawingState.pop();
      drawingState.state.direction += randomInInterval(-10, 10);
    },
  }
}


const CANVAS_BOUNDS = new Point(1000, 1000);
let system = stochasticTree;

const applyRule = (char, rules) => {
  return rules[char] || char;
}

function *ruleGenerator(system, systemState) {
  for (let c of systemState) {
    yield applyRule(c, system.rules);
  }
}

const asyncCommand = (sequence, system, out, drawingState, draw, resolve) => {
  let next = sequence.next();
  if (!next.done) {
    // enqueue another call to this function
    setTimeout(() => {
      const fragment = next.value;
      if (draw) {
        for (let c of fragment) {
          const command = system.commands[c];
          command && command(drawingState, system.params, 0);
        }
      }
      out += fragment;
      asyncCommand(sequence, system, out, drawingState, draw, resolve);
    }, 0);
  } else {
    resolve(out);
  }
}

const asyncRender = (system, systemState, initialDrawingState, draw=true) => {
  const drawingState = initialDrawingState || new DrawingState(new Point(50, 500), 0);
  system.init && system.init(drawingState, system.params);
  let sequence = ruleGenerator(system, systemState);
  return new Promise((resolve, reject) => {
    asyncCommand(sequence, system, '', drawingState, draw, resolve);
  });
};

let numIters = 1;

function setup() {
  createCanvas(CANVAS_BOUNDS.x, CANVAS_BOUNDS.y);
  angleMode(DEGREES);
  noLoop();
}

function mouseClicked() {
  // background(255);
  const origin = new Point(mouseX, mouseY);
  let renderedPromise = Promise.resolve(system.axiom);
  for (let i = 0; i < numIters; i++) {
    renderedPromise = renderedPromise.then((systemState) => {
      console.log(systemState);
      return asyncRender(system, systemState, new DrawingState(origin, -90), i === numIters - 1);
    });
  }
  // Log the final system state output
  renderedPromise.then(console.log);
};

function mouseWheel(event) {
  numIters += event.delta < 0 ? 1 : -1;
  console.log(`${numIters} iterations`);
}

function draw() {
}
