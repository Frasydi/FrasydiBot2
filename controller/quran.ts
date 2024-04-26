import { htmlToText } from 'html-to-text';
import { WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
   
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
    getOptions()?.prefix+"quran [surah] [ayat] [sepanjang]",
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
            const fetch = await axios.get("https://api.myquran.com/v2/quran/surat/semua")
            const data = fetch.data
            console.log(data)
            if(data.status == false) throw "Error"
            const hasil = data.data
            const surah = hasil.map((el:any) => `${el.number}. ${el.name_id}(${el.name_short}) - ${el.translation_id} [${el.revelation_id}]`).join("\n")
            await socket.sendMessage(room, {text:"Daftar Surah \n\n"+surah})
            return
        }
        if(pesan.length < 2) {
            if(!/[0-9]+/i.test(pesan[0])) throw "Harus berupa Angka"
            console.log(pesan[0])
            const parsPesan = parseInt(pesan[0])
            if(parsPesan > 114) throw "Surat hanya sampai 114"
            const fetch = await axios.get("https://api.myquran.com/v2/quran/surat/"+parsPesan)
            const data = fetch.data
            if(data.status == false) throw data.message
            if(data.data.length == 0) throw "Kosong"
            const hasil = data.data
            const surah =  `Nama Surah : ${hasil.name_id}(${hasil.name_short})\nArti : ${hasil.translation_id}\nJumlah Ayat : ${hasil.number_of_verses}\nKeterangan : ${htmlToText(hasil.tafsir)}`
            await socket.sendMessage(room, {text : "Detail Surah\n\n"+surah})
            return
        }
        if(!/[0-9]+/i.test(pesan[0])) throw "Harus berupa Angka"
        if(!/[0-9]+/i.test(pesan[1])) throw "Harus berupa Angka"
        if(pesan.length > 2) {
            if(!/[0-9]+/i.test(pesan[2])) throw "Harus berupa Angka"
        }
        const parsPesan = parseInt(pesan[0])
        const fetch = await axios.get(`https://api.myquran.com/v2/quran/ayat/${parsPesan}/${pesan[1]}`+(pesan.length > 2 ? "/"+((parseInt(pesan[2])+1) - parseInt(pesan[1])) : ""))
        const data = fetch.data
        if(data.status == false) throw "Ada Masalah"
        const ayat = data.data.map((el:any, ind:number) => `${toIndiaDigits(el.ayah)}. ${el.arab}\n${htmlToText(el.latin)}\n${el.text}`).join("\n\n")
        await socket.sendMessage(room, {text : "Hasil dari Q.S "+data.info.surat.nama.id+" ayat "+pesan[1]+(pesan.length > 2 ? " hingga ayat "+pesan[2] : "")+"\n\n"+ayat})
    }catch(err) {
        console.log(err)
        await socket.sendMessage(room, {text :typeof err == "string" ? err : "Ada masalah"})

    }
}