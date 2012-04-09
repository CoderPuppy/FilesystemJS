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

Return the contents of file <file>

**Create a path to a file**

`fs.pathTo(<file>);` EG: `fs.pathTo(fs.getFile('/home/user/README.md'))` => `'/home/user/README.md'`

**Change directory**

`fs.changeDir(<directory>)` EG: `fs.changeDir(fs.getFile('/home'))`

Switch to directory <directory>

**Create File**

`fs.createFile(<fileName>, <directory>)`

Create file <fileName> in <directory>

**Get symlink**

`fs.getSymlink(<file>)`

Make sure you have a file not a symlink

**Write data**

`fs.writeData(<file>, <data>)` EG: `fs.writeData(fs.getFile('/home/user/README.md')), 'This is README.md')`

Write data <data> to file <file>

**Initilize directory**

`fs.initDir(<file>)`

Let file <file> contain other files

**Create symlink**

`fs.symlink(<file>, <where>)`

Point file <file> to path <where>

**List files**

`fs.listFiles(<directory>)` EG: `fs.listFiles(fs.getFile('home'))`

List all the files in directory <directory>

**Has file**

`fs.hasFile(<dir>, <name>)`

Check if directory <dir> has a file named <name>

**Is **

`fs.isFile(<file>)`

`fs.isDir(<file>)`

`fs.isSymlink(<file>)`

Check if file <file> is a symlink/file/directory