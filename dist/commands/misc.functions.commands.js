import { funnyRandomPhrases } from '../utils/misc.util.js';
import * as waUtil from '../utils/whatsapp.util.js';
import { buildText, messageErrorCommandUsage, uppercaseFirst } from "../utils/general.util.js";
import botTexts from "../helpers/bot.texts.helper.js";
import miscCommands from "./misc.list.commands.js";
import { GroupController } from "../controllers/group.controller.js";
import path from 'path';
import axios from 'axios';
import * as fs from 'fs';

// Caminho para o arquivo de banco de dados
const lastfmDbPath = path.resolve('database/lastfm.json');

// Função para ler o banco de dados
const readLastfmDatabase = () => {
    if (fs.existsSync(lastfmDbPath)) {
        return JSON.parse(fs.readFileSync(lastfmDbPath, 'utf-8'));
    }
    return {};
};

// Função para salvar o banco de dados
const saveLastfmDatabase = (data) => {
    fs.writeFileSync(lastfmDbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// Função para registrar o usuário no Last.fm
export async function registrarCommand(client, botInfo, message, group) {
    console.log("Mensagem completa recebida:", message);  // Log completo para verificar a estrutura de 'message'

    const username = message.text_command.trim();  // Nome de usuário do Last.fm que o usuário inseriu

    if (!username) {
        throw new Error(miscCommands.registrar.msgs.error);
    }

    // O número de telefone do usuário (não o ID do sender)
    const senderPhone = message.sender;  // O número do usuário estará diretamente em message.sender

    console.log(`Registrando o usuário com número: ${senderPhone}`);  // Log para verificar o número de telefone

    if (!senderPhone) {
        await waUtil.replyText(client, message.chat_id, "Não foi possível identificar o seu número. Tente novamente mais tarde.", message.wa_message, { expiration: message.expiration });
        return;
    }

    // Lê os dados atuais do banco de dados
    const data = readLastfmDatabase();

    // Verifica se já existe um registro para este usuário
    if (data[senderPhone]) {
        await waUtil.replyText(client, message.chat_id, `Você já está registrado como ${data[senderPhone]}.`, message.wa_message, { expiration: message.expiration });
        return;
    }

    // Registra o nome de usuário no banco de dados com o número de telefone único do usuário
    data[senderPhone] = username;

    // Salva os dados no banco de dados
    saveLastfmDatabase(data);

    // Resposta confirmando o registro
    const replyText = buildText(miscCommands.registrar.msgs.reply);
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, { expiration: message.expiration });
}


// Função para mostrar a música que o usuário está ouvindo
export async function ltCommand(client, botInfo, message, group) {
    const senderPhone = message.sender;
    console.log(`[DEBUG] Buscando música para: ${senderPhone}`);

    if (!senderPhone) {
        await waUtil.replyText(client, message.chat_id, "Não foi possível identificar seu número.", message.wa_message);
        return;
    }

    const data = readLastfmDatabase();
    const username = data[senderPhone];

    if (!username) {
        await waUtil.replyText(client, message.chat_id, "Cadê seu registro no Last.fm? Manda !registrar [seu_user]",
                             message.wa_message);
        return;
    }

    try {
        // Busca a música atual
        const recentTracksResponse = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.getrecenttracks',
                user: username,
                api_key: '2fbbbbc72a202a238a971c72e1d5d05c',
                format: 'json',
            },
            timeout: 10000
        });

        const track = recentTracksResponse.data?.recenttracks?.track?.find(item => item['@attr']?.nowplaying === 'true');
        
        if (!track) {
            await waUtil.replyText(client, message.chat_id, 
                                 "Nada tocando agora... tá de castigo? 😏",
                                 message.wa_message);
            return;
        }

        // Busca info detalhada para pegar scrobbles
        const trackInfoResponse = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'track.getInfo',
                artist: track.artist['#text'],
                track: track.name,
                username: username,
                api_key: '2fbbbbc72a202a238a971c72e1d5d05c',
                format: 'json',
            },
            timeout: 10000
        });

        const scrobbles = trackInfoResponse.data?.track?.userplaycount || 0;
        const albumImage = track.image?.find(img => img.size === 'large')?.['#text'] || '';

        // Mensagem estilizada como você quer
        let scrobblesText;
        if (scrobbles === 0) {
            scrobblesText = "Nenhum scrobble ainda... vai ouvir direito, gata! 😼";
        } else if (scrobbles === 1) {
            scrobblesText = "1 vez só? Tá de brincadeira? 😒";
        } else {
            scrobblesText = `${scrobbles} vezes! ${scrobbles > 10 ? '🔥' : '👉👈'}`;
        }

        const replyText = `🎧 *Agora você está curtindo uma música incrível!*\n\n` +
                         `🎤 *Artista:* ${track.artist['#text']}\n` +
                         `🎶 *Música:* ${track.name}\n\n` +
                         `📊 *Scrobbles:* ${scrobblesText}\n\n` +
                         `Bora melhorar ai, piranha? 🫦💦`;

        if (albumImage) {
            await waUtil.replyFile(client, message.chat_id, 'imageMessage', albumImage, replyText, message.wa_message);
        } else {
            await waUtil.replyText(client, message.chat_id, replyText, message.wa_message);
        }

    } catch (error) {
        console.error('Erro no ltCommand:', error);
        await waUtil.replyText(client, message.chat_id,
                             "Deu ruim pra pegar sua música... tenta de novo aí, bb",
                             message.wa_message);
    }
}





