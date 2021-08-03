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

function getDomain(url){
    const domain = url.split('://')[1]
    return domain;
}

function generateInitialNCCO(){
    const ncco = [
        {
            "action": "talk",
            "text": "You are listening to a Call made with Voice API"
        },
    ]

    return ncco
}


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
    
    const {
        logger,
        config
    } = req.nexmo;

    const number2call = req.body.from

    const ncco = generateInitialNCCO()
    
    logger.info({body: JSON.stringify(req.body, null, '  '), ncco}, '== voiceAnswer request')
    
    res.json(ncco)
}


const route = (app, express) => {
    
    const expressWs = require('express-ws')(app);
    const WebSocket = require('ws');
    
    expressWs.getWss().on('connection', function (ws) {});


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

        });
    });


    app.get('/calls', async (req, res, next) => {
        const {
            logger,
            csClient,
            config
        } = req.nexmo;

        const startCallRequest = {
            "url":`${DATACENTER}/v1/calls`,
            "method": "post",
            data:{
                "to": [
                    {
                        "type": "websocket",
                        "uri": `wss://${getDomain(config.server_url)}/socket`,
                        "content-type": "audio/l16;rate=16000",
                        "headers": {
                            "app": "audiosocket"
                        }
                    }
                ],
                "random_from_number": true,
                "event_url": [`${config.server_url}/webhook/voiceAnswer`],
                "answer_url": [`${config.server_url}/webhook/voiceAnswer`],
                "answer_method": "POST",
                "event_method": "POST"
            }
        }

        logger.info({ startCallRequest }, `start a call`)

        const callReq = await csClient(startCallRequest).catch(err => {
            logger.info(`Call request error`, err)

            res.json({
                msg: "Hello start call error!",
                callInfo: err.response.data
            })

            return next();
        })

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