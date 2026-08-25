import type { Mission } from '../types';

export const INITIAL_MISSION: Mission = {
  id: 'mission-water',
  title: 'Get a glass of water.',
  description: 'Get a glass of water without waking your friend.',
  status: 'IN_PROGRESS',
  target: 'decor-glass',
  icon: '🥤',
};

/**
 * Registry of available missions for future progression.
 */
export const AVAILABLE_MISSIONS: Mission[] = [
  INITIAL_MISSION,
  {
    id: 'mission-charger',
    title: 'Get your phone charger.',
    description: 'Find your phone charger on the desk quietly.',
    status: 'NOT_STARTED',
    target: 'desk-main',
    icon: '🔌',
  },
  {
    id: 'mission-snacks',
    title: 'Get snacks from the room.',
    description: 'Grab the midnight snacks without creaking the floorboards.',
    status: 'NOT_STARTED',
    target: 'bookshelf',
    icon: '🍪',
  },
];