// Função para mostrar os artistas mais ouvidos no último mês
export async function topartCommand(client, botInfo, message, group) {
    // O número de telefone do usuário (não o ID do sender)
    const senderPhone = message.sender;  // O número do usuário estará diretamente em message.sender
    console.log(`Buscando os artistas mais ouvidos para o usuário com número: ${senderPhone}`);  // Log para verificar o número de telefone

    if (!senderPhone) {
        await waUtil.replyText(client, message.chat_id, "Não foi possível identificar o seu número. Tente novamente mais tarde.", message.wa_message, { expiration: message.expiration });
        return;
    }

    // Lê os dados do banco de dados
    const data = readLastfmDatabase();
    const username = data[senderPhone];  // Obtém o nome de usuário do Last.fm para o usuário específico

    // Se o usuário não estiver registrado, retorna um erro
    if (!username) {
        await waUtil.replyText(client, message.chat_id, "Você não está registrado no Last.fm. Use o comando !registrar para se registrar.", message.wa_message, { expiration: message.expiration });
        return;
    }

    try {
        const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'user.gettopartists',
                user: username,
                period: '1month',
                api_key: '2fbbbbc72a202a238a971c72e1d5d05c',
                format: 'json',
            },
        });

        const artists = response.data.topartists.artist;
        if (artists.length === 0) {
            throw new Error("Você não tem artistas mais ouvidos neste mês.");
        }

        let artistList = artists.map((artist, index) => `${index + 1}. ${artist.name} - Scrobbles: ${artist.playcount}`).join('\n');
        const replyText = buildText(miscCommands.topart.msgs.reply, artistList);
        await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, { expiration: message.expiration });
    } catch (error) {
        await waUtil.replyText(client, message.chat_id, "Ocorreu um erro ao obter os artistas mais ouvidos. Tente novamente mais tarde.", message.wa_message, { expiration: message.expiration });
    }
}


// Comandos originais...

export async function sorteioCommand(client, botInfo, message, group) {
    if (!message.args.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    const chosenNumber = Number(message.text_command);
    if (!chosenNumber || chosenNumber <= 1) {
        throw new Error(miscCommands.sorteio.msgs.error_invalid_value);
    }
    const randomNumber = Math.floor(Math.random() * chosenNumber) + 1;
    const replyText = buildText(miscCommands.sorteio.msgs.reply, randomNumber);
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, { expiration: message.expiration });
}

