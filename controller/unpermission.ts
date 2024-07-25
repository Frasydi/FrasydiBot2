import { WASocket } from '@whiskeysockets/baileys';
import ControllerFunctions, { kategoris } from '../controller_add';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /unpermission/i
export const nama = "Unpermission"
export const kategori = "Owner"
export const bantuan = [
    getOptions()?.prefix+"unpermission [mention]"
]
export const isGroup = false
export const isAdmin = false
export default async function Help(socket: WASocket, {
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
    if(!isOwner) throw "Harus Owner"
    if(mentions.length == 0) throw "Mention Seseorang"
    removePermission(mentions)
    await socket.sendMessage(room, {
        text :"Berhasil KOK"
    })
}

function removePermission(val : string[]) {
    const opt = getOptions()
    if(opt.specialpermission == null) {
        opt.specialpermission = []
    }

    const specialpermission : string[] = opt.specialpermission

    specialpermission.filter(el => !val.includes(el))
}

