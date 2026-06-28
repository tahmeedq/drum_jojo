import { useState } from "react";
import { S } from "../engine/state.js";
import { useBus, useRenderOn } from "../hooks/useBus.js";

export default function SongTimeline() {
  useRenderOn(["view"]);
  const [now, setNow] = useState(0);
  useBus("partChanged", (d) => setNow(d.idx));
  useBus("transport", (d) => { if (!d.playing) setNow(0); });
  if (!S.song) return null;
  return (
    <div className="songstruct">
      {S.song.parts.map((p, i) => (
        <div key={i} className={"chip" + (i === now ? " now" : "")}>
          <b>{p.label}</b>
          <small>{p.bars} bar{p.bars > 1 ? "s" : ""}</small>
        </div>
      ))}
    </div>
  );
}
