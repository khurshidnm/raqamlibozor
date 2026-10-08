/**
 * Scripts that must run before first paint are inlined in <head>. Their exact
 * text is hashed into the Content-Security-Policy by src/integrations/build-extras.ts,
 * so edit them here only.
 */

/** Sets --page-zoom synchronously so wide screens never paint un-zoomed and then shift. */
export const PAGE_ZOOM_INLINE =
  "(function(){var w=document.documentElement.clientWidth;document.documentElement.style.setProperty('--page-zoom',(w>=1440?1+(w/1440-1)*.5:1).toFixed(4));})();";
