import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import getMentions from '../util/getMentions';
import { getOptions } from '../util/option';
export const types = /confess/i
export const nama = "Confess"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"confess"
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
    kontak
}: messageType) {
    if(kontak?.length == 0) return await socket.sendMessage(room, {text : "Tidak ada kontak yang ingin dikonfes"})
    const errors = []
    const mentions = getMentions(pesan.join(" "))
    console.log(mentions)
    for(let el of kontak) {
        try {
            await socket.sendMessage(el+"@s.whatsapp.net", {text : "Ada pesan dari seseorang.\n\n"+pesan.join(" "), mentions : mentions})
        }catch(err) {
            console.log(err)
            errors.push(el)
        }
        
    }
    await socket.sendMessage(room, {text : "Pesan anda sudah dikirim.\n"+errors.map((el,ind) => `${ind+1}. Terdapat Error pada nomor ${el}`).join("\n")})
    
}