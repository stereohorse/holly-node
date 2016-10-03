var express = require('express');
var Minio = require('minio');
var _ = require('lodash');

var moment = require('moment');
moment.locale('ru');


startServerWith(minioClient());


function minioClient() {
  var minioHost = process.env.MINIO_HOST || 'localhost'
  var minioPort = process.env.MINIO_PORT || '9000'
  var minioUrl = process.env.MINIO_URL

  var minioAccessKey = process.env.MINIO_ACCESS_KEY || ''
  var minioSecretKey = process.env.MINIO_SECRET_KEY || ''

  var videosBucket = process.env.VIDEOS_BUCKET || 'videos'

  console.log('-- config -----------------------------------');

  console.log('minio host: ', minioHost);
  console.log('minio port: ', minioPort);
  console.log('minio url: ', minioUrl);

  console.log('minio access key len: ', minioAccessKey.length);
  console.log('minio secret key len: ', minioSecretKey.length);

  console.log('videos bucket: ', videosBucket);

  console.log('---------------------------------------------');

  var minio = {
    client: new Minio.Client({
      endPoint: minioHost,
      port: parseInt(minioPort),
      secure: false,
      accessKey: minioAccessKey,
      secretKey: minioSecretKey
    }),
    videosBucket: videosBucket,
    url: minioUrl,
    host: minioHost,
    port: minioPort
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
        mime: mimeTypes[videoExt],
        modificationTime: moment(video.lastModified).calendar()
      });
    });

    stream.on('end', function() {
      cb(_(videos)
        .orderBy(['modificationTime'], ['desc'])
        .value()
      );
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

      if (minio.url) {
        url = url.replace(minio.host + ':' + minio.port, minio.url);
      }

      cb(url);
    });
  };
}


function startServerWith(minioClient) {
  var app = express();

  var companyName = process.env.COMPANY_NAME || '';

  app.set('view engine', 'pug');

  app.use('/bower', express.static(__dirname + '/bower_components'));
  app.use('/static', express.static(__dirname + '/static'));

  app.get('/', function (req, res) {
    minioClient.getVideos(function(videos) {
      res.render('index', {companyName: companyName, videos: videos});
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
