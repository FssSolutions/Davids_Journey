// ScriptureData.js
// All scripture references used in the game.
// Each entry links to a gameplay mechanic, story beat, or dialogue moment.

export const SCRIPTURES = {

  // ── Combat Abilities (memorize verse → unlock power) ──
  combat: [
    {
      id: 'strength_shield',
      reference: '1 Samuel 17:45',
      fullText: 'You come against me with sword and spear and javelin, but I come against you in the name of the LORD Almighty, the God of the armies of Israel, whom you have defied.',
      shortText: 'I come against you in the name of the LORD Almighty.',
      ability: 'Faith Strike',
      abilityDescription: 'Deal double damage. Cannot miss.',
      mechanic: 'player_attack_buff',
      context: 'David declared this before fighting Goliath — confidence rooted not in his own skill but in God\'s name.',
    },
    {
      id: 'strength_and_shield',
      reference: 'Psalm 28:7',
      fullText: 'The LORD is my strength and my shield; my heart trusts in him, and he helps me. My heart leaps for joy, and with my song I praise him.',
      shortText: 'The LORD is my strength and my shield; my heart trusts in him.',
      ability: 'Shield of Faith',
      abilityDescription: 'Block all damage for 3 turns.',
      mechanic: 'player_defense_buff',
      context: 'David wrote this Psalm reflecting on God\'s protection through many trials.',
    },
    {
      id: 'light_path',
      reference: 'Psalm 119:105',
      fullText: 'Your word is a lamp for my feet, a light on my path.',
      shortText: 'Your word is a lamp for my feet, a light on my path.',
      ability: 'Revealed Path',
      abilityDescription: 'Reveals hidden enemies and traps on the map.',
      mechanic: 'reveal_map',
      context: 'Scripture illuminates what is hidden — this verse reminds us that God\'s Word guides us through darkness.',
    },
    {
      id: 'still_waters',
      reference: 'Psalm 23:1-3',
      fullText: 'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
      shortText: 'The LORD is my shepherd, I lack nothing.',
      ability: 'Shepherd\'s Rest',
      abilityDescription: 'Fully restore health and stamina.',
      mechanic: 'player_heal',
      context: 'The most famous Psalm, written by David who literally was a shepherd before becoming a king.',
    },
    {
      id: 'run_not_faint',
      reference: 'Isaiah 40:31',
      fullText: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
      shortText: 'Those who hope in the LORD will renew their strength.',
      ability: 'Eagle\'s Wings',
      abilityDescription: 'Move speed doubled for 30 seconds.',
      mechanic: 'player_speed_buff',
      context: 'A promise of endurance for those who trust God — fitting for David\'s years of running from Saul.',
    },
    {
      id: 'fear_no_evil',
      reference: 'Psalm 23:4',
      fullText: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.',
      shortText: 'Even though I walk through the darkest valley, I will fear no evil.',
      ability: 'Valley Walk',
      abilityDescription: 'Immune to fear and stun effects.',
      mechanic: 'player_immune_fear',
      context: 'The "valley of the shadow of death" — David faced literal valleys of death in battle and on the run from Saul.',
    },
  ],

  // ── Story Dialogue Scriptures (key story beats) ──
  story: [
    {
      id: 'samuel_anointing',
      reference: '1 Samuel 16:7',
      shortText: 'The LORD does not look at the outward appearance, but the LORD looks at the heart.',
      fullText: 'But the LORD said to Samuel, "Do not consider his appearance or his height, for I have rejected him. The LORD does not look at the things people look at. People look at the outward appearance, but the LORD looks at the heart."',
      beat: 'anointing',
      speaker: 'samuel',
      context: 'God telling Samuel not to judge David\'s brothers by appearance when choosing the next king.',
    },
    {
      id: 'david_goliath_declaration',
      reference: '1 Samuel 17:45-47',
      shortText: 'I come against you in the name of the LORD Almighty — for the battle is the LORD\'s.',
      fullText: 'You come against me with sword and spear and javelin, but I come against you in the name of the LORD Almighty, the God of the armies of Israel, whom you have defied. This day the LORD will deliver you into my hands. All those gathered here will know that it is not by sword or spear that the LORD saves — for the battle is the LORD\'s.',
      beat: 'goliath_fight',
      speaker: 'david',
      context: 'David\'s declaration before striking Goliath — his confidence was entirely in God\'s name, not his own skill or weapons.',
    },
    {
      id: 'spare_saul',
      reference: '1 Samuel 24:6',
      shortText: 'The LORD forbid that I should touch His anointed.',
      fullText: 'He said to his men, "The LORD forbid that I should do such a thing to my master, the LORD\'s anointed, or lay my hand on him; for he is the anointed of the LORD."',
      beat: 'spare_saul_cave',
      speaker: 'david',
      context: 'David sparing Saul\'s life in the cave at En Gedi — choosing mercy over revenge when he had every reason not to.',
    },
    {
      id: 'jonathan_covenant',
      reference: '1 Samuel 18:3',
      shortText: 'Jonathan made a covenant with David because he loved him as himself.',
      fullText: 'And Jonathan made a covenant with David because he loved him as himself.',
      beat: 'jonathan_friendship',
      speaker: 'narrator',
      context: 'Jonathan\'s loyalty to David — a model of covenant friendship in Scripture.',
    },
    {
      id: 'nathan_confrontation',
      reference: '2 Samuel 12:7',
      shortText: 'Nathan said to David, "You are the man!"',
      fullText: 'Then Nathan said to David, "You are the man! This is what the LORD, the God of Israel, says..."',
      beat: 'nathan_confronts_david',
      speaker: 'nathan',
      context: 'The prophet Nathan confronting David after Bathsheba — a pivotal moment of accountability.',
    },
    {
      id: 'david_repentance',
      reference: 'Psalm 51:10',
      shortText: 'Create in me a pure heart, O God.',
      fullText: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.',
      beat: 'david_repents',
      speaker: 'david',
      context: 'David\'s prayer of repentance after Nathan\'s confrontation — the core of Psalm 51.',
    },
  ],

  // ── Scripture Memory Mini-Game Pool ──
  memory: [
    {
      id: 'mem_1',
      reference: 'Psalm 23:1',
      fullText: 'The LORD is my shepherd, I lack nothing.',
      blanks: ['shepherd', 'nothing'], // words to fill in
    },
    {
      id: 'mem_2',
      reference: '1 Samuel 16:7',
      fullText: 'The LORD does not look at the things people look at. People look at the outward appearance, but the LORD looks at the heart.',
      blanks: ['outward appearance', 'heart'],
    },
    {
      id: 'mem_3',
      reference: 'Psalm 119:105',
      fullText: 'Your word is a lamp for my feet, a light on my path.',
      blanks: ['lamp', 'light', 'path'],
    },
    {
      id: 'mem_4',
      reference: '1 Samuel 17:47',
      fullText: 'For the battle is the LORD\'s, and he will give all of you into our hands.',
      blanks: ['battle', 'LORD'],
    },
    {
      id: 'mem_5',
      reference: 'Isaiah 40:31',
      fullText: 'Those who hope in the LORD will renew their strength.',
      blanks: ['hope', 'renew', 'strength'],
    },
  ],

  // ── Psalm Journal Entries (unlocked per chapter) ──
  psalms: [
    {
      id: 'psalm_23',
      number: 23,
      title: 'The Lord is My Shepherd',
      unlockChapter: 1,
      lines: [
        'The LORD is my shepherd, I lack nothing.',
        'He makes me lie down in green pastures,',
        'he leads me beside quiet waters,',
        'he refreshes my soul.',
        'He guides me along the right paths for his name\'s sake.',
        'Even though I walk through the darkest valley,',
        'I will fear no evil, for you are with me;',
        'your rod and your staff, they comfort me.',
      ],
      reflectionQuestion: 'David wrote this as a shepherd. What does it mean to trust God as your shepherd today?',
    },
    {
      id: 'psalm_51',
      number: 51,
      title: 'A Prayer of Repentance',
      unlockChapter: 5,
      lines: [
        'Have mercy on me, O God, according to your unfailing love;',
        'according to your great compassion blot out my transgressions.',
        'Wash away all my iniquity and cleanse me from my sin.',
        'Create in me a pure heart, O God,',
        'and renew a steadfast spirit within me.',
        'Do not cast me from your presence',
        'or take your Holy Spirit from me.',
      ],
      reflectionQuestion: 'David sinned greatly but returned to God fully. What does true repentance look like?',
    },
    {
      id: 'psalm_27',
      number: 27,
      title: 'The Lord is My Light',
      unlockChapter: 3,
      lines: [
        'The LORD is my light and my salvation — whom shall I fear?',
        'The LORD is the stronghold of my life — of whom shall I be afraid?',
        'One thing I ask from the LORD, this only do I seek:',
        'that I may dwell in the house of the LORD all the days of my life,',
        'to gaze on the beauty of the LORD and to seek him in his temple.',
        'Wait for the LORD; be strong and take heart and wait for the LORD.',
      ],
      reflectionQuestion: 'David waited years before becoming king. How do you wait on God in seasons of uncertainty?',
    },
  ]
};

export default SCRIPTURES;
