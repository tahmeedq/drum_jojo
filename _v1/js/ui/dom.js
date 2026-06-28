/* Tiny DOM helpers shared by the UI modules. */
export const $ = (id) => document.getElementById(id);
export const $$ = (s) => document.querySelectorAll(s);
export function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
