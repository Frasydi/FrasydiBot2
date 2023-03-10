import makeWASocket, {makeInMemoryStore} from "@adiwajshing/baileys"
import { DisconnectReason } from "@adiwajshing/baileys/lib/Types"
import { Browsers, useMultiFileAuthState } from "@adiwajshing/baileys/lib/Utils"
import { Boom } from '@hapi/boom'
import MiddlewareController from "./controller_middleware"
const store = makeInMemoryStore({ })
store.readFromFile('./baileys_store.json')
setInterval(() => {
    store.writeToFile('./baileys_store.json')
}, 10_000)



async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: true,
        auth : state
    })
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
    sock.ev.on('messages.upsert', async(m) => {
        console.log(m)
        MiddlewareController(m, sock).catch(err => {
            console.log(err)
        })
    })

}
connectToWhatsApp()