<script setup lang="ts">
import { ref, type CSSProperties } from "vue";
import bodyBase from "../../assets/experiments/tuantuan-fin/body-base.png";
import leftFin from "../../assets/experiments/tuantuan-fin/left-pectoral-fin.png";
import rightFin from "../../assets/experiments/tuantuan-idle/right-pectoral-fin.png";
import tailFan from "../../assets/experiments/tuantuan-idle/tail-fan.png";

type Part = {
  id: "body" | "left-fin" | "right-fin" | "tail";
  src: string;
  sourceWidth: number;
  sourceHeight: number;
  x: number;
  y: number;
  scale: number;
  z: number;
  pivot: [number, number];
  baseRotation: number;
  seconds: number;
  degrees: number;
};

// P1-05D-01: provisional assembly on a 280 x 280 CSS design canvas.
// Every position, scale, layer order and pivot below is UNVERIFIED artwork fitting.
// These concept parts do not reproduce the official painting pixel for pixel.
// No reference overlay or joint mask is used; root seams remain visible for review.
const parts: Part[] = [
  { id: "tail", src: tailFan, sourceWidth: 321, sourceHeight: 430, x: 154, y: 55, scale: 0.32, z: 1, pivot: [20, 50], baseRotation: 0, seconds: 5.7, degrees: 3 },
  { id: "body", src: bodyBase, sourceWidth: 454, sourceHeight: 374, x: 46, y: 66, scale: 0.36, z: 2, pivot: [50, 55], baseRotation: 0, seconds: 4.8, degrees: 0 },
  { id: "left-fin", src: leftFin, sourceWidth: 138, sourceHeight: 100, x: 29, y: 166, scale: 0.36, z: 3, pivot: [90, 14], baseRotation: 0, seconds: 2.6, degrees: 4 },
  { id: "right-fin", src: rightFin, sourceWidth: 144, sourceHeight: 98, x: 160, y: 173, scale: 0.36, z: 4, pivot: [10, 14], baseRotation: 0, seconds: 3.2, degrees: -4 },
];

const playing = ref(false);

function partStyle(part: Part): CSSProperties {
  return {
    left: `${part.x / 280 * 100}%`,
    top: `${part.y / 280 * 100}%`,
    width: `${part.sourceWidth * part.scale / 280 * 100}%`,
    height: `${part.sourceHeight * part.scale / 280 * 100}%`,
    zIndex: part.z,
    transform: `rotate(${part.baseRotation}deg)`,
    transformOrigin: `${part.pivot[0]}% ${part.pivot[1]}%`,
    "--part-origin": `${part.pivot[0]}% ${part.pivot[1]}%`,
    "--cycle": `${part.seconds}s`,
    "--swing": `${part.degrees}deg`,
  };
}
</script>

<template>
  <div class="idle-preview" :style="{ '--idle-play-state': playing ? 'running' : 'paused' }">
    <div class="idle-stage" role="img" aria-label="分层待机实验：独立身体、左右胸鳍与尾巴，装配未经美术验收">
      <div v-for="part in parts" :key="part.id" class="part" :class="part.id" :style="partStyle(part)">
        <img class="motion" :src="part.src" alt="" :draggable="false" />
      </div>
    </div>
    <p class="assembly-note">近似素材 · 所有配准参数未验收<br />鳍根接缝、尾柄遮挡待美术修整</p>
    <button class="play-toggle" type="button" :aria-pressed="playing" @click="playing = !playing">
      {{ playing ? "暂停（保留姿态）" : "播放待机" }}
    </button>
  </div>
</template>

<style scoped>
.idle-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.idle-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.part {
  position: absolute;
}

.motion {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  transform-origin: var(--part-origin);
  animation: idle-sway var(--cycle) ease-in-out infinite;
  /* Pausing freezes the CSS timeline; resuming never resets the pose.
     v-if unmount removes the animations. No JS frame loop or timer is used. */
  animation-play-state: var(--idle-play-state);
}

.body .motion {
  animation-name: idle-breathe;
}

.assembly-note {
  position: absolute;
  bottom: 29px;
  width: 100%;
  margin: 0;
  color: #ffffff;
  font: 10px/1.5 "Microsoft YaHei", sans-serif;
  text-align: center;
  text-shadow: 0 1px 2px #000000;
  pointer-events: none;
}

.play-toggle {
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 100%;
  padding: 2px 6px;
  border: 1px solid #84634b;
  border-radius: 4px;
  background: #fff8ed;
  color: #513621;
  font: 11px/1.5 "Microsoft YaHei", sans-serif;
  cursor: pointer;
}

@keyframes idle-sway {
  0%, 50%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(var(--swing)); }
  75% { transform: rotate(calc(-1 * var(--swing))); }
}

@keyframes idle-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.008, 1.012); }
}
</style>
