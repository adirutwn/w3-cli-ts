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
exports.NativeCmd = void 0;
const commander_1 = require("commander");
const chain_info_1 = __importDefault(require("../../entities/chain-info"));
const ethers_1 = require("ethers");
class NativeCmd {
    constructor(accountRepo, spinner) {
        this.accountRepo = accountRepo;
        this.spinner = spinner;
        this.cmd = new commander_1.Command('native');
        this.cmd.description('Interact with a native token');
        this.cmd
            .command('transfer')
            .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
            .requiredOption('-a, --amount <amount>', 'The amount to transfer', parseFloat)
            .requiredOption('-to, --to <toAddress>', 'The address to transfer to')
            .requiredOption('-s, --signer <signerLabel>', 'Signer to execute a transaction')
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            const chain = chain_info_1.default[opts.chainId];
            const signer = new ethers_1.ethers.Wallet((yield this.accountRepo.getAccountByLabel(opts.signer)).key, chain.jsonRpcProvider);
            spinner.start(`Transferring ${opts.amount} ${chain.nativeSymbol} to ${opts.to}`);
            const tx = yield signer.sendTransaction({ to: opts.to, value: ethers_1.ethers.utils.parseEther(opts.amount.toString()) });
            spinner.info(`⛓️ Tx hash: ${tx.hash}, waiting for confirmation`);
            yield tx.wait(3);
            spinner.succeed(`Transferred ${opts.amount} ${chain.nativeSymbol} to ${opts.to} succeeded`);
        }));
    }
    getCmdInstance() {
        return this.cmd;
    }
}
exports.NativeCmd = NativeCmd;
