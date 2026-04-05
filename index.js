const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startDanteV8() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    const client = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        browser: ["Dante-V8", "Chrome", "1.0.0"]
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: AGÊNCIA ONLINE E BLINDADA!');
        if (u.connection === 'close') {
            const shouldReconnect = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startDanteV8();
        }
    });

    client.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushname = msg.pushName || "Agente";
        
        // CORREÇÃO DO ERRO 'startsWith': Garantindo que body nunca seja null
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";
        const body = messageContent.trim();
        
        if (!body || !body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (msg.message.extendedTextMessage?.contextInfo?.quotedMessage ? msg.message.extendedTextMessage.contextInfo.participant : null);
        let targetJid = mention || from;
        let targetName = mention ? "@" + mention.split('@')[0] : "Alvo";
        let mentions = [targetJid];

        const rdm = Math.floor(Math.random() * 101);
        const topo = "╔═══════ ✧ ⚔️ ✧ ═══════╗\n";
        const rodape = "\n╚═══════ ✧ 🍕 ✧ ═══════╝\n─── *𝕯𝖆𝖓𝖙𝖊 𝕬𝖌𝖊𝖓𝖈𝖞 V8* ───";

        const enviar = async (texto, path = null, isVid = false) => {
            let caption = topo + texto + rodape;
            // Tenta enviar com mídia, se falhar ou não existir, envia só texto
            try {
                if (path && fs.existsSync(path)) {
                    const buffer = fs.readFileSync(path);
                    if (isVid) {
                        await client.sendMessage(from, { video: buffer, caption, mentions, gifPlayback: true });
                    } else {
                        await client.sendMessage(from, { image: buffer, caption, mentions });
                    }
                } else {
                    await client.sendMessage(from, { text: caption, mentions });
                }
            } catch {
                await client.sendMessage(from, { text: caption, mentions });
            }
        };

        switch(cmd) {
            case 'menu':
                await enviar(`Olá, *${pushname}*!\n\n*📂 SETORES DA AGÊNCIA:*\n┝ .menuaura (Rank/Aura)\n┝ .menuinter (Interação)\n┝ .menustatus (Medidores)\n\n_Dante-V8: Inteligência e Estilo._`, './menu.jpg');
                break;

            case 'menuaura':
                await enviar(`*🌑 SETOR AURA*\n┝ .rankaura\n┝ .statusaura\n┝ .roubaraura`, './aura.jpg');
                break;

            case 'menuinter':
                await enviar(`*🧸 SETOR INTERAÇÃO*\n┝ .beijo .tapa .chutar .matar\n┝ .abraçar .cafune .dançar .rosa`, './brincadeira.jpg');
                break;

            case 'menustatus':
                await enviar(`*📊 SETOR STATUS*\n┝ .gado .lindo .gay .fiel .safado`, './status.jpg');
                break;

            // --- COMANDOS DE INTERAÇÃO (GIFS) ---
            case 'tapa': await enviar(`💥 *${pushname}* deu um tapa em *${targetName}*!`, './tapa.mp4', true); break;
            case 'beijo': await enviar(`💋 *${pushname}* beijou *${targetName}*!`, './beijo.mp4', true); break;
            case 'matar': await enviar(`⚔️ *${targetName}* foi eliminado por *${pushname}*!`, './matar.mp4', true); break;
            case 'chutar': await enviar(`👟 *${pushname}* chutou *${targetName}*!`, './chutar.mp4', true); break;

            // --- COMANDOS DE STATUS ---
            case 'lindo': await enviar(`✨ *${targetName}* é ${rdm}% Lindo(a).`, './lindo.mp4', true); break;
            case 'gado': await enviar(`🐂 *${targetName}* foi analisado: ${rdm}% Gado.`, './gado.jpg'); break;
            case 'gay': await enviar(`🌈 Medidor de *${targetName}*: ${rdm}% Gay.`, './gay.jpg'); break;
            case 'rankaura': await enviar(`🏆 *RANK DE AURA*\nUsuário: *${targetName}*\nNível: ${rdm}.880`, './rankaura.mp4', true); break;
        }
    });
}
startDanteV8().catch(err => console.log(err));
