window.IMS_API = {
  BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? './api'
    : 'https://<YOUR-API-URL>',
  TOKEN_KEY: 'ims_token',
  EMAIL_KEY: 'ims_email',
  ROLE_KEY: 'ims_role'
};
