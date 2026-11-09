import { onBeforeUnmount, ref, watch, type Ref } from "vue";

type AlphaMask = { src: string; width: number; height: number; alpha: Uint8Array };
type Point = { x: number; y: number; at: number };
// Keep only one compact alpha map across mode switches; never export or edit the PNG.
let cachedMask: AlphaMask | undefined;

export function useFishPetting(
  stage: Ref<HTMLElement | null>,
  image: Ref<HTMLImageElement | null>,
  active: Readonly<Ref<boolean>>,
) {
  const strength = ref(0);
  const hitState = ref<"loading" | "ready" | "unavailable">("loading");
  let mask: AlphaMask | undefined;
  let pending: Point | undefined;
  let previous: Point | undefined;
  let frame = 0;
  let lastFrame = 0;
  let lastStroke = -Infinity;
  let input = 0;
  let disposed = false;

  function onImageLoad() {
    const img = image.value;
    if (disposed || !img?.naturalWidth) return;
    try {
      if (cachedMask?.src === img.currentSrc) mask = cachedMask;
      else {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        try {
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("无法读取图片透明度");
          context.drawImage(img, 0, 0);
          const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const alpha = new Uint8Array(canvas.width * canvas.height);
          for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3]!;
          mask = { src: img.currentSrc, width: canvas.width, height: canvas.height, alpha };
          cachedMask = mask;
        } finally {
          canvas.width = canvas.height = 0;
        }
      }
      hitState.value = "ready";
    } catch (error) {
      mask = undefined;
      hitState.value = "unavailable";
      console.error("团团透明度读取失败，已停用抚摸反馈：", error);
    }
  }

  function hitsFish(point: Point): boolean {
    const root = stage.value;
    if (!root || !mask) return false;
    const box = root.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    // All nested motion layers share the same box and center transform origin.
    // Invert their current matrices so moving/rotating PNG edges stay accurate.
    let matrix = new DOMMatrix();
    for (const layer of root.querySelectorAll<HTMLElement>("[data-motion]")) {
      const transform = getComputedStyle(layer).transform;
      if (transform !== "none") matrix = matrix.multiply(new DOMMatrix(transform));
    }
    const local = new DOMPoint(point.x - box.left - box.width / 2, point.y - box.top - box.height / 2)
      .matrixTransform(matrix.inverse());
    const scale = Math.min(box.width / mask.width, box.height / mask.height);
    const x = Math.floor((local.x + mask.width * scale / 2) / scale);
    const y = Math.floor((local.y + mask.height * scale / 2) / scale);
    return x >= 0 && y >= 0 && x < mask.width && y < mask.height
      && mask.alpha[y * mask.width + x]! >= 64;
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !active.value) return;
    if (lastFrame && now - lastFrame < 1000 / 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = lastFrame ? Math.min(now - lastFrame, 100) : 33;
    lastFrame = now;
    if (pending) {
      const point = pending;
      pending = undefined;
      if (hitsFish(point)) {
        if (previous && point.at - previous.at < 180) {
          const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
          if (distance > 0.3) {
            input = Math.min(1, distance / 12);
            lastStroke = point.at;
          }
        }
        previous = point;
      } else {
        previous = undefined;
        input = 0;
      }
    }
    const target = now - lastStroke < 140 ? input : 0;
    const smoothing = 1 - Math.exp(-dt / (target > strength.value ? 120 : 450));
    strength.value += (target - strength.value) * smoothing;
    if (!target && strength.value < 0.002) strength.value = 0;
    if (target || strength.value || pending) frame = requestAnimationFrame(tick);
    else lastFrame = 0;
  }

  function onPointerMove(event: PointerEvent) {
    if (!active.value || event.pointerType !== "mouse" || event.buttons !== 0
      || (event.target instanceof Element && event.target.closest("[data-life-controls]"))) {
      stopPetting();
      return;
    }
    pending = { x: event.clientX, y: event.clientY, at: performance.now() };
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function stopPetting() {
    pending = previous = undefined;
    input = 0;
    lastStroke = -Infinity;
    // Let existing feedback decay; no movement, timer or synthetic stroke is added.
  }

  function reset() {
    stopPetting();
    cancelAnimationFrame(frame);
    frame = lastFrame = 0;
    strength.value = 0;
  }

  watch(active, value => { if (!value) reset(); });
  onBeforeUnmount(() => { disposed = true; reset(); mask = undefined; });
  return { strength, hitState, onImageLoad, onPointerMove, stopPetting };
}
