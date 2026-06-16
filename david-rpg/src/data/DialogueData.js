// DialogueData.js
// All NPC conversations and branching story dialogue.
// Structured as trees: each node has text, speaker, and optional choices.

export const DIALOGUES = {

  samuel_arrives: {
    id: 'samuel_arrives',
    nodes: [
      {
        id: 'start',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'Peace be with you. I have come to make a sacrifice to the LORD. Consecrate yourselves and come with me.',
        next: 'jesse_speaks'
      },
      {
        id: 'jesse_speaks',
        speaker: 'Jesse',
        portrait: 'jesse',
        text: 'My sons — Eliab, Abinadab, Shammah — they stand before you, Samuel.',
        next: 'samuel_rejects_eliab'
      },
      {
        id: 'samuel_rejects_eliab',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'Eliab is tall and strong... and yet the LORD says no. He does not look as man looks.',
        scriptureId: 'samuel_anointing',
        next: 'samuel_asks_jesse'
      },
      {
        id: 'samuel_asks_jesse',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'Are these all the sons you have?',
        next: 'jesse_mentions_david'
      },
      {
        id: 'jesse_mentions_david',
        speaker: 'Jesse',
        portrait: 'jesse',
        text: 'There is still the youngest. He is tending the sheep.',
        next: 'samuel_commands'
      },
      {
        id: 'samuel_commands',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'Send for him. We will not sit down until he arrives.',
        next: 'david_enters'
      },
      {
        id: 'david_enters',
        speaker: 'Narrator',
        portrait: null,
        text: 'David came in from the fields — ruddy, with a fine appearance and handsome features. The LORD said: "Rise and anoint him. This is the one."',
        scriptureId: 'samuel_anointing',
        next: 'samuel_anoints'
      },
      {
        id: 'samuel_anoints',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'David, son of Jesse. The LORD has chosen you.',
        choices: [
          {
            text: '"Why me? I am only a shepherd."',
            next: 'david_humble',
            heartEffect: +1
          },
          {
            text: '"I am ready. What must I do?"',
            next: 'david_eager',
            heartEffect: 0
          },
        ]
      },
      {
        id: 'david_humble',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'That is exactly why. God does not choose the proud. He chooses the faithful. And you have been faithful with the sheep.',
        next: 'anointing_complete'
      },
      {
        id: 'david_eager',
        speaker: 'Samuel',
        portrait: 'samuel',
        text: 'Patience, young David. A king is not made in a day. God\'s timing is perfect. Trust in that.',
        next: 'anointing_complete'
      },
      {
        id: 'anointing_complete',
        speaker: 'Narrator',
        portrait: null,
        text: 'Samuel took the horn of oil and anointed David in the presence of his brothers, and from that day on the Spirit of the LORD came powerfully upon David.',
        scriptureId: null,
        next: null, // end of dialogue
        trigger: 'unlock_psalm_23'
      },
    ]
  },

  valley_soldiers: {
    id: 'valley_soldiers',
    nodes: [
      {
        id: 'start',
        speaker: 'Israelite Soldier',
        portrait: 'israelite_soldier',
        text: 'You there — shepherd boy. Keep your head down. For forty days that giant has come out, morning and evening, and roared the same challenge. Forty days, and not one man of Israel has dared answer.',
        next: 'soldier_fear'
      },
      {
        id: 'soldier_fear',
        speaker: 'Israelite Soldier',
        portrait: 'israelite_soldier',
        text: 'Look at the size of him — bronze from head to foot, a spear like a weaver\'s beam. King Saul has promised great riches, and his own daughter in marriage, to any man who strikes him down. Still we tremble. Still we wait.',
        next: 'eliab'
      },
      {
        id: 'eliab',
        speaker: 'Eliab',
        portrait: 'eliab',
        text: 'David! Why have you come down here? And with whom did you leave those few sheep in the wilderness? I know how conceited your heart is — you came down only to watch the battle.',
        choices: [
          {
            text: '"Now what have I done? Is there not a cause?"',
            next: 'david_resolve',
            heartEffect: +2,
            scriptureHint: '1 Samuel 17:29'
          },
          {
            text: '"...Perhaps you are right, brother. I should not have come."',
            next: 'david_doubt',
            heartEffect: -1
          }
        ]
      },
      {
        id: 'david_doubt',
        speaker: 'Narrator',
        portrait: null,
        text: 'David lowered his eyes — but Goliath\'s mocking voice rolled across the valley once more, and something in his heart would not be still. The LORD who saved him from the lion and the bear had not brought him here only to watch.',
        next: 'david_resolve'
      },
      {
        id: 'david_resolve',
        speaker: 'David',
        portrait: 'david',
        text: 'Who is this uncircumcised Philistine, that he should defy the armies of the living God? Let no one lose heart on account of him. Your servant will go and fight this Philistine.',
        scriptureHint: '1 Samuel 17:26',
        next: null
      }
    ]
  },

  saul_armor: {
    id: 'saul_armor',
    nodes: [
      {
        id: 'start',
        speaker: 'Narrator',
        portrait: null,
        text: 'David\'s words reached the king\'s tent, and Saul sent for him. The young shepherd stood before the troubled king of Israel.',
        next: 'david_volunteers'
      },
      {
        id: 'david_volunteers',
        speaker: 'David',
        portrait: 'david',
        text: 'Let no man\'s heart fail because of him. Your servant will go and fight this Philistine.',
        scriptureHint: '1 Samuel 17:32',
        next: 'saul_doubts'
      },
      {
        id: 'saul_doubts',
        speaker: 'Saul',
        portrait: 'saul',
        text: 'You are not able to go against this Philistine to fight him. You are only a youth — and he has been a man of war from his youth.',
        scriptureHint: '1 Samuel 17:33',
        next: 'david_testimony'
      },
      {
        id: 'david_testimony',
        speaker: 'David',
        portrait: 'david',
        text: 'Your servant has kept his father\'s sheep. When a lion or a bear came and carried off a lamb, I went after it, struck it, and rescued the lamb from its mouth. Your servant has struck down both lion and bear.',
        scriptureHint: '1 Samuel 17:34-36',
        next: 'david_trust'
      },
      {
        id: 'david_trust',
        speaker: 'David',
        portrait: 'david',
        text: 'This uncircumcised Philistine will be like one of them, for he has defied the armies of the living God. The LORD who delivered me from the paw of the lion and the bear will deliver me from the hand of this Philistine.',
        scriptureHint: '1 Samuel 17:37',
        next: 'saul_blesses'
      },
      {
        id: 'saul_blesses',
        speaker: 'Saul',
        portrait: 'saul',
        text: 'Go, and the LORD be with you.',
        scriptureHint: '1 Samuel 17:37',
        next: 'saul_armors'
      },
      {
        id: 'saul_armors',
        speaker: 'Narrator',
        portrait: null,
        text: 'Then Saul clothed David with his own armor. He put a bronze helmet on his head and a coat of mail upon him, and David strapped Saul\'s sword over the armor.',
        scriptureHint: '1 Samuel 17:38',
        next: 'david_removes'
      },
      {
        id: 'david_removes',
        speaker: 'David',
        portrait: 'david',
        text: 'I cannot go with these — I have not tested them. Take them; the LORD will be my armor.',
        scriptureHint: '1 Samuel 17:39',
        next: 'narrator_to_brook'
      },
      {
        id: 'narrator_to_brook',
        speaker: 'Narrator',
        portrait: null,
        text: 'So David put off the armor. He took his staff in his hand and turned toward the brook in the valley — to choose five smooth stones for his shepherd\'s pouch.',
        scriptureHint: '1 Samuel 17:40',
        next: null,
        trigger: 'begin_stone_gathering'
      }
    ]
  },

  goliath_valley_confrontation: {
    id: 'goliath_valley_confrontation',
    nodes: [
      {
        id: 'start',
        speaker: 'Goliath',
        portrait: 'goliath',
        text: 'Am I a dog, that you come at me with sticks? Come here, and I\'ll give your flesh to the birds and the wild animals!',
        next: 'goliath_curses'
      },
      {
        id: 'goliath_curses',
        speaker: 'Goliath',
        portrait: 'goliath',
        text: 'I curse you by my gods, little shepherd. No sword, no spear — only a sling? Today you die, and I will feed your flesh to the ravens!',
        next: 'david_responds'
      },
      {
        id: 'david_responds',
        speaker: 'David',
        portrait: 'david',
        text: 'You come against me with sword and spear and javelin, but I come against you in the name of the LORD Almighty, the God of the armies of Israel, whom you have defied.',
        scriptureId: 'david_goliath_declaration',
        next: 'david_prophecy'
      },
      {
        id: 'david_prophecy',
        speaker: 'David',
        portrait: 'david',
        text: 'This day the LORD will deliver you into my hands. I\'ll strike you down and cut off your head. Today I will give the carcasses of the Philistine army to the birds — and the whole world will know that there is a God in Israel!',
        next: 'david_final_word'
      },
      {
        id: 'david_final_word',
        speaker: 'David',
        portrait: 'david',
        text: 'All those gathered here will know that it is not by sword or spear that the LORD saves — for the battle is the LORD\'s, and he will give all of you into our hands!',
        scriptureId: 'david_goliath_declaration',
        next: null,
        trigger: 'start_goliath_cinematic'
      }
    ]
  },

  jonathan_covenant: {
    id: 'jonathan_covenant',
    nodes: [
      {
        id: 'start',
        speaker: 'Narrator',
        portrait: null,
        text: 'Jerusalem. The cheers of Israel ring in the streets — "Saul has slain his thousands, and David his ten-thousands!" You are summoned to the palace.',
        next: 'jonathan_greets'
      },
      {
        id: 'jonathan_greets',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'David! Your name echoes through all Israel. But it is not your sling arm that impresses me — it is your faith. "I come in the name of the LORD Almighty." I have never heard a man speak like that.',
        next: 'david_replies'
      },
      {
        id: 'david_replies',
        speaker: 'David',
        portrait: 'david',
        text: 'The LORD gave the victory, Jonathan. I was only the stone in His hand.',
        next: 'covenant_offer'
      },
      {
        id: 'covenant_offer',
        speaker: 'Narrator',
        portrait: null,
        text: 'Jonathan loved David as he loved himself. He steps forward and offers his hand in covenant friendship.',
        scriptureId: 'jonathan_covenant',
        next: 'david_covenant_choice'
      },
      {
        id: 'david_covenant_choice',
        speaker: 'David',
        portrait: 'david',
        text: 'Jonathan reaches out his hand. What do you say?',
        choices: [
          {
            text: '"I receive this covenant, before the LORD." (1 Sam 18:3)',
            next: 'covenant_sealed',
            heartEffect: 2,
            scriptureId: 'jonathan_covenant',
            isCorrect: true
          },
          {
            text: '"But you are the prince — I am a shepherd\'s son."',
            next: 'covenant_humility',
            heartEffect: 1
          },
          {
            text: '"What will this covenant require of me?"',
            next: 'covenant_question',
            heartEffect: 0
          }
        ]
      },
      {
        id: 'covenant_humility',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'The LORD does not look at birth or station, David. This bond is not from me — it is sworn before God. It will outlast us both.',
        next: 'covenant_sealed'
      },
      {
        id: 'covenant_question',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'Only faithfulness — to each other\'s households, forever. Sworn before the living God. Nothing more, and nothing less.',
        next: 'covenant_sealed'
      },
      {
        id: 'covenant_sealed',
        speaker: 'Narrator',
        portrait: null,
        text: 'Jonathan stripped off the robe he was wearing and gave it to David, along with his tunic, and even his sword, his bow and his belt. The covenant was sealed.',
        scriptureId: 'jonathan_covenant',
        next: 'saul_watches',
        trigger: 'covenant_with_jonathan'
      },
      {
        id: 'saul_watches',
        speaker: 'Saul',
        portrait: 'saul',
        text: 'David serves well. He stays in my household. I will give him command of a thousand men.',
        next: 'crowds_sing'
      },
      {
        id: 'crowds_sing',
        speaker: 'Narrator',
        portrait: null,
        text: 'But the women sang as David returned from battle: "Saul has slain his thousands, and David his tens of thousands." Saul\'s anger blazed. The Spirit of the LORD had left him, and a harmful spirit — which God permitted — began to torment him.',
        next: 'harp_called'
      },
      {
        id: 'harp_called',
        speaker: 'Saul',
        portrait: 'saul',
        text: 'Bring David to me. Let him play his harp. When the music plays... the darkness lifts.',
        next: null
      }
    ]
  },

  jonathan_warns: {
    id: 'jonathan_warns',
    nodes: [
      {
        id: 'start',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'David — flee! My father means to kill you. Tonight.',
        next: 'david_startled'
      },
      {
        id: 'david_startled',
        speaker: 'David',
        portrait: 'david',
        text: 'Kill me? Why? What have I done? What sin have I committed against your father?',
        next: 'jonathan_explains'
      },
      {
        id: 'jonathan_explains',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'He hurled his spear at you while you played. The music quieted him — but only for a time. His fear has become murderous envy.',
        next: 'jonathan_vows'
      },
      {
        id: 'jonathan_vows',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'I swore before the LORD to protect you. Whatever you need — I will do it. But you must go. The wilderness. Go now.',
        next: 'david_farewell'
      },
      {
        id: 'david_farewell',
        speaker: 'David',
        portrait: 'david',
        text: 'Jonathan... show kindness to my house. As we swore before the LORD — let our covenant stand, whatever comes.',
        next: 'jonathan_swears'
      },
      {
        id: 'jonathan_swears',
        speaker: 'Jonathan',
        portrait: 'jonathan',
        text: 'Go, David. The LORD go with you. Our covenant stands — between you, and me, and our children, forever.',
        next: null
      }
    ]
  },

  spare_saul: {
    id: 'spare_saul',
    nodes: [
      {
        id: 'start',
        speaker: 'Narrator',
        portrait: null,
        text: 'En Gedi. Saul enters a cave alone — not knowing David and his men are hidden in the depths of it.',
        next: 'abishai_urges'
      },
      {
        id: 'abishai_urges',
        speaker: 'Abishai',
        portrait: 'abishai',
        text: 'David — God has delivered your enemy into your hands! Let me pin him to the ground with one thrust. I won\'t strike twice.',
        next: 'player_choice'
      },
      {
        id: 'player_choice',
        speaker: 'David',
        portrait: 'david',
        text: 'What should I do?',
        choices: [
          {
            text: '"The LORD forbid that I should touch His anointed." (1 Sam 24:6)',
            next: 'david_spares',
            heartEffect: +3,
            scriptureId: 'spare_saul',
            isCorrect: true
          },
          {
            text: '"Strike him down. He deserves it."',
            next: 'david_considers_revenge',
            heartEffect: -3,
          },
          {
            text: '"Let\'s flee before he sees us."',
            next: 'david_flees_choice',
            heartEffect: 0,
          }
        ]
      },
      {
        id: 'david_considers_revenge',
        speaker: 'Narrator',
        portrait: null,
        text: 'David\'s hand trembled... but something stopped him. Could he truly lay hands on the LORD\'s anointed?',
        next: 'player_choice' // loop back — let them choose again
      },
      {
        id: 'david_flees_choice',
        speaker: 'Narrator',
        portrait: null,
        text: 'Running away would spare Saul, but David sensed God had him here for a reason — to demonstrate mercy, not fear.',
        next: 'player_choice'
      },
      {
        id: 'david_spares',
        speaker: 'David',
        portrait: 'david',
        text: 'The LORD forbid that I should do such a thing to my master, the LORD\'s anointed, or lay my hand on him.',
        scriptureId: 'spare_saul',
        next: 'cloak_cut'
      },
      {
        id: 'cloak_cut',
        speaker: 'Narrator',
        portrait: null,
        text: 'Instead, David crept forward and cut off a corner of Saul\'s robe. Even so, his conscience struck him for this.',
        next: 'david_conscience'
      },
      {
        id: 'david_conscience',
        speaker: 'David',
        portrait: 'david',
        text: 'The LORD is judge between you and me. He will avenge the wrongs you have done to me. As the old saying goes: "From evildoers come evil deeds." But my hand will not touch you.',
        next: null,
        trigger: 'unlock_psalm_27',
        trigger2: 'heart_meter_major_increase'
      }
    ]
  }
};

export default DIALOGUES;
