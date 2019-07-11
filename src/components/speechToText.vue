<template>
  <div class="speechToText">
    <div class="row">
      <p>Press the button then say the phrase to test the recognition.</p>

      <button 
        id="play"
        class="play-btn"
        type="button"
        :disabled="disabled"
        @click="testSpeech()">{{btnText}}</button>

      <div class="left">
        <p>Speech received:</p>
        <textarea v-model="userInput"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'textToSpeatch',
  data() {
    return {
      userInput: '',
      btnText: 'Click to start speech',
      disabled: false
    }
  },
  methods: {
    testSpeech () {
      let SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
      let SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

      let that = this;
      this.disabled = true;
      this.btnText = "Recognition started....";

      // create instance for speech
      let recognition = new SpeechRecognition();
      let speechRecognitionList = new SpeechGrammarList();

      // set the configurations for received speech
      recognition.grammars = speechRecognitionList;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.start();

      recognition.onresult = function(event) {
        debugger
        let speechResult = event.results[0][0].transcript.toLowerCase();
        that.userInput = speechResult;
      }

      recognition.onspeechend = function() {
        recognition.stop();
        that.disabled = false;
        that.btnText = 'Click to start speech';
      }

      recognition.onerror = function(event) {
        that.disabled = false;
        that.btnText = 'Click to start speech';
        console.log(event.error);
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.row {
  width: 100%;
  display: block;
}
.row .left {
  width: 100%;
}

textarea {
  width: 65%;
  height: 150px;
  border-radius: 10px;
  border: 2px solid;
  padding: 10px;
  font-size: 15px;
}

button {
  padding: 12px 74px;
  border-radius: 4px;
  background: #67d6be;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 30px;
}
.error-text {
  display: block;
  color: #8c0606;
  font-weight: 500;
}
</style>
