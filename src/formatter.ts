import type { AnalysisResult, BotTone } from './types'

const SCORE_EMOJI = (score: number): string => {
    if (score >= 80) return '🚨'
    if (score >= 60) return '⚠️'
    if (score >= 40) return '💬'
    return '✅'
}

const buildScoreBar = (score: number): string => {
    const filled = Math.round(score / 10)
    const empty = 10 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

const OPENINGS: Record<BotTone, string> = {
    strict: '**Tone Analysis Flag**',
    balanced: '**🤖 Tone Lint** — Hey, quick note on this comment:',
    humorous: '**🕵️ Blame Detector 3000** has entered the chat',
}

const CLOSINGS: Record<BotTone, string> = {
    strict: '*Posted by PR Tone Lint. Configure thresholds in `.github/workflows/tone-lint.yml`.*',
    balanced: '*This is a suggestion, not a ruling. You know your team best. 🙂*',
    humorous: '*No reviewers were harmed in the making of this comment. Probably.*',
}

export function formatResponse(
    result: AnalysisResult,
    botTone: BotTone,
): string {
    const emoji = SCORE_EMOJI(result.blame_score)
    const scoreBar = buildScoreBar(result.blame_score)
    const patterns = result.triggered_patterns
        .map(p => `\`${p}\``)
        .join(', ')

    return `
${OPENINGS[botTone]} ${emoji}

| | |
|---|---|
| **Tone Score** | ${scoreBar} \`${result.blame_score}/100\` |
| **Classification** | \`${result.tone_label}\` |

**Why this might land harshly:**
> ${result.explanation}

**Patterns detected:** ${patterns}

**💡 Suggested rewrite:**
> ${result.suggested_rewrite}

---
${CLOSINGS[botTone]}
`.trim()
}
