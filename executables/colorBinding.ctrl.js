'use strict';

tatool
  .controller('colorBindingCtrl', [ '$scope', 'service',
    function ($scope, service) {

    $scope.mainGridService = service.mainGridService;
    $scope.inputService = service.inputService;

    // start execution
    $scope.start = function() {
      service.enableInput = false;

      service.setPhase('MEMORISATION');

      service.selectStimulus();

      service.mainGridService.show();

      memorisationPhase();
    };

    function memorisationPhase() {
      // increment mem counter
      service.memCounter++;

      if (service.memCounter >= service.stimulus.stimulusCount) {
        service.setPhase('RECALL');
      }

      // set memoranda
      service.setStimulus();

      // start timer and show memoranda
      service.timerDisplayMemoranda.start(memorisationTimeUp);
      service.mainGridService.refresh();

    }

    // remove stimulus from screen and display next or continue with recall
      function memorisationTimeUp() {
      service.mainGridService.clear();
        if (service.getPhase() == 'MEMORISATION') {
          memorisationPhase();
        } else if (service.getPhase() == 'RECALL') {
          this.probeResponse = 0;
          recallPhaseV2(this.probeResponse);
        }
        else if (service.getPhase() == 'FEEDBACK') {
          service.inputService.disable();
          service.inputService.hide();          
          service.createFeedback();

          service.timerDisplayFeedback.start(feedbackTimeUp);
        }
      }

      function feedbackTimeUp() {
        service.stopExecution();
      }

    // enable click input for recall phase
      function recallPhase() {
      service.setRecallStimulus();
      service.inputService.show();
      service.startTime = service.inputService.enable();
      }

      function recallPhaseV2(probe) {
        service.setRecallStimulusV2(probe);
        service.inputService.show();
        service.startTime = service.inputService.enable();
      }

      $scope.inputAction = function (input, timing, event) {
        if (this.probeResponse === undefined) {
          this.probeResponse = 1;
        } else {
          this.probeResponse++;
        }

        if (this.probeResponse <= 6) {
   
          service.inputService.disable();
          service.inputService.hide();
          service.mainGridService.hide();

          service.processResponseV2(input.givenResponse, this.probeResponse);

          service.mainGridService.clear();
          service.mainGridService.show();
          recallPhaseV2(this.probeResponse);
        }
        if (this.probeResponse == 6) {
          service.setPhase('FEEDBACK');
          service.mainGridService.clear();
          service.mainGridService.show();
          memorisationTimeUp();
          service.saveTrial(this.probeResponse);
        }
    };

  }]);
