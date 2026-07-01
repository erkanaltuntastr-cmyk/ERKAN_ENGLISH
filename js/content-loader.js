// Ece Assessments — Content pack validator + registry.
// Depends on: EceStorage (load storage.js FIRST).

(function(global){
  'use strict';

  const SUPPORTED_VERSION = '1.0';
  const VALID_TYPES = ['question-pack', 'flashcard-pack', 'writing-pack'];
  const VALID_SUBJECTS = ['maths','english','science','science-biology','science-chemistry','science-physics','music','french','history','geography','other'];
  const VALID_Q_TYPES = ['fill','mcq','open','mental'];

  // ── Validation ──────────────────────────────────────────────────────

  function validatePack(pack){
    const errors = [];

    if (!pack || typeof pack !== 'object'){
      return { valid: false, errors: ['JSON bir is not an object'] };
    }

    // Top-level required
    if (pack.schemaVersion !== SUPPORTED_VERSION){
      errors.push('schemaVersion "' + SUPPORTED_VERSION + '" olmalı (mevcut: ' + JSON.stringify(pack.schemaVersion) + ')');
    }
    if (!pack.id || typeof pack.id !== 'string') errors.push('id field is missing or not a string');
    if (!pack.type || VALID_TYPES.indexOf(pack.type) < 0){
      errors.push('type must be "question-pack" or "flashcard-pack" (current: ' + JSON.stringify(pack.type) + ')');
    }
    if (!pack.title || typeof pack.title !== 'string') errors.push('title field is missing');
    if (!pack.subject || VALID_SUBJECTS.indexOf(pack.subject) < 0){
      errors.push('subject is invalid (valid: ' + VALID_SUBJECTS.join(', ') + ')');
    }

    // Type-specific
    if (pack.type === 'question-pack'){
      if (!Array.isArray(pack.questions) || pack.questions.length === 0){
        errors.push('questions array is missing or empty');
      } else {
        const seenIds = {};
        pack.questions.forEach((q, i) => {
          const where = 'questions[' + i + ']';
          if (!q || typeof q !== 'object'){ errors.push(where + ' is not an object'); return; }
          if (!q.id) errors.push(where + '.id missing');
          else if (seenIds[q.id]) errors.push(where + '.id "' + q.id + '" is duplicated in pack');
          else seenIds[q.id] = true;
          if (!q.topic) errors.push(where + '.topic is missing');
          if (!q.type || VALID_Q_TYPES.indexOf(q.type) < 0) errors.push(where + '.type is invalid (valid: ' + VALID_Q_TYPES.join(', ') + ')');
          if (!q.prompt) errors.push(where + '.prompt is missing');
          if (q.answer == null || q.answer === '') errors.push(where + '.answer missing');
          if (q.type === 'fill' || q.type === 'mental'){
            if (!Array.isArray(q.accept) || q.accept.length === 0){
              errors.push(where + '.accept array is missing or empty (required for fill/mental)');
            }
          }
          if (q.type === 'mcq'){
            if (!Array.isArray(q.options) || q.options.length < 2){
              errors.push(where + '.options must have at least 2 choices (required for mcq)');
            } else if (q.answer && q.options.indexOf(q.answer) < 0){
              errors.push(where + '.answer is not in options');
            }
          }
        });
      }
    } else if (pack.type === 'writing-pack'){
      if (!pack.brief || typeof pack.brief !== 'string') errors.push('brief field is missing');
      if (!Array.isArray(pack.stages) || pack.stages.length === 0){
        errors.push('stages array is missing or empty');
      } else {
        const seenIds = {};
        pack.stages.forEach((s, i) => {
          const where = 'stages[' + i + ']';
          if (!s || typeof s !== 'object'){ errors.push(where + ' is not an object'); return; }
          if (!s.id) errors.push(where + '.id missing');
          else if (seenIds[s.id]) errors.push(where + '.id "' + s.id + '" is duplicated');
          else seenIds[s.id] = true;
          if (!s.label) errors.push(where + '.label is missing');
        });
      }
      if (!Array.isArray(pack.rubric) || pack.rubric.length === 0){
        errors.push('rubric array is missing or empty');
      }
    } else if (pack.type === 'flashcard-pack'){
      if (!Array.isArray(pack.cards) || pack.cards.length === 0){
        errors.push('cards dizisi missing veya boş');
      } else {
        const seenIds = {};
        pack.cards.forEach((c, i) => {
          const where = 'cards[' + i + ']';
          if (!c || typeof c !== 'object'){ errors.push(where + ' is not an object'); return; }
          if (!c.id) errors.push(where + '.id missing');
          else if (seenIds[c.id]) errors.push(where + '.id "' + c.id + '" is duplicated in pack');
          else seenIds[c.id] = true;
          if (!c.category) errors.push(where + '.category is missing');
          if (!c.front) errors.push(where + '.front is missing');
          if (c.back == null || c.back === '') errors.push(where + '.back is missing');
          // Optional MCQ-style options
          if (c.options != null){
            if (!Array.isArray(c.options) || c.options.length < 2 || c.options.length > 6){
              errors.push(where + '.options dizisi 2-6 şık içermeli');
            } else if (c.back && c.options.indexOf(c.back) < 0){
              errors.push(where + '.back "' + c.back + '" options içinde değil');
            }
          }
        });
      }
    }

    return { valid: errors.length === 0, errors: errors };
  }

  // ── Import / registry ──────────────────────────────────────────────

  function parseJSON(text){
    try { return { ok: true, value: JSON.parse(text) }; }
    catch(e){ return { ok: false, error: 'JSON parse hatası: ' + e.message }; }
  }

  function isSciencePack(pack){
    if (!pack) return false;
    return pack.subject === 'science'
      || pack.subject === 'science-biology'
      || pack.subject === 'science-chemistry'
      || pack.subject === 'science-physics'
      || (typeof pack.id === 'string' && pack.id.indexOf('science-y7-') === 0);
  }

  function normalizePack(pack){
    if (!pack || typeof pack !== 'object') return pack;
    if (pack.type !== 'question-pack' || !Array.isArray(pack.questions)) return pack;
    if (!isSciencePack(pack)) return pack;

    const needsTopicBackfill = pack.questions.some(q => q && !q.topic);
    if (!needsTopicBackfill) return pack;

    return Object.assign({}, pack, {
      questions: pack.questions.map(q => {
        if (!q || q.topic) return q;
        return Object.assign({}, q, { topic: q.section || pack.title });
      })
    });
  }

  function findPack(id){
    return EceStorage.getAllPacks().find(p => p.id === id) || null;
  }

  /**
   * Import a pack into the registry.
   * @param {object} pack - already-parsed JSON
   * @param {object} opts - { onConflict: 'overwrite' | 'copy' | 'cancel' | function(existing) }
   * @returns {object} { ok, pack?, conflict?, errors? }
   */
  function importPack(pack, opts){
    opts = opts || {};
    pack = normalizePack(pack);
    const v = validatePack(pack);
    if (!v.valid) return { ok: false, errors: v.errors };

    const existing = findPack(pack.id);
    if (existing){
      let decision = opts.onConflict;
      if (typeof decision === 'function') decision = decision(existing);
      if (!decision){
        return { ok: false, conflict: true, existing: existing,
          hint: 'Aynı id ile pack zaten var. opts.onConflict ile "overwrite", "copy" veya "cancel" seç.' };
      }
      if (decision === 'cancel') return { ok: false, cancelled: true };
      if (decision === 'copy'){
        pack = Object.assign({}, pack, { id: pack.id + '-copy-' + Date.now().toString(36) });
      }
      // 'overwrite' → fall through, savePack will overwrite by id
    }

    const stored = Object.assign({ addedAt: new Date().toISOString() }, pack);
    EceStorage.savePack(stored);
    return { ok: true, pack: stored };
  }

  function importFromText(text, opts){
    const parsed = parseJSON(text);
    if (!parsed.ok) return { ok: false, errors: [parsed.error] };
    return importPack(parsed.value, opts);
  }

  function listPacks(){ return EceStorage.getAllPacks(); }
  function deletePack(id){ return EceStorage.deletePack(id); }

  // Export single pack as downloadable JSON
  function exportPackText(id){
    const p = findPack(id);
    if (!p) return null;
    // strip storage-only fields
    const { addedAt, ...clean } = p; // eslint-disable-line no-unused-vars
    return JSON.stringify(clean, null, 2);
  }

  global.EceContent = {
    SUPPORTED_VERSION: SUPPORTED_VERSION,
    VALID_TYPES: VALID_TYPES,
    VALID_SUBJECTS: VALID_SUBJECTS,
    VALID_Q_TYPES: VALID_Q_TYPES,
    validatePack: validatePack,
    parseJSON: parseJSON,
    findPack: findPack,
    importPack: importPack,
    importFromText: importFromText,
    listPacks: listPacks,
    deletePack: deletePack,
    exportPackText: exportPackText
  };
})(window);
