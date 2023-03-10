import { WASocket } from '@adiwajshing/baileys';
export async function getGroupMetadata(room:string,sock:WASocket) {
    try {
        return (await sock.groupMetadata(room)).participants
    }catch(err) {
        console.log(err);
        return []
    }
}