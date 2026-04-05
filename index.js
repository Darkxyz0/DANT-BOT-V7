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

    client.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushname = msg.pushName || "Agente";
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const body = messageContent.trim();
        
        if (!body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        // --- 🛡️ LÓGICA DE ALVO CORRIGIDA (ANTI-BUG) ---
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        
        // Prioridade: 1. Menção direta | 2. Mensagem respondida | 3. Ninguém (null)
        let targetJid = mentioned || (msg.message.extendedTextMessage?.contextInfo?.participant) || null;
        
        // Se não houver alvo, o comando não "finge" que mencionou
        let targetName = targetJid ? "@" + targetJid.split('@')[0] : "alguém";
        let mentions = targetJid ? [targetJid] : [];

        const rdm = Math.floor(Math.random() * 101);
        const topo = "╔═══════ ✧ ⚔️ ✧ ═══════╗\n";
        const rodape = "\n╚═══════ ✧ 🍕 ✧ ═══════╝\n─── *𝕯𝖆𝖓𝖙𝖊 𝕬𝖌𝖊𝖓𝖈𝖞 V8* ───";

        const enviar = async (texto, path = null, isVid = false) => {
            let caption = topo + texto + rodape;
            try {
                if (path && fs.existsSync(path)) {
                    const buffer = fs.readFileSync(path);
                    if (isVid) await client.sendMessage(from, { video: buffer, caption, mentions, gifPlayback: true });
                    else await client.sendMessage(from, { image: buffer, caption, mentions });
                } else {
                    await client.sendMessage(from, { text: caption, mentions });
                }
            } catch { await client.sendMessage(from, { text: caption, mentions }); }
        };

        // Exemplo de comando corrigido
        switch(cmd) {
            case 'tapa':
                if (!targetJid) return await client.sendMessage(from, { text: "❌ Marque alguém ou responda a uma mensagem para dar um tapa!" });
                await enviar(`💥 *${pushname}* deu um tapa em *${targetName}*!`, './tapa.mp4', true);
                break;
                
            case 'gado':
                await enviar(`🐂 Análise de *${targetName}*: ${rdm}% Gado.`, './gado.jpg');
                break;

            case 'menu':
                await enviar(`Olá, *${pushname}*! Use os setores:\n.menuaura\n.menuinter\n.menustatus`);
                break;
        }
    });

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('🚀 DANTE-V8: BUG DE MENÇÃO CORRIGIDO!');
        if (u.connection === 'close') startDanteV8();
    });
}
startDanteV8();
