var express = require('express')
var stormpath = require('express-stormpath')
var pg = require('pg')
var bodyParser = require('body-parser')
var request = require('request');
var app = express()
var secrets = require('./Secrets');

var googleMapKey = secrets.googlemaps;

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
        var query = client.query("INSERT into moods(id, sentiment, date) values('" + data.id + "'," + data.sentiment + ", current_date)");

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return res.send("done");
        });
    });
  }
  else {
    console.log("401");
    return res.send("401");
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
});

app.get('/locations/find/:latitude/:longitude/:keyword', stormpath.getUser, stormpath.loginRequired, function(req, res)  {
  var location = {
    'lat':req.params.latitude,
    'lon':req.params.longitude
  };
  var radius = 20000;
  var keyword = req.params.keyword;
  var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?rankby=distance&location=' + location.lat + ',' + location.lon + '\&keyword=' + keyword + '\&key=' + googleMapKey;
  request(url , function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var list = JSON.parse(body).results;
      if (list.length == 0) return res.json({ success: true, data: "Nothing Returned"});
      else {
        var place_id = list[0].place_id;
        var result;
        request('https://maps.googleapis.com/maps/api/place/details/json?placeid=' + place_id + '\&key=' + googleMapKey, function(error, response, body) {
          result = JSON.parse(body);
          res.json(result);
        });
      }
    }
  });
});

app.post('/location/store/:latitude/:longitude/:keyword/:id', stormpath.getUser, stormpath.loginRequired, function(req, res) {
  var lat = req.params.latitude;
  var long = req.params.longitude;
  var keyword = req.params.keyword;
  var placeid = req.params.id;
})



app.on('stormpath.ready', function () {
  console.log('Stormpath Ready');
});

app.listen(3000);
