const POSTModel= require('./posts.model');
const USERModel= require('../users/users.model');

module.exports = {getPosts, getPostById, createPost, editPost, deletePost};


async function getPosts(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1) return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;

  return POSTModel.find()
  .populate({
    path: 'owner',
    select: 'name',
    skip: skip,
    limit: PAGE_SIZE
  })
  .select('-_id text createdAt owner')
  .then(response => {
    return res.json(response);
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}


async function getPostById(req, res) {
  return POSTModel.findById(req.params._id)
  .populate({
    path: 'owner',
    select: 'name',
    skip: skip,
    limit: PAGE_SIZE
  })
  .select('-_id text createdAt owner')
  .then(response => {
    return res.json(response);
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}


async function createPost(req, res) {
  return POSTModel.create(req.body)
  .then(response => {
    return USERModel.updateOne({ username: response.owner.username }, { $push: { postsId: response._id }})
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


async function editPost(req, res) {
  return POSTModel.findOneAndUpdate({username: req.params.username}, req.body, { runValidators: true })
  .then(response => {
    if (!response) return res.status(404).json({ message: "Page Not Found" });
    return res.json(response);
  })
  .catch(error => {
    return res.status(400).json(error);
  })
}


async function deletePost(req, res) {
  return POSTModel.findOneAndDelete({_id: req.params._id})
  .then(async response => {
    return USERModel.updateOne({ username: response.owner.username }, { $pull: { postsId: response._id } })
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

function setNewTweet(req_body, owner) {
  const new_tweet = {};

  new_tweet.text = req_body.text;
  new_tweet.owner = owner;

  return new_tweet;
}