const express = require('express');
const json2csv = require('json2csv');
const { Client } = require('pg');

const router = express.Router();

const connectionString = 'postgres://:@localhost/verkefni2';

const client = new Client({
  connectionString,
});

client.connect();

async function select() {
  let res;
  try {
    res = await client.query('SELECT * FROM form');
    return (res.rows);
  } catch (e) {
    console.error('Error selecting', e);
  }
  await client.end();
  return res;
}

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
}

router.get('/', ensureLoggedIn, (req, res) => {
  select()
    .then(data => res.render('table', { rows: data, user: req.user }))
    .catch(e => console.error(e))
})

router.get('/download', (req, res) => {
  if (!req.user) return;
  const fields = ['id', 'name', 'email', 'idnumber', 'amount', 'date'];
  res.set('Content-Disposition', 'attachment; filename="file.csv"');

  select()
    .then(data => json2csv({ data, fields }))
    .then(data => res.send(data))
    .catch(err => console.error(err))
});

module.exports = router;
