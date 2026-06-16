// Jammies Stories - Interactive Bedtime Story Reader App Logic

// Curated Bedtime Stories Dataset
const stories = [
  {
    id: "sleepy-star",
    title: "The Sleepy Star's Journey",
    subtitle: "Resting is the key to shining bright",
    description: "Follow Pip, a tiny star who forgot how to shine, on a cozy journey across the night sky to find his glow.",
    duration: "4 mins",
    difficulty: "Easy",
    cover: "assets/sleepy_star.jpg",
    pages: [
      "Once upon a midnight sky, there lived a tiny star named Pip. Pip was smaller than the other stars, but he loved to sparkle. Every evening, he would bounce from cloud to cloud, giggling and blinking his silver light. But tonight, Pip felt different. He was tired, and his glow was fading into a faint, warm amber.",
      "Pip tried to squeeze his eyes shut and puff out his chest. 'Sparkle! Sparkle!' he whispered, but only a tiny flicker came out. Fearing he would be forgotten, Pip decided to visit the wise Moon. The Moon sat on a soft velvet cushion of dark blue, looking down at the earth below with a calm, silver gaze.",
      "'Dear Moon,' Pip whispered, 'I have lost my sparkle. Can you help me find it?' The Moon smiled, a warm and golden curve. 'Ah, little Pip. You have not lost your sparkle. You have simply run out of night-breath. You must learn the art of resting. To shine bright, one must also sleep.'",
      "The Moon gently blew a cloud-blanket over Pip. 'Close your eyes, little star,' the Moon whispered. 'Breathe in the quiet space, and breathe out the busy day.' Pip tucked his points in, pulled the soft, cool mist over his shoulders, and listened to the quiet, rhythmic hum of the night sky.",
      "As Pip drifted into a deep, peaceful sleep, a beautiful thing happened. With every slow, calm breath he took, his light began to pulse. First, a soft blue, then a warm lavender, and finally, a brilliant, shining silver. Pip was resting, and in his rest, his glow was fully restored, ready for a brand new night."
    ]
  },
  {
    id: "luna-owl",
    title: "Luna and the Whispering Forest",
    subtitle: "Listening to the quiet sounds of the night",
    description: "Luna the owl wants to find her way home by listening to the gentle forest breeze and the music of the trees.",
    duration: "5 mins",
    difficulty: "Medium",
    cover: "assets/luna_owl.jpg",
    pages: [
      "In the heart of the Whispering Forest, a young owl named Luna sat on a mossy oak branch. While other owls loved to hoot loudly, Luna preferred to listen. Tonight, the forest was alive with soft, magical sounds. Leaves rustled like silk, and distant streams played a gentle, flowing lullaby.",
      "Luna wanted to fly to the Great Pine, where her family was gathered. But the forest was misty, and the trails looked different in the fog. 'Listen to the forest,' her mother had always said. 'The wind knows the way.' Luna closed her eyes and tilted her head, letting the sounds guide her.",
      "First, she heard a soft *whoosh* to her left. That was the wind rushing through the Willow Valley. Next, she heard a gentle *plip-plop* straight ahead. That was the dew dripping off the fern leaves near the stream. By mapping the sounds, Luna felt the forest mapping itself in her mind.",
      "She spread her wings and flew, light as a feather. She did not fly fast; she drifted, letting the warm air carry her. She followed the scent of pine and the soft, rhythmic rustle of the ancient trees. With every beat of her wings, the mist seemed to part, guided by the music of the night.",
      "Soon, she saw the warm, welcoming glow of the Great Pine. Her family was there, waiting with cozy nests and soft smiles. Luna landed gently on the branch. She had found her way home not by seeing, but by listening. The Whispering Forest was now quiet, and Luna fell asleep, safe in her mother's wings."
    ]
  },
  {
    id: "paper-boat",
    title: "Barnaby's Sleepy Stream",
    subtitle: "A peaceful drift down a quiet river",
    description: "Follow Barnaby, the tiny paper boat, as he sails through glowing lily pads and cozy fireflies under the crescent moon.",
    duration: "4 mins",
    difficulty: "Easy",
    cover: "assets/paper_boat.jpg",
    pages: [
      "Barnaby was a tiny paper boat folded from a sheet of clean white paper. He lived at the edge of a sleepy, slow-moving stream. Tonight, the water was as smooth as dark glass, reflecting the stars above like a long, winding mirror. It was time for Barnaby's nightly cruise.",
      "He pushed off from the muddy bank and drifted into the gentle current. He didn't have a sail or an engine; he simply went where the river took him. A friendly green frog sitting on a lily pad waved a webbed hand. 'Slow down, Barnaby,' the frog croaked softly. 'The river is sleepiest tonight.'",
      "As Barnaby drifted further, the air filled with little golden lights. Fireflies! They danced in circles around Barnaby's mast, lighting up the dark water. The stream whispered a soft *swish-swoosh* as it brushed against the smooth river stones. Barnaby felt warm and safe, rock-rocking on the water.",
      "He passed under a canopy of weeping willows. Their long, leafy branches dipped into the water, creating gentle ripples that pushed Barnaby in soft circles. A family of ducks floated nearby, their heads tucked beneath their wings, fast asleep on the water's surface.",
      "Finally, the stream pooled into a wide, quiet pond covered in sleeping water lilies. Barnaby came to a gentle stop against a soft, velvet-green moss bank. The water held him cradled, rocking him to sleep. Under the watchful crescent moon, the little paper boat closed his eyes and drifted into sweet dreams."
    ]
  }
];