export async function sorteiomembroCommand(client, botInfo, message, group) {
    const groupController = new GroupController();
    if (!message.isGroupMsg || !group) {
        throw new Error(botTexts.permission.group);
    }
    const currentParticipantsIds = await groupController.getParticipantsIds(group.id);
    const randomParticipant = currentParticipantsIds[Math.floor(Math.random() * currentParticipantsIds.length)];
    const replyText = buildText(miscCommands.sorteiomembro.msgs.reply, waUtil.removeWhatsappSuffix(randomParticipant));
    await waUtil.replyWithMentions(client, message.chat_id, replyText, [randomParticipant], message.wa_message, { expiration: message.expiration });
}

export async function mascoteCommand(client, botInfo, message, group) {
    const imagePath = path.resolve('dist/media/mascote.png');
    await waUtil.replyFile(client, message.chat_id, 'imageMessage', imagePath, 'Maria jose cururu.', message.wa_message, { expiration: message.expiration });
}

// Outros comandos originais seguem abaixo...
/*
export async function simiCommand(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    const miscCommands = commandsMisc(botInfo)

    if (!message.args.length) throw new Error(messageErrorCommandUsage(botInfo.prefix, message))

    const simiResult = await miscLib.simSimi(message.text_command)
    const replyText = buildText(miscCommands.simi.msgs.reply, timestampToDate(Date.now()), simiResult)
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, {expiration: message.expiration})
}*/
export async function viadometroCommand(client, botInfo, message, group) {
    if (!message.isGroupMsg) {
        throw new Error(botTexts.permission.group);
    }
    else if (!message.isQuoted && !message.mentioned.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    else if (message.mentioned.length > 1) {
        throw new Error(miscCommands.viadometro.msgs.error_mention);
    }
    const randomNumber = Math.floor(Math.random() * 100);
    const messageToReply = (message.quotedMessage && message.mentioned.length != 1) ? message.quotedMessage?.wa_message : message.wa_message;
    const replyText = buildText(miscCommands.viadometro.msgs.reply, randomNumber);
    await waUtil.replyText(client, message.chat_id, replyText, messageToReply, { expiration: message.expiration });
}
export async function detectorCommand(client, botInfo, message, group) {
    if (!message.isGroupMsg) {
        throw new Error(botTexts.permission.group);
    }
    else if (!message.isQuoted) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    const quotedMessage = message.quotedMessage?.wa_message;
    if (!quotedMessage) {
        throw new Error(miscCommands.detector.msgs.error_message);
    }
    const imagePathCalibration = path.resolve('dist/media/calibrando.png');
    const imagePathsResult = [
        path.resolve('dist/media/estressealto.png'),
        path.resolve('dist/media/incerteza.png'),
        path.resolve('dist/media/kao.png'),
        path.resolve('dist/media/meengana.png'),
        path.resolve('dist/media/mentiroso.png'),
        path.resolve('dist/media/vaipra.png'),
        path.resolve('dist/media/verdade.png')
    ];
    const randomIndex = Math.floor(Math.random() * imagePathsResult.length);
    const waitReply = miscCommands.detector.msgs.wait;
    await waUtil.replyFile(client, message.chat_id, 'imageMessage', imagePathCalibration, waitReply, quotedMessage, { expiration: message.expiration });
    await waUtil.replyFile(client, message.chat_id, 'imageMessage', imagePathsResult[randomIndex], '', quotedMessage, { expiration: message.expiration });
}
export async function roletarussaCommand(client, botInfo, message, group) {
    const bulletPosition = Math.floor(Math.random() * 6) + 1;
    const currentPosition = Math.floor(Math.random() * 6) + 1;
    const hasShooted = (bulletPosition == currentPosition);
    let replyText;
    if (hasShooted) {
        replyText = miscCommands.roletarussa.msgs.reply_dead;
    }
    else {
        replyText = miscCommands.roletarussa.msgs.reply_alive;
    }
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, { expiration: message.expiration });
}
export async function casalCommand(client, botInfo, message, group) {
    const groupController = new GroupController();
    if (!message.isGroupMsg || !group) {
        throw new Error(botTexts.permission.group);
    }
    let currentParticipantsIds = await groupController.getParticipantsIds(group.id);
    if (currentParticipantsIds && currentParticipantsIds.length < 2) {
        throw new Error(miscCommands.casal.msgs.error);
    }
    let randomIndex = Math.floor(Math.random() * currentParticipantsIds.length);
    let chosenParticipant1 = currentParticipantsIds[randomIndex];
    currentParticipantsIds.splice(randomIndex, 1);
    randomIndex = Math.floor(Math.random() * currentParticipantsIds.length);
    let chosenParticipant2 = currentParticipantsIds[randomIndex];
    let replyText = buildText(miscCommands.casal.msgs.reply, waUtil.removeWhatsappSuffix(chosenParticipant1), waUtil.removeWhatsappSuffix(chosenParticipant2));
    await waUtil.sendTextWithMentions(client, message.chat_id, replyText, [chosenParticipant1, chosenParticipant2], { expiration: message.expiration });
}
export async function caracoroaCommand(client, botInfo, message, group) {
    const coinSides = ['cara', 'coroa'];
    const userChoice = message.text_command.toLowerCase();
    if (!message.args.length || !coinSides.includes(userChoice)) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    const chosenSide = coinSides[Math.floor(Math.random() * coinSides.length)];
    const imagePath = chosenSide === 'cara' ? path.resolve('dist/media/cara.png') : path.resolve('dist/media/coroa.png');
    const waitText = miscCommands.caracoroa.msgs.wait;
    await waUtil.replyText(client, message.chat_id, waitText, message.wa_message, { expiration: message.expiration });
    const isUserVictory = chosenSide == userChoice;
    let replyText;
    if (isUserVictory) {
        replyText = buildText(miscCommands.caracoroa.msgs.reply_victory, uppercaseFirst(chosenSide));
    }
    else {
        replyText = buildText(miscCommands.caracoroa.msgs.reply_defeat, uppercaseFirst(chosenSide));
    }
    await waUtil.replyFile(client, message.chat_id, 'imageMessage', imagePath, replyText, message.wa_message, { expiration: message.expiration });
}
export async function pptCommand(client, botInfo, message, group) {
    const validChoices = ["pedra", "papel", "tesoura"];
    const userChoice = message.text_command.toLocaleLowerCase();
    const randomIndex = Math.floor(Math.random() * validChoices.length);
    if (!message.args.length || !validChoices.includes(userChoice)) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    let botChoice = validChoices[randomIndex];
    let botIconChoice;
    let userIconChoice;
    let isUserVictory;
    if (botChoice == "pedra") {
        botIconChoice = "✊";
        if (userChoice == "pedra")
            userIconChoice = "✊";
        else if (userChoice == "tesoura")
            isUserVictory = false, userIconChoice = "✌️";
        else
            isUserVictory = true, userIconChoice = "✋";
    }
    else if (botChoice == "papel") {
        botIconChoice = "✋";
        if (userChoice == "pedra")
            isUserVictory = false, userIconChoice = "✊";
        else if (userChoice == "tesoura")
            isUserVictory = true, userIconChoice = "✌️";
        else
            userIconChoice = "✋";
    }
    else {
        botIconChoice = "✌️";
        if (userChoice == "pedra")
            isUserVictory = true, userIconChoice = "✊";
        else if (userChoice == "tesoura")
            userIconChoice = "✌️";
        else
            isUserVictory = false, userIconChoice = "✋";
    }
    let replyText;
    if (isUserVictory === true) {
        replyText = buildText(miscCommands.ppt.msgs.reply_victory, userIconChoice, botIconChoice);
    }
    else if (isUserVictory === false) {
        replyText = buildText(miscCommands.ppt.msgs.reply_defeat, userIconChoice, botIconChoice);
    }
    else {
        replyText = buildText(miscCommands.ppt.msgs.reply_draw, userIconChoice, botIconChoice);
    }
    await waUtil.replyText(client, message.chat_id, replyText, message.wa_message, { expiration: message.expiration });
}
export async function gadometroCommand(client, botInfo, message, group) {
    if (!message.isGroupMsg || !group) {
        throw new Error(botTexts.permission.group);
    }
    else if (!message.isQuoted && !message.mentioned.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    else if (message.mentioned.length > 1) {
        throw new Error(miscCommands.gadometro.msgs.error_mention);
    }
    const randomNumber = Math.floor(Math.random() * 100);
    const messageToReply = (message.quotedMessage && message.mentioned.length != 1) ? message.quotedMessage?.wa_message : message.wa_message;
    const replyText = buildText(miscCommands.gadometro.msgs.reply, randomNumber);
    await waUtil.replyText(client, message.chat_id, replyText, messageToReply, { expiration: message.expiration });
}
export async function bafometroCommand(client, botInfo, message, group) {
    if (!message.isGroupMsg || !group) {
        throw new Error(botTexts.permission.group);
    }
    else if (!message.isQuoted && !message.mentioned.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    else if (message.mentioned.length > 1) {
        throw new Error(miscCommands.bafometro.msgs.error_mention);
    }
    const randomNumber = Math.floor(Math.random() * 100);
    const messageToReply = (message.quotedMessage && message.mentioned.length != 1) ? message.quotedMessage?.wa_message : message.wa_message;
    const replyText = buildText(miscCommands.bafometro.msgs.reply, randomNumber);
    await waUtil.replyText(client, message.chat_id, replyText, messageToReply, { expiration: message.expiration });
}
export async function top5Command(client, botInfo, message, group) {
    const groupController = new GroupController();
    if (!message.isGroupMsg || !group) {
        throw new Error(botTexts.permission.group);
    }
    else if (!message.args.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    let rankingTheme = message.text_command;
    let currentParticipantsIds = await groupController.getParticipantsIds(group.id);
    if (currentParticipantsIds.length < 5) {
        throw new Error(miscCommands.top5.msgs.error_members);
    }
    let replyText = buildText(miscCommands.top5.msgs.reply_title, rankingTheme);
    let mentionList = [];
    for (let i = 1; i <= 5; i++) {
        let icon;
        switch (i) {
            case 1:
                icon = '🥇';
                break;
            case 2:
                icon = '🥈';
                break;
            case 3:
                icon = '🥉';
                break;
            default:
                icon = '';
        }
        let randomIndex = Math.floor(Math.random() * currentParticipantsIds.length);
        let chosenParticipant = currentParticipantsIds[randomIndex];
        replyText += buildText(miscCommands.top5.msgs.reply_item, icon, i, waUtil.removeWhatsappSuffix(chosenParticipant));
        mentionList.push(chosenParticipant);
        currentParticipantsIds.splice(currentParticipantsIds.indexOf(chosenParticipant), 1);
    }
    await waUtil.sendTextWithMentions(client, message.chat_id, replyText, mentionList, { expiration: message.expiration });
}
export async function parCommand(client, botInfo, message, group) {
    if (!message.isGroupMsg || !group) {
        throw new Error(botTexts.permission.group);
    }
    else if (message.mentioned.length !== 2) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    const randomNumber = Math.floor(Math.random() * 100);
    let replyText = buildText(miscCommands.par.msgs.reply, waUtil.removeWhatsappSuffix(message.mentioned[0]), waUtil.removeWhatsappSuffix(message.mentioned[1]), randomNumber);
    await waUtil.sendTextWithMentions(client, message.chat_id, replyText, message.mentioned, { expiration: message.expiration });
}
export async function chanceCommand(client, botInfo, message, group) {
    if (!message.args.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message));
    }
    const randomNumber = Math.floor(Math.random() * 100);
    const replyText = buildText(miscCommands.chance.msgs.reply, randomNumber, message.text_command);
    const messageToReply = (message.isQuoted && message.quotedMessage) ? message.quotedMessage?.wa_message : message.wa_message;
    await waUtil.replyText(client, message.chat_id, replyText, messageToReply, { expiration: message.expiration });
}
export async function fraseCommand(client, botInfo, message, group) {
    const phraseResult = await funnyRandomPhrases();
    const replyText = buildText(miscCommands.frase.msgs.reply, phraseResult);
    const imagePath = path.resolve('dist/media/frasewhatsappjr.png');
    await waUtil.replyFile(client, message.chat_id, 'imageMessage', imagePath, replyText, message.wa_message, { expiration: message.expiration });
}
