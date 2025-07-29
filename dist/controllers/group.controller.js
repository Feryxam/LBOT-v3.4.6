import { GroupService } from "../services/group.service.js";
import { ParticipantService } from "../services/participant.service.js";
export class GroupController {
    groupService;
    participantService;
    constructor() {
        this.groupService = new GroupService();
        this.participantService = new ParticipantService();
    }
    // ***** Grupo *****
    registerGroup(group) {
        return this.groupService.registerGroup(group);
    }
    migrateGroups() {
        return this.groupService.migrateGroups();
    }
    getGroup(groupId) {
        return this.groupService.getGroup(groupId);
    }
    getAllGroups() {
        return this.groupService.getAllGroups();
    }
    setNameGroup(groupId, name) {
        return this.groupService.setName(groupId, name);
    }
    setRestrictedGroup(groupId, status) {
        return this.groupService.setRestricted(groupId, status);
    }
    syncGroups(groups) {
        return this.groupService.syncGroups(groups);
    }
    updatePartialGroup(group) {
        return this.groupService.updatePartialGroup(group);
    }
    removeGroup(groupId) {
        return this.groupService.removeGroup(groupId);
    }
    incrementGroupCommands(groupId) {
        return this.groupService.incrementGroupCommands(groupId);
    }
    async setWordFilter(groupId, word, operation) {
        return this.groupService.setWordFilter(groupId, word, operation);
    }
    setWelcome(groupId, status, message = '') {
        return this.groupService.setWelcome(groupId, status, message);
    }
    setAutoReply(groupId, status) {
        return this.groupService.setAutoReply(groupId, status);
    }
    async setReplyConfig(groupId, word, reply, operation) {
        return this.groupService.setReplyConfig(groupId, word, reply, operation);
    }
    setAntiLink(groupId, status) {
        return this.groupService.setAntilink(groupId, status);
    }
    async setLinkException(groupId, exception, operation) {
        return this.groupService.setLinkException(groupId, exception, operation);
    }
    setAutoSticker(groupId, status = true) {
        return this.groupService.setAutosticker(groupId, status);
    }
    setAntiFake(groupId, status) {
        return this.groupService.setAntifake(groupId, status);
    }
    async setFakePrefixException(groupId, numberPrefix, operation) {
        return this.groupService.setFakePrefixException(groupId, numberPrefix, operation);
    }
    async setFakeNumberException(groupId, userNumber, operation) {
        return this.groupService.setFakeNumberException(groupId, userNumber, operation);
    }
    setMuted(groupId, status = true) {
        return this.groupService.setMuted(groupId, status);
    }
    setAntiFlood(groupId, status = true, maxMessages = 10, interval = 10) {
        return this.groupService.setAntiFlood(groupId, status, maxMessages, interval);
    }
    async setBlacklist(groupId, userId, operation) {
        return this.groupService.setBlacklist(groupId, userId, operation);
    }
    async setBlockedCommands(groupId, prefix, commands, operation) {
        return this.groupService.setBlockedCommands(groupId, prefix, commands, operation);
    }
    // ***** Participantes *****
    addParticipant(groupId, userId, isAdmin = false) {
        return this.participantService.addParticipant(groupId, userId, isAdmin);
    }
    removeParticipant(groupId, userId) {
        return this.participantService.removeParticipant(groupId, userId);
    }
    async setAdmin(groupId, userId, status) {
        return this.participantService.setAdmin(groupId, userId, status);
    }
    migrateParticipants() {
        return this.participantService.migrateParticipants();
    }
    getParticipant(groupId, userId) {
        return this.participantService.getParticipantFromGroup(groupId, userId);
    }
    getParticipants(groupId) {
        return this.participantService.getParticipantsFromGroup(groupId);
    }
    getParticipantsIds(groupId) {
        return this.participantService.getParticipantsIdsFromGroup(groupId);
    }
    getAdmins(groupId) {
        return this.participantService.getAdminsFromGroup(groupId);
    }
    getAdminsIds(groupId) {
        return this.participantService.getAdminsIdsFromGroup(groupId);
    }
    isParticipant(groupId, userId) {
        return this.participantService.isGroupParticipant(groupId, userId);
    }
    isParticipantAdmin(groupId, userId) {
        return this.participantService.isGroupAdmin(groupId, userId);
    }
    getParticipantsActivityLowerThan(group, num) {
        return this.participantService.getParticipantActivityLowerThan(group, num);
    }
    getParticipantsActivityRanking(group, num) {
        return this.participantService.getParticipantsActivityRanking(group, num);
    }
    incrementParticipantActivity(groupId, userId, type, isCommand) {
        return this.participantService.incrementParticipantActivity(groupId, userId, type, isCommand);
    }
    addParticipantWarning(groupId, userId) {
        return this.participantService.addWarning(groupId, userId);
    }
    removeParticipantWarning(groupId, userId, currentWarnings) {
        return this.participantService.removeWarning(groupId, userId, currentWarnings);
    }
    removeParticipantsWarnings(groupId) {
        return this.participantService.removeParticipantsWarnings(groupId);
    }
    async expireParticipantAntiFlood(groupId, userId, newExpireTimestamp) {
        return this.participantService.expireParticipantAntiFlood(groupId, userId, newExpireTimestamp);
    }
    async incrementAntiFloodMessage(groupId, userId) {
        return this.participantService.incrementAntiFloodMessage(groupId, userId);
    }
}
