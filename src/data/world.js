// ============================================================
// WORLD DATA — atmosphere, lore, ambient events, signs
// ============================================================

export const SIGN_MSGS={
  residential:['RENT DUE','CURFEW 22:00','SYNC INSTALLATION — AXIOM AUTHORISED CLINIC ↑','NO LOITERING','VACANCY: ASK INSIDE','FIRMWARE UPDATE REQUIRED — SEE BUILDING MANAGER','UNSYNCED RESIDENTS: SECONDARY ID REQUIRED','CORTEXSYNC COMPLIANCE NOTICE — BUILDING MANAGEMENT','THEY WERE SYNCED SIX MONTHS AGO [graffiti, half-removed]'],
  market:['OPEN ALL HOURS','BEST PRICES GUARANTEED','NO CREDITS NO ENTRY','SYNCED STAFF ON DUTY','UNSYNCED QUEUE →','CASH ONLY. NO LOGS.','AXIOM PRICE INDEX: COMPLIANT','WE DON\'T ASK WHERE IT CAME FROM'],
  gang_turf:['IRONHAND TERRITORY','TRESPASSERS DEALT WITH','OUR TURF. KEEP WALKING.','NO AXIOM FIRMWARE HERE','STAY HUMAN','THE SKILL TRANSFER — 2063 — WE REMEMBER','UNSYNCED AND PROUD OF IT [spray paint]','BUILDERS NETWORK — KNOCK TWICE','NO CORPO CONTRACTORS. NOT NEGOTIABLE.'],
  industrial:['AXIOM CORP PROPERTY','SYNC MANDATORY ABOVE GRADE 3','HAZARD ZONE','MAINTENANCE DRONES ACTIVE','TRANSITIONAL POSITIONS — ENQUIRE WITHIN','PRODUCTIVITY REVIEW: SYNC INTEGRATION REQUIRED','THIRD SHIFT CANCELLED — OPERATIONAL RESTRUCTURE','IRONHAND MUTUAL AID — LEVEL 2 — BRING NOTHING YOU CAN\'T CARRY'],
  ruins:['CONDEMNED','DANGER: STRUCTURAL FAILURE','DO NOT ENTER','HUMANIST MEETING — TUESDAYS — LOWER LEVEL','STAY OUT','THE CITY THAT WENT UNDER IN \'57 IS STILL DOWN HERE','LAST GARDENER TERRITORY — UNVERIFIED [faded]','SYNC SIGNAL: NONE. THIS IS NOT AN ACCIDENT.'],
  safehouse:['KNOCK TWICE','FRIENDS ONLY','LEAVE WEAPONS AT DOOR','NO SYNC PINGS BEYOND THIS POINT','MERIDIAN — EVERYONE WELCOME — NO QUESTIONS','WHAT YOU TELL US STAYS HERE','FOOD AVAILABLE. NO CHARGE.'],
  black_market:['NOTHING TO SEE HERE','EYES FORWARD','CASH ONLY. NO NAMES.','EXTRACTION SERVICES — ASK QUIETLY','NO AXIOM FIRMWARE CLAUSE — ENQUIRE','WE DON\'T LOG. WE DON\'T STORE. WE DON\'T KNOW YOU.','GHOST NETWORK AFFILIATED — TERMS APPLY'],
  corporate:['AXIOM CORP — AUTHORISED PERSONNEL ONLY','CORTEXSYNC MANDATORY ABOVE THIS FLOOR','CLEARANCE LEVEL 3 REQUIRED','FIRMWARE UPDATE IN PROGRESS','BASELINE HUMANS — ESCORT REQUIRED ABOVE L3','PRODUCTIVITY METRICS: LIVE OVERLAY','SYNC COMPLIANCE: 97.3% THIS QUARTER'],
  tunnel:['UNDERNET ACCESS','WATCH YOUR STEP','NO LIGHT BEYOND THIS POINT','SYNC DEAD ZONE — YOU ARE OFF THE GRID','UPDATE SCHEDULE: SUSPENDED','IRONHAND RUNS THIS ROUTE — RESPECT IT OR DON\'T COME BACK','GHOST NETWORK WAYPOINT [scratched symbol]'],
  sump:['SUMP LEVEL 4','TOXIN WARNING','PIPE MARKET BELOW','AXIOM SIGNAL WEAK — UPDATES DELAYED','MEDICA OUTPOST — 200M — BRING CREDITS','WHAT AXIOM DOESN\'T KNOW ABOUT KEEPS YOU SAFER','THE CITY STARTED HERE. IT\'S STILL HERE.'],
  checkpoint:['CHECKPOINT ALPHA','STOP','IDENTIFICATION REQUIRED','SYNC STATUS VERIFICATION MANDATORY','UNSYNCED — SECONDARY SCREENING','FIRMWARE COMPLIANCE CHECK IN PROGRESS','ALL UNITS FLAGGED FOR UPDATE BATCH 7-D'],
  lobby:['AXIOM TOWER','VISITOR BADGES REQUIRED','SECURITY LEVEL AMBER','CORTEXSYNC VERIFICATION ON ENTRY','BASELINE HUMANS — ESCORT REQUIRED ABOVE L3','YOUR PRODUCTIVITY DATA IS BEING MONITORED FOR YOUR BENEFIT','SYNC INTEGRATION: THE COMPETITIVE ADVANTAGE YOU DESERVE'],
};

