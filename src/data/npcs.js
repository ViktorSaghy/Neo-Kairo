// ============================================================
// NPC DATA — characters, narrative events, name generator
// ============================================================

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
      '"I was at a Humanist conference in \'78. Four hundred people. Unsynced, all of them. Axiom bought the venue three months later and had it rezoned. I don\'t know what that proves but I think about it."',
    ],
    tipRipper: '"I don\'t do chrome. But if you\'re going to — the ✦ on the map. They\'re careful. That matters more than their rates."',
    tipBroker: '"⌬ is the net broker. They\'re doing interesting work. Even if you don\'t need software, the conversations are worth having."',
  },
  Hex: {
    name: 'Hex',
    role: 'Ghost Network technician',
    faction: 'ghosts',
    location: 'tunnel',
    desc: 'Maintains the terminal infrastructure the Ghost Network uses to route data through the Undernet. Permanently jacked in during working hours, which is most hours. Has opinions about firmware architecture that she will share if you ask, and sometimes if you don\'t. Synced — Ghost Network pragmatist position, uses the Sync to work faster and considers it a tool, not an identity.',
    greetings: [
      '"Give me thirty seconds, I\'m in the middle of something." [Twenty seconds pass.] "Okay. What do you need?"',
      '"You\'re not Axiom. Good. I hate having to be polite to Axiom."',
      '"The terminal three blocks north just went hot. Axiom sweep. You weren\'t near it, were you? Good. Don\'t be."',
      '"I\'ve been awake for twenty-six hours. I\'m fine. I have been fine at every hour of the last twenty-six. What do you need?"',
    ],
    lore: [
      '"The Axiom terminal network has forty-three thousand nodes across Neo-Kairo. We have access to eleven hundred of them. Ghost Network has been patient. The access keeps growing."',
      '"Firmware update 7-C — the one people are scared of — isn\'t a preference update. I\'ve read the architecture. It\'s a preference-update delivery system. The payload comes in the next batch. Axiom hasn\'t pushed it yet. We\'re watching."',
      '"People think hacking is about getting in. It\'s about staying invisible while you\'re in. Anyone can break a door. The skill is closing it behind you so no one knows you were there."',
      '"The Archive isn\'t one place. It\'s distributed across six hundred endpoints. Ghost Network built it that way so Axiom can\'t wipe it. To destroy the Archive, they\'d have to destroy their own infrastructure. They know that. We know they know that."',
    ],
    jobContext: [
      '"I need a physical presence at a terminal I can\'t reach remotely. You go there. I walk you through it. Split the take."',
      '"Someone is running a trace on a Ghost Network courier. I need the trace cancelled. Physically. At the source terminal."',
    ],
    tipRipper: '"✦ is a ripper doc. If you\'re doing terminal work, get the neural_hack augment. Non-negotiable. Find one."',
    tipBroker: '"⌬ net broker. I know their inventory. Tell them Hex sent you and they\'ll show you the unlisted catalogue. Worth it."',
  },
  Dixon: {
    name: 'Dixon',
    role: 'Axiom Division Seven liaison',
    faction: 'axiom',
    location: 'corporate',
    desc: "Eleven years in Axiom procurement, last three in Division Seven. Wears no insignia. Does not record meetings. Has a talent for finding useful people before they become expensive problems and making sure the arrangement works for everyone involved. Believes in the system the way people believe in weather — not because it is good, but because it is the operating condition.",
    greetings: [
      "\"You were referred. I don't take meetings without a referral. We can proceed.\"",
      "\"I've read your file. The version we have access to, anyway. You're more interesting than it suggests.\"",
      "\"This conversation didn't happen. The job is real. The credit transfer is real. Everything else is administrative.\"",
      "\"Division Seven doesn't have an HR department. What we have is a very specific kind of opportunity.\"",
    ],
    tipRipper: "\"Military-grade augments require Allied standing. The ✦ marker — find an Axiom-affiliated doc if you want the full catalogue. Standard chrome is available anywhere. The good stuff isn't.\"",
    tipBroker: "\"Software gives you options in the Spire. The ⌬ marker is a broker. Get something that handles high-security terminals before you go upstairs.\"",
    jobContext: [
      "\"Axiom needs this done quietly. That means not through official channels. That means you.\"",
      "\"The contract is off-registry. The payment is immediate. You ask the right questions, not the wrong ones.\"",
      "\"Division Seven identifies assets who operate effectively in grey areas. You've been operating in one. We noticed.\"",
      "\"This isn't enforcement. It's acquisition. The distinction matters to the people involved.\"",
    ],
    lore: [
      "\"CortexSync is an infrastructure project. Like roads. Like water. The preference updates are maintenance. What maintenance does to the person receiving it is outside my department.\"",
      "\"The export timeline is real. Neo-Kairo is the proof of concept. If it works here, it rolls out globally. The math on that is not complicated.\"",
      "\"Ghost Network isn't the opposition. They're the friction. Friction is manageable. What worries Division Seven is something else — people who understand the system well enough to use it against itself.\"",
      "\"Operation Zero Export is not a secret. It's just not been announced. There's a distinction between those two things that most people can't hold.\"",
    ],
  },
  Reyes: {
    name: 'Director Reyes',
    role: 'Axiom Division Seven director',
    faction: 'axiom',
    location: 'corporate',
    desc: "Head of Division Seven. Responsible for the Neo-Kairo CortexSync rollout and the Zero Export timeline. Has a reputation for finding assets before they become threats and threats before they become problems. Has built a career on being three decisions ahead. Does not meet with contractors directly. Except when she does.",
    greetings: [
      "\"I don't take these meetings. Today is an exception. I want you to think about why.\"",
      "\"You've been making interesting choices. I prefer interesting choices to predictable ones. Usually.\"",
      "\"I know what you've done and I know what you want to do. The question is whether those two things can coexist.\"",
    ],
    tipRipper: null,
    tipBroker: null,
    jobContext: [
      "\"Zero Export needs someone who understands both sides of this city. You do. That's either useful or it's a problem.\"",
      "\"The Ghost Network has intelligence we need neutralised before the export timeline. You have access they don't know about. We do.\"",
    ],
    lore: [
      "\"Neo-Kairo doesn't have a governance problem. It has a compliance problem. The firmware addresses compliance. The export addresses scale. The people who call it control are the same people who call roads control.\"",
      "\"I've read every Ghost Network intercept for three years. They believe they're protecting something. They're protecting the right to be unreadable. That's not the same as freedom. I've noticed they never explain the difference.\"",
    ],
  },
  Yuki: {
    name: 'Yuki',
    role: 'Medica field medic',
    faction: 'medica',
    location: 'sump',
    desc: 'Runs a mobile clinic out of two bags and a pre-loaded credchip. Works the Sump and lower industrial block where Medica\'s fixed clinics don\'t reach. Has a calm that reads as detachment but is actually precision — she doesn\'t have the space to panic, so she doesn\'t. Has been doing this for four years and has a very dry sense of what constitutes a crisis.',
    greetings: [
      '"You\'re upright. That\'s the first diagnostic. What\'s the second complaint?"',
      '"I\'ve patched worse today. Sit down."',
      '"I\'m not a philosopher. I\'m a medic. If you\'re bleeding, I can help. If you\'re having an existential crisis, I can refer you to someone."',
      '"You look functional. \'Functional\' is my favourite medical outcome."',
    ],
    lore: [
      '"Medica doesn\'t have an official position on the Sync. The cartel serves everyone. Synced, unsynced, extracted — doesn\'t matter. We just see more extraction complications than we used to. The demand is up."',
      '"The bioware Axiom won\'t certify isn\'t because it doesn\'t work. Most of it works better than the certified equivalent. It\'s because they can\'t install a firmware update in it. That\'s the whole thing. That\'s always the whole thing."',
      '"I treat Ironhand, Ghosts, Axiom defectors, Meridian couriers, corpo employees having second thoughts. The body doesn\'t care who\'s paying for the insurance."',
      '"Extraction survival rate is now seventy-one percent full recall. We lost twenty-nine percent to varying degrees of memory gap. We\'re working on it. The problem isn\'t the surgery. It\'s what Axiom writes into the architecture before you get to us."',
    ],
    jobContext: [
      '"I need medical supplies from an Axiom distribution hub. They won\'t miss them. The people who need them are three blocks from here."',
      '"There\'s a patient I\'m trying to reach in the industrial block. Axiom has the checkpoint locked. I need someone to get me through."',
    ],
    tipRipper: '"✦ — ripper doc. Different specialty than me. If you need augments installed, find one early. Don\'t wait until you need them yesterday."',
    tipBroker: '"⌬. Net broker. They sometimes carry pharmaceutical data I can use. If you\'re going that way, pick up anything tagged \'bioware-adjacent\'. I\'ll compensate you."',
  },
};

