/**
 * DAMA Radar Chart Component
 *
 * D3.js radar chart for visualizing DAMA dimension scores.
 * Shows all 9 dimensions in a radial layout with score-based coloring.
 *
 * V122: Created with corrections from Local AI output.
 * Corrections applied:
 * - Uses container ref for dimensions instead of percentage strings
 * - Correct D3.js radial line API usage
 * - Proper cleanup of SVG on re-render
 */

import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';

const DAMARadarChart = ({ data }) => {
  const containerRef = useRef();
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Get container dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width || 400, 400);
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw radar chart
  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('svg').remove();

    const { width, height } = dimensions;
    const margin = 60;
    const radius = Math.min(width, height) / 2 - margin;
    const centerX = width / 2;
    const centerY = height / 2;

    // Extract dimensions and values
    const categories = Object.keys(data);
    const values = Object.values(data);
    const numCategories = categories.length;
    const angleSlice = (2 * Math.PI) / numCategories;

    // Create SVG
    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Scale for radius
    const rScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Draw circular grid lines
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level;
      g.append('circle')
        .attr('r', levelRadius)
        .attr('fill', 'none')
        .attr('stroke', '#444')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5);

      // Add level labels
      g.append('text')
        .attr('x', 5)
        .attr('y', -levelRadius)
        .attr('fill', '#888')
        .attr('font-size', '10px')
        .text(`${(100 / levels) * level}`);
    }

    // Draw axis lines and labels
    categories.forEach((cat, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Axis line
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#555')
        .attr('stroke-width', 1);

      // Label
      const labelRadius = radius + 20;
      const labelX = Math.cos(angle) * labelRadius;
      const labelY = Math.sin(angle) * labelRadius;

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ccc')
        .attr('font-size', '11px')
        .text(cat.charAt(0).toUpperCase() + cat.slice(1, 4));
    });

    // Create data points for polygon
    const dataPoints = values.map((value, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return {
        x: Math.cos(angle) * rScale(value),
        y: Math.sin(angle) * rScale(value),
        value: value
      };
    });

    // Calculate overall score for color
    const avgScore = values.reduce((a, b) => a + b, 0) / values.length;
    const fillColor = avgScore >= 70 ? '#28a74580' :
                      avgScore >= 50 ? '#ffc10780' : '#dc354580';
    const strokeColor = avgScore >= 70 ? '#28a745' :
                        avgScore >= 50 ? '#ffc107' : '#dc3545';

    // Draw polygon
    const lineGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(dataPoints)
      .attr('d', lineGenerator)
      .attr('fill', fillColor)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2);

    // Draw data points
    g.selectAll('.data-point')
      .data(dataPoints)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 5)
      .attr('fill', strokeColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .append('title')
      .text((d, i) => `${categories[i]}: ${d.value.toFixed(1)}%`);

    // Add center score
    g.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', strokeColor)
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .text(`${avgScore.toFixed(0)}%`);

  }, [data, dimensions]);

  return (
    <div
      ref={containerRef}
      className="radar-chart"
      style={{
        width: '100%',
        maxWidth: '400px',
        height: '400px',
        margin: '0 auto'
      }}
    />
  );
};

export default DAMARadarChart;
