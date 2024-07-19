import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
export const types = /^unrestrict$/i
export const nama = "Unrestrict"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix+"unrestrict [mentions]"
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
    mentions,
    isAdmin
}: messageType) {
    if(!isGroup) throw "Hanya bisa digunakan di grub"
    if(!isAdmin) throw "Hanya Admin"
   if(mentions.length == 0) throw "Harus Lebih dari 1"
    const opt = getOptions()
    if(opt.restrict == null) opt.restrict = []
    const restrict : {
        [key : string] : string[]
    } = opt.restrict

    if(restrict[room] == null) {
        restrict[room] = []
    }
    if(!restrict[room].includes(mentions[0])) {
        throw "Anda Belum Mengrestrict orang ini"
    }
    restrict[room] = restrict[room].filter(el => el != mentions[0])
    setOptions(restrict, "restrict")

    throw "Berhasil unrestrict."
    
}