var express = require('express');
var router = express.Router();
const mongojs = require('mongojs')
const db = mongojs('mongodb://127.0.0.1:27017/test', ['sgssi'])
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');


//username and password
const myusername = 'daniel'
const mypassword = 'sculptures'

function updateUser2FASecret(username, secret) {
  return new Promise((resolve, reject) => {
    // Utilizar updateOne con upsert: true para insertar o actualizar
    db.sgssi.updateOne({ username }, { $set: { secret } }, { upsert: true }, (err) => {
      if (err) {
        console.log("Error updating user in the database");
        reject(err);
      } else {
        console.log("User updated or inserted successfully");
        resolve();
      }
    });
  });
}


getUser2FASecret = (username) => {
  return new Promise((resolve, reject) => {
    db.sgssi.findOne({ username: username }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result && result.secret) {
          resolve(result.secret);

        } else {
          reject(`User ${username} not found or does not have a secret.`);
        }
      }
    });
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login.php.html', function(req, res, next) {
  res.render('login', { message: '' });
});

router.get('/dashboard.php.html', function(req, res, next) {
  console.log(req.session)
  if(req.session.userid){
    res.render('dashboard', { });
  }else{
    res.redirect('/login.php.html')
  }
});

router.post("/login.php.html", async function (req, res, next) {
  const userToken = req.body.token; // Assuming you have the user from the request
  const username = req.body.username;

  try{
    const storedSecret = await getUser2FASecret(username); // Get the secret from MongoDB
    console.log(storedSecret);
    if (!storedSecret) {
        return res.status(401).json({ message: '2FA not setup for this user' });
    }

  const verified = speakeasy.totp.verify({
    secret: storedSecret,
    encoding: "base32",
    token: userToken,
  });

  console.log("Verified:" + verified);

  if (
    verified &&
    req.body.username == myusername &&
    req.body.password == mypassword
  ) {
    req.session.userid = req.body.username;
    console.log(req.session);
    res.redirect("/dashboard.php.html");
  } else {
    res.render("login", { message: "Invalid username or password" });
  }

    } catch (error) {
        res.status(500).json({ message: 'Error during login' });
    }
  }
  
);

router.get("/setup-2fa", async (req, res) => {
  const user = req.query.username; // Assuming you get the username from the request
  console.log(user);
  const secret = speakeasy.generateSecret({ length: 20 });

  console.log(secret.base32); // Save this value to your DB for the user
  try {
    console.log('Username:', user, 'Secret:', secret);
    updateUser2FASecret(user, secret.base32); //Store the secret in MongoDB
    
    QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
      // Send data_url to the frontend to display as a QR code
      res.send(`<img src='${data_url}'>`);
    });
  } catch (error) {
    res.status(500).json({ message: "Error setting up 2FA" });
  }
});

module.exports = router;
