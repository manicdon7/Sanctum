import { getLocalReframe } from './reframeBank';

/**
 * Pollinations AI Service
 *
 * Text:  https://text.pollinations.ai/{prompt}         (GET, no auth)
 * Chat:  https://text.pollinations.ai/                 (POST with messages array)
 * Image: https://image.pollinations.ai/prompt/{prompt} (GET, no auth)
 */

export class ReframeService {
  /**
   * Generate a compassionate reframe using Pollinations free GET API.
   * Falls back to curated local bank if offline or AI disabled.
   */
  static async generateReframe(
    notes: string,
    _key: Uint8Array | null
  ): Promise<{ text: string; source: 'cloud' | 'local-bank' }> {
    // Always try Pollinations — it's free, no API key required
    try {
      const systemContext =
        'You are a compassionate mental health guide. ' +
        'Reframe this negative thought or challenge into something constructive and warm. ' +
        'Keep it to 1-3 sentences. No therapist jargon. No AI disclaimers.';

      const fullPrompt = `${systemContext}\n\nThought: ${notes}`;
      const encoded = encodeURIComponent(fullPrompt);
      const url = `https://text.pollinations.ai/${encoded}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/plain' },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          return { text: text.trim(), source: 'cloud' };
        }
      }
    } catch (err) {
      console.warn('[ReframeService] Pollinations GET failed, falling back:', err);
    }

    // Local curated bank fallback
    const backup = getLocalReframe();
    return { text: backup.text, source: 'local-bank' };
  }

  /**
   * Generate a daily affirmation using Pollinations GET API.
   */
  static async generateAffirmation(): Promise<string | null> {
    try {
      const prompt =
        'Generate a single-sentence beautiful mental health affirmation for someone seeking peace today. ' +
        'Warm, gentle, under 15 words. No quotes, no intro.';

      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/plain' },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('[ReframeService] Affirmation generation failed:', err);
    }
    return null;
  }

  /**
   * Send a chat message to the Pollinations companion (POST with conversation history).
   */
  static async chat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  ): Promise<string> {
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: 'openai',
          jsonMode: false,
        }),
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('[ReframeService] Companion chat failed:', err);
    }

    return 'I am here with you. Take a slow, deep breath — whatever you are feeling is valid.';
  }

  /**
   * Build an image generation URL using Pollinations image API.
   * Returns the URL directly (can be used as Image source.uri).
   */
  static getImageUrl(prompt: string, width = 400, height = 300): string {
    const encoded = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
  }
}
