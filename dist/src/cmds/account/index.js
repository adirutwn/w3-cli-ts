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
exports.AccountCmd = void 0;
const commander_1 = require("commander");
const ethers_1 = require("ethers");
class AccountCmd {
    constructor(accountRepo, spinner) {
        this.accountRepo = accountRepo;
        this.spinner = spinner;
        this.cmd = new commander_1.Command('account');
        this.cmd.description('Add and remove key accounts');
        this.cmd
            .command('add')
            .requiredOption('-l, --label <label> Label to the adding account')
            .option('-k, --key <key> Key of the adding account')
            .action((options) => __awaiter(this, void 0, void 0, function* () {
            this.spinner.start(`Adding a new ${options.label} account`);
            let signer;
            if (!options.key) {
                // If key is not provided, create a random account
                signer = ethers_1.ethers.Wallet.createRandom();
                options.key = signer.privateKey;
            }
            else {
                // If key is provided, use it
                signer = new ethers_1.ethers.Wallet(options.key);
            }
            yield this.accountRepo.addAccounts([
                {
                    label: options.label,
                    address: signer.address,
                    key: options.key,
                },
            ]);
            this.spinner.succeed(`${options.label} has been added`);
        }));
        this.cmd.command('list').action(() => __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.accountRepo.getAllAccounts();
            console.table(accounts.map((account) => ({
                label: account.label,
                address: account.address,
                key: '*****',
            })));
        }));
    }
    getCmdInstance() {
        return this.cmd;
    }
}
exports.AccountCmd = AccountCmd;
