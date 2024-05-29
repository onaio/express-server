import express from 'express';
import multer from 'multer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { ResourceUploadCode, getAllTemplateFilePaths, getTemplateFilePath } from './utils';
import AdmZip from 'adm-zip';
import { getTemporalioClient } from './temporalioClient';



const importerRouter = express.Router();
const upload = multer({ dest: '/tmp/csvUploads' });

// Sample data
const list = ['item1', 'item2', 'item3'];
const object = { slug: 'objectData' };
const workflowIds = ['workflow1', 'workflow2', 'workflow3'];

// Handle GET requests on `` that returns a list
importerRouter.get('/', async(req, res) => {
  const client = await getTemporalioClient()
  const wkFlowExecutionsResponse = await client.workflowService.listWorkflowExecutions({
    namespace: "default" // TODO - configurable?
  })
  const wkFlowExecutions = wkFlowExecutionsResponse.executions

  /**
   * {
    execution: WorkflowExecution {
      workflowId: '1716815834524',
      runId: 'c4a686e7-d401-441b-a9a4-672ba40799e5'
    },
    type: WorkflowType { name: 'UploadWorkflowManager' },
    startTime: Timestamp { seconds: [Long], nanos: 527906000 },
    closeTime: Timestamp { seconds: [Long], nanos: 450848000 },
    status: 5,
    historyLength: Long { low: 5, high: 0, unsigned: false },
    executionTime: Timestamp { seconds: [Long], nanos: 527906000 },
    memo: Memo { fields: {} },
    taskQueue: 'user_upload',
    historySizeBytes: Long { low: 2546, high: 0, unsigned: false }
  }
   */
  res.json(list);
});


// Handle GET requests to `/templates` that returns a folder zip of empty CSV resource files or a zip of a single resource file
importerRouter.get('/templates', async (req, res) => {
  const uploadCodeTemplate = req.query.resourceTemplate;

  if (typeof uploadCodeTemplate === "string") {
    // Send a single template file
    const templatePath = getTemplateFilePath(uploadCodeTemplate as ResourceUploadCode) ?? ""
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
importerRouter.get('/:slug', async (req, res) => {
  const wkFlowId = req.params.slug
  const client = await getTemporalioClient()
  const wkFlowExecutionsResponse = await client.workflowService.listWorkflowExecutions({
    namespace: "default", // TODO - configurable?,
    query: `WorkflowId="${wkFlowId}"`
  })
  // maybe create a util function that parses the execution response.
});

// Handle POST request to `` that receives several CSV files and returns a list of workflow IDs
importerRouter.post('/', upload.any(), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  console.log('Received CSV files:', files);
  /**
   * [
  {
    fieldname: 'users',
    originalname: 'users.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    destination: '/tmp/csvUploads',
    filename: 'd19dbc63a32ca4427caf84251e2ef35f',
    path: '/tmp/csvUploads/d19dbc63a32ca4427caf84251e2ef35f',
    size: 468
  }
]
   */

  const workflowArgs = files?.map(file => ({
    workflow_name: file.fieldname,
    file_path: file.path
  }))

  // initiate workflows here.
  const client = await getTemporalioClient()
  client.start("UploadWorkflowManager", { workflowId: Date.now().toString(), taskQueue: "user_upload", args: workflowArgs })

  res.json({});
});



export { importerRouter }
