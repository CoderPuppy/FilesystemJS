#FilesystemJS

A Unix type file system implemented in javascript.

##API

Access it via any AMD module format loader (whatever they're called) such as require.js.

To show you the API I'll put it in a variable called `fs`

**Find files (by path)**

`fs.getFile(<path>, <currentDir>);` EG: `fs.getFile('/home/user/README.md);` would find the file README.md in the default file system

**Get file contents**

`fs.readFile(<file>);` EG: `fs.readFile(_ /* output of the previus command */);`
