const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function filePath(resourceName) {
  return path.join(dataDir, `${resourceName}.json`);
}

function readRecords(resourceName) {
  ensureDataDir();

  if (!fs.existsSync(filePath(resourceName))) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath(resourceName), 'utf8'));
}

function writeRecords(resourceName, records) {
  ensureDataDir();
  fs.writeFileSync(filePath(resourceName), JSON.stringify(records, null, 2));
}

function nextId(records) {
  return records.reduce((maxId, record) => Math.max(maxId, Number(record.id || 0)), 0) + 1;
}

module.exports = {
  readRecords,
  writeRecords,
  nextId
};
