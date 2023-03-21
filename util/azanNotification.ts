import { WASocket } from "@adiwajshing/baileys";
import axios from "axios";
import { getOptions } from "./option";
export default function AzanNotification(socket: WASocket) {
  const location = new Map();
  let today = new Date();
  setInterval(async() => {
    const group: Array<{
      room: string;
      status: boolean;
      timezone: number;
      kode: number;
    }> = getOptions().shalat;
    const promise = group.map(async (el) => {
      if (!el.status) return;
      try {
        const targetDate = timeZoneConvert(new Date(), el.timezone);
        if (
          timeZoneConvert(today, el.timezone).getDate() != targetDate.getDate()
        ) {
          await socket.sendMessage("6282239437989@s.whatsapp.net", {text : `Terjadi perubahan waktu, ${today} dan ${targetDate}` })
          today = new Date();
          location.delete(el.kode);
        }
        if (!location.has(el.kode)) {
          const fetch = await axios.get(
            `https://api.banghasan.com/sholat/format/json/jadwal/kota/${el.kode}/tanggal/` +
              `${targetDate.getFullYear()}-${
                targetDate.getMonth() + 1 < 10
                  ? "0" + (targetDate.getMonth() + 1)
                  : targetDate.getMonth() + 1
              }-${targetDate.getDate()}`
          );
          if (fetch.data.status != "ok") throw "Not Ok";
          const data = fetch.data;
          const jadwal = data.jadwal.data;
  
          location.set(el.kode, {
            imsak: getTime(jadwal.imsak, el.timezone),
            terbit: getTime(jadwal.terbit, el.timezone),
            dhuha: getTime(jadwal.dhuha, el.timezone),
            ashar: getTime(jadwal.ashar, el.timezone),
            dzuhur: getTime(jadwal.dzuhur, el.timezone),
            maghrib: getTime(jadwal.maghrib, el.timezone),
            isya: getTime(jadwal.isya, el.timezone),
          });
          console.log(location);
        }
  
        const jadwal: { [key: string]: Date } = location.get(el.kode);
        const keys = Object.keys(jadwal);
        keys.forEach((el2) => {
          if (targetDate.getMinutes() == jadwal[el2].getMinutes() && targetDate.getHours() == jadwal[el2].getHours() && targetDate.getSeconds() == 0 ) {
  
            socket.sendMessage(el.room, {
              text: "Sekarang waktunya " + el2,
            });
          }
        });
      } catch (err) {
        console.log(err);
      }
    });
    await Promise.all(promise)
  }, 1000);
}

export function timeZoneConvert(timeNow: Date, tzone: number) {
  const totalOffset = 0 - -1 * (60 * tzone);
  const targetTime = timeNow.getTime() + totalOffset * 60 * 1000;
  const date = new Date(targetTime);
  date.setMilliseconds(0);
  return date;
}
function getTime(str: string, timezone: number) {
  const [hours, minute] = str.split(":").map(Number);
  const date = timeZoneConvert(new Date(), timezone);
  date.setHours(hours, minute, 0, 0);
  return date;
}
