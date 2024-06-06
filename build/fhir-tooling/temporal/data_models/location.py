from dataclasses import dataclass
from operator import itemgetter
import json
import uuid

with open("json_payloads/locations_payload.json") as json_file:
    user_payload_template = json_file.read()

@dataclass
class LocationCsvRecord:
    name: str
    status: str
    upload_method: str
    loc_id: str
    parent_name: str
    parent_id: str
    type: str
    type_code: str
    admin_level: str
    physical_type_code: str
    longitude: str
    latitude: str

    @classmethod
    def from_csv_record(cls, **kwargs):
        name, status, upload_method, loc_id, parent_name, parent_id, type, type_code, admin_level, physical_type_code, longitude, latitude = itemgetter(
            "locationName", "locationStatus", "method", "locationId", "locationParentName", "locationParentId", "locationType", "locationTypeCode","locationAdminLevel", "locationPhysicalTypeCode","longitude", "latitude"
            )(kwargs)
        return LocationCsvRecord(name=name, status=status, upload_method=upload_method, loc_id=loc_id, parent_name=parent_name, parent_id=parent_id,type=type, type_code=type_code, admin_level=admin_level, physical_type_code=physical_type_code, longitude=longitude, latitude=latitude)

    # TODO - rename to serialize_to_transaction?
    def deserialize(self):
        # read user payload json
        obj = json.loads(user_payload_template)
        obj["firstName"] = self.first_name
        obj["lastName"] = self.last_name
        obj["username"] = self.username
        obj["email"] = self.email
        obj["attributes"]["fhir_core_app_id"][0] = self.app_id
        return json.dumps(obj)
