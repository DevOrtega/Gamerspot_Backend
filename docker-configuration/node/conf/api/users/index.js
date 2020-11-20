const router = require('express').Router();
const controller = require('./users.controller');
const jwt = require('jsonwebtoken');

router.get('/', controller.getUsers);
router.get('/:username', optionalAuthenticateToken, controller.getUserByUsername);
router.post('/register', controller.registerUser);
router.post('/login', controller.loginUser);
router.post('/refresh-token', controller.refreshToken);
router.post('/revoke-token', controller.revokeToken);
router.patch('/:username', authenticateToken, authenticateUser, controller.editUser);
router.delete('/:username', authenticateToken, authenticateUser, controller.deleteUser);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.TOKEN_KEY, (error, dataStored) => {
    if (error) return res.status(403).json({ message: "Forbidden" })

    req.token = dataStored;
    next();
  })
}

function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token !== null) {
    jwt.verify(token, process.env.TOKEN_KEY, (error, dataStored) => {
      if (!error) req.token = dataStored;
    })
  }
  
  next();
}

function authenticateUser(req, res, next) {
  if (req.token.user.role === 'admin') {
    next();
  }

  if (req.params.username !== req.token.user.username) {
    return res.status(401).json({ message: "Unauthorized" });
  }
    
  next();
}

module.exports = router;