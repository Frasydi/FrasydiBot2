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
  const timeNow = Date.now();
  const group: Array<{ room: string; status: boolean; kode: number }> =
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
        const data = fetch.data;
        const jadwal = data.jadwal.data;
        console.log(jadwal);
        location.set(el.kode, {
          ashar: getTime(jadwal.ashar),
          dzuhur: getTime(jadwal.dzuhur),
          maghrib: getTime(jadwal.maghrib),
          isya: getTime(jadwal.isya),
        });
        console.log(location);
      }
      const jadwal = location.get(el.kode);
      const keys = Object.keys(jadwal);
      keys.forEach((el2) => {
        if (jadwal[el2] == timeNow) {
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
function getTime(str: string) {
  const [hours, minute] = str.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minute, 0, 0);
  return date.getTime();
}
