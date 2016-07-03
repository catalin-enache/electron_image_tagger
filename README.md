# Image tagger
Cross desktop application built with [Electron](http://electron.atom.io/) and [React](https://facebook.github.io/react/)
which helps organizing images on user's computer.

### Features

*  allows scanning for images on local computer, saving their location into local database (using [Sqlite3](https://github.com/mapbox/node-sqlite3) )
*  automatically creates thumbnails using [Sharp](https://github.com/lovell/sharp) library
*  has drag & drop support for scanning images
*  user can create tags and attach them to images
*  user can filter images by multiple tags criteria
*  user can open the directory where an image is located
*  automatically remove images from database when they were removed from their original location

### Downloads
[Image_Tagger_MacOSX](https://www.dropbox.com/s/5fqre6wjjj145ya/image_tagger-darwin-x64.zip?dl=0) |
[Image_Tagger_Windows](https://www.dropbox.com/s/p5i03m77z6ut84b/image_tagger-win32-x64.zip?dl=0) |
[Image_Tagger_Linux](https://www.dropbox.com/s/voi91mzpg38oug4/image_tagger-linux-x64.zip?dl=0)

# Note:
MacOSX package requires libvips being already installed:
brew install homebrew/science/vips


### App Screenshots
![Scan images](https://raw.githubusercontent.com/catalin-enache/electron_image_tagger/master/app_snapshots/1_scan_images.jpg "Scan images")
![Attach tags to image](https://raw.githubusercontent.com/catalin-enache/electron_image_tagger/master/app_snapshots/2_attach_tags_to_image.jpg "Attach tags to image")
![Manage tags](https://raw.githubusercontent.com/catalin-enache/electron_image_tagger/master/app_snapshots/3_manage_tags.jpg "Manage tags")
![Filter images](https://raw.githubusercontent.com/catalin-enache/electron_image_tagger/master/app_snapshots/4_filter_images.jpg "Filter images")


