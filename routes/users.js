var express = require('express');
var router = express.Router();
const axios = require('axios').default;
var db = require('../config/db');

/* GET users listing. */
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params && req.params.userId;
    if (!userId) {
      res.json({
        status: 400,
        isError: true,
        message: 'Provide user id!',
      });
    }
    const unauthenticatedSystem = await getUnauthSession(userId);
    res.json({
      ...unauthenticatedSystem,
    });
  } catch (error) {
    console.log(error);
    res.json({
      error,
    });
    // return Error(error.message || 'Problem in getting the session values!');
  }
});

router.post('/bulkApply', (req, res, next) => {
  try {
    console.log('hererareasfsda');
    bulkApply();
    res.json({
      isError: false,
      message: 'Process started...!',
    });
  } catch (error) {
    res.json({
      isError: true,
      message: 'Update failed!',
    });
  }
});

router.get('/checkQuota/:userId', async (req, res, next) => {
  try {
    const userId = req.params && req.params.userId;
    if (!userId) {
      res.json({
        status: 400,
        isError: true,
        message: 'Provide user id!',
      });
    }
    const checkQuotaRes = await checkAvailableQuota(userId);
    res.json({
      ...checkQuotaRes,
    });
  } catch (error) {
    console.log(error);
    res.json({
      error,
    });
  }
});

router.get('/sendOTP/:userId', async (req, res, next) => {
  try {
    const userId = req.params && req.params.userId;
    if (!userId) {
      res.json({
        status: 400,
        isError: true,
        message: 'Provide user id!',
      });
    }
    const sendOTPRes = await sendOTP(userId);
    res.json({
      ...sendOTPRes,
    });
  } catch (error) {
    console.log(error);
    res.json({
      error,
    });
  }
});

router.post('/updateOtp', async (req, res, next) => {
  const otpCode = req.body ? req.body.otp : null;
  if (otpCode) {
    const updateOtpRes = await updateOtpCode(otpCode);
    res.json({
      status: 201,
      isError: false,
      message: updateOtpRes ? 'Otp updated!' : 'Otp not updated!',
    });
  } else {
    res.json({
      status: 400,
      isError: true,
      message: 'Please provide otp!',
    });
  }
});

router.post('/createUser', (req, res, next) => {
  const { username, password, category } = req.body;
  let createUser =
    'INSERT INTO `user-session`(userId, password, category) VALUES(?,?,?)';
  db.query(createUser, [username, password, category], (error, results) => {
    if (error) {
      res.json({
        status: 400,
        isError: true,
        message: error.message ? error.message : 'Not created!',
      });
    } else {
      res.json({
        status: 201,
        isError: false,
        message: 'User created!',
      });
    }
  });
});

router.post('/applyForm/:userId', async (req, res, next) => {
  const userId = req.params && req.params.userId;
  if (!userId) {
    res.json({
      status: 400,
      isError: true,
      message: 'Provide user id!',
    });
  }
  /**
   * TODO: Get category
   * TODO: Form headers
   * TODO: Get otp and verification token
   * TODO: Form payload
   * TODO: Make request
   */
  try {
    const { category } = await getCategory(userId);
    const { inertiaVersion, province, officeId, dateAd, dateBs } =
      await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const { verificationToken, otp } = await getOtpAndToken();
    const payload = {
      category_id: category,
      province_id: province,
      office_id: officeId,
      visit_date_bs: dateBs,
      visit_date_ad: dateAd,
      is_urgent: false,
      urgency_reason_id: '',
      documents: {},
      disclaimer: true,
      otp: otp,
      verification: verificationToken,
    };

    const submissionRes = await makeFinalRequest(headers, payload);
    res.json({
      ...submissionRes,
      userId,
    });
  } catch (error) {
    console.log(error);
  }
});

router.post('/updateSetting', async (req, res, next) => {
  const { officeId, province, quotaCategory, inertiaVersion, dateAd, dateBs } =
    req.body;
  try {
    const updateRes = await udpateSetting({
      officeId,
      province,
      quotaCategory,
      inertiaVersion,
      dateAd,
      dateBs,
    });
    res.json({
      isError: !updateRes,
      message: 'Setting update successfull!',
    });
  } catch (error) {
    console.log(error);
    res.json({
      isError: true,
      message: 'Update failed!',
    });
  }
});

