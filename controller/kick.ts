import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import convertTel from '../util/convertTel';
import { getOptions } from '../util/option';
import getMentions from "../util/getMentions"
export const types = /kick/i
export const nama = "Kick"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"kick [kontak]"
]
export const isGroup = true
export const isAdmin = true
export default async function kick(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    isAdmin
}: messageType) {

    if(!isGroup) return await socket.sendMessage(room, {text : "Harus Group"})
    if(!isAdmin) return await socket.sendMessage(room, {text : "Harus Admin"})
    if(pesan.join(" ").trim().length == 0)return await socket.sendMessage(room, {text : "Harus Ada Kontak"})
    await socket.groupParticipantsUpdate(room, pesan.map(el => convertTel(el)), "remove")
    await socket.sendMessage(room, {text : "Berhasil Mengeluarkan "+pesan.join(" "), mentions : getMentions(pesan.join(" "))})
}