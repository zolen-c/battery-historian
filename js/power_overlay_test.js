/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.module('historian.powerOverlayTest');
goog.setTestOnly('historian.powerOverlayTest');

var Context = goog.require('historian.Context');
var Csv = goog.require('historian.metrics.Csv');
var Estimator = goog.require('historian.power.Estimator');
var Event = goog.require('historian.power.Event');
var LevelData = goog.require('historian.LevelData');
var MockControl = goog.require('goog.testing.MockControl');
var Overlay = goog.require('historian.power.Overlay');
var data = goog.require('historian.data');
var mockmatchers = goog.require('goog.testing.mockmatchers');
var testSuite = goog.require('goog.testing.testSuite');


var mockControl_;

var overlay;
var mockLevelData;
var mockContext;
var mockEstimator;

// Mocks for power overlay UI methods.
var mockClear;
var mockDraw;
var mockShowSelector;
var mockGetSelected;


testSuite({

  setUp: function() {
    mockControl_ = new MockControl();

    // Mock UI functions.
    mockControl_.createMethodMock(Overlay.prototype, 'renderSelector_')();
    mockClear = mockControl_.createMethodMock(Overlay.prototype, 'clear_');
    mockDraw = mockControl_.createMethodMock(Overlay.prototype, 'draw_');
    mockShowSelector =
        mockControl_.createMethodMock(Overlay.prototype, 'showSelector_');
    mockGetSelected =
        mockControl_.createMethodMock(Overlay.prototype, 'getSelected_');

    // Mock power estimator.
    mockContext = mockControl_.createStrictMock(Context);
    mockLevelData = mockControl_.createStrictMock(LevelData);
    mockLevelData.registerListener(mockmatchers.isFunction);
    mockEstimator = mockControl_.createStrictMock(Estimator);
    mockControl_.$replayAll();

    overlay = new Overlay(mockContext, mockLevelData, mockEstimator);

    mockControl_.$verifyAll();
    mockControl_.$resetAll();
  },

  tearDown: function() {
    mockControl_.$tearDown();
  },

  /**
   * Tests rendering if powermonitor is the current level line overlay, and no
   * wakeup reason has been selected.
   */
  testPowermonitorOverlaidNoneSelected: function() {
    mockClear();
    mockLevelData.getConfig().$returns({name: Csv.POWERMONITOR});
    mockGetSelected().$returns('');
    mockShowSelector(true);
    mockControl_.$replayAll();

    overlay.render();
    mockControl_.$verifyAll();
  },

  /**
   * Tests rendering if powermonitor is the current level line overlay, and
   * the selected wakeup reason has no events.
   */
  testPowermonitorOverlaidSelectedWithNoEvents: function() {
    mockClear();
    mockLevelData.getConfig().$returns({name: Csv.POWERMONITOR});
    mockGetSelected().$returns('wake_reason');
    mockShowSelector(true);
    mockContext.msPerPixel().$returns(10);
    mockEstimator.getEvents('wake_reason').$returns([]);
    mockControl_.$replayAll();

    overlay.render();
    mockControl_.$verifyAll();
  },

  /**
   * Tests rendering if powermonitor is the current level line overlay, and
   * the current view is zoomed in (msPerPixel is small).
   */
  testPowermonitorOverlaidZoomedIn: function() {
    mockClear();
    mockLevelData.getConfig().$returns({name: Csv.POWERMONITOR});
    mockGetSelected().$returns('wake_reason');
    mockShowSelector(true);
    mockContext.msPerPixel().$returns(10);

    var mockPowerEvent1 = mockControl_.createStrictMock(Event);
    var powermonitorEvents1 = [{startTime: 1000}, {startTime: 2000}];
    mockPowerEvent1.getPowermonitorEvents().$returns(powermonitorEvents1);

    var mockPowerEvent2 = mockControl_.createStrictMock(Event);
    var powermonitorEvents2 = [{startTime: 300}];
    mockPowerEvent2.getPowermonitorEvents().$returns(powermonitorEvents2);

    mockEstimator.getEvents('wake_reason')
        .$returns([mockPowerEvent1, mockPowerEvent2]);
    mockDraw(powermonitorEvents1);
    mockDraw(powermonitorEvents2);
    mockControl_.$replayAll();

    overlay.render();
    mockControl_.$verifyAll();

  },

  /**
   * Tests rendering if powermonitor is the current level line overlay, and
   * the current view is zoomed out (msPerPixel is large).
   */
  testPowermonitorOverlaidZoomedOut: function() {
    mockClear();
    mockLevelData.getConfig().$returns({name: Csv.POWERMONITOR});
    mockGetSelected().$returns('wake_reason');
    mockShowSelector(true);
    mockContext.msPerPixel().$returns(2000);

    var mockPowerEvent = mockControl_.createStrictMock(Event);
    var powermonitorEvents = [{startTime: 1000}, {startTime: 1100}];
    mockPowerEvent.getPowermonitorEvents().$returns(powermonitorEvents);

    mockEstimator.getEvents('wake_reason').$returns([mockPowerEvent]);
    var sampled = [{startTime: 1000}];
    var sampleMock = mockControl_.createMethodMock(data, 'sampleData');
    sampleMock(powermonitorEvents).$returns(sampled);
    mockDraw(sampled);
    mockControl_.$replayAll();

    overlay.render();
    mockControl_.$verifyAll();
  },

  /**
   * Tests rendering if powermonitor is not the current level line overlay.
   */
  testOtherOverlaid: function() {
    mockClear();
    mockLevelData.getConfig().$returns({name: Csv.BATTERY_LEVEL});
    mockGetSelected().$returns('');
    mockShowSelector(false);
    mockControl_.$replayAll();

    overlay.render();
    mockControl_.$verifyAll();
  }
});
