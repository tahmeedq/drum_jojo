/* ============================================================
   CommandPalette — ⌘K / Ctrl+K global command palette.

   Mount exactly ONCE near the app root (no props needed):
     import CommandPalette from "./components/CommandPalette";
     ...
     <CommandPalette />

   Self-manages open/closed state.  Keyboard events are bound
   on the document; the listener ignores ⌘K / Ctrl+K when focus
   is inside any INPUT, SELECT, or TEXTAREA other than the
   palette's own search box.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/palette.css";
import { S } from "../engine/state.js";
import { selectSection, selectPattern, selectSong } from "../engine/controller.js";
import { LIB, SONGS } from "../engine/data/index.js";

/* ---- Navigation section entries ---- */
const SECTION_ENTRIES = [
  { id: "nav:course",   icon: "🎓", label: "Course",    tag: "Navigate", action: () => selectSection("course")   },
  { id: "nav:groove",   icon: "🥁", label: "Grooves",   tag: "Navigate", action: () => selectSection("groove")   },
  { id: "nav:rudiment", icon: "🥢", label: "Rudiments", tag: "Navigate", action: () => selectSection("rudiment") },
  { id: "nav:fill",     icon: "🎵", label: "Fills",     tag: "Navigate", action: () => selectSection("fill")     },
  { id: "nav:song",     icon: "🎶", label: "Songs",     tag: "Navigate", action: () => selectSection("song")     },
  { id: "nav:create",   icon: "✏️",  label: "Create",   tag: "Navigate", action: () => selectSection("create")   },
];

/*
 * Build the full static command list once at module load (data never changes
 * at runtime).  Each entry has: id, icon, label, tag, group, action.
 *
 * Patterns: set S.sec BEFORE calling selectPattern so the controller can
 *   derive the right itemKey prefix (it reads S.sec internally).
 *
 * Songs: same deal — set S.sec = "song" then call selectSong.
 */
function buildCommands() {
  const cmds = [...SECTION_ENTRIES];

  // --- Grooves ---
  for (const item of LIB.groove) {
    cmds.push({
      id: `groove:${item.name}`,
      icon: "🥁",
      label: item.name,
      tag: item.style || "Groove",
      group: "Grooves",
      action: () => { S.sec = "groove"; selectPattern(item); },
    });
  }

  // --- Rudiments ---
  for (const item of LIB.rudiment) {
    cmds.push({
      id: `rudiment:${item.name}`,
      icon: "🥢",
      label: item.name,
      tag: item.fam || "Rudiment",
      group: "Rudiments",
      action: () => { S.sec = "rudiment"; selectPattern(item); },
    });
  }

  // --- Fills ---
  for (const item of LIB.fill) {
    cmds.push({
      id: `fill:${item.name}`,
      icon: "🎵",
      label: item.name,
      tag: item.fam || "Fill",
      group: "Fills",
      action: () => { S.sec = "fill"; selectPattern(item); },
    });
  }

  // --- Songs ---
  for (const song of SONGS) {
    cmds.push({
      id: `song:${song.name}`,
      icon: "🎶",
      label: song.name,
      tag: "Song",
      group: "Songs",
      action: () => { S.sec = "song"; selectSong(song); },
    });
  }

  return cmds;
}

const ALL_COMMANDS = buildCommands();

/* Case-insensitive substring match across label + tag. */
function filter(query) {
  if (!query.trim()) return ALL_COMMANDS;
  const q = query.toLowerCase();
  return ALL_COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q)
  );
}

/* ---- CommandPalette component ---- */
export default function CommandPalette() {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);   // index into `results`

  const inputRef = useRef(null);

  const results = useMemo(() => filter(query), [query]);

  // Clamp cursor when results list changes length.
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)));
  }, [results.length]);

  /* Auto-focus the text input when the palette opens. */
  useEffect(() => {
    if (open) {
      // Small rAF so the element is visible before focus.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  /* Open / close the palette. */
  const openPalette  = useCallback(() => { setQuery(""); setCursor(0); setOpen(true);  }, []);
  const closePalette = useCallback(() => setOpen(false), []);

  /* Activate the result at `idx` and close. */
  const activate = useCallback((idx) => {
    const cmd = results[idx];
    if (!cmd) return;
    cmd.action();
    closePalette();
  }, [results, closePalette]);

  /* Global keydown — toggles ⌘K / Ctrl+K, ignores modifier if the user
     is typing in a real input (not our palette's own input). */
  useEffect(() => {
    const onKey = (e) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key === "k";

      if (isModK) {
        /* Ignore if a different input is focused. */
        const tag = document.activeElement?.tagName;
        const isPaletteInput = document.activeElement === inputRef.current;
        if (!isPaletteInput && (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA")) return;

        e.preventDefault();
        if (open) closePalette();
        else openPalette();
        return;
      }

      /* Keys below only matter when the palette is open. */
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => (c + 1) % Math.max(1, results.length));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => (c - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        activate(cursor);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, cursor, results, openPalette, closePalette, activate]);

  /* Scroll highlighted item into view. */
  const itemRefs = useRef([]);
  useEffect(() => {
    itemRefs.current[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  /* Group results for rendering: insert a group header each time the
     group label changes.  Section-nav entries have no group so they
     appear first without a header. */
  const rows = [];
  let lastGroup = "__none__";
  results.forEach((cmd, idx) => {
    const grp = cmd.group || null;
    if (grp !== lastGroup) {
      if (grp) rows.push({ type: "group", label: grp, key: "grp:" + grp });
      lastGroup = grp;
    }
    rows.push({ type: "item", cmd, idx, key: cmd.id });
  });

  return (
    /* Clicking the backdrop closes the palette. */
    <div className="cp-backdrop" onMouseDown={closePalette} role="dialog" aria-modal="true" aria-label="Command palette">
      {/* Stop propagation so clicks inside the panel do NOT close it. */}
      <div className="cp-panel" onMouseDown={(e) => e.stopPropagation()}>

        {/* Search row */}
        <div className="cp-search">
          <span className="cp-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            className="cp-input"
            type="text"
            placeholder="Search sections, grooves, rudiments, fills, songs…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cp-kbd">Esc</span>
        </div>

        {/* Results list */}
        <div className="cp-list" role="listbox">
          {rows.length === 0 && (
            <div className="cp-empty">No results for "{query}"</div>
          )}
          {rows.map((row) => {
            if (row.type === "group") {
              return <div key={row.key} className="cp-group">{row.label}</div>;
            }
            const { cmd, idx } = row;
            const active = idx === cursor;
            return (
              <button
                key={row.key}
                ref={(el) => { itemRefs.current[idx] = el; }}
                className={"cp-item" + (active ? " cp-active" : "")}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setCursor(idx)}
                onClick={() => activate(idx)}
              >
                <span className="cp-item-icon" aria-hidden="true">{cmd.icon}</span>
                <span className="cp-item-label">{cmd.label}</span>
                <span className="cp-item-tag">{cmd.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Footer key hints */}
        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cp-hint"><kbd>↵</kbd> open</span>
          <span className="cp-hint"><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
