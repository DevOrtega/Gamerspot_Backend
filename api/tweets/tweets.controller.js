const TWEETModel= require('./tweets.model');
const USERModel= require('../users/users.model');

module.exports = {getTweets, getTweetById, createTweet, deleteTweet};


async function getTweets(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1) return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;

  return USERModel.findOne({ username: req.params.username })
  .populate({
    path: 'tweetsId',
    select: 'text',
    skip: skip,
    limit: PAGE_SIZE
  })
  .select('-_id tweetsId')
  .then(response => {
    if (!response) return res.status(404).json({ message: "Page Not Found" });

    if (response.tweetsId.length === 0 && page > 1) return res.status(404).json({ message: "Page Not Found" });

    return res.json(response.tweetsId);
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}


async function getTweetById(req, res) {
  return USERModel.findOne({ username: req.params.username })
  .then(find_user_response => {
    if (!find_user_response) return res.status(404).json({ message: "Page Not Found" });

    if (!find_user_response.tweetsId.some(id => { return id.toString() === req.params._id })) {
      return res.status(404).json({ message: "Page Not Found" });
    }

    return TWEETModel.findById(req.params._id)
    .select('-_id text')
    .then(find_tweet_response => {
      return res.json(find_tweet_response);
    })
    .catch(error => {
      return res.status(500).json(error);
    })
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}


async function createTweet(req, res) {
  const new_tweet = setNewTweet(req.body, req.params.username);

  return USERModel.findOne({ username: req.params.username })
  .then(find_user_response => {
    if (!find_user_response) return res.status(404).json({ message: "Page Not Found" });

    return TWEETModel.create(new_tweet)
    .then(create_tweet_response => {
      return USERModel.updateOne({ username: req.params.username }, { $push: { tweetsId: create_tweet_response._id }})
      .then(() => {
        return getTweets(req, res);
      })
      .catch(error => {
        return res.status(500).json(error);
      })
    })
    .catch(error => {
      return res.status(500).json(error);
    })
  })
  .catch(error => {
    return res.status(500).json(error);
  })
}


async function deleteTweet(req, res) {
  return USERModel.findOne({ username: req.params.username })
  .then(response => {
    if (!response) return res.status(404).json({ message: "Page Not Found" });

    if (!response.tweetsId.some(id => { return id.toString() === req.params._id })) {
      return res.status(404).json({ message: "Page Not Found" });
    }

    return TWEETModel.deleteOne({_id: req.params._id})
    .then(() => {
      return USERModel.updateOne({ username: req.params.username }, { $pull: { tweetsId: req.params._id } })
      .then(() => {
        return getTweets(req, res);
      })
      .catch(error => {
        return res.status(500).json(error);
      })
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
  new_tweet.createdAt = Date.now();

  return new_tweet;
}