import {Client, Connection, WorkflowClient} from "@temporalio/client";

let client: WorkflowClient ;
export async function getTemporalioClient(){
  if(client !== undefined){
    return client
  }
  const temporalConnectionAddress = "localhost:7233"
  const connection = await Connection.connect({address: temporalConnectionAddress})
  client =  new WorkflowClient({
    connection
  })
  return client
}
