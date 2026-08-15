import { WASocket } from '@whiskeysockets/baileys';
import { messageType } from '../controller_middleware';
import { getOptions, setOptions } from '../util/option';
import convertTel from '../util/convertTel';
import getMentions from '../util/getMentions';

export const types = /run/i;
export const nama = "Run";
export const kategori = "Fun";
export const bantuan = [
    getOptions('options')?.prefix + "run [angka]",
    getOptions('options')?.prefix + "run others @user1 [angka] @user2 [angka]",
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
    messageInstance,
    mentions = [],
    anggota = []
}: messageType) {
    if (!isGroup) throw "Perintah ini hanya dapat digunakan di dalam grup!";

    let dbData: { [groupId: string]: any } = getOptions('run').run || {};

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
    const { yearMonth: currentYearMonth } = getJakartaYearMonth(now);

    if (!lastResetMonth) {
        lastResetMonth = currentYearMonth;
        dbData[room] = {
            name: customName,
            lastResetMonth: currentYearMonth,
            scores: scores
        };
        setOptions(dbData, 'run');
    }

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
                const memberInfo = getMemberJidInfo(runner.jid, anggota);
                let medal = "";
                if (index === 0) medal = "🥇 ";
                else if (index === 1) medal = "🥈 ";
                else if (index === 2) medal = "🥉 ";
                else medal = `${index + 1}. `;

                winnerText += `${medal}@${memberInfo.cleanJid} : *${runner.score} km*\n`;
                memberInfo.sendMentions.forEach(m => {
                    if (!winnerMentions.includes(m)) {
                        winnerMentions.push(m);
                    }
                });
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
            `   *${prefix}run [angka] [angka2] dst*\n` +
            `   _Contoh: ${prefix}run 5 atau ${prefix}run -2.5_\n\n` +
            `3. *Mencatat Jarak Lari Orang Lain*\n` +
            `   Masukkan data lari untuk beberapa anggota sekaligus:\n` +
            `   *${prefix}run others @user1 [angka] @user2 [angka] ...*\n` +
            `   _Contoh: ${prefix}run others @62812345678 20 @62898765432 30_\n\n` +
            `4. *Mengubah Nama Leaderboard (Admin)*\n` +
            `   Ubah nama judul leaderboard grup:\n` +
            `   *${prefix}run setting name [nama]*\n` +
            `   _Contoh: ${prefix}run setting name Pelari Tercepat_\n\n` +
            `5. *Melihat Riwayat Bulanan*\n` +
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
                const memberInfo = getMemberJidInfo(runner.jid, anggota);
                let medal = "";
                if (index === 0) medal = "🥇 ";
                else if (index === 1) medal = "🥈 ";
                else if (index === 2) medal = "🥉 ";
                else medal = `${index + 1}. `;

                text += `${medal}@${memberInfo.cleanJid} : *${runner.score} km*\n`;
                memberInfo.sendMentions.forEach(m => {
                    if (!mentions.includes(m)) {
                        mentions.push(m);
                    }
                });
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

    // E. Handle /run setting name [nama]
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

    // F. Handle /run others @user1 [angka] @user2 [angka] ...
    if (pesan[0] === 'others') {
        const prefix = getOptions('options')?.prefix || "/";
        const args = pesan.slice(1);

        if (args.length < 2) {
            await socket.sendMessage(room, {
                text: `Format tidak valid! Gunakan:\n*${prefix}run others @user1 [angka] @user2 [angka] ...*\n_Contoh: ${prefix}run others @62812345678 20 @62898765432 30_`
            }, {
                quoted: messageInstance
            });
            return;
        }

        let remainingMentions = [...(mentions || [])];
        if (remainingMentions.length === 0) {
            const parsedMentions = getMentions(args.join(" "));
            if (parsedMentions && parsedMentions.length > 0) {
                remainingMentions = parsedMentions;
            }
        }

        const updates: { jid: string; amount: number; userMention: string; sendMentions: string[] }[] = [];
        let i = 0;

        while (i < args.length) {
            const token = args[i];
            let rawJid: string | null = null;

            if (token.startsWith('@')) {
                const userPart = token.slice(1);
                const cleanDigits = userPart.replace(/\D/g, '');
                if (cleanDigits.length >= 10) {
                    rawJid = convertTel(userPart);
                } else if (remainingMentions.length > 0) {
                    rawJid = remainingMentions.shift()!;
                } else {
                    const parsed = getMentions(token);
                    if (parsed && parsed.length > 0) {
                        rawJid = parsed[0];
                    }
                }
            } else {
                const cleanDigits = token.replace(/\D/g, '');
                if (cleanDigits.length >= 10) {
                    rawJid = convertTel(token);
                } else if (remainingMentions.length > 0 && isNaN(parseFloat(token.replace(/,/g, '.')))) {
                    rawJid = remainingMentions.shift()!;
                }
            }

            if (!rawJid) {
                await socket.sendMessage(room, {
                    text: `Format pengguna tidak valid pada '${token}'. Gunakan:\n*${prefix}run others @user1 [angka] @user2 [angka] ...*`
                }, {
                    quoted: messageInstance
                });
                return;
            }

            const targetInfo = getMemberJidInfo(rawJid, anggota);
            const jid = targetInfo.canonicalJid;
            const userMention = `@${targetInfo.cleanJid}`;

            if (i + 1 >= args.length) {
                await socket.sendMessage(room, {
                    text: `Jumlah jarak lari untuk ${userMention} belum dimasukkan!`,
                    mentions: targetInfo.sendMentions
                }, {
                    quoted: messageInstance
                });
                return;
            }

            const amountStr = args[i + 1].replace(/,/g, '.');
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount === 0) {
                await socket.sendMessage(room, {
                    text: `Angka jarak lari untuk ${userMention} tidak valid ('${args[i + 1]}')!`,
                    mentions: targetInfo.sendMentions
                });
                return;
            }

            updates.push({ jid, amount, userMention, sendMentions: targetInfo.sendMentions });
            i += 2;
        }

        if (updates.length === 0) {
            await socket.sendMessage(room, {
                text: `Tidak ada data lari yang dapat diproses! Gunakan:\n*${prefix}run others @user1 [angka] @user2 [angka] ...*`
            }, {
                quoted: messageInstance
            });
            return;
        }

        // Cek apakah ada score < 0
        for (const update of updates) {
            const currentScore = scores[update.jid] || 0;
            const newScore = Math.round((currentScore + update.amount) * 100) / 100;
            if (newScore < 0) {
                await socket.sendMessage(room, {
                    text: `Jarak lari total untuk ${update.userMention} tidak boleh di bawah 0 km! (Jarak saat ini: *${currentScore} km*, pengurangan: *${update.amount} km*)`,
                    mentions: update.sendMentions
                }, {
                    quoted: messageInstance
                });
                return;
            }
        }

        // Hitung peringkat lama sebelum perubahan skor
        const oldRanks = calculateRanks(scores);

        // Terapkan perubahan
        for (const update of updates) {
            const currentScore = scores[update.jid] || 0;
            const newScore = Math.round((currentScore + update.amount) * 100) / 100;
            if (newScore === 0) {
                delete scores[update.jid];
            } else {
                scores[update.jid] = newScore;
            }
        }

        dbData[room] = {
            name: customName,
            lastResetMonth: lastResetMonth,
            scores: scores
        };
        setOptions(dbData, 'run');

        await sendLeaderboard(socket, room, scores, customName, messageInstance, anggota, oldRanks);
        return;
    }

    // G. Handle /run (tanpa argumen) -> Tunjukkan leaderboard
    if (pesan.length === 0) {
        await sendLeaderboard(socket, room, scores, customName, messageInstance, anggota);
        return;
    }

    // H. Handle /run [angka] -> Tambah score
    const valueStr = pesan[0];
    const normalizedStr = valueStr.replace(/,/g, '.');
    const amount = parseFloat(normalizedStr);
    if (!isNaN(amount) || amount === 0) {
        const otherValueStr = pesan.filter(el => el !== valueStr).map(el => {
            const normalized = el.replace(/,/g, '.');
            const convertNumber = parseFloat(normalized);
            return isNaN(convertNumber) ? null : convertNumber;
        }).filter((v): v is number => !!v).reduce((acc, val) => acc + val, 0);
        const totalAmount = amount + otherValueStr;
        if (!isNaN(totalAmount) && totalAmount !== 0) {
            throw "Format tidak valid!"
        }

        const senderInfo = getMemberJidInfo(pengirim, anggota);
        const userJid = senderInfo.canonicalJid;

        // Hitung peringkat lama sebelum perubahan skor
        const oldRanks = calculateRanks(scores);

        const currentScore = scores[userJid] || 0;
        // Hindari bug floating-point presisi JavaScript
        const newScore = Math.round((currentScore + totalAmount) * 100) / 100;
        if (newScore < 0) {
            throw `Jarak lari total tidak boleh di bawah 0 km! Jarak saat ini: *${currentScore} km*, pengurangan yang dimasukkan: *${amount} km*.`;
        }

        if (newScore === 0) {
            delete scores[userJid];
        } else {
            scores[userJid] = newScore;
        }

        dbData[room] = {
            name: customName,
            lastResetMonth: lastResetMonth,
            scores: scores
        };

        // 3. Simpan data ke SQLite
        setOptions(dbData, 'run');

        // 4. Bangun leaderboard terupdate
        await sendLeaderboard(socket, room, scores, customName, messageInstance, anggota, oldRanks);

    }
}

