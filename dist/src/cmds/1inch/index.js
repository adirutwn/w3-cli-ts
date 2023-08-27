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
exports.OneInchCmd = void 0;
const commander_1 = require("commander");
const time_1 = require("../../utils/time");
const chain_info_1 = __importDefault(require("../../entities/chain-info"));
const ethers_1 = require("ethers");
const ERC20_json_1 = require("../../abis/ERC20.json");
const MulticallWrapper_1 = require("../../wrappers/MulticallWrapper");
const _1inchWrapper_1 = require("../../wrappers/1inchWrapper");
class OneInchCmd {
    constructor(accountRepo, configRepo, spinner) {
        this.accountRepo = accountRepo;
        this.configRepo = configRepo;
        this.spinner = spinner;
        this.cmd = new commander_1.Command('1inch');
        this.cmd.description('Swap tokens on 1inch');
        this.cmd
            .command('twap')
            .requiredOption('-c, --chain-id <chainId>', 'Chain ID', parseInt)
            .requiredOption('-ft, --fromToken <fromTokenAddress>', 'The token to swap from')
            .requiredOption('-tt, --toToken <toTokenAddress>', 'The token to swap to')
            .requiredOption('-a, --amount <amount>', 'The amount to swap', parseFloat)
            .requiredOption('-s, --signer <signerLabel>', 'Signer to execute a transaction')
            .action((opts) => __awaiter(this, void 0, void 0, function* () {
            const chain = chain_info_1.default[opts.chainId];
            const signer = new ethers_1.ethers.Wallet((yield this.accountRepo.getAccountByLabel(opts.signer)).key, chain.jsonRpcProvider);
            const signerAddress = yield signer.getAddress();
            const fromToken = new ethers_1.ethers.Contract(opts.fromToken, ERC20_json_1.abi, signer);
            const toToken = new ethers_1.ethers.Contract(opts.toToken, ERC20_json_1.abi, signer);
            const multicallWrapper = new MulticallWrapper_1.MulticallWrapper('0xcA11bde05977b3631167028862bE2a173976CA11', signer);
            const oneInchKey = (yield this.configRepo.getConfigByKey('1INCH_API_KEY')).value;
            const oneInchWrapper = new _1inchWrapper_1.OneInchWrapper('https://api.1inch.dev/swap/v5.2', opts.chainId, multicallWrapper, signer, [], oneInchKey);
            const [fromTokenSymbol, fromDecimals, toTokenSymbol, toDecimals] = yield Promise.all([
                fromToken.symbol(),
                fromToken.decimals(),
                toToken.symbol(),
                toToken.decimals(),
            ]);
            const amountWei = ethers_1.ethers.utils.parseUnits(opts.amount.toString(), fromDecimals);
            console.log(`> Twapping ${opts.amount} ${fromTokenSymbol} -> ${toTokenSymbol} per tx`);
            console.log(`> Signer: ${signerAddress}`);
            // watch
            console.log(`> Running TWAP...`);
            while (1) {
                const [fromTokenBalance] = yield Promise.all([fromToken.balanceOf(signerAddress)]);
                const randFactor = true;
                if (randFactor) {
                    // If rand said sell, then swap
                    const swapAmount = fromTokenBalance.lt(amountWei) ? fromTokenBalance : amountWei;
                    try {
                        yield oneInchWrapper.swapExactTokensForTokens(fromToken.address, toToken.address, [], swapAmount, 25, 3);
                        console.log(`> 🟢 Done`);
                    }
                    catch (e) {
                        console.log(`> 🔴 Something wrong!`);
                        console.error(e);
                        console.log(`> 🟡 Retry in the next execution`);
                    }
                }
                else {
                    console.log(`> 🟡 Skip this execution`);
                }
                console.log(`> 🟡 Sleep for 15 minutes`);
                yield (0, time_1.sleep)(900000);
            }
        }));
    }
    getCmdInstance() {
        return this.cmd;
    }
}
exports.OneInchCmd = OneInchCmd;
