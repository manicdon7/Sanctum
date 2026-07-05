export interface MoodState {
  key: string;
  emoji: string;
  label: string;
  value: number; // 1-5
  color: string;
}

export const MOODS: MoodState[] = [
  { key: 'devastated', emoji: '😔', label: 'Heavy', value: 1, color: '#7B9BAF' },
  { key: 'sad', emoji: '😕', label: 'Low', value: 2, color: '#9B7FB6' },
  { key: 'neutral', emoji: '😐', label: 'Okay', value: 3, color: '#9E9389' },
  { key: 'good', emoji: '🙂', label: 'Good', value: 4, color: '#7A9E7E' },
  { key: 'joyful', emoji: '😄', label: 'Light', value: 5, color: '#D4903A' },
];
