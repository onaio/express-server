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
exports.dependencyGraph = exports.parseJobResponse = exports.isString = exports.getAllTemplateFilePaths = exports.getTemplateFilePath = exports.resourceUploadCodeToTemplatePathLookup = exports.UploadWorkflowTypes = exports.templatesFolder = exports.importerSourceFilePath = void 0;
const path_1 = __importDefault(require("path"));
exports.importerSourceFilePath = path_1.default.resolve(__dirname, "../../../fhir-tooling");
exports.templatesFolder = path_1.default.resolve(exports.importerSourceFilePath, "csv");
var UploadWorkflowTypes;
(function (UploadWorkflowTypes) {
    UploadWorkflowTypes["Locations"] = "locations";
    UploadWorkflowTypes["Organizations"] = "organizations";
    UploadWorkflowTypes["Inventory"] = "Inventory";
    UploadWorkflowTypes["Product"] = "products";
    // productImage = "productImages",
    UploadWorkflowTypes["Users"] = "users";
    UploadWorkflowTypes["Careteams"] = "careteams";
    UploadWorkflowTypes["orgToLocationAssignment"] = "orgToLocationAssignment";
    UploadWorkflowTypes["userToOrganizationAssignment"] = "userToOrganizationAssignment";
})(UploadWorkflowTypes = exports.UploadWorkflowTypes || (exports.UploadWorkflowTypes = {}));
// TODO - fix this paths. also be defensive if things change underneath.
exports.resourceUploadCodeToTemplatePathLookup = {
    [UploadWorkflowTypes.Users]: path_1.default.resolve(exports.templatesFolder, "users.csv"),
    [UploadWorkflowTypes.Organizations]: path_1.default.resolve(exports.templatesFolder, "organizations/organizations_full.csv"),
    [UploadWorkflowTypes.Locations]: path_1.default.resolve(exports.templatesFolder, "locations/locations_full.csv"),
    [UploadWorkflowTypes.Careteams]: path_1.default.resolve(exports.templatesFolder, "careteams/careteam_full.csv"),
    [UploadWorkflowTypes.Product]: path_1.default.resolve(exports.templatesFolder, "import/product.csv"),
    [UploadWorkflowTypes.Inventory]: path_1.default.resolve(exports.templatesFolder, "import/inventory.csv"),
    [UploadWorkflowTypes.orgToLocationAssignment]: path_1.default.resolve(exports.templatesFolder, "organizations/organizations_locations.csv"),
    [UploadWorkflowTypes.userToOrganizationAssignment]: path_1.default.resolve(exports.templatesFolder, "practitioners/users_organizations.csv"),
    // [UploadWorkflowTypes.productImage]: path.resolve(templatesFolder, "organizations/organizations_locations.csv"),
};
// 
/** function given a resource upload code returns the template name */
function getTemplateFilePath(resourceUploadCode) {
    return exports.resourceUploadCodeToTemplatePathLookup[resourceUploadCode];
}
exports.getTemplateFilePath = getTemplateFilePath;
function getAllTemplateFilePaths() {
    return Object.values(exports.resourceUploadCodeToTemplatePathLookup);
}
exports.getAllTemplateFilePaths = getAllTemplateFilePaths;
/* Checks if a variable is of type string.
* @param value - The variable to check.
* @returns True if the variable is a string, false otherwise.
*/
function isString(value) {
    return typeof value === 'string' || value instanceof String;
}
exports.isString = isString;
function parseJobResponse(job) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const status = yield job.getState();
        const jobData = job.data;
        const { workflowType, filePath, author } = jobData;
        const filename = filePath ? path_1.default.posix.basename(filePath) : "";
        let statusReason;
        if (status === "failed") {
            try {
                statusReason = JSON.parse((_a = job.failedReason) !== null && _a !== void 0 ? _a : "{}");
            }
            catch (_b) {
                statusReason = { stderr: job.failedReason, stdout: "" };
            }
        }
        if (status === "completed") {
            statusReason = job.returnvalue;
        }
        return {
            workflowId: job.id,
            status,
            workflowType,
            dateCreated: job.timestamp,
            dateStarted: job.processedOn,
            dateEnded: job.finishedOn,
            statusReason,
            filename,
            author,
        };
    });
}
exports.parseJobResponse = parseJobResponse;
exports.dependencyGraph = {
    [UploadWorkflowTypes.orgToLocationAssignment]: [UploadWorkflowTypes.Organizations, UploadWorkflowTypes.Locations],
    [UploadWorkflowTypes.userToOrganizationAssignment]: [UploadWorkflowTypes.Users, UploadWorkflowTypes.Organizations],
    [UploadWorkflowTypes.Inventory]: [UploadWorkflowTypes.Product],
};
//# sourceMappingURL=utils.js.map