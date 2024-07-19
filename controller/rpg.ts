import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import { adventure, getMyItem, myProfileRPG, rasBonusStart, rasType, startCharacter, travel, travels, useItem } from '../util/rpgSetting';
export const types = /rpg/i
export const nama = "RPG"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"rpg",
    getOptions()?.prefix+"rpg create",
    getOptions()?.prefix+"rpg create [ras]",
    getOptions()?.prefix+"rpg travel",
    getOptions()?.prefix+"rpg travel [to]",
    getOptions()?.prefix+"rpg items",
    getOptions()?.prefix+"rpg profile",
]
export const isGroup = false
export const isAdmin = false

const commanHelp = [
    "create  - untuk perkenalan sebelum membuat akun",
    "create [ras] - untuk membuat akun",
    "travel - mendapatkan list-list lokasi",
    "travel [to] - pergi lokasi tersebut",
    "adventure - explor",
    "items - mendapatkan list item",
    "profile - mendapatkan status profile"
]

export default async function Hello(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    if(pesan.length == 0) {
        throw "Ini adalah Koman RPG. Berikut adalah koman-koman yang tersedia untuk game ini : \n"+getOptions()?.prefix+"rpg "+commanHelp.join("\n"+getOptions().prefix+"rpg ")
    }

    if(pesan[0] == "create") {
        if(pesan.length == 1) {
            throw "Silahkan pilih ras berikut, lalu ketik koman "+getOptions()?.prefix+"rpg create [ras]. : "+Object.keys(rasBonusStart).join(", ")
        } else {
            throw startCharacter(pengirim, pesan[1] as rasType)
        }
    } else if(pesan[0] == "travel") {
        if(pesan.length == 1) {
            throw "Silahkan pilih ras berikut, lalu ketik koman "+getOptions()?.prefix+"rpg travel [id lokasi]. : \n"+Object.values(travels).map(el => el.id + " : "+el.name+ ""+(el.isSafeArea ? " - Area Aman" : "")).join("\n")
        } else {
            throw travel(pengirim, parseInt(pesan[1]))
        }
    } else if(pesan[0] == "items") {
        throw getMyItem(pengirim)
    } else if(pesan[0] == "adventure") {
        throw adventure(pengirim)
    } else if(pesan[0] == "profile") {
        return socket.sendMessage(room, {
            text : myProfileRPG(pengirim),
            mentions : [pengirim]
        })
    } else if(pesan[0] == "use") {
        if(pesan.length == 1) throw "Harus Mengirimkan id item. Gunakan Command 'rpg items' untuk mendapatkan list item yang anda dapatkan"
        throw useItem(pengirim, parseInt(pesan[1]))
    }
    throw "Koman Yang anda maksudkan tidak ditemukan. Sudah mengecek list-list koman di koman 'rpg'?"
}