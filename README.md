# sr_parse_ts - parse functions.

## parse jsdoc functions
* {startIx, endIx, docLines } = jsdoc_isolateNext( lines: string[] )
* {startIx, endIx, initialText, tag_arr } = jsdoc_parseNext( lines: string[] )

## srcmbr jsdoc
* {mbrName, srcType, textDesc, srcmbr_fileName } = jsdoc_srcmbrDoc( lines )

## publish instructions
* increment version number in package.json
* npm run build
* npm run test
* git add, commit, push to repo
* npm publish
* npm update in projects which use this package

## testing 
* npm run test
