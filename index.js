const express = require("express");
const app = express();
const PORT = 3010;
// importing stuff for sessions and cookies
app.use(express.static(__dirname + "/public"));
const session = require("express-session"); // for sessions
const cookieSession = require("cookie-session"); // for cookies
const bodyParser = require("body-parser");
const models = require("./sequelize/models");
const { Customers, Orders, Products } = require("./sequelize/models"); // replace this with magic item data later
const { Op } = require("sequelize"); // we're going to need some advanced querries
const bcrypt = require("bcrypt"); // for hashing passwords

// connect session sequelize
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// const SequelizeStore = require("connect-session-sequelize")(session.Store);
// const store = new SequelizeStore({ db: models.sequelize });
app.use(
  cookieSession({
    name: "session",
    keys: ["secrethaha"],
    maxAge: 14 * 24 * 60 * 60 * 1000,
  })
);
// store.sync();

// body parser for forms
const { where } = require("sequelize");
const { application } = require("express");

// All the other middlewear
app.set("view engine", "ejs");

// session middlewear:
const authenticate = (req, res, next) => {
  if (req.session.user) {
    next(); // like a return statement for Middlewear
  } else {
    res.render("pages/login", { modal: "Log in first." });
  }
};

// basic routes to account-specific pages -------------------------------------------------------
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
  res.render("pages/account", { user: req.session.user });
});

// Cart page. Populated with user data
app.get("/cart", (req, res) => {
  res.render("pages/cart", { user: req.session.user });
});

// Buy page. Requires you to have payment information. But it's basically just like "sorry Tasha doesn't deliver here."
// Later, we can make a different authentication function that triggers a pop-up telling you that you need to have payment information to buy stuff.
app.get("/buy", authenticate, (req, res) => {
  res.render("pages/buy", { user: req.session.user });
});

/// Post routes -- adding users to the Customers database and checking against that database. -------------------------------------------------------------------

// Sign up post route -- adds a new user to the Customers database.
app.post("/signup", async (req, res) => {
  const { email, username, password, paymentinfo, address } = req.body;

  // Detect non-emails
  if (!email.includes("@")) {
    res.render("pages/signup", { modal: "Enter a valid email." });
    return;
  }

  // Detect empty fields
  if (!username || !password || !paymentinfo || !address) {
    res.render("pages/signup", { modal: "Fill all fields." });
    return;
  }

  // Detect repeat users
  const user = await Customers.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });
  if (user) {
    res.render("pages/signup", {
      modal: "You already have an account. Log in instead.",
    });
    return;
  }

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
  res.render("pages/login", { modal: "Account created! Now log in." });
});

// Log in post route -- actually checks to see if that user exists in the database.
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // getting the user from the database
  const user = await Customers.findOne({
    where: {
      username: username,
    },
  });
  // checking username
  if (!user) {
    res.render("pages/login", { modal: "Username not found." });
    return;
  }
  // comparing passwords
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      res.render("pages/login", { modal: "Server error. Please try again." });
      return;
    }
    if (!result) {
      // result will be true if the passwords match
      res.render("pages/login", { modal: "Incorrect password. Try again." });
      return;
    }
    // If we're here, the passwords match. Add a session that stores user data and send them to the account page.
    req.session.user = user.dataValues;
    res.redirect("/account");
  });
});

// Modify account route. This is a post route, rather than a put route, because forms only allow get and post methods.
app.post("/modifyAccount", async (req, res) => {
  const { uemail, uusername, upassword, upaymentinfo, uaddress } = req.body; // The information that the user put in on this page. u = updated
  const { email, username, password, paymentinfo, address } = req.session.user; // The information that already exists of the user in the database (via the current session).

  // update the email. If the updated email exists and it's not equal to the existing email
  if (uemail && email !== uemail) {
    const user = await Customers.update(
      {
        email: uemail,
        updatedAt: new Date(),
      },
      {
        where: {
          email,
        },
      }
    );
  }

  // update the username
  if (uusername && username !== uusername) {
    const user = await Customers.update(
      {
        username: uusername,
        updatedAt: new Date(),
      },
      {
        where: {
          username,
        },
      }
    );
  }

  // update payment info
  if (upaymentinfo && paymentinfo !== upaymentinfo) {
    const user = await Customers.update(
      {
        paymentinfo: upaymentinfo,
        updatedAt: new Date(),
      },
      {
        where: {
          paymentinfo,
        },
      }
    );
  }

  // update address
  if (uaddress && address !== uaddress) {
    const user = await Customers.update(
      {
        address: uaddress,
        updatedAt: new Date(),
      },
      {
        where: {
          address,
        },
      }
    );
  }

  // update password with bcrypt
  if (upassword) {
    // update it in the database
    bcrypt.hash(upassword, 10, async (err, hash) => {
      Customers.update(
        {
          password: hash,
          updatedAt: new Date(),
        },
        { where: { username } } // searches for the current username
      );
    });
  }

  // log them out and send them back to the log in page.
  req.session = null;
  res.render("pages/login", { modal: "Account updated. Log in again." });
});

// Delete account. This is a post route as well, to conform with forms.
app.post("/deleteAccount", async (req, res) => {
  console.log(req.session.user);
  const { username, password } = req.session.user;
  Customers.destroy({
    where: { username },
  });
  res.redirect("/");
});

// log out
app.post("/logout", (req, res) => {
  if (req.session) {
    req.session = null;
    res.render("pages/login", { modal: "Logged out." });
  }
});

/// ------------------------------------------------------------------------------------------
// Product pages! Every page will be based on a similar ejs template, but be passed different data from the Products database.
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
