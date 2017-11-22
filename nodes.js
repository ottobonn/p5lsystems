class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.children = [];
    this.parent = null;
  }

  addChild(child) {
    this.children.push(child);
    child.parent = this;
  }

  render() {
    fill(0);
    ellipse(this.x, this.y, 5, 5);
  }
}

const render = (renderable) => {
  push();
  renderable.render();
  pop();
};

function *ancestralPairs(root, parent = null) {
  let children = root.children;
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    yield * ancestralPairs(child, root);
  }
  yield {
    current: root,
    parent,
  };
}

const root = new Node(0, 0);

let drawNodes = () => {
  for (nodeInfo of ancestralPairs(root)) {
    let node = nodeInfo.current;
    let parent = nodeInfo.parent;
    render(node);
    if (parent) {
      line(parent.x, parent.y, node.x, node.y);
    }
  }
};

const CANVAS_BOUNDS = {x: 1000, y: 1000};

const mouseInBounds = () => {
  return 0 <= mouseX
    && mouseX <= CANVAS_BOUNDS.x
    && 0 <= mouseY
    && mouseY <= CANVAS_BOUNDS.y;
};

function setup() {
  createCanvas(CANVAS_BOUNDS.x, CANVAS_BOUNDS.y);
}

function draw() {
  background(255);
  drawNodes();
  if (mouseInBounds()) {
    root.addChild(new Node(mouseX, mouseY));
  }
}
