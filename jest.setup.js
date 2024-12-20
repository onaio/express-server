// setupTests.js
const { RedisContainer } = require('@testcontainers/redis')

let redisContainer;

beforeAll(async () => {
  // Start Redis container
  redisContainer = await new RedisContainer('redis')
    .withExposedPorts(6379)
    .start();

  // Set environment variables or global variables to be used in tests
  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_CONNECTION_URL=redisContainer.getConnectionUrl()
  process.env.REDIS_PORT = redisContainer.getMappedPort(6379);
  console.log('Containers are started and ready for testing...');
});

afterAll(async () => {
  // Stop containers after all tests are done
  await redisContainer?.stop();
  console.log('Containers have been stopped.');
});
