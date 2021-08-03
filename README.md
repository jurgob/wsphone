## Install

switch to the right version of nvm
```
nvm use
```

You need to install sox audio

```brew install sox```

then the dep

```
npm install
```


## run it

run 
```
conversation-api-function run .
```

from the project directory. then call you LVN (you nexmo phone number). you may hear the audio from your laptop speakers and you should be able to respond with the mic


## what can you do with this?

test an ncco with phone OR websocket. 

you can start a call in 2 ways, with a phone call or with your laptop, in both of the case you are gonna listen the ncco talk action declared in the voiceAnswer callback.  

how to start a call:
1) with your phone: just call your LVN (is in your config, or printed in the log). 


2) point your browser or postman to  `http://localhost:5001/calls` (method: GET). In this case the function is gonna acquire audio from your mic and send it via websocket, playing it using your laptop speaker.
