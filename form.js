const express = require('express');
const xss = require('xss');

const router = express.Router();

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://:@localhost/verkefni2';

const client = new Client({
  connectionString,
});

client.connect();

const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const query = 'INSERT INTO form(name, email, idNumber, amount) VALUES($1, $2, $3, $4) RETURNING *';

async function insert(values) {
  try {
    await client.query(query, values);
  } catch (err) {
    console.error(err);
  }
  await client.end();
}

function form(req, res, err) {
  const data = {};
  const errorMessages = err;
  res.render('form', { data, errorMessages, user: req.user });
}

router.get('/', form);

router.use(express.urlencoded({
  extended: true,
}));

router.post(
  '/',
  check('name', 'Nafn má ekki vera tómt').isLength({ min: 1 }).trim(),
  check('email', 'Netfang má ekki vera tómt').isLength({ min: 1 }).withMessage(),
  check('email', 'Netfang þarf að vera netfang').isEmail().normalizeEmail(),
  check('idNumber', 'Kennitala má ekki vera tóm').isLength({ min: 1 }).trim(),
  check('idNumber', 'Kennitala þarf að vera á forminu 000000-0000').matches(/^[0-9]{6}-?[0-9]{4}$/),
  check('amount', 'Fjöldu verður að vera tala, stærri en 0').isInt({ min: 1 }).trim(),
  sanitize('idNumber').blacklist('-'),
  (req, res) => {
    const {
      name = '',
      email = '',
      idNumber = '',
      amount = '',
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(i => i.msg);
      res.render('form', {
        name,
        email,
        idNumber,
        amount,
        errorMessages,
      });
    }

    insert([name, email, idNumber, amount].map(i => xss(i)))
      .then(() => res.redirect('/success'))
      .catch(e => console.error(e));
  },
);

router.get('/success', (req, res) => {
  res.render('success', { user: req.user });
});

module.exports = router;
