var _ = require('lodash')

module.exports = new bm()
module.exports.constructor = bm

function bm(){
  this.cache = {}
}

bm.prototype.db =  function(store) {
  var self = this
  if(!self.cache[store.location]) self.cache[store.location] = new sequencer(store)
  return self.cache[store.location] 
}

function sequencer(store){
  this.store = store
  this.pending = {}
}

sequencer.prototype.blindmerge = function(key, partial, cb){
  this.pending[key] = this.pending[key] || []
  this.pending[key].push({
    key: key,
    partial: partial,
    cb: cb
  })
  this.kick(key)
}

sequencer.prototype.kick = function(key){
  console.log('kick')
  var action = this.pending[key][0]
  console.log(this.pending[key])
  this._blindmerge(action.key, action.partial, action.cb)
}

sequencer.prototype._blindmerge = function(key, partial, cb){
  var self = this
  var db = this.store
  db.get(key, function(err, data){
    if(err){
      //@todo handle err
      endaction(err, data)
    }
    else{
      var  mergeddata = arrayMerge(data, partial)
      db.put(key, mergeddata, function(err){
        console.log('been put')
        if(err){
          //@todo handle err
          endaction(err, data)
        }
        endaction(null, data)
      })
    }
  })

  function endaction(err, data){
    self.pending[key].shift()
    if(self.pending[key].length > 0) self.kick(key)
    else{
      console.log('q empty')
    }
    cb(err, data)
  }
}

function arrayMerge(obj1, obj2){
  return _.merge(obj1, obj2, function(a, b) {
    return _.isArray(a) ? a.concat(b) : undefined;
  })
}