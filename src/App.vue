<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useWindowDrag } from "./composables/useWindowDrag";
import TuantuanLife from "./components/TuantuanLife.vue";
import TuantuanFinPreview from "./components/experiments/TuantuanFinPreview.vue";
import TuantuanIdlePreview from "./components/experiments/TuantuanIdlePreview.vue";

const { onPointerDown } = useWindowDrag();
const previewMode = ref<"official" | "fin" | "idle">("official");
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
    <div
      ref="marker"
      class="test-marker"
      @pointerdown="onPointerDown"
    >
      <TuantuanFinPreview v-if="previewMode === 'fin'" />
      <TuantuanIdlePreview v-else-if="previewMode === 'idle'" />
      <TuantuanLife v-else />
      <nav class="preview-modes" aria-label="团团预览模式">
        <button class="preview-toggle" type="button" :aria-pressed="previewMode === 'official'" @click="previewMode = 'official'">正式团团</button>
        <button class="preview-toggle" type="button" :aria-pressed="previewMode === 'fin'" @click="previewMode = 'fin'">单鳍实验</button>
        <button class="preview-toggle" type="button" :aria-pressed="previewMode === 'idle'" @click="previewMode = 'idle'">分层待机</button>
      </nav>
    </div>
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
  position: relative;
  display: block;
  width: min(280px, 100vw, 100vh);
  height: min(280px, 100vw, 100vh);
  cursor: grab;
  user-select: none;
  margin: 0;
  padding: 0;
  background: transparent;
}

.preview-modes {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 3px;
  max-width: calc(100% - 4px);
}

.preview-toggle {
  height: 20px;
  max-width: calc(100% - 4px);
  box-sizing: border-box;
  padding: 0 5px;
  border: 1px solid #84634b;
  border-radius: 4px;
  background: #fff8ed;
  color: #513621;
  font: 11px/18px "Microsoft YaHei", sans-serif;
  cursor: pointer;
}

.test-marker:active {
  cursor: grabbing;
}
</style>
