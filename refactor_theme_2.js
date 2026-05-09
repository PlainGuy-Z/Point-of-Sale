const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'Front-End/src');

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(directoryPath);

// Define generic replacements for ALL remaining slate and blue to stone and amber
const replacements = [
  // Anything slate -> stone
  { regex: /bg-slate-(\d+)/g, replacement: 'bg-stone-$1' },
  { regex: /text-slate-(\d+)/g, replacement: 'text-stone-$1' },
  { regex: /border-slate-(\d+)/g, replacement: 'border-stone-$1' },
  { regex: /ring-slate-(\d+)/g, replacement: 'ring-stone-$1' },
  { regex: /divide-slate-(\d+)/g, replacement: 'divide-stone-$1' },
  { regex: /from-slate-(\d+)/g, replacement: 'from-stone-$1' },
  { regex: /to-slate-(\d+)/g, replacement: 'to-stone-$1' },
  
  // Anything blue -> amber
  { regex: /bg-blue-(\d+)/g, replacement: 'bg-amber-$1' },
  { regex: /text-blue-(\d+)/g, replacement: 'text-amber-$1' },
  { regex: /border-blue-(\d+)/g, replacement: 'border-amber-$1' },
  { regex: /ring-blue-(\d+)/g, replacement: 'ring-amber-$1' },
  { regex: /divide-blue-(\d+)/g, replacement: 'divide-amber-$1' },
  { regex: /from-blue-(\d+)/g, replacement: 'from-amber-$1' },
  { regex: /to-blue-(\d+)/g, replacement: 'to-amber-$1' },
];

let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(rep => {
    content = content.replace(rep.regex, rep.replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
    console.log(`Modified: ${file.replace(directoryPath, '')}`);
  }
});

console.log(`Total files modified: ${filesModified}`);
