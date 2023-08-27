"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
exports.default = {
    1: {
        name: 'mainnet',
        rpcUrl: 'https://fragrant-thrumming-lambo.quiknode.pro/383dae13d13740257c17da722174e5b98f439dec/',
        jsonRpcProvider: new ethers_1.ethers.providers.JsonRpcProvider('https://fragrant-thrumming-lambo.quiknode.pro/383dae13d13740257c17da722174e5b98f439dec/'),
        nativeSymbol: 'ETH',
    },
    42161: {
        name: 'arbitrum',
        rpcUrl: 'https://aged-white-wind.arbitrum-mainnet.quiknode.pro/74ec5b20e4a4db94467209283c9b2ebcf9e1f95d/',
        jsonRpcProvider: new ethers_1.ethers.providers.JsonRpcProvider('https://aged-white-wind.arbitrum-mainnet.quiknode.pro/74ec5b20e4a4db94467209283c9b2ebcf9e1f95d/'),
        nativeSymbol: 'ETH',
    },
    421613: {
        name: 'arbitrum_goerli',
        rpcUrl: 'https://alpha-blue-sanctuary.arbitrum-goerli.quiknode.pro/8fd13280a9c42c24758efb893066856b6fcbe09b/',
        jsonRpcProvider: new ethers_1.ethers.providers.JsonRpcProvider('https://alpha-blue-sanctuary.arbitrum-goerli.quiknode.pro/8fd13280a9c42c24758efb893066856b6fcbe09b/'),
        nativeSymbol: 'ETH',
    },
};
