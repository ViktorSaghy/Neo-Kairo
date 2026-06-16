// ═══════════════════════════════════════════════════════════════════════
// NPC DATA
// Contains all NPC definitions: names, roles, descriptions, greetings
// Each NPC has faction affiliation and preferred chunk types
// ═══════════════════════════════════════════════════════════════════════

export const NPC_POOL_BY_CHUNK = {
  safehouse:    ['Rusty','Doc Mem','Nadia','Mara','Petra'],
  black_market: ['Rusty','Kite','Doc Mem','Hex'],
  market:       ['Nadia','Kite','Rusty','Yuki'],
  gang_turf:    ['Rusty','Kite','Voss'],
  residential:  ['Nadia','Kite','Mara','Petra','Voss'],
  tunnel:       ['Kite','Doc Mem','Rusty','Mara','Hex'],
  sump:         ['Doc Mem','Rusty','Kite','Yuki'],
  industrial:   ['Kite','Rusty','Voss'],
  ruins:        ['Doc Mem','Kite','Mara','Sable'],
  corporate:    ['Aria', 'Dixon', 'Reyes'],
  lobby:        ['Aria', 'Dixon'],
  checkpoint:   ['Aria','Kite','Petra'],
  default:      ['Kite','Rusty','Sable'],
};

export const NPC_COLORS = {
  Rusty:   '#ff9800',
  Nadia:   '#e040fb',
  'Doc Mem': '#69ff47',
  Aria:    '#00e5ff',
  Kite:    '#ffd700',
  Mara:    '#c084fc',
  Voss:    '#ff5722',
  Petra:   '#b085f5',
  Sable:   '#aaaaaa',
  Hex:     '#69ff47',
  Yuki:    '#ff80ab',
  Dixon:   '#ff6b9d',
  Reyes:   '#64b5f6',
};

