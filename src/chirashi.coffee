
imageLoaded = (img) ->
	img.complete && not(img.naturalWidth? && img.naturalWidth == 0)

class window.Chirashi

	constructor: (containerSelector, @opts) ->
		@opts.itemSelector 		?= '.item'
		@opts.maxLinearOverlap 	?= 0.25
		@opts.maxArealOverlap 	?= 0.1
		@opts.maxOverlaps 		?= 1
		@opts.maxIterations 	?= 10
		@opts.fadeInDelay 		?= 750
		@opts.fadeSpeed 		?= 300
		@opts.usePercentages 	?= true

		@$container = $(containerSelector)
		@_reset()
		
		@update()

	_reset: ->
		@$items = $()
		@_boxes = []
		@_overlaps = []
		@_fadeInterval = null
		@$allItems().css
			position: 'absolute'
			display: 'none'

	$allItems: -> @$container.find(@opts.itemSelector)

	clear: ->

	update: ->
		previousItems = @$items
		currentItems = @$allItems()
		itemsToAdd = currentItems.filter (i) -> not (this in previousItems)
		itemsToRemove = previousItems.filter (i) -> not (this in currentItems)

		@_addItems(itemsToAdd)

		for item in itemsToRemove
			"TODO"
			# console.log 'remove', item

	destroy: ->
		@$allItems().off 'mouseover mouseout'
		clearInterval(@_fadeInterval)
		@_reset()

	_addItems: ($newItems) ->
		# should only be used on items that haven't already been added
			
		addOneItem = (item, done) =>
			$item = $(item)
			size =
				w: $item.outerWidth()
				h: $item.outerHeight()
			box = @_newBox size, @_boxes
			if box?
				@_boxes.push box
				if @opts.usePercentages
					left = (100 * box.x / $(window).width()) + "%"
				else
					left = box.x
				if not $item.css('left')?
					$item.css
						left: $(window).width() / 2
						top: $(window).height() / 2
				$item.animate
					left: left
					top: box.y

				$item.fadeIn(@opts.fadeSpeed)
				$item.removeClass('hidden')
				$item.on 'mouseover', (e) =>
					clearInterval(@_fadeInterval)
					@$items.each (j, el2) =>
						if item isnt el2
							# $(el2).addClass 'faded'
							# $(el2).removeClass 'focused'

							$(el2).stop().animate
								opacity: 0.5
						else
							$(el2).stop().animate
								opacity: 1
						# 	$(el2).removeClass 'faded'
						# 	$(el2).addClass 'focused'
				$item.on 'mouseout', (e) =>
					clearInterval(@_fadeInterval)
					@_fadeInterval = setTimeout =>
						@$items.removeClass 'faded focused'
						@$items.animate
							opacity: 1
					, @opts.fadeInDelay
				@$items.push item
				done() if typeof done is 'function'
			else
				done("the box didn't get added because maxIterations was reached") if typeof done is 'function'

		$newItems.each (i, el) =>

			$(el).addClass('hidden')
			
			queue = async.queue addOneItem, 1

			$(el).find('img').each (i, img) =>

				if imageLoaded(img)
					queue.push el, (err) ->
				else
					img.onload = ->
						queue.push el, (err) ->
							return  # could handle the error here, but nahhh


	_newBox: (size, boxes) ->
		{w, h} = size
		{x, y} = @_randomPosition(size)
		newbox = 
			x: x
			y: y
			w: w
			h: h
			id: @_boxes.length
		iterations = 0
		while iterations <= @opts.maxIterations and not @_checkFit newbox, @_boxes
			{x, y} = @_randomPosition(size)
			newbox.x = x
			newbox.y = y
			iterations += 1
		@_overlaps[newbox.id] = 0
		if iterations <= @opts.maxIterations
			newbox
		else 
			null


	_checkFit: (newbox, boxes) ->
		newOverlaps = []
		for box in boxes
			{ox, oy} = @_boxOverlap box, newbox
			console.assert not(isNaN(ox) or isNaN(oy))
			if ox > @opts.maxLinearOverlap and oy > @opts.maxLinearOverlap
				# console.debug 'too much linear overlap', [ox, oy], newbox, boxes
				return false
			else if ox * oy > @opts.maxArealOverlap
				# console.debug 'too much areal overlap', [ox * oy], newbox, boxes
				return false
			else if ox > 0 and oy > 0  # there is an overlap
				if @_overlaps[box.id] >= @opts.maxOverlaps
					# console.debug 'too many overlaps on box:', box.id
					return false
				else
					newOverlaps.push box.id

		totalOverlaps = _.reduce @_overlaps, (sum, num) -> sum + num
		# console.log totalOverlaps, "+", newOverlaps.length, ">", @$items.length, "*", @opts.maxOverlaps
		# if newOverlaps.length > @opts.maxOverlaps
		# this is what allows for fractional maxOverlaps
		if totalOverlaps + newOverlaps.length > @$items.length * @opts.maxOverlaps
			return false
		for id in newOverlaps
			@_overlaps[id] += 1
		return true


	_overlap1D: (ax1, ax2, bx1, bx2) ->
		if ax1 <= bx1 and ax2 <= bx2
			Math.max 0, ax2 - bx1
		else if ax1 >= bx1 and ax2 >= bx2
			Math.max 0, bx2 - ax1
		else if ax1 <= bx1 and ax2 >= bx2
			bx2 - bx1
		else if ax1 >= bx1 and ax2 <= bx2
			ax2 - ax1


	_boxOverlap: (a, b) ->
		# calculates the amount that box b overlaps box a in each dimension

		ox = @_overlap1D a.x, a.x + a.w, b.x, b.x + b.w 
		oy = @_overlap1D a.y, a.y + a.h, b.y, b.y + b.h

		ox: (ox) / a.w
		oy: (oy) / a.h


	_randomPosition: (size) ->
		x: Math.floor( Math.random() * (@$container.width() - size.w) )
		y: Math.floor( Math.random() * (@$container.height() - size.h) )


	_boxCovers: (a, b) ->
		xIn = a.x >= b.x and a.x + a.w <= b.x + b.w
		yIn = a.y >= b.y and a.y + a.h <= b.y + b.h
		return xIn and yIn


