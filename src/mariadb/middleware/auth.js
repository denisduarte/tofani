const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

const jwt = require('jsonwebtoken')
const { User, Token } = require('../sequelize')

var env = dotenv.config()
dotenvExpand(env)

const auth = async(req, res, next) => {

    const token = req.header('Authorization').replace('Bearer ', '').toString()
    const data = await jwt.verify(token, process.env.JWT_KEY);

    try {
        const user = await User.findOne({ where: { _id: data._id } ,
                                        include: [{
                            								model: Token,
                            								where: { token: token }
                            							}]
                                        })
        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()
    } catch (error) {
        console.log(error);
        res.status(401).send({ error: 'Not authorized to access this resource' })
    }

}

module.exports = auth