export const ENEMY_ENTRANCE = {
  "Sump Rat":           ["Something wet moves in the pipes above you.", "You hear it before you see it — claws on concrete.", "The rat is the size of a child. It's been down here a long time."],
  "Tunnel Gang":        ["Three of them. They spread out without a word — they've done this before.", "Gang colours you don't recognise. New territory, or new name for the same problem.", "Someone whistles. The echo tells you they're blocking both ends."],
  "Feral Drone":        ["Navigation corrupted. Kill protocol still running.", "The serial number's been filed off. Someone sent it down here and forgot about it.", "It doesn't hover. It glides. Like it's been waiting."],
  "Corp Security":      ["Axiom badge. Sync overlay running — they processed your threat level before they looked at you.", "Standard sweep formation. Synced professionals. They're already three moves ahead in the tactical model.", "The one in front has a trauma kit and a live overlay. They flagged you before you rounded the corner."],
  "Gang Enforcer":      ["Big. Deliberate. The kind of fighter who lets you take the first swing so they know how scared you are.", "Ironhand ink on the neck. Unsynced. They're not here for money.", "Enforcer. Not a soldier — someone who enjoys the work. No overlay, just experience."],
  "Rogue Synth":        ["It stopped responding to Axiom commands six months ago. It found its own update protocol.", "The eyes are still corpo blue. The rest of it has been modified by something that isn't the manufacturer.", "It moves wrong. Not broken — different. Like it's running firmware nobody wrote."],
  "Axiom Guard":        ["Full kit. Sync tactical feed live. Division Seven. They already have your profile.", "Division Seven patch. Their overlay flagged you as priority before you entered the block.", "Axiom's best, running full Sync integration. They're not reading the room — they modelled it before you arrived."],
  "Hunter Drone":       ["Military grade. Someone paid for this specifically.", "It locked on before you heard it. Fast.", "Axiom Counter-Insurgency model. They don't send these for small problems."],
  "Corporate Assassin": ["No badge. No ID. That's the point.", "They were already in position. You walked into this.", "Clean hands, expensive tools, someone else's mandate. That's the profile."],
  "Bounty Hunter":      ["Someone paid enough for a professional.", "They know your route. They know your face. Someone sold you.", "Not Axiom. Freelance. That means whoever hired them wanted deniability."],
  "ICE Construct":      ["The system knows you're here.", "ICE. Intrusion Countermeasure. Active, not passive. It came to you.", "Digital architecture made violent. This is what the Void defends itself with."],
  "Black ICE":          ["The screen goes dark. Then the ICE constructs itself out of the darkness.", "Lethal-grade. Whoever built this node didn't want visitors to leave.", "Black ICE. The kind that doesn't just log you — it ends you."],
  "Daemon":             ["The Void goes quiet. Then something in it turns toward you.", "It has no face. It doesn't need one. It has your biometrics.", "Daemon. Autonomous. Old. It's been running in here since before the city existed above it."],
};

