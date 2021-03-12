
import {scan_unquotedPattern, string_dequote, string_substrLenient} from 'sr_core_ts';

// --------------------------------- iHtmlElement ---------------------------------
export interface iHtmlElement
{
  elemName: string;
  index: number;
  length: number;
  attrArr?: iHtmlAttr[] ;
  contentArr?: iElementContentItem[] ;
  closeTag?: iElementCloseTag ;
  commentTag?: iHtmlCommentTag;
}

// ----------------------------------- iHtmlAttr -----------------------------------
export interface iHtmlAttr
{
  index: number;
  length:number;
  kwd: string;
  vlu?: string;
  rawVlu?: string;
  rawVluBx?:number;
}

// --------------------------------- iHtmlCommentTag ---------------------------------
export interface iHtmlCommentTag
{
  index: number;  // index of html comment, from opening <!--
  length: number; // length of comment element. from <!-- to -->.
  text: string;   // comment text. From first non whitespace after the <!--
  textIndex: number;
  closeIndex: number;   // index of --> which ends the html comment.
}

// ------------------------------ iElementContentItem ------------------------------
export interface iElementContentItem
{
  contentType: 'mustache' | 'text' | 'element' ;
  index: number;
  length: number;
  text?: string ;
  element?: iHtmlElement;
}

// ------------------------------- iElementCloseTag -------------------------------
export interface iElementCloseTag
{
  index:number;
  length:number;
  tagName: string | undefined ;
}

// ---------------------------------- html_parse ----------------------------------
export function html_parse(text: string)
{
  const { index, length, contentArr, errmsg } = htmlElemContent_parse( text, 0 ) ;

  return { index, length, contentArr, errmsg } ;
}

// ------------------------------- htmlElement_parse -------------------------------
function htmlElement_parse( text:string, bx:number )
{
  let htmlElement: iHtmlElement | undefined ;
  let elemName = '' ;
  let attrArr: iHtmlAttr[] = [];
  let errmsg: string | undefined;
  let elemOpenEx: number | undefined;
  let contentArr: iElementContentItem[] | undefined ;
  let closeTag: iElementCloseTag | undefined ;
  let elemClosed: boolean | undefined;  // elem open ended with />.
  let commentTag: iHtmlCommentTag | undefined ;

  let openTagOnly = false ;
  let elem_bx = 0;

  // an html comment
  if ( string_substrLenient(text,bx,4) == '<!--')
  {
    const rv = htmlComment_parse(text, bx) ;
    errmsg = rv.errmsg ;
    commentTag = rv.commentTag;
    if ( commentTag )
    {
      elem_bx = commentTag.index ;
      bx = commentTag.index + commentTag.length ;
      openTagOnly = true ;
    }
  }

  // parse the open tag of the element. from < to > or />.
  if ( !errmsg && !commentTag )
  {
    const rv = htmlOpenTag_parse( text, bx ) ;
    elemName = rv.tagName ;
    errmsg = rv.errmsg ;
    if ( !errmsg )
    {
      elem_bx = bx ;
      attrArr = rv.attrArr ;
      elemClosed = rv.elemClosed;
      bx += rv.length ;

      // check if this element only contains the open tag.  
      if ( elemClosed )
        openTagOnly = true ;
      else
      {
        const lowerElemName = elemName.toLowerCase( ) ;
        if ((lowerElemName == '!doctype') || ( lowerElemName == 'br') ||
          (lowerElemName == 'meta') || ( lowerElemName == 'link'))
          openTagOnly = true ;
      }
    }
  }

  // element open parsed successfully. Continue on to parse element content and close elem.
  if (!errmsg && !commentTag && !openTagOnly)
  {
    const rv = htmlElemContent_parse(text, bx);
    errmsg = rv.errmsg ;
    if ( !errmsg )
    {
      contentArr = rv.contentArr ;
      bx = rv.index + rv.length ;
    }
  }

  // html closing tag
  if ( !errmsg && !commentTag && !openTagOnly && (bx < text.length))
  {
    const rv = htmlCloseTag_parse(text, bx ) ;
    errmsg = rv.errmsg ;
    closeTag = rv.closeTag;
    if ( closeTag )
      bx += closeTag.length ;
  }

  if ( !errmsg )
  {
    htmlElement = { elemName, index:elem_bx, length: bx - elem_bx, attrArr, contentArr, closeTag, commentTag } ;
  }

  return { errmsg, htmlElement } ;
}

