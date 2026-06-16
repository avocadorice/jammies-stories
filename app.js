// Jammies Book Tracker - Child Reading Log & Progress Application

// Default Initial Data
const defaultBooks = [
  {
    id: "default-unicorn",
    title: "Team Unicorn",
    author: "A. Wakewood",
    totalPages: 40,
    currentPage: 15,
    cover: "assets/team_unicorn.jpg",
    status: "reading",
    startDate: "2026-06-15",
    finishDate: null,
    rating: null,
    review: null
  },
  {
    id: "default-woolly",
    title: "Woolly",
    author: "Eliza Finch",
    totalPages: 64,
    currentPage: 28,
    cover: "assets/woolly.jpg",
    status: "reading",
    startDate: "2026-06-15",
    finishDate: null,
    rating: null,
    review: null
  }
];

// App State Variables
let sonName = "";
let sonBirthday = "";
let booksList = [];

// Load State from LocalStorage
function loadState() {
  sonName = localStorage.getItem('jammies_name') || "Explorer";
  sonBirthday = localStorage.getItem('jammies_bday') || "2019-07-20";
  
  const savedBooks = localStorage.getItem('jammies_books');
  if (savedBooks) {
    booksList = JSON.parse(savedBooks);
  } else {
    booksList = [...defaultBooks];
    saveBooks();
  }
}

function saveBooks() {
  localStorage.setItem('jammies_books', JSON.stringify(booksList));
}

// Dynamic Age Calculators
function calculateAgeString(birthdayDateStr, targetDateStr = null) {
  const birthDate = new Date(birthdayDateStr);
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  
  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years < 0) return "Not born yet!";
  
  let parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (years === 0 && months === 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  
  return parts.join(", ");
}

function calculateAgeShort(birthdayDateStr, targetDateStr) {
  const birthDate = new Date(birthdayDateStr);
  const targetDate = new Date(targetDateStr);
  
  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years < 0) return "0y";
  return `${years}y ${months}m`;
}

// Cover Presets helper
function getCoverUrl(preset, customUrl) {
  const presets = {
    unicorn: "assets/team_unicorn.jpg",
    woolly: "assets/woolly.jpg",
    star: "assets/sleepy_star.jpg",
    owl: "assets/luna_owl.jpg",
    boat: "assets/paper_boat.jpg"
  };
  return preset === "custom" ? (customUrl || "assets/sleepy_star.jpg") : (presets[preset] || presets.star);
}

// Renders the views
function renderDashboard() {
  document.getElementById('display-name').textContent = `${sonName}'s Log`;
  document.getElementById('display-age').textContent = calculateAgeString(sonBirthday);
  
  // Calculate Stats
  const completed = booksList.filter(b => b.status === 'finished');
  const reading = booksList.filter(b => b.status === 'reading');
  
  const totalCompleted = completed.length;
  const totalReading = reading.length;
  
  let totalPages = 0;
  booksList.forEach(b => {
    if (b.status === 'finished') {
      totalPages += b.totalPages;
    } else {
      totalPages += b.currentPage;
    }
  });

  let avgRating = 0.0;
  if (totalCompleted > 0) {
    const sum = completed.reduce((acc, b) => acc + (b.rating || 0), 0);
    avgRating = (sum / totalCompleted).toFixed(1);
  }

  // Update UI Elements
  document.getElementById('stat-books-read').textContent = totalCompleted;
  document.getElementById('stat-books-current').textContent = totalReading;
  document.getElementById('stat-pages-read').textContent = totalPages;
  document.getElementById('stat-stars-rating').textContent = avgRating;
}

function renderCurrentlyReading() {
  const grid = document.getElementById('current-books-grid');
  grid.innerHTML = '';
  
  const readingBooks = booksList.filter(b => b.status === 'reading');
  
  if (readingBooks.length === 0) {
    grid.innerHTML = `
      <div class="empty-history" style="grid-column: 1 / -1; width: 100%;">
        <i class="fa-solid fa-book-open"></i>
        <p>No books currently reading. Click "Add New Book" to start tracking one!</p>
      </div>
    `;
    return;
  }

  readingBooks.forEach(book => {
    const progressPct = Math.round((book.currentPage / book.totalPages) * 100);
    
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <img src="${book.cover}" alt="${book.title}" class="book-card-cover">
      <div class="book-card-details">
        <h4>${book.title}</h4>
        <span class="book-author">by ${book.author || 'Unknown Author'}</span>
        
        <div class="book-progress-wrapper">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPct}%"></div>
          </div>
          <div class="progress-label">
            <span>Page ${book.currentPage} of ${book.totalPages}</span>
            <span>${progressPct}%</span>
          </div>
        </div>
        
        <div class="book-card-actions">
          <button class="card-action-btn btn-progress-update" data-id="${book.id}">
            <i class="fa-solid fa-pen"></i> Progress
          </button>
          <button class="card-action-btn btn-mark-finish" data-id="${book.id}">
            <i class="fa-solid fa-check"></i> Finish
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Attach Card Event Listeners
  grid.querySelectorAll('.btn-progress-update').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openProgressModal(e.currentTarget.getAttribute('data-id'));
    });
  });

  grid.querySelectorAll('.btn-mark-finish').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openFinishModal(e.currentTarget.getAttribute('data-id'));
    });
  });
}

