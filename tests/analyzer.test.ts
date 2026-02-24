import { analyzeComment, shouldPostComment } from '../src/analyzer'
import type { CommentContext, AnalysisResult } from '../src/types'

// Fixture for a harsh comment
const harshContext: CommentContext = {
  body: "You're doing this again, I already told you about this pattern.",
  author: 'reviewer123',
  codeSnippet: 'const x = require("something")',
  isThread: false,
  commentId: 1,
  prNumber: 42,
  repoOwner: 'test-owner',
  repoName: 'test-repo',
}

// Fixture for a constructive comment
const constructiveContext: CommentContext = {
  body: 'This function could be simplified using Array.reduce.',
  author: 'reviewer123',
  codeSnippet: 'const result = []',
  isThread: false,
  commentId: 2,
  prNumber: 42,
  repoOwner: 'test-owner',
  repoName: 'test-repo',
}

// What a high-blame LLM response looks like
const harshAnalysis: AnalysisResult = {
  blame_score: 75,
  tone_label: 'blame-focused',
  explanation: 'References past behavior and uses accusatory language.',
  suggested_rewrite: 'This pattern appears in a few places worth addressing.',
  triggered_patterns: ['again', 'I already told you'],
  confidence: 90,
}

// What a clean LLM response looks like
const constructiveAnalysis: AnalysisResult = {
  blame_score: 15,
  tone_label: 'constructive',
  explanation: 'Comment is focused on the code, not the person.',
  suggested_rewrite: 'This function could be simplified using Array.reduce.',
  triggered_patterns: [],
  confidence: 95,
}

// Mock the OpenAI client
const makeMockClient = (result: AnalysisResult) => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(result),
            },
          },
        ],
      }),
    },
  },
})

describe('analyzeComment', () => {
  it('returns a valid AnalysisResult for a harsh comment', async () => {
    const mockClient = makeMockClient(harshAnalysis)

    const result = await analyzeComment(mockClient as any, harshContext)

    expect(result.blame_score).toBe(75)
    expect(result.tone_label).toBe('blame-focused')
    expect(result.triggered_patterns).toContain('again')
  })

  it('returns a valid AnalysisResult for a constructive comment', async () => {
    const mockClient = makeMockClient(constructiveAnalysis)

    const result = await analyzeComment(mockClient as any, constructiveContext)

    expect(result.blame_score).toBe(15)
    expect(result.tone_label).toBe('constructive')
    expect(result.triggered_patterns).toHaveLength(0)
  })

  it('throws if LLM returns empty response', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: null } }],
          }),
        },
      },
    }

    await expect(
      analyzeComment(mockClient as any, harshContext)
    ).rejects.toThrow('LLM returned empty response')
  })

  it('throws if blame_score is out of range', async () => {
    const invalidResult = { ...harshAnalysis, blame_score: 150 }
    const mockClient = makeMockClient(invalidResult)

    await expect(
      analyzeComment(mockClient as any, harshContext)
    ).rejects.toThrow('Invalid blame_score received')
  })
})

describe('shouldPostComment', () => {
  it('returns true when score meets threshold', () => {
    expect(shouldPostComment(harshAnalysis, 60, false)).toBe(true)
  })

  it('returns false when score is below threshold', () => {
    expect(shouldPostComment(constructiveAnalysis, 60, false)).toBe(false)
  })

  it('returns false when confidence is too low', () => {
    const lowConfidence = { ...harshAnalysis, confidence: 30 }
    expect(shouldPostComment(lowConfidence, 60, false)).toBe(false)
  })

  it('returns true for borderline when postOnBorderline is true', () => {
    const borderline: AnalysisResult = {
      ...harshAnalysis,
      blame_score: 45,
      tone_label: 'borderline',
      confidence: 80,
    }
    expect(shouldPostComment(borderline, 60, true)).toBe(true)
  })

  it('returns false for borderline when postOnBorderline is false', () => {
    const borderline: AnalysisResult = {
      ...harshAnalysis,
      blame_score: 45,
      tone_label: 'borderline',
      confidence: 80,
    }
    expect(shouldPostComment(borderline, 60, false)).toBe(false)
  })
})
