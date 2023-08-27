"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigCmd = void 0;
const commander_1 = require("commander");
class ConfigCmd {
    constructor(configRepo, spinner) {
        this.configRepo = configRepo;
        this.spinner = spinner;
        this.cmd = new commander_1.Command('config');
        this.cmd.description('Add/remove/list configurations');
        this.cmd
            .command('add')
            .requiredOption('-k, --key <key> Key of the adding config')
            .requiredOption('-v, --value <value> Value of the adding config')
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            this.spinner.start(`Adding ${options.key} config`);
            yield this.configRepo.addConfigs([
                {
                    key: options.key,
                    value: options.value,
                },
            ]);
            this.spinner.succeed(`${options.key} has been added`);
        }));
        this.cmd.command('list').action(() => __awaiter(this, void 0, void 0, function* () {
            const configs = yield this.configRepo.getAllConfigs();
            console.table(configs.map((c) => ({
                key: c.key,
                value: c.value,
            })));
        }));
    }
    getCmdInstance() {
        return this.cmd;
    }
}
exports.ConfigCmd = ConfigCmd;
