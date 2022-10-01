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
      userId,
    });
  } catch (error) {
    console.log(error);
    res.json({
      error,
    });
    // return Error(error.message || 'Problem in getting the session values!');
  }
});

router.get('/applicationStatusCheck/:userId', async (req, res, next) => {
  try {
    const userId = req.params && req.params.userId;
    if (!userId) {
      res.json({
        status: 400,
        isError: true,
        message: 'Provide user id!',
      });
    }
    const unauthenticatedSystem = await checkApplicationStatus(userId);
    res.json({
      ...unauthenticatedSystem,
      userId,
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
    bulkApply();
    res.json({
      isError: false,
      message: 'Process started please view logs for more info...!',
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
  const { otp: otpCode, userId } = req.body;
  if (otpCode) {
    const updateOtpRes = await updateOtpCode(userId, otpCode);
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
  const { username, password, category, province, office } = req.body;
  let createUser =
    'INSERT INTO `user-session`(userId, password, category, province, office) VALUES(?,?,?,?,?)';
  db.query(
    createUser,
    [username, password, category, province, office],
    (error, results) => {
      if (error) {
        res.json({
          status: 400,
          isError: true,
          message: error.message ? error.message : 'Not created!',
        });
      } else {
        // TODO: If verification user then create otp-verification records
        res.json({
          status: 201,
          isError: false,
          message: 'User created!',
        });
      }
    },
  );
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
    const { category, province, office: officeId } = await getCategory(userId);
    const { inertiaVersion, dateAd, dateBs } = await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const { verificationToken, otp } = await getOtpAndToken();

    // Update token booking
    await updateOtpExpiry(otp);

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
    res.json({
      isError: false,
      message: error || 'Maybe no active tokens!',
      userId,
    });
  }
});

router.post('/applyAddCatForm/:userId', async (req, res, next) => {
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
    const { category, province, office: officeId } = await getCategory(userId);
    const { inertiaVersion, dateAd, dateBs } = await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const { verificationToken, otp } = await getOtpAndToken();

    // Update token booking
    await updateOtpExpiry(otp);

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

    const submissionRes = await makeAddCatFinalRequest(headers, payload);
    res.json({
      ...submissionRes,
      userId,
    });
  } catch (error) {
    res.json({
      isError: false,
      message: error || 'Maybe no active tokens!',
      userId,
    });
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
        return {
          statusCode: status,
          isError: false,
          message:
            `Available: ${data.quotas[lastInfo].available} |  Reserved: ${data.quotas[lastInfo].reserved} | Booked: ${data.quotas[lastInfo].booked}` ||
            'N/A',
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
    console.log(error);
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
    const {
      quotaCategory,
      inertiaVersion,
      province,
      officeId,
      dateAd,
      dateBs,
    } = await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
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
        console.log(
          'Unable to get verification token, retrying....!',
          data.props.alerts,
        );
        sendOTP(userId);
      }
      const updatedRes =
        verification &&
        (await updateTokenVerificationCode(userId, verification));
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

async function updateTokenVerificationCode(userId, verificationCode) {
  return new Promise((resolve, reject) => {
    let updateTV =
      'UPDATE `otp-verification` SET verificationToken =?, usedCount=?, status=? WHERE userId=?';
    db.query(
      updateTV,
      [verificationCode, 0, 'active', userId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      },
    );
  });
}

/**
 * Sends OTP and updates the otp code.
 * @returns
 */

async function updateOtpCode(userId, otpCode) {
  return new Promise((resolve, reject) => {
    let updateOTP = 'UPDATE `otp-verification` SET otp=? WHERE userId=?';
    db.query(updateOTP, [otpCode, userId], (error, results) => {
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
 * Checks the application's category and filled status
 */
async function checkApplicationStatus(userId) {
  try {
    const { inertiaVersion } = await getDynamicInfo();
    const headers = await getHeaders(userId, inertiaVersion);
    const { status, data } = await axios.get('https://applydl.dotm.gov.np/', {
      headers,
    });
    if (status === 200) {
      const { props } = data;
      return {
        statusCode: status,
        isError: false,
        message: 'This is tst',
        message: `Type: ${
          props.cards.apply
            ? 'New license'
            : props.cards.category
            ? 'Add Category'
            : 'Unknown type'
        }, Status: ${
          props.cards.apply && props.cards.apply.disabled === true
            ? 'Registered'
            : props.cards.category && props.cards.category.disabled === true
            ? 'Registered'
            : 'Not Registered'
        }`,
      };
    } else {
      return {
        type: null,
        message: 'Not a 200 status!',
      };
    }
  } catch (error) {
    return {
      type: null,
      message: error.message || 'Error while checking the status',
    };
  }
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
  let getCategory =
    'SELECT category, province, office from `user-session` WHERE userId = ?';
  return new Promise((resolve, reject) => {
    db.query(getCategory, [userId], (error, results) => {
      if (error) reject(error);
      const { category, province, office } = results[0];
      resolve({ category, province, office });
    });
  });
}

async function getOtpAndToken() {
  let getTokenInfo =
    'SELECT otp, verificationToken from `otp-verification` where status=?';
  return new Promise((resolve, reject) => {
    db.query(getTokenInfo, ['active'], (error, results) => {
      if (error) reject(error);
      else {
        if (results.length < 1) {
          reject('No active verification token!');
        } else {
          const { otp, verificationToken } = results[0];
          resolve({ otp, verificationToken });
        }
      }
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

      if (successAlerts) {
        // TODO increase successfull form counts
        console.log('Success alerts aru pani huna sakxa case', data);
      } else {
        revertOtpExpiry(payload.otp);
      }

      return {
        status,
        isError: false,
        message: successAlerts
          ? JSON.stringify(data.props.alerts[0])
          : 'No success alerts!',
      };
    } else if (status === 200 && errorMessage) {
      console.log('sucess with errors!', data.props.errors);
      await revertOtpExpiry(payload.otp);
      return {
        status,
        isError: true,
        message: JSON.stringify(data.props.errors || ''),
      };
    } else {
      console.log('uncovered case in apply success', status, errorMessage);
      await revertOtpExpiry(payload.otp);
      return {
        status,
        isError: true,
        message: 'Uncovered case',
      };
    }
  } catch (error) {
    revertOtpExpiry(payload.otp);
    const { data, status } = error.response;
    // console.log('Apply  error', error);
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

async function makeAddCatFinalRequest(headers, payload) {
  let sHeaders = headers;
  let sPayload = payload;
  try {
    const { status, data } = await axios.post(
      'https://applydl.dotm.gov.np/license/category',
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

      if (successAlerts) {
        // TODO increase successfull form counts
        console.log('Success alerts aru pani huna sakxa case', data);
      } else {
        revertOtpExpiry(payload.otp);
      }

      return {
        status,
        isError: false,
        message: successAlerts
          ? JSON.stringify(data.props.alerts[0])
          : 'No success alerts!',
      };
    } else if (status === 200 && errorMessage) {
      console.log('sucess with errors!', data.props.errors);
      await revertOtpExpiry(payload.otp);
      return {
        status,
        isError: true,
        message: JSON.stringify(data.props.errors || ''),
      };
    } else {
      console.log('uncovered case in apply success', status, errorMessage);
      await revertOtpExpiry(payload.otp);
      return {
        status,
        isError: true,
        message: 'Uncovered case',
      };
    }
  } catch (error) {
    revertOtpExpiry(payload.otp);
    const { data, status } = error.response;
    console.log('Apply  error', error);
    if ([401, 409, 422].includes(status)) {
      return {
        status: status,
        isError: true,
        message: data.message || '401 or 409 case!',
      };
    } else {
      console.log('Retrying applying process.....', status);
      makeAddCatFinalRequest(sHeaders, sPayload);
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
    'Update `dynamic-info` SET officeId=?, province=?, quotaCategory=?, inertiaVersion=?, dateAd=?, dateBs=?';
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
    'SELECT officeId, province, inertiaVersion, quotaCategory, dateAd, dateBs from `dynamic-info`';
  return new Promise((resolve, reject) => {
    db.query(getDynamicInfo, (error, results) => {
      if (error) reject(error);
      resolve(results[0]);
    });
  });
}

// async function bulkApply() {
//   try {
//     const users = await getAllUsersId();
//     const unresolvedProcess = users.map((user) => {
//       return bulkApplyProcess(user.userId);
//     });
//     await Promise.all(unresolvedProcess);
//     return 'Process started!';
//   } catch (error) {
//     console.log(error);
//   }
// }
// async function bulkApplyProcess(userId) {
//   try {
//     const { category } = await getCategory(userId);
//     const { inertiaVersion, province, officeId, dateAd, dateBs } =
//       await getDynamicInfo();
//     const headers = await getHeaders(userId, inertiaVersion);
//     const { verificationToken, otp } = await getOtpAndToken();
//     const payload = {
//       category_id: category,
//       province_id: province,
//       office_id: officeId,
//       visit_date_bs: dateBs,
//       visit_date_ad: dateAd,
//       is_urgent: false,
//       urgency_reason_id: '',
//       documents: {},
//       disclaimer: true,
//       otp: otp,
//       verification: verificationToken,
//     };

//     const submissionRes = await makeFinalRequest(headers, payload);
//     return {
//       ...submissionRes,
//       userId,
//     };
//   } catch (error) {
//     console.log(error);
//     res.json({
//       status: 400,
//       isError: true,
//     });
//   }
// }

async function getAllUsersId() {
  let getUsers = 'SELECT userId from `user-session` WHERE userType = ?';
  return new Promise((resolve, reject) => {
    db.query(getUsers, ['normal'], (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

async function updateOtpExpiry(otpCode) {
  try {
    let getVerificationCodeStatus =
      'SELECT usedCount, status FROM `otp-verification` WHERE otp=?';
    let udpateOtpStatus;
    let updateStatusArgs;
    const vstatus = await runSqlQuery(getVerificationCodeStatus, [otpCode]);
    const { usedCount, status } = vstatus[0];
    const newCount = usedCount + 1;
    if (newCount >= 3) {
      udpateOtpStatus =
        'UPDATE `otp-verification` SET usedCount=?, status=? WHERE otp=?';
      updateStatusArgs = [newCount, 'expired', otpCode];
    } else {
      udpateOtpStatus =
        'UPDATE `otp-verification` SET usedCount=?, status=? WHERE otp=?';
      updateStatusArgs = [newCount, 'active', otpCode];
    }
    await runSqlQuery(udpateOtpStatus, updateStatusArgs);
    return true;
  } catch (error) {
    console.log(error);
  }
}

async function revertOtpExpiry(otp) {
  try {
    let reverseExpiry =
      'UPDATE `otp-verification` SET usedCount=usedCount - 1, status=? WHERE otp=?';
    await runSqlQuery(reverseExpiry, ['active', otp]);
  } catch (error) {
    console.log(error);
  }
}

// Helper method to run sql query as promise
async function runSqlQuery(query, args) {
  return new Promise((resolve, reject) => {
    db.query(query, args, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

module.exports = router;