/**
 * These are for logging in the user.
 * @returns
 */

async function getUnauthSession(userId) {
  try {
    const getSession = await axios.get('https://applydl.dotm.gov.np/login');
    if (getSession && getSession.status === 200) {
      const { headers } = getSession;
      const { odlSession, xsrfToken } = await extractSessionValues(
        headers['set-cookie'],
      );
      const loginHeaders = {
        'Content-Type': 'application/json',
        Cookie: `odl_session=${odlSession}; XSRF-TOKEN=${xsrfToken}`,
        'X-Inertia': true,
        'X-Inertia-Version': '6027030c49944a6c71b67bcc31e97d71',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': `${decodeURIComponent(xsrfToken)}`,
      };

      const loginResponse = await loginApplicant(userId, loginHeaders);
      return loginResponse;
    } else {
      getUnauthSession();
    }
  } catch (error) {
    return error;
  }
}

async function loginApplicant(userId, loginHeaders) {
  try {
    const payload = await getUserCreds(userId);
    const { status } = await axios.post(
      'https://applydl.dotm.gov.np/login',
      { ...payload, remember: false },
      {
        headers: loginHeaders,
      },
    );

    return {
      statusCode: status,
      isError: true,
      message: 'Session not updated!',
    };
  } catch (error) {
    const { data, headers, status } = error.response;
    if (status === 409) {
      const { odlSession, xsrfToken } = await extractSessionValues(
        headers['set-cookie'],
      );
      const updateRes = await updateSession(userId, odlSession, xsrfToken);
      return {
        statusCode: status,
        isError: false,
        message: 'Session updated',
      };
    } else {
      loginApplicant();
    }
  }

  // if (getSession && getSession.status === 200) {
  //   const { headers } = getSession;
  //   const { odlSession, xsrfToken } = extractSessionValues(
  //     headers['set-cookie'],
  //   );
  // }
}

/**
 * Check quota helper method.
 * @returns
 */

async function checkAvailableQuota(userId) {
  let sUserId = userId;
  try {
    const { inertiaVersion, officeId, quotaCategory } = await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const payload = {
      is_urgent: false,
      office_id: officeId,
      category_id: quotaCategory,
    };
    const { status, data } = await axios.post(
      'https://applydl.dotm.gov.np/license/quota',
      payload,
      { headers },
    );

    if (status === 200) {
      if (data && data.quotas) {
        const len = Object.keys(data.quotas).length;
        const lastInfo = Object.keys(data.quotas)[len - 1];
        console.log('Quota details: ', data.quotas[lastInfo]);
        return {
          statusCode: status,
          isError: false,
          message: `${data.quotas[lastInfo].available}` || 'N/A',
        };
      } else {
        return {
          statusCode: status,
          isError: true,
          message: 'N/A',
        };
      }
    } else {
      console.log('Inside error bahira loop');
      checkAvailableQuota(sUserId);
    }
  } catch (error) {
    const status = error && error.response ? error.response.status : null;
    if (status && status === 401) {
      return {
        statusCode: status,
        isError: true,
        message: '401 please login again!',
      };
    } else {
      checkAvailableQuota(sUserId);
    }
  }
}

/**
 * Sends OTP and updates the verification code.
 * @returns
 */

