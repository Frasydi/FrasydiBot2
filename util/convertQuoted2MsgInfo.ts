import { proto } from '@whiskeysockets/baileys/WAProto';
export default function convertQuoted2MsgInfo(messageInstance : proto.IWebMessageInfo):proto.IWebMessageInfo {
    const mess = messageInstance?.message?.ephemeralMessage?.message?.extendedTextMessage || messageInstance.message?.extendedTextMessage 
    ||  messageInstance.message?.imageMessage
    return {message : mess?.contextInfo?.quotedMessage, 
        key : {
            remoteJid : mess?.contextInfo?.participant,
            id : messageInstance.message?.extendedTextMessage?.contextInfo?.stanzaId}}
}
