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

    const DONO = "5519987054682@s.whatsapp.net";
    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: SETOR PERIGO ATUALIZADO COM BOQUETE E TRANSAR!');
        if (u.connection === 'close') startDanteV8();
    });

    client.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushname = msg.pushName || "Agente";
        const isDono = msg.key.participant === DONO || msg.key.remoteJid === DONO;
        const content = msg.message.conversation || msg.message.extendedTextMessage?.text || 
                        msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";

        if (typeof content !== 'string' || !content.startsWith('.')) return;

        const args = content.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        let targetJid = mention || msg.key.participant || msg.key.remoteJid;
        let targetName = mention ? "@" + mention.split('@')[0] : pushname;
        let mentions = [targetJid];

        const rdm = Math.floor(Math.random() * 101);
        const bTop = "┏━━━━━━━━━━━━━━━━━━━━┓\n";
        const bMid = "┃  ⚔️  *DANTE AGENCY V8* ⚔️\n┣━━━━━━━━━━━━━━━━━━━━┛\n";
        const bBot = "\n┗━━━━━━━━━━━━━━━━━━━━┛";

        const enviar = async (texto, path = null, isVid = false) => {
            let caption = bTop + bMid + texto + bBot;
            if (path && fs.existsSync(path)) {
                const buffer = fs.readFileSync(path);
                await client.sendMessage(from, { [isVid ? 'video' : 'image']: buffer, caption, mentions, gifPlayback: isVid });
            } else {
                await client.sendMessage(from, { text: caption + "\n\n(Ficheiro " + path + " não encontrado)", mentions });
            }
        };

        switch(cmd) {
            case 'menuperigo':
                await enviar("🔞 *SETOR: ARQUIVOS CONFIDENCIAIS*\n\n🔥 .safado\n🔥 .transar\n🔥 .boquete\n🔥 .pau\n🔥 .tesao", './perigo.jpg');
                break;

            case 'transar':
                const vTransar = Math.random() > 0.5 ? './transar1.mp4' : './transar2.mp4';
                await enviar("🔞 *Dante:* 'Isso vai ser um massacre... de prazer!'\n" + pushname + " e " + targetName + " foram pro abate!", vTransar, true);
                break;

            case 'boquete':
                await enviar("🔞 *Dante:* 'Abaixa que lá vem bala!'\n" + targetName + " está fazendo um serviço especial para " + pushname + "!", './boquete.mp4', true);
                break;

            case 'safado':
                const vSafado = Math.random() > 0.5 ? './safadeza.mp4' : './safadeza2.mp4';
                await enviar("😏 *Dante:* 'Seu nível de perversão é impressionante.'\n*" + targetName + "* é *" + rdm + "%* safado(a)!", vSafado, true);
                break;
                
            case 'menu':
                await enviar("*STATUS:* " + (isDono ? "👑 DIRETOR" : "👤 AGENTE") + "\n🔹 .menuaura\n🔹 .menubrincadeiras\n🔹 .menuperigo\n🔹 .menustatus", './menu.jpg');
                break;
        }
    });
}
startDanteV8();
