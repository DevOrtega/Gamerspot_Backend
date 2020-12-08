const USERModel = require("../users/users.model");
const REFRESHTOKENModel = require("../refreshtokens/refreshtokens.model");
const TEAMModel = require("./teams.model");
const GAMERModel = require("../gamers/gamers.model");
const SPONSORModel = require("../sponsors/sponsors.model");

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  editTeam,
  deleteTeam,
  addPlayer,
  deletePlayer,
  refreshToken,
  revokeToken,
};

async function getTeams(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1)
      return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;
  if (req.query.player) {
    return GAMERModel.findOne({ _id: req.query.player })
      .select("_id")
      .populate(team)
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return TEAMModel.find({ players: response._id })
          .populate({
            path: "players",
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
  } else if (req.query.sponsors) {
    return SPONSORModel.findOne({ _id: req.query.sponsors })
      .select("_id")
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return TEAMModel.find({ sponsors: response._id })
          .populate({
            path: "sponsors",
            select: "-_id",
            skip: skip,
            limit: PAGE_SIZE,
          })
          .populate({
            path: "owner",
            select: "-_id",
            skip: skip,
            limit: PAGE_SIZE,
          })
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
    return TEAMModel.find()
      .select("name")
      .populate("players")
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

async function getTeamById(req, res) {
  const id = req.params.id;
  if (req.token && req.token.user.team._id === id) {
    return TEAMModel.findOne({ _id: id })
      .select("-_id name")
      .populate("players")
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
    return TEAMModel.findOne({ _id: id })
      .select("-_id name")
      .populate("players")
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

async function createTeam(req, res) {
  return TEAMModel.create(req.body)
    .then((response) => {
      const edited_user = setEditedUserFields(response);
      return USERModel.findOneAndUpdate({ _id: response.owner }, edited_user, {
        useFindAndModify: false,
        runValidators: true,
      })
        .then((response) => {
          if (!response)
            return res.status(404).json({ message: "Page Not Found" });
          return getTeams(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function editTeam(req, res) {
  const edited_team = setEditedTeamFields(req.body);

  return TEAMModel.findOneAndUpdate({ _id: req.params.id }, edited_team, {
    useFindAndModify: false,
    runValidators: true,
  })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });
      return getTeamById(req, res);
    })
    .catch((error) => {
      return res.status(400).json(error);
    });
}

async function deleteTeam(req, res) {
  const id = req.params.id;

  return TEAMModel.findOne({ _id: id })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });

      response[0].gamers.forEach(async (id) => {
        return GAMERModel.deleteOne({ _id: id }).catch((error) => {
          return res.status(500).json(error);
        });
      });

      response[0].sponsors.forEach(async (id) => {
        return SPONSORModel.deleteOne({ _id: id }).catch((error) => {
          return res.status(500).json(error);
        });
      });

      return TEAMModel.deleteOne({ _id: id })
        .then(() => {
          return USERModel.updateOne(
            { username: response[0].owner.username },
            { team: null }
          )
            .then(() => {
              return getTeams(req, res);
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

async function addPlayer(req, res) {
  const edited_gamer = setEditedGamerFields(req.params.id);
  const edited_team = setEditedTeamFields(req.body);
  return GAMERModel.findOneAndUpdate(
    { _id: req.body.player_id },
    edited_gamer,
    {
      useFindAndModify: false,
      runValidators: true,
    }
  )
    .then((response) => {
      return TEAMModel.findOneAndUpdate({ _id: req.params.id }, edited_team, {
        useFindAndModify: false,
        runValidators: true,
      })
        .then((response) => {
          if (!response)
            return res.status(404).json({ message: "Page Not Found" });
          return getTeamById(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function deletePlayer(req, res) {
  const id = req.params.id;
  const player_id = req.body.player_id;
  return TEAMModel.updateOne({ _id: id }, { $pull: { players: player_id } })
    .then(() => {
      return GAMERModel.updateOne({ _id: player_id }, { team: null })
        .then(() => {
          return getTeamById(req, res);
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

function setEditedTeamFields(req_body) {
  const edited_team = {};

  if (req_body.name !== undefined) {
    edited_team.name = req_body.name;
  }

  if (req_body.player_id !== undefined) {
    edited_team.players = req_body.player_id;
  }

  if (req_body.sponsor_id !== undefined) {
    edited_team.sponsors = req_body.sponsor_id;
  }

  return edited_team;
}

function setEditedUserFields(req_body) {
  const edited_user = {};
  if (req_body._id !== undefined) {
    edited_user.team = req_body._id;
  }
  return edited_user;
}

function setEditedGamerFields(team_id) {
  const edited_gamer = {};
  if (team_id !== undefined) {
    edited_gamer.team = team_id;
  }
  return edited_gamer;
}
