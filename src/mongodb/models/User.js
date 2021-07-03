const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
var env = dotenv.config()
dotenvExpand(env)

const userSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true,
             validate: value => {
               if (!validator.isEmail(value)) {
                 throw new Error({error: 'Invalid Email address'})
               }
             }
    },
    password: { type: String, required: true, minLength: 6 },
    acceptMailling: { type: Boolean, required: true },
    wishlist: [{
      BookID: { type: String, required: false },
      createdAt: { type: Date, required: false }
    }],
    tokens: [{
      token: { type: String, required: false }
    }]
})

// Hash the password before saving the user model
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

// Generate an auth token for the user
userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id}, process.env.JWT_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

// Search for a user by email and password.
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email } )
    if (!user) {
        throw new Error('INVALID_CREDENTIALS');
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error('INVALID_CREDENTIALS');
    }
    return user;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
