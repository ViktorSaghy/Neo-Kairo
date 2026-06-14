import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SIGN_MSGS, ENEMY_ENTRANCE, getEnemyEntrance, ENEMY_DEATH, getEnemyDeath, FREE_TERMINAL_LORE, pickFreeTerminalLore, FACTION_ENTRY_LINES, getFactionEntry, AMBIENT_EVENTS, CHUNK_ATMOSPHERE, getChunkAtmosphere } from './data/world.js';
import { VENDOR_DESC, shopInventory, weaponStock, armorStock, lootTable, jobPool } from './data/items.js';
import { NPC_POOL_BY_CHUNK, NPCS, getNPCForBackstory, NARRATIVE_EVENTS, pickNarrativeEvent, resetNarrativeEvents, THRESHOLD_SCENES, JOB_GIVER_NAMES, getJobGiverName, NAME_PREFIXES, NAME_SUFFIXES, NAME_HANDLES, generateHandle } from './data/npcs.js';
import { SIDEQUESTS, RUN_QUESTS, resetQuests } from './data/quests.js';
import { ARCHETYPE_EXPLORE_ABILITIES, WORLD_ENEMIES, WORLD_AUGMENTS, WORLD_FACTIONS, FACTION_TIERS, getFactionTier, getNextTierThreshold, FACTION_EFFECTS, LEGACY_UNLOCKS, HEIST_REQS, AXIOM_HEIST_REQS, ACHIEVEMENTS, UNLOCK_GATES, checkAchievements } from './data/achievements.js';

class NeoKairoAudio {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.currentTrack = null;
    this.trackNodes = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.18;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch(e) { console.warn("Audio init failed:", e); }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  // ── MUSIC TRACKS ──

  stopMusic() {
    this.trackNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.trackNodes = [];
    this.currentTrack = null;
  }

  setMusicEnabled(v) {
    this.musicEnabled = v;
    if (this.musicGain) this.musicGain.gain.value = v ? 0.18 : 0;
    if (!v) this.stopMusic();
  }

  fadeOutMusic(durationMs = 800) {
    if (!this.initialized || !this.musicGain) return;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + durationMs / 1000);
  }

  fadeInMusic(durationMs = 1200) {
    if (!this.initialized || !this.musicGain || !this.musicEnabled) return;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + durationMs / 1000);
  }

  setSfxEnabled(v) {
    this.sfxEnabled = v;
    if (this.sfxGain) this.sfxGain.gain.value = v ? 0.6 : 0;
  }

  playTrack(name) {
    if (!this.initialized || !this.musicEnabled) return;
    if (this.currentTrack === name) return;
    this.stopMusic();
    this.currentTrack = name;
    this.resume();
    if (name === "exploration") this._trackExploration();
    else if (name === "combat")      this._trackCombat();
    else if (name === "void")        this._trackVoid();
    else if (name === "spire")       this._trackSpire();
  }

  // Exploration: dark ambient, slow filter sweep, sub bass pulse
  _trackExploration() {
    const ctx = this.ctx, out = this.musicGain;
    const nodes = [];
    const t = ctx.currentTime;

    // Sub bass drone
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine"; sub.frequency.value = 38;
    subGain.gain.value = 0.5;
    sub.connect(subGain); subGain.connect(out);
    sub.start(t); nodes.push(sub);

    // Mid pad — detuned saws through lowpass
    [55, 82, 110].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq + (i * 0.3);
      filt.type = "lowpass"; filt.frequency.value = 600; filt.Q.value = 2;
      g.gain.value = 0.08;
      osc.connect(filt); filt.connect(g); g.connect(out);
      osc.start(t); nodes.push(osc);

      // LFO on filter cutoff
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine"; lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = 280;
      lfo.connect(lfoGain); lfoGain.connect(filt.frequency);
      lfo.start(t); nodes.push(lfo);
    });

    // Slow hi-freq shimmer
    const shimmer = ctx.createOscillator();
    const shimGain = ctx.createGain();
    shimmer.type = "sine"; shimmer.frequency.value = 880;
    shimGain.gain.value = 0;
    shimmer.connect(shimGain); shimGain.connect(out);
    shimmer.start(t); nodes.push(shimmer);

    // Breathe shimmer in/out slowly
    const breathe = () => {
      if (!this.trackNodes.includes(shimmer)) return;
      const now = ctx.currentTime;
      shimGain.gain.setTargetAtTime(0.04, now, 4);
      shimGain.gain.setTargetAtTime(0, now + 6, 4);
      setTimeout(breathe, 12000);
    };
    setTimeout(breathe, 2000);

    // Irregular low thump
    const thump = () => {
      if (!this.trackNodes.includes(sub)) return;
      const now = ctx.currentTime;
      const bump = ctx.createOscillator();
      const bGain = ctx.createGain();
      bump.type = "sine"; bump.frequency.value = 55;
      bump.frequency.setTargetAtTime(30, now, 0.15);
      bGain.gain.value = 0.4;
      bGain.gain.setTargetAtTime(0, now + 0.3, 0.1);
      bump.connect(bGain); bGain.connect(out);
      bump.start(now); bump.stop(now + 0.5);
      setTimeout(thump, 3000 + Math.random() * 4000);
    };
    setTimeout(thump, 1000);

    this.trackNodes = nodes;
  }

  // Combat: driving pulse, distorted bass, tension
  _trackCombat() {
    const ctx = this.ctx, out = this.musicGain;
    const nodes = [];
    const t = ctx.currentTime;
    const BPM = 140;
    const beat = 60 / BPM;

    // Pulsing distorted bass
    const scheduleNote = (freq, startTime, dur, gainVal, type) => {
      const osc = ctx.createOscillator();
      const dist = ctx.createWaveShaper();
      const g = ctx.createGain();
      // Distortion curve
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;
      osc.type = type || "sawtooth";
      osc.frequency.value = freq;
      g.gain.value = gainVal;
      g.gain.setTargetAtTime(0, startTime + dur * 0.7, 0.05);
      osc.connect(dist); dist.connect(g); g.connect(out);
      osc.start(startTime); osc.stop(startTime + dur + 0.1);
    };

    // Bass pattern loop
    const bassPat = [55, 0, 55, 0, 82, 0, 55, 69];
    let step = 0;
    const scheduleBass = (startTime) => {
      if (!this.trackNodes.length) return;
      for (let i = 0; i < 16; i++) {
        const freq = bassPat[(step + i) % bassPat.length];
        if (freq > 0) scheduleNote(freq, startTime + i * beat * 0.5, beat * 0.4, 0.35, "sawtooth");
      }
      step = (step + 16) % bassPat.length;
      const nextBar = startTime + 16 * beat * 0.5;
      const delay = (nextBar - ctx.currentTime) * 1000 - 100;
      setTimeout(() => scheduleBass(nextBar), Math.max(0, delay));
    };
    scheduleBass(t + 0.1);

    // High tension pad
    [110, 165, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.value = freq;
      filt.type = "bandpass"; filt.frequency.value = 800; filt.Q.value = 3;
      g.gain.value = 0.06;
      osc.connect(filt); filt.connect(g); g.connect(out);
      osc.start(t); nodes.push(osc);

      // Rhythmic LFO
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.type = "square"; lfo.frequency.value = BPM / 60 * (i % 2 === 0 ? 2 : 1);
      lfoG.gain.value = 0.04;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      lfo.start(t); nodes.push(lfo);
    });

    // Kick drum
    const kick = (when) => {
      if (!this.trackNodes.length) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 150;
      o.frequency.setTargetAtTime(50, when, 0.06);
      g.gain.value = 0.8; g.gain.setTargetAtTime(0, when + 0.05, 0.08);
      o.connect(g); g.connect(out);
      o.start(when); o.stop(when + 0.3);
    };

    // Kick loop
    let kickRef = { alive: true };
    nodes.push(kickRef);
    const kickLoop = (when) => {
      if (!kickRef.alive) return;
      [0, 2, 4, 6].forEach(b => kick(when + b * beat));
      const next = when + 8 * beat;
      const delay = (next - ctx.currentTime) * 1000 - 100;
      setTimeout(() => kickLoop(next), Math.max(0, delay));
    };
    kickLoop(t + 0.1);

    this.trackNodes = nodes;
    this.trackNodes.push({ stop: () => { kickRef.alive = false; } });
  }

  // Void: glitchy digital, high-frequency arpeggios, data noise
  _trackVoid() {
    const ctx = this.ctx, out = this.musicGain;
    const nodes = [];
    const t = ctx.currentTime;

    // Digital noise base
    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const nFilt = ctx.createBiquadFilter();
    nFilt.type = "bandpass"; nFilt.frequency.value = 4000; nFilt.Q.value = 8;
    const nGain = ctx.createGain(); nGain.gain.value = 0.04;
    noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(out);
    noise.start(t); nodes.push(noise);

    // Digital arpeggio
    const scale = [220, 277, 330, 415, 523, 659, 830, 1046];
    let arpStep = 0;
    const arpRef = { alive: true };
    nodes.push(arpRef);
    const arp = () => {
      if (!arpRef.alive) return;
      const now = ctx.currentTime;
      const freq = scale[arpStep % scale.length] * (Math.random() > 0.85 ? 2 : 1);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square"; o.frequency.value = freq;
      g.gain.value = 0.06;
      g.gain.setTargetAtTime(0, now + 0.05, 0.02);
      o.connect(g); g.connect(out);
      o.start(now); o.stop(now + 0.12);
      arpStep++;
      // Irregular timing — glitchy feel
      const next = 80 + (Math.random() > 0.7 ? 160 : 0) + (Math.random() > 0.9 ? 320 : 0);
      setTimeout(arp, next);
    };
    arp();

    // Low digital drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sawtooth"; drone.frequency.value = 27.5;
    droneGain.gain.value = 0.3;
    drone.connect(droneGain); droneGain.connect(out);
    drone.start(t); nodes.push(drone);

    // Glitch LFO
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = "square"; lfo.frequency.value = 8;
    lfoG.gain.value = 0.2;
    lfo.connect(lfoG); lfoG.connect(droneGain.gain);
    lfo.start(t); nodes.push(lfo);

    this.trackNodes = nodes;
    this.trackNodes.push({ stop: () => { arpRef.alive = false; } });
  }

  // Spire: cold corporate, high-tension strings simulation
  _trackSpire() {
    const ctx = this.ctx, out = this.musicGain;
    const nodes = [];
    const t = ctx.currentTime;

    // Cold high pad
    [130, 195, 260, 390].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "triangle"; osc.frequency.value = freq + i * 0.5;
      filt.type = "highpass"; filt.frequency.value = 200;
      g.gain.value = 0.1;
      osc.connect(filt); filt.connect(g); g.connect(out);
      osc.start(t); nodes.push(osc);
    });

    // Slow ominous pulse
    const pulse = ctx.createOscillator();
    const pulseGain = ctx.createGain();
    const pulseLFO = ctx.createOscillator();
    const pulseLFOGain = ctx.createGain();
    pulse.type = "sine"; pulse.frequency.value = 65;
    pulseGain.gain.value = 0.3;
    pulseLFO.type = "sine"; pulseLFO.frequency.value = 0.3;
    pulseLFOGain.gain.value = 0.25;
    pulseLFO.connect(pulseLFOGain); pulseLFOGain.connect(pulseGain.gain);
    pulse.connect(pulseGain); pulseGain.connect(out);
    pulse.start(t); pulseLFO.start(t);
    nodes.push(pulse, pulseLFO);

    this.trackNodes = nodes;
  }

  // ── SFX ──

  _sfx(fn) {
    if (!this.initialized || !this.sfxEnabled) return;
    this.resume();
    try { fn(this.ctx, this.sfxGain); } catch(e) {}
  }

  sfxAttack() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Quick distorted hit
      const o = ctx.createOscillator();
      const d = ctx.createWaveShaper();
      const g = ctx.createGain();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i/128-1; curve[i] = x < 0 ? -1 : 1; }
      d.curve = curve;
      o.type = "sawtooth"; o.frequency.value = 180;
      o.frequency.setTargetAtTime(60, t, 0.04);
      g.gain.value = 0.5; g.gain.setTargetAtTime(0, t + 0.03, 0.04);
      o.connect(d); d.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.18);

      // Metal click
      const click = ctx.createOscillator();
      const cg = ctx.createGain();
      click.type = "triangle"; click.frequency.value = 1200;
      cg.gain.value = 0.3; cg.gain.setTargetAtTime(0, t + 0.01, 0.02);
      click.connect(cg); cg.connect(out);
      click.start(t); click.stop(t + 0.08);
    });
  }

  sfxEnemyHit() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square"; o.frequency.value = 120;
      o.frequency.setTargetAtTime(40, t, 0.06);
      g.gain.value = 0.4; g.gain.setTargetAtTime(0, t + 0.04, 0.07);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.25);
    });
  }

  sfxHackSuccess() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Ascending digital sweep
      [0, 0.06, 0.12, 0.18].forEach((delay, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = 440 * Math.pow(1.5, i);
        g.gain.value = 0.15; g.gain.setTargetAtTime(0, t + delay + 0.05, 0.03);
        o.connect(g); g.connect(out);
        o.start(t + delay); o.stop(t + delay + 0.12);
      });
    });
  }

  sfxHackFail() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Descending buzz
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 300;
      o.frequency.linearRampToValueAtTime(80, t + 0.3);
      g.gain.value = 0.35; g.gain.setTargetAtTime(0, t + 0.2, 0.06);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.4);

      // Glitch bursts
      [0.05, 0.12, 0.19].forEach(d => {
        const n = ctx.createOscillator();
        const ng = ctx.createGain();
        n.type = "square"; n.frequency.value = 80 + Math.random() * 200;
        ng.gain.value = 0.2; ng.gain.setTargetAtTime(0, t+d+0.02, 0.01);
        n.connect(ng); ng.connect(out);
        n.start(t+d); n.stop(t+d+0.04);
      });
    });
  }

  sfxHeal() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Warm chime sweep up
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.2, t + i*0.08 + 0.02);
        g.gain.setTargetAtTime(0, t + i*0.08 + 0.1, 0.08);
        o.connect(g); g.connect(out);
        o.start(t + i*0.08); o.stop(t + i*0.08 + 0.35);
      });
    });
  }

  sfxLevelUp() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Fanfare — ascending major arpeggio
      const notes = [261, 329, 392, 523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.25, t + i*0.07 + 0.02);
        g.gain.setTargetAtTime(0, t + i*0.07 + 0.15, 0.1);
        o.connect(g); g.connect(out);
        o.start(t + i*0.07); o.stop(t + i*0.07 + 0.5);
      });
    });
  }

  sfxTravel() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Whoosh sweep
      const bufSize = ctx.sampleRate * 0.4;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random()*2-1) * (i/bufSize);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = "bandpass"; filt.frequency.value = 800;
      filt.frequency.linearRampToValueAtTime(3000, t + 0.3);
      const g = ctx.createGain(); g.gain.value = 0.3;
      g.gain.setTargetAtTime(0, t + 0.25, 0.06);
      src.connect(filt); filt.connect(g); g.connect(out);
      src.start(t); src.stop(t + 0.4);
    });
  }

  sfxBuy() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.value = 0.2; g.gain.setTargetAtTime(0, t + i*0.1 + 0.05, 0.04);
        o.connect(g); g.connect(out);
        o.start(t + i*0.08); o.stop(t + i*0.1 + 0.15);
      });
    });
  }

  sfxAugment() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Electric surge
      const bufSize = ctx.sampleRate * 0.6;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1) * 0.8;
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = "highpass"; filt.frequency.value = 1000;
      const g = ctx.createGain(); g.gain.value = 0.4;
      g.gain.setTargetAtTime(0, t + 0.1, 0.15);
      noise.connect(filt); filt.connect(g); g.connect(out);
      noise.start(t); noise.stop(t + 0.6);
      // Tone confirmation
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = "sine"; o.frequency.value = 440;
      o.frequency.linearRampToValueAtTime(880, t + 0.4);
      og.gain.value = 0.3; og.gain.setTargetAtTime(0, t + 0.3, 0.1);
      o.connect(og); og.connect(out);
      o.start(t + 0.15); o.stop(t + 0.6);
    });
  }

  sfxCombatStart() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Alert stab
      [0, 0.08, 0.16].forEach((d, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = 220 + i*40;
        g.gain.value = 0.4; g.gain.setTargetAtTime(0, t+d+0.04, 0.03);
        o.connect(g); g.connect(out);
        o.start(t+d); o.stop(t+d+0.1);
      });
    });
  }

  sfxFlee() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 660;
      o.frequency.linearRampToValueAtTime(220, t + 0.25);
      g.gain.value = 0.25; g.gain.setTargetAtTime(0, t+0.15, 0.06);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t+0.3);
    });
  }

  sfxDeath() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Low descending groan
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 110;
      o.frequency.linearRampToValueAtTime(27, t + 1.5);
      g.gain.value = 0.5; g.gain.setTargetAtTime(0, t+1.0, 0.4);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t+2.0);
      // Static crackle
      const bufSize = ctx.sampleRate * 0.8;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1) * (1 - i/bufSize);
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const ng = ctx.createGain(); ng.gain.value = 0.3;
      noise.connect(ng); ng.connect(out);
      noise.start(t + 0.3); noise.stop(t + 1.2);
    });
  }

  sfxExplore() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Subtle footstep-like click
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = 200;
      o.frequency.setTargetAtTime(80, t, 0.03);
      g.gain.value = 0.2; g.gain.setTargetAtTime(0, t+0.02, 0.04);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t+0.1);
    });
  }

  sfxRest() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      // Soft confirmation hum
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 220;
      g.gain.value = 0; g.gain.linearRampToValueAtTime(0.15, t+0.1);
      g.gain.setTargetAtTime(0, t+0.4, 0.2);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t+0.9);
    });
  }
}

const Audio = new NeoKairoAudio();

// ─── HACK DEV MODE ──────────────────────────────────────────────────────────
// Set true to enable the live tuning panel during play. Set false before release.
const HACK_DEV_MODE = false;

// ─── HACK AUDIO ─────────────────────────────────────────────────────────────
// Separate audio engine for the hacking minigame. Renamed from 'audio' to
// avoid collision with the main game's 'Audio' singleton.

class HackAudio {
  constructor() { this.ctx = null; this.master = null; this.initialized = false; this.ambientNodes = []; this.ambientOscs = []; this.ambientBaseFreqs = []; }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.65;
      this.master.connect(this.ctx.destination);
      this.initialized = true;
    } catch(e) {}
  }

  resume() { if (this.ctx?.state === "suspended") this.ctx.resume(); }
  _sfx(fn) { if (!this.initialized) return; this.resume(); try { fn(this.ctx, this.master); } catch(e) {} }

  _noise(ctx, out, durationS, filterFreq, filterType, gainVal, t) {
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(sr * durationS), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = filterType || "bandpass"; filt.frequency.value = filterFreq || 1000;
    const g = ctx.createGain(); g.gain.value = gainVal || 0.3;
    g.gain.setTargetAtTime(0, t + durationS * 0.3, durationS * 0.25);
    src.connect(filt); filt.connect(g); g.connect(out);
    src.start(t); src.stop(t + durationS + 0.05);
  }

  startAmbient() {
    if (!this.initialized) return;
    this.stopAmbient(); this.resume();
    const ctx = this.ctx, out = this.master, nodes = [], t = ctx.currentTime;
    const sub = ctx.createOscillator(), subG = ctx.createGain();
    const subLfo = ctx.createOscillator(), subLfoG = ctx.createGain();
    sub.type = "sine"; sub.frequency.value = 38;
    subLfo.type = "sine"; subLfo.frequency.value = 0.04;
    subLfoG.gain.value = 0.08; subG.gain.value = 0.18;
    subLfo.connect(subLfoG); subLfoG.connect(subG.gain);
    sub.connect(subG); subG.connect(out);
    sub.start(t); subLfo.start(t);
    nodes.push(sub, subLfo);
    this.ambientOscs = [sub]; this.ambientBaseFreqs = [38];
    [108, 108.7].forEach((freq, i) => {
      const osc = ctx.createOscillator(), filt = ctx.createBiquadFilter(), g = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.value = freq;
      filt.type = "lowpass"; filt.frequency.value = 320; filt.Q.value = 2;
      g.gain.value = 0.028;
      osc.connect(filt); filt.connect(g); g.connect(out);
      osc.start(t); nodes.push(osc);
      if (i === 0) { this.ambientOscs.push(osc); this.ambientBaseFreqs.push(freq); }
    });
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noiseLoop = ctx.createBufferSource(); noiseLoop.buffer = noiseBuf; noiseLoop.loop = true;
    const nFilt = ctx.createBiquadFilter(), nG = ctx.createGain();
    const nLfo  = ctx.createOscillator(), nLfoG = ctx.createGain();
    nFilt.type = "bandpass"; nFilt.frequency.value = 3200; nFilt.Q.value = 6;
    nG.gain.value = 0.018;
    nLfo.type = "sine"; nLfo.frequency.value = 0.12; nLfoG.gain.value = 800;
    nLfo.connect(nLfoG); nLfoG.connect(nFilt.frequency);
    noiseLoop.connect(nFilt); nFilt.connect(nG); nG.connect(out);
    noiseLoop.start(t); nLfo.start(t);
    nodes.push(noiseLoop, nLfo);
    const harm = ctx.createOscillator(), harmG = ctx.createGain();
    harm.type = "triangle"; harm.frequency.value = 432;
    harmG.gain.value = 0.014;
    harm.connect(harmG); harmG.connect(out); harm.start(t); nodes.push(harm);
    this.ambientOscs.push(harm); this.ambientBaseFreqs.push(432);
    this.ambientNodes = nodes;
  }

  updateAmbientPitch(trace) {
    if (!this.initialized || !this.ambientOscs.length) return;
    const shift = 1.0 + (trace / 100) * 0.38;
    this.ambientOscs.forEach((osc, i) => {
      try { osc.frequency.setTargetAtTime((this.ambientBaseFreqs[i] || 80) * shift, this.ctx.currentTime, 1.2); } catch(e) {}
    });
  }

  stopAmbient() {
    this.ambientNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.ambientNodes = []; this.ambientOscs = []; this.ambientBaseFreqs = [];
  }

  sfxReveal() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      this._noise(ctx, out, 0.04, 2400, "bandpass", 0.06, t);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 1840;
      o.frequency.setTargetAtTime(1400, t + 0.01, 0.06);
      g.gain.value = 0; g.gain.linearRampToValueAtTime(0.07, t + 0.02);
      g.gain.setTargetAtTime(0, t + 0.04, 0.08);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
    });
  }

  sfxCorrect() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      this._noise(ctx, out, 0.015, 3000, "highpass", 0.18, t);
      [660, 990, 1320].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.13, t + i * 0.04 + 0.015);
        g.gain.setTargetAtTime(0, t + i * 0.04 + 0.06, 0.055);
        o.connect(g); g.connect(out);
        o.start(t + i * 0.04); o.stop(t + i * 0.04 + 0.25);
      });
    });
  }

  sfxWrong() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const curve = new Float32Array(512);
      for (let i = 0; i < 512; i++) { const x = i / 256 - 1; curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x)); }
      const crackOsc = ctx.createOscillator(), dist = ctx.createWaveShaper(), crackG = ctx.createGain();
      crackOsc.type = "sawtooth"; crackOsc.frequency.value = 180;
      dist.curve = curve;
      crackG.gain.value = 0.35; crackG.gain.setTargetAtTime(0, t + 0.02, 0.018);
      crackOsc.connect(dist); dist.connect(crackG); crackG.connect(out);
      crackOsc.start(t); crackOsc.stop(t + 0.08);
      this._noise(ctx, out, 0.06, 4000, "highpass", 0.22, t);
      const dread = ctx.createOscillator(), dreadG = ctx.createGain();
      dread.type = "sine"; dread.frequency.value = 140;
      dread.frequency.linearRampToValueAtTime(48, t + 0.45);
      dreadG.gain.value = 0; dreadG.gain.linearRampToValueAtTime(0.22, t + 0.05);
      dreadG.gain.setTargetAtTime(0, t + 0.25, 0.1);
      dread.connect(dreadG); dreadG.connect(out); dread.start(t + 0.03); dread.stop(t + 0.6);
    });
  }

  sfxTraceSurge() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const sweep = ctx.createOscillator(), sweepG = ctx.createGain();
      sweep.type = "square"; sweep.frequency.value = 200;
      sweep.frequency.linearRampToValueAtTime(680, t + 0.06);
      sweepG.gain.value = 0.16; sweepG.gain.setTargetAtTime(0, t + 0.06, 0.025);
      sweep.connect(sweepG); sweepG.connect(out); sweep.start(t); sweep.stop(t + 0.12);
      const confirm = ctx.createOscillator(), confG = ctx.createGain();
      confirm.type = "square"; confirm.frequency.value = 340;
      confG.gain.value = 0.12; confG.gain.setTargetAtTime(0, t + 0.16, 0.03);
      confirm.connect(confG); confG.connect(out); confirm.start(t + 0.13); confirm.stop(t + 0.22);
    });
  }

  sfxTraceNodeAppear() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      [880, 660, 440].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square"; o.frequency.value = freq;
        g.gain.value = 0.14; g.gain.setTargetAtTime(0, t + i*0.09 + 0.04, 0.02);
        o.connect(g); g.connect(out);
        o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.08);
      });
      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.type = "sine"; sub.frequency.value = 55;
      subG.gain.value = 0.2; subG.gain.setTargetAtTime(0, t + 0.1, 0.08);
      sub.connect(subG); subG.connect(out); sub.start(t); sub.stop(t + 0.3);
    });
  }

  sfxTraceNodeCut() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      this._noise(ctx, out, 0.02, 5000, "highpass", 0.28, t);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 520;
      o.frequency.linearRampToValueAtTime(180, t + 0.08);
      g.gain.value = 0.2; g.gain.setTargetAtTime(0, t + 0.05, 0.04);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.15);
      const res = ctx.createOscillator(), resG = ctx.createGain();
      res.type = "triangle"; res.frequency.value = 440;
      resG.gain.value = 0; resG.gain.linearRampToValueAtTime(0.1, t + 0.08);
      resG.gain.setTargetAtTime(0, t + 0.12, 0.06);
      res.connect(resG); resG.connect(out); res.start(t + 0.07); res.stop(t + 0.3);
    });
  }

  sfxIce() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const sr  = ctx.sampleRate;
      const buf = ctx.createBuffer(1, Math.floor(sr * 0.6), sr);
      const bd  = buf.getChannelData(0);
      for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(), g = ctx.createGain();
      filt.type = "lowpass"; filt.frequency.value = 200;
      filt.frequency.linearRampToValueAtTime(8000, t + 0.3);
      g.gain.value = 0.18; g.gain.setTargetAtTime(0, t + 0.35, 0.1);
      src.connect(filt); filt.connect(g); g.connect(out); src.start(t); src.stop(t + 0.5);
      [220, 330, 440, 660].forEach((freq, i) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = "triangle"; o.frequency.value = freq;
        og.gain.value = 0; og.gain.linearRampToValueAtTime(0.1, t + 0.28 + i*0.04);
        og.gain.setTargetAtTime(0, t + 0.32 + i*0.04, 0.12);
        o.connect(og); og.connect(out); o.start(t + 0.28 + i*0.04); o.stop(t + 0.7);
      });
    });
  }

  sfxGhost() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.type = "sine"; sub.frequency.value = 32;
      subG.gain.value = 0; subG.gain.linearRampToValueAtTime(0.18, t + 0.6);
      subG.gain.setTargetAtTime(0, t + 1.2, 0.4);
      sub.connect(subG); subG.connect(out); sub.start(t); sub.stop(t + 2.2);
      const mid = ctx.createOscillator(), midFilt = ctx.createBiquadFilter(), midG = ctx.createGain();
      mid.type = "sawtooth"; mid.frequency.value = 160;
      mid.frequency.setTargetAtTime(130, t, 0.8);
      midFilt.type = "bandpass"; midFilt.frequency.value = 380; midFilt.Q.value = 12;
      midG.gain.value = 0; midG.gain.linearRampToValueAtTime(0.12, t + 0.4);
      midG.gain.setTargetAtTime(0, t + 1.0, 0.5);
      mid.connect(midFilt); midFilt.connect(midG); midG.connect(out); mid.start(t); mid.stop(t + 2.2);
      this._noise(ctx, out, 0.8, 3800, "bandpass", 0.08, t + 0.5);
    });
  }

  sfxSuccess() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.type = "sine"; sub.frequency.value = 60;
      subG.gain.value = 0.28; subG.gain.setTargetAtTime(0, t + 0.06, 0.04);
      sub.connect(subG); subG.connect(out); sub.start(t); sub.stop(t + 0.2);
      [440, 660, 880].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.16, t + 0.08 + i*0.1);
        g.gain.setTargetAtTime(0, t + 0.14 + i*0.1, 0.18);
        o.connect(g); g.connect(out); o.start(t + 0.08 + i*0.1); o.stop(t + 0.08 + i*0.1 + 0.6);
      });
      this._noise(ctx, out, 0.4, 6000, "highpass", 0.04, t + 0.35);
    });
  }

  sfxFail() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      this._noise(ctx, out, 0.04, 2000, "highpass", 0.4, t);
      const curve = new Float32Array(512);
      for (let i = 0; i < 512; i++) { const x = i / 256 - 1; curve[i] = Math.tanh(x * 8) * 0.8; }
      const o = ctx.createOscillator(), dist = ctx.createWaveShaper(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 320;
      o.frequency.linearRampToValueAtTime(28, t + 0.7);
      dist.curve = curve;
      g.gain.value = 0.36; g.gain.setTargetAtTime(0, t + 0.45, 0.15);
      o.connect(dist); dist.connect(g); g.connect(out); o.start(t + 0.02); o.stop(t + 0.9);
      [0.08, 0.22, 0.42].forEach((d, i) => { this._noise(ctx, out, 0.05, 800 + i*400, "bandpass", 0.28 - i*0.08, t + d); });
    });
  }

  sfxEntry() {
    this._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.type = "sine"; sub.frequency.value = 30;
      sub.frequency.linearRampToValueAtTime(80, t + 1.0);
      subG.gain.value = 0; subG.gain.linearRampToValueAtTime(0.24, t + 0.5);
      subG.gain.setTargetAtTime(0, t + 0.9, 0.12);
      sub.connect(subG); subG.connect(out); sub.start(t); sub.stop(t + 1.2);
      [0, 0.18, 0.32, 0.43, 0.52, 0.59, 0.65].forEach((d, i) => { this._noise(ctx, out, 0.06, 1000 + i*300, "bandpass", 0.12 + i*0.02, t + d); });
      const res = ctx.createOscillator(), resG = ctx.createGain();
      res.type = "triangle"; res.frequency.value = 1200;
      res.frequency.linearRampToValueAtTime(440, t + 1.1);
      resG.gain.value = 0; resG.gain.linearRampToValueAtTime(0.12, t + 0.92);
      resG.gain.setTargetAtTime(0, t + 1.0, 0.08);
      res.connect(resG); resG.connect(out); res.start(t + 0.9); res.stop(t + 1.3);
    });
  }
}

const hackAudio = new HackAudio();

// ─── HACK MINIGAME CONSTANTS ─────────────────────────────────────────────────

const MATRIX_CHARS = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF$#@%&";

const HACK_DIFFICULTY = {
  easy:   { label:"EASY",   seqLen:5,  mistakes:2, traceSpeed:0.65, lingerMs:2200, wordInterval:1200, ghostRunTrace:30, targetChance:0.18, maxWords:8,  virusSeed:15, counterAt:30 },
  normal: { label:"NORMAL", seqLen:7,  mistakes:1, traceSpeed:1.10, lingerMs:1400, wordInterval:900,  ghostRunTrace:35, targetChance:0.12, maxWords:10, virusSeed:10, counterAt:20 },
  hard:   { label:"HARD",   seqLen:7,  mistakes:1, traceSpeed:1.45, lingerMs:1100, wordInterval:750,  ghostRunTrace:40, targetChance:0.09, maxWords:12, virusSeed:8,  counterAt:15 },
};

// Maps main game archetype strings to minigame parameters.
// Programs are now loaded from char.programs + char.augments (neural_hack → deep_scan).
// traceMod and lingerBonus remain archetype-based (innate neural architecture).
const HACK_ARCHETYPE = {
  netrunner: { traceMod:0.85, lingerBonus:400 },
  ghost:     { traceMod:0.90, lingerBonus:200 },
  soldier:   { traceMod:1.0,  lingerBonus:0   },
  fixer:     { traceMod:0.95, lingerBonus:100 },
};

const HACK_PROGRAMS = {
  // deep_scan: granted by neural_hack augment, not purchasable
  deep_scan:    { label:"DEEP SCAN",    type:"passive",  desc:"Target words have faint blue tint. Neural augment (neural_hack required)." },
  signal:       { label:"SIGNAL",       type:"passive",  desc:"Target word flashes at full brightness on reveal."        },
  ghost_thread: { label:"GHOST THREAD", type:"passive",  desc:"Auto-absorbs next mistake silently. One use per hack."    },
  shard:        { label:"SHARD",        type:"passive",  desc:"2s column warning before trace node appears."             },
  spoof:        { label:"SPOOF",        type:"active",   desc:"Freeze trace 6s. Word spawning pauses too."               },
  surge:        { label:"SURGE",        type:"active",   desc:"4s window: each correct tap cuts trace 4%."               },
  pulse:        { label:"PULSE",        type:"active",   desc:"Dims all decoys 1.5s. Targets stay bright."               },
  firewall:     { label:"FIREWALL",     type:"passive",  desc:"Blocks automatic virus at 60% and 80% trace. Two uses."   },
  spike:        { label:"SPIKE",        type:"active",   desc:"Destroys active trace node (−15% trace). EMP if no node." },
};

// Compute difficulty from game context. Returns null for low-danger terminals (skip minigame).
function computeHackDifficulty(danger, layer, origin, hackBonus) {
  let diff;
  if (origin === 'sidequest') {
    diff = 'normal';
  } else if (layer >= 2) {
    diff = 'normal';
  } else if (danger >= 4) {
    diff = 'normal';
  } else if (danger >= 2) {
    diff = 'easy';
  } else {
    return null; // danger 0-1, layer 0: flat reward, no minigame
  }
  // hackBonus tier reduction
  if ((hackBonus || 0) >= 20 && diff === 'normal') diff = 'easy';
  if ((hackBonus || 0) >= 20 && diff === 'hard')   diff = 'normal';
  return diff;
}

// Build the program set for a hack session from char state.
// ICE count comes from char.iceCharges. All other programs from char.programs + neural_hack aug.
function buildHackPrograms(char) {
  const owned = char.programs || [];
  const augs   = char.augments || [];
  const programs = [...owned];
  if (augs.includes('neural_hack') && !programs.includes('deep_scan')) {
    programs.push('deep_scan');
  }
  return programs;
}

// ─── HACK LORE SEQUENCES ─────────────────────────────────────────────────────
// All sequences use real Neo-Kairo canon. Decoys are drawn from the same
// narrative cluster as targets to create genuine reading challenge.

const GHOST_MSGS = ["YOU.","I SEE YOU.","RUNNING TRACE...","DETECTED.","WHO ARE YOU?","CLOSE.","ALMOST.","FIND YOU.","TOO SLOW.","I HAVE YOU.","SIGNAL LOCKED.","NOWHERE TO GO.","SYSTEM: BREACH DETECTED","COUNTER-HACK ACTIVE","YOU CANNOT HIDE HERE"];
const TRACE_NODES = ["TRACE","LOCK","SCAN","PING","TRACK","LOCATE","SIGNAL","BREACH","DETECT","ISOLATE","CLOSE","HUNT"];
const GLITCH_CHARS = "█▓▒░▪▫▬▲▼◆◇○●";

const HACK_DATA = {
  terminal: {
    name: "AXIOM TERMINAL",
    sequences: [
      { words: ["ARIA","ACCESSED","SUBLEVEL","THREE","LOGS","BEFORE","ERASURE"],    hint: "She was inside longer than anyone knew. Axiom found out six weeks later." },
      { words: ["GHOST","NETWORK","HAS","AXIOM","ASSET","INSIDE","SPIRE"],          hint: "Not a leak. A plant. Someone Axiom trusted enough to let bleed." },
      { words: ["MEDICA","CORP","TRIALS","LOGGED","UNDER","WASTE","DISPOSAL"],      hint: "Twelve names. Filed as industrial accident losses. No investigation was opened." },
      { words: ["KITE","CARRIES","ENCRYPTED","PACKAGE","IRONHAND","CANNOT","DECODE"],hint: "They've been chasing her for three months. They still don't know what she has." },
      { words: ["RUSTY","CONTACT","FLAGGED","BY","AXIOM","DIVISION","SEVEN"],        hint: "They've known about him longer than he's known about them. That gap matters." },
      { words: ["DOC","MEMBRANE","CLINIC","SCHEDULED","FOR","AXIOM","ACQUISITION"], hint: "Not a raid. A buyout. She won't sell. That distinction will cost her." },
      { words: ["CORTEXSYNC","FIRMWARE","BATCH","SEVEN","C","PREFERENCE","UPDATE"],  hint: "Not a security patch. A preference update. The diff file exists. Ask Nadia." },
      { words: ["EXTRACTION","SURVIVAL","RATE","RISING","MEDICA","COVERING","LOSSES"], hint: "Seventy-one percent full recall now. Axiom's 'fatal cascade' claim hasn't held for two years." },
    ],
    decoys: ["ARIA","GHOST","MEDICA","KITE","RUSTY","DOC","CORTEXSYNC","ACCESSED","NETWORK","CORP","CARRIES","CONTACT","MEMBRANE","FIRMWARE","SUBLEVEL","HAS","TRIALS","ENCRYPTED","FLAGGED","CLINIC","BATCH","THREE","AXIOM","LOGGED","PACKAGE","BY","SCHEDULED","SEVEN","LOGS","ASSET","UNDER","IRONHAND","DIVISION","C","FOR","BEFORE","INSIDE","WASTE","CANNOT","ACQUISITION","PREFERENCE","EXTRACTION","ERASURE","SPIRE","DISPOSAL","DECODE","UPDATE","SURVIVAL","NADIA","SIGMA","RELAY","DELTA","VAULT","CIPHER","NEXUS","VOID","KERNEL","SECTOR","NODE","DARK","OMEGA","DEAD","ACTIVE","PURGE","RISING","LOSSES"],
  },
  drone: {
    name: "IRONHAND DRONE",
    sequences: [
      { words: ["SENTRY","ROUTE","DELTA","GOES","DARK","AT","0300"],                hint: "Eighteen minutes. That's your window. Don't waste it on anything small." },
      { words: ["IRONHAND","UNIT","SIGMA","FOLLOWS","RUST","PROTOCOL","ONLY"],       hint: "Old code. Whoever left it there did it on purpose. Someone wanted a door." },
      { words: ["KILL","CODES","CHANGED","CYCLE","SEVEN","NOT","LOGGED"],            hint: "The update happened. The record didn't. Someone is covering something quiet." },
      { words: ["FREQ-NINE","JAMMER","BLIND","SPOT","SECTOR","FOUR","CONFIRMED"],   hint: "The blind spot is real and known. It hasn't been fixed because it's useful." },
      { words: ["PATROL","SEVEN","CARRIES","FACIAL","SCAN","ACTIVE","ALWAYS"],      hint: "It doesn't just watch. It builds a registry. Every face. Every route. Permanent." },
      { words: ["BACKUP","CORE","FAILS","ABOVE","FORTY","DEGREES","CELSIUS"],       hint: "A design flaw nobody patched in six years. Or a door they kept open." },
    ],
    decoys: ["SENTRY","IRONHAND","KILL","PATROL","BACKUP","FREQ-NINE","ROUTE","UNIT","CODES","SEVEN","CARRIES","CORE","JAMMER","DELTA","SIGMA","CHANGED","FACIAL","FAILS","GOES","FOLLOWS","CYCLE","SCAN","ABOVE","DARK","RUST","SEVEN","NOT","ACTIVE","FORTY","AT","PROTOCOL","LOGGED","ALWAYS","DEGREES","0300","ONLY","SECTOR","CELSIUS","CONFIRMED","SIGNAL","ROTOR","MESH","ARRAY","CLUSTER","HELIX","STATIC","LOOP","AXIS","OMEGA","PURGED","GRID","VECTOR","RELAY","LOCK","SCOPE"],
  },
  story: {
    name: "AXIOM MAINFRAME",
    sequences: [
      { words: ["ARIA","SAW","BOARD","VOTE","TO","ERASE","EVERYTHING"],             hint: "She was never meant to be in that room. She was there because someone trusted her. They shouldn't have." },
      { words: ["AX-ZERO","PROJECT","NEVER","ENDED","JUST","WENT","DEEPER"],        hint: "The shutdown was theatre. The budget moved to a different line item. The work continued." },
      { words: ["DOC","MEM","ERASED","SOMETHING","FROM","YOUR","MEMORY"],           hint: "Six months. A facility. A name you almost remember. She knows what she took." },
      { words: ["AXIOM","BUILT","NEO-KAIRO","AS","A","CONTROLLED","ENVIRONMENT"],   hint: "Every district. Every exit. Every faction's territory. The chaos is the design. You're inside an experiment." },
      { words: ["KITE","IS","THE","LAST","LIVING","COPY","ALIVE"],                  hint: "Whatever she carries, Axiom would erase her to destroy it. She knows. She keeps moving anyway." },
      { words: ["OPERATION","AXIOM","ZERO","WINDOW","OPENS","ONCE","ONLY"],         hint: "One convergence point. Level eight, five thousand credits, the right chrome, the right allies. Miss it and the city stays exactly as it is. Forever." },
      { words: ["CORTEXSYNC","FIRMWARE","WRITES","LOYALTY","NOT","SKILLS","ONLY"],  hint: "The skill transfer is real. So is the preference modification. They run in the same update. You can't get one without the other." },
      { words: ["NEO-KAIRO","ADOPTION","DATA","EXPORTS","TO","GLOBAL","ROLLOUT"],   hint: "This was never about one city. Neo-Kairo is the proof of concept. The global deployment package is already built." },
    ],
    decoys: ["ARIA","AX-ZERO","DOC","AXIOM","KITE","OPERATION","CORTEXSYNC","NEO-KAIRO","SAW","PROJECT","MEM","BUILT","IS","ZERO","FIRMWARE","ADOPTION","BOARD","NEVER","ERASED","NEO-KAIRO","THE","WINDOW","VOTE","ENDED","SOMETHING","AS","LAST","OPENS","WRITES","DATA","TO","JUST","FROM","A","LIVING","ONCE","LOYALTY","EXPORTS","ERASE","WENT","YOUR","CONTROLLED","COPY","ONLY","NOT","TO","EVERYTHING","DEEPER","MEMORY","ENVIRONMENT","ALIVE","SKILLS","GLOBAL","ROLLOUT","NADIA","GHOST","RUSTY","SPIRE","UNDERGROUND","CONSOLE","ARCHIVE","SYSOP","ECHO","LAYER","MIRROR","VAULT","SECTOR","PROXY","SIGNAL","PURGE","LOCK","OMEGA","CIPHER"],
  },
};


// ============================================================
// WORLD DATA
// ===========================================================

// ============================================================
// SEEDED PROCEDURAL MAP ENGINE — v2
// ============================================================

function mkRng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}
function chunkSeed(cx, cy) {
  const x = (cx + 100000) | 0;
  const y = (cy + 100000) | 0;
  return ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) + 0xDEADBEEF) >>> 0;
}

// ── TILE DEFINITIONS ──
// Base tiles shared across layers
const T = {
  FLOOR:    { ch: '·', passable: true,  color: '#2a2a3a' },
  WALL:     { ch: '█', passable: false, color: '#3a3a52' },
  WALL_DIM: { ch: '▓', passable: false, color: '#252535' }, // map border / outer
  ROAD:     { ch: '─', passable: true,  color: '#353545' },
  ROAD_V:   { ch: '│', passable: true,  color: '#353545' },
  ROAD_X:   { ch: '┼', passable: true,  color: '#404055' }, // intersection
  SHOP:     { ch: '¢', passable: true,  color: '#ffd700', label: 'SHOP' },
  NET_BROKER: { ch: '⌬', passable: true, color: '#4499ff', label: 'NET BROKER' },
  JOB:      { ch: '◈', passable: true,  color: '#e040fb', label: 'JOB' },
  ITEM:     { ch: '✦', passable: true,  color: '#69ff47', label: 'ITEM' },
  STASH:    { ch: '▣', passable: true,  color: '#ff9800', label: 'STASH' },
  TERMINAL: { ch: '▸', passable: true,  color: '#00e5ff', label: 'TERMINAL' },
  REST:     { ch: '⌂', passable: true,  color: '#4488ff', label: 'REST' },
  LADDER:   { ch: '≡', passable: true,  color: '#888888', label: 'LADDER' },
  WATER:    { ch: '≋', passable: false, color: '#1a3a55' },
  WINDOW:   { ch: '░', passable: false, color: '#334466' },
  PIPE_H:   { ch: '═', passable: false, color: '#445533' },
  PIPE_V:   { ch: '║', passable: false, color: '#445533' },
  DOOR:     { ch: '▪', passable: true,  color: '#886644', label: 'DOOR' },
  SIGN:     { ch: '☰', passable: true,  color: '#888866', label: 'SIGN' },
  VOID_NODE:{ ch: '◆', passable: true,  color: '#69ff47', label: 'VOID ACCESS' },
  FACTION:  { ch: '◉', passable: true,  color: '#ff5722' },
  NPC:      { ch: '☻', passable: true,  color: '#e0c060', label: 'TALK' },
  RIPPER:   { ch: '✦', passable: true,  color: '#00e5ff', label: 'RIPPER DOC' },
  PLAYER:   { ch: '@', passable: true,  color: '#ffffff' },
  // Atmosphere — context-aware placement
  GRAFFITI: { ch: '▪', passable: true,  color: '#662222' },
  CRATE:    { ch: '□', passable: false, color: '#554433' },
  BARREL:   { ch: '◎', passable: false, color: '#445544' },
  LIGHT:    { ch: '°', passable: true,  color: '#ffee66' },
  DEBRIS:   { ch: '·', passable: true,  color: '#4a3a2a' },
  PUDDLE:   { ch: '~', passable: true,  color: '#224466' },
};

// Per-layer tile overrides — Undernet and Spire feel different
const LAYER_TILES = {
  0: { // Neon Streets — standard
    WALL: { ...T.WALL },
    FLOOR: { ...T.FLOOR },
    ROAD: { ...T.ROAD },
    ROAD_V: { ...T.ROAD_V },
  },
  1: { // Undernet — rough, organic, cramped
    WALL:   { ch: '▒', passable: false, color: '#2a2820' },
    FLOOR:  { ch: '·', passable: true,  color: '#1e1e28' },
    ROAD:   { ch: '~', passable: true,  color: '#1a2a1a' }, // wet tunnels
    ROAD_V: { ch: '!', passable: true,  color: '#1a2a1a' },
  },
  2: { // Spire Base — clean, geometric, cold
    WALL:   { ch: '│', passable: false, color: '#2a3a3a' },
    FLOOR:  { ch: '░', passable: true,  color: '#141e1e' },
    ROAD:   { ch: '─', passable: true,  color: '#1a2a2a' },
    ROAD_V: { ch: '│', passable: true,  color: '#1a2a2a' },
  },
  3: { // Void — data architecture
    WALL:   { ch: '╬', passable: false, color: '#0a2a0a' },
    FLOOR:  { ch: '·', passable: true,  color: '#071507' },
    ROAD:   { ch: '━', passable: true,  color: '#0d2a0d' },
    ROAD_V: { ch: '┃', passable: true,  color: '#0d2a0d' },
  },
};

const CHUNK_W = 22;
const CHUNK_H = 13;

const CHUNK_TYPES = {
  residential:  { shops:0.5, jobs:0.4, items:0.5, rests:0.15, terminals:0.2,  danger:1, bg:'#08080e', atmo:['GRAFFITI','LIGHT','CRATE','PUDDLE'] },
  market:       { shops:0.9, jobs:0.5, items:0.3, rests:0.05, terminals:0.15, danger:1, bg:'#090710', atmo:['LIGHT','BARREL','CRATE'] },
  gang_turf:    { shops:0.4, jobs:0.6, items:0.5, rests:0.0,  terminals:0.1,  danger:2, bg:'#110708', atmo:['GRAFFITI','BARREL','DEBRIS'] },
  industrial:   { shops:0.3, jobs:0.5, items:0.5, rests:0.08, terminals:0.2,  danger:2, bg:'#070e08', atmo:['CRATE','BARREL'] },
  ruins:        { shops:0.1, jobs:0.2, items:0.8, rests:0.1,  terminals:0.15, danger:2, bg:'#0c0b07', atmo:['CRATE','DEBRIS','PUDDLE'] },
  safehouse:    { shops:0.5, jobs:0.5, items:0.2, rests:1.0,  terminals:0.1,  danger:0, bg:'#070f0d', atmo:['LIGHT'] },
  checkpoint:   { shops:0.0, jobs:0.1, items:0.2, rests:0.0,  terminals:0.1,  danger:3, bg:'#110608', atmo:['BARREL'] },
  tunnel:       { shops:0.3, jobs:0.4, items:0.6, rests:0.1,  terminals:0.1,  danger:1, bg:'#060606', atmo:['BARREL','CRATE','PUDDLE'] },
  sump:         { shops:0.2, jobs:0.3, items:0.7, rests:0.0,  terminals:0.05, danger:2, bg:'#060a06', atmo:['BARREL','PUDDLE'] },
  black_market: { shops:1.0, jobs:0.6, items:0.3, rests:0.2,  terminals:0.2,  danger:1, bg:'#06060e', atmo:['LIGHT','CRATE'] },
  corporate:    { shops:0.3, jobs:0.5, items:0.2, rests:0.0,  terminals:0.4,  danger:3, bg:'#050c0a', atmo:['LIGHT','CRATE'] },
  lobby:        { shops:0.1, jobs:0.3, items:0.1, rests:0.0,  terminals:0.3,  danger:4, bg:'#040a08', atmo:['LIGHT'] },
  ripper_doc:   { shops:0.0, jobs:0.0, items:0.1, rests:0.3,  terminals:0.0,  danger:0, bg:'#060810', atmo:['LIGHT','CRATE'] },
};

const LAYER_TYPES = {
  0: ['residential','market','gang_turf','industrial','ruins','safehouse','checkpoint','ripper_doc'],
  1: ['tunnel','sump','black_market','industrial','ruins','ripper_doc'],
  2: ['corporate','lobby','ruins','checkpoint'],
  3: ['ruins','ruins','ruins'],
};

function getFaction(cx, cy) {
  // Meridian: border corridor zones — between faction territories
  // They don't hold a cardinal direction; they hold the seams.
  if (Math.abs(cx) <= 1 && cy < -3) return 'meridian'; // northern neutral corridor
  if (Math.abs(cy) <= 1 && cx < -3) return 'meridian'; // western passage through Ironhand
  if (cx > 3)  return 'axiom';
  if (cx < -3) return 'ironhand';
  if (cy < -3) return 'ghosts';
  if (cy > 3)  return 'medica';
  return null;
}

function getDanger(cx, cy, baseChunkDanger) {
  const dist = Math.abs(cx) + Math.abs(cy);
  const bonus = dist < 2 ? 0 : dist < 5 ? 1 : dist < 9 ? 2 : 3;
  return Math.min(4, baseChunkDanger + bonus);
}

const ENCOUNTER_BASE = { 0: 0.0, 1: 0.015, 2: 0.038, 3: 0.068, 4: 0.113 };

function enemyPool(danger, faction, layer) {
  if (layer === 3) return danger >= 3 ? ['Daemon','Black ICE','ICE Construct'] : ['ICE Construct','Black ICE'];
  const pools = {
    0: [],
    1: { residential:['Sump Rat','Tunnel Gang'], market:['Sump Rat'], gang_turf:['Tunnel Gang','Sump Rat'], industrial:['Sump Rat','Tunnel Gang'], tunnel:['Sump Rat','Tunnel Gang'], sump:['Sump Rat','Tunnel Gang'], black_market:['Tunnel Gang'], ruins:['Sump Rat','Feral Drone'], default:['Sump Rat'] },
    2: { residential:['Tunnel Gang','Corp Security'], market:['Tunnel Gang','Corp Security'], gang_turf:['Gang Enforcer','Tunnel Gang'], industrial:['Feral Drone','Gang Enforcer'], tunnel:['Tunnel Gang','Feral Drone'], sump:['Gang Enforcer','Feral Drone'], black_market:['Tunnel Gang','Gang Enforcer'], ruins:['Gang Enforcer','Rogue Synth'], checkpoint:['Corp Security','Gang Enforcer'], corporate:['Corp Security'], default:['Gang Enforcer'] },
    3: { corporate:['Axiom Guard','Corp Security'], lobby:['Axiom Guard','Hunter Drone'], checkpoint:['Corporate Assassin','Axiom Guard'], ruins:['Corporate Assassin','Rogue Synth'], default:['Axiom Guard','Corp Security'] },
    4: { corporate:['Corporate Assassin','Hunter Drone'], lobby:['Corporate Assassin','Hunter Drone'], default:['Corporate Assassin','Hunter Drone','Bounty Hunter'] },
  };
  if (danger === 0) return [];
  const tierPool = pools[Math.min(4, danger)];
  if (typeof tierPool === 'object' && !Array.isArray(tierPool)) {
    if (faction === 'axiom' && (tierPool.corporate || tierPool.default)) return tierPool.corporate || tierPool.default;
    if (faction === 'ironhand' && tierPool.gang_turf) return tierPool.gang_turf;
    if (faction === 'ghosts') return tierPool.ruins || tierPool.default || ['Tunnel Gang'];
    return tierPool[Object.keys(tierPool).find(k => k !== 'default') || 'default'] || tierPool.default || ['Gang Enforcer'];
  }
  return tierPool || ['Gang Enforcer'];
}

// ── SHOP / LOOT DATA (unchanged) ──











// ── CHUNK GENERATOR v2 ──
function generateChunk(cx, cy, layer, playerDist, looted) {
  const rng = mkRng(chunkSeed(cx + layer * 1000, cy + layer * 1000));
  const faction = getFaction(cx, cy);
  const lt = LAYER_TILES[Math.min(3, layer)] || LAYER_TILES[0];

  const layerTypes = LAYER_TYPES[Math.min(3, layer)] || LAYER_TYPES[0];
  let chunkType;

  // ── GUARANTEED EARLY DISCOVERY SPAWNS ──
  // Layer 0: ripper_doc at (2,1), black_market at (-1,2).
  // Layer 1: black_market at (1,1) if not already seen on layer 0.
  // These coordinates are close enough to reach in the first few minutes
  // without being so close they're unavoidable on the opening path.
  const earlyOverrides = {
    '2_1_0':  'ripper_doc',
    '-1_2_0': 'black_market',
    '1_1_1':  'black_market',
  };
  const overrideKey = `${cx}_${cy}_${layer}`;
  if (earlyOverrides[overrideKey]) {
    chunkType = earlyOverrides[overrideKey];
  } else if (playerDist < 2) {
    const safe = layerTypes.filter(t => ['residential','market','tunnel','safehouse'].includes(t));
    chunkType = (safe.length ? safe : layerTypes)[Math.floor(rng() * (safe.length || layerTypes.length))];
  } else {
    chunkType = layerTypes[Math.floor(rng() * layerTypes.length)];
  }
  const cDef = CHUNK_TYPES[chunkType] || CHUNK_TYPES.residential;
  const danger = getDanger(cx, cy, cDef.danger);

  // Grid — start all as outer wall (dim)
  const OUTER = { ...T.WALL_DIM };
  const INNER = { ...lt.WALL };
  const FLOOR = { ...lt.FLOOR };
  const ROAD  = { ...lt.ROAD };
  const ROAD_V = { ...lt.ROAD_V };

  const grid = Array.from({ length: CHUNK_H }, () =>
    Array.from({ length: CHUNK_W }, () => ({ ...OUTER }))
  );

  // Helpers
  const set = (x, y, tile) => { if (y>=0&&y<CHUNK_H&&x>=0&&x<CHUNK_W) grid[y][x] = { ...tile }; };
  const fill = (x1,y1,x2,y2,tile) => {
    for (let y=Math.max(0,y1);y<=Math.min(CHUNK_H-1,y2);y++)
      for (let x=Math.max(0,x1);x<=Math.min(CHUNK_W-1,x2);x++) grid[y][x]={...tile};
  };
  const hLine = (y,x1,x2,tile) => { for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++) set(x,y,tile); };
  const vLine = (x,y1,y2,tile) => { for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++) set(x,y,tile); };
  const isFloor = (x,y) => grid[y]&&grid[y][x]&&grid[y][x].passable;

  // ── LAYOUT GENERATORS ──

  if (['market','residential','gang_turf'].includes(chunkType)) {
    // URBAN: horizontal main street + vertical cross-street + buildings in quadrants
    const streetY = 5 + Math.floor(rng() * 3);
    const streetX = 8 + Math.floor(rng() * 6);
    hLine(streetY, 0, CHUNK_W-1, ROAD);
    vLine(streetX, 0, CHUNK_H-1, ROAD_V);
    // Intersection
    set(streetX, streetY, { ...T.ROAD_X, color: ROAD.color });
    // NW building
    if (streetY > 2 && streetX > 2) {
      fill(1, 1, streetX-1, streetY-1, FLOOR);
      // Windows on north facade
      for (let x=2;x<streetX-1;x+=2) set(x,1,{...T.WINDOW,color:lt.WALL.color+'bb'});
      // Door to street
      set(1+Math.floor((streetX-2)/2), streetY-1, { ...T.DOOR });
      // Inner wall detail
      if (streetX > 6) { hLine(streetY-3, 2, streetX-2, INNER); set(2+Math.floor((streetX-4)/2), streetY-3, FLOOR); }
    }
    // NE building
    if (streetY > 2 && streetX < CHUNK_W-3) {
      fill(streetX+1, 1, CHUNK_W-2, streetY-1, FLOOR);
      for (let x=streetX+2;x<CHUNK_W-1;x+=2) set(x,1,{...T.WINDOW,color:lt.WALL.color+'bb'});
      set(streetX+1+Math.floor((CHUNK_W-streetX-3)/2), streetY-1, { ...T.DOOR });
    }
    // SW building (smaller)
    if (streetY < CHUNK_H-3 && streetX > 3) {
      fill(1, streetY+1, streetX-1, CHUNK_H-2, FLOOR);
      set(2, streetY+1, { ...T.DOOR });
    }
    // SE building
    if (streetY < CHUNK_H-3 && streetX < CHUNK_W-3) {
      fill(streetX+1, streetY+1, CHUNK_W-2, CHUNK_H-2, FLOOR);
      set(streetX+2, streetY+1, { ...T.DOOR });
    }

  } else if (['industrial','tunnel','sump','checkpoint'].includes(chunkType)) {
    // INDUSTRIAL: main horizontal corridor with branching rooms
    const mainY = 5 + Math.floor(rng() * 3);
    hLine(mainY-1, 1, CHUNK_W-2, FLOOR);
    hLine(mainY,   1, CHUNK_W-2, FLOOR);
    // Pipes along ceiling and floor
    for (let x=1;x<CHUNK_W-1;x+=4) set(x,0,{...T.PIPE_H,color:INNER.color+'99'});
    for (let x=3;x<CHUNK_W-1;x+=4) set(x,CHUNK_H-1,{...T.PIPE_V,color:INNER.color+'88'});
    // Side rooms — above and below corridor
    const roomCount = 2 + Math.floor(rng() * 3);
    const usedX = new Set();
    for (let i=0;i<roomCount;i++) {
      let rx;
      for (let attempt=0;attempt<10;attempt++) {
        rx = 2 + Math.floor(rng() * (CHUNK_W - 8));
        if (!usedX.has(rx)) { usedX.add(rx); usedX.add(rx+1); usedX.add(rx+2); break; }
      }
      const rw = 3 + Math.floor(rng() * 5);
      const above = rng() > 0.5;
      if (above && mainY > 3) {
        fill(rx, 1, Math.min(CHUNK_W-2, rx+rw), mainY-2, FLOOR);
        // Door to corridor
        set(rx+1, mainY-1, FLOOR);
      } else if (!above && mainY < CHUNK_H-3) {
        fill(rx, mainY+2, Math.min(CHUNK_W-2, rx+rw), CHUNK_H-2, FLOOR);
        set(rx+1, mainY+1, FLOOR);
      }
    }

  } else if (['corporate','lobby'].includes(chunkType)) {
    // CORPORATE: central corridor, symmetric office grid
    const midY = Math.floor(CHUNK_H/2);
    hLine(midY, 1, CHUNK_W-2, FLOOR);
    hLine(midY-1, 1, CHUNK_W-2, FLOOR);
    // Three offices north
    const offW = Math.floor((CHUNK_W-4) / 3);
    for (let ox=0;ox<3;ox++) {
      const x1 = 1 + ox*(offW+1), x2 = Math.min(CHUNK_W-2, x1+offW-1);
      fill(x1, 1, x2, midY-3, FLOOR);
      // Glass wall facing corridor
      for (let x=x1+1;x<x2;x++) set(x, midY-2, {...T.WINDOW, color: lt.WALL.color+'aa'});
      set(x1+Math.floor(offW/2), midY-2, FLOOR); // gap = door
      set(x1+Math.floor(offW/2), midY-1, FLOOR);
    }
    // Two offices south
    const off2W = Math.floor((CHUNK_W-4) / 2);
    for (let ox=0;ox<2;ox++) {
      const x1 = 1 + ox*(off2W+2), x2 = Math.min(CHUNK_W-2, x1+off2W);
      fill(x1, midY+2, x2, CHUNK_H-2, FLOOR);
      for (let x=x1+1;x<x2;x++) set(x, midY+2, {...T.WINDOW, color: lt.WALL.color+'aa'});
      set(x1+Math.floor(off2W/2), midY+2, FLOOR);
      set(x1+Math.floor(off2W/2), midY+1, FLOOR);
    }

  } else if (['ruins'].includes(chunkType)) {
    // RUINS: open space, internal wall fragments, water pools, debris
    fill(1, 1, CHUNK_W-2, CHUNK_H-2, FLOOR);
    // Scattered wall remnants (simulate collapsed buildings)
    const wallFrags = 3 + Math.floor(rng() * 4);
    for (let f=0;f<wallFrags;f++) {
      const fx = 2 + Math.floor(rng() * (CHUNK_W-5));
      const fy = 2 + Math.floor(rng() * (CHUNK_H-5));
      const fw = 2 + Math.floor(rng() * 4);
      const fh = 1 + Math.floor(rng() * 2);
      // Don't seal off areas — leave gaps
      for (let y=fy;y<=Math.min(CHUNK_H-2,fy+fh);y++)
        for (let x=fx;x<=Math.min(CHUNK_W-2,fx+fw);x++)
          if (x !== fx || y !== fy) set(x,y,INNER); // always open corner
    }
    // Water pools
    const poolCount = 1 + Math.floor(rng() * 3);
    for (let p=0;p<poolCount;p++) {
      const px = 2+Math.floor(rng()*(CHUNK_W-5)), py = 2+Math.floor(rng()*(CHUNK_H-5));
      set(px,py,{...T.WATER}); set(px+1,py,{...T.WATER}); set(px,py+1,{...T.WATER});
    }

  } else if (chunkType === 'safehouse') {
    // SAFEHOUSE: single warm room, entry vestibule
    fill(2, 2, CHUNK_W-3, CHUNK_H-3, FLOOR);
    // Partition creating inner sanctum
    hLine(CHUNK_H-5, 3, CHUNK_W-4, INNER);
    set(5, CHUNK_H-5, FLOOR); // door through partition
    // Entry area
    fill(3, CHUNK_H-4, CHUNK_W-4, CHUNK_H-3, FLOOR);

  } else if (chunkType === 'black_market') {
    // BLACK MARKET: maze of stalls, multiple entry points
    fill(1, 1, CHUNK_W-2, CHUNK_H-2, FLOOR);
    // Stall dividers
    const dividers = [[4,1,4,4],[4,8,4,CHUNK_H-2],[10,4,10,CHUNK_H-2],[16,1,16,5]];
    dividers.forEach(([x1,y1,x2,y2]) => {
      if (x1===x2) vLine(x1,y1,y2,INNER); else hLine(y1,x1,x2,INNER);
      // Always leave a gap
      const mid = x1===x2 ? Math.floor((y1+y2)/2) : Math.floor((x1+x2)/2);
      if (x1===x2) set(x1,mid,FLOOR); else set(mid,y1,FLOOR);
    });

  } else {
    // DEFAULT: open with internal walls
    fill(1, 1, CHUNK_W-2, CHUNK_H-2, FLOOR);
    // One dividing wall
    const wy = 3 + Math.floor(rng() * (CHUNK_H-6));
    hLine(wy, 2, CHUNK_W-3, INNER);
    set(2 + Math.floor(rng()*(CHUNK_W-5)), wy, FLOOR); // gap
  }

  // ── CARDINAL EXITS — 3-tile-wide openings ──
  // This ensures reliable crossing regardless of layout
  const midX = Math.floor(CHUNK_W/2), midY = Math.floor(CHUNK_H/2);
  // North
  [midX-1,midX,midX+1].forEach(x => { set(x,0,FLOOR); set(x,1,FLOOR); });
  // South
  [midX-1,midX,midX+1].forEach(x => { set(x,CHUNK_H-1,FLOOR); set(x,CHUNK_H-2,FLOOR); });
  // West
  [midY-1,midY,midY+1].forEach(y => { set(0,y,FLOOR); set(1,y,FLOOR); });
  // East
  [midY-1,midY,midY+1].forEach(y => { set(CHUNK_W-1,y,FLOOR); set(CHUNK_W-2,y,FLOOR); });

  // ── CONNECTIVITY CHECK ──
  // Flood-fill from centre; connect any isolated floor islands to main body
  const visited = Array.from({length:CHUNK_H},()=>new Array(CHUNK_W).fill(false));
  const q = [];
  // Start from the center — should always be reachable after exits
  const startX = midX, startY = midY;
  if (grid[startY][startX].passable) { q.push([startX,startY]); visited[startY][startX]=true; }
  else { q.push([midX,1]); visited[1][midX]=true; } // fallback
  while (q.length>0) {
    const [cx2,cy2]=q.shift();
    for (const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx=cx2+dx,ny=cy2+dy;
      if (nx<0||nx>=CHUNK_W||ny<0||ny>=CHUNK_H||visited[ny][nx]) continue;
      visited[ny][nx]=true;
      if (grid[ny][nx].passable) q.push([nx,ny]);
    }
  }
  // Find unreachable floor tiles and cut a corridor to nearest reachable floor
  for (let y=1;y<CHUNK_H-1;y++) for (let x=1;x<CHUNK_W-1;x++) {
    if (grid[y][x].passable && !visited[y][x]) {
      // Carve toward center
      let cx2=x,cy2=y;
      let steps=0;
      while (!visited[cy2][cx2]&&steps<CHUNK_W+CHUNK_H) {
        if (Math.abs(cx2-midX)>Math.abs(cy2-midY)) cx2+=(midX>cx2?1:-1);
        else cy2+=(midY>cy2?1:-1);
        set(cx2,cy2,FLOOR); visited[cy2][cx2]=true;
        steps++;
      }
    }
  }

  // ── ENTITY PLACEMENT ──
  // Collect floor tiles, categorised by position (near entrance, interior, wall-adjacent)
  const allFloors=[], nearEntrance=[], interior=[], wallAdj=[];
  for (let y=1;y<CHUNK_H-1;y++) for (let x=1;x<CHUNK_W-1;x++) {
    if (!grid[y][x].passable) continue;
    allFloors.push([x,y]);
    const nearEdge = x<=3||x>=CHUNK_W-4||y<=2||y>=CHUNK_H-3;
    const adjWall = [[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>grid[y+dy]&&grid[y+dy][x+dx]&&!grid[y+dy][x+dx].passable);
    if (nearEdge) nearEntrance.push([x,y]);
    else if (adjWall) wallAdj.push([x,y]);
    else interior.push([x,y]);
  }
  const pickFrom = (pool, fallback) => {
    const p = pool.length>0 ? pool : (fallback||allFloors);
    return p[Math.floor(rng()*p.length)];
  };
  const usedTiles = new Set();
  const chunkKey = `${cx},${cy},${layer}`;
  const place = (tile, meta, entityId, prefPool) => {
    const candidates = (prefPool||allFloors).filter(([x,y])=>!usedTiles.has(`${x},${y}`)&&grid[y][x].passable&&grid[y][x].ch===FLOOR.ch);
    if (!candidates.length) return null;
    const [x,y] = candidates[Math.floor(rng()*candidates.length)];
    if (looted&&entityId&&looted.has(entityId)) return null;
    usedTiles.add(`${x},${y}`);
    set(x,y,{...tile,meta});
    return [x,y];
  };

  const entities=[];

  // Ladder — near a wall, not blocking corridors
  if (layer === 3 || rng()<0.35) {
    const lp=pickFrom(wallAdj,interior);
    if(lp&&grid[lp[1]][lp[0]].passable&&grid[lp[1]][lp[0]].ch===FLOOR.ch){
      usedTiles.add(`${lp[0]},${lp[1]}`);
      set(lp[0],lp[1],{...T.LADDER,meta:{targetLayer:layer===0?(rng()>0.5?1:2):layer===3?2:0}});
    }
  }

  // Sign — on a wall-adjacent tile (makes sense as mounted on wall)
  if(rng()<0.6){
    const msgs=SIGN_MSGS[chunkType]||SIGN_MSGS.residential;
    const sp=pickFrom(wallAdj,allFloors);
    if(sp&&grid[sp[1]][sp[0]].passable){
      usedTiles.add(`${sp[0]},${sp[1]}`);
      set(sp[0],sp[1],{...T.SIGN,meta:{msg:msgs[Math.floor(rng()*msgs.length)]}});
    }
  }

  // Shop — near entrance (people set up near foot traffic)
  if(rng()<cDef.shops){
    const shopId=`shop_${chunkKey}`;
    if(!looted||!looted.has(shopId)){
      const items=shopInventory(chunkType,faction,danger);
      const weapons=weaponStock(chunkType,faction,danger);
      const armor=armorStock(chunkType,danger);
      const vendorDesc=VENDOR_DESC[chunkType]||VENDOR_DESC.default;
      const pos=place(T.SHOP,{items,weapons,armor,vendorDesc,chunkType,faction},shopId,nearEntrance.length?nearEntrance:allFloors);
      if(pos) entities.push({type:'shop',x:pos[0],y:pos[1],data:{items,weapons,armor,vendorDesc,chunkType,faction},id:shopId});
    }
    if(chunkType==='market'&&rng()<0.6){
      const shopId2=`shop2_${chunkKey}`;
      if(!looted||!looted.has(shopId2)){
        const items2=shopInventory(chunkType,faction,danger);
        const pos2=place(T.SHOP,{items:items2,weapons:[],armor:[],vendorDesc:VENDOR_DESC.market,chunkType,faction},shopId2,interior);
        if(pos2) entities.push({type:'shop',x:pos2[0],y:pos2[1],data:{items:items2,weapons:[],armor:[],vendorDesc:VENDOR_DESC.market,chunkType,faction},id:shopId2});
      }
    }
  }

  // Job board — wall-adjacent (like a bulletin board)
  if(rng()<cDef.jobs){
    const jobId_=`job_${chunkKey}`;
    if(!looted||!looted.has(jobId_)){
      const jobs=jobPool(chunkType,faction,danger,null);
      const jobId=jobs[Math.floor(rng()*jobs.length)];
      const pos=place(T.JOB,{jobId,faction,danger,chunkType},jobId_,wallAdj.length?wallAdj:allFloors);
      if(pos) entities.push({type:'job',x:pos[0],y:pos[1],data:{jobId,faction,danger,chunkType},id:jobId_});
    }
  }

  // Terminal — wall-adjacent interior
  if(rng()<cDef.terminals){
    const isVoid=layer===0&&danger>=3&&rng()<0.25;
    const termType=isVoid?'void':faction?'faction':'lore';
    const termId=`term_${chunkKey}`;
    const pos=place(isVoid?T.VOID_NODE:T.TERMINAL,{termType,faction,danger},termId,wallAdj.length?wallAdj:interior);
    if(pos) entities.push({type:'terminal',x:pos[0],y:pos[1],data:{termType,faction,danger},id:termId});
  }

  // Rest spot — interior (you don't rest by the door)
  if(rng()<cDef.rests){
    const restId=`rest_${chunkKey}`;
    const cost=chunkType==='safehouse'?0:danger*40;
    if(!looted||!looted.has(restId)){
      const pos=place(T.REST,{cost},restId,interior.length?interior:allFloors);
      if(pos) entities.push({type:'rest',x:pos[0],y:pos[1],data:{cost},id:restId});
    }
  }

  // Items — scattered through interior and wall-adjacent
  const itemCount=rng()<cDef.items?1+Math.floor(rng()*2):0;
  for(let i=0;i<itemCount;i++){
    const itemEId=`item_${chunkKey}_${i}`;
    if(looted&&looted.has(itemEId)) continue;
    const item=lootTable(danger,rng,chunkType);
    const pool=rng()<0.5?(wallAdj.length?wallAdj:interior):(interior.length?interior:allFloors);
    const pos=place(rng()<0.25?T.STASH:T.ITEM,{item},itemEId,pool);
    if(pos) entities.push({type:'item',x:pos[0],y:pos[1],data:{item},id:itemEId});
  }

  // Faction marker
  if(faction&&rng()<0.25){
    place({...T.FACTION,color:['#00e5ff','#69ff47','#ff5722','#ff4081','#c084fc'][['axiom','ghosts','ironhand','medica','meridian'].indexOf(faction)]||T.FACTION.color},{faction},null,wallAdj);
  }

  // Ripper Doc — only in ripper_doc chunks, single entity, persists (not consumed)
  // ripperType: 'medica' in Medica territory (cy > 3), 'axiom' in Axiom territory (cx > 3),
  // 'standard' elsewhere. Gates bioware/military cyberware catalogues.
  if (chunkType === 'ripper_doc') {
    const ripperId = `ripper_${chunkKey}`;
    const ripperType = cx > 3 ? 'axiom' : cy > 3 ? 'medica' : 'standard';
    const pos = place(T.RIPPER, { chunkType, ripperType }, ripperId, interior.length ? interior : allFloors);
    if (pos) entities.push({ type: 'ripper', x: pos[0], y: pos[1], data: { chunkType, ripperType }, id: ripperId });
  }

  // Net Broker — black_market chunks only. Sells hacking programs and ICE charges.
  // Probability 0.6 — specialist vendor, not always present.
  if (chunkType === 'black_market' && rng() < 0.6) {
    const brokerId = `nb_${chunkKey}`;
    if (!looted || !looted.has(brokerId)) {
      const pos = place(T.NET_BROKER, { chunkType, danger }, brokerId, interior.length ? interior : allFloors);
      if (pos) entities.push({ type: 'net_broker', x: pos[0], y: pos[1], data: { chunkType, danger }, id: brokerId });
    }
  }
  // Secondary broker spawn — tunnel/sump at lower probability. Off-grid zones where
  // unsynced operators work. Capped at danger 2 so only basic programs available.
  if (['tunnel','sump'].includes(chunkType) && rng() < 0.3) {
    const brokerId = `nb_${chunkKey}`;
    if (!looted || !looted.has(brokerId)) {
      const pos = place(T.NET_BROKER, { chunkType, danger: Math.min(danger, 2) }, brokerId, interior.length ? interior : allFloors);
      if (pos) entities.push({ type: 'net_broker', x: pos[0], y: pos[1], data: { chunkType, danger: Math.min(danger, 2) }, id: brokerId });
    }
  }
  const npcChunkTypes = ['safehouse','black_market','market','gang_turf','residential','tunnel','sump','industrial','ruins','corporate'];
  if(npcChunkTypes.includes(chunkType) && rng() < 0.45) {
    const npcId = `npc_${chunkKey}`;
    if(!looted || !looted.has(npcId)) {
      const npcPool = NPC_POOL_BY_CHUNK[chunkType] || NPC_POOL_BY_CHUNK.default;
      const npcKey_ = npcPool[Math.floor(rng() * npcPool.length)];
      const npcColor = { Rusty:'#ff9800', Nadia:'#e040fb', 'Doc Mem':'#69ff47', Aria:'#00e5ff', Kite:'#ffd700', Mara:'#c084fc', Voss:'#ff5722', Petra:'#b085f5', Sable:'#aaaaaa', Hex:'#69ff47', Yuki:'#ff80ab' }[npcKey_] || '#e0c060';
      const pos = place({...T.NPC, color: npcColor}, { npcKey: npcKey_, chunkType }, npcId, interior.length ? interior : allFloors);
      if(pos) entities.push({type:'npc', x:pos[0], y:pos[1], data:{ npcKey: npcKey_, chunkType, danger }, id: npcId });
    }
  }

  // ── CONTEXT-AWARE ATMOSPHERE ──
  // Lights near shops and doors; crates along walls; graffiti on walls; puddles near water
  const atmoTypes=cDef.atmo||[];
  if(atmoTypes.length){
    const atmoCount=3+Math.floor(rng()*5);
    for(let i=0;i<atmoCount;i++){
      const atmo=atmoTypes[Math.floor(rng()*atmoTypes.length)];
      let pool;
      if(atmo==='LIGHT') pool=nearEntrance; // lights near entrances / shops
      else if(atmo==='CRATE'||atmo==='BARREL') pool=wallAdj; // crates against walls
      else if(atmo==='GRAFFITI') pool=wallAdj; // graffiti on wall surfaces
      else if(atmo==='PUDDLE'||atmo==='DEBRIS') pool=interior; // puddles in open space
      else pool=allFloors;
      const candidates=(pool||allFloors).filter(([x,y])=>!usedTiles.has(`${x},${y}`)&&grid[y][x].passable&&grid[y][x].ch===FLOOR.ch);
      if(!candidates.length) continue;
      const [ax,ay]=candidates[Math.floor(rng()*candidates.length)];
      usedTiles.add(`${ax},${ay}`);
      set(ax,ay,{...(T[atmo]||T.FLOOR)});
    }
  }

  return { grid, entities, chunkType, faction, danger, bg:cDef.bg };
}

// ── CHUNK CACHE ──
const chunkCache=new Map();
function getChunk(cx,cy,layer,playerDist,looted){
  const key=`${cx},${cy},${layer}`;
  if(!chunkCache.has(key)){
    if(chunkCache.size>48){const fk=chunkCache.keys().next().value;chunkCache.delete(fk);}
    chunkCache.set(key,generateChunk(cx,cy,layer,playerDist,looted));
  }
  return chunkCache.get(key);
}
function invalidateChunk(cx,cy,layer){chunkCache.delete(`${cx},${cy},${layer}`);}

// ============================================================
// WORLD DATA (enemies, augments, factions, legacy, heist)
// ============================================================
// ── NPC POOL BY CHUNK ──

// ── ARCHETYPE EXPLORATION BONUSES ──
// These activate contextually during exploration (not just combat)
const SAVE_KEY_CHAR   = 'nk_char_save';
const SAVE_KEY_LEGACY = 'nk_legacy_save';

const storageSave = async (key, value) => {
  try { await window.storage.set(key, JSON.stringify(value)); } catch(e) {}
};
const storageLoad = async (key) => {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch(e) { return null; }
};
const storageDelete = async (key) => {
  try { await window.storage.delete(key); } catch(e) {}
};

const saveLegacy = async (l) => {
  try { window._nkLegacy = l; } catch(e) {}
  await storageSave(SAVE_KEY_LEGACY, l);
};

// Map position: {cx, cy, layer, lx, ly} where cx/cy = chunk coords, lx/ly = local tile
const ARCHETYPES = {
  ghost:     { hp:80,  maxHp:80,  strength:8,  accuracy:14, defense:6,  speed:16, hacking:18, charisma:10 },
  soldier:   { hp:120, maxHp:120, strength:18, accuracy:16, defense:12, speed:8,  hacking:4,  charisma:6  },
  netrunner: { hp:60,  maxHp:60,  strength:5,  accuracy:10, defense:4,  speed:10, hacking:22, charisma:8  },
  fixer:     { hp:90,  maxHp:90,  strength:10, accuracy:12, defense:8,  speed:12, hacking:10, charisma:20 },
};

// ============================================================
// NARRATIVE SYSTEM
// ============================================================

// ── BACKSTORIES ──
// Each gives the player a reason to be in Neo-Kairo and a personal
// stake in burning Axiom's surveillance grid.
const BACKSTORIES = {
  debt: {
    id: 'debt',
    label: 'THE DEBT',
    hook: 'Your sister took the Axiom employment contract because the factory collapse left her spine in three pieces and the surgery cost more than she\'d ever earn. The contract required CortexSync installation. Mandatory. Non-negotiable. She said it was fine. She said it didn\'t feel like anything. You\'re not sure she\'s still the one saying it.',
    loss: 'Your sister. Synced and contracted to Axiom. The debt compounds. So does the drift.',
    contact: 'Rusty',
    openingLine: 'You need credits. You need them now. What you need them for is the part that keeps you moving.',
    epilogue: (name) => `The grid goes dark. Every Axiom file. Every debt record. Every firmware update queue.\n\nYou find her in a corridor of the Spire Base clinic, blinking at a terminal that shows zero balance.\n\nShe looks at you for a long time. Something in her face is trying to remember how to be surprised.\n\n"You did this," she says. Not a question.\n\n"Yes."\n\nShe doesn\'t say thank you. She says: "I\'ve been so tired."\n\nYou don\'t know yet how much of her they wrote away. You\'ll find out together.\n\nThat\'s enough to move on.`,
    startingBonus: { credits: 150, extraStim: 1, medicaRep: 10 },
    startingDrawback: null,
    bonusDesc: '+150¢ · +1 MedStim · +10 Medica',
    drawbackDesc: null,
    balanceNote: 'Safe start. The sister\'s medical history means Medica knows you. Extra credits and stim cushion early fights. Recommended for first runs.',
  },
  witness: {
    id: 'witness',
    label: 'THE WITNESS',
    hook: 'You were there when Axiom drones flattened the safehouse. Twelve people. You watched eleven of them stop resisting thirty seconds before the drones arrived — just stop, go still, stand with their hands at their sides. A firmware update rolled across the district that night. The twelfth wasn\'t Synced. They fought until the end. You\'ve never stopped asking what that means.',
    loss: 'Twelve people. Eleven of whom the Sync surrendered before the drones arrived. The footage that proves it.',
    contact: 'Nadia',
    openingLine: 'You still hear the moment the fighting stopped. That\'s the part that doesn\'t leave.',
    epilogue: (name) => `The surveillance grid is gone. The firmware pipeline is gone. Every update queue, every preference log, every change Axiom ever wrote into people who didn\'t know they were being written.\n\nYou upload the footage to seventeen thousand nodes simultaneously.\n\nIt shows twelve people. It shows eleven of them going still.\n\nThis time the world sees what that means.\n\nThis time it stays.`,
    startingBonus: { ghostsRep: 15, hacking: 5, axiomRep: -10 },
    startingDrawback: 'axiom',
    bonusDesc: '+15 Ghost Network · +5 Hacking · Axiom -10',
    drawbackDesc: 'Axiom -10 · You were seen. They noted the footage.',
    balanceNote: 'Ghost Network start and hacking bonus reflect years of carefully encrypting dangerous evidence. Axiom penalty is real but doesn\'t lock the corpo path. Good for information-first runs.',
  },
  exile: {
    id: 'exile',
    label: 'THE EXILE',
    hook: 'You worked in Axiom\'s firmware division. Not security. Not surveillance. You wrote the preference updates — the ones that nudge loyalty, erode dissent, shift what people want in increments small enough to read as personal growth. You were good at it. Then you pulled your own change logs. Saw who you were before they started updating you. Ran.',
    loss: 'Yourself. Or the version you were before Axiom started writing you. You can\'t fully tell the difference anymore.',
    contact: 'Aria',
    openingLine: 'You know exactly what\'s inside the Sync. You helped build it. That\'s what makes you dangerous. That\'s also what you can\'t stop thinking about.',
    epilogue: (name) => `The firmware pipeline burns from the inside.\n\nYou wrote this backdoor yourself, four years ago, in a different life — before you saw your own change logs, before you ran. You kept it because some part of you knew.\n\nThe preference servers go dark one by one.\n\nYou don\'t know how much of who you are now was written by someone else. You\'ve stopped trying to calculate it. What you know is this: the person who built the door also burned it down.\n\nMaybe that\'s enough to call yourself.`,
    startingBonus: { hacking: 8, ghostsRep: 10, axiomRep: -15 },
    startingDrawback: 'axiom',
    bonusDesc: '+8 Hacking · +10 Ghost Network · Axiom -15',
    drawbackDesc: 'Axiom -15 · Known defector. Corp Security is watchful in corporate zones.',
    balanceNote: 'Highest hacking start of any backstory. Axiom penalty is real but doesn\'t close the corpo path — a return to Axiom is possible and interesting. Ghost Network briefly sheltered you. Dual-path viable.',
  },
  ghost: {
    id: 'ghost',
    label: 'THE GHOST',
    hook: 'You had a CortexSync. You had it extracted — black market surgery, a Medica back room, six hours under and six months gone when you came out. It wasn\'t ideology. A job went wrong, something got written into you that shouldn\'t have been, and Doc Mem was the only one who could fix it. You don\'t know if she got everything. You have her bill and a name and a set of skills that came back faster than the memories. You work for whoever covers the debt.',
    loss: 'Six months of memory. Whatever Axiom wrote into you. The certainty that any of what\'s left is entirely yours.',
    contact: 'Doc Mem',
    openingLine: 'You have a name. You have skills. You have a six-month gap and a bill that needs clearing. Move.',
    epilogue: (name) => `The neural architecture files are in there. The change logs. The preference drift data.\n\nYour file is in there.\n\nYou pull it. You read what they wrote into you. You read what they were planning to write next.\n\nYou sit with it for a long time.\n\nThen you delete it.\n\nNot because you\'re done with the question. Because the question belongs to you now, not them.\n\nYou step out into the rain. ${name}.\n\nWhatever that means — it\'s yours.`,
    startingBonus: { speed: 5, medicaRep: 10, ghostThread: true },
    startingDrawback: null,
    bonusDesc: '+5 Speed · +10 Medica · Ghost Thread program',
    drawbackDesc: null,
    balanceNote: 'Neutral mercenary start. Speed and Medica rep reflect the extraction and the debt. Ghost Thread is the hacking safety net — fits someone operating with six months of gaps. Fully path-flexible.',
  },
  corpo: {
    id: 'corpo',
    label: 'THE CORPO',
    hook: 'You rose through Axiom\'s contractor ranks on merit and chrome. Division Seven. Extraction teams, installation security, preference compliance enforcement. You were good at the work and you understood what it was. Eighteen months ago a restructure eliminated your division — not for performance, for politics. You\'re not bitter at the system. You understand the system. You want back in, on your terms this time.',
    loss: 'Your clearance. Your access. The version of yourself that had a place in the machine and knew exactly what they were worth.',
    contact: 'Aria',
    openingLine: 'You know how this city works. You helped build the parts that matter. Now you\'re outside them. That doesn\'t last.',
    epilogue: (name) => `The firmware pipeline is live. Every city on the export list lights up in sequence on the Axiom operations board.\n\nYou watch from the Spire observation level. Division Seven reinstated. Full clearance restored. Better than before — because this time they know what you\'re capable of when they\'re not watching.\n\nNeo-Kairo was the proof of concept. You helped close it.\n\nThe experiment worked. The question of what that means for forty million people in twelve cities is above your clearance level.\n\nYou\'ve learned not to pull your own change logs.\n\nSome things are better not known.`,
    startingBonus: { strength: 5, accuracy: 5, credits: 200, axiomRep: 40, medicaRep: 10, ironhandRep: -15, meridianRep: -30 },
    startingDrawback: 'meridian',
    startingHumanity: 8,
    bonusDesc: '+5 STR · +5 ACC · +200¢ · Axiom +40 · Medica +10',
    drawbackDesc: 'Ironhand -15 · Meridian -30 · Humanity 8 (already modified)',
    balanceNote: 'Axiom path specialist. Military training, corpo savings, and Division Seven connections open the corpo playthrough from turn one. Meridian is hostile — they have your file. Ironhand knows what you represent. Start with two fewer humanity points: the chrome is already there.',
  },
};


// ── STARTING REP PREVIEW ──
// Used in character creation to show rep modifiers before confirming.
// ── ARCHETYPE STARTING REP MODIFIERS (GDD table) ──
const ARCHETYPE_REP_MODS = {
  // Ghost: shadow operator, corridor-runner. Meridian primary (safe passages, safehouses).
  // Ghost Network secondary (share intel, avoid conflict). Ironhand removed — no narrative link.
  ghost:     { axiom:  0, ghosts:  +5, ironhand:  0, medica:  0, meridian: +15 },
  // Soldier: street muscle, fight-first. Ironhand primary (shared working-class identity, street power).
  // Medica secondary (someone has to patch you up). Ghosts and Meridian both distrust blunt instruments.
  soldier:   { axiom:  0, ghosts:  -5, ironhand: +15, medica: +5, meridian:  -5 },
  // Netrunner: information operator. Ghosts primary (same currency: data, access, code).
  // Meridian secondary (protection network for people between factions — fits a rogue hacker).
  // Axiom negative: you hack their infrastructure, they log you. Removes the wrong corp-adjacent signal.
  netrunner: { axiom: -5, ghosts: +15, ironhand:  0, medica:  0, meridian:  +5 },
  // Fixer: diplomatic generalist. Spread across all factions, no primary allegiance.
  // Axiom slight negative: fixers operate in grey markets Axiom wants controlled.
  // Every other faction gets +5 — fixers know everyone, owe everyone a little.
  fixer:     { axiom: -5, ghosts:  +5, ironhand: +5, medica: +5, meridian:  +5 },
};

function getStartingRepPreview(archetypeId, backstoryId, legacyUnlocks) {
  const bs = BACKSTORIES[backstoryId] || BACKSTORIES.debt;
  const archMods = ARCHETYPE_REP_MODS[archetypeId] || {};
  // GDD: base is 0 for all, then apply archetype + backstory modifiers
  const rep = {
    axiom:    0 + (archMods.axiom    || 0),
    ghosts:   0 + (archMods.ghosts   || 0),
    ironhand: 0 + (archMods.ironhand || 0),
    medica:   0 + (archMods.medica   || 0),
    meridian: 0 + (archMods.meridian || 0),
  };
  if (bs.startingBonus.ghostsRep)   rep.ghosts   += bs.startingBonus.ghostsRep;
  if (bs.startingBonus.axiomRep)    rep.axiom    += bs.startingBonus.axiomRep;
  if (bs.startingBonus.meridianRep) rep.meridian += bs.startingBonus.meridianRep;
  if (bs.startingBonus.medicaRep)   rep.medica   += bs.startingBonus.medicaRep;
  if (bs.startingBonus.ironhandRep) rep.ironhand += bs.startingBonus.ironhandRep;
  if ((legacyUnlocks || []).includes('corpo_contact')) rep.axiom  += 20;
  if ((legacyUnlocks || []).includes('ghost_network')) rep.ghosts += 20;
  return rep;
}

// ── RECURRING NPCs ──
  const map = { debt: 'Rusty', witness: 'Nadia', exile: 'Aria', ghost: 'Doc Mem', corpo: 'Aria' };
  return map[backstoryId] || 'Rusty';
};

// ── NARRATIVE EVENT POOL ──
// Non-repeating per run. Pool-based. Some backstory-aware.
// Phase: 'early' (0-4 chunks), 'mid' (5-12), 'late' (12+)
  const visited = (char.visited || []).length;
  const phase = visited < 5 ? 'early' : visited < 14 ? 'mid' : 'late';
  const pool = NARRATIVE_EVENTS[phase] || NARRATIVE_EVENTS.early;
  const available = pool.filter(e => !RUN_EVENTS_SEEN.has(e.id));
  if (!available.length) return null;
  const ev = available[Math.floor(Math.random() * available.length)];
  RUN_EVENTS_SEEN.add(ev.id);
  return ev;
};
      const rep = char.reputation || {};
      const underground = Math.max(rep.ghosts || 0, rep.meridian || 0, rep.ironhand || 0);
      const progress = [
        char.level >= HEIST_REQS.level,
        char.credits >= HEIST_REQS.credits,
        (rep.axiom || 0) <= -25,
        underground >= 60,
      ].filter(Boolean).length;
      return progress >= 3 && !(char.thresholdsSeen||[]).includes('heist_approach');
    },
    aiPrompt: (char) => `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They are close to executing a mission to destroy Axiom Corp's city-wide surveillance grid and CortexSync firmware pipeline. Personal stake: ${BACKSTORIES[char.backstory]?.loss || 'Everything they lost to corporate power.'}. Write 2-3 sentences of first-person internal monologue about being almost ready — the strange feeling of a plan becoming real. Terse. Not triumphant. The weight of what comes next.`,
    fallback: (char) => `You've been building toward this long enough that it stopped feeling like a plan and started feeling like gravity. You're not ready. You don't think ready is a real thing. You go anyway.`,
  },
  // ── MAIN QUEST BEATS ──
  // Beat 1: THE DISCOVERY — personal wound connects to the larger picture
  // Fires after first sidequest completed with backstory contact (jobsDone >= 2, questsDone >= 1)
  discovery: {
    id: 'discovery',
    trigger: (char) => {
      const questDone = (char.questsCompleted || []).length >= 1;
      const jobsDone = (char.jobsDone || 0) >= 2;
      return questDone && jobsDone && !(char.thresholdsSeen||[]).includes('discovery');
    },
    aiPrompt: (char) => {
      const bs = BACKSTORIES[char.backstory] || BACKSTORIES.debt;
      const contactLines = {
        debt: `${char.name}'s contact Rusty just told them something: the employment debt their sister signed isn't a financial contract. It's a firmware compliance agreement. Axiom owns the maintenance schedule for her mind. If she stops servicing the debt, cognitive degradation begins within ninety days.`,
        witness: `${char.name}'s contact Nadia just showed them something: the firmware update that stopped eleven people from fighting that night wasn't a coincidence. It was a targeted suppression package, precision-deployed to a two-block radius. Someone authorised that specifically.`,
        exile: `${char.name}'s contact Aria just confirmed something: the preference modification team ${char.name} used to work on wasn't experimental. It was operational. The update batches are still running. The targets now include Ghost Network contacts, Meridian coordinators, and anyone who's found data discrepancies in the Sync.`,
        ghost: `${char.name}'s contact Doc Mem just told them what she found in the extraction data: what was written into ${char.name} wasn't standard firmware. It was a targeted package. Someone inside Axiom authorised a specific modification for a specific reason. She doesn't know why. She knows it wasn't random.`,
        corpo: `${char.name}'s contact Aria just handed them something: a Division Seven file with their name on it. The restructure that cut their division wasn't budget. It was cleanup. Someone inside Axiom wanted them outside the building before a specific operation launched. She doesn't say which operation. She doesn't have to.`,
      };
      const context = contactLines[char.backstory] || contactLines.debt;
      return `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. ${context} Write 2-3 sentences of first-person internal monologue. The moment the personal becomes political — when they realise their wound isn't isolated, it's a symptom of something much larger and deliberate. Terse. Specific. End on a decision that hasn't been spoken yet.`;
    },
    fallback: (char) => {
      const lines = {
        debt: `The debt isn't money. It's the maintenance contract on her mind. Axiom holds the schedule. Miss three update cycles and she starts to degrade — not as a threat, just as how the hardware works without manufacturer support.

You sit with that for a long time.

Then you decide what kind of run this is.`,
        witness: `The firmware update that stopped eleven people from fighting wasn't a glitch. It was a package. Precision-targeted. Two-block radius. Someone in Axiom wrote that update specifically for that night.

You've been asking what it means for years. Now you know what it means.

Now you have to decide what to do with that.`,
        exile: `The preference modification team you worked on wasn't experimental. It's still running. The targets have expanded. You wrote the architecture for this. You didn't know what it would become.

Maybe you did. That's the part you can't sit with.

You've been running from what you built. You're going to have to turn around.`,
        ghost: `The extraction data shows a targeted modification. Someone authorised a specific package for a specific person. You were that person. The reason isn't in the file.

Six months of memory gone and someone in Axiom knows exactly what they took and why.

You're going to find out what it was.`,
        corpo: `The restructure that cut you loose was cleanup. Someone wanted you outside before something launched. You spent eighteen months thinking it was politics.

It wasn't politics. It was containment.

Someone in Axiom is afraid of what you know. That changes the negotiation.`,
      };
      return lines[char.backstory] || lines.debt;
    },
  },

  // Beat 2: THE COMMITMENT — point of no return, active choice to go after Axiom
  commitment: {
    id: 'commitment',
    trigger: (char) => {
      const rep = char.reputation || {};
      const axiomRep = rep.axiom || 0;
      const isAxiomPath = axiomRep >= 50;
      const isResistancePath = axiomRep <= -40;
      return (isAxiomPath || isResistancePath) &&
        (char.jobsDone || 0) >= 5 &&
        !(char.thresholdsSeen||[]).includes('commitment');
    },
    aiPrompt: (char) => {
      const rep = char.reputation || {};
      const isAxiomPath = (rep.axiom || 0) >= 50;
      if (isAxiomPath) {
        return `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They have been doing Axiom-aligned work — contracts, enforcement, compliance jobs. They've crossed the point where they're a contractor into the point where they're an asset. Axiom has noticed them. Someone in Division Seven has pulled their file. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A runner in the city.'}. Write 2-3 sentences of first-person internal monologue. The moment they commit — not to Axiom ideologically, but to this path specifically. What does it feel like to stop running and start arriving? Terse. Unsentimental. End on what they're trading and what they're getting.`;
      }
      return `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They have made Axiom hostile — done enough damage, crossed enough lines that there's no going back to neutral. Their contact has asked them directly: are you in? Not for a job. For the whole thing. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A runner in the city.'}. Write 2-3 sentences of first-person internal monologue. The moment of active commitment — not because they have to, but because they've decided. What does it cost? What does it clarify? Terse. End on the decision itself.`;
    },
    fallback: (char) => {
      const rep = char.reputation || {};
      const isAxiomPath = (rep.axiom || 0) >= 50;
      if (isAxiomPath) {
        return `Someone in Division Seven pulled your file. You know because the jobs started changing — more specific, higher clearance, better pay. They're not hiring you for a contract. They're assessing whether to bring you back in.

You've been waiting for this.

You make sure they like what they see.`;
      }
      return `Your contact asks once. Not for a job — for the whole thing. You've been working toward this without naming it. Now it has a name.

You say yes before they finish asking.

Some decisions you've already made. You just haven't said them out loud yet.`;
    },
  },

  // Beat 3: THE PLAN — faction contact brings the intelligence that makes the ending possible
  the_plan: {
    id: 'the_plan',
    trigger: (char) => {
      const rep = char.reputation || {};
      const underground = Math.max(rep.ghosts || 0, rep.meridian || 0, rep.ironhand || 0);
      const isAxiomPath = (rep.axiom || 0) >= 70;
      const isResistancePath = underground >= 45 && (rep.axiom || 0) <= -40;
      return (isAxiomPath || isResistancePath) &&
        char.level >= 6 &&
        !(char.thresholdsSeen||[]).includes('the_plan');
    },
    aiPrompt: (char) => {
      const rep = char.reputation || {};
      const isAxiomPath = (rep.axiom || 0) >= 70;
      if (isAxiomPath) {
        return `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They've just been briefed by an Axiom Division Seven handler: Operation Zero Export. The firmware pipeline. The global rollout. The specific role they'll play in securing Neo-Kairo as the proof of concept before export. Personal stake: ${BACKSTORIES[char.backstory]?.loss || 'Everything they gave up to get here.'}. Write 2-3 sentences of first-person internal monologue. Not excitement — the specific feeling of a plan that was always this. The shape of it. What it requires. What it means that they're being trusted with it. End on what they'll need to do that they haven't done yet.`;
      }
      return `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. Their underground contact has just given them the intelligence that makes the operation possible: the location of the firmware pipeline server, the maintenance window, the three-minute gap in Axiom's surveillance rotation. It's real. It's actionable. Personal stake: ${BACKSTORIES[char.backstory]?.loss || 'Everything they lost to corporate power.'}. Write 2-3 sentences of first-person internal monologue. The moment a goal becomes a plan — when abstract intention meets specific possibility. Not triumphant. Weighted. End on what they'll need that they don't have yet.`;
    },
    fallback: (char) => {
      const rep = char.reputation || {};
      const isAxiomPath = (rep.axiom || 0) >= 70;
      if (isAxiomPath) {
        return `Operation Zero Export. They brief you in a clean room in the Spire — no recording, no log. The pipeline. The rollout. Your specific role in making sure the city holds long enough to export.

This is what you came back for.

You don't say that. You listen, take the file, and start calculating what you still need.`;
      }
      return `The pipeline is in the Spire basement. Three-minute window, 0300, during maintenance rotation. Your contact lays it out clean.

For the first time the whole thing is visible from start to finish.

You look at what you have. You look at what you need. You go get the rest.`;
    },
  },

  // Named antagonist — Director Reyes, Division Seven
  // Fires mid-run when Axiom rep crosses -50 OR +60 (she's paying attention either way)
  reyes_notice: {
    id: 'reyes_notice',
    trigger: (char) => {
      const axiomRep = char.reputation?.axiom || 0;
      const noticed = axiomRep <= -50 || axiomRep >= 60;
      return noticed && (char.jobsDone || 0) >= 4 && !(char.thresholdsSeen||[]).includes('reyes_notice');
    },
    aiPrompt: (char) => {
      const isAxiomPath = (char.reputation?.axiom || 0) >= 60;
      if (isAxiomPath) {
        return `You are writing a short intercepted message in Neo-Kairo 2089. Director Reyes, Division Seven, Axiom Corp, has flagged ${char.name} as a person of interest — not as a threat, but as a potential asset. She is precise, unsentimental, and has been running city-level operations for eleven years. Write 2-3 sentences as an internal Axiom memo from Reyes to her handler team. Clipped corporate register. She notes ${char.name}'s recent work, their history, and a single directive. End on something that reveals she has been watching longer than ${char.name} knows.`;
      }
      return `You are writing a short intercepted message in Neo-Kairo 2089. Director Reyes, Division Seven, Axiom Corp, has flagged ${char.name} as a priority threat. She is precise, unsentimental, and has been running city-level operations for eleven years. Write 2-3 sentences as an internal Axiom memo from Reyes to her enforcement team. Clipped corporate register. She identifies ${char.name} by handle, notes their recent actions against Axiom, and gives a single directive. End on something that makes it clear she's been watching longer than ${char.name} knew.`;
    },
    fallback: (char) => {
      const isAxiomPath = (char.reputation?.axiom || 0) >= 60;
      if (isAxiomPath) {
        return `AXIOM INTERNAL — DIVISION SEVEN
FROM: Director Reyes
RE: Asset flagged — ${char.name}

Work history consistent with Division Seven profile. Recommend accelerated access. Note: subject has been in our data since before their last known employer. We've been watching. Now we let them know we're watching.`;
      }
      return `AXIOM INTERNAL — DIVISION SEVEN
FROM: Director Reyes
RE: Priority flag — ${char.name}

Subject has crossed three Axiom operations in eight days. Not random. Recommend active response. Note: we've had eyes on this one since the Ghost Network flagged their extraction. They think they found us. We let them think that.`;
    },
  },

  humanity_5: {
    id: 'humanity_5',
    trigger: (char) => (char.humanity || 10) <= 5 && !(char.thresholdsSeen||[]).includes('humanity_5'),
    aiPrompt: (char) => `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They have reached a point where more than half of their body is chrome — augmented past the point of unremarkable, past the point people stop noticing and start watching. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A ghost with no past.'}. Write 2-3 sentences of first-person present-tense internal monologue. The subject is not the chrome itself — it is the gap between who they were and what they are becoming. What do they notice about themselves that they didn't use to notice? Specific and unsentimental. Cyberpunk noir tone. No clichés.`,
    fallback: (char) => `You catch your reflection in a shop window and run a quick inventory: how much of what you see is still original. The number is smaller than last time you checked. You're not sure when you stopped finding that interesting.`,
  },
  humanity_3: {
    id: 'humanity_3',
    trigger: (char) => (char.humanity || 10) <= 3 && !(char.thresholdsSeen||[]).includes('humanity_3'),
    aiPrompt: (char) => `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They are now mostly chrome — three points of humanity remaining. The question of what it means to be human is no longer abstract. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A ghost with no past.'}. Write 2-3 sentences of first-person present-tense internal monologue about what it feels like to be this far in. Not self-pity — observation. What do they feel that surprises them? What do they no longer feel that they expected to miss? End on something specific. No resolution.`,
    fallback: (char) => `There's a moment sometimes, in the quiet, where you try to locate the part that makes decisions. The part that wanted this. You find the augments. You find the chrome. Somewhere underneath there's still something that knows the difference between choosing and drifting. You hold onto that.`,
  },
  humanity_1: {
    id: 'humanity_1',
    trigger: (char) => (char.humanity || 10) <= 1 && !(char.thresholdsSeen||[]).includes('humanity_1'),
    aiPrompt: (char) => `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They have one point of humanity left. They are almost entirely chrome. The cascade is close. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A ghost with no past.'}. Write 2-3 sentences. Not panic. Not acceptance. The specific, strange experience of being almost gone while still being present enough to notice. What does the last piece of the original self feel like when everything else has been replaced? What is it holding onto, and why? Terse. True. End on an image, not a feeling.`,
    fallback: (char) => `You don't sleep anymore. The chrome doesn't need it. Something in you still reaches for it — some reflex from a body that's mostly not there now. You let it. Whatever's left of you is spending its energy on the run. That's enough. That has to be enough.`,
  },
};

// ── JOB GIVER VOICE ──
// NPCs give jobs. Different from a board. They have a name and an exchange.
  const pool = JOB_GIVER_NAMES[chunkType] || JOB_GIVER_NAMES.default;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ── NAME GENERATOR ──
  const r = Math.random();
  if (r < 0.4) {
    // Compound: prefix + suffix
    return NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)] + NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  } else if (r < 0.7) {
    // Short handle only
    return NAME_HANDLES[Math.floor(Math.random() * NAME_HANDLES.length)];
  } else {
    // Handle + number suffix
    const h = NAME_HANDLES[Math.floor(Math.random() * NAME_HANDLES.length)];
    const n = Math.floor(Math.random() * 9) + 1;
    return h + '-' + n;
  }
};

// ── LOCATION ATMOSPHERE ──
// Replaces generic chunk description with evocative writing per type


function createCharacter(name, archetype, backstoryId) {
  const b = ARCHETYPES[archetype] || ARCHETYPES.ghost;
  const leg = SESSION_LEGACY;
  const backstory = BACKSTORIES[backstoryId] || BACKSTORIES.debt;
  let bonusCredits = 100, bonusHp = 0, bonusHack = 0, bonusSpeed = 0, bonusStr = 0, bonusAcc = 0;
  // All archetypes start with a basic weapon so fists-death doesn't happen
  const archStartWeapons = {
    ghost:     { id:'knife',  name:'Mono Knife',   damage:[8,15],  type:'melee',  value:150, special:'bleed' },
    soldier:   { id:'pipe',   name:'Steel Pipe',   damage:[10,18], type:'melee',  value:80,  special:'stun'  },
    netrunner: { id:'knife',  name:'Mono Knife',   damage:[8,15],  type:'melee',  value:150, special:'bleed' },
    fixer:     { id:'pipe',   name:'Steel Pipe',   damage:[10,18], type:'melee',  value:80,  special:'stun'  },
  };
  let startWeapon = archStartWeapons[archetype] || { id:'pipe', name:'Steel Pipe', damage:[10,18], type:'melee', value:80, special:'stun' };
  // GDD starting rep: base 0, apply archetype mods first, then backstory
  const _archRepMods = ARCHETYPE_REP_MODS[archetype] || {};
  let axiomRep    = 0 + (_archRepMods.axiom    || 0);
  let ghostsRep   = 0 + (_archRepMods.ghosts   || 0);
  let ironhandRep = 0 + (_archRepMods.ironhand || 0);
  let medicaRep   = 0 + (_archRepMods.medica   || 0);
  let meridianRep = 0 + (_archRepMods.meridian || 0);
  const extraItems = [];

  // Backstory bonuses
  if (backstory.startingBonus.credits)     bonusCredits  += backstory.startingBonus.credits;
  if (backstory.startingBonus.ghostsRep)   ghostsRep     += backstory.startingBonus.ghostsRep;
  if (backstory.startingBonus.ironhandRep) ironhandRep   += backstory.startingBonus.ironhandRep;
  if (backstory.startingBonus.hacking)     bonusHack     += backstory.startingBonus.hacking;
  if (backstory.startingBonus.speed)       bonusSpeed    += backstory.startingBonus.speed;
  if (backstory.startingBonus.strength)    bonusStr      += backstory.startingBonus.strength;
  if (backstory.startingBonus.accuracy)    bonusAcc      += backstory.startingBonus.accuracy;
  if (backstory.startingBonus.axiomRep)    axiomRep      += backstory.startingBonus.axiomRep;
  if (backstory.startingBonus.meridianRep) meridianRep   += backstory.startingBonus.meridianRep;
  if (backstory.startingBonus.medicaRep)   medicaRep     += backstory.startingBonus.medicaRep;
  if (backstory.startingBonus.extraStim)   extraItems.push(
    { id:'stim', name:'MedStim', effect:'heal', value:40, price:0, sell:30, desc:'Restores 40 HP.', quantity: backstory.startingBonus.extraStim }
  );
  if (backstory.startingBonus.ghostThread) extraItems.push(
    { id:'ghost_thread_prog', name:'Ghost Thread', effect:'ghost_thread_prog', value:0, price:0, sell:80, desc:'Absorbs your first hack mistake this run. Loaded automatically.', quantity:1 }
  );

  // Legacy bonuses
  if (leg.unlocks.includes('ghost_start'))   bonusCredits += 200;
  if (leg.unlocks.includes('street_wisdom')) extraItems.push({ id:'stim', name:'MedStim', effect:'heal', value:40, price:0, desc:'Restores 40 HP.', quantity:1 });
  if (leg.unlocks.includes('fast_hands'))    startWeapon = { id:'knife', name:'Mono Knife', damage:[8,15], type:'melee', value:150, special:'bleed' };
  if (leg.unlocks.includes('corpo_contact')) axiomRep   += 20;
  if (leg.unlocks.includes('ghost_network')) ghostsRep  += 20;
  if (leg.unlocks.includes('iron_skin'))     bonusHp    += 10;
  if (leg.unlocks.includes('hacker_brain'))  bonusHack  += 5;

  resetNarrativeEvents();
  resetQuests();

  // Netrunner starts with neural_hack pre-installed (already chipped).
  // Humanity cost (2) applies from character creation — humanity starts at 8.
  // Corpo starts with humanity 8 — already modified before the run.
  const startAugments = archetype === 'netrunner' ? ['neural_hack'] : [];
  const startHumanity = backstory.startingHumanity || (archetype === 'netrunner' ? 8 : 10);

  // Ghost Thread: if backstory provides it as item, also load it as a program
  const startPrograms = backstory.startingBonus.ghostThread ? ['ghost_thread'] : [];

  return {
    name, archetype, backstory: backstoryId,
    hp: b.hp + bonusHp, maxHp: b.maxHp + bonusHp,
    strength: b.strength + bonusStr, accuracy: b.accuracy + bonusAcc, defense: b.defense,
    speed: b.speed + bonusSpeed,
    hacking: b.hacking + bonusHack, charisma: b.charisma,
    humanity: startHumanity, level: 1, xp: 0, xpToNext: 100,
    credits: 500 + bonusCredits,
    weapon: startWeapon,
    armor: { id:'none', name:'Street Clothes', defense:0, value:0, special:null },
    augments: startAugments,
    programs: startPrograms,  // purchasable hacking programs (net broker)
    iceCharges: 0,     // ICE consumable charges (bought from net broker)
    inventory: [
      { id:'stim',      name:'MedStim',   effect:'heal',    value:40, price:0, sell:30, desc:'Restores 40 HP.',        quantity:3 },
      { id:'antitoxin', name:'Antitoxin', effect:'cleanse', value:0,  price:0, sell:40, desc:'Clears status effects.', quantity:1 },
      ...extraItems
    ],
    reputation: { axiom: axiomRep, ghosts: ghostsRep, ironhand: ironhandRep, medica: medicaRep, meridian: meridianRep },
    statuses: [], bounty: 0, kills: 0, jobsDone: 0, day: 1, hour: 8, hackBonus: 0, hackCount: 0, stealthActive: false, runLegacyEarned: 0,
    // ── Inhibitor / Mara shop ──
    inhibitorActive: false,
    inhibitorUsed: false,
    maraHealUsed: false,
    clarityActive: false,
    // ── Neuro blocker dependency ──
    neuroblockerActive: false,
    neuroblockerHoursLeft: 12,
    psychosisSlip: 0,      // 0=stable 1=early 2=mid 3=cascade
    lastBlockerHour: 8,
    lastBlockerDay: 1,
    pos: { cx:0, cy:0, layer:0, lx:Math.floor(CHUNK_W/2), ly:Math.floor(CHUNK_H/2) },
    defeated: [], looted: [], visited: [],
    thresholdsSeen: [],
    npcMet: [],
    contactNPC: getNPCForBackstory(backstoryId),
    stashedWeapons: [],
    stashedArmors: [],
    tipsGiven: [],
    visitedRipper: false,
    visitedBroker: false,
    // ── achievement tracking ──
    questsCompleted:    [],   // sidequest ids completed (not failed) this run
    usedBackstoryChoice: false, // used archetype/backstory-specific dialogue path
    reachedLayer3:      false,  // visited the Void
    reachedDanger4:     false,  // survived a danger-4 zone
    layersVisitedArr:   [0],    // layers visited this run
  };
}

// ── SHARED UI ──
const S={
  bg:"#070710",bgCard:"#0c0c1a",bgRaised:"#111125",border:"#1e1e38",
  text:"#b0b0c8",dim:"#7878a0",
  green:"#69ff47",pink:"#e040fb",cyan:"#00e5ff",gold:"#ffd700",
  red:"#ff4444",orange:"#ff9800",font:"'Courier New','Lucida Console',monospace",
};
const btn=(color,bg,bc)=>({
  background:bg||S.bgCard,border:`1px solid ${bc||S.border}`,
  color:color||S.text,fontFamily:S.font,fontSize:14,padding:"0 16px",cursor:"pointer",
  minHeight:48,display:"flex",alignItems:"center",justifyContent:"center",
  WebkitTapHighlightColor:"transparent",userSelect:"none",
});
function Bar({value,max,color,height}){
  const pct=Math.max(0,Math.min(100,(value/max)*100));
  return <div style={{background:"#1a1a30",height:height||6,borderRadius:2,overflow:"hidden"}}>
    <div style={{background:color,width:pct+"%",height:"100%",transition:"width 0.3s"}}/>
  </div>;
}
function Tag({label,color}){
  return <span style={{border:`1px solid ${color}44`,color,fontSize:10,padding:"2px 6px",borderRadius:2,letterSpacing:1,whiteSpace:"nowrap"}}>{label}</span>;
}
function Sheet({open,onClose,title,children}){
  if(!open) return null;
  return <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"#000000bb"}}/>
    <div style={{position:"relative",background:S.bgCard,borderTop:`1px solid ${S.border}`,borderRadius:"16px 16px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:`1px solid ${S.border}`,flexShrink:0}}>
        <span style={{color:S.pink,fontFamily:S.font,fontSize:13,letterSpacing:2}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:S.dim,fontFamily:S.font,fontSize:22,cursor:"pointer",minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{overflowY:"auto",padding:"16px 20px 40px",flex:1}}>{children}</div>
    </div>
  </div>;
}

// ============================================================
// MAP CANVAS — pixel-perfect full-width ASCII renderer
// ============================================================
// Draws the tile grid on a single <canvas>. Font size is derived
// by measuring how wide VIEW_W characters of the monospace font
// actually render at a probe size, then scaling up to fill the
// canvas width exactly. No guesswork on char aspect ratio.
function MapCanvas({ viewRows, width, VIEW_W }) {
  const canvasRef = useRef(null);
  const PROBE_SIZE = 20; // px — used only to measure real char width
  const FONT = S.font;
  const BG = '#08080e';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewRows || viewRows.length === 0 || width < 10) return;
    const ctx = canvas.getContext('2d');

    // 1. Measure actual char width at probe size
    ctx.font = `${PROBE_SIZE}px ${FONT}`;
    const probeW = ctx.measureText('█').width; // widest common tile char
    const charAspect = probeW / PROBE_SIZE;    // actual width/height ratio

    // 2. Derive fontSize so VIEW_W chars exactly fill canvas width
    const fontSize = Math.floor(width / VIEW_W / charAspect);
    const charW = width / VIEW_W;              // exact cell width
    const lineH = Math.round(fontSize * 1.4);  // comfortable line height
    const VIEW_H = viewRows.length;
    const canvasH = lineH * VIEW_H;

    // 3. Set canvas dimensions (clears it)
    canvas.width = width;
    canvas.height = canvasH;

    // 4. Fill background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, canvasH);

    // 5. Draw each tile
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.textBaseline = 'top';

    for (let ry = 0; ry < VIEW_H; ry++) {
      const row = viewRows[ry];
      const y = ry * lineH;
      for (let rx = 0; rx < row.length; rx++) {
        const tile = row[rx];
        const x = rx * charW;

        // Colour logic (mirrors the span version)
        let col;
        if (tile.isPlayer) {
          col = '#ffffff';
        } else if (tile.color) {
          if (tile.distFromPlayer > 2) {
            // Inline dimColor — no function call overhead in tight loop
            const maxDist = Math.floor(VIEW_W / 2) + Math.floor(VIEW_H / 2);
            const brightness = Math.max(0.3, 1 - (tile.distFromPlayer / maxDist) * 0.6);
            const r = parseInt(tile.color.slice(1,3)||'aa', 16);
            const g = parseInt(tile.color.slice(3,5)||'aa', 16);
            const b = parseInt(tile.color.slice(5,7)||'aa', 16);
            col = `rgb(${Math.round(r*brightness)},${Math.round(g*brightness)},${Math.round(b*brightness)})`;
          } else {
            col = tile.label && tile.distFromPlayer <= 3 ? tile.color : tile.color;
          }
        } else {
          col = '#333';
        }

        ctx.fillStyle = col;
        if (tile.isPlayer) ctx.font = `bold ${fontSize}px ${FONT}`;
        // Centre character horizontally in cell
        ctx.fillText(tile.ch, x + (charW - ctx.measureText(tile.ch).width) / 2, y + 1);
        if (tile.isPlayer) ctx.font = `${fontSize}px ${FONT}`;
      }
    }
  }, [viewRows, width, VIEW_W]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />;
}

// ============================================================
// MAP VIEWPORT COMPONENT
// ============================================================
// Renders a 3x3 chunk viewport (66 cols x 39 rows) centred on player
// CHUNK_W=22, CHUNK_H=13 → viewport 66x39

function MapView({ pos, defeated, onInteract, log, char, onUseItem }) {
  const defeatedSet = useMemo(() => new Set(defeated), [defeated]);

  // ── Continuous movement: hold-to-repeat ──
  const holdRef = useRef(null);
  const startHold = (dir) => {
    onInteract(dir);
    holdRef.current = setInterval(() => onInteract(dir), 160);
  };
  const stopHold = () => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
  };
  useEffect(() => () => stopHold(), []);

  // Build viewport: 3x3 chunks
  const viewChunks = useMemo(() => {
    const result = {};
    for (let dcy = -1; dcy <= 1; dcy++) {
      for (let dcx = -1; dcx <= 1; dcx++) {
        const cx = pos.cx + dcx;
        const cy = pos.cy + dcy;
        const dist = Math.abs(cx) + Math.abs(cy);
        result[`${dcx},${dcy}`] = getChunk(cx, cy, pos.layer, dist, defeatedSet);
      }
    }
    return result;
  }, [pos.cx, pos.cy, pos.layer, defeatedSet]);

  // VIEW_W: show more tiles to fill screen width.
  // Original was 19 (~148px at 13px font). 44 tiles × 0.6 aspect × 13px ≈ 343px — fills a 390px screen.
  // The pre element uses overflow:hidden so excess clips cleanly on wider screens.
  const VIEW_W = 44, VIEW_H = 13;
  const halfW = Math.floor(VIEW_W / 2);
  const halfH = Math.floor(VIEW_H / 2);

  const absPlayerX = CHUNK_W + pos.lx;
  const absPlayerY = CHUNK_H + pos.ly;

  // Build flat tile grid
  const flatGrid = useMemo(() => {
    const rows = [];
    for (let gy = 0; gy < 3 * CHUNK_H; gy++) {
      const row = [];
      for (let gx = 0; gx < 3 * CHUNK_W; gx++) {
        const chunkDx = Math.floor(gx / CHUNK_W) - 1;
        const chunkDy = Math.floor(gy / CHUNK_H) - 1;
        const lx = gx % CHUNK_W;
        const ly = gy % CHUNK_H;
        const chunk = viewChunks[`${chunkDx},${chunkDy}`];
        if (!chunk) { row.push({ ...T.WALL_DIM }); continue; }
        const tile = chunk.grid[ly] && chunk.grid[ly][lx] ? chunk.grid[ly][lx] : T.WALL_DIM;
        row.push(tile);
      }
      rows.push(row);
    }
    return rows;
  }, [viewChunks]);

  // Compute visible slice with distance-based dimming
  const viewRows = useMemo(() => {
    const rows = [];
    for (let vy = 0; vy < VIEW_H; vy++) {
      const gy = absPlayerY - halfH + vy;
      const row = [];
      for (let vx = 0; vx < VIEW_W; vx++) {
        const gx = absPlayerX - halfW + vx;
        const isPlayer = (gx === absPlayerX && gy === absPlayerY);
        if (isPlayer) { row.push({ ...T.PLAYER, isPlayer: true, distFromPlayer: 0 }); continue; }
        const tile = (flatGrid[gy] && flatGrid[gy][gx]) ? flatGrid[gy][gx] : T.WALL_DIM;
        const dist = Math.abs(vx - halfW) + Math.abs(vy - halfH);
        row.push({ ...tile, distFromPlayer: dist });
      }
      rows.push(row);
    }
    return rows;
  }, [flatGrid, absPlayerX, absPlayerY]);

  const currentChunk = viewChunks['0,0'];

  const chunkAtmosphere = useMemo(() => {
    if (!currentChunk) return '';
    return getChunkAtmosphere(currentChunk.chunkType);
  }, [pos.cx, pos.cy, pos.layer]);

  const dimColor = (hexColor, dist) => {
    if (dist === 0) return hexColor;
    const maxDist = halfW + halfH;
    const brightness = Math.max(0.3, 1 - (dist / maxDist) * 0.6);
    const r = parseInt(hexColor.slice(1,3)||'aa', 16);
    const g = parseInt(hexColor.slice(3,5)||'aa', 16);
    const b = parseInt(hexColor.slice(5,7)||'aa', 16);
    const dr = Math.round(r * brightness).toString(16).padStart(2,'0');
    const dg = Math.round(g * brightness).toString(16).padStart(2,'0');
    const db = Math.round(b * brightness).toString(16).padStart(2,'0');
    return `#${dr}${dg}${db}`;
  };

  // Quick-action sidebar data
  const healItems = char ? char.inventory.filter(i => i.effect === 'heal') : [];
  const cleanseItems = char ? char.inventory.filter(i => i.effect === 'cleanse') : [];
  const ammoItems = char ? char.inventory.filter(i => i.effect === 'ammo') : [];
  const hasRangedWeapon = char && char.weapon.ammo !== undefined;
  const ammoLow = hasRangedWeapon && char.weapon.ammo <= Math.floor((char.weapon.maxAmmo || 1) * 0.3);
  const hpLow = char && char.hp / char.maxHp < 0.5;
  const hasStatus = char && char.statuses && char.statuses.length > 0;

  const sideBtn = (active, color, urgency) => ({
    background: active ? (urgency ? '#1a0800' : '#07100a') : '#0a0a12',
    border: `1px solid ${active ? (urgency ? color : color + '66') : '#1a1a2a'}`,
    color: active ? color : '#222235',
    fontFamily: S.font, fontSize: 11, borderRadius: 5,
    cursor: active ? 'pointer' : 'default',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 2, padding: '4px 2px',
    WebkitTapHighlightColor: 'transparent',
    minHeight: 48, width: '100%',
    opacity: active ? 1 : 0.3, letterSpacing: 0.5,
  });

  return (
    <div style={{ fontFamily: S.font, userSelect: 'none' }}>
      {/* Chunk info bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#080810', borderBottom: `1px solid ${S.border}`, fontSize: 11, gap: 8 }}>
        <span style={{ color: currentChunk ? (currentChunk.faction ? (WORLD_FACTIONS[currentChunk.faction]?.color || S.cyan) : S.cyan) : S.dim, flexShrink: 0, fontWeight: 'bold', letterSpacing: 1 }}>
          {currentChunk ? currentChunk.chunkType.replace(/_/g,' ').toUpperCase() : '...'}
          {currentChunk?.faction ? ` · ${(WORLD_FACTIONS[currentChunk.faction]?.name||'').toUpperCase()}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {Math.abs(pos.cx) + Math.abs(pos.cy) < 2 && (
            <span style={{ color: S.gold, fontSize: 10, letterSpacing: 1 }}>MOVE TO EXPLORE</span>
          )}
          <span style={{ color: currentChunk?.danger >= 3 ? S.red : currentChunk?.danger >= 2 ? S.orange : S.green, fontSize: 12, fontWeight: 'bold' }}>⚠{currentChunk?.danger || 0}</span>
        </div>
      </div>

      {/* Atmosphere line */}
      {currentChunk && chunkAtmosphere && (
        <div style={{ padding: '5px 12px 6px', background: '#07070f', borderBottom: `1px solid ${S.border}`, fontSize: 11, color: '#7878a0', fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {chunkAtmosphere}
        </div>
      )}

      {/* ASCII map — span-based, overflow hidden, font sized to fill width */}
      <div style={{ background: currentChunk?.bg || S.bg, overflow: 'hidden' }}>
        <pre style={{ margin: 0, padding: '2px 0', fontSize: 'clamp(9px, 3.8vw, 16px)', lineHeight: 1.32, letterSpacing: 0, fontFamily: S.font, whiteSpace: 'pre', overflow: 'hidden' }}>
          {viewRows.map((row, ry) => (
            <div key={ry} style={{ display: 'flex' }}>
              {row.map((tile, rx) => {
                const col = tile.isPlayer ? '#ffffff'
                  : tile.color ? (tile.distFromPlayer > 2 ? dimColor(tile.color, tile.distFromPlayer) : tile.color)
                  : '#333';
                const bright = tile.label && tile.distFromPlayer <= 3 ? tile.color : col;
                return (
                  <span key={rx} style={{ color: bright, fontWeight: tile.isPlayer ? 'bold' : 'normal', flexShrink: 0 }}>
                    {tile.ch}
                  </span>
                );
              })}
            </div>
          ))}
        </pre>
      </div>

      {/* Inline log */}
      <div style={{ borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`, background: '#06060e' }}>
        <div style={{ padding: '5px 10px 3px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#2a2a44', fontSize: 9, letterSpacing: 2 }}>LOG</span>
          <span style={{ color: '#1e1e38', fontSize: 9 }}>full log → LOG tab</span>
        </div>
        <div style={{ padding: '0 10px 8px', maxHeight: 88, overflowY: 'auto' }}>
          {log && log.length === 0 && <div style={{ color: '#1e1e38', fontSize: 11 }}>System online.</div>}
          {log && [...log].slice(-8).reverse().map(l => (
            <div key={l.id} style={{ color: l.color, fontSize: 11, lineHeight: 1.6, borderBottom: `1px solid #0d0d18`, paddingBottom: 2, marginBottom: 2 }}>{l.msg}</div>
          ))}
        </div>
      </div>

      {/* Controls: sidebars + d-pad */}
      <div style={{ background: S.bgCard, borderTop: `1px solid ${S.border}`, padding: '8px 8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* LEFT — heal & cleanse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 52, flexShrink: 0 }}>
          <button disabled={healItems.length === 0} onClick={() => healItems.length > 0 && onUseItem && onUseItem(healItems[0])} style={sideBtn(healItems.length > 0, hpLow ? S.red : S.green, hpLow)}>
            <span style={{ fontSize: 14 }}>💉</span>
            <span>{healItems.length > 0 ? '×' + healItems.reduce((a,i) => a + i.quantity, 0) : '—'}</span>
            <span style={{ fontSize: 11 }}>STIM</span>
          </button>
          <button disabled={cleanseItems.length === 0} onClick={() => cleanseItems.length > 0 && onUseItem && onUseItem(cleanseItems[0])} style={sideBtn(cleanseItems.length > 0, hasStatus ? S.orange : S.cyan, hasStatus)}>
            <span style={{ fontSize: 14 }}>🧪</span>
            <span>{cleanseItems.length > 0 ? '×' + cleanseItems.reduce((a,i) => a + i.quantity, 0) : '—'}</span>
            <span style={{ fontSize: 11 }}>CURE</span>
          </button>
        </div>

        {/* D-PAD */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, width: 150 }}>
            <div/><button
              onPointerDown={() => startHold('N')} onPointerUp={stopHold} onPointerLeave={stopHold}
              style={{ ...btn(S.text, S.bgRaised, S.border), minHeight: 46, fontSize: 22, borderRadius: 7, padding: 0, touchAction: 'none' }}>↑</button><div/>
            <button
              onPointerDown={() => startHold('W')} onPointerUp={stopHold} onPointerLeave={stopHold}
              style={{ ...btn(S.text, S.bgRaised, S.border), minHeight: 46, fontSize: 22, borderRadius: 7, padding: 0, touchAction: 'none' }}>←</button>
            <button onClick={() => onInteract('X')} style={{ ...btn(S.cyan, '#00111a', S.cyan+'66'), minHeight: 46, fontSize: 10, borderRadius: 7, padding: 0, letterSpacing: 1, flexDirection: 'column', gap: 1 }}>
              <span>USE</span>
              <span style={{ fontSize: 10, color: S.dim }}>stand on ◈¢✦</span>
            </button>
            <button
              onPointerDown={() => startHold('E')} onPointerUp={stopHold} onPointerLeave={stopHold}
              style={{ ...btn(S.text, S.bgRaised, S.border), minHeight: 46, fontSize: 22, borderRadius: 7, padding: 0, touchAction: 'none' }}>→</button>
            <div/><button
              onPointerDown={() => startHold('S')} onPointerUp={stopHold} onPointerLeave={stopHold}
              style={{ ...btn(S.text, S.bgRaised, S.border), minHeight: 46, fontSize: 22, borderRadius: 7, padding: 0, touchAction: 'none' }}>↓</button><div/>
          </div>
        </div>

        {/* RIGHT — ammo & gear */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 52, flexShrink: 0 }}>
          <button disabled={!hasRangedWeapon || ammoItems.length === 0} onClick={() => hasRangedWeapon && ammoItems.length > 0 && onUseItem && onUseItem(ammoItems[0])} style={sideBtn(hasRangedWeapon && ammoItems.length > 0, ammoLow ? S.red : S.orange, ammoLow)}>
            <span style={{ fontSize: 14 }}>🔋</span>
            <span style={{ fontSize: 10 }}>{hasRangedWeapon ? char.weapon.ammo + '/' + char.weapon.maxAmmo : '—'}</span>
            <span style={{ fontSize: 11 }}>AMMO</span>
          </button>
          <button onClick={() => onInteract('GEAR')} style={sideBtn(true, S.dim, false)}>
            <span style={{ fontSize: 14 }}>⚙</span>
            <span style={{ fontSize: 11 }}>GEAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
// Quickhack ability definitions — defined outside component to avoid re-creation on render
const QUICKHACKS = [
  { id: 'static_pulse', label: 'Static Pulse',  threshold: 0,  desc: 'Stun 1 round',          validTypes: ['human','machine','program','beast'] },
  { id: 'corrode',      label: 'Corrode',        threshold: 22, desc: '−30% dmg, 3 rounds',       validTypes: ['human','machine'] },
  { id: 'override',     label: 'Override',       threshold: 35, desc: 'Skip enemy turn',        validTypes: ['machine','program'] },
  { id: 'neural_crash', label: 'Neural Crash',   threshold: 45, desc: 'Hack −30% dmg',         validTypes: ['human'] },
  { id: 'sync_spike',   label: 'Sync Spike',     threshold: 55, desc: 'Direct dmg, no armor',   validTypes: ['human','machine','program','beast'], killswitchOverride: true },
];

export default function NeoKairoRPG() {
  const [screen, setScreen]       = useState('title');
  const [char, setChar]           = useState(null);
  const [log, setLog]             = useState([]);
  const [combat, setCombat]       = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [nameInput, setNameInput] = useState(() => generateHandle());
  const [archetype, setArchetype] = useState('ghost');
  const [backstoryInput, setBackstoryInput] = useState('debt');
  const [job, setJob]             = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [nav, setNav]             = useState('map');
  const [sheet, setSheet]         = useState(null);
  const [notif, setNotif]         = useState(null);
  const [musicOn, setMusicOn]     = useState(true);
  const [sfxOn, setSfxOn]         = useState(true);
  const [legacy, setLegacy]       = useState(SESSION_LEGACY);
  const [tileInteract, setTileInteract] = useState(null);
  const [tileMsg, setTileMsg]     = useState('');
  const [combatReady, setCombatReady] = useState(false);
  const [showQuickhackMenu, setShowQuickhackMenu] = useState(false);
  const [savedChar, setSavedChar] = useState(null);
  const [saveIndicator, setSaveIndicator] = useState(null);
  const [firstCombatTipSeen, setFirstCombatTipSeen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [textLarge, setTextLarge] = useState(false);
  const [legacyTab, setLegacyTab] = useState('unlocks');
  // ── HACK MINIGAME STATE ──
  const [hackContext, setHackContext] = useState(null); // active hack session context
  const pendingHackResult  = useRef(null); // stores result during trans_out
  const pendingSidequestHack = useRef(null); // { result, questId, successNext, failNext, sheetData }
  const logRef       = useRef(null);
  const combatLogRef = useRef(null);

  const notify = useCallback((msg, color) => {
    setNotif({ msg, color: color || S.green });
    setTimeout(() => setNotif(null), 2500);
  }, []);
  const addLog = useCallback((msg, color) => {
    setLog(prev => [...prev.slice(-120), { msg, color: color || S.text, id: Date.now() + Math.random() }]);
  }, []);
  const addCombatLog = useCallback((msg, color) => {
    setCombatLog(prev => [...prev.slice(-50), { msg, color: color || S.text, id: Date.now() + Math.random() }]);
  }, []);


  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  useEffect(() => { if (combatLogRef.current) combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight; }, [combatLog]);

  // ── LOAD ON MOUNT ──
  useEffect(() => {
    const loadSaves = async () => {
      const savedLegacy = await storageLoad(SAVE_KEY_LEGACY);
      if (savedLegacy) {
        SESSION_LEGACY = { ...SESSION_LEGACY, ...savedLegacy };
        try { window._nkLegacy = SESSION_LEGACY; } catch(e) {}
        setLegacy(SESSION_LEGACY);
      }
      const savedCharData = await storageLoad(SAVE_KEY_CHAR);
      if (savedCharData) setSavedChar(savedCharData);
    };
    loadSaves();
  }, []);

  // ── AUTO-SAVE ──
  // Fires whenever char changes and a run is active (not dead/null).
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!char) return;
    // Debounce — coalesce rapid state changes (movement, combat) into one write
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await storageSave(SAVE_KEY_CHAR, char);
      const now = new Date();
      setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSaveIndicator('◈ SAVED');
      setTimeout(() => setSaveIndicator(null), 1200);
    }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [char]);

  const initAudio = useCallback(() => { Audio.init(); Audio.resume(); }, []);
  const toggleMusic = useCallback(() => {
    Audio.init(); const next = !musicOn; setMusicOn(next); Audio.setMusicEnabled(next);
  }, [musicOn]);
  const toggleSfx = useCallback(() => {
    Audio.init(); const next = !sfxOn; setSfxOn(next); Audio.setSfxEnabled(next);
  }, [sfxOn]);

  const manualSave = useCallback(async () => {
    if (!char) return;
    await storageSave(SAVE_KEY_CHAR, char);
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSaveIndicator('◈ SAVED');
    setTimeout(() => setSaveIndicator(null), 1200);
  }, [char]);

  const exportSave = useCallback(() => {
    if (!char) return;
    const data = JSON.stringify({ char, legacy: SESSION_LEGACY, exported: new Date().toISOString() });
    navigator.clipboard.writeText(data).then(() => {
      setSaveIndicator('◈ EXPORTED');
      setTimeout(() => setSaveIndicator(null), 2000);
    }).catch(() => {
      setSaveIndicator('! COPY FAILED');
      setTimeout(() => setSaveIndicator(null), 2000);
    });
  }, [char]);

  const importSave = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      if (parsed.char && parsed.char.name) {
        await storageSave(SAVE_KEY_CHAR, parsed.char);
        setSavedChar(parsed.char);
        setShowMenu(false);
        setSaveIndicator('◈ IMPORTED');
        setTimeout(() => setSaveIndicator(null), 2000);
      } else {
        setSaveIndicator('! INVALID SAVE');
        setTimeout(() => setSaveIndicator(null), 2000);
      }
    } catch {
      setSaveIndicator('! IMPORT FAILED');
      setTimeout(() => setSaveIndicator(null), 2000);
    }
  }, []);

  // ── THRESHOLD SCENE CHECK ──
  const [thresholdScene, setThresholdScene] = useState(null);
  const fireThreshold = useCallback(async (sceneId, char) => {
    const scene = THRESHOLD_SCENES[sceneId];
    if (!scene) return;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300,
          messages: [{ role: 'user', content: scene.aiPrompt(char) }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || scene.fallback(char);
      setThresholdScene({ text, sceneId });
      addLog('▸ ' + text, '#9090b8');
    } catch(e) {
      const text = scene.fallback(char);
      setThresholdScene({ text, sceneId });
      addLog('▸ ' + text, '#9090b8');
    }
    setChar(prev => ({ ...prev, thresholdsSeen: [...(prev.thresholdsSeen||[]), sceneId] }));
  }, [addLog]);

  useEffect(() => {
    if (!char || screen !== 'game') return;
    for (const [id, scene] of Object.entries(THRESHOLD_SCENES)) {
      if (scene.trigger(char)) {
        fireThreshold(id, char);
        break; // one at a time
      }
    }
  }, [char && char.pos?.layer, char && Object.values(char.reputation||{}).join(','), char && (char.thresholdsSeen||[]).length, char && (char.humanity||10), char && (char.questsCompleted||[]).length, char && (char.jobsDone||0)]);

  // ── Ghost Thread Gift — Ghost Legend fires once per run ──
  useEffect(() => {
    if (!char || screen !== 'game') return;
    const rep = char.reputation || {};
    if ((rep.ghosts || 0) >= 90
        && !(char.thresholdsSeen||[]).includes('ghost_legend_gift')
        && !(char.programs||[]).includes('ghost_thread')) {
      setChar(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          programs: [...(prev.programs||[]), 'ghost_thread'],
          thresholdsSeen: [...(prev.thresholdsSeen||[]), 'ghost_legend_gift'],
        };
      });
      addLog("◈ A contact leaves a chip at your drop. Ghost Thread installed.", S.green);
    }
    // Axiom/Ironhand/Meridian Legend threshold log notes
    if ((rep.axiom || 0) >= 90 && !(char.thresholdsSeen||[]).includes('axiom_legend_note')) {
      setChar(prev => prev ? { ...prev, thresholdsSeen: [...(prev.thresholdsSeen||[]), 'axiom_legend_note'] } : prev);
      addLog("◈ AXIOM LEGEND: Cortex Relay available at Axiom Ripper Docs.", "#00e5ff");
    }
    if ((rep.ironhand || 0) >= 90 && !(char.thresholdsSeen||[]).includes('ironhand_legend_note')) {
      setChar(prev => prev ? { ...prev, thresholdsSeen: [...(prev.thresholdsSeen||[]), 'ironhand_legend_note'] } : prev);
      addLog("◈ IRONHAND LEGEND: Ironhand contact will find you.", S.orange);
    }
    if ((rep.meridian || 0) >= 90 && !(char.thresholdsSeen||[]).includes('meridian_legend_note')) {
      setChar(prev => prev ? { ...prev, thresholdsSeen: [...(prev.thresholdsSeen||[]), 'meridian_legend_note'] } : prev);
      addLog("◈ MERIDIAN LEGEND: Mara will restore humanity once per run.", '#c084fc');
    }
  }, [char && (char.reputation?.ghosts||0), char && (char.reputation?.axiom||0), char && (char.reputation?.ironhand||0), char && (char.reputation?.meridian||0)]);

  // ── Neuro Blocker dependency — tick on hour advance ──
  // Activates when humanity <= 3. Tracks elapsed time since last dose.
  useEffect(() => {
    if (!char || screen !== 'game') return;
    if ((char.humanity || 10) > 3) return;
    if (!char.neuroblockerActive) return;
    // Compute elapsed in-game hours since last blocker
    const elapsed = ((char.day - (char.lastBlockerDay||1)) * 24) + (char.hour - (char.lastBlockerHour||8));
    if (elapsed < 0) return;
    let newSlip = char.psychosisSlip || 0;
    if (elapsed >= 48 && newSlip < 3) newSlip = 3;
    else if (elapsed >= 24 && newSlip < 2) newSlip = 2;
    else if (elapsed >= 12 && newSlip < 1) newSlip = 1;
    if (newSlip !== (char.psychosisSlip || 0)) {
      setChar(prev => prev ? { ...prev, psychosisSlip: newSlip } : prev);
      const slipMsg = {
        1: "◈ SLIP EARLY: Neuro blocker wearing off. Combat behaviour deteriorating.",
        2: "⚠ SLIP MID: Cognitive narrowing. Some dialogue options have closed.",
        3: "☠ PSYCHOSIS CASCADE: Neuro blocker depleted. The city has you.",
      }[newSlip];
      if (slipMsg) addLog(slipMsg, newSlip >= 2 ? S.red : S.orange);
    }
    // Full cascade — route to psychosis ending
    if (newSlip >= 3) {
      setTimeout(() => setScreen('psychosis'), 1200);
    }
  }, [char && char.hour, char && char.day, char && char.humanity, char && char.neuroblockerActive]);

  const posLayer = char && char.pos ? char.pos.layer : 0;
  const posCx    = char && char.pos ? char.pos.cx : 0;

  // Music by screen + position — use primitives in deps to avoid stale object refs
  useEffect(() => {
    if (!char) return; Audio.init();
    if (screen === 'combat') Audio.playTrack('combat');
    else if (screen === 'game') {
      if (posLayer === 2) Audio.playTrack('spire');
      else if (posLayer === 1) Audio.playTrack('exploration');
      else {
        const dist = Math.abs(posCx) + Math.abs(char.pos.cy || 0);
        if (dist > 6) Audio.playTrack('void');
        else Audio.playTrack('exploration');
      }
    }
  }, [screen, posLayer, posCx]);

  // Advance time
  const advanceTime = useCallback((hours) => {
    setChar(prev => {
      if (!prev) return prev;
      let h = prev.hour + (hours || 1), d = prev.day;
      while (h >= 24) { h -= 24; d++; }
      return { ...prev, hour: h, day: d };
    });
  }, []);

  const getAugBonus = useCallback((c, stat) => {
    return (c.augments || []).reduce((a, id) => {
      const aug = WORLD_AUGMENTS.find(x => x.id === id);
      return a + ((aug && aug.bonus && aug.bonus[stat]) || 0);
    }, 0);
  }, []);

  const hasStatus = useCallback((c, id) => (c.statuses || []).some(s => s.id === id), []);
  const STATUS_DEF = {
    bleeding: { name:'BLEEDING', icon:'🩸', color:'#cc2222', desc:'Lose 8 HP/round.' },
    hacked:   { name:'HACKED',   icon:'⚡', color:'#00e5ff', desc:'-30% stats.' },
    stunned:  { name:'STUNNED',  icon:'★',  color:'#ffd700', desc:'Skip turn.' },
    burning:  { name:'BURNING',  icon:'🔥', color:'#ff6600', desc:'Lose 12 HP/round.' },
    corroded: { name:'CORRODED', icon:'☣',  color:'#88ff00', desc:'-15 defense.' },
  };
  const addStatus = useCallback((c, id, rounds) => {
    if (!STATUS_DEF[id]) return c;
    if ((c.statuses || []).some(s => s.id === id)) return c;
    // pain_suppressor: full immunity to bleed and burn
    if ((c.augments || []).includes('pain_suppressor') && (id === 'bleeding' || id === 'burning')) return c;
    // combat_frame: stun immunity
    if ((c.augments || []).includes('combat_frame') && id === 'stunned') return c;
    // bio_liver (Toxin Metaboliser): corrode duration reduced by 1 round; bleed at 50% duration
    let effectiveRounds = rounds || 3;
    if ((c.augments || []).includes('neural_buffer') && id === 'corroded') effectiveRounds = Math.max(1, effectiveRounds - 1);
    if ((c.augments || []).includes('neural_buffer') && id === 'bleeding') effectiveRounds = Math.max(1, Math.ceil(effectiveRounds * 0.5));
    // bio_marrow (Ossified Marrow Graft): bleed and stun duration -1
    if ((c.augments || []).includes('cultured_muscle') && (id === 'bleeding' || id === 'stunned')) effectiveRounds = Math.max(1, effectiveRounds - 1);
    return { ...c, statuses: [...(c.statuses || []), { id, rounds: effectiveRounds, ...STATUS_DEF[id] }] };
  }, []);
  const tickStatuses = useCallback((c, logFn) => {
    if (!c.statuses || !c.statuses.length) return c;
    let hp = c.hp;
    const lungFilter = c.augments && c.augments.includes('lung_filter');
    const next = c.statuses.map(s => {
      if (s.id === 'bleeding') { const dmg = lungFilter ? 4 : 8;  hp = Math.max(1, hp - dmg);  logFn && logFn('🩸 BLEEDING -' + dmg + ' HP' + (lungFilter ? ' [filtered]' : ''), '#cc2222'); }
      if (s.id === 'burning')  { const dmg = lungFilter ? 6 : 12; hp = Math.max(1, hp - dmg); logFn && logFn('🔥 BURNING -' + dmg + ' HP' + (lungFilter ? ' [filtered]' : ''), '#ff6600'); }
      return { ...s, rounds: s.rounds - 1 };
    }).filter(s => s.rounds > 0);
    return { ...c, hp, statuses: next };
  }, []);

  const checkLevelUp = useCallback((c) => {
    let cur = c;
    while (cur.xp >= cur.xpToNext) {
      const lv = cur.level + 1;
      const newMaxHp = cur.maxHp + 15;
      const charismaGain = cur.archetype === 'fixer' ? 2 : 1;
      addLog('▲ LEVEL ' + lv + '. All stats up.', S.gold);
      cur = { ...cur, level: lv, xp: cur.xp - cur.xpToNext, xpToNext: Math.floor(cur.xpToNext * 1.45),
        maxHp: newMaxHp, hp: Math.min(cur.hp + 15, newMaxHp),
        strength: cur.strength + 2, accuracy: cur.accuracy + 2, defense: cur.defense + 1,
        speed: cur.speed + 1, hacking: cur.hacking + 2, charisma: cur.charisma + charismaGain };
    }
    if (cur.level > c.level) setTimeout(() => { notify('LEVEL UP → LV ' + cur.level + '!', S.gold); Audio.sfxLevelUp(); }, 100);
    return cur;
  }, [notify, addLog]);

  // ── HACK MINIGAME FUNCTIONS ──────────────────────────────────────────────

  // Apply flat reward for low-danger terminals (danger 0-1, layer 0) — no minigame.
  const handleFlatTerminalReward = useCallback((danger, entityId, chunkArchetype) => {
    const isNetrunner = char?.archetype === 'netrunner';
    const base = isNetrunner ? 80 : 40;
    const cortexRelayBonus = (char?.augments || []).includes('cortex_relay') ? 1.15 : 1.0;
    // Axiom rep terminal multiplier: Friendly/Allied/Legend +15%, Unfriendly/Hostile/Enemy -20%
    const axiomRep = char?.reputation?.axiom || 0;
    const axiomTier = getFactionTier(axiomRep);
    const axiomTermMult = (axiomTier.id === 'friendly' || axiomTier.id === 'allied' || axiomTier.id === 'legend') ? 1.15
      : (axiomTier.id === 'unfriendly' || axiomTier.id === 'hostile' || axiomTier.id === 'enemy') ? 0.80 : 1.0;
    const creds = Math.floor((base + danger * 15 + Math.floor(Math.random() * 30)) * cortexRelayBonus * axiomTermMult);
    const xpGain = 5 + danger * 3;
    setChar(prev => {
      if (!prev) return prev;
      let u = { ...prev, credits: prev.credits + creds, xp: prev.xp + xpGain };
      if (prev.archetype === 'netrunner') {
        u = { ...u, hackBonus: Math.min(40, (u.hackBonus || 0) + 15) };
      }
      if (entityId) u = { ...u, looted: [...u.looted, entityId] };
      return u;
    });
    addLog(`⚡ TERMINAL: +${creds}¢  +${xpGain} XP`, S.cyan);
    // Free lore fragment — world data, no hack required
    const lore = pickFreeTerminalLore();
    addLog('◈ ' + lore.text, lore.color);
    if (isNetrunner) addLog('◈ DEEP SCAN: hack prep +15', S.cyan);
  }, [char, addLog]);

  // Launch the hacking minigame for a terminal or sidequest context.
  const triggerHack = useCallback((hackType, origin, danger, layer, entityId, questContext) => {
    if (!char) return;
    const diff = computeHackDifficulty(danger, layer, origin, char.hackBonus || 0);
    if (!diff) {
      // Low-danger: flat reward, skip minigame
      handleFlatTerminalReward(danger, entityId, char?.archetype);
      return;
    }
    // Frequency cap: max 4 terminal minigames per run (GDD "Frequency rule")
    // Sidequest hacks always trigger regardless — they are narrative events
    if (origin === 'terminal' && (char.hackCount || 0) >= 4) {
      handleFlatTerminalReward(danger, entityId, char?.archetype);
      addLog('◈ TERMINAL: data extracted. Neural focus depleted — no more deep hacks this run.', S.dim);
      return;
    }
    setSheet(null); // close any open sheet before entering hack
    // hackBonus >= 40: grant free ICE charge for this hack (spec §3.5)
    const bonusIce = (char.hackBonus || 0) >= 40 ? 1 : 0;
    setHackContext({ hackType, difficulty: diff, origin, entityId, danger, layer, questContext, bonusIce });
    Audio.fadeOutMusic(800);
    hackAudio.init();
    hackAudio.sfxEntry();
    const targetLabel = HACK_DATA[hackType]?.name || 'TARGET';
    const diffLabel = diff.toUpperCase() + ((char.hackBonus || 0) >= 20 ? ' [JAMMED]' : '');
    addLog(`⚡ JACKING IN — ${targetLabel} [${diffLabel}]`, S.cyan);
    setScreen('hack_trans_in');
  }, [char, handleFlatTerminalReward, addLog]);

  // Called by HackScreen onDone — stores result, starts exit transition.
  const handleHackResult = useCallback((result) => {
    hackAudio.stopAmbient();
    // Snapshot hackContext now — it may be stale by the time trans_out completes
    pendingHackResult.current = { ...result, _ctx: hackContext, _archetype: char?.archetype };
    setScreen('hack_trans_out');
  }, [hackContext, char]);

  // Called after exit transition completes — applies result to game state.
  const applyHackResult = useCallback((result) => {
    if (!result) return;
    const ctx = result._ctx || hackContext;
    if (!ctx) return;
    // currentChar archetype read from snapshot to avoid stale closure
    const _archetype = result._archetype || char?.archetype || 'ghost';

    // Always: log the lore intel fragment — even partial on failure/unjack
    if (result.seqHint) {
      const prefix = result.success ? '◈ INTEL: ' : result.unjacked ? '◈ PARTIAL INTEL: ' : '◈ INTERCEPTED SIGNAL: ';
      addLog(prefix + result.seqHint, result.success ? S.cyan : S.dim);
    }

    if (ctx.origin === 'terminal') {
      if (result.success) {
        const base = _archetype === 'netrunner' ? 80 : 40;
        const cortexRelayBonus = (char?.augments || []).includes('cortex_relay') ? 1.15 : 1.0;
        // Axiom rep terminal multiplier: Friendly/Allied/Legend +15%, Unfriendly/Hostile/Enemy -20%
        const _axiomRep = char?.reputation?.axiom || 0;
        const _axiomTierT = getFactionTier(_axiomRep);
        const axiomTermMult = (_axiomTierT.id === 'friendly' || _axiomTierT.id === 'allied' || _axiomTierT.id === 'legend') ? 1.15
          : (_axiomTierT.id === 'unfriendly' || _axiomTierT.id === 'hostile' || _axiomTierT.id === 'enemy') ? 0.80 : 1.0;
        const creds = Math.floor((base + (ctx.danger || 1) * 20 + (result.flawless ? 60 : result.quick ? 30 : 0)) * cortexRelayBonus * axiomTermMult);
        const xpGain = result.flawless ? 40 : result.quick ? 25 : 15;
        setChar(prev => {
          if (!prev) return prev;
          let u = { ...prev, credits: prev.credits + creds, xp: prev.xp + xpGain, hackBonus: 0 };
          if (ctx.entityId) u = { ...u, looted: [...u.looted, ctx.entityId] };
          if (result.flawless) u = { ...u, hackBonus: 20 }; // ghost run pre-loads next hack
          if (result.iceUsed) u = { ...u, iceCharges: Math.max(0, (u.iceCharges || 0) - result.iceUsed) };
          return checkLevelUp(u);
        });
        addLog(`⚡ TERMINAL BREACH: +${creds}¢  +${xpGain} XP`, S.cyan);
        setChar(prev => prev ? { ...prev, hackCount: (prev.hackCount || 0) + 1 } : prev);
        if (result.flawless) {
          addLog('◈ GHOST RUN — trace prep loaded.', S.cyan);
          notify('GHOST RUN — clean breach', S.cyan);
        } else if (result.quick) {
          const bonus = Math.max(30, (ctx.danger || 1) * 30);
          setChar(prev => prev ? { ...prev, credits: prev.credits + bonus } : prev);
          addLog(`◈ QUICK BREACH: +${bonus}¢ bonus`, S.gold);
        }
      } else {
        // Failure: counter-intrusion damage
        if (result.penalty === 'severe') {
          const rawPen = 10 + (ctx.danger || 1) * 5; // danger 1→15, 2→20, 3→25, 4→30
          const pen = Math.min(rawPen, Math.floor((char?.maxHp || 60) * 0.25)); // cap at 25% max HP
          setChar(prev => {
            if (!prev) return prev;
            let u = { ...prev, hp: Math.max(1, prev.hp - pen), hackBonus: 0 };
            if (result.iceUsed) u = { ...u, iceCharges: Math.max(0, (u.iceCharges || 0) - result.iceUsed) };
            return u;
          });
          addLog(`⚡ COUNTER-INTRUSION: ${pen} trace damage`, S.red);
          notify('TRACED — counter-intrusion!', S.red);
          setChar(prev => prev ? { ...prev, hackCount: (prev.hackCount || 0) + 1 } : prev);
        } else if (result.penalty === 'minor') {
          setChar(prev => {
            if (!prev) return prev;
            let u = { ...prev, hackBonus: 0 };
            if (result.iceUsed) u = { ...u, iceCharges: Math.max(0, (u.iceCharges || 0) - result.iceUsed) };
            return u;
          });
          addLog('◈ Jacked out. Partial trace on record.', S.orange);
          if (ctx.origin === 'terminal') setChar(prev => prev ? { ...prev, hackCount: (prev.hackCount || 0) + 1 } : prev);
        }
      }
      Audio.fadeInMusic(1200);
      setHackContext(null);
      setScreen('game');
    }

    else if (ctx.origin === 'sidequest') {
      // Decrement iceCharges for any ICE used during sidequest hack
      if (result.iceUsed) {
        setChar(prev => prev ? { ...prev, iceCharges: Math.max(0, (prev.iceCharges || 0) - result.iceUsed) } : prev);
      }
      const qc = ctx.questContext;
      if (qc) {
        pendingSidequestHack.current = { result, questContext: qc };
        // Navigate to success or fail quest node
        const nextAct = result.success ? qc.successNext : qc.failNext;
        RUN_QUESTS[qc.questId] = { act: nextAct, done: false };
      }
      Audio.fadeInMusic(1200);
      setHackContext(null);
      setScreen('game');
      // Re-open the sidequest sheet with the updated act
      if (qc && qc.sheetData) {
        setTimeout(() => setSheet({ type: 'npc_talk', data: qc.sheetData }), 150);
      }
    }
  }, [hackContext, char, addLog, notify, checkLevelUp]); // char kept for fallback archetype

  // ────────────────────────────────────────────────────────────────────────

  // ── MAP MOVEMENT ──
  // ── ENCOUNTER SYSTEM ──
  // No enemy tiles on map. Encounters trigger probabilistically on movement.
  // Rate by danger: 0=never, 1=2%, 2=5%, 3=9%, 4=15%
  // Modifiers: night +50%, bounty +3% per stack, cooldown 3 moves after any encounter
  const lastEncounterMove = useRef(0);
  const totalMoves = useRef(0);
  const movesSinceHourTick = useRef(0);

  const triggerEncounter = useCallback((danger, chunkType, faction, layer) => {
    if (!char) return false;
    // Stealth Cloak: skip one encounter
    if (char.stealthActive) {
      setChar(prev => ({ ...prev, stealthActive: false }));
      addLog('◈ STEALTH CLOAK: encounter bypassed.', S.green);
      return false;
    }
    // Cooldown check FIRST — before incrementing
    if (totalMoves.current - lastEncounterMove.current < 4) {
      totalMoves.current++;
      return false;
    }

    const ENCOUNTER_BASE = { 0:0.0, 1:0.015, 2:0.038, 3:0.068, 4:0.113 };
    let chance = ENCOUNTER_BASE[Math.min(4, danger)] || 0;
    totalMoves.current++;
    if (chance === 0) return false;

    // ── FACTION ENCOUNTER MODIFIERS ──
    const _rep = char.reputation || {};
    const _axiomTier    = getFactionTier(_rep.axiom    || 0);
    const _ghostsTier   = getFactionTier(_rep.ghosts   || 0);
    const _ironhandTier = getFactionTier(_rep.ironhand || 0);
    const _meridianTier = getFactionTier(_rep.meridian || 0);

    // Meridian Allied/Legend: safehouse encounters impossible
    if ((_meridianTier.id === 'allied' || _meridianTier.id === 'legend') && chunkType === 'safehouse') {
      return false;
    }
    // Meridian Legend: full Undernet escort — no encounters on layer 1
    if (_meridianTier.id === 'legend' && layer === 1) return false;

    // Ghost Allied/Legend: -25% in ruins/tunnel; Legend = no encounters in Undernet
    if ((_ghostsTier.id === 'allied' || _ghostsTier.id === 'legend') && ['ruins','tunnel'].includes(chunkType)) {
      chance *= 0.75;
    }
    if (_ghostsTier.id === 'legend' && layer === 1) return false;

    // Ironhand Allied/Legend: full safe passage in gang/industrial/residential
    if ((_ironhandTier.id === 'allied' || _ironhandTier.id === 'legend') &&
        ['gang_turf','industrial','residential'].includes(chunkType)) {
      return false;
    }
    // Ironhand Friendly: -20% in those zones
    if (_ironhandTier.id === 'friendly' && ['gang_turf','industrial','residential'].includes(chunkType)) {
      chance *= 0.80;
    }
    // Ironhand Hostile/Enemy: +25% in gang/residential
    if ((_ironhandTier.id === 'hostile' || _ironhandTier.id === 'enemy') &&
        ['gang_turf','residential'].includes(chunkType)) {
      chance *= 1.25;
    }

    // Axiom Allied/Legend: corporate and lobby zones safe
    if ((_axiomTier.id === 'allied' || _axiomTier.id === 'legend') &&
        ['corporate','lobby','checkpoint'].includes(chunkType)) {
      return false;
    }
    // Axiom Friendly: -20% in corporate zones
    if (_axiomTier.id === 'friendly' && ['corporate','lobby'].includes(chunkType)) {
      chance *= 0.80;
    }
    // Axiom Hostile/Enemy: +20% in corporate zones (they're actively hunting you)
    if ((_axiomTier.id === 'hostile' || _axiomTier.id === 'enemy') &&
        ['corporate','lobby','checkpoint'].includes(chunkType)) {
      chance *= 1.20;
    }

    // Archetype modifier — Ghost gets reduced encounter rate
    if (char.archetype === 'ghost') chance *= 0.5;

    // Night multiplier (hour 22-6)
    const h = char.hour;
    if (h >= 22 || h < 6) chance *= 1.5;

    // Bounty: replaces normal encounter (not stacked) — if bounty active, check it separately
    const bountyCount = char.bounty || 0;
    // Axiom Enemy tier boosts bounty hunter spawn probability
    const _axiomBountyBoost = (_axiomTier.id === 'enemy') ? 0.06 : (_axiomTier.id === 'hostile') ? 0.03 : 0;
    if (bountyCount > 0 && Math.random() < Math.min(0.25, bountyCount * 0.08 + _axiomBountyBoost)) {
      // Bounty hunter encounter — replaces any normal encounter this tick
      const tmplBH = WORLD_ENEMIES['Bounty Hunter'];
      if (!tmplBH) return false;
      lastEncounterMove.current = totalMoves.current;
      Audio.sfxCombatStart();
      addLog('☠ BOUNTY HUNTER on your trail!', S.red);
      const bhLine = getEnemyEntrance('Bounty Hunter');
      setCombatLog(bhLine ? [{ msg: '◈ ' + bhLine, color: '#8a7a6a', id: Date.now() }] : []);
      setCombat({ enemy: { ...tmplBH, hp: tmplBH.maxHp, name: 'Bounty Hunter' }, turn: 'player', round: 1, enemyId: `encounter_${Date.now()}`, enemyChunk: { cx: char.pos.cx, cy: char.pos.cy, layer: char.pos.layer }, isEncounter: true });
      setCombatReady(false); setTimeout(() => setCombatReady(true), 800);
      setScreen('combat');
      return true;
    }

    if (Math.random() > chance) return false;

    // Pick enemy matching the area
    // Ironhand Hostile/Enemy: gang_turf enemies scale up one danger tier
    const _ironhandE = getFactionTier(_rep.ironhand || 0);
    const effectiveDanger = ((_ironhandE.id === 'hostile' || _ironhandE.id === 'enemy') && chunkType === 'gang_turf')
      ? Math.min(4, danger + 1) : danger;
    const pool = enemyPool(effectiveDanger, faction, layer);
    if (!pool || pool.length === 0) return false;
    const eName = pool[Math.floor(Math.random() * pool.length)];
    const tmpl = WORLD_ENEMIES[eName];
    if (!tmpl) return false;

    lastEncounterMove.current = totalMoves.current;
    Audio.sfxCombatStart();
    const entranceLine = getEnemyEntrance(eName);
    addLog('⚠ ENCOUNTER: ' + eName + '!', S.red);

    // First combat tip — fires once per run
    if (!firstCombatTipSeen) {
      setFirstCombatTipSeen(true);
      const archetypeCombatHint = {
        ghost:     '◈ GHOST: High speed = best flee chance. Use FLEE liberally — you\'re built to vanish. Meridian safehouses are your recovery network.',
        soldier:   '◈ SOLDIER: High HP and strength — hold the line and ATTACK. Ironhand turf is safer for you. Avoid corp zones early.',
        netrunner: '◈ NETRUNNER: QUICKHACK is your edge. Low HP — use stims early. Ghost Network terminals give extra intel. Avoid long fights.',
        fixer:     '◈ FIXER: Balanced but expensive to run. Keep credits up — your charisma discount on stims is only useful if you can afford them.',
      }[char.archetype] || '◈ TIP: ATTACK to fight. FLEE to escape. Use 💉 stims to heal mid-fight.';
      setTimeout(() => {
        addCombatLog('◈ TIP: ATTACK to fight. FLEE to escape (uses speed). Use 💉 stims to heal mid-fight.', '#4a6a4a');
        addCombatLog(archetypeCombatHint, '#3a5a6a');
      }, 100);
    }
    setCombatLog(entranceLine ? [{ msg: '◈ ' + entranceLine, color: '#8a7a6a', id: Date.now() }] : []);

    // Sync Jammer: Synced enemies get -15% damage this encounter. Clear the flag.
    const jammingActive = char.syncJammed && (tmpl.type === 'human' || tmpl.type === 'program');
    if (jammingActive) {
      setChar(prev => ({ ...prev, syncJammed: false }));
      addLog('◈ SYNC JAMMER active — enemy coordination disrupted.', S.cyan);
    }
    const jammedEnemy = jammingActive
      ? { ...tmpl, hp: tmpl.maxHp, name: eName, damage: [Math.floor(tmpl.damage[0]*0.85), Math.floor(tmpl.damage[1]*0.85)], syncJammed: true }
      : { ...tmpl, hp: tmpl.maxHp, name: eName };

    setCombat({
      enemy: jammedEnemy,
      turn: 'player', round: 1,
      enemyId: `encounter_${Date.now()}`,
      enemyChunk: { cx: char.pos.cx, cy: char.pos.cy, layer: char.pos.layer },
      isEncounter: true,
    });
    setCombatReady(false); setTimeout(() => setCombatReady(true), 800);
    setScreen('combat');
    return true;
  }, [char, addLog]);

  const movePlayer = useCallback((dir) => {
    if (!char) return;
    initAudio();
    const { cx, cy, layer, lx, ly } = char.pos;
    let nlx = lx, nly = ly, ncx = cx, ncy = cy;
    if (dir === 'N') nly--;
    if (dir === 'S') nly++;
    if (dir === 'W') nlx--;
    if (dir === 'E') nlx++;

    // Chunk boundary crossing
    if (nlx < 0)        { ncx--; nlx = CHUNK_W - 1; }
    if (nlx >= CHUNK_W) { ncx++; nlx = 0; }
    if (nly < 0)        { ncy--; nly = CHUNK_H - 1; }
    if (nly >= CHUNK_H) { ncy++; nly = 0; }

    const looted = new Set(char.looted || []);
    const dist = Math.abs(ncx) + Math.abs(ncy);
    const chunk = getChunk(ncx, ncy, layer, dist, looted);
    const targetTile = chunk.grid[nly] && chunk.grid[nly][nlx] ? chunk.grid[nly][nlx] : T.WALL_DIM;

    if (!targetTile.passable) return;

    const newPos = { cx: ncx, cy: ncy, layer, lx: nlx, ly: nly };

    // Track visited chunks
    const chunkKey = `${ncx},${ncy},${layer}`;
    const visited = char.visited || [];
    const newVisited = visited.includes(chunkKey) ? visited : [...visited, chunkKey];

    // Faction entry line — fire once per chunk, when first entering a factioned area
    if (!visited.includes(chunkKey) && chunk.faction) {
      const prevChunkKey = `${cx},${cy},${layer}`;
      const prevChunk = getChunk(cx, cy, layer, Math.abs(cx) + Math.abs(cy), new Set(char.looted || []));
      if (prevChunk.faction !== chunk.faction) {
        const factionLine = getFactionEntry(chunk.faction);
        if (factionLine) setTimeout(() => addLog('◈ ' + factionLine, WORLD_FACTIONS[chunk.faction]?.color || '#888899'), 80);
      }
    }

    // Danger warning — fire once per chunk on first entry if danger >= 3
    if (!visited.includes(chunkKey) && chunk.danger >= 3) {
      const dangerWarnings = {
        3: '⚠ HIGH DANGER ZONE — expect heavy resistance. Prepare before engaging.',
        4: '⚠⚠ EXTREME DANGER — this area will kill underprepared runners. Turn back if unsure.',
      };
      const warn = dangerWarnings[Math.min(4, chunk.danger)];
      if (warn) setTimeout(() => addLog(warn, chunk.danger >= 4 ? '#ff2222' : '#ff9800'), 120);
    }

    // Check for interactive entity at target tile
    const entity = chunk.entities.find(e => e.x === nlx && e.y === nly && !looted.has(e.id));

    if (entity) {
      if (entity.type === 'shop') {
        Audio.sfxBuy();
        setSheet({ type: 'shop', data: entity.data, id: entity.id });
        setChar(prev => ({ ...prev, pos: newPos, visited: newVisited }));
        return;
      }
      if (entity.type === 'job') {
        setSheet({ type: 'job_prompt', data: entity.data, id: entity.id });
        setChar(prev => ({ ...prev, pos: newPos, visited: newVisited }));
        return;
      }
      if (entity.type === 'item') {
        const item = entity.data.item;
        Audio.sfxHeal();
        // Soldier force-entry: stash tiles give extra credits + 40% on all credit-value loot
        let soldierBonus = 0;
        if (char.archetype === 'soldier') {
          if (entity.data && entity.data.stash) {
            soldierBonus = 50 + Math.floor(Math.random() * 100);
          }
          if (item.effect === 'credits' && item.value > 0) {
            soldierBonus += Math.floor(item.value * 0.4);
          }
          if (item.effect === 'sell_only' && item.sell > 0) {
            soldierBonus += Math.floor(item.sell * 0.4);
          }
        }
        setChar(prev => {
          const inv = [...prev.inventory];
          const ex = inv.find(i => i.id === item.id);
          if (ex) ex.quantity++; else inv.push({ ...item, quantity: 1 });
          const rawLooted = [...(prev.looted || []), entity.id];
          const newLooted = rawLooted.length > 300 ? rawLooted.slice(-300) : rawLooted;
          return { ...prev, pos: newPos, inventory: inv, looted: newLooted, visited: newVisited, credits: prev.credits + soldierBonus };
        });
        if (soldierBonus > 0) addLog('◈ FORCE ENTRY: +' + soldierBonus + '¢ loot bonus.', S.orange);
        notify('Found: ' + item.name, S.green);
        addLog('✦ Picked up: ' + item.name + '. ' + item.desc, S.green);
        invalidateChunk(ncx, ncy, layer);
        return;
      }
      if (entity.type === 'rest') {
        setSheet({ type: 'rest', data: entity.data, id: entity.id });
        setChar(prev => ({ ...prev, pos: newPos, visited: newVisited }));
        return;
      }
      if (entity.type === 'terminal') {
        const { termType, faction: termFaction } = entity.data;
        if (termType === 'void') {
          setSheet({ type: 'terminal', data: entity.data, id: entity.id });
          setChar(prev => ({ ...prev, pos: newPos, visited: newVisited }));
          return;
        }
        // Use stored danger from entity data; fall back to chunk danger
        const chunkDanger = entity.data.danger !== undefined ? entity.data.danger : (chunk.danger || 1);
        // Route hackType by faction and danger for narrative coherence
        const hackType = layer >= 2 || chunk.chunkType === 'lobby'
          ? 'story'   // Spire Base / lobby = deep conspiracy
          : termFaction === 'axiom' || chunkDanger >= 4
          ? 'story'   // Axiom faction or extreme danger = mainframe-level intel
          : termFaction === 'ironhand'
          ? 'drone'   // Ironhand = patrol routes, kill codes, tactical
          : chunkDanger >= 3
          ? 'story'   // Other high-danger = escalate to story
          : 'terminal'; // Default = corporate intelligence
        setChar(prev => ({ ...prev, pos: newPos, visited: newVisited }));
        triggerHack(hackType, 'terminal', chunkDanger, layer, entity.id, null);
        return;
      }
      if (entity.type === 'npc') {
        setSheet({ type: 'npc_talk', data: entity.data, id: entity.id });
        setChar(prev => ({ ...prev, pos: newPos, visited: newVisited }));
        return;
      }
      if (entity.type === 'ripper') {
        setSheet({ type: 'ripper_doc', data: entity.data, id: entity.id });
        setChar(prev => ({ ...prev, pos: newPos, visited: newVisited, visitedRipper: true }));
        return;
      }
    }

    // Move player — advance time every 25 moves (1 hour per exploration stint)
    movesSinceHourTick.current++;
    if (movesSinceHourTick.current >= 25) {
      movesSinceHourTick.current = 0;
      advanceTime(1);
    }
    setChar(prev => {
      // Nano-Repair Weave: +2 HP per move out of combat
      if (prev.augments && prev.augments.includes('nano_weave') && prev.hp < prev.maxHp) {
        return { ...prev, pos: newPos, visited: newVisited, hp: Math.min(prev.maxHp, prev.hp + 2) };
      }
      return { ...prev, pos: newPos, visited: newVisited };
    });

    // Sign tile
    if (targetTile.ch === T.SIGN.ch && targetTile.meta) {
      notify(targetTile.meta.msg, S.dim);
    }
    // Ladder tile
    if (targetTile.ch === T.LADDER.ch && targetTile.meta) {
      setSheet({ type: 'ladder', data: { targetLayer: targetTile.meta.targetLayer, cx: ncx, cy: ncy } });
    }

    // Probabilistic encounter — check after moving
    if (!sheet) {
      triggerEncounter(chunk.danger, chunk.chunkType, chunk.faction, layer);
    }
    // Track danger-4 visit for achievement
    if (chunk.danger >= 4) {
      setChar(prev => prev.reachedDanger4 ? prev : ({ ...prev, reachedDanger4: true }));
    }

    // Rare narrative event (non-repeating per run)
    if (Math.random() < 0.06) {
      const ev = pickNarrativeEvent(char);
      if (ev) addLog(ev.msg(char), ev.color);
    }

    // Ambient event (very rare)
    if (Math.random() < 0.02) {
      const ev = AMBIENT_EVENTS[Math.floor(Math.random() * AMBIENT_EVENTS.length)];
      addLog('◈ ' + ev.msg, ev.color);
    }
  }, [char, addLog, notify, initAudio, triggerEncounter, sheet]);

  // USE action (interact with tile under player)
  const useAction = useCallback(() => {
    if (!char) return;
    const { cx, cy, layer, lx, ly } = char.pos;
    const looted = new Set(char.looted || []);
    const dist = Math.abs(cx) + Math.abs(cy);
    const chunk = getChunk(cx, cy, layer, dist, looted);
    const entity = chunk.entities.find(e => e.x === lx && e.y === ly && !looted.has(e.id));
    if (entity) {
      if (entity.type === 'shop')    { setSheet({ type: 'shop', data: entity.data, id: entity.id }); return; }
      if (entity.type === 'job')     { setSheet({ type: 'job_prompt', data: entity.data }); return; }
      if (entity.type === 'rest')    { setSheet({ type: 'rest', data: entity.data }); return; }
      if (entity.type === 'terminal'){ setSheet({ type: 'terminal', data: entity.data }); return; }
      if (entity.type === 'npc')     { setSheet({ type: 'npc_talk', data: entity.data, id: entity.id }); return; }
      if (entity.type === 'ripper')  { setChar(prev => ({ ...prev, visitedRipper: true })); setSheet({ type: 'ripper_doc', data: entity.data, id: entity.id }); return; }
      if (entity.type === 'net_broker') {
        setChar(prev => ({ ...prev, visitedBroker: true }));
        setSheet({ type: 'net_broker', data: entity.data, id: entity.id });
        return;
      }
    }
    const tile = chunk.grid[ly] && chunk.grid[ly][lx];
    if (tile && tile.ch === T.SIGN.ch && tile.meta) notify(tile.meta.msg, S.dim);
  }, [char, notify]);

  const handleMapInteract = useCallback((dir) => {
    if (dir === 'X') useAction();
    else movePlayer(dir);
  }, [movePlayer, useAction]);

  // ── REST ACTION ──
  const doRest = useCallback((cost) => {
    if (!char) return;
    // ── FACTION REST MODIFIERS ──
    const _restRep = char.reputation || {};
    const _medicaT  = getFactionTier(_restRep.medica   || 0);
    const _meridianT= getFactionTier(_restRep.meridian || 0);
    // Meridian Friendly: half cost on rest
    let effectiveCost = cost;
    if ((_meridianT.id === 'friendly' || _meridianT.id === 'allied' || _meridianT.id === 'legend') && cost > 0) {
      effectiveCost = Math.floor(cost * 0.5);
    }
    if (effectiveCost > 0 && char.credits < effectiveCost) { notify('Not enough credits. Need ' + effectiveCost + '¢', S.red); return; }
    if (char.hp >= char.maxHp && (char.statuses || []).length === 0) { notify('Already at full health.', S.dim); return; }
    Audio.sfxRest();
    // Medica Allied/Legend in medica zone (cy > 3): full HP restore
    const inMedicaZone = char.pos && char.pos.cy > 3;
    const medicaFullHeal = inMedicaZone && (_medicaT.id === 'allied' || _medicaT.id === 'legend');
    const heal = medicaFullHeal ? char.maxHp : Math.floor(char.maxHp * 0.4);
    setChar(prev => {
      const u = tickStatuses({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal), credits: prev.credits - (effectiveCost || 0) }, addLog);
      return u;
    });
    advanceTime(6); // always costs 6 hours — even free safehouses
    const costNote = effectiveCost > 0 ? ' (-' + effectiveCost + '¢' + (effectiveCost < cost ? ' — Meridian discount' : '') + ')' : '';
    notify('Rested. +' + heal + ' HP' + (medicaFullHeal ? ' — MEDICA ALLIED' : '') + costNote, S.green);
    addLog('⌂ You crash and rest. +' + heal + ' HP.' + (medicaFullHeal ? ' Medica field medic on site.' : ''), S.green);
    setSheet(null);
  }, [char, addLog, advanceTime, notify, tickStatuses]);

  // ── COMBAT ──
  const calcPlayerDmg = useCallback(() => {
    if (!char) return 1;
    const [mn, mx] = char.weapon.damage;
    const accBonus = getAugBonus(char, 'accuracy');
    // Accuracy narrows damage variance — high accuracy means you hit closer to max
    const accFactor = Math.min(1, accBonus / 60); // 0 at 0 acc bonus, 1.0 at +60
    const effectiveMin = Math.floor(mn + (mx - mn) * accFactor * 0.5);
    let dmg = rollDice(effectiveMin, mx);
    dmg = Math.max(1, Math.floor(dmg + getAugBonus(char, 'strength') / 10));
    if (char.weapon.ammo !== undefined && char.weapon.ammo <= 0) dmg = Math.floor(dmg * 0.5); // dry-firing penalty — auto-reload fires first if pack available
    if (hasStatus(char, 'hacked')) dmg = Math.floor(dmg * 0.7);
    // Adrenal Spike: on low HP (<30%), bonus damage
    if (char.augments.includes('adrenal_spike') && char.hp / char.maxHp < 0.3) dmg = Math.floor(dmg * 1.35);
    // bio_adrenal (Chromatin Surge Gland): first 2 rounds in combat get +15% damage
    // combat.round is accessible via closure — handled in playerAttack, not here
    // mil_skeleton (Titanium Combat Rig): melee +20% damage
    if (char.augments.includes('combat_frame') && char.weapon.type === 'melee') dmg = Math.floor(dmg * 1.20);
    // mil_targeting (ARIA-7 Targeting Array): first attack = guaranteed max roll (handled in playerAttack)
    return dmg;
  }, [char, getAugBonus, hasStatus]);

  const calcEnemyDmg = useCallback((enemy) => {
    if (!char || !enemy) return 1;
    const [mn, mx] = enemy.damage;
    let def = char.armor.defense + getAugBonus(char, 'defense');
    if (hasStatus(char, 'corroded')) def = Math.max(0, def - 15);
    let dmg = Math.max(1, rollDice(mn, mx) - Math.floor(def * 0.6));
    // sync_blocker aug: reduces damage from human/program enemies by 15%
    if ((char.augments || []).includes('sync_blocker') && (enemy.type === 'human' || enemy.type === 'program')) {
      dmg = Math.max(1, Math.floor(dmg * 0.85));
    }
    return dmg;
  }, [char, getAugBonus, hasStatus]);

  const handleDeath = useCallback((deadChar) => {
    const earned = (deadChar && deadChar.runLegacyEarned) || 0;
    // Check achievements before updating legacy
    const killedBy = deadChar?._killedBy || null;
    const { newlyEarned, wonArchetypes } = checkAchievements(deadChar || {}, false, killedBy);
    const achPoints = newlyEarned.reduce((sum, id) => {
      const a = ACHIEVEMENTS.find(x => x.id === id); return sum + (a ? a.pts : 0);
    }, 0);
    const existingAch = SESSION_LEGACY.achievements || [];
    const newLeg = {
      ...SESSION_LEGACY,
      points: SESSION_LEGACY.points + earned + achPoints,
      totalRuns: SESSION_LEGACY.totalRuns + 1,
      achievements: [...existingAch, ...newlyEarned],
      wonArchetypes,
      newAchievements: newlyEarned,
      bestRun: SESSION_LEGACY.bestRun
        ? (deadChar.kills > SESSION_LEGACY.bestRun.kills ? { kills: deadChar.kills, level: deadChar.level, day: deadChar.day } : SESSION_LEGACY.bestRun)
        : { kills: deadChar.kills || 0, level: deadChar.level || 1, day: deadChar.day || 1 },
    };
    SESSION_LEGACY = newLeg; saveLegacy(newLeg); setLegacy(newLeg);
    storageDelete(SAVE_KEY_CHAR); setSavedChar(null);
    hackAudio.stopAmbient();
    setCombat(null);
    setHackContext(null);
    pendingHackResult.current = null;
    setScreen('death');
  }, []);

  const resolveKill = useCallback((enemy, enemyId, enemyChunk) => {
    setShowQuickhackMenu(false);
    const xp = enemy.xp, cr = rollDice(enemy.credits[0], enemy.credits[1]);
    const deathLine = getEnemyDeath(enemy.name);
    if (deathLine) addCombatLog('◈ ' + deathLine, '#8a7a6a');
    addCombatLog('✓ ' + enemy.name + ' down! +' + xp + ' XP +' + cr + '¢', S.gold);
    notify('+' + xp + ' XP  +' + cr + '¢', S.gold);
    // Invalidate chunk using passed-in chunk coords (not closure)
    if (enemyChunk) invalidateChunk(enemyChunk.cx, enemyChunk.cy, enemyChunk.layer);
    setChar(prev => {
      const newDefeated = [...prev.defeated, enemyId];
      let u = { ...prev, xp: prev.xp + xp, credits: prev.credits + cr, kills: prev.kills + 1,
        runLegacyEarned: (prev.runLegacyEarned || 0) + Math.floor(xp / 60), defeated: newDefeated };
      return checkLevelUp(u);
    });
    setCombat(null); setScreen('game');
    // Low HP warning on return
    setChar(prev => {
      if (prev && prev.hp / prev.maxHp <= 0.25) setTimeout(() => notify('⚠ LOW HP — find a rest point', S.red), 200);
      return prev;
    });
  }, [addCombatLog, notify, checkLevelUp]);

  const enemyCounter = useCallback((enemy) => {
    if (!enemy) return;
    setShowQuickhackMenu(false); // close menu when enemy acts
    // mil_reflex (Combat Reflex Override): negate first enemy strike once per combat
    // Stored as combat._milReflexUsed to track per-combat usage
    let dmg = calcEnemyDmg(enemy);
    if (char && char.augments && char.augments.includes('reflex_override') && combat && !combat._milReflexUsed && combat.round === 1) {
      setCombat(prev => prev ? { ...prev, _milReflexUsed: true } : null);
      addCombatLog('◈ COMBAT REFLEX OVERRIDE — first strike negated.', S.cyan);
      // Enemy turn still advances but deals 0 damage
      dmg = 0;
    }
    addCombatLog('◄ ' + enemy.name + ' hits: ' + (dmg > 0 ? dmg + ' dmg' : 'NEGATED'), dmg > 0 ? S.red : S.cyan);
    if (dmg > 0) Audio.sfxEnemyHit();
    setChar(prev => {
      let u = { ...prev, hp: Math.max(0, prev.hp - dmg) };
      // Pain Editor aug: reduces chance of status effects landing
      const statusResist = prev.augments.includes('pain_editor') ? 0.5 : 1.0;
      if (enemy.inflicts && Math.random() < (enemy.inflictChance || 0.25) * statusResist) {
        u = addStatus(u, enemy.inflicts, 3);
        addCombatLog('☠ ' + enemy.inflicts.toUpperCase() + ' applied!', S.orange);
      }
      u = tickStatuses(u, addCombatLog);
      // Nano-Repair Weave: +2 HP per combat round
      if (u.augments && u.augments.includes('nano_weave') && u.hp > 0) {
        const regenAmt = Math.min(2, u.maxHp - u.hp);
        if (regenAmt > 0) {
          u = { ...u, hp: u.hp + regenAmt };
          addCombatLog('◈ NANO-REPAIR: +' + regenAmt + ' HP', '#69ff47');
        }
      }
      return u;
    });
    // Check death outside updater to avoid stale closure issues
    setChar(prev => {
      if (prev.hp <= 0) {
        Audio.sfxDeath();
        const dying = { ...prev, _killedBy: enemy.name };
        setTimeout(() => handleDeath(dying), 50);
      }
      return prev;
    });
    // Tick enemy debuff rounds (Corrode, Neural Crash) — restore base damage when expired
    setCombat(prev => {
      if (!prev) return null;
      let updatedEnemy = { ...enemy };
      if (enemy._corrodeRounds !== undefined) {
        const remaining = enemy._corrodeRounds - 1;
        if (remaining <= 0) {
          updatedEnemy = { ...updatedEnemy, damage: enemy._baseDmg || enemy.damage, _corrodeRounds: undefined, _baseDmg: undefined };
          addCombatLog('◈ CORRODE expired — armor restored.', S.dim);
        } else {
          updatedEnemy = { ...updatedEnemy, _corrodeRounds: remaining };
        }
      }
      if (enemy._hackedRounds !== undefined) {
        const remaining = enemy._hackedRounds - 1;
        if (remaining <= 0) {
          updatedEnemy = { ...updatedEnemy, damage: enemy._baseDmg || enemy.damage, _hackedRounds: undefined, _baseDmg: undefined, inflicts: undefined };
          addCombatLog('◈ NEURAL CRASH expired — systems restored.', S.dim);
        } else {
          updatedEnemy = { ...updatedEnemy, _hackedRounds: remaining };
        }
      }
      return { ...prev, enemy: updatedEnemy, turn: 'player', round: prev.round + 1 };
    });
  }, [calcEnemyDmg, addCombatLog, addStatus, tickStatuses, handleDeath]);

  const playerAttack = useCallback(() => {
    if (!combat || combat.turn !== 'player') return;
    if (hasStatus(char, 'stunned')) {
      addCombatLog('★ STUNNED — turn skipped!', S.gold);
      setChar(prev => ({ ...prev, statuses: prev.statuses.map(s => s.id === 'stunned' ? { ...s, rounds: s.rounds - 1 } : s).filter(s => s.rounds > 0) }));
      setCombat(prev => prev ? { ...prev, turn: 'enemy' } : null);
      setTimeout(() => enemyCounter(combat.enemy), 700); return;
    }
    if (char.weapon.ammo !== undefined && char.weapon.ammo > 0) {
      const isLastRound = char.weapon.ammo === 1;
      setChar(prev => {
        const newAmmo = prev.weapon.ammo - 1;
        // Auto-consume ammo pack from inventory when weapon runs dry
        if (newAmmo <= 0) {
          const packIdx = prev.inventory.findIndex(i => i.effect === 'ammo');
          if (packIdx !== -1) {
            const newInv = [...prev.inventory];
            newInv.splice(packIdx, 1);
            setTimeout(() => addCombatLog('◈ Ammo pack auto-loaded.', S.orange), 0);
            return { ...prev, weapon: { ...prev.weapon, ammo: prev.weapon.maxAmmo }, inventory: newInv };
          }
        }
        return { ...prev, weapon: { ...prev.weapon, ammo: newAmmo } };
      });
      if (isLastRound) {
        const hasAmmoPack = char.inventory.some(i => i.effect === 'ammo');
        if (!hasAmmoPack) addCombatLog('⚠ LAST ROUND — no ammo packs remaining', S.orange);
      }
    }
    Audio.sfxAttack();
    // Neural Spike: -1 humanity per use (neural hook-up panel draws on the self)
    if (char.weapon.id === 'neural_spike') {
      setChar(prev => {
        const newHumanity = Math.max(0, (prev.humanity || 10) - 1);
        if (newHumanity === 0) addCombatLog('☠ HUMANITY ZERO — cascade imminent.', '#ff2222');
        else addCombatLog('◈ NEURAL SPIKE — humanity: ' + newHumanity + '/10', '#e040fb');
        return { ...prev, humanity: newHumanity };
      });
    }
    let dmg = calcPlayerDmg();
    // bio_optics: first attack +10% damage
    if (char.augments.includes('bio_optics') && combat.round === 1) {
      dmg = Math.floor(dmg * 1.10);
    }
    // targeting_web: first attack of combat = guaranteed max damage roll
    if (char.augments.includes('targeting_web') && combat.round === 1) {
      const [, mx] = char.weapon.damage;
      const strBonus = Math.max(0, Math.floor(getAugBonus(char, 'strength') / 10));
      dmg = Math.max(dmg, mx + strBonus + (char.augments.includes('combat_frame') && char.weapon.type==='melee' ? Math.floor(mx*0.2) : 0));
    }
    // bio_adrenal: first 2 rounds +15% damage (organic surge gland)
    if (char.augments.includes('synthetic_adrenal') && combat.round <= 2) {
      dmg = Math.floor(dmg * 1.15);
    }
    const newHp = Math.max(0, combat.enemy.hp - dmg);
    // Attack flavor — varies by weapon type and enemy state
    const wpType = char.weapon.type || 'melee';
    const eName = combat.enemy.name;
    const eLow = newHp / (combat.enemy.maxHp || 1) < 0.25;
    const attackFlavors = {
      melee:  eLow ? [`${char.weapon.name} connects. It's staggering.`, `Hard hit — ${eName} is barely standing.`, `${dmg} damage. It won't last much longer.`]
                   : [`${char.weapon.name}: ${dmg}`, `Blade connects — ${dmg} damage.`, `Close range. ${dmg} damage landed.`],
      ranged: eLow ? [`Round hits. ${eName} is almost done.`, `${dmg} damage. One more should end this.`, `${char.weapon.name} — ${dmg}. It's going down.`]
                   : [`${char.weapon.name}: ${dmg}`, `Ranged hit — ${dmg} damage.`, `Shot lands. ${dmg} damage.`],
      tech:   eLow ? [`Neural spike overwhelms it — ${dmg}.`, `${eName} is critically disrupted.`, `${dmg} tech damage. Systems failing.`]
                   : [`Tech hit: ${dmg} damage.`, `${char.weapon.name}: ${dmg}`, `Spike connects — ${dmg} damage.`],
    };
    const flavors = attackFlavors[wpType] || attackFlavors.melee;
    addCombatLog('► ' + flavors[Math.floor(Math.random() * flavors.length)], S.green);
    if (newHp <= 0) { resolveKill(combat.enemy, combat.enemyId, combat.enemyChunk); return; }
    const ue = { ...combat.enemy, hp: newHp };
    setCombat(prev => ({ ...prev, enemy: ue, turn: 'enemy' }));
    setTimeout(() => enemyCounter(ue), 700);
  }, [combat, char, calcPlayerDmg, addCombatLog, resolveKill, enemyCounter, hasStatus]);

  // ── COMBAT QUICKHACKS ─────────────────────────────────────────────────────
  // Combat hacking uses instant quickhacks — not the minigame.
  // The hacking stat determines which abilities are available.
  // Neural Spike weapon gives +15 hacking for quickhack calculations.

  const calcQuickhackStat = useCallback(() => {
    if (!char) return 0;
    const base = char.hacking + getAugBonus(char, 'hacking');
    const weaponBonus = char.weapon?.special === 'hack' ? 15 : 0;
    return base + weaponBonus + (char.hackBonus || 0);
  }, [char, getAugBonus]);



  const playerQuickhack = useCallback((quickhackId) => {
    if (!combat || combat.turn !== 'player') return;
    const hackStat = calcQuickhackStat();
    const qh = QUICKHACKS.find(q => q.id === quickhackId);
    if (!qh) return;
    setShowQuickhackMenu(false);

    const enemyType = combat.enemy.type || 'human';

    if (quickhackId === 'static_pulse') {
      // mil_cortex (Tactical Cortex v3): Static Pulse auto-succeeds at 80%
      const chance = char.augments && char.augments.includes('axiom_killswitch') ? 0.80 : (0.50 + Math.max(0, hackStat - 10) * 0.01);
      if (Math.random() < chance) {
        Audio.sfxHackSuccess();
        addCombatLog(`⚡ STATIC PULSE — ${combat.enemy.name} stunned!`, S.cyan);
        setChar(prev => ({ ...prev, hackBonus: 0 }));
        // Stunned enemy fires but deals 0 damage this turn
        const stunEnemy = { ...combat.enemy, damage: [0, 0] };
        setCombat(prev => prev ? { ...prev, enemy: stunEnemy, turn: 'enemy' } : null);
        setTimeout(() => enemyCounter(stunEnemy), 700);
      } else {
        Audio.sfxHackFail();
        setChar(prev => ({ ...prev, hackBonus: 0 }));
        addCombatLog('⚡ STATIC PULSE — resisted', S.orange);
        setCombat(prev => prev ? { ...prev, turn: 'enemy' } : null);
        setTimeout(() => enemyCounter(combat.enemy), 700);
      }
    }
    else if (quickhackId === 'corrode') {
      Audio.sfxHackSuccess();
      addCombatLog(`⚡ CORRODE — ${combat.enemy.name} armor degraded (-30% dmg, 3 rounds)`, S.cyan);
      setChar(prev => ({ ...prev, hackBonus: 0 }));
      // Store corrode rounds directly on enemy combat state
      const ue = { ...combat.enemy, _corrodeRounds: 3, damage: combat.enemy._baseDmg
        ? [Math.floor(combat.enemy._baseDmg[0] * 0.7), Math.floor(combat.enemy._baseDmg[1] * 0.7)]
        : [Math.floor(combat.enemy.damage[0] * 0.7), Math.floor(combat.enemy.damage[1] * 0.7)],
        _baseDmg: combat.enemy._baseDmg || combat.enemy.damage };
      setCombat(prev => prev ? { ...prev, enemy: ue, turn: 'enemy' } : null);
      setTimeout(() => enemyCounter(ue), 700);
    }
    else if (quickhackId === 'override') {
      const chance = 0.60 + Math.max(0, hackStat - 35) * 0.008;
      if (Math.random() < chance) {
        Audio.sfxHackSuccess();
        addCombatLog(`⚡ OVERRIDE — ${combat.enemy.name} frozen!`, S.cyan);
        setChar(prev => ({ ...prev, hackBonus: 0 }));
        // Enemy skips turn — pass turn back to player
        setCombat(prev => prev ? { ...prev, turn: 'player', round: prev.round + 1 } : null);
      } else {
        Audio.sfxHackFail();
        setChar(prev => ({ ...prev, hackBonus: 0 }));
        addCombatLog('⚡ OVERRIDE — ICE blocked it', S.orange);
        setCombat(prev => prev ? { ...prev, turn: 'enemy' } : null);
        setTimeout(() => enemyCounter(combat.enemy), 700);
      }
    }
    else if (quickhackId === 'neural_crash') {
      Audio.sfxHackSuccess();
      addCombatLog(`⚡ NEURAL CRASH — ${combat.enemy.name} output compromised (-30% dmg, 3 rounds)`, S.cyan);
      setChar(prev => ({ ...prev, hackBonus: 0 }));
      // Apply hacked dmg penalty directly on enemy combat state
      const ue = { ...combat.enemy, _hackedRounds: 3, damage: combat.enemy._baseDmg
        ? [Math.floor(combat.enemy._baseDmg[0] * 0.7), Math.floor(combat.enemy._baseDmg[1] * 0.7)]
        : [Math.floor(combat.enemy.damage[0] * 0.7), Math.floor(combat.enemy.damage[1] * 0.7)],
        _baseDmg: combat.enemy._baseDmg || combat.enemy.damage,
        inflicts: 'hacked' };
      setCombat(prev => prev ? { ...prev, enemy: ue, turn: 'enemy' } : null);
      setTimeout(() => enemyCounter(ue), 700);
    }
    else if (quickhackId === 'sync_spike') {
      Audio.sfxHackSuccess();
      const dmg = Math.max(10, Math.floor(hackStat * 0.8));
      const newHp = Math.max(0, combat.enemy.hp - dmg);
      addCombatLog(`⚡ SYNC SPIKE — ${dmg} neural dmg (ignores armor)`, S.cyan);
      setChar(prev => ({ ...prev, hackBonus: 0 }));
      if (newHp <= 0) { resolveKill(combat.enemy, combat.enemyId, combat.enemyChunk); return; }
      const ue = { ...combat.enemy, hp: newHp };
      setCombat(prev => prev ? { ...prev, enemy: ue, turn: 'enemy' } : null);
      setTimeout(() => enemyCounter(ue), 700);
    }
  }, [combat, char, calcQuickhackStat, addCombatLog, resolveKill, enemyCounter, addStatus]);

  const openQuickhackMenu = useCallback(() => {
    if (!combat || combat.turn !== 'player') return;
    setShowQuickhackMenu(prev => !prev);
  }, [combat]);

  const playerFlee = useCallback(() => {
    if (!combat) return;
    const rawFlee = (char.speed + getAugBonus(char, 'speed')) / 60;
    // mil_reflex: Combat Reflex Override raises flee floor to 50%
    const milReflexFloor = char.augments && char.augments.includes('reflex_override') ? 0.50 : (char.archetype === 'soldier' ? 0.25 : 0);
    const fleeChance = Math.min(0.85, Math.max(milReflexFloor, rawFlee));
    if (Math.random() < fleeChance) {
      Audio.sfxFlee();
      addCombatLog('◌ Escaped into the dark.', S.green);
      setShowQuickhackMenu(false);
      setCombat(null); setScreen('game');
    } else {
      const dmg = calcEnemyDmg(combat.enemy);
      addCombatLog('✗ No escape — ' + dmg + ' dmg. (' + Math.round(fleeChance * 100) + '% chance)', S.red);
      Audio.sfxEnemyHit();
      setChar(prev => {
        const u = { ...prev, hp: prev.hp - dmg };
        return u;
      });
      setChar(prev => { if (prev.hp <= 0) { Audio.sfxDeath(); setTimeout(() => handleDeath(prev), 50); } return prev; });
      setCombat(prev => prev ? { ...prev, turn: 'player', round: prev.round + 1 } : null);
    }
  }, [char, combat, getAugBonus, calcEnemyDmg, addCombatLog, handleDeath]);

  const useItemCombat = useCallback((item) => {
    Audio.sfxHeal();
    setChar(prev => {
      let u = { ...prev };
      if (item.effect === 'heal') u = { ...u, hp: Math.min(u.maxHp, u.hp + item.value) };
      if (item.effect === 'cleanse') u = { ...u, statuses: [] };
      const inv = u.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
      return { ...u, inventory: inv };
    });
    addCombatLog('💉 ' + item.name + (item.effect === 'heal' ? ': +' + item.value + ' HP' : ': status cleared'), S.green);
  }, [addCombatLog]);

  // ── JOBS ──
  const takeJob = useCallback(async (jobId, faction, danger, entityId) => {
    setAiThinking(true); setSheet(null);
    // Mark job board as looted so it disappears from map
    if (entityId) {
      setChar(prev => {
        const newLooted = [...(prev.looted || []), entityId];
        invalidateChunk(prev.pos.cx, prev.pos.cy, prev.pos.layer);
        return { ...prev, looted: newLooted };
      });
    }
    const descs = {
      smuggle_meds:'Smuggle black market meds past a checkpoint',find_missing_kid:'Find a missing child near the sump tunnels',
      enforce_contract:'Enforce an Axiom compliance contract on a non-cooperative subject',secure_installation:'Secure an Axiom installation against Ghost Network intrusion',deliver_firmware:'Courier a firmware update package to an Axiom relay station',extract_dissident:'Extract a person of interest to Axiom from a Meridian safehouse',axiom_extraction_op:'Execute a high-value Axiom extraction operation in hostile territory',
      tag_corporate_pipes:'Tag corporate surveillance hardware',extract_data:'Extract data from a corpo terminal',
      bodyguard_run:'Escort a contact through hostile territory',find_corpo_rat:'Expose a corporate informant',
      infiltrate_axiom:'Infiltrate Axiom Corp security',steal_blueprint:'Steal a weapons blueprint from Axiom',
      assassinate_exec:'Eliminate a mid-level Axiom executive',crack_axiom_vault:'Crack Axiom digital vault from cyberspace',
      erase_identity:'Erase someone identity from all records',steal_ai_core:'Extract a trapped AI from corporate servers',
    };
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:500,
          messages:[{ role:'user', content: 'Cyberpunk RPG job briefing for Neo-Kairo 2089.\nChar: '+char.name+' LV'+char.level+' '+char.archetype+(faction?' in '+faction+' territory':'')+'.\nJob: '+(descs[jobId]||jobId)+'\nDanger: '+danger+'/4\n\n2-3 sentences hardboiled noir. Then:\nCHOICE:[one-line dilemma]\nOPTION_A:[label]:[outcome]:[+0 to +200]:[faction:+/-n or none]\nOPTION_B:[label]:[outcome]:[-100 to 0]:[faction:+/-n or none]\nREWARD:[200-900]\nXP:[80-350]\nFACTION:name:[+/-n]' }] }),
      });
      const data = await res.json();
      const text = (data.content && data.content.find(b => b.type === 'text')?.text) || '';
      const reward   = parseInt((text.match(/REWARD:(\d+)/) || [])[1]) || 300 + danger * 80;
      const xpReward = parseInt((text.match(/XP:(\d+)/)     || [])[1]) || 100 + danger * 30;
      const fm = text.match(/FACTION:(\w+):([-+]\d+)/);
      const briefing = text.split(/CHOICE:|REWARD:|XP:|FACTION:/)[0].trim();
      const choiceM = text.match(/CHOICE:(.+)/);
      const optA = text.match(/OPTION_A:([^:]+):([^:]+):([-+\d]+):([^\n]+)/);
      const optB = text.match(/OPTION_B:([^:]+):([^:]+):([-+\d]+):([^\n]+)/);
      const choice = choiceM && optA && optB ? {
        prompt: choiceM[1].trim(),
        a: { label: optA[1].trim(), outcome: optA[2].trim(), modifier: parseInt(optA[3]), faction: optA[4].trim() },
        b: { label: optB[1].trim(), outcome: optB[2].trim(), modifier: parseInt(optB[3]), faction: optB[4].trim() },
      } : null;
      setJob({ jobId, briefing, reward, xpReward, factionId: fm?fm[1]:null, factionChange: fm?parseInt(fm[2]):0, choice, choiceResolved: null });
    } catch(e) {
      setJob({ jobId, briefing:'Another run. The client wants it clean. No traces. Get in, do the work, get out.', reward:300+danger*80, xpReward:100+danger*30, factionId:null, factionChange:0, choice:null, choiceResolved:null });
    }
    setAiThinking(false); setScreen('job');
  }, [char]);

  const resolveJobChoice = useCallback((pick) => setJob(prev => ({ ...prev, choiceResolved: pick })), []);

  const completeJob = useCallback(() => {
    if (!job) return;
    const pick = job.choiceResolved;
    const mod = pick && job.choice ? (pick === 'a' ? job.choice.a.modifier : job.choice.b.modifier) : 0;
    const fixerBonus = char.archetype === 'fixer' ? 150 : 0;
    // Ghost Unfriendly/Hostile: quest rewards -15%
    const _ghostJobTier = getFactionTier((char.reputation?.ghosts || 0));
    const ghostJobPenalty = (_ghostJobTier.id === 'unfriendly' || _ghostJobTier.id === 'hostile' || _ghostJobTier.id === 'enemy') ? 0.85 : 1.0;
    // Ghost Friendly: black_market job rewards +10%
    const ghostJobBonus = _ghostJobTier.id === 'friendly' && job.jobId && job.jobId.includes('black') ? 1.10 : 1.0;
    const finalReward = Math.max(50, Math.floor((job.reward + mod + fixerBonus) * ghostJobPenalty * ghostJobBonus));
    const legacyEarned = Math.floor(job.xpReward / 45);
    const success = Math.random() < Math.min(0.90, 0.72 + char.level * 0.02);
    if (success) {
      setChar(prev => {
        let u = { ...prev, credits: prev.credits + finalReward, xp: prev.xp + job.xpReward, jobsDone: prev.jobsDone + 1, runLegacyEarned: (prev.runLegacyEarned || 0) + legacyEarned };
        const fixerRepMult = prev.archetype === 'fixer' ? 1.3 : 1.0;
        if (job.factionId && job.factionChange > 0) u = { ...u, reputation: { ...u.reputation, [job.factionId]: Math.max(-100, Math.min(100, (u.reputation[job.factionId] || 0) + Math.round(job.factionChange * fixerRepMult))) } };
        else if (job.factionId) u = { ...u, reputation: { ...u.reputation, [job.factionId]: Math.max(-100, Math.min(100, (u.reputation[job.factionId] || 0) + job.factionChange)) } };
        if (pick && job.choice) {
          const opt = pick === 'a' ? job.choice.a : job.choice.b;
          const fm2 = opt.faction && opt.faction.match(/(\w+):([-+]\d+)/);
          if (fm2) {
            const rawChange = parseInt(fm2[2]);
            const scaledChange = rawChange > 0 ? Math.round(rawChange * fixerRepMult) : rawChange;
            u = { ...u, reputation: { ...u.reputation, [fm2[1]]: Math.max(-100, Math.min(100, (u.reputation[fm2[1]] || 0) + scaledChange)) } };
          }
          if (Object.entries(u.reputation).some(([k, v]) => v <= -40 && (prev.reputation[k] || 0) > -40)) {
            u = { ...u, bounty: (u.bounty || 0) + 1 };
            addLog('⚠ BOUNTY ISSUED.', S.red);
          }
        }
        return checkLevelUp(u);
      });
      notify('Job done! +' + finalReward + '¢ +' + job.xpReward + 'xp', S.gold);
      // Credit milestone for heist
      setChar(prev => {
        if (prev.credits < 5000 && (prev.credits + finalReward) >= 5000) {
          setTimeout(() => addLog('◈ MILESTONE: 5000¢ reached — heist funding secured.', S.gold), 200);
        }
        return prev;
      });
      addLog('✓ JOB COMPLETE: +' + finalReward + '¢', S.gold);
    } else {
      const partial = Math.floor(finalReward * 0.2);
      setChar(prev => ({ ...prev, credits: prev.credits + partial, hp: Math.max(1, prev.hp - rollDice(10, 25)) }));
      notify('Job failed. Partial: ' + partial + '¢', S.red);
      addLog('✗ FAILED: Scraped out with ' + partial + '¢.', S.red);
    }
    advanceTime(3); setJob(null); setScreen('game');
  }, [job, char, addLog, advanceTime, checkLevelUp, notify]);

  // ── SHOP ──
  const buyItem = useCallback((item) => {
    if (!char || char.credits < item.price) { notify('Not enough credits', S.red); return; }
    Audio.sfxBuy();
    setChar(prev => {
      const inv = [...prev.inventory];
      const ex = inv.find(i => i.id === item.id);
      if (ex) ex.quantity++; else inv.push({ ...item, quantity: 1 });
      const hackBonus = item.id === 'hack_chip' ? Math.min(40, (prev.hackBonus || 0) + (item.value || 0)) : prev.hackBonus;
      return { ...prev, inventory: inv, credits: prev.credits - item.price, hackBonus };
    });
    notify('Bought: ' + item.name, S.green);
  }, [char, notify]);

  const buyWeapon = useCallback((w) => {
    const cost = w.price !== undefined ? w.price : w.value;
    if (!char || char.credits < cost) { notify('Not enough credits', S.red); return; }
    Audio.sfxBuy();
    setChar(prev => {
      const oldWeapon = prev.weapon;
      const stash = [...(prev.stashedWeapons || [])];
      // Add old equipped weapon to stash (unless it's fists/starting pipe with no real value)
      if (oldWeapon && oldWeapon.id !== w.id && !stash.find(s => s.id === oldWeapon.id)) {
        stash.push(oldWeapon);
      }
      return { ...prev, weapon: { ...w, ammo: w.maxAmmo || undefined }, credits: prev.credits - cost, stashedWeapons: stash };
    });
    notify('Equipped: ' + w.name, S.green);
    addLog('✓ Equipped: ' + w.name + (w.special ? ' [' + w.special.toUpperCase() + ']' : '') + '. Old weapon stashed.', S.green);
  }, [char, notify, addLog]);

  const equipStashedWeapon = useCallback((w) => {
    if (!char) return;
    setChar(prev => {
      const oldWeapon = prev.weapon;
      const stash = (prev.stashedWeapons || []).filter(s => s.id !== w.id);
      if (oldWeapon && !stash.find(s => s.id === oldWeapon.id)) stash.push(oldWeapon);
      return { ...prev, weapon: { ...w }, stashedWeapons: stash };
    });
    notify('Equipped: ' + w.name, S.green);
  }, [char, notify]);

  const sellStashedWeapon = useCallback((w) => {
    if (!char) return;
    const sellPrice = Math.floor((w.sell || Math.floor((w.value || 50) * 0.3)) * (char.archetype === 'fixer' ? 1.3 : 1.0));
    Audio.sfxBuy();
    setChar(prev => ({ ...prev, stashedWeapons: (prev.stashedWeapons || []).filter(s => s.id !== w.id), credits: prev.credits + sellPrice }));
    notify('+' + sellPrice + '¢ for ' + w.name, S.gold);
  }, [char, notify]);

  const buyArmor = useCallback((a) => {
    const cost = a.price !== undefined ? a.price : a.value;
    if (!char || char.credits < cost) { notify('Not enough credits', S.red); return; }
    Audio.sfxBuy();
    setChar(prev => {
      const oldArmor = prev.armor;
      const stash = [...(prev.stashedArmors || [])];
      if (oldArmor && oldArmor.id !== 'none' && oldArmor.id !== a.id && !stash.find(s => s.id === oldArmor.id)) {
        stash.push(oldArmor);
      }
      return { ...prev, armor: { ...a }, credits: prev.credits - cost, stashedArmors: stash };
    });
    notify('Equipped: ' + a.name, S.green);
    addLog('✓ Equipped: ' + a.name + (a.special ? ' [' + a.special.replace(/_/g,' ').toUpperCase() + ']' : '') + '. Old armor stashed.', S.green);
  }, [char, notify, addLog]);

  const equipStashedArmor = useCallback((a) => {
    if (!char) return;
    setChar(prev => {
      const oldArmor = prev.armor;
      const stash = (prev.stashedArmors || []).filter(s => s.id !== a.id);
      if (oldArmor && oldArmor.id !== 'none' && !stash.find(s => s.id === oldArmor.id)) stash.push(oldArmor);
      return { ...prev, armor: { ...a }, stashedArmors: stash };
    });
    notify('Equipped: ' + a.name, S.green);
  }, [char, notify]);

  const sellStashedArmor = useCallback((a) => {
    if (!char) return;
    const sellPrice = Math.floor((a.sell || Math.floor((a.value || 50) * 0.3)) * (char.archetype === 'fixer' ? 1.3 : 1.0));
    Audio.sfxBuy();
    setChar(prev => ({ ...prev, stashedArmors: (prev.stashedArmors || []).filter(s => s.id !== a.id), credits: prev.credits + sellPrice }));
    notify('+' + sellPrice + '¢ for ' + a.name, S.gold);
  }, [char, notify]);

  const installAugment = useCallback((aug) => {
    const cost = aug.cost;
    if (!char || char.credits < cost) { notify('Not enough credits', S.red); return; }
    if (char.augments.includes(aug.id)) { notify('Already installed', S.orange); return; }
    // Gate check: bioware requires Medica Allied, military requires Axiom Allied, cortex_relay requires Axiom Legend
    if (aug.gate === 'medica_allied' && (char.reputation?.medica || 0) < 60)  { notify('Requires Medica Allied standing (rep 60+)', S.red); return; }
    if (aug.gate === 'axiom_allied'  && (char.reputation?.axiom || 0) < 60)   { notify('Requires Axiom Allied standing (rep 60+)', S.red); return; }
    if (aug.gate === 'axiom_legend'  && (char.reputation?.axiom || 0) < 90)   { notify('Requires Axiom LEGEND standing (rep 90+)', S.red); return; }
    const conflict = WORLD_AUGMENTS.find(a => a.slot === aug.slot && a.gate === aug.gate && char.augments.includes(a.id));
    if (conflict) { notify('Slot OCCUPIED by ' + conflict.name, S.red); return; }
    if ((char.humanity || 10) - aug.humanity < 0) { notify('Not enough humanity', S.red); return; }
    Audio.sfxAugment();
    setChar(prev => {
      const nh = (prev.humanity || 10) - aug.humanity;
      const hpBonus = (aug.bonus && aug.bonus.maxHp) || 0;
      const newMaxHp = prev.maxHp + hpBonus;
      // Inhibitor: absorb this install's humanity cost
      const humanityCost = (prev.inhibitorActive && !prev.inhibitorUsed) ? 0 : aug.humanity;
      const actualNewHumanity = (prev.humanity || 10) - humanityCost;
      return {
        ...prev,
        augments: [...prev.augments, aug.id],
        credits: prev.credits - cost,
        humanity: actualNewHumanity,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp + hpBonus, newMaxHp),
        inhibitorActive: false,
        inhibitorUsed: prev.inhibitorActive ? true : prev.inhibitorUsed,
        ...(actualNewHumanity <= 3 ? { charisma: Math.max(1, prev.charisma - 2) } : {}),
      };
    });
    notify('Installed: ' + aug.name, S.cyan);
    addLog('⚡ AUGMENT: ' + aug.name + '. Humanity -' + aug.humanity + (aug.bonus.maxHp ? '. Max HP +' + aug.bonus.maxHp : '') + '.', S.cyan);
  }, [char, notify, addLog]);

  const removeAugment = useCallback((aug) => {
    if (!char || !char.augments.includes(aug.id)) return;
    Audio.sfxAugment();
    setChar(prev => {
      const hpBonus = (aug.bonus && aug.bonus.maxHp) || 0;
      const newMaxHp = Math.max(1, prev.maxHp - hpBonus);
      const newHp = Math.min(prev.hp, newMaxHp);
      const nh = Math.min(10, (prev.humanity || 10) + aug.humanity);
      return {
        ...prev,
        augments: prev.augments.filter(id => id !== aug.id),
        humanity: nh,
        maxHp: newMaxHp,
        hp: newHp,
      };
    });
    notify('Removed: ' + aug.name + '. Humanity +' + aug.humanity, S.orange);
    addLog('⚡ AUGMENT REMOVED: ' + aug.name + '. Humanity +'+ aug.humanity +'.', S.orange);
  }, [char, notify, addLog]);

  const useItem = useCallback((item) => {
    if (!char) return;
    if (item.effect === 'heal') {
      Audio.sfxHeal();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, hp: Math.min(prev.maxHp, prev.hp + item.value), inventory: inv };
      });
      notify('+' + item.value + ' HP', S.green);
    } else if (item.effect === 'credits') {
      Audio.sfxBuy();
      setChar(prev => ({ ...prev, credits: prev.credits + item.value, inventory: prev.inventory.filter(i => i.id !== item.id) }));
      notify('+' + item.value + '¢', S.gold);
    } else if (item.effect === 'cleanse') {
      Audio.sfxHeal();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, statuses: [], inventory: inv };
      });
      notify('Status effects cleared', S.cyan);
    } else if (item.effect === 'ammo' && char.weapon.ammo !== undefined) {
      Audio.sfxBuy();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, weapon: { ...prev.weapon, ammo: prev.weapon.maxAmmo }, inventory: inv };
      });
      notify('Ammo refilled', S.green);
    } else if (item.effect === 'hack') {
      Audio.sfxBuy();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        const newBonus = Math.min(40, (prev.hackBonus || 0) + (item.value || 20));
        return { ...prev, hackBonus: newBonus, inventory: inv };
      });
      const newBonus = Math.min(40, (char.hackBonus || 0) + (item.value || 20));
      notify('Hack prep: ' + newBonus + '/40', S.cyan);
    } else if (item.effect === 'stealth') {
      Audio.sfxBuy();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, stealthActive: true, inventory: inv };
      });
      notify('Stealth Cloak active — next encounter skipped', S.green);
    } else if (item.effect === 'jam_sync') {
      Audio.sfxBuy();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, syncJammed: true, inventory: inv };
      });
      addLog('◈ SYNC JAMMER: Synced enemies disrupted next encounter.', S.cyan);
      notify('Sync Jammed — 1 encounter', S.cyan);
    } else if (item.effect === 'sell_only') {
      notify('This item can only be sold at a shop.', S.dim);
    } else if (item.effect === 'inhibitor') {
      if (char.inhibitorUsed) { notify('Inhibitor already used this run', S.orange); return; }
      Audio.sfxHeal();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, inhibitorActive: true, inventory: inv };
      });
      addLog('◈ INHIBITOR: next augment install costs 0 humanity.', '#c084fc');
      notify('Inhibitor active — next aug free', '#c084fc');
    } else if (item.effect === 'neuro_block') {
      Audio.sfxHeal();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return {
          ...prev,
          neuroblockerActive: true,
          neuroblockerHoursLeft: 12,
          psychosisSlip: 0,
          lastBlockerHour: prev.hour,
          lastBlockerDay: prev.day,
          inventory: inv,
        };
      });
      addLog('◈ NEURO BLOCKER: psychosis cascade suppressed. 12h window.', '#c084fc');
      notify('Neuro Blocker taken — 12h window', '#c084fc');
    } else if (item.effect === 'clarity_dose') {
      Audio.sfxHeal();
      setChar(prev => {
        const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        return { ...prev, clarityActive: true, inventory: inv };
      });
      addLog('◈ CLARITY: ACC+10 SPD+10 for next combat.', S.green);
      notify('Clarity active — combat bonuses loaded', S.green);
    }
  }, [char, notify, addLog]);

  const buyLegacyUnlock = useCallback((unlock) => {
    if (legacy.points < unlock.cost) { notify('Not enough legacy points', S.red); return; }
    if (legacy.unlocks.includes(unlock.id)) { notify('Already unlocked', S.orange); return; }
    Audio.sfxBuy();
    const newLeg = { ...legacy, points: legacy.points - unlock.cost, unlocks: [...legacy.unlocks, unlock.id] };
    SESSION_LEGACY = newLeg; saveLegacy(newLeg); setLegacy(newLeg);
    notify('Unlocked: ' + unlock.name, S.gold);
  }, [legacy, notify]);

  // ── HEIST (WIN CONDITION) ──
  const executeHeist = useCallback(async () => {
    setAiThinking(true);
    const bs = BACKSTORIES[char.backstory] || BACKSTORIES.debt;
    const epilogue = bs.epilogue ? bs.epilogue(char.name) : `The grid goes dark. Neo-Kairo blinks. You vanish into the static. THE CITY BREATHES.`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300,
          messages: [{ role: 'user', content:
            'You are writing the final scene of a cyberpunk noir RPG. The player character is ' + char.name + ', a LV' + char.level + ' ' + char.archetype + ', who just destroyed Axiom Corp\'s CortexSync firmware pipeline and surveillance grid — ending a fourteen-year experiment in cognitive control and preventing global rollout of mandatory Sync integration.\n\nPersonal stakes: ' + bs.hook + '\nWhat they lost: ' + bs.loss + '\nHumanity remaining: ' + (char.humanity || 10) + '/10\n\nWrite 3-4 short sentences as third-person past-tense narration. Specific. Earned. Not triumphant — weighted with what it cost. Reference what they lost AND what the city might recover now that the preference updates have stopped. End with one quiet image of a person — any person — doing something small and entirely their own. No speeches.\n\nThen on a new line write exactly: THE CITY BREATHES.'
          }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || epilogue;
      const earned = 10 + (char.level * 2);
      const { newlyEarned, wonArchetypes } = checkAchievements(char, true, null);
      const achPoints = newlyEarned.reduce((sum, id) => {
        const a = ACHIEVEMENTS.find(x => x.id === id); return sum + (a ? a.pts : 0);
      }, 0);
      const existingAch = SESSION_LEGACY.achievements || [];
      const newLeg = { ...SESSION_LEGACY, points: SESSION_LEGACY.points + earned + achPoints, wins: SESSION_LEGACY.wins + 1, totalRuns: SESSION_LEGACY.totalRuns + 1, achievements: [...existingAch, ...newlyEarned], wonArchetypes, newAchievements: newlyEarned };
      SESSION_LEGACY = newLeg; saveLegacy(newLeg); setLegacy(newLeg);
      storageDelete(SAVE_KEY_CHAR); setSavedChar(null);
      setJob({ jobId: 'heist_final', briefing: text, reward: 0, xpReward: 2000, factionId: null, factionChange: 0, choice: null, choiceResolved: null, isWin: true, legacyEarned: earned + achPoints, newAchievements: newlyEarned });
      setScreen('job');
    } catch(e) {
      const earned = 10;
      const { newlyEarned, wonArchetypes } = checkAchievements(char, true, null);
      const achPoints = newlyEarned.reduce((sum, id) => {
        const a = ACHIEVEMENTS.find(x => x.id === id); return sum + (a ? a.pts : 0);
      }, 0);
      const existingAch = SESSION_LEGACY.achievements || [];
      const newLeg = { ...SESSION_LEGACY, points: SESSION_LEGACY.points + earned + achPoints, wins: SESSION_LEGACY.wins + 1, totalRuns: SESSION_LEGACY.totalRuns + 1, achievements: [...existingAch, ...newlyEarned], wonArchetypes, newAchievements: newlyEarned };
      SESSION_LEGACY = newLeg; saveLegacy(newLeg); setLegacy(newLeg);
      storageDelete(SAVE_KEY_CHAR); setSavedChar(null);
      setJob({ jobId: 'heist_final', briefing: epilogue, reward: 0, xpReward: 2000, factionId: null, factionChange: 0, choice: null, choiceResolved: null, isWin: true, legacyEarned: earned + achPoints, newAchievements: newlyEarned });
      setScreen('job');
    }
    setAiThinking(false);
    setSheet(null);
  }, [char, notify]);

  // Resistance heist check
  const checkHeistReady = useCallback((c) => {
    if (!c) return false;
    const rep = c.reputation || {};
    const underground = (rep.ghosts || 0) >= 60 || (rep.meridian || 0) >= 60 || (rep.ironhand || 0) >= 60;
    const axiomHostile = (rep.axiom || 0) <= -25;
    return c.level >= HEIST_REQS.level && c.credits >= HEIST_REQS.credits &&
      underground && axiomHostile &&
      HEIST_REQS.gear.every(g => c.augments.includes(g) || c.weapon.id === g || c.armor?.id === g);
  }, []);

  // Axiom heist check
  const checkAxiomHeistReady = useCallback((c) => {
    if (!c) return false;
    const rep = c.reputation || {};
    const axiomAllied = (rep.axiom || 0) >= 80;
    const meridianHostile = (rep.meridian || 0) <= -60;
    return c.level >= AXIOM_HEIST_REQS.level && c.credits >= AXIOM_HEIST_REQS.credits &&
      axiomAllied && meridianHostile &&
      AXIOM_HEIST_REQS.gear.every(g => c.augments.includes(g) || c.weapon?.id === g || c.armor?.id === g);
  }, []);

  // ── DERIVED ──
  const hp = (char && char.hp) || 0;
  const maxHp = (char && char.maxHp) || 1;
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 50 ? S.green : hpPct > 25 ? S.orange : S.red;
  const heistReady = char && checkHeistReady(char);
  const axiomHeistReady = char && checkAxiomHeistReady(char);
  // Milestone: notify when heist becomes ready (first time)
  const prevHeistReady = useRef(false);
  useEffect(() => {
    if (heistReady && !prevHeistReady.current) {
      prevHeistReady.current = true;
      notify('◈ OPERATION AXIOM ZERO — ALL REQUIREMENTS MET', S.gold);
      addLog('◈ OPERATION AXIOM ZERO ready. Tap the banner to execute.', S.gold);
    }
  }, [heistReady]);
  // Milestone: first augment
  const prevAugCount = useRef(0);
  useEffect(() => {
    if (!char) return;
    const count = char.augments.length;
    if (count > prevAugCount.current && prevAugCount.current === 0) {
      addLog('◈ MILESTONE: First augment installed. You are more machine than you were.', S.cyan);
    }
    prevAugCount.current = count;
  }, [char && char.augments.length]);
  // Milestone: first level
  const prevLevel = useRef(1);
  useEffect(() => {
    if (!char) return;
    if (char.level > prevLevel.current && prevLevel.current === 1) {
      addLog('◈ MILESTONE: First level up. Neo-Kairo is starting to take you seriously.', S.gold);
    }
    prevLevel.current = char.level;
  }, [char && char.level]);

  // ============================================================
  // RENDER SCREENS
  // ============================================================

  // ── HACK TRANSITION IN ──
  if (screen === 'hack_trans_in' && hackContext) {
    return (
      <HackTransition
        direction="in"
        hackData={HACK_DATA[hackContext.hackType]}
        onDone={() => setScreen('hack')}
      />
    );
  }

  // ── HACK MINIGAME ──
  if (screen === 'hack' && hackContext && char) {
    const hackPrograms = buildHackPrograms(char);
    const iceCount = (char.iceCharges || 0) + (hackContext.bonusIce || 0);
    return (
      <HackScreen
        difficulty={hackContext.difficulty}
        archetype={char.archetype}
        hackType={hackContext.hackType}
        programs={hackPrograms}
        iceCharges={iceCount}
        augments={char.augments || []}
        onDone={handleHackResult}
      />
    );
  }

  // ── HACK TRANSITION OUT ──
  if (screen === 'hack_trans_out') {
    return (
      <HackTransition
        direction="out"
        success={pendingHackResult.current?.success}
        onDone={() => {
          const result = pendingHackResult.current;
          pendingHackResult.current = null;
          applyHackResult(result);
        }}
      />
    );
  }

  // ── TITLE ──
  if (screen === 'title') return (
    <div style={{ background: S.bg, position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: S.font, padding: '24px 20px', textAlign: 'center', overflowY: 'auto', overscrollBehavior: 'none' }}>
      <div style={{ color: S.pink, fontSize: 'clamp(26px,7vw,44px)', letterSpacing: 6, textShadow: '0 0 30px ' + S.pink, marginBottom: 8 }}>NEO-KAIRO</div>
      <div style={{ color: S.cyan, fontSize: 11, letterSpacing: 4, marginBottom: 6 }}>PROCEDURAL MEGACITY · 2089</div>
      <div style={{ color: S.dim, fontSize: 11, marginBottom: 32 }}>EXPLORE · SURVIVE · BURN IT DOWN</div>
      {SESSION_LEGACY.totalRuns > 0 && <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 16px', marginBottom: 20, fontSize: 11 }}>
        <span style={{ color: S.gold }}>LEGACY: {SESSION_LEGACY.points}pt</span>
        <span style={{ color: S.dim, marginLeft: 12 }}>Runs: {SESSION_LEGACY.totalRuns}</span>
        <span style={{ color: S.green, marginLeft: 12 }}>Wins: {SESSION_LEGACY.wins}</span>
        {SESSION_LEGACY.bestRun && <span style={{ color: S.dim, marginLeft: 12 }}>Best: LV{SESSION_LEGACY.bestRun.level}/{SESSION_LEGACY.bestRun.kills}k</span>}
      </div>}
      {savedChar && (
        <div style={{ background: '#0a0a1a', border: '1px solid ' + S.cyan + '66', borderRadius: 6, padding: '12px 16px', marginBottom: 16, width: '100%', maxWidth: 300, textAlign: 'left' }}>
          <div style={{ color: S.dim, fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>SAVED RUN</div>
          <div style={{ color: S.cyan, fontSize: 13, marginBottom: 2 }}>{savedChar.name} · {savedChar.archetype?.toUpperCase()}</div>
          <div style={{ color: S.dim, fontSize: 11 }}>LV{savedChar.level} · {savedChar.credits}¢ · Day {savedChar.day}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => { initAudio(); setChar({ ...savedChar, contactNPC: savedChar.contactNPC || getNPCForBackstory(savedChar.backstory) }); setScreen('game'); }} style={{ ...btn(S.cyan, '#00111a', S.cyan + '66'), flex: 1, minHeight: 42, fontSize: 12, letterSpacing: 2 }}>[ CONTINUE ]</button>
            <button onClick={() => { storageDelete(SAVE_KEY_CHAR); setSavedChar(null); }} style={{ background: 'none', border: '1px solid ' + S.red + '44', color: S.red, fontFamily: S.font, fontSize: 11, padding: '0 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1, minHeight: 44 }}>DELETE</button>
          </div>
        </div>
      )}
      <button onClick={() => { initAudio(); setScreen('create'); }} style={{ ...btn(S.pink, 'transparent', S.pink), fontSize: 15, letterSpacing: 4, padding: '0 40px', minHeight: 56, boxShadow: '0 0 24px ' + S.pink + '44', width: '100%', maxWidth: 300, marginBottom: 12 }}>[ JACK IN ]</button>
      {SESSION_LEGACY.totalRuns > 0 && <button onClick={() => { initAudio(); setScreen('legacy'); }} style={{ ...btn(S.gold, S.bgCard, S.gold + '66'), fontSize: 12, letterSpacing: 2, padding: '0 24px', minHeight: 44, width: '100%', maxWidth: 300 }}>[ GHOST LEGACY ]</button>}
      <div style={{ position: 'absolute', bottom: 14, right: 16, color: S.dim, fontSize: 9, letterSpacing: 2, opacity: 0.5, fontFamily: S.font }}>v10 · 2026.06</div>
    </div>
  );

  // ── LEGACY ──
  if (screen === 'legacy') {
    const earned = legacy.achievements || [];
    const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];
    return (
      <div style={{ background: S.bg, position: 'fixed', inset: 0, fontFamily: S.font, color: S.text, padding: '20px 20px 32px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setScreen('title')} style={{ background: 'none', border: 'none', color: S.dim, fontSize: 22, cursor: 'pointer', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <span style={{ color: S.gold, fontSize: 14, letterSpacing: 3 }}>◈ GHOST LEGACY</span>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ color: S.gold, fontSize: 18 }}>{legacy.points}pt</div>
            <div style={{ color: S.dim, fontSize: 10 }}>{earned.length}/{ACHIEVEMENTS.length} achievements</div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid ' + S.border }}>
          {[['unlocks','UNLOCKS'],['achievements','ACHIEVEMENTS']].map(([t,label]) => (
            <button key={t} onClick={() => setLegacyTab(t)} style={{ background: 'none', border: 'none', borderBottom: '2px solid ' + (legacyTab === t ? S.gold : 'transparent'), color: legacyTab === t ? S.gold : S.dim, fontFamily: S.font, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer', marginBottom: -1 }}>{label}</button>
          ))}
        </div>

        {legacyTab === 'unlocks' && LEGACY_UNLOCKS.map(u => {
          const owned = legacy.unlocks.includes(u.id);
          const canAfford = legacy.points >= u.cost;
          const requiredAch = UNLOCK_GATES[u.id];
          const achUnlocked = !requiredAch || earned.includes(requiredAch);
          const reqAchName = requiredAch ? ACHIEVEMENTS.find(a => a.id === requiredAch)?.name : null;
          return (
            <div key={u.id} style={{ background: owned ? '#0d1a0d' : S.bgCard, border: '1px solid ' + (owned ? S.green : achUnlocked ? S.border : '#2a2a2a'), borderRadius: 6, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: achUnlocked ? 1 : 0.5 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: owned ? S.green : achUnlocked ? S.text : S.dim, fontSize: 13 }}>{u.name}{owned ? ' ✓' : ''}</div>
                <div style={{ color: S.dim, fontSize: 11, marginTop: 2 }}>{u.desc}</div>
                {!achUnlocked && reqAchName && <div style={{ color: '#3a3a55', fontSize: 10, marginTop: 3 }}>Requires achievement: {reqAchName}</div>}
              </div>
              {!owned && achUnlocked && <button onClick={() => buyLegacyUnlock(u)} style={{ ...btn(canAfford ? S.gold : S.dim, canAfford ? '#1a1200' : S.bgCard, canAfford ? S.gold : S.border), minHeight: 44, minWidth: 56, fontSize: 12, borderRadius: 4, marginLeft: 12, flexShrink: 0 }}>{u.cost}pt</button>}
            </div>
          );
        })}

        {legacyTab === 'achievements' && categories.map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ color: S.dim, fontSize: 9, letterSpacing: 3, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border }}>{cat}</div>
            {ACHIEVEMENTS.filter(a => a.category === cat).map(a => {
              const unlocked = earned.includes(a.id);
              return (
                <div key={a.id} style={{ background: unlocked ? '#0a0d0a' : S.bgCard, border: '1px solid ' + (unlocked ? a.color + '44' : '#1a1a2a'), borderRadius: 6, padding: '12px 14px', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start', opacity: unlocked ? 1 : 0.45 }}>
                  <div style={{ color: unlocked ? a.color : '#2a2a3a', fontSize: 20, flexShrink: 0, width: 24, textAlign: 'center', marginTop: 2 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ color: unlocked ? '#d0d0e0' : '#3a3a55', fontSize: 13 }}>{a.name}</span>
                      <span style={{ color: unlocked ? S.gold : '#2a2a3a', fontSize: 10 }}>+{a.pts}pt</span>
                    </div>
                    <div style={{ color: S.dim, fontSize: 11, marginBottom: unlocked ? 4 : 0 }}>{a.desc}</div>
                    {unlocked && <div style={{ color: '#505068', fontSize: 10, fontStyle: 'italic', lineHeight: 1.5 }}>{a.flavor}</div>}
                  </div>
                  {unlocked && <div style={{ color: a.color, fontSize: 10, flexShrink: 0 }}>✓</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ── CREATE ──
  if (screen === 'create') return (
    <div style={{ background: S.bg, position: 'fixed', inset: 0, fontFamily: S.font, color: S.text, padding: '24px 20px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
      <div style={{ color: S.pink, fontSize: 14, letterSpacing: 3, marginBottom: 24 }}>◈ CHARACTER CREATE</div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: S.dim, fontSize: 11, marginBottom: 8, letterSpacing: 2 }}>GHOST HANDLE</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your handle..." style={{ background: S.bgCard, border: '1px solid ' + S.border, color: S.pink, fontFamily: S.font, fontSize: 16, padding: '14px 16px', flex: 1, boxSizing: 'border-box', outline: 'none', borderRadius: 2 }} />
          <button onClick={() => setNameInput(generateHandle())} style={{ background: S.bgCard, border: '1px solid ' + S.pink + '66', color: S.pink, fontFamily: S.font, fontSize: 11, padding: '0 14px', borderRadius: 2, cursor: 'pointer', flexShrink: 0, letterSpacing: 1, minHeight: 44 }}>GEN</button>
        </div>
      </div>
      <div style={{ color: S.dim, fontSize: 11, marginBottom: 10, letterSpacing: 2 }}>ARCHETYPE</div>
      <div style={{ color: '#3a3a55', fontSize: 10, marginBottom: 10, fontStyle: 'italic' }}>GHOST is recommended for new players. Lower encounter rate means more time to explore and buy gear before fighting.</div>
      {[
        { id: 'ghost',     label: 'GHOST',     stats: 'HP:80  SPD:16  HACK:18', desc: 'Half encounter rate. Vanish mid-quest. Meridian +15 start.', recommended: true,  flavor: 'Survives by not being seen. Meridian network opens safe corridors. Best for learning the map.' },
        { id: 'soldier',   label: 'SOLDIER',   stats: 'HP:120 STR:18  ACC:16',  desc: 'Force entry on stashes. Intimidate NPCs. Ironhand +15 start.', recommended: false, flavor: 'Highest HP and damage. Ironhand alliance means free passage through gang zones. Fights everything head-on.' },
        { id: 'netrunner', label: 'NETRUNNER', stats: 'HP:60  HACK:22  HUM:8',  desc: 'Pre-installed neural_hack. Ghost Network +15 start. Axiom -5.', recommended: false, flavor: 'Low HP. Ghost Network alliance means better terminal rewards from the start. Hardest to keep alive early.' },
        { id: 'fixer',     label: 'FIXER',     stats: 'HP:90  CHA:20',          desc: '+150¢ per job. Charisma-scaled haggle (20%→35% off). +30% faction rep. +30% sell prices.', recommended: false, flavor: 'The bard. Weakest in a straight fight, strongest in every negotiation. Faction progression is 30% faster. Best long-game class.' },
      ].map(a => (
        <div key={a.id} onClick={() => setArchetype(a.id)} style={{ border: '1px solid ' + (archetype === a.id ? S.pink : S.border), padding: '10px 14px', marginBottom: 6, cursor: 'pointer', background: archetype === a.id ? '#1a0022' : S.bgCard, borderRadius: 4, WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ color: archetype === a.id ? S.pink : S.text, fontSize: 13 }}>{archetype === a.id ? '◈ ' : '  '}{a.label}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {a.recommended && <span style={{ color: S.green, fontSize: 9, letterSpacing: 1, border: '1px solid ' + S.green + '44', padding: '1px 5px', borderRadius: 3 }}>RECOMMENDED</span>}
              <span style={{ color: S.dim, fontSize: 10 }}>{a.stats}</span>
            </div>
          </div>
          <div style={{ color: archetype === a.id ? '#c080e0' : S.dim, fontSize: 11, lineHeight: 1.5 }}>{a.flavor}</div>
          {archetype === a.id && <div style={{ color: '#606080', fontSize: 10, marginTop: 4 }}>{a.desc}</div>}
        </div>
      ))}
      <div style={{ color: S.dim, fontSize: 11, marginBottom: 10, letterSpacing: 2, marginTop: 18 }}>BACKSTORY — why you are here</div>
      {Object.values(BACKSTORIES).map(bs => (
        <div key={bs.id} onClick={() => setBackstoryInput(bs.id)}
          style={{ border: '1px solid ' + (backstoryInput === bs.id ? S.gold : S.border), padding: '14px 16px', marginBottom: 8, cursor: 'pointer', background: backstoryInput === bs.id ? '#1a1200' : S.bgCard, borderRadius: 4, WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: backstoryInput === bs.id ? S.gold : S.text, fontSize: 13, letterSpacing: 1 }}>{backstoryInput === bs.id ? '◈ ' : '  '}{bs.label}</span>
            <span style={{ color: S.dim, fontSize: 10 }}>contact: {bs.contact}</span>
          </div>
          <div style={{ color: backstoryInput === bs.id ? '#c0b080' : S.dim, fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{bs.hook}</div>
          {backstoryInput === bs.id && (
            <div style={{ marginTop: 10, borderTop: '1px solid #2a2a1a', paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ color: S.green, fontSize: 11 }}>▸ {bs.bonusDesc}</span>
                {bs.drawbackDesc && <span style={{ color: S.red, fontSize: 11 }}>⚠ {bs.drawbackDesc}</span>}
              </div>
              <div style={{ color: '#605850', fontSize: 10, lineHeight: 1.6, fontStyle: 'italic' }}>{bs.balanceNote}</div>
            </div>
          )}
        </div>
      ))}
      {/* Starting rep preview — visible before confirming */}
      {(() => {
        const preview = getStartingRepPreview(archetype, backstoryInput, legacy.unlocks);
        return (
          <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '14px 16px', marginTop: 16, marginBottom: 4 }}>
            <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>STARTING FACTION STANDING</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(WORLD_FACTIONS).map(([fid, f]) => {
                const rep = preview[fid] || 0;
                const tier = getFactionTier(rep);
                return (
                  <div key={fid} style={{ background: S.bgRaised, borderRadius: 4, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: f.color, fontSize: 10 }}>{f.name}</div>
                      <div style={{ color: tier.color, fontSize: 11, letterSpacing: 1 }}>{tier.label}</div>
                    </div>
                    <span style={{ color: rep > 0 ? S.green : rep < 0 ? S.red : S.dim, fontSize: 13 }}>{rep > 0 ? '+' : ''}{rep}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ color: '#2a2a44', fontSize: 9, marginTop: 8, fontStyle: 'italic' }}>Changes based on backstory + legacy unlocks.</div>
          </div>
        );
      })()}
      <button onClick={() => {
        if (!nameInput.trim()) return;
        initAudio();
        const c = createCharacter(nameInput.trim(), archetype, backstoryInput);
        const bs = BACKSTORIES[backstoryInput] || BACKSTORIES.debt;
        setChar(c); setLog([]);
        addLog(bs.openingLine, S.pink);
        addLog('Neo-Kairo. You\'re a Ghost Network runner. Find ' + bs.contact + ' — your first contact in the city.', S.text);
        if (backstoryInput === 'corpo') {
          addLog('OBJECTIVE: Rebuild your standing. Find Aria. Work Axiom-adjacent jobs. Reach OPERATION ZERO EXPORT.', S.cyan);
        } else {
          addLog('OBJECTIVE: Find your contact. Build reputation. Reach OPERATION AXIOM ZERO.', S.gold);
        }
        Audio.playTrack('exploration');
        // First run: show onboarding. Veterans: straight to game.
        setScreen(SESSION_LEGACY.totalRuns === 0 ? 'onboarding' : 'game');
      }} style={{ ...btn(S.green, '#0a1a0a', S.green), width: '100%', fontSize: 15, letterSpacing: 3, minHeight: 56, marginTop: 10 }}>[ BEGIN ]</button>
    </div>
  );

  // ── ONBOARDING — first run only ──
  if (screen === 'onboarding' && char) {
    const bs = BACKSTORIES[char.backstory] || BACKSTORIES.debt;
    const steps = [
      {
        icon: '◈',
        color: S.pink,
        title: 'EXPLORE THE CITY',
        body: 'Use the arrow buttons to move through Neo-Kairo. Each area is different every run — markets, gang turf, tunnels, corporate zones. Walk into symbols to interact with them. The map shows 9 areas around you at once.',
      },
      {
        icon: '¢',
        color: S.gold,
        title: 'TAKE JOBS, EARN CREDITS',
        body: 'Find ◈ job boards and take contracts. Each job pays credits and XP. Credits buy better weapons, armor, and augments. The LOG tab always shows your current objective — follow it to progress the story.',
      },
      {
        icon: '⚔',
        color: S.orange,
        title: 'FIGHT OR FLEE',
        body: 'Enemies appear as you explore. ATTACK deals damage. FLEE sometimes works — use it when outnumbered or low on HP. Use stims (💉) to heal mid-fight. Danger shown as ⚠1–4 in the top bar: avoid ⚠3+ until you have gear.',
      },
      {
        icon: '✦',
        color: S.cyan,
        title: 'UPGRADE YOUR RUN',
        body: 'You are a Ghost Network runner — the city\'s mercenary class. Work for whoever pays. Find ' + bs.contact + ' first, your Ghost Network contact. They have your first job. Build reputation across factions to unlock the run-ending operation.',
      },
    ];
    return (
      <div style={{ background: S.bg, position: 'fixed', inset: 0, fontFamily: S.font, color: S.text, padding: '20px 20px 32px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
        <div style={{ color: S.pink, fontSize: 13, letterSpacing: 3, marginBottom: 4 }}>◈ HOW TO PLAY</div>
        <div style={{ color: S.dim, fontSize: 11, marginBottom: 24 }}>Your first run. Read this once, then go.</div>
        <div style={{ flex: 1 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ background: S.bgCard, border: '1px solid ' + step.color + '33', borderRadius: 6, padding: '14px 16px', marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ color: step.color, fontSize: 22, flexShrink: 0, width: 28, textAlign: 'center', marginTop: 2 }}>{step.icon}</div>
              <div>
                <div style={{ color: step.color, fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>{step.title}</div>
                <div style={{ color: '#9090b0', fontSize: 12, lineHeight: 1.7 }}>{step.body}</div>
              </div>
            </div>
          ))}
          <div style={{ background: '#0a0a0a', border: '1px solid ' + S.border, borderRadius: 6, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ color: S.dim, fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>MAP SYMBOLS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {[
                { ch: '◈', label: 'Job board', color: S.gold },
                { ch: '¢', label: 'Shop', color: S.green },
                { ch: '✦', label: 'Ripper doc (augments)', color: S.cyan },
                { ch: '⌂', label: 'Rest / safe house', color: '#8080ff' },
                { ch: '⌬', label: 'Net broker (software)', color: S.pink },
                { ch: '▸', label: 'Terminal', color: '#60ff80' },
                { ch: '≡', label: 'Ladder (change layer)', color: S.orange },
                { ch: '☻', label: 'NPC contact', color: S.gold },
              ].map(s => (
                <div key={s.ch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: s.color, fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0 }}>{s.ch}</span>
                  <span style={{ color: S.dim, fontSize: 11 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => setScreen('game')} style={{ ...btn(S.green, '#0a1a0a', S.green), width: '100%', fontSize: 14, letterSpacing: 3, minHeight: 56 }}>[ JACK IN — LET'S GO ]</button>
      </div>
    );
  }

  // ── DEATH ──
  // ── PSYCHOSIS SCREEN — third kind of run ending ──
  if (screen === 'psychosis') return (
    <div style={{ background: '#08000a', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: S.font, color: '#c084fc', padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 42, marginBottom: 12, letterSpacing: 4, textShadow: '0 0 30px #c084fc' }}>PSYCHOSIS</div>
      <div style={{ color: '#7a4a8a', fontSize: 11, letterSpacing: 3, marginBottom: 24 }}>CASCADE TERMINAL</div>
      <div style={{ background: '#0d060f', border: '1px solid #c084fc33', borderRadius: 8, padding: '20px 20px', maxWidth: 340, marginBottom: 24 }}>
        <div style={{ color: '#9060a8', fontSize: 13, lineHeight: 1.9, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
          {char && `The neuro blockers ran out. Or maybe you stopped counting. ${char.name} — LV${char.level} ${char.archetype} — more chrome than body now. The part that made decisions stopped making them.\n\nThis is the third kind of ending. Not death. Not victory. The city has a word for it.\n\nHigh-integration user. Voluntary deep immersion. The paperwork will say you were fine.`}
        </div>
      </div>
      <div style={{ color: '#3a1a44', fontSize: 11, marginBottom: 6 }}>Humanity: {char ? char.humanity : 0}/10</div>
      <div style={{ color: '#2a0a30', fontSize: 11, marginBottom: 32 }}>Day {char && char.day} · {char && char.kills} kills · {char && char.jobsDone} jobs</div>
      <div style={{ color: S.gold, fontSize: 12, marginBottom: 16 }}>+{char && char.runLegacyEarned || 0} Legacy Points earned</div>
      <button onClick={() => { setChar(null); setLog([]); setCombat(null); setSheet(null); setThresholdScene(null); setHackContext(null); pendingHackResult.current = null; setScreen('title'); }}
        style={{ ...btn('#c084fc', 'transparent', '#c084fc'), fontSize: 14, letterSpacing: 3, padding: '0 40px', minHeight: 56, marginBottom: 12 }}>[ RESPAWN ]</button>
      <button onClick={() => { setChar(null); setLog([]); setCombat(null); setSheet(null); setThresholdScene(null); setHackContext(null); pendingHackResult.current = null; setScreen('legacy'); }}
        style={{ ...btn(S.gold, S.bgCard, S.gold + '66'), fontSize: 12, letterSpacing: 2, padding: '0 24px', minHeight: 44 }}>[ SPEND LEGACY ]</button>
    </div>
  );

  if (screen === 'death') return (
    <div style={{ background: '#0a0000', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: S.font, color: S.red, padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16, textShadow: '0 0 40px ' + S.red }}>DEAD</div>
      <div style={{ color: S.dim, marginBottom: 8, fontSize: 14 }}>{char && char.name} — LV{char && char.level} {char && char.archetype}</div>
      <div style={{ color: '#333', fontSize: 12, marginBottom: 6 }}>Kills: {char && char.kills} · Jobs: {char && char.jobsDone} · Day {char && char.day}</div>
      {char && char.backstory && BACKSTORIES[char.backstory] && (
        <div style={{ color: '#3a2020', fontSize: 12, marginBottom: 8, maxWidth: 320, lineHeight: 1.6, fontStyle: 'italic' }}>
          {BACKSTORIES[char.backstory].loss}
        </div>
      )}
      <div style={{ color: S.gold, fontSize: 12, marginBottom: 4 }}>+{char && char.runLegacyEarned || 0} Legacy Points earned</div>
      {/* New achievements this run */}
      {(legacy.newAchievements || []).length > 0 && (
        <div style={{ marginBottom: 16, maxWidth: 320, width: '100%' }}>
          {(legacy.newAchievements || []).map(id => {
            const a = ACHIEVEMENTS.find(x => x.id === id);
            if (!a) return null;
            return (
              <div key={id} style={{ background: '#0a0a0a', border: '1px solid ' + a.color + '66', borderRadius: 6, padding: '10px 14px', marginBottom: 8, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: a.color, fontSize: 16 }}>{a.icon}</span>
                  <span style={{ color: a.color, fontSize: 12, letterSpacing: 2 }}>ACHIEVEMENT UNLOCKED</span>
                  <span style={{ color: S.gold, fontSize: 11, marginLeft: 'auto' }}>+{a.pts}pt</span>
                </div>
                <div style={{ color: '#c0c0d0', fontSize: 13 }}>{a.name}</div>
                <div style={{ color: S.dim, fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>{a.flavor}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ color: '#1e1e38', fontSize: 11, marginBottom: 36 }}>Neo-Kairo claims another ghost. The city remembers nothing.</div>
      <button onClick={() => { setChar(null); setLog([]); setCombat(null); setSheet(null); setThresholdScene(null); setHackContext(null); pendingHackResult.current = null; setScreen('title'); }}
        style={{ ...btn(S.red, 'transparent', S.red), fontSize: 14, letterSpacing: 3, padding: '0 40px', minHeight: 56, marginBottom: 12 }}>[ RESPAWN ]</button>
      <button onClick={() => { setChar(null); setLog([]); setCombat(null); setSheet(null); setThresholdScene(null); setHackContext(null); pendingHackResult.current = null; setScreen('legacy'); }}
        style={{ ...btn(S.gold, S.bgCard, S.gold + '66'), fontSize: 12, letterSpacing: 2, padding: '0 24px', minHeight: 44 }}>[ SPEND LEGACY ]</button>
    </div>
  );

  // ── JOB SCREEN ──
  if (screen === 'job' && job) return (
    <div style={{ background: job.isWin ? '#08080a' : S.bg, position: 'fixed', inset: 0, fontFamily: S.font, color: S.text, display: 'flex', flexDirection: 'column', overscrollBehavior: 'none' }}>
      <div style={{ background: S.bgCard, borderBottom: '1px solid ' + (job.isWin ? S.gold + '44' : S.border), padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {!job.isWin && <button onClick={() => { setJob(null); setScreen('game'); }} style={{ background: 'none', border: 'none', color: S.dim, fontFamily: S.font, fontSize: 22, cursor: 'pointer', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>}
        <span style={{ color: job.isWin ? S.gold : S.gold, fontSize: 13, letterSpacing: 3 }}>{job.isWin ? '◈ OPERATION AXIOM ZERO' : '◈ JOB BRIEFING'}</span>
      </div>
      <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
        {/* Briefing / epilogue text */}
        <div style={{ background: job.isWin ? '#100f08' : S.bgCard, border: '1px solid ' + (job.isWin ? S.gold + '44' : S.border), padding: '20px 16px', marginBottom: 20, fontSize: 14, lineHeight: 2.0, color: job.isWin ? '#c8c090' : '#d0d0e0', borderRadius: 4, fontStyle: job.isWin ? 'italic' : 'normal', whiteSpace: 'pre-line' }}>
          {job.briefing}
        </div>
        {job.isWin && <div style={{ background: '#1a1200', border: '1px solid ' + S.gold, borderRadius: 6, padding: '14px 16px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ color: S.gold, fontSize: 18 }}>+{job.legacyEarned} LEGACY POINTS</div>
          <div style={{ color: S.dim, fontSize: 12, marginTop: 4 }}>Carry these into every run that follows.</div>
        </div>}
        {job.isWin && (job.newAchievements || []).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {(job.newAchievements || []).map(id => {
              const a = ACHIEVEMENTS.find(x => x.id === id);
              if (!a) return null;
              return (
                <div key={id} style={{ background: '#0d0d0a', border: '1px solid ' + a.color + '66', borderRadius: 6, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: a.color, fontSize: 14 }}>{a.icon}</span>
                    <span style={{ color: a.color, fontSize: 11, letterSpacing: 2 }}>ACHIEVEMENT UNLOCKED</span>
                    <span style={{ color: S.gold, fontSize: 11, marginLeft: 'auto' }}>+{a.pts}pt</span>
                  </div>
                  <div style={{ color: '#c0c0d0', fontSize: 13 }}>{a.name}</div>
                  <div style={{ color: S.dim, fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>{a.flavor}</div>
                </div>
              );
            })}
          </div>
        )}
        {!job.isWin && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: S.bgCard, border: '1px solid ' + S.border, padding: 14, borderRadius: 4 }}><div style={{ color: S.dim, fontSize: 10, marginBottom: 4 }}>REWARD</div><div style={{ color: S.gold, fontSize: 22 }}>{char && char.archetype === 'fixer' ? job.reward + 150 : job.reward}¢</div>{char && char.archetype === 'fixer' && <div style={{ color: S.green, fontSize: 9, marginTop: 2 }}>+150¢ fixer</div>}</div>
            <div style={{ background: S.bgCard, border: '1px solid ' + S.border, padding: 14, borderRadius: 4 }}><div style={{ color: S.dim, fontSize: 10, marginBottom: 4 }}>XP</div><div style={{ color: S.green, fontSize: 22 }}>+{job.xpReward}</div></div>
          </div>
          {job.choice && <div style={{ background: '#0d0d20', border: '1px solid ' + S.pink, borderRadius: 6, padding: 16, marginBottom: 20 }}>
            <div style={{ color: S.pink, fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>MID-MISSION DECISION</div>
            <div style={{ color: S.text, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>{job.choice.prompt}</div>
            {!job.choiceResolved ? <>
              <button onClick={() => resolveJobChoice('a')} style={{ ...btn(S.green, '#071207', S.green), width: '100%', minHeight: 54, flexDirection: 'column', borderRadius: 4, marginBottom: 8, gap: 4, fontSize: 13 }}>
                <span style={{ fontWeight: 'bold' }}>{job.choice.a.label}</span>
                <span style={{ fontSize: 11, color: S.dim }}>{job.choice.a.outcome}</span>
                <span style={{ fontSize: 10, color: S.gold }}>{job.choice.a.modifier >= 0 ? '+' : ''}{job.choice.a.modifier}¢</span>
              </button>
              <button onClick={() => resolveJobChoice('b')} style={{ ...btn(S.orange, S.bgCard, S.orange + '66'), width: '100%', minHeight: 54, flexDirection: 'column', borderRadius: 4, gap: 4, fontSize: 13 }}>
                <span style={{ fontWeight: 'bold' }}>{job.choice.b.label}</span>
                <span style={{ fontSize: 11, color: S.dim }}>{job.choice.b.outcome}</span>
                <span style={{ fontSize: 10, color: S.gold }}>{job.choice.b.modifier >= 0 ? '+' : ''}{job.choice.b.modifier}¢</span>
              </button>
            </> : <div style={{ background: '#071207', border: '1px solid ' + S.green + '44', borderRadius: 4, padding: '10px 14px', fontSize: 12, color: S.green }}>✓ {job.choiceResolved === 'a' ? job.choice.a.label : job.choice.b.label}</div>}
          </div>}
          {job.factionId && <div style={{ background: S.bgCard, border: '1px solid ' + S.border, padding: '12px 16px', marginBottom: 20, borderRadius: 4, fontSize: 13 }}>
            <span style={{ color: S.dim }}>FACTION: </span>
            <span style={{ color: (WORLD_FACTIONS[job.factionId] && WORLD_FACTIONS[job.factionId].color) || S.text }}>{((WORLD_FACTIONS[job.factionId] && WORLD_FACTIONS[job.factionId].name) || job.factionId).toUpperCase()}</span>
            <span style={{ color: job.factionChange > 0 ? S.green : S.red, marginLeft: 8 }}>{job.factionChange > 0 ? '+' : ''}{job.factionChange} rep</span>
          </div>}
        </>}
      </div>
      <div style={{ padding: '16px 20px 36px', display: 'grid', gridTemplateColumns: job.isWin ? '1fr' : '1fr 1fr', gap: 12, flexShrink: 0 }}>
        {job.isWin
          ? <button onClick={() => { setJob(null); setChar(null); setLog([]); setCombat(null); setSheet(null); setThresholdScene(null); setHackContext(null); pendingHackResult.current = null; setScreen('title'); }}
              style={{ ...btn(S.gold, '#1a1200', S.gold), minHeight: 56, fontSize: 14, letterSpacing: 2, borderRadius: 4 }}>◈ END RUN</button>
          : <>
            <button onClick={() => { setJob(null); setScreen('game'); }} style={{ ...btn(S.dim, S.bgCard, S.border), minHeight: 56, fontSize: 14, borderRadius: 4 }}>PASS</button>
            <button onClick={completeJob} disabled={job.choice && !job.choiceResolved} style={{ ...btn(job.choice && !job.choiceResolved ? S.dim : S.green, job.choice && !job.choiceResolved ? '#0a0a0a' : '#071207', job.choice && !job.choiceResolved ? S.border : S.green), minHeight: 56, fontSize: 14, borderRadius: 4, opacity: job.choice && !job.choiceResolved ? 0.5 : 1 }}>
              {job.choice && !job.choiceResolved ? 'CHOOSE FIRST' : '► TAKE JOB'}
            </button>
          </>
        }
      </div>
    </div>
  );

  // ── COMBAT ──
  if (screen === 'combat' && combat) {
    const playerTurn = combat.turn === 'player';
    const actionsLocked = !combatReady || !playerTurn;
    const rawFleeDisplay = char ? (char.speed + getAugBonus(char, 'speed')) / 60 : 0.3;
    const _fleeFloor = char && char.augments && char.augments.includes('reflex_override') ? 0.50 : (char && char.archetype === 'soldier' ? 0.25 : 0);
    const fleeChance = char ? Math.min(0.85, Math.max(_fleeFloor, rawFleeDisplay)) : 0.3;
    const qhStat = char ? calcQuickhackStat() : 0;
    const ammoOut = char && char.weapon.ammo !== undefined && char.weapon.ammo <= 0;
    const enemyType = combat.enemy.type || 'human';
    // axiom_killswitch: unlocks Sync Spike at any hack stat
    const hasKillswitch = char && char.augments && char.augments.includes('axiom_killswitch');
    const availableQH = QUICKHACKS.filter(qh => {
      if (!qh.validTypes.includes(enemyType)) return false;
      if (qh.id === 'sync_spike' && hasKillswitch) return true;
      return qhStat >= qh.threshold;
    });
    // Psychosis slip effects in combat
    const slipLevel = (char && char.psychosisSlip) || 0;
    const slipLockedQH = slipLevel >= 2; // mid-slip: quickhack disabled
    const slipForcedAttack = slipLevel >= 1; // early slip: log forced aggression note
    return (
      <div style={{ background: S.bg, position: 'fixed', inset: 0, fontFamily: S.font, color: S.text, display: 'flex', flexDirection: 'column', overscrollBehavior: 'none' }}>
        <div style={{ background: '#12000a', borderBottom: '1px solid #33001a', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: S.red, fontSize: 13, letterSpacing: 3 }}>⚔ COMBAT</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {combat.enemy.type && <Tag label={combat.enemy.type.toUpperCase()} color={combat.enemy.type === 'machine' || combat.enemy.type === 'program' ? S.cyan : S.orange} />}
            <span style={{ color: S.dim, fontSize: 12 }}>R{combat.round}</span>
          </div>
        </div>
        {!combatReady && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,0,0,0.75)', fontFamily: S.font }}>
            <div style={{ color: S.red, fontSize: 14, letterSpacing: 4, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⚔</div>
              CONTACT
            </div>
          </div>
        )}
        {showQuickhackMenu && !actionsLocked && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,10,0.88)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 16px 20px' }}>
            <div style={{ color: S.cyan, fontSize: 12, letterSpacing: 3, marginBottom: 10 }}>⚡ SELECT QUICKHACK</div>
            {availableQH.map(qh => (
              <button key={qh.id} onClick={() => playerQuickhack(qh.id)}
                style={{ background: '#00111a', border: '1px solid ' + S.cyan + '88', color: S.cyan, fontFamily: S.font, minHeight: 54, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
                <span>{qh.label}</span>
                <span style={{ fontSize: 10, color: S.dim }}>{qh.desc}</span>
              </button>
            ))}
            {availableQH.length === 0 && <div style={{ color: S.dim, fontSize: 12, padding: '12px 0' }}>No quickhacks available against this target type.</div>}
            <button onClick={() => setShowQuickhackMenu(false)}
              style={{ background: 'transparent', border: '1px solid ' + S.border, color: S.dim, fontFamily: S.font, minHeight: 44, borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              CANCEL
            </button>
          </div>
        )}
        <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
          <div style={{ background: '#0a1208', border: '1px solid #1a3010', borderRadius: 6, padding: 12 }}>
            <div style={{ color: S.green, fontSize: 12, marginBottom: 6 }}>{char.name}</div>
            <pre style={{ color: S.green, fontSize: 'clamp(9px,2.8vw,13px)', margin: '0 0 8px', opacity: 0.7, lineHeight: 1.2 }}>{`╔═══╗\n║ ◉ ║\n║╱█╲║\n ╚═╝ `}</pre>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: S.dim }}>HP</span><span style={{ color: hpColor }}>{char.hp}/{char.maxHp}</span>
            </div>
            <Bar value={char.hp} max={char.maxHp} color={hpColor} height={7} />
            <div style={{ color: S.dim, fontSize: 10, marginTop: 6 }}>{char.weapon.name}{ammoOut ? ' [NO AMMO]' : char.weapon.ammo !== undefined ? ' [' + char.weapon.ammo + '/' + char.weapon.maxAmmo + ']' : ''}</div>
            {char.statuses && char.statuses.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {char.statuses.map(s => (
                  <div key={s.id} style={{ background: s.color + '18', border: '1px solid ' + s.color + '66', borderRadius: 3, padding: '3px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: s.color, fontSize: 11 }}>{s.icon} {s.name}</span>
                    <span style={{ color: s.color, fontSize: 10, opacity: 0.8 }}>{s.desc} {s.rounds}r</span>
                  </div>
                ))}
              </div>
            )}
            {slipLevel >= 1 && (
              <div style={{ marginTop: 5, fontSize: 9, color: slipLevel >= 2 ? S.red : S.orange, letterSpacing: 1, border: '1px solid ' + (slipLevel >= 2 ? S.red : S.orange) + '44', padding: '1px 5px', borderRadius: 2 }}>
                {slipLevel >= 2 ? '⚠ SLIP MID' : '⚠ SLIP EARLY'}
              </div>
            )}
          </div>
          <div style={{ background: '#120008', border: '1px solid #330012', borderRadius: 6, padding: 12 }}>
            <div style={{ color: S.red, fontSize: 12, marginBottom: 6 }}>{combat.enemy.name}</div>
            <pre style={{ color: S.red, fontSize: 'clamp(9px,2.8vw,13px)', margin: '0 0 8px', opacity: 0.7, lineHeight: 1.2 }}>{`╔═══╗\n║ × ║\n║▓█▓║\n ╚═╝ `}</pre>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: S.dim }}>HP</span><span style={{ color: S.red }}>{combat.enemy.hp}/{combat.enemy.maxHp}</span>
            </div>
            <Bar value={combat.enemy.hp} max={combat.enemy.maxHp} color={S.red} height={7} />
            <div style={{ color: S.dim, fontSize: 10, marginTop: 6 }}>{combat.enemy.behaviour}</div>
            {combat.enemy.inflicts && <div style={{ color: S.orange, fontSize: 11, marginTop: 2 }}>inflicts: {combat.enemy.inflicts}</div>}
          </div>
        </div>
        <div ref={combatLogRef} style={{ margin: '12px 16px', background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 12px', overflowY: 'auto', minHeight: 70, maxHeight: 130, fontSize: 12, lineHeight: 1.7, flex: 1 }}>
          {combatLog.length === 0 && <span style={{ color: S.dim }}>Combat begins...</span>}
          {combatLog.map(l => <div key={l.id} style={{ color: l.color }}>{l.msg}</div>)}
          {!playerTurn && <div style={{ color: '#333' }}>▌</div>}
        </div>
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8, flexShrink: 0 }}>
          <button disabled={actionsLocked} onClick={playerAttack} style={{ background: !actionsLocked ? '#071207' : S.bgCard, border: '1px solid ' + (!actionsLocked ? S.green : S.border), color: !actionsLocked ? S.green : '#333', fontFamily: S.font, minHeight: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 6, fontSize: 14, cursor: 'pointer', opacity: actionsLocked ? 0.4 : 1 }}>
            <span>► {ammoOut ? 'MELEE' : 'ATTACK'}</span>
            <span style={{ fontSize: 10, color: S.dim }}>{char.weapon.damage[0]}-{char.weapon.damage[1]} dmg</span>
          </button>
          <button disabled={actionsLocked || slipLockedQH} onClick={!slipLockedQH ? openQuickhackMenu : undefined}
            style={{ background: slipLockedQH ? '#1a0820' : showQuickhackMenu ? S.cyan + '22' : (!actionsLocked ? '#00111a' : S.bgCard),
              border: '1px solid ' + (slipLockedQH ? '#6a1a8a' : showQuickhackMenu ? S.cyan : (!actionsLocked ? S.cyan : S.border)),
              color: slipLockedQH ? '#6a2a8a' : !actionsLocked ? S.cyan : '#333',
              fontFamily: S.font, minHeight: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 6, fontSize: 14, cursor: slipLockedQH || actionsLocked ? 'not-allowed' : 'pointer', opacity: actionsLocked && !slipLockedQH ? 0.4 : 1 }}>
            <span>{slipLockedQH ? '⚡ SLIP-LOCKED' : '⚡ QUICKHACK'}</span>
            <span style={{ fontSize: 10, color: S.dim }}>{slipLockedQH ? 'mid-slip: locked' : availableQH.length + ' available'}</span>
          </button>
        </div>
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, flexShrink: 0 }}>
          <button disabled={actionsLocked} onClick={playerFlee} style={{ background: S.bgCard, border: '1px solid ' + (!actionsLocked ? S.orange : S.border), color: !actionsLocked ? S.orange : '#333', fontFamily: S.font, minHeight: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontSize: 14, cursor: 'pointer', opacity: actionsLocked ? 0.4 : 1, gap: 3 }}>
            <span>◌ FLEE</span><span style={{ fontSize: 10, color: S.dim }}>{Math.round(fleeChance * 100)}%</span>
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {char.inventory.filter(i => i.effect === 'heal' || i.effect === 'cleanse').length === 0 && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.dim, fontSize: 11, border: '1px solid ' + S.border, borderRadius: 6 }}>no stims</div>}
            {char.inventory.filter(i => i.effect === 'heal' || i.effect === 'cleanse').map(item => (
              <button key={item.id} disabled={actionsLocked} onClick={() => useItemCombat(item)} style={{ flex: 1, background: S.bgCard, border: '1px solid ' + S.border, color: S.text, fontFamily: S.font, minHeight: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 11, borderRadius: 6, cursor: 'pointer', gap: 2, opacity: actionsLocked ? 0.4 : 1 }}>
                <span>{item.effect === 'cleanse' ? '🧪' : '💉'}</span><span style={{ fontSize: 9, color: S.dim }}>×{item.quantity}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN GAME ──
  if (screen === 'game' && char) {
    const timeStr = 'D' + char.day + ' ' + String(char.hour).padStart(2, '0') + ':00';
    const { cx, cy, layer } = char.pos;
    return (
      <div style={{ background: S.bg, position: 'fixed', inset: 0, fontFamily: S.font, color: S.text, display: 'flex', flexDirection: 'column', maxWidth: 520, margin: '0 auto', overscrollBehavior: 'none' }}>
        {/* TOP BAR */}
        <div style={{ background: S.bgCard, borderBottom: '1px solid ' + S.border, padding: '8px 14px', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: S.pink, fontSize: 12, letterSpacing: 2 }}>NEO-KAIRO</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {saveIndicator && <span style={{ color: S.cyan, fontSize: 10, letterSpacing: 1, opacity: 0.9 }}>{saveIndicator}</span>}
              <span style={{ color: S.gold, fontSize: 11 }}>◈ {char.credits}¢</span>
              <span style={{ color: S.dim, fontSize: 10 }}>{timeStr}</span>
              <button onClick={() => setShowMenu(true)} style={{ background: 'none', border: '1px solid ' + S.border, color: S.dim, fontFamily: S.font, fontSize: 15, minHeight: 32, minWidth: 36, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent', letterSpacing: 1 }}>☰</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                <span style={{ color: S.dim }}>HP</span><span style={{ color: hpColor }}>{char.hp}/{char.maxHp}</span>
              </div>
              <Bar value={char.hp} max={char.maxHp} color={hpColor} height={4} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                <span style={{ color: S.dim }}>XP LV{char.level}</span><span style={{ color: S.gold }}>{char.xp}/{char.xpToNext}</span>
              </div>
              <Bar value={char.xp} max={char.xpToNext} color={S.gold} height={4} />
            </div>
          </div>
          {/* Humanity mini-indicator — always visible on HUD */}
          {(() => {
            const hum = char.humanity || 10;
            const humColor = hum > 5 ? '#3a6a3a' : hum > 3 ? S.orange : S.red;
            const humLabel = hum > 5 ? '♡' : hum > 3 ? '♡' : '⚠';
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <span style={{ color: humColor, fontSize: 9 }}>{humLabel} HUMANITY</span>
                <div style={{ flex: 1, height: 3, background: '#1a1a2a', borderRadius: 2 }}>
                  <div style={{ width: (hum / 10 * 100) + '%', height: '100%', background: humColor, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <span style={{ color: humColor, fontSize: 11 }}>{hum}/10</span>
              </div>
            );
          })()}
          {char.statuses && char.statuses.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
            {char.statuses.map(s => <span key={s.id} style={{ fontSize: 11, border: `1px solid ${s.color}44`, color: s.color, padding: '2px 6px', borderRadius: 2 }}>{s.icon} {s.name} {s.rounds}r</span>)}
          </div>}
          {(char.bounty || 0) > 0 && <div style={{ color: S.red, fontSize: 11, marginTop: 3, letterSpacing: 1 }}>☠ BOUNTY ACTIVE ({char.bounty})</div>}
          {/* Neuro Blocker HUD — shown when humanity <= 3 and dependency active */}
          {(char.humanity || 10) <= 3 && char.neuroblockerActive && (() => {
            const sl = char.psychosisSlip || 0;
            const barColor = sl >= 2 ? S.red : sl >= 1 ? S.orange : '#c084fc';
            const elapsed = ((char.day - (char.lastBlockerDay||1)) * 24) + (char.hour - (char.lastBlockerHour||8));
            const pct = Math.max(0, Math.min(100, (1 - elapsed / 48) * 100));
            return (
              <div style={{ marginTop: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
                  <span style={{ color: barColor, letterSpacing: 1 }}>NEURO BLOCKER{sl > 0 ? ` — SLIP ${sl > 1 ? 'MID' : 'EARLY'}` : ''}</span>
                  <span style={{ color: barColor }}>{Math.max(0, Math.floor(48 - elapsed))}h remaining</span>
                </div>
                <Bar value={pct} max={100} color={barColor} height={3} />
              </div>
            );
          })()}
          {char.weapon.ammo !== undefined && <div style={{ color: char.weapon.ammo === 0 ? S.red : S.dim, fontSize: 11, marginTop: 2 }}>
            {char.weapon.name}: {char.weapon.ammo}/{char.weapon.maxAmmo} ammo{char.weapon.ammo === 0 ? ' — OUT' : ''}
          </div>}
          {heistReady && <div onClick={() => setSheet('heist')} style={{ background: '#1a1200', border: '1px solid ' + S.gold, borderRadius: 3, padding: '4px 8px', marginTop: 5, fontSize: 10, color: S.gold, textAlign: 'center', cursor: 'pointer' }}>◈ OPERATION AXIOM ZERO — TAP TO EXECUTE</div>}
          {axiomHeistReady && <div onClick={() => setSheet('axiom_heist')} style={{ background: '#001a1a', border: '1px solid ' + S.cyan, borderRadius: 3, padding: '4px 8px', marginTop: 5, fontSize: 10, color: S.cyan, textAlign: 'center', cursor: 'pointer' }}>◈ OPERATION ZERO EXPORT — TAP TO EXECUTE</div>}
        </div>

        {/* TOAST */}
        {notif && <div style={{ position: 'fixed', top: 86, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: S.bgRaised, border: '1px solid ' + notif.color, color: notif.color, fontFamily: S.font, fontSize: 12, padding: '8px 16px', borderRadius: 4, whiteSpace: 'nowrap', boxShadow: '0 0 20px ' + notif.color + '44', pointerEvents: 'none' }}>{notif.msg}</div>}

        {/* THRESHOLD SCENE OVERLAY */}
        {thresholdScene && (() => {
          const isHumanity = thresholdScene.sceneId && thresholdScene.sceneId.startsWith('humanity_');
          const accentColor = isHumanity
            ? (thresholdScene.sceneId === 'humanity_1' ? S.red : thresholdScene.sceneId === 'humanity_3' ? S.orange : S.dim)
            : '#9090b8';
          const label = isHumanity
            ? ({ humanity_5: 'HUMANITY: 5', humanity_3: 'HUMANITY: 3', humanity_1: 'HUMANITY: 1' }[thresholdScene.sceneId] || 'THRESHOLD')
            : 'INTERNAL MONOLOGUE';
          return (
            <div
              onClick={() => setThresholdScene(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 300,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                maxWidth: 340,
                border: `1px solid ${accentColor}44`,
                borderRadius: 8,
                padding: '28px 24px',
                background: '#06060e',
              }}>
                <div style={{
                  fontSize: 11, letterSpacing: 3,
                  color: accentColor, marginBottom: 20,
                  opacity: 0.9,
                }}>
                  {label}
                </div>
                {isHumanity && (
                  <div style={{ marginBottom: 16, display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 1,
                        background: i <= (char.humanity || 10) ? accentColor : '#1a1a2a',
                        opacity: i <= (char.humanity || 10) ? 1 : 0.3,
                      }} />
                    ))}
                  </div>
                )}
                <div style={{
                  color: '#c8c8d8',
                  fontSize: 13,
                  lineHeight: 1.85,
                  fontStyle: 'italic',
                  whiteSpace: 'pre-wrap',
                }}>
                  {thresholdScene.text}
                </div>
                <div style={{
                  marginTop: 24,
                  fontSize: 11,
                  letterSpacing: 3,
                  color: '#555570',
                  textAlign: 'center',
                }}>
                  TAP TO CONTINUE
                </div>
              </div>
            </div>
          );
        })()}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 68, overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}>
          {nav === 'map' && (
            <MapView pos={char.pos} defeated={char.looted} onInteract={(dir) => {
              if (dir === 'GEAR') { setNav('gear'); return; }
              handleMapInteract(dir);
            }} log={log} char={char} onUseItem={useItem} />
          )}
          {nav === 'gear' && (
            <div style={{ padding: 14 }}>
              <div style={{ color: S.dim, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>EQUIPPED</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: 12 }}>
                  <div style={{ color: S.dim, fontSize: 10, marginBottom: 4 }}>WEAPON</div>
                  <div style={{ color: S.green, fontSize: 13 }}>{char.weapon.name}</div>
                  <div style={{ color: S.dim, fontSize: 10, marginTop: 3 }}>{char.weapon.damage[0]}-{char.weapon.damage[1]} · {char.weapon.type}</div>
                  {char.weapon.special && <div style={{ color: S.orange, fontSize: 9, marginTop: 2 }}>[{char.weapon.special.toUpperCase()}]</div>}
                  {char.weapon.ammo !== undefined && <div style={{ color: char.weapon.ammo > 0 ? S.dim : S.red, fontSize: 10 }}>Ammo: {char.weapon.ammo}/{char.weapon.maxAmmo}</div>}
                </div>
                <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: 12 }}>
                  <div style={{ color: S.dim, fontSize: 10, marginBottom: 4 }}>ARMOR</div>
                  <div style={{ color: S.cyan, fontSize: 13 }}>{char.armor.name}</div>
                  <div style={{ color: S.dim, fontSize: 10, marginTop: 3 }}>DEF: {char.armor.defense}</div>
                  {char.armor.special && <div style={{ color: S.cyan, fontSize: 9, marginTop: 2 }}>[{char.armor.special.toUpperCase()}]</div>}
                </div>
              </div>
              <div style={{ color: S.dim, fontSize: 10, marginBottom: 6 }}>HUMANITY: {char.humanity || 10}/10</div>
              <Bar value={char.humanity || 10} max={10} color={(char.humanity || 10) > 5 ? S.green : (char.humanity || 10) > 3 ? S.orange : S.red} height={5} />
              <div style={{ color: S.dim, fontSize: 12, letterSpacing: 2, marginBottom: 10, marginTop: 18 }}>INVENTORY ({char.inventory.length})</div>
              {char.inventory.length === 0 && <div style={{ color: '#2a2a44', fontSize: 12, marginBottom: 14 }}>Nothing carried.</div>}
              {char.inventory.map(item => (
                <div key={item.id} style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ color: S.text, fontSize: 12 }}>{item.name} <span style={{ color: S.dim }}>×{item.quantity}</span>{item.effect === 'sell_only' && <span style={{ color: S.gold, fontSize: 9, marginLeft: 5 }}>SELL ONLY</span>}</div><div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>{item.desc}</div></div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 10 }}>
                    {(item.effect === 'heal' || item.effect === 'credits' || item.effect === 'cleanse' || item.effect === 'ammo' || item.effect === 'hack' || item.effect === 'stealth' || item.effect === 'jam_sync') && (
                      <button onClick={() => useItem(item)} style={{ background: '#0a1a0a', border: '1px solid ' + S.green + '66', color: S.green, fontFamily: S.font, fontSize: 10, minHeight: 40, minWidth: 50, borderRadius: 4, cursor: 'pointer' }}>USE</button>
                    )}
                    {item.sell > 0 && (
                      <button onClick={() => {
                        const sellVal = Math.floor(item.sell * (char.archetype === 'fixer' ? 1.3 : 1.0));
                        setChar(prev => {
                          const inv = [...prev.inventory];
                          const idx = inv.findIndex(i => i.id === item.id);
                          if (idx === -1) return prev;
                          if (inv[idx].quantity > 1) inv[idx] = { ...inv[idx], quantity: inv[idx].quantity - 1 };
                          else inv.splice(idx, 1);
                          return { ...prev, inventory: inv, credits: prev.credits + sellVal };
                        });
                        notify('+' + Math.floor(item.sell * (char.archetype === 'fixer' ? 1.3 : 1.0)) + '¢', S.gold);
                      }} style={{ background: '#1a1200', border: '1px solid ' + S.gold + '55', color: S.gold, fontFamily: S.font, fontSize: 10, minHeight: 40, minWidth: 50, borderRadius: 4, cursor: 'pointer' }}>
                        {Math.floor(item.sell * (char.archetype === 'fixer' ? 1.3 : 1.0))}¢
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ color: S.dim, fontSize: 12, letterSpacing: 2, marginBottom: 10, marginTop: 18 }}>AUGMENTS ({char.augments.length}/8)</div>
              <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: 10, marginBottom: 10 }}>
                {['brain','eyes','skin','nerves','skeleton','lungs','blood','cortex'].map(slot => {
                  const aug = WORLD_AUGMENTS.find(a => a.slot === slot && char.augments.includes(a.id));
                  return <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid ' + S.border }}>
                    <span style={{ color: aug ? S.cyan : S.dim, fontSize: 11, width: 60, flexShrink: 0 }}>{slot.toUpperCase()}</span>
                    <span style={{ color: aug ? S.cyan : '#1e1e38', fontSize: 11 }}>{aug ? '✓ ' + aug.name : '—'}</span>
                  </div>;
                })}
              </div>

              {/* Stashed weapons */}
              {(char.stashedWeapons || []).length > 0 && <>
                <div style={{ color: S.dim, fontSize: 12, letterSpacing: 2, marginBottom: 8, marginTop: 18 }}>STASHED WEAPONS ({char.stashedWeapons.length})</div>
                {char.stashedWeapons.map(w => (
                  <div key={w.id} style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: S.green, fontSize: 13 }}>{w.name}</div>
                        <div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>{w.damage[0]}-{w.damage[1]} · {w.type}{w.special ? ' [' + w.special + ']' : ''}</div>
                        <div style={{ color: char.weapon.damage[0] < w.damage[0] ? S.green : S.dim, fontSize: 10, marginTop: 1 }}>
                          vs equipped: {w.damage[0] - char.weapon.damage[0] >= 0 ? '+' : ''}{w.damage[0] - char.weapon.damage[0]} to {w.damage[1] - char.weapon.damage[1]}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, marginLeft: 10 }}>
                        <button onClick={() => equipStashedWeapon(w)} style={{ background: '#071207', border: '1px solid ' + S.green + '66', color: S.green, fontFamily: S.font, fontSize: 10, minHeight: 34, minWidth: 56, borderRadius: 4, cursor: 'pointer' }}>EQUIP</button>
                        <button onClick={() => sellStashedWeapon(w)} style={{ background: '#1a1200', border: '1px solid ' + S.gold + '55', color: S.gold, fontFamily: S.font, fontSize: 10, minHeight: 34, minWidth: 56, borderRadius: 4, cursor: 'pointer' }}>{Math.floor((w.sell || Math.floor((w.value||50)*0.3)) * (char.archetype==='fixer'?1.3:1.0))}¢</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>}

              {/* Stashed armors */}
              {(char.stashedArmors || []).length > 0 && <>
                <div style={{ color: S.dim, fontSize: 12, letterSpacing: 2, marginBottom: 8, marginTop: 18 }}>STASHED ARMOR ({char.stashedArmors.length})</div>
                {char.stashedArmors.map(a => (
                  <div key={a.id} style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: S.cyan, fontSize: 13 }}>{a.name}</div>
                        <div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>DEF {a.defense}{a.special ? ' [' + a.special.replace(/_/g,' ') + ']' : ''}</div>
                        <div style={{ color: a.defense > char.armor.defense ? S.green : S.dim, fontSize: 10, marginTop: 1 }}>
                          vs equipped: {a.defense - char.armor.defense >= 0 ? '+' : ''}{a.defense - char.armor.defense} defense
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, marginLeft: 10 }}>
                        <button onClick={() => equipStashedArmor(a)} style={{ background: '#00111a', border: '1px solid ' + S.cyan + '66', color: S.cyan, fontFamily: S.font, fontSize: 10, minHeight: 34, minWidth: 56, borderRadius: 4, cursor: 'pointer' }}>EQUIP</button>
                        <button onClick={() => sellStashedArmor(a)} style={{ background: '#1a1200', border: '1px solid ' + S.gold + '55', color: S.gold, fontFamily: S.font, fontSize: 10, minHeight: 34, minWidth: 56, borderRadius: 4, cursor: 'pointer' }}>{Math.floor((a.sell || Math.floor((a.value||50)*0.3)) * (char.archetype==='fixer'?1.3:1.0))}¢</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>}

              {/* Hacking programs */}
              {(() => {
                const installedProgs = buildHackPrograms(char);
                const hasProgs = installedProgs.length > 0 || (char.iceCharges || 0) > 0;
                if (!hasProgs) return null;
                return (
                  <>
                    <div style={{ color: S.cyan, fontSize: 11, letterSpacing: 2, marginBottom: 8, marginTop: 14 }}>CYBERWARE SOFTWARE</div>
                    <div style={{ background: '#060610', border: '1px solid ' + S.cyan + '33', borderRadius: 6, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid ' + S.border }}>
                        <span style={{ color: S.dim, fontSize: 10, letterSpacing: 2 }}>ICE CHARGES</span>
                        <span style={{ color: (char.iceCharges || 0) > 0 ? S.cyan : S.dim, fontSize: 12 }}>
                          {Array.from({ length: 3 }).map((_, i) =>
                            <span key={i} style={{ marginLeft: 3 }}>{i < (char.iceCharges || 0) ? '◈' : '○'}</span>
                          )}
                        </span>
                      </div>
                      {installedProgs.map(progId => {
                        const prog = HACK_PROGRAMS[progId];
                        if (!prog) return null;
                        return (
                          <div key={progId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
                            <span style={{ color: S.cyan, fontSize: 11 }}>{prog.label}</span>
                            <span style={{ color: S.dim, fontSize: 9 }}>{prog.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {nav === 'factions' && (
            <div style={{ padding: 14 }}>
              <div style={{ color: S.dim, fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>FACTION STANDING</div>
              {Object.entries(WORLD_FACTIONS).map(([id, f]) => {
                const rep = (char.reputation && char.reputation[id]) || 0;
                const tier = getFactionTier(rep);
                const { nextUp, nextDown } = getNextTierThreshold(rep);
                const effects = (FACTION_EFFECTS[id] && FACTION_EFFECTS[id][tier.id]?.effects) || [];
                const activeEffects = effects.filter(Boolean);
                // Progress within current tier
                const tierSpan = tier.max === Infinity ? 10 : (tier.max - tier.min);
                const tierProgress = tier.min === -Infinity ? 100 : Math.min(100, Math.max(0, ((rep - tier.min) / tierSpan) * 100));
                const toNextUp = nextUp ? (nextUp.min - rep) : null;
                const toNextDown = nextDown ? (rep - nextDown.max + 1) : null;
                return (
                  <div key={id} style={{ background: S.bgCard, border: '1px solid ' + f.color + '33', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ color: f.color, fontSize: 13 }}>{f.name}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: tier.color, fontSize: 11, letterSpacing: 1, border: '1px solid ' + tier.color + '44', padding: '1px 6px', borderRadius: 3 }}>{tier.label}</span>
                        <span style={{ color: rep >= 0 ? S.green : S.red, fontSize: 13 }}>{rep > 0 ? '+' : ''}{rep}</span>
                      </div>
                    </div>
                    {/* Faction ethos — brief flavour */}
                    {f.ethos && (
                      <div style={{ color: '#555570', fontSize: 10, lineHeight: 1.6, marginBottom: 7, fontStyle: 'italic' }}>{f.ethos}</div>
                    )}
                    {/* Tier progress bar */}
                    <Bar value={tierProgress} max={100} color={tier.color} height={4} />
                    {/* Next threshold hint */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10 }}>
                      {toNextDown && tier.id !== 'enemy' ? (
                        <span style={{ color: '#444455' }}>{toNextDown} rep from {nextDown.label}</span>
                      ) : <span />}
                      {toNextUp && tier.id !== 'legend' ? (
                        <span style={{ color: S.dim }}>{toNextUp} rep to {nextUp.label}</span>
                      ) : tier.id === 'legend' ? (
                        <span style={{ color: S.gold }}>Maximum standing</span>
                      ) : <span />}
                    </div>
                    {/* Active tier effects */}
                    {activeEffects.length > 0 && (
                      <div style={{ marginTop: 8, borderTop: '1px solid ' + S.border, paddingTop: 7 }}>
                        {activeEffects.map((eff, i) => (
                          <div key={i} style={{ color: rep >= 25 ? '#447744' : S.orange, fontSize: 10, lineHeight: 1.6, paddingLeft: 4 }}>
                            {rep >= 25 ? '▸ ' : '⚠ '}{eff}
                          </div>
                        ))}
                      </div>
                    )}
                    {activeEffects.length === 0 && (
                      <div style={{ color: '#2a2a44', fontSize: 10, marginTop: 7 }}>No active effects at this tier.</div>
                    )}
                    {/* Why choose — only shown at neutral/below to help player decide */}
                    {rep <= 0 && f.chooseReason && (
                      <div style={{ marginTop: 8, borderTop: '1px solid #1a1a30', paddingTop: 7, color: '#3a3a55', fontSize: 10, lineHeight: 1.6 }}>
                        ◈ {f.chooseReason}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Heist tracker */}
              <div style={{ background: S.bgCard, border: '1px solid ' + (heistReady ? S.gold : S.border) + '66', borderRadius: 8, padding: 14, marginTop: 4 }}>
                <div style={{ color: heistReady ? S.gold : S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>OPERATION: AXIOM ZERO {heistReady ? '— READY' : '— LOCKED'}</div>
                {(() => {
                  const rep = char.reputation || {};
                  const underground = Math.max(rep.ghosts || 0, rep.meridian || 0, rep.ironhand || 0);
                  const undergroundLabel = rep.ghosts >= 60 ? 'GHOST ALLIED' : rep.meridian >= 60 ? 'MERIDIAN ALLIED' : rep.ironhand >= 60 ? 'IRONHAND ALLIED' : `Underground (${underground}/60)`;
                  return [
                    { label: 'Level 8', done: char.level >= 8, val: 'LV' + char.level },
                    { label: '5000¢', done: char.credits >= 5000, val: char.credits + '¢' },
                    { label: 'Axiom Hostile (≤-25)', done: (rep.axiom || 0) <= -25, val: (rep.axiom || 0) + '' },
                    { label: 'Network Allied (Ghost/Meridian/Ironhand ≥60)', done: underground >= 60, val: undergroundLabel },
                  ].map(r => <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: r.done ? S.green : S.dim }}>{r.done ? '✓' : '○'} {r.label}</span>
                    <span style={{ color: r.done ? S.green : S.red }}>{r.val}</span>
                  </div>);
                })()}
              </div>
              {/* Axiom heist tracker */}
              <div style={{ background: S.bgCard, border: '1px solid ' + (axiomHeistReady ? S.cyan : S.border) + '66', borderRadius: 8, padding: 14, marginTop: 8 }}>
                <div style={{ color: axiomHeistReady ? S.cyan : S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>OPERATION: ZERO EXPORT {axiomHeistReady ? '— READY' : '— LOCKED'}</div>
                {(() => {
                  const rep = char.reputation || {};
                  const hasCortexRelay = (char.augments || []).includes('cortex_relay');
                  return [
                    { label: 'Level 8', done: char.level >= 8, val: 'LV' + char.level },
                    { label: '3000¢', done: char.credits >= 3000, val: char.credits + '¢' },
                    { label: 'Axiom Allied (≥80)', done: (rep.axiom || 0) >= 80, val: (rep.axiom || 0) + '' },
                    { label: 'Meridian Hostile (≤-60)', done: (rep.meridian || 0) <= -60, val: (rep.meridian || 0) + '' },
                    { label: 'Cortex Relay augment', done: hasCortexRelay, val: hasCortexRelay ? 'INSTALLED' : 'MISSING' },
                  ].map(r => <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: r.done ? S.cyan : S.dim }}>{r.done ? '✓' : '○'} {r.label}</span>
                    <span style={{ color: r.done ? S.cyan : S.red }}>{r.val}</span>
                  </div>);
                })()}
              </div>
            </div>
          )}
          {nav === 'char' && (
            <div style={{ padding: 14 }}>
              <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 8, padding: 18, marginBottom: 14 }}>
                <div style={{ color: S.pink, fontSize: 16, marginBottom: 3 }}>{char.name}</div>
                <div style={{ color: S.dim, fontSize: 11, marginBottom: 16 }}>Level {char.level} {char.archetype.toUpperCase()}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[{ l: 'STR', v: char.strength + getAugBonus(char, 'strength') }, { l: 'ACC', v: char.accuracy + getAugBonus(char, 'accuracy') }, { l: 'DEF', v: char.defense + getAugBonus(char, 'defense') }, { l: 'SPD', v: char.speed + getAugBonus(char, 'speed') }, { l: 'HACK', v: char.hacking + getAugBonus(char, 'hacking'), sub: (() => { const prgs = buildHackPrograms(char).length; const ice = char.iceCharges || 0; const hks = Math.max(0, 4 - (char.hackCount || 0)); const parts = []; if (prgs > 0) parts.push(prgs + 'prg'); if (ice > 0) parts.push(ice + 'ice'); parts.push(hks + ' hacks left'); return parts.join(' · '); })() }, { l: 'CHA', v: char.charisma }].map(s => (
                    <div key={s.l} style={{ background: S.bgRaised, borderRadius: 4, padding: '8px', textAlign: 'center' }}>
                      <div style={{ color: S.dim, fontSize: 11, marginBottom: 3 }}>{s.l}</div>
                      <div style={{ color: S.text, fontSize: 18 }}>{s.v}</div>
                      {s.sub && <div style={{ color: S.cyan, fontSize: 10, marginTop: 2, letterSpacing: 0 }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[{ label: 'KILLS', val: char.kills, color: S.red }, { label: 'JOBS', val: char.jobsDone, color: S.gold }, { label: 'CHUNKS', val: (char.visited || []).length, color: S.cyan }, { label: 'CREDITS', val: char.credits + '¢', color: S.gold }].map(s => (
                  <div key={s.label} style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ color: S.dim, fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ color: s.color, fontSize: s.label === 'CREDITS' ? 13 : 20 }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: S.bgCard, border: '1px solid ' + S.gold + '44', borderRadius: 6, padding: 12 }}>
                <div style={{ color: S.gold, fontSize: 12, marginBottom: 4 }}>GHOST LEGACY</div>
                <div style={{ color: S.dim, fontSize: 11 }}>Total: {legacy.points}pt · Runs: {legacy.totalRuns} · Wins: {legacy.wins}</div>
                <div style={{ color: S.dim, fontSize: 10, marginTop: 3 }}>This run: +{char.runLegacyEarned || 0}pt</div>
              </div>
              {/* Archetype ability */}
              {(() => {
                const ab = ARCHETYPE_EXPLORE_ABILITIES[char.archetype];
                if (!ab) return null;
                return (
                  <div style={{ background: '#0d0d1a', border: '1px solid ' + S.pink + '33', borderRadius: 6, padding: 12, marginTop: 10 }}>
                    <div style={{ color: S.pink, fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>CLASS ABILITY · {char.archetype.toUpperCase()}</div>
                    <div style={{ color: S.text, fontSize: 13, marginBottom: 3 }}>{ab.label}</div>
                    <div style={{ color: S.dim, fontSize: 11, lineHeight: 1.5 }}>{ab.desc}</div>
                  </div>
                );
              })()}
              {/* Completed quests */}
              {(char.questsCompleted || []).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: S.dim, fontSize: 12, letterSpacing: 2, marginBottom: 8, marginTop: 18 }}>COMPLETED QUESTS ({char.questsCompleted.length})</div>
                  {char.questsCompleted.map(qid => {
                    const q = SIDEQUESTS[qid];
                    if (!q) return null;
                    return (
                      <div key={qid} style={{ background: S.bgCard, border: '1px solid ' + S.green + '22', borderRadius: 5, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: S.green, fontSize: 11 }}>✓ {q.title}</div>
                          <div style={{ color: S.dim, fontSize: 10, marginTop: 1 }}>{q.npc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {nav === 'log' && (
            <div style={{ padding: 14 }}>
              {/* ── OBJECTIVE LINE ── */}
              {(() => {
                const rep = char.reputation || {};
                const thresholds = char.thresholdsSeen || [];
                const quests = char.questsCompleted || [];
                const axiomRep = rep.axiom || 0;
                const underground = Math.max(rep.ghosts || 0, rep.meridian || 0, rep.ironhand || 0);
                const isAxiomPath = axiomRep >= 40;
                const isResistancePath = axiomRep <= -25 || underground >= 30;

                let objective = '';
                let objColor = S.gold;

                if (heistReady) {
                  objective = '◈ OPERATION AXIOM ZERO — READY. Go to FACTION tab to execute.';
                  objColor = S.gold;
                } else if (axiomHeistReady) {
                  objective = '◈ OPERATION ZERO EXPORT — READY. Go to FACTION tab to execute.';
                  objColor = S.cyan;
                } else if (thresholds.includes('the_plan')) {
                  // Beat 3 done — gather final requirements
                  if (isAxiomPath) {
                    const hasCortex = (char.augments || []).includes('cortex_relay');
                    const needs = [];
                    if (axiomRep < 80) needs.push('Axiom rep ' + axiomRep + '/80');
                    if ((rep.meridian || 0) > -60) needs.push('Meridian hostile ' + (rep.meridian || 0) + '/-60');
                    if (!hasCortex) needs.push('Cortex Relay augment');
                    if (char.credits < 3000) needs.push(char.credits + '¢/3000');
                    if (char.level < 8) needs.push('LV' + char.level + '/8');
                    objective = 'ZERO EXPORT: ' + (needs.length ? needs.slice(0,2).join(' · ') : 'almost ready');
                    objColor = S.cyan;
                  } else {
                    const needs = [];
                    if (underground < 60) needs.push('Network rep ' + underground + '/60');
                    if (axiomRep > -25) needs.push('Axiom hostile ' + axiomRep + '/-25');
                    if (char.credits < 5000) needs.push(char.credits + '¢/5000');
                    if (char.level < 8) needs.push('LV' + char.level + '/8');
                    objective = 'AXIOM ZERO: ' + (needs.length ? needs.slice(0,2).join(' · ') : 'almost ready');
                    objColor = S.gold;
                  }
                } else if (thresholds.includes('commitment')) {
                  // Beat 2 done — find the plan
                  if (isAxiomPath) {
                    objective = 'Build Axiom standing to Allied (rep ' + axiomRep + '/80). Get Cortex Relay augment.';
                    objColor = S.cyan;
                  } else {
                    objective = 'Find underground allies. Build rep with Ghosts, Meridian, or Ironhand (' + underground + '/60).';
                    objColor = S.gold;
                  }
                } else if (thresholds.includes('discovery')) {
                  // Beat 1 done — commit to a path
                  if (isAxiomPath) {
                    objective = 'Deepen Axiom ties. Take corpo contracts. Make Division Seven notice you.';
                    objColor = S.cyan;
                  } else {
                    objective = 'Make Axiom hostile. Take jobs, build rep, make noise (' + axiomRep + '/-40).';
                    objColor = S.gold;
                  }
                } else if (quests.length >= 1 || char.jobsDone >= 2) {
                  // Discovery imminent
                  if (char.backstory === 'corpo') {
                    objective = 'Work with Aria. Take Axiom-aligned contracts. Learn what Division Seven wants.';
                    objColor = S.cyan;
                  } else {
                    objective = 'Keep working with ' + (char.contactNPC || 'your contact') + '. Something bigger is coming.';
                    objColor = S.text;
                  }
                } else {
                  // Very early — find contact
                  objective = 'Find ' + (char.contactNPC || 'your contact') + ' — look for ☻ on the map.';
                  objColor = S.pink;
                }

                return (
                  <div style={{ background: '#0a0a18', border: '1px solid ' + objColor + '44', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                    <div style={{ color: S.dim, fontSize: 9, letterSpacing: 2, marginBottom: 3 }}>OBJECTIVE</div>
                    <div style={{ color: objColor, fontSize: 11, lineHeight: 1.5 }}>{objective}</div>
                  </div>
                );
              })()}
              {/* Pinned active job */}
              {job && !job.isWin && (
                <div style={{ background: '#0d0d1a', border: '1px solid ' + S.gold + '55', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                  <div style={{ color: S.gold, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>◈ ACTIVE JOB</div>
                  <div style={{ color: S.text, fontSize: 12, lineHeight: 1.6 }}>{job.briefing ? job.briefing.slice(0, 120) + (job.briefing.length > 120 ? '…' : '') : 'Job in progress.'}</div>
                  <div style={{ color: S.gold, fontSize: 11, marginTop: 5 }}>Reward: {char.archetype === 'fixer' ? job.reward + 150 : job.reward}¢ · {job.xpReward}xp</div>
                </div>
              )}
              <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>EVENT LOG</div>
              <div ref={logRef} style={{ fontSize: textLarge ? 14 : 12, lineHeight: 1.7 }}>
                {log.length === 0 && <div style={{ color: '#2a2a44' }}>System online.</div>}
                {[...log].reverse().map(l => <div key={l.id} style={{ color: l.color, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid ' + S.border }}>{l.msg}</div>)}
              </div>
            </div>
          )}
        </div>

        {/* ── GAME MENU SHEET ── */}
        {showMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <div onClick={() => setShowMenu(false)} style={{ position: 'absolute', inset: 0, background: '#000000cc' }} />
            {/* Sheet */}
            <div style={{ position: 'relative', background: S.bgCard, borderTop: '2px solid ' + S.pink + '44', borderRadius: '20px 20px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: S.border }} />
              </div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px', borderBottom: '1px solid ' + S.border, flexShrink: 0 }}>
                <span style={{ color: S.pink, fontFamily: S.font, fontSize: 13, letterSpacing: 3 }}>◈ MENU</span>
                <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: S.dim, fontFamily: S.font, fontSize: 22, cursor: 'pointer', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}>✕</button>
              </div>
              {/* Scrollable content */}
              <div style={{ overflowY: 'auto', padding: '20px 20px 48px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── SAVE SECTION ── */}
                <div>
                  <div style={{ color: S.dim, fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>SAVE</div>
                  {/* Save now — primary action, big tap target */}
                  <button onClick={async () => { await manualSave(); }} style={{ width: '100%', minHeight: 56, background: '#0a1a0a', border: '1px solid ' + S.green + '55', color: S.green, fontFamily: S.font, fontSize: 14, letterSpacing: 2, borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, WebkitTapHighlightColor: 'transparent', marginBottom: 10 }}>
                    <span>◈ SAVE NOW</span>
                    {lastSaved && <span style={{ fontSize: 10, color: S.dim, letterSpacing: 1 }}>Last saved {lastSaved}</span>}
                  </button>
                  {/* Export / Import — same row, secondary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={() => { exportSave(); }} style={{ minHeight: 48, background: 'none', border: '1px solid ' + S.cyan + '44', color: S.cyan, fontFamily: S.font, fontSize: 12, letterSpacing: 1, borderRadius: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      ↑ EXPORT
                    </button>
                    <button onClick={() => { importSave(); }} style={{ minHeight: 48, background: 'none', border: '1px solid ' + S.dim + '44', color: S.dim, fontFamily: S.font, fontSize: 12, letterSpacing: 1, borderRadius: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      ↓ IMPORT
                    </button>
                  </div>
                  <div style={{ color: S.dim, fontSize: 10, marginTop: 8, lineHeight: 1.5 }}>
                    Export copies your save to clipboard. Import pastes it back. Use for backup or cross-device transfer.
                  </div>
                </div>

                {/* ── AUDIO SECTION ── */}
                <div>
                  <div style={{ color: S.dim, fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>AUDIO</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Music toggle */}
                    <button onClick={toggleMusic} style={{ width: '100%', minHeight: 52, background: musicOn ? '#0d1a0d' : S.bgRaised, border: '1px solid ' + (musicOn ? S.green + '55' : S.border), borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{ color: S.text, fontFamily: S.font, fontSize: 13 }}>♫ Music</span>
                      <span style={{ fontFamily: S.font, fontSize: 12, letterSpacing: 1, color: musicOn ? S.green : S.dim }}>{musicOn ? 'ON' : 'OFF'}</span>
                    </button>
                    {/* SFX toggle */}
                    <button onClick={toggleSfx} style={{ width: '100%', minHeight: 52, background: sfxOn ? '#0d1a0d' : S.bgRaised, border: '1px solid ' + (sfxOn ? S.green + '55' : S.border), borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{ color: S.text, fontFamily: S.font, fontSize: 13 }}>◉ Sound FX</span>
                      <span style={{ fontFamily: S.font, fontSize: 12, letterSpacing: 1, color: sfxOn ? S.green : S.dim }}>{sfxOn ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>

                {/* ── DISPLAY SECTION ── */}
                <div>
                  <div style={{ color: S.dim, fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>DISPLAY</div>
                  <button onClick={() => setTextLarge(v => !v)} style={{ width: '100%', minHeight: 52, background: textLarge ? '#0d0d1a' : S.bgRaised, border: '1px solid ' + (textLarge ? S.cyan + '55' : S.border), borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', WebkitTapHighlightColor: 'transparent' }}>
                    <span style={{ color: S.text, fontFamily: S.font, fontSize: 13 }}>Aa Text Size</span>
                    <span style={{ fontFamily: S.font, fontSize: 12, letterSpacing: 1, color: textLarge ? S.cyan : S.dim }}>{textLarge ? 'LARGE' : 'NORMAL'}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520, background: S.bgCard, borderTop: '1px solid ' + S.border, display: 'flex', zIndex: 20 }}>
          {[{ id: 'map', icon: '◈', label: 'MAP' }, { id: 'gear', icon: '⚙', label: 'GEAR' }, { id: 'factions', icon: '◉', label: 'FACTION' }, { id: 'char', icon: '▲', label: 'CHAR' }, { id: 'log', icon: '≡', label: 'LOG' }].map(n => (
            <button key={n.id} onClick={() => setNav(n.id)} style={{ flex: 1, background: nav === n.id ? '#12122a' : 'none', border: 'none', borderTop: '2px solid ' + (nav === n.id ? S.pink : 'transparent'), color: nav === n.id ? S.pink : S.dim, fontFamily: S.font, fontSize: 11, padding: '10px 2px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, WebkitTapHighlightColor: 'transparent', minHeight: 56 }}>
              <span style={{ fontSize: 20 }}>{n.icon}</span><span style={{ letterSpacing: 1 }}>{n.label}</span>
            </button>
          ))}
        </div>

        {/* SHEETS — shop, job prompt, rest, terminal, ladder */}
        {sheet && sheet.type === 'shop' && (() => {
          // Charisma-based price modifier: fixer/high-charisma gets discounts
          const charisma = char.charisma || 10;
          let discount = char.archetype === 'fixer'
            ? Math.max(0.65, 1 - (charisma / 100))  // Fixer: CHA-scaled, 20%→35% discount, min price 65%
            : charisma >= 18 ? 0.90 : charisma >= 14 ? 0.95 : 1.0;
          const shopData = sheet.data;
          // ── FACTION SHOP MODIFIERS ──
          const _shopRep = char.reputation || {};
          const _shopFaction = shopData.faction;
          const _shopChunkType = shopData.chunkType;
          const _ironhandShopTier = getFactionTier(_shopRep.ironhand || 0);
          const _axiomShopTier    = getFactionTier(_shopRep.axiom    || 0);
          const _medicaShopTier   = getFactionTier(_shopRep.medica   || 0);
          // Ironhand Allied: -20% in black_market/gang_turf
          if ((_ironhandShopTier.id === 'allied' || _ironhandShopTier.id === 'legend') && ['black_market','gang_turf'].includes(_shopChunkType)) {
            discount = Math.min(discount, 0.80);
          }
          // Ironhand Hostile/Enemy: +15% markup in gang_turf
          if ((_ironhandShopTier.id === 'hostile' || _ironhandShopTier.id === 'enemy') && _shopChunkType === 'gang_turf') {
            discount = Math.max(discount, 1.15);
          }
          // Ironhand Unfriendly: +15% markup
          if (_ironhandShopTier.id === 'unfriendly' && _shopChunkType === 'gang_turf') {
            discount = Math.max(discount, 1.15);
          }
          // Axiom Friendly: -10% in corporate/lobby
          if (_axiomShopTier.id === 'friendly' && ['corporate','lobby'].includes(_shopChunkType)) {
            discount = Math.min(discount, 0.90);
          }
          // Axiom Allied: -20% in corporate/lobby
          if ((_axiomShopTier.id === 'allied' || _axiomShopTier.id === 'legend') && ['corporate','lobby'].includes(_shopChunkType)) {
            discount = Math.min(discount, 0.80);
          }
          // Axiom Hostile: +25% markup in corporate/lobby
          if ((_axiomShopTier.id === 'hostile' || _axiomShopTier.id === 'enemy') && ['corporate','lobby'].includes(_shopChunkType)) {
            discount = Math.max(discount, 1.25);
          }
          // Medica faction effects on healing items
          // Friendly: -10%, Allied/Legend: -50%, Unfriendly: +10%, Hostile: +25%, Enemy: double price
          const _medicaHealDiscount =
            (_medicaShopTier.id === 'allied' || _medicaShopTier.id === 'legend') ? 0.5
            : _medicaShopTier.id === 'friendly' ? 0.90
            : _medicaShopTier.id === 'unfriendly' ? 1.10
            : _medicaShopTier.id === 'hostile' ? 1.25
            : _medicaShopTier.id === 'enemy' ? 2.0
            : 1.0;
          const applyPrice = (p, isHeal) => Math.max(1, Math.floor(p * discount * (isHeal ? _medicaHealDiscount : 1.0)));
          return (
            <Sheet open={true} onClose={() => setSheet(null)} title={'SHOP'}>
              {/* Vendor personality */}
              <div style={{ background: '#0d0d1a', border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>👤</span>
                <div>
                  <div style={{ color: S.dim, fontSize: 10, marginBottom: 3, letterSpacing: 1 }}>{(shopData.chunkType || '').replace(/_/g,' ').toUpperCase()} VENDOR</div>
                  <div style={{ color: '#9090b0', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{shopData.vendorDesc || 'A vendor with no face and reasonable prices.'}</div>
                  {discount < 1.0 && <div style={{ color: S.green, fontSize: 10, marginTop: 4 }}>◈ {char.archetype === 'fixer' ? 'CHA ' + charisma + ': -' + Math.round((1-discount)*100) + '% haggle' : 'Charisma: -' + Math.round((1-discount)*100) + '%'} on all prices</div>}
                  {discount > 1.0 && <div style={{ color: S.red, fontSize: 10, marginTop: 4 }}>⚠ Faction standing: +{Math.round((discount-1)*100)}% markup</div>}
                  {_medicaHealDiscount !== 1.0 && <div style={{ color: _medicaHealDiscount < 1.0 ? '#ff4081' : S.red, fontSize: 10, marginTop: 2 }}>
                    {_medicaHealDiscount < 1.0
                      ? '◈ MEDICA ' + _medicaShopTier.label.toUpperCase() + ': -' + Math.round((1 - _medicaHealDiscount) * 100) + '% on healing items'
                      : '⚠ MEDICA ' + _medicaShopTier.label.toUpperCase() + ': +' + Math.round((_medicaHealDiscount - 1) * 100) + '% on healing items'}
                  </div>}
                </div>
              </div>
              {/* Credits display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: S.dim, fontSize: 11 }}>Your credits</span>
                <span style={{ color: S.gold, fontSize: 16 }}>◈ {char.credits}¢</span>
              </div>

              {/* Weapons */}
              {shopData.weapons && shopData.weapons.length > 0 && <>
                <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border }}>WEAPONS</div>
                {shopData.weapons.map(w => {
                  const finalPrice = applyPrice(w.value);
                  const owned = char.weapon.id === w.id;
                  const better = !owned && w.damage[0] > char.weapon.damage[0];
                  return (
                    <div key={w.id} style={{ background: owned ? '#071207' : S.bgRaised, border: '1px solid ' + (owned ? S.green : better ? S.gold + '44' : S.border), borderRadius: 6, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: owned ? S.green : S.text, fontSize: 13 }}>{w.name}{owned ? ' ✓' : ''}</div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11 }}>
                            <span style={{ color: S.dim }}>DMG {w.damage[0]}-{w.damage[1]}</span>
                            <span style={{ color: S.dim }}>{w.type}</span>
                            {w.special && <span style={{ color: S.orange }}>[{w.special}]</span>}
                            {w.ammo !== undefined && <span style={{ color: S.dim }}>ammo:{w.maxAmmo}</span>}
                          </div>
                          {/* Comparison vs current */}
                          {!owned && <div style={{ color: better ? S.green : S.red, fontSize: 10, marginTop: 3 }}>
                            vs {char.weapon.name}: {better ? '+' : ''}{w.damage[0] - char.weapon.damage[0]} to {w.damage[1] - char.weapon.damage[1]} dmg
                          </div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0, marginLeft: 10 }}>
                          {!owned && <button onClick={() => buyWeapon({ ...w, price: finalPrice })} style={{ background: char.credits >= finalPrice ? '#071207' : S.bgCard, border: '1px solid ' + (char.credits >= finalPrice ? S.green : S.border), color: char.credits >= finalPrice ? S.green : '#333', fontFamily: S.font, minHeight: 36, minWidth: 64, borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {finalPrice}¢
                          </button>}
                          {/* Sell current weapon here */}
                          {owned && w.sell > 0 && <div style={{ color: S.dim, fontSize: 10 }}>Equipped</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>}

              {/* Armor */}
              {(() => {
                // Bug 3 fix: guarantee ghost_suit appears in market/black_market/corporate shops
                // when player is level 6+, needs it for heist, and doesn't own it yet.
                const needsGhostSuit = HEIST_REQS.gear.includes('ghost_suit')
                  && char.armor?.id !== 'ghost_suit'
                  && char.level >= 6
                  && ['market','black_market','corporate'].includes(_shopChunkType);
                const ghostSuitItem = { id:'ghost_suit', name:'Ghost Suit', defense:25, value:4500, sell:1400, special:'resist_hack', tier:3 };
                const displayArmor = needsGhostSuit && !shopData.armor.some(a => a.id === 'ghost_suit')
                  ? [...shopData.armor, ghostSuitItem]
                  : shopData.armor;
                return displayArmor && displayArmor.length > 0 && <>
                <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border, marginTop: 14 }}>ARMOR</div>
                {displayArmor.map(a => {
                  const finalPrice = applyPrice(a.value);
                  const owned = char.armor.id === a.id;
                  const better = !owned && a.defense > char.armor.defense;
                  return (
                    <div key={a.id} style={{ background: owned ? '#00111a' : S.bgRaised, border: '1px solid ' + (owned ? S.cyan : better ? S.gold + '44' : S.border), borderRadius: 6, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: owned ? S.cyan : S.text, fontSize: 13 }}>{a.name}{owned ? ' ✓' : ''}</div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11 }}>
                            <span style={{ color: S.dim }}>DEF {a.defense}</span>
                            {a.special && <span style={{ color: S.cyan }}>[{a.special.replace(/_/g,' ')}]</span>}
                          </div>
                          {!owned && <div style={{ color: better ? S.green : S.red, fontSize: 10, marginTop: 3 }}>
                            vs {char.armor.name}: {better ? '+' : ''}{a.defense - char.armor.defense} defense
                          </div>}
                        </div>
                        {!owned && <button onClick={() => buyArmor({ ...a, price: finalPrice })} style={{ background: char.credits >= finalPrice ? '#00111a' : S.bgCard, border: '1px solid ' + (char.credits >= finalPrice ? S.cyan : S.border), color: char.credits >= finalPrice ? S.cyan : '#333', fontFamily: S.font, minHeight: 36, minWidth: 64, borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 10 }}>
                          {finalPrice}¢
                        </button>}
                      </div>
                    </div>
                  );
                })}
              </>
              })()}

              {/* Consumables */}
              {shopData.items && shopData.items.length > 0 && <>
                <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border, marginTop: 14 }}>CONSUMABLES</div>
                {shopData.items.map(item => {
                  const finalPrice = applyPrice(item.price, item.effect === 'heal');
                  return (
                    <div key={item.id} style={{ background: S.bgRaised, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: S.text, fontSize: 13 }}>{item.name}</div>
                        <div style={{ color: S.dim, fontSize: 11, marginTop: 2 }}>{item.desc}</div>
                        {item.stock && <div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>In stock: {item.stock}</div>}
                      </div>
                      <button onClick={() => buyItem({ ...item, price: finalPrice })} style={{ background: char.credits >= finalPrice ? '#071207' : S.bgCard, border: '1px solid ' + (char.credits >= finalPrice ? S.green : S.border), color: char.credits >= finalPrice ? S.green : '#333', fontFamily: S.font, minHeight: 40, minWidth: 64, borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 10 }}>{finalPrice}¢</button>
                    </div>
                  );
                })}
              </>}

              {/* Sell inventory */}
              {char.inventory.filter(i => i.sell > 0).length > 0 && <>
                <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border, marginTop: 16 }}>SELL YOUR ITEMS</div>
                {char.inventory.filter(i => i.sell > 0).map(item => {
                  const sellPrice = Math.floor((item.sell || 20) * (char.archetype === 'fixer' ? 1.3 : 1.0));
                  return (
                    <div key={item.id} style={{ background: S.bgRaised, border: '1px solid ' + S.border, borderRadius: 6, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: S.dim, fontSize: 12 }}>{item.name} <span style={{ color: S.dim }}>×{item.quantity}</span></div>
                        <div style={{ color: S.dim, fontSize: 10, marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <button onClick={() => {
                        Audio.sfxBuy();
                        setChar(prev => {
                          const inv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
                          return { ...prev, credits: prev.credits + sellPrice, inventory: inv };
                        });
                        notify('+' + sellPrice + '¢ sold', S.gold);
                      }} style={{ background: '#1a1200', border: '1px solid ' + S.gold + '66', color: S.gold, fontFamily: S.font, minHeight: 36, minWidth: 64, borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 10 }}>+{sellPrice}¢</button>
                    </div>
                  );
                })}
              </>}

              {/* Augmentations are only available at Ripper Doc (✦ tile) */}
            </Sheet>
          );
        })()}

        {sheet && sheet.type === 'job_prompt' && (() => {
          const chunkType = sheet.data.chunkType || 'default';
          const faction = sheet.data.faction;
          const giverName = getJobGiverName(chunkType, faction);
          // Pick NPC context line
          const npcKey = char.contactNPC;
          const npc = NPCS[npcKey];
          // Use contact NPC if in their territory, else use a generic giver
          const isContactZone = npc && npc.location === chunkType;
          const jobContextLines = isContactZone && npc.jobContext
            ? npc.jobContext
            : ['Someone with a problem and a budget. You have a skillset and a reason.'];
          const contextLine = jobContextLines[Math.floor(Math.random() * jobContextLines.length)];
          const displayName = isContactZone ? npc.name : giverName;
          return (
            <Sheet open={true} onClose={() => setSheet(null)} title={'JOB'}>
              {/* Who's giving this job */}
              <div style={{ background: '#0d0d1a', border: '1px solid ' + S.border, borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ color: S.dim, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>
                  {isContactZone ? 'YOUR CONTACT' : 'JOB CONTACT'}
                </div>
                <div style={{ color: isContactZone ? S.gold : S.text, fontSize: 13, marginBottom: 6 }}>{displayName}</div>
                {isContactZone && npc.desc && <div style={{ color: S.dim, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>{npc.desc}</div>}
                <div style={{ color: '#9090b0', fontSize: 12, lineHeight: 1.7, fontStyle: 'italic' }}>{contextLine}</div>
              </div>
              <div style={{ color: S.dim, fontSize: 12, marginBottom: 14 }}>Once you accept, the board goes dark. Find another.</div>
              <button disabled={aiThinking} onClick={() => takeJob(sheet.data.jobId, sheet.data.faction, sheet.data.danger, sheet.id)}
                style={{ ...btn(aiThinking ? S.dim : S.gold, S.bgRaised, S.gold + '66'), width: '100%', minHeight: 62, borderRadius: 6, flexDirection: 'column', gap: 4, fontSize: 14 }}>
                <span>{aiThinking ? 'Generating briefing...' : '► ' + (sheet.data.jobId || '').replace(/_/g, ' ').toUpperCase()}</span>
                <span style={{ fontSize: 11, color: S.dim }}>AI briefing + mid-mission choice</span>
              </button>
            </Sheet>
          );
        })()}

        {sheet && sheet.type === 'rest' && (() => {
          const _restMed = getFactionTier((char.reputation?.medica  || 0));
          const _restMer = getFactionTier((char.reputation?.meridian|| 0));
          const inMedZone = char.pos && char.pos.cy > 3;
          const fullHeal = inMedZone && (_restMed.id === 'allied' || _restMed.id === 'legend');
          const halfCost = sheet.data.cost > 0 && (_restMer.id === 'friendly' || _restMer.id === 'allied' || _restMer.id === 'legend');
          const dispCost = halfCost ? Math.floor(sheet.data.cost * 0.5) : sheet.data.cost;
          const dispHeal = fullHeal ? char.maxHp : Math.floor(char.maxHp * 0.4);
          return (
            <Sheet open={true} onClose={() => setSheet(null)} title={'SAFEHOUSE'}>
              <div style={{ color: S.text, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>A bed. Clean water. No questions asked.</div>
              <div style={{ background: S.bgCard, border: '1px solid ' + S.border, borderRadius: 6, padding: 14, marginBottom: 16 }}>
                <div style={{ color: S.dim, fontSize: 11, marginBottom: 6 }}>HEAL: +{dispHeal} HP{fullHeal ? ' (FULL)' : ''} · Clear status effects</div>
                {dispCost > 0 && <div style={{ color: S.gold, fontSize: 13 }}>Cost: {dispCost}¢{halfCost ? ' (Meridian discount)' : ''}</div>}
                {dispCost === 0 && <div style={{ color: S.green, fontSize: 13 }}>Free</div>}
                {fullHeal && <div style={{ color: '#ff4081', fontSize: 10, marginTop: 4 }}>◈ MEDICA ALLIED — full restore</div>}
              </div>
              <button onClick={() => doRest(sheet.data.cost)} style={{ ...btn(S.green, '#071207', S.green), width: '100%', minHeight: 56, fontSize: 14, borderRadius: 6 }}>◌ REST</button>
            </Sheet>
          );
        })()}

        {sheet && sheet.type === 'terminal' && (
          <Sheet open={true} onClose={() => setSheet(null)} title={'TERMINAL'}>
            {sheet.data.termType === 'void' && <>
              <div style={{ color: S.green, fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>VOID ACCESS NODE DETECTED</div>
              <div style={{ color: S.text, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>Neural-dive port. Someone cracked it open. The Void is accessible from here. Danger level: 4. No map. No mercy.</div>
              <button onClick={() => { setSheet(null); setChar(prev => ({ ...prev, pos: { ...prev.pos, cx: 0, cy: 0, layer: 3, lx: Math.floor(CHUNK_W / 2), ly: Math.floor(CHUNK_H / 2) }, reachedLayer3: true, layersVisitedArr: [...new Set([...(prev.layersVisitedArr||[0]), 3])] })); notify('Jacking into the Void...', S.green); }} style={{ ...btn(S.green, '#071a07', S.green), width: '100%', minHeight: 56, fontSize: 14, borderRadius: 6 }}>◆ JACK IN</button>
            </>}
            {sheet.data.termType === 'faction' && <div style={{ color: S.text, fontSize: 13, lineHeight: 1.8 }}>
              Faction terminal — {sheet.data.faction ? (WORLD_FACTIONS[sheet.data.faction]?.name || sheet.data.faction) : 'unknown'}. Encrypted data streams. Intel fragments. Someone's tracking your position.
            </div>}
            {sheet.data.termType === 'lore' && <div style={{ color: S.text, fontSize: 13, lineHeight: 1.8 }}>
              Public terminal. News feeds: AXIOM CORP Q3 PROFITS UP 340%. UNDERNET FLOODING EXPECTED. GHOST NETWORK BROADCASTS JAMMED. The usual lies.
            </div>}
          </Sheet>
        )}

        {sheet && sheet.type === 'npc_talk' && (() => {
          const npcKey = sheet.data.npcKey;
          const npc = NPCS[npcKey];
          if (!npc) return null;

          // Find active quest for this NPC or pick one
          const questEntries = Object.values(SIDEQUESTS).filter(q => q.npc === npcKey);
          let activeQuest = null;
          let activeAct = null;

          for (const q of questEntries) {
            const state = RUN_QUESTS[q.id];
            if (!state) {
              // New quest available
              activeQuest = q;
              activeAct = q.acts.open;
              break;
            } else if (!state.done && state.act && q.acts[state.act]) {
              // Quest in progress
              activeQuest = q;
              activeAct = q.acts[state.act];
              break;
            }
          }

          const questState = activeQuest ? (RUN_QUESTS[activeQuest.id] || null) : null;
          const isCloseAct = activeAct && !activeAct.choices;

          const applyQuestReward = (reward) => {
            if (!reward) return;
            setChar(prev => {
              let u = { ...prev };
              if (reward.credits) u = { ...u, credits: u.credits + reward.credits };
              if (reward.item) {
                const inv = [...u.inventory];
                const ex = inv.find(i => i.id === reward.item.id);
                if (ex) ex.quantity += (reward.item.quantity || 1);
                else inv.push({ ...reward.item, quantity: reward.item.quantity || 1 });
                u = { ...u, inventory: inv };
              }
              if (reward.reputation) {
                const rep = { ...u.reputation };
                const repMult = u.archetype === 'fixer' ? 1.3 : 1.0;
                Object.entries(reward.reputation).forEach(([k, v]) => {
                  const scaled = v > 0 ? Math.round(v * repMult) : v; // bonus only on positive gains
                  rep[k] = Math.max(-100, Math.min(100, (rep[k] || 0) + scaled));
                });
                u = { ...u, reputation: rep };
              }
              if (reward.hp) u = { ...u, hp: Math.max(1, u.hp + reward.hp) };
              if (reward.special === 'sister_found') {
                setTimeout(() => addLog('◈ Doc Mem has a patient matching your sister. Find Doc again soon.', S.pink), 500);
              }
              return u;
            });
          };

          const handleChoice = (choice) => {
            if (!activeQuest) return;
            // Hack minigame intercept — choice.next === '__hack__' means trigger minigame
            if (choice.next === '__hack__' && choice.hackConfig) {
              // Apply immediate effects (e.g. credits) before launching
              if (choice.effect) {
                setChar(prev => {
                  let u = { ...prev };
                  if (choice.effect.credits) u = { ...u, credits: u.credits + choice.effect.credits };
                  return u;
                });
              }
              const qc = {
                questId: activeQuest.id,
                successNext: choice.hackConfig.successNext,
                failNext: choice.hackConfig.failNext,
                sheetData: { npcKey: sheet.data.npcKey },
              };
              setSheet(null); // close sheet before launching minigame
              const { cx, cy, layer } = char.pos;
              const _sqDist = Math.abs(cx) + Math.abs(cy);
              const danger = getChunk(cx, cy, layer, _sqDist, new Set(char.looted || []))?.danger || 2;
              triggerHack(choice.hackConfig.hackType || 'story', 'sidequest', danger, layer, null, qc);
              return;
            }
            // Apply immediate effects
            if (choice.effect) {
              setChar(prev => {
                let u = { ...prev };
                if (choice.effect.credits) u = { ...u, credits: u.credits + choice.effect.credits };
                if (choice.effect.reputation) {
                  const rep = { ...u.reputation };
                  const repMult = u.archetype === 'fixer' ? 1.3 : 1.0;
                  Object.entries(choice.effect.reputation).forEach(([k, v]) => {
                    const scaled = v > 0 ? Math.round(v * repMult) : v;
                    rep[k] = Math.max(-100, Math.min(100, (rep[k] || 0) + scaled));
                  });
                  u = { ...u, reputation: rep };
                }
                if (choice.effect.item) {
                  const inv = [...u.inventory];
                  const ex = inv.find(i => i.id === choice.effect.item.id);
                  if (ex) ex.quantity += (choice.effect.item.quantity || 1);
                  else inv.push({ ...choice.effect.item, quantity: choice.effect.item.quantity || 1 });
                  u = { ...u, inventory: inv };
                }
                if (choice.effect.hp) u = { ...u, hp: Math.max(1, u.hp + choice.effect.hp) };
                return u;
              });
            }
            // Track backstory-specific choice for 'personal' achievement
            if (['personal', 'debt_hook'].includes(choice.id)) {
              setChar(prev => ({ ...prev, usedBackstoryChoice: true }));
            }
            if (choice.next === null) {
              // Pass — quest abandoned
              setSheet(null);
              return;
            }
            if (choice.next) {
              RUN_QUESTS[activeQuest.id] = { act: choice.next, done: false };
              setSheet({ ...sheet }); // force re-render
            }
          };

          const handleCloseAct = () => {
            if (!activeQuest || !activeAct) return;
            applyQuestReward(activeAct.reward);
            RUN_QUESTS[activeQuest.id] = { done: true };
            const outcomeMsg = {
              great: '◈ Quest complete.',
              good: '✓ Quest complete.',
              neutral: '— Quest resolved.',
              complex: '◈ Complicated. But done.',
              fail: '✗ That didn\'t work.',
            }[activeAct.outcome] || '✓ Done.';
            addLog('[' + activeQuest.title + '] ' + outcomeMsg, activeAct.outcome === 'fail' ? S.red : S.gold);
            if (activeAct.reward && activeAct.reward.credits) notify('+' + activeAct.reward.credits + '¢', S.gold);
            // Track for full_dossier achievement (non-fail completions only)
            if (activeAct.outcome !== 'fail') {
              setChar(prev => {
                const already = prev.questsCompleted || [];
                if (already.includes(activeQuest.id)) return prev;
                return { ...prev, questsCompleted: [...already, activeQuest.id] };
              });
            }
            setSheet(null);
          };

          const npcColor = { Rusty:'#ff9800', Nadia:'#e040fb', 'Doc Mem':'#69ff47', Aria:'#00e5ff', Kite:'#ffd700', Mara:'#c084fc', Voss:'#ff5722', Petra:'#b085f5', Sable:'#aaaaaa', Hex:'#69ff47', Yuki:'#ff80ab', Dixon:'#00b4d8', Reyes:'#ff3860' }[npcKey] || S.text;
          const greetingPool = (npcKey === 'Aria' && char.backstory === 'corpo' && npc.corpoGreetings) ? npc.corpoGreetings : npc.greetings;
          const greeting = greetingPool[Math.floor(Math.random() * greetingPool.length)];

          return (
            <Sheet open={true} onClose={() => setSheet(null)} title={'CONTACT'}>
              {/* NPC header */}
              <div style={{ background: '#0d0d1a', border: '1px solid ' + npcColor + '44', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ color: npcColor, fontSize: 15 }}>{'☻ ' + npc.name}</div>
                  <div style={{ color: npc.faction ? (WORLD_FACTIONS[npc.faction]?.color || S.dim) : S.dim, fontSize: 10, letterSpacing: 1 }}>{npc.role.toUpperCase()}</div>
                </div>
                {npc.desc && <div style={{ color: '#9090b8', fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{npc.desc}</div>}
                <div style={{ color: S.text, fontSize: 13, lineHeight: 1.8, fontStyle: 'italic' }}>{greeting}</div>
                {/* Bug 5: Rep milestone acknowledgment */}
                {(() => {
                  const _npcFaction = npc.faction;
                  if (!_npcFaction) return null;
                  const _fRep = (char.reputation || {})[_npcFaction] || 0;
                  const _fTier = getFactionTier(_fRep);
                  const _fColor = WORLD_FACTIONS[_npcFaction]?.color || S.dim;
                  const repLines = {
                    legend:     (fn) => fn + ' rep is city-wide now. People say your name differently.',
                    allied:     (fn) => fn + ' knows what you have built here. You are trusted, not just useful.',
                    friendly:   (fn) => fn + ' has noticed the work you have put in. There is goodwill here.',
                    unfriendly: (fn) => fn + ' has not forgotten. Watch your step around their people.',
                    hostile:    (fn) => fn + ' is watching you. Word travels fast down here.',
                    enemy:      (fn) => fn + ' has marked you. This contact knows. They are choosing to talk anyway.',
                  };
                  const lineFn = repLines[_fTier.id];
                  if (!lineFn || _fTier.id === 'neutral') return null;
                  const _fName = WORLD_FACTIONS[_npcFaction]?.name || _npcFaction;
                  return (
                    <div style={{ color: _fColor, fontSize: 10, letterSpacing: 1, marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + _fColor + '22', opacity: 0.85 }}>
                      ◉ {lineFn(_fName)}
                    </div>
                  );
                })()}
              </div>

              {/* Quest content */}
              {activeQuest && activeAct && !isCloseAct && (() => {
                const text = typeof activeAct.text === 'function' ? activeAct.text(char) : activeAct.text;
                const choices = typeof activeAct.choices === 'function' ? activeAct.choices(char) : (activeAct.choices || []);
                const available = choices.filter(ch => ch.available !== false);
                return (
                  <div>
                    <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>{activeQuest.title}</div>
                    <div style={{ color: S.text, fontSize: 13, lineHeight: 1.8, marginBottom: 18, whiteSpace: 'pre-line' }}>{text}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {available.map(ch => (
                        <button key={ch.id} onClick={() => handleChoice(ch)}
                          style={{ ...btn(ch.id === 'pass' ? S.dim : npcColor, ch.id === 'pass' ? S.bgCard : '#0d0d1a', ch.id === 'pass' ? S.border : npcColor + '55'), minHeight: 52, flexDirection: 'column', gap: 3, borderRadius: 5, fontSize: 13, textAlign: 'left', padding: '10px 14px', alignItems: 'flex-start' }}>
                          <span>{ch.label}</span>
                          {ch.tooltip && <span style={{ fontSize: 10, color: S.cyan, opacity: 0.8 }}>[ {ch.tooltip} ]</span>}
                          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {ch.effect && ch.effect.credits && ch.effect.credits > 0 && <span style={{ fontSize: 10, color: S.gold }}>+{ch.effect.credits}¢</span>}
                            {ch.effect && ch.effect.credits && ch.effect.credits < 0 && <span style={{ fontSize: 10, color: S.red }}>{ch.effect.credits}¢</span>}
                            {ch.effect && ch.effect.reputation && Object.entries(ch.effect.reputation).map(([fid, val]) => (
                              <span key={fid} style={{ fontSize: 10, color: val > 0 ? '#69ff4799' : '#ff444499' }}>
                                {WORLD_FACTIONS[fid]?.name || fid} {val > 0 ? '+' : ''}{val}
                              </span>
                            ))}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Close act — narrative resolution */}
              {activeQuest && activeAct && isCloseAct && (() => {
                const text = typeof activeAct.text === 'function' ? activeAct.text(char) : activeAct.text;
                const outcomeColor = { great: S.gold, good: S.green, neutral: S.dim, complex: S.orange, fail: S.red }[activeAct.outcome] || S.text;
                return (
                  <div>
                    <div style={{ color: S.dim, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>{activeQuest.title}</div>
                    <div style={{ color: '#c0c0d8', fontSize: 13, lineHeight: 1.9, marginBottom: 16, whiteSpace: 'pre-line', fontStyle: 'italic' }}>{text}</div>
                    {activeAct.reward && (activeAct.reward.credits || activeAct.reward.item) && (
                      <div style={{ background: S.bgCard, border: '1px solid ' + outcomeColor + '44', borderRadius: 5, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
                        {activeAct.reward.credits && <div style={{ color: S.gold }}>+{activeAct.reward.credits}¢</div>}
                        {activeAct.reward.item && <div style={{ color: S.green }}>Item: {activeAct.reward.item.name}</div>}
                        {activeAct.reward.reputation && Object.entries(activeAct.reward.reputation).map(([k, v]) => (
                          <div key={k} style={{ color: v > 0 ? S.green : S.red, fontSize: 11 }}>{WORLD_FACTIONS[k]?.name || k}: {v > 0 ? '+' : ''}{v}</div>
                        ))}
                      </div>
                    )}
                    <button onClick={handleCloseAct}
                      style={{ ...btn(outcomeColor, S.bgCard, outcomeColor + '55'), width: '100%', minHeight: 52, fontSize: 13, letterSpacing: 1, borderRadius: 5 }}>
                      ► CLOSE
                    </button>
                  </div>
                );
              })()}

              {/* No active quest — tips or idle talk */}
              {!activeQuest && (() => {
                const tipsGiven = char.tipsGiven || [];
                const needsRipperTip = !char.visitedRipper && !tipsGiven.includes('ripper') && npc.tipRipper;
                const needsBrokerTip = !char.visitedBroker && !tipsGiven.includes('broker') && npc.tipBroker;
                // Show ripper tip first, then broker, then idle talk
                const tipToShow = needsRipperTip ? 'ripper' : needsBrokerTip ? 'broker' : null;
                const tipText = tipToShow === 'ripper' ? npc.tipRipper : tipToShow === 'broker' ? npc.tipBroker : null;
                if (tipText && !tipsGiven.includes(tipToShow)) {
                  // Mark tip as given
                  setChar(prev => ({ ...prev, tipsGiven: [...(prev.tipsGiven || []), tipToShow] }));
                }

                // Mara Allied Shop — available when npcKey === 'Mara' and meridian rep >= 60
                const isMara = npcKey === 'Mara';
                const meridianRep = char.reputation?.meridian || 0;
                const maraAllied = meridianRep >= 60;
                const maraLegend = meridianRep >= 90;

                const maraItems = maraAllied ? [
                  { id: 'stim', name: 'MedStim', effect: 'heal', value: 40, price: 40, sell: 30, desc: 'Restores 40 HP.', quantity: 1 },
                  { id: 'antitoxin', name: 'Antitoxin', effect: 'cleanse', value: 0, price: 30, sell: 20, desc: 'Clears status effects.', quantity: 1 },
                  { id: 'neuro_block', name: 'Neuro Blocker', effect: 'neuro_block', value: 0, price: 80, sell: 40, desc: 'Suppresses psychosis cascade. 12h window.', quantity: 1 },
                  ...(!char.inhibitorUsed ? [{ id: 'inhibitor', name: 'Inhibitor', effect: 'inhibitor', value: 0, price: 400, sell: 100, desc: 'Next augment install costs 0 humanity. One per run.', quantity: 1 }] : []),
                  ...(maraLegend && !char.maraHealUsed ? [{ id: 'mara_heal', name: 'Humanity Restore', effect: 'mara_heal', value: 1, price: 800, sell: 0, desc: '+1 humanity. Once per run. Meridian LEGEND only.', quantity: 1 }] : []),
                ] : [];

                const buyMaraItem = (item) => {
                  if (char.credits < item.price) { notify('Not enough credits', S.red); return; }
                  Audio.sfxBuy();
                  if (item.effect === 'mara_heal') {
                    setChar(prev => ({
                      ...prev,
                      credits: prev.credits - item.price,
                      humanity: Math.min(10, (prev.humanity || 10) + 1),
                      maraHealUsed: true,
                    }));
                    notify('+1 Humanity', '#c084fc');
                    addLog('◎ Mara: humanity restored. +1.', '#c084fc');
                    return;
                  }
                  setChar(prev => {
                    const inv = [...prev.inventory];
                    const ex = inv.find(i => i.id === item.id);
                    if (ex) ex.quantity++; else inv.push({ ...item, quantity: 1 });
                    return { ...prev, inventory: inv, credits: prev.credits - item.price };
                  });
                  notify('Bought: ' + item.name, S.green);
                };

                return (
                  <div style={{ marginTop: 4 }}>
                    {tipText ? (
                      <div>
                        <div style={{ color: S.cyan, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>
                          {tipToShow === 'ripper' ? '✦ RIPPER DOC' : '⌬ NET BROKER'}
                        </div>
                        <div style={{ color: S.text, fontSize: 13, lineHeight: 1.8, fontStyle: 'italic' }}>{tipText}</div>
                      </div>
                    ) : (
                      <div style={{ color: S.dim, fontSize: 12, lineHeight: 1.7 }}>
                        {(() => {
                          const loreLine = npc.lore && npc.lore.length
                            ? npc.lore[Math.floor(Math.random() * npc.lore.length)]
                            : null;
                          const jobLine = npc.jobContext && npc.jobContext.length
                            ? npc.jobContext[Math.floor(Math.random() * npc.jobContext.length)]
                            : null;
                          // All quests done and no lore/jobContext — NPC is spent
                          const allQuestsDone = questEntries.length > 0 && questEntries.every(q => RUN_QUESTS[q.id]?.done);
                          if (allQuestsDone && !loreLine && !jobLine) {
                            return 'Nothing more to say. You both know what was done.';
                          }
                          // Lore NPCs: always show lore. Quest NPCs: 40% lore if available, else jobContext.
                          if (!jobLine && loreLine) return loreLine;
                          if (loreLine && jobLine) return Math.random() < 0.4 ? loreLine : jobLine;
                          return jobLine || 'Nothing more right now.';
                        })()}
                      </div>
                    )}

                    {/* Mara Allied Shop */}
                    {isMara && maraAllied && (
                      <div style={{ marginTop: 14, borderTop: '1px solid #c084fc33', paddingTop: 12 }}>
                        <div style={{ color: '#c084fc', fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>
                          ◎ MERIDIAN SUPPLY — {maraLegend ? 'LEGEND' : 'ALLIED'}
                        </div>
                        {maraItems.map(item => {
                          const canAfford = char.credits >= item.price;
                          return (
                            <div key={item.id} style={{ background: '#0a060f', border: '1px solid #c084fc22', borderRadius: 5, padding: '9px 12px', marginBottom: 7 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, marginRight: 10 }}>
                                  <div style={{ color: '#c084fc', fontSize: 12 }}>{item.name}</div>
                                  <div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>{item.desc}</div>
                                </div>
                                <button onClick={() => buyMaraItem(item)} style={{ background: canAfford ? '#0f070f' : S.bgCard, border: '1px solid ' + (canAfford ? '#c084fc' : S.border), color: canAfford ? '#c084fc' : '#333', fontFamily: S.font, minHeight: 34, minWidth: 56, borderRadius: 4, fontSize: 10, cursor: canAfford ? 'pointer' : 'default', flexShrink: 0 }}>
                                  {item.price}¢
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isMara && !maraAllied && meridianRep >= 25 && (
                      <div style={{ marginTop: 12, color: '#5a3a6a', fontSize: 10, fontStyle: 'italic' }}>
                        {"Reach Meridian ALLIED standing (rep 60+) and Mara will supply items at cost."}
                      </div>
                    )}
                  </div>
                );
              })()}
            </Sheet>
          );
        })()}

        {sheet && sheet.type === 'ripper_doc' && (() => {
          const charisma = char.charisma || 10;
          const discount = char.archetype === 'fixer' ? Math.max(0.65, 1 - (charisma / 100)) : charisma >= 18 ? 0.90 : charisma >= 14 ? 0.95 : 1.0;
          const ripperType = sheet.data.ripperType || 'standard';
          const charRep = char.reputation || {};
          const medicaAllied = (charRep.medica || 0) >= 60;
          const axiomAllied = (charRep.axiom || 0) >= 60;

          // Medica ripper: rep-based pricing
          const medicaTier = getFactionTier(charRep.medica || 0);
          const medicaRipperMult = (medicaTier.id === 'allied' || medicaTier.id === 'legend') ? 0.85
            : (medicaTier.id === 'hostile') ? 1.25
            : (medicaTier.id === 'enemy') ? 1.40 : 1.0;
          const medicaEnemy = medicaTier.id === 'enemy';
          const applyPrice = (p) => {
            const repMult = ripperType === 'medica' ? medicaRipperMult : 1.0;
            return Math.max(1, Math.floor(p * discount * repMult));
          };

          const ripperPersona = {
            standard: {
              title: '✦ RIPPER DOC',
              sub: 'UNLICENSED SURGEON',
              color: S.cyan,
              lines: [
                '"Sit down. I\'ve done worse than this before breakfast."',
                '"You feel everything until you don\'t. That\'s the deal."',
                '"Chrome doesn\'t lie. It just changes what you are."',
                '"I don\'t ask what you need it for. That\'s not my job."',
              ],
            },
            medica: {
              title: '✦ MEDICA RIPPER',
              sub: 'MEDICA CARTEL AFFILIATE',
              color: '#ff4081',
              lines: [
                '"Bioware is grown, not machined. The process takes longer. So does the healing."',
                '"Medica doesn\'t ask why you want it out of Axiom\'s registry. Neither do I."',
                '"Standard chrome is available. The bio-series requires Medica standing. You know how this works."',
                '"The organic stuff lasts longer than chrome. It also complains more when it\'s damaged."',
              ],
            },
            axiom: {
              title: '✦ AXIOM RIPPER',
              sub: 'AXIOM CORP AFFILIATE',
              color: '#00e5ff',
              lines: [
                '"Military hardware. Full performance, full liability. Sign nothing."',
                '"Corp-grade doesn\'t mean corp-tracked. Not here."',
                '"The mil-series requires Axiom Allied clearance. You have the rep or you don\'t."',
                '"This isn\'t the standard catalogue. Treat it accordingly."',
              ],
            },
          }[ripperType] || {
            title: '✦ RIPPER DOC', sub: 'UNLICENSED SURGEON', color: S.cyan,
            lines: ['"I don\'t ask questions. I just work."'],
          };
          const ripperLine = ripperPersona.lines[Math.floor(Math.random() * ripperPersona.lines.length)];

          // Determine which augments to show at this ripper
          // Standard + ungated always visible. Gated show with lock if rep not met.
          const coreAugs   = WORLD_AUGMENTS.filter(a => !a.gate);
          const bioAugs    = WORLD_AUGMENTS.filter(a => a.gate === 'medica_allied');
          const milAugs    = WORLD_AUGMENTS.filter(a => a.gate === 'axiom_allied');
          const showBio    = ripperType === 'medica';
          const showMil    = ripperType === 'axiom';

          const AugCard = ({ aug }) => {
            const installed = char.augments.includes(aug.id);
            const finalPrice = applyPrice(aug.cost);
            const canAfford = char.credits >= finalPrice;
            // Slot conflict: bioware uses separate bio_* slots, so only block same slot within same category
            const slotTaken = !installed && WORLD_AUGMENTS.some(a =>
              a.slot === aug.slot && char.augments.includes(a.id) && a.gate === aug.gate
            );
            const noHumanity = (char.humanity || 10) - aug.humanity < 0;
            const gated = aug.gate === 'medica_allied' && !medicaAllied;
            const gatedAxiom = aug.gate === 'axiom_allied' && !axiomAllied;
            const locked = gated || gatedAxiom;
            const desc = aug.specialDesc || {
              optic_zoom:      'Accuracy: narrows damage to top range',
              reflex_boost:    'Speed: +20 flee chance',
              neural_hack:     'Hacking: +25 — Deep Scan active in hacks. Required for heist',
              subdermal_armor: 'Defense: +20 flat',
              muscle_weave:    'Strength: +10, Defense: +8 — cheaper than Subdermal Plating. Conflicts with it.',
              bone_lace:       'Strength: +15 damage, Defense: +10',
              lung_filter:     'Halves bleed/burn DoT damage',
              adrenal_spike:   'Below 30% HP: +35% damage burst',
              pain_editor:     'Defense: +15, Status resist: -50%, Max HP: +20',
              sync_blocker:    'Hacking: +10, Speed: +5 — passively jams Sync pings. Synced enemies -15% damage vs you.',
              nano_weave:      '+2 HP per combat round. +2 HP per move out of combat. Conflicts with Adrenal Spike.',
            }[aug.id] || '';
            const cardBg = installed ? '#00111a' : locked ? '#0a080a' : '#0a0a14';
            const cardBorder = installed ? S.cyan + '55' : locked ? '#2a1a2a' : S.border;
            return (
              <div key={aug.id} style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: 6, padding: '12px 14px', marginBottom: 8, opacity: locked ? 0.55 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: 10 }}>
                    <div style={{ color: installed ? ripperPersona.color : locked ? S.dim : S.text, fontSize: 13 }}>{aug.name}</div>
                    <div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>{aug.slot} slot · humanity -{aug.humanity}</div>
                    <div style={{ color: '#336655', fontSize: 10, marginTop: 1 }}>{Object.entries(aug.bonus).map(([k,v]) => k + ':+' + v).join('  ')}</div>
                    {desc && <div style={{ color: locked ? '#3a3a4a' : '#5090a0', fontSize: 10, marginTop: 2 }}>⚡ {desc}</div>}
                    {locked && <div style={{ color: '#6a3a6a', fontSize: 10, marginTop: 3 }}>◉ Requires {aug.gateLabel} standing ({aug.gate === 'medica_allied' ? 'Medica rep 60+' : 'Axiom rep 60+'})</div>}
                    {!locked && (slotTaken || noHumanity) && <div style={{ color: S.red, fontSize: 10, marginTop: 2 }}>{slotTaken ? 'Slot occupied' : 'Insufficient humanity'}</div>}
                  </div>
                  {installed ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                      {aug.id === 'neural_hack' && char.archetype === 'netrunner' && (
                        <div style={{ color: S.cyan, fontSize: 9, letterSpacing: 1 }}>PRE-INSTALLED</div>
                      )}
                      <button onClick={() => removeAugment(aug)} style={{ background: '#0d0000', border: '1px solid ' + S.red + '55', color: S.red, fontFamily: S.font, minHeight: 40, minWidth: 64, borderRadius: 4, fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>REMOVE</button>
                    </div>
                  ) : locked ? (
                    <div style={{ color: '#3a2a3a', fontSize: 18, flexShrink: 0, alignSelf: 'center' }}>◉</div>
                  ) : (
                    <button onClick={() => installAugment({ ...aug, cost: finalPrice })} disabled={slotTaken || noHumanity}
                      style={{ background: canAfford && !slotTaken && !noHumanity ? '#00111a' : S.bgCard, border: '1px solid ' + (canAfford && !slotTaken && !noHumanity ? ripperPersona.color : S.border), color: canAfford && !slotTaken && !noHumanity ? ripperPersona.color : '#333', fontFamily: S.font, minHeight: 40, minWidth: 64, borderRadius: 4, fontSize: 11, cursor: slotTaken || noHumanity ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: slotTaken || noHumanity ? 0.4 : 1 }}>
                      {finalPrice}¢
                    </button>
                  )}
                </div>
              </div>
            );
          };

          return (
            <Sheet open={true} onClose={() => setSheet(null)} title={ripperPersona.title}>
              {/* Doc persona */}
              <div style={{ background: '#06060f', border: '1px solid ' + ripperPersona.color + '44', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ color: ripperPersona.color, fontSize: 14 }}>{ripperPersona.title}</div>
                  <div style={{ color: S.dim, fontSize: 10 }}>{ripperPersona.sub}</div>
                </div>
                <div style={{ color: '#7090a0', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{ripperLine}</div>
                {discount < 1.0 && <div style={{ color: S.green, fontSize: 10, marginTop: 4 }}>◈ {char.archetype === 'fixer' ? 'CHA ' + charisma + ': -' + Math.round((1-discount)*100) + '% haggle (scales with level)' : 'Charisma discount: -' + Math.round((1-discount)*100) + '%'}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: S.dim, fontSize: 11 }}>Your credits</span>
                <span style={{ color: S.gold, fontSize: 15 }}>◈ {char.credits}¢</span>
              </div>
              <div style={{ color: S.dim, fontSize: 10, marginBottom: 14 }}>Humanity: {char.humanity}/10</div>

              {/* Medica ENEMY — refuses to install augments */}
              {ripperType === 'medica' && medicaEnemy && (
                <div style={{ background: '#1a0808', border: '1px solid ' + S.red + '55', borderRadius: 6, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ color: S.red, fontSize: 13, letterSpacing: 2, marginBottom: 6 }}>◉ REFUSED</div>
                  <div style={{ color: '#6a2a2a', fontSize: 11, lineHeight: 1.6 }}>{"Medica Cartel has marked you. This doc won't install anything while you carry that standing. Healing items are still available at other vendors. Find a black market ripper — they don't ask."}</div>
                </div>
              )}

              {/* Rep pricing note for Medica ripper */}
              {ripperType === 'medica' && !medicaEnemy && medicaRipperMult !== 1.0 && (
                <div style={{ fontSize: 10, marginBottom: 10, color: medicaRipperMult < 1.0 ? S.green : S.red }}>
                  {medicaRipperMult < 1.0
                    ? `◈ MEDICA ${medicaTier.label}: -${Math.round((1 - medicaRipperMult) * 100)}% on all augments`
                    : `⚠ MEDICA ${medicaTier.label}: +${Math.round((medicaRipperMult - 1) * 100)}% markup`}
                </div>
              )}

              {/* Core augments — available unless Medica enemy */}
              {(!medicaEnemy || ripperType !== 'medica') && (
                <>
                  <div style={{ color: S.cyan, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border }}>INSTALL AUGMENTS</div>
                  {coreAugs.map(aug => <AugCard key={aug.id} aug={aug} />)}
                </>
              )}

              {/* Bioware catalogue — Medica Ripper only */}
              {showBio && !medicaEnemy && (
                <>
                  <div style={{ color: '#ff4081', fontSize: 10, letterSpacing: 2, marginBottom: 8, marginTop: 16, paddingBottom: 4, borderBottom: '1px solid #ff408133' }}>
                    BIOWARE CATALOGUE
                    {!medicaAllied && <span style={{ color: '#6a2a4a', marginLeft: 8 }}>◉ MEDICA ALLIED REQUIRED (rep 60+)</span>}
                    {medicaAllied && <span style={{ color: S.green, marginLeft: 8 }}>✓ MEDICA ALLIED</span>}
                  </div>
                  {bioAugs.map(aug => <AugCard key={aug.id} aug={aug} />)}
                </>
              )}

              {/* Axiom Legend exclusive — Cortex Relay */}
              {/* Bug 3 fix: show cortex_relay at ANY ripper once axiom_legend rep is met */}
              {(showMil || (charRep.axiom || 0) >= 90) && (() => {
                const axiomLegend = (charRep.axiom || 0) >= 90;
                const legendAugs = WORLD_AUGMENTS.filter(a => a.gate === 'axiom_legend');
                return legendAugs.length > 0 ? (
                  <>
                    <div style={{ color: S.gold, fontSize: 10, letterSpacing: 2, marginBottom: 8, marginTop: 16, paddingBottom: 4, borderBottom: '1px solid ' + S.gold + '33' }}>
                      AXIOM LEGEND EXCLUSIVE
                      {!axiomLegend && <span style={{ color: '#4a3a10', marginLeft: 8 }}>◉ AXIOM LEGEND REQUIRED (rep 90+)</span>}
                      {axiomLegend && <span style={{ color: S.gold, marginLeft: 8 }}>✓ AXIOM LEGEND</span>}
                    </div>
                    {legendAugs.map(aug => <AugCard key={aug.id} aug={aug} />)}
                  </>
                ) : null;
              })()}

              {/* Military cyberware catalogue — Axiom Ripper only */}
              {showMil && (
                <>
                  <div style={{ color: '#00e5ff', fontSize: 10, letterSpacing: 2, marginBottom: 8, marginTop: 16, paddingBottom: 4, borderBottom: '1px solid #00e5ff33' }}>
                    MILITARY CYBERWARE
                    {!axiomAllied && <span style={{ color: '#2a5a6a', marginLeft: 8 }}>◉ AXIOM ALLIED REQUIRED (rep 60+)</span>}
                    {axiomAllied && <span style={{ color: S.green, marginLeft: 8 }}>✓ AXIOM ALLIED</span>}
                  </div>
                  {milAugs.map(aug => <AugCard key={aug.id} aug={aug} />)}
                </>
              )}
            </Sheet>
          );
        })()}

        {sheet && sheet.type === 'net_broker' && (() => {
          const charisma = char.charisma || 10;
          const discount = char.archetype === 'fixer' ? Math.max(0.65, 1 - (charisma / 100)) : charisma >= 18 ? 0.90 : charisma >= 14 ? 0.95 : 1.0;
          const applyPrice = (p) => Math.max(1, Math.floor(p * discount));
          const brokerDanger = sheet.data.danger || 1;
          const brokerLines = [
            '"Software\'s cheaper than chrome. Consequences are not."',
            '"I don\'t sell weapons. I sell certainty."',
            '"No names. No signatures. No trace. That last one costs extra."',
            '"ICE is for people who plan. Programs are for people who survive."',
          ];
          const brokerLine = brokerLines[Math.floor(Math.random() * brokerLines.length)];

          // Program catalog: basic programs available from danger 1+, advanced from danger 3+
          const basicPrograms = ['ghost_thread','shard','signal','pulse','spike'];
          const advancedPrograms = ['spoof','surge','firewall'];
          const PROGRAM_PRICES = {
            ghost_thread:350, shard:320, signal:400, pulse:280, spike:450,
            spoof:500, surge:480, firewall:380,
          };
          const availablePrograms = brokerDanger >= 3
            ? [...basicPrograms, ...advancedPrograms]
            : basicPrograms;

          const buyProgram = (progId) => {
            const rawPrice = PROGRAM_PRICES[progId] || 400;
            const price = applyPrice(rawPrice);
            if (char.credits < price) { notify('Not enough credits', S.red); return; }
            if ((char.programs || []).includes(progId)) { notify('Already installed', S.dim); return; }
            Audio.sfxBuy();
            setChar(prev => ({ ...prev, credits: prev.credits - price, programs: [...(prev.programs || []), progId] }));
            notify('Installed: ' + HACK_PROGRAMS[progId]?.label, S.cyan);
          };

          const buyIce = () => {
            const price = applyPrice(200);
            if (char.credits < price) { notify('Not enough credits', S.red); return; }
            if ((char.iceCharges || 0) >= 3) { notify('ICE at capacity — max 3 charges', S.dim); return; }
            Audio.sfxBuy();
            setChar(prev => ({ ...prev, credits: prev.credits - price, iceCharges: Math.min(3, (prev.iceCharges || 0) + 1) }));
            const newCount = Math.min(3, (char.iceCharges || 0) + 1);
            notify(`ICE loaded — ${newCount}/3 charges`, S.cyan);
          };

          return (
            <Sheet open={true} onClose={() => setSheet(null)} title={'NET BROKER'}>
              <div style={{ background: '#06060f', border: '1px solid ' + S.cyan + '44', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ color: S.cyan, fontSize: 14 }}>◈ NET BROKER</div>
                  <div style={{ color: S.dim, fontSize: 10 }}>SOFTWARE DEALER</div>
                </div>
                <div style={{ color: '#7090a0', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{brokerLine}</div>
                {discount < 1.0 && <div style={{ color: S.green, fontSize: 10, marginTop: 4 }}>◈ {char.archetype === 'fixer' ? 'CHA ' + charisma + ': -' + Math.round((1-discount)*100) + '% haggle' : 'Charisma: -' + Math.round((1-discount)*100) + '%'} on all prices</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ color: S.dim, fontSize: 11 }}>Your credits</span>
                <span style={{ color: S.gold, fontSize: 15 }}>◈ {char.credits}¢</span>
              </div>

              {/* ICE charges */}
              <div style={{ color: S.cyan, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border }}>ICE CHARGES</div>
              <div style={{ background: S.bgRaised, border: '1px solid ' + S.border, borderRadius: 6, padding: '12px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: S.text, fontSize: 13 }}>ICE Module</div>
                  <div style={{ color: S.dim, fontSize: 11, marginTop: 2 }}>Emergency counter-intrusion. Clears virus, −20% trace.</div>
                  <div style={{ color: S.cyan, fontSize: 10, marginTop: 3 }}>Loaded: {char.iceCharges || 0}/3</div>
                </div>
                <button onClick={buyIce} style={{ background: char.credits >= applyPrice(200) ? '#00111a' : S.bgCard, border: '1px solid ' + (char.credits >= applyPrice(200) ? S.cyan : S.border), color: char.credits >= applyPrice(200) ? S.cyan : '#333', fontFamily: S.font, minHeight: 40, minWidth: 64, borderRadius: 4, fontSize: 11, cursor: 'pointer', flexShrink: 0, marginLeft: 10 }}>
                  {applyPrice(200)}¢
                </button>
              </div>

              {/* Programs */}
              <div style={{ color: S.cyan, fontSize: 10, letterSpacing: 2, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid ' + S.border }}>PROGRAMS</div>
              {availablePrograms.map(progId => {
                const prog = HACK_PROGRAMS[progId];
                if (!prog) return null;
                const owned = (char.programs || []).includes(progId);
                const price = applyPrice(PROGRAM_PRICES[progId] || 400);
                const canAfford = char.credits >= price;
                return (
                  <div key={progId} style={{ background: owned ? '#00111a' : S.bgRaised, border: '1px solid ' + (owned ? S.cyan + '55' : S.border), borderRadius: 6, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: 10 }}>
                      <div style={{ color: owned ? S.cyan : S.text, fontSize: 13 }}>{prog.label}{owned ? ' ✓' : ''}</div>
                      <div style={{ color: S.dim, fontSize: 10, marginTop: 2 }}>{prog.type} — {prog.desc}</div>
                    </div>
                    {!owned && (
                      <button onClick={() => buyProgram(progId)} style={{ background: canAfford ? '#00111a' : S.bgCard, border: '1px solid ' + (canAfford ? S.cyan : S.border), color: canAfford ? S.cyan : '#333', fontFamily: S.font, minHeight: 40, minWidth: 64, borderRadius: 4, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                        {price}¢
                      </button>
                    )}
                    {owned && <div style={{ color: S.dim, fontSize: 10, flexShrink: 0 }}>Installed</div>}
                  </div>
                );
              })}
              {brokerDanger < 3 && (
                <div style={{ color: S.dim, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>Advanced programs available in deeper markets.</div>
              )}
            </Sheet>
          );
        })()}

        {sheet && sheet.type === 'ladder' && (
          <Sheet open={true} onClose={() => setSheet(null)} title={'LEVEL CHANGE'}>
            <div style={{ color: S.text, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              {sheet.data.targetLayer === 1 ? 'Access hatch to the Undernet. Darker. Deeper.' : sheet.data.targetLayer === 2 ? (char.pos.layer === 3 ? 'Jack out point. The Void releases you back to Spire Base.' : 'Service elevator to Spire Base. Corporate territory starts here.') : 'Back to Neon Streets.'}
            </div>
            <button onClick={() => {
              const tl = sheet.data.targetLayer;
              setChar(prev => {
                const newLayers = prev.layersVisitedArr || [0];
                const updatedLayers = newLayers.includes(tl) ? newLayers : [...newLayers, tl];
                return {
                  ...prev,
                  pos: { cx: sheet.data.cx, cy: sheet.data.cy, layer: tl, lx: Math.floor(CHUNK_W / 2), ly: Math.floor(CHUNK_H / 2) },
                  layersVisitedArr: updatedLayers,
                  reachedLayer3: prev.reachedLayer3 || tl === 3,
                };
              });
              const layerName = tl === 1 ? 'Undernet' : tl === 2 ? 'Spire Base' : 'Neon Streets';
              const layerWarn = tl === 2 ? ' ⚠ DANGER 3-4. Be ready.' : tl === 1 ? ' Danger 1-2.' : '';
              const fromVoid = char.pos.layer === 3;
              if (fromVoid) addLog('◈ Jacked out. The Void dissolves. Spire Base: layer 2.', S.cyan);
              else {
                addLog('→ ' + (tl > (char.pos.layer || 0) ? 'Descending' : 'Ascending') + ' to ' + layerName + '.' + layerWarn, S.cyan);
                if (tl === 3) {
                  setTimeout(() => addLog('◈ THE VOID — Layer 3. No faction. No shops. Pure data constructs. Find the ≡ tile to jack out.', '#e040fb'), 300);
                }
              }
              setSheet(null);
            }} style={{ ...btn(S.cyan, '#00111a', S.cyan + '66'), width: '100%', minHeight: 56, fontSize: 14, borderRadius: 6 }}>≡ DESCEND / ASCEND</button>
          </Sheet>
        )}

        {sheet === 'axiom_heist' && (
          <Sheet open={true} onClose={() => setSheet(null)} title={'OPERATION: ZERO EXPORT'}>
            {char && char.backstory && BACKSTORIES[char.backstory] && (
              <div style={{ background: '#001a1a', border: '1px solid ' + S.cyan + '44', borderRadius: 6, padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ color: S.dim, fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>PERSONAL STAKE</div>
                <div style={{ color: '#60a0b0', fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>{BACKSTORIES[char.backstory].loss}</div>
              </div>
            )}
            <div style={{ color: '#8080a0', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              The firmware pipeline. The global export queue. Every city on the rollout list. Secured and live.
            </div>
            <div style={{ background: '#001a1a', border: '1px solid ' + S.cyan + '66', borderRadius: 6, padding: '12px 14px', marginBottom: 24, fontSize: 12, color: S.cyan }}>
              This is a one-way door. Executing the operation ends your run. All legacy earned carries over.
            </div>
            <button onClick={executeAxiomHeist} disabled={aiThinking} style={{ ...btn(S.cyan, '#001a1a', S.cyan), width: '100%', minHeight: 60, fontSize: 15, letterSpacing: 2, borderRadius: 6 }}>
              {aiThinking ? '...' : '◈ EXECUTE'}
            </button>
          </Sheet>
        )}

        {sheet === 'heist' && (
          <Sheet open={true} onClose={() => setSheet(null)} title={'OPERATION: AXIOM ZERO'}>
            {char && char.backstory && BACKSTORIES[char.backstory] && (
              <div style={{ background: '#0d0d1a', border: '1px solid ' + S.gold + '44', borderRadius: 6, padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ color: S.dim, fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>PERSONAL STAKE</div>
                <div style={{ color: '#b0a060', fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>{BACKSTORIES[char.backstory].loss}</div>
              </div>
            )}
            <div style={{ color: '#8080a0', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              Axiom's surveillance grid. Every debt record. Every intercepted communication. Every face they've filed. Gone.
            </div>
            <div style={{ background: '#1a1200', border: '1px solid ' + S.gold + '66', borderRadius: 6, padding: '12px 14px', marginBottom: 24, fontSize: 12, color: S.gold }}>
              This is a one-way door. Executing the heist ends your run. All legacy earned carries over.
            </div>
            <button onClick={executeHeist} disabled={aiThinking} style={{ ...btn(S.gold, '#1a1200', S.gold), width: '100%', minHeight: 60, fontSize: 15, letterSpacing: 2, borderRadius: 6 }}>
              {aiThinking ? '...' : '◈ EXECUTE'}
            </button>
          </Sheet>
        )}

        {/* JOB WIN SCREEN overlay in job screen */}
      </div>
    );
  }

  return null;
}

// ─── HACK MINIGAME COMPONENTS ─────────────────────────────────────────────────
// HackTransition: Matrix rain entry/exit animation
// HackScreen: Full hacking minigame

function HackTransition({ direction, hackData, success, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
    };
    resize();

    const dpr = window.devicePixelRatio || 1;
    const FS   = Math.round(16 * dpr); // 16 logical px at all densities
    const cols = Math.floor(canvas.width / FS);
    const rows = Math.floor(canvas.height / FS);

    // Lore words to scatter into rain columns
    const loreWords = hackData
      ? [`[${hackData.name}]`, "INTRUSION", "SCANNING", "FIREWALL", "PROBING"]
      : success ? ["EXTRACTED","CLEAN","GHOST RUN"] : ["TRACED","JACKED OUT","ALERT"];

    const columns = Array.from({ length: cols }, () => ({
      y:      Math.random() * rows,
      speed:  0.28 + Math.random() * 0.75,
      bright: 0.35 + Math.random() * 0.65,
      chars:  Array.from({ length: rows + 6 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
      lore:   null, // { word, startRow }
    }));

    // Inject lore words into random columns
    loreWords.forEach(word => {
      const col = columns[Math.floor(Math.random() * cols)];
      col.lore = { word, startRow: Math.floor(rows * 0.25 + Math.random() * rows * 0.5) };
    });

    // Timing
    const RAMP_IN  = direction === "in" ? 2000 : 500;
    const HOLD     = direction === "in" ? 300  : 100;
    const RAMP_OUT = direction === "in" ? 500  : 1500;
    const TOTAL    = RAMP_IN + HOLD + RAMP_OUT;

    let start = null, raf;

    const draw = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(elapsed / TOTAL, 1);

      let opacity;
      if (elapsed < RAMP_IN)               opacity = elapsed / RAMP_IN;
      else if (elapsed < RAMP_IN + HOLD)   opacity = 1;
      else                                 opacity = 1 - (elapsed - RAMP_IN - HOLD) / RAMP_OUT;
      opacity = Math.max(0, Math.min(1, opacity));

      ctx.fillStyle = `rgba(0,0,0,${0.12 + (1-opacity)*0.75})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FS}px "Courier New",monospace`;

      columns.forEach(col => {
        col.y += col.speed * 0.9;
        if (col.y > rows + 6) {
          col.y = -6;
          col.chars = Array.from({ length: rows+6 }, () => MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)]);
        }
        col.chars[Math.floor(col.y) % col.chars.length] = MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)];

        const head = Math.floor(col.y);

        for (let r = Math.max(0, head-28); r <= Math.min(rows-1, head); r++) {
          const dist = head - r;
          let alpha, gVal, rVal = 0;

          if (dist === 0)      { alpha = opacity * col.bright; gVal = 220; }
          else                 { const f = 1 - dist/28; alpha = f * col.bright * opacity * 0.75; gVal = Math.floor(70 + f*160); }

          // Lore character override
          let char = col.chars[r % col.chars.length];
          if (col.lore) {
            const { word, startRow } = col.lore;
            const idx = r - startRow;
            if (idx >= 0 && idx < word.length) {
              char = word[idx];
              const loreAlpha = opacity * Math.min(1, pct * 2.5);
              ctx.fillStyle = `rgba(255,255,255,${loreAlpha})`;
              ctx.fillText(char, (col.x || columns.indexOf(col)) * FS, r * FS);
              continue;
            }
          }

          if (!success && direction === "out") rVal = Math.floor(100 * (1-opacity));
          ctx.fillStyle = `rgba(${rVal},${gVal},30,${alpha})`;
          ctx.fillText(char, (col.x || columns.indexOf(col)) * FS, r * FS);
        }
      });

      // Centre label on entry
      if (direction === "in" && elapsed > RAMP_IN*0.35 && elapsed < RAMP_IN+HOLD) {
        const a = Math.min(1, (elapsed - RAMP_IN*0.35) / (RAMP_IN*0.4));
        ctx.textAlign = "center";
        ctx.font = `bold ${Math.round(FS * 1.1)}px "Courier New",monospace`;
        ctx.fillStyle = `rgba(0,255,65,${a*0.88})`;
        ctx.fillText(hackData ? `[ ${hackData.name} ]` : "[ CYBERSPACE ]", canvas.width/2, canvas.height/2);
        ctx.font = `${Math.round(FS * 0.7)}px "Courier New",monospace`;
        ctx.fillStyle = `rgba(0,160,40,${a*0.65})`;
        ctx.fillText("INITIATING INTRUSION SEQUENCE", canvas.width/2, canvas.height/2 + Math.round(FS * 1.8));
        ctx.textAlign = "left";
      }

      if (elapsed >= TOTAL) { onDone(); return; }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fix column x after build
  useEffect(() => {}, []);

  return (
    <div style={{ position:"fixed", inset:0 }}>
      <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block" }} />
    </div>
  );
}

function HackScreen({ difficulty, archetype, hackType, programs, iceCharges, augments, onDone }) {
  const diff  = HACK_DIFFICULTY[difficulty] || HACK_DIFFICULTY.normal;
  const arch  = HACK_ARCHETYPE[archetype] || HACK_ARCHETYPE.ghost;
  const hdata = HACK_DATA[hackType] || HACK_DATA.terminal; // guard against bad hackType

  // ── Pick sequence for this run ──
  const sequence = useRef(
    hdata.sequences[Math.floor(Math.random() * hdata.sequences.length)]
  ).current;
  // sequence.words is the ordered list — e.g. ["ARIA","KNOWS","EVERYTHING"]
  // On Easy: 3 words. Normal: all words (3–4). Hard: all words (3–4).
  // Difficulty scales word count: easy caps at 3, normal at seq length, hard full
  const seqWords = useRef(
    sequence.words.slice(0, Math.min(diff.seqLen, sequence.words.length))
  ).current;

  // Decoys: exclude ALL words from all sequences in this hack type to avoid
  // a real target word appearing as a decoy and confusing the player
  const allSeqWords = useRef(
    hdata.sequences.flatMap(s => s.words)
  ).current;
  const decoys = useRef(
    hdata.decoys.filter(d => !allSeqWords.includes(d)).sort(() => Math.random()-0.5)
  ).current;

  const canvasRef   = useRef(null);
  const stateRef    = useRef({
    columns:        [],
    words:          [],
    trace:          0,
    mistakes:       0,
    tracePaused:    true,
    threshold60Hit: false,
    threshold80Hit: false,
    seqIndex:       0,
    ice:            (iceCharges || 0),  // everyone gets (iceCharges || 0) (netrunner=2, others=1)
    gamePhase:      "active",
    ghostShown:     false,
    ghostMsg:       null,
    ghostTimer:     0,
    ghostShownCount:0,
    flashTimer:     0,
    corruption:     [],
    lastWordSpawn:  0,
    wordIdCounter:  0,
    lingerMs:       diff.lingerMs + (arch.lingerBonus || 0),
    tapZones:       [],
    // Programs — existing
    ghostThreadReady: (programs || []).includes("ghost_thread"),
    ghostThreadSpent: false,
    spoof:            (programs || []).includes("spoof"),
    spoofActive:      false,
    spoofTimer:       0,
    shard:            (programs || []).includes("shard"),
    shardWarningCol:  -1,
    shardWarningTimer:0,
    deepScan:         (programs || []).includes("deep_scan"),
    // Programs — new
    surge:            (programs || []).includes("surge"),   // active: correct taps reduce trace
    surgeActive:      false,
    surgeTimer:       0,
    pulse:            (programs || []).includes("pulse"),   // active: dim decoys 1.5s
    pulseActive:      false,
    pulseTimer:       0,
    signal:           (programs || []).includes("signal"),  // passive: bright flash on reveal
    firewall:         (programs || []).includes("firewall"),// passive: block threshold virus ×2
    firewallCharges:  (programs || []).includes("firewall") ? 2 : 0,
    spike:            (programs || []).includes("spike"),
    spikeReady:       (programs || []).includes("spike"),
  });
  const rafRef      = useRef(null);
  const lastTsRef   = useRef(null);

  // React state only for HUD
  const [hudTrace,         setHudTrace]         = useState(0);
  const [hudSeqIndex,      setHudSeqIndex]      = useState(0);
  const [hudMistakes,      setHudMistakes]      = useState(0);
  const [hudIce,           setHudIce]           = useState((iceCharges || 0));
  const [ghostMsg,         setGhostMsg]         = useState(null);
  const [hudGhostThread,    setHudGhostThread]    = useState((programs || []).includes("ghost_thread"));
  const [hudSpoofReady,     setHudSpoofReady]     = useState((programs || []).includes("spoof"));
  const [hudSpoofActive,    setHudSpoofActive]    = useState(false);
  const [hudShardWarning,   setHudShardWarning]   = useState(false);
  const [hudSurgeReady,     setHudSurgeReady]     = useState((programs || []).includes("surge"));
  const [hudSurgeActive,    setHudSurgeActive]    = useState(false);
  const [hudPulseReady,     setHudPulseReady]     = useState((programs || []).includes("pulse"));
  const [hudPulseActive,    setHudPulseActive]    = useState(false);
  const [hudFirewallCharges,setHudFirewallCharges]= useState((programs || []).includes("firewall") ? 2 : 0);
  const [hudSpikeReady,     setHudSpikeReady]     = useState((programs || []).includes("spike"));

  // bio_neural (Synaptic Bridge): trace accumulates 10% slower
  const bioNeuralMod = (augments || []).includes('neuro_mesh') ? 0.90 : 1.0;

  // ── DEV TUNING PANEL ─────────────────────────────────────────────────────
  const [devOpen,   setDevOpen]   = useState(false);
  const [devTuning, setDevTuning] = useState({
    traceSpeed:   diff.traceSpeed * bioNeuralMod,
    targetChance: diff.targetChance,
    wordInterval: diff.wordInterval,
    lingerMs:     diff.lingerMs + (arch.lingerBonus || 0),
    maxWords:     diff.maxWords,
    burstCount:   5,
    virusSeed:    diff.virusSeed,
    counterAt:    diff.counterAt,
  });
  const devTuningRef = useRef(devTuning);
  devTuningRef.current = devTuning;

  // ── Canvas setup + main loop ──────────────────────────────────────────────

  useEffect(() => {
    hackAudio.init();
    hackAudio.startAmbient();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const S = stateRef.current;

    let FS = 16; // logical font size — scaled to DPR in initGrid
    let cols, rows;

    const initGrid = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      FS = Math.round(16 * dpr); // 16 logical px at all densities
      cols = Math.floor(canvas.width / FS);
      rows = Math.floor(canvas.height / FS);

      S.columns = Array.from({ length: cols }, (_, i) => ({
        idx:      i,
        y:        Math.random() * rows,
        speed:    0.07 + Math.random() * 0.18,
        bright:   0.35 + Math.random() * 0.65,
        chars:    Array.from({ length: rows + 6 }, () => MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)]),
        // Virus infection: 0=clean, 1=front(flickering), 2=corrupted
        infection:  0,
        infectTimer: 0, // countdown to spreading to neighbour
      }));
      S.virusSeeds    = [];   // column indices that are infection origins
      S.lastVirusTick = 0;
      S.counterWord   = null; // active counter-intrusion word object
      S.lastCounter   = 0;
      // Reset
      S.tapZones = [];
    };
    initGrid();

    // ── Word spawner ──────────────────────────────────────────────────────────
    const spawnWord = (now) => {
      // The NEXT word in sequence the player needs
      const nextTarget = seqWords[S.seqIndex];
      const hasNext    = S.seqIndex < seqWords.length;

      // Decide: spawn the target word OR a decoy
      // Bias toward target so it appears regularly but not every spawn
      const isTarget = hasNext && Math.random() < (devTuningRef.current.targetChance || 0.35);
      const word     = isTarget
        ? nextTarget
        : decoys[(S.wordIdCounter * 7 + Math.floor(S.trace)) % decoys.length];

      // Don't spawn the same target word twice if it's already visible
      if (isTarget && S.words.some(w => w.word === nextTarget && w.phase !== "dead")) return;

      const busyCols = new Set(S.words.filter(w => w.phase !== "dead").map(w => w.col));
      const freeCols = S.columns.filter(c => !busyCols.has(c.idx));
      if (freeCols.length === 0) return;

      const col = freeCols[Math.floor(Math.random() * freeCols.length)];
      const revealDelay = 300 + Math.random() * 500;
      const revealAt    = now + revealDelay;

      // Vertical placement: safe rows away from HUD
      const safeTop = 4;
      const safeBot = rows - 5;
      const startRow = safeTop + Math.floor(Math.random() * Math.max(1, safeBot - safeTop - word.length));

      S.wordIdCounter++;
      S.words.push({
        id:        S.wordIdCounter,
        word,
        isTarget,
        seqPos:    isTarget ? S.seqIndex : -1,
        col:       col.idx,
        startRow,
        revealAt,
        phase:     "hidden",
        opacity:   0,
        tapped:    false,
        tapResult: null,
        deepScan:  isTarget && S.deepScan && Math.random() < 0.35,
        spawnTime: now,
      });
    };

    // ── Per-frame game logic ──────────────────────────────────────────────────
    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 50);
      lastTsRef.current = ts;

      if (S.gamePhase !== "active") { rafRef.current = requestAnimationFrame(tick); return; }

      const now = ts;

      // ── Trace climb — paused until first word, stopped during spoof ──────
      const tune = devTuningRef.current;
      const mistakeMult = 1 + S.mistakes * 0.25;
      const effectiveMod = difficulty === "hard" ? arch.traceMod || 1.0 : 1.0;
      if (!S.tracePaused && !S.spoofActive) {
        S.trace = Math.min(100, S.trace + tune.traceSpeed * 2.5 * effectiveMod * mistakeMult * (dt / 1000));
      }

      // Ghost message — fires at 22%, 50%, 75% trace
      const ghostThresholds = [22, 50, 75];
      if (S.ghostShownCount === undefined) S.ghostShownCount = 0;
      const nextThreshold = ghostThresholds[S.ghostShownCount];
      if (nextThreshold && S.trace >= nextThreshold && S.ghostTimer <= 0) {
        S.ghostShownCount++;
        S.ghostShown = true;
        S.ghostMsg   = GHOST_MSGS[Math.floor(Math.random() * GHOST_MSGS.length)];
        S.ghostTimer = 2200;
        hackAudio.sfxGhost();
      }
      if (S.ghostTimer > 0) {
        S.ghostTimer -= dt;
        if (S.ghostTimer <= 0) S.ghostMsg = null;
      }

      if (S.flashTimer > 0) S.flashTimer -= dt;
      if (S.trace >= 100) { endGame(false, "TRACE COMPLETE"); return; }

      // ── Virus spread — event-driven only ───────────────────────────────────
      // Spread existing fronts outward (only if infection already seeded by events)
      if (now - S.lastVirusTick > 1200) {
        S.lastVirusTick = now;
        S.columns.filter(c => c.infection === 1).forEach(col => {
          const hasTarget = S.words.some(w =>
            w.col === col.idx && w.isTarget && w.phase !== "dead" && !w.tapped
          );
          if (hasTarget) return;
          col.infectTimer += 1200;
          if (col.infectTimer > 2400) {
            col.infection = 2; col.infectTimer = 0;
            [-1,1].forEach(d => {
              const n = S.columns[col.idx + d];
              if (n && n.infection === 0) {
                const nHasTarget = S.words.some(w =>
                  w.col === n.idx && w.isTarget && w.phase !== "dead" && !w.tapped
                );
                if (!nHasTarget) n.infection = 1;
              }
            });
          }
        });
      }

      // Threshold escalation — blocked by FIREWALL charges
      if (!S.threshold60Hit && S.trace >= 60) {
        S.threshold60Hit = true;
        if (S.firewallCharges > 0) {
          // Firewall intercepts — no virus seeded, charge consumed
          S.firewallCharges--;
          setHudFirewallCharges(S.firewallCharges);
          // Brief gold flash — wall held
          S.flashTimer = -280; // reuse negative flash for non-red events
        } else {
          S.columns.filter(c => c.infection === 0 && (c.idx < 4 || c.idx > cols-5))
            .sort(() => Math.random()-0.5).slice(0,2)
            .forEach(c => { c.infection = 1; });
        }
      }
      if (!S.threshold80Hit && S.trace >= 80) {
        S.threshold80Hit = true;
        if (S.firewallCharges > 0) {
          S.firewallCharges--;
          setHudFirewallCharges(S.firewallCharges);
          S.flashTimer = -280;
        } else {
          S.columns.filter(c => c.infection === 0)
            .sort(() => Math.random()-0.5).slice(0,3)
            .forEach(c => { c.infection = 1; });
        }
      }

      // Always protect target word columns
      S.words.forEach(w => {
        if (w.isTarget && w.phase !== "dead" && !w.tapped) {
          const tc = S.columns[w.col];
          if (tc) tc.infection = 0;
        }
      });

            // ── Counter-intrusion word ────────────────────────────────────────────
      if (S.trace > (devTuningRef.current.counterAt || 45) && !S.counterWord) {
        const counterInterval = Math.max(3500, 13000 - S.trace * 110);
        if (now - S.lastCounter > counterInterval) {
          // Only block counter word if target has been visible for less than 1.5s
          // — gives player a moment to register the target before splitting attention
          const targetJustAppeared = S.words.some(w =>
            w.isTarget && (w.phase === "linger" || w.phase === "reveal") &&
            w.revealStart && (Date.now() - w.revealStart) < 1500
          );
          if (!targetJustAppeared) {
            // Pick any column for trace node — preferring infected but not required
            const hostCols = S.columns.filter(c => c.infection >= 1);
            const anyCol   = S.columns;
            const pool     = hostCols.length > 0 ? hostCols : anyCol;
            if (pool.length > 0) {
              const hCol = pool[Math.floor(Math.random() * pool.length)];
              const cWord = TRACE_NODES[Math.floor(Math.random() * TRACE_NODES.length)];
              S.counterWord = {
                word:      cWord,
                col:       hCol.idx,
                startRow:  4 + Math.floor(Math.random() * (rows - 10 - cWord.length)),
                born:      now,
                duration:  Math.max(1200, 2600 - S.trace * 16), // aggressive at high trace
                opacity:   0,
                tapped:    false,
              };
              S.lastCounter = now;
              hackAudio.sfxTraceNodeAppear();
            }
          }
        }
      }

      // Update counter word lifecycle
      if (S.counterWord) {
        const cw = S.counterWord;
        const age = now - cw.born;
        if (age < 300) cw.opacity = age / 300;
        else if (age < cw.duration - 400) cw.opacity = 1;
        else cw.opacity = Math.max(0, (cw.duration - age) / 400);

        if (age >= cw.duration && !cw.tapped) {
          // Missed — punish hard
          S.trace = Math.min(100, S.trace + 14);
          S.flashTimer = 400;
          // Accelerate nearby virus spread
          const col = S.columns[cw.col];
          if (col) col.infection = Math.min(2, col.infection + 1);
          S.counterWord = null;
        } else if (age >= cw.duration + 600) {
          S.counterWord = null;
        }
      }

      // ── Word spawn — paused during spoof ────────────────────────────────
      const interval = tune.wordInterval * (1 - S.trace * 0.002);
      const visibleWords = S.words.filter(w => w.phase === "linger" || w.phase === "reveal").length;
      const forceSpawn   = visibleWords === 0 && now - S.lastWordSpawn > 600;
      if (!S.spoofActive && (forceSpawn || now - S.lastWordSpawn > interval)) {
        S.lastWordSpawn = now;
        for (let b = 0; b < tune.burstCount; b++) {
          if (visibleWords + b < tune.maxWords) spawnWord(now);
        }
      }

      // ── Update rain columns — speed increases with trace ──
      // At 0% trace: base speed. At 100%: 2.8x faster. Feels like system spinning up.
      const rainMult = S.tracePaused ? 1.0 : 1.0 + (S.trace / 100) * 1.8;
      // Mutation rate increases with trace — code gets noisier/more chaotic
      const mutateExtra = Math.floor((S.trace / 100) * 3); // 0-3 extra mutations per frame
      S.columns.forEach(col => {
        col.y += col.speed * rainMult * (dt / 16);
        if (col.y > rows + 6) {
          col.y = -6;
          col.chars = Array.from({ length: rows+6 }, () => MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)]);
        }
        // Mutate leading char + extra chars at high trace (agitated code)
        const hi = Math.floor(col.y) % col.chars.length;
        col.chars[hi < 0 ? hi + col.chars.length : hi] = MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)];
        for (let m = 0; m < mutateExtra; m++) {
          const ri = Math.floor(Math.random() * col.chars.length);
          col.chars[ri] = MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)];
        }
      });

      // ── Update words ──
      S.tapZones = [];
      S.words = S.words.filter(w => w.phase !== "dead");

      S.words.forEach(w => {
        const col = S.columns[w.col];
        if (!col) { w.phase = "dead"; return; }
        const head = Math.floor(col.y);

        if (w.phase === "hidden") {
          if (now >= w.revealAt) {
            // Sync startRow to column head at reveal time — looks rain-triggered
            w.startRow = Math.max(4, Math.min(rows - 5 - w.word.length, Math.floor(col.y)));
            w.phase = "reveal";
            w.opacity = 0;
            w.revealStart = Date.now();
            if (w.isTarget) {
              hackAudio.sfxReveal();
              // SIGNAL: mark word for bright flash — draw handles the visual
              if (S.signal) w.signalFlash = true;
            }
          }
          if (now - w.spawnTime > 8000) { w.phase = "dead"; }
        }
        else if (w.phase === "reveal") {
          // Quick fade in (~200ms)
          const age = Date.now() - w.revealStart;
          w.opacity = Math.min(1, age / 200);
          if (w.opacity >= 1) {
            w.phase = "linger";
            w.lingerStart = Date.now();
            w.lingerDuration = devTuningRef.current.lingerMs;
          }
        }
        else if (w.phase === "linger") {
          w.opacity = 1;
          const age = Date.now() - w.lingerStart;
          if (age >= (w.lingerDuration || devTuningRef.current.lingerMs)) {
            w.phase = "fade";
            w.fadeStart = Date.now();
          }
        }
        else if (w.phase === "fade") {
          const age = Date.now() - w.fadeStart;
          const fadeDur = 700;
          w.opacity = Math.max(0, 1 - age / fadeDur);
          if (w.opacity <= 0) w.phase = "dead";
        }

        if (w.phase !== "hidden" && w.phase !== "dead" && !w.tapped && w.opacity > 0.08) {
          // Padding in physical pixels — FS*1.5 wide, FS*0.75 tall gives ~24/12 logical px on any DPR
          const PAD_H = Math.round(FS * 1.5), PAD_V = Math.round(FS * 0.75);
          S.tapZones.push({
            wordObj: w,
            x: w.col * FS - PAD_H,
            y: w.startRow * FS - PAD_V,
            w: FS + PAD_H * 2,
            h: w.word.length * FS + PAD_V * 2,
            isCounter: false,
          });
        }
      });

      // Counter word tap zone
      if (S.counterWord && !S.counterWord.tapped && S.counterWord.opacity > 0.08) {
        const cw = S.counterWord;
        const PAD_H = Math.round(FS * 2), PAD_V = Math.round(FS * 1);
        S.tapZones.push({
          counterObj: cw,
          isCounter:  true,
          x: cw.col * FS - PAD_H,
          y: cw.startRow * FS - PAD_V,
          w: FS + PAD_H * 2,
          h: cw.word.length * FS + PAD_V * 2,
        });
      }

      // ── SPOOF tick ────────────────────────────────────────────────────────
      if (S.spoofActive) {
        S.spoofTimer -= dt;
        if (S.spoofTimer <= 0) { S.spoofActive = false; setHudSpoofActive(false); }
      }

      // ── SURGE tick — 4s window, correct taps reduce trace ─────────────────
      if (S.surgeActive) {
        S.surgeTimer -= dt;
        if (S.surgeTimer <= 0) { S.surgeActive = false; setHudSurgeActive(false); }
      }

      // ── PULSE tick — 1.5s decoy dim window ────────────────────────────────
      if (S.pulseActive) {
        S.pulseTimer -= dt;
        if (S.pulseTimer <= 0) { S.pulseActive = false; setHudPulseActive(false); }
      }

      // ── SHARD early warning — 2s before trace node spawns ─────────────────
      // We predict when the next trace node will spawn and warn Shard players
      if (S.shard && !S.spoofActive && S.trace > (devTuningRef.current.counterAt || 20)) {
        const counterInterval = Math.max(3500, 13000 - S.trace * 110);
        const timeToNext = S.lastCounter + counterInterval - now;
        if (timeToNext > 0 && timeToNext < 2000 && !S.counterWord) {
          // Pick the column the trace node will appear in (pre-warn)
          if (S.shardWarningTimer <= 0) {
            const hostCols = S.columns.filter(c => c.infection >= 1);
            const pool = hostCols.length > 0 ? hostCols : S.columns;
            S.shardWarningCol = pool[Math.floor(Math.random() * pool.length)]?.idx ?? -1;
            S.shardWarningTimer = 2000;
          }
          setHudShardWarning(true);
        } else {
          if (S.shardWarningCol >= 0 && S.counterWord) S.shardWarningCol = -1;
          setHudShardWarning(false);
        }
        if (S.shardWarningTimer > 0) S.shardWarningTimer -= dt;
      }

      // ── Ambient pitch update every 2s ──
      if (!S.lastPitchUpdate) S.lastPitchUpdate = 0;
      if (now - S.lastPitchUpdate > 2000) {
        S.lastPitchUpdate = now;
        hackAudio.updateAmbientPitch(S.trace);
      }

      // ── HUD sync ──
      setHudTrace(Math.floor(S.trace));
      setHudSeqIndex(S.seqIndex);
      if (S.ghostMsg !== ghostMsg) setGhostMsg(S.ghostMsg);

      // ── Draw ──
      draw(ctx, canvas, FS, cols, rows);

      // Check win
      if (S.seqIndex >= seqWords.length) { endGame(true); return; }

      rafRef.current = requestAnimationFrame(tick);
    };

    // ── Draw function ─────────────────────────────────────────────────────────
    const draw = (ctx, canvas, FS, cols, rows) => {
      const S      = stateRef.current;
      const t      = Date.now();
      // redAmt only applies to corrupted zones — clean rain stays pure green
      const redAmt = 0;

      // Trail fade
      ctx.fillStyle = "rgba(0,0,0,0.09)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FS}px "Courier New",monospace`;

      // Build word lookup
      const wordByCol = {};
      S.words.forEach(w => {
        if (w.phase === "hidden" || w.phase === "dead") return;
        if (!wordByCol[w.col]) wordByCol[w.col] = [];
        wordByCol[w.col].push(w);
      });

      S.columns.forEach(col => {
        const head       = Math.floor(col.y);
        const wordsInCol = wordByCol[col.idx] || [];
        const inf        = col.infection; // 0=clean, 1=front, 2=corrupted

        for (let r = Math.max(0, head-30); r <= Math.min(rows-1, head+1); r++) {
          const dist = head - r;

          // Check word character
          let wordHere = null, wordCharIdx = -1;
          for (const w of wordsInCol) {
            const idx = r - w.startRow;
            if (idx >= 0 && idx < w.word.length) { wordHere=w; wordCharIdx=idx; break; }
          }

          if (wordHere) {
            const w = wordHere;
            let r_val, g_val, b_val, alpha;

            if (w.tapped) {
              if (w.tapResult==="correct")    { r_val=0;   g_val=255; b_val=65;  alpha=w.opacity*0.95; }
              else if (w.tapResult==="order") { r_val=255; g_val=160; b_val=0;   alpha=w.opacity*0.9;  }
              else                            { r_val=255; g_val=30;  b_val=0;   alpha=w.opacity*0.85; }
            } else if (w.phase==="reveal") {
              // SIGNAL: target words get a full-brightness flash at surface moment
              if (w.signalFlash && w.opacity < 0.8) {
                r_val=255; g_val=255; b_val=255; alpha=1.0;
                if (w.opacity >= 0.8) w.signalFlash = false;
              } else {
                r_val=Math.floor(w.opacity*255); g_val=Math.floor(180+w.opacity*75);
                b_val=Math.floor(w.opacity*200); alpha=0.5+w.opacity*0.5;
              }
            } else if (w.phase==="linger") {
              if (w.deepScan && S.deepScan) { r_val=180; g_val=230; b_val=255; }
              else            { r_val=255; g_val=255; b_val=255; }
              alpha=0.95;
            } else {
              const f=w.opacity;
              r_val=Math.floor(f*220); g_val=Math.floor(f*255); b_val=Math.floor(f*180); alpha=f*0.9;
            }

            // PULSE active — dim decoys dramatically so targets stand out
            if (!w.isTarget && S.pulseActive && !w.tapped) {
              ctx.fillStyle = `rgba(0,40,0,${w.opacity * 0.15})`;
              ctx.fillText(w.word[wordCharIdx], col.idx*FS, r*FS);
              continue;
            }

            // Decoys in infected columns get eaten (chars flicker to glitch)
            if (!w.isTarget && inf >= 1) {
              const flicker = Math.sin(t * 0.015 + wordCharIdx) > 0.3;
              if (flicker) {
                // Show glitch char instead
                const gc = GLITCH_CHARS[Math.floor(t/120 + r) % GLITCH_CHARS.length];
                ctx.fillStyle = `rgba(180,0,0,${alpha*0.7})`;
                ctx.fillText(gc, col.idx*FS, r*FS);
                continue;
              }
              alpha *= 0.5; r_val=Math.min(255,r_val+60); g_val=Math.max(0,g_val-40);
            }

            ctx.fillStyle = `rgba(${r_val},${g_val},${b_val},${alpha})`;
            ctx.fillText(w.word[wordCharIdx], col.idx*FS, r*FS);

          } else {
            // ── Rain or virus character ──────────────────────────────────────
            let alpha, rVal, gVal, ch;

            if (inf === 2) {
              // Fully corrupted — dark red static with glitch chars
              const spike = Math.sin(t * 0.02 + col.idx * 7.3) > 0.85;
              ch    = spike
                ? GLITCH_CHARS[Math.floor(t/80 + r*3) % GLITCH_CHARS.length]
                : col.chars[r % col.chars.length];
              rVal  = spike ? 220 : 100 + Math.floor(Math.random()*40);
              gVal  = 0;
              alpha = spike ? 0.9 : (0.2 + Math.random()*0.2);
            } else if (inf === 1) {
              // Infection front — flickering between green and red glitch
              const flicker = Math.sin(t * 0.012 + r * 2.1 + col.idx) > 0;
              ch    = flicker
                ? GLITCH_CHARS[Math.floor(t/100 + r) % GLITCH_CHARS.length]
                : col.chars[r % col.chars.length];
              if (flicker) {
                rVal  = 180 + Math.floor(Math.random()*60);
                gVal  = Math.floor(Math.random()*30);
                alpha = 0.5 + Math.random()*0.4;
              } else {
                const f = 1 - dist/30;
                rVal  = Math.floor(140 + f*80);
                gVal  = Math.floor(f*60);
                alpha = f * col.bright * 0.7;
              }
            } else {
              // Clean — normal green rain
              ch = col.chars[r % col.chars.length];
              if (dist===0) {
                rVal=Math.floor(redAmt*160); gVal=Math.floor(200+redAmt*30); alpha=col.bright;
              } else {
                const f=1-dist/30;
                alpha=f*col.bright*0.72;
                gVal=Math.floor((75+f*160)*(1-redAmt*0.3));
                rVal=Math.floor(redAmt*120*f);
              }
            }

            ctx.fillStyle = `rgba(${rVal||0},${gVal||0},30,${alpha})`;
            ctx.fillText(ch||" ", col.idx*FS, r*FS);
          }
        }
      });

      // ── TRACE NODE — vivid alarming red, unmissable ──────────────────────
      if (S.counterWord && S.counterWord.opacity > 0.02) {
        const cw     = S.counterWord;
        const now2   = Date.now();
        // Fast aggressive pulse — 4Hz alarm rhythm
        const pulse  = 0.55 + 0.45 * Math.sin(now2 * 0.025);
        // Urgency pulse — gets faster as duration runs out
        const age    = now2 - cw.born;
        const urgency = Math.min(1, age / cw.duration);
        const fastPulse = 0.5 + 0.5 * Math.sin(now2 * (0.025 + urgency * 0.04));

        const x = cw.col * FS;
        const y = cw.startRow * FS;
        const h = cw.word.length * FS;

        if (!cw.tapped) {
          // Outer alarm glow — large, bleeds into surroundings
          const glowGrad = ctx.createRadialGradient(
            x + FS/2, y + h/2, 2,
            x + FS/2, y + h/2, FS * 4
          );
          glowGrad.addColorStop(0, `rgba(255,0,0,${cw.opacity * fastPulse * 0.5})`);
          glowGrad.addColorStop(1, `rgba(255,0,0,0)`);
          ctx.fillStyle = glowGrad;
          ctx.fillRect(x - FS*4, y - FS*2, FS*9, h + FS*4);

          // Pulsing bracket — thick, alarming
          ctx.strokeStyle = `rgba(255,${Math.floor(fastPulse*60)},0,${cw.opacity * 0.95})`;
          ctx.lineWidth   = 2;
          ctx.strokeRect(x - 3, y - 3, FS + 6, h + 6);

          // Inner fill — background tint so word reads clearly
          ctx.fillStyle = `rgba(60,0,0,${cw.opacity * 0.7})`;
          ctx.fillRect(x - 2, y - 2, FS + 4, h + 4);

          // TRACE NODE label above — clear instruction
          ctx.font      = `bold 9px "Courier New",monospace`;
          ctx.textAlign = "center";
          ctx.fillStyle = `rgba(255,80,0,${cw.opacity * fastPulse})`;
          ctx.shadowColor = "rgba(255,0,0,0.9)"; ctx.shadowBlur = 8;
          ctx.fillText("▼ TRACE NODE", x + FS/2, y - Math.round(FS * 0.4));
          ctx.shadowBlur  = 0;
          ctx.textAlign   = "left";
          ctx.font        = `${FS}px "Courier New",monospace`;
        }

        // Word characters — bright white on red bg, maximum contrast
        ctx.shadowColor = `rgba(255,30,0,${fastPulse * 0.9})`;
        ctx.shadowBlur  = 16;
        for (let i = 0; i < cw.word.length; i++) {
          // Characters flash between white and bright red on the pulse
          const charBright = fastPulse > 0.7 ? 255 : 200;
          ctx.fillStyle = cw.tapped
            ? `rgba(0,255,65,${cw.opacity * 0.8})`
            : `rgba(${charBright},${Math.floor(fastPulse*30)},0,${cw.opacity})`;
          ctx.fillText(cw.word[i], x, (cw.startRow + i) * FS);
        }
        ctx.shadowBlur = 0;

        // Time-remaining bar — thin red bar showing how long before it fires
        if (!cw.tapped) {
          const timeLeft = Math.max(0, 1 - age / cw.duration);
          ctx.fillStyle = `rgba(100,0,0,${cw.opacity * 0.6})`;
          ctx.fillRect(x - 3, y + h + 4, FS + 6, 3);
          ctx.fillStyle = `rgba(255,${Math.floor(timeLeft * 80)},0,${cw.opacity * 0.9})`;
          ctx.fillRect(x - 3, y + h + 4, (FS + 6) * timeLeft, 3);
        }
      }

      // ── Vignette — dark edges close in as trace climbs ────────────────────
      // Pure psychological pressure — no colour change, just space shrinking
      if (!S.tracePaused && S.trace > 15) {
        const vAmt   = Math.max(0, (S.trace - 15) / 85); // 0 at 15%, 1 at 100%
        const vSize  = Math.min(canvas.width, canvas.height) * 0.55 * vAmt;
        const vGrad  = ctx.createRadialGradient(
          canvas.width/2, canvas.height/2, Math.max(10, Math.min(canvas.width,canvas.height)/2 - vSize),
          canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height) * 0.75
        );
        vGrad.addColorStop(0, "rgba(0,0,0,0)");
        vGrad.addColorStop(1, `rgba(0,0,0,${vAmt * 0.72})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Corruption zone red pulse — only when virus is active
      const hasInfection = S.columns.some(c => c.infection > 0);
      if (hasInfection && S.trace > 60) {
        const infAmt = (S.trace - 60) / 40;
        const pulse  = Math.sin(Date.now() * 0.004) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(100,0,0,${infAmt * 0.12 * pulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // ── SHARD early warning — flicker in predicted trace node column ───────
      if (S.shard && S.shardWarningCol >= 0 && S.shardWarningTimer > 0) {
        const wc  = S.shardWarningCol;
        const wt  = S.shardWarningTimer / 2000;
        const flk = Math.sin(Date.now() * 0.03) > 0;
        if (flk) {
          ctx.fillStyle = `rgba(255,200,0,${wt * 0.3})`;
          ctx.fillRect(wc * FS - 1, 0, FS + 2, canvas.height);
        }
        ctx.font = `${Math.round(FS * 0.6)}px "Courier New",monospace`;
        ctx.fillStyle = `rgba(255,180,0,${wt * 0.9})`;
        ctx.textAlign = "center";
        ctx.fillText("▼ INCOMING", wc * FS + FS/2, Math.round(FS * 1.5));
        ctx.textAlign = "left";
        ctx.font = `${FS}px "Courier New",monospace`;
      }

      // ── Flash — red for mistake, green for Ghost Thread catch ────────────
      if (S.flashTimer > 0) {
        ctx.fillStyle = `rgba(255,0,0,${(S.flashTimer/300)*0.18})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (S.flashTimer < 0) {
        // Ghost Thread fired — green flash
        ctx.fillStyle = `rgba(0,255,65,${(Math.abs(S.flashTimer)/180)*0.16})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        S.flashTimer = Math.min(0, S.flashTimer + 8);
      }

      // ── Ghost message ─────────────────────────────────────────────────────
      if (S.ghostMsg) {
        const age   = 2400 - S.ghostTimer;
        const alpha = age < 300 ? age/300 : S.ghostTimer < 500 ? S.ghostTimer/500 : 1;
        ctx.textAlign="center"; ctx.font=`bold ${Math.round(FS * 1.5)}px "Courier New",monospace`;
        ctx.fillStyle=`rgba(255,20,0,${alpha*0.9})`;
        ctx.shadowColor="rgba(255,0,0,0.7)"; ctx.shadowBlur=18;
        ctx.fillText(S.ghostMsg, canvas.width/2, canvas.height/2);
        ctx.shadowBlur=0; ctx.textAlign="left";
        ctx.font=`${FS}px "Courier New",monospace`;
      }

      // ── Tap feedback: expanding ring + symbol ──────────────────────────────
      S.words.filter(w => w.tapped && w.tapResult && w.opacity > 0.02).forEach(w => {
        const isCorrect = w.tapResult === "correct";
        const isOrder   = w.tapResult === "order";
        // Centre of the vertical word
        const cx = w.col * FS + FS / 2;
        const cy = (w.startRow + w.word.length / 2) * FS;
        const ringR = (1 - w.opacity) * 44;

        // Expanding ring
        ctx.strokeStyle = isCorrect ? `rgba(0,255,65,${w.opacity*0.8})`
                        : isOrder   ? `rgba(255,160,0,${w.opacity*0.8})`
                        :             `rgba(255,40,0,${w.opacity*0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, ringR), 0, Math.PI*2);
        ctx.stroke();

        // Symbol to the right of the word
        if (w.opacity > 0.15) {
          ctx.textAlign   = "left";
          ctx.font        = `bold ${Math.round(FS * 1.1)}px "Courier New",monospace`;
          ctx.shadowColor = isCorrect ? "rgba(0,255,65,0.9)" : isOrder ? "rgba(255,160,0,0.8)" : "rgba(255,0,0,0.9)";
          ctx.shadowBlur  = 12;
          ctx.fillStyle   = isCorrect ? `rgba(0,255,100,${w.opacity})`
                          : isOrder   ? `rgba(255,160,0,${w.opacity})`
                          :             `rgba(255,60,0,${w.opacity})`;
          ctx.fillText(
            isCorrect ? "✓" : isOrder ? "⟳" : "✗",
            w.col * FS + FS + 3,
            w.startRow * FS
          );
          ctx.shadowBlur = 0;
        }
        ctx.font = `${FS}px "Courier New",monospace`;
      });
    };

    // ── Tap handler ───────────────────────────────────────────────────────────
    const handleTap = (e) => {
      e.preventDefault();
      const S = stateRef.current;
      if (S.gamePhase !== "active") return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
      const cy = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top)  * scaleY;

      // Hit test tap zones — find closest centre
      let hit = null, bestDist = Infinity;
      S.tapZones.forEach(zone => {
        if (cx >= zone.x && cx <= zone.x + zone.w &&
            cy >= zone.y && cy <= zone.y + zone.h) {
          const dx = cx - (zone.x + zone.w/2);
          const dy = cy - (zone.y + zone.h/2);
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < bestDist) { bestDist = d; hit = zone; }
        }
      });

      if (!hit) return;

      // Trace node tap — neutralise the active trace signal
      if (hit.isCounter && S.counterWord && !S.counterWord.tapped) {
        S.counterWord.tapped = true;
        S.trace = Math.max(0, S.trace - 10);
        hackAudio.sfxTraceNodeCut();
        // Virus retreats around this column — wider clean pulse
        const cIdx = S.counterWord.col;
        [-3,-2,-1,0,1,2,3].forEach(d => {
          const n = S.columns[cIdx + d];
          if (n) {
            // Retreat strength falls off with distance
            const strength = d === 0 ? 2 : Math.abs(d) <= 1 ? 2 : 1;
            n.infection = Math.max(0, n.infection - strength);
            n.infectTimer = 0; // reset spread timer — buys more time
          }
        });
        return;
      }

      const w = hit.wordObj;
      if (!w || w.tapped) return;
      w.tapped = true;

      const isCorrectWord = w.isTarget && w.seqPos === S.seqIndex;
      const isWrongOrder  = w.isTarget && w.seqPos !== S.seqIndex;

      if (isCorrectWord) {
        w.tapResult = "correct";
        w.phase     = "fade";
        w.fadeStart = Date.now();
        hackAudio.sfxCorrect();
        S.tracePaused = false;
        // SURGE active — each correct tap cuts trace
        if (S.surgeActive) {
          S.trace = Math.max(0, S.trace - 4);
          setHudTrace(Math.floor(S.trace));
        }
        S.seqIndex++;
        setHudSeqIndex(S.seqIndex);
        if (S.seqIndex >= seqWords.length) { setTimeout(() => endGame(true), 300); }
      } else {
        w.tapResult = isWrongOrder ? "order" : "wrong";
        w.phase     = "fade";
        w.fadeStart = Date.now();

        // GHOST THREAD — silently absorbs this mistake
        if (S.ghostThreadReady && !S.ghostThreadSpent) {
          S.ghostThreadSpent = true;
          setHudGhostThread(false);
          // No trace spike, no virus, no mistake count — completely silent
          // Just a brief green flash to confirm the thread fired
          S.flashTimer = -180; // negative = green flash signal
          hackAudio.sfxCorrect(); // quiet affirmation the thread caught it
          return;
        }

        hackAudio.sfxWrong();
        hackAudio.sfxTraceSurge();
        S.mistakes++;
        S.trace = Math.min(100, S.trace + 8 + S.mistakes * 3);
        S.flashTimer = 320;
        setHudMistakes(S.mistakes);
        // Seed virus at mistake position
        const mistakeCol = S.columns[w.col];
        if (mistakeCol) {
          mistakeCol.infection = 2;
          [-1,1,-2,2].forEach(d => {
            const n = S.columns[w.col + d];
            if (n && n.infection < 1) n.infection = 1;
          });
        }
        if (S.mistakes >= diff.mistakes && S.ice === 0) {
          setTimeout(() => endGame(false, "WRONG SEQUENCE — TRACED"), 400);
        }
      }
    };

    canvas.addEventListener("click",       handleTap);
    canvas.addEventListener("touchstart",  handleTap, { passive: false });
    window.addEventListener("resize", initGrid);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", handleTap);
      canvas.removeEventListener("touchstart", handleTap);
      window.removeEventListener("resize", initGrid);
      hackAudio.stopAmbient();
    };
  }, []);

  // ── Game actions ──────────────────────────────────────────────────────────

  const endGame = (success, reason) => {
    const S = stateRef.current;
    if (S.gamePhase !== "active") return;
    S.gamePhase = "done";
    hackAudio.stopAmbient();
    if (success) hackAudio.sfxSuccess(); else hackAudio.sfxFail();

    const flawless = success && S.mistakes === 0 && S.trace < (diff.ghostRunTrace || 28);
    const quick    = success && S.trace < 42;
    const iceUsed = (iceCharges || 0) - S.ice; // how many ICE charges were consumed
    setTimeout(() => onDone({
      success, flawless, quick,
      unjacked: false,
      iceUsed: Math.max(0, iceUsed),
      // Score: base from trace remaining + bonus for low mistakes + speed bonus
      score: success
        ? Math.round((1 - S.trace/100) * 60 + (1 - S.mistakes / diff.mistakes) * 25 + (S.mistakes === 0 ? 15 : 0))
        : Math.round(S.seqIndex / seqWords.length * 20),
      mistakes: S.mistakes,
      seqWords,
      seqIndex: S.seqIndex,
      seqHint:  sequence.hint,
      penalty:  success ? null : "severe",
      reason,
    }), 500);
  };

  const useIce = () => {
    const S = stateRef.current;
    if (S.ice <= 0 || S.gamePhase !== "active") return;
    hackAudio.sfxIce();
    S.ice--;
    S.trace = Math.max(0, S.trace - 20);
    S.columns.forEach(c => { c.infection = 0; c.infectTimer = 0; });
    S.counterWord = null;
    setHudIce(S.ice);
    setHudTrace(Math.floor(S.trace));
  };

  const useSurge = () => {
    const S = stateRef.current;
    if (!S.surge || S.surgeActive || S.gamePhase !== "active") return;
    S.surge      = false;
    S.surgeActive = true;
    S.surgeTimer  = 4000;
    setHudSurgeReady(false);
    setHudSurgeActive(true);
    // SFX — aggressive power-up charge
    hackAudio._sfx((ctx, out) => {
      const t = ctx.currentTime;
      [220, 330, 440, 660, 880].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = freq;
        g.gain.value = 0; g.gain.linearRampToValueAtTime(0.1, t + i*0.03 + 0.01);
        g.gain.setTargetAtTime(0, t + i*0.03 + 0.04, 0.03);
        o.connect(g); g.connect(out); o.start(t + i*0.03); o.stop(t + i*0.03 + 0.12);
      });
    });
  };

  const usePulse = () => {
    const S = stateRef.current;
    if (!S.pulse || S.pulseActive || S.gamePhase !== "active") return;
    S.pulse      = false;
    S.pulseActive = true;
    S.pulseTimer  = 1500;
    setHudPulseReady(false);
    setHudPulseActive(true);
    // SFX — scanner sweep
    hackAudio._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 400;
      o.frequency.linearRampToValueAtTime(2400, t + 0.15);
      g.gain.value = 0.14; g.gain.setTargetAtTime(0, t + 0.12, 0.05);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
      hackAudio._noise(ctx, out, 0.12, 1800, "bandpass", 0.08, t + 0.05);
    });
  };

  const useSpoof = () => {
    const S = stateRef.current;
    if (!S.spoof || S.spoofActive || S.gamePhase !== "active") return;
    S.spoof     = false; // consumable — one use
    S.spoofActive = true;
    S.spoofTimer  = 6000; // 6 seconds
    setHudSpoofReady(false);
    setHudSpoofActive(true);
    // Distinct SFX — trace flatlining
    hackAudio._sfx((ctx, out) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 220;
      o.frequency.setTargetAtTime(218, t, 0.5); // very slight detune = flatline hum
      g.gain.value = 0; g.gain.linearRampToValueAtTime(0.12, t + 0.1);
      g.gain.setTargetAtTime(0, t + 0.8, 0.3);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.5);
      // Two confirmation clicks
      [0, 0.08].forEach(d => {
        const c = ctx.createOscillator(), cg = ctx.createGain();
        c.type = "square"; c.frequency.value = 880;
        cg.gain.value = 0.14; cg.gain.setTargetAtTime(0, t+d+0.02, 0.015);
        c.connect(cg); cg.connect(out); c.start(t+d); c.stop(t+d+0.05);
      });
    });
  };

  const useSpike = () => {
    const S = stateRef.current;
    if (!S.spike || S.gamePhase !== "active") return;
    S.spike = false;
    setHudSpikeReady(false);
    if (S.counterWord) {
      // Destroy active trace node: aggressive direct countermeasure
      S.counterWord.tapped = true;
      S.counterWord = null;
      S.trace = Math.max(0, S.trace - 15);
      // Retreat virus 10 columns from nearest target word
      const retreat = 10;
      S.columns.forEach((c, i) => {
        if (c.infection > 0) {
          const nearestTarget = S.words.filter(w => w.isTarget).reduce((best, w) => {
            return Math.abs(w.col - i) < Math.abs(best - i) ? w.col : best;
          }, 999);
          if (Math.abs(i - nearestTarget) < retreat) { c.infection = 0; c.infectTimer = 0; }
        }
      });
      setHudTrace(Math.floor(S.trace));
      hackAudio.sfxTraceNodeCut();
    } else {
      // EMP burst: no active node, stun word spawning briefly
      S.trace = Math.max(0, S.trace - 8);
      S.lastWordSpawn = Date.now() + 1500;
      setHudTrace(Math.floor(S.trace));
      hackAudio.sfxTraceSurge();
    }
  };

  const unjack = () => {
    const S = stateRef.current;
    if (S.gamePhase !== "active") return;
    S.gamePhase = "done";
    hackAudio.stopAmbient();
    hackAudio.sfxFail();
    const iceUsedOnUnjack = (iceCharges || 0) - stateRef.current.ice;
    setTimeout(() => onDone({
      success: false, flawless: false, quick: false, unjacked: true,
      iceUsed: Math.max(0, iceUsedOnUnjack),
      score: Math.round(stateRef.current.seqIndex / seqWords.length * 30),
      mistakes: stateRef.current.mistakes,
      seqWords,
      seqIndex: stateRef.current.seqIndex,
      seqHint:  sequence.hint,
      penalty: "minor",
    }), 400);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const traceColor = hudTrace < 40 ? "#00ff41" : hudTrace < 72 ? "#ffaa00" : "#ff2200";
  const traceGlow  = hudTrace < 40 ? "rgba(0,255,65,0.4)" : hudTrace < 72 ? "rgba(255,170,0,0.4)" : "rgba(255,34,0,0.6)";

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", cursor:"crosshair" }} />

      {/* ── TOP HUD ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:10,
        background:"rgba(0,0,0,0.9)", borderBottom:"1px solid #0a2a0a",
        padding:"10px 14px", display:"flex", flexDirection:"column", gap:"8px",
      }}>
        {/* Instruction */}
        <div style={{ fontSize:"9px", letterSpacing:"3px", color:"#2a5a2a", textAlign:"center" }}>
          TAP WORDS IN ORDER AS THEY SURFACE
        </div>

        {/* Sequence display — compact for long sequences */}
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", justifyContent:"center", alignItems:"center" }}>
          {seqWords.map((word, i) => {
            const done    = i < hudSeqIndex;
            const current = i === hudSeqIndex;
            const showWord = archetype === "netrunner" || done || current;
            // Compact mode for 5+ words
            const compact = seqWords.length >= 5;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                {i > 0 && (
                  <span style={{ color:"#1a4a1a", fontSize:"12px" }}>›</span>
                )}
                <div style={{
                  fontSize:      compact ? "13px" : "15px",
                  fontWeight:    "bold",
                  letterSpacing: compact ? "1px" : "3px",
                  padding:       compact ? "6px 8px" : "8px 14px",
                  color:      done ? "#000" : current ? "#ffffff" : "#2a6a2a",
                  background: done ? "#00ff41" : current ? "rgba(255,255,255,0.1)" : "transparent",
                  border:     `1px solid ${done ? "#00ff41" : current ? "#5a9a5a" : "#1a3a1a"}`,
                  boxShadow:  done ? "0 0 10px rgba(0,255,65,0.5)" : current ? "0 0 6px rgba(255,255,255,0.15)" : "none",
                  minWidth:   compact ? "24px" : "40px",
                  textAlign:  "center",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}>
                  {done ? "✓" : showWord ? word : "·"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Programs + errors row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"6px" }}>
          {/* Error indicators */}
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            {Array.from({length: diff.mistakes}).map((_, i) => (
              <span key={i} style={{ fontSize:"16px", color: i < hudMistakes ? "#ff2200" : "#1a4a1a" }}>■</span>
            ))}
            <span style={{ fontSize:"10px", letterSpacing:"2px", color:"#2a5a2a", marginLeft:"3px" }}>ERR</span>
          </div>

          {/* Program slots */}
          <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>

            {/* ICE — active, consumable */}
            {Array.from({length: hudIce}).map((_, i) => (
              <button key={i} onClick={i === 0 ? useIce : undefined} style={{
                background:"rgba(0,60,180,0.25)", border:"1px solid #0044bb",
                color:"#4488ff", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px", cursor:"pointer",
                boxShadow:"0 0 6px rgba(0,80,255,0.25)",
              }}>◈ ICE</button>
            ))}

            {/* SPOOF — active, consumable */}
            {hudSpoofReady && (
              <button onClick={useSpoof} style={{
                background:"rgba(120,0,180,0.25)", border:"1px solid #7700bb",
                color:"#cc66ff", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px", cursor:"pointer",
                boxShadow:"0 0 6px rgba(150,0,255,0.25)",
              }}>⧖ SPOOF</button>
            )}
            {hudSpoofActive && (
              <div style={{
                background:"rgba(120,0,180,0.4)", border:"1px solid #aa44ff",
                color:"#ee88ff", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
                boxShadow:"0 0 10px rgba(150,0,255,0.5)",
                animation:"spoof-pulse 0.5s infinite alternate",
              }}>⧖ SPOOFING</div>
            )}

            {/* GHOST THREAD — passive, auto */}
            {hudGhostThread && (
              <div style={{
                background:"rgba(0,80,0,0.2)", border:"1px solid #005500",
                color:"#33aa33", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
              }}>◉ THREAD</div>
            )}
            {!hudGhostThread && (programs || []).includes("ghost_thread") && (
              <div style={{
                background:"transparent", border:"1px solid #1a2a1a",
                color:"#1a3a1a", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
              }}>◉ THREAD</div>
            )}

            {/* SHARD — passive, permanent indicator */}
            {(programs || []).includes("shard") && (
              <div style={{
                background: hudShardWarning ? "rgba(255,180,0,0.25)" : "rgba(80,60,0,0.2)",
                border: `1px solid ${hudShardWarning ? "#ffaa00" : "#443300"}`,
                color: hudShardWarning ? "#ffcc44" : "#665500",
                fontFamily:"inherit", fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
                boxShadow: hudShardWarning ? "0 0 8px rgba(255,180,0,0.4)" : "none",
                transition:"all 0.2s",
              }}>◈ SHARD{hudShardWarning ? " ▼" : ""}</div>
            )}

            {/* DEEP SCAN — passive indicator */}
            {(programs || []).includes("deep_scan") && (
              <div style={{
                background:"rgba(0,60,120,0.2)", border:"1px solid #003366",
                color:"#2266aa", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
              }}>◈ D.SCAN</div>
            )}

            {/* SIGNAL — passive indicator */}
            {(programs || []).includes("signal") && (
              <div style={{
                background:"rgba(0,80,80,0.2)", border:"1px solid #004444",
                color:"#228888", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
              }}>◈ SIGNAL</div>
            )}

            {/* SPIKE — active consumable */}
            {hudSpikeReady && (
              <button onClick={useSpike} style={{
                background:"rgba(180,80,0,0.25)", border:"1px solid #bb4400",
                color:"#ff8800", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px", cursor:"pointer",
                boxShadow:"0 0 6px rgba(255,120,0,0.3)",
              }}>⚡ SPIKE</button>
            )}

            {/* SURGE — active consumable */}
            {hudSurgeReady && (
              <button onClick={useSurge} style={{
                background:"rgba(180,80,0,0.25)", border:"1px solid #bb4400",
                color:"#ff8833", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px", cursor:"pointer",
                boxShadow:"0 0 6px rgba(255,100,0,0.25)",
              }}>⚡ SURGE</button>
            )}
            {hudSurgeActive && (
              <div style={{
                background:"rgba(200,80,0,0.4)", border:"1px solid #ff6600",
                color:"#ffaa44", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
                animation:"spoof-pulse 0.3s infinite alternate",
              }}>⚡ SURGING</div>
            )}

            {/* PULSE — active consumable */}
            {hudPulseReady && (
              <button onClick={usePulse} style={{
                background:"rgba(0,120,120,0.25)", border:"1px solid #007777",
                color:"#33cccc", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px", cursor:"pointer",
                boxShadow:"0 0 6px rgba(0,180,180,0.25)",
              }}>◎ PULSE</button>
            )}
            {hudPulseActive && (
              <div style={{
                background:"rgba(0,140,140,0.4)", border:"1px solid #00aaaa",
                color:"#44eeee", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
                animation:"spoof-pulse 0.4s infinite alternate",
              }}>◎ SCANNING</div>
            )}

            {/* FIREWALL — passive charges */}
            {(programs || []).includes("firewall") && hudFirewallCharges > 0 && (
              <div style={{
                background:"rgba(120,80,0,0.2)", border:"1px solid #664400",
                color:"#aa7722", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
              }}>▣ WALL ×{hudFirewallCharges}</div>
            )}
            {(programs || []).includes("firewall") && hudFirewallCharges === 0 && (
              <div style={{
                background:"transparent", border:"1px solid #221100",
                color:"#331100", fontFamily:"inherit",
                fontSize:"11px", letterSpacing:"1px", padding:"3px 8px",
              }}>▣ WALL</div>
            )}

          </div>
        </div>

        <style>{`
          @keyframes spoof-pulse { from { opacity:0.7; } to { opacity:1; } }
        `}</style>
      </div>

      {/* ── TRACE BAR ── */}
      <div style={{
        position:"absolute", bottom:"52px", left:0, right:0,
        padding:"6px 14px", zIndex:10,
        background:"rgba(0,0,0,0.7)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ fontSize:"13px", letterSpacing:"3px", color: traceColor, width:"56px", fontWeight:"bold" }}>
            TRACE
          </div>
          <div style={{ flex:1, height:"10px", background:"#050f05", border:`1px solid #0a2a0a`, borderRadius:"2px", position:"relative", overflow:"hidden" }}>
            <div style={{
              position:"absolute", left:0, top:0, bottom:0,
              width:`${hudTrace}%`,
              background: `linear-gradient(90deg, ${traceColor}aa, ${traceColor})`,
              boxShadow:`0 0 10px ${traceGlow}`,
              transition:"width 0.12s linear, background 0.3s",
              borderRadius:"2px",
            }} />
          </div>
          <div style={{ fontSize:"15px", fontWeight:"bold", color:traceColor, width:"44px", textAlign:"right" }}>
            {hudTrace}%
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:10,
        background:"rgba(0,0,0,0.88)", borderTop:"1px solid #0a1a0a",
        padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#2a5a2a" }}>{hdata.name}</div>
          {HACK_DEV_MODE && <button onClick={() => setDevOpen(v => !v)} style={{
            background:"rgba(0,40,80,0.4)", border:"1px solid #003366",
            color:"#0066aa", fontFamily:"inherit", fontSize:"9px",
            letterSpacing:"2px", padding:"3px 8px", cursor:"pointer",
          }}>
            {devOpen ? "✕ DEV" : "⚙ DEV"}
          </button>}
        </div>
        <button onClick={unjack} style={{
          background:"rgba(80,0,0,0.3)", border:"1px solid #660000",
          color:"#cc2200", fontFamily:"inherit",
          fontSize:"14px", letterSpacing:"3px", padding:"10px 22px", cursor:"pointer", minHeight:"44px",
        }}
          onMouseEnter={e=>{e.target.style.background="rgba(150,0,0,0.4)";e.target.style.color="#ff4400";}}
          onMouseLeave={e=>{e.target.style.background="rgba(80,0,0,0.3)";e.target.style.color="#cc2200";}}>
          UNJACK
        </button>
      </div>

      {/* ── DEV TUNING PANEL ── */}
      {HACK_DEV_MODE && devOpen && (
        <div style={{
          position:"absolute", bottom:"52px", left:0, right:0, zIndex:20,
          background:"rgba(0,8,20,0.97)", borderTop:"1px solid #003366",
          borderBottom:"1px solid #003366", padding:"12px 14px",
          display:"flex", flexDirection:"column", gap:"10px",
          maxHeight:"60vh", overflowY:"auto",
        }}>
          <div style={{ fontSize:"9px", letterSpacing:"4px", color:"#0066aa", marginBottom:"2px" }}>
            DEV TUNING — {difficulty.toUpperCase()} / {archetype.toUpperCase()} — changes apply live
          </div>

          {[
            { key:"traceSpeed",   label:"TRACE SPEED (×2.5 in game)", min:0.05, max:3.0, step:0.05, unit:"%/s" },
            { key:"targetChance", label:"TARGET CHANCE",  min:0.05, max:0.8,  step:0.01, unit:"%" },
            { key:"wordInterval", label:"WORD INTERVAL",  min:200,  max:4000, step:50,   unit:"ms" },
            { key:"lingerMs",     label:"LINGER TIME",    min:400,  max:6000, step:100,  unit:"ms" },
            { key:"maxWords",     label:"MAX WORDS",      min:2,    max:20,   step:1,    unit:"" },
            { key:"burstCount",   label:"BURST COUNT",    min:1,    max:10,   step:1,    unit:"" },
            { key:"virusSeed",    label:"VIRUS STARTS AT",min:5,    max:80,   step:1,    unit:"%" },
            { key:"counterAt",    label:"COUNTER STARTS", min:10,   max:95,   step:1,    unit:"%" },
          ].map(({ key, label, min, max, step, unit }) => (
            <div key={key} style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                <span style={{ fontSize:"9px", letterSpacing:"2px", color:"#005599" }}>{label}</span>
                <span style={{ fontSize:"11px", fontWeight:"bold", color:"#00aaff" }}>
                  {typeof devTuning[key] === "number" && devTuning[key] % 1 !== 0
                    ? devTuning[key].toFixed(2)
                    : devTuning[key]}{unit}
                </span>
              </div>
              <input
                type="range" min={min} max={max} step={step}
                value={devTuning[key]}
                onChange={e => setDevTuning(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value),
                }))}
                style={{ width:"100%", accentColor:"#0088cc", cursor:"pointer" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"8px", color:"#003355" }}>
                <span>{min}{unit}</span><span>{max}{unit}</span>
              </div>
            </div>
          ))}

          {/* Current values dump — copy to tell Viktor */}
          <div style={{
            marginTop:"4px", padding:"8px", background:"rgba(0,20,40,0.8)",
            border:"1px solid #002244", fontSize:"8px", color:"#004488",
            letterSpacing:"1px", lineHeight:"1.8", wordBreak:"break-all",
          }}>
            <div style={{ color:"#0066aa", marginBottom:"4px" }}>COPY THESE VALUES:</div>
            {Object.entries(devTuning).map(([k,v]) => (
              <div key={k}>{k}: {typeof v === "number" && v % 1 !== 0 ? v.toFixed(2) : v}</div>
            ))}
          </div>

          <button
            onClick={() => setDevTuning({
              traceSpeed: diff.traceSpeed * bioNeuralMod, targetChance: diff.targetChance,
              wordInterval: diff.wordInterval, lingerMs: diff.lingerMs + (arch.lingerBonus || 0),
              maxWords: diff.maxWords,
              burstCount: 5,
              virusSeed: diff.virusSeed, counterAt: diff.counterAt,
            })}
            style={{
              background:"transparent", border:"1px solid #003355",
              color:"#004477", fontFamily:"inherit", fontSize:"9px",
              letterSpacing:"2px", padding:"5px", cursor:"pointer",
            }}>
            RESET TO DEFAULTS
          </button>
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// ─── RESULT ───────────────────────────────────────────────────────────────────

