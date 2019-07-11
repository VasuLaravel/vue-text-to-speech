<template>
  <div id="app">
    <div class="row">
      <div class="text-to-speech">
        <h2>Text To Speech</h2>
        <textToSpeatch />
      </div>
      <div class="speech-to-text">
        <h2>Speech To Text</h2>
        <speachToText />
      </div>
    </div>
  </div>
</template>

<script>
import textToSpeatch from './components/textToSpeatch.vue';
import speachToText from './components/speechToText.vue';

export default {
  name: 'app',
  components: {
    textToSpeatch,
    speachToText
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
.row {
  width: 100%;
  display: inline-flex;
}
.text-to-speech, .speech-to-text {
  width: 50%;
}
</style>
