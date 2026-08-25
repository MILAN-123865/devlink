/**
 * Authentication Gatekeeper verifying that deleted users cannot authenticate.
 */
async function verifyUserStatusGate(req, res, next) {
  // Assuming req.user was previously loaded by your core JWT token decoding layers
  if (req.user && req.user.status === 'DELETED') {
    return res.status(403).json({
      error: 'Account Terminated',
      message: 'This account identity has been permanently deleted and cannot be re-authenticated.'
    });
  }
  next();
}

module.exports = { verifyUserStatusGate };
