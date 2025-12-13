import { generateMuscleHighlightSvg } from '../src/utils/muscleHighlightSvg.js';
import { writeFileSync } from 'fs';

const exercises = [
    { name: 'Chest Exercise', primary: 'Chest', secondary: 'Triceps, Front Delts' },
    { name: 'Quad Exercise', primary: 'Quads', secondary: 'Glutes, Hamstrings' },
    { name: 'Back Exercise', primary: 'Lats', secondary: 'Biceps, Traps' },
    { name: 'Shoulder Exercise', primary: 'Delts', secondary: 'Traps' },
    { name: 'Arm Exercise', primary: 'Biceps', secondary: 'Forearms' },
    { name: 'Core Exercise', primary: 'Core', secondary: 'Obliques' }
];

let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Muscle SVG - Refined Colors</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 { color: white; text-align: center; margin-bottom: 30px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .legend { background: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); }
        .legend h2 { color: #2563eb; margin-bottom: 15px; }
        .legend-item { display: flex; align-items: center; margin: 12px 0; font-size: 16px; }
        .color-box { width: 32px; height: 32px; border-radius: 6px; margin-right: 12px; border: 2px solid #e0e0e0; flex-shrink: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; }
        .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .card:hover { transform: translateY(-5px); }
        .card h3 { color: #2563eb; margin-bottom: 15px; font-size: 1.3em; }
        .svg-box { display: flex; justify-content: center; padding: 25px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px; }
        .svg-box svg { max-width: 200px; height: auto; }
        .info { font-size: 14px; line-height: 1.8; }
        .info p { margin: 8px 0; }
        .info strong { color: #333; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 13px; margin-right: 5px; }
        .badge-primary { background: #2563eb; color: white; }
        .badge-secondary { background: #60a5fa; color: white; }
        
        @media (max-width: 768px) {
            body { padding: 15px; }
            h1 { font-size: 1.8em; }
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏋️ Muscle Highlight SVG - Refined Color Palette</h1>
        
        <div class="legend">
            <h2>New Color Scheme</h2>
            <div class="legend-item">
                <span class="color-box" style="background: #2563eb;"></span>
                <div><strong>Primary Muscles:</strong> Bold Blue (#2563eb) - Clear, prominent highlighting for main target muscles</div>
            </div>
            <div class="legend-item">
                <span class="color-box" style="background: #60a5fa;"></span>
                <div><strong>Secondary Muscles:</strong> Light Blue (#60a5fa) - Distinguishable from primary for supporting muscles</div>
            </div>
            <div class="legend-item">
                <span class="color-box" style="background: #e5e7eb; opacity: 0.7;"></span>
                <div><strong>Non-targeted Muscles:</strong> Light Gray (#e5e7eb at 70%) - Subtle, neutral shading for context</div>
            </div>
        </div>
        
        <div class="grid">
`;

exercises.forEach(exercise => {
    const svg = generateMuscleHighlightSvg(exercise.primary, exercise.secondary);
    const primaryMuscles = exercise.primary.split(',').map(m => m.trim());
    const secondaryMuscles = exercise.secondary.split(',').map(m => m.trim());
    
    html += `
        <div class="card">
            <h3>${exercise.name}</h3>
            <div class="svg-box">
                ${svg}
            </div>
            <div class="info">
                <p><strong>Primary Muscles:</strong><br>
                ${primaryMuscles.map(m => `<span class="badge badge-primary">${m}</span>`).join('')}
                </p>
                <p><strong>Secondary Muscles:</strong><br>
                ${secondaryMuscles.map(m => `<span class="badge badge-secondary">${m}</span>`).join('')}
                </p>
            </div>
        </div>
    `;
});

html += `
        </div>
    </div>
</body>
</html>`;

writeFileSync('/tmp/svg-visualization.html', html);
console.log('✅ Generated /tmp/svg-visualization.html');
console.log('Open this file in a browser to see the refined color palette!');
