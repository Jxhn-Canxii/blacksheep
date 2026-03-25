export const REACTION_TYPES = [
  { type: 'like',  emoji: '👍', label: 'Resonate' },
  { type: 'love',  emoji: '❤️', label: 'Love'     },
  { type: 'haha',  emoji: '😂', label: 'Haha'     },
  { type: 'wow',   emoji: '😮', label: 'Wow'      },
  { type: 'sad',   emoji: '😢', label: 'Sad'      },
  { type: 'angry', emoji: '🔥', label: 'Burn'     },
] as const;

export type ReactionType = typeof REACTION_TYPES[number]['type'];
