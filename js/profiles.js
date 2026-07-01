// Erkan English - single learner profile shim.
// Keeps compatibility with the Ece Assessments players.

(function(global){
  'use strict';

  const ERKAN = {
    id: 'erkan',
    name: 'Erkan',
    role: 'child',
    color: '#52604e',
    year: null,
    yearGroup: 'Adult Learner',
    schoolName: 'British English / Work English',
    createdAt: '2026-07-01T00:00:00.000Z'
  };

  function ensureDefaults(){
    const list = global.EceStorage.getProfiles();
    if (!Array.isArray(list) || !list.some(p => p && p.id === ERKAN.id)){
      global.EceStorage.setProfiles([ERKAN]);
    }
    if (!global.EceStorage.getActive()){
      setActive(ERKAN.id);
    }
    return listProfiles();
  }

  function listProfiles(){
    const list = global.EceStorage.getProfiles();
    return Array.isArray(list) && list.length ? list : [ERKAN];
  }

  function listChildren(){
    return listProfiles();
  }

  function getProfile(id){
    return listProfiles().find(p => p.id === id) || ERKAN;
  }

  function getActive(){
    return global.EceStorage.getActive() || { profileId: ERKAN.id, mode: 'child' };
  }

  function setActive(profileId){
    const active = { profileId: profileId || ERKAN.id, mode: 'child', at: new Date().toISOString() };
    global.EceStorage.setActive(active);
    return active;
  }

  function clearActive(){
    setActive(ERKAN.id);
  }

  global.EceProfiles = {
    ROLES: { CHILD: 'child', PARENT: 'parent' },
    ensureDefaults,
    listProfiles,
    listChildren,
    getProfile,
    getActive,
    setActive,
    clearActive
  };
})(window);
