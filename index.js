var express = require('express')
var stormpath = require('express-stormpath')
var pg = require('pg')
var bodyParser = require('body-parser')
var app = express()

var config = {
  user: 'admin',
  host: 'localhost',
  database: 'tonzo',
  port: 26257
};

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))


app.use(stormpath.init(app, {
  expand: {
    customData: true,
  },
  web: {
    produces: ['application/json']
  }
}))

app.get('/users', stormpath.getUser, stormpath.loginRequired, function(req, res)  {
  var results = [];
  // Get a Postgres client from the connection pool
  pg.connect(config, function(err, client, done) {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({ success: false, data: err});
      }

      // SQL Query > Select Data
      var query = client.query("SELECT * FROM sentimen ORDER BY id ASC");

      // Stream results back one row at a time
      query.on('row', function(row) {
          results.push(row);
      });

      // After all data is returned, close connection and return results
      query.on('end', function() {
          done();
          return res.json(results);
      });
  });
});

app.post('/users/:userid/analysis', stormpath.getUser, stormpath.loginRequired, function(req, res)  {
  var results = [];
  var data = {id: req.body.id, sentiment: req.body.sentiment};
  if (req.params.userid == req.user.username){
    pg.connect(config, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }
        console.log(data.id);
        console.log(data.sentiment);
        // SQL Query > Select Data
        var query = client.query("INSERT into moods(id, sentiment, date) values('$1, $2, current_date)", data.id, data.sentiment);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });
    });
  }
  else {
    console.log("401");
    res.send("401");
  }
  // Get a Postgres client from the connection pool
});

app.get('/users/:userid/analysis', stormpath.getUser, stormpath.loginRequired, function(req, res)  {
  var results = [];
  if (req.params.userid == req.user.username){
    pg.connect(config, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT id, avg(sentiment), date FROM moods group by id, date");
        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.json(results);
        });
    });
  }
  else {
    console.log("401");
    res.send("401");
  }
  // Get a Postgres client from the connection pool
});

app.on('stormpath.ready', function () {
  console.log('Stormpath Ready');
});

app.listen(3000);
