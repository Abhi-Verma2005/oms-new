declare module 'ai' {
  export interface StreamTextParams<M = any> {
    model: any
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
    temperature?: number
    maxTokens?: number
  }
  export interface StreamTextResult {
    textStream: AsyncIterable<string>
  }
  export function streamText<M = any>(params: StreamTextParams<M>): Promise<StreamTextResult>
}

declare module '@ai-sdk/openai' {
  export function createOpenAI(config: { apiKey: string }): (model: string) => any
}


