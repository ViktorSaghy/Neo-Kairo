// ============================================================
// ACHIEVEMENTS, FACTIONS, WORLD DATA
// ============================================================

export const ARCHETYPE_EXPLORE_ABILITIES = {
  ghost: {
    label: 'GHOST STEP',
    desc: 'Slip through checkpoints undetected. -50% encounter rate.',
    encounterMod: 0.5,
    terminalBonus: 0,
    credBonus: 0,
  },
  soldier: {
    label: 'FORCE ENTRY',
    desc: 'Break open locked stashes. +40% loot value.',
    encounterMod: 1.0,
    lootBonus: 0.4,
    stashExtra: true,
  },
  netrunner: {
    label: 'DEEP SCAN',
    desc: 'Extract extra data from terminals. Terminals give credits + intel.',
    terminalCredits: 80,
    terminalHackBonus: 15,
    encounterMod: 1.0,
  },
  fixer: {
    label: 'STREET CREDIT',
    desc: 'Haggle prices using Charisma (scales with level). +30% faction rep from all quest actions. Better quest payouts.',
    shopDiscountFormula: 'charisma-scaled',  // handled in shop render
    questBonus: 150,
    repMod: 1.3,
    encounterMod: 1.0,
  },
};


export const WORLD_ENEMIES = {
  "Sump Rat":           { hp:20,  maxHp:20,  damage:[3,8],   defense:2,  xp:15,  credits:[5,20],   type:"beast",   behaviour:"aggressive", inflicts:"bleeding", inflictChance:0.2  },
  "Tunnel Gang":        { hp:45,  maxHp:45,  damage:[8,16],  defense:5,  xp:35,  credits:[20,60],  type:"human",   behaviour:"aggressive", inflicts:"bleeding", inflictChance:0.3  },
  "Feral Drone":        { hp:35,  maxHp:35,  damage:[12,20], defense:8,  xp:40,  credits:[10,30],  type:"machine", behaviour:"tactical",   inflicts:"burning",  inflictChance:0.25 },
  "Corp Security":      { hp:60,  maxHp:60,  damage:[14,22], defense:12, xp:55,  credits:[40,100], type:"human",   behaviour:"tactical",   inflicts:"stunned",  inflictChance:0.2  },
  "Gang Enforcer":      { hp:75,  maxHp:75,  damage:[18,28], defense:8,  xp:65,  credits:[50,120], type:"human",   behaviour:"aggressive", inflicts:"bleeding", inflictChance:0.35 },
  "Rogue Synth":        { hp:80,  maxHp:80,  damage:[20,32], defense:15, xp:80,  credits:[30,80],  type:"machine", behaviour:"tactical",   inflicts:"hacked",   inflictChance:0.3  },
  "Axiom Guard":        { hp:100, maxHp:100, damage:[22,35], defense:18, xp:100, credits:[80,200], type:"human",   behaviour:"defensive",  inflicts:"stunned",  inflictChance:0.25 },
  "Hunter Drone":       { hp:90,  maxHp:90,  damage:[25,40], defense:20, xp:110, credits:[60,150], type:"machine", behaviour:"tactical",   inflicts:"burning",  inflictChance:0.3  },
  "Corporate Assassin": { hp:120, maxHp:120, damage:[30,50], defense:22, xp:150, credits:[120,300],type:"human",   behaviour:"tactical",   inflicts:"bleeding", inflictChance:0.4  },
  "Bounty Hunter":      { hp:130, maxHp:130, damage:[28,45], defense:20, xp:180, credits:[150,350],type:"human",   behaviour:"tactical",   inflicts:"stunned",  inflictChance:0.35 },
  "ICE Construct":      { hp:60,  maxHp:60,  damage:[20,38], defense:25, xp:120, credits:[50,100], type:"program", behaviour:"defensive",  inflicts:"hacked",   inflictChance:0.4  },
  "Black ICE":          { hp:150, maxHp:150, damage:[40,65], defense:30, xp:250, credits:[150,400],type:"program", behaviour:"aggressive", inflicts:"corroded", inflictChance:0.35 },
  "Daemon":             { hp:200, maxHp:200, damage:[50,80], defense:35, xp:400, credits:[200,600],type:"program", behaviour:"tactical",   inflicts:"hacked",   inflictChance:0.5  },
};