// Helpers
function calculateRanks(scores: { [userId: string]: number }): { [userId: string]: number } {
    const sorted = Object.entries(scores)
        .map(([jid, score]) => ({ jid, score }))
        .sort((a, b) => b.score - a.score);

    const ranks: { [userId: string]: number } = {};
    sorted.forEach((runner, index) => {
        ranks[runner.jid] = index + 1;
    });
    return ranks;
}

function getMemberJidInfo(jid: string, anggota: any[] = []): { canonicalJid: string; cleanJid: string; sendMentions: string[] } {
    if (!jid) return { canonicalJid: "", cleanJid: "", sendMentions: [] };

    const cleanInput = jid.split(":")[0].split("@")[0].replace(/\D/g, "");
    if (!cleanInput) return { canonicalJid: jid, cleanJid: jid, sendMentions: [jid] };

    const found = anggota?.find(el => {
        const elId = el.id ? el.id.split(":")[0].split("@")[0].replace(/\D/g, "") : "";
        const elPhone = (el as any).phoneNumber ? (el as any).phoneNumber.split(":")[0].split("@")[0].replace(/\D/g, "") : "";
        return (elId && elId === cleanInput) || (elPhone && elPhone === cleanInput);
    });

    if (found) {
        const lidJid = found.id;
        const phoneJid = (found as any).phoneNumber;
        const sendMentions: string[] = [];
        if (lidJid) sendMentions.push(lidJid);
        if (phoneJid && phoneJid !== lidJid) sendMentions.push(phoneJid);

        const canonicalJid = lidJid || phoneJid || jid;
        const phoneClean = phoneJid ? phoneJid.split(":")[0].split("@")[0] : "";
        const displayClean = phoneClean || (lidJid ? lidJid.split(":")[0].split("@")[0] : cleanInput);
        return { canonicalJid, cleanJid: displayClean, sendMentions };
    }

    const displayClean = jid.split(":")[0].split("@")[0];
    return { canonicalJid: jid, cleanJid: displayClean, sendMentions: [jid] };
}

