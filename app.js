var express = require('express');
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');

var moment = require('moment');
moment.locale('ru');


startServerWith(fsClient());


function fsClient() {
  var config = {
    videos: {
      dir: process.env.VIDEOS_DIR || '/data/videos',
      serverUrl: process.env.VIDEOS_SERVER_URL || 'http://localhost'
    },
    mimeTypes: {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      webm: 'video/webm',
      ogv: 'video/ogg'
    }
  };

  console.log('-- config -----------------------------------');
  console.log(config);
  console.log('---------------------------------------------');

  return {
    getVideosByCategories: fsVideosWith(config),
    getUrlFor: fsVideoUrlWith(config)
  };
}


function fsVideosWith(config) {
  var videosDir = config.videos.dir;

  return function(cb, errHandler) {
    var categories = _(fs.readdirSync(videosDir))
      .filter(function(file) {
        return fs.lstatSync(path.join(videosDir, file)).isDirectory();
      })
      .map(function(categoryDir) {
        return {
          name: categoryDir,
          videos: _(fs.readdirSync(path.join(videosDir, categoryDir)))
          .map(function(file) {
            return {
              name: file,
              mime: config.mimeTypes[file.split('.').pop()] 
            };
          })
          .filter(function(file) {
            return file.mime;
          })
          .map(function(file) {
            var filePath = path.join(videosDir, categoryDir, file.name);
            var stat = fs.lstatSync(filePath);
            var meta = util.inspect(stat);

            return {
              id: new Buffer(filePath).toString('base64'),
              title: file.name.replace(/\.[^/.]+$/, ''),
              modificationTime: moment(meta.mtime).calendar(),
              mime: file.mime
            };
          })

          .value()
        };
      })
      .filter(function(category) {
        return category.videos.length > 0;
      })
      .sortBy(['name'])
      .value();

    cb(categories);
  };
} 


function fsVideoUrlWith(config) {
  return function(videoId, cb, errHandler) {
    var filePath = new Buffer(videoId, 'base64').toString('utf8');
    cb(filePath.replace(config.videos.dir, config.videos.serverUrl));
  };
}


function startServerWith(videoStorage) {
  var app = express();

  var companyName = process.env.COMPANY_NAME || 'holly';

  app.set('view engine', 'pug');

  app.use('/bower', express.static(__dirname + '/bower_components'));
  app.use('/static', express.static(__dirname + '/static'));

  app.get('/', function (req, res) {
    videoStorage.getVideosByCategories(function(categories) {
      res.render('index', {categories: categories, companyName: companyName});
    });
  });

  app.get('/videos/:videoId/url', function(req, res) {
    videoStorage.getUrlFor(req.params.videoId, function(url) {
      res.send({url: url});
    });
  });

  app.listen(3000, function() {
    console.log('all set up! we are now on air!');
  });
}