export const WORLD_AUGMENTS = [
  { id:"optic_zoom",      name:"Optic Zoom x3",       slot:"eyes",     bonus:{accuracy:15},              cost:1200,  humanity:1, gate:null,       gateLabel:null },
  { id:"subdermal_armor", name:"Subdermal Plating",    slot:"skin",     bonus:{defense:20},               cost:2800, humanity:2, gate:null,       gateLabel:null },
  { id:"muscle_weave",    name:"Muscle Weave",         slot:"skin",     bonus:{strength:10,defense:8},    cost:2200,  humanity:2, gate:null,       gateLabel:null },
  { id:"reflex_boost",    name:"Reflex Booster",       slot:"nerves",   bonus:{speed:20},                 cost:2200,  humanity:1, gate:null,       gateLabel:null },
  { id:"neural_hack",     name:"Hack Node v2",         slot:"brain",    bonus:{hacking:25},               cost:3000, humanity:2, gate:null,       gateLabel:null },
  { id:"bone_lace",       name:"Titanium Bone Lace",   slot:"skeleton", bonus:{strength:15,defense:10},   cost:4500, humanity:3, gate:null,       gateLabel:null },
  { id:"lung_filter",     name:"BioFilter Lungs",      slot:"lungs",    bonus:{maxHp:30},                 cost:1100,  humanity:1, gate:null,       gateLabel:null },
  { id:"adrenal_spike",   name:"Adrenal Spike",        slot:"blood",    bonus:{strength:20,speed:10},     cost:3000, humanity:3, gate:null,       gateLabel:null },
  { id:"nano_weave",      name:"Nano-Repair Weave",    slot:"blood",    bonus:{},                         cost:3500, humanity:2, gate:null,       gateLabel:null,
    specialDesc:'Nanobots repair 2 HP per round in combat, and 2 HP per move out of combat. Conflicts with Adrenal Spike.' },
  { id:"pain_editor",     name:"Pain Editor",          slot:"cortex",   bonus:{defense:15,maxHp:20},      cost:5500, humanity:4, gate:null,       gateLabel:null },
  { id:"sync_blocker",    name:"Sync Blocker Mesh",    slot:"cortex",   bonus:{hacking:10,speed:5},       cost:3000, humanity:2, gate:null,       gateLabel:null },
  // ── BIOWARE CATALOGUE — Medica Allied gate (rep ≥60) ──
  // GDD IDs. Grown, not machined. Lower humanity cost, organic integration.
  // Gate-scoped conflict check: bioware slots don't block chrome of same body area.
  { id:"neuro_mesh",        name:"Neuro-Adaptive Mesh",      slot:"bio_brain",  bonus:{hacking:20,speed:8},       cost:5500, humanity:1, gate:'medica_allied', gateLabel:'MEDICA ALLIED', ripperType:'medica',
    specialDesc:'No slot conflict with Hack Node v2. Hack trace accumulates 10% slower.' },
  { id:"cultured_muscle",   name:"Cultured Muscle Graft",    slot:"cultured_muscle",   bonus:{strength:18,defense:6},    cost:4500, humanity:1, gate:'medica_allied', gateLabel:'MEDICA ALLIED', ripperType:'medica',
    specialDesc:'No slot conflict with Subdermal Plating or Muscle Weave. Reduces bleed DoT 50%.' },
  { id:"bio_optics",        name:"Bio-Optical Enhancement",  slot:"bio_eyes",   bonus:{accuracy:20,speed:5},      cost:5000, humanity:1, gate:'medica_allied', gateLabel:'MEDICA ALLIED', ripperType:'medica',
    specialDesc:'No slot conflict with Optic Zoom. First attack each combat: +10% damage.' },
  { id:"synthetic_adrenal", name:"Synthetic Adrenal System", slot:"bio_blood",  bonus:{strength:15,speed:15},     cost:6000, humanity:2, gate:'medica_allied', gateLabel:'MEDICA ALLIED', ripperType:'medica',
    specialDesc:'No slot conflict with Adrenal Spike. Combat start: +15% damage for 2 rounds.' },
  { id:"neural_buffer",     name:"Neural Buffer Tissue",     slot:"bio_cortex", bonus:{maxHp:40,defense:12},      cost:6500, humanity:1, gate:'medica_allied', gateLabel:'MEDICA ALLIED', ripperType:'medica',
    specialDesc:'No slot conflict with Pain Editor or Sync Blocker. Reduces corrode/stun duration by 1 round.' },
  // ── MILITARY CYBERWARE CATALOGUE — Axiom Allied gate (rep ≥60) ──
  // GDD IDs. Visibly inhuman. Meridian reacts. High humanity cost.
  { id:"combat_frame",      name:"Combat Chassis Frame",     slot:"skeleton",   bonus:{strength:25,defense:20},   cost:8000, humanity:4, gate:'axiom_allied', gateLabel:'AXIOM ALLIED', ripperType:'axiom',
    specialDesc:'Replaces Titanium Bone Lace slot. Melee +20% damage. Stun immunity.' },
  { id:"targeting_web",     name:"Targeting Wetware Web",    slot:"eyes",       bonus:{accuracy:30,hacking:10},   cost:7500, humanity:3, gate:'axiom_allied', gateLabel:'AXIOM ALLIED', ripperType:'axiom',
    specialDesc:'Replaces Optic Zoom. First attack: guaranteed max damage roll.' },
  { id:"pain_suppressor",   name:"Pain Suppressor Array",    slot:"cortex",     bonus:{maxHp:50,defense:25},      cost:9000, humanity:4, gate:'axiom_allied', gateLabel:'AXIOM ALLIED', ripperType:'axiom',
    specialDesc:'Replaces Pain Editor/Sync Blocker slot. Eliminates bleed and burn status.' },
  { id:"reflex_override",   name:"Reflex Override System",   slot:"nerves",     bonus:{speed:30,accuracy:15},     cost:7000, humanity:4, gate:'axiom_allied', gateLabel:'AXIOM ALLIED', ripperType:'axiom',
    specialDesc:'Replaces Reflex Booster. Flee chance floor 50%. Enemy first-strike negated once per combat.' },
  { id:"axiom_killswitch",  name:"Axiom Kill Protocol",      slot:"brain",      bonus:{strength:20,hacking:15},   cost:12000, humanity:5, gate:'axiom_allied', gateLabel:'AXIOM ALLIED', ripperType:'axiom',
    specialDesc:'Unlocks Sync Spike quickhack at any hack stat. Static Pulse: 80% success. Replaces Hack Node slot.' },
  // ── AXIOM LEGEND EXCLUSIVE ──
  { id:"cortex_relay",     name:"Cortex Relay",             slot:"cortex",     bonus:{hacking:15,charisma:5},    cost:7500, humanity:3, gate:'axiom_legend',  gateLabel:'AXIOM LEGEND', ripperType:'axiom',
    specialDesc:'Terminal credit rewards +15%. Requires Axiom LEGEND standing (rep 90+). Conflicts with Pain Editor and Sync Blocker.' },
];

