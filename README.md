# PR Tone Lint 🎯
It has personality, which makes it memorable

> A tone linter for code reviews. Catches blame language, scores it, 
> and suggests neutral rewrites — automatically.

![GitHub Actions](https://img.shields.io/badge/GitHub-Action-blue?logo=github)
![License](https://img.shields.io/badge/license-MIT-green)

## What It Does

Code reviews are supposed to improve code. But sometimes the wording 
gets personal — and that quietly damages team culture.

PR Tone Lint watches your PR review comments and flags language that 
sounds blame-focused or accusatory. It replies with:

- A **tone score** (0–100)
- An explanation of **why it might land harshly**
- A **suggested rewrite** that focuses on the code, not the person

## Example

A reviewer posts:
> "You're doing this again, I already told you about this pattern."

PR Tone Lint replies:

---

**🤖 Tone Lint** — Hey, quick note on this comment: ⚠️

| | |
|---|---|
| **Tone Score** | ████████░░ `75/100` |
| **Classification** | `blame-focused` |

**Why this might land harshly:**
> The comment focuses on the person's repeated behavior rather than 
> the code, implying frustration and blame.

**Patterns detected:** `you're doing this again`, `I already told you`

**💡 Suggested rewrite:**
> This pattern appears in a few places — worth addressing consistently.

---

## Setup

### 1. Add the workflow to your repo

Create `.github/workflows/tone-lint.yml`:

name: PR Tone Lint


on:
  pull_request_review_comment:
    types: [created]


jobs:
  tone-check:
    runs-on: ubuntu-latest
    if: ${{ github.actor != 'github-actions[bot]' }}


permissions:
  pull-requests: write

steps:
  - uses: actions/checkout@v4

  - name: Run Tone Lint
    uses: SandyElkassar/pr-tone-lint@v1
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      openai-api-key: ${{ secrets.OPENAI_API_KEY }}
      blame-threshold: '60'
      tone: 'balanced'
      post-on-borderline: 'false'


### 2. Add your OpenAI API key

Go to your repo → Settings → Secrets and variables → Actions

Add a secret named `OPENAI_API_KEY` with your OpenAI API key.

That's it. No servers, no databases, no extra setup.

## Configuration

| Input | Default | Description |
|---|---|---|
| `blame-threshold` | `60` | Score (0–100) above which a comment is flagged |
| `tone` | `balanced` | Bot personality: `strict`, `balanced`, or `humorous` |
| `post-on-borderline` | `false` | Also flag borderline comments (score 31–59) |

## Tone Modes

**Strict** — Plain and professional. Just the facts.

**Balanced** — Friendly but direct. The default.

**Humorous** — Slightly playful. Good for teams with a light culture.

## Scoring Guide

| Score | Label | Meaning |
|---|---|---|
| 0–30 | `constructive` | No action taken |
| 31–59 | `borderline` | Flagged if `post-on-borderline` is true |
| 60–79 | `blame-focused` | Addresses behavior, not code |
| 80–100 | `personal-attack` | Direct attack on competence or character |

## Cost

Each analysis costs approximately $0.002 (less than half a cent) using GPT-4o.

| Volume | Estimated Cost |
|---|---|
| 100 comments | ~$0.20 |
| 1,000 comments | ~$2.00 |

## License

MIT
