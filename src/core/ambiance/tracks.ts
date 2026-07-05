// Ambient Sound Tracks Registry
// Defines all available ambient sounds with their metadata

export interface AmbianceTrack {
  id: string;
  name: string;
  icon: string; // phosphor icon name
  tint: string; // hex color for orb tint
  file: string; // asset path
  loop: boolean;
  category: 'nature' | 'urban' | 'white-noise' | 'instrumental';
}

export const ambianceTracks: AmbianceTrack[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: 'cloud-rain',
    tint: '#6B8CAE',
    file: 'rain.mp3',
    loop: true,
    category: 'nature',
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: 'tree-evergreen',
    tint: '#6B9B7A',
    file: 'forest.mp3',
    loop: true,
    category: 'nature',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: 'waves',
    tint: '#4A90B8',
    file: 'ocean.mp3',
    loop: true,
    category: 'nature',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    icon: 'fire',
    tint: '#C17F3E',
    file: 'fireplace.mp3',
    loop: true,
    category: 'nature',
  },
  {
    id: 'night',
    name: 'Night',
    icon: 'moon',
    tint: '#7A6B9D',
    file: 'night-crickets.mp3',
    loop: true,
    category: 'nature',
  },
  {
    id: 'lofi1',
    name: 'Lo-Fi 1',
    icon: 'vinyl-record',
    tint: '#A8957D',
    file: 'lofi1.mp3',
    loop: true,
    category: 'instrumental',
  },
  {
    id: 'lofi2',
    name: 'Lo-Fi 2',
    icon: 'vinyl-record',
    tint: '#9D8BA8',
    file: 'lofi2.mp3',
    loop: true,
    category: 'instrumental',
  },
];

// Get track by id
export function getTrack(id: string): AmbianceTrack | undefined {
  return ambianceTracks.find(track => track.id === id);
}

// Get tracks by category
export function getTracksByCategory(category: AmbianceTrack['category']): AmbianceTrack[] {
  return ambianceTracks.filter(track => track.category === category);
}

// Main 5 tracks for the room orbs (first 5)
export const roomTracks = ambianceTracks.slice(0, 5);