var mic = require('mic');

const Speaker = require('speaker');

const baudio = require('baudio');

const {Readable} = require('stream')

const isBuffer = require('is-buffer')

const chunkingStreams = require('chunking-streams');
var SizeChunker = chunkingStreams.SizeChunker;



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


// TODO: this is not working, just an idea
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


const startStreamMicAudioIntoWebSocket = (ws) => {
    
    var micInstance = mic({
        rate: '16000',
        channels: 1
    });

    var chunker = new SizeChunker({
        chunkSize: 640 // must be a number greater than zero. 
    });
    
    var micInputStream = micInstance.getAudioStream();
    micInputStream.pipe(chunker);
    micInstance.start();


    // speaker.start()//??
    chunker.on('data', function(chunk) {
        const data = chunk.data;
        var buf;
        if (data.length == 640){
            console.log(Date.now(), " Sending: ", data.length, " Bytes")
            try {
               ws.send(data);
            }
            catch (e) {
            console.log("Send Error: ", e)
            };
        }
        else{
            console.log(Date.now(), " Buffering: ", data.length, " Bytes");
            buf += data;
            if (buf.length == 640){
                console.log(Date.now(), " Sending: ", data.length, " Bytes")
                try {
                   ws.send(data);
                }
                catch (e) {
                console.log("Send Error: ", e)
                };
                buf = null;
            }
        }
    });



}

module.exports = {
    getSpeakerStream,
    generateNoiseStream,
    createWSAudioStream,
    writeWSMsgIntoSpeaker,
    startStreamMicAudioIntoWebSocket
}