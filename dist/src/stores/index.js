"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const acebase_1 = require("acebase");
const file_1 = require("../utils/file");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const storePath = path_1.default.join(os_1.default.homedir(), '.w3-cli', 'store');
// Make sure store directory exists
(0, file_1.ensureDirectoryExistence)(path_1.default.join(storePath, 'ballpark.json'));
const storeConfig = {
    logLevel: 'error',
    storage: { path: storePath },
    sponsor: true,
};
exports.store = new acebase_1.AceBase('w3-cli-store', storeConfig);
