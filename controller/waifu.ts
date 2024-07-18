import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import axios from 'axios';
export const types = /waifu/i
export const nama = "Waifu"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"waifu [kategori]"
]
const wordArray = [
    "waifu",
    "neko",
    "shinobu",
    "megumin",
    "cuddle",
    "cry",
    "hug",
    "blush",
    "smile",
    "wave",
    "highfive",
    "handhold",
    "nom", 
    "pat",
    "smug",
    "happy",
    "wink",
    "poke",
    "dance",
    "cringe"
  ];
  
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
    if(pesan.length == 0) {
        throw `Berikut adalah list-list kategori : ${wordArray.join("\n")}`
    }
    if(wordArray.includes(pesan[0]) == false) {
        throw "Invalid Kategori"
    }
    await socket.sendPresenceUpdate("composing", room)
    const feting = await axios.get("https://api.waifu.pics/sfw/"+pesan[0], {
        validateStatus : status => status < 500
    })
    if(feting.status >= 400) throw "Ada masalah"
    const data = feting.data.url
    console.log(data)
    await socket.sendMessage(room, {
        image : {
            url : data
        },
        mentions : [pengirim]
    })
}