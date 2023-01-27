const express = require("express");
const router = express.Router(); // change app to router
const PORT = 3010;
// importing stuff for sessions and cookies
router.use(express.static(__dirname + "/public"));
const session = require("express-session"); // for sessions
const cookieSession = require("cookie-session"); // for cookies
const bodyParser = require("body-parser");
const { Customers, Orders, Products } = require("../sequelize/models"); // replace this with magic item data later
const { Op } = require("sequelize"); // we're going to need some advanced querries
const bcrypt = require("bcrypt"); // for hashing passwords

// connect session sequelize
router.use(express.json());
router.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
router.use(bodyParser.json());

// const SequelizeStore = require("connect-session-sequelize")(session.Store);
// const store = new SequelizeStore({ db: models.sequelize });
router.use(
  cookieSession({
    name: "session",
    keys: ["secrethaha"],
    maxAge: 14 * 24 * 60 * 60 * 1000,
  })
);

// session middlewear:
const authenticate = (req, res, next) => {
  if (req.session.user) {
    next(); // like a return statement for Middlewear
  } else {
    res.render("pages/login", { modal: "Log in first." });
  }
};

/// Basic get routes --------------------------------------------------------------------------

router.get("/login", (req, res) => {
  res.render("pages/login");
});

router.get("/signup", (req, res) => {
  res.render("pages/signUp");
});

router.get("/", authenticate, (req, res) => {
  res.render("pages/account", { user: req.session.user });
});

/// Sign in/out/modify account routes -------------------------------------------------------------------

// Sign up post route -- adds a new user to the Customers database.
router.post("/signup", async (req, res) => {
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
router.post("/login", async (req, res) => {
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
router.post("/modifyAccount", async (req, res) => {
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
router.post("/deleteAccount", async (req, res) => {
  console.log(req.session.user);
  const { username, password } = req.session.user;
  Customers.destroy({
    where: { username },
  });
  res.redirect("/");
});

// log out
router.post("/logout", (req, res) => {
  if (req.session) {
    req.session = null;
    res.render("pages/login", { modal: "Logged out." });
  }
});

module.exports = router;