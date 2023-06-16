'use strict';

tatool
  .factory('colorBinding', [ 'executableUtils', 'dbUtils', 'timerUtils', 'gridServiceFactory', 'inputServiceFactory', 'statusPanelUtils',
    function (executableUtils, dbUtils, timerUtils, gridServiceFactory, inputServiceFactory, statusPanelUtils) {

    var ColorBinding = executableUtils.createExecutable();

    // properties defaults
    var DISPLAY_DURATION_DEFAULT = 200;
    var MIN_SET_SIZE_DEFAULT = 6;
    var MAX_SET_SIZE_DEFAULT = 6;
    var FEEDBACK_DURATION_DEFAULT = 1500;

    //  Initialze variables at the start of every session
    ColorBinding.prototype.init = function() {
      var promise = executableUtils.createPromise();

      // task properties
      this.minSetSize = (parseInt(this.minSetSize)) ? parseInt(this.minSetSize) : MIN_SET_SIZE_DEFAULT;
      this.maxSetSize = (parseInt(this.maxSetSize)) ? parseInt(this.maxSetSize) : MAX_SET_SIZE_DEFAULT;

      // template properties
      this.nrows = parseInt(this.maxSetSize)+1;
      this.ncols = parseInt(this.maxSetSize)+1;

      this.mainGridService = gridServiceFactory.createService(this.nrows, this.ncols, 'mainGrid', this.stimuliPath, true);
      this.inputService = inputServiceFactory.createService(this.stimuliPath);

      // timing properties
      this.displayDuration = (this.displayDuration ) ? this.displayDuration : DISPLAY_DURATION_DEFAULT;
      this.timerDisplayMemoranda = timerUtils.createTimer(this.displayDuration, true, this);

      this.timerDisplayFeedback = timerUtils.createTimer(FEEDBACK_DURATION_DEFAULT, true, this);
      this.timer = timerUtils.createTimer(this.displayDuration, true, this);

      // disable input by default
      this.enableInput = false;

      // load button images
      if (this.stimuliFile) {
        var self = this;
        executableUtils.getCSVResource(this.stimuliFile, true, this.stimuliPath).then(
          function(list) {
            self.processStimuliFile(list, promise);
          }, function(error) {
            promise.reject('Resource not found: ' + self.stimuliFile.resourceName);
          });
      } else {
        promise.reject('Invalid property settings for Executable visualStorage. Expected property <b>stimuliFile</b> of type Resource.');
      }

      return promise;
    };

    ColorBinding.prototype.processStimuliFile = function(list, promise) {
      var keyLabelList = list;
      this.stimuliFile= list;


      promise.resolve();
    };

    //select stimulus from file
    ColorBinding.prototype.selectStimulus = function() {
      this.setSize = executableUtils.getRandomInt(this.minSetSize, this.maxSetSize);
      this.locationList = [];
      this.colorList = [];
      this.stimulus = [];
      
      if(this.counter === undefined){
        this.counter = 0;
      } 
      else {
        this.counter++;
      }
      this.stimulus['stimulusCount'] = this.setSize;
      var trialConfig = this.stimuliFile[this.counter];
      this.trialNumber = trialConfig["trial_number"];

      var colourCount = 1;
      for(var prop in trialConfig){
        if(prop.includes("position")){
          this.locationList.push(trialConfig[prop]);
        } else if (prop.includes("hebb_trial")){
          this.stimulus.hebb_trial = trialConfig[prop];
        } 
      }
      for(var prop in trialConfig){
        if(prop.includes("color")){
          var color = trialConfig[prop];
          this.colorList.push(color);

          var gridPosition = executableUtils.getNext(this.locationList, colourCount - 1);
          this.stimulus['stimulusValue' + colourCount] = '';
          this.stimulus['stimulusValueType' + colourCount] = 'text';
          this.stimulus['gridPosition' + colourCount] = gridPosition;
          this.stimulus['gridCellClass' + colourCount] = 'colorBinding_' + color + 'Cell';
          colourCount++;
        }
      }
      this.stimulus['gridPositionList'] = this.locationList;
      this.stimulus['stimulusCount'] = this.setSize;
      var probe = executableUtils.getRandomReplace(this.locationList);
      this.stimulus['probe'] = probe;
      this.stimulus['colorList'] = this.colorList;

      //populate input key list
      var colorList = ['black', 'white', 'red','orange','yellow', 'lime', 'blue', 'cyan', 'magenta'];
      for (var j = 1; j <= colorList.length; j++) {
        var color = executableUtils.getNext(colorList, j - 1); 
        this.stimulus['keyCode' + j] = 'Digit' + j; 
        this.stimulus['response' + j] = color; 
        this.stimulus['keyLabel' + j] = color + '.png';
        this.stimulus['keyLabelType' + j] = 'image';
      }

      this.memCounter = 0;
      this.recallCounter = 0;
      this.recallPositions = [];
      this.mainGridService.clear().refresh();
    };

    // create a list of stimuli
    ColorBinding.prototype.createStimulus = function() {
      this.setSize = executableUtils.getRandomInt(this.minSetSize, this.maxSetSize);
      this.stimulus = [];
      this.locationList = [];
      this.selectLocations();
      this.stimulus['gridPositionList'] = this.locationList;

      var colorList = executableUtils.shuffle(['black', 'white', 'red','orange','yellow', 'lime', 'blue', 'cyan', 'magenta']);
      
      var trialColorList = [];

      this.stimulus['stimulusCount'] = this.setSize;

      var probe = executableUtils.getRandomReplace(this.locationList);
      this.stimulus['probe'] = probe;

        for (var j = 1; j <= this.setSize; j++) {
            var color = executableUtils.getNext(colorList, j - 1); 
            trialColorList.push(color);

          var gridPosition = executableUtils.getNext(this.locationList, j - 1);

        if (gridPosition == probe) {
          this.stimulus['correctResponse'] = color;
        }

        this.stimulus['stimulusValue' + j] = '';
        this.stimulus['stimulusValueType' + j] = 'text';
        this.stimulus['gridPosition' + j] = gridPosition;
        this.stimulus['gridCellClass' + j] = 'colorBinding_' + color + 'Cell';
        this.stimulus['keyCode' + j] = 'Digit' + j; 
        this.stimulus['response' + j] = color; 
        this.stimulus['keyLabel' + j] = color + '.png';
        this.stimulus['keyLabelType' + j] = 'image';
      }

      this.stimulus['colorList'] = trialColorList;
      this.memCounter = 0;
      this.recallCounter = 0;
      this.recallPositions = [];

      this.mainGridService.clear().refresh();
    };

    ColorBinding.prototype.selectLocations = function() {
      var gridList = [];

      for (var i = 1; i <= this.nrows*this.nrows; i++) {
        gridList.push(i);
      }

      var removalList = [];
      var randomLocationList = executableUtils.shuffle(gridList);

      // n = setSize locations per session
      for (var i = 0; i < this.setSize; i++) {
        var x = executableUtils.getNext(randomLocationList, i);

        if (i == 0) {
          this.locationList[i] = x;
        } else {
          if (removalList.includes(x)) {
            var tmpList = Array.from(randomLocationList);
            var n = 0;

            while (removalList.includes(x) && tmpList.length > 0) {
              x = executableUtils.getRandom(tmpList);

              if (tmpList.length == 0) {
                console.log('Random stimuli generation failed')
              }
            }

            this.locationList[i] = x;
          } else {
            this.locationList[i] = x;
          }
        } 

        if (x>this.nrows && x<this.nrows*this.nrows-parseInt(this.setSize) && x%this.nrows!=0 && (x-1)%this.nrows!=0) {
          removalList.push(x, x-1, x+1, x+this.nrows, x-this.nrows, x+1-this.nrows, x+1+this.nrows, x-1-this.nrows, x-1+this.nrows);
        } else {
          if (x <= this.nrows) {
            if (x == this.nrows) {
              removalList.push(x, x-1, x+this.nrows, x-1+this.nrows);
            } else if (x == 1) {
              removalList.push(x, x+1, x+this.nrows, x+1+this.nrows);
            } else {
              removalList.push(x, x-1, x+1, x+this.nrows, x+1+this.nrows, x-1+this.nrows);
            }
          } else if (x >= this.nrows*this.nrows-parseInt(this.setSize)) {
            if (x == this.nrows*this.nrows) {
              removalList.push(x, x-1, x-this.nrows, x-1-this.nrows);
            } else if (x == this.nrows*this.nrows-parseInt(this.setSize)) {
              removalList.push(x, x+1, x-this.nrows, x+1-this.nrows);
            } else {
              removalList.push(x, x-1, x+1, x-this.nrows, x+1-this.nrows, x-1-this.nrows);
            }
          } else if (x%this.nrows == 0) {
            removalList.push(x, x-1, x+this.nrows, x-this.nrows, x-1-this.nrows, x-1+this.nrows);
          } else if ((x-1)%this.nrows == 0) {
            removalList.push(x, x+1, x+this.nrows, x-this.nrows, x+1-this.nrows, x+1+this.nrows);
          }
        }
        removalList = Array.from(new Set(removalList));
      }
    };

    ColorBinding.prototype.setStimulus = function() {
      this.trialLocationList = this.stimulus['gridPositionList'];
      for (var i = 0; i < this.setSize; i++) {
        if (this.trialLocationList[i] == this.stimulus['gridPosition' + this.memCounter]) {
          this.mainGridService.addCellAtPosition(this.stimulus['gridPosition' + this.memCounter], {
            stimulusValue: this.stimulus['stimulusValue' + this.memCounter], 
            stimulusValueType: this.stimulus['stimulusValueType' + this.memCounter],
            gridCellClass: this.stimulus['gridCellClass' + this.memCounter]
          });
        } else {
          this.mainGridService.addCellAtPosition(this.trialLocationList[i], {
            gridCellClass: 'colorBinding_stimulusCell', 
            stimulusValue: '',
            stimulusValueType: 'text'
          });
        }
      }
    };

    ColorBinding.prototype.setRecallStimulus = function() {
      for (var i = 0; i < this.setSize; i++) {
        if (this.trialLocationList[i] == this.stimulus['probe']) {
          this.mainGridService.addCellAtPosition(this.stimulus['probe'], {
            stimulusValue: '',
            stimulusValueType: 'text',
            gridCellClass: 'colorBinding_probeCell'
          });
        } else {
          this.mainGridService.addCellAtPosition(this.trialLocationList[i], {
            gridCellClass: 'colorBinding_recallCell', 
            stimulusValue: '',
            stimulusValueType: 'text'
          });
        }
      }

      this.mainGridService.refresh();

      this.setupInputKeys(this.stimulus);
    };

    ColorBinding.prototype.setRecallStimulusV2 = function (probe) {
      for (var i = 0; i < this.setSize; i++) {
        if (this.trialLocationList[i] == this.trialLocationList[probe]) {
          this.mainGridService.addCellAtPosition(this.trialLocationList[probe], {
            stimulusValue: '',
            stimulusValueType: 'text',
            gridCellClass: 'colorBinding_probeCell'
          });
        } else {
          this.mainGridService.addCellAtPosition(this.trialLocationList[i], {
            gridCellClass: 'colorBinding_recallCell',
            stimulusValue: '',
            stimulusValueType: 'text'
          });
        }
      }

      this.mainGridService.refresh();

      this.setupInputKeys(this.stimulus);
    };


    ColorBinding.prototype.getPhase = function() {
      return this.phase;
    };

    ColorBinding.prototype.setPhase = function(phase) {
      this.phase = phase;
    };

    // Adding keyInputs and show by default
    ColorBinding.prototype.setupInputKeys = function(stimulus) {
      this.inputService.removeAllInputKeys();

      for (var i = 1; i <= 9; i++) {
        this.inputService.addInputKey(
          stimulus['keyCode' + i], 
          stimulus['response' + i], 
          stimulus['keyLabel' + i], 
          stimulus['keyLabelType' + i], false);
      }
    };



    ColorBinding.prototype.processResponseV2 = function (givenResponse, probe) {
      if (probe == 1) {
        this.trial.score = 0;
        this.correctResponses = [];
      }
   
      this['endTime' + probe] = this.endTime;
      var correctResponse = executableUtils.getNext(this.stimulus['colorList'], probe - 1);
      var stimulusLocationPropName = "stimulusLocation" + probe;
      var correctResponsePropName = "correctResponse" + probe;
      this.trial[correctResponsePropName] = correctResponse;
      this.trial[stimulusLocationPropName] = this.stimulus['gridPositionList'][probe - 1];
      this.trial.hebb_trial = this.stimulus.hebb_trial;
      if (correctResponse == givenResponse) {
        this.trial.score++;
        this.correctResponses.push(this.stimulus['gridPositionList'][probe - 1]);
        this.trial['score' + probe ] = 1; //score1-6
      } else {
        this.trial['score' + probe ] = 0; //score-1-6
      }
      console.log("correct"+probe+": " + correctResponse + ", given: " + givenResponse + ", " + this.trial['score' + probe ]);
      this.trial['givenResponse' + probe] = givenResponse; //givenResponse1-6
      this.trial['reactionTime' + probe] = this.endTime - this.startTime;
    };

    ColorBinding.prototype.saveTrial = function (probe) {
      if (probe == 6) {
        this.trial.score = this.trial.score / 6;
        return dbUtils.saveTrial(this.trial);
      }
    }

    ColorBinding.prototype.createFeedback = function () {
      for (var i = 0; i < this.setSize; i++) {
        if (this.correctResponses.includes(this.trialLocationList[i])) {
          this.mainGridService.addCellAtPosition(this.trialLocationList[i], {
            stimulusValue: '',
            stimulusValueType: 'text',
            gridCellClass: 'colorBinding_greenCell'
          });
        } else {
          this.mainGridService.addCellAtPosition(this.trialLocationList[i], {
            gridCellClass: 'colorBinding_greyCell',
            stimulusValue: '',
            stimulusValueType: 'text'
          });
        }
      }

      this.mainGridService.refresh();
    };



    ColorBinding.prototype.stopExecution = function() {
      this.mainGridService.clear().refresh();
      executableUtils.stop();
    };

    return ColorBinding;

  }]);
