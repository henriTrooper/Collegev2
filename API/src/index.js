const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const boom = require('express-boom');
const routemap = require('express-routemap');
const { initialize } = require('express-openapi');
const { Server } = require('http');
const { resolve } = require('path');
const mongoose = require('mongoose');
const pinoHttp = require('pino-http');
const swagger = require('swagger-ui-express');

const passport = require('passport'); // npm i passport --save-dev
const LocalStrategy = require('passport-local').Strategy; // npm i passport-local --save-dev
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy; // npm i passport-google-oauth --save-dev

const apiDoc = require('./api/api');
const config = require('./config');
const registerSchemas = require('./models');

const errorMiddleware = require('./middlewares/error.middleware');
const responseValidationMiddleware = require('./middlewares/response-validation.middleware');
const wormholeMiddleware = require('./middlewares/wormhole.middleware');

const Logger = require('./services/logger.service');

const app = express();

app.logger = Logger;
app.server = new Server(app);

// ###
// #region Lifecycle hooks
// ###

async function connectMongo(reconnectTries = 10, reconnectInterval = 1000) {
  try {
    await mongoose.connect(config.mongo.uri, {
      useNewUrlParser: true,
      ...config.mongo.opts,
    });
  } catch (err) {
    await new Promise((success, reject) => {
      if (reconnectTries > 0) {
        app.logger.warn('Retrying to connect to mongo');
        setTimeout(() => connectMongo(reconnectTries - 1, reconnectInterval).then(success, reject), reconnectInterval);
      } else reject(err);
    });
  }
}

/**
 * Called before starting the web server
 */
app.warmup = async function warmup() {
  this.logger.info('Server warming up');

  this.logger.info('Connecting to mongo');
  await connectMongo(config.mongo.reconnectTries, config.mongo.reconnectInterval);

  mongoose.connection.on('disconnected', () => {
    this.logger.warn('Mongodb disconnected!');
  });
  mongoose.connection.on('reconnectFailed', () => {
    this.logger.fatal('Retrying to connect to mongo failed !');
    app.close();
  });
};

/**
 * Called after the server has started
 */
app.started = function started() {
  const { address, port } = this.server.address();
  this.logger.info(`Started listening on ${address}:${port}`);
  if (!config.production) routemap(this);
};

/**
 * Called after the server has closed all requests
 */
app.closed = function closed() {
  this.logger.info('Server closed');
};

// Hooking up
app.server.on('close', () => app.closed());
app.server.on('listening', () => app.started());
app.server.on('error', err => app.logger.fatal(err));

// #endregion Lifecycle hooks

// ###
// #region Actions
// ###

/**
 * Starts the server
 */
app.start = async function start() {
  this.logger.info('Starting server');
  await app.warmup();
  app.server.listen(config.port);
};

/**
 * Closes the server
 */
app.close = async function close() {
  this.logger.info('Closing server');
  // // Close socket io connections
  // Object.keys(app.io.engine.clients).forEach((clientId) => {
  //   if (app.io.engine.clients[clientId]) {
  //     app.io.engine.clients[clientId].close();
  //   }
  // });
  // Close http server
  await mongoose.disconnect();
  this.logger.info('Connections closed');
  app.server.close();
};
// #endregion Actions

// ###
// #region Middlewares
// ###

// Request logger
app.use(pinoHttp({
  logger: Logger,
}));

// HTTP error response library
app.use(boom());

// Cors
app.use(cors(config.cors));

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

// Error handler
app.use(errorMiddleware);
// #endregion Middlewares

// ###
// #region Models
// ###
registerSchemas();


// ###
// # Login
// ###

// si on utilise express cf doc
app.use(passport.initialize());
const Collegien = mongoose.model('Collegien');
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
function(username, password, done) {
  console.log('3', username)
  Collegien.findOne({ email: username }, function (err, user) {
    
    console.log('4')

    if (err) { return done(err); }
    // Return if user not found in database
    if (!user) {
      console.log('5')

      return done(null, false, {
        message: 'User not found'
      });
    }
    // Return if password is wrong
    if (!user.validPassword(password)) {
      console.log('6')

      return done(null, false, {
        message: 'Password is wrong'
      });
    }
    console.log('7')
    // If credentials are correct, return the user object
    return done(null, user);
  });
}
));

// Google Authentification TODO

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.


passport.use(new GoogleStrategy({
  clientID: '1050534674845-0b9kjqk7prbps3m2gdh91ei6vv4t8dan.apps.googleusercontent.com',
  clientSecret: '68KtMCvGrET4E0c-G7Eh_1cS',
  callbackURL: "http://localhost:3000/api/login/google/callback"
},
function(accessToken, refreshToken, profile, done) {
  console.log(profile);
    /*  Collegien.findOrCreate({ googleId: profile.id }, function (err, user) {
       return done(err, user);
     }); */
     done(null, profile);
}
));
// #endregion Middlewares

// #endregion Models

// Api
initialize({
  app,
  apiDoc: {
    ...apiDoc,
    'x-express-openapi-additional-middleware': [responseValidationMiddleware],
    'x-express-openapi-validation-strict': true,
  },
  docsPath: '/swagger.json',
  paths: resolve(__dirname, 'handlers'),
  pathsIgnore: new RegExp('(.get|.post|.put|.patch|.delete|.doc|.test|.event)$'),
  errorMiddleware,
  logger: app.logger,
  promiseMode: true,
  consumesMiddleware: {
    'application/json': bodyParser.json(),
    'x-www-form-urlencoded': bodyParser.urlencoded({
      extended: true,
    }),
  },
});

// Swagger ui
app.use('/api/swagger', swagger.serve, swagger.setup(null, {
  swaggerUrl: '/api/swagger.json',
}));

// 404 catcher
app.use(wormholeMiddleware);

// #endregion Routes

// istanbul ignore if
if (process.mainModule === module) {
  // Handle closing with interupts
  process.on('SIGINT', () => app.close());
  process.on('SIGTERM', () => app.close());

  // Run server
  app.start()
    .catch((err) => {
      app.logger.fatal('Server has crashed');
      app.logger.fatal(err);
      process.exit(1);
    });
}

module.exports = app;
