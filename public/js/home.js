async function applicantLogin(userId) {
  try {
    console.log('user id', userId);
    setLoadingMessage();
    const { data, status } = await axios.get(`/users/${userId}`);
    setSuccessMessage(data);
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
    setLoadingMessage();
    const { data, status } = await axios.get(`/users/sendOTP/${userId}`);
    setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
  }
}

async function updateOtp() {
  try {
    const otp = $('#otp').val();
    if (!otp) {
      alert('Please provide valid otp!');
      return;
    }

    setLoadingMessage();
    const { data, status } = await axios.post('/users/updateOtp', { otp });
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
    if (!username || !password || !category) {
      alert('Please provide valid values!');
      return;
    }

    setLoadingMessage();
    const { data, status } = await axios.post('/users/createUser', {
      username,
      password,
      category,
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

async function bulkApply() {
  try {
    console.log('object');
    setLoadingMessage();
    const { data, status } = await axios.post('/users/bulkApply');
    setSuccessMessage(data);
  } catch (error) {
    console.log(error);
    setErrorMessage(error);
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
