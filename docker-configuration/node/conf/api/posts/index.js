const router = require('express').Router({mergeParams: true});
const controller = require('./posts.controller');
const jwt = require('jsonwebtoken');

router.get('/', controller.getPosts);
router.get('/:id', controller.getPostById);
router.post('/', authenticateToken, authenticateUser, controller.createPost);
router.patch('/:id', authenticateToken, authenticateUser,  controller.editPost);
router.delete('/:id', authenticateToken, authenticateUser,  controller.deletePost);


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
  if (req.user.user.role === 'admin') {
    next();
  }

  if (req.params.username !== req.user.user.username) {
    return res.status(401).json({ message: "Unauthorized" });
  }
    
  next();
}

module.exports = router;