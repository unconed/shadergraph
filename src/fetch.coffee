fetch = (name) ->
  e = document.getElementById(name)
  e.textContent || e.innerText || name

module.exports = fetch