import { WASocket } from "@adiwajshing/baileys";
import { messageType } from "../controller_middleware";
import { getOptions } from "../util/option";
import { execSync, exec, spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
export const types = /yt/i;
export const nama = "Youtube";
export const kategori = "Tools";
export const bantuan = [getOptions()?.prefix + "yt [link]"];
export const isGroup = false;
export const isAdmin = false;
export default async function Youtube(
  socket: WASocket,
  { key, fromMe, pesan, room, pengirim_nama, pengirim, isGroup }: messageType
) {
  if (pesan.length == 0)
    return await socket.sendMessage(room, {
      text: "Anda tidak memberikan link",
    });
    if(pesan[1] == null) return await socket.sendMessage(room, {
      text: "Anda tidak memasukkan tipe",
    }); 
  if (pesan[1].trim().length == 0)
    return await socket.sendMessage(room, {
      text: "Anda tidak memasukkan tipe",
    });
  if (!/^video$|^audio$/i.test(pesan[1]))
    return await socket.sendMessage(room, {
      text: "Format Tipe salah.\n\nIni adalah formatnya : " + bantuan[0],
    });
  const isVideo = /^video$/i.test(pesan[1]);
  console.log(isVideo);
  const nama = uuidv4();
  try {
    if(!fs.existsSync("media/temp")) {
      fs.mkdirSync("media/temp")
    }
    await socket.sendPresenceUpdate('recording', room) 
    const result = execSync(
      `yt-dlp -f 'worst[ext=mp4]' --max-filesize 75971520   -o "media/temp/${nama}.mp4" ${pesan.at(0)}`
    ).toString();

    console.log(result);
    
    if (isVideo) {
      const stream = fs.createReadStream(`media/temp/${nama}.mp4` as string);
      await socket.sendMessage(room, { video: { stream: stream } });
    } else {
      // const tes  = execSync(`ffmpeg -i media/temp/${nama}.mp4 -vn -acodec libmp3lame -qscale:a 2 media/temp/${nama}.mp3`).toString();
      // console.log(tes)
      await socket.sendMessage(room, {
        audio: { url: `media/temp/${nama}.mp4` as string},ptt : false, mimetype : "audio/mp4"
      });
    }

  } catch (err) {
    
    return await socket.sendMessage(room, { text: "Terdapat Masalah" });
  }
}
