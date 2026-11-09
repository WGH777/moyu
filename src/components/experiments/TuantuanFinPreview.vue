<script setup lang="ts">
import bodyBase from "../../assets/experiments/tuantuan-fin/body-base.png";
import leftFin from "../../assets/experiments/tuantuan-fin/left-pectoral-fin.png";

// P1-05B: manual assembly on a 280 x 280 design canvas, not ORA library coordinates.
// Body: (50, 44), 200 x (374 * 200 / 454); both parts use source scale 200 / 454.
// Fin: (28, 164), (138 * 200 / 454) x (100 * 200 / 454).
// Fin pivot: (90%, 14%) = source pixel (124.2, 14), in front of the body.
// No joint mask or reference-image overlay: the actual connection stays visible.
</script>

<template>
  <div class="fin-preview" role="img" aria-label="胸鳍实验：身体静止，左胸鳍小幅摆动">
    <img class="body" :src="bodyBase" alt="" :draggable="false" />
    <img class="fin" :src="leftFin" alt="" :draggable="false" />
    <span class="caption">局部样机 · ±4°</span>
  </div>
</template>

<style scoped>
.fin-preview {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.body,
.fin {
  position: absolute;
  display: block;
  height: auto;
  user-select: none;
}

.body {
  left: calc(100% * 50 / 280);
  top: calc(100% * 44 / 280);
  width: calc(100% * 200 / 280);
}

.fin {
  left: calc(100% * 28 / 280);
  top: calc(100% * 164 / 280);
  width: calc(100% * 138 * 200 / 454 / 280);
  z-index: 1;
  transform-origin: 90% 14%;
  animation: pectoral-sway 2.4s ease-in-out infinite;
}

.caption {
  position: absolute;
  bottom: 8%;
  width: 100%;
  color: #ffffff;
  font: 11px/1.5 "Microsoft YaHei", sans-serif;
  text-align: center;
  text-shadow: 0 1px 2px #000000;
}

@keyframes pectoral-sway {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}
</style>
