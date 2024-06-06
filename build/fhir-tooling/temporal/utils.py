from temporalio.client import Client

async def get_TemporalClient():
    client = await Client.connect("localhost:7233", namespace="default")
    return client