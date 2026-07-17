import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { exitRoom, joinRoom } from '../util/anonim';
export const types = /anonim/i
export const nama = "Anonim"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"anonim join",
    getOptions()?.prefix+"anonim exit",
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
    
}: messageType) {
    if(isGroup) throw "Tidak Bisa Menggunakan Fitur ini di grub"
    if(pesan.length == 0) {
        throw "Anda harus memilih join atau exit. Contoh 'anonim join'"
    }
    if(pesan[0] == "join") {
        joinRoom(pengirim)
    } else if( pesan[0] == "exit") {
        exitRoom(pengirim)
    }
}