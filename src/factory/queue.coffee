# Least-recently-used queue for key expiry via linked list
queue = (limit = 100) ->
  map = {}

  head  = null
  tail  = null
  count = 0

  # Insert at front
  add = (item) ->
    item.prev = null
    item.next = head

    head.prev = item if head?

    head      = item
    tail      = item if !tail?

  # Remove from list
  remove = (item) ->
    prev = item.prev
    next = item.next

    prev.next = next if prev?
    next.prev = prev if next?

    head = next      if head == item
    tail = prev      if tail == item

  # Push key to top of list
  (key) ->
    if item = map[key] and item != head
      # Already in queue
      remove item
      add    item

    else
      # Check capacity
      if count == limit
        # Pop tail
        dead = tail.key
        remove tail

        # Expire key
        delete map[dead]
      else
        count++

      # Replace head
      item = next: head, prev: null, key: key
      add item

      # Map record for lookup
      map[key] = item

    # Return expired key
    dead

module.exports = queue
