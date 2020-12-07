const GAMERModel = require("./gamers.model");
const USERModel = require("../users/users.model");
const REFRESHTOKENModel = require("../refreshtokens/refreshtokens.model");
const SPONSORModel = require("../sponsors/sponsors.model");
const TEAMModel = require("../teams/teams.model");

module.exports = {
  getGamers,
  getGamerById,
  createGamer,
  editGamer,
  deleteGamer,
  refreshToken,
  revokeToken,
};

async function getGamers(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1)
      return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;
  if (req.query.sponsor) {
    return SPONSORModel.findOne({ _id: req.query.sponsor })
      .select("_id")
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return GAMERModel.find({ sponsors: response._id })
          .populate({
            path: "sponsors",
            select: "-_id",
            skip: skip,
            limit: PAGE_SIZE,
          })
          .select("-_id")
          .then((response) => {
            if (!response)
              return res.status(404).json({ message: "Page Not Found" });

            return res.json(response);
          })
          .catch((error) => {
            return res.status(500).json(error);
          });
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  } else if (req.query.team) {
    return TEAMModel.findOne({ _id: req.query.team })
      .select("_id")
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return GAMERModel.find({ teams: response._id })
          .populate({
            path: "teams",
            select: "-_id",
            skip: skip,
            limit: PAGE_SIZE,
          })
          .select("-_id")
          .then((response) => {
            if (!response)
              return res.status(404).json({ message: "Page Not Found" });

            return res.json(response);
          })
          .catch((error) => {
            return res.status(500).json(error);
          });
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  } else {
    return GAMERModel.find()
      .select("name")
      .populate("teams")
      .populate("sponsors")
      .populate({
        path: "owner",
        select: "-_id -password -email",
        populate: "postsId",
        skip: skip,
        limit: PAGE_SIZE,
      })
      .then((response) => {
        if (response.length === 0 && page > 1)
          return res.status(404).json({ message: "Page Not Found" });

        return res.json(response);
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  }
}

async function getGamerById(req, res) {
  const id = req.params.id;
  if (req.token && req.token.user.gamer._id === id) {
    return GAMERModel.findOne({ _id: id })
      .select("-_id")
      .populate("team")
      .populate("sponsors")
      .populate({
        path: "owner",
        select: "-_id -password",
        populate: "postsId",
      })
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return res.json(response);
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  } else {
    return GAMERModel.findOne({ _id: id })
      .select("-_id")
      .populate("team")
      .populate("sponsors")
      .populate({
        path: "owner",
        select: "-_id -password -email",
        populate: "postsId",
      })
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return res.json(response);
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  }
}

async function createGamer(req, res) {
  return GAMERModel.create(req.body)
    .then((response) => {
      const edited_user = setEditedUserFields(response);
      return USERModel.findOneAndUpdate({ _id: response.owner }, edited_user, {
        useFindAndModify: false,
        runValidators: true,
      })
        .then((response) => {
          if (!response)
            return res.status(404).json({ message: "Page Not Found" });
          return getGamers(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function editGamer(req, res) {
  const edited_gamer = setEditedGamerFields(req.body);

  return GAMERModel.findOneAndUpdate({ _id: req.params.id }, edited_gamer, {
    useFindAndModify: false,
    runValidators: true,
  })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });
      return getGamerById(req, res);
    })
    .catch((error) => {
      return res.status(400).json(error);
    });
}

async function deleteGamer(req, res) {
  const id = req.params.id;

  return GAMERModel.findOne({ _id: id })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });

      response[0].sponsors.forEach(async (id) => {
        return SPONSORModel.updateOne(
          { _id: id },
          { $pull: { players: req.params.id } }
        ).catch((error) => {
          return res.status(500).json(error);
        });
      });
      return TEAMModel.updateOne(
        { _id: response[0].team },
        { $pull: { players: req.params.id } }
      )
        .then(() => {
          return GAMERModel.deleteOne({ _id: id })
            .then(() => {
              return USERModel.updateOne(
                { username: response[0].owner.username },
                { $pull: { gamer: req.params.id } }
              )
                .then(() => {
                  return getGamers(req, res);
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
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function refreshToken(req, res) {
  try {
    const refresh_token = getCookies(req)["refresh_token"];

    return REFRESHTOKENModel.findOne({ refresh_token: refresh_token })
      .then((token_response) => {
        if (!token_response)
          return res.status(404).json({ message: "Bad Request" });

        return USERModel.findOne({
          username: token_response.access_token.username,
        })
          .then((user_response) => {
            const token = jwt.sign(
              { user: user_response },
              process.env.TOKEN_KEY,
              { expiresIn: 180 }
            );

            const access_token = {
              username: user_response.username,
              token: token,
            };

            return REFRESHTOKENModel.updateOne(
              { refresh_token: refresh_token },
              { access_token: access_token }
            )
              .then(() => {
                return res.json({ token: token });
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
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function revokeToken(req, res) {
  try {
    const refresh_token = getCookies(req)["refresh_token"];

    return REFRESHTOKENModel.findOneAndDelete({ refresh_token: refresh_token })
      .then(() => {
        return res.json({ message: "Refresh token revoked" });
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  } catch (error) {
    return res.status(500).json(error);
  }
}

/**
 *  Auxiliar functions
 */

function setEditedGamerFields(req_body) {
  const edited_gamer = {};

  if (req_body.name !== undefined) {
    edited_gamer.name = req_body.name;
  }

  if (req_body.bornDate !== undefined) {
    edited_gamer.bornDate = req_body.bornDate;
  }

  return edited_gamer;
}

function setEditedUserFields(req_body) {
  const edited_user = {};
  if (req_body._id !== undefined) {
    edited_user.gamer = req_body._id;
  }
  return edited_user;
}
