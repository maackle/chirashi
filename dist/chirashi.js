(function() {
  var imageLoaded,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  imageLoaded = function(img) {
    return img.complete && !((img.naturalWidth != null) && img.naturalWidth === 0);
  };

  window.Chirashi = (function() {
    function Chirashi(containerSelector, opts) {
      var _base, _base1, _base2, _base3, _base4, _base5, _base6, _base7;
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
      if ((_base6 = this.opts).fadeSpeed == null) {
        _base6.fadeSpeed = 300;
      }
      if ((_base7 = this.opts).usePercentages == null) {
        _base7.usePercentages = true;
      }
      this.$container = $(containerSelector);
      this._reset();
      this.update();
    }

    Chirashi.prototype._reset = function() {
      this.$items = $();
      this._boxes = [];
      this._overlaps = [];
      this._fadeInterval = null;
      return this.$allItems().css({
        position: 'absolute',
        display: 'none'
      });
    };

    Chirashi.prototype.$allItems = function() {
      return this.$container.find(this.opts.itemSelector);
    };

    Chirashi.prototype.clear = function() {};

    Chirashi.prototype.update = function() {
      var currentItems, item, itemsToAdd, itemsToRemove, previousItems, _i, _len, _results;
      previousItems = this.$items;
      currentItems = this.$allItems();
      itemsToAdd = currentItems.filter(function(i) {
        return !(__indexOf.call(previousItems, this) >= 0);
      });
      itemsToRemove = previousItems.filter(function(i) {
        return !(__indexOf.call(currentItems, this) >= 0);
      });
      this._addItems(itemsToAdd);
      _results = [];
      for (_i = 0, _len = itemsToRemove.length; _i < _len; _i++) {
        item = itemsToRemove[_i];
        _results.push("TODO");
      }
      return _results;
    };

    Chirashi.prototype.destroy = function() {
      this.$allItems().off('mouseover mouseout');
      clearInterval(this._fadeInterval);
      return this._reset();
    };

    Chirashi.prototype._addItems = function($newItems) {
      var addOneItem,
        _this = this;
      addOneItem = function(item, done) {
        var $item, box, left, size;
        $item = $(item);
        size = {
          w: $item.outerWidth(),
          h: $item.outerHeight()
        };
        box = _this._newBox(size, _this._boxes);
        if (box != null) {
          _this._boxes.push(box);
          if (_this.opts.usePercentages) {
            left = (100 * box.x / $(window).width()) + "%";
          } else {
            left = box.x;
          }
          if ($item.css('left') == null) {
            $item.css({
              left: $(window).width() / 2,
              top: $(window).height() / 2
            });
          }
          $item.animate({
            left: left,
            top: box.y
          });
          $item.fadeIn(_this.opts.fadeSpeed);
          $item.removeClass('hidden');
          $item.on('mouseover', function(e) {
            clearInterval(_this._fadeInterval);
            return _this.$items.each(function(j, el2) {
              if (item !== el2) {
                return $(el2).stop().animate({
                  opacity: 0.5
                });
              } else {
                return $(el2).stop().animate({
                  opacity: 1
                });
              }
            });
          });
          $item.on('mouseout', function(e) {
            clearInterval(_this._fadeInterval);
            return _this._fadeInterval = setTimeout(function() {
              _this.$items.removeClass('faded focused');
              return _this.$items.animate({
                opacity: 1
              });
            }, _this.opts.fadeInDelay);
          });
          _this.$items.push(item);
          if (typeof done === 'function') {
            return done();
          }
        } else {
          if (typeof done === 'function') {
            return done("the box didn't get added because maxIterations was reached");
          }
        }
      };
      return $newItems.each(function(i, el) {
        var queue;
        $(el).addClass('hidden');
        queue = async.queue(addOneItem, 1);
        return $(el).find('img').each(function(i, img) {
          if (imageLoaded(img)) {
            return queue.push(el, function(err) {});
          } else {
            return img.onload = function() {
              return queue.push(el, function(err) {});
            };
          }
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
      }
      this._overlaps[newbox.id] = 0;
      if (iterations <= this.opts.maxIterations) {
        return newbox;
      } else {
        return null;
      }
    };

    Chirashi.prototype._checkFit = function(newbox, boxes) {
      var box, id, newOverlaps, ox, oy, totalOverlaps, _i, _j, _len, _len1, _ref;
      newOverlaps = [];
      for (_i = 0, _len = boxes.length; _i < _len; _i++) {
        box = boxes[_i];
        _ref = this._boxOverlap(box, newbox), ox = _ref.ox, oy = _ref.oy;
        console.assert(!(isNaN(ox) || isNaN(oy)));
        if (ox > this.opts.maxLinearOverlap && oy > this.opts.maxLinearOverlap) {
          return false;
        } else if (ox * oy > this.opts.maxArealOverlap) {
          return false;
        } else if (ox > 0 && oy > 0) {
          if (this._overlaps[box.id] >= this.opts.maxOverlaps) {
            return false;
          } else {
            newOverlaps.push(box.id);
          }
        }
      }
      totalOverlaps = _.reduce(this._overlaps, function(sum, num) {
        return sum + num;
      });
      if (totalOverlaps + newOverlaps.length > this.$items.length * this.opts.maxOverlaps) {
        return false;
      }
      for (_j = 0, _len1 = newOverlaps.length; _j < _len1; _j++) {
        id = newOverlaps[_j];
        this._overlaps[id] += 1;
      }
      return true;
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
        x: Math.floor(Math.random() * (this.$container.width() - size.w)),
        y: Math.floor(Math.random() * (this.$container.height() - size.h))
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
