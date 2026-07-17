import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /couple/i
export const nama = "Couple"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"couple [tag orang 1] [tag orang 2]"
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
    messageInstance,
    mentions
}: messageType) {
    if(pesan.length < 1) throw "Harus mentag orang yang dimaksud"
    const rands = Math.floor(Math.random() * (100 - 0 + 1) + 0);
    const cleanPengirim = pengirim.split(":")[0].split("@")[0];
    if(pesan.length < 2) {
        await socket.sendMessage(room, {
            text : `Persentase Kecocokan antara ${pesan[0]} dan @${cleanPengirim}\n Adalah : ${rands}%`,
            mentions : [pengirim, mentions[0]]
        })
        return;
    }
    await socket.sendMessage(room, {
        text : `Persentase Kecocokan antara ${pesan[0]} dan ${pesan[1]}\n Adalah : ${rands}%`,
        mentions : [pengirim, ...mentions]
    })
}