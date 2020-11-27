const POSTModel= require('./posts.model');
const USERModel= require('../users2/users.model');
const USER = require('../users2/users.model');

module.exports = {getPosts, getPostById, createPost, editPost, deletePost};

async function getPosts(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1) return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;

  if (req.query.username) {
    return USER.findOne({ username: req.query.username})
    .select('_id')
    .then(response => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });

      return POSTModel.find({ owner: response._id })
      .populate({
        path: 'owner',
        populate: {
          path: 'gamer team sponsor'
        },
        select: 'username photoUrl country',
        skip: skip,
        limit: PAGE_SIZE
      })
      .select('_id text createdAt owner')
      .then(response => {
        if (!response) return res.status(404).json({ message: "Page Not Found" });

        return res.json(response);
      })
      .catch(error => {
        return res.status(500).json(error);
      })
    })
    .catch(error => {
      return res.status(500).json(error);
    })
  } else {
    return POSTModel.find()
    .populate({
      path: 'owner',
      populate: {
        path: 'gamer team sponsor'
      },
      select: 'username photoUrl',
      skip: skip,
      limit: PAGE_SIZE
    })
    .select('-_id text createdAt owner')
    .then(response => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });

      return res.json(response);
    })
    .catch(error => {
      return res.status(500).json(error);
    })
  }
}


async function getPostById(req, res) {
  return POSTModel.findById(req.params.id)
  .populate({
    path: 'owner',
    select: 'username',
    skip: skip,
    limit: PAGE_SIZE
  })
  .select('_id text createdAt owner')
  .then(response => {
    return res.json(response);
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}


async function createPost(req, res) {
  return POSTModel.create(req.body)
  .then((createResponse) => {
    return USERModel.findOneAndUpdate({ _id: req.token.user._id }, { $push: { posts: createResponse._id } }, {
      useFindAndModify: false,
      runValidators: true,
    })
      .then((response) => {
        return POSTModel.findOneAndUpdate({ _id: createResponse._id }, {owner: response._id}, {
          useFindAndModify: false,
          runValidators: true,
        })
        .then( ()=> {
          return getPosts(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  })
  .catch((error) => {
    return res.status(500).json(error);
  });
}


async function editPost(req, res) {
  const edited_post = setEditedPostFields(req.body);
  return POSTModel.findOneAndUpdate({_id: req.params.id}, edited_post, {
    useFindAndModify: false,
    runValidators: true,
  })
  .then(response => {
    if (!response) return res.status(404).json({ message: "Page Not Found" });
    return res.json(response);
  })
  .catch(error => {
    return res.status(400).json(error);
  })
}


async function deletePost(req, res) {
  return POSTModel.findOneAndDelete({_id: req.params.id})
  .then(async response => {
    return USERModel.updateOne({ username: response.owner.username }, { $pull: { posts: response._id } })
    .then(() => {
      return res.json(response);
    })
    .catch(error => {
      return res.status(500).json(error);
    })
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}



/** 
 *  Auxiliar functions
 */

function setEditedUserFields(req_body) {
  const edited_user = {};
  if (req_body._id !== undefined) {
    edited_user.posts = req_body._id;
  }
  return edited_user;
}

function setEditedPostFields(req_body) {
  const edited_post = {};

  if (req_body.text !== undefined) {
    edited_post.text = req_body.text;
  }
  
  return edited_post;
}