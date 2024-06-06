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
exports.importQ = exports.importQName = void 0;
const Queue = require("bull");
const redisClient_1 = require("../utils/redisClient");
const job_1 = require("./job");
exports.importQName = "fhir-import-queue";
exports.importQ = Queue(exports.importQName, { createClient: () => (0, redisClient_1.getRedisClient)() });
// Process jobs from the queue
exports.importQ.process((jobArgs) => __awaiter(void 0, void 0, void 0, function* () {
    const jobInstance = new job_1.Job(jobArgs);
    return yield jobInstance.asyncDoTask();
}));
//# sourceMappingURL=queue.js.map