function getJakartaYearMonth(date: Date = new Date()): { yearMonth: string; year: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit'
    }).formatToParts(date);

    let year = '';
    let month = '';
    for (const part of parts) {
        if (part.type === 'year') year = part.value;
        if (part.type === 'month') month = part.value;
    }
    return {
        yearMonth: `${year}-${month}`,
        year: parseInt(year, 10)
    };
}

async function sendLeaderboard(
    socket: WASocket,
    room: string,
    scores: { [userId: string]: number },
    customName: string | undefined,
    messageInstance: any,
    anggota: any[] = [],
    oldRanks: { [userId: string]: number } = {}
) {
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
            const currentRank = index + 1;
            const prevRank = oldRanks[runner.jid];
            let rankIcon = " ➡️";

            if (prevRank !== undefined) {
                if (currentRank < prevRank) {
                    rankIcon = " ⬆️";
                } else if (currentRank > prevRank) {
                    rankIcon = " ⬇️";
                } else {
                    rankIcon = " ➡️";
                }
            } else if (Object.keys(oldRanks).length > 0) {
                rankIcon = " ⬆️";
            }

            const memberInfo = getMemberJidInfo(runner.jid, anggota);
            let medal = "";
            if (index === 0) medal = "🥇 ";
            else if (index === 1) medal = "🥈 ";
            else if (index === 2) medal = "🥉 ";
            else medal = `${index + 1}. `;

            text += `${medal}@${memberInfo.cleanJid} : *${runner.score} km*${rankIcon}\n`;
            memberInfo.sendMentions.forEach(m => {
                if (!mentions.includes(m)) {
                    mentions.push(m);
                }
            });
        });
    }

    await socket.sendMessage(room, {
        text: text,
        mentions: mentions
    }, {
        quoted: messageInstance
    });
}

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
    const currentYear = getJakartaYearMonth(now).year;
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
