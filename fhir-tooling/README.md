# Setup Keycloak Roles

This script is used to setup keycloak roles and groups. It takes in a csv file with the following columns:

- **role**: The actual names of the roles you would like to create
- **composite**: A boolean value that tells if the role has composite roles or not
- **associated_roles**: Roles to be created/added to the main role as associated roles

### Options

- `setup` : (Required) This needs to be set to "roles" in order to initiate the setup process
- `csv_file` : (Required) The csv file with the list of roles
- `group` : (Not required) This is the actual group name. If not passed then the roles will just be created but not assigned to any group
- `roles_max` : (Not required) This is the maximum number of roles to pull from the api. The default is set to 500. If the number of roles in your setup is more than this you will need to change this value

### To run script

1. Create virtualenv
2. Install requirements.txt - `pip install -r requirements.txt`
3. Create a `config.py` file. The `sample_config.py` is an example of what this should look like. Populate it with the right credentials. Ensure that the user whose details you provide in this config file has the necessary permissions/privilleges to setup/create Keycloak roles and groups.
4. Run script - `python3 main.py --setup roles --csv_file csv/setup/roles.csv --group Supervisor`
5. If you are running the script without `https` setup e.g locally or a server without https setup, you will need to set the `OAUTHLIB_INSECURE_TRANSPORT` environment variable to 1. For example `export OAUTHLIB_INSECURE_TRANSPORT=1 && python3 main.py --setup roles --csv_file csv/setup/roles.csv --group OpenSRP_Provider --log_level debug`
6. You can turn on logging by passing a `--log_level` to the command line as `info`, `debug` or `error`. For example `python3 main.py --setup roles --csv_file csv/setup/roles.csv --group Supervisor --log_level debug`

# FHIR Resource CSV Importer

This script takes in a csv file with a list of resources, builds the payloads
and then posts them to the API for creation

### To run script

1. Create virtualenv
2. Install requirements.txt - `pip install -r requirements.txt`
3. Create a `config.py` file. The `sample_config.py` is an example of what this should look like. Populate it with the right credentials
4. Run script - `python3 main.py --csv_file csv/locations.csv --resource_type locations`
5. You can turn on logging by passing a `--log_level` to the command line as `info`, `debug` or `error`. For example `python3 main.py --csv_file csv/locations.csv --resource_type locations --log_level info`

See example csvs in the csv folder

## To test

To run all tests

```console
$ pytest
```

To run specific tests

```console
$ pytest path/to/test_file.py::TestClass::test_function
```

To run tests and generate a coverage report

```console
$ pytest --junitxml=coverage.html --cov=importer --cov-report=html
```

The coverage report `coverage.html` will be at the working directory

## How to use it

### 1. Create locations in bulk

- Run `python3 main.py --csv_file csv/locations/locations_min.csv --resource_type locations --log_level info`
- See example csv [here](/importer/csv/locations/locations_min.csv)
- The first two columns **name** and **status** is the minimum required
- [locations_full](/importer/csv/locations/locations_full.csv) shows more options available
- The third column is the request method, can be either create or update. Default is set to create
- The fourth column is the id, which is required when updating
- The fifth and sixth columns are parentName and parentID,respectively
- The seventh and eighth columns are the location's type and typeCode, respectively
- The ninth and tenth columns are the location's physicalType and physicalTypeCode, respectively

### 2. Create users in bulk

- Run `python3 main.py --csv_file csv/users.csv --resource_type users --log_level info`
- See example csv [here](/importer/csv/users.csv)
- First four columns are firstName, lastName, Username and email. Username and email need to be unique
- The fifth column `id` is optional. If populated with a uuid, it will be used as the Practitioner uuid when creating the Practitioner resource. If left empty, a random uuid will be generated
- The sixth column is the `userType`, this needs to be set to either `Practitioner` or `Supervisor`
- The seventh column is `enableUser` which defaults to True if not set
- The eighth and ninth column are details about the users Keycloak Group and are required for proper assignment
- The last two columns are the `ApplicationID` and `password`

