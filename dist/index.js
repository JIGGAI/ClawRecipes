"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/json5/lib/unicode.js
var require_unicode = __commonJS({
  "node_modules/json5/lib/unicode.js"(exports2, module2) {
    module2.exports.Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
    module2.exports.ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
    module2.exports.ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
  }
});

// node_modules/json5/lib/util.js
var require_util = __commonJS({
  "node_modules/json5/lib/util.js"(exports2, module2) {
    var unicode = require_unicode();
    module2.exports = {
      isSpaceSeparator(c) {
        return typeof c === "string" && unicode.Space_Separator.test(c);
      },
      isIdStartChar(c) {
        return typeof c === "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "$" || c === "_" || unicode.ID_Start.test(c));
      },
      isIdContinueChar(c) {
        return typeof c === "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c === "$" || c === "_" || c === "\u200C" || c === "\u200D" || unicode.ID_Continue.test(c));
      },
      isDigit(c) {
        return typeof c === "string" && /[0-9]/.test(c);
      },
      isHexDigit(c) {
        return typeof c === "string" && /[0-9A-Fa-f]/.test(c);
      }
    };
  }
});

// node_modules/json5/lib/parse.js
var require_parse = __commonJS({
  "node_modules/json5/lib/parse.js"(exports2, module2) {
    var util = require_util();
    var source;
    var parseState;
    var stack;
    var pos;
    var line;
    var column;
    var token;
    var key;
    var root;
    module2.exports = function parse(text, reviver) {
      source = String(text);
      parseState = "start";
      stack = [];
      pos = 0;
      line = 1;
      column = 0;
      token = void 0;
      key = void 0;
      root = void 0;
      do {
        token = lex();
        parseStates[parseState]();
      } while (token.type !== "eof");
      if (typeof reviver === "function") {
        return internalize({ "": root }, "", reviver);
      }
      return root;
    };
    function internalize(holder, name, reviver) {
      const value = holder[name];
      if (value != null && typeof value === "object") {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const key2 = String(i);
            const replacement = internalize(value, key2, reviver);
            if (replacement === void 0) {
              delete value[key2];
            } else {
              Object.defineProperty(value, key2, {
                value: replacement,
                writable: true,
                enumerable: true,
                configurable: true
              });
            }
          }
        } else {
          for (const key2 in value) {
            const replacement = internalize(value, key2, reviver);
            if (replacement === void 0) {
              delete value[key2];
            } else {
              Object.defineProperty(value, key2, {
                value: replacement,
                writable: true,
                enumerable: true,
                configurable: true
              });
            }
          }
        }
      }
      return reviver.call(holder, name, value);
    }
    var lexState;
    var buffer;
    var doubleQuote;
    var sign;
    var c;
    function lex() {
      lexState = "default";
      buffer = "";
      doubleQuote = false;
      sign = 1;
      for (; ; ) {
        c = peek();
        const token2 = lexStates[lexState]();
        if (token2) {
          return token2;
        }
      }
    }
    function peek() {
      if (source[pos]) {
        return String.fromCodePoint(source.codePointAt(pos));
      }
    }
    function read() {
      const c2 = peek();
      if (c2 === "\n") {
        line++;
        column = 0;
      } else if (c2) {
        column += c2.length;
      } else {
        column++;
      }
      if (c2) {
        pos += c2.length;
      }
      return c2;
    }
    var lexStates = {
      default() {
        switch (c) {
          case "	":
          case "\v":
          case "\f":
          case " ":
          case "\xA0":
          case "\uFEFF":
          case "\n":
          case "\r":
          case "\u2028":
          case "\u2029":
            read();
            return;
          case "/":
            read();
            lexState = "comment";
            return;
          case void 0:
            read();
            return newToken("eof");
        }
        if (util.isSpaceSeparator(c)) {
          read();
          return;
        }
        return lexStates[parseState]();
      },
      comment() {
        switch (c) {
          case "*":
            read();
            lexState = "multiLineComment";
            return;
          case "/":
            read();
            lexState = "singleLineComment";
            return;
        }
        throw invalidChar(read());
      },
      multiLineComment() {
        switch (c) {
          case "*":
            read();
            lexState = "multiLineCommentAsterisk";
            return;
          case void 0:
            throw invalidChar(read());
        }
        read();
      },
      multiLineCommentAsterisk() {
        switch (c) {
          case "*":
            read();
            return;
          case "/":
            read();
            lexState = "default";
            return;
          case void 0:
            throw invalidChar(read());
        }
        read();
        lexState = "multiLineComment";
      },
      singleLineComment() {
        switch (c) {
          case "\n":
          case "\r":
          case "\u2028":
          case "\u2029":
            read();
            lexState = "default";
            return;
          case void 0:
            read();
            return newToken("eof");
        }
        read();
      },
      value() {
        switch (c) {
          case "{":
          case "[":
            return newToken("punctuator", read());
          case "n":
            read();
            literal("ull");
            return newToken("null", null);
          case "t":
            read();
            literal("rue");
            return newToken("boolean", true);
          case "f":
            read();
            literal("alse");
            return newToken("boolean", false);
          case "-":
          case "+":
            if (read() === "-") {
              sign = -1;
            }
            lexState = "sign";
            return;
          case ".":
            buffer = read();
            lexState = "decimalPointLeading";
            return;
          case "0":
            buffer = read();
            lexState = "zero";
            return;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            buffer = read();
            lexState = "decimalInteger";
            return;
          case "I":
            read();
            literal("nfinity");
            return newToken("numeric", Infinity);
          case "N":
            read();
            literal("aN");
            return newToken("numeric", NaN);
          case '"':
          case "'":
            doubleQuote = read() === '"';
            buffer = "";
            lexState = "string";
            return;
        }
        throw invalidChar(read());
      },
      identifierNameStartEscape() {
        if (c !== "u") {
          throw invalidChar(read());
        }
        read();
        const u = unicodeEscape();
        switch (u) {
          case "$":
          case "_":
            break;
          default:
            if (!util.isIdStartChar(u)) {
              throw invalidIdentifier();
            }
            break;
        }
        buffer += u;
        lexState = "identifierName";
      },
      identifierName() {
        switch (c) {
          case "$":
          case "_":
          case "\u200C":
          case "\u200D":
            buffer += read();
            return;
          case "\\":
            read();
            lexState = "identifierNameEscape";
            return;
        }
        if (util.isIdContinueChar(c)) {
          buffer += read();
          return;
        }
        return newToken("identifier", buffer);
      },
      identifierNameEscape() {
        if (c !== "u") {
          throw invalidChar(read());
        }
        read();
        const u = unicodeEscape();
        switch (u) {
          case "$":
          case "_":
          case "\u200C":
          case "\u200D":
            break;
          default:
            if (!util.isIdContinueChar(u)) {
              throw invalidIdentifier();
            }
            break;
        }
        buffer += u;
        lexState = "identifierName";
      },
      sign() {
        switch (c) {
          case ".":
            buffer = read();
            lexState = "decimalPointLeading";
            return;
          case "0":
            buffer = read();
            lexState = "zero";
            return;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            buffer = read();
            lexState = "decimalInteger";
            return;
          case "I":
            read();
            literal("nfinity");
            return newToken("numeric", sign * Infinity);
          case "N":
            read();
            literal("aN");
            return newToken("numeric", NaN);
        }
        throw invalidChar(read());
      },
      zero() {
        switch (c) {
          case ".":
            buffer += read();
            lexState = "decimalPoint";
            return;
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
          case "x":
          case "X":
            buffer += read();
            lexState = "hexadecimal";
            return;
        }
        return newToken("numeric", sign * 0);
      },
      decimalInteger() {
        switch (c) {
          case ".":
            buffer += read();
            lexState = "decimalPoint";
            return;
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      decimalPointLeading() {
        if (util.isDigit(c)) {
          buffer += read();
          lexState = "decimalFraction";
          return;
        }
        throw invalidChar(read());
      },
      decimalPoint() {
        switch (c) {
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read();
          lexState = "decimalFraction";
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      decimalFraction() {
        switch (c) {
          case "e":
          case "E":
            buffer += read();
            lexState = "decimalExponent";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      decimalExponent() {
        switch (c) {
          case "+":
          case "-":
            buffer += read();
            lexState = "decimalExponentSign";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read();
          lexState = "decimalExponentInteger";
          return;
        }
        throw invalidChar(read());
      },
      decimalExponentSign() {
        if (util.isDigit(c)) {
          buffer += read();
          lexState = "decimalExponentInteger";
          return;
        }
        throw invalidChar(read());
      },
      decimalExponentInteger() {
        if (util.isDigit(c)) {
          buffer += read();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      hexadecimal() {
        if (util.isHexDigit(c)) {
          buffer += read();
          lexState = "hexadecimalInteger";
          return;
        }
        throw invalidChar(read());
      },
      hexadecimalInteger() {
        if (util.isHexDigit(c)) {
          buffer += read();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      string() {
        switch (c) {
          case "\\":
            read();
            buffer += escape();
            return;
          case '"':
            if (doubleQuote) {
              read();
              return newToken("string", buffer);
            }
            buffer += read();
            return;
          case "'":
            if (!doubleQuote) {
              read();
              return newToken("string", buffer);
            }
            buffer += read();
            return;
          case "\n":
          case "\r":
            throw invalidChar(read());
          case "\u2028":
          case "\u2029":
            separatorChar(c);
            break;
          case void 0:
            throw invalidChar(read());
        }
        buffer += read();
      },
      start() {
        switch (c) {
          case "{":
          case "[":
            return newToken("punctuator", read());
        }
        lexState = "value";
      },
      beforePropertyName() {
        switch (c) {
          case "$":
          case "_":
            buffer = read();
            lexState = "identifierName";
            return;
          case "\\":
            read();
            lexState = "identifierNameStartEscape";
            return;
          case "}":
            return newToken("punctuator", read());
          case '"':
          case "'":
            doubleQuote = read() === '"';
            lexState = "string";
            return;
        }
        if (util.isIdStartChar(c)) {
          buffer += read();
          lexState = "identifierName";
          return;
        }
        throw invalidChar(read());
      },
      afterPropertyName() {
        if (c === ":") {
          return newToken("punctuator", read());
        }
        throw invalidChar(read());
      },
      beforePropertyValue() {
        lexState = "value";
      },
      afterPropertyValue() {
        switch (c) {
          case ",":
          case "}":
            return newToken("punctuator", read());
        }
        throw invalidChar(read());
      },
      beforeArrayValue() {
        if (c === "]") {
          return newToken("punctuator", read());
        }
        lexState = "value";
      },
      afterArrayValue() {
        switch (c) {
          case ",":
          case "]":
            return newToken("punctuator", read());
        }
        throw invalidChar(read());
      },
      end() {
        throw invalidChar(read());
      }
    };
    function newToken(type, value) {
      return {
        type,
        value,
        line,
        column
      };
    }
    function literal(s) {
      for (const c2 of s) {
        const p = peek();
        if (p !== c2) {
          throw invalidChar(read());
        }
        read();
      }
    }
    function escape() {
      const c2 = peek();
      switch (c2) {
        case "b":
          read();
          return "\b";
        case "f":
          read();
          return "\f";
        case "n":
          read();
          return "\n";
        case "r":
          read();
          return "\r";
        case "t":
          read();
          return "	";
        case "v":
          read();
          return "\v";
        case "0":
          read();
          if (util.isDigit(peek())) {
            throw invalidChar(read());
          }
          return "\0";
        case "x":
          read();
          return hexEscape();
        case "u":
          read();
          return unicodeEscape();
        case "\n":
        case "\u2028":
        case "\u2029":
          read();
          return "";
        case "\r":
          read();
          if (peek() === "\n") {
            read();
          }
          return "";
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          throw invalidChar(read());
        case void 0:
          throw invalidChar(read());
      }
      return read();
    }
    function hexEscape() {
      let buffer2 = "";
      let c2 = peek();
      if (!util.isHexDigit(c2)) {
        throw invalidChar(read());
      }
      buffer2 += read();
      c2 = peek();
      if (!util.isHexDigit(c2)) {
        throw invalidChar(read());
      }
      buffer2 += read();
      return String.fromCodePoint(parseInt(buffer2, 16));
    }
    function unicodeEscape() {
      let buffer2 = "";
      let count = 4;
      while (count-- > 0) {
        const c2 = peek();
        if (!util.isHexDigit(c2)) {
          throw invalidChar(read());
        }
        buffer2 += read();
      }
      return String.fromCodePoint(parseInt(buffer2, 16));
    }
    var parseStates = {
      start() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        push();
      },
      beforePropertyName() {
        switch (token.type) {
          case "identifier":
          case "string":
            key = token.value;
            parseState = "afterPropertyName";
            return;
          case "punctuator":
            pop();
            return;
          case "eof":
            throw invalidEOF();
        }
      },
      afterPropertyName() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        parseState = "beforePropertyValue";
      },
      beforePropertyValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        push();
      },
      beforeArrayValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        if (token.type === "punctuator" && token.value === "]") {
          pop();
          return;
        }
        push();
      },
      afterPropertyValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        switch (token.value) {
          case ",":
            parseState = "beforePropertyName";
            return;
          case "}":
            pop();
        }
      },
      afterArrayValue() {
        if (token.type === "eof") {
          throw invalidEOF();
        }
        switch (token.value) {
          case ",":
            parseState = "beforeArrayValue";
            return;
          case "]":
            pop();
        }
      },
      end() {
      }
    };
    function push() {
      let value;
      switch (token.type) {
        case "punctuator":
          switch (token.value) {
            case "{":
              value = {};
              break;
            case "[":
              value = [];
              break;
          }
          break;
        case "null":
        case "boolean":
        case "numeric":
        case "string":
          value = token.value;
          break;
      }
      if (root === void 0) {
        root = value;
      } else {
        const parent = stack[stack.length - 1];
        if (Array.isArray(parent)) {
          parent.push(value);
        } else {
          Object.defineProperty(parent, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      if (value !== null && typeof value === "object") {
        stack.push(value);
        if (Array.isArray(value)) {
          parseState = "beforeArrayValue";
        } else {
          parseState = "beforePropertyName";
        }
      } else {
        const current = stack[stack.length - 1];
        if (current == null) {
          parseState = "end";
        } else if (Array.isArray(current)) {
          parseState = "afterArrayValue";
        } else {
          parseState = "afterPropertyValue";
        }
      }
    }
    function pop() {
      stack.pop();
      const current = stack[stack.length - 1];
      if (current == null) {
        parseState = "end";
      } else if (Array.isArray(current)) {
        parseState = "afterArrayValue";
      } else {
        parseState = "afterPropertyValue";
      }
    }
    function invalidChar(c2) {
      if (c2 === void 0) {
        return syntaxError(`JSON5: invalid end of input at ${line}:${column}`);
      }
      return syntaxError(`JSON5: invalid character '${formatChar(c2)}' at ${line}:${column}`);
    }
    function invalidEOF() {
      return syntaxError(`JSON5: invalid end of input at ${line}:${column}`);
    }
    function invalidIdentifier() {
      column -= 5;
      return syntaxError(`JSON5: invalid identifier character at ${line}:${column}`);
    }
    function separatorChar(c2) {
      console.warn(`JSON5: '${formatChar(c2)}' in strings is not valid ECMAScript; consider escaping`);
    }
    function formatChar(c2) {
      const replacements = {
        "'": "\\'",
        '"': '\\"',
        "\\": "\\\\",
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "	": "\\t",
        "\v": "\\v",
        "\0": "\\0",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
      };
      if (replacements[c2]) {
        return replacements[c2];
      }
      if (c2 < " ") {
        const hexString = c2.charCodeAt(0).toString(16);
        return "\\x" + ("00" + hexString).substring(hexString.length);
      }
      return c2;
    }
    function syntaxError(message) {
      const err = new SyntaxError(message);
      err.lineNumber = line;
      err.columnNumber = column;
      return err;
    }
  }
});

// node_modules/json5/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/json5/lib/stringify.js"(exports2, module2) {
    var util = require_util();
    module2.exports = function stringify(value, replacer, space) {
      const stack = [];
      let indent = "";
      let propertyList;
      let replacerFunc;
      let gap = "";
      let quote;
      if (replacer != null && typeof replacer === "object" && !Array.isArray(replacer)) {
        space = replacer.space;
        quote = replacer.quote;
        replacer = replacer.replacer;
      }
      if (typeof replacer === "function") {
        replacerFunc = replacer;
      } else if (Array.isArray(replacer)) {
        propertyList = [];
        for (const v of replacer) {
          let item;
          if (typeof v === "string") {
            item = v;
          } else if (typeof v === "number" || v instanceof String || v instanceof Number) {
            item = String(v);
          }
          if (item !== void 0 && propertyList.indexOf(item) < 0) {
            propertyList.push(item);
          }
        }
      }
      if (space instanceof Number) {
        space = Number(space);
      } else if (space instanceof String) {
        space = String(space);
      }
      if (typeof space === "number") {
        if (space > 0) {
          space = Math.min(10, Math.floor(space));
          gap = "          ".substr(0, space);
        }
      } else if (typeof space === "string") {
        gap = space.substr(0, 10);
      }
      return serializeProperty("", { "": value });
      function serializeProperty(key, holder) {
        let value2 = holder[key];
        if (value2 != null) {
          if (typeof value2.toJSON5 === "function") {
            value2 = value2.toJSON5(key);
          } else if (typeof value2.toJSON === "function") {
            value2 = value2.toJSON(key);
          }
        }
        if (replacerFunc) {
          value2 = replacerFunc.call(holder, key, value2);
        }
        if (value2 instanceof Number) {
          value2 = Number(value2);
        } else if (value2 instanceof String) {
          value2 = String(value2);
        } else if (value2 instanceof Boolean) {
          value2 = value2.valueOf();
        }
        switch (value2) {
          case null:
            return "null";
          case true:
            return "true";
          case false:
            return "false";
        }
        if (typeof value2 === "string") {
          return quoteString(value2, false);
        }
        if (typeof value2 === "number") {
          return String(value2);
        }
        if (typeof value2 === "object") {
          return Array.isArray(value2) ? serializeArray(value2) : serializeObject(value2);
        }
        return void 0;
      }
      function quoteString(value2) {
        const quotes = {
          "'": 0.1,
          '"': 0.2
        };
        const replacements = {
          "'": "\\'",
          '"': '\\"',
          "\\": "\\\\",
          "\b": "\\b",
          "\f": "\\f",
          "\n": "\\n",
          "\r": "\\r",
          "	": "\\t",
          "\v": "\\v",
          "\0": "\\0",
          "\u2028": "\\u2028",
          "\u2029": "\\u2029"
        };
        let product = "";
        for (let i = 0; i < value2.length; i++) {
          const c = value2[i];
          switch (c) {
            case "'":
            case '"':
              quotes[c]++;
              product += c;
              continue;
            case "\0":
              if (util.isDigit(value2[i + 1])) {
                product += "\\x00";
                continue;
              }
          }
          if (replacements[c]) {
            product += replacements[c];
            continue;
          }
          if (c < " ") {
            let hexString = c.charCodeAt(0).toString(16);
            product += "\\x" + ("00" + hexString).substring(hexString.length);
            continue;
          }
          product += c;
        }
        const quoteChar = quote || Object.keys(quotes).reduce((a, b) => quotes[a] < quotes[b] ? a : b);
        product = product.replace(new RegExp(quoteChar, "g"), replacements[quoteChar]);
        return quoteChar + product + quoteChar;
      }
      function serializeObject(value2) {
        if (stack.indexOf(value2) >= 0) {
          throw TypeError("Converting circular structure to JSON5");
        }
        stack.push(value2);
        let stepback = indent;
        indent = indent + gap;
        let keys = propertyList || Object.keys(value2);
        let partial = [];
        for (const key of keys) {
          const propertyString = serializeProperty(key, value2);
          if (propertyString !== void 0) {
            let member = serializeKey(key) + ":";
            if (gap !== "") {
              member += " ";
            }
            member += propertyString;
            partial.push(member);
          }
        }
        let final;
        if (partial.length === 0) {
          final = "{}";
        } else {
          let properties;
          if (gap === "") {
            properties = partial.join(",");
            final = "{" + properties + "}";
          } else {
            let separator = ",\n" + indent;
            properties = partial.join(separator);
            final = "{\n" + indent + properties + ",\n" + stepback + "}";
          }
        }
        stack.pop();
        indent = stepback;
        return final;
      }
      function serializeKey(key) {
        if (key.length === 0) {
          return quoteString(key, true);
        }
        const firstChar = String.fromCodePoint(key.codePointAt(0));
        if (!util.isIdStartChar(firstChar)) {
          return quoteString(key, true);
        }
        for (let i = firstChar.length; i < key.length; i++) {
          if (!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
            return quoteString(key, true);
          }
        }
        return key;
      }
      function serializeArray(value2) {
        if (stack.indexOf(value2) >= 0) {
          throw TypeError("Converting circular structure to JSON5");
        }
        stack.push(value2);
        let stepback = indent;
        indent = indent + gap;
        let partial = [];
        for (let i = 0; i < value2.length; i++) {
          const propertyString = serializeProperty(String(i), value2);
          partial.push(propertyString !== void 0 ? propertyString : "null");
        }
        let final;
        if (partial.length === 0) {
          final = "[]";
        } else {
          if (gap === "") {
            let properties = partial.join(",");
            final = "[" + properties + "]";
          } else {
            let separator = ",\n" + indent;
            let properties = partial.join(separator);
            final = "[\n" + indent + properties + ",\n" + stepback + "]";
          }
        }
        stack.pop();
        indent = stepback;
        return final;
      }
    };
  }
});

// node_modules/json5/lib/index.js
var require_lib = __commonJS({
  "node_modules/json5/lib/index.js"(exports2, module2) {
    var parse = require_parse();
    var stringify = require_stringify();
    var JSON52 = {
      parse,
      stringify
    };
    module2.exports = JSON52;
  }
});

// src/lib/config.ts
var config_exports = {};
__export(config_exports, {
  getRecipesConfig: () => getRecipesConfig
});
function extractPluginRecipesConfig(config) {
  return config?.plugins?.entries?.["recipes"]?.config ?? config?.plugins?.entries?.recipes?.config ?? {};
}
function getRecipesConfig(config) {
  const cfg = extractPluginRecipesConfig(config);
  return {
    workspaceRecipesDir: cfg.workspaceRecipesDir ?? DEFAULT_RECIPES_CONFIG.workspaceRecipesDir,
    workspaceAgentsDir: cfg.workspaceAgentsDir ?? DEFAULT_RECIPES_CONFIG.workspaceAgentsDir,
    workspaceSkillsDir: cfg.workspaceSkillsDir ?? DEFAULT_RECIPES_CONFIG.workspaceSkillsDir,
    workspaceTeamsDir: cfg.workspaceTeamsDir ?? DEFAULT_RECIPES_CONFIG.workspaceTeamsDir,
    autoInstallMissingSkills: cfg.autoInstallMissingSkills ?? DEFAULT_RECIPES_CONFIG.autoInstallMissingSkills,
    confirmAutoInstall: cfg.confirmAutoInstall ?? DEFAULT_RECIPES_CONFIG.confirmAutoInstall,
    cronInstallation: cfg.cronInstallation ?? DEFAULT_RECIPES_CONFIG.cronInstallation
  };
}
var DEFAULT_RECIPES_CONFIG;
var init_config = __esm({
  "src/lib/config.ts"() {
    "use strict";
    DEFAULT_RECIPES_CONFIG = {
      workspaceRecipesDir: "recipes",
      workspaceAgentsDir: "agents",
      workspaceSkillsDir: "skills",
      workspaceTeamsDir: "teams",
      autoInstallMissingSkills: false,
      confirmAutoInstall: true,
      cronInstallation: "prompt"
    };
  }
});

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports2) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports2.ALIAS = ALIAS;
    exports2.DOC = DOC;
    exports2.MAP = MAP;
    exports2.NODE_TYPE = NODE_TYPE;
    exports2.PAIR = PAIR;
    exports2.SCALAR = SCALAR;
    exports2.SEQ = SEQ;
    exports2.hasAnchor = hasAnchor;
    exports2.isAlias = isAlias;
    exports2.isCollection = isCollection;
    exports2.isDocument = isDocument;
    exports2.isMap = isMap;
    exports2.isNode = isNode;
    exports2.isPair = isPair;
    exports2.isScalar = isScalar;
    exports2.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path35) {
      const ctrl = callVisitor(key, node, visitor, path35);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path35, ctrl);
        return visit_(key, ctrl, visitor, path35);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path35 = Object.freeze(path35.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path35);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path35 = Object.freeze(path35.concat(node));
          const ck = visit_("key", node.key, visitor, path35);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path35);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path35) {
      const ctrl = await callVisitor(key, node, visitor, path35);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path35, ctrl);
        return visitAsync_(key, ctrl, visitor, path35);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path35 = Object.freeze(path35.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path35);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path35 = Object.freeze(path35.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path35);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path35);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path35) {
      if (typeof visitor === "function")
        return visitor(key, node, path35);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path35);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path35);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path35);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path35);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path35);
      return void 0;
    }
    function replaceNode(key, path35, node) {
      const parent = path35[path35.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports2.visit = visit;
    exports2.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports2.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports2.anchorIsValid = anchorIsValid;
    exports2.anchorNames = anchorNames;
    exports2.createNodeAnchors = createNodeAnchors;
    exports2.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports2) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports2.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports2.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports2) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports2.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports2.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports2.Scalar = Scalar;
    exports2.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports2.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path35, value) {
      let v = value;
      for (let i = path35.length - 1; i >= 0; --i) {
        const k = path35[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path35) => path35 == null || typeof path35 === "object" && !!path35[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path35, value) {
        if (isEmptyPath(path35))
          this.add(value);
        else {
          const [key, ...rest] = path35;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path35) {
        const [key, ...rest] = path35;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path35, keepScalar) {
        const [key, ...rest] = path35;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path35) {
        const [key, ...rest] = path35;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path35, value) {
        const [key, ...rest] = path35;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports2.Collection = Collection;
    exports2.collectionFromPath = collectionFromPath;
    exports2.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports2) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports2.indentComment = indentComment;
    exports2.lineComment = lineComment;
    exports2.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports2) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports2.FOLD_BLOCK = FOLD_BLOCK;
    exports2.FOLD_FLOW = FOLD_FLOW;
    exports2.FOLD_QUOTED = FOLD_QUOTED;
    exports2.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports2.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify2 = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports2.createStringifyContext = createStringifyContext;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify2();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports2.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports2) {
    "use strict";
    var node_process = require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports2.debug = debug;
    exports2.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      value = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
      if (identity.isSeq(value))
        for (const it of value.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(value))
        for (const it of value)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, value);
    }
    function mergeValue(ctx, map, value) {
      const source = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    exports2.addMergeToJSMap = addMergeToJSMap;
    exports2.isMergeKey = isMergeKey;
    exports2.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports2) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify2();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports2.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports2.Pair = Pair;
    exports2.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify2();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        if (i < items.length - 1)
          str += ",";
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        if (!reqNewline && (lines.length > linesAtValue || str.includes("\n")))
          reqNewline = true;
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports2.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports2) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports2.YAMLMap = YAMLMap;
    exports2.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports2.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports2.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports2.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports2) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports2.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports2.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports2.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports2) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports2.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports2) {
    "use strict";
    var node_buffer = require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports2.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports2.createPairs = createPairs;
    exports2.pairs = pairs;
    exports2.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports2.YAMLOMap = YAMLOMap;
    exports2.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports2.falseTag = falseTag;
    exports2.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intBin = intBin;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports2.YAMLSet = YAMLSet;
    exports2.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports2.floatTime = floatTime;
    exports2.intTime = intTime;
    exports2.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports2.coreKnownTags = coreKnownTags;
    exports2.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports2.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify2();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports2.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path35, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path35, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path35) {
        if (Collection.isEmptyPath(path35)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path35) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path35, keepScalar) {
        if (Collection.isEmptyPath(path35))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path35, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path35) {
        if (Collection.isEmptyPath(path35))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path35) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path35, value) {
        if (Collection.isEmptyPath(path35)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path35), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path35, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports2.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports2) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports2.YAMLError = YAMLError;
    exports2.YAMLParseError = YAMLParseError;
    exports2.YAMLWarning = YAMLWarning;
    exports2.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports2) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports2.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports2) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports2.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports2) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports2.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports2.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports2) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports2.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports2) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports2.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports2) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports2.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports2.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports2.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports2.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + match[1];
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = { x: 2, u: 4, U: 8 }[next];
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      if (isNaN(code)) {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
      return String.fromCodePoint(code);
    }
    exports2.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports2.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports2) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports2.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError);
          isSrcToken = false;
        }
      }
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports2.composeEmptyNode = composeEmptyNode;
    exports2.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports2) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports2.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          Array.prototype.push.apply(doc.errors, this.errors);
          Array.prototype.push.apply(doc.warnings, this.warnings);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports2.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports2) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports2.createScalarToken = createScalarToken;
    exports2.resolveAsScalar = resolveAsScalar;
    exports2.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports2) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports2) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path35) => {
      let item = cst;
      for (const [field, index] of path35) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path35) => {
      const parent = visit.itemAtPath(cst, path35.slice(0, -1));
      const field = path35[path35.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path35, item, visitor) {
      let ctrl = visitor(item, path35);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path35.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path35);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path35) : ctrl;
    }
    exports2.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports2) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports2.createScalarToken = cstScalar.createScalarToken;
    exports2.resolveAsScalar = cstScalar.resolveAsScalar;
    exports2.setScalarValue = cstScalar.setScalarValue;
    exports2.stringify = cstStringify.stringify;
    exports2.visit = cstVisit.visit;
    exports2.BOM = BOM;
    exports2.DOCUMENT = DOCUMENT;
    exports2.FLOW_END = FLOW_END;
    exports2.SCALAR = SCALAR;
    exports2.isCollection = isCollection;
    exports2.isScalar = isScalar;
    exports2.prettyToken = prettyToken;
    exports2.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports2) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return yield* this.parseBlockStart();
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        switch (this.charAt(0)) {
          case "!":
            return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          case "&":
            return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          case "-":
          // this is an error
          case "?":
          // this is an error outside flow collections
          case ":": {
            const inFlow = this.flowLevel > 0;
            const ch1 = this.charAt(1);
            if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
              if (!inFlow)
                this.indentNext = this.indentValue + 1;
              else if (this.flowKey)
                this.flowKey = false;
              return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
            }
          }
        }
        return 0;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports2.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports2) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports2.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                Array.prototype.push.apply(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              Array.prototype.push.apply(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  Array.prototype.push.apply(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs25 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs25, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs25);
              } else {
                Object.assign(it, { key: fs25, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  Array.prototype.push.apply(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs25 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs25, sep: [] });
              else if (it.sep)
                this.stack.push(fs25);
              else
                Object.assign(it, { key: fs25, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports2.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports2.parse = parse;
    exports2.parseAllDocuments = parseAllDocuments;
    exports2.parseDocument = parseDocument;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports2.Composer = composer.Composer;
    exports2.Document = Document.Document;
    exports2.Schema = Schema.Schema;
    exports2.YAMLError = errors.YAMLError;
    exports2.YAMLParseError = errors.YAMLParseError;
    exports2.YAMLWarning = errors.YAMLWarning;
    exports2.Alias = Alias.Alias;
    exports2.isAlias = identity.isAlias;
    exports2.isCollection = identity.isCollection;
    exports2.isDocument = identity.isDocument;
    exports2.isMap = identity.isMap;
    exports2.isNode = identity.isNode;
    exports2.isPair = identity.isPair;
    exports2.isScalar = identity.isScalar;
    exports2.isSeq = identity.isSeq;
    exports2.Pair = Pair.Pair;
    exports2.Scalar = Scalar.Scalar;
    exports2.YAMLMap = YAMLMap.YAMLMap;
    exports2.YAMLSeq = YAMLSeq.YAMLSeq;
    exports2.CST = cst;
    exports2.Lexer = lexer.Lexer;
    exports2.LineCounter = lineCounter.LineCounter;
    exports2.Parser = parser.Parser;
    exports2.parse = publicApi.parse;
    exports2.parseAllDocuments = publicApi.parseAllDocuments;
    exports2.parseDocument = publicApi.parseDocument;
    exports2.stringify = publicApi.stringify;
    exports2.visit = visit.visit;
    exports2.visitAsync = visit.visitAsync;
  }
});

// src/lib/recipe-frontmatter.ts
var recipe_frontmatter_exports = {};
__export(recipe_frontmatter_exports, {
  normalizeCronJobs: () => normalizeCronJobs,
  parseFrontmatter: () => parseFrontmatter
});
function parseFrontmatter(md) {
  if (!md.startsWith("---\n")) throw new Error("Recipe markdown must start with YAML frontmatter (---)");
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) throw new Error("Recipe frontmatter not terminated (---)");
  const yamlText = md.slice(4, end);
  const body = md.slice(end + 5);
  const frontmatter = import_yaml.default.parse(yamlText);
  if (!frontmatter?.id) throw new Error("Recipe frontmatter must include id");
  return { frontmatter, body };
}
function validateCronJobInput(j) {
  if (!j || typeof j !== "object") throw new Error("cronJobs entries must be objects");
  const id = String(j.id ?? "").trim();
  if (!id) throw new Error("cronJobs[].id is required");
  const schedule = String(j.schedule ?? "").trim();
  const message = String(j.message ?? j.task ?? j.prompt ?? "").trim();
  if (!schedule) throw new Error(`cronJobs[${id}].schedule is required`);
  if (!message) throw new Error(`cronJobs[${id}].message is required`);
}
function buildCronJobSpec(j, id) {
  return {
    id,
    schedule: String(j.schedule ?? "").trim(),
    message: String(j.message ?? j.task ?? j.prompt ?? "").trim(),
    name: j.name != null ? String(j.name) : void 0,
    description: j.description != null ? String(j.description) : void 0,
    timezone: j.timezone != null ? String(j.timezone) : void 0,
    channel: j.channel != null ? String(j.channel) : void 0,
    to: j.to != null ? String(j.to) : void 0,
    agentId: j.agentId != null ? String(j.agentId) : void 0,
    enabledByDefault: Boolean(j.enabledByDefault ?? false),
    delivery: j.delivery === "none" || j.delivery === "announce" ? j.delivery : void 0,
    timeoutSeconds: typeof j.timeoutSeconds === "number" && j.timeoutSeconds > 0 ? j.timeoutSeconds : void 0
  };
}
function normalizeOneCronJob(j, seen) {
  validateCronJobInput(j);
  const id = String(j.id ?? "").trim();
  if (seen.has(id)) throw new Error(`Duplicate cronJobs[].id: ${id}`);
  seen.add(id);
  return buildCronJobSpec(j, id);
}
function normalizeCronJobs(frontmatter) {
  const raw = frontmatter.cronJobs;
  if (!raw) return [];
  if (!Array.isArray(raw)) throw new Error("frontmatter.cronJobs must be an array");
  const seen = /* @__PURE__ */ new Set();
  return raw.map((j) => normalizeOneCronJob(j, seen));
}
var import_yaml;
var init_recipe_frontmatter = __esm({
  "src/lib/recipe-frontmatter.ts"() {
    "use strict";
    import_yaml = __toESM(require_dist());
  }
});

// src/lib/fs-utils.ts
async function fileExists(p) {
  try {
    await import_promises.default.stat(p);
    return true;
  } catch {
    return false;
  }
}
async function ensureDir(p) {
  await import_promises.default.mkdir(p, { recursive: true });
}
async function writeFileSafely(p, content, mode) {
  if (mode === "createOnly" && await fileExists(p)) return { wrote: false, reason: "exists" };
  await ensureDir(import_node_path.default.dirname(p));
  await import_promises.default.writeFile(p, content, "utf8");
  return { wrote: true, reason: "ok" };
}
var import_node_path, import_promises;
var init_fs_utils = __esm({
  "src/lib/fs-utils.ts"() {
    "use strict";
    import_node_path = __toESM(require("node:path"));
    import_promises = __toESM(require("node:fs/promises"));
  }
});

// src/lib/recipes.ts
var recipes_exports = {};
__export(recipes_exports, {
  listRecipeFiles: () => listRecipeFiles,
  loadRecipeById: () => loadRecipeById,
  workspacePath: () => workspacePath
});
function workspacePath(api, ...parts) {
  const root = api.config.agents?.defaults?.workspace;
  if (!root) throw new Error("agents.defaults.workspace is not set in config");
  return import_node_path2.default.join(root, ...parts);
}
async function listRecipeFiles(api, cfg) {
  const pluginRoot = api.rootDir ?? import_node_path2.default.resolve(__dirname, "..", "..");
  const builtinDir = import_node_path2.default.resolve(pluginRoot, "recipes", "default");
  const workspaceDir = workspacePath(api, cfg.workspaceRecipesDir);
  const out = [];
  if (await fileExists(builtinDir)) {
    const files = await import_promises2.default.readdir(builtinDir);
    for (const f of files) if (f.endsWith(".md")) out.push({ source: "builtin", path: import_node_path2.default.join(builtinDir, f) });
  }
  if (await fileExists(workspaceDir)) {
    const files = await import_promises2.default.readdir(workspaceDir);
    for (const f of files) if (f.endsWith(".md")) out.push({ source: "workspace", path: import_node_path2.default.join(workspaceDir, f) });
  }
  return out;
}
async function loadRecipeById(api, recipeId) {
  const cfg = getRecipesConfig(api.config);
  const files = await listRecipeFiles(api, cfg);
  for (const f of files) {
    const md = await import_promises2.default.readFile(f.path, "utf8");
    const { frontmatter } = parseFrontmatter(md);
    if (frontmatter.id === recipeId) return { file: f, md, ...parseFrontmatter(md) };
  }
  throw new Error("Recipe not found: " + recipeId);
}
var import_node_path2, import_promises2;
var init_recipes = __esm({
  "src/lib/recipes.ts"() {
    "use strict";
    import_node_path2 = __toESM(require("node:path"));
    import_promises2 = __toESM(require("node:fs/promises"));
    init_recipe_frontmatter();
    init_fs_utils();
    init_config();
  }
});

// src/marketplaceFetch.ts
var marketplaceFetch_exports = {};
__export(marketplaceFetch_exports, {
  fetchMarketplaceRecipeMarkdown: () => fetchMarketplaceRecipeMarkdown
});
async function fetchMarketplaceRecipeMarkdown(params) {
  const base = String(params.registryBase ?? "").replace(/\/+$/, "");
  const s = String(params.slug ?? "").trim();
  if (!s) throw new Error("slug is required");
  const metaUrl = `${base}/api/marketplace/recipes/${encodeURIComponent(s)}`;
  const metaRes = await fetch(metaUrl);
  if (!metaRes.ok) {
    const hint = `Recipe not found: ${s}. Did you mean:
- openclaw recipes install ${s}   # marketplace recipe
- openclaw recipes install-skill ${s}   # ClawHub skill`;
    throw new Error(`Registry lookup failed (${metaRes.status}): ${metaUrl}

${hint}`);
  }
  const metaData = await metaRes.json();
  const recipe = metaData?.recipe;
  const sourceUrl = String(recipe?.sourceUrl ?? "").trim();
  if (!metaData?.ok || !sourceUrl) {
    throw new Error(`Registry response missing recipe.sourceUrl for ${s}`);
  }
  const mdRes = await fetch(sourceUrl);
  if (!mdRes.ok) throw new Error(`Failed downloading recipe markdown (${mdRes.status}): ${sourceUrl}`);
  const md = await mdRes.text();
  return { md, metaUrl, sourceUrl };
}
var init_marketplaceFetch = __esm({
  "src/marketplaceFetch.ts"() {
    "use strict";
  }
});

// src/lib/kitchen-manifest.ts
var kitchen_manifest_exports = {};
__export(kitchen_manifest_exports, {
  defaultManifestPath: () => defaultManifestPath,
  generateKitchenManifest: () => generateKitchenManifest,
  scheduleManifestRegeneration: () => scheduleManifestRegeneration
});
function defaultManifestPath() {
  return import_node_path10.default.join(OPENCLAW_DIR, MANIFEST_FILENAME);
}
async function countMdFiles(dir) {
  try {
    const entries = await import_promises7.default.readdir(dir);
    return entries.filter((e) => e.endsWith(".md")).length;
  } catch {
    return 0;
  }
}
async function countActiveRuns(teamDir) {
  const runsDir = import_node_path10.default.join(teamDir, "shared-context", "workflow-runs");
  let runDirs;
  try {
    runDirs = await import_promises7.default.readdir(runsDir);
  } catch {
    return 0;
  }
  let count = 0;
  for (const d of runDirs) {
    const runJson = import_node_path10.default.join(runsDir, d, "run.json");
    try {
      const raw = await import_promises7.default.readFile(runJson, "utf8");
      const run = JSON.parse(raw);
      const s = run.status ?? "";
      if (s === "running" || s === "waiting_workers" || s === "waiting_for_approval") {
        count++;
      }
    } catch {
    }
  }
  return count;
}
async function listRoles(teamDir) {
  const rolesDir = import_node_path10.default.join(teamDir, "roles");
  try {
    const entries = await import_promises7.default.readdir(rolesDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}
async function readTeamDisplayName(teamDir) {
  const teamJsonPath = import_node_path10.default.join(teamDir, "shared-context", "workflows", "team.json");
  try {
    const raw = await import_promises7.default.readFile(teamJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed.recipeName?.trim() || null;
  } catch {
    return null;
  }
}
async function generateKitchenManifest(opts) {
  const { api } = opts;
  const outputPath = opts.outputPath ?? defaultManifestPath();
  let dirEntries;
  try {
    dirEntries = await import_promises7.default.readdir(OPENCLAW_DIR);
  } catch {
    dirEntries = [];
  }
  const teamDirNames = dirEntries.filter((e) => e.startsWith("workspace-"));
  const teams = {};
  for (const dirName of teamDirNames) {
    const teamId = dirName.slice("workspace-".length);
    if (!teamId) continue;
    const teamDir = import_node_path10.default.join(OPENCLAW_DIR, dirName);
    const workDir = import_node_path10.default.join(teamDir, "work");
    const [backlog, inProgress, testing, done, activeRunCount, roles, displayName] = await Promise.all([
      countMdFiles(import_node_path10.default.join(workDir, "backlog")),
      countMdFiles(import_node_path10.default.join(workDir, "in-progress")),
      countMdFiles(import_node_path10.default.join(workDir, "testing")),
      countMdFiles(import_node_path10.default.join(workDir, "done")),
      countActiveRuns(teamDir),
      listRoles(teamDir),
      readTeamDisplayName(teamDir)
    ]);
    teams[teamId] = {
      teamId,
      displayName,
      roles,
      ticketCounts: {
        backlog,
        "in-progress": inProgress,
        testing,
        done,
        total: backlog + inProgress + testing + done
      },
      activeRunCount
    };
  }
  let agents = [];
  try {
    const list = api.config.agents?.list;
    if (Array.isArray(list)) {
      agents = list.map((a) => ({
        id: String(a.id ?? ""),
        identityName: typeof a.identity?.name === "string" ? a.identity.name : void 0,
        workspace: typeof a.workspace === "string" ? a.workspace : void 0,
        model: typeof a.model === "string" ? a.model : void 0,
        isDefault: a.default === true
      })).filter((a) => a.id);
    }
  } catch {
  }
  const recipes = [];
  try {
    const { listRecipeFiles: listRecipeFiles2 } = await Promise.resolve().then(() => (init_recipes(), recipes_exports));
    const { getRecipesConfig: getRecipesConfig2 } = await Promise.resolve().then(() => (init_config(), config_exports));
    const { parseFrontmatter: parseFrontmatter2 } = await Promise.resolve().then(() => (init_recipe_frontmatter(), recipe_frontmatter_exports));
    const cfg = getRecipesConfig2(api.config);
    const files = await listRecipeFiles2(api, cfg);
    for (const f of files) {
      const md = await import_promises7.default.readFile(f.path, "utf8");
      const { frontmatter } = parseFrontmatter2(md);
      if (frontmatter.id && frontmatter.name) {
        recipes.push({
          id: frontmatter.id,
          name: frontmatter.name,
          kind: frontmatter.kind === "team" ? "team" : "agent",
          source: f.source
        });
      }
    }
  } catch {
  }
  const manifest = {
    version: 1,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    teams,
    agents,
    recipes
  };
  const tmpPath = outputPath + ".tmp";
  await import_promises7.default.mkdir(import_node_path10.default.dirname(outputPath), { recursive: true });
  await import_promises7.default.writeFile(tmpPath, JSON.stringify(manifest, null, 2), "utf8");
  await import_promises7.default.rename(tmpPath, outputPath);
  return manifest;
}
function scheduleManifestRegeneration(api) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    generateKitchenManifest({ api }).catch((err) => {
      console.error("[kitchen-manifest] regeneration failed:", err instanceof Error ? err.message : String(err));
    });
  }, DEBOUNCE_MS);
}
var import_promises7, import_node_os2, import_node_path10, OPENCLAW_DIR, MANIFEST_FILENAME, debounceTimer, DEBOUNCE_MS;
var init_kitchen_manifest = __esm({
  "src/lib/kitchen-manifest.ts"() {
    "use strict";
    import_promises7 = __toESM(require("node:fs/promises"));
    import_node_os2 = __toESM(require("node:os"));
    import_node_path10 = __toESM(require("node:path"));
    OPENCLAW_DIR = import_node_path10.default.join(import_node_os2.default.homedir(), ".openclaw");
    MANIFEST_FILENAME = "kitchen-manifest.json";
    debounceTimer = null;
    DEBOUNCE_MS = 500;
  }
});

// index.ts
var index_exports = {};
__export(index_exports, {
  __internal: () => __internal,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_node_path28 = __toESM(require("node:path"));
var import_promises22 = __toESM(require("node:fs/promises"));
var import_json5 = __toESM(require_lib());

// src/lib/agent-config.ts
function upsertAgentInConfig(cfgObj, snippet) {
  if (!cfgObj.agents) cfgObj.agents = {};
  if (!Array.isArray(cfgObj.agents.list)) cfgObj.agents.list = [];
  const list = cfgObj.agents.list;
  const idx = list.findIndex((a) => a?.id === snippet.id);
  const prev = idx >= 0 ? list[idx] : {};
  const prevTools = (() => {
    const v = prev?.tools;
    if (!v || typeof v !== "object") return void 0;
    const t = v;
    return {
      profile: typeof t.profile === "string" ? t.profile : void 0,
      allow: Array.isArray(t.allow) ? t.allow : void 0,
      deny: Array.isArray(t.deny) ? t.deny : void 0
    };
  })();
  const nextTools = snippet.tools === void 0 ? prevTools : {
    ...prevTools ?? {},
    ...snippet.tools ?? {},
    ...Object.prototype.hasOwnProperty.call(snippet.tools, "profile") ? { profile: snippet.tools.profile } : {},
    ...Object.prototype.hasOwnProperty.call(snippet.tools, "allow") ? { allow: snippet.tools.allow } : {},
    ...Object.prototype.hasOwnProperty.call(snippet.tools, "deny") ? { deny: snippet.tools.deny } : {}
  };
  const nextAgent = {
    ...prev,
    id: snippet.id,
    workspace: snippet.workspace,
    identity: {
      ...prev?.identity ?? {},
      ...snippet.identity ?? {}
    },
    tools: nextTools
  };
  if (idx >= 0) {
    list[idx] = nextAgent;
    return;
  }
  list.push(nextAgent);
}

// src/lib/stable-stringify.ts
function stableStringify(x) {
  const seen = /* @__PURE__ */ new WeakSet();
  const sortObj = (v) => {
    if (v !== null && typeof v === "object") {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
      if (Array.isArray(v)) return v.map(sortObj);
      const out = {};
      for (const k of Object.keys(v).sort()) {
        out[k] = sortObj(v[k]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(sortObj(x));
}

// src/lib/recipes-config.ts
async function loadOpenClawConfig(api) {
  const runtime = api.runtime;
  const snapshot = runtime.config?.current?.();
  if (!snapshot) throw new Error("Failed to load config via api.runtime.config.current()");
  return JSON.parse(JSON.stringify(snapshot));
}
async function writeOpenClawConfig(api, cfgObj) {
  const runtime = api.runtime;
  await runtime.config?.replaceConfigFile?.({
    nextConfig: cfgObj,
    afterWrite: { mode: "auto" }
  });
}
function getWorkspaceRoot(cfgObj, api) {
  return cfgObj.agents?.defaults?.workspace ?? api.config.agents?.defaults?.workspace ?? "~/.openclaw/workspace";
}
function buildMainAgentEntry(prevMain, workspaceRoot) {
  return {
    ...prevMain,
    id: "main",
    default: true,
    workspace: prevMain?.workspace ?? workspaceRoot,
    sandbox: prevMain?.sandbox ?? { mode: "off" }
  };
}
function ensureMainFirstInAgentsList(cfgObj, api) {
  if (!cfgObj.agents) cfgObj.agents = {};
  if (!Array.isArray(cfgObj.agents.list)) cfgObj.agents.list = [];
  const list = cfgObj.agents.list;
  const workspaceRoot = getWorkspaceRoot(cfgObj, api);
  const idx = list.findIndex((a) => a?.id === "main");
  const prevMain = idx >= 0 ? list[idx] ?? {} : {};
  const main = buildMainAgentEntry(prevMain, workspaceRoot);
  for (const a of list) {
    if (a?.id !== "main" && a?.default) a.default = false;
  }
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(main);
}
function upsertBindingInConfig(cfgObj, binding) {
  if (!Array.isArray(cfgObj.bindings)) cfgObj.bindings = [];
  const list = cfgObj.bindings;
  const sig = stableStringify({ agentId: binding.agentId, match: binding.match });
  const idx = list.findIndex((b) => stableStringify({ agentId: b?.agentId, match: b?.match }) === sig);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...binding };
    return { changed: false, note: "already-present" };
  }
  if (binding.match?.peer) list.unshift(binding);
  else list.push(binding);
  return { changed: true, note: "added" };
}
function removeBindingsInConfig(cfgObj, opts) {
  if (!Array.isArray(cfgObj.bindings)) cfgObj.bindings = [];
  const list = cfgObj.bindings;
  const targetMatchSig = stableStringify(opts.match);
  const before = list.length;
  const kept = [];
  const removed = [];
  for (const b of list) {
    const sameAgent = opts.agentId ? String(b?.agentId ?? "") === opts.agentId : true;
    const sameMatch = stableStringify(b?.match ?? {}) === targetMatchSig;
    if (sameAgent && sameMatch) removed.push(b);
    else kept.push(b);
  }
  cfgObj.bindings = kept;
  return { removedCount: before - kept.length, removed };
}
async function applyAgentSnippetsToOpenClawConfig(api, snippets) {
  const cfgObj = await loadOpenClawConfig(api);
  ensureMainFirstInAgentsList(cfgObj, api);
  for (const s of snippets) upsertAgentInConfig(cfgObj, s);
  ensureMainFirstInAgentsList(cfgObj, api);
  await writeOpenClawConfig(api, cfgObj);
  return { updatedAgents: snippets.map((s) => s.id) };
}
async function applyBindingSnippetsToOpenClawConfig(api, snippets) {
  const cfgObj = await loadOpenClawConfig(api);
  const results = [];
  for (const s of snippets) {
    results.push({ ...s, result: upsertBindingInConfig(cfgObj, s) });
  }
  await writeOpenClawConfig(api, cfgObj);
  return { updatedBindings: results };
}

// src/lib/prompt.ts
async function promptYesNo(header) {
  if (!process.stdin.isTTY) return false;
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(header + "\nProceed? (y/N) ");
    return ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}
async function promptConfirmWithPlan(plan, question, options) {
  if (options.yes && process.stdin.isTTY) return true;
  if (options.yes && !process.stdin.isTTY) return true;
  if (!process.stdin.isTTY) return false;
  console.log(JSON.stringify({ plan }, null, 2));
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(question + " ");
    return ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

// src/handlers/recipes.ts
var import_node_path6 = __toESM(require("node:path"));
var import_promises4 = __toESM(require("node:fs/promises"));
init_config();
init_recipes();
init_recipe_frontmatter();

// src/lib/skill-install.ts
var import_node_path3 = __toESM(require("node:path"));
init_fs_utils();
function skillInstallCommands(cfg, skills) {
  const lines = [
    `cd "${"$WORKSPACE"}"  # set WORKSPACE=~/.openclaw/workspace`,
    ...skills.map((s) => `npx clawhub@latest install ${s}`)
  ];
  return lines;
}
async function detectMissingSkills(installDir, skills) {
  const missing = [];
  for (const s of skills) {
    const p = import_node_path3.default.join(installDir, s);
    if (!await fileExists(p)) missing.push(s);
  }
  return missing;
}

// src/lib/workspace.ts
var import_node_os = __toESM(require("node:os"));
var import_node_path5 = __toESM(require("node:path"));
init_fs_utils();

// src/lib/lanes.ts
var import_promises3 = __toESM(require("node:fs/promises"));
var import_node_path4 = __toESM(require("node:path"));
init_fs_utils();
var RecipesCliError = class extends Error {
  code;
  command;
  missingPath;
  suggestedFix;
  constructor(opts) {
    super(opts.message);
    this.name = "RecipesCliError";
    this.code = opts.code;
    this.command = opts.command;
    this.missingPath = opts.missingPath;
    this.suggestedFix = opts.suggestedFix;
  }
};
function ticketStageDir(teamDir, stage) {
  return stage === "assignments" ? import_node_path4.default.join(teamDir, "work", "assignments") : import_node_path4.default.join(teamDir, "work", stage);
}
async function ensureLaneDir(opts) {
  const laneDir2 = import_node_path4.default.join(opts.teamDir, "work", opts.lane);
  const existed = await fileExists(laneDir2);
  if (!existed) {
    try {
      await import_promises3.default.mkdir(laneDir2, { recursive: true });
    } catch (e) {
      throw new RecipesCliError({
        code: "LANE_DIR_CREATE_FAILED",
        command: opts.command,
        missingPath: laneDir2,
        suggestedFix: `mkdir -p ${import_node_path4.default.join("work", opts.lane)}`,
        message: `Failed to create required lane directory: ${laneDir2}` + (opts.command ? ` (command: ${opts.command})` : "") + (e instanceof Error ? `
Underlying error: ${e.message}` : "")
      });
    }
    if (!opts.quiet) {
      const rel = import_node_path4.default.join("work", opts.lane);
      console.error(`[recipes] migration: created ${rel}/ (older workspace missing this lane)`);
    }
  }
  return { path: laneDir2, created: !existed };
}

// src/lib/workspace.ts
function resolveWorkspaceRoot(api) {
  const root = api.config.agents?.defaults?.workspace;
  if (root) return root;
  const envRoot = process.env.OPENCLAW_WORKSPACE;
  if (envRoot) return envRoot;
  return import_node_path5.default.join(import_node_os.default.homedir(), ".openclaw", "workspace");
}
function resolveCanonicalWorkspaceRoot(api) {
  const candidate = api.config.agents?.defaults?.workspace;
  if (candidate) {
    const abs = import_node_path5.default.resolve(candidate);
    const parts = abs.split(import_node_path5.default.sep).filter(Boolean);
    const idx = [...parts].reverse().findIndex((p) => p.startsWith("workspace-"));
    if (idx >= 0) {
      const segIdx = parts.length - 1 - idx;
      const teamDir = import_node_path5.default.isAbsolute(abs) ? import_node_path5.default.sep + import_node_path5.default.join(...parts.slice(0, segIdx + 1)) : import_node_path5.default.join(...parts.slice(0, segIdx + 1));
      return import_node_path5.default.resolve(teamDir, "..", "workspace");
    }
  }
  return resolveWorkspaceRoot(api);
}
function tryResolveTeamDirFromAnyDir(dir, teamId) {
  const seg = `workspace-${teamId}`;
  const abs = import_node_path5.default.resolve(dir);
  const parts = abs.split(import_node_path5.default.sep).filter(Boolean);
  const idx = parts.lastIndexOf(seg);
  if (idx >= 0) {
    const prefix = parts.slice(0, idx + 1);
    return import_node_path5.default.isAbsolute(abs) ? import_node_path5.default.sep + import_node_path5.default.join(...prefix) : import_node_path5.default.join(...prefix);
  }
  return void 0;
}
function resolveTeamDir(api, teamId) {
  const envTeamDir = process.env.OPENCLAW_TEAM_DIR;
  if (envTeamDir) return import_node_path5.default.resolve(envTeamDir);
  const agentWorkspace = api.config.agents?.defaults?.workspace;
  if (agentWorkspace) {
    const resolved = tryResolveTeamDirFromAnyDir(agentWorkspace, teamId);
    if (resolved) return resolved;
  }
  const cwdResolved = tryResolveTeamDirFromAnyDir(process.cwd(), teamId);
  if (cwdResolved) return cwdResolved;
  const workspaceRoot = resolveWorkspaceRoot(api);
  return import_node_path5.default.resolve(workspaceRoot, "..", "workspace-" + teamId);
}
async function ensureTicketStageDirs(teamDir) {
  await Promise.all([
    ensureDir(import_node_path5.default.join(teamDir, "work")),
    ensureDir(ticketStageDir(teamDir, "backlog")),
    ensureDir(ticketStageDir(teamDir, "in-progress")),
    ensureDir(ticketStageDir(teamDir, "testing")),
    ensureDir(ticketStageDir(teamDir, "done")),
    ensureDir(ticketStageDir(teamDir, "assignments"))
  ]);
}
async function resolveTeamContext(api, teamId) {
  const teamDir = resolveTeamDir(api, teamId);
  const workspaceRoot = import_node_path5.default.resolve(teamDir, "..", "workspace");
  await ensureTicketStageDirs(teamDir);
  return { workspaceRoot, teamDir };
}

// src/handlers/recipes.ts
async function handleRecipesList(api) {
  const cfg = getRecipesConfig(api.config);
  const files = await listRecipeFiles(api, cfg);
  const rows = [];
  for (const f of files) {
    try {
      const md = await import_promises4.default.readFile(f.path, "utf8");
      const { frontmatter } = parseFrontmatter(md);
      rows.push({ id: frontmatter.id, name: frontmatter.name, kind: frontmatter.kind, source: f.source });
    } catch (e) {
      rows.push({
        id: import_node_path6.default.basename(f.path),
        name: `INVALID: ${e.message}`,
        kind: "invalid",
        source: f.source
      });
    }
  }
  return rows;
}
async function handleRecipesShow(api, id) {
  const r = await loadRecipeById(api, id);
  return r.md;
}
async function handleRecipesStatus(api, id) {
  const cfg = getRecipesConfig(api.config);
  const files = await listRecipeFiles(api, cfg);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const installDir = import_node_path6.default.join(workspaceRoot, cfg.workspaceSkillsDir);
  const out = [];
  for (const f of files) {
    const md = await import_promises4.default.readFile(f.path, "utf8");
    const { frontmatter } = parseFrontmatter(md);
    if (id && frontmatter.id !== id) continue;
    const req = frontmatter.requiredSkills ?? [];
    const missing = await detectMissingSkills(installDir, req);
    out.push({
      id: frontmatter.id,
      requiredSkills: req,
      missingSkills: missing,
      installCommands: missing.length ? skillInstallCommands(cfg, missing) : []
    });
  }
  return out;
}
async function handleRecipesBind(api, opts) {
  if (!opts.match?.channel) throw new Error("match.channel is required");
  return applyBindingSnippetsToOpenClawConfig(api, [{ agentId: opts.agentId, match: opts.match }]);
}
async function handleRecipesUnbind(api, opts) {
  if (!opts.match?.channel) throw new Error("match.channel is required");
  const cfgObj = await loadOpenClawConfig(api);
  const res = removeBindingsInConfig(cfgObj, { agentId: opts.agentId, match: opts.match });
  await writeOpenClawConfig(api, cfgObj);
  return res;
}
async function handleRecipesBindings(api) {
  const cfgObj = await loadOpenClawConfig(api);
  const bindings = cfgObj.bindings;
  return Array.isArray(bindings) ? bindings : [];
}

// src/handlers/install.ts
var import_node_path7 = __toESM(require("node:path"));
init_config();
init_fs_utils();
init_recipes();
function resolveInstallScope(options) {
  const scopeFlags = [
    options.global ? "global" : null,
    options.agentId ? "agent" : null,
    options.teamId ? "team" : null
  ].filter(Boolean);
  if (scopeFlags.length > 1) {
    throw new Error("Use only one of: --global, --agent-id, --team-id");
  }
  return {
    scope: scopeFlags[0] ?? "global",
    agentIdOpt: typeof options.agentId === "string" ? options.agentId.trim() : "",
    teamIdOpt: typeof options.teamId === "string" ? options.teamId.trim() : ""
  };
}
function resolveInstallDir(stateDir, cfg, scope, agentIdOpt, teamIdOpt) {
  if (scope === "agent") {
    if (!agentIdOpt) throw new Error("--agent-id cannot be empty");
    const agentWorkspace = import_node_path7.default.resolve(stateDir, `workspace-${agentIdOpt}`);
    return {
      workdir: agentWorkspace,
      dirName: cfg.workspaceSkillsDir,
      installDir: import_node_path7.default.join(agentWorkspace, cfg.workspaceSkillsDir)
    };
  }
  if (scope === "team") {
    if (!teamIdOpt) throw new Error("--team-id cannot be empty");
    const teamWorkspace = import_node_path7.default.resolve(stateDir, `workspace-${teamIdOpt}`);
    return {
      workdir: teamWorkspace,
      dirName: cfg.workspaceSkillsDir,
      installDir: import_node_path7.default.join(teamWorkspace, cfg.workspaceSkillsDir)
    };
  }
  return {
    workdir: stateDir,
    dirName: "skills",
    installDir: import_node_path7.default.join(stateDir, "skills")
  };
}
async function handleInstallSkill(api, options) {
  const cfg = getRecipesConfig(api.config);
  let recipe = null;
  try {
    const loaded = await loadRecipeById(api, options.idOrSlug);
    recipe = loaded.frontmatter;
  } catch {
    recipe = null;
  }
  const baseWorkspace = resolveWorkspaceRoot(api);
  const stateDir = import_node_path7.default.resolve(baseWorkspace, "..");
  const { scope, agentIdOpt, teamIdOpt } = resolveInstallScope(options);
  const { workdir, dirName, installDir } = resolveInstallDir(stateDir, cfg, scope, agentIdOpt, teamIdOpt);
  await ensureDir(installDir);
  const skillsToInstall = recipe ? Array.from(/* @__PURE__ */ new Set([...recipe.requiredSkills ?? [], ...recipe.optionalSkills ?? []])).filter(Boolean) : [options.idOrSlug];
  if (!skillsToInstall.length) {
    return { ok: true, installed: [], note: "Nothing to install." };
  }
  const missing = await detectMissingSkills(installDir, skillsToInstall);
  const already = skillsToInstall.filter((s) => !missing.includes(s));
  if (!missing.length) {
    return { ok: true, installed: [], alreadyInstalled: already };
  }
  const requireConfirm = !options.yes;
  if (requireConfirm && !process.stdin.isTTY) {
    return { ok: false, aborted: "non-interactive" };
  }
  if (requireConfirm && process.stdin.isTTY) {
    const targetLabel = scope === "agent" ? `agent:${agentIdOpt}` : scope === "team" ? `team:${teamIdOpt}` : "global";
    const header = recipe ? `Install skills for recipe ${recipe.id} into ${installDir} (${targetLabel})?
- ${missing.join("\n- ")}` : `Install skill into ${installDir} (${targetLabel})?
- ${missing.join("\n- ")}`;
    const ok = await promptYesNo(header);
    if (!ok) return { ok: false, aborted: "user-declined" };
  }
  const installCommands = missing.map(
    (slug) => `npx clawhub@latest --workdir ${JSON.stringify(workdir)} --dir ${JSON.stringify(dirName)} install ${JSON.stringify(slug)}`
  );
  return {
    ok: false,
    needCli: true,
    missing,
    workdir,
    dirName,
    installDir,
    installCommands
  };
}
async function handleInstallMarketplaceRecipe(api, options) {
  const cfg = getRecipesConfig(api.config);
  const baseWorkspace = resolveWorkspaceRoot(api);
  const { fetchMarketplaceRecipeMarkdown: fetchMarketplaceRecipeMarkdown2 } = await Promise.resolve().then(() => (init_marketplaceFetch(), marketplaceFetch_exports));
  const { md, metaUrl, sourceUrl } = await fetchMarketplaceRecipeMarkdown2({
    registryBase: options.registryBase,
    slug: options.slug
  });
  const s = String(options.slug ?? "").trim();
  const recipesDir = import_node_path7.default.join(baseWorkspace, cfg.workspaceRecipesDir);
  await ensureDir(recipesDir);
  const destPath = import_node_path7.default.join(recipesDir, `${s}.md`);
  await writeFileSafely(destPath, md, options.overwrite ? "overwrite" : "createOnly");
  return { ok: true, slug: s, wrote: destPath, sourceUrl, metaUrl };
}

// src/handlers/tickets.ts
var import_node_path11 = __toESM(require("node:path"));
var import_promises8 = __toESM(require("node:fs/promises"));
init_fs_utils();

// src/lib/ticket-workflow.ts
var import_promises6 = __toESM(require("node:fs/promises"));
var import_node_path9 = __toESM(require("node:path"));

// src/lib/ticket-finder.ts
var import_node_path8 = __toESM(require("node:path"));
var import_promises5 = __toESM(require("node:fs/promises"));
init_fs_utils();
function laneDir(teamDir, lane) {
  return ticketStageDir(teamDir, lane);
}
var LANE_SEARCH_ORDER = ["backlog", "in-progress", "testing", "done"];
async function computeNextTicketNumber(teamDir) {
  let max = 0;
  for (const lane of LANE_SEARCH_ORDER) {
    const dir = ticketStageDir(teamDir, lane);
    if (!await fileExists(dir)) continue;
    const files = await import_promises5.default.readdir(dir);
    for (const f of files) {
      const m = f.match(TICKET_FILENAME_REGEX);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return max + 1;
}
var TICKET_FILENAME_REGEX = /^(\d{4})-(.+)\.md$/;
function parseTicketArg(ticketArgRaw) {
  const raw = String(ticketArgRaw ?? "").trim();
  const padded = raw.match(/^\d+$/) && raw.length < 4 ? raw.padStart(4, "0") : raw;
  const idMatch = padded.match(/^(\d{4})-/);
  const ticketNum = padded.match(/^\d{4}$/) ? padded : idMatch ? idMatch[1] : null;
  return { ticketArg: padded, ticketNum };
}
async function findTicketFile(opts) {
  const lanes = opts.lanes ?? LANE_SEARCH_ORDER;
  const { ticketArg, ticketNum } = parseTicketArg(String(opts.ticket));
  for (const lane of lanes) {
    const dir = laneDir(opts.teamDir, lane);
    if (!await fileExists(dir)) continue;
    const files = await import_promises5.default.readdir(dir);
    for (const f of files) {
      if (!f.endsWith(".md")) continue;
      if (ticketNum && f.startsWith(`${ticketNum}-`)) return import_node_path8.default.join(dir, f);
      if (!ticketNum && f.replace(/\.md$/, "") === ticketArg) return import_node_path8.default.join(dir, f);
    }
  }
  return null;
}

// src/lib/ticket-workflow.ts
function patchTicketFields(md, opts) {
  let out = md;
  if (out.match(/^Owner:\s.*$/m)) out = out.replace(/^Owner:\s.*$/m, `Owner: ${opts.ownerSafe}`);
  else out = out.replace(/^(# .+\n)/, `$1
Owner: ${opts.ownerSafe}
`);
  if (out.match(/^Status:\s.*$/m)) out = out.replace(/^Status:\s.*$/m, `Status: ${opts.status}`);
  else out = out.replace(/^(# .+\n)/, `$1
Status: ${opts.status}
`);
  return out;
}
async function findTicketFile2(teamDir, ticketArgRaw) {
  return findTicketFile({ teamDir, ticket: ticketArgRaw });
}
async function takeTicket(opts) {
  const teamDir = opts.teamDir;
  const owner = (opts.owner ?? "dev").trim() || "dev";
  const ownerSafe = owner.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "") || "dev";
  const srcPath = await findTicketFile2(teamDir, opts.ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${opts.ticket}`);
  if (srcPath.includes(`${import_node_path9.default.sep}work${import_node_path9.default.sep}done${import_node_path9.default.sep}`)) throw new Error("Cannot take a done ticket (already completed)");
  const inProgressDir = (await ensureLaneDir({ teamDir, lane: "in-progress", command: "openclaw recipes take" })).path;
  const filename = import_node_path9.default.basename(srcPath);
  const destPath = import_node_path9.default.join(inProgressDir, filename);
  const alreadyInProgress = srcPath === destPath;
  const md = await import_promises6.default.readFile(srcPath, "utf8");
  const nextMd = patchTicketFields(md, { ownerSafe, status: "in-progress" });
  await import_promises6.default.writeFile(srcPath, nextMd, "utf8");
  if (!alreadyInProgress) {
    await import_promises6.default.rename(srcPath, destPath);
  }
  return { srcPath, destPath, moved: !alreadyInProgress };
}
async function handoffTicket(opts) {
  const teamDir = opts.teamDir;
  const tester = (opts.tester ?? "test").trim() || "test";
  const testerSafe = tester.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "") || "test";
  const srcPath = await findTicketFile2(teamDir, opts.ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${opts.ticket}`);
  if (srcPath.includes(`${import_node_path9.default.sep}work${import_node_path9.default.sep}done${import_node_path9.default.sep}`)) throw new Error("Cannot handoff a done ticket (already completed)");
  const testingDir = (await ensureLaneDir({ teamDir, lane: "testing", command: "openclaw recipes handoff" })).path;
  const filename = import_node_path9.default.basename(srcPath);
  const destPath = import_node_path9.default.join(testingDir, filename);
  const alreadyInTesting = srcPath === destPath;
  const md = await import_promises6.default.readFile(srcPath, "utf8");
  const nextMd = patchTicketFields(md, { ownerSafe: testerSafe, status: "testing" });
  await import_promises6.default.writeFile(srcPath, nextMd, "utf8");
  if (!alreadyInTesting) {
    await import_promises6.default.rename(srcPath, destPath);
  }
  return { srcPath, destPath, moved: !alreadyInTesting };
}

// src/lib/constants.ts
var VALID_ROLES = ["dev", "devops", "lead", "test"];
var VALID_STAGES = ["backlog", "in-progress", "testing", "done"];
var MAX_RECIPE_ID_AUTO_INCREMENT = 1e3;

// src/handlers/tickets.ts
init_kitchen_manifest();
function patchTicketField(md, key, value) {
  const lineRe = new RegExp(`^${key}:\\s.*$`, "m");
  if (md.match(lineRe)) return md.replace(lineRe, `${key}: ${value}`);
  return md.replace(/^(# .+\n)/, `$1
${key}: ${value}
`);
}
function patchTicketOwner(md, owner) {
  return patchTicketField(md, "Owner", owner);
}
function patchTicketStatus(md, status) {
  return patchTicketField(md, "Status", status);
}
async function handleTickets(api, options) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const dirs = {
    backlog: ticketStageDir(teamDir, "backlog"),
    inProgress: ticketStageDir(teamDir, "in-progress"),
    testing: ticketStageDir(teamDir, "testing"),
    done: ticketStageDir(teamDir, "done")
  };
  const readTickets = async (dir, stage) => {
    if (!await fileExists(dir)) return [];
    const files = (await import_promises8.default.readdir(dir)).filter((f) => f.endsWith(".md")).sort();
    return files.map((f) => {
      const m = f.match(TICKET_FILENAME_REGEX);
      return {
        stage,
        number: m ? Number(m[1]) : null,
        id: m ? `${m[1]}-${m[2]}` : f.replace(/\.md$/, ""),
        file: import_node_path11.default.join(dir, f)
      };
    });
  };
  const backlog = await readTickets(dirs.backlog, "backlog");
  const inProgress = await readTickets(dirs.inProgress, "in-progress");
  const testing = await readTickets(dirs.testing, "testing");
  const done = await readTickets(dirs.done, "done");
  return {
    teamId,
    tickets: [...backlog, ...inProgress, ...testing, ...done],
    backlog,
    inProgress,
    testing,
    done
  };
}
async function handleMoveTicket(api, options) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const dest = String(options.to);
  if (!VALID_STAGES.includes(dest)) {
    throw new Error("--to must be one of: backlog, in-progress, testing, done");
  }
  const srcPath = await findTicketFile2(teamDir, options.ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${options.ticket}`);
  const destDir = ticketStageDir(teamDir, dest);
  await ensureDir(destDir);
  const filename = import_node_path11.default.basename(srcPath);
  const destPath = import_node_path11.default.join(destDir, filename);
  const plan = { from: srcPath, to: destPath };
  if (options.dryRun) return { ok: true, plan };
  const patchStatus = (md2) => {
    const nextStatus = dest === "backlog" ? "queued" : dest === "in-progress" ? "in-progress" : dest === "testing" ? "testing" : "done";
    let out = md2;
    if (out.match(/^Status:\s.*$/m)) out = out.replace(/^Status:\s.*$/m, `Status: ${nextStatus}`);
    else out = out.replace(/^(# .+\n)/, `$1
Status: ${nextStatus}
`);
    if (dest === "done" && options.completed) {
      const completed = (/* @__PURE__ */ new Date()).toISOString();
      if (out.match(/^Completed:\s.*$/m)) out = out.replace(/^Completed:\s.*$/m, `Completed: ${completed}`);
      else out = out.replace(/^Status:.*$/m, (m) => `${m}
Completed: ${completed}`);
    }
    return out;
  };
  const md = await import_promises8.default.readFile(srcPath, "utf8");
  const patched = patchStatus(md);
  await import_promises8.default.writeFile(srcPath, patched, "utf8");
  if (srcPath !== destPath) await import_promises8.default.rename(srcPath, destPath);
  scheduleManifestRegeneration(api);
  return { ok: true, from: srcPath, to: destPath };
}
async function handleAssign(api, options) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const owner = String(options.owner);
  if (!VALID_ROLES.includes(owner)) {
    throw new Error("--owner must be one of: dev, devops, lead, test");
  }
  const ticketPath = await findTicketFile2(teamDir, options.ticket);
  if (!ticketPath) throw new Error(`Ticket not found: ${options.ticket}`);
  const plan = { ticketPath, owner };
  if (options.dryRun) return { ok: true, plan };
  const patchOwner = (md2) => {
    if (md2.match(/^Owner:\s.*$/m)) return md2.replace(/^Owner:\s.*$/m, `Owner: ${owner}`);
    return md2.replace(/^(# .+\n)/, `$1
Owner: ${owner}
`);
  };
  const md = await import_promises8.default.readFile(ticketPath, "utf8");
  const nextMd = patchOwner(md);
  await import_promises8.default.writeFile(ticketPath, nextMd, "utf8");
  return { ok: true, plan };
}
async function dryRunTicketMove(teamDir, ticket, lane) {
  const srcPath = await findTicketFile2(teamDir, ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${ticket}`);
  const filename = import_node_path11.default.basename(srcPath);
  const destPath = import_node_path11.default.join(ticketStageDir(teamDir, lane), filename);
  return { from: srcPath, to: destPath };
}
async function resolveTeamAndValidateRole(api, teamId, role, optionName) {
  const { teamDir } = await resolveTeamContext(api, teamId);
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`--${optionName} must be one of: dev, devops, lead, test`);
  }
  return { teamDir };
}
async function handleTake(api, options) {
  const teamId = String(options.teamId);
  const owner = String(options.owner ?? "dev");
  const { teamDir } = await resolveTeamAndValidateRole(api, teamId, owner, "owner");
  if (options.dryRun) {
    const plan = await dryRunTicketMove(teamDir, options.ticket, "in-progress");
    return { plan: { ...plan, owner } };
  }
  return takeTicket({
    teamDir,
    ticket: options.ticket,
    owner,
    overwriteAssignment: !!options.overwrite
  });
}
async function handleHandoff(api, options) {
  const teamId = String(options.teamId);
  const tester = String(options.tester ?? "test");
  const { teamDir } = await resolveTeamAndValidateRole(api, teamId, tester, "tester");
  if (options.dryRun) {
    const plan = await dryRunTicketMove(teamDir, options.ticket, "testing");
    return {
      plan: { ...plan, tester, note: plan.from.includes("testing") ? "already-in-testing" : "move-to-testing" }
    };
  }
  return handoffTicket({
    teamDir,
    ticket: options.ticket,
    tester,
    overwriteAssignment: !!options.overwrite
  });
}
async function handleDispatch(api, options) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const owner = String(options.owner ?? "dev");
  if (!VALID_ROLES.includes(owner)) {
    throw new Error("--owner must be one of: dev, devops, lead, test");
  }
  const requestText = options.requestText.trim();
  if (!requestText) throw new Error("Request cannot be empty");
  const inboxDir = import_node_path11.default.join(teamDir, "inbox");
  const backlogDir = ticketStageDir(teamDir, "backlog");
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "request";
  const nowKey = () => {
    const d = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  };
  const ticketNum = await computeNextTicketNumber(teamDir);
  const ticketNumStr = String(ticketNum).padStart(4, "0");
  const title = requestText.length > 80 ? requestText.slice(0, 77) + "\u2026" : requestText;
  const baseSlug = slugify(title);
  const inboxPath = import_node_path11.default.join(inboxDir, `${nowKey()}-${baseSlug}.md`);
  const ticketPath = import_node_path11.default.join(backlogDir, `${ticketNumStr}-${baseSlug}.md`);
  const receivedIso = (/* @__PURE__ */ new Date()).toISOString();
  const inboxMd = `# Inbox \u2014 ${teamId}

Received: ${receivedIso}

## Request
${requestText}

## Proposed work
- Ticket: ${ticketNumStr}-${baseSlug}
- Owner: ${owner}

## Links
- Ticket: ${import_node_path11.default.relative(teamDir, ticketPath)}
`;
  const ticketMd = `# ${ticketNumStr}-${baseSlug}

Created: ${receivedIso}
Owner: ${owner}
Status: queued
Inbox: ${import_node_path11.default.relative(teamDir, inboxPath)}

## Context
${requestText}

## Requirements
- (fill in)

## Acceptance criteria
- (fill in)

## Tasks
- [ ] (fill in)

## Comments
- (use this section for @mentions, questions, decisions, and dated replies)
`;
  const plan = {
    teamId,
    request: requestText,
    files: [
      { path: inboxPath, kind: "inbox", summary: title },
      { path: ticketPath, kind: "backlog-ticket", summary: title }
    ]
  };
  if (options.dryRun) return { ok: true, plan };
  await ensureDir(inboxDir);
  await ensureDir(backlogDir);
  await writeFileSafely(inboxPath, inboxMd, "createOnly");
  await writeFileSafely(ticketPath, ticketMd, "createOnly");
  let nudgeQueued = false;
  try {
    const leadAgentId = `${teamId}-lead`;
    api.runtime.system.enqueueSystemEvent(
      [
        `Dispatch created new intake for team: ${teamId}`,
        `- Inbox: ${import_node_path11.default.relative(teamDir, inboxPath)}`,
        `- Backlog: ${import_node_path11.default.relative(teamDir, ticketPath)}`,
        // Assignment stubs are deprecated; no assignment artifact is created.
        `Action: please triage/normalize the ticket (fill Requirements/AC/tasks) and move it through the workflow.`
      ].join("\n"),
      { sessionKey: `agent:${leadAgentId}:main` }
    );
    nudgeQueued = true;
  } catch {
    nudgeQueued = false;
  }
  scheduleManifestRegeneration(api);
  return { ok: true, wrote: plan.files.map((f) => f.path), nudgeQueued };
}

// src/handlers/team.ts
var import_node_path18 = __toESM(require("node:path"));
var import_promises11 = __toESM(require("node:fs/promises"));
init_fs_utils();

// src/lib/json-utils.ts
var import_node_path12 = __toESM(require("node:path"));
var import_promises9 = __toESM(require("node:fs/promises"));
init_fs_utils();
async function readJsonFile(p) {
  try {
    const raw = await import_promises9.default.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function writeJsonFile(p, data) {
  await ensureDir(import_node_path12.default.dirname(p));
  await import_promises9.default.writeFile(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// src/lib/remove-team.ts
var import_promises10 = __toESM(require("node:fs/promises"));
var import_node_path13 = __toESM(require("node:path"));
init_fs_utils();
function stampTeamId(teamId) {
  return `recipes.teamId=${teamId}`;
}
function isProtectedTeamId(teamId) {
  const t = teamId.trim().toLowerCase();
  return t === "development-team" || t === "main";
}
async function loadCronStore(cronJobsPath) {
  const raw = await import_promises10.default.readFile(cronJobsPath, "utf8");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || !Array.isArray(data.jobs)) {
    throw new Error(`Invalid cron store: ${cronJobsPath}`);
  }
  return data;
}
async function saveCronStore(cronJobsPath, store) {
  await import_promises10.default.writeFile(cronJobsPath, JSON.stringify(store, null, 2) + "\n", "utf8");
}
function findAgentsToRemove(cfgObj, teamId) {
  const list = cfgObj?.agents?.list;
  if (!Array.isArray(list)) return [];
  const prefix = `${teamId}-`;
  return list.map((a) => String(a?.id ?? "")).filter((id) => id && id.startsWith(prefix));
}
function planCronJobRemovals(jobs, teamId, opts) {
  const stamp = stampTeamId(teamId);
  const exact = [];
  const ambiguous = [];
  const installed = new Set((opts?.installedCronIds ?? []).map((s) => String(s).trim()).filter(Boolean));
  for (const j of jobs) {
    const msg = String(j?.payload?.message ?? "");
    const name = String(j?.name ?? "");
    if (installed.has(String(j.id))) {
      exact.push({ id: j.id, name: j.name });
      continue;
    }
    if (msg.includes(stamp)) {
      exact.push({ id: j.id, name: j.name });
      continue;
    }
    if (name.includes(teamId) || msg.includes(teamId)) {
      ambiguous.push({ id: j.id, name: j.name, reason: "mentions-teamId" });
    }
  }
  return { exact, ambiguous };
}
async function buildRemoveTeamPlan(opts) {
  const teamId = opts.teamId.trim();
  const workspaceDir = import_node_path13.default.resolve(import_node_path13.default.join(opts.workspaceRoot, "..", `workspace-${teamId}`));
  const notes = [];
  if (isProtectedTeamId(teamId)) notes.push(`protected-team:${teamId}`);
  const agentsToRemove = findAgentsToRemove(opts.cfgObj, teamId);
  const jobs = opts.cronStore?.jobs ?? [];
  const cron = planCronJobRemovals(jobs, teamId, { installedCronIds: opts.installedCronIds });
  const plan = {
    teamId,
    workspaceDir,
    openclawConfigPath: opts.openclawConfigPath,
    cronJobsPath: opts.cronJobsPath,
    agentsToRemove,
    cronJobsExact: cron.exact,
    cronJobsAmbiguous: cron.ambiguous,
    notes
  };
  return plan;
}
async function executeRemoveTeamPlan(opts) {
  const { plan } = opts;
  const teamId = plan.teamId;
  if (isProtectedTeamId(teamId)) {
    throw new Error(`Refusing to remove protected team: ${teamId}`);
  }
  const workspaceExists = await fileExists(plan.workspaceDir);
  if (workspaceExists) {
    await import_promises10.default.rm(plan.workspaceDir, { recursive: true, force: true });
  }
  const agents = opts.cfgObj?.agents;
  const list = agents?.list;
  const before = Array.isArray(list) ? list.length : 0;
  if (Array.isArray(list) && opts.cfgObj.agents) {
    const remove = new Set(plan.agentsToRemove);
    opts.cfgObj.agents.list = list.filter((a) => !remove.has(String(a?.id ?? "")));
  }
  const after = Array.isArray(opts.cfgObj?.agents?.list) ? opts.cfgObj.agents.list.length : 0;
  const exactIds = new Set(plan.cronJobsExact.map((j) => j.id));
  const ambiguousIds = new Set(plan.cronJobsAmbiguous.map((j) => j.id));
  const removeIds = /* @__PURE__ */ new Set([...exactIds]);
  if (opts.includeAmbiguous) {
    for (const id of ambiguousIds) removeIds.add(id);
  }
  const beforeJobs = opts.cronStore.jobs.length;
  opts.cronStore.jobs = opts.cronStore.jobs.filter((j) => !removeIds.has(j.id));
  const afterJobs = opts.cronStore.jobs.length;
  const result = {
    ok: true,
    plan,
    removed: {
      workspaceDir: workspaceExists ? "deleted" : "missing",
      agentsRemoved: Math.max(0, before - after),
      cronJobsRemoved: Math.max(0, beforeJobs - afterJobs)
    }
  };
  return result;
}

// src/lib/recipe-id.ts
var import_node_path14 = __toESM(require("node:path"));
init_fs_utils();
async function pickRecipeId(opts) {
  const { baseId, recipesDir, overwriteRecipe, autoIncrement, isTaken, getSuggestions, getConflictError } = opts;
  if (!await isTaken(baseId)) return baseId;
  if (overwriteRecipe) {
    const basePath = import_node_path14.default.join(recipesDir, `${baseId}.md`);
    if (!await fileExists(basePath) && opts.overwriteRecipeError) {
      throw new Error(opts.overwriteRecipeError(baseId));
    }
    return baseId;
  }
  if (autoIncrement) {
    let n = 2;
    while (n < MAX_RECIPE_ID_AUTO_INCREMENT) {
      const candidate = `${baseId}-${n}`;
      if (!await isTaken(candidate)) return candidate;
      n += 1;
    }
    throw new Error(`No available recipe id found for ${baseId} (tried up to -999)`);
  }
  const suggestions = getSuggestions(baseId);
  throw new Error(getConflictError(baseId, suggestions));
}

// src/lib/scaffold-utils.ts
var import_node_path15 = __toESM(require("node:path"));
var import_yaml2 = __toESM(require_dist());
init_config();
init_fs_utils();
init_recipe_frontmatter();
init_recipes();
async function validateRecipeAndSkills(api, recipeId, expectedKind) {
  const loaded = await loadRecipeById(api, recipeId);
  const recipe = loaded.frontmatter;
  const kind = recipe.kind ?? expectedKind;
  if (kind !== expectedKind) {
    const article = expectedKind === "agent" ? "an" : "a";
    throw new Error(`Recipe is not ${article} ${expectedKind} recipe: kind=${recipe.kind}`);
  }
  const cfg = getRecipesConfig(api.config);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const installDir = import_node_path15.default.join(workspaceRoot, cfg.workspaceSkillsDir);
  const missing = await detectMissingSkills(installDir, recipe.requiredSkills ?? []);
  if (missing.length) {
    return {
      ok: false,
      missingSkills: missing,
      installCommands: skillInstallCommands(cfg, missing)
    };
  }
  return { ok: true, loaded, recipe, cfg, workspaceRoot };
}
async function writeWorkspaceRecipeFile(loaded, recipesDir, workspaceRecipeId, overwriteRecipe) {
  const parsed = parseFrontmatter(loaded.md);
  const fm = {
    ...parsed.frontmatter,
    id: workspaceRecipeId,
    name: parsed.frontmatter.name ?? loaded.frontmatter.name ?? workspaceRecipeId
  };
  const nextMd = `---
${import_yaml2.default.stringify(fm)}---
${parsed.body}`;
  const recipeFilePath = import_node_path15.default.join(recipesDir, `${workspaceRecipeId}.md`);
  await writeFileSafely(recipeFilePath, nextMd, overwriteRecipe ? "overwrite" : "createOnly");
}
async function recipeIdTakenForAgent(api, recipesDir, id) {
  const filePath = import_node_path15.default.join(recipesDir, `${id}.md`);
  if (await fileExists(filePath)) return true;
  try {
    await loadRecipeById(api, id);
    return true;
  } catch {
    return false;
  }
}
async function recipeIdTakenForTeam(recipesDir, id) {
  return fileExists(import_node_path15.default.join(recipesDir, `${id}.md`));
}

// src/handlers/scaffold.ts
var import_node_path17 = __toESM(require("node:path"));
init_fs_utils();

// src/lib/template.ts
function renderTemplate(raw, vars) {
  return raw.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return typeof v === "string" ? v : "";
  });
}

// src/handlers/cron.ts
var import_node_path16 = __toESM(require("node:path"));

// src/lib/cron-utils.ts
var import_node_crypto = __toESM(require("node:crypto"));
async function loadCronMappingState(statePath) {
  const existing = await readJsonFile(statePath);
  if (existing && existing.version === 1 && existing.entries && typeof existing.entries === "object") return existing;
  return { version: 1, entries: {} };
}
function cronKey(scope, cronJobId) {
  return scope.kind === "team" ? `team:${scope.teamId}:recipe:${scope.recipeId}:cron:${cronJobId}` : `agent:${scope.agentId}:recipe:${scope.recipeId}:cron:${cronJobId}`;
}
function hashSpec(spec) {
  const json = stableStringify(spec);
  return import_node_crypto.default.createHash("sha256").update(json, "utf8").digest("hex");
}

// src/handlers/cron.ts
init_recipe_frontmatter();
function interpolateTemplate(input, vars) {
  if (input == null) return void 0;
  let out = String(input);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}
function applyCronJobVars(scope, j) {
  const vars = {
    recipeId: scope.recipeId,
    ...scope.kind === "team" ? { teamId: scope.teamId } : { agentId: scope.agentId }
  };
  return {
    ...j,
    name: interpolateTemplate(j.name, vars),
    schedule: interpolateTemplate(j.schedule, vars),
    timezone: interpolateTemplate(j.timezone, vars),
    channel: interpolateTemplate(j.channel, vars),
    to: interpolateTemplate(j.to, vars),
    agentId: interpolateTemplate(j.agentId, vars),
    description: interpolateTemplate(j.description, vars),
    message: interpolateTemplate(j.message, vars)
  };
}
function buildCronJobForCreate(scope, j, wantEnabled) {
  const name = j.name ?? `${scope.kind === "team" ? scope.teamId : scope.agentId} \u2022 ${scope.recipeId} \u2022 ${j.id}`;
  const effectiveAgentId = typeof j.agentId === "string" && j.agentId.trim() ? j.agentId.trim() : scope.kind === "team" ? `${scope.teamId}-lead` : scope.agentId;
  const sessionTarget = effectiveAgentId ? "isolated" : "main";
  return {
    name,
    agentId: effectiveAgentId ?? null,
    description: j.description ?? "",
    enabled: wantEnabled,
    wakeMode: "next-heartbeat",
    sessionTarget,
    schedule: { kind: "cron", expr: j.schedule, ...j.timezone ? { tz: j.timezone } : {} },
    payload: effectiveAgentId ? { kind: "agentTurn", message: j.message, ...j.timeoutSeconds ? { timeoutSeconds: j.timeoutSeconds } : {} } : { kind: "systemEvent", text: j.message },
    ...j.delivery === "none" ? { delivery: { mode: "none" } } : j.delivery === "announce" || j.channel || j.to ? {
      delivery: {
        mode: "announce",
        ...j.channel ? { channel: j.channel } : {},
        ...j.to ? { to: j.to } : {},
        bestEffort: true
      }
    } : (
      // Default to none — OpenClaw defaults isolated agentTurn crons to
      // "announce" which errors when no channel target is available.
      { delivery: { mode: "none" } }
    )
  };
}
function buildCronJobPatch(j, name) {
  const effectiveAgentId = typeof j.agentId === "string" && j.agentId.trim() ? j.agentId.trim() : void 0;
  const patch = {
    name,
    agentId: effectiveAgentId ?? null,
    description: j.description ?? "",
    sessionTarget: effectiveAgentId ? "isolated" : "main",
    wakeMode: "next-heartbeat",
    schedule: { kind: "cron", expr: j.schedule, ...j.timezone ? { tz: j.timezone } : {} },
    payload: effectiveAgentId ? { kind: "agentTurn", message: j.message, ...j.timeoutSeconds ? { timeoutSeconds: j.timeoutSeconds } : {} } : { kind: "systemEvent", text: j.message }
  };
  if (j.delivery === "none") {
    patch.delivery = { mode: "none" };
  } else if (j.delivery === "announce" || j.channel || j.to) {
    patch.delivery = {
      mode: "announce",
      ...j.channel ? { channel: j.channel } : {},
      ...j.to ? { to: j.to } : {},
      bestEffort: true
    };
  } else {
    patch.delivery = { mode: "none" };
  }
  return patch;
}
async function disableOrphanedCronJobs(opts) {
  const { api, state, byId, recipeId, desiredIds, now, results } = opts;
  for (const [key, entry] of Object.entries(state.entries)) {
    if (!key.includes(`:recipe:${recipeId}:cron:`)) continue;
    const cronId = key.split(":cron:")[1] ?? "";
    if (!cronId || desiredIds.has(cronId)) continue;
    const job = byId.get(entry.installedCronId);
    if (job && job.enabled) {
      await cronUpdate(api, job.id, { enabled: false });
      results.push({ action: "disabled-removed", key, installedCronId: job.id });
    }
    state.entries[key] = { ...entry, orphaned: true, updatedAtMs: now };
  }
}
async function cronList(api) {
  const result = await api.runtime.system.runCommandWithTimeout(["openclaw", "cron", "list", "--all", "--json"], {
    timeoutMs: 3e4
  });
  if (result.code !== 0) {
    throw new Error(`openclaw cron list failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  const parsed = JSON.parse(result.stdout || "{}");
  return { jobs: parsed.jobs ?? [] };
}
function isCronToolUnavailableError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return /Tool not available:\s*cron/i.test(msg);
}
async function cronAdd(api, job) {
  const argv = ["openclaw", "cron", "add", "--json"];
  const j = job;
  if (typeof j.name === "string" && j.name.trim()) argv.push("--name", j.name.trim());
  if (typeof j.description === "string" && j.description.trim())
    argv.push("--description", j.description.trim());
  const schedule = j.schedule;
  if (schedule && typeof schedule === "object") {
    const kind = String(schedule.kind ?? "");
    if (kind === "cron") {
      argv.push("--cron", String(schedule.expr ?? ""));
      if (schedule.tz) argv.push("--tz", String(schedule.tz));
    } else if (kind === "every") {
      argv.push("--every", String(schedule.every ?? ""));
    } else if (kind === "at") {
      argv.push("--at", String(schedule.at ?? ""));
    }
  }
  if (j.enabled === false) argv.push("--disabled");
  if (typeof j.agentId === "string" && j.agentId.trim())
    argv.push("--agent", String(j.agentId).trim());
  const sessionTarget = j.sessionTarget;
  if (sessionTarget === "main" || sessionTarget === "isolated") argv.push("--session", sessionTarget);
  const payload = j.payload;
  if (payload && typeof payload === "object") {
    const pk = String(payload.kind ?? "");
    if (pk === "agentTurn" && payload.message) argv.push("--message", String(payload.message));
    if (pk === "systemEvent" && payload.text) argv.push("--system-event", String(payload.text));
  }
  const delivery = j.delivery;
  if (delivery && typeof delivery === "object") {
    const deliveryMode = String(delivery.mode ?? "");
    if (deliveryMode === "announce") {
      argv.push("--announce");
      if (delivery.channel) argv.push("--channel", String(delivery.channel));
      if (delivery.to) argv.push("--to", String(delivery.to));
      if (delivery.bestEffort) argv.push("--best-effort-deliver");
    } else if (deliveryMode === "none") {
      argv.push("--no-deliver");
    }
  }
  const result = await api.runtime.system.runCommandWithTimeout(argv, { timeoutMs: 3e4 });
  if (result.code !== 0) {
    throw new Error(`openclaw cron add failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  return (result.stdout ? JSON.parse(result.stdout) : null) ?? null;
}
async function cronUpdate(api, jobId, patch) {
  const argv = ["openclaw", "cron", "edit", jobId];
  if (patch.name) argv.push("--name", String(patch.name));
  if (patch.description) argv.push("--description", String(patch.description));
  if (patch.cron) argv.push("--cron", String(patch.cron));
  if (patch.every) argv.push("--every", String(patch.every));
  if (patch.at) argv.push("--at", String(patch.at));
  if (patch.tz) argv.push("--tz", String(patch.tz));
  if (patch.agentId) argv.push("--agent", String(patch.agentId));
  if (patch.sessionKey === null) argv.push("--clear-session-key");
  if (patch.message) argv.push("--message", String(patch.message));
  if (patch.systemEvent) argv.push("--system-event", String(patch.systemEvent));
  if (patch.channel) argv.push("--channel", String(patch.channel));
  if (patch.to) argv.push("--to", String(patch.to));
  if (typeof patch.enabled === "boolean") argv.push(patch.enabled ? "--enable" : "--disable");
  const result = await api.runtime.system.runCommandWithTimeout(argv, { timeoutMs: 3e4 });
  if (result.code !== 0) {
    throw new Error(`openclaw cron edit failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  return result.stdout?.trim() ? JSON.parse(result.stdout) : null;
}
async function resolveCronUserOptIn(mode, recipeId, desiredCount) {
  if (mode === "off") return { return: { ok: true, changed: false, note: "cron-installation-off", desiredCount } };
  if (mode === "on") return { userOptIn: true, enableInstalled: true };
  if (!process.stdin.isTTY) {
    console.error(
      `Non-interactive mode: cronInstallation=prompt; reconciling ${desiredCount} cron job(s) as disabled (no prompt).`
    );
    return { userOptIn: false, enableInstalled: false };
  }
  const header = `Recipe ${recipeId} defines ${desiredCount} cron job(s).
These run automatically on a schedule. Install them?`;
  const userOptIn = await promptYesNo(header);
  if (!userOptIn) return { return: { ok: true, changed: false, note: "cron-installation-declined", desiredCount } };
  const enableInstalled = await promptYesNo("Enable the installed cron jobs now? (You can always enable later)");
  return { userOptIn, enableInstalled };
}
async function createNewCronJob(opts) {
  const { api, scope, j, wantEnabled, key, specHash, now, state, results } = opts;
  const created = await cronAdd(api, buildCronJobForCreate(scope, j, wantEnabled));
  const newId = created?.id ?? created?.job?.id;
  if (!newId) throw new Error("Failed to parse cron add output (missing id)");
  state.entries[key] = { installedCronId: newId, specHash, updatedAtMs: now, orphaned: false };
  results.push({ action: "created", key, installedCronId: newId, enabled: wantEnabled });
}
async function updateExistingCronJob(opts) {
  const { api, j, name, existing, prevSpecHash, specHash, userOptIn, enableInstalled, key, now, state, results } = opts;
  if (prevSpecHash !== specHash) {
    await cronUpdate(api, existing.id, buildCronJobPatch(j, name));
    results.push({ action: "updated", key, installedCronId: existing.id });
  } else {
    results.push({ action: "unchanged", key, installedCronId: existing.id });
  }
  if (!userOptIn && existing.enabled) {
    await cronUpdate(api, existing.id, { enabled: false });
    results.push({ action: "disabled", key, installedCronId: existing.id });
  }
  if (userOptIn && enableInstalled && !existing.enabled) {
    await cronUpdate(api, existing.id, { enabled: true });
    results.push({ action: "updated", key, installedCronId: existing.id });
  }
  state.entries[key] = { installedCronId: existing.id, specHash, updatedAtMs: now, orphaned: false };
}
async function reconcileOneCronJob(ctx, j, userOptIn, enableInstalled) {
  const { api, scope, state, byId, now, results } = ctx;
  const jj = applyCronJobVars(scope, j);
  const key = cronKey(scope, jj.id);
  const name = jj.name ?? `${scope.kind === "team" ? scope.teamId : scope.agentId} \u2022 ${scope.recipeId} \u2022 ${jj.id}`;
  const specHash = hashSpec({
    schedule: jj.schedule,
    message: jj.message,
    timezone: jj.timezone ?? "",
    channel: jj.channel ?? "last",
    to: jj.to ?? "",
    agentId: jj.agentId ?? "",
    name,
    description: jj.description ?? ""
  });
  const prev = state.entries[key];
  const existing = prev?.installedCronId ? byId.get(prev.installedCronId) : void 0;
  const wantEnabled = userOptIn ? enableInstalled ? true : Boolean(jj.enabledByDefault) : false;
  if (!existing) {
    await createNewCronJob({ api, scope, j: jj, wantEnabled, key, specHash, now, state, results });
    return;
  }
  await updateExistingCronJob({
    api,
    j: jj,
    name,
    existing,
    prevSpecHash: prev?.specHash,
    specHash,
    userOptIn,
    enableInstalled,
    key,
    now,
    state,
    results
  });
}
async function reconcileDesiredCronJobs(opts) {
  const ctx = {
    api: opts.api,
    scope: opts.scope,
    state: opts.state,
    byId: opts.byId,
    now: opts.now,
    results: opts.results
  };
  for (const j of opts.desired) {
    await reconcileOneCronJob(ctx, j, opts.userOptIn, opts.enableInstalled);
  }
}
async function reconcileRecipeCronJobs(opts) {
  const desired = normalizeCronJobs(opts.recipe);
  if (!desired.length) return { ok: true, changed: false, note: "no-cron-jobs" };
  const optIn = await resolveCronUserOptIn(opts.cronInstallation, opts.scope.recipeId, desired.length);
  if ("return" in optIn) return optIn.return;
  const statePath = import_node_path16.default.join(opts.scope.stateDir, "notes", "cron-jobs.json");
  const state = await loadCronMappingState(statePath);
  const hasAnyInstalled = desired.some((j) => Boolean(state.entries[cronKey(opts.scope, j.id)]?.installedCronId));
  let list = { jobs: [] };
  if (hasAnyInstalled) {
    try {
      list = await cronList(opts.api);
    } catch (err) {
      if (isCronToolUnavailableError(err)) {
        console.error("[recipes] note: cron tool unavailable; skipping cron reconciliation (scaffold will proceed).");
        return { ok: true, changed: false, note: "cron-tool-unavailable", desiredCount: desired.length };
      }
      throw err;
    }
  }
  const byId = new Map((list?.jobs ?? []).map((j) => [j.id, j]));
  const now = Date.now();
  const desiredIds = new Set(desired.map((j) => j.id));
  const results = [];
  try {
    await reconcileDesiredCronJobs({
      ...opts,
      desired,
      userOptIn: optIn.userOptIn,
      enableInstalled: optIn.enableInstalled,
      state,
      byId,
      now,
      results
    });
    await disableOrphanedCronJobs({
      api: opts.api,
      state,
      byId,
      recipeId: opts.scope.recipeId,
      desiredIds,
      now,
      results
    });
    await writeJsonFile(statePath, state);
  } catch (err) {
    if (isCronToolUnavailableError(err)) {
      console.error("[recipes] note: cron tool unavailable; skipping cron reconciliation (scaffold will proceed).");
      return { ok: true, changed: false, note: "cron-tool-unavailable", desiredCount: desired.length };
    }
    throw err;
  }
  const changed = results.some(
    (r) => r.action === "created" || r.action === "updated" || r.action?.startsWith("disabled")
  );
  return { ok: true, changed, results };
}

// src/handlers/scaffold.ts
async function scaffoldAgentFromRecipe(api, recipe, opts) {
  await ensureDir(opts.filesRootDir);
  function normalizeTemplates(input) {
    if (!input) return {};
    if (typeof input !== "object") throw new Error("recipe.templates must be an object");
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  }
  function normalizeFiles(input) {
    if (!input) return [];
    if (!Array.isArray(input)) throw new Error("recipe.files must be an array");
    return input.map((raw, idx) => {
      if (!raw || typeof raw !== "object") throw new Error(`recipe.files[${idx}] must be an object`);
      const o = raw;
      const filePath = String(o.path ?? "").trim();
      const template = String(o.template ?? "").trim();
      const modeRaw = o.mode != null ? String(o.mode).trim() : "";
      if (!filePath) throw new Error(`recipe.files[${idx}].path is required`);
      if (!template) throw new Error(`recipe.files[${idx}].template is required`);
      const mode = modeRaw === "createOnly" || modeRaw === "overwrite" ? modeRaw : void 0;
      if (modeRaw && !mode) throw new Error(`recipe.files[${idx}].mode must be createOnly|overwrite`);
      return { path: filePath, template, mode };
    });
  }
  const templates = normalizeTemplates(recipe.templates);
  const files = normalizeFiles(recipe.files);
  const vars = opts.vars ?? {};
  const fileResults = [];
  for (const f of files) {
    const raw = templates[f.template];
    if (typeof raw !== "string") throw new Error(`Missing template: ${String(f.template)}`);
    const rendered = renderTemplate(raw, vars);
    const target = import_node_path17.default.join(opts.filesRootDir, f.path);
    const mode = opts.update ? f.mode ?? "overwrite" : f.mode ?? "createOnly";
    const r = await writeFileSafely(target, rendered, mode);
    fileResults.push({ path: target, wrote: r.wrote, reason: r.reason });
  }
  const configSnippet = {
    id: opts.agentId,
    workspace: opts.workspaceRootDir,
    identity: { name: opts.agentName ?? recipe.name ?? opts.agentId },
    tools: recipe.tools
  };
  return {
    filesRootDir: opts.filesRootDir,
    workspaceRootDir: opts.workspaceRootDir,
    fileResults,
    next: {
      configSnippet
    }
  };
}
async function handleScaffold(api, options) {
  const validation = await validateRecipeAndSkills(api, options.recipeId, "agent");
  if (!validation.ok) {
    return {
      ok: false,
      missingSkills: validation.missingSkills,
      installCommands: validation.installCommands
    };
  }
  const { loaded, recipe, cfg, workspaceRoot } = validation;
  const agentId = String(options.agentId);
  const baseWorkspace = api.config.agents?.defaults?.workspace ?? "~/.openclaw/workspace";
  const resolvedWorkspaceRoot = import_node_path17.default.resolve(baseWorkspace, "..", `workspace-${agentId}`);
  const recipesDir = import_node_path17.default.join(workspaceRoot, cfg.workspaceRecipesDir);
  await ensureDir(recipesDir);
  const overwriteRecipe = !!options.overwriteRecipe;
  const autoIncrement = !!options.autoIncrement;
  const explicitRecipeId = typeof options.recipeIdExplicit === "string" ? String(options.recipeIdExplicit).trim() : "";
  const baseRecipeId = explicitRecipeId || agentId;
  const workspaceRecipeId = await pickRecipeId({
    baseId: baseRecipeId,
    recipesDir,
    overwriteRecipe,
    autoIncrement,
    isTaken: (id) => recipeIdTakenForAgent(api, recipesDir, id),
    overwriteRecipeError: (id) => `Recipe id is already taken by a non-workspace recipe: ${id}. Choose a different id (e.g. ${id}-2) or pass --auto-increment.`,
    getSuggestions: (id) => [`${id}-2`, `${id}-3`, `${id}-4`],
    getConflictError: (id, suggestions) => `Recipe id already exists: ${id}. Refusing to overwrite. Suggestions: ${suggestions.join(", ")}. Re-run with --recipe-id, --auto-increment, or --overwrite-recipe.`
  });
  await writeWorkspaceRecipeFile(loaded, recipesDir, workspaceRecipeId, overwriteRecipe);
  const result = await scaffoldAgentFromRecipe(api, recipe, {
    agentId,
    agentName: options.name,
    update: !!options.overwrite,
    filesRootDir: resolvedWorkspaceRoot,
    workspaceRootDir: resolvedWorkspaceRoot,
    vars: {
      agentId,
      agentName: options.name ?? recipe.name ?? agentId
    }
  });
  if (options.applyConfig) {
    await applyAgentSnippetsToOpenClawConfig(api, [result.next.configSnippet]);
  }
  const cron = await reconcileRecipeCronJobs({
    api,
    recipe,
    scope: { kind: "agent", agentId, recipeId: recipe.id, stateDir: resolvedWorkspaceRoot },
    cronInstallation: cfg.cronInstallation
  });
  return { ok: true, ...result, cron };
}

// src/handlers/team.ts
init_kitchen_manifest();

// src/lib/recipe-lint.ts
function lintRecipe(recipe) {
  const issues = [];
  if ((recipe.kind ?? "") === "team") {
    const agents = recipe.agents ?? [];
    const files = recipe.files ?? [];
    const templates = recipe.templates ?? {};
    if (agents.length && files.length === 0) {
      const hasRoleTemplates = Object.keys(templates).some((k) => k.includes(".") && /(\.soul|\.agents|\.tools|\.status|\.notes)$/.test(k));
      issues.push({
        level: "warn",
        code: "team.missing_files",
        message: `Team recipe has agents[] but no files[]. Per-role workspaces will be empty. Add a files: section (e.g. SOUL.md/AGENTS.md/TOOLS.md/STATUS.md/NOTES.md) or rely on scaffold defaults. ${hasRoleTemplates ? "(Detected role templates; likely meant to scaffold role files.)" : ""}`
      });
    }
    if (agents.length && Object.keys(templates).length && files.length) {
      const baseTemplates = new Set(files.map((f) => String(f.template ?? "").trim()).filter(Boolean));
      const missing = ["soul", "agents", "tools"].filter((t) => !baseTemplates.has(t) && ![...baseTemplates].some((x) => x.endsWith(`.${t}`)));
      if (missing.length) {
        issues.push({
          level: "warn",
          code: "team.files.missing_core_templates",
          message: `Team recipe files[] is missing some common templates (${missing.join(", ")}). This may be intentional, but usually each role should have SOUL.md/AGENTS.md/TOOLS.md at minimum.`
        });
      }
    }
  }
  return issues;
}

// src/handlers/team.ts
async function ensureTeamDirectoryStructure(teamDir, sharedContextDir, notesDir, workDir) {
  await Promise.all([
    ensureDir(import_node_path18.default.join(teamDir, "shared")),
    ensureDir(sharedContextDir),
    ensureDir(import_node_path18.default.join(sharedContextDir, "agent-outputs")),
    ensureDir(import_node_path18.default.join(sharedContextDir, "feedback")),
    ensureDir(import_node_path18.default.join(sharedContextDir, "kpis")),
    ensureDir(import_node_path18.default.join(sharedContextDir, "calendar")),
    ensureDir(import_node_path18.default.join(sharedContextDir, "memory")),
    ensureDir(import_node_path18.default.join(teamDir, "inbox")),
    ensureDir(import_node_path18.default.join(teamDir, "outbox")),
    ensureDir(notesDir),
    ensureDir(workDir),
    ensureDir(import_node_path18.default.join(workDir, "backlog")),
    ensureDir(import_node_path18.default.join(workDir, "in-progress")),
    ensureDir(import_node_path18.default.join(workDir, "testing")),
    ensureDir(import_node_path18.default.join(workDir, "done")),
    ensureDir(import_node_path18.default.join(workDir, "assignments"))
  ]);
}
async function writeTeamBootstrapFiles(opts) {
  const { teamId, teamDir, sharedContextDir, notesDir, goalsDir, recipe, overwrite, qaChecklist } = opts;
  const mode = overwrite ? "overwrite" : "createOnly";
  await ensureDir(goalsDir);
  await writeFileSafely(
    import_node_path18.default.join(sharedContextDir, "priorities.md"),
    `# Priorities \u2014 ${teamId}

- (empty)

## Notes
- Lead curates this file.
- Non-lead roles should append updates to shared-context/agent-outputs/ instead.
`,
    mode
  );
  await ensureDir(import_node_path18.default.join(sharedContextDir, "memory"));
  await writeFileSafely(import_node_path18.default.join(sharedContextDir, "memory", "team.jsonl"), "", mode);
  await writeFileSafely(import_node_path18.default.join(sharedContextDir, "memory", "pinned.jsonl"), "", mode);
  await writeFileSafely(
    import_node_path18.default.join(sharedContextDir, "DECISIONS.md"),
    `# Decisions \u2014 ${teamId}

Append-only dated bullets.

- (empty)
`,
    mode
  );
  await writeFileSafely(
    import_node_path18.default.join(sharedContextDir, "GLOSSARY.md"),
    `# Glossary \u2014 ${teamId}

Terms, conventions, acronyms.

- (empty)
`,
    mode
  );
  await writeFileSafely(import_node_path18.default.join(notesDir, "plan.md"), `# Plan \u2014 ${teamId}

- (empty)
`, mode);
  await writeFileSafely(import_node_path18.default.join(notesDir, "status.md"), `# Status \u2014 ${teamId}

- (empty)
`, mode);
  await writeFileSafely(
    import_node_path18.default.join(notesDir, "memory-policy.md"),
    `# Memory Policy \u2014 ${teamId}

This workspace is file-first.

## Where things go
- **Ticket comments**: decisions/notes specific to a ticket (append under "## Comments").
- **notes/status.md**: append-only status log for the team.
- **notes/plan.md**: lead-curated plan + priorities for the team.
- **shared-context/priorities.md**: lead-curated top priorities.
- **shared-context/memory/team.jsonl**: team knowledge stream (Kitchen Memory tab).
- **shared-context/memory/pinned.jsonl**: pinned team facts/decisions (Kitchen Memory tab).
- **shared-context/agent-outputs/**: append-only artifacts + logs produced by agents.

## End-of-session checklist (everyone)
- [ ] Update ticket "## Comments" with what changed + next step
- [ ] Append a dated entry to notes/status.md
- [ ] Save any artifacts to shared-context/agent-outputs/
`,
    mode
  );
  await writeFileSafely(
    import_node_path18.default.join(teamDir, "HEARTBEAT.md"),
    `# HEARTBEAT \u2014 ${teamId}

Keep this file small. It is loaded frequently.

Default behavior: **quiet**. If there is nothing to report, do nothing.

## Checklist
- [ ] Check \`inbox/\` for new requests
- [ ] Scan \`work/in-progress/\` for blocked/stuck tickets
- [ ] If anything materially changed, append a dated bullet to \`notes/status.md\` (append-only)
- [ ] If nothing changed, reply \`HEARTBEAT_OK\`
`,
    mode
  );
  await ensureDir(import_node_path18.default.join(sharedContextDir, "agent-outputs"));
  await writeFileSafely(
    import_node_path18.default.join(sharedContextDir, "agent-outputs", "README.md"),
    `# Agent outputs \u2014 ${teamId}

Drop append-only artifacts/logs here.

Recommended:
- One file per day per role (e.g. "2026-03-05-dev.md")
- Or one file per ticket (e.g. "0145-memory-policy.md")
`,
    mode
  );
  await writeFileSafely(
    import_node_path18.default.join(notesDir, "GOALS.md"),
    `# Goals \u2014 ${teamId}

This folder is the canonical home for goals.

## How to use
- Create one markdown file per goal under: notes/goals/
- Add a link here for discoverability

## Goals
- (empty)
`,
    mode
  );
  await writeFileSafely(
    import_node_path18.default.join(goalsDir, "README.md"),
    `# Goals folder \u2014 ${teamId}

Create one markdown file per goal in this directory.

Recommended file naming:
- short, kebab-case, no leading numbers (e.g. \`reduce-support-backlog.md\`)

Link goals from:
- notes/GOALS.md
`,
    mode
  );
  if (qaChecklist) {
    await writeFileSafely(
      import_node_path18.default.join(notesDir, "QA_CHECKLIST.md"),
      `# QA Checklist \u2014 ${teamId}

Use this when verifying a ticket before moving it from work/testing/ \u2192 work/done/.

## Checklist
- [ ] Repro steps verified
- [ ] Acceptance criteria met
- [ ] No regressions in adjacent flows
- [ ] Notes/screenshots attached (if relevant)

## Verified by
- QA: (name)
- Date: (YYYY-MM-DD)

## Links
- Ticket: (path or URL)
- PR/Commit: (optional)
`,
      mode
    );
  }
  const defaultTicketsMd = `# Tickets \u2014 ${teamId}

## Naming
- Backlog tickets live in work/backlog/
- In-progress tickets live in work/in-progress/
- Testing tickets live in work/testing/
- Done tickets live in work/done/
- Filename ordering is the queue: 0001-..., 0002-...

## Stages
- backlog \u2192 in-progress \u2192 testing \u2192 done

## QA handoff
- When work is ready for QA: move the ticket to \`work/testing/\` and assign to test.

## QA access (runnable UI)
If QA needs a runnable UI (e.g. ClawKitchen) to verify a ticket, include an access block in the ticket (or link to where it lives):
- Kitchen URL:
- Auth method: (e.g. HTTP Basic)
- Username:
- Password / token:
- Any required VPN/Tailscale notes:

## Required fields
Each ticket should include:
- Title
- Context
- Requirements
- Acceptance criteria
- Owner (dev/devops/lead/test)
- Status (queued/in-progress/testing/done)

## Example

\`\`\`md
# 0001-example-ticket

Owner: dev
Status: queued

## Context
...

## Requirements
- ...

## Acceptance criteria
- ...

## QA access (runnable UI)
- Kitchen URL: http://<host>:7777
- Auth method: HTTP Basic
- Username: kitchen
- Password: <token>
\`\`\`
`;
  const ticketsTemplate = recipe?.templates?.["tickets"];
  const ticketsMd = typeof ticketsTemplate === "string" ? renderTemplate(ticketsTemplate, { teamId, teamDir }) : defaultTicketsMd;
  await writeFileSafely(import_node_path18.default.join(teamDir, "TICKETS.md"), ticketsMd, mode);
}
async function writeTeamLevelRecipeFiles(opts) {
  const { recipe, teamId, teamDir, overwrite } = opts;
  const files = recipe.files ?? [];
  if (!files.length) return;
  const mode = overwrite ? "overwrite" : "createOnly";
  const templates = recipe.templates ?? {};
  const vars = { teamId, teamDir };
  for (const f of files) {
    const filePath = String(f.path ?? "").trim();
    if (!filePath) continue;
    if (!filePath.startsWith("shared-context/") && !filePath.startsWith("notes/")) continue;
    const templateKey = String(f.template ?? "").trim();
    if (!templateKey) continue;
    const templateContent = templates[templateKey];
    if (typeof templateContent !== "string") continue;
    const rendered = renderTemplate(templateContent, vars);
    const target = import_node_path18.default.join(teamDir, filePath);
    await writeFileSafely(target, rendered, mode);
  }
}
async function writeTeamMetadataAndConfig(opts) {
  const { api, teamId, teamDir, recipe, results, applyConfig, overwrite } = opts;
  const mode = overwrite ? "overwrite" : "createOnly";
  await writeFileSafely(
    import_node_path18.default.join(teamDir, "TEAM.md"),
    `# ${teamId}

Shared workspace for this agent team.

## Folders
- inbox/ \u2014 requests
- outbox/ \u2014 deliverables
- shared-context/ \u2014 curated shared context + append-only agent outputs
- shared/ \u2014 legacy shared artifacts (back-compat)
- notes/ \u2014 plan + status
- work/ \u2014 working files
`,
    mode
  );
  await writeJsonFile(import_node_path18.default.join(teamDir, "team.json"), {
    teamId,
    recipeId: recipe.id,
    recipeName: recipe.name ?? "",
    scaffoldedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (applyConfig) {
    await applyAgentSnippetsToOpenClawConfig(api, results.map((x) => x.next.configSnippet));
  }
}
async function scaffoldTeamAgents(api, recipe, teamId, teamDir, rolesDir, overwrite, heartbeatEnabledRoles) {
  const agents = recipe.agents ?? [];
  if (!agents.length) throw new Error("Team recipe must include agents[]");
  const baseFiles = (recipe.files ?? []).length ? recipe.files ?? [] : [
    { path: "SOUL.md", template: "soul", mode: "createOnly" },
    { path: "AGENTS.md", template: "agents", mode: "createOnly" },
    { path: "TOOLS.md", template: "tools", mode: "createOnly" },
    { path: "STATUS.md", template: "status", mode: "createOnly" },
    { path: "NOTES.md", template: "notes", mode: "createOnly" }
  ];
  const results = [];
  for (const a of agents) {
    const role = a.role;
    const agentId = a.agentId ?? `${teamId}-${role}`;
    const agentName = a.name ?? `${teamId} ${role}`;
    const roleFiles = baseFiles.filter((f) => !String(f.path).startsWith("shared-context/")).map((f) => ({
      ...f,
      template: String(f.template).includes(".") ? f.template : `${role}.${f.template}`
    }));
    const scopedRecipe = {
      id: `${recipe.id}:${role}`,
      name: agentName,
      kind: "agent",
      requiredSkills: recipe.requiredSkills,
      optionalSkills: recipe.optionalSkills,
      templates: recipe.templates,
      files: roleFiles,
      tools: a.tools ?? recipe.tools
    };
    const roleDir = import_node_path18.default.join(rolesDir, role);
    const r = await scaffoldAgentFromRecipe(api, scopedRecipe, {
      agentId,
      agentName,
      update: overwrite,
      filesRootDir: roleDir,
      // IMPORTANT: All roles (including lead) use per-role workspaces so they get role-specific bootstrap files.
      // This ensures leads get their role-specific AGENTS.md, SOUL.md, MEMORY.md for proper identity context.
      workspaceRootDir: roleDir,
      vars: { teamId, teamDir, role, agentId, agentName, roleDir }
    });
    {
      const mode = overwrite ? "overwrite" : "createOnly";
      const yyyyMmDd = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      await ensureDir(import_node_path18.default.join(roleDir, "memory"));
      await writeFileSafely(
        import_node_path18.default.join(roleDir, "MEMORY.md"),
        `# MEMORY \u2014 ${teamId} (${role})

Curated long-term memory for this role.

- (empty)
`,
        mode
      );
      await writeFileSafely(
        import_node_path18.default.join(roleDir, "memory", `${yyyyMmDd}.md`),
        `# ${yyyyMmDd} \u2014 ${teamId} (${role})

- (empty)
`,
        mode
      );
      await ensureDir(import_node_path18.default.join(roleDir, "agent-outputs"));
      await writeFileSafely(
        import_node_path18.default.join(roleDir, "agent-outputs", "README.md"),
        `# Agent outputs \u2014 ${teamId} (${role})

Append-only artifacts/logs produced by this role.

Recommended:
- One file per day (e.g. "${yyyyMmDd}.md")
- Or one file per ticket (e.g. "0175-run-detail-timeline.md")
`,
        mode
      );
    }
    if (heartbeatEnabledRoles.has(String(role))) {
      const mode = overwrite ? "overwrite" : "createOnly";
      const hb = `# HEARTBEAT \u2014 ${teamId} (${role})

Keep this file small. It is loaded frequently.

## Checklist
- [ ] Check \`inbox/\` for new requests
- [ ] Check \`work/in-progress/\` for stuck tickets (blocked? needs review?)
- [ ] Append any material updates to \`notes/status.md\` (append-only)
- [ ] If nothing changed, stay quiet (no message)
`;
      await writeFileSafely(import_node_path18.default.join(roleDir, "HEARTBEAT.md"), hb, mode);
    }
    results.push({ role, agentId, ...r });
  }
  return results;
}
function buildHeartbeatCronJobsFromTeamRecipe(opts) {
  const { teamId, recipe, enableHeartbeat } = opts;
  const agents = recipe.agents ?? [];
  const enabledRoles = /* @__PURE__ */ new Set();
  if (!enableHeartbeat) return { cronJobs: [], enabledRoles, note: "disabled" };
  const heartbeatPrompt = "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.";
  const defaultLeadSchedule = "*/30 * * * *";
  const hasAnyExplicitHeartbeatBlock = agents.some((a) => a && typeof a === "object" && "heartbeat" in a);
  const cronJobs = [];
  if (hasAnyExplicitHeartbeatBlock) {
    for (const a of agents) {
      if (!a || typeof a !== "object") continue;
      const obj = a;
      const role = typeof obj.role === "string" ? obj.role.trim() : "";
      if (!role) continue;
      const hbRaw = obj.heartbeat;
      if (!hbRaw || typeof hbRaw !== "object") continue;
      const hb = hbRaw;
      if (!hb.enabled) continue;
      const agentId = typeof obj.agentId === "string" && obj.agentId.trim() ? obj.agentId.trim() : `${teamId}-${role}`;
      const schedule = typeof hb.schedule === "string" && hb.schedule.trim() ? hb.schedule.trim() : defaultLeadSchedule;
      const channel = hb.channel != null ? String(hb.channel) : role === "lead" ? "last" : void 0;
      enabledRoles.add(role);
      cronJobs.push({
        id: `heartbeat-${role}`,
        name: `{{teamId}} \u2022 heartbeat \u2022 ${role}`,
        schedule,
        message: heartbeatPrompt,
        agentId,
        ...channel ? { channel } : {}
      });
    }
    return { cronJobs, enabledRoles, note: "explicit" };
  }
  enabledRoles.add("lead");
  cronJobs.push({
    id: "heartbeat-lead",
    name: "{{teamId}} \u2022 heartbeat",
    schedule: defaultLeadSchedule,
    message: heartbeatPrompt,
    agentId: `${teamId}-lead`,
    channel: "last"
  });
  return { cronJobs, enabledRoles, note: "defaults" };
}
async function handleScaffoldTeam(api, options) {
  const validation = await validateRecipeAndSkills(api, options.recipeId, "team");
  if (!validation.ok) {
    return {
      ok: false,
      missingSkills: validation.missingSkills,
      installCommands: validation.installCommands
    };
  }
  const { loaded, recipe, cfg, workspaceRoot: baseWorkspace } = validation;
  for (const issue of lintRecipe(recipe)) {
    if (issue.level === "warn") console.warn(`[recipes] WARN ${issue.code}: ${issue.message}`);
    else console.warn(`[recipes] ${issue.code}: ${issue.message}`);
  }
  const teamId = String(options.teamId);
  const teamDir = import_node_path18.default.resolve(baseWorkspace, "..", `workspace-${teamId}`);
  await ensureDir(teamDir);
  const recipesDir = import_node_path18.default.join(baseWorkspace, cfg.workspaceRecipesDir);
  await ensureDir(recipesDir);
  const overwriteRecipe = !!options.overwriteRecipe;
  const autoIncrement = !!options.autoIncrement;
  const explicitRecipeId = typeof options.recipeIdExplicit === "string" ? String(options.recipeIdExplicit).trim() : "";
  const baseRecipeId = explicitRecipeId || teamId;
  const workspaceRecipeId = await pickRecipeId({
    baseId: baseRecipeId,
    recipesDir,
    overwriteRecipe,
    autoIncrement,
    isTaken: (id) => recipeIdTakenForTeam(recipesDir, id),
    getSuggestions: (id) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      return [`${id}-v2`, `${id}-${today}`, `${id}-alt`];
    },
    getConflictError: (id, suggestions) => `Workspace recipe already exists: recipes/${id}.md. Choose --recipe-id (e.g. ${suggestions.join(", ")}) or --auto-increment or --overwrite-recipe.`
  });
  await writeWorkspaceRecipeFile(loaded, recipesDir, workspaceRecipeId, overwriteRecipe);
  const rolesDir = import_node_path18.default.join(teamDir, "roles");
  const notesDir = import_node_path18.default.join(teamDir, "notes");
  const workDir = import_node_path18.default.join(teamDir, "work");
  const overwrite = !!options.overwrite;
  const sharedContextDir = import_node_path18.default.join(teamDir, "shared-context");
  const goalsDir = import_node_path18.default.join(notesDir, "goals");
  const qaChecklist = Boolean(recipe.qaChecklist ?? false) || (recipe.agents ?? []).some((a) => String(a.role ?? "").toLowerCase() === "test");
  await ensureTeamDirectoryStructure(teamDir, sharedContextDir, notesDir, workDir);
  await writeTeamBootstrapFiles({
    teamId,
    teamDir,
    sharedContextDir,
    notesDir,
    goalsDir,
    recipe,
    overwrite,
    qaChecklist
  });
  await writeTeamLevelRecipeFiles({ recipe, teamId, teamDir, overwrite });
  const heartbeat = buildHeartbeatCronJobsFromTeamRecipe({
    teamId,
    recipe,
    enableHeartbeat: Boolean(options.enableHeartbeat)
  });
  const results = await scaffoldTeamAgents(api, recipe, teamId, teamDir, rolesDir, overwrite, heartbeat.enabledRoles);
  await writeTeamMetadataAndConfig({ api, teamId, teamDir, recipe, results, applyConfig: !!options.applyConfig, overwrite });
  const recipeForCron = heartbeat.cronJobs.length ? {
    ...recipe,
    cronJobs: [...recipe.cronJobs ?? [], ...heartbeat.cronJobs]
  } : recipe;
  const cron = await reconcileRecipeCronJobs({
    api,
    recipe: recipeForCron,
    scope: { kind: "team", teamId, recipeId: recipe.id, stateDir: teamDir },
    cronInstallation: cfg.cronInstallation
  });
  scheduleManifestRegeneration(api);
  return {
    ok: true,
    teamId,
    teamDir,
    agents: results,
    cron,
    next: {
      note: options.applyConfig ? "agents.list[] updated in openclaw config" : "Run again with --apply-config to write agents into openclaw config."
    }
  };
}
async function handleMigrateTeamPlan(api, options) {
  const teamId = String(options.teamId);
  if (!teamId.endsWith("-team")) throw new Error("teamId must end with -team");
  const mode = String(options.mode ?? "move");
  if (mode !== "move" && mode !== "copy") throw new Error("--mode must be move|copy");
  const baseWorkspace = resolveWorkspaceRoot(api);
  const legacyTeamDir = import_node_path18.default.resolve(baseWorkspace, "teams", teamId);
  const legacyAgentsDir = import_node_path18.default.resolve(baseWorkspace, "agents");
  const destTeamDir = import_node_path18.default.resolve(baseWorkspace, "..", `workspace-${teamId}`);
  const destRolesDir = import_node_path18.default.join(destTeamDir, "roles");
  const exists = async (p) => fileExists(p);
  const plan = {
    teamId,
    mode,
    legacy: { teamDir: legacyTeamDir, agentsDir: legacyAgentsDir },
    dest: { teamDir: destTeamDir, rolesDir: destRolesDir },
    steps: [],
    agentIds: []
  };
  const legacyTeamExists = await exists(legacyTeamDir);
  if (!legacyTeamExists) throw new Error(`Legacy team directory not found: ${legacyTeamDir}`);
  const destExists = await exists(destTeamDir);
  if (destExists && !options.overwrite) throw new Error(`Destination already exists: ${destTeamDir} (re-run with --overwrite to merge)`);
  plan.steps.push({ kind: "teamDir", from: legacyTeamDir, to: destTeamDir });
  const legacyAgentsExist = await exists(legacyAgentsDir);
  let legacyAgentFolders = [];
  if (legacyAgentsExist) {
    legacyAgentFolders = (await import_promises11.default.readdir(legacyAgentsDir)).filter((x) => x.startsWith(`${teamId}-`));
  }
  for (const folder of legacyAgentFolders) {
    const agentId = folder;
    const role = folder.slice((teamId + "-").length);
    const from = import_node_path18.default.join(legacyAgentsDir, folder);
    const to = import_node_path18.default.join(destRolesDir, role);
    plan.agentIds.push(agentId);
    plan.steps.push({ kind: "roleDir", agentId, role, from, to });
  }
  return plan;
}
async function executeMigrateTeamPlan(api, plan) {
  const copyDirRecursive = async (src, dst) => {
    await ensureDir(dst);
    const entries = await import_promises11.default.readdir(src, { withFileTypes: true });
    for (const ent of entries) {
      const s = import_node_path18.default.join(src, ent.name);
      const d = import_node_path18.default.join(dst, ent.name);
      if (ent.isDirectory()) await copyDirRecursive(s, d);
      else if (ent.isSymbolicLink()) {
        const link = await import_promises11.default.readlink(s);
        await import_promises11.default.symlink(link, d);
      } else {
        await ensureDir(import_node_path18.default.dirname(d));
        await import_promises11.default.copyFile(s, d);
      }
    }
  };
  const removeDirRecursive = async (p) => {
    await import_promises11.default.rm(p, { recursive: true, force: true });
  };
  const moveDir = async (src, dst) => {
    await ensureDir(import_node_path18.default.dirname(dst));
    try {
      await import_promises11.default.rename(src, dst);
    } catch {
      await copyDirRecursive(src, dst);
      await removeDirRecursive(src);
    }
  };
  const { legacy, dest } = plan;
  if (plan.mode === "copy") {
    await copyDirRecursive(legacy.teamDir, dest.teamDir);
  } else {
    await moveDir(legacy.teamDir, dest.teamDir);
  }
  await ensureDir(dest.rolesDir);
  for (const step of plan.steps.filter((s) => s.kind === "roleDir")) {
    if (!step.from || !step.to || !await fileExists(step.from)) continue;
    if (plan.mode === "copy") await copyDirRecursive(step.from, step.to);
    else await moveDir(step.from, step.to);
  }
  const agentSnippets = plan.agentIds.map((agentId) => ({
    id: agentId,
    workspace: dest.teamDir
  }));
  if (agentSnippets.length) {
    await applyAgentSnippetsToOpenClawConfig(api, agentSnippets);
  }
  scheduleManifestRegeneration(api);
  return { ok: true, migrated: plan.teamId, destTeamDir: dest.teamDir, agentIds: plan.agentIds };
}
async function handleRemoveTeam(api, options) {
  const teamId = String(options.teamId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const cronJobsPath = import_node_path18.default.resolve(workspaceRoot, "..", "cron", "jobs.json");
  const cfgObj = await loadOpenClawConfig(api);
  const cronStore = await loadCronStore(cronJobsPath);
  const teamDir = import_node_path18.default.resolve(workspaceRoot, "..", `workspace-${teamId}`);
  const cronMappingPath = import_node_path18.default.join(teamDir, "notes", "cron-jobs.json");
  let installedCronIds = [];
  try {
    const raw = await import_promises11.default.readFile(cronMappingPath, "utf8");
    const json = JSON.parse(raw);
    installedCronIds = Object.values(json.entries ?? {}).filter((e) => e && !e.orphaned).map((e) => String(e.installedCronId ?? "").trim()).filter(Boolean);
  } catch {
    installedCronIds = [];
  }
  const plan = await buildRemoveTeamPlan({
    teamId,
    workspaceRoot,
    openclawConfigPath: "(managed)",
    cronJobsPath,
    cfgObj,
    cronStore,
    installedCronIds
  });
  if (options.plan) return { ok: true, plan };
  if (!options.yes && !process.stdin.isTTY) {
    return { ok: false, plan, aborted: "non-interactive" };
  }
  if (!options.yes && process.stdin.isTTY) {
    const ok = await promptYesNo(
      `This will DELETE workspace-${teamId}, remove matching agents from openclaw config, and remove stamped cron jobs.`
    );
    if (!ok) return { ok: false, plan, aborted: "user-declined" };
  }
  const result = await executeRemoveTeamPlan({
    plan,
    includeAmbiguous: Boolean(options.includeAmbiguous),
    cfgObj,
    cronStore
  });
  await writeOpenClawConfig(api, cfgObj);
  await saveCronStore(cronJobsPath, cronStore);
  scheduleManifestRegeneration(api);
  return { ok: true, result };
}

// src/handlers/team-add-role.ts
var import_node_path19 = __toESM(require("node:path"));
var import_promises12 = __toESM(require("node:fs/promises"));
init_fs_utils();
async function handleAddRoleToTeam(api, options) {
  const teamId = String(options.teamId);
  const role = String(options.role);
  const validation = await validateRecipeAndSkills(api, options.recipeId, "agent");
  if (!validation.ok) {
    return {
      ok: false,
      missingSkills: validation.missingSkills,
      installCommands: validation.installCommands
    };
  }
  const { recipe, cfg } = validation;
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = import_node_path19.default.resolve(workspaceRoot, "..", `workspace-${teamId}`);
  try {
    const st = await import_promises12.default.stat(teamDir);
    if (!st.isDirectory()) throw new Error("not a directory");
  } catch {
    throw new Error(`Team workspace not found: ${teamDir}. Scaffold the team first (openclaw recipes scaffold-team ...)`);
  }
  const rolesDir = import_node_path19.default.join(teamDir, "roles");
  const roleDir = import_node_path19.default.join(rolesDir, role);
  await ensureDir(roleDir);
  const agentId = String(options.agentId ?? `${teamId}-${role}`);
  const scaffold = await scaffoldAgentFromRecipe(api, recipe, {
    agentId,
    agentName: `${teamId} ${role}`,
    update: !!options.overwrite,
    filesRootDir: roleDir,
    workspaceRootDir: teamDir,
    vars: {
      teamId,
      teamDir,
      role,
      agentId,
      agentName: `${teamId} ${role}`
    }
  });
  if (options.applyConfig) {
    await applyAgentSnippetsToOpenClawConfig(api, [scaffold.next.configSnippet]);
  }
  const cron = options.installCron ? await reconcileRecipeCronJobs({
    api,
    recipe,
    scope: { kind: "team", teamId, recipeId: recipe.id, stateDir: teamDir },
    cronInstallation: cfg.cronInstallation
  }) : { ok: true, changed: false, note: "cron-skipped" };
  return {
    ok: true,
    teamId,
    teamDir,
    role,
    roleDir,
    agentId,
    files: scaffold.fileResults,
    cron,
    next: {
      note: options.applyConfig ? "agents.list[] updated in openclaw config (restart gateway if required)." : "Re-run with --apply-config to write the agent into openclaw config."
    }
  };
}

// src/lib/workflows/workflow-runner.ts
var import_promises20 = __toESM(require("node:fs/promises"));
var import_node_path26 = __toESM(require("node:path"));
var import_node_crypto5 = __toESM(require("node:crypto"));

// src/lib/workflows/workflow-queue.ts
var import_promises13 = __toESM(require("node:fs/promises"));
var import_node_path20 = __toESM(require("node:path"));
var import_node_crypto2 = __toESM(require("node:crypto"));
async function ensureDir2(p) {
  await import_promises13.default.mkdir(p, { recursive: true });
}
async function fileExists2(p) {
  try {
    await import_promises13.default.stat(p);
    return true;
  } catch {
    return false;
  }
}
function queueDir(teamDir) {
  return import_node_path20.default.join(teamDir, "shared-context", "workflow-queues");
}
function claimsDir(teamDir) {
  return import_node_path20.default.join(queueDir(teamDir), "claims");
}
function claimPathFor(teamDir, agentId, taskId) {
  return import_node_path20.default.join(claimsDir(teamDir), `${agentId}.${taskId}.json`);
}
async function loadClaim(teamDir, agentId, taskId) {
  const p = claimPathFor(teamDir, agentId, taskId);
  try {
    const raw = await import_promises13.default.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function isExpiredClaim(claim, fallbackLeaseSeconds) {
  if (!claim) return false;
  const effectiveLease = typeof claim.leaseSeconds === "number" ? claim.leaseSeconds : fallbackLeaseSeconds;
  const claimedAtMs = claim.claimedAt ? Date.parse(String(claim.claimedAt)) : NaN;
  return typeof effectiveLease === "number" && Number.isFinite(claimedAtMs) && Date.now() - claimedAtMs > effectiveLease * 1e3;
}
async function releaseTaskClaim(teamDir, agentId, taskId) {
  try {
    await import_promises13.default.unlink(claimPathFor(teamDir, agentId, taskId));
  } catch {
  }
}
function queuePathFor(teamDir, agentId) {
  return import_node_path20.default.join(queueDir(teamDir), `${agentId}.jsonl`);
}
function statePathFor(teamDir, agentId) {
  return import_node_path20.default.join(queueDir(teamDir), `${agentId}.state.json`);
}
async function enqueueTask(teamDir, agentId, task2) {
  await ensureDir2(queueDir(teamDir));
  const entry = {
    id: import_node_crypto2.default.randomBytes(8).toString("hex"),
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...task2
  };
  const p = queuePathFor(teamDir, agentId);
  const st = await loadState(teamDir, agentId);
  let fileSize = 0;
  try {
    fileSize = (await import_promises13.default.stat(p)).size;
  } catch {
  }
  if (st.offsetBytes > 0 && st.offsetBytes >= fileSize) {
    await writeState(teamDir, agentId, { offsetBytes: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  }
  await import_promises13.default.appendFile(p, JSON.stringify(entry) + "\n", "utf8");
  return { ok: true, path: p, task: entry };
}
async function hasPendingTaskFor(teamDir, agentId, match) {
  const qPath = queuePathFor(teamDir, agentId);
  if (!await fileExists2(qPath)) return false;
  const st = await loadState(teamDir, agentId);
  let raw;
  try {
    raw = await import_promises13.default.readFile(qPath, "utf8");
  } catch {
    return false;
  }
  const tail = raw.slice(st.offsetBytes);
  for (const line of tail.split("\n")) {
    if (!line.trim()) continue;
    try {
      const t = JSON.parse(line);
      if (t && t.runId === match.runId && t.nodeId === match.nodeId) return true;
    } catch {
      continue;
    }
  }
  return false;
}
async function loadState(teamDir, agentId) {
  const p = statePathFor(teamDir, agentId);
  if (!await fileExists2(p)) return { offsetBytes: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  try {
    const raw = await import_promises13.default.readFile(p, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.offsetBytes !== "number") throw new Error("invalid");
    return parsed;
  } catch {
    return { offsetBytes: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function writeState(teamDir, agentId, st) {
  await ensureDir2(queueDir(teamDir));
  const p = statePathFor(teamDir, agentId);
  await import_promises13.default.writeFile(p, JSON.stringify(st, null, 2), "utf8");
}
async function dequeueNextTask(teamDir, agentId, opts) {
  const qPath = queuePathFor(teamDir, agentId);
  if (!await fileExists2(qPath)) {
    return { ok: true, task: null, message: "Queue file not present." };
  }
  let st = await loadState(teamDir, agentId);
  const workerId = String(opts?.workerId ?? `worker:${process.pid}`);
  const leaseSeconds = typeof opts?.leaseSeconds === "number" ? opts.leaseSeconds : void 0;
  async function tryClaimTask(t, startOffsetBytes, endOffsetBytes, advanceState) {
    await ensureDir2(claimsDir(teamDir));
    const claimPath = claimPathFor(teamDir, agentId, t.id);
    async function writeClaim(overwrite) {
      const claim = {
        taskId: t.id,
        agentId,
        workerId,
        claimedAt: (/* @__PURE__ */ new Date()).toISOString(),
        leaseSeconds
      };
      await import_promises13.default.writeFile(claimPath, JSON.stringify(claim, null, 2), { encoding: "utf8", flag: overwrite ? "w" : "wx" });
    }
    try {
      await writeClaim(false);
    } catch {
      const existing = await loadClaim(teamDir, agentId, t.id);
      if (String(existing?.workerId ?? "") !== workerId) {
        if (!isExpiredClaim(existing, leaseSeconds)) {
          if (advanceState) {
            await writeState(teamDir, agentId, { offsetBytes: endOffsetBytes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
          }
          return null;
        }
        await writeClaim(true);
      }
    }
    if (advanceState) {
      await writeState(teamDir, agentId, { offsetBytes: endOffsetBytes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    return {
      ok: true,
      task: { task: t, startOffsetBytes, endOffsetBytes }
    };
  }
  const fh = await import_promises13.default.open(qPath, "r");
  try {
    const stat2 = await fh.stat();
    if (st.offsetBytes > stat2.size) {
      st = { offsetBytes: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await writeState(teamDir, agentId, st);
    }
    if (st.offsetBytes < stat2.size) {
      const toRead = Math.min(stat2.size - st.offsetBytes, 256 * 1024);
      const buf = Buffer.alloc(toRead);
      const { bytesRead } = await fh.read(buf, 0, toRead, st.offsetBytes);
      const chunk = buf.subarray(0, bytesRead).toString("utf8");
      const lines = chunk.split("\n");
      const fullLines = lines.slice(0, -1);
      let cursor2 = st.offsetBytes;
      for (const line of fullLines) {
        const lineBytes = Buffer.byteLength(line + "\n");
        const startOffsetBytes = cursor2;
        const endOffsetBytes = cursor2 + lineBytes;
        cursor2 = endOffsetBytes;
        if (!line.trim()) {
          await writeState(teamDir, agentId, { offsetBytes: cursor2, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
          continue;
        }
        let t = null;
        try {
          t = JSON.parse(line);
        } catch {
          await writeState(teamDir, agentId, { offsetBytes: cursor2, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
          continue;
        }
        if (!t || !t.id || !t.runId || !t.nodeId) {
          await writeState(teamDir, agentId, { offsetBytes: cursor2, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
          continue;
        }
        const claimed = await tryClaimTask(t, startOffsetBytes, endOffsetBytes, true);
        if (claimed) return claimed;
      }
    }
    const fullRaw = await import_promises13.default.readFile(qPath, "utf8");
    let cursor = 0;
    for (const line of fullRaw.split("\n")) {
      const lineBytes = Buffer.byteLength(line + "\n");
      const startOffsetBytes = cursor;
      const endOffsetBytes = cursor + lineBytes;
      cursor = endOffsetBytes;
      if (!line.trim()) continue;
      let t = null;
      try {
        t = JSON.parse(line);
      } catch {
        continue;
      }
      if (!t || !t.id || !t.runId || !t.nodeId) continue;
      const existing = await loadClaim(teamDir, agentId, t.id);
      if (!existing) continue;
      if (String(existing.workerId ?? "") !== workerId && !isExpiredClaim(existing, leaseSeconds)) continue;
      const claimed = await tryClaimTask(t, startOffsetBytes, endOffsetBytes, false);
      if (claimed) return claimed;
    }
    return { ok: true, task: null, message: "No new or recoverable tasks." };
  } finally {
    await fh.close();
  }
}
async function compactQueue(teamDir, agentId, opts) {
  const minWaste = typeof opts?.minWasteBytes === "number" ? opts.minWasteBytes : 4096;
  const qPath = queuePathFor(teamDir, agentId);
  if (!await fileExists2(qPath)) return { ok: true, compacted: false, reason: "no queue file" };
  const st = await loadState(teamDir, agentId);
  if (st.offsetBytes < minWaste) return { ok: true, compacted: false, reason: "below threshold" };
  const raw = await import_promises13.default.readFile(qPath);
  const remaining = raw.subarray(st.offsetBytes);
  const tmpPath = qPath + ".compact.tmp";
  await import_promises13.default.writeFile(tmpPath, remaining);
  await import_promises13.default.rename(tmpPath, qPath);
  await writeState(teamDir, agentId, { offsetBytes: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  try {
    const claimsBase = claimsDir(teamDir);
    if (await fileExists2(claimsBase)) {
      const prefix = `${agentId}.`;
      const files = (await import_promises13.default.readdir(claimsBase)).filter((f) => f.startsWith(prefix) && f.endsWith(".json"));
      for (const f of files) {
        try {
          const claimRaw = await import_promises13.default.readFile(import_node_path20.default.join(claimsBase, f), "utf8");
          const claim = JSON.parse(claimRaw);
          if (isExpiredClaim(claim, 120)) {
            await import_promises13.default.unlink(import_node_path20.default.join(claimsBase, f));
          }
        } catch {
        }
      }
    }
  } catch {
  }
  return { ok: true, compacted: true, removedBytes: st.offsetBytes, remainingBytes: remaining.length };
}
var TERMINAL_STATUSES = /* @__PURE__ */ new Set(["completed", "error", "canceled", "done", "failed"]);
async function cleanupQueues(teamDir) {
  const qDir = queueDir(teamDir);
  const runsDir = import_node_path20.default.join(teamDir, "shared-context", "workflow-runs");
  let files;
  try {
    files = (await import_promises13.default.readdir(qDir)).filter((f) => f.endsWith(".jsonl"));
  } catch {
    return { ok: true, queuesProcessed: 0, tasksRemoved: 0, tasksKept: 0 };
  }
  let totalRemoved = 0;
  let totalKept = 0;
  for (const file of files) {
    const qPath = import_node_path20.default.join(qDir, file);
    let raw;
    try {
      raw = await import_promises13.default.readFile(qPath, "utf8");
    } catch {
      continue;
    }
    const lines = raw.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    const kept = [];
    for (const line of lines) {
      try {
        const task2 = JSON.parse(line);
        const runPath = import_node_path20.default.join(runsDir, task2.runId, "run.json");
        let remove = false;
        try {
          const runRaw = await import_promises13.default.readFile(runPath, "utf8");
          const run = JSON.parse(runRaw);
          if (TERMINAL_STATUSES.has(run.status ?? "")) remove = true;
        } catch {
          remove = true;
        }
        if (remove) {
          totalRemoved++;
        } else {
          kept.push(line);
          totalKept++;
        }
      } catch {
        totalRemoved++;
      }
    }
    if (kept.length !== lines.length) {
      await import_promises13.default.writeFile(qPath, kept.length ? kept.join("\n") + "\n" : "", "utf8");
      const agentId = file.replace(/\.jsonl$/, "");
      await writeState(teamDir, agentId, { offsetBytes: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  return { ok: true, queuesProcessed: files.length, tasksRemoved: totalRemoved, tasksKept: totalKept };
}

// src/lib/workflows/workflow-runner-io.ts
var import_promises14 = __toESM(require("node:fs/promises"));
async function readTextFile(filePath) {
  return import_promises14.default.readFile(filePath, "utf8");
}
async function readJsonFile2(filePath) {
  return JSON.parse(await readTextFile(filePath));
}

// src/lib/workflows/workflow-utils.ts
var import_promises15 = __toESM(require("node:fs/promises"));
var import_node_path21 = __toESM(require("node:path"));

// src/lib/workflows/outbound-sanitize.ts
function sanitizeOutboundPostText(input) {
  const raw = String(input ?? "");
  if (!raw.trim()) return "";
  const lines = raw.split(/\r?\n/);
  const shouldDrop = (line) => {
    const l = line.trim();
    if (!l) return false;
    if (/\bdraft\s*only\b/i.test(l)) return true;
    if (/\bdo\s+not\s+post\b/i.test(l)) return true;
    if (/\bdo\s+not\s+publish\b/i.test(l)) return true;
    if (/\bnot\s+for\s+posting\b/i.test(l)) return true;
    if (/\binternal\s+only\b/i.test(l)) return true;
    if (/\bneeds\s+approval\b/i.test(l)) return true;
    if (/\bapproval\s+required\b/i.test(l)) return true;
    return false;
  };
  const kept = lines.filter((l) => !shouldDrop(l));
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// src/lib/workflows/workflow-utils.ts
function isRecord(v) {
  return !!v && typeof v == "object" && !Array.isArray(v);
}
function asRecord(v) {
  return isRecord(v) ? v : {};
}
function asString(v, fallback = "") {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}
function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function normalizeWorkflow(raw) {
  const w = asRecord(raw);
  const id = asString(w["id"]).trim();
  if (!id) throw new Error("Workflow missing required field: id");
  const meta = asRecord(w["meta"]);
  const approvalBindingId = asString(meta["approvalBindingId"]).trim();
  const nodes = asArray(w["nodes"]).map((nRaw) => {
    const n = asRecord(nRaw);
    const config = asRecord(n["config"]);
    const kind = asString(n["kind"] ?? n["type"]).trim();
    const assignedToRec = asRecord(n["assignedTo"]);
    const agentId = asString(assignedToRec["agentId"] ?? config["agentId"]).trim();
    const assignedTo = agentId ? { agentId } : void 0;
    const actionRaw = asRecord(n["action"]);
    const action = {
      ...actionRaw,
      // LLM: allow either promptTemplatePath (preferred) or inline promptTemplate string
      ...config["promptTemplate"] != null ? { promptTemplate: asString(config["promptTemplate"]) } : {},
      ...config["promptTemplatePath"] != null ? { promptTemplatePath: asString(config["promptTemplatePath"]) } : {},
      ...config["model"] != null ? { model: asString(config["model"]) } : {},
      ...config["provider"] != null ? { provider: asString(config["provider"]) } : {},
      // Tool
      ...config["tool"] != null ? { tool: asString(config["tool"]) } : {},
      ...isRecord(config["args"]) ? { args: config["args"] } : {},
      // Human approval
      ...config["approvalBindingId"] != null ? { approvalBindingId: asString(config["approvalBindingId"]) } : {}
    };
    if (kind == "human_approval" && !asString(action["approvalBindingId"]).trim() && approvalBindingId) {
      action["approvalBindingId"] = approvalBindingId;
    }
    return {
      ...n,
      id: asString(n["id"]).trim(),
      kind,
      assignedTo,
      action,
      // Keep config around for debugging/back-compat, but don't depend on it.
      config
    };
  });
  const edges = Array.isArray(w["edges"]) ? asArray(w["edges"]).map((eRaw) => {
    const e = asRecord(eRaw);
    return {
      ...e,
      from: asString(e["from"]).trim(),
      to: asString(e["to"]).trim(),
      on: asString(e["on"]).trim() || "success"
    };
  }) : void 0;
  return { ...w, id, nodes, ...edges ? { edges } : {} };
}
function isoCompact(ts = /* @__PURE__ */ new Date()) {
  return ts.toISOString().toLowerCase().replace(/[:.]/g, "-");
}
function assertLane(lane) {
  if (lane !== "backlog" && lane !== "in-progress" && lane !== "testing" && lane !== "done") {
    throw new Error(`Invalid lane: ${lane}`);
  }
}
async function ensureDir3(p) {
  await import_promises15.default.mkdir(p, { recursive: true });
}
async function fileExists3(p) {
  try {
    await import_promises15.default.stat(p);
    return true;
  } catch {
    return false;
  }
}
async function listTicketNumbers(teamDir) {
  const workDir = import_node_path21.default.join(teamDir, "work");
  const lanes = ["backlog", "in-progress", "testing", "done"];
  const nums = [];
  for (const lane of lanes) {
    const laneDir2 = import_node_path21.default.join(workDir, lane);
    if (!await fileExists3(laneDir2)) continue;
    const files = await import_promises15.default.readdir(laneDir2);
    for (const f of files) {
      const m = f.match(/^(\d{4})-/);
      if (m) nums.push(Number(m[1]));
    }
  }
  return nums;
}
async function nextTicketNumber(teamDir) {
  const nums = await listTicketNumbers(teamDir);
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  return String(next).padStart(4, "0");
}
function laneToStatus(lane) {
  if (lane === "backlog") return "queued";
  if (lane === "in-progress") return "in-progress";
  if (lane === "testing") return "testing";
  return "done";
}
function templateReplace(input, vars) {
  let out = String(input ?? "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}
var FILE_INCLUDE_MAX_BYTES_DEFAULT = 256 * 1024;
async function expandFileIncludes(input, teamDir, opts = {}) {
  const text = String(input ?? "");
  const pattern = /\{\{\s*file:([^}]+?)\s*\}\}/g;
  const matches = Array.from(text.matchAll(pattern));
  if (!matches.length) return text;
  const maxBytes = opts.maxBytes ?? FILE_INCLUDE_MAX_BYTES_DEFAULT;
  const teamDirResolvedRaw = import_node_path21.default.resolve(teamDir);
  let teamDirResolved = teamDirResolvedRaw;
  try {
    teamDirResolved = await import_promises15.default.realpath(teamDirResolvedRaw);
  } catch {
  }
  const teamDirPrefix = teamDirResolved + import_node_path21.default.sep;
  const resolved = /* @__PURE__ */ new Map();
  for (const m of matches) {
    const rawPath = m[1].trim();
    if (resolved.has(rawPath)) continue;
    if (!rawPath || import_node_path21.default.isAbsolute(rawPath) || rawPath.split("/").includes("..")) {
      resolved.set(rawPath, `[[file-include rejected: unsafe path "${rawPath}"]]`);
      continue;
    }
    const candidate = import_node_path21.default.resolve(teamDirResolved, rawPath);
    if (candidate !== teamDirResolved && !candidate.startsWith(teamDirPrefix)) {
      resolved.set(rawPath, `[[file-include rejected: outside team workspace "${rawPath}"]]`);
      continue;
    }
    try {
      const real = await import_promises15.default.realpath(candidate);
      if (real !== teamDirResolved && !real.startsWith(teamDirPrefix)) {
        resolved.set(rawPath, `[[file-include rejected: symlink escapes team workspace "${rawPath}"]]`);
        continue;
      }
      const stat2 = await import_promises15.default.stat(real);
      if (!stat2.isFile()) {
        resolved.set(rawPath, `[[file-include rejected: not a regular file "${rawPath}"]]`);
        continue;
      }
      if (stat2.size > maxBytes) {
        resolved.set(rawPath, `[[file-include rejected: "${rawPath}" size ${stat2.size}B exceeds ${maxBytes}B cap]]`);
        continue;
      }
      const content = await import_promises15.default.readFile(real, "utf8");
      resolved.set(rawPath, content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      resolved.set(rawPath, `[[file-include failed: "${rawPath}" \u2014 ${msg}]]`);
    }
  }
  return text.replace(pattern, (_full, raw) => resolved.get(String(raw).trim()) ?? "");
}
function sanitizeDraftOnlyText(text) {
  return sanitizeOutboundPostText(text);
}
async function moveRunTicket(opts) {
  const { teamDir, ticketPath, toLane } = opts;
  const workDir = import_node_path21.default.join(teamDir, "work");
  const toDir = import_node_path21.default.join(workDir, toLane);
  await ensureDir3(toDir);
  const file = import_node_path21.default.basename(ticketPath);
  const dest = import_node_path21.default.join(toDir, file);
  if (import_node_path21.default.resolve(ticketPath) !== import_node_path21.default.resolve(dest)) {
    await import_promises15.default.rename(ticketPath, dest);
  }
  try {
    const md = await readTextFile(dest);
    const next = md.replace(/^Status: .*$/m, `Status: ${laneToStatus(toLane)}`);
    if (next !== md) await import_promises15.default.writeFile(dest, next, "utf8");
  } catch {
  }
  return { ticketPath: dest };
}
function loadNodeStatesFromRun(run, opts) {
  const out = {};
  const cur = run.nodeStates;
  if (cur) {
    for (const [nodeId, st] of Object.entries(cur)) {
      if (st?.status === "success" || st?.status === "error" || st?.status === "waiting") {
        out[String(nodeId)] = { status: st.status, ts: st.ts };
      }
    }
  }
  for (const evRaw of Array.isArray(run.events) ? run.events : []) {
    const ev = asRecord(evRaw);
    const nodeId = asString(ev["nodeId"]).trim();
    if (!nodeId) continue;
    const ts = asString(ev["ts"]) || (/* @__PURE__ */ new Date()).toISOString();
    const type = asString(ev["type"]).trim();
    if (type === "node.completed") out[nodeId] = { status: "success", ts };
    if (type === "node.error") out[nodeId] = { status: "error", ts };
    if (type === "node.awaiting_approval") out[nodeId] = { status: "waiting", ts };
    if (type === "node.approved") out[nodeId] = { status: "success", ts };
  }
  if (run.status === "needs_revision" && typeof run.nextNodeIndex === "number" && opts?.workflow) {
    const nodes = Array.isArray(opts.workflow.nodes) ? opts.workflow.nodes : [];
    for (let i = Math.max(0, run.nextNodeIndex); i < nodes.length; i++) {
      const id = asString(nodes[i]?.id).trim();
      if (id) delete out[id];
    }
  }
  return out;
}
function pickNextRunnableNodeIndex(opts) {
  const { workflow, run } = opts;
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  if (!nodes.length) return null;
  const hasEdges = Array.isArray(workflow.edges) && workflow.edges.length > 0;
  if (!hasEdges) {
    const start = typeof run.nextNodeIndex === "number" ? run.nextNodeIndex : 0;
    for (let i = Math.max(0, start); i < nodes.length; i++) {
      const n = nodes[i];
      const id = asString(n.id).trim();
      if (!id) continue;
      const st = (run.nodeStates ?? {})[id]?.status;
      if (st === "success" || st === "error" || st === "waiting") continue;
      return i;
    }
    return null;
  }
  const nodeStates = loadNodeStatesFromRun(run);
  if (run.status === "needs_revision" && typeof run.nextNodeIndex === "number") {
    for (let i = Math.max(0, run.nextNodeIndex); i < nodes.length; i++) {
      const id = asString(nodes[i]?.id).trim();
      if (id) delete nodeStates[id];
    }
  }
  const incomingEdgesByNodeId = /* @__PURE__ */ new Map();
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];
  for (const e of edges) {
    const to = asString(e.to).trim();
    if (!to) continue;
    const list = incomingEdgesByNodeId.get(to) ?? [];
    list.push(e);
    incomingEdgesByNodeId.set(to, list);
  }
  function edgeSatisfied(e) {
    const fromId = asString(e.from).trim();
    const from = nodeStates[fromId]?.status;
    const on = e.on ?? "success";
    if (!from) return false;
    if (on === "always") return from === "success" || from === "error";
    if (on === "error") return from === "error";
    return from === "success";
  }
  function nodeReady(node) {
    const nodeId = asString(node.id).trim();
    if (!nodeId) return false;
    const st = nodeStates[nodeId]?.status;
    if (st === "success" || st === "error" || st === "waiting") return false;
    const inputFrom = node.input?.from;
    if (Array.isArray(inputFrom) && inputFrom.length) {
      return inputFrom.every((dep) => nodeStates[asString(dep)]?.status === "success");
    }
    const incoming = incomingEdgesByNodeId.get(nodeId) ?? [];
    if (!incoming.length) return true;
    return incoming.some(edgeSatisfied);
  }
  for (let i = 0; i < nodes.length; i++) {
    if (nodeReady(nodes[i])) return i;
  }
  return null;
}
async function appendRunLog(runLogPath, fn) {
  const raw = await readTextFile(runLogPath);
  const cur = JSON.parse(raw);
  const next0 = fn(cur);
  const next = {
    ...next0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await import_promises15.default.writeFile(runLogPath, JSON.stringify(next, null, 2), "utf8");
}
function nodeLabel(n) {
  return `${n.kind}:${n.id}${n.name ? ` (${n.name})` : ""}`;
}
function runFilePathFor(runsDir, runId) {
  return import_node_path21.default.join(runsDir, runId, "run.json");
}
async function loadRunFile(teamDir, runsDir, runId) {
  const runPath = runFilePathFor(runsDir, runId);
  if (!await fileExists3(runPath)) throw new Error(`Run file not found: ${import_node_path21.default.relative(teamDir, runPath)}`);
  const raw = await readTextFile(runPath);
  return { path: runPath, run: JSON.parse(raw) };
}
async function writeRunFile(runPath, fn) {
  const raw = await readTextFile(runPath);
  const cur = JSON.parse(raw);
  const next0 = fn(cur);
  const next = {
    ...next0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await import_promises15.default.writeFile(runPath, JSON.stringify(next, null, 2), "utf8");
}

// src/toolsInvoke.ts
var TOOLS_INVOKE_TIMEOUT_MS = 12e4;
var RETRY_DELAY_BASE_MS = 150;
var GATEWAY_DEFAULT_PORT = 18789;
var ToolsInvokeError = class extends Error {
  httpStatus;
  constructor(message, httpStatus) {
    super(message);
    this.name = "ToolsInvokeError";
    this.httpStatus = httpStatus;
  }
};
function parseToolsInvokeError(json, status) {
  const msg = typeof json.error === "object" && json.error?.message || (typeof json.error === "string" ? json.error : null) || `tools/invoke failed (${status})`;
  return msg;
}
async function doSingleToolsInvoke(url, token, req) {
  const ac = new AbortController();
  const argsTimeout = typeof req.args?.["timeoutMs"] === "number" ? req.args.timeoutMs : 0;
  const fetchTimeoutMs = argsTimeout > 0 ? argsTimeout + 3e4 : TOOLS_INVOKE_TIMEOUT_MS;
  const t = setTimeout(() => ac.abort(), fetchTimeoutMs);
  const res = await fetch(url, {
    method: "POST",
    signal: ac.signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(req)
  }).finally(() => clearTimeout(t));
  const json = await res.json();
  if (!res.ok || !json.ok) throw new ToolsInvokeError(parseToolsInvokeError(json, res.status), res.status);
  return json.result;
}
async function toolsInvoke(api, req) {
  const port = api.config.gateway?.port ?? GATEWAY_DEFAULT_PORT;
  const token = api.config.gateway?.auth?.token;
  if (!token) throw new Error("Missing gateway.auth.token in openclaw config (required for tools/invoke)");
  const url = `http://127.0.0.1:${port}/tools/invoke`;
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await doSingleToolsInvoke(url, token, req);
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, RETRY_DELAY_BASE_MS * attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "toolsInvoke failed"));
}

// src/lib/workflows/workflow-node-output-readers.ts
var import_promises16 = __toESM(require("node:fs/promises"));
var import_node_path22 = __toESM(require("node:path"));
async function fileExists4(p) {
  try {
    await import_promises16.default.stat(p);
    return true;
  } catch {
    return false;
  }
}
function assertPathWithinDir(baseDir, candidatePath, label = "path") {
  const baseResolved = import_node_path22.default.resolve(baseDir);
  const candResolved = import_node_path22.default.resolve(candidatePath);
  const basePrefix = baseResolved + import_node_path22.default.sep;
  if (candResolved !== baseResolved && !candResolved.startsWith(basePrefix)) {
    throw new Error(`${label} must be within ${baseResolved}: ${candResolved}`);
  }
}
function safeJsonStringify(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v ?? "");
  }
}
async function loadProposedPostTextFromPriorNode(opts) {
  const { runDir, nodeOutputsDir, priorNodeId } = opts;
  const platform = String(opts.platform ?? "x").trim() || "x";
  assertPathWithinDir(runDir, nodeOutputsDir, "nodeOutputsDir");
  const files = await import_promises16.default.readdir(nodeOutputsDir);
  const safe = files.filter((f) => /^\d{3}-[a-z0-9_-]+\.json$/i.test(f));
  const match = safe.find((f) => f.endsWith(`-${priorNodeId}.json`));
  if (!match) return "";
  const outputPath = import_node_path22.default.join(nodeOutputsDir, match);
  assertPathWithinDir(runDir, outputPath, "node output");
  const outRaw = await import_promises16.default.readFile(outputPath, "utf8");
  const outObj = JSON.parse(outRaw);
  const rawText = String(outObj.text ?? "").trim();
  if (!rawText) return "";
  try {
    const packet = JSON.parse(rawText);
    const packetObj = packet && typeof packet === "object" ? packet : {};
    const platformsObj = packetObj.platforms && typeof packetObj.platforms === "object" ? packetObj.platforms : {};
    const pObj = platformsObj[platform] && typeof platformsObj[platform] === "object" ? platformsObj[platform] : {};
    const hook = typeof pObj.hook === "string" ? pObj.hook.trim() : "";
    const body = typeof pObj.body === "string" ? pObj.body.trim() : "";
    const combined = [hook, body].filter(Boolean).join("\n\n").trim();
    return combined || rawText;
  } catch {
    return rawText;
  }
}
async function loadPriorLlmInput(opts) {
  const { runDir, workflow, currentNode, currentNodeIndex } = opts;
  const nodeOutputsDir = import_node_path22.default.join(runDir, "node-outputs");
  if (!await fileExists4(nodeOutputsDir)) return {};
  assertPathWithinDir(runDir, nodeOutputsDir, "nodeOutputsDir");
  const files = (await import_promises16.default.readdir(nodeOutputsDir)).filter((f) => /^\d{3}-[a-z0-9_-]+\.json$/i.test(f)).sort();
  const byNodeId = /* @__PURE__ */ new Map();
  for (const f of files) {
    const m = f.match(/^(\d{3})-([a-z0-9_-]+)\.json$/i);
    if (!m) continue;
    byNodeId.set(String(m[2]), { idx: Number(m[1]), p: import_node_path22.default.join(nodeOutputsDir, f) });
  }
  const upstreamNodeIds = /* @__PURE__ */ new Set();
  for (const e of Array.isArray(workflow.edges) ? workflow.edges : []) {
    if (String(e.to ?? "").trim() === String(currentNode.id ?? "").trim()) {
      const from = String(e.from ?? "").trim();
      if (from) upstreamNodeIds.add(from);
    }
  }
  if (!upstreamNodeIds.size && currentNodeIndex > 0) {
    const prev = workflow.nodes[currentNodeIndex - 1];
    const prevId = String(prev?.id ?? "").trim();
    if (prevId) upstreamNodeIds.add(prevId);
  }
  const parseNodeOutput = async (nodeId) => {
    const hit = byNodeId.get(nodeId);
    if (!hit) return null;
    const { idx, p } = hit;
    assertPathWithinDir(runDir, p, "node output");
    const raw = await import_promises16.default.readFile(p, "utf8");
    const obj = JSON.parse(raw);
    const text = String(obj.text ?? "").trim();
    let parsed = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
    }
    return {
      nodeId,
      idx,
      path: import_node_path22.default.relative(runDir, p),
      parsed,
      text,
      raw: obj
    };
  };
  const inputs = [];
  for (const nodeId of upstreamNodeIds) {
    const loaded = await parseNodeOutput(nodeId);
    if (loaded) inputs.push(loaded);
  }
  inputs.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
  const latest = inputs.length ? inputs[inputs.length - 1] : null;
  const previousNodeOutput = latest?.parsed ?? null;
  const INPUT_JSON = latest ? safeJsonStringify(previousNodeOutput) : "";
  return {
    priorNodeIds: Array.from(upstreamNodeIds),
    upstream: inputs,
    previousNode: latest,
    previousNodeId: latest?.nodeId ?? null,
    previousNodeOutput,
    INPUT_JSON,
    inputJson: previousNodeOutput
  };
}

// src/lib/workflows/workflow-node-executor.ts
async function resolveApprovalBindingTarget(api, bindingId) {
  const cfgObj = await loadOpenClawConfig(api);
  const bindings = cfgObj.bindings;
  const m = Array.isArray(bindings) ? bindings.find((b) => String(b?.agentId ?? "") === String(bindingId) && b?.match?.channel && b?.match?.peer?.id) : null;
  if (!m?.match?.channel || !m.match.peer?.id) {
    throw new Error(
      `Missing approval binding: approvalBindingId=${bindingId}. Expected an openclaw config binding entry like {agentId: "${bindingId}", match: {channel, peer:{id}}}.`
    );
  }
  return { channel: String(m.match.channel), target: String(m.match.peer.id), ...m.match.accountId ? { accountId: String(m.match.accountId) } : {} };
}

// src/lib/workflows/workflow-worker.ts
var import_promises17 = __toESM(require("node:fs/promises"));
var import_node_path23 = __toESM(require("node:path"));
var import_node_crypto3 = __toESM(require("node:crypto"));

// src/lib/workflows/workflow-error-classify.ts
var FUNDING_PATTERNS = [
  /insufficient.*(credits?|funds?|balance)/i,
  /billing/i,
  /payment\s+required/i,
  /quota\s+exceeded/i,
  /out\s+of\s+credits/i,
  /budget\s+(exceeded|limit)/i,
  /no\s+(active\s+)?subscription/i,
  /plan\s+(limit|exceeded)/i
];
var RATE_LIMIT_PATTERNS = [
  /rate\s+limit/i,
  /too\s+many\s+requests/i,
  /throttl/i
];
var AUTH_PATTERNS = [
  /unauthorized/i,
  /invalid.*api.?key/i,
  /forbidden/i,
  /authentication\s+failed/i,
  /access\s+denied/i
];
function classifyByHttpStatus(status) {
  if (status === 402) return "funding";
  if (status === 429) return "rate-limit";
  if (status === 401 || status === 403) return "auth";
  if (status === 408 || status === 504) return "timeout";
  return null;
}
function classifyByMessage(message, error) {
  if (FUNDING_PATTERNS.some((p) => p.test(message))) return "funding";
  if (RATE_LIMIT_PATTERNS.some((p) => p.test(message))) return "rate-limit";
  if (AUTH_PATTERNS.some((p) => p.test(message))) return "auth";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (/timed?\s*out/i.test(message)) return "timeout";
  return null;
}
function classifyError(error) {
  const httpStatus = error instanceof ToolsInvokeError ? error.httpStatus : 0;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return classifyByHttpStatus(httpStatus) ?? classifyByMessage(message, error) ?? "unknown";
}
var CATEGORY_LABELS = {
  "funding": "Funding issue \u2014 the model provider may be out of credits or require payment",
  "rate-limit": "Rate limit \u2014 the model provider is throttling requests",
  "auth": "Authentication failure \u2014 the API key may be invalid or expired",
  "timeout": "Timeout \u2014 the request took too long to complete",
  "unknown": "Unknown error"
};
function errorCategoryLabel(category) {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS["unknown"];
}

// src/lib/workflows/media-drivers/nano-banana-pro.driver.ts
var path24 = __toESM(require("path"));

// src/lib/workflows/media-drivers/utils.ts
var fs17 = __toESM(require("fs/promises"));
var path23 = __toESM(require("path"));
async function findSkillDir(slug) {
  const homedir = process.env.HOME || "/home/control";
  const skillRoots = [
    path23.join(homedir, ".openclaw", "skills"),
    path23.join(homedir, ".openclaw", "workspace", "skills"),
    path23.join(homedir, ".openclaw", "workspace")
  ];
  for (const root of skillRoots) {
    const skillDir = path23.join(root, slug);
    try {
      const stat2 = await fs17.stat(skillDir);
      if (stat2.isDirectory()) {
        return skillDir;
      }
    } catch {
    }
  }
  return null;
}
async function findVenvPython(skillDir) {
  const venvPython = path23.join(skillDir, ".venv", "bin", "python");
  try {
    await fs17.access(venvPython);
    return venvPython;
  } catch {
    return "python3";
  }
}
async function loadConfigEnv() {
  const homedir = process.env.HOME || "/home/control";
  const configPath = path23.join(homedir, ".openclaw", "openclaw.json");
  try {
    const cfgRaw = await fs17.readFile(configPath, "utf8");
    const cfgParsed = JSON.parse(cfgRaw);
    const envBlock = cfgParsed?.env;
    const maybeVars = envBlock && typeof envBlock === "object" ? envBlock.vars : null;
    const rawVars = maybeVars && typeof maybeVars === "object" ? maybeVars : envBlock;
    if (rawVars && typeof rawVars === "object") {
      return Object.fromEntries(
        Object.entries(rawVars).filter(([, v]) => typeof v === "string")
      );
    }
    return {};
  } catch {
    return {};
  }
}
function parseMediaOutput(stdout) {
  const mediaMatch = stdout.match(/MEDIA:(.+)$/m);
  return mediaMatch ? mediaMatch[1].trim() : "";
}
function buildPythonExecSnippet(opts) {
  const { runner, script, args = [], stdin, env, cwd, timeout } = opts;
  const mergedEnv = {
    ...env,
    MEDIA_OUTPUT_DIR: cwd
  };
  const payload = {
    runner,
    script,
    args,
    stdin: stdin ?? "",
    env: mergedEnv,
    cwd,
    timeoutMs: timeout
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  return [
    `python3 -c '`,
    `import base64, json, os, subprocess, sys;`,
    `payload = json.loads(base64.b64decode("${payloadB64}").decode());`,
    `env = os.environ.copy();`,
    `env.update({k: str(v) for k, v in payload["env"].items()});`,
    `res = subprocess.run(`,
    `  [payload["runner"], payload["script"], *payload.get("args", [])],`,
    `  input=payload.get("stdin", ""),`,
    `  text=True,`,
    `  capture_output=True,`,
    `  cwd=payload["cwd"],`,
    `  env=env,`,
    `  timeout=max(1, int(payload.get("timeoutMs", 1000) / 1000))`,
    `);`,
    `sys.stdout.write(res.stdout);`,
    `sys.stderr.write(res.stderr);`,
    `raise SystemExit(res.returncode)`,
    `'`
  ].join("\n");
}
async function runScript(opts) {
  const { api, timeout } = opts;
  const timeoutMs = Math.max(1e3, timeout + 5e3);
  const command = buildPythonExecSnippet(opts);
  try {
    const result = await api.runtime.system.runCommandWithTimeout(
      ["bash", "-c", command],
      { timeoutMs, cwd: opts.cwd }
    );
    if (result.code !== 0) {
      const msg = [
        `Script execution failed with exit code ${result.code}`,
        result.stdout ? `
--- stdout ---
${result.stdout.trim()}` : "",
        result.stderr ? `
--- stderr ---
${result.stderr.trim()}` : ""
      ].filter(Boolean).join("");
      throw new Error(msg);
    }
    return (result.stdout || "").trim();
  } catch (err) {
    const e = err;
    const stdout = e?.stdout ?? "";
    const stderr = e?.stderr ?? "";
    const msg = [
      e?.message ? String(e.message) : "Script execution failed",
      stdout ? `
--- stdout ---
${stdout.trim()}` : "",
      stderr ? `
--- stderr ---
${stderr.trim()}` : ""
    ].filter(Boolean).join("");
    throw new Error(msg);
  }
}
async function findScriptInSkill(skillDir, scriptCandidates) {
  const searchDirs = [skillDir, path23.join(skillDir, "scripts")];
  for (const dir of searchDirs) {
    for (const candidate of scriptCandidates) {
      const scriptPath = path23.join(dir, candidate);
      try {
        await fs17.access(scriptPath);
        return scriptPath;
      } catch {
      }
    }
  }
  return null;
}

// src/lib/workflows/media-drivers/nano-banana-pro.driver.ts
var NanoBananaPro = class {
  slug = "nano-banana-pro";
  mediaType = "image";
  displayName = "Nano Banana Pro (Gemini Image Generation)";
  requiredEnvVars = ["GEMINI_API_KEY"];
  durationConstraints = null;
  async invoke(opts) {
    const { prompt, outputDir, timeout, config } = opts;
    const env = await loadConfigEnv();
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }
    const scriptPath = path24.join(skillDir, "scripts", "generate_image.py");
    let runner;
    try {
      runner = await findVenvPython(skillDir);
    } catch {
      runner = "uv run python";
    }
    const filename = "output.png";
    const sizeStr = String(config?.size ?? "1024x1024");
    const maxDim = Math.max(...sizeStr.split("x").map(Number).filter((n) => !isNaN(n)), 1024);
    const resolution = maxDim >= 3840 ? "4K" : maxDim >= 1792 ? "2K" : "1K";
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      args: ["--prompt", prompt, "--filename", filename, "--resolution", resolution],
      env: {
        ...env,
        HOME: process.env.HOME || "/home/control"
      },
      cwd: outputDir,
      timeout
    });
    const outputPath = scriptOutput.trim();
    if (!outputPath || !outputPath.includes(".")) {
      throw new Error(`No valid file path returned from script. Output: ${scriptOutput}`);
    }
    return {
      filePath: outputPath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput
      }
    };
  }
};

// src/lib/workflows/media-drivers/openai-image-gen.driver.ts
var path25 = __toESM(require("path"));
var OpenAIImageGen = class {
  slug = "openai-image-gen";
  mediaType = "image";
  displayName = "OpenAI Image Generation (DALL-E)";
  requiredEnvVars = ["OPENAI_API_KEY"];
  durationConstraints = null;
  async invoke(opts) {
    const { prompt, outputDir, timeout, config } = opts;
    const env = await loadConfigEnv();
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }
    const scriptPath = path25.join(skillDir, "generate_image.py");
    const runner = await findVenvPython(skillDir);
    const size = String(config?.size ?? "1024x1024");
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || "/home/control",
        DALL_E_SIZE: size
      },
      cwd: outputDir,
      timeout
    });
    const filePath = parseMediaOutput(scriptOutput);
    if (!filePath) {
      throw new Error(`No MEDIA: path found in script output. Output: ${scriptOutput}`);
    }
    return {
      filePath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput
      }
    };
  }
};

// src/lib/workflows/media-drivers/runway-video.driver.ts
var path26 = __toESM(require("path"));

// src/lib/workflows/media-drivers/types.ts
var DEFAULT_DURATION_SECONDS = 15;
function parseDuration(config) {
  const raw = config?.duration;
  if (raw == null) return String(DEFAULT_DURATION_SECONDS);
  const s = String(raw).replace(/s$/i, "").trim();
  const n = parseInt(s, 10);
  if (Number.isNaN(n) || n <= 0) return String(DEFAULT_DURATION_SECONDS);
  return String(n);
}

// src/lib/workflows/media-drivers/runway-video.driver.ts
var RunwayVideo = class {
  slug = "runway-video";
  mediaType = "video";
  displayName = "Runway Video Generation";
  requiredEnvVars = ["RUNWAYML_API_SECRET"];
  durationConstraints = { minSeconds: 5, maxSeconds: 10, defaultSeconds: 10, stepSeconds: 5 };
  async invoke(opts) {
    const { prompt, outputDir, timeout, config } = opts;
    const env = await loadConfigEnv();
    const duration = parseDuration(config);
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }
    const scriptPath = path26.join(skillDir, "generate_video.py");
    const runner = await findVenvPython(skillDir);
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || "/home/control",
        MEDIA_DURATION: duration,
        MEDIA_ASPECT_RATIO: String(config?.aspect_ratio ?? config?.size ?? "1280:768")
      },
      cwd: outputDir,
      timeout
    });
    const filePath = parseMediaOutput(scriptOutput);
    if (!filePath) {
      throw new Error(`No MEDIA: path found in script output. Output: ${scriptOutput}`);
    }
    return {
      filePath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput
      }
    };
  }
};

// src/lib/workflows/media-drivers/kling-video.driver.ts
var path27 = __toESM(require("path"));
var fs18 = __toESM(require("fs"));
function mapToKlingAspectRatio(ratio) {
  const normalized = ratio.toLowerCase().trim();
  if (normalized === "16:9" || normalized === "9:16" || normalized === "1:1") {
    return normalized;
  }
  const mappings = {
    "4:3": "1:1",
    // 4:3 (1.33) → 1:1 (1.00) closest square-ish
    "3:4": "9:16",
    // 3:4 (0.75) → 9:16 (0.56) closest vertical
    "21:9": "16:9",
    // 21:9 (2.33) → 16:9 (1.78) closest widescreen
    "2:1": "16:9",
    // 2:1 (2.00) → 16:9 (1.78) closest widescreen
    "1:2": "9:16"
    // 1:2 (0.50) → 9:16 (0.56) closest vertical
  };
  return mappings[normalized] || "16:9";
}
var KlingVideo = class {
  slug = "klingai";
  mediaType = "video";
  displayName = "Kling AI Video (Official)";
  // Auth is via ~/.config/kling/.credentials, not env vars.
  // We check for the credentials file in a custom availability method.
  requiredEnvVars = [];
  durationConstraints = { minSeconds: 3, maxSeconds: 15, defaultSeconds: 5, stepSeconds: 1 };
  /**
   * Check if Kling credentials are configured (credentials file exists with AK/SK).
   */
  isConfigured() {
    const home = process.env.HOME || "/home/control";
    const credPath = path27.join(home, ".config", "kling", ".credentials");
    try {
      const content = fs18.readFileSync(credPath, "utf8");
      return content.includes("access_key_id") && content.includes("secret_access_key");
    } catch {
      return false;
    }
  }
  async invoke(opts) {
    const { prompt, outputDir, timeout, config } = opts;
    const env = await loadConfigEnv();
    const rawDuration = Math.max(3, Math.min(15, Number(parseDuration(config))));
    const duration = String(rawDuration);
    const rawAspectRatio = String(config?.aspect_ratio ?? config?.size ?? "16:9");
    const aspectRatio = mapToKlingAspectRatio(rawAspectRatio);
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(
        `Skill directory not found for ${this.slug}. Install it: clawhub install klingai --force`
      );
    }
    const scriptPath = path27.join(skillDir, "scripts", "video.mjs");
    const runner = "node";
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      args: [
        "--prompt",
        prompt,
        "--output_dir",
        outputDir,
        "--duration",
        duration,
        "--aspect_ratio",
        aspectRatio,
        "--mode",
        "pro"
      ],
      env: {
        ...env,
        HOME: process.env.HOME || "/home/control"
      },
      cwd: outputDir,
      timeout
    });
    const doneMatch = scriptOutput.match(/(?:Done|完成|Saved|已保存):\s*(.+\.mp4)/m);
    if (doneMatch) {
      return {
        filePath: doneMatch[1].trim(),
        metadata: { skill: this.slug, prompt }
      };
    }
    const mediaPath = parseMediaOutput(scriptOutput);
    if (mediaPath) {
      return {
        filePath: mediaPath,
        metadata: { skill: this.slug, prompt }
      };
    }
    try {
      const files = fs18.readdirSync(outputDir).filter((f) => f.endsWith(".mp4")).sort().reverse();
      if (files.length > 0) {
        return {
          filePath: path27.join(outputDir, files[0]),
          metadata: { skill: this.slug, prompt }
        };
      }
    } catch {
    }
    throw new Error(
      `Could not find generated video in output. Script output:
${scriptOutput}`
    );
  }
};

// src/lib/workflows/media-drivers/luma-video.driver.ts
var path28 = __toESM(require("path"));
var LumaVideo = class {
  slug = "luma-video";
  mediaType = "video";
  displayName = "Luma Video Generation";
  requiredEnvVars = ["LUMAAI_API_KEY"];
  durationConstraints = { minSeconds: 5, maxSeconds: 9, defaultSeconds: 5, stepSeconds: 4 };
  async invoke(opts) {
    const { prompt, outputDir, timeout, config } = opts;
    const env = await loadConfigEnv();
    const duration = parseDuration(config);
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }
    const scriptPath = path28.join(skillDir, "generate_video.py");
    const runner = await findVenvPython(skillDir);
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || "/home/control",
        MEDIA_DURATION: duration,
        MEDIA_ASPECT_RATIO: String(config?.aspect_ratio ?? config?.size ?? "16:9")
      },
      cwd: outputDir,
      timeout
    });
    const filePath = parseMediaOutput(scriptOutput);
    if (!filePath) {
      throw new Error(`No MEDIA: path found in script output. Output: ${scriptOutput}`);
    }
    return {
      filePath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput
      }
    };
  }
};

// src/lib/workflows/media-drivers/generic.driver.ts
var GenericDriver = class _GenericDriver {
  slug;
  mediaType;
  displayName;
  requiredEnvVars = [];
  durationConstraints = null;
  constructor(slug, mediaType, displayName) {
    this.slug = slug;
    this.mediaType = mediaType;
    this.displayName = displayName || `Generic ${mediaType} driver for ${slug}`;
  }
  async invoke(opts) {
    const { prompt, outputDir, timeout } = opts;
    const env = await loadConfigEnv();
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }
    const scriptCandidates = this.mediaType === "image" ? ["generate_image.py", "generate_image.sh", "generate.sh"] : this.mediaType === "video" ? ["generate_video.py", "generate_video.sh", "generate.py", "generate.sh"] : ["generate_audio.py", "generate_audio.sh", "generate.py", "generate.sh"];
    const scriptPath = await findScriptInSkill(skillDir, scriptCandidates);
    if (!scriptPath) {
      throw new Error(`No generation script found in ${skillDir}. Looked for: ${scriptCandidates.join(", ")}`);
    }
    let runner = "bash";
    if (scriptPath.endsWith(".py")) {
      runner = await findVenvPython(skillDir);
    }
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || "/home/control"
      },
      cwd: outputDir,
      timeout
    });
    let filePath = parseMediaOutput(scriptOutput);
    if (!filePath) {
      const lines = scriptOutput.split("\n").map((line) => line.trim()).filter(Boolean);
      for (const line of lines.reverse()) {
        if (line.includes("/") && (line.includes(".") || line.includes(outputDir))) {
          filePath = line;
          break;
        }
      }
    }
    if (!filePath) {
      throw new Error(`No file path found in script output. Output: ${scriptOutput}`);
    }
    return {
      filePath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput,
        script_path: scriptPath
      }
    };
  }
  /**
   * Create a generic driver by auto-detecting a skill's capabilities
   */
  static async createFromSkill(slug) {
    const skillDir = await findSkillDir(slug);
    if (!skillDir) {
      return null;
    }
    const imageScripts = ["generate_image.py", "generate_image.sh"];
    const videoScripts = ["generate_video.py", "generate_video.sh"];
    const audioScripts = ["generate_audio.py", "generate_audio.sh"];
    const imageScript = await findScriptInSkill(skillDir, imageScripts);
    if (imageScript) {
      return new _GenericDriver(slug, "image", `${slug} Image Generation`);
    }
    const videoScript = await findScriptInSkill(skillDir, videoScripts);
    if (videoScript) {
      return new _GenericDriver(slug, "video", `${slug} Video Generation`);
    }
    const audioScript = await findScriptInSkill(skillDir, audioScripts);
    if (audioScript) {
      return new _GenericDriver(slug, "audio", `${slug} Audio Generation`);
    }
    const genericScript = await findScriptInSkill(skillDir, ["generate.py", "generate.sh"]);
    if (genericScript) {
      return new _GenericDriver(slug, "image", `${slug} Generic Generation`);
    }
    return null;
  }
};

// src/lib/workflows/media-drivers/registry.ts
var knownDrivers = [
  new NanoBananaPro(),
  new OpenAIImageGen(),
  new RunwayVideo(),
  new KlingVideo(),
  new LumaVideo()
];
var genericDriverCache = /* @__PURE__ */ new Map();
function getDriver(slug) {
  const knownDriver = knownDrivers.find((d) => d.slug === slug);
  if (knownDriver) {
    return knownDriver;
  }
  if (genericDriverCache.has(slug)) {
    const cached = genericDriverCache.get(slug);
    return cached || void 0;
  }
  let genericDriver = null;
  try {
    genericDriver = new GenericDriver(slug, "image", `Generic driver for ${slug}`);
    genericDriverCache.set(slug, genericDriver);
    return genericDriver;
  } catch {
    genericDriverCache.set(slug, null);
    return void 0;
  }
}
function getAllDrivers() {
  return [...knownDrivers];
}
function isDriverAvailable(slug, env) {
  const driver = getDriver(slug);
  if (!driver) {
    return false;
  }
  return driver.requiredEnvVars.every((envVar) => {
    const value = env[envVar];
    return value && typeof value === "string" && value.trim().length > 0;
  });
}

// src/lib/workflows/lock-liveness.ts
var import_node_os3 = __toESM(require("node:os"));
function currentLockOwner() {
  return { pid: process.pid, host: import_node_os3.default.hostname() };
}
function isLockHolderDead(lockInfo) {
  const sameHost = typeof lockInfo?.host === "string" && lockInfo.host === import_node_os3.default.hostname();
  const lockPid = typeof lockInfo?.pid === "number" && Number.isFinite(lockInfo.pid) ? lockInfo.pid : NaN;
  if (!sameHost || !Number.isFinite(lockPid) || lockPid <= 0) return false;
  try {
    process.kill(lockPid, 0);
    return false;
  } catch (err) {
    return err?.code === "ESRCH";
  }
}

// src/lib/workflows/kitchen-review-url.ts
function asRecord2(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}
function asString2(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function asPort(v) {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string" && v.trim()) {
    const parsed = Number(v.trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}
function trimTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}
function buildBaseUrl(host, port) {
  const trimmedHost = host.trim();
  if (!trimmedHost) return "http://localhost:7777";
  if (/^https?:\/\//i.test(trimmedHost)) return trimTrailingSlash(trimmedHost);
  const safeHost = trimmedHost.includes(":") && !trimmedHost.startsWith("[") ? `[${trimmedHost}]` : trimmedHost;
  return trimTrailingSlash(`http://${safeHost}${port ? `:${port}` : ""}`);
}
function getKitchenBaseUrl(api) {
  const config = asRecord2(api.config) ?? {};
  const envVars = asRecord2(asRecord2(config.env)?.vars);
  const envBaseUrl = asString2(envVars?.CK_BASE_URL).trim();
  if (envBaseUrl) return trimTrailingSlash(envBaseUrl);
  const kitchenConfig = asRecord2(asRecord2(asRecord2(config.plugins)?.entries)?.kitchen)?.config;
  const host = asString2(kitchenConfig?.host).trim();
  const port = asPort(kitchenConfig?.port);
  if (host) return buildBaseUrl(host, port);
  return "http://localhost:7777";
}
function buildKitchenWorkflowReviewUrl(api, teamId, workflowId) {
  const baseUrl = getKitchenBaseUrl(api);
  return `${baseUrl}/teams/${encodeURIComponent(teamId)}/workflows/${encodeURIComponent(workflowId)}`;
}

// src/lib/workflows/workflow-worker.ts
async function buildMemoryContext(teamDir) {
  try {
    const memoryDir = import_node_path23.default.join(teamDir, "shared-context", "memory");
    if (!await fileExists3(memoryDir)) {
      return "";
    }
    const memoryParts = [];
    const maxTokens = 2e3;
    let currentTokens = 0;
    const pinnedPath = import_node_path23.default.join(memoryDir, "pinned.jsonl");
    if (await fileExists3(pinnedPath)) {
      const pinnedContent = await readTextFile(pinnedPath);
      const pinnedItems = pinnedContent.trim().split("\n").filter(Boolean);
      if (pinnedItems.length > 0) {
        memoryParts.push("[Team Memory \u2014 Pinned]");
        for (const line of pinnedItems.slice(-5)) {
          try {
            const item = JSON.parse(line);
            if (item.content || item.text) {
              const summary = `- ${item.content || item.text} (${item.type || "note"}, ${(item.ts || "").slice(0, 10)})`;
              if (currentTokens + summary.length * 0.25 < maxTokens) {
                memoryParts.push(summary);
                currentTokens += summary.length * 0.25;
              }
            }
          } catch {
          }
        }
      }
    }
    const files = await import_promises17.default.readdir(memoryDir);
    const jsonlFiles = files.filter((f) => f.endsWith(".jsonl") && f !== "pinned.jsonl");
    for (const filename of jsonlFiles) {
      if (currentTokens > maxTokens * 0.8) break;
      const filePath = import_node_path23.default.join(memoryDir, filename);
      const content = await readTextFile(filePath);
      const items = content.trim().split("\n").filter(Boolean);
      if (items.length > 0) {
        const recentItems = items.slice(-3);
        for (const line of recentItems) {
          try {
            const item = JSON.parse(line);
            if (item.content || item.text) {
              const summary = `- ${item.content || item.text} (${item.type || "note"}, ${(item.ts || "").slice(0, 10)})`;
              if (currentTokens + summary.length * 0.25 < maxTokens) {
                if (memoryParts.length === 1) {
                  memoryParts.push("", "[Team Memory \u2014 Recent]");
                }
                memoryParts.push(summary);
                currentTokens += summary.length * 0.25;
              }
            }
          } catch {
          }
        }
      }
    }
    if (memoryParts.length > 1) {
      return memoryParts.join("\n") + "\n\n[Task]";
    }
    return "";
  } catch (error) {
    console.warn("Memory context injection failed:", error);
    return "";
  }
}
async function buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow) {
  const vars = {
    date: (/* @__PURE__ */ new Date()).toISOString(),
    "run.id": runId,
    "run.timestamp": runId,
    "workflow.id": String(workflow.id ?? ""),
    "workflow.name": String(workflow.name ?? workflow.id ?? workflowFile)
  };
  const { run: runSnap } = await loadRunFile(teamDir, runsDir, runId);
  if (runSnap.triggerInput && typeof runSnap.triggerInput === "object") {
    for (const [key, value] of Object.entries(runSnap.triggerInput)) {
      if (typeof value === "string") {
        vars[`trigger.${key}`] = value;
      } else if (value !== null && value !== void 0) {
        vars[`trigger.${key}`] = JSON.stringify(value);
      }
    }
  }
  for (const nr of runSnap.nodeResults ?? []) {
    const nid = String(nr.nodeId ?? "");
    const nrOutPath = String(nr.nodeOutputPath ?? "");
    if (nid && nrOutPath) {
      try {
        const outAbs = import_node_path23.default.resolve(teamDir, nrOutPath);
        const outputContent = await readTextFile(outAbs);
        vars[`${nid}.output`] = outputContent;
        try {
          const parsed = JSON.parse(outputContent.trim());
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            for (const [key, value] of Object.entries(parsed)) {
              if (typeof value === "string") {
                vars[`${nid}.${key}`] = value;
                if (key === "text") {
                  try {
                    const nestedParsed = JSON.parse(value);
                    if (nestedParsed && typeof nestedParsed === "object" && !Array.isArray(nestedParsed)) {
                      for (const [nestedKey, nestedValue] of Object.entries(nestedParsed)) {
                        if (typeof nestedValue === "string") {
                          vars[`${nid}.${nestedKey}`] = nestedValue;
                        } else if (nestedValue !== null && nestedValue !== void 0) {
                          vars[`${nid}.${nestedKey}`] = JSON.stringify(nestedValue);
                        }
                      }
                    }
                  } catch {
                  }
                }
              } else if (value !== null && value !== void 0) {
                vars[`${nid}.${key}`] = JSON.stringify(value);
              }
            }
          }
        } catch {
        }
      } catch {
      }
    }
  }
  return vars;
}
async function enqueueWorkflowRunForHandoff(api, opts) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = import_node_path23.default.join(teamDir, "shared-context");
  const workflowsDir = import_node_path23.default.join(sharedContextDir, "workflows");
  const runsDir = import_node_path23.default.join(sharedContextDir, "workflow-runs");
  const workflowPath = import_node_path23.default.join(workflowsDir, opts.workflowFile);
  const raw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(raw));
  if (!workflow.nodes?.length) throw new Error("Handoff target workflow has no nodes");
  const firstLaneRaw = String(
    workflow.nodes.find((n) => n?.config && typeof n.config === "object" && "lane" in n.config)?.config?.lane ?? "backlog"
  );
  assertLane(firstLaneRaw);
  const initialLane = firstLaneRaw;
  const runId = `${isoCompact()}-${import_node_crypto3.default.randomBytes(4).toString("hex")}`;
  await ensureDir3(runsDir);
  const runDir = import_node_path23.default.join(runsDir, runId);
  await ensureDir3(runDir);
  await Promise.all([
    ensureDir3(import_node_path23.default.join(runDir, "node-outputs")),
    ensureDir3(import_node_path23.default.join(runDir, "artifacts")),
    ensureDir3(import_node_path23.default.join(runDir, "approvals"))
  ]);
  const runLogPath = import_node_path23.default.join(runDir, "run.json");
  const ticketNum = await nextTicketNumber(teamDir);
  const slug = `workflow-run-${(workflow.id ?? import_node_path23.default.basename(opts.workflowFile, import_node_path23.default.extname(opts.workflowFile))).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
  const ticketFile = `${ticketNum}-${slug}.md`;
  const laneDir2 = import_node_path23.default.join(teamDir, "work", initialLane);
  await ensureDir3(laneDir2);
  const ticketPath = import_node_path23.default.join(laneDir2, ticketFile);
  const trigger = opts.trigger ?? { kind: "handoff" };
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const handoffMeta = opts.triggerInput?._handoff;
  const md = [
    `# ${ticketNum} \u2014 Workflow run: ${workflow.name ?? workflow.id ?? opts.workflowFile}

`,
    `Owner: lead`,
    `Status: ${laneToStatus(initialLane)}`,
    `
## Run`,
    `- workflow: ${import_node_path23.default.relative(teamDir, workflowPath)}`,
    `- run dir: ${import_node_path23.default.relative(teamDir, runDir)}`,
    `- run file: ${import_node_path23.default.relative(teamDir, runLogPath)}`,
    `- trigger: ${trigger.kind}${trigger.at ? ` @ ${trigger.at}` : ""}`,
    `- runId: ${runId}`,
    handoffMeta ? `- handoff from: team=${handoffMeta.sourceTeamId}, workflow=${handoffMeta.sourceWorkflowName}, run=${handoffMeta.sourceRunId}` : "",
    `
## Notes`,
    `- Created by: handoff node`,
    ``
  ].filter(Boolean).join("\n");
  const initialLog = {
    runId,
    createdAt,
    updatedAt: createdAt,
    teamId,
    workflow: { file: opts.workflowFile, id: workflow.id ?? null, name: workflow.name ?? null },
    ticket: { file: import_node_path23.default.relative(teamDir, ticketPath), number: ticketNum, lane: initialLane },
    trigger,
    ...opts.triggerInput && Object.keys(opts.triggerInput).length > 0 ? { triggerInput: opts.triggerInput } : {},
    status: "queued",
    priority: 0,
    claimedBy: null,
    claimExpiresAt: null,
    nextNodeIndex: 0,
    events: [{ ts: createdAt, type: "run.enqueued", lane: initialLane, trigger: trigger.kind }],
    nodeResults: []
  };
  await Promise.all([
    import_promises17.default.writeFile(ticketPath, md, "utf8"),
    import_promises17.default.writeFile(runLogPath, JSON.stringify(initialLog, null, 2), "utf8")
  ]);
  return { runId, runLogPath };
}
async function checkWaitingHandoffs(api, teamId, teamDir) {
  const results = [];
  const runsDir = import_node_path23.default.join(teamDir, "shared-context", "workflow-runs");
  let runDirs = [];
  try {
    const entries = await import_promises17.default.readdir(runsDir, { withFileTypes: true });
    runDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return results;
  }
  for (const runDirName of runDirs) {
    const runDir = import_node_path23.default.join(runsDir, runDirName);
    const handoffWaitDir = import_node_path23.default.join(runDir, "handoff-waits");
    let waitFiles = [];
    try {
      const entries = await import_promises17.default.readdir(handoffWaitDir);
      waitFiles = entries.filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }
    if (waitFiles.length === 0) continue;
    const runPath = import_node_path23.default.join(runDir, "run.json");
    let run;
    try {
      const raw = await readTextFile(runPath);
      run = JSON.parse(raw);
    } catch {
      continue;
    }
    if (run.status !== "waiting_handoff") {
      for (const wf of waitFiles) {
        try {
          await import_promises17.default.unlink(import_node_path23.default.join(handoffWaitDir, wf));
        } catch {
        }
      }
      continue;
    }
    for (const waitFile of waitFiles) {
      const waitPath = import_node_path23.default.join(handoffWaitDir, waitFile);
      let marker;
      try {
        marker = await readJsonFile2(waitPath);
      } catch {
        continue;
      }
      const now = Date.now();
      if (new Date(marker.timeoutAt).getTime() <= now) {
        const failTs = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: "error",
          nodeStates: { ...cur.nodeStates ?? {}, [marker.nodeId]: { status: "error", ts: failTs, message: "Handoff wait timed out" } },
          events: [...cur.events, {
            ts: failTs,
            type: "node.error",
            nodeId: marker.nodeId,
            kind: "handoff",
            error: `Handoff wait timed out after ${Math.round((now - new Date(marker.startedAt).getTime()) / 1e3)}s`
          }]
        }));
        try {
          await import_promises17.default.unlink(waitPath);
        } catch {
        }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: "timeout" });
        continue;
      }
      const targetTeamDir = resolveTeamDir(api, marker.targetTeamId);
      const targetRunsDir = import_node_path23.default.join(targetTeamDir, "shared-context", "workflow-runs");
      let targetRun;
      try {
        const loaded = await loadRunFile(targetTeamDir, targetRunsDir, marker.targetRunId);
        targetRun = loaded.run;
      } catch {
        const failTs = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: "error",
          nodeStates: { ...cur.nodeStates ?? {}, [marker.nodeId]: { status: "error", ts: failTs, message: "Target run not found" } },
          events: [...cur.events, {
            ts: failTs,
            type: "node.error",
            nodeId: marker.nodeId,
            kind: "handoff",
            error: `Target run ${marker.targetRunId} not found in team ${marker.targetTeamId}`
          }]
        }));
        try {
          await import_promises17.default.unlink(waitPath);
        } catch {
        }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: "error" });
        continue;
      }
      if (targetRun.status === "completed" || targetRun.status === "done") {
        const targetOutput = {};
        if (Array.isArray(targetRun.nodeResults)) {
          for (const nr of targetRun.nodeResults) {
            if (nr.nodeId && typeof nr.nodeId === "string") {
              targetOutput[nr.nodeId] = nr;
            }
          }
        }
        const nodeOutputAbs = import_node_path23.default.resolve(runDir, marker.nodeOutputRel);
        await ensureDir3(import_node_path23.default.dirname(nodeOutputAbs));
        const outputObj = {
          runId: run.runId,
          teamId,
          nodeId: marker.nodeId,
          kind: "handoff",
          completedAt: (/* @__PURE__ */ new Date()).toISOString(),
          text: JSON.stringify({
            targetTeamId: marker.targetTeamId,
            targetWorkflowId: marker.targetWorkflowId,
            targetRunId: marker.targetRunId,
            status: "completed",
            targetOutput
          }, null, 2)
        };
        await import_promises17.default.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + "\n", "utf8");
        const completedTs = (/* @__PURE__ */ new Date()).toISOString();
        const workflowsDir = import_node_path23.default.join(teamDir, "shared-context", "workflows");
        let workflow;
        try {
          const wfRaw = await readTextFile(import_node_path23.default.join(workflowsDir, run.workflow.file));
          workflow = normalizeWorkflow(JSON.parse(wfRaw));
        } catch {
          workflow = null;
        }
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: "waiting_workers",
          nextNodeIndex: marker.nodeIdx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [marker.nodeId]: { status: "success", ts: completedTs } },
          events: [...cur.events, {
            ts: completedTs,
            type: "node.completed",
            nodeId: marker.nodeId,
            kind: "handoff",
            targetTeamId: marker.targetTeamId,
            targetWorkflowId: marker.targetWorkflowId,
            targetRunId: marker.targetRunId,
            mode: "wait-for-completion",
            nodeOutputPath: marker.nodeOutputRel
          }]
        }));
        if (workflow) {
          const updatedRun = (await loadRunFile(teamDir, runsDir, run.runId)).run;
          const nextIdx = pickNextRunnableNodeIndex({ workflow, run: updatedRun });
          if (nextIdx !== null && nextIdx >= 0 && nextIdx < workflow.nodes.length) {
            const nextNode = workflow.nodes[nextIdx];
            if (nextNode.type === "end" || nextNode.type === "start") {
              const autoTs = (/* @__PURE__ */ new Date()).toISOString();
              await appendRunLog(runPath, (cur) => ({
                ...cur,
                nextNodeIndex: nextIdx + 1,
                nodeStates: { ...cur.nodeStates ?? {}, [nextNode.id]: { status: "success", ts: autoTs } },
                events: [...cur.events, { ts: autoTs, type: "node.completed", nodeId: nextNode.id, kind: nextNode.type }]
              }));
              const afterAutoRun = (await loadRunFile(teamDir, runsDir, run.runId)).run;
              const afterNext = pickNextRunnableNodeIndex({ workflow, run: afterAutoRun });
              if (afterNext === null) {
                const doneTs = (/* @__PURE__ */ new Date()).toISOString();
                await appendRunLog(runPath, (cur) => ({
                  ...cur,
                  status: "completed",
                  events: [...cur.events, { ts: doneTs, type: "run.completed" }]
                }));
              }
            } else {
              const assignedAgent = String(nextNode.assignedTo ?? "").trim();
              const targetAgent = assignedAgent || run.claimedBy || "";
              if (targetAgent) {
                await enqueueTask(teamDir, targetAgent, {
                  teamId,
                  runId: run.runId,
                  nodeId: nextNode.id,
                  kind: "execute_node"
                });
              }
            }
          } else if (nextIdx === null) {
            const doneTs = (/* @__PURE__ */ new Date()).toISOString();
            await appendRunLog(runPath, (cur) => ({
              ...cur,
              status: "completed",
              events: [...cur.events, { ts: doneTs, type: "run.completed" }]
            }));
          }
        }
        try {
          await import_promises17.default.unlink(waitPath);
        } catch {
        }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: "completed" });
      } else if (targetRun.status === "error" || targetRun.status === "failed") {
        const failTs = (/* @__PURE__ */ new Date()).toISOString();
        const lastError = targetRun.events?.filter((e) => e.type === "node.error").pop();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: "error",
          nodeStates: { ...cur.nodeStates ?? {}, [marker.nodeId]: {
            status: "error",
            ts: failTs,
            message: `Target workflow failed: ${lastError?.error ?? "unknown error"}`
          } },
          events: [...cur.events, {
            ts: failTs,
            type: "node.error",
            nodeId: marker.nodeId,
            kind: "handoff",
            error: `Target run ${marker.targetRunId} failed`
          }]
        }));
        try {
          await import_promises17.default.unlink(waitPath);
        } catch {
        }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: "error" });
      }
    }
  }
  return results;
}
async function runWorkflowWorkerTick(api, opts) {
  const teamId = String(opts.teamId);
  const agentId = String(opts.agentId);
  if (!teamId) throw new Error("--team-id is required");
  if (!agentId) throw new Error("--agent-id is required");
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = import_node_path23.default.join(teamDir, "shared-context");
  const workflowsDir = import_node_path23.default.join(sharedContextDir, "workflows");
  const runsDir = import_node_path23.default.join(sharedContextDir, "workflow-runs");
  const workerId = String(opts.workerId ?? `workflow-worker:${process.pid}`);
  const limit = typeof opts.limit === "number" && opts.limit > 0 ? Math.floor(opts.limit) : 1;
  const results = [];
  try {
    const handoffResults = await checkWaitingHandoffs(api, teamId, teamDir);
    for (const hr of handoffResults) {
      results.push({ taskId: "", runId: hr.runId, nodeId: hr.nodeId, status: `handoff:${hr.status}` });
    }
  } catch {
  }
  const DEFAULT_LOCK_TTL_MS = 30 * 60 * 1e3;
  const MIN_NODE_LOCK_TTL_MS = 10 * 60 * 1e3;
  const LOCK_TTL_BUFFER_MS = 2 * 60 * 1e3;
  const getNodeLockTtlMs = (node) => {
    const timeoutMsRaw = asRecord(node?.config ?? {})["timeoutMs"];
    const timeoutMs = typeof timeoutMsRaw === "number" && Number.isFinite(timeoutMsRaw) ? timeoutMsRaw : 0;
    return Math.max(MIN_NODE_LOCK_TTL_MS, timeoutMs + LOCK_TTL_BUFFER_MS);
  };
  let executedCount = 0;
  const maxDequeues = Math.max(limit * 4, limit + 20);
  for (let totalDequeues = 0; executedCount < limit && totalDequeues < maxDequeues; totalDequeues++) {
    const dq = await dequeueNextTask(teamDir, agentId, { workerId, leaseSeconds: 120 });
    if (!dq.ok || !dq.task) break;
    const { task: task2 } = dq.task;
    const runPath = runFilePathFor(runsDir, task2.runId);
    const runDir = import_node_path23.default.dirname(runPath);
    const lockDir = import_node_path23.default.join(runDir, "locks");
    const lockPath = import_node_path23.default.join(lockDir, `${task2.nodeId}.lock`);
    let lockHeld = false;
    let countedTowardLimit = true;
    try {
      if (task2.kind !== "execute_node") continue;
      await ensureDir3(lockDir);
      const claimedAtIso = (/* @__PURE__ */ new Date()).toISOString();
      const lockInfo = {
        workerId,
        ...currentLockOwner(),
        taskId: task2.id,
        claimedAt: claimedAtIso,
        ttlMs: DEFAULT_LOCK_TTL_MS,
        expiresAt: new Date(Date.now() + DEFAULT_LOCK_TTL_MS).toISOString()
      };
      try {
        await import_promises17.default.writeFile(lockPath, JSON.stringify(lockInfo, null, 2), { encoding: "utf8", flag: "wx" });
        lockHeld = true;
      } catch {
        let unlocked = false;
        try {
          const raw = await readTextFile(lockPath);
          const parsed = JSON.parse(raw);
          const expiresAtMs = parsed?.expiresAt ? Date.parse(String(parsed.expiresAt)) : NaN;
          const claimedAtMs = parsed?.claimedAt ? Date.parse(String(parsed.claimedAt)) : NaN;
          const parsedTtlMs = typeof parsed?.ttlMs === "number" && Number.isFinite(parsed.ttlMs) ? parsed.ttlMs : NaN;
          const computedExpiryMs = Number.isFinite(claimedAtMs) && Number.isFinite(parsedTtlMs) ? claimedAtMs + parsedTtlMs : NaN;
          const effectiveExpiryMs = Number.isFinite(expiresAtMs) ? expiresAtMs : Number.isFinite(computedExpiryMs) ? computedExpiryMs : Number.isFinite(claimedAtMs) ? claimedAtMs + DEFAULT_LOCK_TTL_MS : NaN;
          const stale = Number.isFinite(effectiveExpiryMs) && Date.now() > effectiveExpiryMs;
          const dead = isLockHolderDead(parsed);
          if (stale || dead) {
            await import_promises17.default.unlink(lockPath);
            unlocked = true;
          }
        } catch {
        }
        if (unlocked) {
          try {
            await import_promises17.default.writeFile(lockPath, JSON.stringify(lockInfo, null, 2), { encoding: "utf8", flag: "wx" });
            lockHeld = true;
          } catch {
            results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "skipped_locked" });
            continue;
          }
        } else {
          const runStillExists = await fileExists3(runFilePathFor(runsDir, task2.runId));
          if (!runStillExists) {
            countedTowardLimit = false;
            results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "skipped_stale" });
            continue;
          }
          const alreadyPending = await hasPendingTaskFor(teamDir, agentId, {
            runId: task2.runId,
            nodeId: task2.nodeId
          });
          if (!alreadyPending) {
            await enqueueTask(teamDir, agentId, {
              teamId,
              runId: task2.runId,
              nodeId: task2.nodeId,
              kind: "execute_node"
            });
          }
          results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "skipped_locked" });
          continue;
        }
      }
      const runId = task2.runId;
      let run;
      let workflow;
      let workflowFile;
      let nodeIdx;
      try {
        ({ run } = await loadRunFile(teamDir, runsDir, runId));
        workflowFile = String(run.workflow.file);
        const workflowPath = import_node_path23.default.join(workflowsDir, workflowFile);
        const workflowRaw = await readTextFile(workflowPath);
        workflow = normalizeWorkflow(JSON.parse(workflowRaw));
        nodeIdx = workflow.nodes.findIndex((n) => String(n.id) === String(task2.nodeId));
        if (nodeIdx < 0) throw new Error(`Node not found in workflow: ${task2.nodeId}`);
      } catch (err) {
        countedTowardLimit = false;
        try {
          console.warn(`[workflow-worker] skip_stale taskId=${task2.id} runId=${task2.runId} nodeId=${task2.nodeId} reason=${err?.message ?? String(err)}`);
        } catch {
        }
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "skipped_stale" });
        continue;
      }
      const node = workflow.nodes[nodeIdx];
      try {
        const nodeLockTtlMs = getNodeLockTtlMs(node);
        if (nodeLockTtlMs !== lockInfo.ttlMs) {
          await import_promises17.default.writeFile(
            lockPath,
            JSON.stringify({ ...lockInfo, ttlMs: nodeLockTtlMs, expiresAt: new Date(Date.now() + nodeLockTtlMs).toISOString() }, null, 2),
            { encoding: "utf8" }
          );
        }
      } catch {
      }
      const currentNodeStates = loadNodeStatesFromRun(run, { workflow });
      const currentStatus = currentNodeStates[String(node.id)]?.status;
      const currentlyRunnableIdx = pickNextRunnableNodeIndex({ workflow, run });
      if (currentStatus === "success" || currentStatus === "error" || currentStatus === "waiting" || currentlyRunnableIdx === null || String(workflow.nodes[currentlyRunnableIdx]?.id ?? "") !== String(node.id)) {
        countedTowardLimit = false;
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "skipped_stale" });
        continue;
      }
      const laneRaw = String(run.ticket.lane);
      assertLane(laneRaw);
      let curLane = laneRaw;
      let curTicketPath = import_node_path23.default.join(teamDir, run.ticket.file);
      const laneNodeRaw = node?.lane ? String(node.lane) : null;
      if (laneNodeRaw) {
        assertLane(laneNodeRaw);
        if (laneNodeRaw !== curLane) {
          const moved = await moveRunTicket({ teamDir, ticketPath: curTicketPath, toLane: laneNodeRaw });
          curLane = laneNodeRaw;
          curTicketPath = moved.ticketPath;
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            ticket: { ...cur.ticket, file: import_node_path23.default.relative(teamDir, curTicketPath), lane: curLane },
            events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "ticket.moved", lane: curLane, nodeId: node.id }]
          }));
        }
      }
      const kind = String(node.kind ?? "");
      if (kind === "start" || kind === "end") {
        const completedTs = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: nodeIdx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "success", ts: completedTs } },
          events: [...cur.events, { ts: completedTs, type: "node.completed", nodeId: node.id, kind, noop: true }],
          nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind, noop: true }]
        }));
      } else if (kind === "llm") {
        const runLogPath = runPath;
        const runId2 = task2.runId;
        const agentIdExec = String(node?.assignedTo?.agentId ?? "");
        const action = asRecord(node.action);
        const promptTemplatePath = asString(action["promptTemplatePath"]).trim();
        const promptTemplateInline = asString(action["promptTemplate"]).trim();
        if (!agentIdExec) throw new Error(`Node ${nodeLabel(node)} missing assignedTo.agentId`);
        if (!promptTemplatePath && !promptTemplateInline) throw new Error(`Node ${nodeLabel(node)} missing action.promptTemplatePath or action.promptTemplate`);
        const promptPathAbs = promptTemplatePath ? import_node_path23.default.resolve(teamDir, promptTemplatePath) : "";
        const defaultNodeOutputRel = import_node_path23.default.join("node-outputs", `${String(nodeIdx).padStart(3, "0")}-${node.id}.json`);
        const nodeOutputRel = String(node?.output?.path ?? "").trim() || defaultNodeOutputRel;
        const nodeOutputAbs = import_node_path23.default.resolve(runDir, nodeOutputRel);
        if (!nodeOutputAbs.startsWith(runDir + import_node_path23.default.sep) && nodeOutputAbs !== runDir) {
          throw new Error(`Node output.path must be within the run directory: ${nodeOutputRel}`);
        }
        await ensureDir3(import_node_path23.default.dirname(nodeOutputAbs));
        const promptRaw = promptTemplateInline ? promptTemplateInline : await readTextFile(promptPathAbs);
        const vars = await buildTemplateVars(teamDir, runsDir, runId2, workflowFile, workflow);
        const promptVarsResolved = templateReplace(promptRaw, vars);
        const prompt = await expandFileIncludes(promptVarsResolved, teamDir);
        const nodeConfig = asRecord(node["config"]);
        const outputFields = Array.isArray(nodeConfig["outputFields"]) ? nodeConfig["outputFields"] : [];
        const validFields = outputFields.filter((f) => typeof f === "object" && f && typeof f["name"] === "string" && f["name"].trim());
        let outputFormatBlock;
        if (validFields.length > 0) {
          const fieldDescriptions = validFields.map((f) => {
            const name = String(f["name"]).trim();
            const type = String(f["type"] ?? "text").trim();
            const typeHint = type === "list" ? "(array of strings)" : type === "json" ? "(JSON object)" : "(string)";
            return `  - "${name}" ${typeHint}`;
          }).join("\n");
          outputFormatBlock = [
            "Return a JSON object with EXACTLY these fields:",
            fieldDescriptions,
            "",
            "Rules:",
            "- Return ONLY the JSON object, no markdown fences or explanation.",
            "- Every field listed above MUST be present in your response.",
            '- "text" fields \u2192 string values.',
            '- "list" fields \u2192 arrays of strings.',
            '- "json" fields \u2192 nested JSON objects.',
            "- You may include additional fields if genuinely useful, but the listed fields are required."
          ].join("\n");
        } else {
          outputFormatBlock = "Return ONLY the final content (the worker will store it as JSON).";
        }
        const taskText = [
          `You are executing a workflow run for teamId=${teamId}.`,
          `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
          `RunId: ${runId2}`,
          `Node: ${nodeLabel(node)}`,
          `
---
PROMPT TEMPLATE
---
`,
          prompt.trim(),
          `
---
OUTPUT FORMAT
---
`,
          outputFormatBlock
        ].join("\n");
        let text = "";
        try {
          const priorInput = await loadPriorLlmInput({ runDir, workflow, currentNode: node, currentNodeIndex: nodeIdx });
          const timeoutMsRaw = Number(asString(action["timeoutMs"] ?? node?.config?.["timeoutMs"] ?? "120000"));
          const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 12e4;
          const configuredModel = asString(action["model"] ?? node?.config?.["model"]).trim();
          const configuredProvider = asString(action["provider"] ?? node?.config?.["provider"]).trim();
          let provider = configuredProvider;
          let model = configuredModel;
          if (model) {
            const slash = model.indexOf("/");
            if (slash > 0 && slash < model.length - 1) {
              const modelProvider = model.slice(0, slash).trim();
              const bareModel = model.slice(slash + 1).trim();
              if (!provider) provider = modelProvider;
              if (provider === modelProvider) model = bareModel;
            }
          }
          const memoryContext = await buildMemoryContext(teamDir);
          const promptWithMemory = memoryContext ? `${memoryContext}

${taskText}` : taskText;
          let outputSchema;
          if (validFields.length > 0) {
            const properties = {};
            const required = [];
            for (const f of validFields) {
              const name = String(f["name"]).trim();
              const type = String(f["type"] ?? "text").trim();
              required.push(name);
              if (type === "list") {
                properties[name] = { type: "array", items: { type: "string" } };
              } else if (type === "json") {
                properties[name] = { type: "object" };
              } else {
                properties[name] = { type: "string" };
              }
            }
            outputSchema = {
              type: "object",
              properties,
              required
            };
          }
          const llmRes = await toolsInvoke(api, {
            tool: "llm-task",
            action: "json",
            args: {
              prompt: promptWithMemory,
              input: { teamId, runId: runId2, nodeId: node.id, agentId, ...priorInput },
              timeoutMs,
              ...provider ? { provider } : {},
              ...model ? { model } : {},
              ...outputSchema ? { schema: outputSchema } : {}
            }
          });
          const llmRec = asRecord(llmRes);
          const details = asRecord(llmRec["details"]);
          const payload = details["json"] ?? (Object.keys(details).length ? details : llmRes) ?? null;
          text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
        } catch (e) {
          const eRec = asRecord(e);
          const errorCategory = classifyError(e);
          const errorDetails = {
            message: e instanceof Error ? e.message : String(e),
            name: e instanceof Error ? e.name : void 0,
            stack: e instanceof Error ? e.stack : void 0,
            error: eRec["error"],
            details: eRec["details"],
            data: eRec["data"],
            cause: e instanceof Error && "cause" in e ? e.cause : void 0,
            errorCategory,
            errorCategoryLabel: errorCategory !== "unknown" ? errorCategoryLabel(errorCategory) : void 0
          };
          const errMsg = `LLM execution failed for node ${nodeLabel(node)}: ${errorDetails.message}`;
          const errorTs = (/* @__PURE__ */ new Date()).toISOString();
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            status: "error",
            updatedAt: errorTs,
            nodeStates: {
              ...cur.nodeStates ?? {},
              [node.id]: { status: "error", ts: errorTs, error: errMsg, details: errorDetails, errorCategory }
            },
            events: [
              ...cur.events,
              { ts: errorTs, type: "node.error", nodeId: node.id, kind: node.kind, message: errMsg, details: errorDetails, errorCategory }
            ],
            nodeResults: [
              ...cur.nodeResults ?? [],
              { nodeId: node.id, kind: node.kind, agentId: agentIdExec, error: errMsg, details: errorDetails, errorCategory }
            ]
          }));
          results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "error", errorCategory });
          continue;
        }
        const outputObj = {
          runId: runId2,
          teamId,
          nodeId: node.id,
          kind: node.kind,
          agentId: agentIdExec,
          completedAt: (/* @__PURE__ */ new Date()).toISOString(),
          text
        };
        await import_promises17.default.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + "\n", "utf8");
        const completedTs = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runLogPath, (cur) => ({
          ...cur,
          nextNodeIndex: nodeIdx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "success", ts: completedTs } },
          events: [...cur.events, { ts: completedTs, type: "node.completed", nodeId: node.id, kind: node.kind, nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs) }],
          nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind: node.kind, agentId: agentIdExec, nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs), bytes: Buffer.byteLength(text, "utf8") }]
        }));
      } else if (kind === "human_approval") {
        const approvalBindingId = String(node?.action?.approvalBindingId ?? "");
        const config = asRecord(node["config"]);
        const action = asRecord(node.action);
        const provider = asString(config["provider"] ?? action["provider"]).trim();
        const targetRaw = config["target"] ?? action["target"];
        const accountIdRaw = config["accountId"] ?? action["accountId"];
        let channel = provider || "telegram";
        let target = String(targetRaw ?? "");
        let accountId = accountIdRaw ? String(accountIdRaw) : void 0;
        if (target && /^\(set in ui\)$/i.test(target.trim())) {
          target = "";
        }
        if (approvalBindingId) {
          try {
            const resolved = await resolveApprovalBindingTarget(api, approvalBindingId);
            channel = resolved.channel;
            target = resolved.target;
            accountId = resolved.accountId;
          } catch {
            if (!target && approvalBindingId.startsWith("telegram:")) {
              channel = "telegram";
              accountId = approvalBindingId.replace(/^telegram:account:/, "");
            } else {
              throw new Error(
                `Missing approval binding: approvalBindingId=${approvalBindingId}. Expected a config binding entry OR provide config.target.`
              );
            }
          }
        }
        if (!target && channel === "telegram") {
          if (accountId === "shawnjbot") target = "6477250615";
        }
        if (!target) {
          throw new Error(`Node ${nodeLabel(node)} missing approval target (provide config.target or binding mapping)`);
        }
        const approvalsDir = import_node_path23.default.join(runDir, "approvals");
        await ensureDir3(approvalsDir);
        const approvalPath = import_node_path23.default.join(approvalsDir, "approval.json");
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const approvalObj = {
          runId: task2.runId,
          teamId,
          workflowFile,
          nodeId: node.id,
          bindingId: approvalBindingId || void 0,
          requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
          status: "pending",
          code,
          ticket: import_node_path23.default.relative(teamDir, curTicketPath),
          runLog: import_node_path23.default.relative(teamDir, runPath)
        };
        await import_promises17.default.writeFile(approvalPath, JSON.stringify(approvalObj, null, 2), "utf8");
        let proposed = "";
        try {
          const nodeOutputsDir = import_node_path23.default.join(runDir, "node-outputs");
          const qcId = "qc_brand";
          const hasQc = await fileExists3(nodeOutputsDir) && (await import_promises17.default.readdir(nodeOutputsDir)).some((f) => f.endsWith(`-${qcId}.json`));
          const priorId = hasQc ? qcId : String(workflow.nodes?.[Math.max(0, nodeIdx - 1)]?.id ?? "");
          if (priorId) proposed = await loadProposedPostTextFromPriorNode({ runDir, nodeOutputsDir, priorNodeId: priorId });
        } catch {
          proposed = "";
        }
        proposed = sanitizeDraftOnlyText(proposed);
        const kitchenReviewUrl = buildKitchenWorkflowReviewUrl(api, teamId, String(workflow.id ?? ""));
        const msg = [
          `Approval requested: ${workflow.name ?? workflow.id ?? workflowFile}`,
          `Ticket: ${import_node_path23.default.relative(teamDir, curTicketPath)}`,
          `Code: ${code}`,
          proposed ? `
---
PROPOSED POST [X]
---
${proposed}` : `
(Warning: no proposed text found to preview)`,
          `
Reply with:`,
          `- approve ${code}`,
          `- decline ${code} <what to change>`,
          `
(You can also review in Kitchen: ${kitchenReviewUrl})`
        ].join("\n");
        await toolsInvoke(api, {
          tool: "message",
          args: {
            action: "send",
            channel,
            target,
            ...accountId ? { accountId } : {},
            message: msg
          }
        });
        const waitingTs = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: "awaiting_approval",
          nextNodeIndex: nodeIdx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "waiting", ts: waitingTs } },
          events: [...cur.events, { ts: waitingTs, type: "node.awaiting_approval", nodeId: node.id, bindingId: approvalBindingId, approvalFile: import_node_path23.default.relative(teamDir, approvalPath) }],
          nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind: node.kind, approvalBindingId, approvalFile: import_node_path23.default.relative(teamDir, approvalPath) }]
        }));
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "awaiting_approval" });
        continue;
      } else if (kind === "tool") {
        const action = asRecord(node.action);
        const toolName = asString(action["tool"]).trim();
        const toolArgs = isRecord(action["args"]) ? action["args"] : {};
        if (!toolName) throw new Error(`Node ${nodeLabel(node)} missing action.tool`);
        const artifactsDir = import_node_path23.default.join(runDir, "artifacts");
        await ensureDir3(artifactsDir);
        const artifactPath = import_node_path23.default.join(artifactsDir, `${String(nodeIdx).padStart(3, "0")}-${node.id}.tool.json`);
        let toolOutputText = "";
        try {
          if (toolName === "fs.append") {
            const relPathRaw = String(toolArgs.path ?? "").trim();
            const contentRaw = String(toolArgs.content ?? "");
            if (!relPathRaw) throw new Error("fs.append requires args.path");
            if (!contentRaw) throw new Error("fs.append requires args.content");
            const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);
            const relPath = templateReplace(relPathRaw, vars);
            const content = templateReplace(contentRaw, vars);
            const abs = import_node_path23.default.resolve(teamDir, relPath);
            if (!abs.startsWith(teamDir + import_node_path23.default.sep) && abs !== teamDir) {
              throw new Error("fs.append path must be within the team workspace");
            }
            await ensureDir3(import_node_path23.default.dirname(abs));
            await import_promises17.default.appendFile(abs, content, "utf8");
            const result = { appendedTo: import_node_path23.default.relative(teamDir, abs), bytes: Buffer.byteLength(content, "utf8") };
            await import_promises17.default.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2) + "\n", "utf8");
            toolOutputText = JSON.stringify(result);
          } else if (toolName === "fs.write") {
            const relPathRaw = String(toolArgs.path ?? "").trim();
            const contentRaw = String(toolArgs.content ?? "");
            if (!relPathRaw) throw new Error("fs.write requires args.path");
            const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);
            const relPath = templateReplace(relPathRaw, vars);
            const content = templateReplace(contentRaw, vars);
            const abs = import_node_path23.default.resolve(teamDir, relPath);
            if (!abs.startsWith(teamDir + import_node_path23.default.sep) && abs !== teamDir) {
              throw new Error("fs.write path must be within the team workspace");
            }
            await ensureDir3(import_node_path23.default.dirname(abs));
            await import_promises17.default.writeFile(abs, content, "utf8");
            const result = { writtenTo: import_node_path23.default.relative(teamDir, abs), bytes: Buffer.byteLength(content, "utf8") };
            await import_promises17.default.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2) + "\n", "utf8");
            toolOutputText = JSON.stringify(result);
          } else {
            const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);
            const processedToolArgs = {};
            for (const [key, value] of Object.entries(toolArgs)) {
              if (typeof value === "string") {
                processedToolArgs[key] = templateReplace(value, vars);
              } else if (value && typeof value === "object" && !Array.isArray(value)) {
                const processedObject = {};
                for (const [nestedKey, nestedValue] of Object.entries(value)) {
                  if (typeof nestedValue === "string") {
                    processedObject[nestedKey] = templateReplace(nestedValue, vars);
                  } else {
                    processedObject[nestedKey] = nestedValue;
                  }
                }
                processedToolArgs[key] = processedObject;
              } else {
                processedToolArgs[key] = value;
              }
            }
            let toolRes;
            if (toolName === "exec") {
              const command = String(processedToolArgs.command ?? "");
              const workdir = String(processedToolArgs.workdir ?? teamDir);
              const nodeConfig = asRecord(node["config"]);
              const argsTimeoutSec = Number(processedToolArgs.timeout) || 0;
              const configTimeoutMs = Number(nodeConfig["timeoutMs"]) || 0;
              const timeoutSec = argsTimeoutSec || (configTimeoutMs > 0 ? Math.ceil(configTimeoutMs / 1e3) : 120);
              const result = await api.runtime.system.runCommandWithTimeout(
                ["bash", "-c", command],
                { timeoutMs: timeoutSec * 1e3, cwd: workdir }
              );
              if (result.code !== 0) {
                const stderr = String(result.stderr ?? "").trim();
                const stdout = String(result.stdout ?? "").trim();
                const combined = [stderr, stdout].filter(Boolean).join("\n---stdout---\n");
                throw new Error(`exec failed (code=${result.code}):
${combined}`);
              }
              toolRes = { stdout: result.stdout, stderr: result.stderr, code: result.code };
            } else {
              toolRes = await toolsInvoke(api, {
                tool: toolName,
                args: processedToolArgs
              });
            }
            await import_promises17.default.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: processedToolArgs, result: toolRes }, null, 2) + "\n", "utf8");
            if (toolName === "exec" && toolRes && typeof toolRes === "object" && "stdout" in toolRes) {
              toolOutputText = String(toolRes.stdout ?? "").trim();
            } else if (typeof toolRes === "string") {
              toolOutputText = toolRes;
            } else {
              toolOutputText = JSON.stringify(toolRes, null, 2);
            }
          }
          const defaultNodeOutputRel = import_node_path23.default.join("node-outputs", `${String(nodeIdx).padStart(3, "0")}-${node.id}.json`);
          const nodeOutputRel = String(node?.output?.path ?? "").trim() || defaultNodeOutputRel;
          const nodeOutputAbs = import_node_path23.default.resolve(runDir, nodeOutputRel);
          await ensureDir3(import_node_path23.default.dirname(nodeOutputAbs));
          await import_promises17.default.writeFile(nodeOutputAbs, JSON.stringify({
            runId: task2.runId,
            teamId,
            nodeId: node.id,
            kind: node.kind,
            completedAt: (/* @__PURE__ */ new Date()).toISOString(),
            tool: toolName,
            text: toolOutputText,
            artifactPath: import_node_path23.default.relative(teamDir, artifactPath)
          }, null, 2) + "\n", "utf8");
          const completedTs = (/* @__PURE__ */ new Date()).toISOString();
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            nextNodeIndex: nodeIdx + 1,
            nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "success", ts: completedTs } },
            events: [...cur.events, { ts: completedTs, type: "node.completed", nodeId: node.id, kind: node.kind, artifactPath: import_node_path23.default.relative(teamDir, artifactPath), nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs) }],
            nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind: node.kind, tool: toolName, artifactPath: import_node_path23.default.relative(teamDir, artifactPath), nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs) }]
          }));
        } catch (e) {
          const errorCategory = classifyError(e);
          await import_promises17.default.writeFile(artifactPath, JSON.stringify({ ok: false, tool: toolName, error: e.message, errorCategory }, null, 2) + "\n", "utf8");
          const errorTs = (/* @__PURE__ */ new Date()).toISOString();
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            status: "error",
            nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "error", ts: errorTs, errorCategory } },
            events: [...cur.events, { ts: errorTs, type: "node.error", nodeId: node.id, kind: node.kind, tool: toolName, message: e.message, artifactPath: import_node_path23.default.relative(teamDir, artifactPath), errorCategory }],
            nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind: node.kind, tool: toolName, error: e.message, artifactPath: import_node_path23.default.relative(teamDir, artifactPath), errorCategory }]
          }));
          results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "error", error: e.message, errorCategory });
          continue;
        }
      } else if (kind === "media-image" || kind === "media-video" || kind === "media-audio") {
        const config = asRecord(node["config"]);
        const action = asRecord(node.action);
        const mediaType = asString(config["mediaType"] ?? kind.replace("media-", "")).trim() || "image";
        const provider = asString(config["provider"] ?? action["provider"]).trim();
        const promptTemplateRaw = asString(config["promptTemplate"] ?? config["prompt"] ?? action["promptTemplate"] ?? action["prompt"]).trim();
        const size = asString(config["size"]).trim() || "1024x1024";
        const quality = asString(config["quality"]).trim() || "standard";
        const style = asString(config["style"]).trim() || "natural";
        const outputPathRaw = asString(config["outputPath"]).trim();
        const agentIdMedia = asString(config["agentId"] ?? action["agentId"] ?? "").trim();
        if (!promptTemplateRaw) throw new Error(`Node ${nodeLabel(node)} missing prompt or promptTemplate for media generation`);
        const vars = await buildTemplateVars(teamDir, runsDir, task2.runId, workflowFile, workflow);
        vars["node.id"] = node.id;
        const promptVarsResolved = templateReplace(promptTemplateRaw, vars);
        const prompt = await expandFileIncludes(promptVarsResolved, teamDir);
        const outputRelPath = templateReplace(outputPathRaw, vars);
        const defaultNodeOutputRel = import_node_path23.default.join("node-outputs", `${String(nodeIdx).padStart(3, "0")}-${node.id}.json`);
        const nodeOutputRel = String(node?.output?.path ?? "").trim() || defaultNodeOutputRel;
        const nodeOutputAbs = import_node_path23.default.resolve(runDir, nodeOutputRel);
        await ensureDir3(import_node_path23.default.dirname(nodeOutputAbs));
        const mediaDir = outputRelPath ? import_node_path23.default.resolve(runDir, import_node_path23.default.dirname(outputRelPath)) : import_node_path23.default.resolve(runDir, "media");
        await ensureDir3(mediaDir);
        const promptKey = mediaType === "video" ? "video_prompt" : "image_prompt";
        let text = "";
        try {
          const memoryContext = await buildMemoryContext(teamDir);
          const timeoutMsRaw = Number(asString(config["timeoutMs"] ?? "300000"));
          const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 3e5;
          const addRefinement = String(config["addRefinement"] ?? config["add_refinement"] ?? "false").toLowerCase() === "true";
          let refinedPrompt = prompt.trim();
          if (addRefinement && mediaType !== "image") {
            const step1Text = [
              `You are a media prompt engineer for teamId=${teamId}.`,
              `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
              `Node: ${nodeLabel(node)} | Media type: ${mediaType}`,
              `Size: ${size} | Quality: ${quality} | Style: ${style}`,
              `
---
INPUT PROMPT
---
`,
              prompt.trim(),
              `
---
INSTRUCTIONS
---
`,
              `Refine the input into a detailed, production-ready ${mediaType} generation prompt.`,
              `Return JSON with exactly one key: "${promptKey}" containing the refined prompt string.`,
              `Example: {"${promptKey}": "A detailed description..."}`
            ].filter(Boolean).join("\n");
            const step1Prompt = memoryContext ? `${memoryContext}

${step1Text}` : step1Text;
            try {
              const step1Res = await toolsInvoke(api, {
                tool: "llm-task",
                action: "json",
                args: { prompt: step1Prompt, timeoutMs: 6e4 }
              });
              const step1Rec = asRecord(step1Res);
              const step1Details = asRecord(step1Rec["details"]);
              const step1Json = step1Details["json"] ?? step1Details ?? step1Res;
              const extracted = asString(
                step1Json[promptKey] ?? step1Json["image_prompt"] ?? step1Json["video_prompt"] ?? step1Json["prompt"]
              ).trim();
              if (extracted) refinedPrompt = extracted;
            } catch {
            }
          }
          if (!refinedPrompt) throw new Error("Empty prompt for media generation");
          const MAX_IMAGE_PROMPT_LEN = 3800;
          if (mediaType === "image" && refinedPrompt.length > MAX_IMAGE_PROMPT_LEN) {
            refinedPrompt = refinedPrompt.slice(0, MAX_IMAGE_PROMPT_LEN).replace(/\s+\S*$/, "") + "...";
          }
          const providerSlug = provider;
          let driver = getDriver(providerSlug);
          if (!driver) {
            const discovered = await GenericDriver.createFromSkill(providerSlug);
            if (discovered) driver = discovered;
          }
          let payload;
          if (driver) {
            const result = await driver.invoke({
              api,
              prompt: refinedPrompt,
              outputDir: mediaDir,
              timeout: timeoutMs,
              config: node.config
            });
            payload = {
              [promptKey]: refinedPrompt,
              file_path: result.filePath,
              status: result.filePath ? "success" : "error",
              skill: driver.slug,
              script_output: result.metadata?.script_output ?? "",
              error: result.filePath ? null : "No file path returned from driver"
            };
          } else {
            payload = {
              [promptKey]: refinedPrompt,
              file_path: "",
              status: "no_driver",
              skill: providerSlug,
              error: `No media driver found for provider "${providerSlug}"`
            };
          }
          text = JSON.stringify(payload, null, 2);
        } catch (e) {
          const errorCategory = classifyError(e);
          const errDetails = e instanceof Error ? { message: e.message, name: e.name, stack: e.stack?.split("\n").slice(0, 5).join(" | ") } : { message: String(e) };
          const errMsg = `Media generation failed for node ${nodeLabel(node)}: ${JSON.stringify(errDetails)}`;
          const errorTs = (/* @__PURE__ */ new Date()).toISOString();
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            status: "error",
            updatedAt: errorTs,
            nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "error", ts: errorTs, error: errMsg, errorCategory } },
            events: [...cur.events, { ts: errorTs, type: "node.error", nodeId: node.id, kind: node.kind, message: errMsg, errorCategory }],
            nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind: node.kind, agentId: agentIdMedia || agentId, error: errMsg, errorCategory }]
          }));
          results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "error", errorCategory });
          continue;
        }
        const outputObj = {
          runId: task2.runId,
          teamId,
          nodeId: node.id,
          kind: node.kind,
          mediaType,
          provider,
          agentId: agentIdMedia || agentId,
          completedAt: (/* @__PURE__ */ new Date()).toISOString(),
          outputPath: outputRelPath,
          mediaDir,
          text
        };
        await import_promises17.default.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + "\n", "utf8");
        const completedTs = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: nodeIdx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "success", ts: completedTs } },
          events: [...cur.events, { ts: completedTs, type: "node.completed", nodeId: node.id, kind: node.kind, nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs) }],
          nodeResults: [...cur.nodeResults ?? [], { nodeId: node.id, kind: node.kind, mediaType, agentId: agentIdMedia || agentId, nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs), bytes: new TextEncoder().encode(text).byteLength }]
        }));
      } else if (kind === "handoff") {
        const config = asRecord(node["config"]);
        const action = asRecord(node.action);
        const targetTeamId = asString(config["targetTeamId"] ?? action["targetTeamId"]).trim() || teamId;
        const targetWorkflowId = asString(config["targetWorkflowId"] ?? action["targetWorkflowId"]).trim();
        if (!targetWorkflowId) throw new Error(`Node ${nodeLabel(node)} missing config.targetWorkflowId`);
        const variableMapping = asRecord(config["variableMapping"] ?? action["variableMapping"]);
        const vars = await buildTemplateVars(teamDir, runsDir, task2.runId, workflowFile, workflow);
        vars["node.id"] = node.id;
        const triggerInput = {
          _handoff: {
            sourceTeamId: teamId,
            sourceWorkflowId: String(workflow.id ?? ""),
            sourceWorkflowName: String(workflow.name ?? workflow.id ?? workflowFile),
            sourceRunId: task2.runId,
            sourceNodeId: node.id
          }
        };
        for (const [targetKey, templateExpr] of Object.entries(variableMapping)) {
          if (typeof templateExpr === "string") {
            triggerInput[targetKey] = templateReplace(templateExpr, vars);
          }
        }
        const targetTeamDir = resolveTeamDir(api, targetTeamId);
        const targetWorkflowsDir = import_node_path23.default.join(targetTeamDir, "shared-context", "workflows");
        let targetWorkflowFile = "";
        const candidateFiles = [
          `${targetWorkflowId}.json`,
          `${targetWorkflowId}`
        ];
        for (const candidate of candidateFiles) {
          const candidatePath = import_node_path23.default.join(targetWorkflowsDir, candidate);
          if (await fileExists3(candidatePath)) {
            targetWorkflowFile = candidate;
            break;
          }
        }
        if (!targetWorkflowFile) {
          try {
            const wfFiles = await import_promises17.default.readdir(targetWorkflowsDir);
            for (const wf of wfFiles) {
              if (!wf.endsWith(".json")) continue;
              try {
                const wfPath = import_node_path23.default.join(targetWorkflowsDir, wf);
                const wfRaw = await readTextFile(wfPath);
                const wfParsed = JSON.parse(wfRaw);
                if (String(wfParsed.id ?? "") === targetWorkflowId || String(wfParsed.name ?? "") === targetWorkflowId) {
                  targetWorkflowFile = wf;
                  break;
                }
              } catch {
              }
            }
          } catch {
          }
        }
        if (!targetWorkflowFile) {
          throw new Error(`Handoff target workflow "${targetWorkflowId}" not found in team "${targetTeamId}"`);
        }
        const enqueueResult = await enqueueWorkflowRunForHandoff(api, {
          teamId: targetTeamId,
          workflowFile: targetWorkflowFile,
          trigger: { kind: "handoff", at: (/* @__PURE__ */ new Date()).toISOString() },
          triggerInput
        });
        const handoffMode = asString(config["mode"] ?? "fire-and-forget").trim() || "fire-and-forget";
        const defaultNodeOutputRel = import_node_path23.default.join("node-outputs", `${String(nodeIdx).padStart(3, "0")}-${node.id}.json`);
        const nodeOutputRel = String(node?.output?.path ?? "").trim() || defaultNodeOutputRel;
        const nodeOutputAbs = import_node_path23.default.resolve(runDir, nodeOutputRel);
        await ensureDir3(import_node_path23.default.dirname(nodeOutputAbs));
        if (handoffMode === "wait-for-completion") {
          const waitTimeoutMs = typeof config["waitTimeoutMs"] === "number" ? config["waitTimeoutMs"] : 5 * 60 * 1e3;
          const outputObj = {
            runId: task2.runId,
            teamId,
            nodeId: node.id,
            kind: "handoff",
            text: JSON.stringify({
              targetTeamId,
              targetWorkflowId,
              targetWorkflowFile,
              targetRunId: enqueueResult.runId,
              status: "waiting",
              triggerInputKeys: Object.keys(triggerInput)
            }, null, 2)
          };
          await import_promises17.default.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + "\n", "utf8");
          const handoffWaitDir = import_node_path23.default.join(runDir, "handoff-waits");
          await ensureDir3(handoffWaitDir);
          const waitMarker = {
            nodeId: node.id,
            nodeIdx,
            targetTeamId,
            targetWorkflowId,
            targetWorkflowFile,
            targetRunId: enqueueResult.runId,
            startedAt: (/* @__PURE__ */ new Date()).toISOString(),
            timeoutAt: new Date(Date.now() + waitTimeoutMs).toISOString(),
            nodeOutputRel
          };
          await import_promises17.default.writeFile(
            import_node_path23.default.join(handoffWaitDir, `${node.id}.json`),
            JSON.stringify(waitMarker, null, 2) + "\n",
            "utf8"
          );
          const waitingTs = (/* @__PURE__ */ new Date()).toISOString();
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            status: "waiting_handoff",
            nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "waiting", ts: waitingTs } },
            events: [...cur.events, {
              ts: waitingTs,
              type: "node.waiting_handoff",
              nodeId: node.id,
              kind: "handoff",
              targetTeamId,
              targetWorkflowId,
              targetRunId: enqueueResult.runId,
              mode: "wait-for-completion",
              timeoutAt: waitMarker.timeoutAt
            }],
            nodeResults: [...cur.nodeResults ?? [], {
              nodeId: node.id,
              kind: "handoff",
              targetTeamId,
              targetWorkflowId,
              targetRunId: enqueueResult.runId,
              nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs)
            }]
          }));
          results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "waiting_handoff" });
          continue;
        } else {
          const outputObj = {
            runId: task2.runId,
            teamId,
            nodeId: node.id,
            kind: "handoff",
            completedAt: (/* @__PURE__ */ new Date()).toISOString(),
            text: JSON.stringify({
              targetTeamId,
              targetWorkflowId,
              targetWorkflowFile,
              targetRunId: enqueueResult.runId,
              status: "enqueued",
              triggerInputKeys: Object.keys(triggerInput)
            }, null, 2)
          };
          await import_promises17.default.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + "\n", "utf8");
          const completedTs = (/* @__PURE__ */ new Date()).toISOString();
          await appendRunLog(runPath, (cur) => ({
            ...cur,
            nextNodeIndex: nodeIdx + 1,
            nodeStates: { ...cur.nodeStates ?? {}, [node.id]: { status: "success", ts: completedTs } },
            events: [...cur.events, {
              ts: completedTs,
              type: "node.completed",
              nodeId: node.id,
              kind: "handoff",
              targetTeamId,
              targetWorkflowId,
              targetRunId: enqueueResult.runId,
              nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs)
            }],
            nodeResults: [...cur.nodeResults ?? [], {
              nodeId: node.id,
              kind: "handoff",
              targetTeamId,
              targetWorkflowId,
              targetRunId: enqueueResult.runId,
              nodeOutputPath: import_node_path23.default.relative(teamDir, nodeOutputAbs)
            }]
          }));
        }
      } else {
        throw new Error(`Worker does not yet support node kind: ${kind}`);
      }
      let updated = (await loadRunFile(teamDir, runsDir, task2.runId)).run;
      if (updated.status === "awaiting_approval") {
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "awaiting_approval" });
        continue;
      }
      if (updated.status === "waiting_handoff") {
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "waiting_handoff" });
        continue;
      }
      let enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });
      while (enqueueIdx !== null) {
        const n = workflow.nodes[enqueueIdx];
        const k = String(n.kind ?? "");
        if (k !== "start" && k !== "end") break;
        const ts = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: enqueueIdx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [n.id]: { status: "success", ts } },
          events: [...cur.events, { ts, type: "node.completed", nodeId: n.id, kind: k, noop: true }],
          nodeResults: [...cur.nodeResults ?? [], { nodeId: n.id, kind: k, noop: true }]
        }));
        updated = (await loadRunFile(teamDir, runsDir, task2.runId)).run;
        enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });
      }
      if (enqueueIdx === null) {
        await writeRunFile(runPath, (cur) => ({
          ...cur,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          status: "completed",
          events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.completed" }]
        }));
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "completed" });
        continue;
      }
      const nextNode = workflow.nodes[enqueueIdx];
      const nextKind = String(nextNode.kind ?? "");
      if (nextKind === "human_approval" || nextKind === "start" || nextKind === "end") {
        const nextConfig = nextNode["config"];
        const nextConfigObj = nextConfig && typeof nextConfig === "object" && !Array.isArray(nextConfig) ? nextConfig : {};
        const explicitAgentId = String(nextConfigObj["agentId"] ?? "").trim();
        const approvalAgentId = explicitAgentId || `${teamId}-lead` || agentId;
        await enqueueTask(teamDir, approvalAgentId, {
          teamId,
          runId: task2.runId,
          nodeId: nextNode.id,
          kind: "execute_node"
        });
        await writeRunFile(runPath, (cur) => ({
          ...cur,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          status: "waiting_workers",
          nextNodeIndex: enqueueIdx,
          events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "node.enqueued", nodeId: nextNode.id, agentId: approvalAgentId }]
        }));
        results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "ok" });
        continue;
      }
      const nextAgentId = String(nextNode?.assignedTo?.agentId ?? "").trim();
      if (!nextAgentId) throw new Error(`Next node ${nextNode.id} missing assignedTo.agentId`);
      await enqueueTask(teamDir, nextAgentId, {
        teamId,
        runId: task2.runId,
        nodeId: nextNode.id,
        kind: "execute_node"
      });
      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "waiting_workers",
        nextNodeIndex: enqueueIdx,
        events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "node.enqueued", nodeId: nextNode.id, agentId: nextAgentId }]
      }));
      results.push({ taskId: task2.id, runId: task2.runId, nodeId: task2.nodeId, status: "ok" });
    } finally {
      if (lockHeld) {
        try {
          await import_promises17.default.unlink(lockPath);
        } catch {
        }
      }
      try {
        await releaseTaskClaim(teamDir, agentId, task2.id);
      } catch {
      }
      if (countedTowardLimit) executedCount++;
    }
  }
  try {
    await compactQueue(teamDir, agentId);
  } catch {
  }
  return { ok: true, teamId, agentId, workerId, results };
}

// src/lib/workflows/workflow-tick.ts
var import_promises18 = __toESM(require("node:fs/promises"));
var import_node_path24 = __toESM(require("node:path"));
var import_node_crypto4 = __toESM(require("node:crypto"));
async function runWorkflowRunnerTick(api, opts) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = import_node_path24.default.join(teamDir, "shared-context");
  const runsDir = import_node_path24.default.join(sharedContextDir, "workflow-runs");
  const workflowsDir = import_node_path24.default.join(sharedContextDir, "workflows");
  if (!await fileExists3(runsDir)) {
    return { ok: true, teamId, claimed: 0, message: "No workflow-runs directory present." };
  }
  const concurrency = typeof opts.concurrency === "number" && opts.concurrency > 0 ? Math.floor(opts.concurrency) : 1;
  const leaseSeconds = typeof opts.leaseSeconds === "number" && opts.leaseSeconds > 0 ? opts.leaseSeconds : 300;
  const now = Date.now();
  const entries = await import_promises18.default.readdir(runsDir);
  const candidates = [];
  for (const e of entries) {
    const abs = import_node_path24.default.join(runsDir, e);
    let runPath = null;
    try {
      const st = await import_promises18.default.stat(abs);
      if (st.isDirectory()) {
        const p = import_node_path24.default.join(abs, "run.json");
        if (await fileExists3(p)) runPath = p;
      }
    } catch {
    }
    if (!runPath) continue;
    try {
      const run = JSON.parse(await readTextFile(runPath));
      if (run.status !== "queued") continue;
      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed2 = !!run.claimedBy && exp > now;
      if (claimed2) continue;
      candidates.push({ file: runPath, run });
    } catch {
    }
  }
  if (!candidates.length) {
    return { ok: true, teamId, claimed: 0, message: "No queued runs available." };
  }
  candidates.sort((a, b) => {
    const pa = typeof a.run.priority === "number" ? a.run.priority : 0;
    const pb = typeof b.run.priority === "number" ? b.run.priority : 0;
    if (pa !== pb) return pb - pa;
    return String(a.run.createdAt).localeCompare(String(b.run.createdAt));
  });
  const runnerIdBase = `workflow-runner:${process.pid}`;
  async function tryClaim(runPath) {
    const raw = await readTextFile(runPath);
    const cur = JSON.parse(raw);
    if (cur.status !== "queued") return null;
    const exp = cur.claimExpiresAt ? Date.parse(String(cur.claimExpiresAt)) : 0;
    const claimed2 = !!cur.claimedBy && exp > Date.now();
    if (claimed2) return null;
    const claimExpiresAt = new Date(Date.now() + leaseSeconds * 1e3).toISOString();
    const claimedBy = `${runnerIdBase}:${import_node_crypto4.default.randomBytes(3).toString("hex")}`;
    const next = {
      ...cur,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "running",
      claimedBy,
      claimExpiresAt,
      events: [...cur.events ?? [], { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.claimed", claimedBy, claimExpiresAt }]
    };
    await import_promises18.default.writeFile(runPath, JSON.stringify(next, null, 2), "utf8");
    return next;
  }
  const claimed = [];
  for (const c of candidates) {
    if (claimed.length >= concurrency) break;
    const run = await tryClaim(c.file);
    if (run) claimed.push({ file: c.file, run });
  }
  if (!claimed.length) {
    return { ok: true, teamId, claimed: 0, message: "No queued runs available (raced on claim)." };
  }
  async function execClaimed(runPath, run) {
    const workflowFile = String(run.workflow.file);
    const workflowPath = import_node_path24.default.join(workflowsDir, workflowFile);
    const workflowRaw = await readTextFile(workflowPath);
    const workflow = normalizeWorkflow(JSON.parse(workflowRaw));
    try {
      let runCur = (await loadRunFile(teamDir, runsDir, run.runId)).run;
      let idx = pickNextRunnableNodeIndex({ workflow, run: runCur });
      while (idx !== null) {
        const n = workflow.nodes[idx];
        const k = String(n.kind ?? "");
        if (k !== "start" && k !== "end") break;
        const ts = (/* @__PURE__ */ new Date()).toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: idx + 1,
          nodeStates: { ...cur.nodeStates ?? {}, [n.id]: { status: "success", ts } },
          events: [...cur.events, { ts, type: "node.completed", nodeId: n.id, kind: k, noop: true }],
          nodeResults: [...cur.nodeResults ?? [], { nodeId: n.id, kind: k, noop: true }]
        }));
        runCur = (await loadRunFile(teamDir, runsDir, run.runId)).run;
        idx = pickNextRunnableNodeIndex({ workflow, run: runCur });
      }
      if (idx === null) {
        await writeRunFile(runPath, (cur) => ({
          ...cur,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          status: "completed",
          claimedBy: null,
          claimExpiresAt: null,
          nextNodeIndex: cur.nextNodeIndex,
          events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.completed" }]
        }));
        return { runId: run.runId, status: "completed" };
      }
      const node = workflow.nodes[idx];
      const assignedAgentId = String(node?.assignedTo?.agentId ?? "").trim();
      if (!assignedAgentId) throw new Error(`Node ${node.id} missing assignedTo.agentId (required for pull-based execution)`);
      await enqueueTask(teamDir, assignedAgentId, {
        teamId,
        runId: run.runId,
        nodeId: node.id,
        kind: "execute_node"
      });
      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "waiting_workers",
        claimedBy: null,
        claimExpiresAt: null,
        nextNodeIndex: idx,
        events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "node.enqueued", nodeId: node.id, agentId: assignedAgentId }]
      }));
      return { runId: run.runId, status: "waiting_workers" };
    } catch (e) {
      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "error",
        claimedBy: null,
        claimExpiresAt: null,
        events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.error", message: e.message }]
      }));
      return { runId: run.runId, status: "error", error: e.message };
    }
  }
  const results = await Promise.all(claimed.map((c) => execClaimed(c.file, c.run)));
  return { ok: true, teamId, claimed: claimed.length, results };
}

// src/lib/workflows/workflow-approvals.ts
var import_promises19 = __toESM(require("node:fs/promises"));
var import_node_path25 = __toESM(require("node:path"));
async function approvalsPathFor(teamDir, runId) {
  const runsDir = import_node_path25.default.join(teamDir, "shared-context", "workflow-runs");
  return import_node_path25.default.join(runsDir, runId, "approvals", "approval.json");
}
async function pollWorkflowApprovals(api, opts) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const runsDir = import_node_path25.default.join(teamDir, "shared-context", "workflow-runs");
  if (!await fileExists3(runsDir)) {
    return { ok: true, teamId, polled: 0, resumed: 0, skipped: 0, message: "No workflow-runs directory present." };
  }
  const approvalPaths = [];
  const entries = await import_promises19.default.readdir(runsDir);
  for (const e of entries) {
    const p = import_node_path25.default.join(runsDir, e, "approvals", "approval.json");
    if (await fileExists3(p)) approvalPaths.push(p);
  }
  const limitedPaths = approvalPaths.slice(0, typeof opts.limit === "number" && opts.limit > 0 ? opts.limit : void 0);
  if (!limitedPaths.length) {
    return { ok: true, teamId, polled: 0, resumed: 0, skipped: 0, message: "No approval records present." };
  }
  let resumed = 0;
  let skipped = 0;
  const results = [];
  for (const approvalPath of limitedPaths) {
    let approval;
    try {
      approval = await readJsonFile2(approvalPath);
    } catch (e) {
      skipped++;
      results.push({ runId: import_node_path25.default.basename(import_node_path25.default.dirname(import_node_path25.default.dirname(approvalPath))), status: "unknown", action: "error", message: `Failed to parse: ${e.message}` });
      continue;
    }
    if (approval.status === "pending") {
      skipped++;
      results.push({ runId: approval.runId, status: approval.status, action: "skipped" });
      continue;
    }
    if (approval.resumedAt) {
      skipped++;
      results.push({ runId: approval.runId, status: approval.status, action: "skipped", message: "Already resumed." });
      continue;
    }
    try {
      const res = await resumeWorkflowRun(api, { teamId, runId: approval.runId });
      resumed++;
      results.push({ runId: approval.runId, status: approval.status, action: "resumed", message: `resume status=${res.status ?? "ok"}` });
      const next = {
        ...approval,
        resumedAt: (/* @__PURE__ */ new Date()).toISOString(),
        resumedStatus: String(res.status ?? "ok")
      };
      await import_promises19.default.writeFile(approvalPath, JSON.stringify(next, null, 2), "utf8");
    } catch (e) {
      results.push({ runId: approval.runId, status: approval.status, action: "error", message: e.message });
      const next = {
        ...approval,
        resumedAt: (/* @__PURE__ */ new Date()).toISOString(),
        resumedStatus: "error",
        resumeError: e.message
      };
      await import_promises19.default.writeFile(approvalPath, JSON.stringify(next, null, 2), "utf8");
    }
  }
  return { ok: true, teamId, polled: limitedPaths.length, resumed, skipped, results };
}
async function approveWorkflowRun(api, opts) {
  const teamId = String(opts.teamId);
  const runId = String(opts.runId);
  const teamDir = resolveTeamDir(api, teamId);
  const approvalPath = await approvalsPathFor(teamDir, runId);
  if (!await fileExists3(approvalPath)) {
    throw new Error(`Approval file not found for runId=${runId}: ${import_node_path25.default.relative(teamDir, approvalPath)}`);
  }
  const raw = await readTextFile(approvalPath);
  const cur = JSON.parse(raw);
  const next = {
    ...cur,
    status: opts.approved ? "approved" : "rejected",
    decidedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...opts.note ? { note: String(opts.note) } : {}
  };
  await import_promises19.default.writeFile(approvalPath, JSON.stringify(next, null, 2), "utf8");
  return { ok: true, runId, status: next.status, approvalFile: import_node_path25.default.relative(teamDir, approvalPath) };
}
async function resumeWorkflowRun(api, opts) {
  const teamId = String(opts.teamId);
  const runId = String(opts.runId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = import_node_path25.default.join(teamDir, "shared-context");
  const runsDir = import_node_path25.default.join(sharedContextDir, "workflow-runs");
  const workflowsDir = import_node_path25.default.join(sharedContextDir, "workflows");
  const loaded = await loadRunFile(teamDir, runsDir, runId);
  const runLogPath = loaded.path;
  const runLog = loaded.run;
  if (runLog.status === "completed" || runLog.status === "rejected") {
    return { ok: true, runId, status: runLog.status, message: "No-op; run already finished." };
  }
  if (runLog.status !== "awaiting_approval" && runLog.status !== "running") {
    throw new Error(`Run is not awaiting approval (status=${runLog.status}).`);
  }
  const workflowFile = String(runLog.workflow.file);
  const workflowPath = import_node_path25.default.join(workflowsDir, workflowFile);
  const workflowRaw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(workflowRaw));
  const approvalPath = await approvalsPathFor(teamDir, runId);
  if (!await fileExists3(approvalPath)) throw new Error(`Missing approval file: ${import_node_path25.default.relative(teamDir, approvalPath)}`);
  const approvalRaw = await readTextFile(approvalPath);
  const approval = JSON.parse(approvalRaw);
  if (approval.status === "pending") {
    throw new Error(`Approval still pending. Update ${import_node_path25.default.relative(teamDir, approvalPath)} first.`);
  }
  const ticketPath = import_node_path25.default.join(teamDir, runLog.ticket.file);
  const approvalIdx = workflow.nodes.findIndex((n) => n.kind === "human_approval" && String(n.id) === String(approval.nodeId));
  if (approvalIdx < 0) throw new Error(`Approval node not found in workflow: nodeId=${approval.nodeId}`);
  if (approval.status === "rejected") {
    const approvalNote = String(approval.note ?? "").trim();
    let reviseIdx = workflow.nodes.findIndex((n, idx) => idx < approvalIdx && String(n.id) === "draft_assets");
    if (reviseIdx < 0) {
      for (let i = approvalIdx - 1; i >= 0; i--) {
        if (workflow.nodes[i]?.kind === "llm") {
          reviseIdx = i;
          break;
        }
      }
    }
    if (reviseIdx < 0) reviseIdx = 0;
    const reviseNode = workflow.nodes[reviseIdx];
    const reviseAgentId = String(reviseNode?.assignedTo?.agentId ?? "").trim();
    if (!reviseAgentId) throw new Error(`Revision node ${reviseNode.id} missing assignedTo.agentId`);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await writeRunFile(runLogPath, (cur) => {
      const nextStates = {
        ...cur.nodeStates ?? {},
        [approval.nodeId]: { status: "error", ts: now, message: "rejected" }
      };
      for (let i = reviseIdx; i < (workflow.nodes?.length ?? 0); i++) {
        const id = String(workflow.nodes[i]?.id ?? "").trim();
        if (id) delete nextStates[id];
      }
      return {
        ...cur,
        updatedAt: now,
        status: "needs_revision",
        nextNodeIndex: reviseIdx,
        nodeStates: nextStates,
        events: [
          ...cur.events,
          {
            ts: now,
            type: "run.revision_requested",
            nodeId: approval.nodeId,
            reviseNodeId: reviseNode.id,
            reviseAgentId,
            ...approvalNote ? { note: approvalNote } : {}
          }
        ]
      };
    });
    try {
      const runPath = runLogPath;
      const runDir = import_node_path25.default.dirname(runPath);
      const lockDir = import_node_path25.default.join(runDir, "locks");
      for (let i = reviseIdx; i < (workflow.nodes?.length ?? 0); i++) {
        const id = String(workflow.nodes[i]?.id ?? "").trim();
        if (!id) continue;
        const lp = import_node_path25.default.join(lockDir, `${id}.lock`);
        try {
          await import_promises19.default.unlink(lp);
        } catch {
        }
      }
    } catch {
    }
    await enqueueTask(teamDir, reviseAgentId, {
      teamId,
      runId,
      nodeId: reviseNode.id,
      kind: "execute_node",
      // Include human feedback in the packet so prompt templates can use it.
      packet: approvalNote ? { revisionNote: approvalNote } : {}
    });
    return { ok: true, runId, status: "needs_revision", ticketPath, runLogPath };
  }
  const approvedTs = (/* @__PURE__ */ new Date()).toISOString();
  await appendRunLog(runLogPath, (cur) => ({
    ...cur,
    status: "running",
    nodeStates: { ...cur.nodeStates ?? {}, [approval.nodeId]: { status: "success", ts: approvedTs } },
    events: (cur.events ?? []).some((eRaw) => {
      const e = asRecord(eRaw);
      return asString(e["type"]) === "node.approved" && asString(e["nodeId"]) === String(approval.nodeId);
    }) ? cur.events : [...cur.events, { ts: approvedTs, type: "node.approved", nodeId: approval.nodeId }]
  }));
  let updated = (await loadRunFile(teamDir, runsDir, runId)).run;
  let enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });
  while (enqueueIdx !== null) {
    const n = workflow.nodes[enqueueIdx];
    const k = String(n.kind ?? "");
    if (k !== "start" && k !== "end") break;
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    await appendRunLog(runLogPath, (cur) => ({
      ...cur,
      nextNodeIndex: enqueueIdx + 1,
      nodeStates: { ...cur.nodeStates ?? {}, [n.id]: { status: "success", ts } },
      events: [...cur.events, { ts, type: "node.completed", nodeId: n.id, kind: k, noop: true }],
      nodeResults: [...cur.nodeResults ?? [], { nodeId: n.id, kind: k, noop: true }]
    }));
    updated = (await loadRunFile(teamDir, runsDir, runId)).run;
    enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });
  }
  if (enqueueIdx === null) {
    await writeRunFile(runLogPath, (cur) => ({
      ...cur,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "completed",
      events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.completed" }]
    }));
    return { ok: true, runId, status: "completed", ticketPath, runLogPath };
  }
  const node = workflow.nodes[enqueueIdx];
  const nextKind = String(node.kind ?? "");
  const nextAgentId = String(node?.assignedTo?.agentId ?? "").trim();
  if (!nextAgentId) throw new Error(`Next runnable node ${node.id} (${nextKind}) missing assignedTo.agentId (required for pull-based execution)`);
  await enqueueTask(teamDir, nextAgentId, {
    teamId,
    runId,
    nodeId: node.id,
    kind: "execute_node"
  });
  await writeRunFile(runLogPath, (cur) => ({
    ...cur,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "waiting_workers",
    nextNodeIndex: enqueueIdx,
    events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "node.enqueued", nodeId: node.id, agentId: nextAgentId }]
  }));
  return { ok: true, runId, status: "waiting_workers", ticketPath, runLogPath };
}

// src/lib/workflows/workflow-runner.ts
async function enqueueWorkflowRun(api, opts) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = import_node_path26.default.join(teamDir, "shared-context");
  const workflowsDir = import_node_path26.default.join(sharedContextDir, "workflows");
  const runsDir = import_node_path26.default.join(sharedContextDir, "workflow-runs");
  const workflowPath = import_node_path26.default.join(workflowsDir, opts.workflowFile);
  const raw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(raw));
  if (!workflow.nodes?.length) throw new Error("Workflow has no nodes");
  const firstLaneRaw = String(workflow.nodes.find((n) => n?.config && typeof n.config === "object" && "lane" in n.config)?.config?.lane ?? "backlog");
  assertLane(firstLaneRaw);
  const initialLane = firstLaneRaw;
  const runId = `${isoCompact()}-${import_node_crypto5.default.randomBytes(4).toString("hex")}`;
  await ensureDir3(runsDir);
  const runDir = import_node_path26.default.join(runsDir, runId);
  await ensureDir3(runDir);
  await Promise.all([
    ensureDir3(import_node_path26.default.join(runDir, "node-outputs")),
    ensureDir3(import_node_path26.default.join(runDir, "artifacts")),
    ensureDir3(import_node_path26.default.join(runDir, "approvals"))
  ]);
  const runLogPath = import_node_path26.default.join(runDir, "run.json");
  const ticketNum = await nextTicketNumber(teamDir);
  const slug = `workflow-run-${(workflow.id ?? import_node_path26.default.basename(opts.workflowFile, import_node_path26.default.extname(opts.workflowFile))).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
  const ticketFile = `${ticketNum}-${slug}.md`;
  const laneDir2 = import_node_path26.default.join(teamDir, "work", initialLane);
  await ensureDir3(laneDir2);
  const ticketPath = import_node_path26.default.join(laneDir2, ticketFile);
  const header = `# ${ticketNum} \u2014 Workflow run: ${workflow.name ?? workflow.id ?? opts.workflowFile}

`;
  const md = [
    header,
    `Owner: lead`,
    `Status: ${laneToStatus(initialLane)}`,
    `
## Run`,
    `- workflow: ${import_node_path26.default.relative(teamDir, workflowPath)}`,
    `- run dir: ${import_node_path26.default.relative(teamDir, import_node_path26.default.dirname(runLogPath))}`,
    `- run file: ${import_node_path26.default.relative(teamDir, runLogPath)}`,
    `- trigger: ${opts.trigger?.kind ?? "manual"}${opts.trigger?.at ? ` @ ${opts.trigger.at}` : ""}`,
    `- runId: ${runId}`,
    `
## Notes`,
    `- Created by: openclaw recipes workflows run (enqueue-only)`,
    ``
  ].join("\n");
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const trigger = opts.trigger ?? { kind: "manual" };
  const initialLog = {
    runId,
    createdAt,
    updatedAt: createdAt,
    teamId,
    workflow: { file: opts.workflowFile, id: workflow.id ?? null, name: workflow.name ?? null },
    ticket: { file: import_node_path26.default.relative(teamDir, ticketPath), number: ticketNum, lane: initialLane },
    trigger,
    ...opts.triggerInput && Object.keys(opts.triggerInput).length > 0 ? { triggerInput: opts.triggerInput } : {},
    status: "queued",
    priority: 0,
    claimedBy: null,
    claimExpiresAt: null,
    nextNodeIndex: 0,
    events: [{ ts: createdAt, type: "run.enqueued", lane: initialLane }],
    nodeResults: []
  };
  await Promise.all([
    import_promises20.default.writeFile(ticketPath, md, "utf8"),
    import_promises20.default.writeFile(runLogPath, JSON.stringify(initialLog, null, 2), "utf8")
  ]);
  return {
    ok: true,
    teamId,
    teamDir,
    workflowPath,
    runId,
    runLogPath,
    ticketPath,
    lane: initialLane,
    status: "queued"
  };
}
async function runWorkflowRunnerOnce(api, opts) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = import_node_path26.default.join(teamDir, "shared-context");
  const runsDir = import_node_path26.default.join(sharedContextDir, "workflow-runs");
  const workflowsDir = import_node_path26.default.join(sharedContextDir, "workflows");
  if (!await fileExists3(runsDir)) {
    return { ok: true, teamId, claimed: 0, message: "No workflow-runs directory present." };
  }
  const leaseSeconds = typeof opts.leaseSeconds === "number" && opts.leaseSeconds > 0 ? opts.leaseSeconds : 60;
  const now = Date.now();
  const entries = await import_promises20.default.readdir(runsDir);
  const candidates = [];
  for (const e of entries) {
    const abs = import_node_path26.default.join(runsDir, e);
    let runPath = null;
    try {
      const st = await import_promises20.default.stat(abs);
      if (st.isDirectory()) {
        const p = import_node_path26.default.join(abs, "run.json");
        if (await fileExists3(p)) runPath = p;
      }
    } catch {
    }
    if (!runPath) continue;
    try {
      const run = JSON.parse(await readTextFile(runPath));
      if (run.status !== "queued") continue;
      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed = !!run.claimedBy && exp > now;
      if (claimed) continue;
      candidates.push({ file: runPath, run });
    } catch {
    }
  }
  const targetRunId = opts.runId?.trim();
  if (targetRunId) {
    const match = candidates.filter((c) => import_node_path26.default.basename(import_node_path26.default.dirname(c.file)) === targetRunId);
    candidates.length = 0;
    candidates.push(...match);
  }
  if (!candidates.length) {
    return { ok: true, teamId, claimed: 0, message: "No queued runs available." };
  }
  candidates.sort((a, b) => {
    const pa = typeof a.run.priority === "number" ? a.run.priority : 0;
    const pb = typeof b.run.priority === "number" ? b.run.priority : 0;
    if (pa != pb) return pb - pa;
    return String(a.run.createdAt).localeCompare(String(b.run.createdAt));
  });
  const chosen = candidates[0];
  const runnerId = `workflow-runner:${process.pid}`;
  const claimExpiresAt = new Date(Date.now() + leaseSeconds * 1e3).toISOString();
  await writeRunFile(chosen.file, (cur) => ({
    ...cur,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "running",
    claimedBy: runnerId,
    claimExpiresAt,
    events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.claimed", claimedBy: runnerId, claimExpiresAt }]
  }));
  const workflowFile = String(chosen.run.workflow.file);
  const workflowPath = import_node_path26.default.join(workflowsDir, workflowFile);
  const workflowRaw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(workflowRaw));
  try {
    let runCur = (await loadRunFile(teamDir, runsDir, chosen.run.runId)).run;
    let idx = pickNextRunnableNodeIndex({ workflow, run: runCur });
    while (idx !== null) {
      const n = workflow.nodes[idx];
      const k = String(n.kind ?? "");
      if (k !== "start" && k !== "end") break;
      const ts = (/* @__PURE__ */ new Date()).toISOString();
      await appendRunLog(chosen.file, (cur) => ({
        ...cur,
        nextNodeIndex: idx + 1,
        nodeStates: { ...cur.nodeStates ?? {}, [n.id]: { status: "success", ts } },
        events: [...cur.events, { ts, type: "node.completed", nodeId: n.id, kind: k, noop: true }],
        nodeResults: [...cur.nodeResults ?? [], { nodeId: n.id, kind: k, noop: true }]
      }));
      runCur = (await loadRunFile(teamDir, runsDir, chosen.run.runId)).run;
      idx = pickNextRunnableNodeIndex({ workflow, run: runCur });
    }
    if (idx === null) {
      await writeRunFile(chosen.file, (cur) => ({
        ...cur,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "completed",
        claimedBy: null,
        claimExpiresAt: null,
        nextNodeIndex: cur.nextNodeIndex,
        events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.completed" }]
      }));
      return { ok: true, teamId, claimed: 1, runId: chosen.run.runId, status: "completed" };
    }
    const node = workflow.nodes[idx];
    const assignedAgentId = String(node?.assignedTo?.agentId ?? "").trim();
    if (!assignedAgentId) throw new Error(`Node ${node.id} missing assignedTo.agentId (required for pull-based execution)`);
    await enqueueTask(teamDir, assignedAgentId, {
      teamId,
      runId: chosen.run.runId,
      nodeId: node.id,
      kind: "execute_node"
    });
    await writeRunFile(chosen.file, (cur) => ({
      ...cur,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "waiting_workers",
      claimedBy: null,
      claimExpiresAt: null,
      nextNodeIndex: idx,
      events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "node.enqueued", nodeId: node.id, agentId: assignedAgentId }]
    }));
    return { ok: true, teamId, claimed: 1, runId: chosen.run.runId, status: "waiting_workers" };
  } catch (e) {
    await writeRunFile(chosen.file, (cur) => ({
      ...cur,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "error",
      claimedBy: null,
      claimExpiresAt: null,
      events: [...cur.events, { ts: (/* @__PURE__ */ new Date()).toISOString(), type: "run.error", message: e.message }]
    }));
    throw e;
  }
}

// src/handlers/workflows.ts
async function handleWorkflowsRun(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  if (!opts.workflowFile) throw new Error("--workflow-file is required");
  return enqueueWorkflowRun(api, {
    teamId: opts.teamId,
    workflowFile: opts.workflowFile,
    trigger: { kind: "manual", at: (/* @__PURE__ */ new Date()).toISOString() }
  });
}
async function handleWorkflowsRunnerOnce(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  return runWorkflowRunnerOnce(api, { teamId: opts.teamId, leaseSeconds: opts.leaseSeconds, runId: opts.runId });
}
async function handleWorkflowsRunnerTick(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  return runWorkflowRunnerTick(api, { teamId: opts.teamId, concurrency: opts.concurrency, leaseSeconds: opts.leaseSeconds });
}
async function handleWorkflowsWorkerTick(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  if (!opts.agentId) throw new Error("--agent-id is required");
  return runWorkflowWorkerTick(api, { teamId: opts.teamId, agentId: opts.agentId, limit: opts.limit, workerId: opts.workerId });
}
async function handleWorkflowsApprove(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  if (!opts.runId) throw new Error("--run-id is required");
  return approveWorkflowRun(api, {
    teamId: opts.teamId,
    runId: opts.runId,
    approved: !!opts.approved,
    ...opts.note ? { note: opts.note } : {}
  });
}
async function handleWorkflowsResume(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  if (!opts.runId) throw new Error("--run-id is required");
  return resumeWorkflowRun(api, { teamId: opts.teamId, runId: opts.runId });
}
async function handleWorkflowsPollApprovals(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  return pollWorkflowApprovals(api, { teamId: opts.teamId, limit: opts.limit });
}
async function handleWorkflowsCleanupQueues(api, opts) {
  if (!opts.teamId) throw new Error("--team-id is required");
  const teamDir = resolveTeamDir(api, opts.teamId);
  return cleanupQueues(teamDir);
}

// src/handlers/media-drivers.ts
async function handleMediaDriversList() {
  const configEnv = await loadConfigEnv();
  const mergedEnv = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") mergedEnv[k] = v;
  }
  Object.assign(mergedEnv, configEnv);
  return getAllDrivers().map((driver) => {
    const available = isDriverAvailable(driver.slug, mergedEnv);
    const missing = driver.requiredEnvVars.filter(
      (v) => !mergedEnv[v] || mergedEnv[v].trim().length === 0
    );
    return {
      slug: driver.slug,
      displayName: driver.displayName,
      mediaType: driver.mediaType,
      requiredEnvVars: driver.requiredEnvVars,
      available,
      missingEnvVars: missing,
      durationConstraints: driver.durationConstraints ?? null
    };
  });
}

// index.ts
init_recipes();

// src/lib/cleanup-workspaces.ts
var import_promises21 = __toESM(require("node:fs/promises"));
var import_node_path27 = __toESM(require("node:path"));
var DEFAULT_ALLOWED_PREFIXES = ["smoke-", "qa-", "tmp-", "test-"];
var DEFAULT_PROTECTED_TEAM_IDS = ["development-team"];
async function isDir(p) {
  try {
    const st = await import_promises21.default.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}
async function isSymlink(p) {
  try {
    const st = await import_promises21.default.lstat(p);
    return st.isSymbolicLink();
  } catch {
    return false;
  }
}
function parseTeamIdFromWorkspaceDirName(dirName) {
  if (!dirName.startsWith("workspace-")) return null;
  const teamId = dirName.slice("workspace-".length);
  return teamId || null;
}
function isEligibleTeamId(opts) {
  const { teamId, prefixes, protectedTeamIds } = opts;
  if (!teamId.endsWith("-team")) return { ok: false, reason: "teamId does not end with -team" };
  if (protectedTeamIds.includes(teamId.replace(/-team$/, ""))) {
    return { ok: false, reason: "protected teamId" };
  }
  if (protectedTeamIds.includes(teamId)) return { ok: false, reason: "protected teamId" };
  const okPrefix = prefixes.some((p) => teamId.startsWith(p));
  if (!okPrefix) return { ok: false, reason: `teamId does not start with an allowed prefix (${prefixes.join(", ")})` };
  return { ok: true };
}
async function planWorkspaceCleanup(opts) {
  const rootDir = import_node_path27.default.resolve(opts.rootDir);
  const prefixes = opts.prefixes?.length ? opts.prefixes : [...DEFAULT_ALLOWED_PREFIXES];
  const protectedTeamIds = opts.protectedTeamIds?.length ? opts.protectedTeamIds : [...DEFAULT_PROTECTED_TEAM_IDS];
  const decisions = [];
  let entries = [];
  try {
    entries = await import_promises21.default.readdir(rootDir);
  } catch (e) {
    return {
      rootDir,
      prefixes,
      protectedTeamIds,
      decisions: [
        {
          kind: "skip",
          dirName: rootDir,
          absPath: rootDir,
          reason: `failed to read rootDir: ${e instanceof Error ? e.message : String(e)}`
        }
      ]
    };
  }
  for (const dirName of entries) {
    if (!dirName.startsWith("workspace-")) continue;
    const absPath = import_node_path27.default.join(rootDir, dirName);
    if (!await isDir(absPath)) continue;
    const teamId = parseTeamIdFromWorkspaceDirName(dirName);
    if (!teamId) {
      decisions.push({ kind: "skip", dirName, absPath, reason: "could not parse teamId" });
      continue;
    }
    if (await isSymlink(absPath)) {
      decisions.push({ kind: "skip", teamId, dirName, absPath, reason: "refusing to operate on symlink" });
      continue;
    }
    const real = await import_promises21.default.realpath(absPath);
    const rootReal = await import_promises21.default.realpath(rootDir);
    if (!real.startsWith(rootReal + import_node_path27.default.sep) && real !== rootReal) {
      decisions.push({ kind: "skip", teamId, dirName, absPath, reason: "resolved path escapes rootDir" });
      continue;
    }
    const elig = isEligibleTeamId({ teamId, prefixes, protectedTeamIds });
    if (!elig.ok) {
      decisions.push({ kind: "skip", teamId, dirName, absPath, reason: elig.reason });
      continue;
    }
    decisions.push({ kind: "candidate", teamId, dirName, absPath });
  }
  return { rootDir, prefixes, protectedTeamIds, decisions };
}
async function executeWorkspaceCleanup(plan, opts) {
  const candidates = plan.decisions.filter((d) => d.kind === "candidate");
  const skipped = plan.decisions.filter((d) => d.kind === "skip");
  if (!opts.yes) {
    return {
      ok: true,
      dryRun: true,
      rootDir: plan.rootDir,
      candidates,
      skipped,
      deleted: []
    };
  }
  const deleted = [];
  const deleteErrors = [];
  for (const c of candidates) {
    try {
      await import_promises21.default.rm(c.absPath, { recursive: true, force: true });
      deleted.push(c.absPath);
    } catch (e) {
      deleteErrors.push({ path: c.absPath, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return {
    ok: deleteErrors.length === 0,
    dryRun: false,
    rootDir: plan.rootDir,
    candidates,
    skipped,
    deleted,
    deleteErrors
  };
}

// index.ts
function isRecord2(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function asString3(v, fallback = "") {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}
function extractEventText(evt, ctx, metadata) {
  const msg = isRecord2(evt["message"]) ? evt["message"] : {};
  const parts = Array.isArray(msg["content"]) ? msg["content"] : [];
  const texts = parts.map((part) => isRecord2(part) ? asString3(part["text"]).trim() : "").filter(Boolean);
  if (texts.length) return texts.join("\n").trim();
  const direct = [
    evt["content"],
    ctx["content"],
    evt["text"],
    evt["body"],
    metadata["content"],
    metadata["text"],
    metadata["message"]
  ].map((v) => asString3(v).trim()).filter(Boolean);
  if (direct.length) return direct.join("\n");
  return "";
}
function parseApprovalReply(text) {
  const raw = String(text ?? "");
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).reverse();
  for (const line of lines) {
    const m = line.match(/\b(approve|decline)\b\s+([A-Z0-9]{4,8})(?:\s+(.+))?$/i);
    if (!m) continue;
    const verb2 = String(m[1] ?? "").toLowerCase();
    const code2 = String(m[2] ?? "").toUpperCase();
    const note2 = asString3(m[3]).trim();
    return {
      approved: verb2 === "approve",
      code: code2,
      ...note2 ? { note: note2 } : {}
    };
  }
  const fallback = raw.match(/\b(approve|decline)\b\s+([A-Z0-9]{4,8})(?:\s+(.+))?/i);
  if (!fallback) return null;
  const verb = String(fallback[1] ?? "").toLowerCase();
  const code = String(fallback[2] ?? "").toUpperCase();
  const note = asString3(fallback[3]).trim();
  return {
    approved: verb === "approve",
    code,
    ...note ? { note } : {}
  };
}
function shouldProcessApprovalReply(channelHints) {
  if (!channelHints.length) return true;
  return channelHints.some((v) => v.includes("telegram"));
}
var recipesPlugin = {
  id: "recipes",
  name: "Recipes",
  description: "Markdown recipes that scaffold agents and teams.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {}
  },
  register(api) {
    const approvalReplyHandler = async (evt, ctx) => {
      try {
        const e = isRecord2(evt) ? evt : {};
        const c = isRecord2(ctx) ? ctx : {};
        const metadata = isRecord2(e["metadata"]) ? e["metadata"] : {};
        const text = extractEventText(e, c, metadata);
        if (!text) return;
        const reply = parseApprovalReply(text);
        if (!reply) return;
        const workspaceRoot = resolveCanonicalWorkspaceRoot(api);
        const parent = import_node_path28.default.resolve(workspaceRoot, "..");
        const roots = Array.from(/* @__PURE__ */ new Set([parent, workspaceRoot, import_node_path28.default.join(workspaceRoot, "workspace")]));
        const channelHints = [
          c["channelId"],
          c["channel"],
          metadata["channelId"],
          metadata["channel"],
          metadata["provider"],
          metadata["source"],
          e["messageProvider"],
          e["channelId"],
          e["channel"],
          e["source"]
        ].map((v) => asString3(v).toLowerCase()).filter(Boolean);
        const isTelegram = shouldProcessApprovalReply(channelHints);
        if (!isTelegram) {
          console.error(`[recipes] approval reply ignored: non-telegram channel hints=${JSON.stringify(channelHints)} text=${JSON.stringify(text)}`);
          return;
        }
        const { approved, code, note } = reply;
        const teamDirs = [];
        for (const root of roots) {
          try {
            const entries = await import_promises22.default.readdir(root, { withFileTypes: true });
            for (const d of entries) {
              if (d.isDirectory() && d.name.startsWith("workspace-")) teamDirs.push(import_node_path28.default.join(root, d.name));
            }
          } catch {
          }
        }
        let found = null;
        for (const teamDir of teamDirs) {
          const teamId = import_node_path28.default.basename(teamDir).replace(/^workspace-/, "");
          const runsDir = import_node_path28.default.join(teamDir, "shared-context", "workflow-runs");
          let runIds = [];
          try {
            runIds = (await import_promises22.default.readdir(runsDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
          } catch {
            continue;
          }
          for (const runId of runIds) {
            const approvalPath = import_node_path28.default.join(runsDir, runId, "approvals", "approval.json");
            try {
              const raw = await import_promises22.default.readFile(approvalPath, "utf8");
              const a = JSON.parse(raw);
              if (String(a?.code ?? "").trim().toUpperCase() === code && String(a?.status ?? "") === "pending") {
                found = { teamId: String(a?.teamId ?? teamId), runId: String(a?.runId ?? runId), approvalPath };
                break;
              }
            } catch {
            }
          }
          if (found) break;
        }
        if (!found) {
          console.error(`[recipes] approval reply not matched: code=${code} text=${JSON.stringify(text)} hints=${JSON.stringify(channelHints)} roots=${JSON.stringify(roots)}`);
          return;
        }
        console.error(`[recipes] approval reply matched: code=${code} team=${found.teamId} run=${found.runId} path=${found.approvalPath} approved=${approved}`);
        const approvalNote = note || `${approved ? "Approved" : "Declined"} via Telegram (${code})`;
        await handleWorkflowsApprove(api, { teamId: found.teamId, runId: found.runId, approved, note: approvalNote });
        try {
          await handleWorkflowsResume(api, { teamId: found.teamId, runId: found.runId });
        } catch {
        }
      } catch (e) {
        console.error(`[recipes] approval reply handler error: ${e.message}`);
      }
    };
    api.on("message_received", approvalReplyHandler, { priority: 50 });
    api.on("gateway_start", async () => {
      try {
        const cfgObj = await loadOpenClawConfig(api);
        const before = JSON.stringify(cfgObj.agents?.list ?? null);
        ensureMainFirstInAgentsList(cfgObj, api);
        const after = JSON.stringify(cfgObj.agents?.list ?? null);
        if (before !== after) {
          await writeOpenClawConfig(api, cfgObj);
          console.error("[recipes] ensured agents.list includes main as first/default");
        }
      } catch (e) {
        console.error(`[recipes] note: failed to ensure main agent in agents.list: ${e.message}`);
      }
    });
    api.registerCli(
      ({ program }) => {
        const cmd = program.command("recipes").description("Manage markdown recipes (scaffold agents/teams)");
        cmd.command("list").description("List available recipes (builtin + workspace)").action(async () => {
          const rows = await handleRecipesList(api);
          console.log(JSON.stringify(rows, null, 2));
        });
        cmd.command("show").description("Show a recipe by id").argument("<id>", "Recipe id").action(async (id) => {
          const md = await handleRecipesShow(api, id);
          console.log(md);
        });
        cmd.command("status").description("Check for missing skills for a recipe (or all)").argument("[id]", "Recipe id").action(async (id) => {
          const out = await handleRecipesStatus(api, id);
          console.log(JSON.stringify(out, null, 2));
        });
        const parseMatchFromOptions = (options) => {
          if (options.match) {
            return import_json5.default.parse(String(options.match));
          }
          const match = {
            channel: String(options.channel)
          };
          if (options.accountId) match.accountId = String(options.accountId);
          if (options.guildId) match.guildId = String(options.guildId);
          if (options.teamId) match.teamId = String(options.teamId);
          if (options.peerKind || options.peerId) {
            if (!options.peerKind || !options.peerId) {
              throw new Error("--peer-kind and --peer-id must be provided together");
            }
            let kind = String(options.peerKind);
            if (kind === "direct") kind = "dm";
            if (kind !== "dm" && kind !== "group" && kind !== "channel") {
              throw new Error("--peer-kind must be dm|group|channel (or direct as alias for dm)");
            }
            match.peer = { kind, id: String(options.peerId) };
          }
          return match;
        };
        cmd.command("bind").description("Add/update a multi-agent routing binding (writes openclaw.json bindings[])").requiredOption("--agent-id <agentId>", "Target agent id").requiredOption("--channel <channel>", "Channel name (telegram|whatsapp|discord|slack|...) ").option("--account-id <accountId>", "Channel accountId (if applicable)").option("--peer-kind <kind>", "Peer kind (dm|group|channel) (aliases: direct->dm)").option("--peer-id <id>", "Peer id (DM number/id, group id, or channel id)").option("--guild-id <guildId>", "Discord guildId").option("--team-id <teamId>", "Slack teamId").option("--match <json>", "Full match object as JSON/JSON5 (overrides flags)").action(async (options) => {
          if (!options.agentId) throw new Error("--agent-id is required");
          const match = parseMatchFromOptions(options);
          const res = await handleRecipesBind(api, { agentId: options.agentId, match });
          console.log(JSON.stringify(res, null, 2));
          console.error("Binding written. Restart gateway if required for changes to take effect.");
        });
        cmd.command("unbind").description("Remove routing binding(s) from openclaw.json bindings[]").requiredOption("--channel <channel>", "Channel name").option("--agent-id <agentId>", "Optional agent id; when set, removes only bindings for this agent").option("--account-id <accountId>", "Channel accountId").option("--peer-kind <kind>", "Peer kind (dm|group|channel)").option("--peer-id <id>", "Peer id").option("--guild-id <guildId>", "Discord guildId").option("--team-id <teamId>", "Slack teamId").option("--match <json>", "Full match object as JSON/JSON5 (overrides flags)").action(async (options) => {
          const match = parseMatchFromOptions(options);
          const res = await handleRecipesUnbind(api, { agentId: typeof options.agentId === "string" ? options.agentId : void 0, match });
          console.log(JSON.stringify({ ok: true, ...res }, null, 2));
          console.error("Binding(s) removed. Restart gateway if required for changes to take effect.");
        });
        cmd.command("bindings").description("Show current bindings from openclaw config").action(async () => {
          const bindings = await handleRecipesBindings(api);
          console.log(JSON.stringify(bindings, null, 2));
        });
        cmd.command("migrate-team").description("Migrate a legacy team scaffold into the new workspace-<teamId> layout").requiredOption("--team-id <teamId>", "Team id (must end with -team)").option("--mode <mode>", "move|copy", "move").option("--dry-run", "Print the plan without writing anything", false).option("--overwrite", "Allow merging into an existing destination (dangerous)", false).action(async (options) => {
          if (!options.teamId) throw new Error("--team-id is required");
          const plan = await handleMigrateTeamPlan(api, { teamId: options.teamId, mode: options.mode, overwrite: options.overwrite });
          const dryRun = !!options.dryRun;
          if (dryRun) {
            console.log(JSON.stringify({ ok: true, dryRun: true, plan }, null, 2));
            return;
          }
          const result = await executeMigrateTeamPlan(api, plan);
          console.log(JSON.stringify(result, null, 2));
        });
        cmd.command("cleanup-workspaces").description(
          "List (dry-run, default) or delete (with --yes) temporary test/scaffold team workspaces under your OpenClaw home directory"
        ).option("--yes", "Actually delete eligible workspaces").option("--prefix <prefix>", "Allowed team id prefix (repeatable)", (v, acc) => [...acc ?? [], v], []).option("--json", "Output JSON").action(async (options) => {
          const workspaceRoot = resolveWorkspaceRoot(api);
          const rootDir = import_node_path28.default.resolve(workspaceRoot, "..");
          const prefixes = Array.isArray(options.prefix) && options.prefix.length ? options.prefix : void 0;
          const plan = await planWorkspaceCleanup({ rootDir, prefixes });
          const yes = !!options.yes;
          const result = await executeWorkspaceCleanup(plan, { yes });
          if (options.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
          }
          if (result.dryRun) {
            const candidates = result.candidates;
            const skipped = result.skipped;
            if (candidates.length === 0 && skipped.length === 0) {
              console.log("No workspace-* directories found matching cleanup criteria.");
              return;
            }
            if (candidates.length) {
              console.log(`Would delete (${candidates.length}):`);
              for (const c of candidates) console.log(`  - ${c.dirName}`);
            }
            if (skipped.length) {
              console.log(`Skipped (${skipped.length}):`);
              for (const s of skipped) console.log(`  - ${s.dirName}: ${s.reason}`);
            }
          } else {
            if (result.deleted?.length) {
              console.log(`Deleted: ${result.deleted.join(", ")}`);
            }
            if (result.deleteErrors?.length) {
              for (const e of result.deleteErrors) {
                console.error(`Error deleting ${e.path}: ${e.error}`);
              }
              process.exitCode = 1;
            }
          }
        });
        cmd.command("install-skill").description(
          "Install a skill from ClawHub (confirmation-gated). Default: global (~/.openclaw/skills). Use --agent-id or --team-id for scoped installs."
        ).argument("<skill>", "ClawHub skill slug (e.g. github)").option("--yes", "Skip confirmation prompt").option("--global", "Install into global shared skills (~/.openclaw/skills) (default when no scope flags)").option("--agent-id <agentId>", "Install into a specific agent workspace (workspace-<agentId>)").option("--team-id <teamId>", "Install into a team workspace (workspace-<teamId>)").action(async (idOrSlug, options) => {
          const res = await handleInstallSkill(api, {
            idOrSlug,
            yes: options.yes,
            global: options.global,
            agentId: options.agentId,
            teamId: options.teamId
          });
          if (res.ok) {
            console.log(JSON.stringify(res, null, 2));
            return;
          }
          if (res.aborted === "non-interactive") {
            console.error("Refusing to prompt (non-interactive). Re-run with --yes.");
            process.exitCode = 2;
            return;
          }
          if (res.aborted === "user-declined") {
            console.error("Aborted; nothing installed.");
            return;
          }
          if (res.needCli) {
            console.error("\nSkill install requires the ClawHub CLI. Run the following then re-run this command:\n");
            for (const cmd2 of res.installCommands) {
              console.error("  " + cmd2);
            }
            process.exitCode = 2;
            return;
          }
        });
        const runInstallRecipe = async (slug, opts) => {
          const res = await handleInstallMarketplaceRecipe(api, {
            slug,
            registryBase: opts.registryBase,
            overwrite: opts.overwrite
          });
          console.log(JSON.stringify(res, null, 2));
        };
        cmd.command("install").description("Install a marketplace recipe into your workspace recipes dir (by slug)").argument("<idOrSlug>", "Marketplace recipe slug (e.g. development-team)").option("--registry-base <url>", "Marketplace API base URL", "https://clawkitchen.ai").option("--overwrite", "Overwrite existing recipe file").action(
          (slug, options) => runInstallRecipe(slug, options)
        );
        cmd.command("install-recipe").description("Alias for: recipes install <slug>").argument("<slug>", "Marketplace recipe slug (e.g. development-team)").option("--registry-base <url>", "Marketplace API base URL", "https://clawkitchen.ai").option("--overwrite", "Overwrite existing recipe file").action(
          (slug, options) => runInstallRecipe(slug, options)
        );
        cmd.command("dispatch").description("Lead/dispatcher: turn a natural-language request into inbox + backlog ticket(s) + assignment stubs").requiredOption("--team-id <teamId>", "Team id (workspace folder under teams/)").option("--request <text>", "Natural-language request (if omitted, will prompt in TTY)").option("--owner <owner>", "Ticket owner: dev|devops|lead|test", "dev").option("--yes", "Skip review and write files without prompting").action(async (options) => {
          if (!options.teamId) throw new Error("--team-id is required");
          let requestText = typeof options.request === "string" ? options.request.trim() : "";
          if (!requestText) {
            if (!process.stdin.isTTY) {
              throw new Error("Missing --request in non-interactive mode");
            }
            const readline = await import("node:readline/promises");
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            try {
              requestText = (await rl.question("Request: ")).trim();
            } finally {
              rl.close();
            }
          }
          const dry = await handleDispatch(api, {
            teamId: options.teamId,
            requestText,
            owner: options.owner,
            dryRun: true
          });
          const plan = dry.plan;
          const ok = await promptConfirmWithPlan(plan, "Write these files? (y/N)", { yes: options.yes });
          if (!ok) {
            if (!options.yes && !process.stdin.isTTY) {
              process.exitCode = 2;
              console.error("Refusing to prompt (non-interactive). Re-run with --yes.");
            } else {
              console.error("Aborted; no files written.");
            }
            return;
          }
          const res = await handleDispatch(api, {
            teamId: options.teamId,
            requestText,
            owner: options.owner
          });
          if (res.nudgeQueued) {
            console.error(`[dispatch] Nudge queued: system event \u2192 agent:${options.teamId}-lead:main`);
          } else {
            console.error(`[dispatch] NOTE: Could not auto-nudge ${options.teamId}-lead (best-effort). Next steps:`);
            console.error(`- Option A (recommended): ensure the lead triage cron job is installed/enabled (lead-triage-loop).`);
            console.error(`  - If you declined cron installation during scaffold, re-run scaffold with cron installation enabled, or enable it in settings.`);
            console.error(`- Option B: manually run/open the lead once so it sees inbox/backlog updates.`);
            console.error(`- Option C (advanced): allow subagent messaging (if you want direct pings). Add allowAgents in config and restart gateway.`);
            console.error(`  { agents: { list: [ { id: "main", subagents: { allowAgents: ["${options.teamId}-lead"] } } ] } }`);
          }
          console.log(JSON.stringify({ ok: true, wrote: res.wrote }, null, 2));
        });
        cmd.command("remove-team").description("Safe uninstall: remove a scaffolded team workspace + agents + stamped cron jobs").requiredOption("--team-id <teamId>", "Team id").option("--plan", "Print plan and exit").option("--json", "Output JSON").option("--yes", "Skip confirmation (apply destructive changes)").option("--include-ambiguous", "Also remove cron jobs that only loosely match the team (dangerous)").action(async (options) => {
          if (!options.teamId) throw new Error("--team-id is required");
          const out = await handleRemoveTeam(api, {
            teamId: options.teamId,
            plan: options.plan,
            yes: options.yes,
            includeAmbiguous: options.includeAmbiguous
          });
          if (out.ok === false && out.aborted === "non-interactive") {
            console.error("Refusing to prompt (non-interactive). Re-run with --yes or --plan.");
            process.exitCode = 2;
          }
          if (out.ok === false && out.aborted === "user-declined") {
            console.error("Aborted; no changes made.");
          }
          const payload = "result" in out ? out.result : out;
          console.log(JSON.stringify(payload, null, 2));
          if (out.ok && "result" in out) {
            console.error("Restart required: openclaw gateway restart");
          }
        });
        cmd.command("tickets").description("List tickets for a team (backlog / in-progress / testing / done)").requiredOption("--team-id <teamId>", "Team id").option("--json", "Output JSON").action(async (options) => {
          if (!options.teamId) throw new Error("--team-id is required");
          const out = await handleTickets(api, { teamId: options.teamId });
          if (options.json) {
            console.log(JSON.stringify(out, null, 2));
            return;
          }
          const print = (label, items) => {
            console.log(`
${label} (${items.length})`);
            for (const t of items) console.log(`- ${t.id}`);
          };
          console.log(`Team: ${out.teamId}`);
          print("Backlog", out.backlog);
          print("In progress", out.inProgress);
          print("Testing", out.testing);
          print("Done", out.done);
        });
        const workflows = cmd.command("workflows").description("Workflow runner utilities (MVP)");
        workflows.command("run").description("Run a workflow once (manual trigger). Reads from shared-context/workflows/").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").requiredOption("--workflow-file <file>", "Workflow filename under shared-context/workflows/").action(async (options) => {
          const res = await handleWorkflowsRun(api, {
            teamId: String(options.teamId ?? ""),
            workflowFile: String(options.workflowFile ?? "")
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("runner-once").description("Claim and execute a single queued workflow run (intended for cron-driven runner)").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").option("--lease-seconds <n>", "Lease duration in seconds", (v) => Number(v)).option("--run-id <runId>", "Only claim this specific run id").action(async (options) => {
          const res = await handleWorkflowsRunnerOnce(api, {
            teamId: String(options.teamId ?? ""),
            leaseSeconds: typeof options.leaseSeconds === "number" ? options.leaseSeconds : void 0,
            runId: options.runId
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("runner-tick").description("Claim and execute up to N queued workflow runs in parallel (cron-friendly)").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").option("--concurrency <n>", "Max parallel active executions", (v) => Number(v)).option("--lease-seconds <n>", "Lease duration in seconds", (v) => Number(v)).action(async (options) => {
          const res = await handleWorkflowsRunnerTick(api, {
            teamId: String(options.teamId ?? ""),
            concurrency: typeof options.concurrency === "number" ? options.concurrency : void 0,
            leaseSeconds: typeof options.leaseSeconds === "number" ? options.leaseSeconds : void 0
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("worker-tick").description("Dequeue and execute up to N per-agent workflow tasks (pull-based worker)").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").requiredOption("--agent-id <agentId>", "Agent id (queue file name under shared-context/workflow-queues)").option("--limit <n>", "Max tasks to execute", (v) => Number(v)).option("--worker-id <id>", "Worker id (for claim/lock attribution)").action(async (options) => {
          const res = await handleWorkflowsWorkerTick(api, {
            teamId: String(options.teamId ?? ""),
            agentId: String(options.agentId ?? ""),
            limit: typeof options.limit === "number" ? options.limit : void 0,
            workerId: typeof options.workerId === "string" ? options.workerId : void 0
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("approve").description("Record an approval decision for an awaiting workflow run").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").requiredOption("--run-id <runId>", "Run id").requiredOption("--approved <bool>", "true|false").option("--note <note>", "Optional note").action(async (options) => {
          const approved = String(options.approved ?? "").toLowerCase();
          const approvedBool = approved === "true" || approved === "1" || approved === "yes";
          const res = await handleWorkflowsApprove(api, {
            teamId: String(options.teamId ?? ""),
            runId: String(options.runId ?? ""),
            approved: approvedBool,
            ...options.note ? { note: String(options.note) } : {}
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("resume").description("Resume an awaiting workflow run after approval decision is recorded").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").requiredOption("--run-id <runId>", "Run id").action(async (options) => {
          const res = await handleWorkflowsResume(api, {
            teamId: String(options.teamId ?? ""),
            runId: String(options.runId ?? "")
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("media-drivers").description("List available media generation drivers with env-var availability").action(async () => {
          const drivers = await handleMediaDriversList();
          console.log(JSON.stringify(drivers));
        });
        workflows.command("poll-approvals").description("Auto-resume any workflow runs whose approval decision has been recorded (approved/rejected)").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").option("--limit <n>", "Max approvals to process", (v) => Number(v)).action(async (options) => {
          const res = await handleWorkflowsPollApprovals(api, {
            teamId: String(options.teamId ?? ""),
            limit: typeof options.limit === "number" ? options.limit : void 0
          });
          console.log(JSON.stringify(res, null, 2));
        });
        workflows.command("cleanup-queues").description("Remove stale queue tasks for runs that are completed, errored, or deleted").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").action(async (options) => {
          const res = await handleWorkflowsCleanupQueues(api, {
            teamId: String(options.teamId ?? "")
          });
          console.log(JSON.stringify(res, null, 2));
        });
        cmd.command("move-ticket").description("Move a ticket between backlog/in-progress/testing/done (updates Status: line)").requiredOption("--team-id <teamId>", "Team id").requiredOption("--ticket <ticket>", "Ticket id or number (e.g. 0007 or 0007-some-slug)").requiredOption("--to <stage>", "Destination stage: backlog|in-progress|testing|done").option("--completed", "When moving to done, add Completed: timestamp").option("--yes", "Skip confirmation").action(async (options) => {
          if (!options.teamId || !options.ticket || !options.to) throw new Error("--team-id, --ticket, and --to are required");
          const dry = await handleMoveTicket(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            to: options.to,
            completed: options.completed,
            dryRun: true
          });
          const plan = dry.plan;
          const ok = await promptConfirmWithPlan(plan, `Move ticket to ${options.to}? (y/N)`, { yes: options.yes });
          if (!ok) {
            if (!options.yes && !process.stdin.isTTY) {
              process.exitCode = 2;
              console.error("Refusing to move without confirmation in non-interactive mode. Re-run with --yes.");
            } else {
              console.error("Aborted; no changes made.");
            }
            return;
          }
          const res = await handleMoveTicket(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            to: options.to,
            completed: options.completed
          });
          console.log(JSON.stringify({ ok: true, moved: { from: res.from, to: res.to } }, null, 2));
        });
        cmd.command("assign").description("Assign a ticket to an owner (writes assignment stub + updates Owner: in ticket)").requiredOption("--team-id <teamId>", "Team id").requiredOption("--ticket <ticket>", "Ticket id or number (e.g. 0007 or 0007-some-slug)").requiredOption("--owner <owner>", "Owner: dev|devops|lead|test").option("--overwrite", "Overwrite existing assignment file").option("--yes", "Skip confirmation").action(async (options) => {
          if (!options.teamId || !options.ticket || !options.owner) throw new Error("--team-id, --ticket, and --owner are required");
          const { plan } = await handleAssign(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            owner: options.owner,
            overwrite: options.overwrite,
            dryRun: true
          });
          const ok = await promptConfirmWithPlan(plan, `Assign ticket to ${options.owner}? (y/N)`, { yes: options.yes });
          if (!ok) {
            if (!options.yes && !process.stdin.isTTY) {
              process.exitCode = 2;
              console.error("Refusing to assign without confirmation in non-interactive mode. Re-run with --yes.");
            } else {
              console.error("Aborted; no changes made.");
            }
            return;
          }
          const res = await handleAssign(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            owner: options.owner,
            overwrite: options.overwrite
          });
          console.log(JSON.stringify(res, null, 2));
        });
        cmd.command("take").description("Shortcut: assign ticket to owner + move to in-progress").requiredOption("--team-id <teamId>", "Team id").requiredOption("--ticket <ticket>", "Ticket id or number").option("--owner <owner>", "Owner: dev|devops|lead|test", "dev").option("--yes", "Skip confirmation").action(async (options) => {
          if (!options.teamId || !options.ticket) throw new Error("--team-id and --ticket are required");
          const dry = await handleTake(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            owner: options.owner,
            overwrite: options.overwrite,
            dryRun: true
          });
          const plan = dry.plan;
          const ok = await promptConfirmWithPlan(plan, `Assign to ${plan.owner} and move to in-progress? (y/N)`, { yes: options.yes });
          if (!ok) {
            if (!options.yes && !process.stdin.isTTY) {
              process.exitCode = 2;
              console.error("Refusing to take without confirmation in non-interactive mode. Re-run with --yes.");
            } else {
              console.error("Aborted; no changes made.");
            }
            return;
          }
          const res = await handleTake(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            owner: options.owner,
            overwrite: options.overwrite
          });
          if (!("srcPath" in res)) throw new Error("Unexpected take result");
          console.log(
            JSON.stringify(
              { ok: true, plan: { from: res.srcPath, to: res.destPath, owner: options.owner ?? "dev" }, assignmentPath: res.assignmentPath },
              null,
              2
            )
          );
        });
        cmd.command("handoff").description("QA handoff: move ticket to testing + assign to tester").requiredOption("--team-id <teamId>", "Team id").requiredOption("--ticket <ticket>", "Ticket id or number").option("--tester <owner>", "Tester owner (default: test)", "test").option("--overwrite", "Overwrite destination ticket file / assignment stub if they already exist").option("--yes", "Skip confirmation").action(async (options) => {
          if (!options.teamId || !options.ticket) throw new Error("--team-id and --ticket are required");
          const dry = await handleHandoff(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            tester: options.tester,
            overwrite: options.overwrite,
            dryRun: true
          });
          const plan = dry.plan;
          const ok = await promptConfirmWithPlan(plan, `Move to testing + assign to ${plan.tester}? (y/N)`, { yes: options.yes });
          if (!ok) {
            if (!options.yes && !process.stdin.isTTY) {
              process.exitCode = 2;
              console.error("Refusing to handoff without confirmation in non-interactive mode. Re-run with --yes.");
            } else {
              console.error("Aborted; no changes made.");
            }
            return;
          }
          const res = await handleHandoff(api, {
            teamId: options.teamId,
            ticket: options.ticket,
            tester: options.tester,
            overwrite: options.overwrite
          });
          if (!("srcPath" in res)) throw new Error("Unexpected handoff result");
          console.log(
            JSON.stringify(
              { ok: true, plan: { from: res.srcPath, to: res.destPath, tester: options.tester ?? "test" }, assignmentPath: res.assignmentPath },
              null,
              2
            )
          );
        });
        cmd.command("complete").description("Complete a ticket (move to done, set Status: done, and add Completed: timestamp). No confirmation prompt.").requiredOption("--team-id <teamId>", "Team id").requiredOption("--ticket <ticket>", "Ticket id or number").option("--yes", "No-op for backward compatibility (complete has no confirmation)").action(async (options) => {
          if (!options.teamId || !options.ticket) throw new Error("--team-id and --ticket are required");
          try {
            const res = await handleMoveTicket(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              to: "done",
              completed: true
            });
            console.log(JSON.stringify({ ok: true, moved: { from: res.from, to: res.to } }, null, 2));
          } catch (e) {
            process.exitCode = 1;
            throw e;
          }
        });
        const logScaffoldResult = (res, recipeId) => {
          if (res.ok === false && res.missingSkills && res.installCommands) {
            console.error(`Missing skills for recipe ${recipeId}: ${res.missingSkills.join(", ")}`);
            console.error(`Install commands (workspace-local):
${res.installCommands.join("\n")}`);
            process.exitCode = 2;
            return;
          }
          console.log(JSON.stringify(res, null, 2));
        };
        cmd.command("scaffold").description("Scaffold an agent from a recipe").argument("<recipeId>", "Recipe id").requiredOption("--agent-id <id>", "Agent id").option("--name <name>", "Agent display name").option("--recipe-id <recipeId>", "Custom workspace recipe id to write (default: <agentId>)").option("--overwrite", "Overwrite existing recipe-managed files").option("--overwrite-recipe", "Overwrite the generated workspace recipe file (workspace/recipes/<agentId>.md) if it already exists").option("--auto-increment", "If the workspace recipe id is taken, pick the next available <agentId>-2/-3/...").option("--apply-config", "Write the agent into openclaw config (agents.list)").action(async (recipeId, options) => {
          const res = await handleScaffold(api, {
            recipeId,
            agentId: options.agentId,
            name: options.name,
            recipeIdExplicit: options.recipeId,
            overwrite: options.overwrite,
            overwriteRecipe: options.overwriteRecipe,
            autoIncrement: options.autoIncrement,
            applyConfig: options.applyConfig
          });
          logScaffoldResult(res, recipeId);
        });
        cmd.command("scaffold-team").description("Scaffold a team (shared workspace + multiple agents) from a team recipe").argument("<recipeId>", "Recipe id").requiredOption("-t, --team-id <teamId>", "Team id").option("--recipe-id <recipeId>", "Custom workspace recipe id to write (default: <teamId>)").option("--overwrite", "Overwrite existing recipe-managed files").option("--overwrite-recipe", "Overwrite the generated workspace recipe file (workspace/recipes/<teamId>.md) if it already exists").option("--auto-increment", "If the workspace recipe id is taken, pick the next available <teamId>-2/-3/...").option("--apply-config", "Write all team agents into openclaw config (agents.list)").option("--enable-heartbeat", "Opt-in: install a default heartbeat cron for the team lead (and scaffold HEARTBEAT.md)").action(async (recipeId, options) => {
          const res = await handleScaffoldTeam(api, {
            recipeId,
            teamId: String(options.teamId),
            recipeIdExplicit: options.recipeId,
            overwrite: !!options.overwrite,
            overwriteRecipe: !!options.overwriteRecipe,
            autoIncrement: !!options.autoIncrement,
            applyConfig: !!options.applyConfig,
            enableHeartbeat: !!options.enableHeartbeat
          });
          logScaffoldResult(res, recipeId);
        });
        cmd.command("add-role").description("Install a role add-on into an existing team workspace (scaffolds roles/<role>/ + optional cron)").requiredOption("--team-id <teamId>", "Team id (workspace-<teamId>)").requiredOption("--role <role>", "Role name (e.g. workflow-runner)").requiredOption("--recipe <recipeId>", "Agent recipe id to scaffold into roles/<role>/").option("--agent-id <agentId>", "Optional explicit agent id (default: <teamId>-<role>)").option("--overwrite", "Overwrite existing recipe-managed files in the role directory").option("--apply-config", "Write the agent into openclaw config (agents.list)").option("--no-cron", "Do not install/patch cron jobs from the add-on recipe").action(async (options) => {
          if (!options.teamId || !options.role || !options.recipe) throw new Error("--team-id, --role, and --recipe are required");
          const res = await handleAddRoleToTeam(api, {
            teamId: String(options.teamId),
            role: String(options.role),
            recipeId: String(options.recipe),
            agentId: typeof options.agentId === "string" ? String(options.agentId) : void 0,
            overwrite: !!options.overwrite,
            applyConfig: !!options.applyConfig,
            installCron: options.cron !== false
          });
          logScaffoldResult(res, String(options.recipe));
        });
        cmd.command("kitchen-manifest").description("Generate the Kitchen manifest file (pre-computed nav/shell data for ClawKitchen)").option("--output <path>", "Override output path (default: ~/.openclaw/kitchen-manifest.json)").action(async (options) => {
          const { generateKitchenManifest: generateKitchenManifest2 } = await Promise.resolve().then(() => (init_kitchen_manifest(), kitchen_manifest_exports));
          const manifest = await generateKitchenManifest2({
            api,
            outputPath: options.output || void 0
          });
          console.log(JSON.stringify({ ok: true, generatedAt: manifest.generatedAt, teams: Object.keys(manifest.teams).length, agents: manifest.agents.length, recipes: manifest.recipes.length }));
        });
      },
      { commands: ["recipes"] }
    );
  }
};
var __internal = {
  extractEventText,
  parseApprovalReply,
  shouldProcessApprovalReply,
  ensureMainFirstInAgentsList,
  upsertBindingInConfig,
  removeBindingsInConfig,
  stableStringify,
  workspacePath,
  listRecipeFiles,
  loadRecipeById,
  handleRecipesList,
  handleRecipesShow,
  handleRecipesStatus,
  handleRecipesBind,
  handleRecipesUnbind,
  handleRecipesBindings,
  handleTickets,
  handleMoveTicket,
  handleMigrateTeamPlan,
  executeMigrateTeamPlan,
  handleRemoveTeam,
  handleAssign,
  handleTake,
  handleHandoff,
  handleDispatch,
  handleInstallSkill,
  handleInstallMarketplaceRecipe,
  handleScaffold,
  handleScaffoldTeam,
  scaffoldAgentFromRecipe,
  promptYesNo,
  reconcileRecipeCronJobs,
  applyAgentSnippetsToOpenClawConfig,
  patchTicketField,
  patchTicketOwner,
  patchTicketStatus
};
var index_default = recipesPlugin;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  __internal
});
