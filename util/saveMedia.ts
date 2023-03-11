import { proto } from "@adiwajshing/baileys/WAProto";
import { downloadMediaMessage } from "@adiwajshing/baileys";
import duplicateName from "./duplicate name";

export default async function saveMedia(message: proto.IWebMessageInfo) {
  try {
    const buffer = await downloadMediaMessage(message, "buffer", {});
    console.log(buffer)
    duplicateName("/", message.pushName as string, buffer as Buffer, message.message?.imageMessage?.mimetype as string || message.message?.videoMessage?.mimetype as string || message.message?.audioMessage?.mimetype as string);
  } catch (err) {
    console.log(err);
  }
}
