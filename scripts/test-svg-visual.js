/**
 * Visual test script for SVG muscle highlighting
 * Generates SVG files to visually verify the color scheme
 * Run with: node scripts/test-svg-visual.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMuscleHighlightSvg } from '../src/utils/muscleHighlightSvg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testCases = [
  {
    name: 'chest-exercise',
    primary: 'Chest',
    secondary: 'Triceps, Front Delts'
  },
  {
    name: 'back-exercise',
    primary: 'Lats',
    secondary: 'Biceps, Traps'
  },
  {
    name: 'leg-exercise',
    primary: 'Quads',
    secondary: 'Glutes, Hamstrings'
  },
  {
    name: 'shoulder-exercise',
    primary: 'Delts',
    secondary: 'Traps, Triceps'
  },
  {
    name: 'core-exercise',
    primary: 'Core',
    secondary: 'Obliques, Hip Flexors'
  },
  {
    name: 'full-body',
    primary: 'Full Body',
    secondary: ''
  }
];

// Create output directory
const outputDir = '/tmp/svg-test-output';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generating test SVG files...\n');

testCases.forEach(testCase => {
  const svg = generateMuscleHighlightSvg(testCase.primary, testCase.secondary);
  const filename = path.join(outputDir, `${testCase.name}.svg`);
  fs.writeFileSync(filename, svg);
  
  // Check for accessibility attributes
  const hasRole = svg.includes('role="img"');
  const hasAria = svg.includes('aria-label=');
  const hasNewColors = svg.includes('#ce1034') && svg.includes('#ec5998') && svg.includes('#3a3a3a');
  
  console.log(`✓ ${testCase.name}.svg`);
  console.log(`  Primary: ${testCase.primary}`);
  console.log(`  Secondary: ${testCase.secondary || 'None'}`);
  console.log(`  Accessibility: ${hasRole && hasAria ? '✓' : '✗'} (role="${hasRole}", aria-label="${hasAria}")`);
  console.log(`  Colors: ${hasNewColors ? '✓' : '✗'} (New color scheme applied)`);
  console.log();
});

// Create an HTML viewer
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Muscle Highlight Test Results</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #1a1a1a;
      color: #fff;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
    }
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .test-card {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #404040;
    }
    .test-card h3 {
      margin-top: 0;
      font-size: 16px;
    }
    .test-card p {
      font-size: 13px;
      color: #aaa;
      margin: 5px 0;
    }
    .svg-container {
      width: 200px;
      height: 200px;
      margin: 10px auto;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .svg-container img {
      max-width: 100%;
      max-height: 100%;
    }
    .color-legend {
      margin-bottom: 30px;
      padding: 15px;
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
    }
    .color-item {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }
    .color-box {
      width: 30px;
      height: 30px;
      margin-right: 15px;
      border-radius: 4px;
      border: 1px solid #555;
    }
  </style>
</head>
<body>
  <h1>SVG Muscle Highlight Test Results</h1>
  
  <div class="color-legend">
    <h3>Color Scheme</h3>
    <div class="color-item">
      <div class="color-box" style="background: #ce1034;"></div>
      <div>
        <strong>Primary Muscles (#ce1034)</strong><br>
        <small>Rich cherry red - Main muscles worked</small>
      </div>
    </div>
    <div class="color-item">
      <div class="color-box" style="background: #ec5998;"></div>
      <div>
        <strong>Secondary Muscles (#ec5998)</strong><br>
        <small>Vivid pink - Supporting muscles</small>
      </div>
    </div>
    <div class="color-item">
      <div class="color-box" style="background: #3a3a3a; opacity: 0.5;"></div>
      <div>
        <strong>Non-targeted Muscles (#3a3a3a)</strong><br>
        <small>Dark gray at 50% opacity - Context</small>
      </div>
    </div>
  </div>

  <h2>Test Cases</h2>
  <div class="test-grid">
    ${testCases.map(tc => `
      <div class="test-card">
        <h3>${tc.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
        <p><strong>Primary:</strong> ${tc.primary}</p>
        <p><strong>Secondary:</strong> ${tc.secondary || 'None'}</p>
        <div class="svg-container">
          <img src="${tc.name}.svg" alt="${tc.name}">
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), htmlContent);

console.log(`\n✅ All SVG files generated in: ${outputDir}`);
console.log(`   Open ${outputDir}/index.html in a browser to view the results\n`);