export const WORLD_FACTIONS = {
  axiom:    {
    name:"AXIOM CORP",
    color:"#00e5ff",
    desc:"The dominant corporate power. Operates CortexSync, controls Spire zones, and owns the firmware pipeline. Most people work for Axiom or work around them.",
    ethos:"Axiom's position: the Sync elevates human capability. The preference updates are optimisation, not control. Efficiency is a form of care.",
    chooseReason:"Best faction for runners who operate in corporate zones. Allied status unlocks military cyberware, Spire access, and eliminates the most dangerous encounter type in the game. The price is moral compromise — not mechanical disadvantage.",
    tradoffs:"Ironhand and Ghosts will distrust you. Meridian cells become hostile. You gain the most access to the Spire but lose the Undernet's protection.",
  },
  ghosts:   {
    name:"GHOST NETWORK",
    color:"#69ff47",
    desc:"Decentralised information network. No single leader, no HQ, no central ideology beyond: information wants to be free and Axiom is the lock on the cage.",
    ethos:"The Ghosts believe the firmware pipeline is the most dangerous weapon in Neo-Kairo — not because of what it does today, but because of what it enables tomorrow. They collect, archive, and leak.",
    chooseReason:"Best faction for Netrunners and information-first runners. Allied status reduces terminal hack difficulty, removes encounter pressure in ruins and tunnels, and opens black market job networks. Low-violence, high-leverage.",
    tradeoffs:"Axiom corporate zones become more dangerous. Ironhand treat Ghost-aligned runners with suspicion. Ghosts won't ask you to fight — but they will ask you to carry weight.",
  },
  ironhand: {
    name:"IRONHAND GANG",
    color:"#ff5722",
    desc:"Street-level power bloc, mostly unsynced. Lost factory contracts to Sync-optimised workers eight years ago. Have been building something since. Not just a gang — a labour movement with violent tendencies.",
    ethos:"Ironhand's position: the Sync is an economic weapon. Axiom broke the city's working class with a firmware update and called it progress. The gang is what happened to the people left behind.",
    chooseReason:"Best faction for Soldiers and melee-first runners. Allied status removes encounters in gang turf, industrial, and residential zones — the densest encounter areas in mid-game. Black market prices drop significantly. Ironhand muscle covers your back.",
    tradeoffs:"Axiom zones become openly hostile. Corporate NPC quests become unavailable. You are visibly on the street side of the divide — that closes some doors and opens others.",
  },
  medica:   {
    name:"MEDICA CARTEL",
    color:"#ff4081",
    desc:"Black-market medical network. Runs unlicensed clinics, performs CortexSync extractions Axiom says are impossible, and distributes bioware that never passed corporate approval. Their survival rate is better than licensed medicine.",
    ethos:"Medica's position: medicine should not be conditional on compliance. The cartel charges what people can pay and asks nothing about why you need what you need.",
    chooseReason:"Best faction for any runner who takes sustained damage or plans to stack augments. Allied Medica converts rest spots into full-restore clinics, halves trauma kit costs, and unlocks bioware unavailable elsewhere. Passive sustain that scales into late game.",
    tradeoffs:"No combat assistance. No encounter reduction. Medica doesn't fight for you — they keep you alive so you can fight for yourself. Weakest aggressive positioning, strongest defensive value.",
  },
  meridian: {
    name:"MERIDIAN",
    color:"#c084fc",
    desc:"A loose coordination network for people who ended up between factions — burned by Axiom, too independent for Ironhand, too visible for Ghosts. Runs safe corridors, manages safehouses, protects civilians.",
    ethos:"Meridian's position: survival isn't the same as winning, but it's the foundation of everything else. They hold the spaces between the factions together so people have somewhere to go.",
    chooseReason:"Best faction for runners who use safehouses heavily or want encounter immunity in the safest zones. Allied Meridian makes safehouse chunks completely encounter-free, reduces hack trace speed, and provides healing support. Unique in offering a pre-hack intelligence bonus.",
    tradeoffs:"Meridian has no aggressive leverage. They won't attack enemies on your behalf. Choosing Meridian means investing in defence and movement — not power. But the corridors they hold keep you running when everyone else is hunting you.",
  },
};

