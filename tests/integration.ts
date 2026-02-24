import { analyzeComment, shouldPostComment } from '../src/analyzer'
import { formatResponse } from '../src/formatter'
import type { CommentContext } from '../src/types'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

async function runIntegrationTest(): Promise<void> {
  console.log('🧪 Running integration test...\n')

  // Simulate what github.ts would build from the payload
  const context: CommentContext = {
    body: "You're doing this again, I already told you about this pattern.",
    author: 'harsh-reviewer',
    codeSnippet: "@@ -1,4 +1,6 @@\n const express = require('express')",
    isThread: false,
    commentId: 123456789,
    prNumber: 42,
    repoOwner: 'test-owner',
    repoName: 'test-repo',
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for integration tests')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  console.log('📤 Sending comment to OpenAI...')
  console.log(`Comment: "${context.body}"\n`)

  const result = await analyzeComment(client, context)

  console.log('📥 Analysis result:')
  console.log(`  Blame score:  ${result.blame_score}/100`)
  console.log(`  Tone label:   ${result.tone_label}`)
  console.log(`  Confidence:   ${result.confidence}`)
  console.log(`  Patterns:     ${result.triggered_patterns.join(', ')}`)
  console.log(`  Explanation:  ${result.explanation}\n`)

  const shouldPost = shouldPostComment(result, 60, false)
  console.log(`📊 Should post comment: ${shouldPost}\n`)

  if (shouldPost) {
    const formatted = formatResponse(result, 'balanced')
    console.log('💬 Formatted reply:')
    console.log('─'.repeat(50))
    console.log(formatted)
    console.log('─'.repeat(50))
  }

  console.log('\n✅ Integration test complete')
}

runIntegrationTest().catch(error => {
  console.error('❌ Integration test failed:', error)
  process.exit(1)
})
