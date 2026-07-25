// === TOPOLOGY VIEW (pure HTML/JS, matches original code style) ===
import { services } from './config.js';
import { state, setState } from './state.js';

let topologyData = {
  nodes: [],
  edges: []
};

let svg, container;
let draggingNode = null;
let connectingFrom = null;
let selectedEdge = null;

export function renderTopologyPage() {
  const hdr = document.getElementById('main-header');
  const grid = document.getElementById('services-grid');

  hdr.innerHTML = `
    <div class="page-header category-header-card">
      <div class="page-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </div>
      <div class="page-header-text">
        <h1>Topology</h1>
        <p class="cta-text">Interactive service topology • Drag cards • Click dots to connect</p>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <button id="topo-reset" class="toggle-btn" style="padding:6px 14px;font-size:12px;">Reset Layout</button>
        <button id="topo-clear-edges" class="toggle-btn" style="padding:6px 14px;font-size:12px;">Clear Edges</button>
      </div>
    </div>
  `;

  grid.classList.remove('home-grid', 'alerts-grid', 'services-grid--cards');
  grid.innerHTML = `
    <div id="topology-container" style="position:relative;width:100%;height:620px;border:1px solid var(--border);border-radius:12px;background:rgba(0,0,0,0.3);overflow:hidden;">
      <svg id="topology-svg" width="100%" height="100%" style="position:absolute;top:0;left:0;z-index:1;"></svg>
      <div id="topology-nodes" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;"></div>
    </div>
    <div style="margin-top:12px;font-size:12px;color:var(--text-muted);">
      • Drag cards to reposition &nbsp;&nbsp;• Click any dot to start connection &nbsp;&nbsp;• Click edge to delete &nbsp;&nbsp;• 3 points per side
    </div>
  `;

  container = document.getElementById('topology-container');
  svg = document.getElementById('topology-svg');

  initTopology();
  document.getElementById('topo-reset').onclick = resetTopology;
  document.getElementById('topo-clear-edges').onclick = clearEdges;
}

function initTopology() {
  const nodeContainer = document.getElementById('topology-nodes');

  // Build nodes from services
  topologyData.nodes = [];
  let x = 80, y = 80;
  Object.entries(services).forEach(([cat, list]) => {
    list.forEach(svc => {
      topologyData.nodes.push({
        id: svc.key,
        name: svc.name,
        subtitle: svc.subtitle || cat,
        icon: svc.icon,
        x: x,
        y: y,
        width: 180,
        height: 92
      });
      x += 210;
      if (x > 900) { x = 80; y += 140; }
    });
  });

  // Default edges (example connections)
  topologyData.edges = [
    { from: 'nas', to: 'proxmox', fromSide: 'right', fromIdx: 1, toSide: 'left', toIdx: 1 },
    { from: 'proxmox', to: 'portainer', fromSide: 'right', fromIdx: 0, toSide: 'left', toIdx: 0 }
  ];

  renderNodes(nodeContainer);
  renderEdges();
}

