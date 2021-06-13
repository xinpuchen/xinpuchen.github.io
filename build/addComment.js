const fs = require('fs');
const path = require('path');
const findFile = require('./findFile');

const rootDir = path.resolve(__dirname, '..', 'blogs');

const addComment = (dir) => {
    fs.appendFile(dir, `\n \n <comment/> \n `, (err) => {
      if (err) throw err;
      console.log(`add components to ${dir}`);
    })
}

findFile(rootDir, addComment);
