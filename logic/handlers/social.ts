import { Draft } from 'immer';
import { GameState, RelationshipId, SubjectId, ItemId, GameEventEffect, TimeSlot } from '../../types';
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
const applySocialCost = (draft: Draft<GameState>): void => {
  applyEffect(draft, { satiety: -SATIETY_CONSUMPTION.SOCIAL });
};

export const handleAskProfessor = (draft: Draft<GameState>): void => {
  // Apply base social cost first
  applySocialCost(draft);

  // Gift handling
  if ((draft.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
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

    const messages = applyEffect(draft, effect);
    pushLog(draft, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を教授室に持参した。\n${rewardLog}\n(${joinMessages(messages, ', ')})`, 'success');
    return;
  }

  // Menu Event Trigger (Daytime only)
  const isNight = draft.timeSlot === TimeSlot.NIGHT || draft.timeSlot === TimeSlot.LATE_NIGHT;
  if (!isNight && draft.relationships[RelationshipId.PROFESSOR] >= 60) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'prof_interaction_menu');
    if (menuEvent) {
      recordEventOccurrence(draft, menuEvent.id);
      draft.pendingEvent = menuEvent;
      return;
    }
  }

  // Default Event
  const prevRel = draft.relationships[RelationshipId.PROFESSOR];
  executeEvent(draft, 'action_professor', ACTION_LOGS.SOCIAL.PROF_ABSENT);
  const currentRel = draft.relationships[RelationshipId.PROFESSOR];
  
  // Passive bonus check
  if (currentRel > prevRel) {
      if (rng.chance(30)) {
          const subIds = Object.values(SubjectId);
          const target = rng.pick(subIds)!;
          // Apply small bonus directly
          applyEffect(draft, { knowledge: { [target]: 3 } });
      }
  }
};

export const handleAskSenior = (draft: Draft<GameState>): void => {
  // Apply base social cost
  applySocialCost(draft);

  // Gift handling
  if ((draft.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    let receivedItem = ItemId.BLACK_COFFEE;
    const rand = rng.random();
    if (rand < 0.3) receivedItem = ItemId.USB_MEMORY;
    else if (rand < 0.6) receivedItem = ItemId.REFERENCE_BOOK;
    else receivedItem = ItemId.ENERGY_DRINK;

    // REMOVED: Check preventing duplicate USB
    // if (receivedItem === ItemId.USB_MEMORY && currentState.flags.hasPastPapers) { ... }

    const effect: GameEventEffect = {
      inventory: { 
        [ItemId.GIFT_SWEETS]: -1,
        [receivedItem]: 1
      },
      relationships: { [RelationshipId.SENIOR]: 25 },
      sanity: 10
    };

    const messages = applyEffect(draft, effect);
    pushLog(draft, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を差し入れた。先輩は上機嫌だ！\n「おっ、気が利くな！これやるよ」とお返しを貰った。\n(${joinMessages(messages, ', ')})`, 'success');
    return;
  }

  // Menu Event
  if (draft.relationships[RelationshipId.SENIOR] >= 50) {
    const menuEventOriginal = ALL_EVENTS.find(e => e.id === 'senior_interaction_menu');
    if (menuEventOriginal) {
      const menuEvent = JSON.parse(JSON.stringify(menuEventOriginal));
      const pastPaperOpt = menuEvent.options?.find((o: any) => o.id === 'opt_senior_past_paper');
      
      if (pastPaperOpt) {
        // UPDATED: Simplified logic to always allow trying for papers, but varying results
        const rand = rng.random();
        
        if (rand < 0.4) {
           pastPaperOpt.successLog = "「しょうがねぇなぁ」秘蔵のフォルダを共有してくれた。神データだ！";
           // successEffect is defined in events/branching.ts and gives USB_MEMORY
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

      recordEventOccurrence(draft, menuEvent.id);
      draft.pendingEvent = menuEvent;
      return;
    }
  }

  executeEvent(draft, 'action_senior', ACTION_LOGS.SOCIAL.SENIOR_ABSENT);

  if (draft.eventHistory[0] === 'senior_past_exam') {
    draft.flags.hasPastPapers = (draft.flags.hasPastPapers || 0) + 1;
  }
};

export const handleRelyFriend = (draft: Draft<GameState>): void => {
  // Apply base social cost
  applySocialCost(draft);

  if (draft.relationships[RelationshipId.FRIEND] >= 40) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'friend_interaction_menu');
    if (menuEvent) {
      recordEventOccurrence(draft, menuEvent.id);
      draft.pendingEvent = menuEvent;
      return;
    }
  }

  executeEvent(draft, 'action_friend', ACTION_LOGS.SOCIAL.FRIEND_BUSY);

  if (draft.eventHistory[0] === 'friend_cloud_leak') {
    draft.flags.hasPastPapers = (draft.flags.hasPastPapers || 0) + 1;
  }
};