import { GroupParticipant, MessageUpsertType } from "@adiwajshing/baileys/lib/Types";
import { proto } from "@adiwajshing/baileys/WAProto";
import { WASocket } from '@adiwajshing/baileys';

import ControllerFunctions from "./controller_add";
import { getOptions } from "./util/option";
import { getGroupMetadata } from "./util/group";

export interface messageType {
    key: string, 
    fromMe: boolean,
    pesan: string[],
    room: string,
    pengirim: string,
    isGroup: boolean,
    pengirim_nama: string,
    anggota: Array<GroupParticipant>,
    isAdmin: boolean,
    messageInstance : proto.IWebMessageInfo,
    kontak : string[],
    quoted? : proto.IMessage | null | undefined,
    message_type : msg_type
}
type msg_type = "imageMessage" | "videoMessage"
export default async function MiddlewareController(message: {
    messages: proto.IWebMessageInfo[];
    type: MessageUpsertType;
}, socket: WASocket) {
    const isGroup = message.messages?.[0].key?.participant != null
    const pesan = message.messages[0].message?.conversation || message.messages[0].message?.extendedTextMessage?.text || message.messages[0].message?.imageMessage?.caption
    const quoted = message.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!(pesan?.at(0) == getOptions().prefix as string)) return
    const msgType = Object.keys(message?.messages[0].message as object)[0]
    const sending: messageType = {

        key: message.messages[0].key.id as string,
        fromMe: message.messages[0].key.fromMe as boolean,
        room: message.messages[0].key.remoteJid as string,
        pesan: pesan.split(" ").slice(1),
        pengirim: isGroup ? message.messages[0].key.participant as string : message.messages[0].key.remoteJid as string,
        isGroup: isGroup,
        anggota: [],
        pengirim_nama: message.messages[0].pushName as string,
        isAdmin: false,
        messageInstance : message.messages[0],
        quoted,
        kontak : [],
        message_type : msgType as unknown as msg_type
    }
    if(quoted?.contactMessage?.vcard != null) {
        const contact : string[] = quoted?.contactMessage?.vcard?.match(/(?<=waid=)[0-9]+/gi) as string[]
        sending.kontak?.push(contact[0])
    }
    if(quoted?.contactsArrayMessage != null) {
        quoted?.contactsArrayMessage.contacts?.forEach(el => {
            const contact : string[] = el?.vcard?.match(/(?<=waid=)[0-9]+/gi) as string[]
            sending.kontak?.push(contact[0])
        })
    }
    if (isGroup) {
        sending.anggota = await getGroupMetadata(sending.room as string, socket)
        sending.isAdmin = sending.anggota.filter(el => el.id == sending.pengirim)[0].admin == "admin"
    }
    ControllerFunctions.forEach(async (el: {
        types: RegExp,
        default: any
    }) => {
        if (!el.types.test(pesan.split(" ")[0].split("/").at(-1) as string)) return
        try {

            await el.default(socket, sending)

        } catch (err) {
            console.log(err)
        }
    })
}