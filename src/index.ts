import app from './app';
import { EXPRESS_PORT } from './configs/envs';
import { winstonLogger } from './configs/winston';

const PORT = EXPRESS_PORT || 3000;
const server = app.listen(PORT, () => {
    // log every time app starts
    winstonLogger.info(`App listening on port ${PORT}!`);
});

export default server;
