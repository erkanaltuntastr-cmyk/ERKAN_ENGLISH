// Ece Assessments — localStorage wrapper with namespace + legacy bridge.
// Depends on: EceNormalize (load normalize.js FIRST).

(function(global){
  'use strict';

  const PREFIX = 'erkan_english.';
  const MANAGED_PREFIXES = [PREFIX, 'erkan_bank.', 'erkan_writing_draft.'];

  // Legacy keys mapped to their normalizer
  const LEGACY_KEYS = [
    { key: 'ece_maths_diagnostic',       fn: 'diagnostic'  },
    { key: 'ece_maths_division_focus',   fn: 'division'    },
    { key: 'ece_maths_flashcards_number',fn: 'flashcards'  }
  ];

  // Change listeners (used by disk-sync.js to mirror to disk)
  const _hooks = [];
  function onChange(fn){ _hooks.push(fn); return () => { const i = _hooks.indexOf(fn); if (i>=0) _hooks.splice(i,1); }; }
  function fireChange(key, value, action){
    _hooks.forEach(fn => { try { fn({ key: key, value: value, action: action || 'set' }); } catch(e){ console.warn('storage hook failed', e); } });
  }

  function k(name){ return PREFIX + name; }
  function isManagedKey(fullKey){
    return MANAGED_PREFIXES.some(prefix => fullKey && fullKey.indexOf(prefix) === 0);
  }

  function getJSON(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch(e){
      console.warn('storage.getJSON failed for', key, e);
      return fallback;
    }
  }

  function setJSON(key, value){
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e){
      console.error('storage.setJSON failed for', key, e);
      return false;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────

  function get(name, fallback){ return getJSON(k(name), fallback); }
  function set(name, value){
    const ok = setJSON(k(name), value);
    if (ok) fireChange(name, value, 'set');
    return ok;
  }
  function remove(name){
    localStorage.removeItem(k(name));
    fireChange(name, null, 'remove');
  }

  // Profiles -----------------------------------------------------------
  function getProfiles(){ return get('profiles', []); }
  function setProfiles(list){ return set('profiles', list); }

  function getActive(){ return get('active', null); }
  function setActive(active){ return set('active', active); }

  // Packs (content registry) ------------------------------------------
  function getAllPacks(){ return get('packs', []); }
  function savePack(pack){
    const all = getAllPacks();
    const idx = all.findIndex(p => p.id === pack.id);
    if (idx >= 0) all[idx] = pack; else all.push(pack);
    const ok = setJSON(k('packs'), all);
    // Don't fire generic 'set' for packs (would write packs.json on disk).
    // Instead fire per-pack action so disk-sync writes packs/<id>.json.
    if (ok) fireChange('packs:' + pack.id, pack, 'pack-save');
    return ok;
  }
  function deletePack(packId){
    const all = getAllPacks().filter(p => p.id !== packId);
    const ok = setJSON(k('packs'), all);
    if (ok) fireChange('packs:' + packId, null, 'pack-delete');
    return ok;
  }

  // Assignments -------------------------------------------------------
  function getAssignments(childId){ return get('assignments.' + childId, []); }
  function setAssignments(childId, packIds){ return set('assignments.' + childId, packIds); }

  // Results (read = merge new + legacy) -------------------------------
  function getResultKey(childId, packId){ return 'results.' + childId + '.' + packId; }

  function saveResult(result){
    if (!result || !result.profileId || !result.packId) {
      console.error('saveResult requires profileId and packId');
      return false;
    }
    // saveResult uses set() which fires a change for path mapping.
    return set(getResultKey(result.profileId, result.packId), result);
  }

  function getResults(childId){
    if (!childId) return [];
    const out = [];

    // 1) New canonical results stored under erkan_english.results.{cid}.{pid}
    const prefix = PREFIX + 'results.' + childId + '.';
    for (let i = 0; i < localStorage.length; i++){
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.indexOf(prefix) === 0){
        const r = getJSON(fullKey, null);
        if (r) out.push(r);
      }
    }

    // 2) Legacy results — only attributed to "ece"
    if (childId === 'ece' && global.EceNormalize){
      LEGACY_KEYS.forEach(spec => {
        try {
          const raw = JSON.parse(localStorage.getItem(spec.key) || 'null');
          if (raw){
            const normalized = global.EceNormalize[spec.fn](raw);
            if (normalized){
              // Don't duplicate if a new-schema entry with same packId already exists
              if (!out.some(r => r.packId === normalized.packId)){
                out.push(normalized);
              }
            }
          }
        } catch(e){
          console.warn('legacy read failed for', spec.key, e);
        }
      });
    }

    // Sort newest first
    out.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    return out;
  }

  // Export / import (manual backup) -----------------------------------
  function exportAll(){
    const dump = {};
    for (let i = 0; i < localStorage.length; i++){
      const fullKey = localStorage.key(i);
      if (isManagedKey(fullKey)){
        dump[fullKey] = localStorage.getItem(fullKey);
      }
    }
    return { schemaVersion: '1.0', exportedAt: new Date().toISOString(), data: dump };
  }

  function importAll(dump, options){
    options = options || {};
    if (!dump || !dump.data) return { ok: false, error: 'Invalid dump' };
    let count = 0;
    Object.keys(dump.data).forEach(fullKey => {
      if (!isManagedKey(fullKey)) return; // safety: managed namespaces only
      if (options.overwrite || localStorage.getItem(fullKey) == null){
        localStorage.setItem(fullKey, dump.data[fullKey]);
        count++;
      }
    });
    return { ok: true, count: count };
  }

  // Dump all namespaced keys (without prefix) for disk sync.
  function dumpAll(){
    const out = {};
    for (let i = 0; i < localStorage.length; i++){
      const fk = localStorage.key(i);
      if (fk && fk.indexOf(PREFIX) === 0){
        const name = fk.slice(PREFIX.length);
        try { out[name] = JSON.parse(localStorage.getItem(fk)); } catch(e){}
      } else if (isManagedKey(fk)){
        try { out[fk] = JSON.parse(localStorage.getItem(fk)); } catch(e){}
      }
    }
    return out;
  }

  // Dev utility
  function clearAll(){
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++){
      const fk = localStorage.key(i);
      if (isManagedKey(fk)) toDelete.push(fk);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    return toDelete.length;
  }

  global.EceStorage = {
    PREFIX: PREFIX,
    MANAGED_PREFIXES: MANAGED_PREFIXES.slice(),
    isManagedKey: isManagedKey,
    get: get, set: set, remove: remove,
    getProfiles: getProfiles, setProfiles: setProfiles,
    getActive: getActive, setActive: setActive,
    getAllPacks: getAllPacks, savePack: savePack, deletePack: deletePack,
    getAssignments: getAssignments, setAssignments: setAssignments,
    saveResult: saveResult, getResults: getResults,
    exportAll: exportAll, importAll: importAll,
    clearAll: clearAll,
    onChange: onChange, dumpAll: dumpAll
  };
})(window);
