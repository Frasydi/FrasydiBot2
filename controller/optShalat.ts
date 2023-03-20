import { WASocket } from '@adiwajshing/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
export const types = /^optshalat$/i
export const nama = "optShalat"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"optShalat [true/false]"
]
export const isGroup = true
export const isAdmin = true
export default async function optShalat(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    if(!isGroup) throw "Hanya bisa di grub"
    if(!isAdmin) throw "Hanya bisa dilakukan oleh admin"
    if(pesan.length < 2) throw "Harus ada opsi"
    if(!(pesan[0] == "true" || pesan[0] == "false")) throw "Hanya berupa true atau false"
    if(!/[0-9]+/i.test(pesan[1])) throw "Harus berupa kode wilayah." + `Baca selengkapnya menggunakan kommand ${getOptions().previx}sholat`
    const fetch = await axios.get(`https://api.banghasan.com/sholat/format/json/kota/kode/${pesan[1]}`)
    if(fetch.data.status != "ok") throw "Status Tidak Oke"
    if(fetch.data.kota.length == 0) throw "Kosong"
    const shalat : Array<{room : string, status : boolean, kode : number}> = getOptions().shalat
    const ind = shalat.findIndex(el => el.room == room)
    if(ind == -1) shalat.push({room : room, status : pesan[0] == "true", kode : parseInt(pesan[1])})
    else shalat[ind] = {room : room, status : pesan[0] == "true", kode :  parseInt(pesan[1])}
    setOptions(shalat, "shalat")
    await socket.sendMessage(room, {text : "Berhasil Mengubah pengaturan untuk grub ini"})
}