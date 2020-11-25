const USERModel = require("./users.model");
const REFRESHTOKENModel = require("../refreshtokens/refreshtokens.model");
const POSTModel = require("../posts/posts.model");
const GAMERModel = require("../gamers/gamers.model");
const TEAMModel = require("../teams/teams.model");
const SPONSORModel = require("../sponsors/sponsors.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
  getUsers,
  getUserByUsername,
  registerUser,
  loginUser,
  refreshToken,
  revokeToken,
  editUser,
  deleteUser,
};

async function getUsers(req, res) {
  let page = 1;

  if (req.query.page) {
    page = parseInt(req.query.page);

    if (!Number.isInteger(page) || page < 1)
      return res.status(400).json({ message: "Bad Request" });
  }

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;

  return USERModel.find()
    .select("-_id -password -email")
    .populate({
      path: 'gamer',
      select: '-_id'
    })
    .populate({
      path: 'team',
      select: '-_id'
    })
    .populate({
      path: 'sponsor',
      select: '-_id'
    })
    .populate({
      path: 'posts',
      select: '-_id'
    })
    .skip(skip)
    .limit(PAGE_SIZE)
    .then((response) => {
      if (response.length === 0 && page > 1)
        return res.status(404).json({ message: "Page Not Found" });

      return res.json(response);
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

async function getUserByUsername(req, res) {
  const username = req.params.username;

  if (req.token && req.token.user.username === username) {
    return USERModel.findOne({ username: username })
      .select("-password")
      .populate("gamer")
      .populate("team")
      .populate("sponsor")
      .populate("posts")
      .then((response) => {
        if (!response)
          return res.status(404).json({ message: "Page Not Found" });

        return res.json(response);
      })
      .catch((error) => {
        return res.status(500).json(error);
      });
  } else {
    return USERModel.findOne({ username: username })
      .select("-_id -email -password")
      .populate("sponsor")
      .populate("team")
      .populate("gamer")
      .populate("posts")
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

async function registerUser(req, res) {
  if (!req.body.password) {
    return res.status(400).json({ message: "Password Can't Be Empty" });
  }

  req.body.password = bcrypt.hashSync(req.body.password, 10);

  return USERModel.create(req.body)
    .then(async create_user_response => {
      switch(req.body.role) {
        case "Gamer":
          return GAMERModel.create({
            name: req.body.name,
            bornDate: req.body.bornDate,
            owner: create_user_response._id,
          })
          .then(async gamer_response => {
            return USERModel.findOneAndUpdate(
              { _id : create_user_response._id },
              { gamer: gamer_response._id },
              { useFindAndModify: false, runValidators: true }
            )
            .then(() => {
              return res.json(create_user_response);
            })
            .catch(error => {
              return res.status(500).json(error);
            })
          })
          .catch(error => {
            return res.status(500).json(error);
          })
          
        case "Team":
          return TEAMModel.create({
            name: req.body.name,
            owner: create_user_response._id
          })
          .then(async team_response => {
            return USERModel.findOneAndUpdate(
              { _id : create_user_response._id },
              { team: team_response._id },
              { useFindAndModify: false, runValidators: true }
            )
            .then(() => {
              return res.json(create_user_response);
            })
            .catch(error => {
              return res.status(500).json(error);
            })
          })
          .catch(error => {
            return res.status(500).json(error);
          })

        case "Sponsor":
          return SPONSORModel.create({
            name: req.body.name,
            owner: create_user_response._id
          })
          .then(async sponsor_response => {
            return USERModel.findOneAndUpdate(
              { _id : create_user_response._id },
              { sponsor: sponsor_response._id },
              { useFindAndModify: false, runValidators: true }
            )
            .then(() => {
              return res.json(create_user_response);
            })
            .catch(error => {
              return res.status(500).json(error);
            })
          })
          .catch(error => {
            return res.status(500).json(error);
          })
      }
    })
    .catch((error) => {
      return res.status(500).json(error);
    })
}

async function loginUser(req, res) {
  return USERModel.findOne({
    $or: [{ username: req.body.username }, { email: req.body.username }],
  })
    .populate('gamer')
    .populate('team')
    .populate('sponsor')
    .populate('posts')
    .then((user_response) => {
      if (!user_response) {
        return res.status(400).json({ message: "Invalid User Or Password" });
      }

      if (!bcrypt.compareSync(req.body.password, user_response.password)) {
        return res.status(400).json({ message: "Invalid User Or Password" });
      }

      const token = jwt.sign({ user: user_response }, process.env.TOKEN_KEY, {
        expiresIn: 180,
      });
      const refresh_token = jwt.sign(
        { user: user_response },
        process.env.REFRESH_TOKEN_KEY,
        { expiresIn: 7776000 }
      );

      return REFRESHTOKENModel.find({
        "access_token.username": user_response.username,
      })
        .countDocuments()
        .then(async (token_response) => {
          if (token_response >= 50) {
            await REFRESHTOKENModel.deleteMany({
              "access_token.username": user_response.username,
            }).catch((error) => {
              return res.status(500).json(error);
            });
          }

          const refresh_token_obj = {
            refresh_token: refresh_token,
            access_token: {
              username: user_response.username,
              token: token,
            },
          };

          return REFRESHTOKENModel.create(refresh_token_obj)
            .then(() => {
              const cookieOptions = {
                sameSite: "strict",
                httpOnly: true,
                maxAge: 90 * 24 * 60 * 60 * 1000,
              };

              res.cookie("refresh_token", refresh_token, cookieOptions);
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
}

async function refreshToken(req, res) {
  try {
    const refresh_token = getCookies(req)["refresh_token"];

    return REFRESHTOKENModel.findOne({ refresh_token: refresh_token })
    .then((token_response) => {
      if (!token_response) return res.status(404).json({ message: "Bad Request" });

      return USERModel.findOne({
        username: token_response.access_token.username,
      })
      .populate({
        path: 'gamer',
        select: '-_id'
      })
      .populate({
        path: 'team',
        select: '-_id'
      })
      .populate({
        path: 'sponsor',
        select: '-_id'
      })
      .populate({
        path: 'posts',
        select: '-_id'
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

async function editUser(req, res) {
  const edited_user = setEditedUserFields(req.body);

  return USERModel.findOneAndUpdate(
    { username: req.params.username },
    edited_user,
    { useFindAndModify: false, runValidators: true }
  )
  .then((user_response) => {
    if (!user_response) return res.status(404).json({ message: "Page Not Found" });
    switch(req.body.role) {
      case "Gamer":
        return GAMERModel.findOneAndUpdate(
          { owner: user_response._id },
          edited_user,
          { useFindAndModify: false, runValidators: true }
        )
        .then(role_response => {
          return res.json(role_response);
        })
        .catch(error => {
          return res.status(500).json(error);
        })
        
      case "Team":
        return TEAMModel.findOneAndUpdate(
          { owner: user_response._id },
          edited_user,
          { useFindAndModify: false, runValidators: true }
        )
        .then(role_response => {
          return res.json(role_response);
        })
        .catch(error => {
          return res.status(500).json(error);
        })

      case "Sponsor":
        return SPONSORModel.findOneAndUpdate(
          { owner: user_response._id },
          edited_user,
          { useFindAndModify: false, runValidators: true }
        )
        .then(role_response => {
          return res.json(role_response);
        })
        .catch(error => {
          return res.status(500).json(error);
        })
    }
  })
  .catch((error) => {
    return res.status(400).json(error);
  });
}

async function deleteUser(req, res) {
  const username = req.params.username;
  return USERModel.find({ username: username })
    .then((response) => {
      if (!response) return res.status(404).json({ message: "Page Not Found" });

      response[0].posts.forEach(async (id) => {
        return POSTModel.deleteOne({ _id: id }).catch((error) => {
          return res.status(500).json(error);
        });
      });

      return GAMERModel.deleteOne({ _id: response[0].gamer })
        .then(() => {
          return TEAMModel.deleteOne({ _id: response[0].team })
            .then(() => {
              return SPONSORModel.deleteOne({ _id: response[0].sponsor })
                .then(() => {
                  return USERModel.deleteOne({ username: username })
                    .then(() => {
                      return getUsers(req, res);
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
    })
    .catch((error) => {
      return res.status(500).json(error);
    });
}

/**
 *  Auxiliar functions
 */

function setEditedUserFields(req_body) {
  const edited_user = {};

  if (req_body.name !== undefined) {
    edited_user.name = req_body.name;
  }

  if (req_body.password !== undefined) {
    edited_user.password = bcrypt.hashSync(req_body.password, 10);
  }

  if (req_body.email !== undefined) {
    edited_user.email = req_body.email;
  }
  
  if (req_body.country !== undefined) {
    edited_user.country = req_body.country;
  }

  if (req_body.photoUrl !== undefined) {
    edited_user.photoUrl = req_body.photoUrl;
  }

  if (req_body.games !== undefined) {
    edited_user.games = req_body.games;
  }

  if (req_body.links !== undefined) {
    edited_user.links = req_body.links;
  }

  if (req_body.biography !== undefined) {
    edited_user.biography = req_body.biography;
  }

  if (req_body.bornDate !== undefined) {
    edited_user.bornDate = req_body.bornDate;
  }

  return edited_user;
}

function getCookies(request) {
  var cookies = {};

  request.headers &&
    request.headers.cookie.split(";").forEach(function (cookie) {
      var parts = cookie.match(/(.*?)=(.*)$/);
      cookies[parts[1].trim()] = (parts[2] || "").trim();
    });
  return cookies;
}
