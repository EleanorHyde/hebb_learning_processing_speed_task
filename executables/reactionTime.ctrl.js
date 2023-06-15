'use strict';

tatool
  .controller('reactionTimeCtrl', [ '$scope', 'service',
    function ($scope, service) {

    // Make the stimulus service available for the <tatool-stimulus> directive
    $scope.cueService = service.cueService;
    $scope.stimulusService = service.stimulusService;
    
    // Make the input service available for the <tatool-input> directive
    $scope.inputService = service.inputService;

    // Start execution
    $scope.start = function() {

      service.createStimulus();

      if (service.jitterEnabled.propertyValue) {
        jitterInterval();
      } else if (service.cueEnabled.propertyValue) {
        displayCue();
      } else {
        displayStimulus();
      }
    };


    function jitterInterval() {
      service.setJitterInterval();

      if (service.cueEnabled.propertyValue) {
        service.jitterTimer.start(displayCue);
      } else {
        service.jitterTimer.start(displayStimulus);
      }
    }

    function displayCue() {
      service.cueService.show();
      service.cueTimer.start(displayStimulus);
    }

    function displayStimulus() {
      service.inputService.enable();
      if (service.showKeys.propertyValue === true) {
        service.inputService.show();
      }

      if (service.timerEnabled.propertyValue === true) {
        service.timer.start(timerUp);
      }

      service.startTime = service.stimulusService.show();
    }

    // Called by timer when time elapsed without user input
    function timerUp() {
      service.inputService.disable();
      service.endTime = service.stimulusService.hide();
      service.processResponse('omission');
    }

    // Capture user input
    $scope.inputAction = function(input, timing, event) {
      service.inputService.disable();
      service.timer.stop();
      service.inputService.hide();
      service.stimulusService.hide();
      service.endTime = timing;
      service.processResponse(input.givenResponse);
    };

  }]);
