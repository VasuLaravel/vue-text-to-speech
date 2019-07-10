<template>
  <div id="app">
    <h2>Text To Speech</h2>
    <textToSpeatch />
  </div>
</template>

<script>
import textToSpeatch from './components/textToSpeatch.vue'

export default {
  name: 'app',
  components: {
    textToSpeatch
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  text-align: center;
  margin-top: 60px;
}
</style>