### 3. Create organizations in bulk

- Run `python3 main.py --csv_file csv/organizations/organizations_min.csv --resource_type organizations --log_level info`
- See example csv [here](/importer/csv/organizations/organizations_min.csv)
- The first column **name** is the only one required
- [organizations_full](/importer/csv/organizations/organizations_full.csv) shows more options available
- The third column is the request method, can be either create or update. Default is set to create
- The fourth column is the id, which is required when updating
- The fifth columns in the identifier, in some cases this is different from the id

### 4. Create care teams in bulk

- Run `python3 main.py --csv_file csv/careteams/careteam_min.csv --resource_type careTeams --log_level info`
- See example csv [here](/importer/csv/careteams/careteam_min.csv)
- The first column **name** is the only one required
- If the status is not set it will default to **active**
- [careteam_full](/importer/csv/careteams/careteam_full.csv) shows more options available
- The third column is the request method, can be either create or update. Default is set to create
- The fourth column is the id, which is required when updating
- The fifth columns is the identifier, in some cases this is different from the id
- The sixth column is the organizations. This is only useful when you want to assign a few organizations when creating careteams. The format expected is a string like `orgId1:orgName1|orgId2:orgName2|orgId3:orgNam3`. Otherwise use the "Assign careTeams to organizations" csv below.
- The seventh column is the participants. This is only useful when you want to assign a few users when creating careteams. The format expected is a string like `userId1:fullName1|userId2:fullName2|userId3:fullName3`. Otherwise use the "Assign users to careteams" csv below

### 5. Assign locations to parent locations

- Run `python3 main.py --csv_file csv/locations/locations_full.csv --resource_type locations --log_level info`
- See example csv [here](/importer/csv/locations/locations_full.csv)
- Adding the last two columns **parentID** and **parentName** will ensure the locations are assigned the right parent both during creation or updating

### 6. Assign organizations to locations

- Run `python3 main.py --csv_file csv/organizations/organization_locations.csv --assign organization-Location --log_level info`
- See example csv [here](/importer/csv/organizations/organization_locations.csv)

### 7. Assign care teams to organizations

- Run `python3 main.py --csv_file csv/careteams/careteam_organizations.csv --assign careTeam-Organization --log_level info`
- See example [here](/importer/csv/careteams/careteam_organizations.csv)
- The first two columns are **name** and **id** of the careTeam, while the last two columns are the **organization(name)** and **organizationID**
- You can also assign a couple of careTeams during creation, by passing in the orgs names and their ids as a string as shown in [careteam_full](/importer/csv/careteams/careteam_full.csv), in the seventh column

### 8. Assign users to care teams

- Run `python3 main.py --csv_file csv/careteams/users_careteam.csv --assign user-careTeam --log_level info`
- See example [here](/importer/csv/careteams/users_careteam.csv)
- The first two columns are **name** and **id** of the careTeam, while the last two columns are the **user(name)** and **userID** of the user getting assigned
- You can also assign a couple of users during creation, by passing in the user's names and their ids as a string as shown in [careteam_full](/importer/csv/careteams/careteam_full.csv) in the eighth column

## 9. Delete duplicate Practitioners on HAPI

- Run `python3 main.py --csv_file csv/users.csv --setup clean_duplicates --cascade_delete true --log_level info`
- This should be used very carefully and in very special circumstances such as early stages of server setup. Avoid usage in active production environments as it will actually delete FHIR resources
- It is recommended to first run with cascade_delete set to false in order to see if there are any linked resources which will also be deleted. Also any resources that are actually deleted are only soft deleted and can be recovered
- For this to work you must provide Practitioner uuids in your users.csv file. This is what is used to determine which Practitioner to not delete
- The script will check to see if every user has a keycloak uuid that has a Practitioner uuid that matches the one provided in the csv file
- Note that if none of the Practitioner uuids match then all will be deleted
- Set `cascade_delete` to True or False if you would like to automatically delete any linked resources. If you set it to False, and there are any linked resources, then the resources will NOT be deleted