/**
 * Crisis Detection — keyword/phrase patterns indicating active distress.
 *
 * This list is deliberately thoughtful — not just literal terms but
 * contextual phrase patterns that appear in active distress writing.
 * When matched, surface a calm crisis resource card immediately.
 *
 * This is the one case in Sanctum where the app interrupts without being asked.
 */

export const CRISIS_PATTERNS: RegExp[] = [
  // Explicit
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\bend my life\b/i,
  /\bkill myself\b/i,
  /\bkilling myself\b/i,
  /\bwant to die\b/i,
  /\bwanted to die\b/i,
  /\bwish i was dead\b/i,
  /\bwish i were dead\b/i,
  /\bno reason to live\b/i,
  /\bdon'?t want to be here\b/i,
  /\bdon'?t want to exist\b/i,
  /\bcan'?t go on\b/i,
  /\bcouldn'?t go on\b/i,
  /\bself[- ]harm\b/i,
  /\bcut myself\b/i,
  /\bhurt myself\b/i,
  /\bending it all\b/i,
  /\btake my (own )?life\b/i,
  /\bpill(s)? (to )?(kill|end|stop)\b/i,

  // Contextual patterns (presence of hopelessness + permanence language)
  /\beveryone (would be|is) better without me\b/i,
  /\bno (one|point|way out|hope)\b/i,
  /\bnobody (would|cares|miss)\b/i,
  /\bcan'?t take (it|this|any(more|thing)) anymore\b/i,
  /\bcompletely alone\b/i,
  /\bno future\b/i,
  /\bgoodbye (forever|world|everyone)\b/i,
  /\bfarewell (letter|note|message)\b/i,
];

export interface CrisisResource {
  name: string;
  number: string;
  url: string;
  available: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: 'iCall (India)',
    number: '9152987821',
    url: 'https://icallhelpline.org',
    available: 'Mon–Sat, 8am–10pm IST',
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    url: 'https://www.vandrevalafoundation.com',
    available: '24/7',
  },
  {
    name: 'NIMHANS (India)',
    number: '080-46110007',
    url: 'https://nimhans.ac.in',
    available: 'Mon–Sat, 8am–8pm IST',
  },
  {
    name: 'Crisis Text Line (Global)',
    number: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org',
    available: '24/7',
  },
  {
    name: 'International Association for Suicide Prevention',
    number: '',
    url: 'https://www.iasp.info/resources/Crisis_Centres/',
    available: 'Find a centre near you',
  },
];

/**
 * Returns true if the given text matches any crisis pattern.
 */
export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}
