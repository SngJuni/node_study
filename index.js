const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser')
const app = express();
const port = 8000;

const { User } = require("./models/User")
const { auth } = require('./middleware/auth')
const config = require('./config/key');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

mongoose
    .connect(config.mongoURI)
    .then(() => console.log("MongoDB connected.."))
    .catch((err) => {
        console.log(err);
    });

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post('/register', async (req, res) => {
    const user = new User(req.body)

    await user
    .save()
    .then(() => {
        res.status(200).json({
            success: true,
        });
    })
    .catch((err) => {
        console.error(err);
        res.json({
            success: false,
            err: err,
        })
    })
})

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
      if (!user) {
          return res.json({
              loginSuccess: false,
              message: "제공된 이메일에 해당하는 유저가 없습니다."
          })
      }

    const isMatch = await user.comparePassword(req.body.password)
      if (!isMatch)
        return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다."})

    const token = user.generateToken();

    res.cookie("x_auth", user.token)
    .status(200)
    .json({ loginSuccess: true, userId: user._id })
  } catch (err) {
    return res.status(400).json({ loginSuccess: false, error: err })
  } 
})

app.get('/users/auth', auth, (req, res) => {

  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  })
})

app.get('/users/logout', auth, async (req, res) => {
  try {
    await User.findOneAndUpdate({ _id: req.user._id }, { token: "" })
    return res.status(200).send({
      success: true
    })
  } catch (err) {
    return res.json({ success: false, err })
  }
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});