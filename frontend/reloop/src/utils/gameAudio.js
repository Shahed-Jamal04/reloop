const audioContext = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

const playTone = (frequency, duration = 0.11, type = 'sine', volume = 0.25) => {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

export const playSuccessSound = () => playTone(880, 0.12, 'triangle', 0.18);
export const playFailSound = () => playTone(220, 0.16, 'square', 0.2);
export const playActionSound = () => playTone(520, 0.08, 'sine', 0.18);
export const playWinSound = () => {
  playTone(880, 0.12, 'triangle', 0.18);
  setTimeout(() => playTone(1046, 0.1, 'triangle', 0.18), 120);
};
export const playLoseSound = () => {
  playTone(220, 0.15, 'square', 0.2);
  setTimeout(() => playTone(176, 0.1, 'square', 0.15), 140);
};
