// ============================================================
// QUEST DATA — sidequests, quest state
// ============================================================

export const SIDEQUESTS = {
  rusty_setup: {
    id: 'rusty_setup',
    npc: 'Rusty',
    title: 'THE CLEAN JOB',
    acts: {
      open: {
        text: (c) => `Rusty doesn't look up when you approach. He's cleaning something mechanical with a cloth that's seen better decades.\n\n"I've got a package. Simple drop. The client is clean — as clean as anyone gets down here. No faction involvement. No Sync-tracked route." He finally looks at you. "You take it to the checkpoint at the northern industrial block, you leave it at the green locker, you walk away."\n\nHe sets down the cloth. "I need someone who doesn't ask questions and doesn't have a firmware update logging their location every thirty seconds. You look like that person."`,
        choices: (c) => [
          { id: 'take',     label: 'I\'ll do it.',              available: true,      next: 'mid' },
          { id: 'negotiate',label: 'Double the cut or I walk.',  available: c.archetype === 'fixer', next: 'mid_negotiated', effect: { credits: 150 }, tooltip: 'FIXER: negotiate' },
          { id: 'scan',     label: '[SCAN] Read his biometrics.',available: c.archetype === 'netrunner', next: 'mid_scanned', tooltip: 'NETRUNNER: scan NPC' },
          { id: 'pass',     label: 'Not interested.',            available: true,      next: null },
        ],
      },
      mid: {
        text: () => `The drop location is quiet. Too quiet. The locker is green but the contact who was supposed to collect it is slumped against the wall with a cord around his neck.\n\nThe package is still in your hands. Someone tipped off the wrong people.\n\nYou hear movement in the shadows.`,
        choices: (c) => [
          { id: 'plant',  label: 'Leave the package. Walk.',    available: true,      next: 'close_planted', effect: { reputation: { ironhand: -10 } } },
          { id: 'keep',   label: 'Take the package. Run.',      available: true,      next: 'close_kept',    effect: { credits: 200, reputation: { axiom: -5 } } },
          { id: 'vanish', label: '[GHOST] Melt into the crowd.',available: c.archetype === 'ghost', next: 'close_ghosted', effect: { credits: 200, reputation: { ironhand: 5 } }, tooltip: 'GHOST: vanish' },
          { id: 'fight',  label: '[SOLDIER] Hold position.',    available: c.archetype === 'soldier', next: 'close_fought', effect: { credits: 300, hp: -20 }, tooltip: 'SOLDIER: hold' },
        ],
      },
      mid_negotiated: {
        text: () => `Rusty looks at you for a long moment. Then the chrome hand sets down the cloth.\n\n"Alright. You're either worth it or you're not. We find out tonight."\n\nThe drop location is quiet. Too quiet.`,
        choices: (c) => [
          { id: 'plant',  label: 'Leave the package. Walk.',    available: true,  next: 'close_planted', effect: { reputation: { ironhand: -10 } } },
          { id: 'keep',   label: 'Take it. Find out what it is.',available: true,  next: 'close_kept_fixer', effect: { credits: 350, reputation: { axiom: -5 } } },
        ],
      },
      mid_scanned: {
        text: (c) => `Your optics burn hot for a second. Rusty's biometrics: elevated cortisol. Micro-expressions flagging deception. He believes the job is clean — but he doesn't know it isn't. Someone above him set this up.\n\n"You'll take it?" he asks.\n\nHe's not the one who set you up. But someone did.`,
        choices: (c) => [
          { id: 'warn',   label: 'Tell Rusty someone above him is dirty.', available: true, next: 'close_warned', effect: { reputation: { ironhand: 15 }, credits: 100 } },
          { id: 'ghost_it', label: 'Take the job knowing it\'s a trap.', available: true, next: 'close_trap_known', effect: { credits: 400, reputation: { ghosts: 5 } } },
        ],
      },
      close_planted: {
        text: () => `You leave the package. Walk three blocks. Hear shots behind you.\n\nRusty sends a message the next day: "Smart. Ambush was Sync-coordinated — whoever set it up had overlay access. They were logged. You were not. We're square on nothing. Don't come to me for a while."`,
        reward: { credits: 50 },
        repEffect: { ironhand: -10 },
        outcome: 'neutral',
      },
      close_kept: {
        text: (c) => `You run. The package contains something warm. An AI core, still pulsing.\n\nNot Axiom manufacture — the architecture is wrong. The firmware update cycle cannot touch it. Whatever is in here ran before the Sync existed and will run after it ends.\n\n"It hums against your ribs like a second heartbeat that knows what the first one has forgotten."\n\nRusty doesn't send a message. That means something.`,
        reward: { credits: 200, item: { id:'hack_chip', name:'AI Fragment', effect:'hack', value:35, price:0, sell:180, desc:'Warm. Pulsing. Reduces next hack difficulty (max effect).', quantity:1 } },
        outcome: 'complex',
      },
      close_kept_fixer: {
        text: (c) => `You run. The package is an AI core. You know three buyers before you've cleared the block.\n\nYou sell it in twenty minutes for more than Rusty was going to pay you.\n\nHe's going to find out. That's a problem for later.`,
        reward: { credits: 350 },
        outcome: 'good',
      },
      close_ghosted: {
        text: (c) => `You're already gone before they see you. The package is in your coat. The ambush hits air.\n\nYou circle back. The shooters were Ironhand. Which means Rusty's client double-crossed him, not you.\n\nYou leave a note at his usual spot. He owes you one.`,
        reward: { credits: 250, reputation: { ironhand: 5, ghosts: 10 } },
        outcome: 'good',
      },
      close_fought: {
        text: (c) => `Three of them. You take hits — twenty damage, minimum. But you hold.\n\nThe last one drops the package and runs. You deliver it yourself.\n\nRusty hears about it. "Didn't know you had that in you," he says the next time you see him.`,
        reward: { credits: 300, reputation: { ironhand: 15 } },
        outcome: 'good',
      },
      close_warned: {
        text: (c) => `Rusty goes quiet. Then: "You scanned me." Not a question.\n\n"Yes."\n\nAnother silence. Then he nods. "I'll deal with it. The job's off. Take something for your trouble."\n\nHe slides across a credchip and doesn't ask how a Netrunner read him through twelve layers of Faraday mesh.`,
        reward: { credits: 100, reputation: { ironhand: 15 } },
        outcome: 'good',
      },
      close_trap_known: {
        text: (c) => `You walk into the trap with your eyes open. Every ambush is just information you can turn around.\n\nThree Axiom contractors down. The package is yours. The real question is who tipped them.\n\nRusty doesn't know. That makes him useful.`,
        reward: { credits: 400, reputation: { ghosts: 5, axiom: -15 } },
        outcome: 'complex',
      },
    },
  },

  nadia_footage: {
    id: 'nadia_footage',
    npc: 'Nadia',
    title: 'THE FOOTAGE',
    acts: {
      open: {
        text: (c) => {
          if (c.backstory === 'witness') return `Nadia looks at you differently tonight. Not just her usual surveillance-everything expression. Something more specific.\n\n"The massacre footage. You have a copy." Not a question.\n\n"There's a broadcast journalist in the Spire Base — Level 2 clearance, not Axiom-owned. They can get it out. But someone needs to move it in person. I can't go up there." She pauses. "You can."`;
          return `Nadia writes nothing down. She never does.\n\n"Someone came through here with footage. Axiom massacre — twelve civvies, a safehouse, Level 0. They buried it in under five minutes across seventy-three jurisdictions." She refills her glass. "The data still exists. I know where it's sitting. The person who should have done something with it didn't survive long enough."\n\n"Eleven of the twelve were Synced. Thirty seconds before the drones arrived, they stopped. A firmware update pushed across the district that night." She looks at you steady. "The one who wasn't Synced fought until the end. That's on the footage too. That's the part they're most afraid of."\n\nShe looks at you. "You look like someone with reasons."`;
        },
        choices: (c) => [
          { id: 'take',     label: 'Tell me where.',            available: true, next: 'mid' },
          { id: 'personal', label: 'I already know about this.', available: c.backstory === 'witness', next: 'mid_witness', effect: { reputation: { ghosts: 10 } }, tooltip: 'WITNESS backstory' },
          { id: 'negotiate',label: 'What do I get?',            available: c.archetype === 'fixer', next: 'mid_paid', effect: { credits: 200 }, tooltip: 'FIXER: negotiate' },
          { id: 'hack_it',  label: '[HACK] Get me the access codes instead.', available: c.hacking >= 20 || c.archetype === 'netrunner', next: '__hack__', hackConfig: { successNext: 'mid_hacked', failNext: 'mid_hack_fail', hackType: 'story' }, tooltip: 'NETRUNNER: remote access' },
          { id: 'pass',     label: 'Not my problem.',           available: true, next: null },
        ],
      },
      mid: {
        text: () => `The journalist is real. Level 2 corporate, clean enough to be trusted, dirty enough to know what this is worth.\n\nBut when you arrive, you find her door forced open. Axiom cleanup crew — they got there first.\n\nThe footage drive is still there. They missed it because it was formatted as a maintenance chip. Or they left it as bait.`,
        choices: (c) => [
          { id: 'take_risk', label: 'Take the drive. Risk it.',    available: true,   next: 'close_took', effect: { reputation: { axiom: -20 } } },
          { id: 'leave',     label: 'Leave it. Too hot.',          available: true,   next: 'close_left' },
          { id: 'ghost_slip',label: '[GHOST] Scan for surveillance first.',  available: c.archetype === 'ghost', next: 'close_clean', effect: { reputation: { ghosts: 20 } }, tooltip: 'GHOST: recon' },
        ],
      },
      mid_witness: {
        text: (c) => `Nadia's eyes sharpen. "You were there."\n\n"I have a copy."\n\nShe's very still. "Then you don't need me to find anything. You need someone to help you use it." She stands. "The journalist is in Spire Base. I'll get you a clearance ghost — it'll hold for forty minutes. After that you're a trespasser."`,
        choices: (c) => [
          { id: 'go',   label: 'Give me the ghost clearance.',  available: true, next: 'close_clean',   effect: { reputation: { ghosts: 25, axiom: -15 } } },
          { id: 'wait', label: 'Not yet. I need more prep.',    available: true, next: null },
        ],
      },
      mid_paid: {
        text: () => `"Credits? No. Rep." Nadia seems almost amused. "You want to be known as someone who does this kind of work or someone who doesn't. That's the price."\n\nShe gives you the journalist's location and a clearance chip with twenty minutes on it.`,
        choices: (c) => [
          { id: 'go',   label: 'Head to the Spire.',    available: true, next: 'close_clean', effect: { reputation: { ghosts: 15, axiom: -10 } } },
          { id: 'pass', label: 'I\'ll think about it.',  available: true, next: null },
        ],
      },
      mid_hacked: {
        text: (c) => `You pull the access codes remotely. Nadia watches you work, quiet for once.\n\n"That's faster than I expected." A pause. "The drive is in the Spire. But the codes give you remote access to the journalist's broadcast terminal. You can push the footage without going up there."\n\nHigher risk of trace. Higher chance the signal can't be scrubbed.`,
        choices: (c) => [
          { id: 'remote',  label: '[BROADCAST] Push it remotely.', available: true, next: 'close_broadcast', effect: { reputation: { ghosts: 20, axiom: -25 }, credits: 50 }, tooltip: 'NETRUNNER: broadcast' },
          { id: 'physical',label: 'Still go in person.',          available: true, next: 'close_clean', effect: { reputation: { ghosts: 15 } } },
        ],
      },
      mid_hack_fail: {
        text: (c) => `She watches you disconnect. Her face gives nothing away — she's seen people fail before.\n\n"Axiom hardened that relay six months ago. Nobody I know can crack it clean." She refills her glass. "There's another way in. Slower, and it'll cost you. But it'll get done."\n\nShe names a contact. The route is longer, messier, and costs 150¢ to set up. But it leads to the same place.`,
        choices: (c) => [
          { id: 'pay_route', label: 'Pay for the alternative route. (−150¢)', available: c.credits >= 150, next: 'mid', effect: { credits: -150 } },
          { id: 'wait',      label: 'I\'ll come back when I\'m ready.',        available: true, next: null },
        ],
      },
      close_took: {
        text: (c) => `You take the drive and run.\n\nAxiom surveillance pings your position twice before you lose them in the Undernet. You deliver the drive to Nadia. She doesn't ask how hot your trail is.\n\n"It's enough," she says. "That's the word: enough."`,
        reward: { credits: 300, reputation: { ghosts: 15, axiom: -20 } },
        outcome: 'good',
      },
      close_left: {
        text: (c) => `You leave it. The smart move.\n\nNadia doesn't say you were wrong. "The footage is still there. For now. Someone else might move it." She refills her glass. "Or they won't."`,
        reward: { credits: 50 },
        outcome: 'neutral',
      },
      close_clean: {
        text: (c) => c.backstory === 'witness'
          ? `You get in. You deliver the footage. You watch the journalist's face when she realises what she's holding.\n\n"Twelve people," she says.\n\n"I know," you say. "I counted."\n\nThe broadcast goes out thirty-seven minutes later. Axiom scrubs it in six. But six million people saw it first.`
          : `Clean in. Clean out. The journalist gets the footage.\n\nTwo days later a broadcast runs for eleven seconds before Axiom pulls it. That's eleven seconds more than nothing.\n\nNadia doesn't say thank you. She says: "They noticed. That matters."`,
        reward: { credits: 250, reputation: { ghosts: 20, axiom: -15 } },
        outcome: 'good',
      },
      close_broadcast: {
        text: (c) => `The broadcast goes out on seventeen frequencies simultaneously. Axiom traces the signal in eight minutes — fast, but not fast enough.\n\nThe footage is already copied, shared, fragmented across six hundred nodes. You can't un-ring this bell.\n\nYour terminal burns hot for a day. Worth it.`,
        reward: { credits: 50, reputation: { ghosts: 25, axiom: -30 } },
        outcome: 'great',
      },
    },
  },

  doc_mem_trial: {
    id: 'doc_mem_trial',
    npc: 'Doc Mem',
    title: 'TRIAL DATA',
    acts: {
      open: {
        text: (c) => `Doc Membrane is patching someone up when you arrive — doesn't pause, doesn't look up.\n\n"Axiom's running CortexSync trials in the deep Undernet. Not sanctioned. Not standard installation — they're pushing experimental firmware into subjects who don't know they're subjects. Mapping what chronic exposure does to neural architecture when the person can't consent to the protocol or opt out of the updates."\n\nShe finally looks up. "The subjects are sump-level residents. I have twelve names. I need the trial records to treat them properly — and to document what Axiom is doing with Sync hardware when they think no one is watching." A pause. "The records are in a corporate server, Level 2, Spire Base. Your kind of errand."`,
        choices: (c) => [
          { id: 'take',      label: 'I\'ll get them.',           available: true,  next: 'mid' },
          { id: 'debt_hook', label: 'What kind of trials.',      available: c.backstory === 'debt', next: 'mid_debt', effect: { reputation: { medica: 10 } }, tooltip: 'DEBT backstory: personal' },
          { id: 'negotiate', label: 'What do you have to offer?', available: c.archetype === 'fixer', next: 'mid_deal', effect: { credits: 100 }, tooltip: 'FIXER: negotiate payment' },
          { id: 'scan_note', label: '[HACK] What if I copied the records remotely?', available: c.hacking >= 18 || c.archetype === 'netrunner', next: '__hack__', hackConfig: { successNext: 'mid_remote', failNext: 'mid_remote_fail', hackType: 'story' }, tooltip: 'NETRUNNER: remote extraction' },
          { id: 'pass',      label: 'Not my problem.',           available: true,  next: null },
        ],
      },
      mid: {
        text: () => `The server room is exactly where she said. The records load fast — twelve names, full trial logs.\n\nThere's a thirteenth entry. Axiom flagged it priority. It's from a corporate medical facility.\n\nYou recognise the intake date.`,
        choices: (c) => [
          { id: 'take_all', label: 'Take everything. Let Doc sort it.',   available: true, next: c.backstory === 'debt' ? 'close_debt' : 'close_all', effect: { reputation: { axiom: -15 } } },
          { id: 'twelve',   label: 'Take only the twelve names.',         available: true, next: 'close_twelve' },
          { id: 'burn',     label: '[SOLDIER] Burn the trial server.',    available: c.archetype === 'soldier', next: 'close_burned', effect: { reputation: { axiom: -25, medica: 15 } }, tooltip: 'SOLDIER: destroy evidence trail' },
        ],
      },
      mid_debt: {
        text: (c) => `"Neural architecture trials. Long-duration exposure — six months minimum. The body gets used to the poison before it starts to break."\n\nSomething cold runs through you. The intake date at her factory. The way she moves now.\n\n"How long does it take to show symptoms?" you ask.\n\n"Depends on the dose." She meets your eyes. "I have a patient from a Axiom facility worker program. Female, mid-twenties. She's one of my twelve."`,
        choices: (c) => [
          { id: 'go_now', label: 'Give me everything. I\'m going now.',  available: true, next: 'close_debt', effect: { reputation: { medica: 20 }, credits: -100 }, tooltip: 'Debt: your sister' },
          { id: 'careful',label: 'I need to go in careful.',            available: true, next: 'mid' },
        ],
      },
      mid_deal: {
        text: () => `She opens a locked drawer. "Medical-grade antitoxin. Three doses, enough for severe neural poisoning. That's what I have." A pause. "That's also what your twelve subjects need."\n\nShe's already committed. She just needed to know if you were too.`,
        choices: (c) => [
          { id: 'take',  label: 'Deal.',          available: true, next: 'mid', effect: { item: { id:'antitoxin', name:'Neural Antitoxin', effect:'cleanse', value:0, price:0, sell:80, desc:'Medical-grade. Clears all status.', quantity:2 } } },
          { id: 'pass',  label: 'That\'s not enough.', available: true, next: null },
        ],
      },
      mid_remote: {
        text: (c) => `"Remote?" She considers it. "Axiom server is air-gapped. You'd need physical proximity — within twenty metres." A beat. "The loading dock adjacent to Spire Base. If you can get there."\n\nShe gives you a frequency. "I'll handle decryption on my end."`,
        choices: (c) => [
          { id: 'go',  label: 'I can get to the dock.',   available: true, next: c.backstory === 'debt' ? 'close_debt_remote' : 'close_remote', effect: { credits: 100 } },
          { id: 'pass',label: 'Too exposed.',             available: true, next: null },
        ],
      },
      mid_remote_fail: {
        text: (c) => `The extraction drops halfway. Clinical counter-ICE — Axiom's medical division doesn't tolerate intrusions.\n\nDoc doesn't react with surprise. "The server's shielded. I didn't know how well." She looks at you steadily. "You'll need to go in physically. I can get you a two-hour maintenance window. It's not clean, but it's real."`,
        choices: (c) => [
          { id: 'take_physical', label: 'Set up the maintenance window.', available: true, next: 'mid' },
          { id: 'not_yet',       label: 'I need more time.',              available: true, next: null },
        ],
      },
      close_twelve: {
        text: () => `Twelve records. Clean extraction. Doc gets what she needs.\n\n"They're treatable," she says, reading through the data. "All twelve." A long silence. "Thank you."\n\nShe doesn't hand out thank-yous often. You can tell.`,
        reward: { credits: 200, reputation: { medica: 15 }, item: { id:'trauma_kit', name:'Trauma Kit', effect:'heal', value:100, price:0, sell:60, desc:'Restores 100 HP.', quantity:1 } },
        outcome: 'good',
      },
      close_all: {
        text: () => `You bring everything. Doc goes quiet for a long time.\n\n"There's data in here on Axiom's full trial network. Twelve sites. Hundreds of subjects." She sets it down. "This is bigger than twelve people."\n\nShe'll need time to figure out what to do with it. So will you.`,
        reward: { credits: 150, reputation: { medica: 20, axiom: -20 } },
        outcome: 'complex',
      },
      close_burned: {
        text: (c) => `You pull the data and burn the server. Physical wipe — they can't rebuild from backup because there isn't one.\n\nDoc gets her twelve records. Axiom loses eight months of trial data.\n\nShe looks at you differently after. "That was more than I asked for."\n\n"Yes," you say.`,
        reward: { credits: 200, reputation: { medica: 20, axiom: -30 }, item: { id:'antitoxin', name:'Antitoxin', effect:'cleanse', value:0, price:0, sell:40, desc:'Clears status effects.', quantity:2 } },
        outcome: 'great',
      },
      close_debt: {
        text: (c) => `Thirteen records. You read hers last.\n\n"Stage two," Doc says quietly. "That's manageable. If she gets treatment now." She's already loading a syringe. "Bring her here."\n\nYou sit with the data for a long time before you move.`,
        reward: { credits: 100, reputation: { medica: 25 }, special: 'sister_found' },
        outcome: 'great',
      },
      close_debt_remote: {
        text: (c) => `The extraction works. You're twenty metres from the Spire loading dock in the cold, feeding data through a dead-drop relay, and the thirteenth record loads last.\n\nYou read her name.\n\nDoc gets the data. "Stage two," she says. "Manageable." She pauses. "You knew her, didn't you."\n\nYou don't answer.`,
        reward: { credits: 100, reputation: { medica: 25 }, special: 'sister_found' },
        outcome: 'great',
      },
      close_remote: {
        text: () => `Remote extraction, clean signal. Doc gets all twelve records.\n\n"Better than I expected," she says. "Better than most people would have done." She hands you something. "Don't tell anyone where that came from."`,
        reward: { credits: 250, reputation: { medica: 15 }, item: { id:'hack_chip', name:'Biometric Chip', effect:'hack', value:25, price:0, sell:60, desc:'Reduces next hack difficulty.', quantity:1 } },
        outcome: 'good',
      },
    },
  },

  aria_drift: {
    id: 'aria_drift',
    npc: 'Aria',
    title: 'THE DRIFT',
    acts: {
      open: {
        text: (c) => `Aria does not look at you when you approach. She is watching the corridor camera — it is on a loop. She knows exactly how long you have.\n\n"The Sync is still in me. Still updating. I cannot fully verify that the decision to defect was mine and not a product of what the firmware was doing that year."\n\nShe finally looks at you. "I have eighteen months of change logs. Before and after. I have been unable to read them objectively. I need a second opinion from someone with no stake in the answer."`,
        choices: (c) => [
          { id: 'take',      label: "Show me the logs.",           available: true,                              next: 'mid',         tooltip: null },
          { id: 'exile_take',label: "I know what to look for.",    available: c.backstory === 'exile',           next: 'mid_exile',   effect: { credits: 10 }, tooltip: 'EXILE: firmware background' },
          { id: 'scan',      label: "[NETRUNNER] Run your own read.", available: c.archetype === 'netrunner',   next: 'mid_scanned', tooltip: 'NETRUNNER: biometric scan' },
          { id: 'careful',   label: "Why me.",                     available: true,                              next: 'mid_careful', tooltip: null },
          { id: 'pass',      label: "Not my problem.",             available: true,                              next: null,          tooltip: null },
        ],
      },
      mid: {
        text: () => `Eighteen months of preference logs. Before the defection: Axiom performance metrics, loyalty indices, corporate investment patterns. After: Ghost Network alignment signals, anti-corporate positioning, resistance investment. The drift runs in exactly the right direction.\n\nThat is what is wrong with it.\n\n"This looks too much like what someone would write," you say, "if they wanted to demonstrate authentic defection."`,
        choices: (c) => [
          { id: 'authentic', label: "The logs read as genuine.",        available: true, next: 'close_trust',  effect: { credits: 250, reputation: { ghosts: 10 } }, tooltip: null },
          { id: 'staged',    label: "These could have been written.",   available: true, next: 'close_doubt',  effect: { credits: 200, reputation: { ghosts: -5, axiom: -5 } }, tooltip: null },
          { id: 'both',      label: "Both things can be true.",         available: true, next: 'close_both',   effect: { credits: 300, reputation: { ghosts: 15 } }, tooltip: null },
          { id: 'soldier_t', label: "[SOLDIER] This is a trap or a test.", available: c.archetype === 'soldier', next: 'close_direct', effect: { credits: 100, reputation: { ghosts: 15 } }, tooltip: 'SOLDIER: direct read' },
        ],
      },
      mid_exile: {
        text: () => `You read as a firmware writer. You know what the architecture looks like from the inside.\n\nThere it is: a preference reinforcement routine on her post-defection identity. Values are real, but the structural signature shows they were strengthened in ways that do not look spontaneous. Someone ran a routine on her. Possibly Axiom. Possibly she ran it on herself without knowing the mechanism.`,
        choices: (c) => [
          { id: 'tell_full', label: "I tell her everything.",  available: true, next: 'close_exile_full', effect: { credits: 350, reputation: { ghosts: 20 }, special: 'usedBackstoryChoice' }, tooltip: 'Uses your Exile history' },
          { id: 'tell_soft', label: "I give her the shape.",   available: true, next: 'close_both',        effect: { credits: 250, reputation: { ghosts: 10 } }, tooltip: null },
          { id: 'withhold',  label: "I say the logs look genuine.", available: true, next: 'close_trust',  effect: { credits: 200, reputation: { ghosts: 5 } }, tooltip: null },
        ],
      },
      mid_scanned: {
        text: () => `You run a biometric read while she talks. Baseline versus current: cortisol variance, micro-expression latency, autonomic response patterns.\n\nHer stress markers elevate when she describes the defection decision. Not deception markers. The profile of someone who genuinely does not know the answer and is afraid of what it might be.\n\nThe Sync is still updating her. You can see the firmware architecture active in her latency data. She is telling the truth as she understands it. Whether the truth has been written into her is a separate question.`,
        choices: (c) => [
          { id: 'report',    label: "She believes what she is saying.",  available: true, next: 'close_trust', effect: { credits: 280, reputation: { ghosts: 15 } }, tooltip: null },
          { id: 'ambig',     label: "Believing it and it being true are different things.", available: true, next: 'close_both', effect: { credits: 300, reputation: { ghosts: 15 } }, tooltip: null },
        ],
      },
      mid_careful: {
        text: () => `"Because you are not Synced, or you are Synced and extracted, or you are running hardware that is not on Axiom's firmware registry." She pauses. "Either way, you are the only person I have encountered in eight months whose read of me is not itself downstream of Axiom's update architecture."\n\nShe slides the logs across. "That is worth something. Even if your answer is that I am compromised."`,
        choices: (c) => [
          { id: 'take_logs', label: "Fair enough. Let me see them.",   available: true, next: 'mid', tooltip: null },
          { id: 'pass',      label: "Still not interested.",           available: true, next: null,  tooltip: null },
        ],
      },
      close_trust: {
        text: () => `"The Sync is still updating me. Whoever I am, I am choosing this. I want that on record."\n\nShe takes the logs back. Something in her posture has changed — not relief exactly. The quality of attention a problem gets when it has been acknowledged rather than solved.\n\n"That is the most useful thing anyone has said to me in a year."`,
        reward: { credits: 0, reputation: { ghosts: 0 } },
        outcome: 'good',
      },
      close_doubt: {
        text: () => `"I know. I have known for three months." She does not flinch. "Whether I constructed it or Axiom did — if I am still choosing to act on it, does the difference matter?"\n\nShe will keep going regardless. You can see that. The question has stopped being whether she is real and started being what she does with the time she has.`,
        reward: { credits: 0, reputation: { ghosts: 0 } },
        outcome: 'complex',
      },
      close_both: {
        text: () => `"That is the most honest reading anyone has given me."\n\nShe looks like someone who has been handed a problem she can actually work with. Not a resolution. A better problem.\n\n"Maybe the only question that matters is what I do with it."`,
        reward: { credits: 0, reputation: { ghosts: 0 } },
        outcome: 'great',
      },
      close_direct: {
        text: () => `You call it out. Trap or test — frame it and see how she reacts.\n\nShe pauses. "It is neither. But you are right to apply that logic. I would." She slides the logs across anyway. "Read them if you want. The answer does not change what I am doing next."`,
        reward: { credits: 0, reputation: { ghosts: 0 } },
        outcome: 'good',
      },
      close_exile_full: {
        text: () => `You tell her everything. You built some of this architecture. You ran it on yourself too — before you knew what it was, before you found your own change logs and ran.\n\nShe is still for a long time.\n\n"So did I. Or someone did. The question is the same either way."\n\nA long silence. She is not afraid of you. She is the first person you have met who understands the specific shape of what you carry.`,
        reward: { credits: 0, reputation: { ghosts: 0 }, special: 'aria_understood' },
        outcome: 'great',
      },
    },
  },

  kite_trouble: {
    id: 'kite_trouble',
    npc: 'Kite',
    title: 'KITE\'S DEBT',
    acts: {
      open: {
        text: (c) => `Kite is usually in motion. Standing still like this means something is wrong.\n\n"I owe Ironhand three hundred credits. I had a job — message delivery, clean route, should have been nothing. The package got intercepted. I didn't take it. They don't believe me."\n\nShe's fourteen. She keeps her voice flat, which is worse than if she didn't.\n\n"I need someone to tell Ironhand it wasn't me. Or cover the three hundred. Or find the actual interceptor." She meets your eyes. "I can pay back. Slow. But I will."\n\nShe knows the interceptor's route timing down to the minute. She doesn't explain how she knows. She never does.`,
        choices: (c) => [
          { id: 'cover',      label: 'I\'ll cover the three hundred.',              available: c.credits >= 300, next: 'close_paid', effect: { credits: -300, reputation: { ironhand: 10 } }, tooltip: 'Pay her debt' },
          { id: 'talk',       label: 'I\'ll talk to Ironhand.',                     available: true, next: 'mid_talk' },
          { id: 'find',       label: 'Tell me about the interceptor.',              available: true, next: 'mid_find' },
          { id: 'intimidate', label: '[SOLDIER] I\'ll persuade them another way.',  available: c.archetype === 'soldier', next: 'close_soldier', effect: { reputation: { ironhand: -5 }, credits: 0 }, tooltip: 'SOLDIER: intimidate' },
          { id: 'fixer_deal', label: '[FIXER] I know people at Ironhand.',          available: c.archetype === 'fixer', next: 'close_fixer', effect: { reputation: { ironhand: 15 } }, tooltip: 'FIXER: broker deal' },
          { id: 'pass',       label: 'Not my problem.',                             available: true, next: null },
        ],
      },
      mid_talk: {
        text: (c) => `The Ironhand rep is a woman with a scar running from her ear to her chin. She listens to you without expression.\n\n"Kid says it wasn't her. Kid always says it wasn't them." She tilts her head. "Why should I believe you?"\n\nYour reputation precedes you — or it doesn't.`,
        choices: (c) => {
          const rep = c.reputation?.ironhand || 0;
          return [
            { id: 'use_rep', label: rep >= 30 ? 'Because my word is worth something here.' : 'Because it\'s the truth.', available: true, next: rep >= 30 ? 'close_rep_talk' : 'close_failed_talk', tooltip: rep >= 30 ? 'High Ironhand rep' : 'Low rep — risky' },
            { id: 'offer',   label: 'I\'ll owe you one instead.',                                                         available: true, next: 'close_deal_talk', effect: { reputation: { ironhand: -5 } } },
          ];
        },
      },
      mid_find: {
        text: () => `Kite walks you through the route. Three blocks, one checkpoint, a dead man's switch relay at the tunnel entrance. She gives you times to the second without checking anything.\n\nThe Axiom contractor was caught via their own Sync location log — they did not think to mask it. They used the most tracked system in the city to frame her. The ID resolves cleanly: a contractor using Ironhand infrastructure as cover, location-logged by Axiom's own firmware at every step.\n\nThey wanted to make it look like Kite. Their Sync told the story of where they actually were.`,
        choices: (c) => [
          { id: 'expose',  label: 'Bring the evidence to Ironhand.',      available: true, next: 'close_exposed', effect: { reputation: { ironhand: 20, axiom: -10 } } },
          { id: 'sell',    label: '[FIXER] Sell the info to both sides.', available: c.archetype === 'fixer', next: 'close_sold', effect: { credits: 300, reputation: { ironhand: 5 } }, tooltip: 'FIXER: play both sides' },
          { id: 'hold',    label: 'Hold onto it. Use it later.',          available: true, next: 'close_held', effect: { credits: 100 } },
        ],
      },
      close_paid: {
        text: (c) => `You cover the debt. Kite doesn't say thank you — she nods once, the way people do when words would be smaller than the thing.\n\n"I'll pay you back. Half now." She slides across a credchip. "The other half next time I see you."\n\nShe actually pays it.`,
        reward: { credits: 150, reputation: { ironhand: 10 } },
        outcome: 'good',
      },
      close_soldier: {
        text: (c) => `You go to the Ironhand rep and you don't negotiate. You state a fact: "The debt is dropped. The kid walks."\n\nShe stares at you.\n\nYou stare back.\n\n"Alright," she says, after a long time. "But Ironhand remembers this."\n\nThat goes both ways.`,
        reward: { credits: 50, reputation: { ironhand: -5 } },
        outcome: 'neutral',
      },
      close_fixer: {
        text: (c) => `You know someone at Ironhand. More importantly, they know you. Two calls, one favour exchanged, and Kite's debt is restructured into something she can actually pay over six months.\n\nThe Ironhand rep looks impressed despite herself. "You do this for all your strays?"\n\n"Just the ones who are useful," you say.`,
        reward: { credits: 100, reputation: { ironhand: 15 } },
        outcome: 'good',
      },
      close_rep_talk: {
        text: (c) => `The rep weighs it. Your name carries enough weight here.\n\n"Debt cancelled. But she stops running in our territory for a month." She pauses. "And you vouch for her again, it comes back on you."\n\nKite finds out what you did. She doesn't say much. She starts leaving better intel at your usual drop points.`,
        reward: { credits: 100, reputation: { ironhand: 15 } },
        outcome: 'good',
      },
      close_failed_talk: {
        text: (c) => `The rep doesn't buy it. "Come back when you've got something."\n\nYou leave empty-handed. Kite is still in trouble. You'll need a different approach or different leverage.`,
        reward: {},
        outcome: 'fail',
      },
      close_deal_talk: {
        text: (c) => `"You'll owe us one." She nods. "Alright. Kid goes free. But you're on the hook for the three hundred if she runs."\n\nYou carry a debt you didn't earn. That's the city.`,
        reward: { reputation: { ironhand: -5 } },
        outcome: 'complex',
      },
      close_exposed: {
        text: (c) => `Ironhand doesn't like being used as cover by Axiom contractors. The evidence lands like a hammer — including the Sync overlay log showing the contractor actively tracking Kite through the district biometric net while the frame was being built.\n\nKite's debt is cancelled. The Axiom contractor disappears within forty-eight hours — Ironhand business.\n\nKite looks at you: "You actually found them."\n\n"You would have too," you say. "Eventually."`,
        reward: { credits: 200, reputation: { ironhand: 20, axiom: -10 } },
        outcome: 'great',
      },
      close_sold: {
        text: (c) => `You sell the evidence to Ironhand and a copy to an Axiom internal investigator who's quietly building a case against the contractor.\n\nBoth sides pay. Kite goes free. The contractor gets pulled from the field.\n\nIronhand respects you for playing it smart. Axiom's investigator logs you as a useful contact — not an ally, but useful.\n\nNobody asked you to do it cleanly. You just did it profitably, and on both sides of the ledger.`,
        reward: { credits: 350, reputation: { ironhand: 15, axiom: 10 } },
        outcome: 'great',
      },
      close_held: {
        text: (c) => `You keep the intel and pay the three hundred out of pocket.\n\nThe evidence goes in your back pocket. It'll be useful. The kind of useful that compounds.\n\nKite is free. She'll remember.`,
        reward: { credits: 100, reputation: { ironhand: 10 } },
        outcome: 'good',
      },
    },
  },

  // ── MARA SIDEQUEST — THE CORRIDOR ──
  // Meridian's coordinator. She needs something moved through a zone that's
  // been locked down. Doesn't tell you why. You find out on the way.
  mara_setup: {
    id: 'mara_setup',
    npc: 'Mara',
    title: 'THE CORRIDOR',
    acts: {
      open: {
        text: (c) => `Mara doesn't offer you a seat. She's already talking by the time you're through the door.\n\n"Three of my people are stuck in the industrial block. Axiom rolled a lockdown three hours ago — spot inspection, or that's what they're calling it. My people don't have the kind of papers that hold up under a spot inspection."\n\nShe looks at you. "I need a distraction. Something that pulls the checkpoints north for twenty minutes. Enough time for them to move through the maintenance corridor on the south wall."\n\nShe pauses. "I'm not asking you to fight anyone. I'm asking you to be visible in the wrong place at the right time."`,
        choices: (c) => [
          { id: 'take',     label: 'I can do that.',                   available: true,       next: 'mid' },
          { id: 'negotiate',label: 'That\'s worth more than a favour.', available: c.archetype === 'fixer', next: 'mid_paid', effect: { credits: 200 }, tooltip: 'FIXER: name a price' },
          { id: 'scan',     label: '[SCAN] Read what she\'s not saying.', available: c.archetype === 'netrunner', next: 'mid_scanned', tooltip: 'NETRUNNER: biometric read' },
          { id: 'soldier_bait', label: 'I\'ll pull the checkpoint myself.',  available: c.archetype === 'soldier', next: 'mid_soldier', tooltip: 'SOLDIER: force the distraction' },
          { id: 'pass',     label: 'Not my problem.',                   available: true,       next: null },
        ],
      },
      mid: {
        text: (c) => `You move through the industrial block with enough noise to draw eyes — no weapons visible, just presence. Wrong kind of presence. Checkpoints shift north.\n\nThen you hear it. Not running. A child's voice, low and careful, telling someone else to stay quiet.\n\nMara's people aren't three adults. They're a family. Two adults, one kid, maybe eight years old. The kind of people Axiom's lockdown is specifically designed to catch.\n\nThe corridor is still open. You have five minutes.`,
        choices: (c) => [
          { id: 'guide', label: 'Get them through. Personally.',   available: true,       next: 'close_success', effect: { reputation: { meridian: 15 } } },
          { id: 'signal',label: 'Signal Mara. She handles the rest.', available: true,       next: 'close_signal', effect: { reputation: { meridian: 10 } } },
          { id: 'fixer_corridor', label: '[FIXER] I know a guard on this checkpoint.', available: c.archetype === 'fixer', next: 'close_fixer_corridor', effect: { reputation: { meridian: 20 }, credits: -100 }, tooltip: 'FIXER: bribe the checkpoint. Costs 100¢, earns goodwill.' },
          { id: 'abort', label: 'Too complicated. Walk.',            available: true,       next: 'close_abort', effect: { reputation: { meridian: -15 } } },
        ],
      },
      mid_paid: {
        text: (c) => `She doesn't blink. "Two hundred and a route out of this block if things go wrong. Fair." She extends a hand.\n\nSame situation on arrival — the family, the child, the corridor. Your cut is already agreed.`,
        choices: (c) => [
          { id: 'guide', label: 'Get them through.',               available: true, next: 'close_success', effect: { reputation: { meridian: 10 } } },
          { id: 'signal',label: 'Signal Mara.',                    available: true, next: 'close_signal',  effect: { reputation: { meridian: 8 } } },
        ],
      },
      mid_scanned: {
        text: (c) => `Her biometrics are flat. Controlled breathing. Not lying — not exactly. Withholding.\n\n"Three of my people" is accurate. So is everything else she said. What she didn't say is that one of them is someone Axiom specifically wants. Not for enforcement. For something else.\n\nShe doesn't know you read her. You don't tell her.\n\nThe lockdown is real. The corridor is real. You have five minutes.`,
        choices: (c) => [
          { id: 'guide',    label: 'Get them through anyway.',     available: true,       next: 'close_success', effect: { reputation: { meridian: 15 } } },
          { id: 'confront', label: 'Tell her what you know.',      available: true,       next: 'close_confront', effect: { reputation: { meridian: 20 } } },
          { id: 'abort',    label: 'Walk.',                         available: true,       next: 'close_abort', effect: { reputation: { meridian: -15 } } },
        ],
      },
      mid_soldier: {
        text: (c) => `You walk straight into the checkpoint. Not threatening — just enough mass and certainty that the guards have to deal with you instead of the corridor. They ask questions. You have answers. Not convincing answers, but time-consuming ones.\n\nYou buy eleven minutes. The corridor stays open.\n\nWhat comes out the other end isn't what you expected.`,
        choices: (c) => [
          { id: 'guide', label: 'You\'re already here. Get them through.', available: true, next: 'close_success', effect: { reputation: { meridian: 15 } } },
          { id: 'signal',label: 'You\'ve done enough. Signal Mara.',       available: true, next: 'close_signal',  effect: { reputation: { meridian: 10 } } },
        ],
      },
      close_success: {
        text: (c) => `You get them through. The child doesn't make a sound the whole way. You don't know if that's training or exhaustion.\n\nMara meets them on the other side. She looks at you once. Doesn't say anything for a moment.\n\n"I'll remember this," she says finally.\n\nComing from her, that's worth something.`,
        reward: { credits: 250, reputation: { meridian: 20 } },
        outcome: 'great',
      },
      close_signal: {
        text: (c) => `You signal Mara. She has another team on standby — you didn't know that. They move faster than you would have.\n\nThe family gets out. The corridor closes two minutes later.\n\nMara finds you afterward. "Efficient. Thank you."\n\nNot warm. But not nothing.`,
        reward: { credits: 150, reputation: { meridian: 10 } },
        outcome: 'good',
      },
      close_abort: {
        text: (c) => `You walk.\n\nYou don't know what happened to the family. Mara doesn't tell you. She doesn't need to.\n\nNext time you see her, she's civil. Nothing more.`,
        reward: {},
        outcome: 'fail',
      },
      close_fixer_corridor: {
        text: (c) => `You know a guard on the east checkpoint. Not a friend — a contact. You've moved things for them before, small things, nothing that matters. They owe you a blind eye.\n\nOne call. One favour spent. The checkpoint looks north for four minutes.\n\nThe family moves through clean. The child doesn't even know anything happened.\n\nMara finds you afterward. "How?" You don't explain. She doesn't push. "That cost you something," she says. It's not a question.\n\n"Put it on my account," you say.`,
        reward: { credits: 50, reputation: { meridian: 25 } },
        outcome: 'great',
      },
      close_confront: {
        text: (c) => `"You read me."\n\nIt's not a question.\n\n"The person with them — Axiom flagged them eight months ago. Not enforcement. Research division. We don't know what they want them for." She meets your eyes. "That's why I didn't tell you."\n\nYou get them through together. Faster, because now you're both honest about what's at stake.\n\nShe looks at you differently after. "You could have walked with that," she says. "You didn't."\n\n"Neither did you," you say.`,
        reward: { credits: 300, reputation: { meridian: 25 } },
        outcome: 'great',
      },
    },
  },
  // Meridian Acts 2–4 — unlocked sequentially via Mara after mara_setup
  sable_still: {
    id: 'sable_still',
    npc: 'Mara',
    title: 'THE STILL',
    zone: 'ruins',
    acts: {
      open: {
        text: () => `Mara sends you to a ruins contact. Sable. No chrome. No Sync.\n\nYou arrive in time to watch her put down three Synced contractors in eight seconds. Clean, economical, wrong in a way you cannot immediately name. The contractors are fast. She is faster. The Sync gives tactical overlay, millisecond threat processing. She does not have any of that.\n\n"That should not have been possible," you say.\n\nShe does not look surprised that you noticed.`,
        choices: (c) => [
          { id: 'believe',  label: "How.",                                   available: true,                              next: 'mid_believe',  tooltip: null },
          { id: 'skeptical',label: "What am I not seeing here.",             available: true,                              next: 'mid_skeptical',tooltip: null },
          { id: 'scan',     label: "[NETRUNNER] Run a biometric scan.",      available: c.archetype === 'netrunner',       next: 'mid_scan',     tooltip: 'NETRUNNER: biometric read' },
        ],
      },
      mid_believe: {
        text: () => `"The Sync adds processing overhead," she says. "Update checks. Preference logging. Background noise. It is always running." She moves her hand slowly through a guard stance — impossibly precise. "The body has its own processing. The Sync competes with it. I removed the competition."\n\nShe gives you two doses of Clarity compound. "Decide for yourself."`,
        choices: () => [
          { id: 'take',   label: "I will.",   available: true, next: 'close_believe', effect: { item: { id:'clarity_dose', name:'Clarity Compound', effect:'clarity_dose', value:0, price:0, sell:60, desc:'ACC+10 SPD+10 next combat. Somatic sect compound.', quantity:2 }, reputation: { meridian: 15 } }, tooltip: null },
          { id: 'decline',label: "Later.",    available: true, next: 'close_believe', effect: { reputation: { meridian: 10 } }, tooltip: null },
        ],
      },
      mid_skeptical: {
        text: () => `You watch the replay in your memory. Three contractors. Eight seconds. The response latency is wrong — below baseline. Not augmented-human fast. Below baseline. As if processing overhead has been removed.\n\nSable watches you work it out. "You are looking for chrome," she says. "There is none. You are looking for a Sync read. There is none. Start somewhere else."`,
        choices: () => [
          { id: 'accept', label: "All right. Tell me.",   available: true, next: 'mid_believe', tooltip: null },
          { id: 'pass',   label: "I need to think.",      available: true, next: 'close_believe', effect: { reputation: { meridian: 5 } }, tooltip: null },
        ],
      },
      mid_scan: {
        text: () => `Biometric read: response latency at 38ms. Baseline human is 180-250ms. Synced human with tactical overlay is 90-120ms. Sable is at 38ms.\n\nNo augment signatures. No firmware. No Sync architecture at all in the biometric profile. Just a nervous system running without background process interference.\n\nThe data is impossible and entirely real.`,
        choices: () => [
          { id: 'report',  label: "38ms. How long did it take.", available: true, next: 'mid_believe', effect: { reputation: { meridian: 10 } }, tooltip: null },
        ],
      },
      close_believe: {
        text: () => `Sable inclines her head. Not a bow — something more considered. "Either you see it or you do not. I stopped arguing about it."\n\nYou leave with the compound and something harder to categorise.`,
        reward: { credits: 200, reputation: { meridian: 0 } },
        outcome: 'good',
      },
    },
  },

  covenant_ledger: {
    id: 'covenant_ledger',
    npc: 'Mara',
    title: 'THE LEDGER',
    zone: 'safehouse',
    acts: {
      open: {
        text: () => `A contact who does not introduce himself. He gives you a name: Covenant. He gives you a file: Sync logs of a shell — someone who stopped being themselves after finding a server anomaly.\n\nThe logs show: PREFERENCE_REINFORCE_09. A targeted package pushed within 72 hours of anyone who found discrepancies in the Sync data stream. Not a bug fix. A response protocol.\n\n"There is more," he says. "Your own Sync ID was in the queue. Extraction interrupted the delivery."`,
        choices: (c) => [
          { id: 'report_all',  label: "I report everything to Meridian.",   available: true,                              next: 'close_report_all',  effect: { reputation: { meridian: 20, axiom: -20 } }, tooltip: null },
          { id: 'report_part', label: "I report the shell. Keep the rest.", available: true,                              next: 'close_report_part', effect: { reputation: { meridian: 10 } }, tooltip: null },
          { id: 'hack_full',   label: "[HACK] Pull the full manifest.",     available: c.hacking >= 20 || (c.augments||[]).includes('neural_hack'), next: 'hack_manifest', tooltip: 'Requires hacking — triggers minigame' },
        ],
      },
      hack_manifest: {
        text: () => `You pull the full manifest. 47 targeted preference updates. 12 sites. 8 months of protocol. The scale is not surprising. The precision is.\n\nEvery individual who found a data discrepancy. Every one. Axiom has been watching for exactly this kind of discovery.`,
        choices: () => [
          { id: 'deliver', label: "I take everything to Covenant.", available: true, next: 'close_full_manifest', effect: { reputation: { meridian: 25, axiom: -25 } }, tooltip: null },
          { id: 'keep',    label: "I keep a copy and deliver the rest.", available: true, next: 'close_report_all', effect: { reputation: { meridian: 20 } }, tooltip: null },
        ],
      },
      close_report_all: {
        text: () => `Covenant reads through it. "When I report this to the Seat, they will want to meet you. That is not a threat." A pause. "It might become one."\n\nHe slides credits across. You notice he does not ask if you want to meet them.`,
        reward: { credits: 300, reputation: { meridian: 0 } },
        outcome: 'complex',
      },
      close_report_part: {
        text: () => `You give him enough. He does not push for the rest. Either he knows you kept something back, or he respects the choice. You are not sure which.\n\n"The Seat will hear about this. Whether they hear about you depends on what happens next."`,
        reward: { credits: 200, reputation: { meridian: 0 } },
        outcome: 'neutral',
      },
      close_full_manifest: {
        text: () => `You give him everything. He reads the full manifest without expression.\n\n"47 updates. 12 sites. Eight months." He looks up. "The Seat will want to see this. And you. I cannot protect you from that interest. I can tell you it is not hostile." He meets your eyes. "At present."`,
        reward: { credits: 400, reputation: { meridian: 0 } },
        outcome: 'great',
      },
    },
  },

  the_seat: {
    id: 'the_seat',
    npc: 'Mara',
    title: 'THE SEAT',
    zone: 'safehouse',
    acts: {
      open: {
        text: () => `Mara finds you first.\n\n"They have been observing you since before you came to us. I found out later. I am telling you now."\n\nShe hands you a file. Fourteen months of behavioural logs. Your divergence from Sync-predicted behaviour: 91st percentile. The Seat flagged you as significant before you knew Meridian existed.\n\nShe does not apologise. She does not explain further. She just looks at you and waits.`,
        choices: (c) => [
          { id: 'read',      label: "I read the file.",                   available: true, next: 'close_read',      tooltip: null },
          { id: 'confront',  label: "I push back without reading.",       available: true, next: 'close_confront',  tooltip: null },
          { id: 'accept',    label: "I take it without opening it.",      available: true, next: 'close_accept',    tooltip: null },
        ],
      },
      close_read: {
        text: () => `You read it. Fourteen months. Movement patterns, faction interactions, dialogue choices the Seat somehow has logs of. The divergence data is presented without editorial — just numbers. 91st percentile is not framed as a compliment.\n\nYou look up. The Seat explains the divergence rate. What it means. What they intend to do with the knowledge.\n\nThe organisation is warm at ground level and unilateral at the top. Both are real. Neither cancels the other. You sit with that.`,
        reward: { credits: 300, reputation: { meridian: 20 } },
        outcome: 'complex',
      },
      close_confront: {
        text: () => `You push back before opening it. You tell them what they are. Surveillance dressed as mutual aid.\n\n"The difference between us and Axiom," the Seat says, "is what we do with the knowledge."\n\nYou have to sit with that answer. It is not entirely wrong. That is the part that stays with you.`,
        reward: { credits: 200, reputation: { meridian: 10 } },
        outcome: 'neutral',
      },
      close_accept: {
        text: () => `You take the file without opening it. You keep working. You carry the weight of knowing it exists without looking at what it says.\n\nMara watches you leave. You do not see her expression, but you feel her looking at you differently.\n\nYou are not sure whether that is better or worse than if she looked the same.`,
        reward: { credits: 250, reputation: { meridian: 15 } },
        outcome: 'good',
      },
    },
  },
};

// Track active and completed sidequests per run
export let RUN_QUESTS = {}; // questId -> { act, choices, done }
export const resetQuests = () => { RUN_QUESTS = {}; };


