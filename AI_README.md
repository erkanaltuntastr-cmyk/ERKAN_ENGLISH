# AI_README - Instructions for Claude, ChatGPT, Gemini and Grok

This repository is Erkan's private English learning workspace.

If you are Claude, ChatGPT, Gemini, Grok, or another AI assistant, read this file first before creating lessons, tests, notes, or corrections.

## Main Goal

Help Erkan improve practical British English for life and work in the UK.

Current priority:

- Repair broken grammar through active use.
- Improve work conversations in the food service sector.
- Focus on articles, prepositions, connectors, tense control, collocations, phrasal verbs, and natural sentence patterns.
- Use the local grammar books as reference material, but create original learning content.

## Current Learning Context

Erkan has studied grammar many times over many years, but much of it was forgotten because it was not repeated and used enough.

He currently works in the food service sector in the UK. His customers are mostly Turkish restaurants. His job includes speaking with restaurant owners, creating regular weekly order habits, and building customer relationships. He also wants to improve his English for AI, learning, and technical topics.

Known weak areas from the first baseline writing sample:

- Present simple vs present continuous
- Articles: `a`, `an`, `the`, zero article
- Prepositions: `in`, `with`, `on`, `from`, `based on`
- Collocations: `place an order`, `earn commission`, `set up a system`
- Connectors and sentence linking
- Tense control
- Natural work-English patterns

## Active Plan

Do not start with the full placement test yet.

Active sequence:

1. Finish `Just Enough English Grammar Illustrated` as a short grammar reset sprint.
2. Use each session actively: note, quiz, correction, writing, speaking, or mistakes log.
3. After the sprint, run the full level diagnostic.

Read these files before continuing:

- `Egitim Plani/03-just-enough-grammar-sprint.md`
- `Gelisim notlari/just-enough-grammar-progress.md`
- `Olusturulan icerikler/grammar/just-enough-grammar/session-01-baseline.md`
- `Gelisim notlari/mistakes-log.md`

Next expected work:

- Session 02: nouns, articles, countability, and work-order vocabulary.
- App pack already exists: `data/erkan/packs/erkan-just-enough-session-02-nouns-v1.json`

## Repository Structure

Important folders:

- `Sources/` - source catalogue and book guidance.
- `Sources/books/` - local PDF reference library. PDF files are ignored by Git.
- `Egitim Plani/` - learning plans and diagnostic plans.
- `Olusturulan icerikler/` - generated notes, exercises, quizzes, corrections.
- `Gelisim notlari/` - progress notes, mistakes log, current level.
- `data/erkan/packs/` - JSON packs used by the local app.
- `data/erkan/assignments/erkan.json` - assigned packs shown on the dashboard.
- `players/` - question, flashcard, and writing players copied from the Ece Assessments infrastructure.
- `js/` - storage, profile shim, pack loader, and app support scripts.

## Local App

Run from the repository root:

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8123/index.html
```

The app is a static local dashboard for Erkan. It uses the same player style as Ece Assessments, but it is simplified for one adult learner profile.

## Source and Copyright Rules

Erkan owns or has access to the listed PDF books, but tracked GitHub files should not reproduce the books.

Allowed:

- Read local PDFs as private reference material.
- Create original study notes.
- Create original exercises, quizzes, answer keys, speaking prompts, and writing tasks.
- Refer to source IDs, topics, and page ranges.
- Use short excerpts only when necessary for private explanation or correction.

Not allowed in tracked files:

- Do not copy full pages, long extracts, scans, tables, or answer keys.
- Do not create a replacement version of a book.
- Do not commit PDF files.

PDF files under `Sources/books/*.pdf` must remain local-only.

## How To Create New Learning Content

For every generated markdown lesson, include:

```text
CEFR:
Skill:
Source:
Topic:
Date:
Output type:
```

For every app pack:

- Put JSON under `data/erkan/packs/`.
- Add the pack ID to `data/erkan/assignments/erkan.json`.
- Use original questions.
- Keep examples close to Erkan's real work context.
- Prefer short, frequent practice over large exams.

Useful pack types:

- `question-pack` for tests and controlled practice.
- `flashcard-pack` for vocabulary, collocations, phrasal verbs, and patterns.
- `writing-pack` for guided writing tasks.

## Correction Style

When correcting Erkan's English:

1. Preserve the meaning.
2. Give a corrected version.
3. Give a more natural spoken/work version when useful.
4. Explain only the important mistakes.
5. Add repeated mistakes to `Gelisim notlari/mistakes-log.md`.
6. Turn repeated mistakes into practice tasks.

Example priority:

- Not just "wrong grammar".
- Explain the usable pattern:
  - `I work in...`
  - `Most of my customers are...`
  - `They place a regular weekly order with me.`
  - `My commission is based on monthly payments.`

## AI-Specific Notes

### Claude

Be strict about file edits, source boundaries, and progress tracking. Prefer small commits and keep generated content structured.

### ChatGPT

Focus on conversational explanations and natural British English alternatives. Avoid overexplaining every grammar term unless Erkan asks.

### Gemini

Use the repository files as the source of truth. Do not invent progress state. Check the active plan and mistakes log first.

### Grok

Keep the tone direct and practical. Do not turn lessons into jokes or casual banter; Erkan needs usable work English.

## Current State Summary

Completed:

- Private GitHub repo created.
- Local PDF source inventory created.
- Local app infrastructure added.
- Session 01 baseline correction completed.
- Session 02 nouns/articles practice pack created.

Next:

1. Run Session 02 from the local app.
2. Review results.
3. Create `session-02-nouns-articles.md`.
4. Update `just-enough-grammar-progress.md`.
5. Add recurring mistakes to `mistakes-log.md`.
