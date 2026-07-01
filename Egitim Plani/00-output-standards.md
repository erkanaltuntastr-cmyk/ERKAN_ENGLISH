# 00 - Output Standards

Date: 2026-07-01
Scope: All future English learning materials in this repository

## Core Rule

All learning materials must be created in English only. Do not use Turkish in lesson notes, tests, flashcards, explanations, answer keys, app labels, reports, or learner-facing instructions.

## Lesson Notes Standard

Every lesson note must be printer friendly.

A lesson note is not considered complete unless it has a printer-friendly version. Markdown notes may exist as source notes, but the learner-facing version should be a clean print-ready HTML file.

Required lesson note files:

1. A full study note file:
   - `session-XX-topic-study-notes.md`
2. A printer-friendly HTML version:
   - `session-XX-topic-study-notes.print.html`

Printer-friendly means:

- A4 friendly layout.
- Clear black text on white background.
- No dark backgrounds.
- No app-only layout.
- No unnecessary buttons or navigation.
- Clear section headings.
- Sensible page breaks before major sections.
- Wide enough margins for printing.
- Tables must fit on the page.
- Examples must be readable when printed in grayscale.
- Answer keys must either be clearly separated or placed at the end.

Lesson notes must be full, substantial working notes. Do not shorten them into a small summary. Do not produce brief bullet-only notes. The purpose is to create material Erkan can actually study from on paper.

Each lesson note should include:

- Session purpose.
- Main grammar concept.
- Why the concept matters for Erkan's real English.
- Detailed explanations.
- Work-English examples.
- Common mistakes.
- Corrected versions.
- Speaking patterns.
- Writing tasks.
- A short review checklist.

## Test, Exam, Quiz, Flashcard, and Repeat Practice Standard

All tests, exams, quizzes, flashcards, and repeat practice must be interactive HTML through the local app.

Do not create only a static Markdown test unless it is a secondary printable backup.

Required interactive files:

- Question packs must be JSON files under `data/erkan/packs/` and must use the `question-pack` type.
- Flashcards must be JSON files under `data/erkan/packs/` and must use the `flashcard-pack` type.
- Writing practice should use `writing-pack` if guided writing is needed.
- Every interactive pack must be added to `data/erkan/assignments/erkan.json` if it should appear on the dashboard.

## Answer Saving Requirement

Interactive tests and flashcards must save answers or marks.

For question packs:

- Multiple-choice and fill-in questions should be auto-marked where possible.
- Open-ended questions should show a model answer and allow self-marking.
- The final result must be saved by the app.

For flashcards:

- The learner must be able to mark each card as known, unsure, skipped, correct, or wrong depending on card type.
- The final flashcard result must be saved by the app.

## End-of-Study Report Requirement

At the end of every test, quiz, flashcard deck, or repeat practice activity, the app must produce a report.

The report must show:

- Total score or completion result.
- Correct answers.
- Wrong answers.
- Open-ended answers awaiting self-marking, if any.
- The learner's answer where available.
- The correct answer or model answer.
- Explanation for each important item.
- Performance by topic or category.
- Weak areas to repeat.

A test or flashcard pack is not complete if it only displays questions without a final report.

## Session Output Package Standard

Each grammar session should normally produce this package:

1. Full study notes.
2. Printer-friendly HTML version of the study notes.
3. Interactive flashcard pack.
4. Interactive repeat practice or quiz pack.
5. Optional printable backup exercise file.
6. Progress tracker update.
7. Mistakes log update after Erkan completes the activity.

## Naming Standard

Use consistent names:

- `session-02-nouns-articles-study-notes.md`
- `session-02-nouns-articles-study-notes.print.html`
- `session-02-nouns-flashcards.md` only as a static backup if needed
- `erkan-just-enough-session-02-nouns-flashcards-v1.json`
- `erkan-just-enough-session-02-nouns-repeat-v1.json`

## Source and Copyright Boundary

Use books as private reference sources only. Do not copy full pages, long passages, scans, answer keys, or tables into tracked files.

All lesson notes, questions, flashcards, examples, and reports must be original content written for Erkan's learning context.

## Quality Rule

Small, shallow content is not acceptable. Each lesson should be practical, complete, and usable without needing another explanation. The goal is not to tick a box; the goal is to create a usable adult learning system.
