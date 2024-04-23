const pemilihanWaktu = ["detik","menit","jam","hari","minggu","bulan","tahun"]
import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /kapan/i
export const nama = "Kapan"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"kapan [pertanyaan]"
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
    messageInstance
}: messageType) {
    if(pesan.length == 0) throw "Tidak ada pertanyaannya"
    const angka = Math.floor(Math.random()*99+1)
    const rand = Math.random()*pemilihanWaktu.length
    const pilihan = Math.floor(rand == pemilihanWaktu.length ? pemilihanWaktu.length-1 :rand )
    console.log(pilihan)
    const waktus = pemilihanWaktu[pilihan]
    await socket.sendMessage(room, {text:`*Pertanyaan : Kapan ${pesan.join(" ").trim()}*\nJawaban : ${angka} ${waktus} lagi`})
}