/** Audio-clock-driven lip sync. No network, TTS dependency or Rive SDK coupling.
 * Inject setMouth(value): the host writes its bound view model's `mouth` number.
 * `cues` come from the FINAL audio, in seconds, not from text length.
 */
export function validateCues(cues, duration = Infinity) {
  if (!Array.isArray(cues)) throw new TypeError('cues must be an array');
  if (!(duration > 0)) throw new RangeError('duration must be positive');
  let end = 0;
  return cues.map(cue => {
    if (!cue || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) ||
        cue.start < end || cue.end <= cue.start || cue.end > duration ||
        !Number.isInteger(cue.mouth) || cue.mouth < 1 || cue.mouth > 7) {
      throw new RangeError('Invalid, overlapping or out-of-range mouth cue');
    }
    end = cue.end;
    return Object.freeze({start: cue.start, end: cue.end, mouth: cue.mouth});
  });
}

export function mouthAt(cues, time) {
  let lo = 0, hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (time < cue.start) hi = mid - 1;
    else if (time >= cue.end) lo = mid + 1;
    else return cue.mouth;
  }
  return 1; // closed lips during silent gaps
}

export function attachLipSync(audio, setMouth, inputCues, options = {}) {
  const cues = validateCues(inputCues, options.duration ?? Infinity);
  const requestFrame = options.requestFrame ?? globalThis.requestAnimationFrame.bind(globalThis);
  const cancelFrame = options.cancelFrame ?? globalThis.cancelAnimationFrame.bind(globalThis);
  let enabled = options.enabled !== false;
  let disposed = false, waiting = false, scheduled = null, last = null;
  const write = value => {
    if (value !== last) { last = value; setMouth(value); }
  };
  const cancelFrameIfNeeded = () => {
    if (scheduled !== null) cancelFrame(scheduled);
    scheduled = null;
  };
  const update = () => {
    if (disposed) return;
    if (!enabled || audio.paused || audio.ended || audio.error) write(0);
    else if (waiting || audio.seeking) write(1);
    else write(mouthAt(cues, audio.currentTime));
  };
  const tick = () => {
    scheduled = null;
    if (disposed) return;
    update();
    if (enabled && !audio.paused && !audio.ended && !audio.error && !waiting) {
      scheduled = requestFrame(tick);
    }
  };
  const refresh = () => { cancelFrameIfNeeded(); tick(); };
  const onPlaying = () => { waiting = false; refresh(); };
  const onWaiting = () => { waiting = true; refresh(); };
  const onSeeked = () => { waiting = false; refresh(); };
  const onReset = () => { waiting = false; cancelFrameIfNeeded(); write(0); };
  const handlers = {
    play: onPlaying, playing: onPlaying, waiting: onWaiting,
    seeking: refresh, seeked: onSeeked, timeupdate: update, ratechange: refresh,
    pause: onReset, ended: onReset, error: onReset, emptied: onReset,
  };
  for (const [event, fn] of Object.entries(handlers)) audio.addEventListener(event, fn);
  refresh();
  return {
    setEnabled(value) { if (!disposed) { enabled = Boolean(value); refresh(); } },
    stop() {
      if (disposed) return;
      audio.pause();
      cancelFrameIfNeeded();
      write(0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelFrameIfNeeded();
      for (const [event, fn] of Object.entries(handlers)) audio.removeEventListener(event, fn);
      audio.pause();
      write(0);
    },
  };
}
