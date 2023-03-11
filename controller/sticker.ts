import  childprocess  from 'child_process';
import { WASocket, downloadMediaMessage } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { ConvertWebpBuffer } from '../util/convertwebp';
import duplicateName from '../util/duplicate name';
import { getOptions } from '../util/option';
import saveMedia from '../util/saveMedia';
import {v4 as uuidv4} from 'uuid';
import * as fs from 'fs'
export const types = /sticker/i
export const nama = "Sticker"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"sticker"
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
    messageInstance,
    message_type
}: messageType) {
    if(message_type != "imageMessage") return await socket.sendMessage(room, {text : "Bukan Gambar"})
    console.log("LOL")
    const buffer = await downloadMediaMessage(messageInstance, "buffer", {});
    const nama = uuidv4()
    const file = nama+"."+messageInstance.message?.imageMessage?.mimetype?.split("/").at(-1)
    if(!fs.existsSync("media/temp")) {
        fs.mkdirSync("media/temp")
    }
    try {
        fs.writeFileSync("media/temp/"+file, buffer as Buffer)
        childprocess.execSync(`cwebp -q 90 ${"media/temp/"+file} -o ${"media/temp/"+nama+".webp"}`)
    }catch(err) {
       return await socket.sendMessage(room, {text : "Ada masalah"})
    }
    try {
        await socket.sendMessage(room, {sticker : {url : "media/temp/"+nama+".webp"}})
    }catch(err) {
        console.log(err)
        return await socket.sendMessage(room, {text : "Ada masalah"})
    }
    
    try {
        fs.unlinkSync("media/temp/"+file)
        fs.unlinkSync("media/temp/"+nama+".webp")
    }catch(err) {
        console.log(err)
        return await socket.sendMessage(room, {text : "Ada masalah"})
    }
}