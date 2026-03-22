window.onload = () => {
    // Init state
    if(localStorage.getItem('lofi_theme') === 'custom') {
        const t = JSON.parse(localStorage.getItem('lofi_custom_theme') || '{}');
        // Initial load for custom
         if(t.isGradient) {
            const c1 = t.gradientColor1 || '#ff9ff3';
            const c2 = t.gradientColor2 || '#feca57';
            const ang = t.gradientAngle || 45;
            document.body.style.background = `linear-gradient(${ang}deg, ${c1}, ${c2})`;
         } else if(t.bg) {
            document.documentElement.style.setProperty('--bg-base', t.bg);
            document.body.style.background = t.bg;
         }
         
         if(t.accent) document.documentElement.style.setProperty('--accent', t.accent);
         if(t.text) document.documentElement.style.setProperty('--text-primary', t.text);
         if(t.glass) {
            const r = parseInt(t.glass.substr(1,2),16);
            const g = parseInt(t.glass.substr(3,2),16);
            const b = parseInt(t.glass.substr(5,2),16);
            document.documentElement.style.setProperty('--glass-panel', `rgba(${r},${g},${b}, 0.65)`);
         }
         // Paper is handled via render helper usually, but can set global variable
    } else {
        AppUI.setTheme(AppState.theme);
    }
    
    // Init Fonts
    ['ui', 'header', 'mono'].forEach(type => {
        const font = localStorage.getItem(`lofi_font_${type}`);
        if(font) document.documentElement.style.setProperty(`--font-${type}`, font);
    });

    AppUI.switchCategory('study');
    
    // Start Ticks
    setInterval(AppLogic.tick, 1000);
    AppLogic.tick();
    
    // Browser zoom is handled natively (Ctrl+/Ctrl-/Ctrl+0)
};