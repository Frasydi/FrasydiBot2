import { proto } from "@adiwajshing/baileys/WAProto";
import { execSync } from "child_process";
import { WASocket } from "@adiwajshing/baileys";
import { messageType } from "../controller_middleware";
import { getOptions } from "../util/option";
import SpotifyWebApi from "spotify-web-api-node";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import removeDir from "../util/rmdir";
import convertMsToTime from "../util/convertMsToTime";
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

      const list: proto.Message.ListMessage.ISection[] = [
        {
          title: "Aksi",
          rows: [],
        },
        {
          title: "Daftar",
          rows: [],
        },
      ];
      search.body.tracks?.items.forEach((el, ind) => {
        list[1].rows?.push({
          rowId: getOptions()?.prefix +"spotify download " + src + "|" + (offset + (ind + 1)),
          title: `${el.name}`,
          description : `Album : ${el.album.name}, Artis : ${el.artists[0].name}`
        });
      });

      if (offset > 0) {
        list?.[0]?.rows?.push({
          rowId:  getOptions()?.prefix +"spotify search " + src + "|" + (offset - 5),
          title: "Prev",
        });
      }
      list?.[0]?.rows?.push({
        rowId:  getOptions()?.prefix +"spotify search " + src + "|" + (offset + 5),
        title: "Next",
      });
      console.log(JSON.stringify(list, null, 2));
      console.log(search.body.tracks?.items[0].album.images[0].url)
      return await socket.sendMessage(room, {
        text: "Daftar Lagu dari hasil pencarian *" + src+"* halaman ke "+(Math.floor(offset/5)+1),
        footer: "Frasydi Bot",
        title: "Daftar",
        buttonText: "List",
        sections: list,
      });
    }
    await socket.sendPresenceUpdate("recording", room);
    let src = pesan.slice(1).join(" ");

    let ind = 0;
    if (!src.includes("|")) throw "Harus include index";
    const temp = src.split("|");
    if (temp.length < 2) throw "Tampaknya ada masalah";
    src = temp.at(0) as string;
    if (!/[0-9]+/i.test(temp.at(1) as string))
      throw "Untuk index harus menggunakan angka";
    ind = parseInt(temp.at(1) as string) - 1;
    if (ind < 0) throw "Index tidak boleh kurang atau sama dengan 0";
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
    await socket.sendMessage(room, {
      image : {url : selectedSong?.album.images[0].url as string},
      caption : `Judul : ${selectedSong?.name}\nAlbum : ${selectedSong?.album.name}\nArtis : ${selectedSong?.artists[0].name}\nLength : ${convertMsToTime(selectedSong?.duration_ms as number)}`,
      
    }, {quoted : messageInstance})
    await socket.sendMessage(
      room,
      {
        audio: { url: `media/temp/${dirName}/${selectedSong?.name}.mp3` },
        mimetype: "audio/mp4",
        footer : "Frasydi Bot",
        
      }, 
      {quoted : messageInstance}
    );
    removeDir(`media/temp/${dirName}/`);
  } catch (err) {
    console.log(err);
    await socket.sendMessage(room, {
      text: typeof err == "string" ? err : "Ada Masalah",
    });
  }
}
