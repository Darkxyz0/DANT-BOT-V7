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
        browser: ["Dante-V8", "Chrome", "1.0.0"],
        printQRInTerminal: true
    });

    client.ev.on('creds.update', saveCreds);

    // Sincronização em segundo plano para não travar o bot
    const syncGitHub = () => {
        exec('git add . && git commit -m "Auto-update" && git push origin main --force');
    };

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: VELOCIDADE MÁXIMA ATIVADA!');
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
                client.sendMessage(from, { ...media, caption: topo + texto + rodape, mentions });
            } else {
                client.sendMessage(from, { text: topo + texto + rodape, mentions });
            }
            setTimeout(syncGitHub, 2000); // Sincroniza 2 segundos depois para não atrasar a resposta
        };

        switch(cmd) {
            case 'menu':
                await enviar(`*🏢 QUARTEL GENERAL*\n\n*🌑 AURA*\n┝ .rankaura\n┝ .statusaura\n┝ .todeolho\n\n*🧸 INTERAÇÃO*\n┝ .matar  .chutar\n┝ .beijo  .tapa\n┝ .dançar .comer\n┝ .rosa   .chamego\n\n*📊 STATUS*\n┝ .gado  .lindo  .gay`, './menu.jpg');
                break;

            case 'matar': await enviar(`⚔️ ${msg.pushName} eliminou ${target}!`, fs.existsSync('./matar1.mp4') ? './matar1.mp4' : './matar.mp4', true); break;
            case 'chutar': await enviar(`👟 ${msg.pushName} chutou ${target}!`, './chutar.mp4', true); break;
            case 'beijo': await enviar(`💋 ${msg.pushName} beijou ${target}!`, './beijo.mp4', true); break;
            case 'tapa': await enviar(`💥 ${msg.pushName} deu um tapa em ${target}!`, './tapa.mp4', true); break;
            case 'dançar': await enviar(`💃 ${msg.pushName} e ${target} na pista!`, './dançar.mp4', true); break;
            case 'comer': await enviar(`🍕 ${msg.pushName} está comendo ${args[0] || "algo"}!`, './comer.mp4', true); break;
            case 'rosa': await enviar(`🌹 Uma rosa para ${target}!`, './dante.mp4', true); break;
            case 'chamego': await enviar(`🧸 ${msg.pushName} deu um chamego em ${target}!`, './chamego.mp4', true); break;
            case 'rankaura': await enviar(`🏆 *RANK*\n\nAlvo: ${target}\nNível: ${rdm}.000`, './rankaura.mp4', true); break;
            case 'todeolho': await enviar(`👁️ De olho em ${target}...`, './todeolho.mp4', true); break;
            case 'gado': await enviar(`🐂 ${target} é ${rdm}% gado.`, './gado1.jpg'); break;
            case 'lindo': await enviar(`✨ ${target} é ${rdm}% lindo.`, './lindo1.mp4', true); break;
            case 'gay': await enviar(`🌈 ${target} é ${rdm}% gay.`, './gay.jpg'); break;
        }
    });
}
startDanteV8().catch(err => console.error(err));
