import { useEffect, useRef } from "react";
import { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Tuplet, Stem } from "vexflow";
import { S, on } from "../engine/state.js";
import { useRenderOn } from "../hooks/useBus.js";

/* voice id -> [staff key, notehead suffix]  (treble-clef drumset convention) */
const MAP = {
  crash:  ["a/5", "x2"], ride: ["f/5", "x2"], openhat: ["g/5", "x2"], hat: ["g/5", "x2"],
  tom1:   ["e/5", ""],   tom2: ["d/5", ""],   floor:   ["g/4", ""],
  snare:  ["c/5", ""],   rim:  ["c/5", "x2"], kick:    ["f/4", ""],
};
const UP_IDS = ["crash", "ride", "openhat", "hat", "tom1", "tom2", "snare", "rim", "floor"];
const DOWN_IDS = ["kick"];
const REST_UP = "b/4", REST_DOWN = "d/4";

// duration token per grid step + how many steps form a beamed/tuplet group
function durInfo(sub) {
  if (sub === 6) return { dur: "16", group: 6, tuplet: [6, 4] };
  if (sub === 3) return { dur: "8", group: 3, tuplet: [3, 2] };
  if (sub === 2) return { dur: "8", group: 2, tuplet: null };
  return { dur: "16", group: 4, tuplet: null };           // sub === 4
}

export default function Notation() {
  useRenderOn(["view", "partChanged"]);
  const host = useRef(null);
  const p = S.current;

  useEffect(() => {
    const el = host.current;
    if (!el || !p) return;
    el.innerHTML = "";
    const offs = [];
    try {
      const { dur, group, tuplet } = durInfo(p.sub);
      const steps = p._steps;
      const colW = 38;
      const width = Math.max(360, steps * colW + 90);

      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(width + 20, 160);
      const ctx = renderer.getContext();
      ctx.setFillStyle("#16202e"); ctx.setStrokeStyle("#16202e");

      const stave = new Stave(8, 26, width);
      stave.addClef("percussion");
      stave.setContext(ctx).draw();

      // Rests are kept (so spacing/beats stay aligned) but rendered invisible
      // — a practice chart reads cleaner showing only the notes you play.
      const note = (keys, d, dir, rest) => {
        const n = new StaveNote({ keys, duration: d, stemDirection: dir, stem_direction: dir, clef: "percussion" });
        if (rest) n.setStyle({ fillStyle: "rgba(0,0,0,0)", strokeStyle: "rgba(0,0,0,0)" });
        return n;
      };

      const buildVoice = (ids, dir, restKey) => {
        const notes = [];
        for (let s = 0; s < steps; s++) {
          const keys = [];
          ids.forEach(id => {
            if ((p._t[id] && p._t[id][s]) > 0) {
              const [k, nh] = MAP[id]; keys.push(nh ? `${k}/${nh}` : k);
            }
          });
          notes.push(keys.length ? note(keys, dur, dir, false) : note([restKey], dur + "r", dir, true));
        }
        return notes;
      };

      const upNotes = buildVoice(UP_IDS, Stem.UP, REST_UP);
      const downNotes = buildVoice(DOWN_IDS, Stem.DOWN, REST_DOWN);

      const mkVoice = (notes) => {
        const v = new Voice({ numBeats: steps / p.sub, beatValue: 4, num_beats: steps / p.sub, beat_value: 4 });
        v.setMode(Voice.Mode.SOFT);
        v.addTickables(notes);
        return v;
      };
      const upVoice = mkVoice(upNotes);
      const downVoice = mkVoice(downNotes);

      new Formatter().joinVoices([upVoice, downVoice]).format([upVoice, downVoice], width - 70);

      // beams + tuplets per beat group, for each voice
      const beams = [];
      const tuplets = [];
      for (const notes of [upNotes, downNotes]) {
        for (let i = 0; i < notes.length; i += group) {
          const slice = notes.slice(i, i + group);
          const sounding = slice.filter(n => !n.isRest());
          if (sounding.length > 1) beams.push(new Beam(sounding));
          if (tuplet) tuplets.push(new Tuplet(slice, { numNotes: tuplet[0], notesOccupied: tuplet[1], num_notes: tuplet[0], notes_occupied: tuplet[1] }));
        }
      }

      upVoice.draw(ctx, stave);
      downVoice.draw(ctx, stave);
      beams.forEach(b => b.setContext(ctx).draw());
      tuplets.forEach(t => t.setContext(ctx).draw());

      // Live playhead: highlight the note(s) at the current step during playback.
      const stepEls = [];
      for (let s = 0; s < steps; s++) {
        const a = upNotes[s].isRest() ? null : upNotes[s].getSVGElement();
        const b = downNotes[s].isRest() ? null : downNotes[s].getSVGElement();
        stepEls.push([a, b].filter(Boolean));
      }
      let prev = -1;
      const clearHi = () => { if (prev >= 0 && stepEls[prev]) stepEls[prev].forEach(g => g.classList.remove("nt-hi")); prev = -1; };
      offs.push(on("tick", ({ step }) => {
        if (!S.playing) return;
        clearHi();
        if (stepEls[step]) { stepEls[step].forEach(g => g.classList.add("nt-hi")); prev = step; }
      }));
      offs.push(on("transport", (d) => { if (!d.playing) clearHi(); }));
    } catch (e) {
      el.innerHTML = `<div class="notation-err">Couldn't render notation for this pattern.<br><small>${(e && e.message) || e}</small></div>`;
    }
    return () => offs.forEach(f => f());
  });

  if (!p) return null;
  return <div className="notation"><div className="notation-svg" ref={host} /></div>;
}
