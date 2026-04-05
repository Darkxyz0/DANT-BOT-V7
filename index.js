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

    // --- BOAS-VINDAS ---
    client.ev.on('group-participants.update', async (anu) => {
        if (anu.action === 'add') {
            const from = anu.id;
            const topo = "╔═══════ ✧ ⚔️ ✧ ═══════╗\n";
            const rodape = "\n╚═══════ ✧ 🍕 ✧ ═══════╝\n─── *𝕯𝖆𝖓𝖙𝖊 𝕬𝖌𝖊𝖓𝖈𝖞 V8* ───";
            const boasVindas = "Novo recruta na área. @${anu.participants[0].split('@')[0]}, espero que agüente o tranco.";
            if (fs.existsSync('./boasvindas.mp4')) {
                await client.sendMessage(from, { video: fs.readFileSync('./boasvindas.mp4'), caption: topo + boasVindas + rodape, mentions: [anu.participants[0]], gifPlayback: true });
            }
        }
    });

    client.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('\n\x1b[32m%s\x1b[0m', '🚀 DANTE-V8: RANK E AURA CORRIGIDOS!');
        if (u.connection === 'close') startDanteV8();
    });

    client.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        if (!body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        
        const mention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
        const target = mention ? "@" + mention.split('@')[0] : (args[0] || msg.pushName || "alguém");
        const mentions = mention ? [mention] : [];
        const rdm = Math.floor(Math.random() * 101);
        
        const topo = "╔═══════ ✧ ⚔️ ✧ ═══════╗\n";
        const rodape = "\n╚═══════ ✧ 🍕 ✧ ═══════╝\n─── *𝕯𝖆𝖓𝖙𝖊 𝕬𝖌𝖊𝖓𝖈𝖞 V8* ───";

        const enviar = async (texto, path = null, isVideo = false) => {
            if (path && fs.existsSync(path)) {
                const media = isVideo ? { video: fs.readFileSync(path), gifPlayback: true } : { image: fs.readFileSync(path) };
                await client.sendMessage(from, { ...media, caption: topo + texto + rodape, mentions });
            } else {
                await client.sendMessage(from, { text: topo + texto + rodape, mentions });
            }
        };

        switch(cmd) {
            case 'menu':
                await enviar("\n   *🏢 QUARTEL GENERAL*\n\n┝ 🛡️ .menuadm\n┝ 🎮 .menuaura\n┝ 🧸 .menubrincadeiras", './menu.jpg');
                break;
            case 'menuaura':
                await enviar("*🌑 SETOR DE AURA*\n\n┝ .farmaraura\n┝ .rankaura\n┝ .statusaura\n┝ .todeolho", './aura.jpg');
                break;
            case 'menubrincadeiras':
                await enviar("*🧸 SETOR DE BRINCADEIRAS*\n\n┝ .beijo\n┝ .tapa\n┝ .chutar\n┝ .matar\n┝ .dançar\n┝ .comer\n┝ .rosa\n┝ .gado\n┝ .gay\n┝ .lindo", './brincadeira.jpg');
                break;

            // --- COMANDOS DE AURA ---
            case 'rankaura':
                const patentes = ["Poeira Estelar", "Recruta de Aura", "Soldado de Elite", "Comandante Sombrio", "Mestre da Aura", "Lenda da Agência", "Divindade Dante"];
                const patente = patentes[Math.floor(Math.random() * patentes.length)];
                await enviar(`🏆 *RANK DE AURA*\n\nUsuário: ${target}\nPatente: ${patente}\nNível de Poder: ${rdm}.000\n\nDante diz: Continue treinando ou será descartado.`, './rankaura.mp4', true);
                break;

            case 'statusaura':
                await enviar(`📊 ${target}, sua aura foi medida: ${rdm}%. Dante classifica como: ${rdm > 80 ? "Pura e Esmagadora" : "Fraca e Irrelevante"}.`);
                break;

            case 'todeolho':
                await enviar(`👁️ ${msg.pushName} está vigiando ${target}. Nada escapa aos olhos da Agência.`, './todeolho.mp4', true); break;

            // --- BRINCADEIRAS ---
            case 'beijo': await enviar(`💋 ${msg.pushName} beijou ${target}. Dante viu e aprovou.`, './beijo.mp4', true); break;
            case 'tapa': await enviar(`💥 ${msg.pushName} deu um tapa em ${target}. Dante gosta de agressividade.`, './tapa.mp4', true); break;
            case 'rosa': await enviar(`🌹 ${msg.pushName} deu uma rosa para ${target}.`, './dante.mp4', true); break;
            case 'dançar': await enviar(`💃 ${msg.pushName} e ${target} estão dançando!`, './dançar.mp4', true); break;
            case 'comer': await enviar(`🍕 ${msg.pushName} está devorando ${args[0] || "tudo"}!`, './comer.mp4', true); break;
            case 'matar':
                await enviar(`⚔️ ${msg.pushName} eliminou ${target}. Dante já riscou o nome da lista.`, Math.random() > 0.5 ? './matar1.mp4' : './matar2.mp4', true); break;
            case 'chutar':
                await enviar(`👟 ${msg.pushName} chutou ${target}!`, Math.random() > 0.5 ? './chutar1.mp4' : './chutar2.mp4', true); break;

            // --- STATUS ---
            case 'gado': await enviar(`🐂 ${target} é ${rdm}% GADO.`, rdm > 50 ? './gado2.jpg' : './gado1.jpg'); break;
            case 'lindo': await enviar(`✨ ${target} é ${rdm}% Lindo(a).`, rdm > 50 ? './lindo1.mp4' : './lindo2.mp4', true); break;
            case 'gay': await enviar(`🌈 ${target} é ${rdm}% Gay.`, './gay.jpg'); break;
        }
    });
}
startDanteV8().catch(err => console.error(err));
