const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
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

    const syncGitHub = () => {
        exec('git add . && git commit -m "Auto-sync Dante-V8" && git push origin main --force', (err) => {
            if (!err) console.log('✅ Sincronizado com GitHub/Railway!');
        });
    };

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: AUTO-SYNC ATIVADO!');
        if (u.connection === 'close') startDanteV8();
    });

    client.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const type = Object.keys(msg.message)[0];
        const body = (type === 'conversation') ? msg.message.conversation : 
                     (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : 
                     (type === 'imageMessage') ? msg.message.imageMessage.caption : 
                     (type === 'videoMessage') ? msg.message.videoMessage.caption : '';

        if (!body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        const target = mention ? "@" + mention.split('@')[0] : (args[0] || "alguém");
        const mentions = mention ? [mention] : [];
        const rdm = Math.floor(Math.random() * 101);
        
        const topo = "╔═══════ ✧ ⚔️ ✧ ═══════╗\n";
        const rodape = "\n╚═══════ ✧ 🍕 ✧ ═══════╝\n─── *𝕯𝖆𝖓𝖙𝖊 𝕬𝖌𝖊𝖓𝖈𝖞 V8* ───";

        const enviar = async (texto, path = null, isVid = false) => {
            if (path && fs.existsSync(path)) {
                const media = isVid ? { video: fs.readFileSync(path), gifPlayback: true } : { image: fs.readFileSync(path) };
                await client.sendMessage(from, { ...media, caption: topo + texto + rodape, mentions });
            } else {
                await client.sendMessage(from, { text: topo + texto + rodape, mentions });
            }
            syncGitHub(); // Atualiza o site automaticamente após cada comando
        };

        switch(cmd) {
            case 'menu': await enviar("\n   *🏢 QUARTEL GENERAL*\n\n┝ .menuadm\n┝ .menuaura\n┝ .menubrincadeiras", './menu.jpg'); break;
            case 'menuaura': await enviar("*🌑 SETOR DE AURA*\n\n┝ .farmaraura\n┝ .rankaura\n┝ .statusaura\n┝ .todeolho", './aura.jpg'); break;
            case 'menubrincadeiras': await enviar("*🧸 SETOR DE INTERAÇÃO*\n\n┝ .beijo\n┝ .tapa\n┝ .chutar\n┝ .matar\n┝ .dançar\n┝ .comer\n┝ .rosa\n┝ .gado\n┝ .gay\n┝ .lindo", './brincadeira.jpg'); break;
            case 'beijo': await enviar(`💋 ${msg.pushName} beijou ${target}.`, './beijo.mp4', true); break;
            case 'tapa': await enviar(`💥 ${msg.pushName} deu um tapa em ${target}!`, './tapa.mp4', true); break;
            case 'rosa': await enviar(`🌹 ${msg.pushName} deu uma rosa para ${target}.`, './dante.mp4', true); break;
            case 'rankaura': await enviar(`🏆 *RANK DE AURA*\n\nUsuário: ${target}\nNível: ${rdm}.000`, './rankaura.mp4', true); break;
            case 'todeolho': await enviar(`👁️ ${msg.pushName} vigia ${target}!`, './todeolho.mp4', true); break;
            case 'gado': await enviar(`🐂 ${target} é ${rdm}% GADO!`, rdm > 50 ? './gado2.jpg' : './gado1.jpg'); break;
            case 'lindo': await enviar(`✨ ${target} é ${rdm}% Lindo(a)!`, rdm > 50 ? './lindo1.mp4' : './lindo2.mp4', true); break;
        }
    });
}
startDanteV8().catch(err => console.error(err));
