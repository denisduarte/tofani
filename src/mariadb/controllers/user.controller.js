const { User, Token, Book } = require('../sequelize')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
var env = dotenv.config()
dotenvExpand(env)

User.beforeCreate(async (user, options) => {
  const hashedPassword = await bcrypt.hash(user.password, 8);
  user.password = hashedPassword;
});

exports.create = async (user) => {
  const token = jwt.sign({_id: user._id}, process.env.JWT_KEY);
  user.Tokens = [ { token: token } ];
  const newUser = await User.create(user, { include: [ Token ] })
                            .then(user => { return user; })
                            .catch((err) => { throw new Error('DUPLICATED_MAIL'); });

  return {user: newUser, token: token }
};


exports.login = async (credentials) => {
  var user = await User.findOne({
                                  where: { email: credentials.email },
                                  include: [
                                    {
                                      model: Book,
                                      as: "wishlist",
                                      attributes: ['_id'],
                                      through: { attributes: ["createdAt"]}
                                   },
                                   {
                                     model: Book,
                                     as: 'borrowing',
                                     attributes: ['_id'],
                                     through: {
                                         where: { returned: false },
                                         attributes: ["createdAt", "dueDate"]
                                     }
                                   },
                                   {
                                     model: Book,
                                     as: 'waiting',
                                     attributes: ['_id'],
                                     through: { attributes: ["createdAt"]}
                                   }
                                 ]
                                })
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  //CHECK PASSWORD
  const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordMatch) {
      throw new Error('INVALID_CREDENTIALS');
  }

  //generate authorization token
  const token = jwt.sign({_id: user._id}, process.env.JWT_KEY)

  Token.create({ token: token, UserId: user._id })

  //to password doesn't be returned
  user.password = null;

  return {user, token};
};
