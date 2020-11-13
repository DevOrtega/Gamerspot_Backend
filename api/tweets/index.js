const router = require('express').Router({mergeParams: true});
const controller = require('./tweets.controller');
const jwt = require('jsonwebtoken');

router.get('/', controller.getTweets);
router.get('/:_id', controller.getTweetById);
router.post('/', authenticateToken, authenticateUser, controller.createTweet);
router.delete('/:_id', authenticateToken, authenticateUser,  controller.deleteTweet);


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.TOKEN_KEY, (error, dataStored) => {
    if (error) return res.status(403).json({ message: "Forbidden" })
    
    req.user = dataStored;
    next();
  })
}

function authenticateUser(req, res, next) {
  if (req.params.username !== req.user.user.username) {
    return res.status(401).json({ message: "Unauthorized" });
  }
    
  next();
}

module.exports = router;