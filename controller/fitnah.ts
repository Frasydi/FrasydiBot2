import { proto } from '@whiskeysockets/baileys/WAProto';
import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import generateString from '../util/generateString';
import {v4 as uuidv4} from "uuid"
import convertTel from '../util/convertTel';
export const types = /fitnah/i
export const nama = "Fitnah"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"fitnah [korban] [isi fitnah]"
]
export const isGroup = false
export const isAdmin = false
export default async function Fitnah(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance,
    quoted
}: messageType) {
    if(pesan.length < 2) return await socket.sendMessage(room, {text : "Kontak dan isi fitnah kosong"})
    if(pesan.slice(1).join(" ").trim().length == 0) return await socket.sendMessage(room, {text : "Isi fitnah kosong"})
    console.log(pesan.join(" "))
    console.log(messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid)
    
    await socket.sendMessage(room, {text : "",  mentions : messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid as string[]}, {quoted : {
        key : {
            remoteJid : room,
            id : uuidv4(),
            participant : convertTel(pesan[0])
        },
        messageTimestamp : messageInstance.messageTimestamp,
        message : {
            extendedTextMessage :  { text :  pesan.slice(1).join(" ") as string, contextInfo : {
                mentionedJid : messageInstance.message?.extendedTextMessage?.contextInfo?.mentionedJid,
            }}
        }
    }, })
}