import { WASocket } from "@adiwajshing/baileys";
import axios from "axios";
import { getOptions } from "./option";
export default function AzanNotification(socket: WASocket) {
  const location = new Map();
  let isSpam = false;
  const restoreSpam = () => {
    setTimeout(() => {
      isSpam = false;
    }, 60000 * 2);
  };
  setInterval(async () => {
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
        if (location.has(el.kode)) {
          const { today }: { [key: string]: any } = location.get(el.kode);
          const hasil = checkPerbedaan(
            today,
            el.kode,
            targetDate,
            isSpam,
            restoreSpam
          );
          if (hasil) {
            await socket.sendMessage("6282239437989@s.whatsapp.net", {
              text: `Terjadi perubahan waktu, ${today} dan ${targetDate.getDate()}`,
            });
            location.delete(el.kode);
          }
        }
        if (!location.has(el.kode)) {
          const fetch = await axios.get(
            `https://api.myquran.com/v1/sholat/jadwal/${el.kode}/` +
              `${targetDate.getFullYear()}/${
                targetDate.getMonth() + 1 < 10
                  ? "0" + (targetDate.getMonth() + 1)
                  : targetDate.getMonth() + 1
              }/${targetDate.getDate()}`
          );
          if (!fetch.data.status) throw "Not Ok";
          const data = fetch.data;
          const jadwal = data.data.jadwal;

          location.set(el.kode, {
            imsak: getTime(jadwal.imsak, el.timezone),
            terbit: getTime(jadwal.terbit, el.timezone),
            dhuha: getTime(jadwal.dhuha, el.timezone),
            ashar: getTime(jadwal.ashar, el.timezone),
            dzuhur: getTime(jadwal.dzuhur, el.timezone),
            maghrib: getTime(jadwal.maghrib, el.timezone),
            isya: getTime(jadwal.isya, el.timezone),
            today: timeZoneConvert(new Date(), el.timezone).getDate(),
          });
          console.log(location);
        }

        const jadwal: { [key: string]: Date } = location.get(el.kode);
        const keys = Object.keys(jadwal);
        const promis = keys.map(async(el2) => {
          if(el2 == "today") return
          if (
            targetDate.getMinutes() == jadwal[el2].getMinutes() &&
            targetDate.getHours() == jadwal[el2].getHours() &&
            targetDate.getSeconds() == 0
          ) {
            await socket.sendMessage(el.room, {
              text: "Sekarang waktunya " + el2,
            })
          }
        });
        await Promise.all(promis)
      } catch (err) {
        console.log(err);
      }
    });
    await Promise.all(promise);
  }, 1000);
}
function checkPerbedaan(
  dateToday: number,
  kode: number,
  targetDate: Date,
  isSpam: boolean,
  restoreSpam: any
) {
  if (dateToday != targetDate.getDate()) {
    isSpam = true;
    restoreSpam();
    if (isSpam) return;
    return true;
  }
  return false;
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