// App State
let activeStoryIndex = null;
let currentPageIndex = 0;
let starCount = parseInt(localStorage.getItem('jammies_stars') || '0');
let textSizeClass = 'text-medium';

// Web Speech API / TTS Variables
let synth = window.speechSynthesis;
let voices = [];
let ttsActive = false;
let currentUtterance = null;

// Bedtime Audio Synthesizer (Web Audio API)
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
  
  // Rain Synthesizer (White Noise + Lowpass Filter + Amplitude LFO)
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
    
    // Ambient wind/gust volume modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // 6-7 second wave cycle
    
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

  // Crickets Synthesizer (short pulses of high frequency sines)
  playCrickets() {
    this.init();
    this.stopAll();
    this.isPlaying = true;
    
    const playChirpGroup = () => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;
      let startTime = now;
      
      // 3 tiny chirps per group
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

  // Lullaby Synthesizer (bell-like/musicbox tones in Pentatonic scale)
  playLullaby() {
    this.init();
    this.stopAll();
    this.isPlaying = true;
    
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // C4 to A5 Pentatonic
    
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
  
  // Custom deep night background gradient
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

// Speech Synthesis (TTS) Implementation
function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices().filter(voice => voice.lang.startsWith('en'));
  const voiceSelect = document.getElementById('tts-voice-select');
  if (!voiceSelect) return;
  
  voiceSelect.innerHTML = '';
  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    // Select default comfortable/soft reading voices if found
    if (voice.name.includes('Samantha') || voice.name.includes('Google US English') || voice.name.includes('Natural') || voice.name.includes('Daniel')) {
      option.selected = true;
    }
    voiceSelect.appendChild(option);
  });
}

if (synth) {
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  loadVoices();
}

function speakCurrentPage() {
  if (!synth || !ttsActive || activeStoryIndex === null) return;
  
  synth.cancel(); // Terminate existing narration
  
  const text = stories[activeStoryIndex].pages[currentPageIndex];
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  const voiceSelect = document.getElementById('tts-voice-select');
  if (voiceSelect && voices[voiceSelect.value]) {
    currentUtterance.voice = voices[voiceSelect.value];
  }
  
  const speed = parseFloat(document.getElementById('tts-speed').value);
  currentUtterance.rate = speed;
  currentUtterance.pitch = 1.0; 
  
  currentUtterance.onend = () => {
    // End event hook if needed
  };
  
  synth.speak(currentUtterance);
}

function stopSpeaking() {
  if (synth) {
    synth.cancel();
  }
}

// App Logic & Views rendering
function updateStarUI() {
  document.getElementById('star-count').textContent = starCount;
}

