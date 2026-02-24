import * as core from '@actions/core'
import * as github from '@actions/github'
import OpenAI from 'openai'
import { getCommentContext, postReply } from './github'
import { analyzeComment, shouldPostComment } from './analyzer'
import { formatResponse } from './formatter'
import type { ActionConfig } from './types'

async function run(): Promise<void> {
    try {
        // Read inputs from action.yml
        const config: ActionConfig = {
            githubToken: core.getInput('github-token', { required: true }),
            openaiApiKey: core.getInput('openai-api-key', { required: true }),
            blameThreshold: parseInt(core.getInput('blame-threshold') || '60'),
            botTone: (core.getInput('tone') || 'balanced') as ActionConfig['botTone'],
            postOnBorderline: core.getInput('post-on-borderline') === 'true',
        }

        // Initialize API clients
        const octokit = github.getOctokit(config.githubToken)
        const openaiClient = new OpenAI({ apiKey: config.openaiApiKey })

        // Get repo context
        const { owner, repo } = github.context.repo

        // Build CommentContext from GitHub event payload
        const context = await getCommentContext(octokit, owner, repo)

        core.info(`Analyzing comment from ${context.author}...`)

        // Analyze the comment
        const result = await analyzeComment(openaiClient, context)

        core.info(`Blame score: ${result.blame_score}, Confidence: ${result.confidence}`)

        // Decide whether to post
        if (!shouldPostComment(result, config.blameThreshold, config.postOnBorderline)) {
            core.info('Comment is within acceptable tone range. No action taken.')
            return
        }

        // Format and post the reply
        const message = formatResponse(result, config.botTone)
        await postReply(octokit, context, message)

        core.info('Tone lint comment posted successfully.')
    } catch (error) {
        core.setFailed(`PR Tone Lint failed: ${error instanceof Error ? error.message : String(error)}`)
    }
}

run()
