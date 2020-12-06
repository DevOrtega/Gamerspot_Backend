const router = require('express').Router();
const controller = require('./teams.controller');
const jwt = require('jsonwebtoken');

router.get('/', controller.getTeams);
router.get('/:id', optionalAuthenticateToken, controller.getTeamById);
router.post('/', controller.createTeam);
router.post('/refresh-token', controller.refreshToken);
router.post('/revoke-token', controller.revokeToken);
router.patch('/:id', authenticateToken, authenticateUser, controller.editTeam);
router.delete('/:id', authenticateToken, authenticateUser, controller.deleteTeam);
router.patch('/:id/add_player', authenticateToken, authenticateUser, controller.addPlayer);
router.patch('/:id/delete_player', authenticateToken, authenticateUser, controller.deletePlayer);

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
  if (req.params.id !== req.token.user.team) {
    return res.status(401).json({ message: "Unauthorized" });
  }
    
  next();
}

module.exports = router;