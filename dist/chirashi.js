(function() {
  $.fn.chirashi = function(opts) {
    var container, fadeInDelay, fadeInterval, list, maxArealOverlap, maxIterations, maxLinearOverlap, maxOverlaps, _boxCovers, _boxOverlap, _checkFit, _newBox, _overlap1D, _randomPosition;
    maxLinearOverlap = 0.25;
    maxArealOverlap = 0.1;
    maxOverlaps = 1;
    maxIterations = 10;
    fadeInDelay = 750;
    container = this;
    list = this.find(opts.selector);
    list.boxes = [];
    list.overlaps = {};
    fadeInterval = null;
    _randomPosition = function(size) {
      return {
        x: Math.floor(Math.random() * (container.width() - size.w)),
        y: Math.floor(Math.random() * (container.height() - size.h))
      };
    };
    _newBox = function(size, boxes) {
      var h, iterations, newbox, w, x, y, _ref, _ref1;
      w = size.w, h = size.h;
      _ref = _randomPosition(size), x = _ref.x, y = _ref.y;
      newbox = {
        x: x,
        y: y,
        w: w,
        h: h,
        id: list.boxes.length
      };
      iterations = 0;
      while (iterations <= maxIterations && !_checkFit(newbox, list.boxes)) {
        _ref1 = _randomPosition(size), x = _ref1.x, y = _ref1.y;
        newbox.x = x;
        newbox.y = y;
        iterations += 1;
        console.log('iter: ', iterations);
      }
      list.overlaps[newbox.id] = 0;
      if (iterations <= maxIterations) {
        return newbox;
      } else {
        console.debug('too many iterations ! ! !');
        return null;
      }
    };
    _overlap1D = function(ax1, ax2, bx1, bx2) {
      if (ax1 <= bx1 && ax2 <= bx2) {
        return Math.max(0, ax2 - bx1);
      } else if (ax1 >= bx1 && ax2 >= bx2) {
        return Math.max(0, bx2 - ax1);
      } else if (ax1 <= bx1 && ax2 >= bx2) {
        return bx2 - bx1;
      } else if (ax1 >= bx1 && ax2 <= bx2) {
        return ax2 - ax1;
      }
    };
    _boxOverlap = function(a, b) {
      var ox, oy;
      ox = _overlap1D(a.x, a.x + a.w, b.x, b.x + b.w);
      oy = _overlap1D(a.y, a.y + a.h, b.y, b.y + b.h);
      return {
        ox: ox / a.w,
        oy: oy / a.h
      };
    };
    _checkFit = function(newbox, boxes) {
      var box, good, id, newOverlaps, ox, oy, _i, _j, _len, _len1, _ref;
      good = true;
      newOverlaps = [];
      console.debug('----------', newbox.id);
      for (_i = 0, _len = boxes.length; _i < _len; _i++) {
        box = boxes[_i];
        _ref = _boxOverlap(box, newbox), ox = _ref.ox, oy = _ref.oy;
        console.assert(!(isNaN(ox) || isNaN(oy)));
        if (ox > maxLinearOverlap && oy > maxLinearOverlap) {
          good = false;
        } else if (ox * oy > maxArealOverlap) {
          good = false;
        } else if (ox > 0 && oy > 0) {
          if (list.overlaps[box.id] >= maxOverlaps) {
            console.debug('too many overlaps on box:', box.id);
            good = false;
          } else {
            newOverlaps.push(box.id);
          }
        }
      }
      if (!good) {
        return false;
      }
      console.debug('newOverlaps:', newOverlaps);
      if (newOverlaps.length > maxOverlaps) {
        console.debug('too many new overlaps');
        good = false;
      }
      for (_j = 0, _len1 = newOverlaps.length; _j < _len1; _j++) {
        id = newOverlaps[_j];
        console.debug('idn', id);
        list.overlaps[id] += 1;
      }
      console.debug('list.overlaps', list.overlaps);
      return good;
    };
    _boxCovers = function(a, b) {
      var xIn, yIn;
      xIn = a.x >= b.x && a.x + a.w <= b.x + b.w;
      yIn = a.y >= b.y && a.y + a.h <= b.y + b.h;
      return xIn && yIn;
    };
    return list.each(function(i, el) {
      var q;
      $(el).hide();
      $(el).on('mouseover', function(e) {
        clearInterval(fadeInterval);
        return list.each(function(j, el) {
          if (i !== j) {
            $(el).addClass('faded');
            return $(el).removeClass('focused');
          } else {
            $(el).removeClass('faded');
            return $(el).addClass('focused');
          }
        });
      });
      $(el).on('mouseout', function(e) {
        clearInterval(fadeInterval);
        return fadeInterval = setTimeout(function() {
          return list.removeClass('faded focused');
        }, fadeInDelay);
      });
      q = async.queue(function(item, done) {
        var box, size;
        size = {
          w: item.width(),
          h: item.height()
        };
        box = _newBox(size, list.boxes);
        if (box != null) {
          list.boxes.push(box);
          $(el).css({
            position: 'absolute',
            left: box.x,
            top: box.y
          });
          $(el).fadeIn();
        } else {
          console.debug('box FAIL');
        }
        return done();
      }, 1);
      return $(el).find('img').load(function() {
        return q.push($(el), function(err) {});
      });
    });
  };

}).call(this);
