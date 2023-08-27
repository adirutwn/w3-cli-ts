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
exports.AccountRepo = void 0;
class AccountRepo {
    constructor(_store) {
        this.node = 'global/accounts';
        this.store = _store;
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store.ref(this.node).count();
        });
    }
    getAllAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = (yield this.store.ref(this.node).get()).val();
            return accounts;
        });
    }
    getAccountByIndex(index) {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.getAllAccounts();
            return accounts[index];
        });
    }
    getAccountByLabel(label) {
        return __awaiter(this, void 0, void 0, function* () {
            const matchedAccounts = yield this.store.ref(this.node).query().filter('label', '==', label).get();
            if (matchedAccounts.length == 0) {
                throw new Error(`Account with label ${label} not found`);
            }
            const val = matchedAccounts[0].val();
            if (val == null) {
                throw new Error(`Account with label ${label} not found`);
            }
            return val;
        });
    }
    addAccounts(accounts) {
        return __awaiter(this, void 0, void 0, function* () {
            const addedAccounts = yield this.getAllAccounts();
            if (addedAccounts != null) {
                for (const newAccount of accounts) {
                    const found = addedAccounts.find((account) => account.label == newAccount.label);
                    if (found) {
                        throw new Error(`Account with label ${newAccount.label} already exists`);
                    }
                }
            }
            yield this.store.ref(this.node).set(accounts);
        });
    }
}
exports.AccountRepo = AccountRepo;
