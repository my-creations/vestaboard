const BOARD_COLUMNS = 22;
const BOARD_ROWS = 6;
const TIMEZONE = 'Europe/Lisbon';

const boardElement = document.querySelector('#board');
const statusText = document.querySelector('#status-text');

const boardCells = [];
let boardState = Array.from({ length: BOARD_ROWS }, () => ' '.repeat(BOARD_COLUMNS));
let audioContext = null;
let masterGain = null;
let soundEnabled = false;

function sanitizeCharacter(char) {
  const allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?+-/'&";
  const upper = char.toUpperCase();
  return allowed.includes(upper) ? upper : ' ';
}

function fitLine(line) {
  const clean = Array.from(line.toUpperCase(), sanitizeCharacter).join('');
  return clean.padEnd(BOARD_COLUMNS, ' ').slice(0, BOARD_COLUMNS);
}

function centerLine(line) {
  const trimmed = fitLine(line).trim();
  const padding = Math.max(0, Math.floor((BOARD_COLUMNS - trimmed.length) / 2));
  return `${' '.repeat(padding)}${trimmed}`.padEnd(BOARD_COLUMNS, ' ').slice(0, BOARD_COLUMNS);
}

function createBoard() {
  for (let index = 0; index < BOARD_COLUMNS * BOARD_ROWS; index += 1) {
    const cell = document.createElement('div');
    const letter = document.createElement('span');
    cell.className = 'flap';
    letter.textContent = ' ';
    cell.appendChild(letter);
    boardElement.appendChild(cell);
    boardCells.push({ cell, letter, timeoutId: null });
  }
}

function setBoard(lines, animate = true) {
  const normalizedLines = lines.map(fitLine);
  const nextState = normalizedLines.slice(0, BOARD_ROWS);
  while (nextState.length < BOARD_ROWS) nextState.push(' '.repeat(BOARD_COLUMNS));

  let changedCount = 0;

  nextState.forEach((line, rowIndex) => {
    const previousLine = boardState[rowIndex] || ' '.repeat(BOARD_COLUMNS);

    for (let columnIndex = 0; columnIndex < BOARD_COLUMNS; columnIndex += 1) {
      const char = line[columnIndex];
      if (previousLine[columnIndex] === char) continue;

      const cellIndex = rowIndex * BOARD_COLUMNS + columnIndex;
      const entry = boardCells[cellIndex];
      changedCount += 1;
      entry.letter.textContent = char;

      if (animate) {
        entry.cell.classList.remove('is-flipping');
        void entry.cell.offsetWidth;
        entry.cell.classList.add('is-flipping');

        window.clearTimeout(entry.timeoutId);
        entry.timeoutId = window.setTimeout(() => {
          entry.cell.classList.remove('is-flipping');
        }, 240);
      }
    }
  });

  boardState = nextState;

  if (animate && changedCount > 0) {
    playMechanicalFlutter(changedCount);
  }
}

function getLisbonParts() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date()).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    weekday: parts.weekday.toUpperCase(),
    day: parts.day,
    month: parts.month.toUpperCase(),
    year: parts.year,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

function buildClockLines() {
  const lisbon = getLisbonParts();
  return [
    fitLine(' '),
    centerLine('LISBON'),
    centerLine(lisbon.time),
    centerLine(`${lisbon.weekday} ${lisbon.day} ${lisbon.month} ${lisbon.year}`),
    centerLine('EUROPE/LISBON'),
    fitLine(' '),
  ];
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.32;
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function createNoiseBuffer(context, duration = 0.03) {
  const frameCount = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    const decay = 1 - index / frameCount;
    channel[index] = (Math.random() * 2 - 1) * decay;
  }

  return buffer;
}

function scheduleTypewriterClick(context, when, intensity) {
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context, 0.026);

  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 1800;

  const bandpass = context.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2600 + Math.random() * 700;
  bandpass.Q.value = 1.2;

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, when);
  noiseGain.gain.exponentialRampToValueAtTime(0.028 * intensity, when + 0.0018);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.018);

  noise.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(masterGain);

  noise.start(when);
  noise.stop(when + 0.03);

  const click = context.createOscillator();
  const clickGain = context.createGain();
  click.type = 'square';
  click.frequency.setValueAtTime(1900 + Math.random() * 900, when);
  click.frequency.exponentialRampToValueAtTime(980 + Math.random() * 240, when + 0.014);
  clickGain.gain.setValueAtTime(0.0001, when);
  clickGain.gain.exponentialRampToValueAtTime(0.018 * intensity, when + 0.001);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.012);
  click.connect(clickGain);
  clickGain.connect(masterGain);
  click.start(when);
  click.stop(when + 0.016);

  const body = context.createOscillator();
  const bodyGain = context.createGain();
  body.type = 'triangle';
  body.frequency.setValueAtTime(540 + Math.random() * 120, when);
  body.frequency.exponentialRampToValueAtTime(320 + Math.random() * 70, when + 0.02);
  bodyGain.gain.setValueAtTime(0.0001, when);
  bodyGain.gain.exponentialRampToValueAtTime(0.008 * intensity, when + 0.002);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.022);
  body.connect(bodyGain);
  bodyGain.connect(masterGain);
  body.start(when);
  body.stop(when + 0.028);
}

function playMechanicalFlutter(changedCount) {
  if (!soundEnabled) return;

  const context = ensureAudio();
  if (!context || !masterGain) return;

  const burstLength = Math.max(4, Math.min(14, changedCount * 2));
  const start = context.currentTime + 0.008;

  for (let index = 0; index < burstLength; index += 1) {
    const stride = 0.008 + Math.random() * 0.005;
    const when = start + index * stride;
    const intensity = 0.8 + Math.random() * 0.35;
    scheduleTypewriterClick(context, when, intensity);
  }
}

function renderSoundState(message) {
  statusText.textContent = message ?? `${TIMEZONE} · sound ${soundEnabled ? 'on' : 'off'}`;
  statusText.setAttribute('aria-pressed', String(soundEnabled));
}

async function toggleSound() {
  if (!soundEnabled) {
    const context = ensureAudio();
    if (!context) {
      renderSoundState(`${TIMEZONE} · audio unavailable`);
      return;
    }

    soundEnabled = true;
    renderSoundState(`${TIMEZONE} · sound on`);
    playMechanicalFlutter(3);
    return;
  }

  soundEnabled = false;
  renderSoundState(`${TIMEZONE} · sound off`);
}

function updateClock() {
  setBoard(buildClockLines(), true);
  renderSoundState();
}

statusText.addEventListener('click', toggleSound);
statusText.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleSound();
  }
});

createBoard();
setBoard(buildClockLines(), false);
renderSoundState();
updateClock();
window.setInterval(updateClock, 1000);
