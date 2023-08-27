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
exports.Erc20Cmd = void 0;
const commander_1 = require("commander");
const ERC20_json_1 = require("../../abis/ERC20.json");
const chain_info_1 = __importDefault(require("../../entities/chain-info"));
const ethers_1 = require("ethers");
const MulticallWrapper_1 = require("../../wrappers/MulticallWrapper");
class Erc20Cmd {
    constructor(accountRepo, spinner) {
        this.accountRepo = accountRepo;
        this.spinner = spinner;
        this.cmd = new commander_1.Command('erc20');
        this.cmd.description('Interact with ERC20 tokens');
        this.cmd
            .command('transfer')
            .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
            .requiredOption('-t, --token <tokenAddress>', 'Token address')
            .requiredOption('-a, --amount <amount>', 'The amount to transfer', parseFloat)
            .requiredOption('-to, --to <toAddress>', 'The address to transfer to')
            .requiredOption('-s, --signer <signerLabel>', 'Signer to execute a transaction')
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            const chain = chain_info_1.default[opts.chainId];
            const signer = new ethers_1.ethers.Wallet((yield this.accountRepo.getAccountByLabel(opts.signer)).key, chain.jsonRpcProvider);
            const multicallWrapper = new MulticallWrapper_1.MulticallWrapper('0xcA11bde05977b3631167028862bE2a173976CA11', chain.jsonRpcProvider);
            const token = new ethers_1.ethers.Contract(opts.token, ERC20_json_1.abi, signer);
            const tokenInfo = yield multicallWrapper.multiContractCall([
                { contract: token, function: 'symbol' },
                { contract: token, function: 'decimals' },
            ]);
            spinner.start(`Transferring ${opts.amount} ${tokenInfo[0]} to ${opts.to}`);
            const tx = yield token.transfer(opts.to, ethers_1.ethers.utils.parseUnits(opts.amount.toString(), tokenInfo[1]));
            spinner.info(`⛓️ Tx hash: ${tx.hash}, waiting for confirmation`);
            yield tx.wait(3);
            spinner.succeed(`Transfer ${opts.amount} ${tokenInfo[0]} to ${opts.to} succeeded`);
        }));
    }
    getCmdInstance() {
        return this.cmd;
    }
}
exports.Erc20Cmd = Erc20Cmd;