// ── FACTION TIER SYSTEM ──
// Thresholds: ±25 Friendly/Unfriendly, ±60 Allied/Hostile, ±90 Legend/Enemy
// Effects are domain-contained — no faction's penalty bleeds into the whole game.

export const FACTION_TIERS = [
  { min: -Infinity, max: -90, id: 'enemy',       label: 'ENEMY',       color: '#ff2222' },
  { min: -90,       max: -60, id: 'hostile',      label: 'HOSTILE',     color: '#ff4444' },
  { min: -60,       max: -25, id: 'unfriendly',   label: 'Unfriendly',  color: '#ff9800' },
  { min: -25,       max:  25, id: 'neutral',      label: 'Neutral',     color: '#888899' },
  { min:  25,       max:  60, id: 'friendly',     label: 'Friendly',    color: '#69ff47' },
  { min:  60,       max:  90, id: 'allied',       label: 'ALLIED',      color: '#00e5ff' },
  { min:  90,       max:  Infinity, id: 'legend', label: 'LEGEND',      color: '#ffd700' },
];


export function getFactionTier(rep) {
  return FACTION_TIERS.find(t => rep >= t.min && rep < t.max) || FACTION_TIERS[3];
}


export function getNextTierThreshold(rep) {
  const tier = getFactionTier(rep);
  const idx = FACTION_TIERS.indexOf(tier);
  const nextUp = FACTION_TIERS[idx + 1];
  const nextDown = FACTION_TIERS[idx - 1];
  return { nextUp, nextDown, tier };
}

