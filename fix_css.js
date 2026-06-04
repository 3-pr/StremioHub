const fs = require('fs');

const dirs = ['extension', 'extension-firefox', 'extension-beta'];

for (const dir of dirs) {
  const cssPath = `${dir}/popup/popup.css`;
  
  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');

    // 1. Make the tabs scrollable horizontally
    if (!css.includes('overflow-x: auto;')) {
      css = css.replace(
        /\.settings-tabs\s*\{[\s\S]*?margin-bottom:\s*4px;\s*\}/,
        `$&
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Firefox */
}
.settings-tabs::-webkit-scrollbar {
  display: none; /* Chrome/Safari */`
      );
    }

    // 2. Prevent tabs from shrinking
    if (css.includes('flex: 1;')) {
      css = css.replace(
        /\.settings-tab-btn\s*\{[\s\S]*?flex:\s*1;/m,
        match => match.replace('flex: 1;', 'flex: 0 0 auto;')
      );
    }

    // 3. Apply the mini/compact mode layout to the Web Enhancer settings too
    if (!css.includes('body.compact-mode #settings-tab-webenhancer')) {
      css = css.replace(
        /body\.compact-mode #settings-tab-addons \.setting-card, body\.mini-mode #settings-tab-addons \.setting-card \{/g,
        `body.compact-mode #settings-tab-addons .setting-card, body.mini-mode #settings-tab-addons .setting-card,
body.compact-mode #settings-tab-webenhancer .setting-card, body.mini-mode #settings-tab-webenhancer .setting-card {`
      );
    }

    // Write back
    fs.writeFileSync(cssPath, css);
  }
}

console.log('CSS updated successfully to fix cramped settings');
