const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const filePath = path.join(__dirname, '../node_modules/embed-visualizer/dist/index.css');
const scope = '.space-embed-visualizer-scope';
const scopeMarker = '/* space: embed-visualizer selectors scoped */';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // embed-visualizer ships Discord's Whitney font faces and several global
  // font-family resets (including html and form controls). Because its CSS is
  // imported by a settings tab, those unscoped rules otherwise replace the
  // font across the entire application. Keep the visualizer's sizing and
  // layout rules, but let font families inherit from Space.
  content = content.replace(/@font-face\s*\{[^{}]*\}/gi, '');
  content = content.replace(/font-family\s*:\s*[^;{}]+;?/gi, '');
  content = content.replace('*zoom: 1;', 'zoom: 1;');

  if (!content.includes(scopeMarker)) {
    const root = postcss.parse(content, {from: filePath});
    root.walkRules((rule) => {
      let parent = rule.parent;
      while (parent) {
        if (parent.type === 'atrule' && /keyframes$/i.test(parent.name || '')) return;
        parent = parent.parent;
      }

      rule.selectors = rule.selectors.map((selector) => {
        const trimmed = selector.trim();
        if (trimmed.includes(scope)) return trimmed;
        if (trimmed === 'html' || trimmed === 'body' || trimmed === ':root') return scope;
        return `${scope} ${trimmed}`;
      });
    });
    content = `${root.toString()}\n${scopeMarker}\n`;
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched embed-visualizer CSS (removed bundled font rules).');
  } else {
    console.log('embed-visualizer CSS is already patched.');
  }
} else {
  console.warn('embed-visualizer CSS was not found; skipping patch.');
}
