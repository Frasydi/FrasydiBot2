import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /siapa/i
export const nama = "Siapa"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"siapa [pertanyaan]"
]
export const isGroup = true
export const isAdmin = false
export default async function Hello(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    anggota,
    messageInstance
    
}: messageType) {
    if(pesan.length == 0) throw "Tidak ada pertanyaannya"
    if(!isGroup) throw "Harus Grub"
    console.log(anggota)
    const hasil = Math.floor(Math.random() * (anggota.length - 0 + 1) + 0);
    const mentions = [anggota[hasil].id]
    const mentionsJid = messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid
    if(mentionsJid != null) {
        mentions.push(...mentionsJid)
    }
    await socket.sendMessage(room, {
        text : `Pertanyaan : Siapa ${pesan.join(" ")}\n\nJawaban : @${anggota[hasil].id.split("@")[0]}`,
        mentions :mentions
    })
}