const express = require('express');
const bodyParser = require('body-parser');
const { processFileUpload } = require('./remuxvideo');
const logger = require('./logger');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

app.post('/', async (req, res) => {
  try {
    const message = req.body;
    logger.info('Received file upload event', message);

    await processFileUpload(message);

    res.status(200).send('Event processed successfully');
  } catch (error) {
    logger.error('Error processing event', { error: error.message });
    res.status(500).send('Error processing event');
  }
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
