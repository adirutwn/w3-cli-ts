#! /usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const package_json_1 = __importDefault(require("../package.json"));
const spinner_1 = require("./uis/spinner");
const stores_1 = require("./stores");
const account_1 = require("./repos/account");
const account_2 = require("./cmds/account");
const config_1 = require("./repos/config");
const config_2 = require("./cmds/config");
const _1inch_1 = require("./cmds/1inch");
const erc20_1 = require("./cmds/erc20");
const program = new commander_1.Command();
program.description('A CLI for interacting with Web3 protocols');
program.version(package_json_1.default.version);
const spinner = new spinner_1.Spinner();
// Bootstrap repos
const accountRepo = new account_1.AccountRepo(stores_1.store);
const configRepo = new config_1.ConfigRepo(stores_1.store);
// Bootstrap account command
const accountCmd = new account_2.AccountCmd(accountRepo, spinner);
const configCmd = new config_2.ConfigCmd(configRepo, spinner);
const oneInchCmd = new _1inch_1.OneInchCmd(accountRepo, configRepo, spinner);
const erc20Cmd = new erc20_1.Erc20Cmd(accountRepo, spinner);
program.addCommand(accountCmd.getCmdInstance());
program.addCommand(configCmd.getCmdInstance());
program.addCommand(oneInchCmd.getCmdInstance());
program.addCommand(erc20Cmd.getCmdInstance());
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield stores_1.store.ready();
        yield program.parseAsync();
        yield stores_1.store.close();
    });
}
main();
process.on('unhandledRejection', (error) => {
    spinner.fail('Something went wrong');
    console.error(error);
});
