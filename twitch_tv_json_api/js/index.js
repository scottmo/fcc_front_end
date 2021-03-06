"use strict";

var channels = ["freecodecamp", "gosugamers", "storbeck", "brunofin", "terakilobyte", "habathcx", "RobotCaleb", "thomasballinger", "noobs2ninjas", "beohoff", "nalcs1"];

var twitchApi = "https://api.twitch.tv/kraken";

var default_user_pic = "http://i1376.photobucket.com/albums/ah9/momosct/FCC/default_user_zpsp8si0tdd.png";

function getApiUrl(type, name) {
  return twitchApi + "/" + type + "/" + name + "?callback=?";
}

function getChannelInfo(channelName) {
  var channel = {};

  var getStreamerInfo = $.getJSON(getApiUrl("users", channelName)).then(function (data) {
    channel.name = data.display_name;
    channel.logo = data.logo ? data.logo : default_user_pic;
  });

  var getChannelStatus = $.getJSON(getApiUrl("streams", channelName)).then(function (data) {
    channel.isStreaming = false;
    if (data.stream === null) {
      channel.status = "fa fa-minus-circle offline";
      channel.info = "Offline";
    } else if (data.stream === undefined) {
      channel.status = "fa fa-times-circle offline";
      channel.info = "Invalid Account";
    } else {
      channel.status = "fa fa-check-circle online";
      channel.info = data.stream.game + ": " + data.stream.channel.status;
      channel.isStreaming = true;
    }
  });

  return Promise.all([getStreamerInfo, getChannelStatus]).then(function () {
    return channel;
  });
}

var app = angular.module('twitchStatusApp', []).controller('channelCtrl', function ($scope, $http, $timeout) {
  $scope.allChannels = [];
  $scope.onlineChannels = [];
  $scope.offlineChannels = [];

  var channelInfoFetchers = [];
  channels.forEach(function (channelName) {
    channelInfoFetchers.push(getChannelInfo(channelName));
  });

  Promise.all(channelInfoFetchers).then(function (channels) {
    $scope.allChannels = channels;
    $scope.onlineChannels = channels.filter(function (channel) {
      return channel.isStreaming;
    });
    $scope.offlineChannels = channels.filter(function (channel) {
      return !channel.isStreaming;
    });
    $scope.channels = $scope.allChannels;
    $scope.$apply();
  });

  $(".nav-tabs li").click(function () {
    if ($(this).data("value") === "all") {
      $scope.channels = $scope.allChannels;
    } else if ($(this).data("value") === "online") {
      $scope.channels = $scope.onlineChannels;
    } else {
      $scope.channels = $scope.offlineChannels;
    }
    $scope.$apply();

    $(".nav-tabs .active").removeClass("active");
    $(this).addClass("active");
  });
});