const fs = require('fs');
const path = require('path');

const dirs = ['cards', 'tables', 'icons', 'charts', 'feedback', 'layout', 'auth', 'forms'];

dirs.forEach(dir => {
  const dirPath = `app/components/${dir}`;
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx') && f !== 'index.ts');
  let indexContent = files.map(f => {
    const name = f.replace('.tsx', '');
    const content = fs.readFileSync(path.join(dirPath, f), 'utf8');
    if (content.includes('export default')) {
      // If it exports default and maybe others
      return `export { default as ${name} } from './${name}';\nexport * from './${name}';`;
    } else {
      return `export * from './${name}';`;
    }
  }).join('\n') + '\n';

  if (dir === 'icons') {
     indexContent = `export * from './Icons';\n`;
  } else if (dir === 'tables') {
      if (fs.existsSync(dirPath + '/ApprovalTable.tsx')) {
         indexContent = `export { default as Table } from './Table';\nexport * from './Table';\nexport { default as ApprovalTable } from './ApprovalTable';\nexport * from './ApprovalTable';\n`;
      }
  } else if (dir === 'auth') {
      indexContent = `export * from './AuthForms';\n`;
  }
  
  fs.writeFileSync(`${dirPath}/index.ts`, indexContent);
});

// Also fix ProfilePageShell imports which were importing from './' incorrectly
const profilePageShellPath = 'app/components/layout/ProfilePageShell.tsx';
if (fs.existsSync(profilePageShellPath)) {
    let content = fs.readFileSync(profilePageShellPath, 'utf8');
    content = content.replace("import { ProfileCard, StatCard } from './';", "import { ProfileCard, StatCard } from '../cards';");
    fs.writeFileSync(profilePageShellPath, content);
}

// Fix Textarea.tsx because `export *` might not work if it's default export
// Check Input.tsx, it has named exports `Input`, `Select`, `Label`.
// Button has `export default`.
console.log('Fixed index files');
