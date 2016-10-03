$(function() {
  $('#video-player').on('hide.bs.modal', function (event) {
    videojs('videojs-player').pause();
  });

  $('#video-player').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);

    var videoId = button.data('video-id');
    var videoTitle = button.data('video-title');
    var videoType = button.data('video-type');

    var modal = $(this)
    modal.find('.modal-title').text(videoTitle);

    $.getJSON('/videos/' + videoId + '/url', function(video) {
      videojs('videojs-player').src({type: videoType, src: video.url});
    });
  })
});
