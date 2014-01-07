
class window.Chirashi

	constructor: (containerSelector, @opts) ->
		@opts.itemSelector 		?= '.item'
		@opts.maxLinearOverlap 	?= 0.25
		@opts.maxArealOverlap 	?= 0.1
		@opts.maxOverlaps 		?= 1
		@opts.maxIterations 	?= 10
		@opts.fadeInDelay 		?= 750
		@opts.usePercentages 	?= true

		@container = $(containerSelector)
		@items = @container.find(@opts.itemSelector)
		@_boxes = []
		@_overlaps = []
		@_fadeInterval = null

		@_initialize()


	_initialize: ->
			
		@items.each (i, el) =>

			$(el).hide()
			$(el).on 'mouseover', (e) =>
				clearInterval(@_fadeInterval)
				@items.each (j, el) =>
					if i isnt j
						$(el).addClass 'faded'
						$(el).removeClass 'focused'
					else
						$(el).removeClass 'faded'
						$(el).addClass 'focused'
			$(el).on 'mouseout', (e) =>
				clearInterval(@_fadeInterval)
				@_fadeInterval = setTimeout =>
					@items.removeClass 'faded focused'
				, @opts.fadeInDelay
			
			queue = async.queue (item, done) =>
				size =
					w: item.width()
					h: item.height()
				box = @_newBox size, @_boxes
				if box?
					@_boxes.push box
					if @opts.usePercentages
						left = (100 * box.x / $(window).width()) + "%"
					else
						left = box.x
					$(el).css
						position: 'absolute'
						left: left
						top: box.y
					$(el).fadeIn()
					done()
				else
					done("the box didn't get added because maxIterations was reached")
			, 1

			$(el).find('img').load ->
				queue.push $(el), (err) ->
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
			console.log 'iter: ', iterations
		@_overlaps[newbox.id] = 0
		if iterations <= @opts.maxIterations
			newbox
		else 
			console.debug 'too many iterations ! ! !'
			null


	_checkFit: (newbox, boxes) ->
		good = true
		newOverlaps = []
		console.debug '----------', newbox.id
		for box in boxes
			{ox, oy} = @_boxOverlap box, newbox
			console.assert not(isNaN(ox) or isNaN(oy))
			if ox > @opts.maxLinearOverlap and oy > @opts.maxLinearOverlap
				# console.debug 'too much linear overlap', [ox, oy], newbox, boxes
				good = false
			else if ox * oy > @opts.maxArealOverlap
				# console.debug 'too much areal overlap', [ox * oy], newbox, boxes
				good = false
			else if ox > 0 and oy > 0  # there is an overlap
				if @_overlaps[box.id] >= @opts.maxOverlaps
					console.debug 'too many overlaps on box:', box.id
					good = false
				else
					newOverlaps.push box.id

		if not good 
			return false

		console.debug 'newOverlaps:', newOverlaps
		if newOverlaps.length > @opts.maxOverlaps
			console.debug 'too many new overlaps'
			good = false
		for id in newOverlaps
			console.debug 'idn', id
			@_overlaps[id] += 1
		console.debug '@_overlaps', @_overlaps
		return good


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
		x: Math.floor( Math.random() * (@container.width() - size.w) )
		y: Math.floor( Math.random() * (@container.height() - size.h) )


	_boxCovers: (a, b) ->
		xIn = a.x >= b.x and a.x + a.w <= b.x + b.w
		yIn = a.y >= b.y and a.y + a.h <= b.y + b.h
		return xIn and yIn


