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
    target: 'decor-charger',
    icon: '🔌',
  },
  {
    id: 'mission-headphones',
    title: 'Find your headphones.',
    description: 'Locate your headphones in the living room without waking your friend.',
    status: 'NOT_STARTED',
    target: 'decor-headphones',
    icon: '🎧',
  },
  { id: 'mission-snacks', title: 'Get snacks.', description: 'Grab midnight snacks quietly from the kitchen.', status: 'NOT_STARTED', target: 'decor-snacks', icon: '🍪' },
  { id: 'mission-alarm', title: 'Turn off an alarm.', description: 'Silence the ringing phone before it wakes your friend.', status: 'NOT_STARTED', target: 'decor-phone', icon: '⏰' },
  { id: 'mission-keys', title: 'Find your keys.', description: 'Find the keys in the hallway. They are easy to jangle.', status: 'NOT_STARTED', target: 'decor-keys', icon: '🔑' },
  { id: 'mission-escape', title: 'Escape the bedroom.', description: 'Slip out through the bedroom door unnoticed.', status: 'NOT_STARTED', target: 'door-main', icon: '🚪' },
];
