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
exports.importerRouter = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const utils_1 = require("./utils");
const adm_zip_1 = __importDefault(require("adm-zip"));
const queue_1 = require("./queue");
const importerConfigWriter_1 = require("./utils/importerConfigWriter");
const crypto_1 = require("crypto");
const importerRouter = express_1.default.Router();
exports.importerRouter = importerRouter;
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const folderPath = `/tmp/csvUploads/${uniqueSuffix}`;
            if (!fs_1.default.existsSync(folderPath)) {
                yield (0, promises_1.mkdir)(folderPath, { recursive: true });
            }
            cb(null, folderPath);
        });
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage: storage });
// Middleware function to check for session
const sessionChecker = (req, res, next) => {
    if (!req.session.preloadedState) {
        return res.json({ error: 'Not authorized' });
        // next()
    }
    else {
        next();
    }
};
// Handle GET requests on `` that returns a list
importerRouter.get('/', sessionChecker, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const jobs = yield queue_1.importQ.getJobs();
    const returnData = [];
    for (const job of jobs) {
        const rtn_Val = yield (0, utils_1.parseJobResponse)(job);
        returnData.push(rtn_Val);
    }
    res.json(returnData.sort((a, b) => {
        const diff = b.dateCreated - a.dateCreated;
        return diff === 0 ? 0 : diff > 0 ? 1 : -1;
    }));
}));
// Handle GET requests to `/templates` that returns a folder zip of empty CSV resource files or a zip of a single resource file
importerRouter.get('/templates', sessionChecker, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const uploadCodeTemplate = req.query.resourceTemplate;
    if (typeof uploadCodeTemplate === "string") {
        // Send a single template file
        const templatePath = (_a = (0, utils_1.getTemplateFilePath)(uploadCodeTemplate)) !== null && _a !== void 0 ? _a : "";
        if (fs_1.default.existsSync(templatePath)) {
            res.download(templatePath);
        }
        else {
            res.status(404).send('Template not found');
        }
    }
    else {
        const allTemplatePaths = (0, utils_1.getAllTemplateFilePaths)();
        // Send all templates as a ZIP file
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=templates.zip');
        const zip = new adm_zip_1.default();
        allTemplatePaths.forEach(filePath => {
            const content = fs_1.default.readFileSync(filePath);
            zip.addFile(path_1.default.basename(filePath), content);
        });
        const zipBuffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename=files.zip');
        res.set('Content-Length', `${zipBuffer.length}`);
        res.send(zipBuffer);
    }
}));
// Handle GET requests on `/slug` that returns an object
importerRouter.get('/:slug', sessionChecker, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const wkFlowId = req.params.slug;
    const job = yield queue_1.importQ.getJob(wkFlowId);
    const rtn_Val = yield (0, utils_1.parseJobResponse)(job);
    res.json(rtn_Val);
    return {};
    // maybe create a util function that parses the execution response.
}));
// Handle POST request to `` that receives several CSV files and returns a list of workflow IDs
importerRouter.post('/', sessionChecker, upload.any(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const files = req.files;
    console.log('Received CSV files:', files);
    console.log("===================>", req.session);
    // TODO - move creating file to be middleware after authenticating
    const accessToken = (_e = (_d = (_c = (_b = req.session.preloadedState) === null || _b === void 0 ? void 0 : _b.session) === null || _c === void 0 ? void 0 : _c.extraData) === null || _d === void 0 ? void 0 : _d.oAuth2Data) === null || _e === void 0 ? void 0 : _e.access_token;
    const refreshToken = (_j = (_h = (_g = (_f = req.session.preloadedState) === null || _f === void 0 ? void 0 : _f.session) === null || _g === void 0 ? void 0 : _g.extraData) === null || _h === void 0 ? void 0 : _h.oAuth2Data) === null || _j === void 0 ? void 0 : _j.refresh_token;
    const user = (_m = (_l = (_k = req.session.preloadedState) === null || _k === void 0 ? void 0 : _k.session) === null || _l === void 0 ? void 0 : _l.user) === null || _m === void 0 ? void 0 : _m.username;
    const importerConfig = (0, importerConfigWriter_1.generateImporterSCriptConfig)(accessToken, refreshToken);
    yield (0, importerConfigWriter_1.writeImporterScriptConfig)(importerConfig);
    const uploadId = (0, crypto_1.randomUUID)();
    const workflowArgs = files === null || files === void 0 ? void 0 : files.map(file => {
        const jobId = `${uploadId}_${file.fieldname}`;
        return {
            workflowType: file.fieldname,
            filePath: file.path,
            workflowId: jobId,
            author: user
        };
    });
    const addedJobs = [];
    for (const arg of workflowArgs !== null && workflowArgs !== void 0 ? workflowArgs : []) {
        // TODO - make 10 configurable or at least a magic string
        const job = yield queue_1.importQ.add(arg, {
            jobId: arg.workflowId,
            removeOnComplete: { age: 1 * 24 * 60 * 60 },
            removeOnFail: { age: 1 * 24 * 60 * 60 },
            author: user
        });
        addedJobs.push(job);
    }
    // TODO -dry
    const returnData = [];
    for (const job of addedJobs) {
        const rtn_Val = yield (0, utils_1.parseJobResponse)(job);
        returnData.push(rtn_Val);
    }
    res.json(returnData.sort((a, b) => {
        const diff = b.dateCreated - a.dateCreated;
        return diff === 0 ? 0 : diff > 0 ? 1 : -1;
    }));
}));
//# sourceMappingURL=index.js.map