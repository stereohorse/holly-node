var express = require('express');
var Minio = require('minio');


startServerWith(minioClient());


function minioClient() {
  var minioHost = process.env.MINIO_HOST || 'localhost'
  var minioPort = process.env.MINIO_PORT || '9000'

  var minioAccessKey = process.env.MINIO_ACCESS_KEY || ''
  var minioSecureKey = process.env.MINIO_SECURE_KEY || ''

  var videosBucket = process.env.VIDEOS_BUCKET || 'videos'

  console.log('-- config -----------------------------------');

  console.log('minio host: ', minioHost);
  console.log('minio port: ', minioPort);

  console.log('minio access key len: ', minioAccessKey.length);
  console.log('minio secure key len: ', minioSecureKey.length);

  console.log('videos bucket: ', videosBucket);

  console.log('---------------------------------------------');

  var minio = {
    client: new Minio.Client({
      endPoint: minioHost,
      port: parseInt(minioPort),
      secure: false,
      accessKey: minioAccessKey,
      secretKey: minioSecureKey
    }),
    videosBucket: videosBucket
  };

  return {
    getVideos: getVideosWith(minio),
    getUrlFor: getVideoUrlWith(minio)
  };
}


function getVideosWith(minio) {
  var mimeTypes = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    ogv: 'video/ogg'
  };

  return function(cb, errHandler) {
    var stream = minio.client.listObjectsV2(minio.videosBucket);

    var videos = [];

    stream.on('data', function(video) {
      var videoExt = video.name.split('.').pop();
      if (!mimeTypes[videoExt]) {
        return;
      }

      videos.push({
        id: video.name,
        title: video.name.replace(/\.[^/.]+$/, ''),
        mime: mimeTypes[videoExt]
      });
    });

    stream.on('end', function() {
      cb(videos);
    });

    stream.on('error', function(err) {
      if (errHandler) {
        errHandler(err);
      } else {
        console.error(err);
      }
    });
  };
}


function getVideoUrlWith(minio) {
  return function(videoId, cb, errHandler) {
    minio.client.presignedGetObject(minio.videosBucket, videoId, function(err, url) {
      if (err) {
        if (errHandler) {
          return errHandler(err);
        } 

        return console.error(err);
      }

      cb(url);
    });
  };
}


function startServerWith(minioClient) {
  var app = express();

  app.set('view engine', 'pug');

  app.use('/bower', express.static(__dirname + '/bower_components'));
  app.use('/static', express.static(__dirname + '/static'));

  app.get('/', function (req, res) {
    minioClient.getVideos(function(videos) {
      res.render('index', {videos: videos});
    });
  });

  app.get('/videos/:videoId/url', function(req, res) {
    minioClient.getUrlFor(req.params.videoId, function(url) {
      res.send({url: url});
    });
  });

  app.listen(3000, function() {
    console.log('all set up! we are now on air!');
  });
}
