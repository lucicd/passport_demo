var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var app = express();
var passport = require('passport');
var passportLocal = require('passport-local');
var passportHttp = require('passport-http');

//configure app

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//use middleware

app.use(express.static(path.join(__dirname, 
  'bower_components')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
	secret: process.env.SESSION_SECRET || 'secret',
	resave: false,
	saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal.Strategy(verifyCredentials));
passport.use(new passportHttp.BasicStrategy(verifyCredentials));

function verifyCredentials(username, password, done) {
	//Pretend this is using real database
	if (username === password) {
		done(null, {
			id: username,
			name: username,
		});
	} else {
		done(null, null);
	}
}

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	//Query database or cache here!
	done(null, {id: id, name: id});
});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.sendStatus(403);
	}
}

//define routes

app.get('/', function(req, res) {
	var authInfo = {
		isAuthenticated: req.isAuthenticated(),
		user: req.user,
	}
	res.render('index', authInfo);
});

app.get('/login', function(req, res) {
	res.render('login');
});

app.post('/login', passport.authenticate('local'), function(req, res) {
	res.redirect('/');
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

//Use http basic authentication strategy for all API access points
app.use('/api', passport.authenticate('basic', {session: false}));

app.get('/api/data', ensureAuthenticated, function(req, res) {
	res.json([
		{value: 'foo'},
		{value: 'bar'},
		{value: 'baz'},
	]);
});

//start the server

var port = process.env.PORT || 1337;

app.listen(port, function() {
  console.log('Ready on port ' + port);
});