<template>
  <div class="textToSpeatch">
    <div class="row">
      <p>Enter some text in the input below and press the button to hear it. </br> change voice using the below controls.</p>
      <div class="left">
        <textarea v-model="userInput"></textarea>
        <small class="error-text" v-if="validation">
          *********** Please enter something and try ***********
        </small>
      </div>

      <div class="right">
        <br>
        <div class="rate-div">
          <div class="label"><b>Rate : </b> &nbsp;&nbsp;{{rate}}</div>
          <input 
            class="rate" 
            type="range" 
            min="0.5" 
            max="3"
            value="1" 
            step="0.1" 
            v-model="rate"
            @change="speak()">
        </div>
        <br>
        <div class="pitch-div">
          <div class="label"><b>Pitch : </b> &nbsp;&nbsp;{{pitch}}</div>
          <input 
            class="rate" 
            type="range" 
            min="0" 
            max="3" 
            value="1" 
            step="0.1" 
            v-model="pitch"
            @change="speak()">
        </div>
        <br>
        <div class="col-12">
          <button 
            id="play"
            class="play-btn"
            type="button"
            @click="speak()">Convert to speatch</button>
        </div>
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
      pitch: 1,
      rate: 1,
      synth: window.speechSynthesis,
      validation: false
    }
  },
  methods: {
    speak() {
      if (this.synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
      }
      if (this.userInput !== '') {
          this.validation = false;
          let sInstance = new SpeechSynthesisUtterance(this.userInput);
          sInstance.onend = function (event) {
              console.log('SpeechSynthesisUtterance.onend');
          }
          sInstance.onerror = function (event) {
              console.error('SpeechSynthesisUtterance.onerror');
          }

          sInstance.pitch = this.pitch;
          sInstance.rate = this.rate;
          this.synth.speak(sInstance);
      } else {
        this.validation = true;
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

.row .right {
  width: 100%;
  font-size: 18px
}

textarea {
  width: 65%;
  height: 150px;
  border-radius: 10px;
  border: 2px solid;
  padding: 10px;
  font-size: 15px;
}

.rate {
  width: 60%;
}

button {
  padding: 12px 74px;
  border-radius: 4px;
  background: #67d6be;
  font-size: 14px;
  cursor: pointer;
  margin-top: 30px;
}
.error-text {
  display: block;
  color: #8c0606;
  font-weight: 500;
}
</style>
