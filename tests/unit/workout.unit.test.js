const test = require('node:test');
const assert = require('node:assert/strict');
const { createDom } = require('../helpers/createDom');

test('updateDisplay formats seconds into mm:ss', () => {
  const { window } = createDom();
  const { updateDisplay } = window.__exerciseTimer;
  const display = window.document.getElementById('display');

  updateDisplay(65);

  assert.equal(display.textContent, '1:05');
});

test('fallbackCopyText copies using temporary textarea', () => {
  const { window } = createDom();
  const { fallbackCopyText } = window.__exerciseTimer;
  const { document } = window;

  const alertMessages = [];
  window.alert = (message) => {
    alertMessages.push(message);
  };
  const execCommands = [];
  document.execCommand = (command) => {
    execCommands.push(command);
    return true;
  };

  fallbackCopyText('Test Workout');

  assert.deepEqual(execCommands, ['copy']);
  assert.equal(alertMessages.length, 1);
  assert.ok(alertMessages[0].includes('Test Workout'));
  assert.equal(document.querySelectorAll('textarea').length, 0);
});
