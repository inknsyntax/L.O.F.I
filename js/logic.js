// --- LOGIC MODULE --- //
window.AppLogic = {
    // --- TASKS ---
    addTask: () => {
        const txt = document.getElementById('task-in').value;
        if(!txt) return;
        AppState.tasks.push({ id: Date.now(), text: txt, done: false });
        AppLogic.saveTasks();
        document.getElementById('task-in').value = '';
        AppUI.renderTasks();
        AppUI.showToast('Task added');
    },
    toggleTask: (id) => {
        const t = AppState.tasks.find(x => x.id == id);
        if(t) { 
            t.done = !t.done; 
            AppLogic.saveTasks(); 
            AppUI.renderTasks(); 
            // Optional: AppUI.showToast(t.done ? 'Task completed' : 'Task pending');
        }
    },
    deleteTask: (id) => {
        AppState.tasks = AppState.tasks.filter(x => x.id != id);
        AppLogic.saveTasks();
        AppUI.renderTasks();
        AppUI.showToast('Task deleted');
    },
    saveTasks: () => localStorage.setItem('lofi_tasks_db', JSON.stringify(AppState.tasks)),

    // --- NOTES ---
    createNote: () => { 
        if(!AppState.notes) AppState.notes = {};
        const id='n'+Date.now(); 
        AppState.notes[id]={title:'New Note', content:'', date:new Date().toLocaleDateString()}; 
        AppLogic.saveNoteDB();
        AppLogic.openNote(id);
    },
    openNote: (id) => {
        if(!AppState.notes[id]) return;
        AppState.currentNote=id;
        document.getElementById('notes-grid').style.display='none';
        document.getElementById('note-editor-container').style.display='flex';
        const el = document.getElementById('note-content');
        el.innerHTML = AppState.notes[id].content || '';
        
        // Restore Font Preference
        const font = localStorage.getItem('lofi_editor_font') || 'Quicksand';
        el.style.fontFamily = font;
        
        // Update Radio Buttons state
        const radios = document.getElementsByName('font-sel');
        radios.forEach(r => {
            if(r.value === font) r.checked = true;
        });
        
        AppLogic.updateNoteStats();
    },
    saveCurrentNote: () => {
        if(!AppState.currentNote) return;
        const el = document.getElementById('note-content');
        const c = el.innerHTML;
        let t = el.innerText.split('\n')[0].trim();
        if(!t) t = 'Untitled Note';
        if(t.length > 20) t = t.substring(0,20) + '...';
        
        AppState.notes[AppState.currentNote] = {
            ...AppState.notes[AppState.currentNote],
            title: t, 
            content: c
        };
        
        // Debounce Save to LocalStorage
        const statusEl = document.getElementById('note-save-status');
        if(statusEl) statusEl.innerHTML = '<i class="fas fa-pen-nib"></i> Typing...';
        
        if(window.saveTimer) clearTimeout(window.saveTimer);
        window.saveTimer = setTimeout(() => {
            AppLogic.saveNoteDB();
            if(statusEl) statusEl.innerHTML = '<i class="fas fa-check"></i> Saved';
        }, 1000);
        
        AppLogic.updateNoteStats();
    },
    
    updateNoteStats: () => {
        const el = document.getElementById('note-content');
        const statEl = document.getElementById('note-stats');
        if(!el || !statEl) return;
        
        const text = el.innerText || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        
        statEl.innerText = `${words} words | ${chars} chars`;
    },

    deleteNote: (id) => {
        if(confirm('Delete this note?')) {
            delete AppState.notes[id];
            AppLogic.saveNoteDB();
            AppUI.renderNoteList();
        }
    },
    closeNote: () => { AppState.currentNote=null; AppUI.renderNoteList(); },
    saveNoteDB: () => localStorage.setItem('lofi_notes_db',JSON.stringify(AppState.notes)),
    fmt: (c, val=null) => document.execCommand(c,false,val),
    
    // --- NOTE ADVANCED FEATURES ---
    toggleHighlight: () => document.execCommand('hiliteColor', false, 'yellow'),
    
    // --- FONT & STYLE CONTROLS ---
    setFont: (val) => {
        document.execCommand('fontName', false, val);
        const el = document.getElementById('note-content');
        if(el) el.style.fontFamily = val;
        localStorage.setItem('lofi_editor_font', val);
    },
    setSize: (val) => document.execCommand('fontSize', false, val),
    setColor: (val) => document.execCommand('foreColor', false, val),

    setPaper: (cls) => {
        const el = document.getElementById('note-content');
        if(el) {
            el.className = el.className.replace(/paper-\w+/g, '');
            el.classList.add(cls);
        }
    },
    insertTable: () => document.execCommand('insertHTML', false, `
        <table style="width:100%; border-collapse:collapse; margin:15px 0;">
            <tr><td style="border:1px solid #ccc; padding:8px;">Header 1</td><td style="border:1px solid #ccc; padding:8px;">Header 2</td></tr>
            <tr><td style="border:1px solid #ccc; padding:8px;">Data 1</td><td style="border:1px solid #ccc; padding:8px;">Data 2</td></tr>
        </table><br>
    `),
    insertVenn: () => document.execCommand('insertHTML', false, `
        <div class="venn-wrapper" contenteditable="false">
             <div class="venn-circle" style="left: calc(50% - 130px); background: rgba(255,100,100,0.3);" contenteditable="true">Left</div>
             <div class="venn-circle" style="right: calc(50% - 130px); background: rgba(100,100,255,0.3);" contenteditable="true">Right</div>
        </div><br>
    `),
    
    // Auto-Complete / Smart Assist
    handleSmartAssist: (e) => {
        if(!AppState.smartAssist || e.key !== ' ') return;
        
        const sel = window.getSelection();
        const base = sel.anchorNode;
        if(!base || base.nodeType !== 3) return; // Must be text node
        
        const txt = base.textContent;
        // Simple Math Replacements
        const mathMap = { 'sqrt':'√', 'pi':'π', 'delta':'Δ', 'sigma':'Σ', 'theta':'θ', 'lambda':'λ', 'alpha':'α', 'beta':'β' };
        
        const words = txt.split(' ');
        const lastWord = words[words.length - 2]; // -2 because space was just typed
        
        if(lastWord && mathMap[lastWord]) {
            /* Optimization: Only replace text if it matches a known keyword */
            // Replace text
            base.textContent = txt.slice(0, -(lastWord.length + 1)) + mathMap[lastWord] + ' ';
            // Move cursor to end
            sel.collapse(base, base.textContent.length);
        }
        
        // Definition Lookup (def: word)
        if(lastWord && lastWord.startsWith('def:') && lastWord.length > 4) {
            const query = lastWord.substring(4);
            // Replace 'def:word ' with 'Loading...'
            base.textContent = txt.slice(0, -(lastWord.length + 1)) + `[${query}: ...] `;
            
            fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+query)
            .then(r=>r.json())
            .then(d => {
                const def = d[0]?.meanings[0]?.definitions[0]?.definition || " not found.";
                const final = base.textContent.replace(`[${query}: ...]`, `**${query}**: ${def}`);
                base.textContent = final;
                sel.collapse(base, base.textContent.length);
            }).catch(() => {
                base.textContent = base.textContent.replace(`[${query}: ...]`, `[${query} not found]`);
            });
        }
    },

    // Sketch Pad
    openSketchPad: () => {
        // Create Modal
        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.innerHTML = `
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="margin:0;">Sketch Pad</h3>
                    <div>
                        <button onclick="AppLogic.clearCanvas()" class="action-btn" style="padding:5px 10px; background:#ff6b6b">Clear</button>
                        <button onclick="AppLogic.closeSketch(false)" class="action-btn" style="padding:5px 10px; background:#aaa">Cancel</button>
                        <button onclick="AppLogic.closeSketch(true)" class="action-btn" style="padding:5px 10px;">Insert</button>
                    </div>
                </div>
                <div style="border:1px solid rgba(0,0,0,0.1); border-radius:10px; overflow:hidden;">
                    <canvas id="drawing-canvas" width="750" height="400" style="background:white; display:block;"></canvas>
                </div>
                <div style="display:flex; gap:20px; align-items:center; margin-top:15px; background:rgba(0,0,0,0.05); padding:10px; border-radius:10px;">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <label>Color:</label>
                        <input type="color" onchange="AppLogic.setBrushColor(this.value)" value="#000000" style="border:none; padding:0; background:none; cursor:pointer; width:30px; height:30px;">
                    </div>
                    <div style="display:flex; align-items:center; gap:5px; flex:1;">
                        <label>Size:</label>
                        <input type="range" min="1" max="50" value="2" oninput="AppState.brushSize=this.value" style="flex:1;">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        
        // Init Canvas
        const cvs = document.getElementById('drawing-canvas');
        const ctx = cvs.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        AppState.brushColor = 'black';
        AppState.brushSize = 2;
        
        let drawing = false;
        
        const getPos = (e) => {
            const rect = cvs.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        
        cvs.onmousedown = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
        cvs.onmousemove = (e) => { 
            if(!drawing) return; 
            const p = getPos(e); 
            ctx.lineWidth = AppState.brushSize;
            ctx.strokeStyle = AppState.brushColor;
            ctx.lineTo(p.x, p.y); 
            ctx.stroke(); 
        };
        cvs.onmouseup = () => drawing = false;
        
        // Prevent closing when clicking inside modal
        div.onclick = (e) => { if(e.target === div) AppLogic.closeSketch(false); };
    },
    
    setBrushColor: (c) => AppState.brushColor = c,
    clearCanvas: () => {
        const cvs = document.getElementById('drawing-canvas');
        cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height);
    },
    closeSketch: (save) => {
        if(save) {
             const cvs = document.getElementById('drawing-canvas');
             const data = cvs.toDataURL();
             document.execCommand('insertImage', false, data);
        }
        document.querySelector('.modal-overlay').remove();
    },

    // --- FLASHCARDS ---
    loadDecks: () => { AppState.flashcards = JSON.parse(localStorage.getItem('lofi_flashcards_db') || '[]'); },
    saveDecks: () => { localStorage.setItem('lofi_flashcards_db', JSON.stringify(AppState.flashcards)); },
    
    renderDecks: () => {
        AppLogic.loadDecks();
        const grid = document.getElementById('decks-grid');
        if(!grid) return;
        
        if(!AppState.flashcards.length) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; opacity:0.6;">No decks yet. Create one!</p>';
            return;
        }

        grid.innerHTML = AppState.flashcards.map(d => `
            <div class="card" onclick="AppLogic.selectDeck('${d.id}')" style="cursor:pointer; min-height:150px; display:flex; flex-direction:column; justify-content:space-between;">
                <h3>${d.title}</h3>
                <div style="opacity:0.7;">${d.cards.length} Cards</div>
                <button onclick="event.stopPropagation(); AppLogic.deleteDeck('${d.id}')" style="color:#ff6b6b; align-self:flex-end;"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    },
    
    createDeck: () => {
        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.innerHTML = `
            <div class="modal-content" style="max-width:400px; text-align:center;">
                <h3>New Deck Name</h3>
                <input id="new-deck-in" style="width:100%; padding:10px; margin:20px 0; border:1px solid #ccc; border-radius:5px; color:#333; font-size:1.1rem;" placeholder="e.g., Biochemistry" onkeypress="if(event.key==='Enter') AppLogic.finalizeDeck()">
                <div style="display:flex; justify-content:center; gap:10px;">
                    <button onclick="AppLogic.finalizeDeck()" class="action-btn">Create</button>
                    <button onclick="document.querySelector('.modal-overlay').remove()" class="action-btn" style="background:#aaa;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        setTimeout(()=>document.getElementById('new-deck-in').focus(), 50);
    },

    finalizeDeck: () => {
        const title = document.getElementById('new-deck-in').value;
        if(title) {
            AppState.flashcards.push({ id: Date.now().toString(), title, cards: [] });
            AppLogic.saveDecks();
            AppLogic.renderDecks();
        }
        document.querySelector('.modal-overlay').remove();
    },
    
    deleteDeck: (id) => {
        if(!confirm("Delete this deck?")) return;
        AppState.flashcards = AppState.flashcards.filter(d => d.id !== id);
        AppLogic.saveDecks();
        AppLogic.renderDecks();
    },

    selectDeck: (id) => {
        AppState.currentDeck = AppState.flashcards.find(d => d.id === id);
        document.getElementById('decks-view').style.display = 'none';
        document.getElementById('deck-editor').style.display = 'flex';
        document.getElementById('deck-title-display').innerText = AppState.currentDeck.title;
        AppLogic.renderCardsList();
    },

    closeDeck: () => {
        AppState.currentDeck = null;
        document.getElementById('deck-editor').style.display = 'none';
        document.getElementById('study-mode').style.display = 'none';
        document.getElementById('decks-view').style.display = 'block';
        AppLogic.renderDecks();
        document.getElementById('flashcard').classList.remove('flipped');
    },

    renderCardsList: () => {
        const list = document.getElementById('cards-list');
        list.innerHTML = AppState.currentDeck.cards.map((c, i) => `
            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:5px; display:flex; gap:10px;">
                <input value="${c.q}" placeholder="Question" onchange="AppLogic.updateCard(${i}, 'q', this.value)" style="flex:1; padding:8px; border:none; border-radius:3px; background:rgba(255,255,255,0.1); color:inherit;">
                <input value="${c.a}" placeholder="Answer" onchange="AppLogic.updateCard(${i}, 'a', this.value)" style="flex:1; padding:8px; border:none; border-radius:3px; background:rgba(255,255,255,0.1); color:inherit;">
                <button onclick="AppLogic.deleteCard(${i})" style="color:#ff6b6b;"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    },

    addCard: () => {
        AppState.currentDeck.cards.push({ q: "", a: "" });
        AppLogic.saveDecks();
        AppLogic.renderCardsList();
    },

    updateCard: (idx, field, val) => {
        AppState.currentDeck.cards[idx][field] = val;
        AppLogic.saveDecks();
    },

    deleteCard: (idx) => {
        AppState.currentDeck.cards.splice(idx, 1);
        AppLogic.saveDecks();
        AppLogic.renderCardsList();
    },

    studyDeck: () => {
        if(!AppState.currentDeck.cards.length) { alert("Add some cards first!"); return; }
        document.getElementById('deck-editor').style.display = 'none';
        document.getElementById('study-mode').style.display = 'flex';
        
        // Shuffle
        AppState.studyQueue = [...AppState.currentDeck.cards].sort(() => Math.random() - 0.5);
        AppState.studyIndex = 0;
        AppLogic.showStudyCard();
    },

    showStudyCard: () => {
        const card = AppState.studyQueue[AppState.studyIndex];
        const el = document.getElementById('flashcard');
        el.classList.remove('flipped'); // Reset flip
        
        // Brief timeout to hide change
        setTimeout(() => {
            if(!card) {
                document.getElementById('card-front').innerText = "All Done!";
                document.getElementById('card-back').innerText = "Great job!";
            } else {
                document.getElementById('card-front').innerText = card.q;
                document.getElementById('card-back').innerText = card.a;
            }
        }, 200);
    },

    nextCard: () => {
        AppState.studyIndex++;
        if(AppState.studyIndex >= AppState.studyQueue.length) {
            if(confirm("Deck Complete! Restart?")) AppLogic.studyDeck();
            else AppLogic.closeDeck();
        } else {
            AppLogic.showStudyCard();
        }
    },

    // --- VOID ---
    releaseVoid: () => {
        const txt = document.getElementById('void-text');
        if(!txt.value) return;
        txt.classList.add('void-released');
        setTimeout(() => {
             txt.value = "";
             txt.classList.remove('void-released');
             const msgs = ["It is gone.", "Released.", "The universe absorbed it.", "Echoes fading..."];
             const p = document.querySelector('#void-msg');
             if(p) {
                 const original = p.innerText;
                 p.innerText = msgs[Math.floor(Math.random()*msgs.length)];
                 setTimeout(() => p.innerText = original, 3000);
             }
        }, 2000);
    },
    
    // --- REALITY ---
    newReality: () => {
        const txt = AppData.reality[Math.floor(Math.random() * AppData.reality.length)];
        const el = document.getElementById('reality-text');
        if(el) el.innerText = txt;
    },

    // --- SOUND ENGINE (UPGRADED) ---
    toggleSound: (s) => {
        const el = document.getElementById('sound-' + s);
        // Map common IDs to filenames if needed, or assume id.mp3
        const file = `assets/sounds/${s}.mp3`;

        if (!AppState.sounds) AppState.sounds = {};

        if (AppState.sounds[s] && !AppState.sounds[s].paused) {
            AppState.sounds[s].pause();
            if(el) el.classList.remove('playing');
        } else {
            if (!AppState.sounds[s]) {
                AppState.sounds[s] = new Audio(file);
                AppState.sounds[s].loop = true;
                AppState.sounds[s].onerror = () => {
                   if(el) {
                       el.classList.add('error');
                       setTimeout(()=>el.classList.remove('error'), 1000);
                   }
                   console.warn(`Sound missing: ${file}`);
                };
            }
            // Restore previous volume or default to 0.5
            AppState.sounds[s].volume = AppState.sounds[s].activeVol !== undefined ? AppState.sounds[s].activeVol : 0.5;
            
            // Promise handling for autoplay policies
            const p = AppState.sounds[s].play();
            if (p !== undefined) {
                p.then(_ => {
                    if(el) el.classList.add('playing');
                }).catch(error => {
                    console.error("Playback failed:", error);
                });
            }
        }
    },

    setVol: (s, v) => {
        if (AppState.sounds && AppState.sounds[s]) {
            AppState.sounds[s].volume = v;
            AppState.sounds[s].activeVol = v;
        }
    },

    playRadio: (url) => {
        const frame = document.getElementById('player-frame');
        if (frame) {
            // Ensure URL has autoplay and mute (sometimes needed for autoplay policy)
            const symbol = url.includes('?') ? '&' : '?';
            frame.src = url + symbol + "autoplay=1&mute=0";
        }
    },

    loadMusic: () => {
        const input = document.getElementById('music-url');
        const url = input.value.trim();
        const frame = document.getElementById('player-frame');
        
        if(!url) return;

        try {
            if(url.includes('youtube.com') || url.includes('youtu.be')) {
                let vid = '';
                if(url.includes('v=')) vid = url.split('v=')[1].split('&')[0];
                else if(url.includes('youtu.be/')) vid = url.split('youtu.be/')[1].split('?')[0];
                else if(url.includes('embed/')) vid = url.split('embed/')[1].split('?')[0];
                
                if(vid) {
                    frame.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
                    return;
                }
            }
            
            // Fallback for other URLs or direct embeds
            if(url.startsWith('http')) {
                frame.src = url;
            }
        } catch(e) {
            console.error("Error loading music:", e);
            alert("Could not load video. Please check the URL.");
        }
    },

    // --- UTILITIES ---
    setFont: (font) => document.execCommand('fontName', false, font),
    setSize: (size) => document.execCommand('fontSize', false, size),
    setColor: (color) => document.execCommand('foreColor', false, color),
    toggleSpellcheck: (enable) => {
        const editor = document.getElementById('note-content');
        if(editor) editor.setAttribute('spellcheck', enable);
    },

    openCustomTimer: () => {
        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.innerHTML = `
            <div class="modal-content" style="max-width:320px; text-align:center;">
                <h3 style="margin-bottom:20px;">Set Timer</h3>
                <div style="margin-bottom:25px; display:flex; justify-content:center; gap:10px; align-items:center;">
                    <div style="display:flex; flex-direction:column;">
                        <input id="cust-min" type="number" min="0" value="25" style="width:70px; padding:15px; font-size:1.5rem; text-align:center; border-radius:10px; border:1px solid #ccc;">
                        <small style="opacity:0.6;">Mins</small>
                    </div>
                    <span style="font-size:1.5rem; font-weight:bold;">:</span>
                     <div style="display:flex; flex-direction:column;">
                        <input id="cust-sec" type="number" min="0" max="59" value="00" style="width:70px; padding:15px; font-size:1.5rem; text-align:center; border-radius:10px; border:1px solid #ccc;">
                        <small style="opacity:0.6;">Secs</small>
                    </div>
                </div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button onclick="AppLogic.setCustomTime()" class="action-btn">Start Timer</button>
                    <button onclick="document.querySelector('.modal-overlay').remove()" class="action-btn" style="background:#aaa;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    },
    
    setCustomTime: () => {
        const m = parseInt(document.getElementById('cust-min').value) || 0;
        const s = parseInt(document.getElementById('cust-sec').value) || 0;
        const totalMin = m + (s/60);
        AppLogic.setFocusMode('custom', totalMin);
        document.querySelector('.modal-overlay').remove();
    },

    calc: (v) => {
        const disp = document.getElementById('calc-disp');
        if(!disp) return;
        try {
            if(v==='C') disp.value='';
            else if(v==='DEL') disp.value=disp.value.toString().slice(0,-1);
            else if(v==='=') {
                let exp = disp.value;
                exp = exp.replace(/π/g, Math.PI).replace(/e/g, Math.E);
                exp = exp.replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan');
                exp = exp.replace(/log/g, 'Math.log10').replace(/ln/g, 'Math.log').replace(/asin/g, 'Math.asin').replace(/acos/g, 'Math.acos').replace(/atan/g, 'Math.atan');
                exp = exp.replace(/\^/g, '**').replace(/√/g, 'Math.sqrt').replace(/sinh/g, 'Math.sinh').replace(/cosh/g, 'Math.cosh').replace(/tanh/g, 'Math.tanh');
                exp = exp.replace(/abs/g, 'Math.abs').replace(/ceil/g, 'Math.ceil').replace(/floor/g, 'Math.floor').replace(/round/g, 'Math.round');
                disp.value = eval(exp);
            }
            else disp.value += v;
        } catch { disp.value='Error'; setTimeout(()=>disp.value='', 1500); }
    },

    switchCalcMode: (mode) => {
        AppState.calcMode = mode;
        document.querySelectorAll('.calc-mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        const calcContainer = document.getElementById('calc-container');
        if(mode === 'classic') {
            calcContainer.innerHTML = AppUI.getClassicCalc();
        } else if(mode === 'scientific') {
            calcContainer.innerHTML = AppUI.getScientificCalc();
        } else if(mode === 'graphing') {
            calcContainer.innerHTML = AppUI.getGraphingCalc();
            setTimeout(() => AppLogic.plotGraph(), 100);
        }
    },

    plotGraph: () => {
        const canvas = document.getElementById('graph-canvas');
        if(!canvas) return;
        
        const expr = document.getElementById('graph-expr').value || 'x*x';
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const scale = parseFloat(document.getElementById('graph-scale').value) || 10;
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, width, height);
        
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for(let i = 0; i < width; i += scale * 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for(let i = 0; i < height; i += scale * 10) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        
        // Plot function
        ctx.strokeStyle = 'var(--accent)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let firstPoint = true;
        for(let px = 0; px < width; px++) {
            const x = (px - width/2) / scale;
            try {
                let y = eval(expr.replace(/x/g, `(${x})`));
                const py = height/2 - y * scale;
                
                if(isFinite(y) && py > 0 && py < height) {
                    if(firstPoint) {
                        ctx.moveTo(px, py);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(px, py);
                    }
                } else {
                    firstPoint = true;
                }
            } catch(e) {}
        }
        ctx.stroke();
    },

    dictSearch: async () => {
        const w = document.getElementById('dict-in').value;
        const r = document.getElementById('dict-res');
        if(!w) return;
        r.innerText = "Searching...";
        try {
            const res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+w);
            if (!res.ok) throw new Error("Word not found");
            const d = await res.json();
            
            if(!d || !d.length) throw new Error("No definitions found");
            
            const entry = d[0];
            const word = entry.word;
            const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find(p=>p.text)?.text) || '';
            const def = entry.meanings?.[0]?.definitions?.[0]?.definition || "No definition available.";
            
            r.innerHTML = `
                <h3 style="text-transform:capitalize">${word}</h3>
                <p><i>${phonetic}</i></p>
                <p>${def}</p>
            `;
        } catch (e) { 
            console.error(e);
            r.innerText = "Word not found or API error."; 
        }
    },

    // --- CONVERTER ---
    convData: {
        len: { t:'Length', u:{'mm':0.001, 'cm':0.01, 'm':1, 'km':1000, 'in':0.0254, 'ft':0.3048, 'yd':0.9144, 'mi':1609.34, 'nm':1852} },
        mass: { t:'Mass', u:{'mg':0.000001, 'g':0.001, 'kg':1, 'oz':0.0283495, 'lb':0.453592, 'ton':1000} },
        volume: { t:'Volume', u:{'ml':0.001, 'l':1, 'gal':3.78541, 'fl_oz':0.0295735, 'cup':0.236588, 'tbsp':0.0147868, 'tsp':0.00492892} },
        temp: { t:'Temperature', u:{'c':'Celsius', 'f':'Fahrenheit', 'k':'Kelvin'} },
        speed: { t:'Speed', u:{'mps':1, 'kmh':0.277778, 'mph':0.44704, 'knot':0.51444} },
        area: { t:'Area', u:{'mm2':0.000001, 'cm2':0.0001, 'm2':1, 'km2':1000000, 'in2':0.00064516, 'ft2':0.092903, 'yd2':0.836127, 'acre':4046.86, 'ha':10000} },
        energy: { t:'Energy', u:{'j':1, 'kj':1000, 'cal':4.184, 'kcal':4184, 'wh':3600, 'kwh':3600000, 'ev':1.60218e-19, 'btu':1055.06} },
        power: { t:'Power', u:{'w':1, 'kw':1000, 'mw':1000000, 'hp':745.7, 'btuphr':0.293071} },
        pressure: { t:'Pressure', u:{'pa':1, 'kpa':1000, 'bar':100000, 'atm':101325, 'psi':6894.76, 'mmhg':133.322} },
        time: { t:'Time', u:{'ms':0.001, 's':1, 'min':60, 'hr':3600, 'day':86400, 'wk':604800, 'yr':31536000} },
        frequency: { t:'Frequency', u:{'hz':1, 'khz':1000, 'mhz':1000000, 'ghz':1000000000} },
        density: { t:'Density', u:{'kgm3':1, 'gcm3':1000, 'lbft3':16.0185, 'lbin3':27679.9} }
    },

    renderConvOpts: () => {
        const catEl = document.getElementById('conv-cat');
        const mk = document.getElementById('conv-type');
        if(!catEl || !mk) return;
        const data = AppLogic.convData[catEl.value];
        if(data) mk.innerHTML = Object.keys(data.u).map(k => `<option value="${k}">${k}</option>`).join('');
    },
    
    convert: () => {
        const cat = document.getElementById('conv-cat').value;
        const type = document.getElementById('conv-type').value;
        const val = parseFloat(document.getElementById('conv-in').value);
        const out = document.getElementById('conv-res');
        
        if(isNaN(val)) { out.innerText = '--'; return; }
        
        let resTxt = '';
        const catData = AppLogic.convData[cat];
        
        if(cat === 'temp') {
            if(type === 'c') resTxt = `${((val*9/5)+32).toFixed(2)} °F / ${(val+273.15).toFixed(2)} K`;
            else if(type === 'f') resTxt = `${((val-32)*5/9).toFixed(2)} °C / ${((val-32)*5/9+273.15).toFixed(2)} K`;
            else resTxt = `${(val-273.15).toFixed(2)} °C / ${(((val-273.15)*9/5)+32).toFixed(2)} °F`;
        } else {
            const baseVal = val * catData.u[type];
            // Find a good target unit (not the same as input)
            const targetUnit = Object.keys(catData.u).find(u => u !== type);
            if(targetUnit) {
                const res = baseVal / catData.u[targetUnit];
                resTxt = `${res.toFixed(4)} ${targetUnit}`;
            }
        }
        out.innerText = resTxt;
    },

    // --- TIMER & STOPWATCH ---
    setFocusMode: (mode, minutes) => {
        AppState.timer.mode = mode;
        AppState.timer.currentDuration = minutes * 60;
        AppState.timer.timeLeft = minutes * 60;
        AppLogic.resetTimer();
        
        // Update UI buttons
        document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${mode}`);
        if(btn) btn.classList.add('active');
    },

    toggleTimer: () => {
        const btn = document.getElementById('timer-btn');
        if(AppState.timer.isRunning) {
            clearInterval(AppState.timer.interval);
            AppState.timer.isRunning = false;
            if(btn) btn.innerHTML = '<i class="fas fa-play"></i> Start';
        } else {
            AppState.timer.interval = setInterval(AppLogic.tickTimer, 1000);
            AppState.timer.isRunning = true;
            if(btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    },

    tickTimer: () => {
        if(AppState.timer.timeLeft > 0) {
            AppState.timer.timeLeft--;
            AppUI.updateTimerDisplay();
        } else {
            clearInterval(AppState.timer.interval);
            AppState.timer.isRunning = false;
            AppLogic.playAlarm();
            AppLogic.resetTimer();
        }
    },

    resetTimer: () => {
        clearInterval(AppState.timer.interval);
        AppState.timer.isRunning = false;
        AppState.timer.timeLeft = AppState.timer.currentDuration || 25*60;
        AppUI.updateTimerDisplay();
        const btn = document.getElementById('timer-btn');
        if(btn) btn.innerHTML = '<i class="fas fa-play"></i> Start';
    },

    // Stopwatch
    toggleStopwatch: () => {
        if(AppState.stopwatch.isRunning) {
            clearInterval(AppState.stopwatch.interval);
            AppState.stopwatch.isRunning = false;
            document.getElementById('sw-btn').innerHTML = '<i class="fas fa-play"></i> Start';
        } else {
            const startTime = Date.now() - AppState.stopwatch.elapsedTime;
            AppState.stopwatch.interval = setInterval(() => {
                AppState.stopwatch.elapsedTime = Date.now() - startTime;
                AppUI.updateStopwatchDisplay();
            }, 10);
            AppState.stopwatch.isRunning = true;
            document.getElementById('sw-btn').innerHTML = '<i class="fas fa-pause"></i> Stop';
        }
    },

    resetStopwatch: () => {
        clearInterval(AppState.stopwatch.interval);
        AppState.stopwatch.isRunning = false;
        AppState.stopwatch.elapsedTime = 0;
        AppState.stopwatch.laps = [];
        AppUI.updateStopwatchDisplay();
        AppUI.renderLaps();
        document.getElementById('sw-btn').innerHTML = '<i class="fas fa-play"></i> Start';
    },

    lapStopwatch: () => {
        if(AppState.stopwatch.elapsedTime === 0) return;
        AppState.stopwatch.laps.unshift(AppState.stopwatch.elapsedTime);
        AppUI.renderLaps();
    },

    playAlarm: () => {
        const chk = document.getElementById('timer-sound');
        if(chk && !chk.checked) return;

        // Use a browser oscillator for a simple beep if no file
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 523.25; // C5
            osc.type = 'sine';
            
            // Nice melodic pattern
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.4); // G5
            
            osc.start();
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.5);
            osc.stop(now + 1.5);
        } catch(e) { console.error(e); }
        
        // Visual feedback
        /* Adds a flashing animation to the body to alert the user visually */
        document.body.classList.add('flash-anim');
        setTimeout(() => document.body.classList.remove('flash-anim'), 2000);
    },

    // --- CUSTOM THEMES ---
    customTheme: (() => {
        try {
            const t = JSON.parse(localStorage.getItem('lofi_custom_theme') || 'null');
            return t || {isGradient: false, gradientAngle: 45, gradientColor1: "#ffffff", gradientColor2: "#000000"};
        } catch(e) {
            console.error('Theme load error, resetting:', e);
            return {isGradient: false, gradientAngle: 45, gradientColor1: "#ffffff", gradientColor2: "#000000"};
        }
    })(),
    
    useGradient: (use) => {
        AppLogic.customTheme.isGradient = use;
        if(use) {
             AppLogic.updateGradient();
        } else {
             // Re-apply solid background
             const bg = AppLogic.customTheme.bg || '#2d3436';
             document.body.style.background = bg;
             document.body.style.backgroundImage = 'none';
        }
        AppLogic.saveCustomThemeData();
    },

    updateGradient: () => {
        const c1 = document.getElementById('grad-1').value;
        const c2 = document.getElementById('grad-2').value;
        const angle = document.getElementById('grad-angle').value;
        
        AppLogic.customTheme.gradientColor1 = c1;
        AppLogic.customTheme.gradientColor2 = c2;
        AppLogic.customTheme.gradientAngle = angle;
        
        AppLogic.updateCustomTheme('applyGradient');
    },

    updateCustomTheme: (type, val) => {
        const root = document.documentElement;
        
        switch(type) {
            case 'bg':
                AppLogic.customTheme.bg = val;
                if(!AppLogic.customTheme.isGradient) {
                    document.body.style.background = val;
                    document.body.style.backgroundImage = 'none';
                }
                break;

            case 'applyGradient':
                if(AppLogic.customTheme.isGradient) {
                    const c1 = AppLogic.customTheme.gradientColor1 || '#ff9ff3';
                    const c2 = AppLogic.customTheme.gradientColor2 || '#feca57';
                    const ang = AppLogic.customTheme.gradientAngle || 45; // Default if not set
                    
                    document.body.style.background = `linear-gradient(${ang}deg, ${c1}, ${c2})`;
                }
                break;
            
            // Legacy/Direct calls if needed, though updateGradient handles most
            case 'color1': 
            case 'color2':
            case 'angle':
                 AppLogic.updateGradient();
                 break;

            case 'accent':
                root.style.setProperty('--accent', val);
                AppLogic.customTheme.accent = val;
                break;
            case 'text':
                root.style.setProperty('--text-primary', val);
                AppLogic.customTheme.text = val;
                break;
            case 'glass':
                // Convert Hex to RGBA
                const r = parseInt(val.substr(1,2),16);
                const g = parseInt(val.substr(3,2),16);
                const b = parseInt(val.substr(5,2),16);
                // Default opacity 0.65
                const rgba = `rgba(${r},${g},${b}, 0.65)`;
                root.style.setProperty('--glass-panel', rgba);
                AppLogic.customTheme.glass = val;
                break;
            case 'paper':
                // Update global paper style variable if we had one, or apply via class
                // For now, let's inject a style rule or update active editor
                const editor = document.getElementById('note-content');
                if(editor) {
                    editor.style.background = val;
                    editor.className = 'note-editor'; // Remove preset patterns
                }
                AppLogic.customTheme.paper = val;
                break;
        }
        
        AppLogic.saveCustomThemeData();
    },

    saveCustomThemeData: () => {
        localStorage.setItem('lofi_custom_theme', JSON.stringify(AppLogic.customTheme));
    },

    saveCustomTheme: () => {
        localStorage.setItem('lofi_theme', 'custom');
        AppLogic.saveCustomThemeData();
        AppUI.showToast('Custom Theme Saved & Applied!');
    },

    // --- ANALYTICS ---
    logFocusSession: (minutes) => {
        const history = JSON.parse(localStorage.getItem('lofi_focus_history') || '[]');
        const today = new Date().toLocaleDateString();
        history.push({ date: today, mins: minutes });
        // Keep last 100 sessions
        if(history.length > 100) history.shift();
        localStorage.setItem('lofi_focus_history', JSON.stringify(history));
        AppLogic.updateFocusChart();
    },

    updateFocusChart: () => {
        const el = document.getElementById('focus-chart-bars');
        if(!el) return;
        
        const history = JSON.parse(localStorage.getItem('lofi_focus_history') || '[]');
        // Group by Last 7 Days
        const last7 = [];
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString();
            const dayName = d.toLocaleDateString('en-US', {weekday:'short'});
            
            const total = history.filter(h => h.date === dateStr).reduce((acc, cur) => acc + cur.mins, 0);
            last7.push({ day: dayName, val: total });
        }

        const max = Math.max(...last7.map(x=>x.val), 60); // Min scale 60m

        el.innerHTML = last7.map(d => `
            <div style="display:flex; flex-direction:column; align-items:center; gap:5px; flex:1;">
                <div style="width:100%; background:rgba(255,255,255,0.1); border-radius:5px; height:100px; display:flex; align-items:flex-end; position:relative; overflow:hidden;">
                    <div style="width:100%; background:var(--accent); height:${(d.val/max)*100}%; transition:height 1s ease; opacity:0.8;"></div>
                    <div style="position:absolute; bottom:5px; width:100%; text-align:center; font-size:0.7rem; color:white; text-shadow:0 1px 2px black;">${d.val>0?d.val:''}</div>
                </div>
                <div style="font-size:0.8rem; opacity:0.6;">${d.day}</div>
            </div>
        `).join('');
    },

    // --- BREATHING EXERCISE ---
    breathState: 'Inhale',
    startBreath: () => {
        const txt = document.getElementById('breath-text');
        const circle = document.getElementById('breath-circle');
        if(!txt || !circle) return;

        circle.style.animation = 'breatheAnim 12s infinite ease-in-out';
        
        const cycle = () => {
            txt.innerText = "Breathe In...";
            setTimeout(() => {
                txt.innerText = "Hold...";
                setTimeout(() => {
                    txt.innerText = "Breathe Out...";
                    setTimeout(() => {
                        txt.innerText = "Hold...";
                    }, 4000); // Exhale 4s
                }, 4000); // Hold 4s
            }, 4000); // Inhale 4s
        };
        cycle();
        AppState.breathInterval = setInterval(cycle, 16000); // 4+4+4+4 = 16s cycle (Box Breathing)
    },
    stopBreath: () => {
        clearInterval(AppState.breathInterval);
        const circle = document.getElementById('breath-circle');
        if(circle) circle.style.animation = '';
        const txt = document.getElementById('breath-text');
        if(txt) txt.innerText = "Ready?";
    },

    // --- CLOCK ---
    // Global Tick
    tick: () => {
        // Update Clock
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'});
        const dateStr = now.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
        
        const clock = document.getElementById('clock-display');
        if(clock) {
            clock.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:flex-end; line-height:1;">
                <div style="font-size:1.1rem; font-weight:700;">${timeStr}</div>
                <div style="font-size:0.75rem; opacity:0.7;">${dateStr}</div>
            </div>`;
        }
    }
};