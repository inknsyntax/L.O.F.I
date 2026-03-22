// --- UI RENDER MODULE --- //
window.AppUI = {
    // --- NAVIGATION ---
    switchCategory: (cat) => {
        AppState.category = cat;
        // Update tabs
        document.querySelectorAll('.top-btn').forEach(b => {
             b.classList.remove('active');
             if(b.onclick && b.onclick.toString().includes(cat)) b.classList.add('active');
        });

        // Render Sidebar
        const struct = AppData.structure[cat];
        const sideNav = document.getElementById('side-nav-content');
        if(struct && sideNav) {
            sideNav.innerHTML = struct.sidebar.map(i => 
                `<button class="side-btn" id="mod-btn-${i.id}" onclick="AppUI.switchModule('${i.id}')"><i class="fas fa-${i.icon}"></i> ${i.label}</button>`
            ).join('');
            AppUI.switchModule(struct.sidebar[0].id);
        }
    },
    
    switchModule: (mod) => {
        AppState.module = mod;
        
        // Update active side btn
        document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('mod-btn-'+mod);
        if(activeBtn) activeBtn.classList.add('active');

        // Render View
        const content = document.getElementById('module-content');
        content.innerHTML = AppUI.Views[mod] || `<h2>${mod}</h2><p>Coming soon...</p>`;
        
        // Init Hooks - Refactored for cleaner logic
        setTimeout(() => {
            const Hooks = {
                'subjects': () => AppUI.renderNoteList(),
                'flashcards': () => AppLogic.renderDecks(),
                'tasks': () => AppUI.renderTasks(),
                'converter': () => AppLogic.renderConvOpts(),
                'formulas': () => AppUI.renderList('formulas'),
                'science': () => AppUI.renderList('science'),
                'ela': () => AppUI.renderList('ela'),
                'history': () => AppUI.renderList('history'),
                'cs': () => AppUI.renderList('cs'),
                'reality': () => AppLogic.newReality(),
                'focus': () => AppUI.updateTimerDisplay(),
                'stopwatch': () => AppUI.updateStopwatchDisplay(),
                'calc': () => AppLogic.switchCalcMode(AppState.calcMode)
            };
            if(Hooks[mod]) Hooks[mod]();
        }, 0);
    },

    setTheme: (t) => { 
        document.body.className = t; 
        localStorage.setItem('lofi_theme', t); 
    },

    setFont: (type, fontName, label) => {
        const varName = `--font-${type}`;
        document.documentElement.style.setProperty(varName, fontName);
        localStorage.setItem(`lofi_font_${type}`, fontName);
        
        // Update UI feedback
        const btns = document.querySelectorAll(`.font-btn-${type}`);
        btns.forEach(b => {
            if(b.innerText === label) b.classList.add('active');
            else b.classList.remove('active');
        });
    },

    showToast: (msg) => {
        let t = document.getElementById('app-toast');
        if(!t) {
            t = document.createElement('div');
            t.id = 'app-toast';
            t.className = 'toast';
            t.innerHTML = '<i class="fas fa-check-circle"></i> <span></span>';
            document.body.appendChild(t);
        }
        t.querySelector('span').innerText = msg;
        t.classList.add('show');
        if(window.toastTimeout) clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
    },

    // --- CUSTOM THEMES ---
    previewTheme: () => {
        const bg = document.getElementById('cust-bg') ? document.getElementById('cust-bg').value : '#ffffff';
        const text = document.getElementById('cust-text') ? document.getElementById('cust-text').value : '#333333';
        const accent = document.getElementById('cust-accent') ? document.getElementById('cust-accent').value : '#89b0ae';
        const glass = document.getElementById('cust-glass') ? document.getElementById('cust-glass').value : '#ffffff';
        
        const gradCtrl = document.getElementById('grad-controls');
        const isGrad = gradCtrl && gradCtrl.style.display !== 'none';

        document.documentElement.style.setProperty('--bg-base', bg);
        document.documentElement.style.setProperty('--text-primary', text);
        document.documentElement.style.setProperty('--accent', accent);
        
        let r=255, g=255, b=255;
        if(glass.startsWith('#') && glass.length===7) {
             r = parseInt(glass.substr(1,2),16);
             g = parseInt(glass.substr(3,2),16);
             b = parseInt(glass.substr(5,2),16);
        }
        document.documentElement.style.setProperty('--glass-panel', `rgba(${r},${g},${b}, 0.65)`);

        if(isGrad) {
            const c1 = document.getElementById('grad-1') ? document.getElementById('grad-1').value : bg;
            const c2 = document.getElementById('grad-2') ? document.getElementById('grad-2').value : bg;
            const ang = document.getElementById('grad-angle') ? document.getElementById('grad-angle').value : 45;
            document.body.style.background = `linear-gradient(${ang}deg, ${c1}, ${c2})`;
        } else {
            document.body.style.background = bg;
        }
    },
    
    saveCustomTheme: () => {
        const bg = document.getElementById('cust-bg').value;
        const text = document.getElementById('cust-text').value;
        const accent = document.getElementById('cust-accent').value;
        const glass = document.getElementById('cust-glass').value;
        
        const gradCtrl = document.getElementById('grad-controls');
        const isGrad = gradCtrl && gradCtrl.style.display !== 'none';
        
        let c1 = bg, c2 = bg, ang = 45;
        if(isGrad) {
             c1 = document.getElementById('grad-1').value;
             c2 = document.getElementById('grad-2').value;
             ang = document.getElementById('grad-angle').value;
        }

        const theme = {
            bg, text, accent, glass, isGrad, 
            gradientColor1: c1, 
            gradientColor2: c2, 
            gradientAngle: ang
        };
        
        localStorage.setItem('lofi_custom_theme', JSON.stringify(theme));
        localStorage.setItem('lofi_theme', 'custom');
        
        if(window.AppLogic && AppLogic.customTheme) {
            Object.assign(AppLogic.customTheme, theme);
        }
        
        AppUI.showToast('Custom Theme Saved!');
    },

    // --- RENDER HELPERS ---
    /**
     * Renders the task list.
     * Optimization: Checks if the list element exists before manipulating DOM.
     * Uses template literals for efficient HTML construction.
     */
    renderTasks: () => {
        const list = document.getElementById('task-list');
        if(!list) return;
        
        if(AppState.tasks.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding: 40px; opacity: 0.6;">
                    <i class="fas fa-coffee" style="font-size: 3rem; margin-bottom: 15px; display:block;"></i>
                    <p>All caught up! Add a task to clear your mind.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = AppState.tasks.sort((a,b)=>b.id-a.id).map(t => `
            <div class="task-item ${t.done ? 'done' : ''}">
                <input type="checkbox" class="task-checkbox" ${t.done?'checked':''} onclick="AppLogic.toggleTask(${t.id})">
                <span class="task-text">${t.text}</span>
                <button class="task-delete-btn" onclick="AppLogic.deleteTask(${t.id})" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    renderNoteList: () => {
        const grid = document.getElementById('notes-grid');
        if(!grid) return;
        grid.style.display='grid';
        const editor = document.getElementById('note-editor-container');
        if(editor) editor.style.display='none';
        
        const notesProps = Object.entries(AppState.notes || {});
        if(notesProps.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; opacity:0.6;">No notes created yet.</p>';
            return;
        }

        grid.innerHTML = notesProps.map(([k,v]) => {
            const title = v.title || 'Untitled';
            const rawText = (v.content || '').replace(/<[^>]*>?/gm, '');
            const preview = rawText.slice(0, 60) + (rawText.length>60?'...':'') || 'Empty note...';
            
            return `
            <div class="card" onclick="AppLogic.openNote('${k}')" style="cursor:pointer; position:relative; min-height:120px; display:flex; flex-direction:column;">
                <h3 style="margin:0 0 10px 0; font-size:1.2rem; padding-right:20px;">${title}</h3>
                <small style="opacity:0.6; flex:1;">${preview}</small>
                <div style="margin-top:10px; font-size:0.7rem; opacity:0.4;">${v.date || ''}</div>
                <button onclick="event.stopPropagation(); AppLogic.deleteNote('${k}')" 
                    style="position:absolute; top:10px; right:10px; color:#ff6b6b; background:transparent; padding:5px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>`;
        }).join('');
    },
    
    renderList: (type) => { 
        const el = document.getElementById(type+'-list');
        if(!el) return;
        el.innerHTML = AppData[type].map(x => `<div class="card"><h4>${x.t}</h4><p>${x.d}</p></div>`).join('');
    },

    updateTimerDisplay: () => {
        const disp = document.getElementById('timer-val');
        if(!disp) return;

        const totalSeconds = AppState.timer.timeLeft;
        const m = Math.floor(totalSeconds / 60).toString().padStart(2,'0');
        const s = (totalSeconds % 60).toString().padStart(2,'0');
        
        disp.innerText = `${m}:${s}`;

        // SVG Progress
        const circle = document.getElementById('timer-progress');
        if(circle) {
            const radius = circle.r.baseVal.value;
            const circumference = 2 * Math.PI * radius; // 2 * PI * 120 = 754
            const initialDuration = AppState.timer.currentDuration || 25*60;
            const offset = circumference - (totalSeconds / initialDuration) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = offset;
        }
        
        // Update Title - Premium Detail
        document.title = (AppState.timer.isRunning ? `(${m}:${s}) ` : '') + "L.O.F.I";
    },

    updateStopwatchDisplay: () => {
        const disp = document.getElementById('sw-display');
        if(!disp) return;
        
        const elapsed = AppState.stopwatch.elapsedTime;
        const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
        const s = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
        const m = Math.floor((elapsed / (1000 * 60)) % 60).toString().padStart(2, '0');
        const h = Math.floor((elapsed / (1000 * 60 * 60))).toString().padStart(2, '0');
        
        disp.innerText = `${h}:${m}:${s}.${ms}`;
    },

    renderLaps: () => {
        const list = document.getElementById('sw-laps');
        if(!list) return;
        list.innerHTML = AppState.stopwatch.laps.map((l, i) => {
            const ms = Math.floor((l % 1000) / 10).toString().padStart(2, '0');
            const s = Math.floor((l / 1000) % 60).toString().padStart(2, '0');
            const m = Math.floor((l / (1000 * 60)) % 60).toString().padStart(2, '0');
            return `<div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between;">
                <span>Lap ${AppState.stopwatch.laps.length - i}</span>
                <span style="font-family:var(--font-mono);">${m}:${s}.${ms}</span>
            </div>`;
        }).join('');
    },


    // --- VIEW TEMPLATES ---
    Views: {
        subjects: `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2>Ultimate Notebook</h2>
                <button onclick="AppLogic.createNote()" class="action-btn"><i class="fas fa-plus"></i> New Note</button>
            </div>
            
            <div id="notes-grid" class="grid-container"></div>
            
            <div id="note-editor-container" style="display:none; flex-direction:column; height:100%; position:relative; z-index:999;">
                
                <!-- NOTEBOOK TOOLBAR -->
                <div class="notebook-toolbar">
                    <div class="tool-group">
                        <button class="tool-btn" onclick="AppLogic.closeNote()" style="color:#ff6b6b;"><i class="fas fa-arrow-left"></i></button>
                    </div>

                    <div class="tool-group" style="flex-wrap:wrap; max-width:400px; gap:8px;">
                        <!-- Font Selection via Radio Buttons (Checkboxes) -->
                        <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.1); padding:5px 10px; border-radius:5px;">
                            <span style="font-size:0.7rem; opacity:0.7; margin-right:5px;">Font:</span>
                            <label style="font-size:0.7rem; cursor:pointer; display:flex; align-items:center; gap:3px;"><input type="radio" name="font-sel" value="Quicksand" onchange="AppLogic.setFont(this.value)" checked> Std</label>
                            <label style="font-size:0.7rem; cursor:pointer; display:flex; align-items:center; gap:3px;"><input type="radio" name="font-sel" value="Fira Code" onchange="AppLogic.setFont(this.value)"> Mono</label>
                            <label style="font-size:0.7rem; cursor:pointer; display:flex; align-items:center; gap:3px;"><input type="radio" name="font-sel" value="Dancing Script" onchange="AppLogic.setFont(this.value)"> Curs</label>
                            <label style="font-size:0.7rem; cursor:pointer; display:flex; align-items:center; gap:3px;"><input type="radio" name="font-sel" value="Caveat" onchange="AppLogic.setFont(this.value)"> Hand</label>
                            <label style="font-size:0.7rem; cursor:pointer; display:flex; align-items:center; gap:3px;"><input type="radio" name="font-sel" value="Playfair Display" onchange="AppLogic.setFont(this.value)"> Serif</label>
                        </div>

                        <select onchange="AppLogic.setSize(this.value)" style="width: auto; padding: 5px; font-size: 0.8rem;">
                            <option value="3">Normal</option>
                            <option value="5">Large</option>
                            <option value="7">Huge</option>
                        </select>
                         <button class="tool-btn" onclick="AppLogic.fmt('bold')" title="Bold"><b>B</b></button>
                         <button class="tool-btn" onclick="AppLogic.fmt('italic')" title="Italic"><i>I</i></button>
                         <button class="tool-btn" onclick="AppLogic.fmt('underline')" title="Underline"><u>U</u></button>
                         <button class="tool-btn" onclick="AppLogic.toggleHighlight()" title="Highlight"><i class="fas fa-highlighter"></i></button>
                         <input type="color" onchange="AppLogic.setColor(this.value)" title="Text Color" style="width:25px; height:25px; border:none; background:transparent; cursor:pointer; vertical-align:middle;">
                    </div>

                    <div class="tool-group">
                        <button class="tool-btn" onclick="AppLogic.fmt('justifyLeft')" title="Left"><i class="fas fa-align-left"></i></button>
                        <button class="tool-btn" onclick="AppLogic.fmt('justifyCenter')" title="Center"><i class="fas fa-align-center"></i></button>
                        <button class="tool-btn" onclick="AppLogic.fmt('insertOrderedList')" title="List"><i class="fas fa-list-ol"></i></button>
                        <button class="tool-btn" onclick="AppLogic.fmt('insertUnorderedList')" title="List"><i class="fas fa-list-ul"></i></button>
                    </div>

                    <div class="tool-group">
                        <button class="tool-btn" onclick="AppLogic.insertTable()" title="Insert Table"><i class="fas fa-table"></i></button>
                        <button class="tool-btn" onclick="AppLogic.insertVenn()" title="Venn Diagram"><i class="fas fa-shapes"></i></button>
                        <button class="tool-btn" onclick="AppLogic.openSketchPad()" title="Draw"><i class="fas fa-pencil-alt"></i></button>
                    </div>

                    <!-- Duplicate Controls Removed -->

                    <div class="tool-group">
                        <select id="paper-select" onchange="AppLogic.setPaper(this.value)" style="width: auto; padding: 5px; font-size: 0.8rem;">
                            <option value="paper-plain">Plain</option>
                            <option value="paper-lined">Lined</option>
                            <option value="paper-grid">Grid</option>
                            <option value="paper-dots">Dots</option>
                            <option value="paper-sepia">Sepia</option>
                            <option value="paper-dark">Dark</option>
                        </select>
                    </div>
                    
                    <div style="margin-left:auto; display:flex; gap:15px; align-items:center;">
                        <div style="display:flex; align-items:center;" title="Enable Spellcheck">
                            <input type="checkbox" id="spellcheck-toggle" onchange="AppLogic.toggleSpellcheck(this.checked)" checked style="margin-right:5px;">
                            <i class="fas fa-spell-check" style="opacity:0.7; font-size:0.9rem;"></i>
                        </div>
                        <div style="display:flex; align-items:center;" title="AI Auto-Complete">
                            <input type="checkbox" id="smart-assist" onchange="AppState.smartAssist = this.checked" style="margin-right:5px;"> 
                            <span style="font-size:0.8rem; opacity:0.7;">AI Assist</span>
                        </div>
                    </div>
                </div>


                <!-- Paper Style Editor -->
                <div style="flex:1; overflow-y:auto; position:relative; z-index:999; display:flex; flex-direction:column;">
                    <div id="note-content" contenteditable="true" spellcheck="true" class="note-editor paper-plain" 
                         style="font-family:'Quicksand', sans-serif; flex:1; padding:40px; border-radius:10px 10px 0 0; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); user-select:text; outline:none;"
                         oninput="AppLogic.saveCurrentNote()" onkeydown="AppLogic.handleSmartAssist(event)">
                    </div>
                </div>
                
                <!-- NOTE STATUS BAR -->
                <div style="background:rgba(255,255,255,0.15); padding:5px 15px; font-size:0.7rem; font-family:var(--font-mono); color:var(--text-muted); display:flex; justify-content:space-between; border-radius: 0 0 10px 10px; backdrop-filter:blur(5px);">
                    <span id="note-stats">0 words | 0 chars</span>
                    <span id="note-save-status"><i class="fas fa-check"></i> Saved</span>
                </div>
            </div>

            <!-- DRAWING MODAL REMOVED FROM HERE TO BODY IN LOGIC FOR Z-INDEX CLARITY OR KEPT HIDDEN -->
        `,
        flashcards: `
            <div id="decks-view">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2>Flashcard Decks</h2>
                    <button onclick="AppLogic.createDeck()" class="action-btn"><i class="fas fa-plus"></i> New Deck</button>
                </div>
                <div id="decks-grid" class="grid-container"></div>
            </div>
            
            <div id="deck-editor" style="display:none; height:100%; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <div style="display:flex; align-items:center;">
                        <button onclick="AppLogic.closeDeck()" style="margin-right:15px;"><i class="fas fa-arrow-left"></i> Back</button>
                        <h2 id="deck-title-display">Chemistry</h2>
                    </div>
                    <div>
                        <button onclick="AppLogic.studyDeck()" class="action-btn" style="background:#6c5ce7;">Study Now</button>
                        <button onclick="AppLogic.addCard()" class="action-btn">Add Card</button>
                    </div>
                </div>
                <div id="cards-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px;"></div>
            </div>

            <div id="study-mode" style="display:none; height:100%; flex-direction:column; align-items:center; justify-content:center;">
                <div id="flashcard" onclick="this.classList.toggle('flipped')" style="
                    width:500px; height:300px; padding:30px; 
                    background:white; color:#333; border-radius:15px; 
                    display:flex; align-items:center; justify-content:center; 
                    font-size:1.5rem; text-align:center;
                    box-shadow:0 10px 30px rgba(0,0,0,0.2); 
                    cursor:pointer;
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                    position:relative;
                ">
                    <div id="card-front" style="backface-visibility:hidden; position:absolute; width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:20px;">Question</div>
                    <div id="card-back" style="backface-visibility:hidden; position:absolute; width:100%; height:100%; transform: rotateY(180deg); background:#fcfcfc; display:flex; align-items:center; justify-content:center; padding:20px; border-radius:15px;">Answer</div>
                </div>
                <div style="margin-top:40px; display:flex; gap:20px;">
                    <button onclick="AppLogic.nextCard()" class="action-btn" style="padding:15px 40px; font-size:1.2rem;">Next Card <i class="fas fa-arrow-right"></i></button>
                    <button onclick="AppLogic.closeDeck()" style="background:rgba(255,255,255,0.1);">Exit</button>
                </div>
                <p style="margin-top:20px; opacity:0.6;">Click card to flip</p>
            </div>
        `,
        tasks: `
            <h2>Task List</h2>
            <div style="display:flex; gap:10px; margin-bottom:25px;">
                <input id="task-in" placeholder="What needs to be done?" style="flex:1; padding:15px; background:rgba(255,255,255,0.1); border:none; color:inherit; border-radius:10px; outline:none;" onkeypress="if(event.key==='Enter') AppLogic.addTask()">
                <button class="action-btn" onclick="AppLogic.addTask()">Add Task</button>
            </div>
            <div id="task-list" style="display:flex; flex-direction:column; gap:10px;"></div>
        `,
        void: `
            <div style="text-align:center; max-width:600px; margin:0 auto;" id="void">
                <h2 style="margin-bottom:10px;">The Void</h2>
                <p id="void-msg" style="opacity:0.7; margin-bottom:20px;">Type what burdens you. Release it into the abyss.</p>
                <textarea id="void-text" placeholder="Write here..." style="width:100%; height:300px; background:#111; color:#0f0; padding:20px; border:none; border-radius:10px; resize:none; font-family:'Fira Code'; margin-bottom:20px; box-shadow:inset 0 0 20px rgba(0,0,0,0.5); outline:none; font-size:1.1rem;"></textarea>
                <button onclick="AppLogic.releaseVoid()" style="width:100%; padding:15px; background:#ff6b6b; color:white; border:none; font-weight:bold; cursor:pointer; font-size:1.2rem; border-radius:10px;">RELEASE</button>
            </div>
        `,
        // --- UPGRADED UTILITIES --- //
        focus: `
            <div class="timer-container" style="text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h2 style="margin-bottom:20px;">Deep Focus</h2>
                
                <div style="display:flex; justify-content:center; gap:10px; margin-bottom:30px;">
                    <button id="btn-focus" class="action-btn timer-mode-btn active" onclick="AppLogic.setFocusMode('focus', 25)">Focus (25)</button>
                    <button id="btn-short" class="action-btn timer-mode-btn" style="background:rgba(255,255,255,0.1);" onclick="AppLogic.setFocusMode('short', 5)">Short (5)</button>
                    <button id="btn-long" class="action-btn timer-mode-btn" style="background:rgba(255,255,255,0.1);" onclick="AppLogic.setFocusMode('long', 15)">Long (15)</button>
                </div>
                
                <div class="timer-widget" style="position:relative; width:300px; height:300px; margin:0 auto;">
                     <svg width="300" height="300" style="transform: rotate(-90deg);">
                         <circle cx="150" cy="150" r="120" stroke="rgba(255,255,255,0.1)" stroke-width="8" fill="transparent"></circle>
                         <circle id="timer-progress" cx="150" cy="150" r="120" stroke="var(--accent)" stroke-width="8" fill="transparent" stroke-dasharray="754" stroke-dashoffset="0" stroke-linecap="round" style="transition: stroke-dashoffset 1s linear;"></circle>
                     </svg>
                     <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
                         <div id="timer-val" style="font-size:3.5rem; font-family:var(--font-mono); font-weight:700;">25:00</div>
                         <div id="timer-status" style="opacity:0.7; letter-spacing:2px; margin-top:5px; font-size:0.8rem;">READY</div>
                     </div>
                </div>

                <div style="margin-top:40px; display:flex; justify-content:center; gap:20px;">
                    <button id="timer-btn" class="action-btn" style="padding:15px 40px; font-size:1.2rem;" onclick="AppLogic.toggleTimer()"><i class="fas fa-play"></i> Start</button>
                    <button class="action-btn" style="background:rgba(255,255,255,0.1);" onclick="AppLogic.resetTimer()"><i class="fas fa-undo"></i></button>
                    <button class="action-btn" style="background:rgba(255,255,255,0.1);" onclick="AppLogic.openCustomTimer()" title="Set Custom Time"><i class="fas fa-clock"></i></button>
                </div>
                
                <div style="margin-top:20px; display:flex; gap:10px; align-items:center;">
                    <label style="font-size:0.9rem; opacity:0.8;"><input type="checkbox" id="timer-sound" checked> Sound Alarm</label>
                </div>

                <!-- Stats -->
                <div style="margin-top:40px; width:100%; max-width:600px;">
                    <h4 style="opacity:0.7; font-size:0.9rem; margin-bottom:10px;">Weekly Focus (Mins)</h4>
                    <div id="focus-chart-bars" style="display:flex; justify-content:space-between; align-items:flex-end; height:120px; gap:10px;">
                         <!-- Injected by Logic -->
                    </div>
                </div>
            </div>
        `,
        breath: `
            <div style="height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h2 style="margin-bottom:40px;">Box Breathing</h2>
                
                <div id="breath-circle" style="
                    width:250px; height:250px; 
                    background:rgba(255,255,255,0.1); 
                    border-radius:50%; 
                    display:flex; justify-content:center; align-items:center;
                    box-shadow: 0 0 30px var(--accent);
                    transition: all 0.5s ease;
                ">
                    <span id="breath-text" style="font-size:1.5rem; font-weight:600; text-transform:uppercase; letter-spacing:2px;">Ready?</span>
                </div>
                
                <div style="margin-top:60px; display:flex; gap:20px;">
                    <button class="action-btn" onclick="AppLogic.startBreath()">Start</button>
                    <button class="action-btn" style="background:#ff6b6b;" onclick="AppLogic.stopBreath()">Stop</button>
                </div>
                
                <p style="margin-top:20px; opacity:0.6; max-width:400px; text-align:center;">
                    Inhale (4s) • Hold (4s) • Exhale (4s) • Hold (4s)
                </p>
            </div>
        `,
        stopwatch: `
            <div class="card" style="text-align:center; max-width:500px; margin:0 auto; padding:40px; display:flex; flex-direction:column; height:80%;">
                <h3>Stopwatch</h3>
                <div id="sw-display" style="font-size:4rem; font-family:var(--font-mono); font-weight:700; margin:40px 0; letter-spacing:2px;">00:00:00.00</div>
                
                <div style="display:flex; justify-content:center; gap:20px; margin-bottom:30px;">
                     <button id="sw-btn" class="action-btn" style="padding:15px 30px; font-size:1.2rem;" onclick="AppLogic.toggleStopwatch()"><i class="fas fa-play"></i> Start</button>
                     <button class="action-btn" style="background:rgba(255,255,255,0.2);" onclick="AppLogic.lapStopwatch()">Lap</button>
                     <button class="action-btn" style="background:#ff6b6b;" onclick="AppLogic.resetStopwatch()">Reset</button>
                </div>
                
                <div style="flex:1; overflow-y:auto; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                    <div id="sw-laps" style="text-align:left;"></div>
                </div>
            </div>
        `,
        calc: `
            <div style="max-width:900px; margin:0 auto;">
                <div style="display:flex; gap:10px; margin-bottom:20px; justify-content:center; flex-wrap:wrap;">
                    <button class="calc-mode-btn action-btn active" data-mode="classic" onclick="AppLogic.switchCalcMode('classic')" style="background:var(--accent);">Classic</button>
                    <button class="calc-mode-btn action-btn" data-mode="scientific" onclick="AppLogic.switchCalcMode('scientific')">Scientific</button>
                    <button class="calc-mode-btn action-btn" data-mode="graphing" onclick="AppLogic.switchCalcMode('graphing')">Graphing</button>
                </div>
                <div id="calc-container"></div>
            </div>
        `,
        converter: `
            <div class="card" style="text-align:center; max-width:600px; margin:0 auto; padding:40px;">
                <h3>Unit Converter</h3>
                <div style="display:flex; gap:10px; justify-content:center; margin-bottom:30px; margin-top:20px; flex-wrap:wrap;">
                    <select id="conv-cat" style="padding:15px; border-radius:10px; border:none; background:rgba(255,255,255,0.2); min-width:150px;" onchange="AppLogic.renderConvOpts()">
                        <option value="len">Length</option>
                        <option value="mass">Mass</option>
                        <option value="volume">Volume</option>
                        <option value="temp">Temperature</option>
                        <option value="speed">Speed</option>
                        <option value="area">Area</option>
                        <option value="energy">Energy</option>
                        <option value="power">Power</option>
                        <option value="pressure">Pressure</option>
                        <option value="time">Time</option>
                        <option value="frequency">Frequency</option>
                        <option value="density">Density</option>
                    </select>
                    <select id="conv-type" style="padding:15px; border-radius:10px; border:none; background:rgba(255,255,255,0.2); min-width:120px;"></select>
                </div>
                
                <div style="position:relative;">
                    <input id="conv-in" type="number" placeholder="Value" style="padding:20px; width:100%; border-radius:15px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.1); margin-bottom:20px; color:inherit; text-align:center; font-size:1.5rem;" oninput="AppLogic.convert()">
                </div>

                <div style="margin-top:30px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1);">
                    <h2 id="conv-res" style="font-size:2.5rem; margin:0; word-break:break-all;">--</h2>
                    <small style="opacity:0.5;">Result</small>
                </div>
            </div>
        `,
        dictionary: `
            <div class="card" style="max-width:600px; margin:0 auto;">
                <div style="display:flex; gap:10px;">
                    <input id="dict-in" placeholder="Search for a word..." style="flex:1; padding:15px; border-radius:10px; border:none; background:rgba(255,255,255,0.1); outline:none; color:inherit;" onkeypress="if(event.key==='Enter') AppLogic.dictSearch()">
                    <button class="action-btn" onclick="AppLogic.dictSearch()">Define</button>
                </div>
                <div id="dict-res" style="margin-top:30px; line-height:1.6;"></div>
            </div>
        `,
        formulas: `<div class="grid-container" id="formulas-list"></div>`,
        science: `<div class="grid-container" id="science-list"></div>`,
        ela: `<div class="grid-container" id="ela-list"></div>`,
        history: `<div class="grid-container" id="history-list"></div>`,
        cs: `<div class="grid-container" id="cs-list"></div>`,
        
        mixer: `
            <div style="max-width:900px; margin:0 auto;">
                <h2 style="text-align:center; margin-bottom:10px;">Ambient Soundscapes</h2>
                <p style="text-align:center; opacity:0.6; margin-bottom:40px;">Mix and match sounds to create your perfect environment.</p>
                
                ${Object.keys(AppData.soundLibrary).map(cat => `
                    <div style="margin-bottom:30px;">
                        <h4 style="text-transform:capitalize; opacity:0.8; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">${cat}</h4>
                        <div class="sound-grid">
                            ${AppData.soundLibrary[cat].map(s => `
                                <div id="sound-${s.id}" class="sound-card" onclick="AppLogic.toggleSound('${s.id}')">
                                    <div class="sound-icon"><i class="fas fa-${s.icon}"></i></div>
                                    <span class="sound-label">${s.label}</span>
                                    <input type="range" class="vol-slider" min="0" max="1" step="0.05" value="0.5" 
                                           onclick="event.stopPropagation()" oninput="AppLogic.setVol('${s.id}',this.value)">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `,
        playlist: `
            <div style="max-width:800px; margin:0 auto;">
                <h2 style="text-align:center; margin-bottom:30px;">Radio & Music</h2>
                
                <!-- Main Player -->
                <div id="music-frame" class="player-container">
                    <iframe id="player-frame" src="https://www.youtube.com/embed/jfKfPfyJRdk" width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border-radius:15px; box-shadow:0 10px 30px rgba(0,0,0,0.3);"></iframe>
                </div>

                <!-- Custom Input -->
                <div style="display:flex; gap:10px; margin:20px 0;">
                    <input id="music-url" placeholder="Paste YouTube/SoundCloud Embed URL..." style="flex:1;">
                    <button class="action-btn" onclick="AppLogic.loadMusic()">Load</button>
                </div>

                <!-- Radio Stations -->
                <h4 style="opacity:0.8; margin-bottom:15px;">Live Stations</h4>
                <div class="radio-grid">
                    ${AppData.radioStations.map(r => `
                        <div class="radio-card" onclick="AppLogic.playRadio('${r.url}')">
                            <div class="radio-icon"><i class="fas fa-broadcast-tower"></i></div>
                            <div>
                                <div style="font-weight:bold;">${r.name.split('-')[0].trim()}</div>
                                <div style="font-size:0.8rem; opacity:0.6;">${r.name.split('-')[1] || 'Live Radio'}</div>
                            </div>
                            <div class="radio-play"><i class="fas fa-play"></i></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `,
        
        reality: `
            <div style="text-align:center; padding:50px; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;" id="reality-box">
                <h1 style="font-size:3rem; margin-bottom:30px; letter-spacing:5px;">REALITY CHECK</h1>
                <p id="reality-text" style="font-size:1.8rem; font-style:italic; max-width:800px; line-height:1.4;">Click below.</p>
                <button class="action-btn" style="margin-top:50px; padding:15px 40px; border-radius:30px;" onclick="AppLogic.newReality()">Hit Me</button>
            </div>
        `,
        settings: `
            <div style="max-width:900px; margin:0 auto;">
                <h2>Customization</h2>
                
                <div class="settings-grid">
                    <!-- THEMES -->
                    <div class="setting-group" style="grid-column: 1 / -1;">
                        <h4>Themes</h4>
                        
                        <div style="margin-bottom:15px; display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
                            <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Nature</strong>
                                ${['forest','ocean','desert','aurora'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>
                            
                            <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Aesthetic</strong>
                                ${['cyberpunk','vaporwave','artdeco','vintage'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>

                            <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Seasonal</strong>
                                ${['blossom','autumn','winter','summer'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>

                            <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Mood</strong>
                                ${['calm','energetic','cozy','mystery'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>

                             <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Gaming</strong>
                                ${['matrix','retro','dracula'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>

                            <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Classic</strong>
                                ${['beige','light','dark','midnight','contrast','tan'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>
                            
                            <div>
                                <strong style="display:block; margin-bottom:10px; opacity:0.7;">Gradients</strong>
                                ${['holographic','rainbow','sunset','sunrise','nightsky','space','citylights'].map(t=>`<button class="theme-btn" style="background:rgba(255,255,255,0.1); text-transform:capitalize;" onclick="AppUI.setTheme('theme-${t}')">${t}</button>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- FONTS -->
                    <div class="setting-group">
                        <h4>Interface Font</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:5px;">
                            ${[
                                {l:'Quicksand', f:"'Quicksand', sans-serif"},
                                {l:'Poppins', f:"'Poppins', sans-serif"},
                                {l:'Outfit', f:"'Outfit', sans-serif"},
                                {l:'Fredoka', f:"'Fredoka', sans-serif"}
                            ].map(f=>`<button class="theme-btn font-btn-ui" style="font-family:${f.f}" onclick="AppUI.setFont('ui',${JSON.stringify(f.f)}, '${f.l}')">${f.l}</button>`).join('')}
                        </div>
                    </div>

                    <div class="setting-group">
                        <h4>Header Font</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:5px;">
                            ${[
                                {l:'Quicksand', f:"'Quicksand', sans-serif"},
                                {l:'Playfair', f:"'Playfair Display', serif"},
                                {l:'Lora', f:"'Lora', serif"},
                                {l:'Caveat', f:"'Caveat', cursive"},
                                {l:'Indie Flower', f:"'Indie Flower', cursive"}
                            ].map(f=>`<button class="theme-btn font-btn-header" style="font-family:${f.f}" onclick="AppUI.setFont('header',${JSON.stringify(f.f)}, '${f.l}')">${f.l}</button>`).join('')}
                        </div>
                    </div>

                    <div class="setting-group">
                        <h4>Code / Mono</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:5px;">
                            ${[
                                {l:'Fira Code', f:"'Fira Code', monospace"},
                                {l:'JetBrains', f:"'JetBrains Mono', monospace"},
                                {l:'IBM Plex', f:"'IBM Plex Serif', serif"}
                            ].map(f=>`<button class="theme-btn font-btn-mono" style="font-family:${f.f}" onclick="AppUI.setFont('mono',${JSON.stringify(f.f)}, '${f.l}')">${f.l}</button>`).join('')}
                        </div>
                    </div>

                    <!-- CUSTOM THEME BUILDER (New!) -->
                    <div class="setting-group" style="grid-column: 1 / -1;">
                        <h4 style="display:flex; justify-content:space-between; align-items:center;">
                            <span>Studio: Build Your Theme</span>
                            <span class="badge" style="background:#6c5ce7;">PREMIUM</span>
                        </h4>
                        
                        <div class="grid-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:20px;">
                            <!-- Background Controls -->
                            <div style="grid-column: span 2;">
                                <label style="display:block; margin-bottom:5px; opacity:0.8; font-size:0.9rem;">Background Style</label>
                                <div style="display:flex; gap:10px; margin-bottom:10px;">
                                    <button class="action-btn" style="flex:1; padding:5px;" onclick="document.getElementById('grad-controls').style.display='none'; document.getElementById('solid-controls').style.display='flex'; AppLogic.useGradient(false);">Solid</button>
                                    <button class="action-btn" style="flex:1; padding:5px; background:linear-gradient(45deg, #ff9a9e, #fad0c4);" onclick="document.getElementById('solid-controls').style.display='none'; document.getElementById('grad-controls').style.display='flex'; AppLogic.useGradient(true);">Gradient</button>
                                </div>
                                
                                <!-- Solid -->
                                <div id="solid-controls" class="flex-center" style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; justify-content:space-between; display:${AppLogic.customTheme.isGradient ? 'none' : 'flex'};">
                                    <label>Solid Color</label>
                                    <input type="color" id="cust-bg" oninput="AppUI.previewTheme()" value="${AppLogic.customTheme.bg || '#f7f3e8'}" style="width:40px; height:40px; padding:0; border:none; background:none; cursor:pointer;">
                                </div>

                                <!-- Gradient -->
                                <div id="grad-controls" style="display:${AppLogic.customTheme.isGradient ? 'flex' : 'none'}; background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; flex-direction:column; gap:10px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <label>Color 1</label>
                                        <input type="color" id="grad-1" oninput="AppUI.previewTheme()" value="${AppLogic.customTheme.gradientColor1 || '#a18cd1'}" style="width:30px; height:30px; border:none; background:none; cursor:pointer;">
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <label>Color 2</label>
                                        <input type="color" id="grad-2" oninput="AppUI.previewTheme()" value="${AppLogic.customTheme.gradientColor2 || '#fbc2eb'}" style="width:30px; height:30px; border:none; background:none; cursor:pointer;">
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <label>Angle</label>
                                        <input type="range" id="grad-angle" min="0" max="360" value="${AppLogic.customTheme.gradientAngle || 120}" oninput="AppUI.previewTheme()" style="flex:1;">
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label style="display:block; margin-bottom:5px; opacity:0.8; font-size:0.9rem;">Accent Color</label>
                                <div class="flex-center" style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; justify-content:space-between;">
                                    <input type="color" id="cust-accent" oninput="AppUI.previewTheme()" value="#89b0ae" style="width:40px; height:40px; padding:0; border:none; background:none; cursor:pointer;">
                                    <span style="opacity:0.6; font-family:var(--font-mono); font-size:0.8rem;">#HEX</span>
                                </div>
                            </div>

                            <div>
                                <label style="display:block; margin-bottom:5px; opacity:0.8; font-size:0.9rem;">Text Color</label>
                                <div class="flex-center" style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; justify-content:space-between;">
                                    <input type="color" id="cust-text" oninput="AppUI.previewTheme()" value="#444444" style="width:40px; height:40px; padding:0; border:none; background:none; cursor:pointer;">
                                    <span style="opacity:0.6; font-family:var(--font-mono); font-size:0.8rem;">#HEX</span>
                                </div>
                            </div>

                            <div>
                                <label style="display:block; margin-bottom:5px; opacity:0.8; font-size:0.9rem;">Glass Tint</label>
                                <div class="flex-center" style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; justify-content:space-between;">
                                    <input type="color" id="cust-glass" oninput="AppUI.previewTheme()" value="#ffffff" style="width:40px; height:40px; padding:0; border:none; background:none; cursor:pointer;">
                                    <span style="opacity:0.6; font-family:var(--font-mono); font-size:0.8rem;">RGBA</span>
                                </div>
                            </div>
                        </div>

                         <div class="grid-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                            <!-- Fonts Override -->
                            <div>
                                <label style="display:block; margin-bottom:8px; opacity:0.8; font-size:0.9rem;">UI Font Family</label>
                                <select onchange="AppUI.setFont('ui', this.value, 'Custom')" style="background:rgba(255,255,255,0.1); border:none; padding:10px; width:100%;">
                                    <option value="" disabled selected>Select Font...</option>
                                    <option value="'Quicksand', sans-serif">Quicksand</option>
                                    <option value="'Poppins', sans-serif">Poppins</option>
                                    <option value="'Outfit', sans-serif">Outfit</option>
                                    <option value="'Fredoka', sans-serif">Fredoka</option>
                                </select>
                            </div>

                            <div>
                                <label style="display:block; margin-bottom:8px; opacity:0.8; font-size:0.9rem;">Notepad Paper Color</label>
                                <div class="flex-center" style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; justify-content:space-between;">
                                    <input type="color" oninput="AppUI.previewTheme()" value="#ffffff" style="width:40px; height:40px; padding:0; border:none; background:none; cursor:pointer;">
                                    <span style="opacity:0.6; font-size:0.8rem;">Changes BG</span>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
                            <button class="action-btn" onclick="AppUI.saveCustomTheme()"><i class="fas fa-save"></i> Save My Theme</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    },

    // --- CALCULATOR MODES ---
    getClassicCalc: () => `
        <div style="max-width:340px; margin:0 auto;">
            <input id="calc-disp" style="width:100%; text-align:right; font-size:2.5rem; margin-bottom:20px; background:rgba(0,0,0,0.2); border:none; border-radius:15px; color:inherit; padding:20px; box-sizing:border-box; font-family:var(--font-mono);" readonly>
            <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px;">
                ${['C','DEL','(',')', '7','8','9','/', '4','5','6','*', '1','2','3','-', '0','.','=','+'].map(b=>
                    `<button style="padding:20px; background: ${ ['=','C','DEL'].includes(b) ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }; color:${ ['=','C','DEL'].includes(b) ? 'white' : 'inherit' }; font-size:1.3rem; border-radius:12px; font-family:var(--font-mono); font-weight:bold;" onclick="AppLogic.calc('${b}')">${b}</button>`
                ).join('')}
            </div>
        </div>
    `,

    getScientificCalc: () => `
        <div style="max-width:600px; margin:0 auto;">
            <input id="calc-disp" style="width:100%; text-align:right; font-size:2rem; margin-bottom:20px; background:rgba(0,0,0,0.2); border:none; border-radius:15px; color:inherit; padding:20px; box-sizing:border-box; font-family:var(--font-mono);" readonly>
            <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:8px;">
                ${['C','DEL','(',')','^','√', 'sin','cos','tan','log','ln','π', '7','8','9','/','!','%', '4','5','6','*','e','π', '1','2','3','-','asin','acos', '0','.','=','+','sinh','cosh', 'atan','tanh','abs','round', 'ceil','floor','fact','root'].map(b=>
                    `<button style="padding:12px; background: ${ ['=','C','DEL'].includes(b) ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }; color:${ ['=','C','DEL'].includes(b) ? 'white' : 'inherit' }; font-size:0.9rem; border-radius:10px; font-family:var(--font-mono);" onclick="AppLogic.calc('${b}')">${b}</button>`
                ).join('')}
            </div>
        </div>
    `,

    getGraphingCalc: () => `
        <div style="max-width:900px; margin:0 auto;">
            <div style="display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap;">
                <div style="flex:1; min-width:300px;">
                    <label style="display:block; margin-bottom:10px;">Function (x):</label>
                    <input id="graph-expr" type="text" placeholder="e.g., x*x, sin(x), abs(x)" value="x*x" style="width:100%; padding:15px; border-radius:10px; border:none; background:rgba(255,255,255,0.1); color:inherit; margin-bottom:10px; font-family:var(--font-mono);" oninput="AppLogic.plotGraph()">
                    <label style="display:block; margin-bottom:10px;">Scale:</label>
                    <input id="graph-scale" type="number" value="20" min="1" max="100" style="width:100%; padding:15px; border-radius:10px; border:none; background:rgba(255,255,255,0.1); color:inherit; font-family:var(--font-mono);" oninput="AppLogic.plotGraph()">
                </div>
            </div>
            <canvas id="graph-canvas" width="800" height="500" style="width:100%; max-width:800px; background:rgba(0,0,0,0.3); border-radius:15px; margin:0 auto; display:block; cursor:crosshair;"></canvas>
            <div style="margin-top:20px; padding:20px; background:rgba(255,255,255,0.1); border-radius:15px; text-align:center;">
                <p style="margin:0; opacity:0.8; font-size:0.9rem;">Try: x^2, sin(x), sqrt(x), 1/x, abs(x), x^3, cos(x), log(x)</p>
            </div>
        </div>
    `
};