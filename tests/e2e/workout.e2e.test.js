const test = require('node:test');
const assert = require('node:assert/strict');
const { createDom } = require('../helpers/createDom');

function createSpeechMock(window) {
  const speakCalls = [];
  const cancelCalls = [];

  class SpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
      this.onend = null;
    }
  }

  window.SpeechSynthesisUtterance = SpeechSynthesisUtterance;
  window.speechSynthesis = {
    speak(utterance) {
      speakCalls.push(utterance.text);
      if (typeof utterance.onend === 'function') {
        utterance.onend();
      }
    },
    cancel() {
      cancelCalls.push(null);
    }
  };

  return { speakCalls, cancelCalls };
}

function overrideIntervals(window) {
  let lastId = 0;
  const callbacks = new Map();

  window.setInterval = (fn) => {
    const id = ++lastId;
    callbacks.set(id, fn);
    return id;
  };

  window.clearInterval = (id) => {
    callbacks.delete(id);
  };

  return {
    tick(times = 1) {
      for (let i = 0; i < times; i += 1) {
        for (const fn of [...callbacks.values()]) {
          fn();
        }
      }
    },
    activeCount() {
      return callbacks.size;
    }
  };
}

test('user can complete a timed and repetition exercise', () => {
  const { window } = createDom();
  const api = window.__exerciseTimer;

  const promptCalls = [];
  window.prompt = (message) => {
    promptCalls.push(message);
    return '5';
  };
  window.alert = () => {};
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }

  const speech = createSpeechMock(window);
  api.setSpeechInterface(window.speechSynthesis);
  const intervals = overrideIntervals(window);

  api.resetForTests();
  api.workout = [
    { name: 'Jumping Jacks', duration: 3, reps: null },
    { name: 'Push Ups', duration: null, reps: 5 }
  ];
  api.renderWorkoutList();
  api.updateButtonStates();

  api.startWorkout();

  intervals.tick(4);

  const listItems = [...window.document.querySelectorAll('#exerciseList li')];
  assert.equal(listItems.length, 2);
  assert.ok(listItems[0].classList.contains('completed-exercise'));
  assert.ok(listItems[1].classList.contains('completed-exercise'));
  assert.deepEqual(promptCalls, ['Enter the number of repetitions done:']);
  assert.ok(speech.speakCalls.length >= 2);
});
