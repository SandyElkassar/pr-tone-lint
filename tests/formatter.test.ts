// tests/formatter.test.ts
import { formatResponse } from '../src/formatter'
import type { AnalysisResult, BotTone } from '../src/types'

// Reusable fake data — a "fixture"
const mockResult: AnalysisResult = {
    blame_score: 72,
    tone_label: 'blame-focused',
    explanation: 'This comment references past behavior and uses accusatory language.',
    suggested_rewrite: 'This pattern appears in a few places — worth addressing consistently.',
    triggered_patterns: ['again', 'I told you'],
    confidence: 85,
}

describe('formatResponse', () => {
    describe('content', () => {
        it('returns a non-empty string', () => {
            const result = formatResponse(mockResult, 'balanced')
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })

        it('includes the blame score', () => {
            const result = formatResponse(mockResult, 'balanced')
            expect(result).toContain('72/100')
        })

        it('includes the tone label', () => {
            const result = formatResponse(mockResult, 'balanced')
            expect(result).toContain('blame-focused')
        })

        it('includes the explanation', () => {
            const result = formatResponse(mockResult, 'balanced')
            expect(result).toContain(mockResult.explanation)
        })

        it('includes the suggested rewrite', () => {
            const result = formatResponse(mockResult, 'balanced')
            expect(result).toContain(mockResult.suggested_rewrite)
        })

        it('includes all triggered patterns', () => {
            const result = formatResponse(mockResult, 'balanced')
            mockResult.triggered_patterns.forEach(pattern => {
                expect(result).toContain(pattern)
            })
        })
    })

    describe('bot tone variations', () => {
        const tones: BotTone[] = ['strict', 'balanced', 'humorous']

        tones.forEach(tone => {
            it(`renders correctly for tone: ${tone}`, () => {
                const result = formatResponse(mockResult, tone)
                expect(result).toBeTruthy()
                expect(result).toContain('72/100')
            })
        })

        it('uses different opening for each tone', () => {
            const strict = formatResponse(mockResult, 'strict')
            const balanced = formatResponse(mockResult, 'balanced')
            const humorous = formatResponse(mockResult, 'humorous')

            // All three should be different
            expect(strict).not.toEqual(balanced)
            expect(balanced).not.toEqual(humorous)
            expect(strict).not.toEqual(humorous)
        })
    })

    describe('score bar', () => {
        it('shows full bar for score 100', () => {
            const highScore = { ...mockResult, blame_score: 100 }
            const result = formatResponse(highScore, 'balanced')
            expect(result).toContain('██████████')
        })

        it('shows empty bar for score 0', () => {
            const zeroScore = { ...mockResult, blame_score: 0 }
            const result = formatResponse(zeroScore, 'balanced')
            expect(result).toContain('░░░░░░░░░░')
        })
    })
})
