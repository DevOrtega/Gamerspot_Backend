const SPONSORModel = require("./sponsors.model");
const REFRESHTOKENModel = require("../refreshtokens/refreshtokens.model");
const USERModel = require("../users2/users.model");
const GAMERModel = require("../gamers/gamers.model");
const TEAMModel = require("../teams/teams.model");
const jwt = require("jsonwebtoken");

module.exports = {
  getSponsors,
  getSponsorById,
  createSponsor,
  editSponsor,
  deleteSponsor,
  addPlayer,
  addTeam,
  deletePlayer,
  deleteTeam,
  refreshToken,
  revokeToken,
};

async function getSponsors(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1)
      return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;

  return SPONSORModel.find()
    .select("-_id")
    .populate("teams")
    .populate("players")
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

async function getSponsorById(req, res) {
  const id = req.params.id;

  if (req.token && req.token.user.sponsor._id === id) {
    return SPONSORModel.findOne({ _id: id })
      .select("-_id")
      .populate("teams")
      .populate("players")
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
    return SPONSORModel.findOne({ _id: id })
      .select("-_id")
      .populate("teams")
      .populate("players")
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

async function createSponsor(req, res) {
  return SPONSORModel.create(req.body)
    .then((response) => {
      const edited_user = setEditedUserFields(response);
      return USERModel.findOneAndUpdate({ _id: response.owner }, edited_user, {
        useFindAndModify: false,
        runValidators: true,
      })
        .then((response) => {
          if (!response)
            return res.status(404).json({ message: "Page Not Found" });
          return getSponsors(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function editSponsor(req, res) {
  const edited_sponsor = setEditedSponsorFields(req.body);

  return SPONSORModel.findOneAndUpdate({ _id: req.params.id }, edited_sponsor, {
    useFindAndModify: false,
    runValidators: true,
  })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });
      return getSponsorById(req, res);
    })
    .catch((error) => {
      return res.status(400).json(error);
    });
}

async function deleteSponsor(req, res) {
  const id = req.params.id;

  return SPONSORModel.findOne({ _id: id })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });

      response[0].teams.forEach(async (id) => {
        return TEAMModel.updateOne(
          { _id: id },
          { $pull: { sponsors: req.params.id } }
        ).catch((error) => {
          return res.status(500).json(error);
        });
      });

      response[0].players.forEach(async (id) => {
        return GAMERModel.updateOne(
            { _id: id },
            { $pull: { sponsors: req.params.id } }
          ).catch((error) => {
          return res.status(500).json(error);
        });
      });

      return SPONSORModel.deleteOne({ _id: id })
        .then(() => {
          return USERModel.updateOne(
            { username: response[0].owner.username },
            { $pull: { sponsor: req.params.id } }
          )
            .then(() => {
              return getSponsors(req, res);
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
  const edited_sponsor = setEditedSponsorFields(req.body);
  return GAMERModel.findOneAndUpdate({ _id: req.body.player_id }, edited_gamer, {
    useFindAndModify: false,
    runValidators: true,
  })
    .then((response) => {
      return SPONSORModel.findOneAndUpdate(
        { _id: req.params.id },
        edited_sponsor,
        {
          useFindAndModify: false,
          runValidators: true,
        }
      )
        .then((response) => {
          if (!response)
            return res.status(404).json({ message: "Page Not Found" });
          return getSponsorById(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function addTeam(req, res) {
  const edited_team = setEditedTeamFields(req.params.id);
  const edited_sponsor = setEditedSponsorFields(req.body);
  return TEAMModel.findOneAndUpdate({ _id: req.body.team_id }, edited_team, {
    useFindAndModify: false,
    runValidators: true,
  })
    .then((response) => {
      return SPONSORModel.findOneAndUpdate(
        { _id: req.params.id },
        edited_sponsor,
        {
          useFindAndModify: false,
          runValidators: true,
        }
      )
        .then((response) => {
          if (!response)
            return res.status(404).json({ message: "Page Not Found" });
          return getSponsorById(req, res);
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

  return SPONSORModel.updateOne({ _id: id }, { $pull: { players: player_id } })
    .then(() => {
      return GAMERModel.updateOne(
        { _id: player_id },
        { $pull: { sponsors: id } }
      )
        .then(() => {
          return getSponsorById(req, res);
        })
        .catch((error) => {
          return res.status(500).json(error);
        });
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function deleteTeam(req, res) {
  const id = req.params.id;
  const team_id = req.body.team_id;

  return SPONSORModel.updateOne({ _id: id }, { $pull: { teams: team_id } })
    .then(() => {
      return TEAMModel.updateOne({ _id: team_id }, { $pull: { sponsors: id } })
        .then(() => {
          return getSponsorById(req, res);
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

function setEditedSponsorFields(req_body) {
  const edited_sponsor = {};

  if (req_body.name !== undefined) {
    edited_sponsor.name = req_body.name;
  }

  if (req_body.player_id !== undefined) {
    edited_sponsor.players = req_body.player_id;
  }

  if (req_body.team_id !== undefined) {
    edited_sponsor.teams = req_body.team_id;
  }

  return edited_sponsor;
}

function setEditedGamerFields(sponsor_id) {
  const edited_gamer = {};

  if (sponsor_id !== undefined) {
    edited_gamer.sponsors = sponsor_id;
  }

  return edited_gamer;
}

function setEditedTeamFields(sponsor_id) {
  const edited_team = {};

  if (sponsor_id !== undefined) {
    edited_team.sponsors = sponsor_id;
  }
  return edited_team;
}

function setEditedUserFields(req_body) {
  const edited_user = {};
  if (req_body._id !== undefined) {
    edited_user.sponsor = req_body._id;
  }
  return edited_user;
}
