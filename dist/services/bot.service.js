import path from "node:path";
import fs from 'fs-extra';
import moment from "moment-timezone";
import { removePrefix } from "../utils/whatsapp.util.js";
import { deepMerge } from "../utils/general.util.js";
export class BotService {
    pathJSON = path.resolve("storage/bot.json");
    defaultBot = {
        started: 0,
        host_number: '',
        name: "LBOT",
        prefix: "!",
        executed_cmds: 0,
        db_migrated: true,
        autosticker: false,
        commands_pv: true,
        admin_mode: false,
        block_cmds: [],
        command_rate: {
            status: false,
            max_cmds_minute: 5,
            block_time: 60,
        }
    };
    constructor() {
        const storageFolderExists = fs.pathExistsSync(path.resolve("storage"));
        const jsonFileExists = fs.existsSync(this.pathJSON);
        if (!storageFolderExists)
            fs.mkdirSync(path.resolve("storage"), { recursive: true });
        if (!jsonFileExists)
            this.initBot();
    }
    initBot() {
        this.updateBot(this.defaultBot);
    }
    migrateBot() {
        const oldBotData = this.getBot();
        const newBotData = deepMerge(this.defaultBot, oldBotData);
        this.deleteBotData();
        this.updateBot(newBotData);
    }
    updateBot(bot) {
        fs.writeFileSync(this.pathJSON, JSON.stringify(bot));
    }
    deleteBotData() {
        fs.writeFileSync(this.pathJSON, JSON.stringify({}));
    }
    startBot(hostNumber) {
        let bot = this.getBot();
        bot.started = moment.now();
        bot.host_number = hostNumber;
        this.updateBot(bot);
    }
    getBot() {
        return JSON.parse(fs.readFileSync(this.pathJSON, { encoding: "utf-8" }));
    }
    setNameBot(name) {
        let bot = this.getBot();
        bot.name = name;
        this.updateBot(bot);
    }
    setDbMigrated(status) {
        let bot = this.getBot();
        bot.db_migrated = status;
        this.updateBot(bot);
    }
    setPrefix(prefix) {
        let bot = this.getBot();
        bot.prefix = prefix;
        this.updateBot(bot);
    }
    incrementExecutedCommands() {
        let bot = this.getBot();
        bot.executed_cmds++;
        this.updateBot(bot);
    }
    setAutosticker(status) {
        let bot = this.getBot();
        bot.autosticker = status;
        this.updateBot(bot);
    }
    setAdminMode(status) {
        let bot = this.getBot();
        bot.admin_mode = status;
        this.updateBot(bot);
    }
    setCommandsPv(status) {
        let bot = this.getBot();
        bot.commands_pv = status;
        this.updateBot(bot);
    }
    async setCommandRate(status, maxCommandsMinute, blockTime) {
        let bot = this.getBot();
        bot.command_rate.status = status;
        bot.command_rate.max_cmds_minute = maxCommandsMinute;
        bot.command_rate.block_time = blockTime;
        this.updateBot(bot);
    }
    async setBlockedCommands(prefix, commands, operation) {
        let botInfo = this.getBot();
        const commandsWithoutPrefix = commands.map(command => removePrefix(prefix, command));
        if (operation == 'add') {
            const blockCommands = commandsWithoutPrefix.filter(command => !botInfo.block_cmds.includes(command));
            botInfo.block_cmds.push(...blockCommands);
            this.updateBot(botInfo);
            return blockCommands.map(command => prefix + command);
        }
        else {
            const unblockCommands = commandsWithoutPrefix.filter(command => botInfo.block_cmds.includes(command));
            unblockCommands.forEach((command) => {
                botInfo.block_cmds.splice(botInfo.block_cmds.indexOf(command), 1);
            });
            this.updateBot(botInfo);
            return unblockCommands.map(command => prefix + command);
        }
    }
}
