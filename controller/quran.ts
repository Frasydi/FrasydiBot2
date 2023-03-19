import { htmlToText } from 'html-to-text';
import { WASocket } from '@adiwajshing/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
//@ts-ignore
import { toArabicWord } from 'number-to-arabic-words/dist/index-node.js';
function toIndiaDigits(string:string){
    var id= ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return string.replace(/[0-9]/g, function(w){
     return id[+w]
    });
   }
export const types = /quran/i
export const nama = "quran"
export const kategori = "Education"
export const bantuan = [
    getOptions()?.prefix+"quran",
    getOptions()?.prefix+"quran [surah]",
    getOptions()?.prefix+"quran [surah] [ayat]",
]
export const isGroup = false
export const isAdmin = false
export default async function quran(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    try {

        if(pesan.length == 0) {
            const fetch = await axios.get("https://api.banghasan.com/quran/format/json/surat")
            const data = fetch.data
            if(data.status != "ok") throw data.pesan.join(", ")
            const hasil = data.hasil
            const surah = hasil.map((el:any) => `${el.nomor}. ${el.nama}(${el.asma}) - ${el.arti} [${el.type}]`).join("\n")
            await socket.sendMessage(room, {text:"Daftar Surah \n\n"+surah})
            return
        }
        if(pesan.length < 2) {
            if(!/[0-9]+/i.test(pesan[0])) throw "Harus berupa Angka"
            console.log(pesan[0])
            const parsPesan = parseInt(pesan[0])
            if(parsPesan > 114) throw "Surat hanya sampai 114"
            const fetch = await axios.get("https://api.banghasan.com/quran/format/json/surat/"+parsPesan)
            const data = fetch.data
            if(data.status != "ok") throw data.pesan.join(", ")
            if(data.hasil.length == 0) throw "Kosong"
            const hasil = data.hasil[0]
            const surah =  `Nama Surah : ${hasil.nama}(${hasil.asma})\nArti : ${hasil.arti}\nJumlah Ayat : ${hasil.ayat}\nKeterangan : ${htmlToText(hasil.keterangan)}`
            await socket.sendMessage(room, {text : "Detail Surah\n\n"+surah})
            return
        }
        if(!/[0-9]+/i.test(pesan[0])) throw "Harus berupa Angka"
        console.log(pesan[0])
        const parsPesan = parseInt(pesan[0])
        const fetch = await axios.get(`https://api.banghasan.com/quran/format/json/surat/${parsPesan}/ayat/${pesan[1]}`)
        const data = fetch.data
        if(data.status != "ok") throw "Ada Masalah"
        if(data.ayat.error != null) throw "Ada Error pada pencarian ayat "+data.ayat.error.join(", ")
        console.log(data.ayat.data)
        const ayat = data.ayat.data.ar.map((el:any, ind:number) => `${toIndiaDigits(el.ayat)}. ${el.teks}\n${htmlToText(data.ayat.data.idt[ind].teks)}\n${data.ayat.data.id[ind].teks}`).join("\n\n")
        await socket.sendMessage(room, {text : "Hasil dari Q.S "+data.surat.nama+" ayat "+pesan[1]+"\n\n"+ayat})
    }catch(err) {
        console.log(err)
        await socket.sendMessage(room, {text :typeof err == "string" ? err : "Ada masalah"})

    }
}