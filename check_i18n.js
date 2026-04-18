const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const esJsonPath = path.join(srcDir, 'i18n/messages/es.json');
const esData = JSON.parse(fs.readFileSync(esJsonPath, 'utf8'));

const keys = new Set(Object.keys(esData));
const missing = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/t\(['"]([^'"]+)['"]/g);
      for (const match of matches) {
        if (!keys.has(match[1])) {
          missing.add(match[1]);
        }
      }
    }
  }
}

walk(srcDir);
console.log('Missing keys:', Array.from(missing));
