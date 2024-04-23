import { WASocket } from "@whiskeysockets/baileys";
import axios from "axios";
import { messageType } from "../controller_middleware";
import { getOptions } from "../util/option";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs"
export const types = /dall/i;
export const nama = "Dall";
export const kategori = "Tools";
export const bantuan = [getOptions()?.prefix + "dall [pertanyaan]"];
export const isGroup = false;
export const isAdmin = false;
let isLimit = false;
const limiter = () => {
  setTimeout(() => {
    isLimit = false;
  }, 60000);
};

export default async function AI(
  socket: WASocket,
  {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance,
  }: messageType
) {
  if (isLimit)
    return await socket.sendMessage(
      room,
      {
        text: "Hanya bisa digunakan per 1 menit, tunggu sebentar",
      },
      {
        quoted: messageInstance,
      }
    );
  try {
    isLimit = true;
    console.log(process.env.OPENAI_API_KEY)
    const res = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        model: "image-alpha-001",
        prompt: pesan.join(" "),
        n: 1,
        size: "512x512",
        response_format: "url",
      }, {
        headers : {
            Authorization : "Bearer "+process.env.OPENAI_API_KEY
        }
      }
    );
    limiter();

    if (res.status > 200) return;
    console.log(JSON.stringify(res.data));
    
    const name = uuidv4()+".png"
    const url = res.data.data[0].url;
    const img = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(img.data, 'binary');
    fs.writeFileSync("media/"+name, buffer)
    await socket.sendMessage(room, {image : {url : "media/"+name}})
    fs.unlinkSync("media/"+name)
  } catch (err: any) {
    console.log(err);
    isLimit = false;

    if (err.response.data == "Too many requests") {
      return await socket.sendMessage(room, {
        text: "Terlalu banyak request, tunggu satu jam lagi",
      });
    }
    await socket.sendMessage(
      room,
      {
        text: "Tampaknya Dall E sedang penuh, coba lagi lain kali",
      },
      {
        quoted: messageInstance,
      }
    );
  }
}
