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
exports.ConfigRepo = void 0;
class ConfigRepo {
    constructor(_store) {
        this.node = 'global/configs';
        this.store = _store;
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store.ref(this.node).count();
        });
    }
    getAllConfigs() {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = (yield this.store.ref(this.node).get()).val();
            return configs;
        });
    }
    getConfigByIndex(index) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.getAllConfigs();
            return accounts[index];
        });
    }
    getConfigByKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const matchedConfig = yield this.store.ref(this.node).query().filter('key', '==', key).get();
            if (matchedConfig.length == 0) {
                throw new Error(`Config with key ${key} not found`);
            }
            const val = matchedConfig[0].val();
            if (val == null) {
                throw new Error(`Config with key ${key} not found`);
            }
            return val;
        });
    }
    addConfigs(newConfigs) {
        return __awaiter(this, void 0, void 0, function* () {
            const addedConfigs = yield this.getAllConfigs();
            if (addedConfigs != null) {
                for (const newConfig of newConfigs) {
                    const found = addedConfigs.find((config) => config.key == newConfig.key);
                    if (found) {
                        throw new Error(`Config with key ${newConfig.key} already exists`);
                    }
                }
            }
            yield this.store.ref(this.node).set(newConfigs);
        });
    }
}
exports.ConfigRepo = ConfigRepo;