// Assign NPCs to backstory contacts

export const getNPCForBackstory = (backstoryId) => {
  const map = { debt: 'Rusty', witness: 'Nadia', exile: 'Aria', ghost: 'Doc Mem', corpo: 'Aria' };
  return map[backstoryId] || 'Rusty';
};

// ── NARRATIVE EVENT POOL ──
// Non-repeating per run. Pool-based. Some backstory-aware.
// Phase: 'early' (0-4 chunks), 'mid' (5-12), 'late' (12+)

export const NARRATIVE_EVENTS = {
  early: [
    { id:'ne_01', msg: (c) => `You pass a wall of missing-person notices. Half of them are dated from the month Axiom opened the CortexSync employment programme.`, color: '#888899' },
    { id:'ne_02', msg: (c) => `A woman tries to sell you a neural-scrub token. Says it blocks your Sync's location ping for twenty minutes. You can't tell if she believes it works.`, color: '#888899' },
    { id:'ne_03', msg: (c) => `The rain is warm. You stopped noticing that a long time ago. The Synced around you have weather alerts in their overlay and don't look up at all.`, color: '#555570' },
    { id:'ne_04', msg: (c) => `Someone has painted STAY HUMAN across the entire side of a building. The drones are already on the way. The paint is still wet.`, color: '#9090a0' },
    { id:'ne_05', msg: (c) => `A corpo patrol moves through the market. The Synced vendors get advance warning through their overlay. The unsynced ones just see them and react.`, color: '#888899' },
    { id:'ne_06', msg: (c) => `The checkpoint has two queues now. Synced, fifteen seconds. Unsynced, however long it takes. The sign says PROCESSING TIME MAY VARY.`, color: '#555570' },
    { id:'ne_07', msg: (c) => c.backstory === 'ghost' ? `Your extraction scar itches. It does that sometimes. Doc Mem said it would stop. It hasn't yet.` : `An anonymous message on your contact chip: "Firmware batch 7-C is a preference update. Not a security patch." No sender. No follow-up.`, color: '#e040fb' },
    { id:'ne_08', msg: (c) => c.backstory === 'debt' ? `You pass the Axiom employment centre where she signed the CortexSync contract. The intake queue is twelve people long. You walk faster.` : `Outside an Axiom employment centre: a queue. The intake form includes a CortexSync installation waiver. Some people read it. Most sign without reading.`, color: '#888899' },
    { id:'ne_09', msg: (c) => `A kid runs past you with a package. Three Axiom security follow. The kid is faster. They're not Synced yet — still running on instinct and luck.`, color: '#888899' },
    { id:'ne_10', msg: (c) => c.backstory === 'exile' ? `You pass a building with an Axiom firmware division insignia. You worked in one like it. You keep walking and don't let your pace change.` : `The air down here tastes different. Like something is always about to burn. The Synced don't seem to notice. Maybe the overlay filters it.`, color: '#555570' },
  ],
  mid: [
    { id:'nm_01', msg: (c) => `Word in the Undernet: a Ghost Network node went dark last night. Nobody's saying how. Everybody's speculating.`, color: '#69ff47' },
    { id:'nm_02', msg: (c) => `You find a dead corpo — no ID, no badge, no visible cause. Someone cleaned this up in a hurry. They missed the exit wound.`, color: '#888899' },
    { id:'nm_03', msg: (c) => `A broadcast cuts through on all frequencies for twelve seconds: "NEO-KAIRO BELONGS TO ITS PEOPLE." Then static. Axiom traces it in eleven.`, color: '#e040fb' },
    { id:'nm_04', msg: (c) => c.backstory === 'witness' ? `Someone found footage. Not yours — different incident, different district. Axiom buried it in four minutes. They're getting faster.` : `Axiom buried a news story in four minutes today. People are counting. The number keeps going down.`, color: '#888899' },
    { id:'nm_05', msg: (c) => `The Ironhand gang has pulled back from two districts without explanation. The vacuum is filling with Axiom security. That's never a coincidence.`, color: '#ff5722' },
    { id:'nm_06', msg: (c) => `You see a face on a wanted broadcast. LV${c.level > 3 ? Math.floor(c.level/2) : 2} street contact. The bounty is higher than you expected. Someone is cleaning house.`, color: '#ff4444' },
    { id:'nm_07', msg: (c) => `A Medica Cartel clinic is shuttered. Axiom zoning violation, says the notice. The people who used it for extractions have nowhere to go now. They haven't left yet.`, color: '#ff4081' },
    { id:'nm_08', msg: (c) => `You hear ${c.kills > 5 ? 'your own street name in a conversation' : 'someone describe a ghost — unnamed, no corp affiliation, making noise'}. You keep walking.`, color: '#888899' },
    { id:'nm_09', msg: (c) => `The Void is loud tonight. Even the people who can't jack in say they feel it — a pressure behind the eyes, like something enormous is moving.`, color: '#69ff47' },
    { id:'nm_10', msg: (c) => `Axiom has started numbering their drones. You've seen three with the same number. Either they're recycling serial codes or something worse.`, color: '#00e5ff' },
    { id:'nm_17', msg: (c) => `A Ghost Network contact passes you something without stopping: a name. Director Reyes. Division Seven. "If you're making noise," they say, "she already knows."`, color: '#69ff47' },
    { id:'nm_18', msg: (c) => `INTERCEPTED AXIOM SIGNAL: "Confirm subject designation ${c.name}. Flag as active. Director Reyes authorised." The signal is three minutes old.`, color: '#00e5ff' },
    { id:'nm_11', msg: (c) => c.backstory === 'exile' ? `An old Axiom network ID pings your implant. Your own former credentials. They're still active. They shouldn't be. Someone is leaving a door open.` : `An encrypted ping from an Axiom address. It doesn't resolve to anything registered. Someone is using their infrastructure against them.`, color: '#00e5ff' },
    { id:'nm_12', msg: (c) => `A man in a Spire Base uniform asks you for directions to the Undernet. He's not lost. He's running.`, color: '#888899' },
    { id:'nm_13', msg: (c) => `A woman on the street stops mid-sentence and goes still for about four seconds. Then she continues as if nothing happened. Firmware update, probably. She doesn't seem to have noticed.`, color: '#888899' },
    { id:'nm_14', msg: (c) => `You pass a building that used to be a Humanist collective meeting space. Axiom zoning order, six months ago. The windows are boarded. Someone has written STAY HUMAN on the boards. In very small letters, underneath: WE TRIED.`, color: '#888888' },
    { id:'nm_15', msg: (c) => `A child asks you if you're Synced. You answer. They nod, processing, then say: "My dad got Synced and now he doesn't play with me anymore but he says he's fine." They say it like they've said it many times.`, color: '#888899' },
    { id:'nm_16', msg: (c) => c.backstory === 'ghost' ? `A Ghost Network contact looks at you differently. "Heard you had a Sync extracted. What do you remember from before?" You give the honest answer. They nod slowly. "That's about what we expected."` : `Ghost Network contact, briefly: "Extraction survival rate is up. Seventy-one percent full recall now. Medica's getting better." They move on before you can ask what happened to the other twenty-nine.`, color: '#69ff47' },
  ],
  late: [
    { id:'nl_01', msg: (c) => `The city feels tighter. More checkpoints. Longer cycles on the drone patrols. Axiom knows something is coming. They just don't know it's you.`, color: '#ff4444' },
    { id:'nl_02', msg: (c) => `You overhear two Axiom guards talking about a security review. They sound tired. They sound scared. That's new.`, color: '#888899' },
    { id:'nl_03', msg: (c) => `${c.kills} bodies ${c.kills === 1 ? 'is' : 'are'} a lot for one person. The Undernet knows it too. They've started calling you something. You prefer not to know what.`, color: '#ff4444' },
    { id:'nl_04', msg: (c) => `The Ghost Network has gone completely dark. No broadcasts. No pings. Either they're running silent before something big — or Axiom got to them. Either way: now or never.`, color: '#69ff47' },
    { id:'nl_05', msg: (c) => `A Void-touched runner you've seen before looks at you differently now. Not with fear. With something that might be recognition. Or envy.`, color: '#69ff47' },
    { id:'nl_06', msg: (c) => c.backstory === 'debt' ? `Your implant picks up a medical facility signal. Her biometrics are there, if you know her ID. You do. She's still working. Still breathing. Not for much longer if you don't move.` : `The Spire is visible from every district tonight. Every window lit. Something is happening up there that no one down here is supposed to know about.`, color: '#888899' },
    { id:'nl_07', msg: (c) => `Axiom has started asking for names at the checkpoints. Not checking papers — asking. Writing them down by hand. Old-fashioned. Untraceable. Smart.`, color: '#ff4444' },
    { id:'nl_08', msg: (c) => `You count the cameras on this block. Seventeen. Last month it was nine. They're not worried about crime. They're worried about something specific.`, color: '#00e5ff' },
  ],
};

