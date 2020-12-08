const router = require('express').Router();
const controller = require('./sponsors.controller');
const jwt = require('jsonwebtoken');

router.get('/', controller.getSponsors);
router.get('/:id', optionalAuthenticateToken,controller.getSponsorById);
router.post('/', controller.createSponsor);
router.post('/refresh-token', controller.refreshToken);
router.post('/revoke-token', controller.revokeToken);
router.patch('/:id', authenticateToken, authenticateUser, controller.editSponsor);
router.delete('/:id', authenticateToken, authenticateUser, controller.deleteSponsor);
router.patch('/:id/add_player',  controller.addPlayer);
router.patch('/:id/delete_player',  controller.deletePlayer);
router.patch('/:id/add_team', controller.addTeam);
router.patch('/:id/delete_team', controller.deleteTeam);

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

  if (req.params.id !== req.token.user.sponsor) {
    return res.status(401).json({ message: "Unauthorized" });
  }
    
  next();
}

module.exports = router;