const router = require('express').Router({mergeParams: true});
const controller = require('./tags.controller');

const TAGModel= require('./tags.model');

router.get('/', controller.getTags);
router.get('/:name', controller.getTagByName);
/*router.post('/', controller.createTag);
router.patch('/:name', controller.editTag);
router.delete('/:name', controller.deleteTag);*/

module.exports = router;