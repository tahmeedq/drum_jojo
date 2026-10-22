import { useRef, useState } from "react";
import { S, emit } from "../engine/state.js";
import { setSongPart, setSongLoop, songLoopRange } from "../engine/core/scheduler.js";
import { useBus, useRenderOn } from "../hooks/useBus.js";

// Section name = label before " · " (e.g. "Verse 1 · 12" → "Verse 1"); bars without a
// section (e.g. "Stop 26") stand alone.
const sectionOf = (label) => (label.includes(" · ") ? label.split(" · ")[0] : label);

export default function SongTimeline() {
  useRenderOn(["view", "songLoop"]);
  const [now, setNow] = useState(0);
  const anchor = useRef(null);            // first shift-clicked part while picking a range
  useBus("partChanged", (d) => setNow(d.idx));
  useBus("transport", (d) => { if (!d.playing) setNow(songLoopRange() ? songLoopRange().start : 0); });
  if (!S.song) return null;
  const parts = S.song.parts;
  const loop = songLoopRange();

  // Jump to a section to preview its notation (or steer playback there live).
  const go = (i) => {
    S.songIdx = i; S.barsPlayed = 0;
    setSongPart(i);
    setNow(i);
    emit("partChanged", { idx: i, live: S.playing });
  };

  // Shift-click two chips to loop everything between them (one chip = loop that bar).
  const pick = (i, e) => {
    if (!e.shiftKey) { anchor.current = null; go(i); return; }
    if (anchor.current === null) { anchor.current = i; setSongLoop({ start: i, end: i }); }
    else { setSongLoop({ start: anchor.current, end: i }); anchor.current = null; }
  };

  // Loop the contiguous run of parts that share the current part's section name.
  const loopSection = () => {
    const name = sectionOf(parts[now].label);
    let a = now, b = now;
    while (a > 0 && sectionOf(parts[a - 1].label) === name) a--;
    while (b < parts.length - 1 && sectionOf(parts[b + 1].label) === name) b++;
    anchor.current = null;
    setSongLoop({ start: a, end: b });
  };

  const loopBars = loop ? parts.slice(loop.start, loop.end + 1).reduce((n, p) => n + (p.bars || 1), 0) : 0;

  return (
    <>
      <div className="songloop">
        <button className={"mini" + (loop ? " on" : "")} onClick={loopSection} title="Loop the section the playhead is in">
          Loop section
        </button>
        {loop ? (
          <>
            <span className="songloop-range">
              <b>{parts[loop.start].label}</b> → <b>{parts[loop.end].label}</b> · {loopBars} bar{loopBars > 1 ? "s" : ""}
            </span>
            <button className="mini" onClick={() => { anchor.current = null; setSongLoop(null); }} title="Play the whole song again">Clear</button>
          </>
        ) : (
          <span className="songloop-hint">Shift-click two sections to loop a range</span>
        )}
      </div>
      <div className="songstruct">
        {parts.map((p, i) => {
          const inLoop = loop && i >= loop.start && i <= loop.end;
          const cls = "chip" + (i === now ? " now" : "") + (inLoop ? " loopin" : "") +
            (loop && (i === loop.start || i === loop.end) ? " loopedge" : "") +
            (anchor.current === i ? " loopanchor" : "");
          return (
            <button key={i} className={cls} onClick={(e) => pick(i, e)}
              title={`${p.label} — click to preview, shift-click to set loop range`}>
              <b>{p.label}</b>
              <small>{p.bars} bar{p.bars > 1 ? "s" : ""}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}
