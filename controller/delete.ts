import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import convertQuoted2MsgInfo2 from '../util/convertQuoted2MsgInfo2';
import convertQuoted2MsgInfo from '../util/convertQuoted2MsgInfo';
export const types = /delete/i
export const nama = "Delete"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix+"delete"
]
export const isGroup = true
export const isAdmin = true
export default async function Hello(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance,
    mentions,
    isAdmin,
    quoted
}: messageType) {
    if(quoted == null) throw "Harus mengquoted pesan yang ingin dihapus"
    if(!isGroup) throw "Harus Di Grub"
    if(!isAdmin) throw "Harus Admin"
    await socket.sendMessage(room, { delete: convertQuoted2MsgInfo(messageInstance).key })
}