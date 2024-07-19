require("fix-esm").register();
import { Boom } from '@hapi/boom'
import MiddlewareController from "./controller_middleware"
import dotenv from "dotenv"
import * as fs from "fs"
import makeWASocket, { Browsers, DisconnectReason, makeInMemoryStore, proto, useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as path from "path"
dotenv.config()


const store = makeInMemoryStore({ 
   
})
store.readFromFile('./baileys_store.json')
setInterval(() => {
    store.writeToFile('./baileys_store.json')
}, 10_000)
if(!fs.existsSync("media")) {
    fs.mkdirSync("media")
}

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
        auth : state,
        getMessage : async(key) => {
            const message = await store.loadMessage(key.remoteJid as string, key.id as string)
            return message as proto.IMessage | undefined
        },
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
    })

    if(sock == null) return

    store.bind(sock.ev)
    
    
   
    sock.ev.on("creds.update", saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } : any = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            if(shouldReconnect) {
                connectToWhatsApp()
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

            const opt =  JSON.parse(fs.readFileSync(path.resolve(__dirname, "./option.json"), "utf-8").toString())
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
            sock?.sendMessage(grup.id, {text:"@"+grup.author.split("@").at(0) + " Meninggalkan Grub", mentions: grup.participants})
        }
    })
    sock.ev.on('messages.upsert', (m) => {
        if(m.type == "append") return
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