// Narrative event state — stored per run
export let RUN_EVENTS_SEEN = new Set();
export const pickNarrativeEvent = (char) => {
  const visited = (char.visited || []).length;
  const phase = visited < 5 ? 'early' : visited < 14 ? 'mid' : 'late';
  const pool = NARRATIVE_EVENTS[phase] || NARRATIVE_EVENTS.early;
  const available = pool.filter(e => !RUN_EVENTS_SEEN.has(e.id));
  if (!available.length) return null;
  const ev = available[Math.floor(Math.random() * available.length)];
  RUN_EVENTS_SEEN.add(ev.id);
  return ev;
};
export const resetNarrativeEvents = () => { RUN_EVENTS_SEEN = new Set(); };

export const THRESHOLD_SCENES = {
  first_undernet: {
    id: 'first_undernet',
    trigger: (char) => char.pos && char.pos.layer === 1 && !(char.thresholdsSeen||[]).includes('first_undernet'),
    aiPrompt: (char) => `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They have just descended to the Undernet for the first time — the underground layer of the city, where the light doesn't reach and the city's forgotten people live. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A ghost with no past and a future to build.'}. Write 2-3 sentences of first-person present-tense internal monologue. Specific sensory detail. No clichés. Cyberpunk noir tone — not purple prose. End on an image, not a feeling.`,
    fallback: (char) => `The air changes the moment you hit the bottom. Warm and stale, like the city exhaled down here and forgot to breathe back in. Somewhere above you, forty million people are paying rent.`,
  },
  first_hostile_faction: {
    id: 'first_hostile_faction',
    trigger: (char) => Object.values(char.reputation||{}).some(v => v <= -40) && !(char.thresholdsSeen||[]).includes('first_hostile_faction'),
    aiPrompt: (char) => `You are writing the internal voice of ${char.name}, a ${char.archetype} in Neo-Kairo 2089. They have just crossed a point of no return with a faction — made enemies powerful enough to send people after them. Backstory: ${BACKSTORIES[char.backstory]?.hook || 'A ghost with no past.'}. Write 2-3 sentences of first-person internal monologue about what it means to have powerful enemies in this city. Specific, unsentimental. End on a decision or acceptance.`,
    fallback: () => `You've crossed someone. Not just someone — an organisation with resources and patience and memory that outlasts any individual. The smart move would have been to stay small. You weren't smart. You were necessary.`,
  },
  heist_approach: {
    id: 'heist_approach',
    trigger: (char) => {
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

export const JOB_GIVER_NAMES = {
  // By chunk type and faction
  gang_turf:    ['a scarred fixer with chrome knuckles', 'a woman who doesn\'t introduce herself', 'someone\'s lieutenant — you don\'t ask whose'],
  black_market: ['a dealer with burned fingerprints', 'an anonymous voice from behind a screen', 'a contact who smells like solder and ozone'],
  residential:  ['a neighbour who clearly isn\'t', 'a resident who\'s been waiting three days', 'someone\'s frightened parent'],
  market:       ['a vendor who stops pretending to sell', 'a trader with two phones and one eye on the door', 'a middleman who\'s scared of the client'],
  industrial:   ['a foreman who\'s not a foreman', 'a worker with unionised eyes and a private problem', 'a maintenance contact who knows where everything runs'],
  ruins:        ['a squatter who\'s been watching the wrong building', 'a scavenger with better information than their address suggests', 'someone who found something they weren\'t meant to'],
  safehouse:    ['your contact, looking tired', 'the handler, unusually direct', 'someone you half-recognise — maybe they work with Nadia'],
  corporate:    ['a junior Axiom analyst with sweating hands', 'a corpo defector who\'s run out of time', 'someone\'s assistant, very carefully not in uniform'],
  tunnel:       ['a runner who\'s been running this route for years', 'a pipe-market dealer with side interests', 'someone who knows the Undernet better than daylight'],
  sump:         ['a market boss with a problem', 'a water-trader who knows the infrastructure', 'an Undernet elder who doesn\'t explain how they have this information'],
  lobby:        ['a Spire worker who wants out', 'an Axiom employee on a lunch break that\'s about to end', 'someone you have thirty seconds to hear out'],
  checkpoint:   ['a guard who\'s been convinced', 'a nervous checkpoint official', 'someone on the wrong side of the gate'],
  default:      ['a contact', 'someone with a job', 'a fixer with a problem'],
};

export const getJobGiverName = (chunkType, faction) => {
  const pool = JOB_GIVER_NAMES[chunkType] || JOB_GIVER_NAMES.default;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const NAME_PREFIXES = [
  'Zero','Null','Ghost','Cipher','Ash','Hex','Neon','Void','Static','Wraith',
  'Sable','Ruin','Nova','Glitch','Smog','Rust','Chrome','Flux','Shade','Vex',
  'Lag','Burn','Breach','Wire','Scorch','Haunt','Haze','Splice','Nerve','Dark',
  'Feral','Torn','Slick','Bleed','Drift','Surge','Hollow','Pitch','Crypt','Fringe',
  'Keen','Spent','Lace','Mute','Razor','Sink','Thin','Warp','Shard','Quake',
];
export const NAME_SUFFIXES = [
  'Runner','Wire','Blade','Burn','Coil','Signal','Shift','Jack','Crow','Spike',
  'Echo','Patch','Rift','Fang','Volt','Smoke','Drift','Arc','Hook','Loop',
  'Lock','Feed','Frame','Mask','Pulse','Null','Shroud','Trace','Scar','Link',
  'Nail','Seam','Cage','Drop','Graft','Mesh','Node','Slot','Vent','Core',
  'Tooth','Claw','Forge','Gate','Lens','Root','Shell','Skin','Stack','Thread',
];
export const NAME_HANDLES = [
  'V','Kira','Raze','Syn','Ash','Dex','Cove','Mox','Petra','Kai',
  'Lex','Jin','Skye','Rune','Bex','Nox','Flux','Syd','Grim','Colt',
  'Ziv','Wren','Tav','Sev','Pix','Ori','Nyx','Lev','Kaz','Jex',
  'Hex','Fuse','Ede','Cray','Brix','Axa','Zara','Yat','Xan','Vorn',
  'Ura','Trix','Sol','Ren','Quin','Paz','Omi','Nev','Miri','Lox',
];
export const generateHandle = () => {
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

