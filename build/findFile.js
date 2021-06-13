const fs = require('fs');

const findFile = (dir, callback) => {
  fs.readdir(dir, function (err, files) {
    if (err) throw err;
    files.forEach((fileName) => {
      const innerDir = `${dir}/${fileName}`;
      if (fileName.indexOf('.') !== 0) {
        fs.stat(innerDir, function (err, stat) {
          if (stat.isDirectory()) {
            findFile(innerDir, callback);
          } else {
            callback(innerDir);
          }
        })
      }
    })
  })
}

module.exports = findFile
