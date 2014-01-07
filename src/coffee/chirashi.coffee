

$.fn.chirashi = (opts) ->

	maxLinearOverlap = 0.25
	maxArealOverlap = 0.1
	maxOverlaps = 1
	maxIterations = 10

	fadeInDelay = 750

	container = this
	list = this.find(opts.selector)
	list.boxes = []
	list.overlaps = {}

	fadeInterval = null

	_randomPosition = (size) ->
		x: Math.floor( Math.random() * (container.width() - size.w) )
		y: Math.floor( Math.random() * (container.height() - size.h) )

	_newBox = (size, boxes) ->
		{w, h} = size
		{x, y} = _randomPosition(size)
		newbox = 
			x: x
			y: y
			w: w
			h: h
			id: list.boxes.length
		iterations = 0
		while iterations <= maxIterations and not _checkFit newbox, list.boxes
			{x, y} = _randomPosition(size)
			newbox.x = x
			newbox.y = y
			iterations += 1
			console.log 'iter: ', iterations
		list.overlaps[newbox.id] = 0
		if iterations <= maxIterations
			newbox
		else 
			console.debug 'too many iterations ! ! !'
			null

	_overlap1D = (ax1, ax2, bx1, bx2) ->
		if ax1 <= bx1 and ax2 <= bx2
			Math.max 0, ax2 - bx1
		else if ax1 >= bx1 and ax2 >= bx2
			Math.max 0, bx2 - ax1
		else if ax1 <= bx1 and ax2 >= bx2
			bx2 - bx1
		else if ax1 >= bx1 and ax2 <= bx2
			ax2 - ax1

	_boxOverlap = (a, b) ->
		# calculates the amount that box b overlaps box a in each dimension

		# xo1 = Math.max 0, a.x - (b.x + b.w)
		# xo2 = Math.max 0, (a.x + a.w) - b.x
		# yo1 = Math.max 0, a.y - (b.y + b.h)
		# yo2 = Math.max 0, (a.y + a.h) - b.y

		ox = _overlap1D a.x, a.x + a.w, b.x, b.x + b.w 
		oy = _overlap1D a.y, a.y + a.h, b.y, b.y + b.h

		# console.log 'boxoverlap:', ox, oy, a.w, a.h

		ox: (ox) / a.w
		oy: (oy) / a.h


	_checkFit = (newbox, boxes) ->
		good = true
		newOverlaps = []
		console.debug '----------', newbox.id
		for box in boxes
			{ox, oy} = _boxOverlap box, newbox
			console.assert not(isNaN(ox) or isNaN(oy))
			if ox > maxLinearOverlap and oy > maxLinearOverlap
				# console.debug 'too much linear overlap', [ox, oy], newbox, boxes
				good = false
			else if ox * oy > maxArealOverlap
				# console.debug 'too much areal overlap', [ox * oy], newbox, boxes
				good = false
			else if ox > 0 and oy > 0  # there is an overlap
				if list.overlaps[box.id] >= maxOverlaps
					console.debug 'too many overlaps on box:', box.id
					good = false
				else
					newOverlaps.push box.id

		if not good 
			return false

		console.debug 'newOverlaps:', newOverlaps
		if newOverlaps.length > maxOverlaps
			console.debug 'too many new overlaps'
			good = false
		for id in newOverlaps
			console.debug 'idn', id
			list.overlaps[id] += 1
		console.debug 'list.overlaps', list.overlaps
		return good

	_boxCovers = (a, b) ->
		xIn = a.x >= b.x and a.x + a.w <= b.x + b.w
		yIn = a.y >= b.y and a.y + a.h <= b.y + b.h
		return xIn and yIn
	
	list.each (i, el) ->

		$(el).hide()
		$(el).on 'mouseover', (e) ->
			clearInterval(fadeInterval)
			list.each (j, el) ->
				if i isnt j
					$(el).addClass 'faded'
					$(el).removeClass 'focused'
				else
					$(el).removeClass 'faded'
					$(el).addClass 'focused'
		$(el).on 'mouseout', (e) ->
			clearInterval(fadeInterval)
			fadeInterval = setTimeout ->
				list.removeClass 'faded focused'
			, fadeInDelay
		
		q = async.queue (item, done) ->
			size =
				w: item.width()
				h: item.height()
			box = _newBox size, list.boxes
			if box?
				list.boxes.push box

				$(el).css
					position: 'absolute'
					left: box.x
					top: box.y

				$(el).fadeIn()

				# $(el).append """<div class="debug" style="position: absolute; left: 50%; top: 50%;">(#{box.id})</div>"""
			else
				console.debug 'box FAIL'
			done()
		, 1

		$(el).find('img').load ->
			q.push $(el), (err) ->
				# console.debug 'finished with a box'

		# $(el).append """<div class="debug" style="position: absolute; left: 0; top: 0;">(#{box.x}, #{box.y})</div>"""
		# $(el).append """<div class="debug" style="position: absolute; right: 0; bottom: 0;">(#{box.x + box.w}, #{box.y + box.h})</div>"""
		# $(el).append """<div class="debug" style="position: absolute; right: 0; top: 0;">#{ box.x + box.w }</div>"""
		# $(el).append """<div class="debug" style="position: absolute; left: 0; bottom: 0;">#{ box.y }</div>"""




