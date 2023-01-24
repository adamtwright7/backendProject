const express = require("express");
const app = express();
const PORT = 3010;
// importing stuff for sessions and cookies
const session = require("express-session");
const cookieParser = require("cookie-parser");
const models = require("./sequelize/models");
const { Customers } = require("./sequelize/models"); // replace this with magic item data later
const router = express.Router(); // we should start using router

// connect session sequelize
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const store = new SequelizeStore({ db: models.sequelize });
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    store: store,
  })
);
store.sync();

// body parser for forms
const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// All the other middlewear
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

// session middlewear:
const authenticate = (req, res, next) => {
  if (req.session.user) {
    next(); // like a return statement for Middlewear
  } else {
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  res.render("pages/home");
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.get("/account", authenticate, (req, res) => {
  res.render("pages/account", { user: { username: "Joe" } });
});

// log in
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Customers.findOne({
    where: {
      username: username,
    },
  });
  if (!user) {
    res.status(400).send("Username not found");
    return;
  }
  if (user.password === req.body.password) {
    // add a session that stores user data
    req.session.user = user.dataValues;
    console.log(req.session.user);
    res.redirect("/account");
    return;
  } else {
    res.status(400).send("incorrect username or password");
  }
});

// log out -- not finished
app.post("/logout", (res, req) => {
  if (req.session) {
    req.session.destroy();
    res.redirect("/pages/login");
  }
});

// listen
app.listen(PORT, console.log(`Listening on port ${PORT}`));
