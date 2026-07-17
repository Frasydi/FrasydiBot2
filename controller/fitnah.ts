import { proto } from '@whiskeysockets/baileys/WAProto';
import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
import generateString from '../util/generateString';
import { v4 as uuidv4 } from "uuid"
import convertTel from '../util/convertTel';
import getMentions from '../util/getMentions';
import * as fs from 'fs';

export const types = /fitnah/i
export const nama = "Fitnah"
export const kategori = "Fun"
export const bantuan = [
    getOptions()?.prefix + "fitnah [korban] [isi fitnah]"
]
export const isGroup = false
export const isAdmin = false

export default async function Fitnah(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    messageInstance,
    quoted,
    mentions,
    anggota
}: messageType) {
    try {
        if (pesan.length < 2) throw "Kontak dan isi fitnah kosong"
        if (pesan.slice(1).join("").trim().length == 0) throw "Isi fitnah kosong"

        // Resolve victim JID/LID and slander mentions
        let victimLidJid = "";
        let victimPhoneJid = "";
        let slanderMentions: string[] = [];

        let targetIdOrLid = "";
        if (pesan[0].startsWith("@") && mentions && mentions.length > 0) {
            targetIdOrLid = mentions[0];
            slanderMentions = mentions.slice(1);
        } else {
            slanderMentions = mentions || [];
            targetIdOrLid = convertTel(pesan[0]);
        }

        // Try to find in group participants (anggota) to get their LID and Phone JID
        let cleanTarget = targetIdOrLid.split("@")[0].replace(/\D/g, "");
        let found = anggota.find(el => {
            const elId = el.id.split("@")[0].replace(/\D/g, "");
            const elPhone = (el as any).phoneNumber ? (el as any).phoneNumber.split("@")[0].replace(/\D/g, "") : "";
            return elId === cleanTarget || elPhone === cleanTarget;
        });

        if (found) {
            victimLidJid = found.id;
            victimPhoneJid = (found as any).phoneNumber || "";
        } else {
            // If not found in group, check if it matches the room JID (for DMs)
            const roomClean = room.split("@")[0].replace(/\D/g, "");
            if (roomClean === cleanTarget) {
                if (room.endsWith("@lid")) {
                    victimLidJid = room;
                } else {
                    victimPhoneJid = room;
                    victimLidJid = targetIdOrLid;
                }
            } else {
                if (targetIdOrLid.endsWith("@lid")) {
                    victimLidJid = targetIdOrLid;
                } else {
                    victimPhoneJid = targetIdOrLid;
                }
            }
        }

        if (!victimLidJid) {
            victimLidJid = targetIdOrLid;
        }

        let botJid = socket.user?.id || "";
        if (botJid.includes(":")) {
            botJid = botJid.split(":")[0];
        } else if (botJid.includes("@")) {
            botJid = botJid.split("@")[0];
        }
        botJid = botJid.replace(/\D/g, "");

        let botLid = "";
        const userAny = socket.user as any;
        if (userAny?.lid) {
            botLid = userAny.lid.split("@")[0].replace(/\D/g, "");
        }

        if (isGroup) {
            const botParticipant = anggota.find(el => {
                const elId = el.id.split("@")[0].replace(/\D/g, "");
                const elPhone = (el as any).phoneNumber ? (el as any).phoneNumber.split("@")[0].replace(/\D/g, "") : "";
                return elId === botJid || elPhone === botJid || (botLid !== "" && (elId === botLid || elPhone === botLid));
            });
            const isBotAdmin = botParticipant && ["admin", "superadmin"].includes(botParticipant.admin || "");
            if (!isBotAdmin) {
                throw "Fitnah gagal: Bot harus menjadi Admin grup agar bisa menghapus pesan perintah (fitnah harus rahasia)!";
            }
        } else {
            throw "Fitnah gagal: Perintah fitnah hanya bisa digunakan di dalam Grup (di DM bot tidak bisa menghapus pesan Anda)!";
        }

        const cleanVictim = victimLidJid.split("@")[0].replace(/\D/g, "");
        const victimFromMe = (cleanVictim === botJid) || (botLid !== "" && cleanVictim === botLid);

        const slanderText = pesan.slice(1).join(" ")

        // Map slanderMentions to LID JID so that tags inside the quoted text turn blue
        const mappedSlanderMentions = slanderMentions.map(mention => {
            const cleanMention = mention.split("@")[0].replace(/\D/g, "");
            const foundMember = anggota.find(el => {
                const elId = el.id.split("@")[0].replace(/\D/g, "");
                const elPhone = (el as any).phoneNumber ? (el as any).phoneNumber.split("@")[0].replace(/\D/g, "") : "";
                return elId === cleanMention || elPhone === cleanMention;
            });
            if (foundMember) {
                return foundMember.id; // el.id is the LID JID (ends with @lid)
            }
            return mention;
        });

        // Combine victim and slander mentions for the main message mentions array
        const mainMentions = [victimLidJid];
        if (victimPhoneJid) {
            mainMentions.push(victimPhoneJid);
        }
        mainMentions.push(...mappedSlanderMentions);

        await socket.sendMessage(room, {
            text: " ",
            mentions: mainMentions
        },
            {
                quoted: {
                    key: {
                        remoteJid: room,
                        id: uuidv4(),
                        participant: victimLidJid, // MUST be the LID JID
                        fromMe: victimFromMe
                    },
                    messageTimestamp: messageInstance.messageTimestamp,
                    message: {
                        extendedTextMessage: {
                            text: slanderText,

                            contextInfo: {
                                mentionedJid: mappedSlanderMentions,
                            },
                            previewType: proto.Message.ExtendedTextMessage.PreviewType.NONE

                        }
                    }
                },
            })
        try {
            await socket.sendMessage(room, { delete: messageInstance.key })
        } catch (err) {
            console.error("Fitnah delete error:", err);
        }
    } catch (err) {
        console.error("Fitnah crash error:", err);
        throw err;
    }

}