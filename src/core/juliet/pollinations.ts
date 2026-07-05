// Pollinations API Client
// Handles streaming chat and web search for Juliet

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamingResponse {
  content: string;
  finished: boolean;
}

class PollinationsClient {
  private baseURL = 'https://text.pollinations.ai/openai';
  
  async *streamChat(
    messages: ChatMessage[],
    model: 'openai' | 'openai-large' = 'openai-large'
  ): AsyncGenerator<StreamingResponse> {
    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield { content, finished: true };
          break;
        }

        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              yield { content, finished: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                content += delta;
                yield { content, finished: false };
              }
            } catch (e) {
              // Skip malformed JSON chunks
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Pollinations streaming error:', error);
      throw error;
    }
  }

  async searchWeb(query: string): Promise<string> {
    // Use Pollinations API for web search by asking it to search
    const searchMessages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a web search assistant. When given a query, search the web and provide a comprehensive, accurate answer based on current information. Cite your sources when possible.',
      },
      {
        role: 'user',
        content: `Search the web for: ${query}`,
      },
    ];

    try {
      let result = '';
      for await (const chunk of this.streamChat(searchMessages, 'openai-large')) {
        result = chunk.content;
        if (chunk.finished) {
          break;
        }
      }
      return result;
    } catch (error) {
      console.error('Web search error:', error);
      return `I couldn't search for that right now — no signal. but i'm still here.`;
    }
  }

  async generateImage(prompt: string): Promise<string> {
    // Simple image generation endpoint
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
  }

  async quickResponse(prompt: string): Promise<string> {
    // For quick, non-streaming responses
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt },
    ];

    try {
      let result = '';
      for await (const chunk of this.streamChat(messages, 'openai')) {
        result = chunk.content;
        if (chunk.finished) {
          break;
        }
      }
      return result;
    } catch (error) {
      console.error('Quick response error:', error);
      throw error;
    }
  }
}

export const pollinations = new PollinationsClient();