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
exports.OneInchWrapper = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const time_1 = require("../../utils/time");
const string_1 = require("../../utils/string");
const ERC20_json_1 = require("../../abis/ERC20.json");
class OneInchWrapper {
    constructor(_oneInchApiUrl, _chainId, _multiCallService, _signer, _protocols, _oneInchApiKey) {
        this.oneInchApiUrl = _oneInchApiUrl;
        this.signer = _signer;
        this.chainId = _chainId;
        this.multiCallService = _multiCallService;
        this.protocols = _protocols;
        this.oneInchApiKey = _oneInchApiKey;
    }
    spender() {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = yield axios_1.default.get(`${this.oneInchApiUrl}/${this.chainId}/approve/spender`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.oneInchApiKey}`,
                },
            });
            return raw.data;
        });
    }
    swapExactTokensForTokens(fromTokenAddress, toTokenAddress, path, amountWei, slippageBps, confirmation = 3, overrides) {
        return __awaiter(this, void 0, void 0, function* () {
            const fromToken = new ethers_1.ethers.Contract(fromTokenAddress, ERC20_json_1.abi, this.signer);
            const toToken = new ethers_1.ethers.Contract(toTokenAddress, ERC20_json_1.abi, this.signer);
            const signerAddress = yield this.signer.getAddress();
            const amountWeiBN = ethers_1.ethers.BigNumber.from(amountWei);
            let nonce = yield this.signer.getTransactionCount();
            if (overrides && overrides.nonce) {
                nonce = overrides.nonce;
            }
            console.log('-------------');
            console.log('> Getting 1inch router address...');
            const oneInchSpender = yield this.spender();
            console.log('> Delay 1.5 secs...');
            yield (0, time_1.sleep)(1500);
            console.log('> Loading all tokens info...');
            const [fromTokenSymbol, fromTokenDecimals, fromTokenAllowance, toTokenSymbol, toTokenDecimals, toBefore] = yield this.multiCallService.multiContractCall([
                {
                    contract: fromToken,
                    function: 'symbol',
                },
                {
                    contract: fromToken,
                    function: 'decimals',
                },
                {
                    contract: fromToken,
                    function: 'allowance',
                    params: [signerAddress, oneInchSpender.address],
                },
                {
                    contract: toToken,
                    function: 'symbol',
                },
                {
                    contract: toToken,
                    function: 'decimals',
                },
                {
                    contract: toToken,
                    function: 'balanceOf',
                    params: [signerAddress],
                },
            ]);
            console.log('> Done.');
            console.log(`> ${ethers_1.ethers.utils.formatUnits(amountWei, fromTokenDecimals)} ${fromTokenSymbol} -> ${toTokenSymbol}`);
            if ((0, string_1.equalIgnoreCase)(fromTokenAddress, toTokenAddress)) {
                console.log('> Same asset. No need swap.');
                return [
                    {
                        txHash: 'Same asset. No need swap',
                        fromTokenSymbol,
                        fromTokenDecimals,
                        fromTokenAmount: amountWeiBN,
                        toTokenSymbol,
                        toTokenDecimals,
                        toTokenAmount: 0,
                    },
                    nonce,
                ];
            }
            if (amountWeiBN.eq(0)) {
                console.log('> 0 balance. No need swap.');
                return [
                    {
                        txHash: '0 balance. No need swap',
                        fromTokenSymbol,
                        fromTokenDecimals,
                        fromTokenAmount: amountWeiBN,
                        toTokenSymbol,
                        toTokenDecimals,
                        toTokenAmount: 0,
                    },
                    nonce,
                ];
            }
            console.log('> Check if one inch swap contract has allowance');
            if (fromTokenAllowance.lt(amountWei)) {
                console.log('> Approve one inch swap contract');
                const approveTx = yield fromToken.approve(oneInchSpender.address, ethers_1.ethers.constants.MaxUint256, {
                    nonce: nonce++,
                });
                yield approveTx.wait(confirmation);
            }
            console.log('> Allowance ok');
            console.log('> Finding best price swap path through 1inch...');
            const oneInchData = (yield axios_1.default.get(`${this.oneInchApiUrl}/${this.chainId}/swap`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.oneInchApiKey}`,
                },
                params: {
                    fromTokenAddress,
                    toTokenAddress,
                    amount: amountWeiBN.toString(),
                    fromAddress: signerAddress,
                    slippage: ethers_1.ethers.utils.formatUnits(slippageBps, 2),
                    protocols: this.protocols.length > 0 ? this.protocols.join(',') : null,
                },
            })).data;
            console.log('> Delay 1.5 secs...');
            yield (0, time_1.sleep)(1500);
            const tx = {
                from: oneInchData.tx.from,
                to: oneInchData.tx.to,
                data: oneInchData.tx.data,
                gasLimit: oneInchData.tx.gas,
                gasPrice: parseInt(oneInchData.tx.gasPrice),
                nonce: nonce++,
            };
            const swapTx = yield this.signer.sendTransaction(tx);
            console.log('> Sent swap transaction successfully');
            console.log(`> Waiting for ${confirmation} confirmation...`);
            const swapTxReceipt = yield swapTx.wait(confirmation);
            let toAfter = yield toToken.balanceOf(signerAddress);
            if (swapTxReceipt.status === 1) {
                console.log('> ✅ Swap successfully');
                let receivedAmount = toAfter.sub(toBefore);
                console.log('> ⛓ Tx hash:', swapTx.hash);
                // Recalculate received amount if receivedAmount is less than 0
                // as receivedAmount should always be greater than 0
                while (receivedAmount.lt(0)) {
                    console.log(`> ⚠️ Received amount is less than 0. Retry...`);
                    console.log(`> ${toBefore} -> ${toAfter}`);
                    toAfter = yield toToken.balanceOf(signerAddress);
                    receivedAmount = toAfter.sub(toBefore);
                    if (receivedAmount.lt(0)) {
                        console.log('> ⏳ Waiting for 1 second to recalculate received amount');
                        (0, time_1.sleep)(1000);
                    }
                }
                console.log(`> ${ethers_1.ethers.utils.formatUnits(amountWei, fromTokenDecimals)} ${fromTokenSymbol} -> ${ethers_1.ethers.utils.formatUnits(receivedAmount, toTokenDecimals)} ${toTokenSymbol}`);
                return [
                    {
                        txHash: swapTx.hash,
                        fromTokenSymbol,
                        fromTokenDecimals,
                        fromTokenAmount: amountWeiBN,
                        toTokenSymbol,
                        toTokenDecimals,
                        toTokenAmount: receivedAmount,
                    },
                    nonce,
                ];
            }
            throw new Error('Swap failed');
        });
    }
    getSwapData(fromTokenAddress, toTokenAddress, amount, fromAddress, toAddress, slippage) {
        return __awaiter(this, void 0, void 0, function* () {
            const oneInchData = (yield axios_1.default.get(`${this.oneInchApiUrl}/${this.chainId}/swap`, {
                params: {
                    fromTokenAddress,
                    toTokenAddress,
                    amount: amount.toString(),
                    fromAddress: fromAddress,
                    toAddress: toAddress,
                    slippage: slippage.toString(),
                    disableEstimate: 'true', // skip
                },
            })).data;
            return oneInchData;
        });
    }
}
exports.OneInchWrapper = OneInchWrapper;
