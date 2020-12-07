const POSTModel= require('./posts.model');
const USERModel= require('../users/users.model');
const TAGModel= require('../tags/tags.model');

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
    return USERModel.findOne({ username: req.query.username})
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
  let tags = req.body.tags;
  
  delete req.body.tags;

  return POSTModel.create(req.body)
  .then(async createResponse => {
    return USERModel.findOneAndUpdate({ _id: req.token.user._id }, { $push: { posts: createResponse._id } }, {
      useFindAndModify: false,
      runValidators: true,
    })
    .then(async updateUserResponse => {
      return POSTModel.findOneAndUpdate({ _id: createResponse._id }, { owner: updateUserResponse._id }, {
        useFindAndModify: false,
        runValidators: true,
      })
      .then(async () => {
        if (tags && tags.length > 0) {
          try {
            if (tags.length > 100) {
              tags.splice(100);
            }

            const storedTags = await TAGModel.find({});

            let tagsToCreate = [];

            const storedTagsNames = storedTags.map(tag => tag.name);

            tags.forEach((tag) => {
              if (!storedTagsNames.includes(tag.name)) {
                tagsToCreate.push(tag);
              }
            })

            if (storedTags.length >= 100) {
              const oldestTags = await TAGModel.find({}).sort({createdAt: 1});

              let tagsToDelete = [];

              oldestTags.forEach(oldestTag => {
                if (!tags.some(tag => tag.name === oldestTag.name)) {
                  tagsToDelete.push(oldestTag);
                }
              })

              tagsToDelete.forEach(async tagToDelete => {
                await TAGModel.findOneAndDelete({ _id: tagToDelete._id });
                await POSTModel.updateMany({ }, { $pull: { tags: tagToDelete._id } }, {
                  useFindAndModify: false,
                  runValidators: true
                })
              })
            }
          } catch(error) {
            return res.status(500).json(error);
          }

          await tags.forEach(async tag => {
            return TAGModel.findOneAndUpdate({ name: tag.name }, { $push: { posts: createResponse._id } }, {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
              useFindAndModify: false,
              runValidators: true
            })
            .then(async updateTagResponse => {
              return POSTModel.findOneAndUpdate({ _id: createResponse._id }, { $push: { tags: updateTagResponse._id } }, {
                useFindAndModify: false,
                runValidators: true,
              })
              .catch((error) => {
                return res.status(500).json(error);
              })
            })
            .catch((error) => {
              return res.status(500).json(error);
            })
          })
        }
        
        return getPosts(req, res);
      })
      .catch((error) => {
        return res.status(500).json(error);
      })
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
    runValidators: true
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
    .then(async () => {
      await response.tags.forEach(async tag => {
        return TAGModel.findOneAndUpdate({ _id: tag}, { $pull: { posts: response._id } }, {
          new: true,
          useFindAndModify: false,
          runValidators: true
        })
        .then(async updateTagResponse => {
          if (updateTagResponse.posts.length === 0) {
            return TAGModel.findOneAndDelete({ _id: updateTagResponse._id })
            .catch(error => {
              return res.status(500).json(error);
            })
          }
          console.log(updateTagResponse);
        })
        .catch(error => {
          return res.status(500).json(error);
        })
      })

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