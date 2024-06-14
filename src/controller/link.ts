import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /link/i
export const nama = "Link"
export const kategori = "Group"
export const bantuan = [
    getOptions()?.prefix+"link"
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
    mentions,
    isAdmin,
    quoted
}: messageType) {
    if(!isGroup) throw "Harus Di Grub"
    const code = await socket.groupInviteCode(room)
    let pp = ""
    try {
        pp = await socket.profilePictureUrl(room) || ""
    }catch(err) {
        console.log(err)
        pp = "https://www.google.com/imgres?q=empty%20image&imgurl=https%3A%2F%2Fpng.pngtree.com%2Fpng-clipart%2F20200311%2Fourmid%2Fpngtree-empty-frame-with-torn-paper-png-image_2157793.jpg&imgrefurl=https%3A%2F%2Fpngtree.com%2Fso%2Fempty&docid=bSowxv4SMxSR6M&tbnid=ysPZzMrpe_ujHM&vet=12ahUKEwj7vY-9ha6GAxVs3TgGHTaYBqMQM3oECGYQAA..i&w=360&h=360&hcb=2&ved=2ahUKEwj7vY-9ha6GAxVs3TgGHTaYBqMQM3oECGYQAA"
    }
    const metadata = await socket.groupMetadata(room) 
    console.log(metadata)
    await socket.sendMessage(room, {image : {url : pp || ""}, caption: `Link Grub ${metadata.subject} https://chat.whatsapp.com/${code} \n\n${metadata.desc == null ? "" : metadata.desc}` })
}