async function sendOTP(userId) {
  let sUserId = userId;
  try {
    const { inertiaVersion } = await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const { quotaCategory, province, officeId, dateAd, dateBs } =
      await getDynamicInfo();
    const payload = {
      category_id: quotaCategory,
      province_id: province,
      office_id: officeId,
      visit_date_bs: dateBs,
      visit_date_ad: dateAd,
      is_urgent: false,
      urgency_reason_id: '',
      documents: {},
      disclaimer: true,
      otp: null,
      verification: null,
    };

    const { status, data } = await axios.post(
      'https://applydl.dotm.gov.np/license/apply/verification',
      payload,
      { headers },
    );

    const errorMessage =
      data &&
      data.props &&
      data.props.errors &&
      Object.keys(data.props.errors).length > 0;
    if (status === 200 && !errorMessage) {
      const { verification } = data.props;
      if (!verification) {
        console.log('Unable to get verification token, retrying....!');
        sendOTP(userId);
      }
      const updatedRes =
        verification && (await updateTokenVerificationCode(verification));
      return {
        status,
        isError: false,
        message: updatedRes
          ? 'Updated verification token'
          : 'Not updated varification token!',
      };
    } else if (status === 200 && errorMessage) {
      return {
        status,
        isError: true,
        message: JSON.stringify(data.props.errors || ''),
      };
    } else {
      console.log('send otp sucess error', status);
      sendOTP(sUserId);
    }
  } catch (error) {
    const { data, status } = error.response;
    console.log('Send otp error', status);
    if ([409, 401].includes(status)) {
      return {
        status,
        isError: true,
        message: data.message || error.message || 'Uncovered case!',
      };
    } else {
      console.log('Retrying.....');
      sendOTP(sUserId);
    }
  }
}

