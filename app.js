var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const sess = {
  secret: 'ausazko hitz multzoa',
  cookie: {},
  resave: true,
  saveUninitialized: true
}
app.use(session(sess))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar la autenticación de dos factores
function verify2FA(req, res, next) {
  if (req.session.authenticatedWith2FA) {
    // El usuario ya está autenticado con 2FA
    return next();
  } else {
    // Redirigir a la página de inicio de sesión o mostrar un formulario de 2FA
    res.redirect('/login');
  }
}

// Ruta para generar el secreto y el código QR
app.get('/generate-2fa', (req, res) => {
  const secret = speakeasy.generateSecret({ length: 20 });

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    req.session.temporarySecret = secret.base32;
    res.json({ dataURL: data_url });
  });
});

// Ruta para verificar los códigos generados por Google Authenticator
app.post('/verify-2fa', (req, res) => {
  const { token } = req.body;
  const verified = speakeasy.totp.verify({
    secret: req.session.temporarySecret,
    encoding: 'base32',
    token: token,
  });

  if (verified) {
    req.session.authenticatedWith2FA = true;
    res.json({ success: true, message: 'Código válido' });
  } else {
    res.status(401).json({ success: false, message: 'Código no válido' });
  }
});

app.use('/', indexRouter);
app.use('/users', verify2FA, usersRouter); // Aplicar el middleware solo a rutas de usuarios autenticados

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
