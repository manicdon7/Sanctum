/**
 * Local reframe bank — 50 context-aware, compassionate reframes.
 * Used by the Growth companion when AI inference is not available.
 *
 * These are NOT platitudes. They are invitations to re-examine,
 * not affirmations that paper over difficulty.
 */

export interface Reframe {
  id: number;
  text: string;
}

export const REFRAMES: Reframe[] = [
  { id: 1, text: "What would you tell a friend who had the same experience? Try saying that to yourself." },
  { id: 2, text: "This didn't land. That's useful information, not a verdict on your worth." },
  { id: 3, text: "One attempt that didn't work is data, not a conclusion. What does it tell you?" },
  { id: 4, text: "You tried. That took something. What did it take from you, and does that count?" },
  { id: 5, text: "What would 'good enough under these circumstances' look like?" },
  { id: 6, text: "Is there something about how you approached this that could shift — not the goal, just the approach?" },
  { id: 7, text: "What would it mean to be curious about this instead of critical?" },
  { id: 8, text: "Is the standard you're holding yourself to one you set, or one you inherited?" },
  { id: 9, text: "Didn't land this time. What would 'this time' tell a more patient version of you?" },
  { id: 10, text: "What is this outcome asking you to pay attention to?" },
  { id: 11, text: "Not every attempt is supposed to work. What if this one was just practice?" },
  { id: 12, text: "What's the smallest true thing you can say about what happened?" },
  { id: 13, text: "How much of what you're feeling right now is about this, and how much is older?" },
  { id: 14, text: "What would it look like to accept that this was hard — and also keep going?" },
  { id: 15, text: "Failure is information wearing a difficult disguise. What's it trying to tell you?" },
  { id: 16, text: "You expected more from yourself. That expectation comes from somewhere meaningful. Where?" },
  { id: 17, text: "What part of this is genuinely in your control? What part isn't?" },
  { id: 18, text: "If this is hard, it's probably because it matters. What matters about it?" },
  { id: 19, text: "What would you need to believe about yourself to try again?" },
  { id: 20, text: "Is 'didn't land' the same as 'can't land'?" },
  { id: 21, text: "What does this outcome protect you from having to believe about yourself?" },
  { id: 22, text: "This went differently than you hoped. What did you learn that you wouldn't have otherwise?" },
  { id: 23, text: "Sometimes the timing is wrong. Is that possible here?" },
  { id: 24, text: "What would rest look like, before trying again?" },
  { id: 25, text: "You're measuring yourself against a future self. That future self also had to live through this moment." },
  { id: 26, text: "What is one genuinely good thing about how you showed up, even if the outcome was hard?" },
  { id: 27, text: "What story are you telling yourself about what this means? Is there another story?" },
  { id: 28, text: "Progress isn't always visible. What invisible progress might have happened here?" },
  { id: 29, text: "What would the kindest and most honest person in your life say about this?" },
  { id: 30, text: "Is there something you're avoiding knowing by staying in frustration with the outcome?" },
  { id: 31, text: "Not every path is straight. What if this is a necessary bend?" },
  { id: 32, text: "How much of your frustration is with the outcome, and how much is with yourself for having hoped?" },
  { id: 33, text: "What does this tell you about what you actually value?" },
  { id: 34, text: "What if 'didn't land' is not a problem to fix but a moment to sit with?" },
  { id: 35, text: "What are you allowed to feel about this, without it meaning anything about your future?" },
  { id: 36, text: "If you couldn't know how it turned out until you tried, was trying still the right choice?" },
  { id: 37, text: "What would you need to let go of to approach this with less weight next time?" },
  { id: 38, text: "The outcome wasn't what you wanted. Your effort was still real." },
  { id: 39, text: "What is one way you could be even slightly more prepared or rested for the next attempt?" },
  { id: 40, text: "Some things take longer than we expect them to. Has that been true for you before?" },
  { id: 41, text: "What assumptions did you bring into this that the outcome is now questioning?" },
  { id: 42, text: "Is there a version of this where you're proud of having tried, regardless of outcome?" },
  { id: 43, text: "What are you more capable of than you were when you first started working toward this?" },
  { id: 44, text: "What would feel like a small, honest step forward from here?" },
  { id: 45, text: "You were braver than the outcome suggests. What did the attempt cost you? Was it worth something?" },
  { id: 46, text: "What would 'I'm allowed to be disappointed without it defining me' feel like right now?" },
  { id: 47, text: "What do you want to remember about how you handled this, looking back later?" },
  { id: 48, text: "Is there a way to honor the attempt without punishing yourself for the outcome?" },
  { id: 49, text: "Where does the feeling that you should have done better come from? Is it yours?" },
  { id: 50, text: "This is a chapter, not the ending. What does this chapter teach you for the next one?" },
];

/**
 * Returns a random reframe from the local bank.
 * In the future, will be replaced with llama.rn context-aware generation.
 */
export function getLocalReframe(): Reframe {
  const idx = Math.floor(Math.random() * REFRAMES.length);
  return REFRAMES[idx] ?? REFRAMES[0]!;
}
