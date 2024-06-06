import csv

import temporalio.service
from temporalio import activity
from data_models.user import KeycloakUser
from services.fhir_keycloak_api import InternalAuthenticationService
from shared import api_service
import uuid

"""
Should we read the full csv and pass that information to the next activity;
    How would we tell that errors per row for each row number
Ama read the csv and process things line by line.
- reconsider how api service is created and used across the different workflows
- Also extract activity functions so that they are shareable to code that does not rely on temporial
"""


@activity.defn
def read_csv_file_haba_haba(file_path: str):
    with open(file_path, mode="r") as file:
        reader = csv.DictReader(file, delimiter=",")
        for row in reader:
            print(row)
            yield row

@activity.defn
def read_csv_full(file_path:str):
    with open(file_path, mode="r") as file:
        reader = csv.DictReader(file, delimiter=",")
        return list(reader)


@activity.defn
def post_put_keycloak_user(user: KeycloakUser):
    user_payload = user.deserialize()
    response = api_service.request(method="POST", url="http://localhost:8080/auth/admin/realms/fhir/users", data=user_payload)
    # check for conflict error
    if response.status_code == 409:
        # get user with username and update record.
        # TODO - what should happen here -> update existing record to match csv or skip row.
        existing_user = api_service.request(method="GET", url="http://localhost:8080/auth/admin/realms/fhir/users?exact=true&username="+user.username)
        print("ExistingUSer", existing_user.json())
        if(existing_user.status_code == 200):
            return existing_user.json()[0].get("id")
    elif response.status_code == 201:
        new_user_location = response.headers["Location"]
        # TODO - could we repackage id as part of the user dataclass and return that.
        user_id = (new_user_location.split("/"))[-1]
        return user_id
    # TODO - errors like 403 should mean that we should not even retry

@activity.defn
def post_put_keycloak_user_resources(user: KeycloakUser):
    # TODO - review logic
    # should we fetch everything related to user and use it as a base
    # proceed with the assumption that this only needs to happen when creating not updating.
    payload = user.create_user_resources()
    response = api_service.request(method="POST", url="http://localhost:8081/fhir", data=payload)
    if response not in range(200, 300):
        # delegate error to temporal if otherwise just raise error.
        pass

@activity.defn
def get_uuid():
    return uuid.uuid4()

class WorkflowStatusCheck:
    def __init__(self, client) -> None:
        print("Client", client)
        self._client = client

    @activity.defn
    async def is_workflow_running(self, workflow_id: str):
        # May want to catch not-found RPCError here if it's not required to exist
        try:
            desc = await self._client.get_workflow_handle(workflow_id).describe()
            print("++++++++++++++++desc", desc)
            return desc
        except temporalio.service.RPCError:
            return None
        # return desc.status == temporalio.client.WorkflowExecutionStatus.RUNNING