
// ---------------------------------- iJsdoc_tag ----------------------------------
export interface iJsdoc_tag
{
  tagName:string;
  tagText:string;
}

// --------------------------------- iJsdoc_parts ---------------------------------
/**
 * @interface iJsdoc_parts
 * @property `startIx` index of starting line of jsdoc text.
 */
export interface iJsdoc_parts
{
  startIx: number;
  endIx: number;
  jsdoc_text: string;
  initialText: string;
  tag_arr: iJsdoc_tag[];
}

// ------------------------------- jsdoc_parseNext -------------------------------
/**
 * find the first jsdoc 
 * @param lines Array of text lines in which to find and parse the next jsdoc
 *              formatted pattern.
 * @param startIx Line index at which to start search for next jsdoc pattern.
 */
export function jsdoc_parseNext(lines: string[], startIx:number = 0) : iJsdoc_parts
{
  // looking for line that starts with /**
  const { endIx, startIx:ix, docLines } = jsdoc_isolateNext(lines);
  startIx = ix ;
  const jsdoc_text = docLines.join('\n');
  let initialText = '' ;
  const tag_arr: iJsdoc_tag[] = [] ;
  
  // isolate initial text of the jsdoc text. This is text that runs up to the @ of 
  // the first @tagname.
  let bx = 0 ;
  const match = jsdoc_text.match(/^(\s*)([\s\S]*?)(@|$)/);
  if (match)
  {
    const ws = match[1];
    initialText = match[2].trim() ;
    bx = (match.index || 0) + ws.length + initialText.length ;
  }

  // loop matching each @tagname and text that follows up to start of nxt tag name.
  {
    const regex = /(@\w*)\s*([\s\S]*?)(@|$)/g;
    while(true)
    {
      regex.lastIndex = bx;
      const match = regex.exec(jsdoc_text) ;
      if ( !match )
        break ;
      const tagName = match[1] ;
      const tagText = match[2].trim( ) ;
      const tag:iJsdoc_tag = {tagName, tagText } ;
      tag_arr.push(tag);

      if ( regex.lastIndex == 0)
        break
      bx = regex.lastIndex - 1 ;
    }
  }
 
  return { startIx, endIx, jsdoc_text, initialText, tag_arr} ;
}

// ------------------------------ jsdoc_isolateNext -------------------------------
/**
 * extract the next set of jsdoc lines from the input array of text lines.
 * jsdoc lines start with / * *.  and end with * /
 * Return the text lines between those two markers as array of text lines.
 * Also, remove the * from the start of each text line.
 * @param lines Input array of text lines.
 * @param startIx line index at which to start scan for next jsdoc pattern.
 * @returns object containing startIx: start line index, endIx: end line index
 * and docLines: array of isolated jsdoc text lines.
 */
export function jsdoc_isolateNext(lines: string[], startIx:number = 0)
{
  let found = false ;
  const docLines: string[] = [];
  let endIx = -1;
  for (let ix = startIx; ix < lines.length; ++ix)
  {
    const line = lines[ix];

    // looking for starting line.
    if (!found)
    {
      const regex = /(\/\*\*)\s*(.+)*/;
      const match = regex.exec(line);
      if (match)
      {
        startIx = ix;
        found = true ;
        if (match[2])
          docLines.push(match[2]);
      }
    }

    // */ marks the last line of the jsdoc set of lines.
    else if (line.match(/\*\//))
    {
      endIx = ix;
      // look for any text prior to the */
      const regex = /\s*(.*?)(\*\/)/;
      const match = regex.exec(line);
      if (match)
      {
        if (match[1])
          docLines.push(match[1]);
      }
      break ;
    }

    // this line is a jsdoc line.  remove the * from front of line. Then save to
    // output array of lines.
    else
    {
      const match = line.match(/\s*\*?\s*(.*)/);
      if ( match && match[1])
      {
        docLines.push(match[1]);
      }
    }
  }

  if (!found)
    startIx = -1 ;
  return { startIx, endIx, docLines };
}
