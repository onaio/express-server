"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const envs_1 = require("./configs/envs");
const winston_1 = require("./configs/winston");
const PORT = envs_1.EXPRESS_PORT || 3000;
const server = app_1.default.listen(PORT, () => {
    // log every time app starts
    winston_1.winstonLogger.info(`App listening on port ${PORT}!`);
});
exports.default = server;
//# sourceMappingURL=index.js.map