// Per-faction effects at each tier. Domain-contained — no cross-faction bleed.

export const FACTION_EFFECTS = {
  axiom: {
    enemy:       { label: 'ENEMY',       effects: ['Axiom Guards attack on sight — even safehouse zones near Axiom territory', 'Bounty hunters spawn +3% more frequently', 'Axiom shops refuse service'] },
    hostile:     { label: 'HOSTILE',     effects: ['Corp Security +20% encounter rate in Spire/corporate chunks', 'Axiom shops: +25% price markup'] },
    unfriendly:  { label: 'Unfriendly',  effects: ['Corp Security occasionally hostile on sight', 'Axiom terminal hacks: +10% trace speed'] },
    neutral:     { label: 'Neutral',     effects: [] },
    friendly:    { label: 'Friendly',    effects: ['Axiom contractors: -15% encounter chance in corporate zones', 'Axiom shops: -10% prices'] },
    allied:      { label: 'ALLIED',      effects: ['Axiom Guard escort available (skip encounters in Spire zones)', 'Axiom shops: -20% prices', 'Military cyberware catalogue unlocked at Axiom-aligned Ripper Docs'] },
    legend:      { label: 'LEGEND',      effects: ['All Axiom-zone encounters blocked', 'Military cyberware at cost', 'Axiom terminal hacks auto-succeed on danger ≤2'] },
  },
  ghosts: {
    enemy:       { label: 'ENEMY',       effects: ['Ghost Network cuts intel flow — terminals yield 50% fewer credits', 'Ghost NPCs refuse all dialogue'] },
    hostile:     { label: 'HOSTILE',     effects: ['Ghost Network withholds job tips', 'Terminal intel fragments degraded'] },
    unfriendly:  { label: 'Unfriendly',  effects: ['Ghosts charge information fees at NPCs'] },
    neutral:     { label: 'Neutral',     effects: [] },
    friendly:    { label: 'Friendly',    effects: ['Ghost NPCs pass free intel (+1 lore fragment per terminal)', 'Black market job rewards +10%'] },
    allied:      { label: 'ALLIED',      effects: ['Ghost Network routes: -25% encounter rate in ruins and tunnel zones', 'Terminal hack difficulty reduced by one tier', 'Heist requirement met'] },
    legend:      { label: 'LEGEND',      effects: ['Full Ghost escort (skip all encounters in Undernet)', 'Terminal hacks in ruins/tunnel: free flat reward', 'Ghost safe passages open in Spire zones'] },
  },
  ironhand: {
    enemy:       { label: 'ENEMY',       effects: ['Ironhand enforcers spawn as enemies in gang/residential chunks', 'Black market prices +30%'] },
    hostile:     { label: 'HOSTILE',     effects: ['Ironhand NPCs hostile — no quests available', 'Gang turf: +1 encounter danger rating'] },
    unfriendly:  { label: 'Unfriendly',  effects: ['Ironhand vendors charge 15% more', 'Gang turf jobs unavailable'] },
    neutral:     { label: 'Neutral',     effects: [] },
    friendly:    { label: 'Friendly',    effects: ['Gang turf: -20% encounter rate', 'Ironhand vendors: -10% prices', 'Job tip network active'] },
    allied:      { label: 'ALLIED',      effects: ['Ironhand safe passage: no encounters in gang_turf, industrial, residential', 'Black market prices -20%', 'Stash loot +30% value'] },
    legend:      { label: 'LEGEND',      effects: ['Ironhand muscle available (auto-win one encounter per zone)', 'All Ironhand-zone encounters blocked', 'Black market exclusive weapons unlocked'] },
  },
  medica: {
    enemy:       { label: 'ENEMY',       effects: ['Medica Ripper Docs refuse augment services', 'Medica-zone healing costs double', 'Bioware catalogue locked'] },
    hostile:     { label: 'HOSTILE',     effects: ['Medica vendors: +25% on healing items', 'Ripper Docs refuse bioware installation'] },
    unfriendly:  { label: 'Unfriendly',  effects: ['Healing item prices +10% in Medica-adjacent zones'] },
    neutral:     { label: 'Neutral',     effects: [] },
    friendly:    { label: 'Friendly',    effects: ['Medica vendors: -10% on healing items', 'Rest spots in Medica zones heal +20% extra'] },
    allied:      { label: 'ALLIED',      effects: ['Bioware catalogue unlocked at Medica-aligned Ripper Docs', 'Medica trauma kits: 50% discount', 'Rest spots in Medica zones restore full HP'] },
    legend:      { label: 'LEGEND',      effects: ['Free trauma kit per rest stop', 'All Medica zone healing free', 'Bioware at cost'] },
  },
  meridian: {
    enemy:       { label: 'ENEMY',       effects: ['Mara and Meridian cells will not assist — safehouse Meridian presence hostile', 'Meridian intel blocked'] },
    hostile:     { label: 'HOSTILE',     effects: ['Meridian contacts unavailable', 'Safehouse tips from Mara locked'] },
    unfriendly:  { label: 'Unfriendly',  effects: ['Mara gives minimal information only'] },
    neutral:     { label: 'Neutral',     effects: [] },
    friendly:    { label: 'Friendly',    effects: ['Mara shares zone threat assessments before movement', 'Safehouse rest cost -50% in Meridian-active zones'] },
    allied:      { label: 'ALLIED',      effects: ['Meridian field network: encounters in safehouse chunks impossible', 'Mara gives pre-hack intel (reduces trace speed by 15%)', 'Safe corridors revealed in Undernet'] },
    legend:      { label: 'LEGEND',      effects: ['Meridian full escort: one free unjack per hack session', 'Safehouse zones are truly safe — no encounters', 'Meridian healer available (full HP restore once per zone)'] },
  },
};

