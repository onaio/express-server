import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';
import { Job as BullJob } from 'bull';
import { getImportQueue, BullQ } from './helpers/queue';
import {
  getAllTemplateFilePaths,
  getTemplateFilePath,
  JobData,
  parseJobResponse,
  StrPartsSep,
  UploadWorkflowTypes,
  validateWorkflowArgs,
} from './helpers/utils';
import { importRouterErrorhandler, redisRequiredMiddleWare, sessionChecker } from './helpers/middleware';
import { A_DAY } from '../../constants';
import { EXPRESS_TEMP_CSV_FILE_STORAGE } from '../../configs/envs';

const importerRouter = express.Router();
const importQ = getImportQueue() as BullQ;

const storage = multer.diskStorage({
  async destination(_, __, cb) {
    const uniqueSuffix = `${Date.now()}`;
    const folderPath = `${EXPRESS_TEMP_CSV_FILE_STORAGE}/${uniqueSuffix}`;
    if (!fs.existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename(req, file, cb) {
    const newFileName = `${Math.round(Math.random() * 1e9)}${StrPartsSep}${file.originalname}`;
    cb(null, newFileName);
  },
});

const upload = multer({ storage });

importerRouter.use(sessionChecker);
importerRouter.use(redisRequiredMiddleWare);

importerRouter.get('/', sessionChecker, async (req, res) => {
  const jobs = await importQ.getJobs([]);
  const returnData = await Promise.all(jobs.map((job) => parseJobResponse(job)));
  res.json(
    returnData.sort((a, b) => {
      const diff = b.dateCreated - a.dateCreated;
      /* eslint-disable-next-line no-nested-ternary */
      return diff === 0 ? 0 : diff > 0 ? 1 : -1;
    }),
  );
});

importerRouter.get('/templates', async (req, res) => {
  const uploadCodeTemplate = req.query.resourceTemplate;

  if (typeof uploadCodeTemplate === 'string') {
    // Send a single template file
    const templatePath = getTemplateFilePath(uploadCodeTemplate as UploadWorkflowTypes) ?? '';
    if (fs.existsSync(templatePath)) {
      res.download(templatePath);
    } else {
      res.status(404).send('Template not found');
    }
  } else {
    const allTemplatePaths = getAllTemplateFilePaths();
    // Send all templates as a ZIP file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=templates.zip');

    const zip = new AdmZip();
    allTemplatePaths.forEach((filePath) => {
      const content = fs.readFileSync(filePath);
      zip.addFile(path.basename(filePath), content);
    });

    const zipBuffer = zip.toBuffer();

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=files.zip');
    res.set('Content-Length', `${zipBuffer.length}`);
    res.send(zipBuffer);
  }
});

importerRouter.get('/:slug', async (req, res) => {
  const wkFlowId = req.params.slug;

  const job = await importQ.getJob(wkFlowId);
  if (job) {
    const rtnVal = await parseJobResponse(job);
    res.json(rtnVal);
    return;
  }
  res.status(404).send({ message: `Workflow with id ${wkFlowId} was not found` });
});

importerRouter.post('/', upload.any(), async (req, res, next) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const user = req.session.preloadedState?.session?.user?.username;

  const { productListId, inventoryListId } = req.query;

  const uploadId = randomUUID();
  const workflowArgs =
    files?.map((file) => {
      const jobId = `${uploadId}_${file.fieldname}`;
      return {
        workflowType: file.fieldname,
        filePath: file.path,
        workflowId: jobId,
        author: user,
        accessToken: req.session.preloadedState?.session?.extraData?.oAuth2Data?.access_token,
        refreshToken: req.session.preloadedState?.session?.extraData?.oAuth2Data?.refresh_token,
        productListId,
        inventoryListId,
      } as JobData;
    }) ?? [];

  try {
    validateWorkflowArgs(workflowArgs);
  } catch (err) {
    next(err);
    return;
  }

  const addedJobs: BullJob[] = await Promise.all(
    workflowArgs.map((arg) =>
      importQ.add(arg, {
        jobId: arg.workflowId,
        removeOnComplete: { age: A_DAY },
        removeOnFail: { age: A_DAY },
      }),
    ),
  );

  const returnData = await Promise.all(addedJobs.map((job) => parseJobResponse(job)));
  res.json(
    returnData.sort((a, b) => {
      const diff = b.dateCreated - a.dateCreated;
      /* eslint-disable-next-line no-nested-ternary */
      return diff === 0 ? 0 : diff > 0 ? 1 : -1;
    }),
  );
});

importerRouter.use(importRouterErrorhandler);

export { importerRouter };
