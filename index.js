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
        exec('git add . && git commit -m "Correção de Comandos e GIFs" && git push origin main --force', (err) => {
            if (!err) console.log('✅ Agência Sincronizada!');
        });
    };

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: TODOS OS COMANDOS E GIFS ATIVOS!');
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
            syncGitHub();
        };

        switch(cmd) {
            case 'menu':
                const menuTxt = `*🏢 QUARTEL GENERAL*\n\nOlá, ${msg.pushName}.\n\n*🌑 AURA*\n┝ .rankaura\n┝ .statusaura\n┝ .todeolho\n\n*🧸 INTERAÇÃO*\n┝ .matar\n┝ .chutar\n┝ .beijo\n┝ .tapa\n┝ .dançar\n┝ .comer\n┝ .rosa\n\n*📊 STATUS*\n┝ .gado\n┝ .lindo\n┝ .gay`;
                await enviar(menuTxt, './menu.jpg');
                break;

            // --- CORREÇÃO DOS COMANDOS DE INTERAÇÃO COM GIF ---
            case 'matar':
                const vidMatar = fs.existsSync('./matar1.mp4') ? (Math.random() > 0.5 ? './matar1.mp4' : './matar2.mp4') : './matar.mp4';
                await enviar(`⚔️ ${msg.pushName} eliminou ${target}. Alvo riscado da lista.`, vidMatar, true);
                break;
            case 'chutar':
                const vidChutar = fs.existsSync('./chutar1.mp4') ? (Math.random() > 0.5 ? './chutar1.mp4' : './chutar2.mp4') : './chutar.mp4';
                await enviar(`👟 ${msg.pushName} deu um chute em ${target}!`, vidChutar, true);
                break;
            case 'comer':
                await enviar(`🍕 ${msg.pushName} está a devorar ${args[0] || "tudo"}!`, './comer.mp4', true);
                break;
            case 'dançar':
                await enviar(`💃 ${msg.pushName} e ${target} estão a dominar a pista!`, './dançar.mp4', true);
                break;
            case 'beijo': 
                await enviar(`💋 ${msg.pushName} beijou ${target}. Dante está de olho.`, './beijo.mp4', true); 
                break;
            case 'tapa': 
                await enviar(`💥 ${msg.pushName} meteu a mão em ${target}!`, './tapa.mp4', true); 
                break;
            case 'rosa': 
                await enviar(`🌹 ${msg.pushName} deu uma rosa para ${target}.`, './dante.mp4', true); 
                break;
            case 'rankaura': 
                await enviar(`🏆 *RANK DE AURA*\n\nUsuário: ${target}\nNível: ${rdm}.000`, './rankaura.mp4', true); 
                break;
            case 'todeolho': 
                await enviar(`👁️ ${msg.pushName} está a vigiar ${target}!`, './todeolho.mp4', true); 
                break;
            case 'gado': 
                await enviar(`🐂 ${target} é ${rdm}% GADO!`, rdm > 50 ? './gado2.jpg' : './gado1.jpg'); 
                break;
            case 'lindo': 
                await enviar(`✨ ${target} é ${rdm}% Lindo(a)!`, rdm > 50 ? './lindo1.mp4' : './lindo2.mp4', true); 
                break;
            case 'gay': 
                await enviar(`🌈 ${target} é ${rdm}% Gay.`, './gay.jpg'); 
                break;
        }
    });
}
startDanteV8().catch(err => console.error(err));