// ------------------------------ htmlElemContent_parse ------------------------------
// parse the content of html element. The content being the contents between the 
// <div> xxxxx </div>
function htmlElemContent_parse( text:string, contentBx:number )
{
  let bodyBx: number | undefined ;
  let bodyEx: number | undefined;
  let errmsg: string | undefined;
  let contentArr: iElementContentItem[] = [] ;

  let bx = contentBx ;
  while( bx < text.length && !errmsg )
  {
    
  // loop advancing and isolating content items until </ close tag
    let startMustache: string | undefined ; // {{
    let endElem: string | undefined;    // </
    let startElem: string | undefined;  // <
    let index_bx = 0 ;
    
    const regex = /(\s*)((<\/)|({{)|(<))/g;
    regex.lastIndex = bx ;
    const match = regex.exec(text) ;

    // no match. the content of the html element runs to end of text.
    if ( !match )
    {
      // any non whitespace text. write as text content item.
      {
        const regex = /\S/g;
        regex.lastIndex = bx ;
        const match = regex.exec(text) ;
        if ( match )
        {
          bx = match.index ;
          const length = text.length - bx;
          const itemText = text.substr(bx);
          const item: iElementContentItem = { contentType: 'text', index: bx, length, text: itemText };
          contentArr.push(item);
        }
      }
      bx = text.length ;
      index_bx = bx ;
    }

    else 
    {
      const ws = match[1] ;
      bx = bx + ws.length ;
      index_bx = match.index + ws.length ;
      
      endElem = match[3];
      startMustache = match[4];
      startElem = match[5] ;
    }

    // parse the mustache item. {{ ssssss }}
    if ( startMustache && ( index_bx == bx))
    {
      const rv = mustacheItem_parse( text, bx, startMustache ) ;
      errmsg = rv.errmsg ;
      if (!errmsg)
      {
        const { index, length, text:itemText } = rv ;
        const item: iElementContentItem = { contentType:'mustache', index, length, text: itemText } ;
        contentArr.push( item ) ;
        bx = index + length ;
      }
    }

    // start of an html element. parse the element from open to closing tag.
    else if ( startElem && ( index_bx == bx))
    {
      const rv = htmlElement_parse( text, bx ) ;
      errmsg = rv.errmsg;
      if (!errmsg)
      {
        const element = rv.htmlElement;
        const { index, length } = element! ;
        const item: iElementContentItem = { contentType: 'element', index, length, element };
        contentArr.push(item);
        bx = index + length;
      }
    }

    // start of an end tag. This would have to be the end tag of the open tag that
    // this content is a part of.
    else if ( endElem && ( index_bx == bx))
    {
      break;
    }

    // text runs up to the found match. store as text content.
    else if ( index_bx > bx)
    {
      const length = index_bx - bx;
      const itemText = text.substr(bx, length);
      const item: iElementContentItem = { contentType: 'text', index: bx, length, text: itemText };
      contentArr.push(item);
      bx += length;
    }
  }

  return { index:contentBx, length: bx - contentBx, contentArr, errmsg } ;
}

// ------------------------------ mustacheItem_parse ------------------------------
// parse the mustache item from start to end.
// return the full text of the mustached string, including the open and close
// mustache patterns.
function mustacheItem_parse( text:string, bx:number, startMustache:string )
{
  let errmsg : string | undefined;
  bx = bx + 2 ;
  let itemBx = 0 ;
  let itemLx = 0 ;
  let itemText: string | undefined ;
  const { index, text:foundText } = scan_unquotedPattern( text, bx, '}}');
  if ( index >= 0 )
  {
    itemBx = bx ;
    bx = index + foundText!.length ;
    itemLx = bx - itemBx ;
    itemText = text.substr(itemBx, itemLx ) ;
  }
  else
  {
    errmsg = `mustache started at position ${bx - 2} is not closed`;
  }

  return { index:itemBx, length:itemLx, text:itemText, errmsg } ;
}

// ------------------------------ htmlCloseTag_parse ------------------------------
function htmlCloseTag_parse( text:string, tag_bx:number )
{
  let closeTag : iElementCloseTag | undefined ;
  let bx = tag_bx ;
  let tagName = '' ;
  let errmsg : string | undefined;

  // start of close tag. 
  {
    const regex = /(<\/)(\s*)([\w-]*)(\s*>)/g;
    regex.lastIndex = bx;
    const match = regex.exec(text);
    if (!match || match.index != bx)
    {
      errmsg = `invalid closing tag at pos ${bx} ${string_substrLenient(text, bx, 20)}`;
    }
    else
    {
      const fullCloseTagText = match[0] ;
      const closeSymbol = match[1] ;
      const ws = match[2] ;
      tagName = match[3] || '';
      bx += match.length;
      closeTag = {index:bx, length: fullCloseTagText.length, tagName } ;
    }
  }

  return { errmsg, closeTag } ;
}

// ------------------------------ htmlOpenTag_parse ------------------------------
function htmlOpenTag_parse( text:string, bx:number )
{
  let tagName: string = '' ;
  let attrArr: iHtmlAttr[] = [];
  let tagEx: number | undefined ;
  let errmsg: string | undefined ;
  let elemClosed: boolean | undefined ;  // elem open ended with />.
  const tagBx = bx ;

  // start of open tag. 
  {
    const regex = /(<\/)|(<!*[\w-]+)/g;
    regex.lastIndex = bx ;
    const match = regex.exec(text);
    if (!match || match.index != bx )
    {
      errmsg = `invalid html open tag at pos ${bx} ${string_substrLenient(text,bx,20)}`;
    }
    else
    {
      const matchText = match[0] ;
      tagName = match[2] ? match[2].substr(1) : '' ;
      bx += matchText.length ;
    }
  }

  while( !errmsg )
  {
    // scan for end of open tag.  /> or >.
    {
      const regex = /(\s*)((\/>)|(>))/g ;
      regex.lastIndex = bx ;
      const match = regex.exec(text) ;
      if ( match && match.index == bx )
      {
        const matchText = match[0] ;
        const ws = match[1] || '' ;
        const closePattern = match[3] ;
        if ( closePattern )
          elemClosed = true ;
        const endText = match[3] || match[4] ;
        tagEx = bx + matchText.length - 1 ;
        break ;
      }
    }

    let attrFound = false ;
    let kwd:string | undefined ;
    let attrBx: number | undefined ;
    let equalOperator: string | undefined;
    let attr_length = 0 ;
    let rawVlu: string | undefined;
    let rawVluBx: number | undefined;

    // attribute name.
    {
      const regex = /(\s+)([@:\w][\w-\.\d]+)(=*)/g;
      regex.lastIndex = bx;
      const match = regex.exec(text);
      if (match && match.index == bx)
      {
        const ws = match[1];
        attrBx = match.index + ws.length;
        kwd = match[2];
        equalOperator = match[3];
        attr_length = kwd.length + equalOperator.length;
        attrFound = true;
        bx = attrBx + attr_length ;
      }
      else
      {
        errmsg = `invalid text in html open tag at position ${bx} ${string_substrLenient(text, bx, 20)}`;
      }
    }

    // scan for attribute value
    if ( !errmsg && equalOperator )
    {
      const regex = /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')/g;
      regex.lastIndex = bx;
      const match = regex.exec(text);
      if (match && match.index == bx)
      {
        const doubleRawVlu = match[1];   // value text includes enclosing quotes.
        const singleRawVlu = match[2];   // value text includes enclosing quotes.
        rawVlu = doubleRawVlu || singleRawVlu;
        rawVluBx = bx;
        bx += rawVlu.length ;
      }
      else
      {
        errmsg = `invalid attribute value at position ${bx} ${string_substrLenient(text, bx, 20)}`;
      }
    }

    if ( attrFound && !errmsg )
    {
      const vlu = rawVlu ? string_dequote(rawVlu) : '' ;
      const length = attr_length + ( rawVlu ? rawVlu.length : 0 );
      attrArr.push({ index: attrBx!, length, kwd: kwd!, rawVlu, rawVluBx, vlu });
    }
  }

  const length = errmsg ? 0 : tagEx! - tagBx + 1 ;
  return { tagName, length, attrArr, elemClosed, errmsg } ;
}

// ------------------------------- htmlComment_parse -------------------------------
function htmlComment_parse( text:string, bx:number)
{
  let errmsg: string | undefined;
  let commentTag: iHtmlCommentTag | undefined ;
  const comment_bx = bx ;
  let openIndex: number | undefined ;
  let closeIndex: number | undefined ;
  let textIndex: number | undefined ;

  // regex matchs html comment.
  const regex = /(\s*)(<!--)(\s*)([\s\S]*?)(-->)/g;
  regex.lastIndex = bx ;
  const match = regex.exec(text) ;

  if ( !match || match.index != bx )
  {
    errmsg = `invalid html comment at position ${bx} ${string_substrLenient(text,bx,20)}`;
  }
  else
  {
    const ws = match[1] ;
    openIndex = match.index + ws.length ;
    const openComment = match[2];
    const beforeWs = match[3] ;
    textIndex = openIndex + openComment.length + beforeWs.length ;
    const commentText = match[4];
    closeIndex = textIndex + commentText.length ;
    const endComment = match[5] ;

    const length = closeIndex - openIndex + 1 + endComment.length ;

    commentTag = {index:openIndex, length, text:commentText.trim(), textIndex, closeIndex };
  }

  return { errmsg, commentTag };
}

// ------------------------ elementContentArr_findElementDeep ------------------------
export function elementContentArr_findElementDeep(contentArr: iElementContentItem[], elemName: string)
{
  let foundArr: iHtmlElement[] = [];
  for (const item of contentArr)
  {
    if ( item.contentType == 'element')
    {
      const arr = htmlElement_findElementDeep( item.element!, elemName ) ;
      foundArr.push(...arr);
    }
  }
  return foundArr ;
}

// ------------------------ htmlElement_findElementDeep ------------------------
function htmlElement_findElementDeep( element: iHtmlElement, elemName:string )
{
  let foundArr: iHtmlElement[] = [] ;
  if ( element.elemName == elemName )
    foundArr.push(element) ;

  // look for elemName within the content of the element.     
  if ( element.contentArr )
  {
    const arr = elementContentArr_findElementDeep( element.contentArr, elemName ) ;
    foundArr.push( ...arr ) ;
  }

  return foundArr ;
}

// ------------------------------ htmlElement_getAttr ------------------------------
export function htmlElement_getAttr( element: iHtmlElement, attrName:string )
{
  let foundAttr: iHtmlAttr | undefined;
  if ( element.attrArr )
  {
    foundAttr = element.attrArr.find((item) =>
    {
      return item.kwd == attrName ;
    });
  }
  return foundAttr ;
}
