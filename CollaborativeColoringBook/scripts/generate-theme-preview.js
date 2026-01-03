// scripts/generate-theme-preview.js
const fs = require('fs');
const path = require('path');

// Read your theme.ts file
const themePath = path.join(__dirname, '../src/styles/theme.ts');
const themeContent = fs.readFileSync(themePath, 'utf8');

// Extract colors (simplified - you'd need a proper parser)
const colors = {
  primary: extractColors(themeContent, 'primary'),
  secondary: extractColors(themeContent, 'secondary'),
  // ...
};

// Generate HTML
const html = generateHTML(colors);
fs.writeFileSync('theme-preview.html', html);