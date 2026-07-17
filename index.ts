require("fix-esm").register();
import 'dotenv/config'
import Redis from 'ioredis'
import { Boom } from '@hapi/boom'
import MiddlewareController from "./controller_middleware"
import * as fs from "fs"
import makeWASocket, { AuthenticationState, Browsers, DisconnectReason, proto, useMultiFileAuthState, UserFacingSocketConfig } from '@whiskeysockets/baileys';
import * as path from "path"
import NodeCache from 'node-cache'
import { RedisStore } from './util/redis-store';
import { JsonStore } from './util/json-store';
import { useRedisAuthState } from './util/auth-state';
import { getOptions } from './util/option';
// @ts-ignore
import qrcode from 'qrcode-terminal';

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

export const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0
})

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
        console.log("Kena Hapus")
        console.log(m)
    })
    sock.ev.on("group-participants.update", async(grup) => {
        console.log(grup)
        if(grup.action == "add") {
            const opt = getOptions()
            console.log(opt)
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
            const ppUrl = await sock.profilePictureUrl(grup.author, "image")
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