export const NPCS = {
  Rusty: {
    name: 'Rusty',
    role: 'Fixer',
    faction: 'ironhand',
    location: 'undernet',
    desc: 'Chrome left hand — iron-coloured, industrial surplus, repaired twice with parts that don\'t quite match. The hand predates the Sync by a decade. Unsynced: can\'t afford it is the official story, and that story has the advantage of being partly true. The real reason is what happened to the Skill Transfer cohort in \'81 — the factory workers who did everything right, trained for years, and watched their expertise get loaded into a Sync update in eighteen months. Rusty knew three of them. He deals in favours and information and has a specific, patient anger with a specific date attached to it. The code he operates by isn\'t explained because it doesn\'t need to be. It\'s visible in what he won\'t do.',
    greetings: [
      '"You again. Good. I have work."',
      '"Don\'t stand in the doorway. Sit down. You look like a target."',
      '"Word travels. What you did — people noticed."',
      '"You look worse than last time. That\'s promising."',
    ],
    tipRipper: '"You need chrome if you\'re going to survive down here. Not optional. Find the ✦ marker on the map — that\'s a ripper doc. Unlicensed. Doesn\'t ask questions. Worth the cost."',
    tipBroker: '"If you\'re running hacks without software, you\'re doing it the hard way. Find the ⌬ marker — net broker. Black market or deep underground. Basic programs for cheap. Don\'t skip it."',
    jobContext: [
      'Rusty slides a chip across the table without looking up. "Don\'t ask where it goes. Just get it there."',
      '"My client doesn\'t want to know your name. Don\'t volunteer it." He finally looks at you. "Clean work only."',
      '"This one\'s personal for me. Which means if it goes wrong, we never had this conversation."',
    ],
  },

  Nadia: {
    name: 'Nadia Chrome',
    role: 'Information broker',
    faction: 'ghosts',
    location: 'neon_streets',
    desc: 'Runs a bar that is a listening post. Synced — Ghost Network pragmatist: she took the install for operational advantage and has spent four years deciding whether that was the right call. The bar gives her cover; the Sync gives her an edge on every faction contact who walks in. She charges for truth and distributes plausible lies for free. The private worry she doesn\'t discuss: she\'s been watching what firmware updates do to the people she works with over time, and she\'s been on the update grid for four years, and she can\'t read her own change logs from the outside. She does her best work when she stops thinking about that.',
    greetings: [
      '"The bar\'s closed. The back room isn\'t. Sit."',
      '"You\'ve been busy. I\'ve been watching."',
      '"Don\'t order anything. Just talk."',
    ],
    tipRipper: '"You\'re running soft. The ✦ tile — ripper doc. Body modifications, off the Axiom grid. Find one early. Chrome is the difference between a run that ends badly and one that doesn\'t end at all."',
    tipBroker: '"The ⌬ marker is a net broker. Software dealer, no registration, no logs. If you\'re hitting Axiom terminals without programs loaded you\'re losing credits you don\'t have to lose."',
    jobContext: [
      'She writes nothing down. "The target leaves the Spire at 21:00. After that, you\'re on your own timing."',
      '"This is the kind of job that changes your reputation permanently. You ready for that?"',
      '"My source says the package is where I told you. My source has been wrong before. That\'s why I\'m hiring you and not going myself."',
    ],
  },

  'Doc Mem': {
    name: 'Doc Membrane',
    role: 'Black market medic',
    faction: 'medica',
    location: 'undernet',
    desc: 'Lost her licence for asking too many questions about the CortexSync trial data — specifically, the consent documentation on the sump-sector subjects. Now patches people who can\'t go to a hospital and performs Sync extractions Axiom says cause fatal neural cascade. Her survival rate is 100%. She does not discuss her methods, partly from professional habit and partly because the knowledge base she draws on has a history she has thought about more carefully than most people could bear to. The care is real. She has not resolved what that means alongside everything else she knows. She stopped trying to resolve it about three years ago.',
    greetings: [
      '"Sit still. I\'m going to hurt you, but I\'ll explain what I\'m doing."',
      '"You\'re not as bad as you look. That\'s either good news or you\'ve gotten used to it."',
      '"I don\'t ask about the wounds. Just the allergies."',
    ],
    tipRipper: '"You know what a ripper doc is? Same as me, different speciality. They install augments — body mods, off Axiom\'s firmware register. Look for the ✦ on the map. Go when you have credits. Go before you need to."',
    tipBroker: '"I patch bodies. For the software side, find a net broker — the ⌬ marker. Underground or black market. They sell hacking programs. If you\'re running terminals without them, you\'re working blind."',
    jobContext: [
      'She doesn\'t look up from her work. "Someone in the Spire has something I need. Medical data. Lives depend on it. Literally — I have a list."',
      '"The patient who told me this died before I could help them. You\'re the next best thing."',
    ],
  },

  Aria: {
    name: 'Aria-7',
    role: 'Axiom defector / AI fragment',
    faction: 'ghosts',
    location: 'spire_base',
    desc: 'CortexSync-implanted Axiom analyst who defected eighteen months ago. Runs three separate identities — the original, the cover, and a third she built after the first two became indistinguishable. The Sync is still in her. Still updating. She cannot read her own firmware logs and she cannot know what the updates have written into the person doing the defecting. She tells herself the one who defected was the real one. She thinks about that sentence more than she tells anyone. The work is real. The cause is real. She is less certain every month which thoughts in her head she generated herself.',
    greetings: [
      '"I\'ve been allocated fourteen minutes before my next scheduled check-in. Talk fast."',
      '"The cameras in this corridor are on a loop. We have ninety seconds."',
      '"Don\'t look at me like you know me. You don\'t. Not yet."',
    ],
    tipRipper: '"You\'ll need hardware to get into the Spire. The ✦ tile is a ripper doc — augment installation, no Axiom registration. The neural_hack augment is mandatory for what you\'re planning. Find one. Soon."',
    tipBroker: '"Hacking Axiom terminals without software is survivable at low danger. It won\'t be later. The ⌬ marker is a net broker — software programs that change how hacks work. Find one before you go deep."',
    jobContext: [
      '"Level four clearance gets you to the server room. Level five gets you out. I can give you one of those."',
      '"What they\'re doing in the basement isn\'t classified. It\'s just never been discovered. That\'s different."',
      '"You\'re Division Seven. Or you were. That file doesn\'t close. Let\'s talk about what you still have access to."',
      '"Reyes has your name. Whether that\'s a problem or an opportunity depends entirely on what you do in the next forty-eight hours."',
    ],
    corpoGreetings: [
      '"I wasn\'t expecting Division Seven. Or whatever you are now. Sit down."',
      '"You\'re not here for me. You\'re here because Reyes hasn\'t decided what to do with you yet. Smart."',
      '"The restructure wasn\'t about budget. You already know that. Question is what you want to do about it."',
    ],
  },

  Kite: {
    name: 'Kite',
    role: 'Street intelligence',
    faction: null,
    location: 'neon_streets',
    desc: 'Fourteen years old. Carries messages nobody else will and knows every checkpoint rotation in the mid-layer with a precision that reads as intuition and isn\'t. Two years ago, at twelve, she got a black-market Sync install — no parental consent, no Axiom registration, paid for it herself with eighteen months of running jobs. She has not told anyone. The timing recall is perfect memory, not instinct. She does not know what the install is doing to a brain that was still forming when it went in. She has decided not to think about it, which is itself a thing the Sync might have decided for her.',
    greetings: [
      '"Five credits for what I know. Three if you figure it out yourself. Up to you."',
      '"You\'re the one who\'s been making noise in the Undernet. Everyone knows."',
      '"I don\'t carry weapons. I carry information. Harder to take off a dead body."',
    ],
    tipRipper: '"The ✦ tile is a ripper doc. They do augments — chrome, no questions, no Axiom registry. You\'ll want the reflex or subdermal stuff if you\'re doing what I think you\'re doing."',
    tipBroker: '"See the ⌬ marker? Net broker. They sell programs for hacking. Ghost Thread\'s the one worth buying first — absorbs your first mistake. Trust me on that."',
    jobContext: [
      '"Someone dropped this job because they got scared. I don\'t get scared. But I also can\'t get past the checkpoint. You can."',
      '"The guy who posted this disappeared two days ago. The job\'s still good though. I checked."',
    ],
  },

  Mara: {
    name: 'Mara',
    role: 'Meridian cell coordinator',
    faction: 'meridian',
    location: 'safehouse',
    desc: 'Meridian cell coordinator. At ground level this means safehouses, corridors, mutual aid that actually works — healthcare that doesn\'t generate debt, community that doesn\'t require a product. That part is real and she believes in it without qualification. The other part — the Seat, the experiments, the long game running above the layer most members can see — she knows more about than she has said to anyone in this room, and less than she sometimes thinks she does. She works with you because she needs a runner who operates outside Meridian\'s structure. The distinction between needing you and trusting you is one she maintains carefully. So should you.',
    greetings: [
      '"You\'re still alive. I\'m not deciding yet whether that\'s good news."',
      '"I don\'t ask where you\'ve been. I assume it was necessary."',
      '"Meridian keeps the lights on in here. That\'s enough. Sit down."',
      '"I\'ve got three other problems right now. You\'re the fourth. What do you need?"',
    ],
    tipRipper: '"There\'s a ripper doc in the lower sector — ✦ on the map. Meridian doesn\'t endorse augments. We endorse staying alive. Get what you need to do the job."',
    tipBroker: '"Net broker — ⌬. We route intel through their networks sometimes. They sell programs you\'ll need for terminal work. Don\'t tell them Meridian sent you."',
    jobContext: [
      '"I need this done without a body count if possible. I know that\'s not your style. Try anyway."',
      '"The person who had this job before you is in the clinic. I need someone who makes better choices."',
      '"This touches Axiom infrastructure. If it goes wrong, I will deny this conversation happened. Are we clear?"',
    ],
  },

  Voss: {
    name: 'Voss',
    role: 'Ironhand elder',
    faction: 'ironhand',
    location: 'gang_turf',
    desc: 'Ran the east factory line for twenty-two years before Axiom bought the plant and introduced Sync-optimised quotas. Didn\'t get Synced. Didn\'t leave. Watched his crew shrink to nothing. Now he sits in the same block and talks to anyone who will listen. He carries a 2060 military-issue shoulder brace on his left arm — border campaign hardware, titanium-and-polymer composite, the kind of thing you can\'t get parts for anymore. He maintains it himself with a toolkit he\'s had for fifteen years. The brace doesn\'t enhance combat performance. It just holds a shoulder that was rebuilt badly in a field tent in \'67 and has been deteriorating at a known rate ever since. He has a very specific, very patient anger and a memory for faces. The builders in the industrial zone come to him when they need to know how things were before.',
    greetings: [
      '"You look like someone who hasn\'t decided what side they\'re on yet. Sit. I\'ll tell you about sides."',
      '"My crew used to be forty people. You want to know where they are now? I\'ll tell you. Every one."',
      '"The Sync didn\'t take the jobs. It just made the jobs impossible to keep without it. That\'s the part they never say out loud."',
      '"You\'re still breathing. That means something down here."',
    ],
    lore: [
      '"Axiom bought the factory in \'81. First thing they did was run a \'productivity study\'. Second thing they did was mandate Sync for anyone who wanted a senior position. Third thing: redefine \'senior\' to include everyone but the sweepers."',
      '"The Ironhand started as a mutual aid network. People looking after each other when the work dried up. The violence came later. It comes later everywhere."',
      '"People think unsynced means stupid. We process slower in the overlay. We don\'t have the tactical feed. What we have is — we notice things. Things the overlay doesn\'t flag because it wasn\'t built to care about them."',
      '"Eight years ago you could walk into any factory in the industrial block and half the crew were flesh. Now it\'s maybe five percent. The machines didn\'t replace them. The Sync did."',
    ],
    jobContext: [
      '"I need someone outside Ironhand for this. Someone Axiom isn\'t tracking. You\'re it."',
      '"There\'s a name I need you to find. Not to hurt them. To warn them. There\'s a difference."',
    ],
    tipRipper: '"✦ is a ripper doc. They\'re good people. Mostly. Get chrome if you need it — but stay yourself underneath. That\'s the part that matters."',
    tipBroker: '"⌬ is the net broker. They know things about the Sync that even Axiom doesn\'t publish. Worth a visit even if you don\'t need programs."',
  },

  Petra: {
    name: 'Petra Nine',
    role: 'Meridian courier',
    faction: 'meridian',
    location: 'residential',
    desc: 'Runs packages between Meridian safehouses. Never the same route twice. Has memorised seventeen evacuation corridors in the mid-layer and can walk any of them in complete darkness. She\'s cheerful in a way that initially reads as shallow and is actually a professional choice — people don\'t search cheerful people carefully.',
    greetings: [
      '"Oh good, you\'re not Axiom. You have no idea how often I have to check."',
      '"I just came from the east side. Everything is fine. Completely fine. Definitely fine."',
      '"Mara said you might come through here. She said you were \'functional\'. High praise from her."',
      '"Quick question: do you know a route through the industrial block that doesn\'t pass the north checkpoint? I\'m asking for a friend. I\'m the friend."',
    ],
    lore: [
      '"I\'ve been running packages since I was sixteen. Back then it was just information. Now it\'s people. Same routes, different cargo. Heavier in different ways."',
      '"Meridian doesn\'t have an ideology, technically. But Mara says \'people should be able to move\'. I think that\'s close enough."',
      '"The checkpoints are harder in the residential blocks than the industrial ones. You\'d think it would be the other way. It isn\'t. Home is where they watch you most."',
      '"I\'ve met a lot of runners. The ones who last aren\'t the strongest. They\'re the ones who know three ways out of every room before they walk in."',
    ],
    jobContext: [
      '"I need a second person on this one. Two packages, two routes, same window. You take one. I take one. We don\'t ask each other what\'s inside."',
      '"The person I\'m moving needs to reach the tunnels by 03:00. I need someone watching the north approach while I handle the south."',
    ],
    tipRipper: '"Ripper doc — ✦. I know the one in the lower sector personally. She\'s good. Ask for the non-Axiom catalogue."',
    tipBroker: '"⌬ is the net broker. They keep their inventory off every registry that matters. Worth knowing."',
  },

  Sable: {
    name: 'Sable',
    role: 'Unsynced street presence',
    faction: null,
    location: 'ruins',
    desc: 'No chrome. No Sync. Nothing installed, nothing extracted — has never had either. Sits in the ruins every day and talks to whoever stops. Former academic, maybe — the vocabulary suggests it. Whatever happened to the institution is not something she discusses. She\'s a lore node: she knows the history of Neo-Kairo before Axiom, and she gives it away for free.',
    greetings: [
      '"You\'re in a hurry. Sit for five minutes. The city will still be burning when you leave."',
      '"I don\'t sell anything. I don\'t want anything from you. That surprises people."',
      '"You look like you\'ve been making decisions. How\'s that going?"',
      '"Most people who come through here are running from something. That\'s fine. You can run and still have a conversation."',
    ],
    lore: [
      '"Neo-Kairo was built on a flood plain. The original city went under in \'57. What\'s here now is the second version, built faster and cheaper by people who knew they\'d need to do it again. The Spire is the only thing they built to last. That tells you something about priorities."',
      '"The Humanist movement started before Axiom, actually. It was originally about something else — attention economics, cognitive autonomy, that kind of thing. Axiom gave it a concrete enemy. Movements need enemies to survive. I\'m not sure if that\'s a criticism."',
      '"CortexSync isn\'t new technology. The first commercial version rolled out in \'74. The firmware update clause was in the original terms of service. Nobody read the terms of service."',
      '"There\'s a part of the Undernet called the Archive. Ghost Network runs it. Everything Axiom has ever tried to delete lives down there. The city\'s real history. They\'ve been trying to find it for four years."',
    ],
  },

  // TODO: Add new NPCs from Notion below
  // When adding: Include name, role, faction, location, desc, greetings, jobContext, tipRipper, tipBroker
};
