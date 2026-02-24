export type ToneLabel =
    | 'constructive'
    | 'borderline'
    | 'blame-focused'
    | 'personal-attack'

export interface CommentContext {
    body: string;
    author: string;
    codeSnippet?: string;
    isThread: boolean;
    commentId: number;
    prNumber: number;
    repoOwner: string;
    repoName: string;
}

export interface AnalysisResult {
    blame_score: number;
    tone_label: ToneLabel;
    explanation: string;
    suggested_rewrite: string;
    triggered_patterns: string[];
    confidence: number;
}

export type BotTone = 'strict' | 'balanced' | 'humorous'

export interface ActionConfig {
    githubToken: string
    openaiApiKey: string
    blameThreshold: number
    botTone: BotTone
    postOnBorderline: boolean
}