const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

class ClassList {
  constructor(element) {
    this.element = element;
    this._classes = new Set();
  }

  add(...classes) {
    classes.forEach((cls) => {
      if (cls) {
        this._classes.add(cls);
      }
    });
  }

  remove(...classes) {
    classes.forEach((cls) => this._classes.delete(cls));
  }

  contains(cls) {
    return this._classes.has(cls);
  }

  toggle(cls) {
    if (this._classes.has(cls)) {
      this._classes.delete(cls);
      return false;
    }
    this._classes.add(cls);
    return true;
  }

  toString() {
    return Array.from(this._classes).join(' ');
  }
}

class MockElement {
  constructor(tagName, document) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = document;
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.eventListeners = new Map();
    this.classList = new ClassList(this);
    this._textContent = '';
    this._innerHTML = '';
    this.onclick = null;
    this.draggable = false;
    this.disabled = false;
    this.value = '';
  }

  set id(value) {
    this._id = value;
    this.ownerDocument._registerId(value, this);
  }

  get id() {
    return this._id || null;
  }

  set className(value) {
    this.classList = new ClassList(this);
    value.split(/\s+/).filter(Boolean).forEach((cls) => this.classList.add(cls));
  }

  get className() {
    return this.classList.toString();
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
  }

  addEventListener(type, handler) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(handler);
  }

  dispatchEvent(type, event) {
    const handlers = this.eventListeners.get(type) || [];
    handlers.forEach((handler) => handler.call(this, event));
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    return this.ownerDocument._querySelectorAll(this, selector);
  }

  set textContent(value) {
    this._textContent = value;
    this.children.forEach((child) => {
      child.parentNode = null;
    });
    this.children = [];
  }

  get textContent() {
    if (this.children.length === 0) {
      return this._textContent;
    }
    return this.children.map((child) => child.textContent).join('');
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === '') {
      this.children.forEach((child) => {
        child.parentNode = null;
      });
      this.children = [];
    }
  }

  get innerHTML() {
    if (this.children.length > 0) {
      return this.children.map((child) => child.textContent).join('');
    }
    return this._innerHTML;
  }

  insertAdjacentHTML() {}

  scrollIntoView() {}

  select() {}
}

class MockDocument {
  constructor() {
    this.body = new MockElement('body', this);
    this._idMap = new Map();
    this.defaultView = null;
    this._eventListeners = new Map();
  }

  createElement(tagName) {
    return new MockElement(tagName, this);
  }

  getElementById(id) {
    return this._idMap.get(id) || null;
  }

  querySelector(selector) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.body.querySelectorAll(selector);
  }

  addEventListener(type, handler) {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, []);
    }
    this._eventListeners.get(type).push(handler);
  }

  _registerId(id, element) {
    this._idMap.set(id, element);
  }

  _querySelectorAll(root, selector) {
    const parts = selector.trim().split(/\s+/);
    let currentNodes = [root];
    for (const part of parts) {
      const nextNodes = [];
      currentNodes.forEach((node) => {
        const descendants = this._collectDescendants(node);
        descendants.forEach((descendant) => {
          if (this._matches(descendant, part)) {
            nextNodes.push(descendant);
          }
        });
      });
      currentNodes = nextNodes;
    }
    return currentNodes;
  }

  _collectDescendants(node) {
    const result = [];
    node.children.forEach((child) => {
      result.push(child);
      result.push(...this._collectDescendants(child));
    });
    return result;
  }

  _matches(element, selector) {
    if (selector.startsWith('#')) {
      return element.id === selector.slice(1);
    }
    if (selector.startsWith('.')) {
      return element.classList.contains(selector.slice(1));
    }
    return element.tagName.toLowerCase() === selector.toLowerCase();
  }
}

function buildBaseDom(document) {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  document.body.appendChild(sheet);

  const timerPanel = document.createElement('div');
  timerPanel.className = 'timer-panel';
  sheet.appendChild(timerPanel);

  const currentMovement = document.createElement('div');
  currentMovement.id = 'currentMovement';
  currentMovement.textContent = 'Ready?';
  timerPanel.appendChild(currentMovement);

  const display = document.createElement('div');
  display.id = 'display';
  display.textContent = '00:00';
  timerPanel.appendChild(display);

  const actionBar = document.createElement('div');
  actionBar.className = 'action-bar';
  timerPanel.appendChild(actionBar);

  const startButton = document.createElement('button');
  startButton.id = 'startButton';
  startButton.disabled = true;
  actionBar.appendChild(startButton);

  const pauseButton = document.createElement('button');
  pauseButton.id = 'pauseResumeButton';
  pauseButton.disabled = true;
  actionBar.appendChild(pauseButton);

  const stopButton = document.createElement('button');
  stopButton.id = 'stopButton';
  stopButton.disabled = true;
  actionBar.appendChild(stopButton);

  const mainPanel = document.createElement('div');
  mainPanel.className = 'main-panel';
  sheet.appendChild(mainPanel);

  const listContainer = document.createElement('div');
  listContainer.className = 'exercise-list';
  mainPanel.appendChild(listContainer);

  const exerciseList = document.createElement('ul');
  exerciseList.id = 'exerciseList';
  listContainer.appendChild(exerciseList);

  const importSection = document.createElement('div');
  importSection.id = 'importSection';
  mainPanel.appendChild(importSection);

  const exerciseString = document.createElement('input');
  exerciseString.id = 'exerciseString';
  importSection.appendChild(exerciseString);

  const buildSection = document.createElement('div');
  buildSection.id = 'buildSection';
  mainPanel.appendChild(buildSection);

  const form = document.createElement('form');
  form.id = 'addExerciseForm';
  buildSection.appendChild(form);

  const exerciseName = document.createElement('input');
  exerciseName.id = 'exerciseName';
  form.appendChild(exerciseName);

  const exerciseDuration = document.createElement('input');
  exerciseDuration.id = 'exerciseDuration';
  form.appendChild(exerciseDuration);

  const exerciseReps = document.createElement('input');
  exerciseReps.id = 'exerciseReps';
  form.appendChild(exerciseReps);

  const exportSection = document.createElement('div');
  exportSection.id = 'exportSection';
  mainPanel.appendChild(exportSection);
}

function createDom() {
  const document = new MockDocument();
  buildBaseDom(document);

  const window = {
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    alert: () => {},
    prompt: () => '',
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve()
      }
    }
  };
  window.window = window;
  window.globalThis = window;
  window.HTMLElement = MockElement;
  document.defaultView = window;

  const htmlPath = path.resolve(__dirname, '../../exerciseTimer2.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Unable to locate application script in HTML');
  }

  const context = vm.createContext(window);
  vm.runInContext(scriptMatch[1], context, { filename: 'exerciseTimer2.html' });

  return { window, document };
}

module.exports = {
  createDom,
  MockElement,
  MockDocument
};
