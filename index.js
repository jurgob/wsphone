'use strict'

const {
    getSpeakerStream, 
    generateNoiseStream, 
    createWSAudioStream,
    writeWSMsgIntoSpeaker,
    startStreamMicAudioIntoWebSocket
} = require('./audioutils.js')

/* 
    phone example: https://gixthub.com/sammachin/puckcall
    websocket audio example: https://www.nexmo.com/legacy-blog/2016/12/19/streaming-calls-to-a-browser-with-voice-websockets-dr
*/
const DATACENTER = `https://api.nexmo.com`


const voiceEvent = async (req, res, next) => {
    const { logger } = req.nexmo;
    try { 
        logger.info("voiceEvent", { event: req.body});
        res.json({});
    } catch (err) {
        logger.error("Error on voiceEvent function")
    }
}

const voiceAnswer = async (req, res, next) => {
    const { logger ,config} = req.nexmo;
    logger.info("voiceAnswer req", { req_body: req.body, wss_url: `wss://${req.hostname}/socket`});
    try {
        const ncco = [
            {
                "action": "connect",
                "endpoint": [{
                    "type": "websocket",
                    "uri": `wss://${req.hostname}/socket`,
                    "content-type": "audio/l16;rate=16000",
                    "headers":{}
                }]
            }
        ]
        logger.info('ncco ', {ncco: JSON.stringify(ncco, null, ' ')})

        return res.json(ncco);

    } catch (err) {
        logger.error("Error on voiceAnswer function");
    }
}

const route = (app, express) => {
    console.log('route startup!')
    const expressWs = require('express-ws')(app);
    const WebSocket = require('ws');
    
    expressWs.getWss().on('connection', function (ws) {
        // console.log('Websocket connection is open');
    });


    const speaker = getSpeakerStream()
    
    // const noise = generateNoiseStream()
    // noise.pipe(speaker)

    // websocket middleware
    app.ws('/socket', (ws, req) => {

        const {
            logger,
            csClient,
            config
        } = req.nexmo;
        logger.info('web socket start /socket')
        
        startStreamMicAudioIntoWebSocket(ws)


        ws.on('message', (msg) => {
            
            console.log('socket message', {msg})
            
            writeWSMsgIntoSpeaker(speaker, msg)

            // setTimeout(() => {
            //     if (ws.readyState === WebSocket.OPEN) ws.send(msg);
            // }, 500); 
        });
    });


    app.get('/startcall', async (req, res, next) => {
        const {
            logger,
            csClient,
            config
        } = req.nexmo;

        logger.info(`Hello start call`)

        const callReq = await csClient({
            "url":`${DATACENTER}/v1/calls`,
            "method": "post",
            data:{
                "to": [
                    {
                        "type": "websocket",
                        "uri": "ws://example.com/socket",
                        "content-type": "audio/l16;rate=16000",
                        "headers": {
                            "app": "audiosocket"
                        }
                    }
                ],
                "random_from_number": true,
                "event_url": [`${config.server_url}/webhook/voiceAnswer`],
                "answer_url": [`${config.server_url}/webhook/voiceAnswer`]
            }
        }).catch(err => {
            logger.info(`Call request error`, err)
            
            res.json({
                msg: "Hello start call error!",
                callInfo: err.response.data
            })

            return next();
        })
        //logger.info(`Call request callReq`, Object.keys(callReq), callReq)

        res.json({
            msg: "Hello start call",
            callInfo: callReq.data
        })
    })

};

module.exports = {
    voiceEvent,
    voiceAnswer,
    route
}