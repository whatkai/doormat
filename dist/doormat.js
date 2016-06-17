/*
 * doormat - http://jh3y.github.io/doormat
 *
 * @license MIT
 * @author jh3y
 * (c) 2016
 */

(function() {
  var Doormat, PROPS;

  PROPS = {
    CLASS: 'dm',
    CURRENT_CLASS: 'dm__pnl--crnt',
    NEXT: 'next',
    PREVIOUS: 'previous',
    RESET: 'reset',
    snapping: {
      travel: false,
      viewport: true,
      threshold: 30,
      debounce: 150,
      duration: 250
    }
  };

  Doormat = window.Doormat = function(opts) {
    var calibrate, debounce, doormat, el, extend, handleScroll, handleSnap, inSnapRegion, setNew;
    el = document.querySelector('.' + PROPS.CLASS);
    if (!(this instanceof Doormat)) {
      return new Doormat(opts);
    }
    if (!el) {
      throw Error('Doormat: Must assign element instance');
    }
    setNew = function(dir) {
      var cur;
      cur = doormat.current;
      cur.className = cur.className.replace(PROPS.CURRENT_CLASS, '');
      cur.style.top = dir === PROPS.NEXT ? -cur.offsetHeight + 'px' : 0;
      doormat.current = dir === PROPS.RESET ? doormat.panels[0] : cur[dir + 'ElementSibling'];
      return doormat.current.className += ' ' + PROPS.CURRENT_CLASS;
    };
    calibrate = function(evt) {
      var clientHeight, i, panel, sumHeight;
      sumHeight = 0;
      i = 0;
      clientHeight = 'onorientationchange' in window ? screen.height : window.innerHeight;
      doormat.CLIENT_HEIGHT = clientHeight;
      while (i < doormat.panels.length) {
        panel = doormat.panels[i];
        panel.style.zIndex = 999 - i;
        panel.style.display = 'block';
        panel.style.minHeight = clientHeight + 'px';
        panel.style.top = '0px';
        panel.DOORMAT_HEIGHT = panel.offsetHeight;
        panel.DOORMAT_POS = sumHeight;
        sumHeight = sumHeight + panel.DOORMAT_HEIGHT;
        i++;
      }
      doormat.SNAP_THRESHOLD = clientHeight * (PROPS.SNAPPING.THRESHOLD / 100);
      document.body.style.height = sumHeight + 'px';
      if (evt) {
        window.scrollTo(0, 0);
        return setNew(PROPS.RESET);
      }
    };
    debounce = function(func, delay) {
      clearTimeout(func.TIMER);
      func.TIMER = setTimeout(func, delay);
    };
    handleSnap = function() {
      var cur, reset, scroll, set, snapIn, snapOut;
      cur = doormat.current;
      scroll = window.scrollY || window.pageYOffset;
      snapIn = function() {
        return window.scrollTo(0, cur.DOORMAT_POS + (cur.offsetHeight - doormat.CLIENT_HEIGHT));
      };
      snapOut = function() {
        cur.style.top = -cur.offsetHeight + 'px';
        setNew(PROPS.NEXT);
        return window.scrollTo(0, doormat.current.DOORMAT_POS);
      };
      if (inSnapRegion() && scroll !== cur.DOORMAT_POS) {
        reset = function() {
          cur.style.transitionProperty = null;
          cur.style.transitionDuration = null;
          return cur.removeEventListener('transitionend', reset);
        };
        set = function() {
          cur.style.transitionProperty = 'top';
          cur.style.transitionDuration = PROPS.SNAPPING.DURATION;
          return cur.addEventListener('transitionend', reset, false);
        };
        if (doormat.SNAP_TOP) {
          if (PROPS.SNAPPING.VIEWPORT) {
            set();
            snapOut();
          } else if (PROPS.SNAPPING.TRAVEL && doormat.SCROLL_DIR === 'UP') {
            window.scrollTo(0, cur.DOORMAT_POS);
          }
        }
        if (doormat.SNAP_BOTTOM) {
          set();
          if (PROPS.SNAPPING.VIEWPORT) {
            return snapIn();
          } else if (PROPS.SNAPPING.TRAVEL && doormat.SCROLL_DIR === 'DOWN') {
            return snapOut();
          }
        }
      }
    };
    inSnapRegion = function() {
      var cur, scroll;
      cur = doormat.current;
      scroll = window.scrollY || window.pageYOffset;
      doormat.SNAP_TOP = false;
      doormat.SNAP_BOTTOM = false;
      doormat.SNAP_TOP = PROPS.SNAPPING.VIEWPORT ? scroll > ((cur.offsetHeight + cur.DOORMAT_POS) - doormat.SNAP_THRESHOLD) && scroll < (cur.DOORMAT_POS + cur.offsetHeight) : scroll > (cur.DOORMAT_POS + (cur.offsetHeight - doormat.SNAP_THRESHOLD)) && scroll < (cur.DOORMAT_POS + cur.offsetHeight);
      doormat.SNAP_BOTTOM = PROPS.SNAPPING.VIEWPORT ? scroll > ((cur.DOORMAT_POS + cur.offsetHeight) - doormat.CLIENT_HEIGHT) && scroll < (((cur.DOORMAT_POS + cur.offsetHeight) - doormat.CLIENT_HEIGHT) + doormat.SNAP_THRESHOLD) : scroll > (cur.DOORMAT_POS + (cur.offsetHeight - doormat.CLIENT_HEIGHT)) + doormat.SNAP_THRESHOLD;
      return doormat.SNAP_TOP || doormat.SNAP_BOTTOM;
    };
    handleScroll = function() {
      var cur, scroll;
      cur = doormat.current;
      scroll = window.scrollY || window.pageYOffset;
      doormat.SCROLL_DIR = scroll > doormat.SCROLL_LAST ? 'DOWN' : 'UP';
      doormat.SCROLL_LAST = scroll;
      cur.style.top = (cur.DOORMAT_POS - scroll) + 'px';
      if (scroll > (cur.DOORMAT_HEIGHT + cur.DOORMAT_POS)) {
        if (cur.nextElementSibling) {
          setNew(PROPS.NEXT);
        }
      } else if (scroll < cur.DOORMAT_POS) {
        if (cur.previousElementSibling) {
          setNew(PROPS.PREVIOUS);
        }
      }
      if (PROPS.SNAPPING && (PROPS.SNAPPING.VIEWPORT || PROPS.SNAPPING.TRAVEL) && inSnapRegion()) {
        return debounce(handleSnap, PROPS.SNAPPING.DEBOUNCE);
      }
    };
    if ('onorientationchange' in window) {
      window.onorientationchange = calibrate;
    } else {
      window.onresize = calibrate;
    }
    window.onscroll = handleScroll;
    doormat = this;
    doormat.el = el;
    doormat.panels = doormat.el.children;
    extend = function(a, b) {
      var prop, result, val;
      result = {};
      for (prop in a) {
        result[prop.toUpperCase()] = a[prop];
        if (b.hasOwnProperty(prop)) {
          val = b[prop];
          result[prop.toUpperCase()] = typeof val === 'object' ? extend(result[prop.toUpperCase()], val) : val;
        }
      }
      return result;
    };
    PROPS = extend(PROPS, opts);
    if (PROPS.SNAPPING) {
      PROPS.SNAPPING.DURATION = (PROPS.SNAPPING.DURATION / 1000) + 's';
    }
    doormat.current = doormat.panels[0];
    doormat.current.className += ' ' + PROPS.CURRENT_CLASS;
    calibrate();
    return doormat;
  };

}).call(this);
