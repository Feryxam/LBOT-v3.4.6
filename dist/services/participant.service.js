import { deepMerge, timestampToDate } from '../utils/general.util.js';
import moment from 'moment-timezone';
import DataStore from "@seald-io/nedb";
const db = new DataStore({ filename: './storage/participants.groups.db', autoload: true });
export class ParticipantService {
    defaultParticipant = {
        group_id: '',
        user_id: '',
        registered_since: timestampToDate(moment.now()),
        commands: 0,
        admin: false,
        msgs: 0,
        image: 0,
        audio: 0,
        sticker: 0,
        video: 0,
        text: 0,
        other: 0,
        warnings: 0,
        antiflood: {
            expire: 0,
            msgs: 0
        }
    };
    async syncParticipants(groupMeta) {
        //Adiciona participantes no banco de dados que entraram enquanto o bot estava off.
        groupMeta.participants.forEach(async (participant) => {
            const isAdmin = (participant.admin) ? true : false;
            const isGroupParticipant = await this.isGroupParticipant(groupMeta.id, participant.id);
            if (!isGroupParticipant) {
                await this.addParticipant(groupMeta.id, participant.id, isAdmin);
            }
            else {
                await db.updateAsync({ group_id: groupMeta.id, user_id: participant.id }, { $set: { admin: isAdmin } });
            }
        });
        //Remove participantes do banco de dados que sairam do grupo enquanto o bot estava off.
        const currentParticipants = await this.getParticipantsFromGroup(groupMeta.id);
        currentParticipants.forEach(async (participant) => {
            if (!groupMeta.participants.find(groupMetaParticipant => groupMetaParticipant.id == participant.user_id)) {
                await this.removeParticipant(groupMeta.id, participant.user_id);
            }
        });
    }
    async addParticipant(groupId, userId, isAdmin) {
        const isGroupParticipant = await this.isGroupParticipant(groupId, userId);
        if (isGroupParticipant)
            return;
        const participant = {
            ...this.defaultParticipant,
            group_id: groupId,
            user_id: userId,
            admin: isAdmin
        };
        await db.insertAsync(participant);
    }
    async migrateParticipants() {
        const participants = await this.getAllParticipants();
        for (let participant of participants) {
            const oldParticipantData = participant;
            const updatedParticipantData = deepMerge(this.defaultParticipant, oldParticipantData);
            await db.updateAsync({ group_id: participant.group_id, user_id: participant.user_id }, { $set: updatedParticipantData }, { upsert: true });
        }
    }
    async removeParticipant(groupId, userId) {
        await db.removeAsync({ group_id: groupId, user_id: userId }, {});
    }
    async removeParticipants(groupId) {
        await db.removeAsync({ group_id: groupId }, { multi: true });
    }
    async setAdmin(groupId, userId, status) {
        await db.updateAsync({ group_id: groupId, user_id: userId }, { $set: { admin: status } });
    }
    async getParticipantFromGroup(groupId, userId) {
        const participant = await db.findOneAsync({ group_id: groupId, user_id: userId });
        return participant;
    }
    async getParticipantsFromGroup(groupId) {
        const participants = await db.findAsync({ group_id: groupId });
        return participants;
    }
    async getAllParticipants() {
        const participants = await db.findAsync({});
        return participants;
    }
    async getParticipantsIdsFromGroup(groupId) {
        const participants = await this.getParticipantsFromGroup(groupId);
        return participants.map(participant => participant.user_id);
    }
    async getAdminsFromGroup(groupId) {
        const admins = await db.findAsync({ group_id: groupId, admin: true });
        return admins;
    }
    async getAdminsIdsFromGroup(groupId) {
        const admins = await db.findAsync({ group_id: groupId, admin: true });
        return admins.map(admin => admin.user_id);
    }
    async isGroupParticipant(groupId, userId) {
        const participantsIds = await this.getParticipantsIdsFromGroup(groupId);
        return participantsIds.includes(userId);
    }
    async isGroupAdmin(groupId, userId) {
        const adminsIds = await this.getAdminsIdsFromGroup(groupId);
        return adminsIds.includes(userId);
    }
    async incrementParticipantActivity(groupId, userId, type, isCommand) {
        let incrementedUser = { msgs: 1 };
        if (isCommand)
            incrementedUser.commands = 1;
        switch (type) {
            case "conversation":
            case "extendedTextMessage":
                incrementedUser.text = 1;
                break;
            case "imageMessage":
                incrementedUser.image = 1;
                break;
            case "videoMessage":
                incrementedUser.video = 1;
                break;
            case "stickerMessage":
                incrementedUser.sticker = 1;
                break;
            case "audioMessage":
                incrementedUser.audio = 1;
                break;
            case "documentMessage":
                incrementedUser.other = 1;
                break;
        }
        await db.updateAsync({ group_id: groupId, user_id: userId }, { $inc: incrementedUser });
    }
    async getParticipantActivityLowerThan(group, num) {
        const inactives = await db.findAsync({ group_id: group.id, msgs: { $lt: num } }).sort({ msgs: -1 });
        return inactives;
    }
    async getParticipantsActivityRanking(group, qty) {
        let participantsLeaderboard = await db.findAsync({ group_id: group.id }).sort({ msgs: -1 });
        const qty_leaderboard = (qty > participantsLeaderboard.length) ? participantsLeaderboard.length : qty;
        return participantsLeaderboard.splice(0, qty_leaderboard);
    }
    async addWarning(groupId, userId) {
        await db.updateAsync({ group_id: groupId, user_id: userId }, { $inc: { warnings: 1 } });
    }
    async removeWarning(groupId, userId, currentWarnings) {
        await db.updateAsync({ group_id: groupId, user_id: userId }, { $set: { warnings: --currentWarnings } });
    }
    async removeParticipantsWarnings(groupId) {
        await db.updateAsync({ group_id: groupId }, { $set: { warnings: 0 } });
    }
    async expireParticipantAntiFlood(groupId, userId, newExpireTimestamp) {
        await db.updateAsync({ group_id: groupId, user_id: userId }, { $set: { 'antiflood.expire': newExpireTimestamp, 'antiflood.msgs': 1 } });
    }
    async incrementAntiFloodMessage(groupId, userId) {
        await db.updateAsync({ group_id: groupId, user_id: userId }, { $inc: { 'antiflood.msgs': 1 } });
    }
}
