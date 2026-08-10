const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/embed-visualizer/dist/index.css');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('*zoom: 1;', 'zoom: 1;');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched embed-visualizer css.');
}
