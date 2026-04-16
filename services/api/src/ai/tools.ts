import { CLAUDE_TOOLS, type ClaudeToolDefinition } from 'ai-engine'

export type GeminiFunctionDeclaration = {
  readonly name: string
  readonly description: string
  readonly parameters: Record<string, unknown>
}

export type GeminiToolCall = {
  readonly name: string
  readonly args: Record<string, unknown>
}

export type GeminiToolResult = {
  readonly name: string
  readonly response: Record<string, unknown>
}

type MockToolExecutor = (args: Record<string, unknown>) => Promise<Record<string, unknown>>

const asGeminiFunction = (tool: ClaudeToolDefinition): GeminiFunctionDeclaration => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.input_schema as Record<string, unknown>
})

const mockToolExecutors: Record<string, MockToolExecutor> = {
  read_calendar: async (args) => ({
    ok: true,
    source: 'mock',
    tool: 'read_calendar',
    args,
    events: [
      {
        title: 'Daily standup',
        startTime: '2026-04-16T09:00:00Z',
        endTime: '2026-04-16T09:15:00Z'
      },
      {
        title: 'Roadmap review',
        startTime: '2026-04-16T14:00:00Z',
        endTime: '2026-04-16T15:00:00Z'
      }
    ]
  }),
  create_event: async (args) => ({
    ok: true,
    source: 'mock',
    tool: 'create_event',
    args,
    created: false,
    preview: 'Mock event draft generated. Confirmation required before execution.'
  }),
  search_drive: async (args) => ({
    ok: true,
    source: 'mock',
    tool: 'search_drive',
    args,
    files: [
      {
        id: 'file_001',
        name: 'Q2_Planning_Draft.md',
        modifiedAt: '2026-04-12T11:30:00Z'
      },
      {
        id: 'file_002',
        name: 'Budget_Projection.xlsx',
        modifiedAt: '2026-04-11T08:05:00Z'
      }
    ]
  }),
  read_email: async (args) => ({
    ok: true,
    source: 'mock',
    tool: 'read_email',
    args,
    messages: [
      {
        id: 'msg_001',
        subject: 'Project update',
        from: 'lead@example.com',
        snippet: 'Please review the latest milestone notes.'
      }
    ]
  }),
  execute_action: async (args) => ({
    ok: true,
    source: 'mock',
    tool: 'execute_action',
    args,
    executed: false,
    preview: 'Mock action preview generated. No side effects were performed.'
  })
}

export function getGeminiToolDeclarations(): readonly GeminiFunctionDeclaration[] {
  return CLAUDE_TOOLS.map(asGeminiFunction)
}

export async function executeMockToolCall(call: GeminiToolCall): Promise<GeminiToolResult> {
  const executor = mockToolExecutors[call.name]
  if (!executor) {
    return {
      name: call.name,
      response: {
        ok: false,
        error: {
          code: 'TOOL_NOT_IMPLEMENTED',
          message: `No executor registered for tool "${call.name}".`
        }
      }
    }
  }

  try {
    return {
      name: call.name,
      response: await executor(call.args)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown tool execution failure'
    return {
      name: call.name,
      response: {
        ok: false,
        error: {
          code: 'TOOL_EXECUTION_FAILED',
          message
        }
      }
    }
  }
}