export const LEGACY_UNLOCKS = [
  { id:"ghost_start",   name:"Ghost Start",    desc:"+200 starting credits",       cost:3 },
  { id:"street_wisdom", name:"Street Wisdom",  desc:"Start with 1 extra MedStim", cost:2 },
  { id:"fast_hands",    name:"Fast Hands",      desc:"Start with Knife equipped",  cost:3 },
  { id:"corpo_contact", name:"Corpo Contact",   desc:"+20 Axiom rep on start",     cost:4 },
  { id:"ghost_network", name:"Ghost Network",   desc:"+20 Ghost rep on start",     cost:4 },
  { id:"iron_skin",     name:"Iron Skin",       desc:"+10 max HP on start",        cost:5 },
  { id:"hacker_brain",  name:"Hacker Brain",    desc:"+5 hacking on start",        cost:5 },
  { id:"void_key",      name:"Void Key",        desc:"Void access from level 1",   cost:8 },
];

export const HEIST_REQS = { credits:5000, level:8, gear:["neural_hack","ghost_suit"] };
// Resistance path: underground network support (Ghosts/Meridian/Ironhand ≥60) AND Axiom hostile (≤-25)

export const AXIOM_HEIST_REQS = { credits:3000, level:8, gear:["cortex_relay"] };
// Axiom path: Axiom Allied+ (≥80), Meridian hostile (≤-60), Cortex Relay augment installed

const rollDice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let SESSION_LEGACY = { points:0, unlocks:[], achievements:[], bestRun:null, totalRuns:0, wins:0 };
try { if (window._nkLegacy) SESSION_LEGACY = window._nkLegacy; } catch(e) {}

// ── ACHIEVEMENT CATALOG ──

