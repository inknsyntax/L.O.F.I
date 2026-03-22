// --- STAGE MANAGEMENT --- //
/* 
   Initialize the application state.
   Uses a safe parsing strategy to prevent crashes if localStorage data is corrupted.
*/
const safeParse = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn(`Error parsing ${key} from localStorage, using fallback.`, e);
        return fallback;
    }
};

window.AppState = {
    category: 'study',
    module: 'subjects',
    sounds: {}, // Will hold Audio objects
    notes: safeParse('lofi_notes_db', {}),
    flashcards: safeParse('lofi_flashcards_db', []),
    studyQueue: [],
    studyIndex: 0,
    tasks: safeParse('lofi_tasks_db', []),
    currentNote: null,
    currentDeck: null,
    theme: localStorage.getItem('lofi_theme') || 'theme-beige',
    calcMode: 'classic',
    timer: { 
        interval: null, 
        currentDuration: 25 * 60,
        timeLeft: 25 * 60, 
        isRunning: false,
        mode: 'focus' // focus,  short-break, long-break
    },
    stopwatch: {
        interval: null,
        startTime: 0,
        elapsedTime: 0,
        isRunning: false,
        laps: []
    }
};