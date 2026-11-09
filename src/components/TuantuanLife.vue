<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import tuantuan from "../assets/fish/tuantuan-cropped.png";
import { useFishPetting } from "../composables/useFishPetting";

const stage = ref<HTMLElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const enabled = ref(true);
const reducedMotion = ref(false);
const visible = ref(!document.hidden);
const mood = ref<"happy" | "shy" | "sleepy">("happy");
const active = computed(() => enabled.value && !reducedMotion.value && visible.value);
const { strength, hitState, onImageLoad, onPointerMove, stopPetting } = useFishPetting(stage, image, active);
let media: MediaQueryList | undefined;

function syncReducedMotion() { reducedMotion.value = media?.matches ?? false; }
function syncVisibility() { visible.value = !document.hidden; stopPetting(); }

onMounted(() => {
  media = matchMedia("(prefers-reduced-motion: reduce)");
  syncReducedMotion();
  media.addEventListener("change", syncReducedMotion);
  document.addEventListener("visibilitychange", syncVisibility);
  window.addEventListener("blur", stopPetting);
  if (image.value?.complete) onImageLoad();
});

onBeforeUnmount(() => {
  media?.removeEventListener("change", syncReducedMotion);
  document.removeEventListener("visibilitychange", syncVisibility);
  window.removeEventListener("blur", stopPetting);
});
</script>

<template>
  <div class="tuantuan-life" @pointermove="onPointerMove" @pointerleave="stopPetting" @pointerdown="stopPetting" @pointercancel="stopPetting">
    <div ref="stage" class="life-stage" :class="[{ animated: active }, mood]" :style="{ '--touch-strength': strength }">
      <div class="safety" data-motion>
        <div class="float" data-motion>
          <div class="breath" data-motion>
            <div class="tilt" data-motion>
              <div class="emotion-happy" data-motion>
                <div class="emotion-shy" data-motion>
                  <div class="emotion-sleepy" data-motion>
                    <div class="touch-response" data-motion>
                      <img ref="image" class="official-artwork" :src="tuantuan" alt="团团" :draggable="false" @load="onImageLoad" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="life-controls" data-life-controls @pointerenter="stopPetting">
      <button type="button" :aria-pressed="enabled" @click="enabled = !enabled">{{ enabled ? "关闭动态" : "开启动画" }}</button>
      <label>心情
        <select v-model="mood" aria-label="团团心情">
          <option value="happy">开心</option>
          <option value="shy">害羞</option>
          <option value="sleepy">困倦</option>
        </select>
      </label>
      <span class="interaction-hint">{{ reducedMotion ? "已跟随系统减少动态" : !enabled ? "原画静止对照" : hitState === 'unavailable' ? "抚摸暂不可用" : "不按键移过鱼身抚摸 · 左键拖动" }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Typed, inherited weights interpolate without restarting any motion timeline.
   All layers stay nested and centered for the existing alpha-hit matrix mapping. */
@property --tt-happy-weight { syntax: "<number>"; inherits: true; initial-value: 0; }
@property --tt-shy-weight { syntax: "<number>"; inherits: true; initial-value: 0; }
@property --tt-sleepy-weight { syntax: "<number>"; inherits: true; initial-value: 0; }
.life-stage {
  --tt-happy-weight: 0;
  --tt-shy-weight: 0;
  --tt-sleepy-weight: 0;
}
.life-stage.happy { --tt-happy-weight: 1; }
.life-stage.shy { --tt-shy-weight: 1; }
.life-stage.sleepy { --tt-sleepy-weight: 1; }
.life-stage.animated {
  transition: --tt-happy-weight 650ms ease-in-out, --tt-shy-weight 650ms ease-in-out, --tt-sleepy-weight 650ms ease-in-out;
}
.tuantuan-life, .life-stage {
  position: relative;
  width: 100%;
  height: 100%;
}
.safety, .float, .breath, .tilt, .emotion-happy, .emotion-shy, .emotion-sleepy, .touch-response {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
}
.official-artwork { display: block; width: 100%; height: 100%; object-fit: contain; user-select: none; }
/* Moving artwork gets a small safety inset inside the unchanged native rectangle.
   Static comparison removes every transform, restoring the original image fit. */
.animated .safety { transform: scale(0.96); }
.animated .float { animation: life-float 6.7s ease-in-out infinite; }
.animated .breath { animation: life-breathe 4.9s ease-in-out infinite; }
.animated .tilt { animation: life-tilt 8.3s ease-in-out infinite; }
/* Keep the three timelines alive; the selected mood only changes their weights.
   At 280px and 96% safety scale, happy peaks at about 2.55 CSS pixels. */
.animated .emotion-happy { animation: mood-happy 2.4s ease-in-out infinite; }
.animated .emotion-shy { animation: mood-shy 4.2s ease-in-out infinite; }
.animated .emotion-sleepy { animation: mood-sleepy 9.6s ease-in-out infinite; }
.animated .touch-response { animation: touch-feedback 1.7s ease-in-out infinite; }
.life-controls { position: absolute; bottom: 1px; left: 0; width: 100%; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 3px; font: 10px/1.4 "Microsoft YaHei", sans-serif; }
.life-controls button, .life-controls select { border: 1px solid #84634b; border-radius: 4px; background: #fff8ed; color: #513621; font: inherit; padding: 1px 3px; cursor: pointer; }
.life-controls label, .interaction-hint { color: white; text-shadow: 0 1px 2px black; }
.interaction-hint { flex-basis: 100%; text-align: center; pointer-events: none; }
@keyframes life-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(calc(-0.18% * (1 - 0.9 * var(--tt-sleepy-weight)))); }
}
@keyframes life-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.003, 1.004); } }
@keyframes life-tilt {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(calc(0.12deg * (1 - 0.85 * var(--tt-sleepy-weight)))); }
  75% { transform: rotate(calc(-0.12deg * (1 - 0.85 * var(--tt-sleepy-weight)))); }
}
@keyframes mood-happy {
  0%, 70%, 100% { transform: translateY(0); }
  35% { transform: translateY(calc(-0.95% * var(--tt-happy-weight))); }
}
@keyframes mood-shy {
  0%, 50%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(calc(0.95deg * var(--tt-shy-weight))); }
  75% { transform: rotate(calc(-0.95deg * var(--tt-shy-weight))); }
}
@keyframes mood-sleepy {
  0%, 100% { transform: translateY(calc(0.25% * var(--tt-sleepy-weight))); }
  50% { transform: translateY(calc(0.8% * var(--tt-sleepy-weight))); }
}
@keyframes touch-feedback {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(calc(-0.45% * var(--touch-strength, 0))) scale(calc(1 + 0.004 * var(--touch-strength, 0))); }
}
@media (prefers-reduced-motion: reduce) {
  .life-stage.animated { transition: none; }
  .animated [data-motion] { animation: none !important; transform: none !important; }
}
</style>
