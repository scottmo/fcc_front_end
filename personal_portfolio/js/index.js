'use strict';

$(function () {

  $('a.page-scroll').bind('click', function (event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: $($anchor.attr('href')).offset().top
    }, 1500, 'easeInOutExpo');
    event.preventDefault();
  });

  var $grid = $(".grid").masonry({
    itemSelector: ".grid-item",
    columnWidth: ".grid-sizer",
    percentPosition: true,
    gutter: ".gutter-sizer"
  });

  $grid.imagesLoaded().progress(function () {
    $grid.masonry('layout');
  });
});