function renderHistory() {
  const body = document.getElementById('history-list-body');
  body.innerHTML = '';
  
  const completedBooks = booksList
    .filter(b => b.status === 'finished')
    .sort((a, b) => new Date(b.finishDate) - new Date(a.finishDate)); // Newest finished first
    
  if (completedBooks.length === 0) {
    body.innerHTML = `
      <div class="empty-history">
        <i class="fa-solid fa-folder-open"></i>
        <p>No completed books logged yet. His history starts today!</p>
      </div>
    `;
    return;
  }

  completedBooks.forEach(book => {
    const ageAtCompletion = calculateAgeShort(sonBirthday, book.finishDate);
    
    // Draw star icons
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= (book.rating || 0)) {
        starsHtml += `<i class="fa-solid fa-star"></i>`;
      } else {
        starsHtml += `<i class="fa-regular fa-star"></i>`;
      }
    }

    const row = document.createElement('div');
    row.className = 'history-row';
    row.innerHTML = `
      <div class="history-book-info">
        <img src="${book.cover}" alt="${book.title}" class="history-book-cover">
        <div class="history-book-title-meta">
          <strong>${book.title}</strong>
          <span>by ${book.author || 'Unknown'}</span>
        </div>
      </div>
      <span>${book.totalPages} pages</span>
      <span>${formatDateString(book.finishDate)}</span>
      <span class="history-age">${ageAtCompletion}</span>
      <div class="history-rating">
        <span class="stars-display">${starsHtml}</span>
        <span class="review-quote" title="${book.review || ''}">${book.review ? `"${book.review}"` : 'No review note'}</span>
      </div>
      <button class="btn-delete-log" data-id="${book.id}" title="Delete this entry">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    body.appendChild(row);
  });

  // Attach delete buttons
  body.querySelectorAll('.btn-delete-log').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm("Are you sure you want to delete this book from his history?")) {
        booksList = booksList.filter(b => b.id !== id);
        saveBooks();
        renderAll();
      }
    });
  });
}

function renderAll() {
  renderDashboard();
  renderCurrentlyReading();
  renderHistory();
}

function formatDateString(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Modal Toggle Handlers
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Modal specific logic: ADD BOOK
function setupAddBookForm() {
  const form = document.getElementById('add-book-form');
  const coverSelect = document.getElementById('book-preset-cover');
  const customCoverGroup = document.getElementById('custom-cover-group');
  const statusSelect = document.getElementById('book-status');
  const finishedFields = document.getElementById('form-finished-fields');
  
  // Set default date completed to today
  document.getElementById('book-finish-date').value = new Date().toISOString().slice(0, 10);

  coverSelect.addEventListener('change', () => {
    if (coverSelect.value === 'custom') {
      customCoverGroup.classList.remove('hidden');
    } else {
      customCoverGroup.classList.add('hidden');
    }
  });

  statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'finished') {
      finishedFields.classList.remove('hidden');
    } else {
      finishedFields.classList.add('hidden');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const totalPages = parseInt(document.getElementById('book-pages').value);
    const preset = coverSelect.value;
    const customUrl = document.getElementById('book-custom-cover').value;
    const status = statusSelect.value;
    
    const cover = getCoverUrl(preset, customUrl);
    
    const newBook = {
      id: "book-" + Date.now(),
      title,
      author,
      totalPages,
      currentPage: status === 'finished' ? totalPages : 0,
      cover,
      status,
      startDate: new Date().toISOString().slice(0, 10),
      finishDate: status === 'finished' ? document.getElementById('book-finish-date').value : null,
      rating: status === 'finished' ? parseInt(form.querySelector('input[name="form-rating"]:checked').value) : null,
      review: status === 'finished' ? document.getElementById('book-review').value : null
    };

    booksList.push(newBook);
    saveBooks();
    renderAll();
    
    // reset & close
    form.reset();
    customCoverGroup.classList.add('hidden');
    finishedFields.classList.add('hidden');
    closeModal('add-book-modal');
  });
}

// Modal specific logic: PROGRESS UPDATE
function openProgressModal(bookId) {
  const book = booksList.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('progress-book-id').value = book.id;
  document.getElementById('progress-book-title').textContent = book.title;
  document.getElementById('progress-max-pages').textContent = book.totalPages;
  
  const pageInput = document.getElementById('progress-page-input');
  const slider = document.getElementById('progress-page-slider');
  
  pageInput.value = book.currentPage;
  pageInput.max = book.totalPages;
  
  slider.max = book.totalPages;
  slider.value = book.currentPage;
  
  // Link slider and input
  pageInput.addEventListener('input', () => {
    let val = parseInt(pageInput.value) || 0;
    if (val > book.totalPages) val = book.totalPages;
    slider.value = val;
  });
  
  slider.addEventListener('input', () => {
    pageInput.value = slider.value;
  });

  openModal('progress-modal');
}

// Progress Form submission
document.getElementById('progress-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('progress-book-id').value;
  const newPage = parseInt(document.getElementById('progress-page-input').value) || 0;
  
  const book = booksList.find(b => b.id === id);
  if (book) {
    book.currentPage = Math.min(newPage, book.totalPages);
    if (book.currentPage === book.totalPages) {
      // Trigger completion modal!
      closeModal('progress-modal');
      openFinishModal(id);
    } else {
      saveBooks();
      renderAll();
      closeModal('progress-modal');
    }
  }
});

// Modal specific logic: FINISH REVIEW
function openFinishModal(bookId) {
  const book = booksList.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('finish-book-id').value = book.id;
  document.getElementById('finish-book-title').textContent = book.title;
  document.getElementById('finish-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('finish-review').value = '';

  openModal('finish-modal');
}

// Finish Review submission
document.getElementById('finish-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('finish-book-id').value;
  const finishDate = document.getElementById('finish-date').value;
  const review = document.getElementById('finish-review').value;
  
  const ratingInput = document.querySelector('input[name="finish-rating"]:checked');
  const rating = ratingInput ? parseInt(ratingInput.value) : 3;

  const book = booksList.find(b => b.id === id);
  if (book) {
    book.status = 'finished';
    book.currentPage = book.totalPages;
    book.finishDate = finishDate;
    book.rating = rating;
    book.review = review;
    
    saveBooks();
    renderAll();
    closeModal('finish-modal');
  }
});

// Profile / Settings Logic
function setupProfileSettings() {
  const form = document.getElementById('profile-form');
  const nameInput = document.getElementById('profile-name');
  const bdayInput = document.getElementById('profile-birthday');

  document.getElementById('btn-edit-profile').addEventListener('click', () => {
    nameInput.value = sonName;
    bdayInput.value = sonBirthday;
    openModal('profile-modal');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sonName = nameInput.value;
    sonBirthday = bdayInput.value;
    
    localStorage.setItem('jammies_name', sonName);
    localStorage.setItem('jammies_bday', sonBirthday);
    
    renderAll();
    closeModal('profile-modal');
  });
}

// Backup & Recovery Handlers
function setupBackupAndRestore() {
  document.getElementById('btn-export-log').addEventListener('click', () => {
    const data = {
      name: sonName,
      birthday: sonBirthday,
      books: booksList
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jammies_reading_tracker_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const importBtn = document.getElementById('btn-import-trigger');
  const fileInput = document.getElementById('file-import');

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.name) {
          sonName = data.name;
          localStorage.setItem('jammies_name', sonName);
        }
        if (data.birthday) {
          sonBirthday = data.birthday;
          localStorage.setItem('jammies_bday', sonBirthday);
        }
        if (Array.isArray(data.books)) {
          booksList = data.books;
          saveBooks();
        }
        renderAll();
        alert("Success! Reading log successfully restored.");
      } catch(err) {
        alert("Error: Invalid JSON backup file structure.");
      }
    };
    reader.readAsText(file);
  });
}

// Web Audio API Synthesizer controls
class BedtimeAudio {
  constructor() {
    this.ctx = null;
    this.lullabyInterval = null;
    this.currentSource = null;
    this.rainNode = null;
    this.cricketInterval = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stopAll() {
    this.isPlaying = false;
    if (this.lullabyInterval) {
      clearInterval(this.lullabyInterval);
      this.lullabyInterval = null;
    }
    if (this.cricketInterval) {
      clearInterval(this.cricketInterval);
      this.cricketInterval = null;
    }
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch(e){}
      this.currentSource = null;
    }
    if (this.rainNode) {
      try { this.rainNode.stop(); } catch(e){}
      this.rainNode = null;
    }
  }
  
  playRain() {
    this.init();
    this.stopAll();
    this.isPlaying = true;
    
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.12;
    
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.04;
    
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    lfo.start();
    whiteNoise.start();
    
    this.rainNode = whiteNoise;
    this.currentSource = lfo;
  }

  playCrickets() {
    this.init();
    this.stopAll();
    this.isPlaying = true;
    
    const playChirpGroup = () => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;
      let startTime = now;
      
      for (let j = 0; j < 3; j++) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 3900 + Math.random() * 100;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.03, startTime + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.07);
        startTime += 0.11;
      }
    };
    
    playChirpGroup();
    this.cricketInterval = setInterval(playChirpGroup, 2400);
  }

  playLullaby() {
    this.init();
    this.stopAll();
    this.isPlaying = true;
    
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
    
    let step = 0;
    const melody = [
      [5, 7, 9, 8],
      [4, 6, 7, 5],
      [2, 4, 5, 3],
      [3, 5, 7, 6]
    ];
    
    const playNote = () => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;
      const phrase = melody[Math.floor(step / 4) % melody.length];
      const noteIdx = phrase[step % 4];
      const freq = notes[noteIdx];
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const feedback = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      delay.delayTime.value = 0.45;
      feedback.gain.value = 0.35;
      
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      
      osc.connect(filter);
      filter.connect(gainNode);
      
      gainNode.connect(this.ctx.destination);
      gainNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 1.8);
      
      step++;
    };
    
    playNote();
    this.lullabyInterval = setInterval(playNote, 1500);
  }
}

const audioController = new BedtimeAudio();

// Canvas Starfield Background Animation
const canvas = document.getElementById('starfield-canvas');
const ctx = canvas.getContext('2d');
let stars = [];

function initStars() {
  stars = [];
  const count = Math.floor((canvas.width * canvas.height) / 7500);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      alpha: Math.random(),
      twinkleSpeed: 0.004 + Math.random() * 0.012,
      twinkleDir: Math.random() > 0.5 ? 1 : -1
    });
  }
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 10,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
  );
  grad.addColorStop(0, '#0c0f24');
  grad.addColorStop(1, '#070913');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let star of stars) {
    star.alpha += star.twinkleSpeed * star.twinkleDir;
    if (star.alpha >= 1) {
      star.alpha = 1;
      star.twinkleDir = -1;
    } else if (star.alpha <= 0.1) {
      star.alpha = 0.1;
      star.twinkleDir = 1;
    }
    
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  requestAnimationFrame(animateStars);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Load State
  loadState();
  
  // Render Everything
  renderAll();
  
  // Canvas Setup
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateStars();

  // Setup Form logic
  setupAddBookForm();
  
  // Settings profile setup
  setupProfileSettings();
  
  // Setup backup & restore
  setupBackupAndRestore();

  // Add Book Modal triggers
  document.getElementById('btn-add-book').addEventListener('click', () => openModal('add-book-modal'));
  
  // Close Modals buttons
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      closeModal(e.currentTarget.getAttribute('data-modal'));
    });
  });

  // Soundscape togglers
  const soundSelect = document.getElementById('ambient-sound-select');
  const soundToggle = document.getElementById('btn-ambient-toggle');
  
  const handleSoundChange = () => {
    const val = soundSelect.value;
    if (val === 'none') {
      audioController.stopAll();
      soundToggle.classList.remove('playing');
      soundToggle.querySelector('span').textContent = 'Silence';
    } else {
      soundToggle.classList.add('playing');
      if (val === 'lullaby') {
        audioController.playLullaby();
        soundToggle.querySelector('span').textContent = 'Lullaby: On';
      } else if (val === 'rain') {
        audioController.playRain();
        soundToggle.querySelector('span').textContent = 'Rain: On';
      } else if (val === 'crickets') {
        audioController.playCrickets();
        soundToggle.querySelector('span').textContent = 'Crickets: On';
      }
    }
  };

  soundSelect.addEventListener('change', handleSoundChange);
  
  soundToggle.addEventListener('click', () => {
    if (audioController.isPlaying) {
      audioController.stopAll();
      soundToggle.classList.remove('playing');
      soundToggle.querySelector('span').textContent = `${soundSelect.options[soundSelect.selectedIndex].text}: Off`;
    } else {
      handleSoundChange();
    }
  });
});
