import { UserService } from "../services/user.service.js";
export class UserController {
    userService;
    constructor() {
        this.userService = new UserService();
    }
    registerUser(userId, name) {
        return this.userService.registerUser(userId, name);
    }
    migrateUsers() {
        return this.userService.migrateUsers();
    }
    setName(userId, name) {
        return this.userService.setName(userId, name);
    }
    promoteUser(userId) {
        return this.userService.setAdmin(userId, true);
    }
    demoteUser(userId) {
        return this.userService.setAdmin(userId, false);
    }
    registerOwner(userId) {
        return this.userService.setOwner(userId);
    }
    getUsers() {
        return this.userService.getUsers();
    }
    getUser(userId) {
        return this.userService.getUser(userId);
    }
    getOwner() {
        return this.userService.getOwner();
    }
    getAdmins() {
        return this.userService.getAdmins();
    }
    setReceivedWelcome(userId, status = true) {
        return this.userService.setReceivedWelcome(userId, status);
    }
    increaseUserCommandsCount(userId) {
        return this.userService.increaseUserCommandsCount(userId);
    }
    async expireCommandsRate(userId, currentTimestamp) {
        return this.userService.expireCommandsRate(userId, currentTimestamp);
    }
    async incrementCommandRate(userId) {
        return this.userService.incrementCommandRate(userId);
    }
    setLimitedUser(userId, isLimited, botInfo, currentTimestamp) {
        return this.userService.setLimitedUser(userId, isLimited, botInfo, currentTimestamp);
    }
}
