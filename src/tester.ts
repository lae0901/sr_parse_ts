import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { testResults_append, testResults_consoleLog, testResults_new } from 'sr_test_framework';
import { jsdoc_parseNext } from '.';
import { jsdoc_isolateNext } from './parse_jsdoc';

// run main function that is declared as async. 
async_main();

// ------------------------------- async_main ---------------------------------
async function async_main()
{
  const results = testResults_new();

  // jsdoc_parse_test
  {
    const {results:res } = await jsdoc_parse_test();
    results.push(...res);
  }

  testResults_consoleLog(results);
}


// -------------------------- jsdoc_parse_test ----------------
/** parse the first set of jsdoc comment lines in the input array of text lines.
 * xxxxxxx
 * @param lines array of text lines
 * @returns object containing initial jsdoc text and array of jsdoc tags
 */
export function jsdoc_parse_test()
{
  const results = testResults_new();

  // test the jsdoc_isolate function.
  {
    const textLine = `
/** parse the first set of jsdoc comment lines in the input array of text lines.
 * xxxxxxx
 * @param lines array of text lines
 * @returns object containing initial jsdoc text and array of jsdoc tags
 */` ;
    const text_arr = textLine.split('\n');
    const method = 'jsdoc_isolate';
    const expected = { startIx: 1, endIx: 5, numLines: 4 };
    const rv = jsdoc_isolateNext(text_arr);
    const actual = { startIx: rv.startIx, endIx: rv.endIx, numLines: rv.docLines.length };
    const desc = 'isolate jsdoc from array of text lines';
    testResults_append(results, { method, expected, actual, desc });
  }

  // jsdoc_parse function
  {
    const textLine = `
/** parse the first set of jsdoc comment lines in the input array of text lines.
 * xxxxxxx
 * @param lines array of text lines
 * @returns object containing initial jsdoc text and array of jsdoc tags
 */` ;
    const text_arr = textLine.split('\n');
    const method = 'jsdoc_parse';
    const initialText = `parse the first set of jsdoc comment lines in the input array of text lines.
xxxxxxx`
    const expected = { startIx: 1, endIx: 5, numTags: 2, initialText };
    const rv = jsdoc_parseNext(text_arr);
    const actual = {
      startIx: rv.startIx, endIx: rv.endIx,
      initialText: rv.initialText, numTags: rv.tag_arr.length
    };
    const desc = 'parse jsdoc from array of text lines';
    testResults_append(results, { method, expected, actual, desc });
  }

  // jsdoc_parse function
  {
    const textLine = `
/** 
 * @textDesc ** Bill Of Lading for Federated (Roadway)
 * @srcType  RPGLE
 * @param lines array of text lines
 * @srcmbr_fileName BillOfLading
 */` ;
    const text_arr = textLine.split('\n');
    const method = 'jsdoc_parse';
    const initialText = ``;
    const expected = { startIx: 1, endIx: 5, numTags: 2, initialText };
    const rv = jsdoc_parseNext(text_arr);
    const actual = {
      startIx: rv.startIx, endIx: rv.endIx,
      initialText: rv.initialText, numTags: rv.tag_arr.length
    };
    const desc = 'parse jsdoc from array of text lines';
    testResults_append(results, { method, expected, actual, desc });
  }

  return { results };
}




// // ---------------------------------- jsdoc_parse_test ----------------------------------
// async function jsdoc_parse_test()
// {
//   const results = testResults_new();

//   // jsdoc_parseNext .
//   {
//     const jsdoc_text = `/** 
//     * @srcmbr_fileName xxxx.sqli 
//     * @mbrName UTL7010 
//     * @srcType sqlprc 
//     * @textDesc select from webuser 
//     */`;
//     const lines = jsdoc_text.split(/\n|\r/) ;
//     const method = 'jsdoc_parseNext';
//     const parts = jsdoc_parseNext( lines ) ;

//     const expected = { isRepo: true, isBehind: false, isAhead: false, isModified: true };
//     const actual = expected ;
//     const desc = 'get git status';
//     testResults_append(results, { method, expected, actual, desc });
//   }


//   return results;
// }
