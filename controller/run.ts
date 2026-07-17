import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';

export const types = /run/i;
export const nama = "Run";
export const kategori = "Fun";
export const bantuan = [
    getOptions('options')?.prefix + "run [angka]",
    getOptions('options')?.prefix + "run history [bulan]",
    getOptions('options')?.prefix + "run help"
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

    // Normalisasikan data room: dukung format lama ({ JID: score }) dan format baru ({ name, lastResetMonth, scores: { JID: score } })
    let scores: { [userId: string]: number } = {};
    let customName: string | undefined = undefined;
    let lastResetMonth: string | undefined = undefined;
    
    if (dbData[room]) {
        if ('scores' in dbData[room] && typeof dbData[room].scores === 'object' && dbData[room].scores !== null) {
            scores = dbData[room].scores;
            customName = dbData[room].name;
            lastResetMonth = dbData[room].lastResetMonth;
        } else {
            scores = dbData[room];
        }
    }

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // A. Inisialisasi lastResetMonth jika belum ada (tanpa reset)
    if (!lastResetMonth) {
        lastResetMonth = currentYearMonth;
        dbData[room] = {
            name: customName,
            lastResetMonth: currentYearMonth,
            scores: scores
        };
        setOptions(dbData, 'run');
    }

    // B. Deteksi Awal Bulan Baru -> Reset & Arsipkan
    if (lastResetMonth !== currentYearMonth) {
        // 1. Dapatkan top 5 runners
        const sortedRunners = Object.entries(scores)
            .map(([jid, score]) => ({ jid, score }))
            .sort((a, b) => b.score - a.score);
        const top5 = sortedRunners.slice(0, 5);

        // 2. Simpan ke database run_history
        let historyData = getOptions('run_history').run_history || {};
        const historyKey = `${room}_${lastResetMonth}`;
        historyData[historyKey] = {
            name: customName,
            month: lastResetMonth,
            winners: top5
        };
        setOptions(historyData, 'run_history');

        // 3. Susun pesan pengumuman pemenang bulan sebelumnya
        const prevMonthName = getMonthName(lastResetMonth);
        let winnerText = `*PENGUMUMAN JUARA RUNNING BULAN ${prevMonthName.toUpperCase()}*\n\n`;
        const winnerMentions: string[] = [];

        if (top5.length === 0) {
            winnerText += "_Tidak ada data running pada bulan lalu._";
        } else {
            top5.forEach((runner, index) => {
                const cleanJid = runner.jid.split(":")[0].split("@")[0];
                let medal = "";
                if (index === 0) medal = "🥇 ";
                else if (index === 1) medal = "🥈 ";
                else if (index === 2) medal = "🥉 ";
                else medal = `${index + 1}. `;

                winnerText += `${medal}@${cleanJid} : *${runner.score} km*\n`;
                winnerMentions.push(runner.jid);
            });
        }

        // Kirim pengumuman juara terlebih dahulu
        await socket.sendMessage(room, {
            text: winnerText,
            mentions: winnerMentions
        });

        // 4. Reset skor dan perbarui lastResetMonth untuk bulan baru
        scores = {};
        lastResetMonth = currentYearMonth;

        dbData[room] = {
            name: customName,
            lastResetMonth: currentYearMonth,
            scores: scores
        };
        setOptions(dbData, 'run');
    }

    // C. Handle /run help
    if (pesan[0] === 'help') {
        const prefix = getOptions('options')?.prefix || "/";
        const helpText = `*PANDUAN PENGGUNAAN /RUN*\n\n` +
            `Format perintah lari yang didukung:\n\n` +
            `1. *Melihat Leaderboard Bulan Ini*\n` +
            `   Gunakan perintah tanpa parameter:\n` +
            `   *${prefix}run*\n\n` +
            `2. *Mencatat Jarak Lari (km)*\n` +
            `   Masukkan angka jarak lari (gunakan tanda minus untuk mengurangi):\n` +
            `   *${prefix}run [angka]*\n` +
            `   _Contoh: ${prefix}run 5 atau ${prefix}run -2.5_\n\n` +
            `3. *Mengubah Nama Leaderboard (Admin)*\n` +
            `   Ubah nama judul leaderboard grup:\n` +
            `   *${prefix}run setting name [nama]*\n` +
            `   _Contoh: ${prefix}run setting name Pelari Tercepat_\n\n` +
            `4. *Melihat Riwayat Bulanan*\n` +
            `   Lihat daftar arsip bulan:\n` +
            `   *${prefix}run history*\n` +
            `   Lihat leaderboard bulan tertentu:\n` +
            `   *${prefix}run history [bulan/nama bulan]*\n` +
            `   _Contoh: ${prefix}run history juli atau ${prefix}run history 07_`;

        await socket.sendMessage(room, {
            text: helpText
        }, {
            quoted: messageInstance
        });
        return;
    }

    // D. Handle /run history [bulan]
    if (pesan[0] === 'history') {
        const historyData = getOptions('run_history').run_history || {};
        
        // Jika tidak ada argumen bulan -> Tampilkan daftar bulan yang tersedia
        if (pesan.length === 1) {
            const roomHistoryKeys = Object.keys(historyData)
                .filter(k => k.startsWith(`${room}_`))
                .sort((a, b) => b.localeCompare(a)); // urutkan terbaru di atas

            if (roomHistoryKeys.length === 0) {
                await socket.sendMessage(room, {
                    text: "_Belum ada data riwayat running untuk grup ini._"
                }, {
                    quoted: messageInstance
                });
                return;
            }

            let listText = `*DAFTAR RIWAYAT RUNNING GRUP*\n\n`;
            roomHistoryKeys.forEach(k => {
                const monthKey = k.replace(`${room}_`, "");
                listText += `- ${getMonthName(monthKey)} (${monthKey})\n`;
            });
            listText += `\nUntuk melihat detail, gunakan: */run history [bulan]*\nContoh: */run history ${roomHistoryKeys[0].replace(`${room}_`, "")}*`;

            await socket.sendMessage(room, {
                text: listText
            }, {
                quoted: messageInstance
            });
            return;
        }

        // Jika ada argumen bulan -> Tampilkan pemenang bulan tersebut
        const monthQuery = pesan.slice(1).join(" ");
        const targetMonth = parseMonthInput(monthQuery);
        if (!targetMonth) {
            throw "Format bulan tidak dikenal! Gunakan angka (1-12) atau nama bulan (Indo/English).";
        }

        const historyKey = `${room}_${targetMonth}`;
        const record = historyData[historyKey];

        if (!record) {
            throw `Tidak ditemukan data riwayat lari untuk bulan *${getMonthName(targetMonth)}*.`;
        }

        const title = record.name ? `*RIWAYAT RUNNING: ${record.name.toUpperCase()} (${getMonthName(targetMonth).toUpperCase()})*` : `*RIWAYAT RUNNING GRUP: ${getMonthName(targetMonth).toUpperCase()}*`;
        let text = `${title}\n\n`;
        const mentions: string[] = [];

        const winners = record.winners || [];
        if (winners.length === 0) {
            text += "_Tidak ada data running pada bulan ini._";
        } else {
            winners.forEach((runner: any, index: number) => {
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

    // D. Handle /run setting name [nama]
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
            lastResetMonth: lastResetMonth,
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

    // E. Handle /run (tanpa argumen) -> Tunjukkan leaderboard
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

    // F. Handle /run [angka] -> Tambah score
    const valueStr = pesan[0];
    // Normalisasi koma menjadi titik untuk mendukung input format Indonesia (misal: 5,5 -> 5.5)
    const normalizedStr = valueStr.replace(/,/g, '.');
    const amount = parseFloat(normalizedStr);
    
    if (isNaN(amount) || amount === 0) {
        throw "Masukkan angka yang valid (positif/negatif) atau gunakan format:\n- */run setting name [nama]* untuk mengubah nama leaderboard\n- */run history [bulan]* untuk melihat riwayat leaderboard.";
    }

    const currentScore = scores[pengirim] || 0;
    // Hindari bug floating-point presisi JavaScript
    const newScore = Math.round((currentScore + amount) * 100) / 100;
    if (newScore < 0) {
        throw `Jarak lari total tidak boleh di bawah 0 km! Jarak saat ini: *${currentScore} km*, pengurangan yang dimasukkan: *${amount} km*.`;
    }
    
    if (newScore === 0) {
        delete scores[pengirim];
    } else {
        scores[pengirim] = newScore;
    }

    dbData[room] = {
        name: customName,
        lastResetMonth: lastResetMonth,
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

// Helpers
function getMonthName(yearMonthStr: string): string {
    const [year, month] = yearMonthStr.split("-");
    const monthNamesIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNamesIndo[monthIndex]} ${year}`;
}

function parseMonthInput(input: string): string | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const cleanInput = input.trim().toLowerCase().replace(/\s+/g, ' ');

    // Match "YYYY-MM"
    if (/^\d{4}-\d{2}$/.test(cleanInput)) {
        return cleanInput;
    }

    // Match "MM-YYYY" or "M-YYYY"
    const mmYyyyMatch = cleanInput.match(/^(\d{1,2})[-/](\d{4})$/);
    if (mmYyyyMatch) {
        const m = parseInt(mmYyyyMatch[1], 10);
        const y = mmYyyyMatch[2];
        if (m >= 1 && m <= 12) {
            return `${y}-${String(m).padStart(2, '0')}`;
        }
    }

    // Match month name + year (e.g. "juli 2025" or "2025 juli")
    const words = cleanInput.split(' ');
    let year = currentYear;
    let monthName = "";

    for (const word of words) {
        if (/^\d{4}$/.test(word)) {
            year = parseInt(word, 10);
        } else {
            monthName = word;
        }
    }

    if (!monthName && words.length === 1) {
        monthName = words[0];
    }

    // Check if monthName is a number
    const monthNum = parseInt(monthName, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return `${year}-${String(monthNum).padStart(2, '0')}`;
    }

    const monthMap: { [key: string]: number } = {
        january: 1, januari: 1, jan: 1,
        february: 2, februari: 2, feb: 2,
        march: 3, maret: 3, mar: 3,
        april: 4, apr: 4,
        may: 5, mei: 5,
        june: 6, juni: 6, jun: 6,
        july: 7, juli: 7, jul: 7,
        august: 8, agustus: 8, agu: 8, aug: 8, ags: 8,
        september: 9, sep: 9, sept: 9,
        october: 10, oktober: 10, okt: 10, oct: 10,
        november: 11, nov: 11,
        december: 12, desember: 12, des: 12, dec: 12
    };

    if (monthMap[monthName] !== undefined) {
        return `${year}-${String(monthMap[monthName]).padStart(2, '0')}`;
    }

    return null;
}