export const getEnemyEntrance = (name) => {
  const pool = ENEMY_ENTRANCE[name];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const ENEMY_DEATH = {
  "Sump Rat":           ["It stops moving. The tunnel goes quiet again.", "Dead. You feel nothing about it, which tells you something about this place.", "Small. Everything down here is trying to survive. It just wasn't fast enough."],
  "Tunnel Gang":        ["Down. The others aren't coming — they don't know, or they don't care.", "You leave them. Someone will find them or they won't. That's how it goes here.", "Done. You check for a pulse out of habit. There isn't one."],
  "Feral Drone":        ["The rotors spin down. The silence after is louder.", "You watch the optics go dark. It never knew what it was doing. That's not comfort.", "System failure. It took longer than it should have."],
  "Corp Security":      ["Axiom will file a report. Someone will note the location. You have time.", "Professional to the end. You respect that, abstractly.", "They had a handler somewhere. The handler just got notified."],
  "Gang Enforcer":      ["Harder than expected. You feel that one.", "Big enough that even down is loud.", "Ironhand doesn't forget its enforcers. Someone will want to know what happened."],
  "Rogue Synth":        ["The chassis shuts down mid-movement. Whatever it found for itself — it's gone now.", "You watch it fall and wonder what it wanted. Then you stop wondering.", "Decommissioned. That's probably the wrong word."],
  "Axiom Guard":        ["Division Seven. Someone's going to notice this one missing.", "Clean kill. They won't call it that in the report.", "You don't feel good about it. You do it anyway. That's the work."],
  "Hunter Drone":       ["Override successful. The drone folds in on itself.", "That cost someone a lot of money. Good.", "Silent on the ground. The next one will come knowing what happened to this one."],
  "Corporate Assassin": ["They had a kill-switch implant. It fired before they could tell you anything.", "Professional. They probably expected this as a possibility. That's the job.", "No ID. No prints. Exactly as intended, just from your side of it."],
  "Bounty Hunter":      ["The bounty contract just voided. Whoever paid won't be happy.", "Down. Whoever hired them will hire someone else. They always do.", "You check their comms device. The client's name is redacted. Of course it is."],
  "ICE Construct":      ["The construct fractures. Data bleeds into the Void around you.", "ICE shattered. The node is exposed now. Move fast.", "Countermeasure disabled. The system will rebuild it. You have a window."],
  "Black ICE":          ["The ICE dissolves. You're still breathing. That's more than it intended.", "Black ICE down. Your hands are shaking. You didn't notice until now.", "The Void goes still. You cost someone a significant installation. Good."],
  "Daemon":             ["The Daemon unravels. The Void fills in where it was, like it was never there.", "Gone. You don't know if you destroyed it or it let you think that.", "Silence. Something that old going quiet feels significant. You can't say why."],
};

export const getEnemyDeath = (name) => {
  const pool = ENEMY_DEATH[name];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const FREE_TERMINAL_LORE = [
  // Axiom corporate / Sync administration
  { text: "AXIOM INTERNAL: CortexSync adoption in residential sectors up 4.1% this quarter. Projection: 68% penetration by year end. Remaining resistance clusters mapped.", color: '#00e5ff' },
  { text: "AXIOM HR: Employee wellness scores below threshold in Sump sectors. Recommended action: reduce access to non-Axiom information sources. Update firmware to v4.7 compliance.", color: '#00e5ff' },
  { text: "AXIOM FIRMWARE LOG: Preference delta batch 7-C applied successfully. 4,847 units updated. Anomalous resistance in 23 units — flagged for follow-up calibration.", color: '#00e5ff' },
  { text: "AXIOM MEMO: Ghost Network signal detected in residential grid 7-C. Counter-measure delayed pending budget approval. Note: target is likely unsynced — standard approach insufficient.", color: '#00e5ff' },
  { text: "AXIOM INTERNAL: 23 missing persons reports flagged in Sump sector this quarter. All marked: ADMINISTRATIVE CLOSURE. Note: subjects were unsynced — standard tracking unavailable.", color: '#00e5ff' },
  { text: "AXIOM CLINICAL NOTE: Patient presents high-integration indicators. Recommending overlay increase to 60%. Note for file: subject has stopped asking about the update logs. Progress.", color: '#00e5ff' },
  // Lore spine — Axiom history
  { text: "AXIOM INTERNAL ARCHIVE — 2059: Consolidation of seven competing BCI manufacturers complete. Market share: 91%. Filing note: regulatory exposure minimal. Government partners briefed.", color: '#00e5ff' },
  { text: "AXIOM ARCHIVE — SKILL TRANSFER UPDATE 2063: Deployment complete. Competency transfer success rate: 94%. Labour market impact: within modelled parameters. Review scheduled Q3.", color: '#00e5ff' },
  { text: "AXIOM CLASSIFIED — OPERATION ZERO: Study environment designated. Faction variables set. Experiment parameters locked. Note: city population does not require notification under Research Protocol 7.", color: '#00e5ff' },
  { text: "AXIOM R&D — PREFERENCE_REINFORCE_09: Protocol active. Deployment triggered automatically on detection of data discrepancy discovery. 47 units treated, 8-month window. Efficacy: 96%.", color: '#00e5ff' },
  // Civilian / street level
  { text: "PERSONAL MESSAGE — UNSENT: 'He got the Sync six months ago for the job. He's better at the job. He's worse at everything else. I don't know how to tell him I can see the difference.'", color: '#888899' },
  { text: "COMMUNITY BOARD: Checkpoint Alpha synced-only lane now operating. Estimated wait time reduction: 38 seconds. No comment from building management on the unsynced queue.", color: '#888899' },
  { text: "ENCRYPTED PERSONAL: 'She passed the exam. Top score. Synced two weeks before the test date. I keep telling myself it's the same as studying. It's not the same as studying.'", color: '#888899' },
  { text: "PUBLIC TERMINAL DRAFT: 'If you're thinking about the Sync — I know what the advantages feel like. I had it for eight months. I also know what it felt like to read my own change logs. Think carefully.'", color: '#888899' },
  { text: "COMMUNITY BOARD: Missing — Jeth Arillo, 34, sump-level. Last seen near Axiom Employment Centre on the day mandatory Sync compliance forms were issued to transitional-position workers.", color: '#888899' },
  { text: "UNSENT MESSAGE: 'I'm not saying she's gone. She's right here. I'm saying the person I knew is right here and seems fine and I can't stop noticing what she used to care about that she doesn't anymore.'", color: '#888899' },
  // Faction intel
  { text: "GHOST NETWORK RELAY: Firmware batch 7-C is a preference update. Not a security patch. Axis: reduced political dissent, increased consumption compliance. We have the diff file. Ask Nadia.", color: '#69ff47' },
  { text: "IRONHAND NOTICE: New classification — 'Sync-optional positions' now means 'Sync-required within 90 days.' We know. Pass it on.", color: '#ff5722' },
  { text: "MEDICA CARTEL: Extraction services available. Survival rate: 71% full recall, 22% partial loss, 7% other outcomes. Axiom's 'fatal cascade' claim is false. We have seventeen case files.", color: '#ff4081' },
  { text: "GHOST NETWORK: For anyone reading this unsynced — you are not behind. You are the only people in this city whose thoughts belong to them. That matters more than it used to.", color: '#69ff47' },
  { text: "HUMANIST COLLECTIVE: We meet Tuesdays. Bring something you made with your hands. No overlay. No feeds. No agenda except remembering what this feels like. Location on request.", color: '#888888' },
  // Street intelligence
  { text: "INTERCEPTED SIGNAL: Firmware batch 7-D scheduled for district-wide push at 0300. If you're Synced and want to know what it does before they do it — ask the Ghost Network. Fast.", color: '#aaaacc' },
  { text: "DEAD DROP: 'The Shell count in residential block 7 is up to forty-three. High-integration users who stopped coming back. Axiom calls it voluntary deep immersion. Come see their faces.' — R", color: '#aaaacc' },
  { text: "OPEN RELAY: The new compliance metric isn't productivity. It's firmware update acceptance rate. They're not measuring what you do. They're measuring how much you resist being changed.", color: '#aaaacc' },
  { text: "UNDERNET BROADCAST: Rust Protocol is active again. If you know what that means, stay off the main routes. If you don't — it means Ironhand is moving unsynced bodies and they don't want Axiom's people counting them.", color: '#aaaacc' },
  // Lore spine — the virus
  { text: "MEDICA INTERNAL — RESTRICTED: Antidote distribution complete. Gene modification embedded as standard. Analysis of long-term expression: ongoing. Note: Ironhand cohort shows highest uptake. Debt financing ensured compliance.", color: '#ff4081' },
  { text: "GHOST ARCHIVE: The virus. We have partial documentation. What we know: Medica had the antidote before the outbreak peaked. What we can't prove: whether that's because they were prepared or because they were ready.", color: '#69ff47' },
  { text: "IRONHAND — INTERNAL: The clinic debt from the antidote is still being serviced by forty-three families in the industrial block. The gene mod in the antidote is still being analysed. Nobody told us it was in there.", color: '#ff5722' },
  // Lore spine — Meridian / the Seat
  { text: "MERIDIAN — INTERNAL (RESTRICTED): Shell subjects show consistent bleed-through at 14-month mark. Seat has authorised continuation. Ground-level coordinators not informed. This is correct protocol.", color: '#c084fc' },
  { text: "INTERCEPTED — SOURCE UNKNOWN: The Seat has been running something in the lower safehouses for four years. The people who run the safehouses don't know. The people who use them don't know. I'm telling you because I'm one of them and I just found out.", color: '#c084fc' },
  // Lore spine — pre-Sync city
  { text: "ARCHIVED — NEO-KAIRO HERALD, 2057: City reconstruction complete. Engineers estimate 80-year structural lifespan for new district foundations. The Spire designed to indefinite specification. Comment from city planners unavailable.", color: '#888888' },
  { text: "ARCHIVED — 2063 LEGISLATIVE RECORD: Amendment 7 (Cognitive Autonomy Protection Act) defeated, 31-19. Leading dissenting argument: 'economic disruption of Sync restriction outweighs theoretical consent concerns.'", color: '#888888' },
  { text: "PERSONAL ARCHIVE: 'I remember when you could tell who was Synced and who wasn't just by how they moved. Now I can't. I don't know if that means the gap closed or if it means something worse.' — unsigned, undated", color: '#888888' },
];

export const pickFreeTerminalLore = () => FREE_TERMINAL_LORE[Math.floor(Math.random() * FREE_TERMINAL_LORE.length)];

export const FACTION_ENTRY_LINES = {
  axiom: [
    "Axiom territory. Sync penetration here is near-total. The people around you are running overlay — they processed your biometrics before you cleared the corner.",
    "Corp sector. The cameras here aren't the surveillance. The Synced residents are. Every firmware unit is a reporting node. You're already in the dataset.",
    "Axiom space. The light is colder and the people move faster — parallel processing, overlay-assisted, operating at Sync speed. You are the slowest thing on this street.",
    "Axiom territory. CORTEXSYNC MANDATORY notices on every employer's door above this block. The ones who aren't Synced yet are the ones whose jobs haven't been reclassified. Not yet.",
  ],
  ironhand: [
    "Ironhand turf. Mostly unsynced — not ideology, math. The cognitive gap between them and the corpo workers who took their jobs has been growing for eight years. You feel the weight of that on this street.",
    "You're in Ironhand territory. The graffiti says STAY HUMAN. Not as aspiration — as accusation. At the Synced contractors who pass through here and don't look at anyone.",
    "Ironhand runs this block. Unsynced by economics first, principle second. They watched the first wave of CortexSync workers price them out of every skilled job. The anger is specific and it has a date.",
    "Gang territory. The people here move differently — reading corners with their eyes instead of overlay, tracking threats manually. Slower. They know it. They're past being ashamed of it.",
  ],
  ghosts: [
    "Ghost Network presence. No Axiom firmware pings reaching here — the infrastructure is spoofed or dark. The silence where the Sync overlay would be is either freedom or disadvantage depending on who you are.",
    "Ghost territory. Some of these people are Synced and using it to fight Axiom from inside. Some refused the installation and are running on baseline cognition. They don't talk about the gap between them. They don't have to.",
    "Ghost Network. The cameras here are pointed elsewhere on purpose. In this block, your thoughts are yours. That used to be the default. Now it's a political act.",
    "Ghost space. Off the update grid. No firmware compliance check pings. For a moment your augments are just tools, not nodes in someone else's network. You notice how rarely that's true.",
  ],
  medica: [
    "Medica Cartel territory. People come here to get fixed — or extracted. The extraction clinic three blocks down has a 71% full-recall rate. The other 29% don't talk about what they lost.",
    "Medica runs this block. The smell is different here — antiseptic under the usual rot. There's a woman outside a clinic with the slightly absent expression of someone in extraction recovery. She looks like she's trying to remember something.",
    "Medica Cartel. They do what Axiom says can't be done: remove the Sync without killing the patient. Axiom says the survival rate proves nothing. Medica says the survival rate is the point.",
    "Medica space. The people who come here can't go to a hospital — unsynced, off-grid, or trying to get off-grid. The less afraid they look, the further along they are in recovery.",
  ],
};

export const getFactionEntry = (faction) => {
  const pool = FACTION_ENTRY_LINES[faction];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const AMBIENT_EVENTS = [
  // Sync / city atmosphere
  { msg: "A corpo dropship passes overhead. Everyone on the street freezes until it's gone.", color: '#00e5ff' },
  { msg: "Acid rain. Neon bleeds into the puddles.", color: '#888899' },
  { msg: "A man stands at a corner staring at nothing, hands at his sides. Shell. High-integration. He's probably at his desk in the Sync overlay right now.", color: '#888899' },
  { msg: "A kid tries to pick your pocket. You let them go.", color: '#888899' },
  { msg: "Two Axiom guards talk quietly. One says: 'update batch pushed at 0300 tonight.' The other nods like they've been expecting it.", color: '#00e5ff' },
  { msg: "A woman hands you a flyer: YOUR THOUGHTS ARE YOURS. Humanist collective, Tuesdays, lower residential. She's gone before you can respond.", color: '#888888' },
  { msg: "Something explodes three blocks away. Flat sound — controlled demolition. Nobody reacts. The Synced are already reading the incident report.", color: '#ff4444' },
  { msg: "A stray dog with a corporate barcode burned into its ear watches you pass.", color: '#888899' },
  { msg: "Ghost Network ping. Unaddressed. 'Firmware batch 7-D tonight. If you're Synced and want to know what it changes before they push it — ask Nadia.'", color: '#69ff47' },
  { msg: "The lights in this block run at 40% capacity. Axiom energy rationing. The Synced residents barely notice — they're running in overlay. The unsynced are the ones sitting in the dark.", color: '#555570' },
  { msg: "A man with a neural jack in his temple sits against a wall, eyes open, present in some other layer entirely. He looks content. That's the part that stays with you.", color: '#888899' },
  { msg: "Someone has written a name in permanent marker under an overpass support. Just a name. Below it, smaller: they were Synced six months ago. I don't know them anymore.", color: '#555570' },
  { msg: "Painted under a puddle of rain water: WE CHOSE THIS. Someone else has added: DID WE.", color: '#888899' },
  { msg: "Curfew siren in the distance. The Synced check the time automatically. The unsynced look up at the sky.", color: '#ff4444' },
  { msg: "You pass someone who recognises you. They hesitate — reading your biometrics on overlay. Then they decide to say nothing. That used to mean something different.", color: '#888899' },
  { msg: "A terminal has been smashed with something heavy. Not looted. Just broken. There's a firmware update notice on the cracked screen. Someone didn't want to read it.", color: '#555570' },
  { msg: "Axiom recruitment poster: YOUR POTENTIAL, UNLOCKED. CORTEXSYNC — ASK AT YOUR NEAREST EMPLOYMENT CENTRE. Someone has written underneath: and then they own the lock.", color: '#00e5ff' },
  { msg: "The smell of the Undernet reaches street level. Down there, Sync signal is weak. Updates are delayed. Some people go there specifically for that.", color: '#555570' },
  { msg: "Three drones doing a grid sweep. You count the pattern. They're not just watching — they're pinging Sync units for firmware compliance. Eighteen seconds between passes.", color: '#00e5ff' },
  { msg: "A couple argues on a balcony. One of them is Synced, running overlay, multi-tasking. The other is trying to have a conversation. You've seen this before.", color: '#888899' },
  { msg: "A broadcast cuts in for four seconds — a voice reading names. Shells, probably. People who went high-integration and stopped coming back. Then static.", color: '#e040fb' },
  { msg: "Someone has scratched a Ghost Network route marker under a gutter. The old kind — physical, no Sync required to read. Someone is thinking about who might need to find this.", color: '#69ff47' },
  { msg: "The rain is warm and chemical. Your augments filter it fine. A child nearby isn't augmented. You wonder if their parents have started the Sync conversation yet.", color: '#555570' },
  { msg: "A child asks you if getting the Sync hurts. You give an honest answer. They say: 'My mum says it doesn't hurt. She says she doesn't remember if it hurt.'", color: '#888899' },
  // Ironhand — boiling anger, latent power
  { msg: "Ironhand crew passes. Four people, no eye contact, no Sync overlays — you can tell by the way they look at corners instead of through them.", color: '#ff5722' },
  { msg: "Factory sector dark. Third shift didn't show. No announcement. The industrial block just stopped. You watch a corpo logistics van slow down, driver checking overlay, then turn around.", color: '#ff5722' },
  { msg: "War veteran sitting on a loading dock. Military-issue shoulder brace, 2060 model, maintained by hand. He's watching the Axiom checkpoint across the street with the patience of someone who has been watching it for years.", color: '#ff5722' },
  { msg: "Ironhand graffiti on a checkpoint wall: THE SKILL TRANSFER UPDATE — 2063. REMEMBER THE DATE. Below it, smaller, different hand: we remember.", color: '#ff5722' },
  { msg: "Someone took out a Sync relay station in the industrial block last night. Not with explosives. With tools. Methodical. The Builders don't make noise. They just build and unbuild.", color: '#ff5722' },
  { msg: "Three Ironhand women running a first-aid station out of a doorway. No Medica logo. No registration. Free. They look at you with the professional assessment of people who've seen worse.", color: '#ff5722' },
  { msg: "An old man with two chrome arms — not matched, different manufacturers, different decades — playing cards with someone half his age. The younger one has one chrome arm and one flesh arm. The boundary is moving.", color: '#ff5722' },
  // Medica — transactional warmth, dependency
  { msg: "A Medica clinic van parks in a loading zone. Three people get in, quickly. One of them has the slightly unfocused expression of someone running bad extraction recovery.", color: '#ff4081' },
  { msg: "Medica field medic in a residential doorway. She's cheerful in a specific way — warm hands, efficient movements, not a wasted gesture. She patches someone's arm and hands them a card. The card has a follow-up appointment date.", color: '#ff4081' },
  { msg: "A man leaves a Medica clinic with the careful movements of someone whose neural scarring is still settling. The clinic door closes behind him with a soft chime. He'll be back in six weeks. The clinic knows this.", color: '#ff4081' },
  { msg: "Medica pop-up dispensary in the market district. The prices are visible on a board. The Ironhand prices are different from the corporate prices. The board doesn't explain why.", color: '#ff4081' },
  { msg: "A Medica practitioner arguing quietly with a patient. 'The maintenance protocol is necessary.' 'I can't afford the maintenance protocol.' A pause. 'There are financing options.' Her voice doesn't change. That's the training.", color: '#ff4081' },
  // Meridian — ground-level genuineness, hidden depth
  { msg: "A monk in the corner of a market stall, repairing something with his hands. Around him, Synced vendors process inventory in overlay. He looks up when you pass. He's actually looking at you.", color: '#c084fc' },
  { msg: "Meridian safehouse: the door is plain, the light inside is warm, and someone is cooking something real. You can smell it from the street. This block has a 61% Sync adoption rate. That smell is not an accident.", color: '#c084fc' },
  { msg: "A woman on a residential stoop reading a paper book. Actual paper, actual ink. She's not performing it. She's reading. You watch her turn a page with the focused stillness of someone doing something that requires all of them.", color: '#c084fc' },
  { msg: "Meridian breathing circle in a basement. Twelve people. No chrome visible. Breath work and body awareness. They're doing something the Sync can't log because there's nothing to log. You understand why this is political.", color: '#c084fc' },
  { msg: "A Meridian courier moves through the checkpoint with the calm of someone who has seventeen routes memorised and knows which guard is on shift and what their patterns are. The calm is not performed. It's practice.", color: '#c084fc' },
];

export const CHUNK_ATMOSPHERE = {
  residential:  ['Laundry strung between windows. A man sits on his stoop staring at nothing — Synced, high integration, probably home but not present. Someone cooking. Someone crying.', 'Four floors of lives stacked on top of each other. Half of them are on the Axiom update schedule. The other half watch the first half and don\'t know what they\'re looking at anymore.', 'The kind of block where everyone knows which neighbours got Synced last year. Nobody says what they\'ve noticed since.'],
  market:       ['A hundred deals happening in the space of a block. The Synced vendors process inventory and negotiate simultaneously. The unsynced ones are slower and angrier about it in a way they can\'t quite name.', 'The neon here is older. Patched. The signs advertise things that don\'t exist anymore. Half the stall owners have the slight absence behind the eyes that means they\'re running overlay.', 'You can buy almost anything here including, if you know who to ask, a black-market Sync install with no firmware update clause. The waiting list is long.'],
  gang_turf:    ['Ironhand territory. Mostly unsynced — not ideology, economics. The cognitive gap between them and the Axiom contractors who took their jobs has been growing for eight years. The anger has nowhere clean to go.', 'The graffiti here is a language. Some of it says STAY HUMAN. Some of it says FIRMWARE IS POISON. Some of it just has a date — the day the factory started preferring Synced workers.', 'A block that negotiated its own peace. The terms include: no Axiom firmware updates administered on this street. That\'s a rule with teeth.'],
  industrial:   ['The machines don\'t stop. The Synced workers outperform the unsynced by 40% and management has the metrics to prove it. The unsynced ones know. They see the numbers. They haven\'t left yet.', 'Axiom bought the factory eight months ago. First update: mandatory Sync for all senior staff. Second update: reclassification of unsynced workers as \'transitional positions.\' Third update: pending.', 'Everything smells like hot metal and something chemical. A woman on the line has the absent expression that means she\'s running work overlay — processing three tasks at once, none of them visible from outside.'],
  ruins:        ['What this used to be is still visible. Some of it used to be Humanist meeting spaces — groups of people practicing being present without augmentation. Axiom zoning orders shut most of them down. Some moved underground.', 'The city grew over this place. Squatters here are mostly unsynced — can\'t afford it or won\'t risk it. They watch each other in the old way, reading faces instead of data feeds. It\'s slower. They don\'t mind.', 'Scavengers, squatters, and the occasional corpo team. None of them ask each other questions. The ruins are one of the few places in Neo-Kairo where the Sync\'s advantage doesn\'t translate directly into power.'],
  safehouse:    ['Someone went to the trouble of making this look ordinary. The lock is new. No Axiom cameras have line of sight. Whether that\'s accident or design depends on whether you know what the Humanists use these spaces for.', 'Off the grid. No firmware update pings reach this location — the walls are lined with something. The people inside have reasons to want their thoughts to be their own.', 'Clean, careful, quiet. A place where people come to be unobserved. Some of them are Synced and need a break from the overlay. Some of them are unsynced and need a break from being watched.'],
  black_market: ['Everything here costs more than it looks like it should. That includes the Sync hardware — off-brand, no Axiom firmware clause, no update mandatory. The mortality rate on extractions is real. So is the demand.', 'The market has rules. One of them: no Axiom firmware administrators on-site. That rule is enforced. Another: if you\'re here to buy a black-market Sync, you already know the risks. Nobody will warn you again.', 'Medica, Ironhand, Ghost Network — they all touch this place. The Ghost Network pragmatists buy hardware here. The purists come to argue with them about it. Everyone comes to buy things Axiom doesn\'t want them to have.'],
  corporate:    ['Axiom architecture. Every surface surveilled. The staff all have the Sync — mandatory above grade three. Their eye movements are slightly wrong, tracking invisible overlays. They look at you and simultaneously look at your biometric read.', 'Clean, efficient, monitored. The Synced workers here move faster than you. They know it. Some of them feel bad about it in a way the firmware is slowly editing out.', 'Corpo space. The light is the colour of productivity. Everyone in here is running at Sync speed and the ones who aren\'t are the ones whose jobs haven\'t been reclassified yet.'],
  tunnel:       ['The Undernet is older than the Sync. The tunnels were here before any of this. The people who live down here made a choice — actively or by circumstance — to be off the update grid.', 'Light sources improvised. People improvised too. Nobody down here is running Axiom firmware. Whether that\'s freedom or disadvantage depends on what you\'re trying to do.', 'Sound travels differently underground. A woman nearby is speaking to someone who isn\'t present — Synced, running overlay. Her companion is physically absent. Probably always is.'],
  sump:         ['The bottom of the city\'s bottom. The Sync penetration rate at sump level is under 10% — too expensive, too far from Axiom infrastructure, too little to gain. The people here are baseline human in a city that\'s stopped valuing that.', 'Pipe Market operates on barter and memory. The unsynced merchants here hold prices in their heads. It\'s slower. They\'re used to being slower. They have been for eight years.', 'You can smell the Undernet. Down here the Sync\'s cognitive advantage means almost nothing. The skills that matter — who to trust, where it\'s safe, how to read a face — these are things the firmware hasn\'t learned to replace yet.'],
  lobby:        ['Axiom Tower. Every person in here is Synced. You can see it in the slight overlay-lag behind their eyes, the way they process you faster than is normal. You are the only baseline human in the room. They all know.', 'Security here isn\'t subtle. The guards are running tactical overlay — they saw your biometrics before you cleared the door. The Sync gives them eight seconds of advantage in any encounter. They know that number exactly.', 'The corpo threshold. Above this floor, the Sync is mandatory. Below it, you\'re tolerated. The distance between those two conditions is measured in cognitive percentiles and everyone here knows exactly where you rank.'],
  checkpoint:   ['Checkpoints exist to remind you that movement is a privilege. The guards here run facial recognition overlay — they see your ID before you hand it over. If you\'re Synced, the checkpoint is three seconds. If you\'re not, it\'s longer.', 'The gate is Axiom-administered. The guards are hired. Some of them are Synced, some aren\'t. The ones who aren\'t are waiting to be reclassified. They know this and it shows in how they handle the unsynced.', 'Papers, presence, patience. The Synced get waved through. The unsynced get checked. Nobody says this directly. The time difference is about forty seconds. Everybody counts.'],
  ripper_doc:   ['The smell is antiseptic under something older. Surgical tools lined up. No Sync hardware on display — what they do here is off the Axiom grid, which is the whole point.', 'No licence on the wall. No questions asked. A woman ahead of you is getting a black-market Sync extracted. She\'s been under forty minutes. Doc doesn\'t look worried. That\'s the most reassurance you\'re going to get.', 'They call them Rippers. What they do before the installation is half the reason. What they do with the Sync hardware — installing it without the Axiom firmware clause — is the other half.'],
};

export const getChunkAtmosphere = (chunkType) => {
  const pool = CHUNK_ATMOSPHERE[chunkType] || ['You move through it. That\'s enough.'];
  return pool[Math.floor(Math.random() * pool.length)];
};

