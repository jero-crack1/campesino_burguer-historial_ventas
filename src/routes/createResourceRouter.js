const express = require('express');

function createResourceRouter(resourceName) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ resource: resourceName, data: [] });
  });

  router.get('/:id', (req, res) => {
    res.json({ resource: resourceName, id: Number(req.params.id) });
  });

  router.post('/', (req, res) => {
    res.status(201).json({ resource: resourceName, data: req.body });
  });

  router.put('/:id', (req, res) => {
    res.json({ resource: resourceName, id: Number(req.params.id), data: req.body });
  });

  router.delete('/:id', (req, res) => {
    res.status(204).send();
  });

  return router;
}

module.exports = createResourceRouter;