async function updateTokenVerificationCode(verificationCode) {
  return new Promise((resolve, reject) => {
    let updateTV = 'UPDATE `otp-verification` SET verificationToken=?';
    db.query(updateTV, [verificationCode], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Sends OTP and updates the otp code.
 * @returns
 */

async function updateOtpCode(otpCode) {
  return new Promise((resolve, reject) => {
    let updateOTP = 'UPDATE `otp-verification` SET otp=?';
    db.query(updateOTP, [otpCode], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

async function getHeaders(userId, inertiaVersion) {
  let getSessionValues =
    'SELECT unescapeToken, verificationToken, odlSession from `user-session` WHERE userId = ?';
  return new Promise((resolve, reject) => {
    db.query(getSessionValues, [userId], (error, results) => {
      if (error) reject(error);
      const { unescapeToken, verificationToken, odlSession } = results[0];
      resolve({
        'Content-Type': 'application/json',
        Cookie: `odl_session=${odlSession}; XSRF-TOKEN=${unescapeToken}`,
        'X-Inertia': true,
        'X-Inertia-Version': inertiaVersion,
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': `${verificationToken}`,
      });
    });
  });
}

/**
 * Global helpers.
 * @returns
 */

async function getUserCreds(userId) {
  let getUserCreds =
    'SELECT userId, password from `user-session` WHERE userId = ?';
  return new Promise((resolve, reject) => {
    db.query(getUserCreds, [userId], (error, results) => {
      if (error) reject(error);
      const { userId, password } = results[0];
      resolve({
        username: userId,
        password,
      });
    });
  });
}

async function updateSession(userId, odlSession, xsrfToken) {
  return new Promise((resolve, reject) => {
    let updateSessionValue =
      'UPDATE `user-session` SET unescapeToken=?, verificationToken=?, odlSession=? WHERE userId=?';
    db.query(
      updateSessionValue,
      [xsrfToken, decodeURIComponent(xsrfToken), odlSession, userId],
      (error, results) => {
        if (error) {
          console.log('Error when updating session values', error);
          reject(error);
        } else {
          resolve(true);
        }
      },
    );
  });
}

async function extractSessionValues(cookiesValues) {
  const xsrfTokenUn = cookiesValues[0];
  const xsrfTokenRaw = String(xsrfTokenUn).split('=')[1];
  const xsrfToken = String(xsrfTokenRaw).split('; ')[0];

  const odlSessionUn = cookiesValues[1];
  const odlSessionRaw = String(odlSessionUn).split('=')[1];
  const odlSession = String(odlSessionRaw).split('; ')[0];

  // const updatedRes = await updateSession(odlSession, xsrfToken);
  return {
    odlSession,
    xsrfToken,
  };
}

async function getCategory(userId) {
  let getCategory = 'SELECT category from `user-session` WHERE userId = ?';
  return new Promise((resolve, reject) => {
    db.query(getCategory, [userId], (error, results) => {
      if (error) reject(error);
      resolve({ category: results[0].category });
    });
  });
}

async function getOtpAndToken() {
  let getTokenInfo = 'SELECT otp, verificationToken from `otp-verification`';
  return new Promise((resolve, reject) => {
    db.query(getTokenInfo, (error, results) => {
      if (error) reject(error);
      const { otp, verificationToken } = results[0];
      resolve({ otp, verificationToken });
    });
  });
}

async function makeFinalRequest(headers, payload) {
  let sHeaders = headers;
  let sPayload = payload;
  try {
    const { status, data } = await axios.post(
      'https://applydl.dotm.gov.np/license/apply',
      payload,
      { headers },
    );

    const errorMessage =
      data &&
      data.props &&
      data.props.errors &&
      Object.keys(data.props.errors).length > 0;
    if (status === 200 && !errorMessage) {
      // Check for successfull alerts
      const successAlerts =
        data && data.props && data.props.alerts && data.props.alerts.length > 0;

      return {
        status,
        isError: false,
        message: successAlerts
          ? JSON.stringify(data.props.alerts[0])
          : 'No success alerts!',
      };
    } else if (status === 200 && errorMessage) {
      console.log('sucess with errors!', data.props.errors);
      return {
        status,
        isError: true,
        message: JSON.stringify(data.props.errors || ''),
      };
    } else {
      console.log('uncovered case in apply success', status, errorMessage);
      console.log('uncovered case', data, status);
      return {
        status,
        isError: true,
        message: 'Uncovered case',
      };
    }
  } catch (error) {
    const { data, status } = error.response;
    console.log('Apply  error', status);
    if ([401, 409].includes(status)) {
      return {
        status: status,
        isError: true,
        message: '401 or 409 case!',
      };
    } else {
      console.log('Retrying applying process.....', status);
      makeFinalRequest(sHeaders, sPayload);
    }
  }
}

async function udpateSetting({
  officeId,
  province,
  quotaCategory,
  inertiaVersion,
  dateAd,
  dateBs,
}) {
  let udpateSetting =
    'Update `otp-verification` SET officeId=?, province=?, quotaCategory=?, inertiaVersion=?, dateAd=?, dateBs=?';
  return new Promise((resolve, reject) => {
    db.query(
      udpateSetting,
      [officeId, province, quotaCategory, inertiaVersion, dateAd, dateBs],
      (error, results) => {
        if (error) reject(false);
        resolve(true);
      },
    );
  });
}

async function getDynamicInfo() {
  let getDynamicInfo =
    'SELECT officeId, province, inertiaVersion, quotaCategory, dateAd, dateBs from `otp-verification`';
  return new Promise((resolve, reject) => {
    db.query(getDynamicInfo, (error, results) => {
      if (error) reject(error);
      resolve(results[0]);
    });
  });
}

async function bulkApply() {
  try {
    const users = await getAllUsersId();
    const unresolvedProcess = users.map((user) => {
      return bulkApplyProcess(user.userId);
    });
    await Promise.all(unresolvedProcess);
    return 'Process started!';
  } catch (error) {
    console.log(error);
  }
}
async function bulkApplyProcess(userId) {
  try {
    const { category } = await getCategory(userId);
    const { inertiaVersion, province, officeId, dateAd, dateBs } =
      await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const { verificationToken, otp } = await getOtpAndToken();
    const payload = {
      category_id: category,
      province_id: province,
      office_id: officeId,
      visit_date_bs: dateBs,
      visit_date_ad: dateAd,
      is_urgent: false,
      urgency_reason_id: '',
      documents: {},
      disclaimer: true,
      otp: otp,
      verification: verificationToken,
    };

    const submissionRes = await makeFinalRequest(headers, payload);
    return {
      ...submissionRes,
      userId,
    };
  } catch (error) {
    console.log(error);
  }
}

async function getAllUsersId() {
  let getUsers = 'SELECT userId from `user-session` WHERE userType = ?';
  return new Promise((resolve, reject) => {
    db.query(getUsers, ['normal'], (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

module.exports = router;
