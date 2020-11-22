import { jsdoc_parseNext } from "./parse_jsdoc";

// ---------------------------------- iSrcmbrDoc ----------------------------------
export interface iSrcmbrDoc {
  mbrName:string;
  textDesc:string;
  srcType:string;
  srcmbr_fileName:string;
}

// -------------------------------- jsdoc_srcmbrDoc --------------------------------
/**
 * scan the input text lines, looking for the first jsDoc formatted comment lines.
 * Parse the jsdoc comment lines and extract the srcmbr mbrd related @tags.
 * @param lines text lines to search and extract jsdoc documentation lines from.
 */
export function jsdoc_srcmbrDoc( lines: string[]) : iSrcmbrDoc | undefined
{
  let srcmbrDoc: iSrcmbrDoc | undefined ;
  let mbrName = '' ;
  let textDesc = '' ;
  let srcType = '' ;
  let srcmbr_fileName = '' ;
  const { initialText, tag_arr } = jsdoc_parseNext(lines);

  if ( tag_arr.length > 0 )
  {
    for( const tag of tag_arr )
    {
      if ( tag.tagName == '@mbrName')
        mbrName = tag.tagText ;
      if (tag.tagName == '@textDesc')
        textDesc = tag.tagText;
      if (tag.tagName == '@srcType')
        srcType = tag.tagText;
      if (tag.tagName == '@srcmbr_fileName')
        srcmbr_fileName = tag.tagText;
    }
    srcmbrDoc = { mbrName, textDesc, srcType, srcmbr_fileName };
  }

  return srcmbrDoc ;
}
