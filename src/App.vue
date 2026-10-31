<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useWindowDrag } from "./composables/useWindowDrag";

const { onPointerDown } = useWindowDrag();
const marker = ref<HTMLElement | null>(null);
let observer: ResizeObserver | undefined;
let unlistenScale: (() => void) | undefined;
let frame = 0;
let disposed = false;
let operations = Promise.resolve();

function scheduleRegion() {
  if (disposed || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    operations = operations.then(async () => {
      if (disposed || !marker.value) return;
      const rect = marker.value.getBoundingClientRect();
      try {
        await invoke("set_test_window_region", { region: {
          left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
          viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio,
        } });
      } catch (error) {
        console.error("静态窗口区域应用失败，尝试恢复完整窗口：", error);
        await invoke("set_test_window_region", { region: null }).catch(console.error);
      }
    });
  });
}

onMounted(async () => {
  await nextTick();
  if (disposed || !marker.value) return;
  observer = new ResizeObserver(scheduleRegion);
  observer.observe(marker.value);
  observer.observe(document.documentElement);
  window.addEventListener("resize", scheduleRegion);
  scheduleRegion();
  try {
    const unlisten = await getCurrentWindow().onScaleChanged(scheduleRegion);
    if (disposed) unlisten();
    else unlistenScale = unlisten;
  } catch (error) {
    console.error("监听窗口 DPI 变化失败：", error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  unlistenScale?.();
  window.removeEventListener("resize", scheduleRegion);
  cancelAnimationFrame(frame);
  void operations.then(() => invoke("set_test_window_region", { region: null })).catch(console.error);
});
</script>

<template>
  <main class="transparent-test">
    <p ref="marker" class="test-marker" @pointerdown="onPointerDown">摸鱼 v2.0 · 透明窗口测试</p>
  </main>
</template>

<style>
:root {
  font-family: Inter, "Microsoft YaHei", Arial, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}

.transparent-test {
  background: transparent;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}

.test-marker {
  cursor: grab;
  user-select: none;
  margin: 0;
  padding: 8px 12px;
  color: #ffffff;
  background: transparent;
  text-shadow: 0 1px 2px #000000;
  font-size: 18px;
  line-height: 1.5;
  text-align: center;
}

.test-marker:active {
  cursor: grabbing;
}
</style>
