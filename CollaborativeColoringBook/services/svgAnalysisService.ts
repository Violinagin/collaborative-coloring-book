// services/svgAnalysisService.ts
import { supabase } from '../lib/supabase';

export interface ColorablePath {
  id: string;
  pathData: string;
  bounds: { x: number; y: number; width: number; height: number };
  fill?: string;
  stroke?: string;
}

export const svgAnalysisService = {
  async analyzeSVG(svgUrl: string): Promise<ColorablePath[]> {
    try {
      // Fetch the SVG content
      const response = await fetch(svgUrl);
      const svgText = await response.text();
      
      // Parse SVG and extract paths
      return this.extractColorablePaths(svgText);
    } catch (error) {
      console.error('Error analyzing SVG:', error);
      return [];
    }
  },

  debugSVGContent(svgContent: string): void {
    console.log('🔍 SVG Content Analysis:');
    console.log('📄 First 500 chars:', svgContent.substring(0, 500));
    
    // Check for different SVG element types
    const pathCount = (svgContent.match(/<path/g) || []).length;
    const rectCount = (svgContent.match(/<rect/g) || []).length;
    const circleCount = (svgContent.match(/<circle/g) || []).length;
    const polygonCount = (svgContent.match(/<polygon/g) || []).length;
    const ellipseCount = (svgContent.match(/<ellipse/g) || []).length;
    
    console.log(`📊 SVG Elements Found:`);
    console.log(`   Paths: ${pathCount}`);
    console.log(`   Rects: ${rectCount}`);
    console.log(`   Circles: ${circleCount}`);
    console.log(`   Polygons: ${polygonCount}`);
    console.log(`   Ellipses: ${ellipseCount}`);
    
    // Log all path tags found
    const pathMatches = svgContent.match(/<path[^>]*>/g) || [];
    console.log('🔍 Path tags found:', pathMatches.slice(0, 3)); // First 3 only
    
    // Log other shape tags
    const rectMatches = svgContent.match(/<rect[^>]*>/g) || [];
    console.log('🔍 Rect tags found:', rectMatches.slice(0, 3));
  },

  extractColorablePaths(svgContent: string): ColorablePath[] {
    const paths: ColorablePath[] = [];
    
    console.log('🔍 Starting SVG path extraction...');
    
    // Extract ALL types of SVG shapes, not just paths
    this.extractPaths(svgContent, paths);
    this.extractRects(svgContent, paths);
    this.extractCircles(svgContent, paths);
    this.extractPolygons(svgContent, paths);
    this.extractEllipses(svgContent, paths);
    
    console.log(`📊 Total shapes found: ${paths.length}`);
    return paths;
  },
  
  extractPaths(svgContent: string, paths: ColorablePath[]): void {
    const idRegex = /id="([^"]*)"/i;
    const classRegex = /class="([^"]*)"/i;
    
    // Use matchAll instead of exec with global flag
    const pathMatches = svgContent.matchAll(/<path[^>]*d="([^"]*)"[^>]*\/?>/gi);
    let pathCount = 0;
    
    console.log('🔍 Starting path extraction with matchAll...');
    
    for (const match of pathMatches) {
      pathCount++;
      console.log(`🔍 Path ${pathCount}:`, {
        fullTag: match[0].substring(0, 100),
        hasD: !!match[1],
        dLength: match[1]?.length
      });
      
      const fullPathTag = match[0];
      const pathData = match[1];
      
      const idMatch = fullPathTag.match(idRegex);
      const classMatch = fullPathTag.match(classRegex);
      
      const id = idMatch ? idMatch[1] : 
                 classMatch ? `class-${classMatch[1]}` : 
                 `path-${pathCount}`;
      
      const bounds = this.calculatePathBounds(pathData);
      
      paths.push({
        id,
        pathData,
        bounds,
        fill: 'none',
        stroke: '#000000'
      });
      
      console.log(`📐 Added path: ${id}`);
    }
    
    console.log(`📊 Total paths extracted: ${pathCount}`);
  },
  
  extractRects(svgContent: string, paths: ColorablePath[]): void {
    const rectRegex = /<rect[^>]*>/gi;
    const idRegex = /id="([^"]*)"/i;
    const xRegex = /x="([^"]*)"/i;
    const yRegex = /y="([^"]*)"/i;
    const widthRegex = /width="([^"]*)"/i;
    const heightRegex = /height="([^"]*)"/i;
    
    let match;
    let rectCount = 0;
    
    while ((match = rectRegex.exec(svgContent)) !== null) {
      const fullTag = match[0];
      
      const idMatch = fullTag.match(idRegex);
      const xMatch = fullTag.match(xRegex);
      const yMatch = fullTag.match(yRegex);
      const widthMatch = fullTag.match(widthRegex);
      const heightMatch = fullTag.match(heightRegex);
      
      const id = idMatch ? idMatch[1] : `rect-${rectCount++}`;
      const x = parseFloat(xMatch ? xMatch[1] : '0');
      const y = parseFloat(yMatch ? yMatch[1] : '0');
      const width = parseFloat(widthMatch ? widthMatch[1] : '50');
      const height = parseFloat(heightMatch ? heightMatch[1] : '50');
      
      // Convert rect to path data
      const pathData = `M ${x} ${y} h ${width} v ${height} h -${width} z`;
      
      paths.push({
        id,
        pathData,
        bounds: { x, y, width, height },
        fill: 'none',
        stroke: '#000000'
      });
      
      console.log(`📐 Found rect: ${id}`, { x, y, width, height });
    }
  },
  
  extractCircles(svgContent: string, paths: ColorablePath[]): void {
    const circleRegex = /<circle[^>]*>/gi;
    const idRegex = /id="([^"]*)"/i;
    const cxRegex = /cx="([^"]*)"/i;
    const cyRegex = /cy="([^"]*)"/i;
    const rRegex = /r="([^"]*)"/i;
    
    let match;
    let circleCount = 0;
    
    while ((match = circleRegex.exec(svgContent)) !== null) {
      const fullTag = match[0];
      
      const idMatch = fullTag.match(idRegex);
      const cxMatch = fullTag.match(cxRegex);
      const cyMatch = fullTag.match(cyRegex);
      const rMatch = fullTag.match(rRegex);
      
      const id = idMatch ? idMatch[1] : `circle-${circleCount++}`;
      const cx = parseFloat(cxMatch ? cxMatch[1] : '25');
      const cy = parseFloat(cyMatch ? cyMatch[1] : '25');
      const r = parseFloat(rMatch ? rMatch[1] : '25');
      
      const bounds = { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
      
      // Simple circle approximation as path
      const pathData = `M ${cx} ${cy} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
      
      paths.push({
        id,
        pathData,
        bounds,
        fill: 'none',
        stroke: '#000000'
      });
      
      console.log(`📐 Found circle: ${id}`, bounds);
    }
  },
  
  // Add similar functions for polygons and ellipses if needed
  extractPolygons(svgContent: string, paths: ColorablePath[]): void {
    const polygonRegex = /<polygon[^>]*points="([^"]*)"[^>]*>/gi;
    const idRegex = /id="([^"]*)"/i;
    
    let match;
    let polygonCount = 0;
    
    while ((match = polygonRegex.exec(svgContent)) !== null) {
      const fullTag = match[0];
      const points = match[1];
      
      const idMatch = fullTag.match(idRegex);
      const id = idMatch ? idMatch[1] : `polygon-${polygonCount++}`;
      
      // Convert polygon points to path data
      const pathData = `M ${points} z`;
      const bounds = this.calculatePathBounds(pathData);
      
      paths.push({
        id,
        pathData,
        bounds,
        fill: 'none',
        stroke: '#000000'
      });
      
      console.log(`📐 Found polygon: ${id}`, bounds);
    }
  },
  
  extractEllipses(svgContent: string, paths: ColorablePath[]): void {
    const ellipseRegex = /<ellipse[^>]*>/gi;
    // Similar to circle extraction but with rx/ry instead of r
  },

  calculatePathBounds(pathData: string): { x: number; y: number; width: number; height: number } {
    try {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      let currentX = 0;
      let currentY = 0;
      
      // Parse SVG path commands
      const commands = pathData.match(/[a-df-z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/gi) || [];
      
      let i = 0;
      while (i < commands.length) {
        const command = commands[i];
        
        if (command.match(/[a-zA-Z]/)) {
          // It's a command letter
          const cmd = command;
          i++;
          
          switch (cmd) {
            case 'M': // absolute moveto
            case 'L': // absolute lineto
              currentX = parseFloat(commands[i++]);
              currentY = parseFloat(commands[i++]);
              break;
              
            case 'm': // relative moveto
            case 'l': // relative lineto
              currentX += parseFloat(commands[i++]);
              currentY += parseFloat(commands[i++]);
              break;
              
            case 'H': // absolute horizontal line
              currentX = parseFloat(commands[i++]);
              break;
              
            case 'h': // relative horizontal line
              currentX += parseFloat(commands[i++]);
              break;
              
            case 'V': // absolute vertical line
              currentY = parseFloat(commands[i++]);
              break;
              
            case 'v': // relative vertical line
              currentY += parseFloat(commands[i++]);
              break;
              
            case 'C': // absolute cubic bezier
            case 'S': // absolute smooth cubic bezier
            case 'Q': // absolute quadratic bezier
            case 'T': // absolute smooth quadratic bezier
              // For simplicity, just track the end point
              const coordCount = cmd === 'C' ? 6 : cmd === 'S' ? 4 : cmd === 'Q' ? 4 : 2;
              for (let j = 0; j < coordCount - 2; j++) i++; // skip control points
              currentX = parseFloat(commands[i++]);
              currentY = parseFloat(commands[i++]);
              break;
              
            case 'c': // relative cubic bezier
            case 's': // relative smooth cubic bezier
            case 'q': // relative quadratic bezier
            case 't': // relative smooth quadratic bezier
              const relCoordCount = cmd === 'c' ? 6 : cmd === 's' ? 4 : cmd === 'q' ? 4 : 2;
              for (let j = 0; j < relCoordCount - 2; j++) i++; // skip control points
              currentX += parseFloat(commands[i++]);
              currentY += parseFloat(commands[i++]);
              break;
              
            case 'A': // absolute elliptical arc
            case 'a': // relative elliptical arc
              // Skip elliptical arc parameters (rx, ry, x-axis-rotation, large-arc-flag, sweep-flag)
              for (let j = 0; j < 5; j++) i++;
              if (cmd === 'A') {
                currentX = parseFloat(commands[i++]);
                currentY = parseFloat(commands[i++]);
              } else {
                currentX += parseFloat(commands[i++]);
                currentY += parseFloat(commands[i++]);
              }
              break;
              
            case 'Z':
            case 'z':
              // Close path - no coordinates
              break;
          }
          
          // Update bounds
          if (!isNaN(currentX) && !isNaN(currentY)) {
            minX = Math.min(minX, currentX);
            minY = Math.min(minY, currentY);
            maxX = Math.max(maxX, currentX);
            maxY = Math.max(maxY, currentY);
          }
        } else {
          i++;
        }
      }
      
      // If we found valid bounds, use them
      if (minX !== Infinity && minY !== Infinity) {
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      }
      
    } catch (error) {
      console.error('Error calculating path bounds:', error);
    }
    
    // Fallback for invalid paths
    return { x: 0, y: 0, width: 50, height: 50 };
  }
};