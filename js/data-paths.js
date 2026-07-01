(function(global){
  'use strict';

  const DEFAULT_CHILD_ID = 'erkan';
  const SCOPED_SEGMENTS = ['banks', 'generated', 'images', 'packs', 'pdfs', 'registries', 'sources'];

  function getActiveProfileId(){
    try {
      if (global.EceProfiles && typeof global.EceProfiles.getActive === 'function'){
        const active = global.EceProfiles.getActive();
        if (active && active.profileId) return active.profileId;
      }
    } catch (_err) {}

    try {
      const raw = localStorage.getItem('erkan_english.active');
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profileId) return parsed.profileId;
      }
    } catch (_err) {}

    try {
      const lastViewedChild = localStorage.getItem('erkan_english.lastViewedChild');
      if (lastViewedChild) return JSON.parse(lastViewedChild) || DEFAULT_CHILD_ID;
    } catch (_err) {}

    return DEFAULT_CHILD_ID;
  }

  function isScopedDataPath(relPath){
    if (!relPath || typeof relPath !== 'string') return false;
    return SCOPED_SEGMENTS.some(function(segment){
      return relPath === 'data/' + segment || relPath.indexOf('data/' + segment + '/') === 0;
    });
  }

  function toChildScopedPath(relPath, profileId){
    if (!isScopedDataPath(relPath)) return relPath;
    const childId = profileId || getActiveProfileId();
    return relPath.replace(/^data\//, 'data/' + childId + '/');
  }

  function listCandidatePaths(relPath, profileId){
    if (!relPath || typeof relPath !== 'string') return [];
    if (!isScopedDataPath(relPath)) return [relPath];

    const childPath = toChildScopedPath(relPath, profileId);
    return childPath === relPath ? [relPath] : [childPath, relPath];
  }

  function toServerPath(relPath){
    if (!relPath) return relPath;
    return relPath.charAt(0) === '/' ? relPath : '/' + relPath;
  }

  global.EceDataPaths = {
    DEFAULT_CHILD_ID: DEFAULT_CHILD_ID,
    SCOPED_SEGMENTS: SCOPED_SEGMENTS.slice(),
    getActiveProfileId: getActiveProfileId,
    isScopedDataPath: isScopedDataPath,
    toChildScopedPath: toChildScopedPath,
    listCandidatePaths: listCandidatePaths,
    toServerPath: toServerPath
  };
})(window);
