import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
//@ts-ignore
import instagramURL from "instagram-url-direct"
import mimeType from "mime-types"
export const types = /^instagram$|^ig$/i
export const nama = "instagram"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"instagram [link]"
]
export const isGroup = false
export const isAdmin = false
export default async function instagram(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    if(pesan.length == 0) throw `Harus mengisikan`
    const links : {results_number : number, url_list : string[]} = await  instagramURL(pesan.join(" "))
    console.log(links)
    const promise = links.url_list.map(async(el) => sendOne(el, room, socket))
    await Promise.all(promise)
    
}

async function sendOne(link : string, room : string, socket : WASocket) {
    const file =link?.match(/(?<=uri\=)[a-zA-Z0-9%-._]+(.webp|.mp4)|[a-zA-Z0-9%-._]+(.webp|.mp4)/gm)?.[0]
    console.log(file)
    if(file == null) throw `Ada masalah`
    const mime = mimeType.lookup(file) 
    if(!mime) throw `Ada masalah`
    const type = mime.split("/").at(0)
    console.log(mime)
    if(type == "image") {
        await socket.sendMessage(room, {image : {url : link}})
    } 
    if(type == "video") {
        await socket.sendMessage(room, {video : {url : link}})
    }
    
}