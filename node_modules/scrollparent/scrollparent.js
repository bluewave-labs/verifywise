(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Scrollparent = factory();
  }
}(this, function () {
  function isScrolling(node) {
    var overflow = getComputedStyle(node, null).getPropertyValue("overflow");

    return overflow.indexOf("scroll") > -1 || overflow.indexOf("auto") > - 1;
  }

  function scrollParent(node) {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
      return undefined;
    }

    var current = node.parentNode;
    while (current.parentNode) {
      if (isScrolling(current)) {
        return current;
      }

      current = current.parentNode;
    }

    return document.scrollingElement || document.documentElement;
  }

  return scrollParent;
}));