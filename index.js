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
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: AGÊNCIA ONLINE COM TODAS AS FUNÇÕES!');
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
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        if (!body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        
        // --- LÓGICA DE ALVO ---
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        let targetJid = mention || (msg.message.extendedTextMessage?.contextInfo?.quotedMessage ? msg.message.extendedTextMessage.contextInfo.participant : null) || from;
        let targetName = mention ? "@" + mention.split('@')[0] : "Alvo";
        let mentions = [targetJid];

        const rdm = Math.floor(Math.random() * 101);
        const topo = "╔═══════ ✧ ⚔️ ✧ ═══════╗\n";
        const rodape = "\n╚═══════ ✧ 🍕 ✧ ═══════╝\n─── *𝕯𝖆𝖓𝖙𝖊 𝕬𝖌𝖊𝖓𝖈𝖞 V8* ───";

        const enviar = async (texto, path = null, isVid = false) => {
            let caption = topo + texto + rodape;
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
        };

        switch(cmd) {
            case 'menu':
                await enviar(`Olá, *${pushname}*! Bem-vindo à Central.\n\n*📂 SETORES DISPONÍVEIS:*\n┝ .menuaura (Rank/Aura)\n┝ .menuinter (Interação/GIFs)\n┝ .menustatus (Medidores)\n┝ .menudiversao (Jogos/Mix)\n┝ .menuadm (Gestão)\n\n_Escolha um setor para ver os comandos!_`, './menu.jpg');
                break;

            case 'menuaura':
                await enviar(`*🌑 SETOR AURA & RANK*\n┝ .rankaura (Ver nível)\n┝ .statusaura\n┝ .todeolho\n┝ .roubar (Aura)\n┝ .doar (Aura)`, './aura.jpg');
                break;

            case 'menuinter':
                await enviar(`*🧸 SETOR INTERAÇÃO (GIFS)*\n┝ .beijo .tapa .chutar\n┝ .matar .abraçar .cafune\n┝ .dançar .comer .rosa\n┝ .chamego .lutar .lamber`, './brincadeira.jpg');
                break;

            case 'menustatus':
                await enviar(`*📊 SETOR STATUS*\n┝ .gado  .lindo  .gay\n┝ .fiel  .pobre  .rico\n┝ .safado .medo  .sorte`, './status.jpg');
                break;

            // --- COMANDOS DE INTERAÇÃO ---
            case 'tapa': await enviar(`💥 *${pushname}* deu um tapa em *${targetName}*!`, './tapa.mp4', true); break;
            case 'beijo': await enviar(`💋 *${pushname}* mandou um beijo para *${targetName}*.`, './beijo.mp4', true); break;
            case 'matar': await enviar(`⚔️ Alvo *${targetName}* foi eliminado por *${pushname}*!`, './matar.mp4', true); break;
            case 'chutar': await enviar(`👟 *${pushname}* chutou *${targetName}*!`, './chutar.mp4', true); break;
            case 'abraçar': await enviar(`🫂 *${pushname}* deu um abraço em *${targetName}*!`, './abraco.mp4', true); break;

            // --- COMANDOS DE STATUS ---
            case 'lindo': await enviar(`✨ *${targetName}* é ${rdm}% Lindo(a).`, './lindo.mp4', true); break;
            case 'gado': await enviar(`🐂 Análise de gado: *${targetName}* é ${rdm}% Gado.`, './gado.jpg'); break;
            case 'gay': await enviar(`🌈 Medidor de *${targetName}*: ${rdm}% Gay.`, './gay.jpg'); break;
            case 'rankaura': await enviar(`🏆 *RANK DE AURA*\nUsuário: *${targetName}*\nNível: ${rdm}.450`, './rankaura.mp4', true); break;
        }
    });
}
startDanteV8().catch(err => console.error(err));
