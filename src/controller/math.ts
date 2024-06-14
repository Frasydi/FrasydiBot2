import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /math/i
export const nama = "Math"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"math [formula]"
]
export const isGroup = false
export const isAdmin = false
const exactmath = require("exact-math")
export default async function Math(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    try {

        const result = await exactmath.formula(pesan.join(" "))
        await socket.sendMessage(room, {text : `*Pertanyaan : ${pesan.join(" ")}*\nJawaban : ${result}`})
    }catch(err) {
        console.log(err)
    }
}