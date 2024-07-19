import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
export const types = /^ban$/i
export const nama = "Ban"
export const kategori = "Owner"
export const bantuan = [
    getOptions()?.prefix+"ban"
]
export const isGroup = false
export const isAdmin = false
export default async function Ban(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    isOwner,
    mentions
}: messageType) {
    if(!isOwner) {
        throw "Anda bukan owner"
    }
    if(mentions.length == 0) {
        throw "Harus mention"
    }
    if(getOptions().ban == null) {
        setOptions([], "ban")
    }
    const mentionsData = [...mentions, ...getOptions().ban] 
    console.log(mentionsData)

    setOptions(mentionsData, "ban")
    await socket.sendMessage(room, {
        text : `Berhasil Memban`,
        mentions : [pengirim]
    })
}