const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// SVG content
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#4CAF50"/>
  
  <!-- Message bubble 1 -->
  <path d="M30 45 L30 75 L45 75 L55 85 L55 75 L70 75 L70 45 Z" fill="white"/>
  
  <!-- Arrow -->
  <path d="M75 60 L95 60 M85 50 L95 60 L85 70" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Message bubble 2 -->
  <path d="M98 45 L98 75 L83 75 L73 85 L73 75 L58 75 L58 45 Z" fill="white"/>
</svg>`;

// Save SVG file
const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, svgContent);

// Generate PNG files in different sizes
const sizes = [16, 48, 128];

async function generateIcons() {
    try {
        for (const size of sizes) {
            const outputPath = path.join(iconsDir, `icon${size}.png`);
            await sharp(Buffer.from(svgContent))
                .resize(size, size)
                .png()
                .toFile(outputPath);
            console.log(`Generated ${size}x${size} icon at ${outputPath}`);
        }
        console.log('All icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons(); 