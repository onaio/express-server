import concurrent.futures

from temporalio.client import Client
from temporalio.worker import Worker
from workflows import UploadWorkflowManager, UploadUsersWorkflow, UploadOrganizationsWorkflow, UploadLocationsWorkflow, UploadOrgToLocationAssignmentsWorkflow
from activities import read_csv_file_haba_haba, post_put_keycloak_user, post_put_keycloak_user_resources, read_csv_full, \
    get_uuid, WorkflowStatusCheck
import asyncio


async def main():
    client = await Client.connect("localhost:7233", namespace="default")
    workflow_status_check = WorkflowStatusCheck(client)

    worker = Worker(client, task_queue="efsity-importer", workflows=[UploadWorkflowManager, UploadUsersWorkflow, UploadOrganizationsWorkflow, UploadLocationsWorkflow, UploadOrgToLocationAssignmentsWorkflow], activities=[read_csv_file_haba_haba, post_put_keycloak_user, post_put_keycloak_user_resources, read_csv_full, get_uuid, workflow_status_check.is_workflow_running], activity_executor=concurrent.futures.ThreadPoolExecutor())
    print("Starting the worker...")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
