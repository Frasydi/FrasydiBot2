import { execSync } from "child_process";
import { WASocket } from "@adiwajshing/baileys";
import { messageType } from "../controller_middleware";
import { getOptions } from "../util/option";
import SpotifyWebApi from "spotify-web-api-node";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import removeDir from "../util/rmdir";
export const types = /spotify/i;
export const nama = "spotify";
export const kategori = "Fun";
export const bantuan = [getOptions()?.prefix + "spotify"];
export const isGroup = false;
export const isAdmin = false;
type tipe = "search" | "download";
interface buttons {
  buttonId: string;
  buttonText: {
    displayText: string;
  };
  type: 1;
}
export default async function spotify(
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
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT,
      clientSecret: process.env.SPOTIFY_SECRET,
    });
    if (pesan.length < 2) throw "Harus memasukkan pencarian atau id lagu";
    if (!(pesan[0] == "search" || pesan[0] == "download"))
      throw "Harus memasukkan search atau download";
    const tipe: tipe = pesan[0];
    const response = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(response.body.access_token);
    if (tipe == "search") {
      let src = pesan.slice(1).join(" ");

      let offset = 0;
      if (src.includes("|")) {
        const temp = src.split("|");
        if (temp.length < 2) throw "Tampaknya ada masalah";
        src = temp.at(0) as string;
        if (!/[0-9]+/i.test(temp.at(1) as string))
          throw "Untuk offset harus menggunakan angka";
        offset = parseInt(temp.at(1) as string);
      }

      const search = await spotifyApi.searchTracks(src, {
        limit: 5,
        offset: offset,
      });
      const items = search.body.tracks?.items
        .map(
          (el, ind) =>
            `${offset + (ind + 1)}. Judul Lagu : ${el.name}\nArtis : ${
              el.artists[0].name
            }\nAlbum : ${el.album.name}\nId : ${el.id}\n`
        )
        .join("\n");
      const buttons: buttons[] = [];
      if (offset > 0) {
        buttons.push({
          buttonId: "/spotify search " + src + "|" + (offset - 5),
          buttonText: { displayText: "Prev" },
          type: 1,
        });
      }
      buttons.push({
        buttonId: "/spotify search " + src + "|" + (offset + 5),
        buttonText: { displayText: "Next" },
        type: 1,
      });
      return await socket.sendMessage(room, {
        text: "Daftar Lagu dari hasil pencarian *" + src + "*\n\n" + items,
        footer: "Frasydi Bot",
        buttons: buttons,
      });
    }
    await socket.sendPresenceUpdate("recording", room)
    let src = pesan.slice(1).join(" ");

    let ind = 0;
    if (!src.includes("|")) throw "Harus include index";
    const temp = src.split("|");
    if (temp.length < 2) throw "Tampaknya ada masalah";
    src = temp.at(0) as string;
    if (!/[0-9]+/i.test(temp.at(1) as string))
      throw "Untuk index harus menggunakan angka";
    ind = parseInt(temp.at(1) as string)-1;
    if(ind < 0) throw "Index tidak boleh kurang atau sama dengan 0"
    const search = await spotifyApi.searchTracks(src, {
      limit: 5,
      offset: ind,
    });
    const selectedSong = search.body.tracks?.items[0];
    const dirName = uuidv4();
    try {
      execSync(
        `spotifydl https://open.spotify.com/track/${selectedSong?.id} --o media/temp/${dirName} --oo media/temp/${dirName}`
      );
    } catch (err) {
      console.log("Test");
    }
    await socket.sendMessage(
      room,
      {
        audio: { url: `media/temp/${dirName}/${selectedSong?.name}.mp3` },
        ptt: false,
        mimetype: "audio/mp4",
      },
      { quoted: messageInstance }
    );
      removeDir(`media/temp/${dirName}/`)
  } catch (err) {
    console.log(err);
    await socket.sendMessage(room, {
      text: typeof err == "string" ? err : "Ada Masalah",
    });
  }
}
