const TAGModel= require('./tags.model');

module.exports = {getTags, getTagByName};

async function getTags(req, res) {
  return TAGModel.find({})
  .populate('posts')
  .then(response => res.json(response));
}

async function getTagByName(req, res) {
  return TAGModel.find({name: req.params.name})
  .populate('posts')
  .then(response => {
    if (!response) return res.status(404).json({ message: "Page Not Found" });
    return res.json(response);
  })
}

/*async function createTag(req, res) {
  return TAGModel.create(req.body.name)
  .then(response => {
    return editTag(response._id)
  })
}

async function editTag(req, res) {
  return TAGModel.findOneAndUpdate({name: req.params.name}, { $push: { posts: req.body._id }, {
    useFindAndModify: false,
    runValidators: true,
  })
}*/