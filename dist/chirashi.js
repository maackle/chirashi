(function() {
  window.Chirashi = (function() {
    function Chirashi(containerSelector, opts) {
      var _base, _base1, _base2, _base3, _base4, _base5, _base6;
      this.opts = opts;
      if ((_base = this.opts).itemSelector == null) {
        _base.itemSelector = '.item';
      }
      if ((_base1 = this.opts).maxLinearOverlap == null) {
        _base1.maxLinearOverlap = 0.25;
      }
      if ((_base2 = this.opts).maxArealOverlap == null) {
        _base2.maxArealOverlap = 0.1;
      }
      if ((_base3 = this.opts).maxOverlaps == null) {
        _base3.maxOverlaps = 1;
      }
      if ((_base4 = this.opts).maxIterations == null) {
        _base4.maxIterations = 10;
      }
      if ((_base5 = this.opts).fadeInDelay == null) {
        _base5.fadeInDelay = 750;
      }
      if ((_base6 = this.opts).usePercentages == null) {
        _base6.usePercentages = true;
      }
      this.container = $(containerSelector);
      this.items = this.container.find(this.opts.itemSelector);
      this._boxes = [];
      this._overlaps = [];
      this._fadeInterval = null;
      this._initialize();
    }

    Chirashi.prototype._initialize = function() {
      var _this = this;
      return this.items.each(function(i, el) {
        var queue;
        $(el).hide();
        $(el).on('mouseover', function(e) {
          clearInterval(_this._fadeInterval);
          return _this.items.each(function(j, el) {
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
          clearInterval(_this._fadeInterval);
          return _this._fadeInterval = setTimeout(function() {
            return _this.items.removeClass('faded focused');
          }, _this.opts.fadeInDelay);
        });
        queue = async.queue(function(item, done) {
          var box, left, size;
          size = {
            w: item.width(),
            h: item.height()
          };
          box = _this._newBox(size, _this._boxes);
          if (box != null) {
            _this._boxes.push(box);
            if (_this.opts.usePercentages) {
              left = (100 * box.x / $(window).width()) + "%";
            } else {
              left = box.x;
            }
            $(el).css({
              position: 'absolute',
              left: left,
              top: box.y
            });
            $(el).fadeIn();
            return done();
          } else {
            return done("the box didn't get added because maxIterations was reached");
          }
        }, 1);
        return $(el).find('img').load(function() {
          return queue.push($(el), function(err) {});
        });
      });
    };

    Chirashi.prototype._newBox = function(size, boxes) {
      var h, iterations, newbox, w, x, y, _ref, _ref1;
      w = size.w, h = size.h;
      _ref = this._randomPosition(size), x = _ref.x, y = _ref.y;
      newbox = {
        x: x,
        y: y,
        w: w,
        h: h,
        id: this._boxes.length
      };
      iterations = 0;
      while (iterations <= this.opts.maxIterations && !this._checkFit(newbox, this._boxes)) {
        _ref1 = this._randomPosition(size), x = _ref1.x, y = _ref1.y;
        newbox.x = x;
        newbox.y = y;
        iterations += 1;
        console.log('iter: ', iterations);
      }
      this._overlaps[newbox.id] = 0;
      if (iterations <= this.opts.maxIterations) {
        return newbox;
      } else {
        console.debug('too many iterations ! ! !');
        return null;
      }
    };

    Chirashi.prototype._checkFit = function(newbox, boxes) {
      var box, good, id, newOverlaps, ox, oy, _i, _j, _len, _len1, _ref;
      good = true;
      newOverlaps = [];
      console.debug('----------', newbox.id);
      for (_i = 0, _len = boxes.length; _i < _len; _i++) {
        box = boxes[_i];
        _ref = this._boxOverlap(box, newbox), ox = _ref.ox, oy = _ref.oy;
        console.assert(!(isNaN(ox) || isNaN(oy)));
        if (ox > this.opts.maxLinearOverlap && oy > this.opts.maxLinearOverlap) {
          good = false;
        } else if (ox * oy > this.opts.maxArealOverlap) {
          good = false;
        } else if (ox > 0 && oy > 0) {
          if (this._overlaps[box.id] >= this.opts.maxOverlaps) {
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
      if (newOverlaps.length > this.opts.maxOverlaps) {
        console.debug('too many new overlaps');
        good = false;
      }
      for (_j = 0, _len1 = newOverlaps.length; _j < _len1; _j++) {
        id = newOverlaps[_j];
        console.debug('idn', id);
        this._overlaps[id] += 1;
      }
      console.debug('@_overlaps', this._overlaps);
      return good;
    };

    Chirashi.prototype._overlap1D = function(ax1, ax2, bx1, bx2) {
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

    Chirashi.prototype._boxOverlap = function(a, b) {
      var ox, oy;
      ox = this._overlap1D(a.x, a.x + a.w, b.x, b.x + b.w);
      oy = this._overlap1D(a.y, a.y + a.h, b.y, b.y + b.h);
      return {
        ox: ox / a.w,
        oy: oy / a.h
      };
    };

    Chirashi.prototype._randomPosition = function(size) {
      return {
        x: Math.floor(Math.random() * (this.container.width() - size.w)),
        y: Math.floor(Math.random() * (this.container.height() - size.h))
      };
    };

    Chirashi.prototype._boxCovers = function(a, b) {
      var xIn, yIn;
      xIn = a.x >= b.x && a.x + a.w <= b.x + b.w;
      yIn = a.y >= b.y && a.y + a.h <= b.y + b.h;
      return xIn && yIn;
    };

    return Chirashi;

  })();

}).call(this);
