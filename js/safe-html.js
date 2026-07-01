(function(global){
  'use strict';

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value){
    return escapeHtml(value);
  }

  global.EceSafeHtml = {
    escapeHtml: escapeHtml,
    escapeAttribute: escapeAttribute
  };
})(window);
