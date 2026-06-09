const express = require('express');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readRecords(resourceName) {
  ensureDataDir();

  const filePath = path.join(dataDir, `${resourceName}.json`);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeRecords(resourceName, records) {
  ensureDataDir();
  fs.writeFileSync(
    path.join(dataDir, `${resourceName}.json`),
    JSON.stringify(records, null, 2)
  );
}

function createResourceRouter(resourceName) {
  const router = express.Router();
  const records = readRecords(resourceName);
  let nextId = records.reduce((maxId, record) => Math.max(maxId, Number(record.id || 0)), 0) + 1;

  router.get('/', (req, res) => {
    res.json({ resource: resourceName, data: records });
  });

  router.get('/:id', (req, res) => {
    const record = records.find((item) => item.id === Number(req.params.id));

    if (!record) {
      return res.status(404).json({ error: `${resourceName} not found` });
    }

    return res.json({ resource: resourceName, data: record });
  });

  router.post('/', (req, res) => {
    const record = {
      id: nextId,
      ...req.body
    };

    nextId += 1;
    records.push(record);
    writeRecords(resourceName, records);

    res.status(201).json({ resource: resourceName, data: record });
  });

  router.put('/:id', (req, res) => {
    const recordIndex = records.findIndex((item) => item.id === Number(req.params.id));

    if (recordIndex === -1) {
      return res.status(404).json({ error: `${resourceName} not found` });
    }

    records[recordIndex] = {
      ...records[recordIndex],
      ...req.body,
      id: Number(req.params.id)
    };
    writeRecords(resourceName, records);

    return res.json({ resource: resourceName, data: records[recordIndex] });
  });

  router.delete('/:id', (req, res) => {
    const recordIndex = records.findIndex((item) => item.id === Number(req.params.id));

    if (recordIndex === -1) {
      return res.status(404).json({ error: `${resourceName} not found` });
    }

    records.splice(recordIndex, 1);
    writeRecords(resourceName, records);
    res.status(204).send();
  });

  return router;
}

module.exports = createResourceRouter;
