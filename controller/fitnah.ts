import { proto } from '@whiskeysockets/baileys/WAProto';
import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import generateString from '../util/generateString';
import { v4 as uuidv4 } from "uuid"
import convertTel from '../util/convertTel';
import getMentions from '../util/getMentions';
export const types = /fitnah/i
export const nama = "Fitnah"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "fitnah [korban] [isi fitnah]"
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
    if (pesan.length < 2) throw "Kontak dan isi fitnah kosong"
    if (pesan.slice(1).join("").trim().length == 0) throw "Isi fitnah kosong"

    await socket.sendMessage(room, {
        text: "",
        mentions: getMentions(pesan.join(" "))
    },
        {
            quoted: {
                key: {
                    remoteJid: room,
                    id: uuidv4(),
                    participant: convertTel(pesan[0])
                },
                messageTimestamp: messageInstance.messageTimestamp,
                message: {
                    extendedTextMessage: {
                        text: pesan.slice(1).join(" ") as string, 
                        
                        contextInfo: {
                            mentionedJid: ["LOL"],
                        },
                        previewType : proto.Message.ExtendedTextMessage.PreviewType.NONE

                    }
                }
            },
        })
    try {
        await socket.sendMessage(room, { delete: messageInstance.key })
    } catch (err) {

    }

}