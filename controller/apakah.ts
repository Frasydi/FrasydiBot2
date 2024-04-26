import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /apakah/i
export const nama = "Apakah"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"apakah pertanyaan"
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
    if(pesan.length == 0) throw "Tidak ada pertanyaannya"
    const rands = Math.floor(Math.random() * (3 - 1 + 1) + 1);
    let hasil = ""
    if(rands == 3) {
        hasil = "Tidak"
    } else if(rands == 2) {
        hasil = "Mungkin"
    } else {
        hasil = "Ya"
    }
    const mention = [pengirim]
    
    const mentions = messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid as string[]
    if(mentions != null) {
        mention.push(...mentions)
    }
    await socket.sendMessage(room, {
        text : `Pertanyaan : Apakah ${pesan.join(" ")}\n\nJawaban : ${hasil}`,
        mentions : mention,
        
    },
    {
        quoted : messageInstance,
        
    }
)
}