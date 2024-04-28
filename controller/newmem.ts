import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { setNewMem } from '../util/newmemsetting';
export const types = /newmem/i
export const nama = "New Member"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix+"newmem (dengan keadaan mengquoted pesan yang ingin dijadikan pesan untuk new mem)"
]
export const isGroup = false
export const isAdmin = false
export default async function NewMember(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    quoted,
    quoted_type
}: messageType) {
    if(quoted == null) throw "Harus menquoted pesan untuk newmem"
    if(quoted_type == "imageMessage" || quoted_type == "videoMessage") throw "Harus Quoted pesan teks saja"
    setNewMem(room, quoted.conversation || "")
    await socket.sendMessage(room, {
        text : `Berhasil Mengupdate setting pesan untuk new member`,
        mentions : [pengirim]
    })
}