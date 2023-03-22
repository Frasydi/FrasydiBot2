import { WASocket } from "@adiwajshing/baileys";
import { messageType } from "../controller_middleware";
import { getOptions } from "../util/option";
import axios from "axios";
export const types = /^sholat$/i;
export const nama = "Sholat";
export const kategori = "Education";
export const bantuan = [
  getOptions()?.prefix + "Sholat",
  getOptions()?.prefix + "Sholat [kode kota]",
  getOptions()?.prefix + "Sholat [nama kota]",
];
export const isGroup = false;
export const isAdmin = false;
export default async function Sholat(
  socket: WASocket,
  { key, fromMe, pesan, room, pengirim_nama, pengirim, isGroup }: messageType
) {
  if (pesan.length == 0) {
    try {
      const fetch = await axios.get(
        "https://api.myquran.com/v1/sholat/kota/semua"
      );
      const data = await fetch.data;
      const kota = data.map((el: any) => `${el.lokasi} : ${el.id}`).join("\n");
      await socket.sendMessage(room, {
        text: "Daftar Kota dan kode \n\n" + kota,
      });
    } catch (err) {
      console.log(err);
      await socket.sendMessage(room, { text: "Ada masalah" });
    }
    return;
  }
  const isKode = /[0-9]+/i.test(pesan[0]);
  const date = new Date();
  try {
    console.log(pesan[0]);
    if (!isKode) {
      const fetch = await axios.get(
        `https://api.myquran.com/v1/sholat/kota/cari/${pesan[0]}`
      );
      const data = fetch.data;
      if (!data.status) throw "Status is not Ok";
      if (data.data.length == 0) throw "Kosong";
      const kota = data.data[0];
      console.log(kota)
      const fetch2 = await axios.get(
        `https://api.myquran.com/v1/sholat/jadwal/${kota.id}/` +
        `${date.getFullYear()}/${
          date.getMonth() + 1 < 10
            ? "0" + (date.getMonth() + 1)
            : date.getMonth() + 1
        }/${date.getDate()}`
      );
      const data2 = fetch2.data;
      if (!data2.status) throw "Status is not Ok";
      const jadwal = data2.data.jadwal;
      console.log(data2)
    await socket.sendMessage(room, {
      text: `Jadwal Sholat di ${data2.data.lokasi} pada ${jadwal.tanggal}\n\nSubuh : ${jadwal.subuh}\nDzuhur : ${jadwal.dzuhur}\nAshar : ${jadwal.ashar}\nMaghrib : ${jadwal.maghrib}\nIsya : ${jadwal.isya}\n`
    });

      return;
    }
    const fetch = await axios.get(
      `https://api.myquran.com/v1/sholat/jadwal/${pesan[0]}/` +
        `${date.getFullYear()}/${
          date.getMonth() + 1 < 10
            ? "0" + (date.getMonth() + 1)
            : date.getMonth() + 1
        }/${date.getDate()}`
    );
    const fetch2 = await axios.get(
      `https://api.myquran.com/v1/sholat/kota/id/${pesan[0]}`
    );
    const data = fetch.data;
    const data2 = fetch2.data;
    if (!data.status ) throw "Status is not Ok";
    if (!data2.status ) throw "Status is not Ok";
    const jadwal = data.data.jadwal;
    console.log(jadwal)
    await socket.sendMessage(room, {
      text: `Jadwal Sholat di ${data2.data.lokasi} pada ${jadwal.tanggal}\n\nSubuh : ${jadwal.subuh}\nDzuhur : ${jadwal.dzuhur}\nAshar : ${jadwal.ashar}\nMaghrib : ${jadwal.maghrib}\nIsya : ${jadwal.isya}\n`,
      footer: "Frasydi Bot",
      buttons: [
        {
          buttonId: getOptions()?.prefix + "Sholat",
          buttonText: { displayText: "Daftar Semua Kota" },
          type: 1,
        },
      ],
    });
  } catch (err) {
    console.log(err);
    await socket.sendMessage(room, {
      text: typeof err == "string" ? err : "Ada masalah",
    });
  }
}