export const ACHIEVEMENTS = [
  // ── MASTERY ──
  { id:'first_blood',     name:'Edgerunner',           pts:3, icon:'◈', color:'#ffd700', category:'MASTERY',
    desc:'Win a run.',
    flavor:'"The city has a word for what you are now. It\'s not a compliment. You\'re using it anyway."' },
  { id:'born_chrome',     name:'Prior Occupant',        pts:3, icon:'✦', color:'#00e5ff', category:'MASTERY',
    desc:'Win a run with 5 or more augments installed.',
    flavor:'"The ripper stopped asking after the third slot. The person who came in with all their original parts still technically exists somewhere in the paperwork."' },
  { id:'clean_hands',     name:'The Meat',              pts:5, icon:'○', color:'#69ff47', category:'MASTERY',
    desc:'Win a run with zero augments.',
    flavor:'"No chrome. No implants. No firmware. Just the body the city told you wasn\'t enough. The city was wrong."' },
  { id:'flatline_run',    name:'Running On Static',     pts:4, icon:'▼', color:'#ff4444', category:'MASTERY',
    desc:'Trigger the heist at 10 HP or less.',
    flavor:'"Single digit HP. Flatline adjacent. The city had you counted. You didn\'t check the count."' },
  { id:'survivor',        name:'Cleared',               pts:2, icon:'◆', color:'#ff9800', category:'MASTERY',
    desc:'Reach level 8 in any run.',
    flavor:'"Level eight. Credits. Gear. Rep. The city\'s checklist. You met every line."' },
  { id:'all_four',        name:'Format Shift',          pts:5, icon:'◉', color:'#e040fb', category:'MASTERY',
    desc:'Win a run with each of the four archetypes.',
    flavor:'"Ghost. Soldier. Netrunner. Fixer. The city thought it knew what you were. It never figured out you were all of them."' },
  // ── ARCHETYPE ──
  { id:'ghost_protocol',  name:'Delta',                 pts:2, icon:'◌', color:'#69ff47', category:'ARCHETYPE',
    desc:'Win as a Ghost.',
    flavor:'"They never logged your entry. They still don\'t have your exit. You were never there."' },
  { id:'iron_will',       name:'Wetware',               pts:2, icon:'▶', color:'#ff9800', category:'ARCHETYPE',
    desc:'Win as a Soldier.',
    flavor:'"Axiom Corp had a hundred ways to stop you. You had one. It worked."' },
  { id:'deep_net',        name:'Meat Optional',         pts:2, icon:'⌬', color:'#00e5ff', category:'ARCHETYPE',
    desc:'Win as a Netrunner.',
    flavor:'"HP:60. The lowest survivability in the city. You won anyway. The body was always beside the point."' },
  { id:'street_deal',     name:'The Artiste',           pts:2, icon:'¢', color:'#ffd700', category:'ARCHETYPE',
    desc:'Win as a Fixer.',
    flavor:'"Every faction thought they had you. You had all of them. Artiste of the slightly funny deal."' },
  // ── NARRATIVE ──
  { id:'humanity_intact', name:'Your Body, Your Call',  pts:3, icon:'♥', color:'#69ff47', category:'NARRATIVE',
    desc:'Win with humanity 8 or higher.',
    flavor:'"The firmware never got a foothold. Every modification was yours. Every choice was yours. That\'s the whole point."' },
  { id:'on_the_edge',     name:'The Body Was Meat',     pts:3, icon:'♦', color:'#ff4444', category:'NARRATIVE',
    desc:'Win with humanity 2 or lower.',
    flavor:'"By the end you were more machine than person by most clinical measures. The part that pulled it off — you\'re not sure which part that was."' },
  { id:'sync_war',        name:'No Entry',              pts:2, icon:'◈', color:'#00e5ff', category:'NARRATIVE',
    desc:'Win with the Sync Blocker Mesh augment installed.',
    flavor:'"The Sync logged every augment, every hack, every credit transaction in Neo-Kairo. It has no record of you. You\'d like to keep it that way."' },
  { id:'full_dossier',    name:'Square With Everyone',  pts:4, icon:'≡', color:'#ffd700', category:'NARRATIVE',
    desc:'Complete all four sidequests in a single run.',
    flavor:'"Rusty. Nadia. Doc Membrane. Kite. Everyone carrying something the city put on them. You showed up for all of it."' },
  { id:'personal',        name:'What You Came For',     pts:3, icon:'◈', color:'#e040fb', category:'NARRATIVE',
    desc:'Use the backstory-specific dialogue choice in your contact\'s sidequest.',
    flavor:'"At some point the job stopped being the reason. This was always the reason. You just finally said so."' },
  // ── EXPLORATION ──
  { id:'deep_city',       name:'All The Way Down',      pts:2, icon:'≡', color:'#ff9800', category:'EXPLORATION',
    desc:'Visit all four layers in a single run.',
    flavor:'"Street level. Undernet. Spire Base. The Void. Neo-Kairo from the ground up. You went to all of it."' },
  { id:'undernet',        name:'Hard Boiled',           pts:2, icon:'▼', color:'#555570', category:'EXPLORATION',
    desc:'Enter a danger-4 zone and survive the run.',
    flavor:'"The deep city wanted to keep you. You left anyway. That\'s what hard means."' },
  { id:'void_walker',     name:'Jacked In',             pts:3, icon:'◆', color:'#e040fb', category:'EXPLORATION',
    desc:'Reach layer 3 (the Void) in any run.',
    flavor:'"Not many go into the Void on purpose. Not many come back. You did both."' },
  // ── FAILURE ──
  { id:'bounty_claimed',  name:'Zeroed',                pts:1, icon:'⚠', color:'#ff4444', category:'FAILURE',
    desc:'Be killed by a Bounty Hunter.',
    flavor:'"Someone paid for it. Someone always pays for it. The city logged the transaction and moved on."' },
  // ── META ──
  { id:'ten_runs',        name:'Signal Persists',       pts:2, icon:'◉', color:'#555570', category:'META',
    desc:'Complete 10 runs — wins or deaths.',
    flavor:'"Ten runs. The city has killed you, or tried to, more times than you can count. You\'re still transmitting. Annoying, from Neo-Kairo\'s perspective."' },
];

