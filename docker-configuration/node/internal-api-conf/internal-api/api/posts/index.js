const router = require('express').Router({mergeParams: true});
const controller = require('./posts.controller');
const jwt = require('jsonwebtoken');

const POSTModel= require('./posts.model');

router.get('/', controller.getPosts);
router.get('/:id', controller.getPostById);
router.post('/', authenticateToken, controller.createPost);
router.patch('/:id', authenticateToken, authenticateUser,  controller.editPost);
router.delete('/:id', authenticateToken, authenticateUser,  controller.deletePost);


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

  return POSTModel.findById(req.params.id)
  .then(response => {

    if (response.owner.toString() !== req.token.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  })
}

module.exports = router;