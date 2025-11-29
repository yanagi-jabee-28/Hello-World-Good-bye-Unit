
import { GameEvent } from '../../types';
import { professorBranching } from './branching_details/professor';
import { seniorBranching } from './branching_details/senior';
import { friendBranching } from './branching_details/friend';
import { workBranching } from './branching_details/work';
import { systemBranching } from './branching_details/system';

export const BRANCHING_EVENTS: GameEvent[] = [
  ...professorBranching,
  ...seniorBranching,
  ...friendBranching,
  ...workBranching,
  ...systemBranching
];