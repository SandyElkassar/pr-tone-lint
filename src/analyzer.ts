import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { CommentContext, AnalysisResult } from './types'

export async function analyzeComment(
    client: OpenAI,
    context: CommentContext,
): Promise<AnalysisResult> {
    const promptTemplate = readFileSync(
        join(__dirname, '../prompts/tone-analysis.txt'),
        'utf-8',
    )

    const prompt = promptTemplate
        .replace('{comment}', context.body)
        .replace('{reviewer}', context.author)
        .replace('{code_snippet}', context.codeSnippet ?? 'Not available')
        .replace('{is_thread}', String(context.isThread))

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 500,
    })

    const raw = response.choices?.[0]?.message?.content ?? ''

    if (!raw) {
        throw new Error('LLM returned empty response')
    }

    const parsed = JSON.parse(raw) as AnalysisResult

    // Validate the score is within expected range
    if (parsed.blame_score < 0 || parsed.blame_score > 100) {
        throw new Error(`Invalid blame_score received: ${parsed.blame_score}`)
    }

    return parsed
}

export function shouldPostComment(
    result: AnalysisResult,
    threshold: number,
    postOnBorderline: boolean,
): boolean {
    if (result.confidence < 40) return false
    if (result.blame_score >= threshold) return true
    if (postOnBorderline && result.tone_label === 'borderline') return true
    return false
}
