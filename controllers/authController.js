const authService = require("../services/authService");

// Controllers stay thin on purpose: pull data out of req, hand it to the
// service, shape the response. No password logic, no duplicate checks —
// that all lives in authService.js. If we swapped Express for another
// framework tomorrow, authService.js wouldn't need to change at all.

async function signup(req, res) {
  const { user, token } = await authService.signup(req.body);
  res.status(201).json({ success: true, data: { user, token } });
}

async function signin(req, res) {
  const { user, token } = await authService.signin(req.body);
  res.status(200).json({ success: true, data: { user, token } });
}

module.exports = { signup, signin };
