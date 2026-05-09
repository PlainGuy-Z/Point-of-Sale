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

// Define replacements that specifically target dark mode classes or remove slate/blue
const replacements = [
  // Backgrounds
  { regex: /bg-gray-800/g, replacement: 'bg-[#1a1614]' },
  { regex: /bg-slate-800/g, replacement: 'bg-[#1a1614]' },
  { regex: /bg-gray-900/g, replacement: 'bg-stone-950' },
  { regex: /bg-slate-900/g, replacement: 'bg-stone-950' },
  { regex: /bg-gray-950/g, replacement: 'bg-stone-950' },
  { regex: /bg-slate-950/g, replacement: 'bg-stone-950' },
  { regex: /bg-blue-900/g, replacement: 'bg-amber-900' },
  { regex: /bg-blue-800/g, replacement: 'bg-amber-800' },
  { regex: /bg-blue-100/g, replacement: 'bg-amber-100' },
  { regex: /bg-blue-50/g, replacement: 'bg-amber-50' },
  { regex: /bg-blue-500/g, replacement: 'bg-amber-500' },
  { regex: /bg-blue-600/g, replacement: 'bg-amber-600' },
  { regex: /bg-slate-200/g, replacement: 'bg-stone-200' },
  { regex: /bg-slate-100/g, replacement: 'bg-stone-100' },
  { regex: /bg-slate-50/g, replacement: 'bg-stone-50' },
  
  // Borders
  { regex: /border-gray-800/g, replacement: 'border-stone-800' },
  { regex: /border-slate-800/g, replacement: 'border-stone-800' },
  { regex: /border-gray-700/g, replacement: 'border-stone-800' },
  { regex: /border-slate-700/g, replacement: 'border-stone-800' },
  { regex: /border-blue-800/g, replacement: 'border-amber-800' },
  { regex: /border-blue-200/g, replacement: 'border-amber-200' },
  { regex: /border-blue-100/g, replacement: 'border-amber-100' },
  { regex: /border-slate-200/g, replacement: 'border-stone-200' },
  { regex: /border-slate-100/g, replacement: 'border-stone-100' },
  
  // Text
  { regex: /text-gray-400/g, replacement: 'text-stone-400' },
  { regex: /text-slate-400/g, replacement: 'text-stone-400' },
  { regex: /text-gray-500/g, replacement: 'text-stone-500' },
  { regex: /text-slate-500/g, replacement: 'text-stone-500' },
  { regex: /text-gray-200/g, replacement: 'text-stone-200' },
  { regex: /text-slate-200/g, replacement: 'text-stone-200' },
  { regex: /text-gray-300/g, replacement: 'text-stone-300' },
  { regex: /text-slate-300/g, replacement: 'text-stone-300' },
  { regex: /text-gray-100/g, replacement: 'text-stone-100' },
  { regex: /text-slate-100/g, replacement: 'text-stone-100' },
  { regex: /text-blue-400/g, replacement: 'text-amber-400' },
  { regex: /text-blue-500/g, replacement: 'text-amber-500' },
  { regex: /text-blue-600/g, replacement: 'text-amber-600' },
  { regex: /text-slate-900/g, replacement: 'text-stone-900' },
  { regex: /text-slate-800/g, replacement: 'text-stone-800' },
  { regex: /text-slate-700/g, replacement: 'text-stone-700' },
  { regex: /text-slate-600/g, replacement: 'text-stone-600' },
  
  // Hovers
  { regex: /hover:bg-gray-800/g, replacement: 'hover:bg-[#1a1614]' },
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-[#1a1614]' },
  { regex: /hover:bg-gray-700/g, replacement: 'hover:bg-stone-800' },
  { regex: /hover:bg-slate-700/g, replacement: 'hover:bg-stone-800' },
  { regex: /hover:text-blue-400/g, replacement: 'hover:text-amber-400' },
  { regex: /hover:bg-blue-900/g, replacement: 'hover:bg-amber-900' },
  { regex: /hover:bg-blue-50/g, replacement: 'hover:bg-amber-50' },
  { regex: /hover:bg-slate-700\/50/g, replacement: 'hover:bg-stone-800/50' },
  { regex: /hover:bg-slate-100/g, replacement: 'hover:bg-stone-100' },
  { regex: /hover:text-slate-900/g, replacement: 'hover:text-stone-900' },
  
  // Specific replacements for Modals
  { regex: /rounded-xl/g, replacement: 'rounded-2xl' },
  { regex: /rounded-lg/g, replacement: 'rounded-xl' } // Slightly bump other elements if they were lg to stay proportionate, but mainly we want modals 2xl
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
