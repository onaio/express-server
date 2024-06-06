import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import { getAllTemplateFilePaths, getTemplateFilePath, parseJobResponse } from './utils';
import AdmZip from 'adm-zip';
import { importQ } from './queue';
import { generateImporterSCriptConfig, writeImporterScriptConfig } from './utils/importerConfigWriter';
import { randomUUID } from 'crypto';
import {Job as BullJob} from 'bull';


const importerRouter = express.Router();
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const folderPath = `/tmp/csvUploads/${uniqueSuffix}`
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

// Middleware function to check for session
const sessionChecker = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.preloadedState) {
    return res.json({ error: 'Not authorized' });
    // next()
  }else{
    next()
  }
};

// Handle GET requests on `` that returns a list
importerRouter.get('/', sessionChecker, async (req, res) => {
  const jobs = await importQ.getJobs();
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


// Handle GET requests to `/templates` that returns a folder zip of empty CSV resource files or a zip of a single resource file
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


// Handle GET requests on `/slug` that returns an object
importerRouter.get('/:slug', sessionChecker, async (req, res) => {
  const wkFlowId = req.params.slug

  const job = await importQ.getJob(wkFlowId);
  const rtn_Val = await parseJobResponse(job);
  res.json(rtn_Val)
  return {}
  // maybe create a util function that parses the execution response.
});

// Handle POST request to `` that receives several CSV files and returns a list of workflow IDs
importerRouter.post('/', sessionChecker, upload.any(), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  console.log('Received CSV files:', files);
  console.log("===================>", req.session)
  // TODO - move creating file to be middleware after authenticating
  const accessToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.access_token;
  const refreshToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.refresh_token;
  const user = req.session.preloadedState?.session?.user?.username
  const importerConfig = generateImporterSCriptConfig(accessToken, refreshToken)
  await writeImporterScriptConfig(importerConfig)

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
    // TODO - make 10 configurable or at least a magic string
    const job = await importQ.add(arg, {
      jobId: arg.workflowId,
      removeOnComplete: {age: 1 * 24 * 60 * 60},
      removeOnFail: {age: 1 * 24 * 60 * 60},
      author: user
    })
    addedJobs.push(job)
  }
  // TODO -dry
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



