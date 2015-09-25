assert = require('assert')

add = (a, b) ->
  console.assert typeof a == 'number'
  assert !isNaN(a)
  assert.equal typeof b, 'number'
  assert.ok !isNaN(b)
  a + b
