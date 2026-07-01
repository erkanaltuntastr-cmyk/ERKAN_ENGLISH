// Ece Assessments — Legacy result normalizer
// Converts the 3 different legacy localStorage formats into a single canonical shape.
// Pure functions; safe to unit-test.

(function(global){
  'use strict';

  const STATUS_THRESHOLDS = [
    { min: 80, label: 'Strong' },
    { min: 60, label: 'Good' },
    { min: 40, label: 'Review' },
    { min: 0,  label: 'Practise' }
  ];

  function statusFor(percentage){
    const p = Number(percentage) || 0;
    for (const t of STATUS_THRESHOLDS) if (p >= t.min) return t.label;
    return 'Practise';
  }

  function toIsoDate(raw){
    if (!raw) return new Date().toISOString();
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
    // Try en-GB dd/mm/yyyy
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(raw));
    if (m){
      const iso = new Date(Date.UTC(+m[3], +m[2]-1, +m[1]));
      if (!isNaN(iso.getTime())) return iso.toISOString();
    }
    return new Date().toISOString();
  }

  // ── Legacy: diagnostic ──────────────────────────────────────────────
  // section/percent → name/percentage rename
  function normalizeDiagnostic(raw){
    if (!raw) return null;
    const sections = (raw.sectionBreakdown || []).map(s => ({
      name: s.section || s.name || 'Unknown',
      score: Number(s.score) || 0,
      total: Number(s.total) || 0,
      percentage: Number(s.percent != null ? s.percent : s.percentage) || 0,
      status: s.status || statusFor(s.percent != null ? s.percent : s.percentage)
    }));
    return {
      profileId: 'ece',
      packId: 'legacy-diagnostic',
      packTitle: raw.testName || 'Year 7 Maths Diagnostic',
      subject: 'maths',
      type: 'question-pack',
      date: toIsoDate(raw.date),
      score: Number(raw.score) || 0,
      totalAuto: Number(raw.totalAutoQuestions) || 0,
      totalQuestions: Number(raw.totalQuestions || raw.totalAutoQuestions) || 0,
      percentage: Number(raw.percentage) || 0,
      openEndedCount: Number(raw.openEndedCount) || 0,
      sections: sections,
      weakSections: raw.weakSections || [],
      answers: (raw.answers || []).map(a => ({
        id: String(a.q != null ? a.q : a.id),
        result: a.result,
        hintUsed: !!a.hintUsed
      }))
    };
  }

  // ── Legacy: division focus ──────────────────────────────────────────
  // Already uses name/percentage. Mostly a remap.
  function normalizeDivision(raw){
    if (!raw) return null;
    const sections = (raw.sectionBreakdown || []).map(s => ({
      name: s.name || s.section || 'Unknown',
      score: Number(s.score) || 0,
      total: Number(s.total) || 0,
      percentage: Number(s.percentage != null ? s.percentage : s.percent) || 0,
      status: s.status || statusFor(s.percentage != null ? s.percentage : s.percent)
    }));
    return {
      profileId: 'ece',
      packId: 'legacy-division',
      packTitle: raw.testName || 'Division Focus Test',
      subject: 'maths',
      type: 'question-pack',
      date: toIsoDate(raw.date),
      score: Number(raw.score) || 0,
      totalAuto: Number(raw.totalAutoQuestions) || 0,
      totalQuestions: Number(raw.totalQuestions || raw.totalAutoQuestions) || 0,
      percentage: Number(raw.percentage) || 0,
      openEndedCount: Number(raw.openEndedCount) || 0,
      sections: sections,
      weakSections: raw.weakSections || [],
      answers: (raw.answers || []).map(a => ({
        id: String(a.id != null ? a.id : a.q),
        result: a.result,
        hintUsed: !!a.hintUsed
      }))
    };
  }

  // ── Legacy: flashcards (no sections, different shape) ───────────────
  function normalizeFlashcards(raw){
    if (!raw) return null;
    const total = Number(raw.total || raw.totalCards) || 0;
    const known = Number(raw.known) || 0;
    const unsure = Number(raw.unsure) || 0;
    const pct = Number(raw.percentage) || (total > 0 ? Math.round((known/total)*100) : 0);
    return {
      profileId: 'ece',
      packId: 'legacy-flashcards',
      packTitle: raw.testName || 'Number Operations Flashcards',
      subject: 'maths',
      type: 'flashcard-pack',
      date: toIsoDate(raw.date),
      score: known,
      totalAuto: total,
      totalQuestions: total,
      percentage: pct,
      openEndedCount: 0,
      sections: (raw.categories || []).map(cat => ({
        name: cat, score: 0, total: 0, percentage: pct, status: statusFor(pct)
      })),
      weakSections: pct < 60 ? (raw.categories || []) : [],
      answers: [],
      // flashcard-specific extras
      flashcards: { known: known, unsure: unsure, total: total }
    };
  }

  // ── Standard pack result (new schema) ───────────────────────────────
  // Already canonical if produced by future players. Sanity-pass through.
  function normalizeStandard(raw, profileId){
    if (!raw) return null;
    return Object.assign({
      profileId: profileId || raw.profileId || 'unknown',
      packId: raw.packId || 'unknown',
      packTitle: raw.packTitle || '(untitled)',
      subject: raw.subject || 'unknown',
      type: raw.type || 'question-pack',
      date: toIsoDate(raw.date),
      score: 0, totalAuto: 0, totalQuestions: 0, percentage: 0,
      openEndedCount: 0,
      sections: [], weakSections: [], answers: []
    }, raw);
  }

  global.EceNormalize = {
    statusFor: statusFor,
    toIsoDate: toIsoDate,
    diagnostic: normalizeDiagnostic,
    division: normalizeDivision,
    flashcards: normalizeFlashcards,
    standard: normalizeStandard,
    STATUS_THRESHOLDS: STATUS_THRESHOLDS
  };
})(window);
