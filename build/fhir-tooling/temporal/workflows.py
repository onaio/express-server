import asyncio
import dataclasses

import temporalio.client
from temporalio import workflow
from temporalio.client import Client
from datetime import timedelta

from temporalio.exceptions import ApplicationError

from utils import get_TemporalClient

with workflow.unsafe.imports_passed_through():
    from activities import read_csv_file_haba_haba, post_put_keycloak_user, post_put_keycloak_user_resources, \
    read_csv_full, get_uuid, WorkflowStatusCheck
    from typing import List
    import uuid
    import json

from data_models.user import KeycloakUser


# updating users and organizations

@workflow.defn
class UploadUsersWorkflow:
    depends_on = []
    @workflow.run
    async def run(self, csvFilePath: str):
        file_iterator = await workflow.execute_activity(
            read_csv_file_haba_haba,
            csvFilePath,
            start_to_close_timeout=timedelta(seconds=5),
        )
        for (index, record) in enumerate(file_iterator):
            user_record = KeycloakUser.from_csv_record(**record)
            user_id = await workflow.execute_activity(
                post_put_keycloak_user,
                user_record,
                start_to_close_timeout=timedelta(seconds=5),
            )
            user_record.user_id = user_id
            # Do we need to separately set the password here.
            await workflow.execute_activity(
                post_put_keycloak_user_resources,
                user_record,
                start_to_close_timeout=timedelta(seconds=5)
            )
            # TODO - consider beating heart for progress tracking here.
        # Maybe push a fhir task resource.

@workflow.defn
class UploadOrganizationsWorkflow:
    depends_on = []
    @workflow.run
    async def run(self, csv_file_path: str):
        #
        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )
        # pass file data to uploader



@workflow.defn
class UploadCareTeamsWorkflow:
    depends_on = []
    @workflow.run
    async def run(self, csv_file_path: str):
        #
        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )
        # pass file data to uploader

@workflow.defn
class UploadUserToOrganizationAssignmentsWorkflow:
    depends_on = [UploadUsersWorkflow, UploadOrganizationsWorkflow]
    @workflow.run
    async def run(self, csv_file_path: str):
        #
        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )
        # pass file data to uploader



@workflow.defn
class UploadProductsWorkflow:
    depends_on = []
    @workflow.run
    async def run(self, csv_file_path: str):
        #
        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )
        # pass file data to uploader



@workflow.defn
class UploadInventoriesWorkflow:
    depends_on = [UploadProductsWorkflow]
    @workflow.run
    async def run(self, csv_file_path: str):
        #
        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )
        # pass file data to uploader



@workflow.defn
class UploadLocationsWorkflow:
    depends_on = []
    @workflow.run
    async def run(self, csv_file_path: str):
        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )

        # split into admin level groups
        # push locations synchronously.

@workflow.defn
class UploadOrgToLocationAssignmentsWorkflow:
    def __init__(self, **args):
        print(args)
    depends_on = [UploadOrganizationsWorkflow, UploadLocationsWorkflow]
    @workflow.run
    async def run(self, csv_file_path:str):
        # define a predictive way of setting the workflow id. <same uuid per upload>-<workflow-type>
        this_workflow_id_uuid = workflow.info().workflow_id.split("_")[1]
        should_proceed = True
        while not should_proceed:
            dependency_met = []
            # client = await Client.connect("localhost:7233", namespace="default")
            for parent in UploadOrgToLocationAssignmentsWorkflow.depends_on:
                parent_workflow_id = f"%{this_workflow_id_uuid}_{parent.__name__}"
                status = await workflow.execute_activity_method(WorkflowStatusCheck.is_workflow_running,
                                                                parent_workflow_id,
                                                                start_to_close_timeout=timedelta(seconds=5))
                if [temporalio.client.WorkflowExecutionStatus.TERMINATED,
                    temporalio.client.WorkflowExecutionStatus.CANCELED,
                    temporalio.client.WorkflowExecutionStatus.FAILED].__contains__(status):
                    raise ApplicationError("Dependent workflow failed")
                dependency_met.__add__(status == temporalio.client.WorkflowExecutionStatus.COMPLETED)
            for status in dependency_met:
                should_proceed = should_proceed and status
            asyncio.sleep(60000)

        file_data = await workflow.execute_activity(
            read_csv_full,
            csv_file_path,
            start_to_close_timeout=timedelta(seconds=5)
        )

#
# uploadDependencyGraph = {
#     UploadLocationsWorkflow: None,
#     UploadOrgToLocationAssignmentsWorkflow: [UploadOrganizationsWorkfow, UploadLocationsWorkflow]
# }
#
# f"""
# Create a dependency graph like the one below
# uploadDependencyGraph = {
#     UploadLocationsWorkflow: None
#     UploadOrgToLocationAssignmentsWorkflow: [{"workflow": UploadOrganizationsWorkflow, "done": None}]
# }
# """


# get workflows that do not have a dependency and start them.
# once a workflow completes, it sends a signal to to the manage workflow.
# manage workflow looks up the dependent workflow e.g if orgs completed
#   get workflow that depends on orgs. the orgtoLocationAssignment.
#

workflow_name_to_workflow_resolver = {
    "UploadUsersWorkflow": UploadUsersWorkflow,
    "UploadOrganizationsWorkflow": UploadOrganizationsWorkflow,
    "UploadLocationsWorkflow": UploadLocationsWorkflow,
    "UploadOrgToLocationAssignmentsWorkflow": UploadOrgToLocationAssignmentsWorkflow
}

@dataclasses.dataclass
class WorkflowDescription:
    workflow_name: str
    file_path: str


@workflow.defn
class UploadWorkflowManager:
    @workflow.run
    async def run(self, wkfl_description: str):
        # create a dependency graph of the workflows
        # start child workflows for each of the respective worflows.
        # unsleep workflows for the current workflow.
        # pass
        # lets start all workflows
        workflows_descriptions = json.loads(wkfl_description)
        for workflow_desc in workflows_descriptions:
            wkflow_name = workflow_desc.get("workflow_name")
            # # TODO - might not need to do this transformation.
            # wkflow_class = workflow_name_to_workflow_resolver.get(wkflow_name)
            file_path = workflow_desc.get("file_path")
            shared_uuid = await workflow.execute_activity(
                get_uuid,
                start_to_close_timeout=timedelta(seconds=5)
            )
            shared_id = f"{shared_uuid}_{wkflow_name}"
            if workflow_name_to_workflow_resolver.get(wkflow_name):
                await workflow.execute_child_workflow(wkflow_name, file_path, id=shared_id)
