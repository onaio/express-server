from dataclasses import dataclass
from operator import itemgetter
import json
import uuid

with open("json_payloads/organizations_payload") as json_file:
    org_payload_template = json_file.read()


@dataclass
class OrganizationCsvRecord:
    name: str
    active: bool
    # TODO - can we make the csv declaration declarative, in that it describes the state of a resource regardless of
    # whether it needs to exist
    upload_method: str
    org_id: str
    identifier: str

    @classmethod
    def from_csv_record(cls, **kwargs):
        name, active, method, org_id, identifier = itemgetter(
            "orgName", "orgActive", "method", "orgId", "identifier")(kwargs)
        return OrganizationCsvRecord(name=name, active=bool(active), upload_method=method, org_id=org_id, identifier=identifier)

    # todo - probably rename this to serialize_to_transaction
    def deserialize(self):
        unique_uuid = self.org_id
        identifier_uuid = self.identifier
        if self.upload_method.lower() == "create":
            # no ids in this case.
            unique_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, self.name))
            identifier_uuid = unique_uuid
            version = "1"
        # ps = payload_string
        ps = (
            org_payload_template.replace("$name", self.name)
            .replace("$unique_uuid", unique_uuid)
            .replace("$identifier_uuid", identifier_uuid)
            # .replace("$version", version)
            .replace("$status", self.status)
            .replace("$active", json.dumps(self.active))
        )
        return ps
