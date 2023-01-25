const express = require("express");
const app = express();
const PORT = 3010;
// importing stuff for sessions and cookies
const session = require("express-session"); // for sessions
const cookieParser = require("cookie-parser"); // for cookies
const models = require("./sequelize/models");
const { Customers, Orders, Products } = require("./sequelize/models"); // replace this with magic item data later
const { Op } = require("sequelize"); // we're going to need some advanced querries
const bcrypt = require("bcrypt"); // for hashing passwords

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
const { where } = require("sequelize");
const { application } = require("express");
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

// basic routes to account-specific pages
app.get("/", (req, res) => {
  res.render("pages/home");
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.get("/signup", (req, res) => {
  res.render("pages/signUp");
});

app.get("/account", authenticate, (req, res) => {
  user = req.session.user;
  res.render("pages/account", { user });
});

// Cart page. Populated with user data
app.get("/cart", (req, res) => {
  user = req.session.user;
  res.render("pages/cart", { user });
});

// Buy page. Requires you to have payment information. But it's basically just like "sorry Tasha doesn't deliver here."
// Later, we can make a different authentication function that triggers a pop-up telling you that you need to have payment information to buy stuff.
app.get("/buy", authenticate, (req, res) => {
  user = req.session.user;
  res.render("pages/buy", { user });
});

/// Post routes -- adding users to the Customers database and checking against that database.

// Sign up post route -- adds a new user to the Customers database.

app.post("/signup", (req, res) => {
  const { email, username, password, paymentinfo, address } = req.body;
  if (!email.includes("@")) {
    res.status(400).send("Please enter a valid email.");
    return;
    // later, we should have a modal that pops up and says something like
    // "I know what emails are. Enter one."
  }
  if (!username || !password || !paymentinfo || !address) {
    res.status(400).send("Please fill all rows.");
    return;
  }
  // detect for repeats later

  bcrypt.hash(password, 10, async (err, hash) => {
    Customers.create({
      email,
      username,
      password: hash,
      paymentinfo,
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  res.status(200).send(`User ${username} added.`);
  // Should redirect to log in later.
});

// Log in post route -- actually checks to see if that user exists in the database.
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

// log out
app.post("/logout", (res, req) => {
  if (req.session) {
    req.session.destroy();
    res.redirect("/pages/login");
  }
});

/// Product pages! Every page will be based on a similar ejs template, but be passed different data from the Products database.
// The data from the Products database is currently contained in the 'Products' variable. I'll pass it to each page as the "trinkets" variable.
// This way the ejs files can all loop through the trinkets variable without any renaming between pages.
// (Also I'm passing a lil Tasha quip to each page)

// Armor page. I'll move the bracers and cloaks over here.
app.get("/products/armor", async (req, res) => {
  // get only the products that are armor

  let trinkets = await Products.findAll({
    where: {
      [Op.or]: [
        { type: { [Op.startsWith]: "Armor" } },
        { name: { [Op.startsWith]: "Cloak" } },
      ],
    },
  });

  let quip = "You wouldn't need any of this if you could learn my spells.";
  res.render("pages/products/armor", { trinkets, quip });
});

// Foci page
app.get("/products/foci", async (req, res) => {
  // get only the products that are armor

  let trinkets = await Products.findAll({
    where: {
      [Op.or]: [{ type: "Rod" }, { type: "Staff" }, { type: "Wand" }],
    },
  });

  let quip = "My Demonomicon is not for sale. These will have to do for you.";
  res.render("pages/products/foci", { trinkets, quip });
});

// Potions page
app.get("/products/potions", async (req, res) => {
  // get only the products that are armor

  let trinkets = await Products.findAll({
    where: {
      type: "Potion",
    },
  });

  let quip =
    "At least one of these is poisoned. I'm sure I labeled it as such.";
  res.render("pages/products/potions", { trinkets, quip });
});

// Rings page
app.get("/products/rings", async (req, res) => {
  // get only the products that are armor

  let trinkets = await Products.findAll({
    where: {
      type: "Ring",
    },
  });

  let quip = "A dozen fingers, and not one for me...";
  res.render("pages/products/rings", { trinkets, quip });
});

// Weapons page
app.get("/products/weapons", async (req, res) => {
  // get only the products that are armor

  let trinkets = await Products.findAll({
    where: {
      type: { [Op.startsWith]: "Weapon" },
    },
  });

  let quip = "Don't cut yourself. At least not in my store.";
  res.render("pages/products/weapons", { trinkets, quip });
});

// woundrousItems page
app.get("/products/wondrous_items", async (req, res) => {
  // get only the products that are armor

  let trinkets = await Products.findAll({
    where: {
      type: "Wondrous item",
    },
  });

  let quip = "Now these are trinkets.";
  res.render("pages/products/wondrousItems", { trinkets, quip });
});

// listen
app.listen(PORT, console.log(`Listening on port ${PORT}`));
