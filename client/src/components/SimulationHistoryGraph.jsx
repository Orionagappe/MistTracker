/**
 * Simulation History Graph Component
 * Phase 16: Milestone & Versioning System
 * 
 * DAG visualization using canvas for rendering nodes and edges.
 * Allows interactive selection and exploration of simulation branches.
 */

import React, { useRef, useEffect, useState } from 'react';
import './SimulationHistoryGraph.css';

/**
 * SimulationHistoryGraph: renders DAG as interactive canvas
 */
export default function SimulationHistoryGraph({
  graphData = { nodes: [], edges: [] },
  onNodeSelect,
  selectedNodeId,
  width = 800,
  height = 600
}) {
  const canvasRef = useRef(null);
  const [positions, setPositions] = useState({}); // versionId -> {x, y}
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Calculate node positions on mount or data change
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      calculatePositions();
    }
  }, [graphData]);

  // Redraw canvas when positions or state changes
  useEffect(() => {
    if (canvasRef.current) {
      redraw();
    }
  }, [positions, scale, pan, selectedNodeId, hoveredNode]);

  /**
   * Calculate node positions using hierarchical layout
   */
  const calculatePositions = () => {
    const nodes = graphData.nodes || [];
    if (nodes.length === 0) return;

    const pos = {};
    const levels = {}; // depth -> nodes at depth

    // First pass: assign depth (distance from root)
    const visited = new Set();
    const getDepth = (nodeId) => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node || !node.parentId) return 0;

      return 1 + getDepth(node.parentId);
    };

    nodes.forEach(node => {
      const depth = getDepth(node.id);
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(node);
    });

    // Second pass: assign x,y positions
    const maxDepth = Math.max(...Object.keys(levels).map(Number));
    const verticalSpacing = Math.max(100, height / (maxDepth + 2));
    const horizontalSpacing = Math.max(120, width / (Math.max(...Object.values(levels).map(n => n.length)) + 1));

    Object.keys(levels).forEach(depth => {
      const nodesAtLevel = levels[depth];
      const y = (parseInt(depth) + 1) * verticalSpacing;

      nodesAtLevel.forEach((node, idx) => {
        const x = (idx + 1) * horizontalSpacing + (Math.random() - 0.5) * 20; // Slight randomization
        pos[node.id] = { x, y };
      });
    });

    setPositions(pos);
  };

  /**
   * Handle canvas click for node selection
   */
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    // Check which node was clicked
    for (const node of graphData.nodes || []) {
      const pos = positions[node.id];
      if (!pos) continue;

      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 25) {
        onNodeSelect?.(node.id);
        return;
      }
    }
  };

  /**
   * Handle mouse move for hover detection
   */
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    for (const node of graphData.nodes || []) {
      const pos = positions[node.id];
      if (!pos) continue;

      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 25) {
        setHoveredNode(node.id);
        canvasRef.current.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredNode(null);
    canvasRef.current.style.cursor = 'default';
  };

  /**
   * Handle wheel zoom
   */
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  /**
   * Redraw canvas with current state
   */
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    // Draw edges first (so they appear behind nodes)
    if (graphData.edges) {
      graphData.edges.forEach(edge => {
        const fromPos = positions[edge.from];
        const toPos = positions[edge.to];

        if (fromPos && toPos) {
          drawEdge(ctx, fromPos, toPos, edge);
        }
      });
    }

    // Draw nodes
    if (graphData.nodes) {
      graphData.nodes.forEach(node => {
        const pos = positions[node.id];
        if (pos) {
          const isSelected = node.id === selectedNodeId;
          const isHovered = node.id === hoveredNode;
          drawNode(ctx, pos, node, isSelected, isHovered);
        }
      });
    }

    ctx.restore();
  };

  /**
   * Draw edge (connection between nodes)
   */
  const drawEdge = (ctx, fromPos, toPos, edge) => {
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.bezierCurveTo(
      fromPos.x,
      (fromPos.y + toPos.y) / 2,
      toPos.x,
      (fromPos.y + toPos.y) / 2,
      toPos.x,
      toPos.y
    );
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw arrowhead
    const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    const arrowSize = 12;
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(toPos.x, toPos.y);
    ctx.lineTo(
      toPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
      toPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
      toPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  /**
   * Draw node circle with label
   */
  const drawNode = (ctx, pos, node, isSelected, isHovered) => {
    const radius = isHovered ? 30 : isSelected ? 28 : 25;
    const fillColor = isSelected ? '#4CAF50' : isHovered ? '#2196F3' : '#2196F3';
    const strokeColor = isSelected ? '#2E7D32' : '#1976D2';
    const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1;

    // Draw circle
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw label
    const label = node.label || node.id.substring(0, 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pos.x, pos.y);

    // Draw type indicator if available
    if (node.type) {
      ctx.fillStyle = '#666';
      ctx.font = '9px Arial';
      ctx.fillText(node.type, pos.x, pos.y + 18);
    }
  };

  /**
   * Reset view
   */
  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="simulation-history-graph">
      <div className="graph-controls">
        <button className="btn btn-small" onClick={resetView}>
          Reset View
        </button>
        <span className="zoom-info">
          Zoom: {(scale * 100).toFixed(0)}%
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        className="dag-canvas"
      />

      {hoveredNode && (
        <div className="node-tooltip">
          Version: {hoveredNode.substring(0, 12)}...
        </div>
      )}
    </div>
  );
}
