/**
 * Plays a short alert sound in the browser. Browsers block audio until the
 * user has interacted with the page, so a blocked play() is ignored rather
 * than surfaced: the toast still shows.
 */
export function playAlert(src = '/sounds/alert.mp3', volume = 0.4) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
}
