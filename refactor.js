const fs = require('fs');
const path = require('path');

const exportMap = {
  // cards
  'Card': 'cards', 'CardSection': 'cards', 'LeaveBalanceCard': 'cards', 'ProfileCard': 'cards', 'StatCard': 'cards',
  // tables
  'Table': 'tables', 'ApprovalTable': 'tables', 'TableHeader': 'tables', 'approvalStatusVariant': 'tables', 'ApprovalTableColumn': 'tables',
  // icons
  'CloseIcon': 'icons', 'CheckCircleIcon': 'icons', 'WarningIcon': 'icons', 'BackArrowIcon': 'icons', 'Icons': 'icons',
  // layout
  'ProfilePageShell': 'layout', 'SectionLabel': 'layout', 'PageLayout': 'layout', 'PageTitle': 'layout',
  // feedback
  'Badge': 'feedback', 'ContractDaysBadge': 'feedback', 'EmptyState': 'feedback', 'Modal': 'feedback', 'GoBackButton': 'feedback',
  // charts
  'HorizontalBarChart': 'charts',
  // forms
  'Button': 'forms', 'Input': 'forms', 'Select': 'forms', 'Textarea': 'forms',
  'Label': 'forms', 'FileUpload': 'forms', 'RadioList': 'forms',
  'FormActions': 'forms', 'FormField': 'forms', 'DialogActions': 'forms'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('components/Sidebar/')) {
    content = content.replace(/components\/Sidebar\//g, 'components/navigation/');
    changed = true;
  }

  const importRegex = /import\s+(type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]\s*;/g;
  const allImports = [...content.matchAll(importRegex)];

  for (const match of allImports) {
    const fullMatch = match[0];
    const isTypeOnly = match[1] || '';
    const varsString = match[2];
    const importPath = match[3];

    if (
      importPath.includes('components/data-display') ||
      importPath.includes('components/ui') ||
      importPath.includes('components/layout') ||
      importPath.includes('components/feedback') ||
      importPath.includes('components/forms')
    ) {
      const vars = varsString.split(',').map(v => v.trim()).filter(Boolean);

      const folderGroups = {};
      vars.forEach(v => {
        const cleanVar = v.split(/\s+as\s+/)[0].trim();
        const folder = exportMap[cleanVar];
        if (!folder) {
            console.log(`Warning: Could not map export ${cleanVar} in ${filePath}`);
            return;
        }
        if (!folderGroups[folder]) folderGroups[folder] = [];
        folderGroups[folder].push(v);
      });

      if (Object.keys(folderGroups).length === 0) continue;

      const newImports = Object.entries(folderGroups).map(([folder, folderVars]) => {
        const baseFolder = importPath.split('components/')[0] + 'components/';
        const newPath = baseFolder + folder;
        return `import ${isTypeOnly}{ ${folderVars.join(', ')} } from '${newPath}';`;
      }).join('\n');

      content = content.replace(fullMatch, newImports);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
  }
}

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (filepath.includes('node_modules') || filepath.includes('.next')) continue;
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, filelist);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const moves = {
  'app/components/data-display/Card.tsx': 'app/components/cards/Card.tsx',
  'app/components/data-display/CardSection.tsx': 'app/components/cards/CardSection.tsx',
  'app/components/data-display/LeaveBalanceCard.tsx': 'app/components/cards/LeaveBalanceCard.tsx',
  'app/components/data-display/ProfileCard.tsx': 'app/components/cards/ProfileCard.tsx',
  'app/components/data-display/StatCard.tsx': 'app/components/cards/StatCard.tsx',
  'app/components/data-display/Table.tsx': 'app/components/tables/Table.tsx',
  'app/components/data-display/ApprovalTable.tsx': 'app/components/tables/ApprovalTable.tsx',
  'app/components/data-display/Icons.tsx': 'app/components/icons/Icons.tsx',
  'app/components/data-display/ProfilePageShell.tsx': 'app/components/layout/ProfilePageShell.tsx',
  'app/components/data-display/SectionLabel.tsx': 'app/components/layout/SectionLabel.tsx',
  'app/components/data-display/Badge.tsx': 'app/components/feedback/Badge.tsx',
  'app/components/data-display/ContractDaysBadge.tsx': 'app/components/feedback/ContractDaysBadge.tsx',
  'app/components/data-display/EmptyState.tsx': 'app/components/feedback/EmptyState.tsx',
  'app/components/data-display/HorizontalBarChart.tsx': 'app/components/charts/HorizontalBarChart.tsx',
};

Object.entries(moves).forEach(([src, dest]) => {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(src)) fs.renameSync(src, dest);
});

// Sidebar already moved
// if (fs.existsSync('app/components/Sidebar')) {
//   fs.renameSync('app/components/Sidebar', 'app/components/navigation');
// }

['cards', 'tables', 'icons', 'charts', 'feedback', 'layout', 'auth', 'forms'].forEach(dir => {
  const dirPath = `app/components/${dir}`;
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx') && f !== 'index.ts');
  let indexContent = files.map(f => {
    const name = f.replace('.tsx', '');
    return `export * from './${name}';`;
  }).join('\n') + '\n';
  
  if (dir === 'icons') {
     // Icons.tsx usually exports multiple things
     indexContent = `export * from './Icons';\n`;
  } else if (dir === 'tables') {
      if (fs.existsSync(dirPath + '/ApprovalTable.tsx')) {
         indexContent = `export * from './Table';\nexport * from './ApprovalTable';\n`;
      }
  }
  
  fs.writeFileSync(`${dirPath}/index.ts`, indexContent);
});

// Remove empty directories and old index files
if (fs.existsSync('app/components/data-display/index.ts')) fs.unlinkSync('app/components/data-display/index.ts');
if (fs.existsSync('app/components/data-display')) {
    try { fs.rmdirSync('app/components/data-display'); } catch(e) {}
}
if (fs.existsSync('app/components/ui/index.ts')) fs.unlinkSync('app/components/ui/index.ts');
if (fs.existsSync('app/components/ui')) {
    try { fs.rmdirSync('app/components/ui'); } catch(e) {}
}

const allFiles = walkSync('app');
allFiles.forEach(processFile);

console.log("Refactoring complete");
