import { S } from "../engine/state.js";
import { COURSE } from "../engine/data/index.js";
import { store, lessonKey, saveStore } from "../engine/core/store.js";
import { selectLesson } from "../engine/controller.js";
import { useRenderOn } from "../hooks/useBus.js";

export default function PatternHeader() {
  useRenderOn(["view"]);
  const p = S.current;
  if (!p) return null;
  const lesson = S.activeLesson ? COURSE[S.activeLesson.l].lessons[S.activeLesson.i] : null;
  const song = S.mode === "song" && !lesson ? S.song : null;
  const best = store.best[S.itemKey];

  let title, badges = [], desc, tip;
  if (lesson) {
    title = <><span className="kicker">Lesson</span> {lesson.title}</>;
    badges = [["meter", (S.current && S.current.meter) || "4/4"], ["tempo", "target " + lesson.target + " bpm"]];
    desc = S.mode === "song" ? S.song.desc : (S.current.desc || "");
    tip = S.current.tip;
  } else if (song) {
    title = song.name;
    badges = [["meter", "Song"], ["tempo", song.bpm + " bpm"]];
    desc = song.desc;
    tip = "Use the section timeline above — it highlights the part playing now.";
  } else {
    title = p.name;
    badges = [["style", p.style || p.fam || ""], ["meter", p.meter], ["tempo", p.bpm + " bpm"]];
    desc = p.desc || "";
    tip = p.tip;
  }

  return (
    <div className="phead-wrap">
      <div className="phead">
        <div>
          <h2 className="ptn-name">{title}</h2>
          <div className="badges">
            {badges.map(([cls, txt], i) => txt ? <span key={i} className={"badge " + cls}>{txt}</span> : null)}
            {!lesson && !song && p.diff ? <span className="stars">{"★".repeat(p.diff)}</span> : null}
            {best && <span className="badge best">★ Best {best.acc}% · {best.bpm || "—"}bpm</span>}
          </div>
        </div>
      </div>

      {desc && <p className="desc">{desc}</p>}

      {lesson && (
        <div className="lessonbox">
          <div className="goal"><b>Goal</b><p>{lesson.goal}</p></div>
          <div className="focus">
            {lesson.focus}
            {lesson.tips && <ul>{lesson.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
          </div>
        </div>
      )}

      {tip && <div className="tip">💡 {tip}</div>}

      {lesson && <LessonBar lesson={lesson} />}
    </div>
  );
}

function LessonBar() {
  useRenderOn(["view"]);
  const { l, i } = S.activeLesson;
  const done = store.done[lessonKey(l, i)];
  const total = COURSE.reduce((a, lv) => a + lv.lessons.length, 0);
  const doneN = Object.keys(store.done).length;

  const markComplete = () => {
    store.done[lessonKey(l, i)] = 1; saveStore();
    let nl = l, ni = i + 1;
    if (ni >= COURSE[nl].lessons.length) { nl++; ni = 0; }
    if (nl >= COURSE.length) { nl = l; ni = i; }
    selectLesson(nl, ni);
  };

  return (
    <div className="lessonbar">
      <button className="btn primary" onClick={markComplete}>
        {done ? "✓ Completed — Replay next ▶" : "Mark complete & next ▶"}
      </button>
      <span className="progress">Progress: {doneN}/{total} lessons</span>
    </div>
  );
}
