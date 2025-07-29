import { S_WHATSAPP_NET, generateWAMessageFromContent, getContentType } from "baileys";
import { randomDelay } from "./general.util.js";
import * as convertLibrary from './convert.util.js';
import { removeBold } from "./general.util.js";
import { GroupController } from "../controllers/group.controller.js";
import { UserController } from "../controllers/user.controller.js";
async function updatePresence(client, chatId, presence) {
    await client.presenceSubscribe(chatId);
    await randomDelay(200, 400);
    await client.sendPresenceUpdate(presence, chatId);
    await randomDelay(300, 1000);
    await client.sendPresenceUpdate('paused', chatId);
}
export function addWhatsappSuffix(userNumber) {
    const userId = userNumber.replace(/\W+/g, "") + S_WHATSAPP_NET;
    return userId;
}
export function removeWhatsappSuffix(userId) {
    const userNumber = userId.replace(S_WHATSAPP_NET, '');
    return userNumber;
}
export function removePrefix(prefix, command) {
    const commandWithoutPrefix = command.replace(prefix, '');
    return commandWithoutPrefix;
}
export function getGroupParticipantsByMetadata(group) {
    const { participants } = group;
    let groupParticipants = [];
    participants.forEach((participant) => {
        groupParticipants.push(participant.id);
    });
    return groupParticipants;
}
export function getGroupAdminsByMetadata(group) {
    const { participants } = group;
    const admins = participants.filter(user => (user.admin != null));
    let groupAdmins = [];
    admins.forEach((admin) => {
        groupAdmins.push(admin.id);
    });
    return groupAdmins;
}
export function deleteMessage(client, message, deleteQuoted) {
    let deletedMessage;
    let chatId = message.key.remoteJid;
    if (!chatId)
        return;
    if (deleteQuoted) {
        deletedMessage = {
            remoteJid: message.key.remoteJid,
            fromMe: message.key.participant === message?.message?.extendedTextMessage?.contextInfo?.participant,
            id: message.message?.extendedTextMessage?.contextInfo?.stanzaId,
            participant: message?.message?.extendedTextMessage?.contextInfo?.participant
        };
    }
    else {
        deletedMessage = message.key;
    }
    return client.sendMessage(chatId, { delete: deletedMessage });
}
export function readMessage(client, chatId, sender, messageId) {
    return client.sendReceipt(chatId, sender, [messageId], 'read');
}
export function updateProfilePic(client, chatId, image) {
    return client.updateProfilePicture(chatId, image);
}
export function updateProfileStatus(client, text) {
    return client.updateProfileStatus(text);
}
export function shutdownBot(client) {
    return client.end(new Error("admin_command"));
}
export function getProfilePicUrl(client, chatId) {
    return client.profilePictureUrl(chatId, "image");
}
export function blockContact(client, userId) {
    return client.updateBlockStatus(userId, "block");
}
export function unblockContact(client, userId) {
    return client.updateBlockStatus(userId, "unblock");
}
export function getHostNumber(client) {
    let id = client.user?.id.replace(/:[0-9]+/ism, '');
    return id || '';
}
export function getBlockedContacts(client) {
    return client.fetchBlocklist();
}
export async function sendText(client, chatId, text, options) {
    await updatePresence(client, chatId, "composing");
    return client.sendMessage(chatId, { text, linkPreview: null }, { ephemeralExpiration: options?.expiration });
}
export function sendLinkWithPreview(client, chatId, text, options) {
    return client.sendMessage(chatId, { text }, { ephemeralExpiration: options?.expiration });
}
export async function sendTextWithMentions(client, chatId, text, mentions, options) {
    await updatePresence(client, chatId, "composing");
    return client.sendMessage(chatId, { text, mentions }, { ephemeralExpiration: options?.expiration });
}
export function sendSticker(client, chatId, sticker, options) {
    return client.sendMessage(chatId, { sticker }, { ephemeralExpiration: options?.expiration });
}
export async function sendFileFromUrl(client, chatId, type, url, caption, options) {
    if (type === "imageMessage") {
        return client.sendMessage(chatId, { image: { url }, caption }, { ephemeralExpiration: options?.expiration });
    }
    else if (type === 'videoMessage') {
        const base64Thumb = await convertLibrary.convertVideoToThumbnail('url', url);
        return client.sendMessage(chatId, { video: { url }, mimetype: options?.mimetype, caption, jpegThumbnail: base64Thumb }, { ephemeralExpiration: options?.expiration });
    }
    else if (type === 'audioMessage') {
        return client.sendMessage(chatId, { audio: { url }, mimetype: options?.mimetype }, { ephemeralExpiration: options?.expiration });
    }
}
export async function replyText(client, chatId, text, quoted, options) {
    await updatePresence(client, chatId, "composing");
    return client.sendMessage(chatId, { text, linkPreview: null }, { quoted, ephemeralExpiration: options?.expiration });
}
export async function replyFile(client, chatId, type, url, caption, quoted, options) {
    if (type == "imageMessage") {
        return client.sendMessage(chatId, { image: { url }, caption }, { quoted, ephemeralExpiration: options?.expiration });
    }
    else if (type == "videoMessage") {
        const base64Thumb = await convertLibrary.convertVideoToThumbnail('file', url);
        return client.sendMessage(chatId, { video: { url }, mimetype: options?.mimetype, caption, jpegThumbnail: base64Thumb }, { quoted, ephemeralExpiration: options?.expiration });
    }
    else if (type == "audioMessage") {
        return client.sendMessage(chatId, { audio: { url }, mimetype: options?.mimetype }, { quoted, ephemeralExpiration: options?.expiration });
    }
}
export async function replyFileFromUrl(client, chatId, type, url, caption, quoted, options) {
    if (type == "imageMessage") {
        return client.sendMessage(chatId, { image: { url }, caption }, { quoted, ephemeralExpiration: options?.expiration });
    }
    else if (type == "videoMessage") {
        const base64Thumb = await convertLibrary.convertVideoToThumbnail('url', url);
        return client.sendMessage(chatId, { video: { url }, mimetype: options?.mimetype, caption, jpegThumbnail: base64Thumb }, { quoted, ephemeralExpiration: options?.expiration });
    }
    else if (type == "audioMessage") {
        return client.sendMessage(chatId, { audio: { url }, mimetype: options?.mimetype }, { quoted, ephemeralExpiration: options?.expiration });
    }
}
export async function replyFileFromBuffer(client, chatId, type, buffer, caption, quoted, options) {
    if (type == "videoMessage") {
        const base64Thumb = await convertLibrary.convertVideoToThumbnail('buffer', buffer);
        return client.sendMessage(chatId, { video: buffer, caption, mimetype: options?.mimetype, jpegThumbnail: base64Thumb }, { quoted, ephemeralExpiration: options?.expiration });
    }
    else if (type == "imageMessage") {
        return client.sendMessage(chatId, { image: buffer, caption }, { quoted, ephemeralExpiration: options?.expiration });
    }
    else if (type == "audioMessage") {
        return client.sendMessage(chatId, { audio: buffer, mimetype: options?.mimetype }, { quoted, ephemeralExpiration: options?.expiration });
    }
}
export async function replyWithMentions(client, chatId, text, mentions, quoted, options) {
    await updatePresence(client, chatId, "composing");
    return client.sendMessage(chatId, { text, mentions }, { quoted, ephemeralExpiration: options?.expiration });
}
export function joinGroupInviteLink(client, linkGroup) {
    return client.groupAcceptInvite(linkGroup);
}
export function revokeGroupInvite(client, groupId) {
    return client.groupRevokeInvite(groupId);
}
export async function getGroupInviteLink(client, groupId) {
    let inviteCode = await client.groupInviteCode(groupId);
    return inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : undefined;
}
export function leaveGroup(client, groupId) {
    return client.groupLeave(groupId);
}
export function getGroupInviteInfo(client, linkGroup) {
    return client.groupGetInviteInfo(linkGroup);
}
export function updateGroupRestriction(client, groupId, status) {
    let config = status ? "announcement" : "not_announcement";
    return client.groupSettingUpdate(groupId, config);
}
export async function getAllGroups(client) {
    let groups = await client.groupFetchAllParticipating();
    let groupsInfo = [];
    for (let [key, value] of Object.entries(groups)) {
        groupsInfo.push(value);
    }
    return groupsInfo;
}
export async function removeParticipant(client, groupId, participant) {
    const [response] = await client.groupParticipantsUpdate(groupId, [participant], "remove");
    return response;
}
export async function addParticipant(client, groupId, participant) {
    const [response] = await client.groupParticipantsUpdate(groupId, [participant], "add");
    return response;
}
export async function promoteParticipant(client, groupId, participant) {
    const [response] = await client.groupParticipantsUpdate(groupId, [participant], "promote");
    return response;
}
export async function demoteParticipant(client, groupId, participant) {
    const [response] = await client.groupParticipantsUpdate(groupId, [participant], "demote");
    return response;
}
export function storeMessageOnCache(message, messageCache) {
    if (message.key.remoteJid && message.key.id && message.message) {
        messageCache.set(message.key.id, message.message);
    }
}
export function getMessageFromCache(messageId, messageCache) {
    let message = messageCache.get(messageId);
    return message;
}
export async function formatWAMessage(m, group, hostId) {
    if (!m.message)
        return;
    const type = getContentType(m.message);
    if (!type || !isAllowedType(type) || !m.message[type])
        return;
    const groupController = new GroupController();
    const userController = new UserController();
    const botAdmins = await userController.getAdmins();
    const contextInfo = (typeof m.message[type] != "string" && m.message[type] && "contextInfo" in m.message[type]) ? m.message[type].contextInfo : undefined;
    const isQuoted = (contextInfo?.quotedMessage) ? true : false;
    const sender = (m.key.fromMe) ? hostId : m.key.participant || m.key.remoteJid;
    const pushName = m.pushName;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || undefined;
    const caption = (typeof m.message[type] != "string" && m.message[type] && "caption" in m.message[type]) ? m.message[type].caption : undefined;
    const text = caption || body || '';
    const [command, ...args] = text.trim().split(" ");
    const isGroupMsg = m.key.remoteJid?.includes("@g.us") ?? false;
    const message_id = m.key.id;
    const t = m.messageTimestamp;
    const chat_id = m.key.remoteJid;
    const isGroupAdmin = (sender && group) ? await groupController.isParticipantAdmin(group.id, sender) : false;
    if (!message_id || !t || !sender || !chat_id)
        return;
    let formattedMessage = {
        message_id,
        sender,
        type: type,
        t,
        chat_id,
        expiration: contextInfo?.expiration || undefined,
        pushname: pushName || '',
        body: m.message.conversation || m.message.extendedTextMessage?.text || '',
        caption: caption || '',
        mentioned: contextInfo?.mentionedJid || [],
        text_command: args?.join(" ").trim() || '',
        command: removeBold(command?.toLowerCase().trim()) || '',
        args,
        isQuoted,
        isGroupMsg,
        isGroupAdmin,
        isBotAdmin: botAdmins.map(admin => admin.id).includes(sender),
        isBotOwner: botAdmins.find(admin => admin.owner == true)?.id == sender,
        isBotMessage: m.key.fromMe ?? false,
        isBroadcast: m.key.remoteJid == "status@broadcast",
        isMedia: type != "conversation" && type != "extendedTextMessage",
        wa_message: m,
    };
    if (formattedMessage.isMedia) {
        const mimetype = (typeof m.message[type] != "string" && m.message[type] && "mimetype" in m.message[type]) ? m.message[type].mimetype : undefined;
        const url = (typeof m.message[type] != "string" && m.message[type] && "url" in m.message[type]) ? m.message[type].url : undefined;
        const seconds = (typeof m.message[type] != "string" && m.message[type] && "seconds" in m.message[type]) ? m.message[type].seconds : undefined;
        const file_length = (typeof m.message[type] != "string" && m.message[type] && "fileLength" in m.message[type]) ? m.message[type].fileLength : undefined;
        if (!mimetype || !url || !file_length)
            return;
        formattedMessage.media = {
            mimetype,
            url,
            seconds: seconds || undefined,
            file_length
        };
    }
    if (formattedMessage.isQuoted) {
        const quotedMessage = contextInfo?.quotedMessage;
        if (!quotedMessage)
            return;
        const typeQuoted = getContentType(quotedMessage);
        const quotedStanzaId = contextInfo.stanzaId ?? undefined;
        const senderQuoted = contextInfo.participant || contextInfo.remoteJid;
        if (!typeQuoted || !senderQuoted)
            return;
        const captionQuoted = (typeof quotedMessage[typeQuoted] != "string" && quotedMessage[typeQuoted] && "caption" in quotedMessage[typeQuoted]) ? quotedMessage[typeQuoted].caption : undefined;
        const quotedWAMessage = generateWAMessageFromContent(formattedMessage.chat_id, quotedMessage, { userJid: senderQuoted, messageId: quotedStanzaId });
        quotedWAMessage.key.fromMe = (hostId == senderQuoted);
        formattedMessage.quotedMessage = {
            type: typeQuoted,
            sender: senderQuoted,
            body: quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || '',
            caption: captionQuoted || '',
            isMedia: typeQuoted != "conversation" && typeQuoted != "extendedTextMessage",
            wa_message: quotedWAMessage
        };
        if (formattedMessage.quotedMessage?.isMedia) {
            const urlQuoted = (typeof quotedMessage[typeQuoted] != "string" && quotedMessage[typeQuoted] && "url" in quotedMessage[typeQuoted]) ? quotedMessage[typeQuoted].url : undefined;
            const mimetypeQuoted = (typeof quotedMessage[typeQuoted] != "string" && quotedMessage[typeQuoted] && "mimetype" in quotedMessage[typeQuoted]) ? quotedMessage[typeQuoted].mimetype : undefined;
            const fileLengthQuoted = (typeof quotedMessage[typeQuoted] != "string" && quotedMessage[typeQuoted] && "fileLength" in quotedMessage[typeQuoted]) ? quotedMessage[typeQuoted].fileLength : undefined;
            const secondsQuoted = (typeof quotedMessage[typeQuoted] != "string" && quotedMessage[typeQuoted] && "seconds" in quotedMessage[typeQuoted]) ? quotedMessage[typeQuoted].seconds : undefined;
            if (!urlQuoted || !mimetypeQuoted || !fileLengthQuoted)
                return;
            formattedMessage.quotedMessage.media = {
                url: urlQuoted,
                mimetype: mimetypeQuoted,
                file_length: fileLengthQuoted,
                seconds: secondsQuoted || undefined,
            };
        }
    }
    return formattedMessage;
}
function isAllowedType(type) {
    const allowedTypes = [
        "conversation",
        "extendedTextMessage",
        "audioMessage",
        "imageMessage",
        "audioMessage",
        "documentMessage",
        "stickerMessage",
        "videoMessage",
        "viewOnceMessage",
        "viewOnceMessageV2",
        "viewOnceMessageV2Extension"
    ];
    return allowedTypes.includes(type);
}
