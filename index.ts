require("fix-esm").register();
import 'dotenv/config'
import { Boom } from '@hapi/boom'
import MiddlewareController from "./controller_middleware"
import * as fs from "fs"
import makeWASocket, { AuthenticationState, Browsers, DisconnectReason, proto, useMultiFileAuthState, UserFacingSocketConfig } from '@whiskeysockets/baileys';
import NodeCache from 'node-cache'
import { RedisStore } from './util/redis-store';
import { JsonStore } from './util/json-store';
import { useRedisAuthState } from './util/auth-state';
import { getOptions } from './util/option';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { redis } from './util/redis';

const isProd = process.env.DEV == 'false'

// const store = makeInMemoryStore({ 
   
// })

// store.readFromFile('./baileys_store.json')

// setInterval(() => {
//     store.writeToFile('./baileys_store.json')
// }, 10_000)

if(!fs.existsSync("media")) {
    fs.mkdirSync("media")
}



const redisStore = new RedisStore(redis);
const jsonStore = new JsonStore();

async function connectToWhatsApp () {
    let state: AuthenticationState;
    let saveCreds: () => Promise<void>;

    if (!isProd) {
        ({ state, saveCreds } = await useMultiFileAuthState("auth_info_baileys"));
    } else {
        ({ state, saveCreds } = await useRedisAuthState(
            redisStore,
            jsonStore,
            "main"
        ));
    }
    
    const config : UserFacingSocketConfig = {
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        auth : state,
        cachedGroupMetadata: async (jid) => groupCache.get(jid),
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                // || message.templateMessage
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }

            return message;
        },
    }

    const groupCache = new NodeCache()
    const sock = makeWASocket(config)

    if(sock == null) return

    // store.bind(sock.ev)
   
    sock.ev.on("creds.update", saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } : any = update
        if (qr) {
            qrcode.generate(qr, { small: true })
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            if(shouldReconnect) {
                setTimeout(() => {
                    connectToWhatsApp()
                }, 5000)
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    
    sock.ev.on("messages.delete",(m) => {
        //
    })
    sock.ev.on("group-participants.update", async(grup) => {
        if(grup.action == "add") {
            const opt = getOptions()
            if(opt.newmem == null) return
            const getPesan = opt.newmem[grup.id]
            if(getPesan == null) return
            if(getPesan.image != null) {
                sock?.sendMessage(grup.id, {
                    image : {
                    url : "media/newmem/"+getPesan.image
                    },
                    caption : getPesan.message
                })
                return
            }
            sock?.sendMessage(grup.id, {
                text : getPesan.message
            })
        } else if(grup.action == "remove") {
            // const ppUrl = await sock.profilePictureUrl(grup.author, "image")
            sock?.sendMessage(grup.id, {text:"@"+grup.author.split("@")[0] + " Meninggalkan Grub"})
        }
    })
    sock.ev.on('messages.upsert', (m) => {
        if(m.type == "append") return
        console.log(JSON.stringify(m.messages))
        MiddlewareController(m, sock).catch(err => {
            console.log(err)
        }) 
    })

    return sock

}
const sock = connectToWhatsApp() 

async function getSock() {
    const newSock = await sock
    return newSock
} 

export {getSock}