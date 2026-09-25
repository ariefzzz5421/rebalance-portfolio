(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PorsiFX = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function invertHistory(history) {
    return (history || []).filter(point => Number.isFinite(point?.t) && Number.isFinite(point?.v) && point.v > 0)
      .map(point => ({ t: point.t, v: 1 / point.v }));
  }
  return { invertHistory };
});
