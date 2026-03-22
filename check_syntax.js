const fs = require('fs');
const path = require('path');

const files = ['js/app.js', 'js/logic.js', 'js/ui.js', 'js/data.js', 'main.js', 'preload.js'];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Simple function wrapper to check syntax
        new Function(content);
        console.log(`✅ ${file} syntax OK`);
    } catch (e) {
        console.error(`❌ ${file} syntax ERROR:`);
        console.error(e.message);
    }
});