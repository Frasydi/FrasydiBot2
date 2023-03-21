import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /delete/i
export const nama = "delete"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"delete"
]
export const isGroup = false
export const isAdmin = false
export default async function DeleteMessage(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    quoted,
    messageInstance
}: messageType) {
    if(quoted == null) throw `Harus include quote pesan yang ingin dihapus`
    await socket.sendMessage(room, {delete :{id : messageInstance.message?.extendedTextMessage?.contextInfo?.stanzaId, remoteJid : room, participant : messageInstance.message?.extendedTextMessage?.contextInfo?.participant}})
    await socket.sendMessage(room, {delete :messageInstance.key})
}