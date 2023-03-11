import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import {execSync} from "child_process"
import {v4 as uuidv4}from "uuid"
import * as fs from "fs"
export const types = /yt/i
export const nama = "Youtube"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"yt [link]"
]
export const isGroup = false
export const isAdmin = false
export default async function Youtube(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    
    if(pesan.length == 0)return await socket.sendMessage(room, {text : "Anda tidak memberikan link"})
    console.log("Test lol")
    const nama = uuidv4()+".mp4"
    try {
        const result = execSync(`yt-dlp -f "[ext=mp4]" -S "res:480" -o "media/temp/${nama}" ${pesan.at(0)}`)
        const stream = fs.createReadStream(`media/temp/${nama}`)
        await socket.sendMessage(room, {video : {stream : stream}})

        fs.unlinkSync(`media/temp/${nama}`)
    }catch(err) {
        console.log(err)
        return await socket.sendMessage(room, {text : "Terdapat Masalah"})
    }
}