// Which legacy unlocks require an achievement first

export const UNLOCK_GATES = {
  void_key:    'first_blood',   // must win once
  iron_skin:   'survivor',      // must reach LV8
  hacker_brain:'survivor',      // must reach LV8
};

// Evaluate which new achievements were earned at end of run

export function checkAchievements(char, isWin, killedBy) {
  const existing = new Set(SESSION_LEGACY.achievements || []);
  const newlyEarned = [];
  const check = (id, condition) => {
    if (!existing.has(id) && condition) newlyEarned.push(id);
  };

  // Mastery
  check('first_blood',    isWin);
  check('born_chrome',    isWin && (char.augments||[]).length >= 5);
  check('clean_hands',    isWin && (char.augments||[]).length === 0);
  check('flatline_run',   isWin && (char.hp || 0) <= 10);
  check('survivor',       (char.level || 1) >= 8);
  const wonArchetypes = new Set([...(SESSION_LEGACY.wonArchetypes||[]), ...(isWin ? [char.archetype] : [])]);
  check('all_four',       isWin && wonArchetypes.size >= 4);

  // Archetype wins
  check('ghost_protocol', isWin && char.archetype === 'ghost');
  check('iron_will',      isWin && char.archetype === 'soldier');
  check('deep_net',       isWin && char.archetype === 'netrunner');
  check('street_deal',    isWin && char.archetype === 'fixer');

  // Narrative
  check('humanity_intact',isWin && (char.humanity||10) >= 8);
  check('on_the_edge',    isWin && (char.humanity||10) <= 2);
  check('sync_war',       isWin && (char.augments||[]).includes('sync_blocker'));
  check('full_dossier',   isWin && (char.questsCompleted||[]).length >= 4);
  check('personal',       isWin && (char.usedBackstoryChoice || false));

  // Exploration
  check('deep_city',      (char.layersVisited||new Set()).size >= 4 || (char.layersVisitedArr||[]).length >= 4);
  check('undernet',       (char.reachedDanger4 || false));
  check('void_walker',    (char.reachedLayer3 || false));

  // Failure
  check('bounty_claimed', !isWin && killedBy === 'Bounty Hunter');

  // Meta
  check('ten_runs',       (SESSION_LEGACY.totalRuns + 1) >= 10);

  return { newlyEarned, wonArchetypes: Array.from(wonArchetypes) };
}

