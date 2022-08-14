var express = require('express');
var router = express.Router();
var db = require('../config/db');

/* GET home page. */
router.get('/', async function (req, res, next) {
  const users = await getAllUsers();
  const otpUsers = await getAllOtpUsers();
  res.render('website/home', { users, otpUsers });
});

router.get('/settings', async function (req, res, next) {
  const dynamicInfo = await getDynamicInfo();
  res.render('website/settings', { ...dynamicInfo });
});

/** Helper methods */
async function getAllUsers() {
  let getUsers =
    'SELECT userId, password, category from `user-session` WHERE userType = ?';
  return new Promise((resolve, reject) => {
    db.query(getUsers, ['normal'], (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

async function getAllOtpUsers() {
  let getOtpUsers =
    'SELECT userId, password from `user-session` WHERE userType = ?';
  return new Promise((resolve, reject) => {
    db.query(getOtpUsers, ['verification'], (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

async function getDynamicInfo() {
  let getDynamicInfo =
    'SELECT officeId, province, inertiaVersion, quotaCategory, dateAd, dateBs from `dynamic-info`';
  return new Promise((resolve, reject) => {
    db.query(getDynamicInfo, (error, results) => {
      if (error) reject(error);
      resolve(results[0]);
    });
  });
}

module.exports = router;
