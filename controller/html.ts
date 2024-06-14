import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import nodeHtmlToImage from 'node-html-to-image';
export const types = /html/i
export const nama = "HTML"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"html (kode HTML)"
]
export const isGroup = false
export const isAdmin = false
export default async function Hello(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance
}: messageType) {
    const text = pesan.join(" ")
    if(text.trim().length == 0) throw "Harus mengisikan kode html"
    try {
        
        console.log(text)
        const image = await nodeHtmlToImage({
            html : text,
            puppeteerArgs : {
                headless : "new",
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        })
        
        await socket.sendMessage(room, {
            caption : `Gambar`,
            image : image as Buffer,
            mentions : [pengirim],
            
        }, {quoted : messageInstance})
    }catch(err) {
        console.log(err)
        throw "Error"
    }
}