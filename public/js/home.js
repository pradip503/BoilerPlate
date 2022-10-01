async function applicantLogin(userId) {
  try {
    $(`#${userId}`).text('Loading.....');
    const { data, status } = await axios.get(`/users/${userId}`);
    $(`#${data.userId}`).text(data.message);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function verificationUserLogin(userId) {
  try {
    // console.log('user id', userId);
    // setLoadingMessage();
    $(`#v-${userId}`).text('Loading...');
    const { data, status } = await axios.get(`/users/${userId}`);
    // setSuccessMessage(data);
    $(`#v-${userId}`).text(data.message);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function checkQuota(userId) {
  try {
    setLoadingMessage();

    const { data, status } = await axios.get(`/users/checkQuota/${userId}`);

    setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function sendOTP(userId) {
  try {
    // setLoadingMessage();
    $(`#v-${userId}`).text('Loading...');
    const { data, status } = await axios.get(`/users/sendOTP/${userId}`);
    $(`#v-${userId}`).text(data.message);
    // setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function updateOtp(userId) {
  try {
    const otp = $(`#${userId}`).val();
    if (!otp) {
      alert('Please provide valid otp!');
      return;
    }
    setLoadingMessage();
    const { data, status } = await axios.post('/users/updateOtp', {
      otp,
      userId,
    });
    setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function createNewUser() {
  try {
    const username = $('#username').val();
    const password = $('#password').val();
    const category = $('#category').val();
    const province = $('#province').val();
    const office = $('#office').val();

    if (!username || !password || !category || !province || !office) {
      alert('Please provide valid values!');
      return;
    }

    setLoadingMessage();
    const { data, status } = await axios.post('/users/createUser', {
      username,
      password,
      category,
      province,
      office,
    });
    closeUserAddModal();
    setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function applyForm(userId) {
  try {
    // setLoadingMessage();
    $(`#${userId}`).text('Loading.....');
    const { data, status } = await axios.post(`/users/applyForm/${userId}`);
    // setSuccessMessage(data);
    $(`#${data.userId}`).text(data.message);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function applyAddCategoryForm(userId) {
  try {
    // setLoadingMessage();
    $(`#${userId}`).text('Loading.....');
    const { data, status } = await axios.post(
      `/users/applyAddCatForm/${userId}`,
    );
    // setSuccessMessage(data);
    $(`#${data.userId}`).text(data.message);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function applicationStatusCheck(userId) {
  try {
    // setLoadingMessage();
    $(`#${userId}`).text('Loading.....');
    const { data, status } = await axios.get(
      `/users/applicationStatusCheck/${userId}`,
    );
    // setSuccessMessage(data);
    $(`#${data.userId}`).text(data.message);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function updateSettings() {
  try {
    const officeId = $('#office').val();
    const province = $('#province').val();
    const quotaCategory = $('#quotaCategory').val();
    const inertiaVersion = $('#inertiaVersion').val();
    const dateAd = $('#dateAd').val();
    const dateBs = $('#dateBs').val();
    if (
      !officeId ||
      !province ||
      !quotaCategory ||
      !inertiaVersion ||
      !dateAd ||
      !dateBs
    ) {
      alert('Some fields seems empty!');
      return;
    }
    const { data, status } = await axios.post('/users/updateSetting', {
      officeId,
      province,
      quotaCategory,
      inertiaVersion,
      dateAd,
      dateBs,
    });

    $('#successAlert').css('display', 'block');
    $('#successAlert').text(data.message);
  } catch (error) {
    console.log(error);
    $('#errorAlert').css('display', 'block');
    $('#errorAlert').text(error.message || 'Something went wrong!');
  }
}

function bulkApply() {
  try {
    let applyButtons = $('.applyButton') || [];
    for (let i = 0; i < applyButtons.length; i++) {
      applyButtons[i].click();
    }
    // console.log('object');
    // setLoadingMessage();
    // const { data, status } = await axios.post('/users/bulkApply');
    // setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    // setErrorMessage(error);
  }
}

function bulkAddCatApply() {
  try {
    let applyButtons = $('.applyAddCatButton') || [];
    for (let i = 0; i < applyButtons.length; i++) {
      applyButtons[i].click();
    }
    // console.log('object');
    // setLoadingMessage();
    // const { data, status } = await axios.post('/users/bulkApply');
    // setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    // setErrorMessage(error);
  }
}

function bulkLogin() {
  try {
    let applyButtons = $('.loginButton') || [];
    for (let i = 0; i < applyButtons.length; i++) {
      applyButtons[i].click();
    }
  } catch (error) {
    console.log(error);
  }
}

function bulkSendOtp() {
  try {
    let sendOTPButtons = $('.sendOtpButton') || [];
    for (let i = 0; i < sendOTPButtons.length; i++) {
      sendOTPButtons[i].click();
    }
  } catch (error) {
    console.log(error);
  }
}

function bulkVerificationLogin() {
  try {
    let loginVButtons = $('.verificationUserLogin') || [];
    for (let i = 0; i < loginVButtons.length; i++) {
      loginVButtons[i].click();
    }
  } catch (error) {
    console.log(error);
  }
}

function addUser() {
  $('#addUserModal').modal('show');
}

function closeUserAddModal() {
  $('#addUserModal').modal('hide');
}

function setLoadingMessage() {
  $('#status').text('Loading...');
  $('#message').text('Loading...');
  $('#error').text('Loading...');
}

function setErrorMessage(error) {
  $('#status').text(error.response.status || 'N/A');
  $('#message').text(error.message || 'Something went wrong');
  $('#error').text(true);
}

function setSuccessMessage(data) {
  if (data.isError) {
    $('.messageBox').css('background-color', '#ffcccb');
  } else {
    $('.messageBox').css('background-color', '#caeec2');
  }
  $('#status').text(data.statusCode);
  $('#message').text(data.message);
  $('#error').text(data.isError);
}
