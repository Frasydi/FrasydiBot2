import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
export const types = /^unban$/i
export const nama = "UnBan"
export const kategori = "Owner"
export const bantuan = [
    getOptions()?.prefix+"unban"
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
    const mentionsData = [...getOptions().ban]
    
    
    console.log(mentionsData)

    setOptions(mentionsData.filter(el => el != mentions[0]), "ban")
    await socket.sendMessage(room, {
        text : `Berhasil unban`,
        mentions : [pengirim]
    })
}