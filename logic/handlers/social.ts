
import { GameState, RelationshipId, SubjectId, ItemId } from '../../types';
import { clamp } from '../../utils/common';
import { joinMessages } from '../../utils/logFormatter';
import { LOG_TEMPLATES, ACTION_LOGS } from '../../data/constants/logMessages';
import { executeEvent, recordEventOccurrence } from '../eventManager';
import { pushLog } from '../stateHelpers';
import { ITEMS } from '../../data/items';
import { SUBJECTS } from '../../data/subjects';
import { ALL_EVENTS } from '../../data/events';
import { KNOWLEDGE_GAINS, REL_GAINS } from '../../config/gameBalance';

export const handleAskProfessor = (state: GameState): GameState => {
  if ((state.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    state.inventory[ItemId.GIFT_SWEETS] = (state.inventory[ItemId.GIFT_SWEETS] || 0) - 1;
    
    const relBonus = 25;
    const sanityBonus = 15;
    
    state.relationships[RelationshipId.PROFESSOR] = clamp(state.relationships[RelationshipId.PROFESSOR] + relBonus, 0, 100);
    state.sanity = clamp(state.sanity + sanityBonus, 0, state.maxSanity);

    let rewardLog = "";
    const messages = [
        LOG_TEMPLATES.PARAM.RELATIONSHIP('教授友好度', relBonus),
        LOG_TEMPLATES.PARAM.SAN(sanityBonus)
    ];

    if (Math.random() < 0.4) {
        state.inventory[ItemId.REFERENCE_BOOK] = (state.inventory[ItemId.REFERENCE_BOOK] || 0) + 1;
        rewardLog = "「ほう、気が利くね。これ、昔書いた本だが役に立つはずだ」";
        messages.push(LOG_TEMPLATES.ITEM.GET(ITEMS[ItemId.REFERENCE_BOOK].name));
    } else {
        const subIds = Object.values(SubjectId);
        const target = subIds[Math.floor(Math.random() * subIds.length)];
        const kDelta = 15;
        state.knowledge[target] = clamp(state.knowledge[target] + kDelta, 0, 100);
        rewardLog = "「いい茶菓子だ。特別に試験のヒントを教えよう」";
        messages.push(LOG_TEMPLATES.PARAM.KNOWLEDGE(SUBJECTS[target].name, kDelta));
    }

    pushLog(state, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を教授室に持参した。\n${rewardLog}\n(${joinMessages(messages, ', ')})`, 'success');
    return state;
  }

  if (state.relationships[RelationshipId.PROFESSOR] >= 60) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'prof_interaction_menu');
    if (menuEvent) {
      const recordedState = recordEventOccurrence(state, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  const newState = executeEvent(state, 'action_professor', ACTION_LOGS.SOCIAL.PROF_ABSENT);
  
  if (newState.relationships[RelationshipId.PROFESSOR] > state.relationships[RelationshipId.PROFESSOR]) {
      if (Math.random() < 0.3) {
          const subIds = Object.values(SubjectId);
          const target = subIds[Math.floor(Math.random() * subIds.length)];
          newState.knowledge[target] = clamp(newState.knowledge[target] + 3, 0, 100);
      }
  }
  return newState;
};

export const handleAskSenior = (state: GameState): GameState => {
  if ((state.inventory[ItemId.GIFT_SWEETS] || 0) > 0) {
    state.inventory[ItemId.GIFT_SWEETS] = (state.inventory[ItemId.GIFT_SWEETS] || 0) - 1;
    
    const relBonus = 25;
    const sanityBonus = 10;
    let receivedItem = ItemId.BLACK_COFFEE;
    if (Math.random() < 0.3) receivedItem = ItemId.USB_MEMORY;
    else if (Math.random() < 0.6) receivedItem = ItemId.REFERENCE_BOOK;
    else receivedItem = ItemId.ENERGY_DRINK;

    if (receivedItem === ItemId.USB_MEMORY && state.flags.hasPastPapers) {
        receivedItem = ItemId.ENERGY_DRINK; 
    }

    state.relationships[RelationshipId.SENIOR] = clamp(state.relationships[RelationshipId.SENIOR] + relBonus, 0, 100);
    state.sanity = clamp(state.sanity + sanityBonus, 0, state.maxSanity);
    state.inventory[receivedItem] = (state.inventory[receivedItem] || 0) + 1;

    const details = joinMessages([
        LOG_TEMPLATES.PARAM.RELATIONSHIP('先輩友好度', relBonus),
        LOG_TEMPLATES.PARAM.SAN(sanityBonus),
        LOG_TEMPLATES.ITEM.GET(ITEMS[receivedItem].name)
    ], ', ');

    pushLog(state, `【贈答】${ITEMS[ItemId.GIFT_SWEETS].name}を差し入れた。先輩は上機嫌だ！\n「おっ、気が利くな！これやるよ」とお返しを貰った。\n(${details})`, 'success');
    return state;
  }

  if (state.relationships[RelationshipId.SENIOR] >= 50) {
    const menuEventOriginal = ALL_EVENTS.find(e => e.id === 'senior_interaction_menu');
    if (menuEventOriginal) {
      const menuEvent = JSON.parse(JSON.stringify(menuEventOriginal));
      
      const pastPaperOpt = menuEvent.options?.find((o: any) => o.id === 'opt_senior_past_paper');
      
      if (pastPaperOpt) {
        if (state.flags.hasPastPapers) {
           const rand = Math.random();
           if (rand < 0.5) {
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
           const rand = Math.random();
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

      const recordedState = recordEventOccurrence(state, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  const newState = executeEvent(state, 'action_senior', ACTION_LOGS.SOCIAL.SENIOR_ABSENT);

  if (newState.eventHistory[0] === 'senior_past_exam') {
    newState.flags.hasPastPapers = true;
  }

  return newState;
};

export const handleRelyFriend = (state: GameState): GameState => {
  if (state.relationships[RelationshipId.FRIEND] >= 40) {
    const menuEvent = ALL_EVENTS.find(e => e.id === 'friend_interaction_menu');
    if (menuEvent) {
      const recordedState = recordEventOccurrence(state, menuEvent.id);
      recordedState.pendingEvent = menuEvent;
      return recordedState;
    }
  }

  const newState = executeEvent(state, 'action_friend', ACTION_LOGS.SOCIAL.FRIEND_BUSY);

  if (newState.eventHistory[0] === 'friend_cloud_leak') {
    newState.flags.hasPastPapers = true;
  }

  return newState;
};
