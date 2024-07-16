import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import { getAllTemplateFilePaths, getTemplateFilePath, parseJobResponse } from './utils';
import AdmZip from 'adm-zip';
import { importQ } from './queue';
import { randomUUID } from 'crypto';
import {Job as BullJob} from 'bull';
import { redisRequiredMiddleWare, sessionChecker, writeImporterConfigMiddleware } from './middleware';
import { A_DAY } from '../../constants';
import { EXPRESS_TEMP_CSV_FILE_STORAGE } from '../../configs/envs';

const importerRouter = express.Router();

const storage = multer.diskStorage({
  destination: async function (_, __, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const folderPath = `${EXPRESS_TEMP_CSV_FILE_STORAGE}/${uniqueSuffix}`
    if (!fs.existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true })
    }
    cb(null, folderPath)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage });

importerRouter.use(redisRequiredMiddleWare);

importerRouter.get('/', sessionChecker, async (req, res) => {
  const jobs = await importQ.getJobs([]);
  const returnData = []
  for (const job of jobs) {
    const rtn_Val = await parseJobResponse(job);
    returnData.push(rtn_Val);
  }
  res.json(returnData.sort((a, b) => {
    const diff = b.dateCreated - a.dateCreated
    return diff === 0 ? 0 : diff > 0 ? 1 : -1
  }))
});


importerRouter.get('/templates', sessionChecker, async (req, res) => {
  const uploadCodeTemplate = req.query.resourceTemplate;

  if (typeof uploadCodeTemplate === "string") {
    // Send a single template file
    const templatePath = getTemplateFilePath(uploadCodeTemplate as any) ?? ""
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
    allTemplatePaths.forEach(filePath => {
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


importerRouter.get('/:slug', sessionChecker, async (req, res) => {
  const wkFlowId = req.params.slug

  const job = await importQ.getJob(wkFlowId);
  if(job){
    const rtn_Val = await parseJobResponse(job);
    res.json(rtn_Val)
    return
  }
  res.status(401).send({message: `Workflow with id ${wkFlowId} was not found`})
});

importerRouter.post('/', sessionChecker, writeImporterConfigMiddleware, upload.any(), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const user = req.session.preloadedState?.session?.user?.username

  const uploadId = randomUUID()
  const workflowArgs = files?.map(file => {
    const jobId = `${uploadId}_${file.fieldname}`
    return {
      workflowType: file.fieldname,
      filePath: file.path,
      workflowId: jobId,
      author: user
    }
  })

  const addedJobs: BullJob[] = []
  for (const arg of workflowArgs ?? []){
    const job = await importQ.add(arg, {
      jobId: arg.workflowId,
      removeOnComplete: {age: A_DAY},
      removeOnFail: {age: A_DAY},
    })
    addedJobs.push(job)
  }

  const returnData = []
  for (const job of addedJobs) {
    const rtn_Val = await parseJobResponse(job);
    returnData.push(rtn_Val);
  }
  res.json(returnData.sort((a, b) => {
    const diff = b.dateCreated - a.dateCreated
    return diff === 0 ? 0 : diff > 0 ? 1 : -1
  }))
});

export { importerRouter }
