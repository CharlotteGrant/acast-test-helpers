import $ from 'jquery';
import { setupAsync, andThen, waitUntil } from './async';

let root;
let history;

export function scaleWindowWidth(scale) {
  andThen(() => {
    var $root = $(root);
    const currentWidth = $root.width();
    const newWidth = currentWidth * scale;
    $root.css('width', `${newWidth}px`);
    window.dispatchEvent(new Event('resize'));
  });
}

function setupApp(createHistory, renderAppIntoElementWithHistory) {
  history = createHistory();

  root = createRootForTests();

  renderAppIntoElementWithHistory(root, history);
}

function teardownApp(unrenderApp) {
  unrenderApp(root);
  document.body.removeChild(root);
  root = null;

  history = null;
}

function createRootForTests() {
  const root = document.createElement('div');
  root.id = 'test-root';
  root.style.width = root.style.height = '1024px';
  document.body.appendChild(root);

  return root;
}

export function setupAndTeardownApp(
  renderAppIntoElementWithHistory,
  createHistory = () => {},
  unrenderAppFromElement = root => {}
) {
  if (!renderAppIntoElementWithHistory) {
    throw new Error(
      'acast-test-helpers#setupAndTeardownApp(): Requires at least one argument: renderAppIntoElementWithHistory'
    );
  }

  if (renderAppIntoElementWithHistory.length < 1) {
    throw new Error(
      'acast-test-helpers#setupAndTeardownApp(): renderAppIntoElementWithHistory has to accept at least one argument: (elementToRenderInto)'
    );
  }

  setupAsync();

  beforeEach(() => setupApp(createHistory, renderAppIntoElementWithHistory));

  afterEach(() => teardownApp(unrenderAppFromElement));
}

export function visit(route) {
  if (!history) {
    throw new Error(
      'acast-test-helpers#visit(): You cannot use visit() unless you pass a valid createHistory function to setupAndTeardownApp() at the root of the appropriate describe()!'
    );
  }
  andThen(() => {
    history.push(route);
  });
}

export function click(selector, options) {
  triggerMouseEvent(click, selector, options, ['mousedown', 'mouseup']);
}

export function mouseDown(selector, options) {
  triggerMouseEvent(mouseDown, selector, options);
}

export function mouseUp(selector, options) {
  triggerMouseEvent(mouseUp, selector, options);
}

export function mouseMove(selector, options) {
  triggerMouseEvent(mouseMove, selector, options);
}

function triggerMouseEvent(
  exportedFunction,
  selector,
  options,
  mouseEventsToTriggerFirst = []
) {
  const functionName = exportedFunction.name;
  const eventName = functionName.toLowerCase();
  waitUntilExists(
    selector,
    `acast-test-helpers#${functionName}(): Selector never showed up '${selector}'`
  );
  andThen(jqueryElement => {
    expect(jqueryElement.length).to.equal(
      1,
      `acast-test-helpers#${functionName}(): Found more than one match for selector: '${selector}'`
    );

    const evaluatedOptions = typeof options === 'function'
      ? options()
      : options;

    function triggerMouseEvent(eventName) {
      const event = createMouseEvent(eventName, evaluatedOptions);
      jqueryElement[0].dispatchEvent(event);
    }

    const mouseEventsToTrigger = mouseEventsToTriggerFirst.concat([eventName]);

    mouseEventsToTrigger.forEach(eventName => {
      triggerMouseEvent(eventName);
    });
  });
}

export function fillIn(selector, value) {
  waitUntilExists(
    selector,
    `acast-test-helpers#fillIn(): Selector never showed up '${selector}'`
  );
  andThen(jqueryElement => {
    expect(jqueryElement.length).to.equal(
      1,
      `acast-test-helpers#fillIn(): Found more than one match for selector: '${selector}'`
    );
    const target = jqueryElement[0];
    target.value = value;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

export function keyEventIn(selector, keyEventString, keyCode) {
  waitUntilExists(
    selector,
    `acast-test-helpers#keyEventIn(): Selector never showed up: '${selector}'`
  );
  andThen(jqueryElement => {
    const event = new Event(keyEventString, { bubbles: true });
    event.keyCode = keyCode;
    jqueryElement.get(0).dispatchEvent(event);
  });
}

export function waitUntilExists(
  selector,
  errorMessage = `acast-test-helpers#waitUntilExists(): Selector never showed up: '${selector}'`
) {
  waitUntil(() => {
    const selected = $(selector, root);
    return selected.length ? selected : false;
  }, errorMessage);
}

export function waitUntilDisappears(selector) {
  waitUntilExists(
    selector,
    `acast-test-helpers#waitUntilDisappears(): Selector never showed up: '${selector}'`
  );
  waitUntilDoesNotExist(
    selector,
    `acast-test-helpers#waitUntilDisappears(): Selector showed up but never disappeared: '${selector}'`
  );
}

export function waitUntilDoesNotExist(
  selector,
  errorMessage = `acast-test-helpers#waitUntilDoesNotExist(): Selector never stopped existing: '${selector}'`
) {
  waitUntil(() => {
    return $(selector, root).length === 0;
  }, errorMessage);
}

export const find = selector => $(selector, root);

export const jQuery = $;

function createMouseEvent(
  type,
  {
    bubbles = true,
    cancelable = type != 'mousemove',
    view = window,
    detail = 0,
    screenX = 0,
    screenY = 0,
    clientX = 0,
    clientY = 0,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
    button = 0,
    relatedTarget = document.body.parentNode,
  } = {}
) {
  var result;

  try {
    result = new MouseEvent(type, options);
  } catch (e) {
    result = document.createEvent('MouseEvents');
    result.initMouseEvent(
      type,
      bubbles,
      cancelable,
      view,
      detail,
      screenX,
      screenY,
      clientX,
      clientY,
      ctrlKey,
      altKey,
      shiftKey,
      metaKey,
      button,
      relatedTarget
    );
  }

  return result;
}
