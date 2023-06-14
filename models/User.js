const mongoose = require("mongoose")
const bcrypt = require('bcrypt')
const saltRounds = 10
const jwt = require('jsonwebtoken')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 10,
    },
    email: {
        type: String,
        trim: true,
        unique: 1,
    },
    password: {
        type: String,
        minlength: 5,
    },
    lastname: {
        type: String,
        maxlength: 50,
    },
    role: {
        type: Number,
        default: 0,
    },
    image: String,
    token: {
        type: String,
    },
    tokenExp: {
        type: Number,
    },
});

userSchema.pre('save', function(next) {
    var user = this

    if (user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) return next(err)
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        next()
    }
})
  
userSchema.methods.comparePassword = function(plainPassword) {
    const user = this
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, user.password)
        .then(isMatch => resolve(isMatch))
        .catch(err => reject(err))
    })
}
userSchema.methods.generateToken = function() {
    const user = this
    const token = jwt.sign(user._id.toHexString(), 'secretToken')
    user.token = token
    return user.save().then(savedUser => savedUser)
}

userSchema.statics.findByToken = function(token) {
    const User = this
    let decoded
  
    try {
      decoded = jwt.verify(token, 'secretToken')
    } catch (err) {
      return Promise.reject(err)
    }
  
    return User.findOne({ _id: decoded, token })
} 

const User = mongoose.model("User", userSchema);

module.exports = { User };