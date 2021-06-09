/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Least-recently-used queue for key expiry via linked list
export const queue = function(limit) {
  if (limit == null) { limit = 100; }
  const map = {};

  let head  = null;
  let tail  = null;
  let count = 0;

  // Insert at front
  const add = function(item) {
    item.prev = null;
    item.next = head;

    if (head != null) { head.prev = item; }

    head      = item;
    if ((tail == null)) { return tail      = item; }
  };

  // Remove from list
  const remove = function(item) {
    const {
      prev
    } = item;
    const {
      next
    } = item;

    if (prev != null) { prev.next = next; }
    if (next != null) { next.prev = prev; }

    if (head === item) { head = next; }
    if (tail === item) { return tail = prev; }
  };

  // Push key to top of list
  return function(key) {
    let dead, item;
    if (item = map[key] && (item !== head)) {
      // Already in queue
      remove(item);
      add(item);

    } else {
      // Check capacity
      if (count === limit) {
        // Pop tail
        dead = tail.key;
        remove(tail);

        // Expire key
        delete map[dead];
      } else {
        count++;
      }

      // Replace head
      item = {next: head, prev: null, key};
      add(item);

      // Map record for lookup
      map[key] = item;
    }

    // Return expired key
    return dead;
  };
};
