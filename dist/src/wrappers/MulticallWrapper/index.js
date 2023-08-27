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
exports.MulticallWrapper = void 0;
const ethers_1 = require("ethers");
const Multicall3_json_1 = require("../../abis/Multicall3.json");
class MulticallWrapper {
    constructor(_multicallAddress, _signerOrProvider) {
        this.multicallInstance = new ethers_1.ethers.Contract(_multicallAddress, Multicall3_json_1.abi, _signerOrProvider);
    }
    multiContractCall(calls, contractCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let blockNumber = undefined;
            if (contractCallOptions)
                blockNumber = contractCallOptions.blockNumber;
            return this._multiCall(calls, blockNumber);
        });
    }
    _multiCall(calls, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const calldata = calls.map((call) => {
                    return {
                        target: call.contract.address.toLowerCase(),
                        callData: call.contract.interface.encodeFunctionData(call.function, call.params),
                    };
                });
                const { returnData } = (yield this.multicallInstance.callStatic.aggregate(calldata, {
                    blockTag: blockNumber,
                }));
                const res = returnData.map((call, i) => {
                    const result = calls[i].contract.interface.decodeFunctionResult(calls[i].function, call);
                    if (result.length === 1)
                        return result[0];
                    return result;
                });
                return res;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
}
exports.MulticallWrapper = MulticallWrapper;
