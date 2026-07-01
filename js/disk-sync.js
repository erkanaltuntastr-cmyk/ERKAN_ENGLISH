// Ece Assessments — Disk sync via File System Access API (Chromium-based browsers).
// Mirrors localStorage to a user-selected `data/` folder on disk so:
// - Data survives browser cache clears
// - External tools (Claude Code, git, scripts) can read it
// - Git can version-control content packs and results
//
// Depends on: EceStorage (must be loaded first; we subscribe to its onChange).

(function(global){
  'use strict';

  // ── IndexedDB for persisting the directory handle ──────────────────
  const IDB_NAME = 'erkan_english_sync';
  const IDB_STORE = 'handles';

  function openIdb(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbGet(key){
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
      tx.onsuccess = () => resolve(tx.result);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbPut(key, value){
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(value, key);
      tx.onsuccess = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbDel(key){
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).delete(key);
      tx.onsuccess = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── State ──────────────────────────────────────────────────────────
  let _handle = null;
  let _ready = false;
  let _listeners = [];

  function notify(){
    _listeners.forEach(fn => { try { fn(state()); } catch(e){} });
  }
  function state(){
    return { ready: _ready, handle: _handle, name: _handle ? _handle.name : null };
  }

  // ── Supported check ────────────────────────────────────────────────
  function isSupported(){
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  // ── Permission handling ────────────────────────────────────────────
  async function verifyPermission(handle, prompt){
    if (!handle) return false;
    const opts = { mode: 'readwrite' };
    const cur = await handle.queryPermission(opts);
    if (cur === 'granted') return true;
    if (!prompt) return false;
    const req = await handle.requestPermission(opts);
    return req === 'granted';
  }

  // ── Try silent resume on page load ─────────────────────────────────
  async function tryResume(){
    if (!isSupported()) return false;
    try {
      const stored = await idbGet('root');
      if (!stored) return false;
      const ok = await verifyPermission(stored, false);
      if (!ok){
        // Permission expired; keep handle stored but mark not ready.
        // UI can call reauthorize() to prompt.
        _handle = stored;
        _ready = false;
        notify();
        return false;
      }
      _handle = stored;
      _ready = true;
      notify();
      return true;
    } catch(e){
      console.warn('[disk-sync] resume failed', e);
      return false;
    }
  }

  // ── User-initiated pick / re-auth ──────────────────────────────────
  async function pick(){
    if (!isSupported()){
      throw new Error('Bu tarayıcı File System Access API\'yi desteklemiyor (Chrome/Edge gerek).');
    }
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
    const ok = await verifyPermission(handle, true);
    if (!ok) throw new Error('İzin verilmedi.');
    await idbPut('root', handle);
    _handle = handle;
    _ready = true;
    notify();
    return state();
  }

  async function reauthorize(){
    if (!_handle){ return pick(); }
    const ok = await verifyPermission(_handle, true);
    if (!ok) throw new Error('İzin verilmedi.');
    _ready = true;
    notify();
    return state();
  }

  async function disconnect(){
    await idbDel('root');
    _handle = null;
    _ready = false;
    notify();
  }

  // ── Low-level file ops ─────────────────────────────────────────────
  async function getDirHandle(relPath, create){
    if (!_handle) throw new Error('Bağlı değil');
    const parts = String(relPath || '').split('/').filter(Boolean);
    let dir = _handle;
    for (const p of parts){
      dir = await dir.getDirectoryHandle(p, { create: !!create });
    }
    return dir;
  }

  function splitPath(relPath){
    const parts = String(relPath).split('/');
    const filename = parts.pop();
    const dirPath = parts.join('/');
    return { filename, dirPath };
  }

  async function writeJson(relPath, obj){
    if (!_ready) return false;
    try {
      const { filename, dirPath } = splitPath(relPath);
      const dir = dirPath ? await getDirHandle(dirPath, true) : _handle;
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(obj, null, 2));
      await writable.close();
      return true;
    } catch(e){
      console.warn('[disk-sync] writeJson failed for', relPath, e);
      return false;
    }
  }

  async function readJson(relPath){
    if (!_handle) return null;
    try {
      const { filename, dirPath } = splitPath(relPath);
      const dir = dirPath ? await getDirHandle(dirPath, false) : _handle;
      const fileHandle = await dir.getFileHandle(filename, { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch(e){
      return null; // missing is fine
    }
  }

  async function deleteFile(relPath){
    if (!_ready) return false;
    try {
      const { filename, dirPath } = splitPath(relPath);
      const dir = dirPath ? await getDirHandle(dirPath, false) : _handle;
      await dir.removeEntry(filename);
      return true;
    } catch(e){
      console.warn('[disk-sync] deleteFile failed for', relPath, e);
      return false;
    }
  }

  async function listDir(relPath){
    if (!_handle) return [];
    try {
      const dir = relPath ? await getDirHandle(relPath, false) : _handle;
      const entries = [];
      for await (const [name, entry] of dir.entries()){
        entries.push({ name: name, kind: entry.kind });
      }
      return entries;
    } catch(e){
      return [];
    }
  }

  // ── Key → disk path mapping ────────────────────────────────────────
  // storage.js fires { key (no prefix), value, action }
  // action ∈ 'set' | 'remove' | 'pack-save' | 'pack-delete' | 'pack-list'
  function pathForSetKey(key){
    if (key.indexOf('ece_bank.') === 0){
      const bankId = key.slice('ece_bank.'.length);
      return bankId ? 'managed-local-storage/banks/' + bankId + '.json' : null;
    }
    if (key.indexOf('erkan_writing_draft.') === 0){
      const rest = key.slice('erkan_writing_draft.'.length);
      const dot = rest.indexOf('.');
      if (dot < 0) return null;
      const cid = rest.slice(0, dot);
      const packId = rest.slice(dot + 1);
      return cid && packId ? 'managed-local-storage/writing-drafts/' + cid + '/' + packId + '.json' : null;
    }
    if (key === 'profiles') return 'profiles.json';
    if (key === 'active') return 'active.json';
    if (key === 'lastViewedChild') return 'lastViewedChild.json';
    if (key.indexOf('assignments.') === 0){
      const cid = key.slice('assignments.'.length);
      return cid ? 'assignments/' + cid + '.json' : null;
    }
    if (key.indexOf('results.') === 0){
      // results.<cid>.<pid>
      const rest = key.slice('results.'.length);
      const dot = rest.indexOf('.');
      if (dot < 0) return null;
      const cid = rest.slice(0, dot);
      const pid = rest.slice(dot + 1);
      return 'results/' + cid + '/' + pid + '.json';
    }
    // 'packs' is handled via pack-save/pack-delete actions, not by 'set' on the whole array.
    if (key === 'packs') return null;
    return null;
  }

  function onStorageChange(evt){
    if (!_ready) return;
    const { key, value, action } = evt;
    if (action === 'pack-save'){
      // value is the pack object
      writeJson('packs/' + value.id + '.json', value);
      return;
    }
    if (action === 'pack-delete'){
      // key carries the packId (we use 'packs:<id>')
      const id = key.indexOf('packs:') === 0 ? key.slice('packs:'.length) : key;
      deleteFile('packs/' + id + '.json');
      return;
    }
    if (action === 'remove'){
      const path = pathForSetKey(key);
      if (path) deleteFile(path);
      return;
    }
    // default: 'set'
    const path = pathForSetKey(key);
    if (path) writeJson(path, value);
  }

  // ── Bulk dump (after first connect) ────────────────────────────────
  async function syncFullDump(){
    if (!_ready) return { ok: false, written: 0 };
    if (!global.EceStorage) return { ok: false, written: 0 };
    let written = 0;
    const dump = EceStorage.dumpAll();
    for (const [key, value] of Object.entries(dump)){
      if (key === 'packs' && Array.isArray(value)){
        for (const pack of value){
          if (pack && pack.id){
            if (await writeJson('packs/' + pack.id + '.json', pack)) written++;
          }
        }
        continue;
      }
      const path = pathForSetKey(key);
      if (path){
        if (await writeJson(path, value)) written++;
      }
    }
    return { ok: true, written: written };
  }

  // ── Restore from disk back into localStorage ───────────────────────
  async function restoreFromDisk(){
    if (!_ready) return { ok: false, restored: 0 };
    if (!global.EceStorage) return { ok: false, restored: 0 };
    let restored = 0;

    // Top-level singletons
    for (const name of ['profiles','active','lastViewedChild']){
      const v = await readJson(name + '.json');
      if (v !== null){
        EceStorage.set(name, v); // will re-emit change, fine (idempotent)
        restored++;
      }
    }

    // Packs (one file per pack)
    const packEntries = await listDir('packs');
    const packs = [];
    for (const e of packEntries){
      if (e.kind === 'file' && e.name.endsWith('.json')){
        const p = await readJson('packs/' + e.name);
        if (p) packs.push(p);
      }
    }
    if (packs.length > 0){
      EceStorage.set('packs', packs);
      restored += packs.length;
    }

    // Assignments
    const assignEntries = await listDir('assignments');
    for (const e of assignEntries){
      if (e.kind === 'file' && e.name.endsWith('.json')){
        const cid = e.name.replace(/\.json$/, '');
        const v = await readJson('assignments/' + e.name);
        if (v !== null){
          EceStorage.set('assignments.' + cid, v);
          restored++;
        }
      }
    }

    // Results (per child folder)
    const resultsRoot = await listDir('results');
    for (const childDir of resultsRoot){
      if (childDir.kind !== 'directory') continue;
      const cid = childDir.name;
      const files = await listDir('results/' + cid);
      for (const f of files){
        if (f.kind === 'file' && f.name.endsWith('.json')){
          const pid = f.name.replace(/\.json$/, '');
          const v = await readJson('results/' + cid + '/' + f.name);
          if (v !== null){
            EceStorage.set('results.' + cid + '.' + pid, v);
            restored++;
          }
        }
      }
    }

    // Managed raw localStorage caches/drafts.
    const bankEntries = await listDir('managed-local-storage/banks');
    for (const e of bankEntries){
      if (e.kind === 'file' && e.name.endsWith('.json')){
        const bankId = e.name.replace(/\.json$/, '');
        const v = await readJson('managed-local-storage/banks/' + e.name);
        if (v !== null){
          localStorage.setItem('ece_bank.' + bankId, JSON.stringify(v));
          restored++;
        }
      }
    }

    const draftRoot = await listDir('managed-local-storage/writing-drafts');
    for (const childDir of draftRoot){
      if (childDir.kind !== 'directory') continue;
      const cid = childDir.name;
      const files = await listDir('managed-local-storage/writing-drafts/' + cid);
      for (const f of files){
        if (f.kind === 'file' && f.name.endsWith('.json')){
          const packId = f.name.replace(/\.json$/, '');
          const v = await readJson('managed-local-storage/writing-drafts/' + cid + '/' + f.name);
          if (v !== null){
            localStorage.setItem('erkan_writing_draft.' + cid + '.' + packId, JSON.stringify(v));
            restored++;
          }
        }
      }
    }

    return { ok: true, restored };
  }

  // ── Wire up to storage on load ─────────────────────────────────────
  function attach(){
    if (global.EceStorage && typeof EceStorage.onChange === 'function'){
      EceStorage.onChange(onStorageChange);
    }
    // Silent auto-resume — won't prompt; only succeeds if permission still granted.
    if (isSupported()){
      tryResume().catch(e => console.warn('[disk-sync] auto-resume failed', e));
    }
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  global.EceDisk = {
    isSupported: isSupported,
    isReady: () => _ready,
    state: state,
    onChange: (fn) => { _listeners.push(fn); return () => { _listeners = _listeners.filter(f => f !== fn); }; },
    tryResume: tryResume,
    pick: pick,
    reauthorize: reauthorize,
    disconnect: disconnect,
    writeJson: writeJson,
    readJson: readJson,
    deleteFile: deleteFile,
    listDir: listDir,
    syncFullDump: syncFullDump,
    restoreFromDisk: restoreFromDisk
  };
})(window);
