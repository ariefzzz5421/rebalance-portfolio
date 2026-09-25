(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PorsiFX = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function orientHistory(history, reversed = false) {
    return (history || []).filter(point => Number.isFinite(point?.t) && Number.isFinite(point?.v) && point.v > 0)
      .map(point => ({ t: point.t, v: reversed ? point.v : 1 / point.v }));
  }
  function invertHistory(history) { return orientHistory(history); }
  return { invertHistory, orientHistory };
});
