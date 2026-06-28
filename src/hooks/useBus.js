import { useEffect, useReducer, useRef, useState } from "react";
import { on } from "../engine/state.js";

/* Subscribe a component to one event-bus type. The handler always sees
   the latest closure (stored in a ref) so callers needn't memoize it. */
export function useBus(type, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => on(type, (d) => ref.current(d)), [type]);
}

/* Subscribe to several event types with one handler. */
export function useBusEvents(types, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const offs = types.map(t => on(t, (d) => ref.current(t, d)));
    return () => offs.forEach(off => off());
  }, [types.join("|")]);   // eslint-disable-line
}

/* Force a re-render — handy to mirror mutable engine state into React. */
export function useForceRender() {
  const [, tick] = useReducer(x => x + 1, 0);
  return tick;
}

/* Re-render this component whenever any of the given events fire. */
export function useRenderOn(types) {
  const tick = useForceRender();
  useBusEvents(types, tick);
}

/* Bus-backed value: recompute `read()` whenever an event fires. */
export function useBusValue(types, read) {
  const [val, setVal] = useState(read);
  useBusEvents(types, () => setVal(read()));
  return val;
}
