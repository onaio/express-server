import json

from temporalio.client import Client
from temporalio.worker import Worker
from workflows import UploadUsersWorkflow, UploadWorkflowManager
import asyncio
import os


csv_file = os.path.join(os.getcwd(), "users.csv")
print(csv_file)
async def main():
    client = await Client.connect("localhost:7233", namespace="default")

    input_data = json.dumps([{"workflow_name": "UploadOrgToLocationAssignmentsWorkflow", "file_path": "/tmp/csvUploads/d19dbc63a32ca4427caf84251e2ef35f"}])

    handle = await client.start_workflow('UploadWorkflowManager', input_data, task_queue="efsity-importer", id="efsity-importer-built-in")
    print("Starting the worker...")
    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")

    result = await handle.result()

    print(f"Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())
