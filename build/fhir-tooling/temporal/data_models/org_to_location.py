from dataclasses import dataclass
from operator import itemgetter
import json
import uuid

with open("json_payloads/keycloak_user_payload.json") as json_file:
    user_payload_template = json_file.read()

with open("json_payloads/user_resources_payload.json") as json_file:
    user_resources_payload_template = json_file.read()


@dataclass
class KeycloakUser:
    first_name: str
    last_name: str
    username: str
    email: str
    user_id: str
    user_type: str
    enable_user: bool
    keycloak_group_ids: str
    app_id: str
    password: str

    @classmethod
    def from_csv_record(cls, **kwargs):
        first_name, last_name, username, email, user_id, user_type, enable_user, keycloak_group_ids, app_id, password = itemgetter(
            "firstName", "lastName", "username", "email", "userId", "userType", "enableUser", "keycloakGroupId",
            "appId", "password")(kwargs)
        return KeycloakUser(first_name=first_name, last_name=last_name, username=username, email=email, user_id=user_id, user_type=user_type,enable_user=bool(enable_user), keycloak_group_ids=keycloak_group_ids, app_id=app_id, password=password)

    def deserialize(self):
        # read user payload json
        obj = json.loads(user_payload_template)
        obj["firstName"] = self.first_name
        obj["lastName"] = self.last_name
        obj["username"] = self.username
        obj["email"] = self.email
        obj["attributes"]["fhir_core_app_id"][0] = self.app_id
        return json.dumps(obj)

    def create_user_resources(self):
        # TODO - keycloak group ids can be an array.
        # generate uuids
        if len(str(self.user_id).strip()) == 0:
            practitioner_uuid = str(
                uuid.uuid5(
                    uuid.NAMESPACE_DNS, self.username + self.keycloak_group_ids + "practitioner_uuid"
                )
            )
        else:
            practitioner_uuid = self.user_id

        group_uuid = str(
            uuid.uuid5(uuid.NAMESPACE_DNS, self.username + self.keycloak_group_ids + "group_uuid")
        )
        practitioner_role_uuid = str(
            uuid.uuid5(
                uuid.NAMESPACE_DNS, self.username + self.keycloak_group_ids + "practitioner_role_uuid"
            )
        )

        # get payload and replace strings
        initial_string = """{"resourceType": "Bundle","type": "transaction","meta": {"lastUpdated": ""},"entry": """

        # replace the variables in payload
        ff = (
            user_resources_payload_template.replace("$practitioner_uuid", practitioner_uuid)
            .replace("$keycloak_user_uuid", self.user_id)
            .replace("$firstName", self.first_name)
            .replace("$lastName", self.last_name)
            .replace("$email", self.email)
            .replace('"$enable_user"', "true" if self.enable_user else "false")
            .replace("$group_uuid", group_uuid)
            .replace("$practitioner_role_uuid", practitioner_role_uuid)
        )

        print(ff)

        obj = json.loads(ff)

        if self.user_type.strip() == "Supervisor":
            obj[2]["resource"]["code"] = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "236321002",
                        "display": "Supervisor (occupation)",
                    }
                ]
            }
        elif self.user_type.strip() == "Practitioner":
            obj[2]["resource"]["code"] = {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "405623001",
                        "display": "Assigned practitioner",
                    }
                ]
            }
        else:
            del obj[2]["resource"]["code"]
        ff = json.dumps(obj, indent=4)

        payload = initial_string + ff + "}"
        return payload
