  /* ---------- Sound: each theme has its own completion sound, synthesised (no audio files) ---------- */
  let ac = null;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch { return null; } }
  function tone(c, { f, f2, type = 'sine', t = 0, d = .4, g = .15 }) {
    const o = c.createOscillator(), v = c.createGain(), at = c.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + d);
    v.gain.setValueAtTime(.0001, at); v.gain.exponentialRampToValueAtTime(g, at + .008); v.gain.exponentialRampToValueAtTime(.0001, at + d);
    o.connect(v).connect(c.destination); o.start(at); o.stop(at + d + .05);
  }
  function hiss(c, { t = 0, d = .06, g = .2, hp = 1200, lp = 9000 }) {
    const n = Math.round(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), data = b.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), h = c.createBiquadFilter(), l = c.createBiquadFilter(), v = c.createGain(), at = c.currentTime + t;
    s.buffer = b; h.type = 'highpass'; h.frequency.value = hp; l.type = 'lowpass'; l.frequency.value = lp; v.gain.value = g;
    s.connect(h).connect(l).connect(v).connect(c.destination); s.start(at);
  }
  const SOUNDS = {
    glass: c => { tone(c, { f: 1568, d: .9, g: .1 }); tone(c, { f: 2349, t: .05, d: .7, g: .06 }); tone(c, { f: 3136, t: .11, d: .5, g: .035 }); },
    wood: c => { tone(c, { f: 520, f2: 300, d: .18, g: .2, type: 'triangle' }); hiss(c, { d: .04, g: .07, hp: 300, lp: 2200 }); tone(c, { f: 784, t: .12, d: .45, g: .04 }); },
    shutter: c => { hiss(c, { d: .025, g: .28, hp: 2600 }); hiss(c, { t: .075, d: .045, g: .2, hp: 1400 }); tone(c, { f: 150, f2: 90, t: .075, d: .12, g: .06, type: 'square' }); },
    chip: c => { [523, 659, 784, 1047].forEach((f, i) => tone(c, { f, type: 'square', t: i * .055, d: .09, g: .045 })); },
    soft: c => { tone(c, { f: 880, f2: 1320, d: .18, g: .07 }); tone(c, { f: 1760, t: .06, d: .3, g: .025 }); },
    paper: c => { hiss(c, { d: .09, g: .14, hp: 900, lp: 5200 }); hiss(c, { t: .07, d: .12, g: .09, hp: 1400, lp: 6000 }); },
    night: c => { tone(c, { f: 1568, d: .7, g: .05 }); tone(c, { f: 2349, t: .09, d: .8, g: .035 }); tone(c, { f: 3136, t: .2, d: .6, g: .02 }); },
    click: c => { hiss(c, { d: .012, g: .22, hp: 3200 }); tone(c, { f: 2400, d: .035, g: .04, type: 'square' }); hiss(c, { t: .06, d: .01, g: .12, hp: 4000 }); },
    drip: c => { tone(c, { f: 380, f2: 1150, d: .12, g: .11 }); tone(c, { f: 900, f2: 1500, t: .07, d: .16, g: .035 }); },
    punch: c => { hiss(c, { d: .02, g: .2, hp: 1800, lp: 7000 }); tone(c, { f: 180, f2: 110, d: .06, g: .06, type: 'triangle' }); },
    press: c => { tone(c, { f: 130, f2: 70, d: .14, g: .14, type: 'triangle' }); hiss(c, { t: .01, d: .06, g: .1, hp: 600, lp: 3000 }); hiss(c, { t: .1, d: .08, g: .05, hp: 2000 }); },
    chime: c => { tone(c, { f: 660, d: 1.3, g: .075 }); tone(c, { f: 990, t: .02, d: 1.1, g: .045 }); tone(c, { f: 1485, t: .04, d: .8, g: .02 }); }
  };
  // No sound on finishing a task, in any theme (the user asked for quiet effects); the tones stay unused.
  const soundOn = () => false;
  function playSound(id) { if (!soundOn()) return; const c = audio(); if (!c) return; try { (SOUNDS[id] || SOUNDS.soft)(c); } catch { /* optional */ } }
  const themeSound = () => THEMES[activeTheme()]?.sound || 'soft';

