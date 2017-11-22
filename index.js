// class Node {
//   constructor(x, y) {
//     this.x = x;
//     this.y = y;
//     this.children = [];
//     this.parent = null;
//   }
//
//   addChild(child) {
//     this.children.push(child);
//     child.parent = this;
//   }
//
//   render() {
//     fill(0);
//     ellipse(this.x, this.y, 5, 5);
//   }
// }
//
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
//
// const render = (renderable) => {
//   push();
//   renderable.render();
//   pop();
// };
//
// function *ancestralPairs(root, parent = null) {
//   let children = root.children;
//   for (let i = 0; i < children.length; i++) {
//     let child = children[i];
//     yield * ancestralPairs(child, root);
//   }
//   yield {
//     current: root,
//     parent,
//   };
// }
//
// const root = new Node(0, 0);
//

// let drawNodes = () => {
//   for (nodeInfo of ancestralPairs(root)) {
//     let node = nodeInfo.current;
//     let parent = nodeInfo.parent;
//     render(node);
//     if (parent) {
//       line(parent.x, parent.y, node.x, node.y);
//     }
//   }
// };

// const mouseInBounds = () => {
//   return 0 <= mouseX
//     && mouseX <= CANVAS_BOUNDS.x
//     && 0 <= mouseY
//     && mouseY <= CANVAS_BOUNDS.y;
// }

// let lastNode = root;

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
      drawingState.direction -= params.angle;
    },
    '-'(drawingState, params) {
      drawingState.direction += params.angle;
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
      drawingState.direction -= params.angle;
    },
    '+'(drawingState, params) {
      drawingState.direction += params.angle;
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

let mapNumber = (x, fromLow, fromHigh, toLow, toHigh) => {
  return (x - fromLow) / (fromHigh - fromLow) * (toHigh - toLow) + toLow;
};

let randomInInterval = (low, high) => {
  return mapNumber(Math.random(), 0, 1, low, high);
}

let stochasticTree = {
  params: {
    get angle() {
      return randomInInterval(24, 26);
    },
    get length() {
      return randomInInterval(1, 1.5)
    },
  },
  axiom: 'X',
  rules: {
    X: 'F[-X][X]F[-X]+FX',
    F: 'FF',
  },
  commands: {
    'F'(drawingState, params) {
      if (drawingState.depth() < 5) {
        drawForward(drawingState, params);
      }
    },
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

function *ruleGenerator(system, systemState) {
  for (let i = 0, len = systemState.length; i < len; i++) {
    yield applyRule(systemState.charAt(i), system.rules);
  }
}

// const progressiveRender = (system, systemState, initialDrawingState, draw=true) => {
//   const drawingState = initialDrawingState || new DrawingState(new Point(50, 500), 0);
//   let out = '';
//   let chain = Promise.resolve();
//   for (let fragment of ruleGenerator(system, systemState)) {
//     out += fragment;
//     for (let i = 0, len = fragment.length; i < len; i++) {
//       const command = system.commands[fragment.charAt(i)];
//       if (draw) {
//         chain.then((resolve, reject) => {
//           setTimeout(() => {
//             command && command(drawingState, system.params, 0);
//             resolve();
//           });
//         });
//       }
//     }
//   }
//   return out;
// }

const asyncCommand = (sequence, system, out, drawingState, draw, resolve) => {
  let next = sequence.next();
  if (!next.done) {
    // enqueue another call to this function
    setTimeout(() => {
      const fragment = next.value;
      if (draw) {
        for (let i = 0, len = fragment.length; i < len; i++) {
          const command = system.commands[fragment.charAt(i)];
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
  let sequence = ruleGenerator(system, systemState);
  return new Promise((resolve, reject) => {
    asyncCommand(sequence, system, '', drawingState, draw, resolve);
  });
};

// let growLSystem = (system, iters=2) => {
//
//   const evolve = (state, rules) => {
//     let out = '';
//     for (let i = 0; i < state.length; i++) {
//       out += applyRule(state.charAt(i), rules);
//     }
//     return out;
//   };
//
//   let systemState = system.axiom;
//   for (let i = 0; i < iters; i++) {
//     systemState = evolve(systemState, system.rules);
//   }
//
//   return systemState;
// };

let STATE;
let origin = new Point(0, 0);
let numIters = 1;

function setup() {
  createCanvas(CANVAS_BOUNDS.x, CANVAS_BOUNDS.y);
  angleMode(DEGREES);
  noLoop();
  // STATE = growLSystem(system, numIters);
}

// let drawLSystem = (system, systemState, initialDrawingState) => {
//   const drawingState = initialDrawingState || new DrawingState(new Point(50, 500), 0);
//   for (let i = 0; i < systemState.length; i++) {
//     let command = system.commands[systemState.charAt(i)];
//     command && command(drawingState, system.params);
//   }
// };

function mouseClicked() {
  background(255);
  origin = new Point(mouseX, mouseY);
  let renderedPromise = Promise.resolve(system.axiom);
  for (let i = 0; i < numIters; i++) {
    renderedPromise = renderedPromise.then((systemState) => {
      console.log(systemState)
      return asyncRender(system, systemState, new DrawingState(origin, 0), i === numIters - 1);
    });
  }
};

function mouseWheel(event) {
  numIters += event.delta < 0 ? 1 : -1;
  console.log(`${numIters} iterations`);
  // STATE = growLSystem(system, numIters);
}

function draw() {
  // background(255);
  // drawLSystem(system, STATE, new DrawingState(origin, 0));
  // if (mouseInBounds()) {
  //   let newNode = new Node(mouseX, mouseY);
  //   lastNode.addChild(newNode);
  //   lastNode = newNode;
  // }
  //
  // drawNodes();
}
