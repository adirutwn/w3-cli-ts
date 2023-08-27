"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = void 0;
const ora_1 = __importDefault(require("ora"));
class Spinner {
    constructor(_spinner) {
        this.spinner = _spinner || (0, ora_1.default)({ spinner: 'dots' });
    }
    start(message) {
        if (this.spinner.isSpinning) {
            this.spinner.text = message || '';
            return;
        }
        this.spinner.start(message);
    }
    updateMessage(message) {
        if (this.spinner.isSpinning) {
            this.spinner.text = message;
            return;
        }
        this.spinner.start(message);
    }
    stop() {
        if (this.spinner.isSpinning) {
            this.spinner.stop();
        }
    }
    fail(message) {
        if (this.spinner.isSpinning) {
            this.spinner.fail(message);
        }
    }
    succeed(message) {
        if (this.spinner.isSpinning) {
            this.spinner.succeed(message);
        }
    }
    info(message) {
        this.spinner.info(message);
    }
    logInfo(message) {
        this.spinner.clear();
        this.spinner.frame();
        console.log(message);
    }
}
exports.Spinner = Spinner;
