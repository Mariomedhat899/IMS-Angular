window.IMS_API = {
  BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? './api'
    : 'http://imsapp.runasp.net',
  TOKEN_KEY: 'ims_token',
  EMAIL_KEY: 'ims_email',
  ROLE_KEY: 'ims_role'
};
