var mic = require('mic');
const Speaker = require('speaker');

const baudio = require('baudio');

const {Readable} = require('stream')

const isBuffer = require('is-buffer')


const generateNoiseStream = () => {
    var n = 0;
    return baudio(function (t) {
        var x = Math.sin(t * 262 + Math.sin(n));
        n += Math.sin(t);
        return x;
    });

}

const getSpeakerStream = () => {
    const speaker = new Speaker({
        channels: 1,          
        bitDepth: 16,         
        sampleRate: 16000,
      });
      return speaker
}



const createWSAudioStream = () => {
    const readable = new Readable()
    
    readable._read = () => {} // _read is required but you can noop it
    

    return readable
    
}

const writeWSMsgIntoSpeaker = (speaker, msg) => {
    if(isBuffer(msg)){
        try {
            speaker.write(msg);        
         }
         catch (e) {
             console.log("Speaker Error: ", e)
         }
    }
}



module.exports = {
    getSpeakerStream,
    generateNoiseStream,
    createWSAudioStream,
    writeWSMsgIntoSpeaker
}