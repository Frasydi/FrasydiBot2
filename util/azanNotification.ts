import { WASocket } from "@adiwajshing/baileys";
import axios from "axios";
import { getOptions } from "./option";
export default function AzanNotification(socket: WASocket) {
  const location = new Map();
  const today = new Date();
  setInterval(() => {
    handleTime(socket, today, location);
  }, 1000);
}
function handleTime(socket: WASocket, today: Date, location: Map<number, any>) {
    const timeNow = new Date();
    if(today.getDate() != timeNow.getDate()) location.clear()
    const group: Array<{ room: string; status: boolean;timezone : number,  kode : number }> =
    getOptions().shalat;
  group.map(async (el) => {
    if (!el.status) return;
    try {
      if (!location.has(el.kode)) {
        const fetch = await axios.get(
          `https://api.banghasan.com/sholat/format/json/jadwal/kota/${el.kode}/tanggal/` +
            `${today.getFullYear()}-${
              today.getMonth() + 1 < 10
                ? "0" + (today.getMonth() + 1)
                : today.getMonth() + 1
            }-${today.getDate()}`
        );
        if(fetch.data.status != "ok") throw "Not Ok"
        console.log(fetch.data)
        const data = fetch.data;
        const jadwal = data.jadwal.data;
        location.set(el.kode, {
          imsak : getTime(jadwal.imsak),
          terbit : getTime(jadwal.terbit),
          dhuha : getTime(jadwal.dhuha),
          ashar: getTime(jadwal.ashar),
          dzuhur: getTime(jadwal.dzuhur),
          maghrib: getTime(jadwal.maghrib),
          isya: getTime(jadwal.isya),
        });
        console.log(location);
      }
     
      const targetDate = timeZoneConvert(timeNow, el.timezone)
      const jadwal : {[key:string] : Date}= location.get(el.kode);
      const keys = Object.keys(jadwal);
      keys.forEach((el2) => {
        if (targetDate.getTime() == jadwal[el2].getTime()) {
          socket.sendMessage(el.room, {
            text: "Sekarang waktunya sholat " + el2,
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
function getTime(str: string) {
  const [hours, minute] = str.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minute, 0, 0);
  return date
}
