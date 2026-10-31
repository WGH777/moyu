import { onBeforeUnmount } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";

const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, option, a, label, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="slider"], [role="checkbox"], [role="switch"], [data-no-window-drag]';

export function useWindowDrag() {
  let cleanup: (() => void) | undefined;

  function onPointerDown(event: PointerEvent) {
    cleanup?.();

    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      event.buttons !== 1 ||
      !(event.currentTarget instanceof HTMLElement) ||
      !(event.target instanceof Element) ||
      event.target.closest(INTERACTIVE_SELECTOR)
    ) {
      return;
    }

    const region = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.screenX;
    const startY = event.screenY;
    const listeners = new AbortController();

    function stop() {
      listeners.abort();
      cleanup = undefined;
      if (region.hasPointerCapture(pointerId)) {
        region.releasePointerCapture(pointerId);
      }
    }

    function onPointerMove(move: PointerEvent) {
      if (move.pointerId !== pointerId) return;
      if (move.buttons !== 1) {
        stop();
        return;
      }
      if (Math.hypot(move.screenX - startX, move.screenY - startY) <= 6) {
        return;
      }

      // Release WebView capture before handing the mouse to the native move loop.
      // Clear detection first: native dragging may consume the eventual pointerup.
      stop();
      try {
        void getCurrentWindow().startDragging().catch((error: unknown) => {
          console.error("启动窗口拖动失败：", error);
        });
      } catch (error) {
        console.error("启动窗口拖动失败：", error);
      }
    }

    function onPointerEnd(end: PointerEvent) {
      if (end.pointerId === pointerId) stop();
    }

    cleanup = stop;
    window.addEventListener("pointermove", onPointerMove, { signal: listeners.signal });
    window.addEventListener("pointerup", onPointerEnd, { signal: listeners.signal });
    window.addEventListener("pointercancel", onPointerEnd, { signal: listeners.signal });
    window.addEventListener("blur", stop, { signal: listeners.signal });
    region.addEventListener("lostpointercapture", onPointerEnd, { signal: listeners.signal });

    try {
      region.setPointerCapture(pointerId);
      event.preventDefault();
    } catch (error) {
      stop();
      console.error("初始化窗口拖动检测失败：", error);
    }
  }

  onBeforeUnmount(() => cleanup?.());

  return { onPointerDown };
}