function renderCatalog() {
  const grid = document.getElementById('stories-grid');
  grid.innerHTML = '';
  
  stories.forEach((story, index) => {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.innerHTML = `
      <div class="card-img-container">
        <img src="${story.cover}" alt="${story.title}">
        <span class="card-badge"><i class="fa-solid fa-moon"></i> Bedtime</span>
      </div>
      <div class="card-content">
        <span class="card-subtitle">${story.subtitle}</span>
        <h4>${story.title}</h4>
        <p class="card-desc">${story.description}</p>
        <div class="card-meta">
          <span><i class="fa-regular fa-clock"></i> ${story.duration}</span>
          <span><i class="fa-solid fa-child"></i> ${story.difficulty}</span>
        </div>
        <button class="btn-read" data-index="${index}">
          <i class="fa-solid fa-book-open"></i> Read Story
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Attach card readers
  grid.querySelectorAll('.btn-read').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'));
      openStory(idx);
    });
  });
}

function openStory(index) {
  activeStoryIndex = index;
  currentPageIndex = 0;
  
  // Show Reader Room, Hide Catalog/Hero
  document.getElementById('catalog-section').classList.add('hidden');
  document.getElementById('hero-section').classList.add('hidden');
  document.getElementById('reader-section').classList.remove('hidden');
  
  // Render Story Contents
  const story = stories[index];
  document.getElementById('story-title').textContent = story.title;
  document.getElementById('story-illustration').src = story.cover;
  document.getElementById('total-pages-num').textContent = story.pages.length;
  
  updatePageContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeStory() {
  activeStoryIndex = null;
  stopSpeaking();
  ttsActive = false;
  document.getElementById('btn-tts-toggle').classList.remove('active');
  document.getElementById('tts-settings-dropdown').classList.add('hidden');
  
  document.getElementById('reader-section').classList.add('hidden');
  document.getElementById('catalog-section').classList.remove('hidden');
  document.getElementById('hero-section').classList.remove('hidden');
}

function updatePageContent() {
  if (activeStoryIndex === null) return;
  const story = stories[activeStoryIndex];
  
  // Setup elements
  const pageContainer = document.getElementById('story-page-content');
  pageContainer.textContent = story.pages[currentPageIndex];
  pageContainer.className = `story-page-content ${textSizeClass}`;
  
  document.getElementById('current-page-num').textContent = currentPageIndex + 1;
  
  // Button States
  document.getElementById('btn-prev-page').disabled = (currentPageIndex === 0);
  
  const nextBtn = document.getElementById('btn-next-page');
  if (currentPageIndex === story.pages.length - 1) {
    nextBtn.innerHTML = `Finish <i class="fa-solid fa-circle-check"></i>`;
  } else {
    nextBtn.innerHTML = `Next <i class="fa-solid fa-chevron-right"></i>`;
  }
  
  // Narration
  if (ttsActive) {
    speakCurrentPage();
  }
}

function handleNextPage() {
  if (activeStoryIndex === null) return;
  const story = stories[activeStoryIndex];
  
  if (currentPageIndex < story.pages.length - 1) {
    currentPageIndex++;
    updatePageContent();
  } else {
    // Completed the story!
    triggerCompletion();
  }
}

function handlePrevPage() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    updatePageContent();
  }
}

function triggerCompletion() {
  stopSpeaking();
  // Award star
  starCount++;
  localStorage.setItem('jammies_stars', starCount.toString());
  updateStarUI();
  
  // Trigger particle burst and show modal
  document.getElementById('star-modal').classList.remove('hidden');
}

// UI Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
  // Initialize star count
  updateStarUI();
  
  // Render stories grid
  renderCatalog();
  
  // Canvas Setup
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateStars();
  
  // Catalog Back Button
  document.getElementById('btn-back-to-catalog').addEventListener('click', closeStory);
  
  // Navigation Buttons
  document.getElementById('btn-prev-page').addEventListener('click', handlePrevPage);
  document.getElementById('btn-next-page').addEventListener('click', handleNextPage);
  
  // Modal Dismissal
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('star-modal').classList.add('hidden');
    closeStory();
  });
  
  // Text Size Adjustment
  document.getElementById('btn-decrease-text').addEventListener('click', () => {
    if (textSizeClass === 'text-large') {
      textSizeClass = 'text-medium';
    } else if (textSizeClass === 'text-medium') {
      textSizeClass = 'text-normal';
    }
    updatePageContent();
  });
  
  document.getElementById('btn-increase-text').addEventListener('click', () => {
    if (textSizeClass === 'text-normal') {
      textSizeClass = 'text-medium';
    } else if (textSizeClass === 'text-medium') {
      textSizeClass = 'text-large';
    }
    updatePageContent();
  });
  
  // TTS Narration Toggle
  const ttsBtn = document.getElementById('btn-tts-toggle');
  const ttsDropdown = document.getElementById('tts-settings-dropdown');
  
  ttsBtn.addEventListener('click', () => {
    ttsActive = !ttsActive;
    if (ttsActive) {
      ttsBtn.classList.add('active');
      ttsDropdown.classList.remove('hidden');
      speakCurrentPage();
    } else {
      ttsBtn.classList.remove('active');
      ttsDropdown.classList.add('hidden');
      stopSpeaking();
    }
  });

  // Soundscape selector toggle and play
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
