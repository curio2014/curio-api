ERRORS = {
  NEED_LOGIN: {
    status: 403,
    code: 4031,
    message: 'login required'
  },
  NOT_ALLOWED: {
    status: 403,
    code: 4032,
    message: 'not allowed'
  },
  LOGIN_FAILED: {
    status: 401,
    code: 4010,
    message: 'login failed'
  },
  BAD_REQUEST: {
    status: 401,
    code: 4011,
    message: 'bad request'
  },
  MISSING_FIELD: {
    status: 401,
    code: 4012,
    message: 'required parameter missing'
  },
  INVALID_TOKEN: {
    status: 500,
    code: 5001,
    message: 'invalid token'
  },
  NOT_FOUND: {
    status: 404,
    code: 404
  },
};

exports.ERRORS = ERRORS;
