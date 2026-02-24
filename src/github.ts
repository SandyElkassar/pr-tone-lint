import * as github from '@actions/github'
import type { CommentContext } from './types'

type Octokit = ReturnType<typeof github.getOctokit>

export async function getCommentContext(
    octokit: Octokit,
    repoOwner: string,
    repoName: string,
): Promise<CommentContext> {
    const payload = github.context.payload

    const commentId = payload.comment!.id
    const prNumber = payload.pull_request!.number ?? payload.issue?.number
    const body = payload.comment?.body
    const author = payload.comment?.user.login
    const isThread = payload.comment?.in_reply_to_id !== undefined

    // Fetch the code snippet this comment is attached to
    let codeSnippet: string | undefined

    try {
        const { data: comment } = await octokit.rest.pulls.getReviewComment({
            owner: repoOwner,
            repo: repoName,
            comment_id: commentId,
        })
        codeSnippet = comment.diff_hunk
    } catch {
        // Not a review comment, might be a general PR comment
        codeSnippet = undefined
    }

    return {
        body,
        author,
        codeSnippet,
        isThread,
        commentId,
        prNumber,
        repoOwner,
        repoName,
    }
}

export async function postReply(
    octokit: Octokit,
    context: CommentContext,
    message: string,
): Promise<void> {
    try {
        // Try to reply directly in the review comment thread first
        await octokit.rest.pulls.createReplyForReviewComment({
            owner: context.repoOwner,
            repo: context.repoName,
            pull_number: context.prNumber,
            comment_id: context.commentId,
            body: message,
        })
    } catch {
        // Fall back to a general PR comment if it's not a review comment
        await octokit.rest.issues.createComment({
            owner: context.repoOwner,
            repo: context.repoName,
            issue_number: context.prNumber,
            body: message,
        })
    }
}
