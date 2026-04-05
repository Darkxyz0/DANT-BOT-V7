const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
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
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: INTELIGÊNCIA E MÍDIAS ATIVADAS!');
        if (u.connection === 'close') startDanteV8();
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
        
        // --- LÓGICA DE ALVO E MENÇÃO AUTOMÁTICA ---
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        let targetJid = mention || msg.key.participant || msg.key.remoteJid;
        let targetName = mention ? "@" + mention.split('@')[0] : pushname;
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
                await enviar(`Agente: ${pushname}\n\n*SETOR ESTRATÉGICO*\n┝ .menuaura\n┝ .menuinter\n┝ .menustatus`, './menu.jpg');
                break;

            case 'menuaura':
                await enviar(`*🌑 SETOR AURA*\n┝ .rankaura\n┝ .statusaura\n┝ .todeolho`, './aura.jpg');
                break;

            case 'menuinter':
                await enviar(`*🧸 SETOR INTERAÇÃO*\n┝ .beijo  .tapa\n┝ .chutar .matar\n┝ .dançar .comer\n┝ .rosa   .chamego`, './brincadeira.jpg');
                break;

            case 'rankaura':
                await enviar(`🏆 *RANK DE AURA*\nAlvo: ${targetName}\nNível: ${rdm}.000\nStatus: Analisado.`, './rankaura.mp4', true);
                break;

            case 'tapa':
                await enviar(`💥 ${pushname} aplicou corretivo em ${targetName}!`, './tapa1.mp4', true);
                break;

            case 'beijo':
                await enviar(`💋 ${pushname} beijou ${targetName}.`, './beijo.mp4', true);
                break;

            case 'matar':
                const vidMatar = fs.existsSync('./matar1.mp4') ? (Math.random() > 0.5 ? './matar1.mp4' : './matar2.mp4') : './matar1.mp4';
                await enviar(`⚔️ ${pushname} eliminou ${targetName}!`, vidMatar, true);
                break;

            case 'chutar':
                const vidChute = fs.existsSync('./chutar1.mp4') ? (Math.random() > 0.5 ? './chutar1.mp4' : './chutar2.mp4') : './chutar1.mp4';
                await enviar(`👟 ${targetName} voou longe com o chute de ${pushname}!`, vidChute, true);
                break;

            case 'lindo':
                const vidLindo = rdm < 50 ? './lindo2.mp4' : './lindo1.mp4';
                await enviar(`✨ ${targetName} tem ${rdm}% de beleza detectada.`, vidLindo, true);
                break;

            case 'gado':
                await enviar(`🐂 Analisando... ${targetName} é ${rdm}% gado.`, rdm > 50 ? './gado2.jpg' : './gado1.jpg');
                break;

            case 'gay':
                await enviar(`🌈 ${targetName} é ${rdm}% gay.`, './gay.jpg');
                break;
        }
    });
}
startDanteV8().catch(err => console.error(err));
