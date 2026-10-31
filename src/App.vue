<template>
  <main class="transparent-test">
    <p class="test-marker">摸鱼 v2.0 · 透明窗口测试</p>
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
  margin: 0;
  padding: 8px 12px;
  color: #ffffff;
  background: transparent;
  text-shadow: 0 1px 2px #000000;
  font-size: 18px;
  line-height: 1.5;
  text-align: center;
}
</style>
