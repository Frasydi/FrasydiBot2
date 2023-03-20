import { WASocket } from "@adiwajshing/baileys";
import axios from "axios";
import { getOptions } from "./option";
export default function AzanNotification(socket: WASocket) {
  const location = new Map();
  const today = timeZoneConvert(new Date(), 8);
  setInterval(() => {
    handleTime(socket, today, location);
  }, 1000);
}
function handleTime(socket: WASocket, today: Date, location: Map<number, any>) {
    const timeNow = timeZoneConvert(new Date(), 8)
    if(today.getDate() != timeNow.getDate()) {
      console.log(today.getDate(), timeNow.getDate())
      today = timeZoneConvert(new Date(), 8);
      location.clear()
    }
    const group: Array<{ room: string; status: boolean;timezone : number,  kode : number }> =
    getOptions().shalat;
  group.map(async (el) => {
    if (!el.status) return;
    try {
      if (!location.has(el.kode)) {
        const fetch = await axios.get(
          `https://api.banghasan.com/sholat/format/json/jadwal/kota/${el.kode}/tanggal/` +
            `${timeNow.getFullYear()}-${
              timeNow.getMonth() + 1 < 10
                ? "0" + (timeNow.getMonth() + 1)
                : timeNow.getMonth() + 1
            }-${timeNow.getDate()}`
        );
        if(fetch.data.status != "ok") throw "Not Ok"
        console.log(fetch.data)
        const data = fetch.data;
        const jadwal = data.jadwal.data;
        location.set(el.kode, {
          imsak : getTime(jadwal.imsak, el.timezone),
          terbit : getTime(jadwal.terbit, el.timezone),
          dhuha : getTime(jadwal.dhuha, el.timezone),
          ashar: getTime(jadwal.ashar, el.timezone),
          dzuhur: getTime(jadwal.dzuhur, el.timezone),
          maghrib: getTime(jadwal.maghrib, el.timezone),
          isya: getTime(jadwal.isya, el.timezone),
        });
        console.log(location);
      }
     
      const targetDate = timeZoneConvert(timeNow, el.timezone - 8)
      const jadwal : {[key:string] : Date}= location.get(el.kode);
      const keys = Object.keys(jadwal);
      keys.forEach((el2) => {
        console.log(targetDate, jadwal[el2])
        if (targetDate.getTime() == jadwal[el2].getTime()) {
          socket.sendMessage(el.room, {
            text: "Sekarang waktunya " + el2,
          });
        }
      });
    } catch (err) {
      console.log(err);
    }
  });
}

export function timeZoneConvert(timeNow : Date, tzone : number) {
    const totalOffset = 0 -  (-1 * (60*tzone));
    const targetTime = timeNow.getTime() + (totalOffset * 60 * 1000);
    const date =  new Date(targetTime);
    date.setMilliseconds(0)
    return date
}
function getTime(str: string, timezone : number) {
  const [hours, minute] = str.split(":").map(Number);
  const date = timeZoneConvert(new Date(), timezone)
  date.setHours(hours, minute, 0, 0);
  return date
}
