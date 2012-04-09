#FilesystemJS

A Unix type file system implemented in javascript.

##Features

+ Symlinks
+ Directories
+ Files
+ Current directory

##API

Access it via any AMD module format loader (whatever they're called) such as require.js.

To show you the API I'll put it in a variable called `fs`

`<file>` => A file returned from `fs.getFile` or `fs.listFiles`
`<directory>` => A file that has files inside it

**Find files (by path)**

`fs.getFile(<path>, <currentDir>);` EG: `fs.getFile('/home/user/README.md);` would find the file README.md in the default file system

**Get file contents**

`fs.readFile(<file>);` EG: `fs.readFile(_ /* output of the previus command */);`

**Create a path to a file**

`fs.pathTo(<file>);` EG: `fs.pathTo(fs.getFile('/home/user/README.md'))` => `'/home/user/README.md'`


**Change directory**

`fs.changeDir(<directory>)`