function renderNodes(nodeContainer) {
  nodeContainer.innerHTML = '';

  topologyData.nodes.forEach(node => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.style.cssText = `
      position:absolute;left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;
      background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;
      display:flex;flex-direction:column;padding:10px 12px;cursor:grab;user-select:none;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
    `;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:28px;height:28px;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
            ${node.icon}
          </svg>
        </div>
        <div>
          <div style="font-weight:600;font-size:13px;">${node.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${node.subtitle}</div>
        </div>
      </div>
    `;

    // Make draggable
    makeDraggable(card, node);

    // Add 3 connection points per side
    addConnectionPoints(card, node);

    nodeContainer.appendChild(card);
    node.element = card;
  });
}

function addConnectionPoints(card, node) {
  const sides = ['top', 'right', 'bottom', 'left'];
  const positions = [0.25, 0.5, 0.75];

  sides.forEach(side => {
    positions.forEach((pos, idx) => {
      const dot = document.createElement('div');
      dot.className = 'topo-dot';
      dot.style.cssText = `
        position:absolute;width:9px;height:9px;border-radius:50%;
        background:#8266ed;border:2px solid #fff;cursor:crosshair;z-index:10;
      `;

      if (side === 'top') {
        dot.style.left = `${pos * 100}%`;
        dot.style.top = '-4px';
        dot.style.transform = 'translateX(-50%)';
      } else if (side === 'right') {
        dot.style.right = '-4px';
        dot.style.top = `${pos * 100}%`;
        dot.style.transform = 'translateY(-50%)';
      } else if (side === 'bottom') {
        dot.style.left = `${pos * 100}%`;
        dot.style.bottom = '-4px';
        dot.style.transform = 'translateX(-50%)';
      } else if (side === 'left') {
        dot.style.left = '-4px';
        dot.style.top = `${pos * 100}%`;
        dot.style.transform = 'translateY(-50%)';
      }

      dot.onclick = (e) => {
        e.stopImmediatePropagation();
        handleConnectionClick(node, side, idx, dot);
      };

      card.appendChild(dot);
    });
  });
}

function makeDraggable(card, node) {
  let offsetX, offsetY;

  card.onmousedown = (e) => {
    if (e.target.classList.contains('topo-dot')) return;
    draggingNode = node;
    offsetX = e.clientX - node.x;
    offsetY = e.clientY - node.y;
    card.style.cursor = 'grabbing';
    document.onmousemove = onDrag;
    document.onmouseup = stopDrag;
  };

  function onDrag(e) {
    if (!draggingNode) return;
    draggingNode.x = Math.max(20, Math.min(1100, e.clientX - offsetX));
    draggingNode.y = Math.max(20, Math.min(580, e.clientY - offsetY));
    card.style.left = `${draggingNode.x}px`;
    card.style.top = `${draggingNode.y}px`;
    renderEdges();
  }

  function stopDrag() {
    document.onmousemove = null;
    document.onmouseup = null;
    card.style.cursor = 'grab';
    draggingNode = null;
  }
}

function handleConnectionClick(node, side, idx, dotEl) {
  if (!connectingFrom) {
    connectingFrom = { node, side, idx, dot: dotEl };
    dotEl.style.background = '#ef4444';
  } else {
    if (connectingFrom.node.id !== node.id) {
      topologyData.edges.push({
        from: connectingFrom.node.id,
        to: node.id,
        fromSide: connectingFrom.side,
        fromIdx: connectingFrom.idx,
        toSide: side,
        toIdx: idx
      });
      renderEdges();
    }
    connectingFrom.dot.style.background = '#8266ed';
    connectingFrom = null;
  }
}

function getPointPosition(node, side, idx) {
  const positions = [0.25, 0.5, 0.75];
  const pos = positions[idx];
  let x = node.x, y = node.y;

  if (side === 'top') {
    x += pos * node.width;
    y -= 4;
  } else if (side === 'right') {
    x += node.width + 4;
    y += pos * node.height;
  } else if (side === 'bottom') {
    x += pos * node.width;
    y += node.height + 4;
  } else if (side === 'left') {
    x -= 4;
    y += pos * node.height;
  }
  return { x, y };
}

function renderEdges() {
  svg.innerHTML = '';

  topologyData.edges.forEach((edge, index) => {
    const fromNode = topologyData.nodes.find(n => n.id === edge.from);
    const toNode = topologyData.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return;

    const p1 = getPointPosition(fromNode, edge.fromSide, edge.fromIdx);
    const p2 = getPointPosition(toNode, edge.toSide, edge.toIdx);

    // Morphing bezier curve
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const cx1 = p1.x + dx * 0.4;
    const cy1 = p1.y + dy * 0.1;
    const cx2 = p1.x + dx * 0.6;
    const cy2 = p1.y + dy * 0.9;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`);
    path.setAttribute('stroke', '#8266ed');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-opacity', '0.85');
    path.style.cursor = 'pointer';

    path.onclick = () => {
      if (confirm('Delete this connection?')) {
        topologyData.edges.splice(index, 1);
        renderEdges();
      }
    };

    svg.appendChild(path);
  });
}

function resetTopology() {
  const nodeContainer = document.getElementById('topology-nodes');
  initTopology();
}

function clearEdges() {
  topologyData.edges = [];
  renderEdges();
}