/**
 * Scripts that must run before first paint are inlined in <head>. Their exact
 * text is hashed into the Content-Security-Policy by src/integrations/build-extras.ts,
 * so edit them here only.
 */

/**
 * Runs before first paint: sets --page-zoom so wide screens never paint un-zoomed and then
 * shift, and skips the page loader when it was already shown in this session (scripts/loader.ts).
 */
export const PAGE_ZOOM_INLINE =
  "(function(){var d=document.documentElement,w=d.clientWidth;d.style.setProperty('--page-zoom',(w>=1440?1+(w/1440-1)*.5:1).toFixed(4));try{if(sessionStorage.getItem('rb-loaded'))d.classList.add('loader-skip')}catch(e){}})();";
