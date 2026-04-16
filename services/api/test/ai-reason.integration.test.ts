import { afterEach, describe, expect, it } from 'vitest'
import { CLAUDE_TOOLS, SYSTEM_PROMPT } from 'ai-engine'
import { app } from '../src/app.js'
import { setAiReasoningServiceForTests } from '../src/ai/index.js'
import { AiReasoningService } from '../src/ai/service.js'
import type { AiConfig } from '../src/ai/config.js'
import type { GeminiClient, GeminiGenerateRequest, GeminiGenerateResult } from '../src/ai/client.js'

class MockGeminiClient implements GeminiClient {
  readonly requests: GeminiGenerateRequest[] = []

  constructor(
    private readonly handlers: ((
      request: GeminiGenerateRequest
    ) => Promise<GeminiGenerateResult> | GeminiGenerateResult)[]
  ) {}

  async generate(request: GeminiGenerateRequest): Promise<GeminiGenerateResult> {
    this.requests.push(request)
    const handler = this.handlers[this.requests.length - 1]
    if (!handler) {
      throw new Error('No mock handler registered for request')
    }
    return handler(request)
  }
}

const baseConfig: AiConfig = {
  geminiApiKey: 'test-key',
  geminiModel: 'gemini-2.5-flash',
  debugLogging: false,
  fallbackTtlMs: 300_000,
  maxToolTurns: 3
}

describe('/ai/reason integration', () => {
  afterEach(() => {
    setAiReasoningServiceForTests(null)
  })

  it('rejects invalid payloads missing message', async () => {
    const response = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    })

    expect(response.status).toBe(400)
    const body = (await response.json()) as {
      error: { code: string; message: string; retryable: boolean }
    }
    expect(body.error.code).toBe('INVALID_REQUEST')
  })

  it('injects system prompt, registers tools, and parses structured summary output', async () => {
    const client = new MockGeminiClient([
      () => ({
        text: JSON.stringify({
          format: 'summary',
          topic: 'Inbox',
          bullets: ['You have 3 unread emails', '1 requires a response today'],
          confidence: 'high'
        }),
        functionCalls: [],
        rawResponse: {
          id: 'resp_1'
        }
      })
    ])
    setAiReasoningServiceForTests(new AiReasoningService(baseConfig, client))

    const response = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Summarize my inbox',
        history: [
          { role: 'user', content: 'What happened yesterday?' },
          { role: 'assistant', content: 'You completed most tasks.' }
        ]
      })
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      type: string
      summary?: { topic: string; bullets: string[]; confidence: string }
      metadata: {
        model: string
        toolCalls: number
        truncatedHistoryCount: number
        fallbackUsed: boolean
      }
    }
    expect(body.type).toBe('summary')
    expect(body.summary?.topic).toBe('Inbox')
    expect(body.metadata.fallbackUsed).toBe(false)
    expect(body.metadata.model).toBe('gemini-2.5-flash')

    const [firstRequest] = client.requests
    expect(firstRequest.systemInstruction).toBe(SYSTEM_PROMPT)
    expect(firstRequest.tools.map((tool) => tool.name)).toEqual(
      CLAUDE_TOOLS.map((tool) => tool.name)
    )
  })

  it('truncates oldest history near token budget limit', async () => {
    const client = new MockGeminiClient([
      () => ({
        text: 'History received.',
        functionCalls: [],
        rawResponse: {}
      })
    ])
    setAiReasoningServiceForTests(new AiReasoningService(baseConfig, client))

    const oversizedHistory = Array.from({ length: 40 }, (_, index) => ({
      role: (index % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `H${index}-${'x'.repeat(900)}`
    }))

    const response = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Keep only what fits context',
        history: oversizedHistory
      })
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      metadata: { truncatedHistoryCount: number }
    }
    expect(body.metadata.truncatedHistoryCount).toBeGreaterThan(0)
  })

  it('handles Gemini tool calls by executing mock tools and continuing conversation', async () => {
    const client = new MockGeminiClient([
      () => ({
        text: '',
        functionCalls: [
          {
            name: 'search_drive',
            args: { query: 'budget' }
          }
        ],
        rawResponse: {
          step: 'tool-call'
        }
      }),
      () => ({
        text: 'I found two budget files and drafted next actions.',
        functionCalls: [],
        rawResponse: {
          step: 'final'
        }
      })
    ])
    setAiReasoningServiceForTests(new AiReasoningService(baseConfig, client))

    const response = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Find the latest budget file and suggest next steps'
      })
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      type: string
      text: string
      metadata: { toolCalls: number; fallbackUsed: boolean }
    }
    expect(body.type).toBe('text')
    expect(body.text).toContain('budget files')
    expect(body.metadata.toolCalls).toBe(1)
    expect(body.metadata.fallbackUsed).toBe(false)

    const secondRequest = client.requests[1]
    const hasFunctionResponse = secondRequest.contents.some((content) =>
      content.parts.some((part) => 'functionResponse' in part)
    )
    expect(hasFunctionResponse).toBe(true)
  })

  it('returns cached service unavailable fallback when provider fails', async () => {
    const client = new MockGeminiClient([
      () => {
        throw new Error('Gemini unavailable')
      },
      () => {
        throw new Error('Gemini still unavailable')
      }
    ])
    setAiReasoningServiceForTests(new AiReasoningService(baseConfig, client))

    const requestBody = {
      message: 'Plan my afternoon'
    }

    const firstResponse = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    const secondResponse = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)

    const firstBody = (await firstResponse.json()) as {
      type: string
      text: string
      metadata: { fallbackUsed: boolean }
    }
    const secondBody = (await secondResponse.json()) as {
      type: string
      text: string
      metadata: { fallbackUsed: boolean }
    }

    expect(firstBody.type).toBe('text')
    expect(firstBody.metadata.fallbackUsed).toBe(true)
    expect(secondBody.metadata.fallbackUsed).toBe(true)
    expect(secondBody.text).toBe(firstBody.text)
  })

  it('returns structured action plan for natural language query', async () => {
    const client = new MockGeminiClient([
      () => ({
        text: JSON.stringify({
          format: 'action_plan',
          goal: 'Prepare tomorrow schedule',
          steps: [
            { id: '1', title: 'Review meetings', status: 'ready' },
            { id: '2', title: 'Block focus time', status: 'pending' }
          ],
          risks: ['Potential overlap with existing calls'],
          requiresConfirmation: false
        }),
        functionCalls: [],
        rawResponse: {}
      })
    ])
    setAiReasoningServiceForTests(new AiReasoningService(baseConfig, client))

    const response = await app.request('/ai/reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Help me build a realistic schedule for tomorrow morning.'
      })
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      type: string
      actionPlan?: { goal: string; steps: Array<{ id: string }>; risks: string[] }
      metadata: { fallbackUsed: boolean }
    }
    expect(body.type).toBe('action_plan')
    expect(body.actionPlan?.goal).toBe('Prepare tomorrow schedule')
    expect(body.actionPlan?.steps.length).toBe(2)
    expect(body.metadata.fallbackUsed).toBe(false)
  })
})
