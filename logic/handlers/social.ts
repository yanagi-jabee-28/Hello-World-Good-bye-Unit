
import { GameState, RelationshipId, SubjectId, ItemId, GameEventEffect } from '../../types';
import { clamp } from '../../utils/common';
import { joinMessages } from '../../utils/logFormatter';
import { LOG_TEMPLATES, ACTION_LOGS } from '../../data/constants/logMessages';
import { executeEvent, recordEventOccurrence, applyEventEffect } from '../eventManager';
import { pushLog } from '../stateHelpers';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { ALL_EVENTS } from '../../data/events';
import { KNOWLEDGE_GAINS, REL_GAINS } from '../../config/gameBalance';
import { SATIETY_CONSUMPTION } from '../../config/gameConstants';
import { rng } from '../../utils/rng';
import { applyEffect, mergeEffects } from '../effectProcessor';

// Helper to apply default social satiety cost
const applySocialCost = (state: GameState): GameState => {
  const { newState } = applyEffect(state, { satiety: -SATIETY_CONSUMPTION.SOCIAL });
  return newState;
};

export const handleAskProfessor = (state: GameState): GameState => {
  // Apply base social cost first
  let currentState = applySocialCost(state);

  // Gift handling
  if ((currentState.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    let effect: GameEventEffect = {
      inventory: { [ItemId.GIFT_SWEETS]: -1 },
      relationships: { [RelationshipId.PROFESSOR]: 25 },
      sanity: 15
    };

    let rewardLog = "";

    if (rng.chance(40)) {
        effect.inventory![ItemId.REFERENCE_BOOK] = 1;
        rewardLog = "「ほう、気が利くね。これ、昔書いた本だが役に立つはずだ」";
    } else {
        const subIds = Object.values(SubjectId);
        const target = rng.pick(subIds)!;
        effect.knowledge = { [target]: 15 };
        rewardLog = "「いい茶菓子だ。特別に試験のヒントを教えよう」";
    }

    const { newState, messages } = applyEffect(currentState, effect);
    pushLog(newState, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を教授室に持参した。\n${rewardLog}\n(${joinMessages(messages, ', ')})`, 'success');
    return newState;
  }

  // Menu Event Trigger
  if (currentState.relationships[RelationshipId.PROFESSOR] >= 60) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'prof_interaction_menu');
    if (menuEvent) {
      const recordedState = recordEventOccurrence(currentState, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  // Default Event
  const newState = executeEvent(currentState, 'action_professor', ACTION_LOGS.SOCIAL.PROF_ABSENT);
  
  // Passive bonus check
  if (newState.relationships[RelationshipId.PROFESSOR] > currentState.relationships[RelationshipId.PROFESSOR]) {
      if (rng.chance(30)) {
          const subIds = Object.values(SubjectId);
          const target = rng.pick(subIds)!;
          // Apply small bonus directly
          const { newState: finalState } = applyEffect(newState, { knowledge: { [target]: 3 } });
          return finalState;
      }
  }
  return newState;
};

export const handleAskSenior = (state: GameState): GameState => {
  // Apply base social cost
  let currentState = applySocialCost(state);

  // Gift handling
  if ((currentState.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    let receivedItem = ItemId.BLACK_COFFEE;
    const rand = rng.random();
    if (rand < 0.3) receivedItem = ItemId.USB_MEMORY;
    else if (rand < 0.6) receivedItem = ItemId.REFERENCE_BOOK;
    else receivedItem = ItemId.ENERGY_DRINK;

    if (receivedItem === ItemId.USB_MEMORY && currentState.flags.hasPastPapers) {
        receivedItem = ItemId.ENERGY_DRINK; 
    }

    const effect: GameEventEffect = {
      inventory: { 
        [ItemId.GIFT_SWEETS]: -1,
        [receivedItem]: 1
      },
      relationships: { [RelationshipId.SENIOR]: 25 },
      sanity: 10
    };

    const { newState, messages } = applyEffect(currentState, effect);
    pushLog(newState, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を差し入れた。先輩は上機嫌だ！\n「おっ、気が利くな！これやるよ」とお返しを貰った。\n(${joinMessages(messages, ', ')})`, 'success');
    return newState;
  }

  // Menu Event
  if (currentState.relationships[RelationshipId.SENIOR] >= 50) {
    const menuEventOriginal = ALL_EVENTS.find(e => e.id === 'senior_interaction_menu');
    if (menuEventOriginal) {
      const menuEvent = JSON.parse(JSON.stringify(menuEventOriginal));
      const pastPaperOpt = menuEvent.options?.find((o: any) => o.id === 'opt_senior_past_paper');
      
      if (pastPaperOpt) {
        if (currentState.flags.hasPastPapers) {
           if (rng.chance(50)) {
              pastPaperOpt.successEffect = {
                inventory: { [ItemId.REFERENCE_BOOK]: 1 },
                knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.MEDIUM },
                relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
              };
              pastPaperOpt.successLog = "「過去問はもう持ってるだろ？これでも読んどけ」と参考書を貸してくれた。";
           } else {
              pastPaperOpt.successEffect = {
                inventory: { [ItemId.ENERGY_DRINK]: 2 },
                relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
              };
              pastPaperOpt.successLog = "「データは渡したろ？あとは気合だ」エナドリを2本押し付けられた。";
           }
        } else {
           const rand = rng.random();
           if (rand < 0.4) {
              pastPaperOpt.successLog = "「しょうがねぇなぁ」秘蔵のフォルダを共有してくれた。神データだ！";
           } 
           else if (rand < 0.7) {
              pastPaperOpt.successEffect = {
                inventory: { [ItemId.REFERENCE_BOOK]: 1 },
                knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.MEDIUM },
                relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
              };
              pastPaperOpt.successLog = "「これやるよ。俺にはもう不要だからな」使い込まれた参考書を譲り受けた！";
           } 
           else if (rand < 0.9) {
              pastPaperOpt.successEffect = {
                inventory: { [ItemId.ENERGY_DRINK]: 1, [ItemId.HOT_EYE_MASK]: 1 },
                relationships: { [RelationshipId.SENIOR]: REL_GAINS.Qm }
              };
              pastPaperOpt.successLog = "「過去問はないけど、これで気合入れろよ」差し入れを貰った。";
           } 
           else {
              pastPaperOpt.successEffect = {
                knowledge: { [SubjectId.CIRCUIT]: KNOWLEDGE_GAINS.HUGE },
                relationships: { [RelationshipId.SENIOR]: REL_GAINS.MEDIUM }
              };
              pastPaperOpt.successLog = "「データは無いけど、ここ絶対出るぞ」先輩がノートを見せてくれた。";
           }
        }
      }

      const recordedState = recordEventOccurrence(currentState, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  const newState = executeEvent(currentState, 'action_senior', ACTION_LOGS.SOCIAL.SENIOR_ABSENT);

  if (newState.eventHistory[0] === 'senior_past_exam') {
    newState.flags.hasPastPapers = true;
  }

  return newState;
};

export const handleRelyFriend = (state: GameState): GameState => {
  // Apply base social cost
  let currentState = applySocialCost(state);

  if (currentState.relationships[RelationshipId.FRIEND] >= 40) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'friend_interaction_menu');
    if (menuEvent) {
      const recordedState = recordEventOccurrence(currentState, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  const newState = executeEvent(currentState, 'action_friend', ACTION_LOGS.SOCIAL.FRIEND_BUSY);

  if (newState.eventHistory[0] === 'friend_cloud_leak') {
    newState.flags.hasPastPapers = true;
  }

  return newState;
};
