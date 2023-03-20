import { WASocket } from '@adiwajshing/baileys';
import { messageType } from '../controller_middleware';
import { timeZoneConvert } from '../util/azanNotification';
import getMentions from '../util/getMentions';
import { getOptions, setOptions } from '../util/option';
import { timeZoneMap } from './optShalat';
export const types = /alarm/i
export const nama = "alarm"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix+"alarm [tahun]-[bulan]-[tanggal]-[jam]-[menit] [WIB|WITA|WIT] [pesan]"
]
export const isGroup = false
export const isAdmin = false
export default async function alarm(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    isAdmin
}: messageType) {
    if(isGroup) {
        if(!isAdmin) throw `Anda bukan admin`
    }
    if(pesan.length == 0) {
        const alarm = getOptions().alarm
        const keys = new Map(Object.entries(alarm))
        if(!keys.has(room)) throw `Tidak menemukan pengingat dengan user ini`
        const data : any = keys.get(room)
        await socket.sendMessage(room, {text : "Pengingat untuk grub ini\n\n"+`Pesan : ${data.pesan}\nTanggal dan Waktu : ${new Date(data.waktu).toLocaleString("id-ID")}`, mentions : [room]})
        return
    }
    if(pesan.length < 3) throw "Harus memberikan waktu, time zone, dan pesan dari alarm."
    const waktu = pesan[0].split("-")
    if(waktu.length < 4) throw `Tanggal kurang lengkap`
    const tzone = pesan[1].toUpperCase()
    if(!(tzone == "WIB" || tzone == "WITA" || tzone == "WIT") ) throw "Harus WIB, WITA, atau WIT"
    const [tahun, bulan, tanggal, jam, menit] = waktu

    for(let wak of waktu) {
        if(!/[0-9]+/i.test(wak)) throw `Tanggal dan waktu harus berupa angka`
    }
    const text = pesan.slice(2).join(" ")
    const date = new Date()
    date.setFullYear(parseInt(tahun), parseInt(bulan)-1, parseInt(tanggal) )
    date.setHours( parseInt(jam), parseInt(menit), 0, 0)
    const now = timeZoneConvert(new Date(), timeZoneMap[tzone])
    console.log(date.getTime(), now.getTime())
    if(date.getTime() < now.getTime()) throw `Tanggal tidak bisa sebelum saat ini`
    const alarm = getOptions().alarm
    alarm[room] = {
        pesan : text,
        timeZone : timeZoneMap[tzone],
        waktu : date.getTime()
    }
    setOptions(alarm, "alarm")
    await socket.sendMessage(room, {text : "Berhasil menambah pengingat untuk room ini"})
}