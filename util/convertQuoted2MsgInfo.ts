import { WAMessage } from '@whiskeysockets/baileys';
import { proto } from '@whiskeysockets/baileys/WAProto';
export default function convertQuoted2MsgInfo(messageInstance : WAMessage):WAMessage {
    const mess = messageInstance?.message?.ephemeralMessage?.message?.extendedTextMessage || messageInstance.message?.extendedTextMessage 
    ||  messageInstance.message?.imageMessage
    return {message : mess?.contextInfo?.quotedMessage, 
        key : {
            remoteJid : mess?.contextInfo?.participant,
            id : mess?.contextInfo?.stanzaId}}
}
