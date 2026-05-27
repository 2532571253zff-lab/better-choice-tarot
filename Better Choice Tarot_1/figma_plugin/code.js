/**
 * Better Choice Tarot — Import Frames
 * Creates Figma frames from html-to-figma JSON data.
 */

// Color helper: convert Figma color {r,g,b} to RGB string
function colorToString(color) {
  if (!color) return null;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

// Map of supported node types
const nodeCreators = {
  FRAME: (data) => {
    const frame = figma.createFrame();
    frame.name = data.name || "Frame";
    frame.resize(data.width || 100, data.height || 100);
    frame.x = data.x || 0;
    frame.y = data.y || 0;
    if (data.clipsContent !== undefined) frame.clipsContent = data.clipsContent;
    if (data.fills) frame.fills = parseFills(data.fills);
    if (data.strokes) frame.strokes = parseFills(data.strokes);
    if (data.strokeWeight !== undefined) frame.strokeWeight = data.strokeWeight;
    if (data.cornerRadius !== undefined) {
      frame.cornerRadius = data.cornerRadius;
    }
    if (data.topLeftRadius !== undefined) frame.topLeftRadius = data.topLeftRadius;
    if (data.topRightRadius !== undefined) frame.topRightRadius = data.topRightRadius;
    if (data.bottomRightRadius !== undefined) frame.bottomRightRadius = data.bottomRightRadius;
    if (data.bottomLeftRadius !== undefined) frame.bottomLeftRadius = data.bottomLeftRadius;
    if (data.opacity !== undefined) frame.opacity = data.opacity;
    if (data.effects) frame.effects = parseEffects(data.effects);
    if (data.constraints) frame.constraints = parseConstraints(data.constraints);
    if (data.layoutMode) {
      frame.layoutMode = data.layoutMode;
      if (data.primaryAxisSizingMode) frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
      if (data.counterAxisSizingMode) frame.counterAxisSizingMode = data.counterAxisSizingMode;
      if (data.primaryAxisAlignItems) frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
      if (data.counterAxisAlignItems) frame.counterAxisAlignItems = data.counterAxisAlignItems;
      if (data.itemSpacing !== undefined) frame.itemSpacing = data.itemSpacing;
      if (data.paddingTop !== undefined) frame.paddingTop = data.paddingTop;
      if (data.paddingRight !== undefined) frame.paddingRight = data.paddingRight;
      if (data.paddingBottom !== undefined) frame.paddingBottom = data.paddingBottom;
      if (data.paddingLeft !== undefined) frame.paddingLeft = data.paddingLeft;
    }
    return frame;
  },

  RECTANGLE: (data) => {
    const rect = figma.createRectangle();
    rect.name = data.name || "Rectangle";
    rect.resize(data.width || 100, data.height || 100);
    rect.x = data.x || 0;
    rect.y = data.y || 0;
    if (data.fills) rect.fills = parseFills(data.fills);
    if (data.strokes) rect.strokes = parseFills(data.strokes);
    if (data.strokeWeight !== undefined) rect.strokeWeight = data.strokeWeight;
    if (data.cornerRadius !== undefined) rect.cornerRadius = data.cornerRadius;
    if (data.topLeftRadius !== undefined) rect.topLeftRadius = data.topLeftRadius;
    if (data.topRightRadius !== undefined) rect.topRightRadius = data.topRightRadius;
    if (data.bottomRightRadius !== undefined) rect.bottomRightRadius = data.bottomRightRadius;
    if (data.bottomLeftRadius !== undefined) rect.bottomLeftRadius = data.bottomLeftRadius;
    if (data.opacity !== undefined) rect.opacity = data.opacity;
    if (data.effects) rect.effects = parseEffects(data.effects);
    if (data.constraints) rect.constraints = parseConstraints(data.constraints);
    return rect;
  },

  TEXT: (data) => {
    const text = figma.createText();
    text.name = data.name || "Text";
    text.x = data.x || 0;
    text.y = data.y || 0;
    if (data.width !== undefined && data.height !== undefined) {
      text.resize(data.width, data.height);
    }
    if (data.characters) text.characters = data.characters;
    if (data.fontSize) text.fontSize = data.fontSize;
    if (data.fontName) {
      try {
        text.fontName = { family: data.fontName.family, style: data.fontName.style };
      } catch (e) {
        // Fallback: use default font
      }
    }
    if (data.fills) text.fills = parseFills(data.fills);
    if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal;
    if (data.textAlignVertical) text.textAlignVertical = data.textAlignVertical;
    if (data.lineHeight) text.lineHeight = data.lineHeight;
    if (data.letterSpacing) text.letterSpacing = data.letterSpacing;
    if (data.opacity !== undefined) text.opacity = data.opacity;
    if (data.constraints) text.constraints = parseConstraints(data.constraints);
    return text;
  },

  ELLIPSE: (data) => {
    const ellipse = figma.createEllipse();
    ellipse.name = data.name || "Ellipse";
    ellipse.resize(data.width || 100, data.height || 100);
    ellipse.x = data.x || 0;
    ellipse.y = data.y || 0;
    if (data.fills) ellipse.fills = parseFills(data.fills);
    if (data.strokes) ellipse.strokes = parseFills(data.strokes);
    if (data.opacity !== undefined) ellipse.opacity = data.opacity;
    if (data.constraints) ellipse.constraints = parseConstraints(data.constraints);
    return ellipse;
  },

  VECTOR: (data) => {
    const vector = figma.createVector();
    vector.name = data.name || "Vector";
    vector.resize(data.width || 100, data.height || 100);
    vector.x = data.x || 0;
    vector.y = data.y || 0;
    if (data.fills) vector.fills = parseFills(data.fills);
    if (data.strokes) vector.strokes = parseFills(data.strokes);
    if (data.opacity !== undefined) vector.opacity = data.opacity;
    return vector;
  },

  LINE: (data) => {
    const line = figma.createLine();
    line.name = data.name || "Line";
    line.resize(data.width || 100, data.height || 0);
    line.x = data.x || 0;
    line.y = data.y || 0;
    if (data.strokes) line.strokes = parseFills(data.strokes);
    if (data.opacity !== undefined) line.opacity = data.opacity;
    return line;
  },
};

function parseFills(fills) {
  return fills.map((fill) => {
    if (fill.type === "SOLID" && fill.color) {
      return {
        type: "SOLID",
        color: colorToString(fill.color),
        opacity: fill.opacity !== undefined ? fill.opacity : 1,
      };
    }
    if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL") {
      return {
        type: fill.type,
        gradientStops: (fill.gradientStops || []).map((stop) => ({
          position: stop.position,
          color: colorToString(stop.color),
        })),
        gradientTransform: fill.gradientTransform,
        opacity: fill.opacity !== undefined ? fill.opacity : 1,
      };
    }
    return { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
  });
}

function parseEffects(effects) {
  return effects.map((effect) => {
    const base = {
      type: effect.type,
      visible: effect.visible !== false,
      radius: effect.radius || 0,
    };
    if (effect.color) base.color = colorToString(effect.color);
    if (effect.offset) base.offset = { x: effect.offset.x || 0, y: effect.offset.y || 0 };
    if (effect.spread) base.spread = effect.spread;
    return base;
  });
}

function parseConstraints(constraints) {
  return {
    horizontal: constraints.horizontal || "MIN",
    vertical: constraints.vertical || "MIN",
  };
}

function createNode(data, parent) {
  const creator = nodeCreators[data.type];
  let node;
  if (creator) {
    try {
      node = creator(data);
    } catch (e) {
      console.warn(`Failed to create ${data.type}: ${e.message}`);
      // Create a fallback rectangle
      node = figma.createRectangle();
      node.name = data.name || data.type;
      node.resize(data.width || 100, data.height || 100);
      node.x = data.x || 0;
      node.y = data.y || 0;
      if (data.fills) node.fills = parseFills(data.fills);
    }
  } else {
    // Unknown type, create a placeholder frame
    console.warn(`Unknown node type: ${data.type}`);
    node = figma.createFrame();
    node.name = `[${data.type}] ${data.name || ""}`;
    node.resize(data.width || 100, data.height || 100);
    node.x = data.x || 0;
    node.y = data.y || 0;
  }

  if (!node) return null;

  // Recursively create children (only FRAME and GROUP support appendChild)
  if (data.children && Array.isArray(data.children)) {
    const supportsChildren = data.type === "FRAME" || data.type === "GROUP";
    if (supportsChildren && typeof node.appendChild === "function") {
      for (const childData of data.children) {
        try {
          const childNode = createNode(childData, node);
          if (childNode) {
            node.appendChild(childNode);
          }
        } catch (e) {
          console.warn("  Failed to append child: " + e.message);
        }
      }
    }
  }

  return node;
}

// Main handler
figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "create-frames") {
    const framesData = msg.frames;
    const pageName = msg.pageName || "Imported";

    // Create or get page
    let page = figma.root.findChild((child) => child.name === pageName);
    if (!page) {
      page = figma.createPage();
      page.name = pageName;
    }
    figma.currentPage = page;

    // Create each frame
    let xOffset = 0;
    const spacing = 100;

    for (let i = 0; i < framesData.length; i++) {
      const frameData = framesData[i];
      const layers = frameData.layers || frameData;

      // Create the root frame
      const rootFrame = figma.createFrame();
      rootFrame.name = frameData.name || `Frame ${i + 1}`;
      rootFrame.resize(390, 844);
      rootFrame.x = xOffset;
      rootFrame.y = 0;
      rootFrame.clipsContent = true;

      // Create all child nodes
      if (Array.isArray(layers)) {
        for (const layerData of layers) {
          const node = createNode(layerData, rootFrame);
          if (node) {
            rootFrame.appendChild(node);
          }
        }
      }

      xOffset += 390 + spacing;

      figma.ui.postMessage({
        type: "progress",
        current: i + 1,
        total: framesData.length,
      });
    }

    figma.viewport.scrollAndZoomIntoView([...page.children]);
    figma.notify(`✅ Created ${framesData.length} frames!`);
    figma.ui.postMessage({ type: "done" });
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};
