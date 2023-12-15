var express = require('express');
var router = express.Router();


//username and password
const myusername = 'daniel'
const mypassword = 'sculptures'


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

router.post('/login.php.html', function(req, res, next) {
  if(req.body.username == myusername && req.body.password == mypassword){

    req.session.userid=req.body.username;
    console.log(req.session)
    res.redirect('/dashboard.php.html');
}
else{
  res.render('login', { message: 'Invalid username or password' });
}

  
});

module.exports = router;
