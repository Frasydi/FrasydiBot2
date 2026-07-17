import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
import * as fs from 'fs';
import * as path from 'path';

export const types = /run/i;
export const nama = "Run";
export const kategori = "Fun";
export const bantuan = [
    getOptions('options')?.prefix + "run [angka]"
];
export const isGroup = true;
export const isAdmin = false;

export default async function Run(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
    isAdmin,
    messageInstance
}: messageType) {
    if (!isGroup) throw "Perintah ini hanya dapat digunakan di dalam grup!";

    // 1. Membaca data yang sudah ada dari SQLite
    let dbData: { [groupId: string]: any } = getOptions('run').run || {};

    // Auto-migration dari db/run.json jika data SQLite masih kosong dan file json ada
    const dbDir = path.join(process.cwd(), 'db');
    const dbPath = path.join(dbDir, 'run.json');
    if (Object.keys(dbData).length === 0 && fs.existsSync(dbPath)) {
        try {
            const raw = fs.readFileSync(dbPath, 'utf8');
            const jsonData = JSON.parse(raw);
            if (jsonData && typeof jsonData === 'object') {
                dbData = jsonData;
                setOptions(dbData, 'run');
                fs.renameSync(dbPath, path.join(dbDir, 'run.json.bak'));
            }
        } catch (e) {
            console.error("Error migrating run.json to SQLite", e);
        }
    }

    // Normalisasikan data room: dukung format lama ({ JID: score }) dan format baru ({ name, scores: { JID: score } })
    let scores: { [userId: string]: number } = {};
    let customName: string | undefined = undefined;
    
    if (dbData[room]) {
        if ('scores' in dbData[room] && typeof dbData[room].scores === 'object' && dbData[room].scores !== null) {
            scores = dbData[room].scores;
            customName = dbData[room].name;
        } else {
            scores = dbData[room];
        }
    }

    // A. Handle /run setting name [nama]
    if (pesan[0] === 'setting' && pesan[1] === 'name') {
        if (!isAdmin) {
            throw "Hanya admin grup yang dapat mengubah nama leaderboard!";
        }
        const newName = pesan.slice(2).join(" ").trim();
        if (!newName) {
            throw "Masukkan nama leaderboard yang baru!";
        }

        dbData[room] = {
            name: newName,
            scores: scores
        };

        setOptions(dbData, 'run');

        await socket.sendMessage(room, {
            text: `Nama leaderboard berhasil diubah menjadi: *${newName}*`
        }, {
            quoted: messageInstance
        });
        return;
    }

    // B. Handle /run (tanpa argumen) -> Tunjukkan leaderboard
    if (pesan.length === 0) {
        const sortedRunners = Object.entries(scores)
            .map(([jid, score]) => ({ jid, score }))
            .sort((a, b) => b.score - a.score);

        const title = customName ? `*${customName}*` : `*LEADERBOARD RUNNING GRUP*`;
        let text = `${title}\n\n`;
        const mentions: string[] = [];

        if (sortedRunners.length === 0) {
            text += "_Belum ada data running untuk grup ini._";
        } else {
            sortedRunners.forEach((runner, index) => {
                const cleanJid = runner.jid.split(":")[0].split("@")[0];
                let medal = "";
                if (index === 0) medal = "🥇 ";
                else if (index === 1) medal = "🥈 ";
                else if (index === 2) medal = "🥉 ";
                else medal = `${index + 1}. `;

                text += `${medal}@${cleanJid} : *${runner.score} km*\n`;
                mentions.push(runner.jid);
            });
        }

        await socket.sendMessage(room, {
            text: text,
            mentions: mentions
        }, {
            quoted: messageInstance
        });
        return;
    }

    // C. Handle /run [angka] -> Tambah score
    const valueStr = pesan[0];
    // Normalisasi koma menjadi titik untuk mendukung input format Indonesia (misal: 5,5 -> 5.5)
    const normalizedStr = valueStr.replace(/,/g, '.');
    const amount = parseFloat(normalizedStr);
    
    if (isNaN(amount) || amount <= 0) {
        throw "Masukkan angka yang valid dan lebih besar dari 0 atau gunakan format:\n*/run setting name [nama]* untuk mengubah nama leaderboard.";
    }

    const currentScore = scores[pengirim] || 0;
    // Hindari bug floating-point presisi JavaScript
    const newScore = Math.round((currentScore + amount) * 100) / 100;
    scores[pengirim] = newScore;

    dbData[room] = {
        name: customName,
        scores: scores
    };

    // 3. Simpan data ke SQLite
    setOptions(dbData, 'run');

    // 4. Bangun leaderboard terupdate
    const sortedRunners = Object.entries(scores)
        .map(([jid, score]) => ({ jid, score }))
        .sort((a, b) => b.score - a.score);

    // 5. Susun teks dan mentions untuk respon WhatsApp
    const title = customName ? `*${customName}*` : `*LEADERBOARD RUNNING GRUP*`;
    let text = `${title}\n\n`;
    const mentions: string[] = [];

    sortedRunners.forEach((runner, index) => {
        const cleanJid = runner.jid.split(":")[0].split("@")[0];
        let medal = "";
        if (index === 0) medal = "🥇 ";
        else if (index === 1) medal = "🥈 ";
        else if (index === 2) medal = "🥉 ";
        else medal = `${index + 1}. `;

        text += `${medal}@${cleanJid} : *${runner.score} km*\n`;
        mentions.push(runner.jid);
    });

    await socket.sendMessage(room, {
        text: text,
        mentions: mentions
    }, {
        quoted: messageInstance
    });
}
