import { proto } from '@adiwajshing/baileys/WAProto';
import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import generateString from '../util/generateString';
import {v4 as uuidv4} from "uuid"
import convertTel from '../util/convertTel';
import { z } from 'zod';
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
    messageInstance
}: messageType) {
    const validate = z.array(z.string()).min(2)
    try {
        validate.parse(pesan)
    }catch(err) {
        throw "Kontak dan isi fitnah kosong"
    }
    
    const isiFitnah = pesan.slice(1).join(" ")
    try {
        z.string().min(1).parse(isiFitnah)
    }catch(err) {
        throw `Isi Fitnah tidak boleh kosong`
    }
    const fitnah:proto.IWebMessageInfo = {
        key : {
            remoteJid : room,
            id : uuidv4(),
            participant : convertTel(pesan[0])
        },
        messageTimestamp : messageInstance.messageTimestamp,
        message : {
            extendedTextMessage :  { text :  pesan.slice(1).join(" ") as string}
        }
    }
    await socket.sendMessage(room, {text : ""}, {quoted : fitnah})
}