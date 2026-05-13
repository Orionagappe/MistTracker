(function(){'use strict';var aa=typeof Object.create=="function"?Object.create:function(a){function b(){}
b.prototype=a;return new b},ba=typeof Object.defineProperties=="function"?Object.defineProperty:function(a,b,c){if(a==Array.prototype||a==Object.prototype)return a;
a[b]=c.value;return a};
function ca(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");}
var h=ca(this);function p(a,b){if(b)a:{var c=h;a=a.split(".");for(var d=0;d<a.length-1;d++){var l=a[d];if(!(l in c))break a;c=c[l]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&b!=null&&ba(c,a,{configurable:!0,writable:!0,value:b})}}
var da;if(typeof Object.setPrototypeOf=="function")da=Object.setPrototypeOf;else{var ea;a:{var fa={a:!0},ha={};try{ha.__proto__=fa;ea=ha.a;break a}catch(a){}ea=!1}da=ea?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null}var ia=da;
function ja(a,b){a.prototype=aa(b.prototype);a.prototype.constructor=a;if(ia)ia(a,b);else for(var c in b)if(c!="prototype")if(Object.defineProperties){var d=Object.getOwnPropertyDescriptor(b,c);d&&Object.defineProperty(a,c,d)}else a[c]=b[c];a.Ha=b.prototype}
function ka(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}
function q(a){var b=typeof Symbol!="undefined"&&Symbol.iterator&&a[Symbol.iterator];if(b)return b.call(a);if(typeof a.length=="number")return{next:ka(a)};throw Error(String(a)+" is not an iterable or ArrayLike");}
function la(a){if(!(a instanceof Array)){a=q(a);for(var b,c=[];!(b=a.next()).done;)c.push(b.value);a=c}return a}
function ma(a){if(!(a instanceof Object))throw new TypeError("Iterator result "+a+" is not an object");}
function r(){this.v=!1;this.l=null;this.m=void 0;this.g=1;this.i=this.o=0;this.A=this.h=null}
function na(a){if(a.v)throw new TypeError("Generator is already running");a.v=!0}
r.prototype.C=function(a){this.m=a};
function oa(a,b){a.h={M:b,O:!0};a.g=a.o||a.i}
r.prototype.getNextAddressJsc=function(){return this.g};
r.prototype.getYieldResultJsc=function(){return this.m};
r.prototype.return=function(a){this.h={return:a};this.g=this.i};
r.prototype["return"]=r.prototype.return;r.prototype.J=function(a){this.h={B:a};this.g=this.i};
r.prototype.jumpThroughFinallyBlocks=r.prototype.J;r.prototype.u=function(a,b){this.g=b;return{value:a}};
r.prototype.yield=r.prototype.u;r.prototype.aa=function(a,b){a=q(a);var c=a.next();ma(c);if(c.done)this.m=c.value,this.g=b;else return this.l=a,this.u(c.value,b)};
r.prototype.yieldAll=r.prototype.aa;r.prototype.B=function(a){this.g=a};
r.prototype.jumpTo=r.prototype.B;r.prototype.K=function(){this.g=0};
r.prototype.jumpToEnd=r.prototype.K;r.prototype.Y=function(a,b){this.o=a;b!=void 0&&(this.i=b)};
r.prototype.setCatchFinallyBlocks=r.prototype.Y;r.prototype.Z=function(a){this.o=0;this.i=a||0};
r.prototype.setFinallyBlock=r.prototype.Z;r.prototype.X=function(a,b){this.g=a;this.o=b||0};
r.prototype.leaveTryBlock=r.prototype.X;r.prototype.G=function(a){this.o=a||0;a=this.h.M;this.h=null;return a};
r.prototype.enterCatchBlock=r.prototype.G;r.prototype.H=function(a,b,c){c?this.A[c]=this.h:this.A=[this.h];this.o=a||0;this.i=b||0};
r.prototype.enterFinallyBlock=r.prototype.H;r.prototype.U=function(a,b){b=this.A.splice(b||0)[0];(b=this.h=this.h||b)?b.O?this.g=this.o||this.i:b.B!=void 0&&this.i<b.B?(this.g=b.B,this.h=null):this.g=this.i:this.g=a};
r.prototype.leaveFinallyBlock=r.prototype.U;r.prototype.I=function(a){return new pa(a)};
r.prototype.forIn=r.prototype.I;function pa(a){this.i=a;this.g=[];for(var b in a)this.g.push(b);this.g.reverse()}
pa.prototype.h=function(){for(;this.g.length>0;){var a=this.g.pop();if(a in this.i)return a}return null};
pa.prototype.getNext=pa.prototype.h;function qa(a){this.g=new r;this.h=a}
function ra(a,b){na(a.g);var c=a.g.l;if(c)return sa(a,"return"in c?c["return"]:function(d){return{value:d,done:!0}},b,a.g.return);
a.g.return(b);return t(a)}
function sa(a,b,c,d){try{var l=b.call(a.g.l,c);ma(l);if(!l.done)return a.g.v=!1,l;var m=l.value}catch(f){return a.g.l=null,oa(a.g,f),t(a)}a.g.l=null;d.call(a.g,m);return t(a)}
function t(a){for(;a.g.g;)try{var b=a.h(a.g);if(b)return a.g.v=!1,{value:b.value,done:!1}}catch(c){a.g.m=void 0,oa(a.g,c)}a.g.v=!1;if(a.g.h){b=a.g.h;a.g.h=null;if(b.O)throw b.M;return{value:b.return,done:!0}}return{value:void 0,done:!0}}
function ta(a){this.next=function(b){na(a.g);a.g.l?b=sa(a,a.g.l.next,b,a.g.C):(a.g.C(b),b=t(a));return b};
this.throw=function(b){na(a.g);a.g.l?b=sa(a,a.g.l["throw"],b,a.g.C):(oa(a.g,b),b=t(a));return b};
this.return=function(b){return ra(a,b)};
this[Symbol.iterator]=function(){return this}}
function wa(a){function b(d){return a.next(d)}
function c(d){return a.throw(d)}
return new Promise(function(d,l){function m(f){f.done?d(f.value):Promise.resolve(f.value).then(b,c).then(m,l)}
m(a.next())})}
function xa(a){return wa(new ta(new qa(a)))}
function u(){for(var a=Number(this),b=[],c=a;c<arguments.length;c++)b[c-a]=arguments[c];return b}
p("globalThis",function(a){return a||h});
p("Symbol",function(a){function b(m){if(this instanceof b)throw new TypeError("Symbol is not a constructor");return new c(d+(m||"")+"_"+l++,m)}
function c(m,f){this.g=m;ba(this,"description",{configurable:!0,writable:!0,value:f})}
if(a)return a;c.prototype.toString=function(){return this.g};
var d="jscomp_symbol_"+(Math.random()*1E9>>>0)+"_",l=0;return b});
p("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");ba(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return ya(ka(this))}});
return a});
function ya(a){a={next:a};a[Symbol.iterator]=function(){return this};
return a}
p("Promise",function(a){function b(f){this.h=0;this.i=void 0;this.g=[];this.u=!1;var e=this.l();try{f(e.resolve,e.reject)}catch(g){e.reject(g)}}
function c(){this.g=null}
function d(f){return f instanceof b?f:new b(function(e){e(f)})}
if(a)return a;c.prototype.h=function(f){if(this.g==null){this.g=[];var e=this;this.i(function(){e.m()})}this.g.push(f)};
var l=h.setTimeout;c.prototype.i=function(f){l(f,0)};
c.prototype.m=function(){for(;this.g&&this.g.length;){var f=this.g;this.g=[];for(var e=0;e<f.length;++e){var g=f[e];f[e]=null;try{g()}catch(k){this.l(k)}}}this.g=null};
c.prototype.l=function(f){this.i(function(){throw f;})};
b.prototype.l=function(){function f(k){return function(n){g||(g=!0,k.call(e,n))}}
var e=this,g=!1;return{resolve:f(this.H),reject:f(this.m)}};
b.prototype.H=function(f){if(f===this)this.m(new TypeError("A Promise cannot resolve to itself"));else if(f instanceof b)this.J(f);else{a:switch(typeof f){case "object":var e=f!=null;break a;case "function":e=!0;break a;default:e=!1}e?this.G(f):this.o(f)}};
b.prototype.G=function(f){var e=void 0;try{e=f.then}catch(g){this.m(g);return}typeof e=="function"?this.K(e,f):this.o(f)};
b.prototype.m=function(f){this.v(2,f)};
b.prototype.o=function(f){this.v(1,f)};
b.prototype.v=function(f,e){if(this.h!=0)throw Error("Cannot settle("+f+", "+e+"): Promise already settled in state"+this.h);this.h=f;this.i=e;this.h===2&&this.I();this.C()};
b.prototype.I=function(){var f=this;l(function(){if(f.A()){var e=h.console;typeof e!=="undefined"&&e.error(f.i)}},1)};
b.prototype.A=function(){if(this.u)return!1;var f=h.CustomEvent,e=h.Event,g=h.dispatchEvent;if(typeof g==="undefined")return!0;typeof f==="function"?f=new f("unhandledrejection",{cancelable:!0}):typeof e==="function"?f=new e("unhandledrejection",{cancelable:!0}):(f=h.document.createEvent("CustomEvent"),f.initCustomEvent("unhandledrejection",!1,!0,f));f.promise=this;f.reason=this.i;return g(f)};
b.prototype.C=function(){if(this.g!=null){for(var f=0;f<this.g.length;++f)m.h(this.g[f]);this.g=null}};
var m=new c;b.prototype.J=function(f){var e=this.l();f.D(e.resolve,e.reject)};
b.prototype.K=function(f,e){var g=this.l();try{f.call(e,g.resolve,g.reject)}catch(k){g.reject(k)}};
b.prototype.then=function(f,e){function g(D,J){return typeof D=="function"?function(ua){try{k(D(ua))}catch(va){n(va)}}:J}
var k,n,w=new b(function(D,J){k=D;n=J});
this.D(g(f,k),g(e,n));return w};
b.prototype.catch=function(f){return this.then(void 0,f)};
b.prototype.D=function(f,e){function g(){switch(k.h){case 1:f(k.i);break;case 2:e(k.i);break;default:throw Error("Unexpected state: "+k.h);}}
var k=this;this.g==null?m.h(g):this.g.push(g);this.u=!0};
b.resolve=d;b.reject=function(f){return new b(function(e,g){g(f)})};
b.race=function(f){return new b(function(e,g){for(var k=q(f),n=k.next();!n.done;n=k.next())d(n.value).D(e,g)})};
b.all=function(f){var e=q(f),g=e.next();return g.done?d([]):new b(function(k,n){function w(ua){return function(va){D[ua]=va;J--;J==0&&k(D)}}
var D=[],J=0;do D.push(void 0),J++,d(g.value).D(w(D.length-1),n),g=e.next();while(!g.done)})};
return b});
function v(a,b){return Object.prototype.hasOwnProperty.call(a,b)}
var za=typeof Object.assign=="function"?Object.assign:function(a,b){if(a==null)throw new TypeError("No nullish arg");a=Object(a);for(var c=1;c<arguments.length;c++){var d=arguments[c];if(d)for(var l in d)v(d,l)&&(a[l]=d[l])}return a};
p("Object.assign",function(a){return a||za});
p("WeakMap",function(a){function b(g){this.g=(e+=Math.random()+1).toString();if(g){g=q(g);for(var k;!(k=g.next()).done;)k=k.value,this.set(k[0],k[1])}}
function c(){}
function d(g){var k=typeof g;return k==="object"&&g!==null||k==="function"}
function l(g){if(!v(g,f)){var k=new c;ba(g,f,{value:k})}}
function m(g){var k=Object[g];k&&(Object[g]=function(n){if(n instanceof c)return n;Object.isExtensible(n)&&l(n);return k(n)})}
if(function(){if(!a||!Object.seal)return!1;try{var g=Object.seal({}),k=Object.seal({}),n=new a([[g,2],[k,3]]);if(n.get(g)!=2||n.get(k)!=3)return!1;n.delete(g);n.set(k,4);return!n.has(g)&&n.get(k)==4}catch(w){return!1}}())return a;
var f="$jscomp_hidden_"+Math.random();m("freeze");m("preventExtensions");m("seal");var e=0;b.prototype.set=function(g,k){if(!d(g))throw Error("Invalid WeakMap key");l(g);if(!v(g,f))throw Error("WeakMap key fail: "+g);g[f][this.g]=k;return this};
b.prototype.get=function(g){return d(g)&&v(g,f)?g[f][this.g]:void 0};
b.prototype.has=function(g){return d(g)&&v(g,f)&&v(g[f],this.g)};
b.prototype.delete=function(g){return d(g)&&v(g,f)&&v(g[f],this.g)?delete g[f][this.g]:!1};
return b});
p("Map",function(a){function b(){var e={};return e.previous=e.next=e.head=e}
function c(e,g){var k=e[1];return ya(function(){if(k){for(;k.head!=e[1];)k=k.previous;for(;k.next!=k.head;)return k=k.next,{done:!1,value:g(k)};k=null}return{done:!0,value:void 0}})}
function d(e,g){var k=g&&typeof g;k=="object"||k=="function"?m.has(g)?k=m.get(g):(k=""+ ++f,m.set(g,k)):k="p_"+g;var n=e[0][k];if(n&&v(e[0],k))for(e=0;e<n.length;e++){var w=n[e];if(g!==g&&w.key!==w.key||g===w.key)return{id:k,list:n,index:e,entry:w}}return{id:k,list:n,index:-1,entry:void 0}}
function l(e){this[0]={};this[1]=b();this.size=0;if(e){e=q(e);for(var g;!(g=e.next()).done;)g=g.value,this.set(g[0],g[1])}}
if(function(){if(!a||typeof a!="function"||!a.prototype.entries||typeof Object.seal!="function")return!1;try{var e=Object.seal({x:4}),g=new a(q([[e,"s"]]));if(g.get(e)!="s"||g.size!=1||g.get({x:4})||g.set({x:4},"t")!=g||g.size!=2)return!1;var k=g.entries(),n=k.next();if(n.done||n.value[0]!=e||n.value[1]!="s")return!1;n=k.next();return n.done||n.value[0].x!=4||n.value[1]!="t"||!k.next().done?!1:!0}catch(w){return!1}}())return a;
var m=new WeakMap;l.prototype.set=function(e,g){e=e===0?0:e;var k=d(this,e);k.list||(k.list=this[0][k.id]=[]);k.entry?k.entry.value=g:(k.entry={next:this[1],previous:this[1].previous,head:this[1],key:e,value:g},k.list.push(k.entry),this[1].previous.next=k.entry,this[1].previous=k.entry,this.size++);return this};
l.prototype.delete=function(e){e=d(this,e);return e.entry&&e.list?(e.list.splice(e.index,1),e.list.length||delete this[0][e.id],e.entry.previous.next=e.entry.next,e.entry.next.previous=e.entry.previous,e.entry.head=null,this.size--,!0):!1};
l.prototype.clear=function(){this[0]={};this[1]=this[1].previous=b();this.size=0};
l.prototype.has=function(e){return!!d(this,e).entry};
l.prototype.get=function(e){return(e=d(this,e).entry)&&e.value};
l.prototype.entries=function(){return c(this,function(e){return[e.key,e.value]})};
l.prototype.keys=function(){return c(this,function(e){return e.key})};
l.prototype.values=function(){return c(this,function(e){return e.value})};
l.prototype.forEach=function(e,g){for(var k=this.entries(),n;!(n=k.next()).done;)n=n.value,e.call(g,n[1],n[0],this)};
l.prototype[Symbol.iterator]=l.prototype.entries;var f=0;return l});
p("Set",function(a){function b(c){this.g=new Map;if(c){c=q(c);for(var d;!(d=c.next()).done;)this.add(d.value)}this.size=this.g.size}
if(function(){if(!a||typeof a!="function"||!a.prototype.entries||typeof Object.seal!="function")return!1;try{var c=Object.seal({x:4}),d=new a(q([c]));if(!d.has(c)||d.size!=1||d.add(c)!=d||d.size!=1||d.add({x:4})!=d||d.size!=2)return!1;var l=d.entries(),m=l.next();if(m.done||m.value[0]!=c||m.value[1]!=c)return!1;m=l.next();return m.done||m.value[0]==c||m.value[0].x!=4||m.value[1]!=m.value[0]?!1:l.next().done}catch(f){return!1}}())return a;
b.prototype.add=function(c){c=c===0?0:c;this.g.set(c,c);this.size=this.g.size;return this};
b.prototype.delete=function(c){c=this.g.delete(c);this.size=this.g.size;return c};
b.prototype.clear=function(){this.g.clear();this.size=0};
b.prototype.has=function(c){return this.g.has(c)};
b.prototype.entries=function(){return this.g.entries()};
b.prototype.values=function(){return this.g.values()};
b.prototype.keys=b.prototype.values;b.prototype[Symbol.iterator]=b.prototype.values;b.prototype.forEach=function(c,d){var l=this;this.g.forEach(function(m){return c.call(d,m,m,l)})};
return b});
function Aa(a,b){a instanceof String&&(a+="");var c=0,d=!1,l={next:function(){if(!d&&c<a.length){var m=c++;return{value:b(m,a[m]),done:!1}}d=!0;return{done:!0,value:void 0}}};
l[Symbol.iterator]=function(){return l};
return l}
p("Array.prototype.entries",function(a){return a?a:function(){return Aa(this,function(b,c){return[b,c]})}});
p("Array.prototype.keys",function(a){return a?a:function(){return Aa(this,function(b){return b})}});
p("Object.entries",function(a){return a?a:function(b){var c=[],d;for(d in b)v(b,d)&&c.push([d,b[d]]);return c}});/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
var Ba=this||self;function x(a,b){a=a.split(".");for(var c=Ba,d;a.length&&(d=a.shift());)a.length||b===void 0?c[d]&&c[d]!==Object.prototype[d]?c=c[d]:c=c[d]={}:c[d]=b}
;function Ca(a){throw Error("unexpected value "+a+"!");}
;/*

 Copyright Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
function y(a){return{valueOf:a}.valueOf()}
;var z={};var A=globalThis.trustedTypes,Da=A,Ea;function Fa(){var a=null;if(!Da)return a;try{var b=function(c){return c};
a=Da.createPolicy("goog#html",{createHTML:b,createScript:b,createScriptURL:b})}catch(c){}return a}
function Ga(){Ea===void 0&&(Ea=Fa());return Ea}
;function B(a,b){this.g=b}
B.prototype.toString=function(){return this.g+""};
function C(a){var b=Ga();a=b?b.createScriptURL(a):a;return new B(z,a)}
function Ha(a){return a instanceof B}
function E(a){if(Ha(a))return a.g;throw Error("");}
;function F(a,b){this.g=b}
F.prototype.toString=function(){return this.g};
function G(a){return new F(z,a)}
var Ia=G("about:blank"),Ja=G("about:invalid#zClosurez");function Ka(a){return a instanceof F}
function La(a){if(Ka(a))return a.g;throw Error("");}
;function H(a){this.fa=a}
function I(a){return new H(function(b){return b.substr(0,a.length+1).toLowerCase()===a+":"})}
var K={ya:I("tel"),ha:new H(function(a){return/^callto:\+?\d*$/i.test(a)}),
xa:new H(function(a){return a.indexOf("ssh://")===0}),
ua:I("rtsp"),S:I("data"),V:I("http"),W:I("https"),EXTENSION:new H(function(a){return a.indexOf("chrome-extension://")===0||a.indexOf("moz-extension://")===0||a.indexOf("ms-browser-extension://")===0||a.indexOf("safari-web-extension://")===0}),
T:I("ftp"),ca:new H(function(a){return/^[^:]*([/?#]|$)/.test(a)}),
ba:I("mailto"),oa:I("intent"),ta:I("market"),pa:I("itms"),qa:I("itms-appss"),ra:I("itms-services"),ka:I("fb-messenger"),Aa:I("whatsapp"),va:new H(function(a){return a.indexOf("sip:")===0||a.indexOf("sips:")===0}),
wa:I("sms"),za:I("vnd.youtube"),ma:I("googlehome"),na:I("googlehomesdk"),sa:I("line")},Ma=[K.S,K.V,K.W,K.ba,K.T,K.ca];function Na(a,b){b=b===void 0?Ma:b;if(Ka(a))return a;for(var c=0;c<b.length;++c){var d=b[c];if(d instanceof H&&d.fa(a))return G(a)}}
function Oa(a){var b=window;if(typeof MediaSource!=="undefined"&&a instanceof MediaSource||typeof b.ManagedMediaSource!=="undefined"&&a instanceof b.ManagedMediaSource)return G(URL.createObjectURL(a));b=a.type;b.toLowerCase()==="application/octet-stream"?b=!0:(b=b.match(/^([^;]+)(?:;\w+=(?:\w+|"[\w;,= ]+"))*$/i),b=(b==null?void 0:b.length)===2&&(/^image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp|x-icon|heic|heif|avif|x-ms-bmp)$/i.test(b[1])||/^video\/(?:3gpp|avi|mpeg|mpg|mp4|ogg|webm|x-flv|x-matroska|quicktime|x-ms-wmv)$/i.test(b[1])||
/^audio\/(?:3gpp2|3gpp|aac|amr|L16|midi|mp3|mp4|mpeg|oga|ogg|opus|x-m4a|x-matroska|x-wav|wav|webm)$/i.test(b[1])||/^font\/[\w-]+$/i.test(b[1])));if(!b)throw Error("");return G(URL.createObjectURL(a))}
var Pa=y(function(){return typeof URL==="function"});
function Qa(a){if(!Pa){a:{var b=document.createElement("a");try{b.href=a}catch(c){a=void 0;break a}a=b.protocol;a=a===":"||a===""?"https:":a}return a}try{b=new URL(a)}catch(c){return"https:"}return b.protocol}
var Ra=["data:","http:","https:","mailto:","ftp:"],Sa=/^\s*(?!javascript:)(?:[\w+.-]+:|[^:/?#]*(?:[/?#]|$))/i;function Ta(a){var b=!Sa.test(a);b&&Ua(a);if(!b)return a}
function L(a){return a instanceof F?La(a):Ta(a)}
var M=[];function Ua(){}
;function Va(a,b){b=L(b);b!==void 0&&(a.href=b)}
;function Wa(a,b){b=L(b);b!==void 0&&(a.href=b)}
;function Xa(a,b){a.href=E(b)}
;function Ya(a,b){b=L(b);b!==void 0&&(a.formAction=b)}
;function Za(a,b){a.src=E(b)}
;function $a(a,b){b=L(b);b!==void 0&&(a.action=b)}
;function N(a,b){this.g=b}
N.prototype.toString=function(){return this.g+""};
function O(a){var b=Ga();a=b?b.createHTML(a):a;return new N(z,a)}
var ab=y(function(){return new N(z,A?A.emptyHTML:"")});
function bb(a){return a instanceof N}
function P(a){if(bb(a))return a.g;throw Error("");}
;function cb(a,b){a.src=E(b).toString()}
function Q(a,b){a.srcdoc=P(b)}
var db={la:0,ia:1,ja:2,0:"FORMATTED_HTML_CONTENT",1:"EMBEDDED_INTERNAL_CONTENT",2:"EMBEDDED_TRUSTED_EXTERNAL_CONTENT"};function R(a,b){a.setAttribute("sandbox","");for(var c=0;c<b.length;c++)a.sandbox.supports&&!a.sandbox.supports(b[c])||a.sandbox.add(b[c])}
function S(a,b){b=Error.call(this,a+" cannot be used with intent "+db[b]);this.message=b.message;"stack"in b&&(this.stack=b.stack);this.type=a;this.name="TypeCannotBeUsedWithIframeIntentError"}
ja(S,Error);function eb(a,b){b=L(b);b!==void 0&&(a.formAction=b)}
;function fb(a,b){a.data=E(b)}
;function gb(a){return hb("script",a)}
function hb(a,b){b=b===void 0?document:b;var c,d;b=(d=(c=b).querySelector)==null?void 0:d.call(c,a+"[nonce]");return b==null?"":b.nonce||b.getAttribute("nonce")||""}
;function T(a,b){this.g=b}
T.prototype.toString=function(){return this.g+""};
function U(a){var b=Ga();a=b?b.createScript(a):a;return new T(z,a)}
var ib=y(function(){return new T(z,A?A.emptyScript:"")});
function jb(a){return a instanceof T}
function V(a){if(jb(a))return a.g;throw Error("");}
;function kb(a){var b=gb(a.ownerDocument);b&&a.setAttribute("nonce",b)}
function lb(a,b,c){a.src=E(b);(c==null?0:c.ga)||kb(a)}
;function mb(a,b){this.g=b}
mb.prototype.toString=function(){return this.g};
function nb(a){if(a instanceof mb)return a.g;throw Error("");}
;function ob(a,b,c,d){if(a.length===0)throw Error("");a=a.map(function(m){return nb(m)});
var l=c.toLowerCase();if(a.every(function(m){return l.indexOf(m)!==0}))throw Error('Attribute "'+c+'" does not match any of the allowed prefixes.');
b.setAttribute(c,d)}
function pb(a){if(/^(script|style)$/i.test(a.tagName))throw Error("");}
;var qb="alternate author bookmark canonical cite help icon license modulepreload next prefetch dns-prefetch prerender preconnect preload prev search subresource".split(" ");function rb(a,b,c){a.href=E(b).toString();a.rel=c}
;function sb(a,b){this.g=b}
sb.prototype.toString=function(){return this.g};
function W(a){return new sb(z,a)}
function tb(a){return a instanceof sb}
function ub(a){if(tb(a))return a.g;throw Error("");}
;var vb=["href","xlink:href"];function wb(a,b,c){return a.parseFromString(P(b),c)}
;function xb(a,b,c){b=Error.call(this,a+" was requested as a "+b+', but the response Content-Type, "'+c+" is not appropriate for this type of content.");this.message=b.message;"stack"in b&&(this.stack=b.stack);this.url=a}
ja(xb,Error);function yb(a,b){return a.createContextualFragment(P(b))}
;function zb(a){return W(a.map(ub).join(""))}
;function X(a,b){if(bb(a))return a;a=Y(String(a));if(b==null?0:b.Ea)a=a.replace(/(^|[\r\n\t ]) /g,"$1&#160;");if(b==null?0:b.Da)a=a.replace(/(\r\n|\n|\r)/g,"<br>");if(b==null?0:b.Fa)a=a.replace(/(\t+)/g,'<span style="white-space:pre">$1</span>');return O(a)}
function Y(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function Ab(a){return Bb("",a)}
function Bb(a,b){a=X(a);return O(b.map(function(c){return P(X(c))}).join(P(a).toString()))}
var Cb=/^[a-z][a-z\d-]*$/i,Db="APPLET BASE EMBED IFRAME LINK MATH META OBJECT SCRIPT STYLE SVG TEMPLATE".split(" "),Eb="AREA BR COL COMMAND HR IMG INPUT KEYGEN PARAM SOURCE TRACK WBR".split(" "),Fb=["action","formaction","href"];function Gb(a){if(!Cb.test(a))throw Error("");if(Db.indexOf(a.toUpperCase())!==-1)throw Error("");}
function Hb(a){for(var b="",c=Object.keys(a),d=0;d<c.length;d++){var l=c[d],m=a[l];if(!Cb.test(l))throw Error("");if(m!==void 0&&m!==null){if(/^on./i.test(l))throw Error("");Fb.indexOf(l.toLowerCase())!==-1&&(m=Ka(m)?m.toString():Ta(String(m))||"about:invalid#zClosurez");m=l+'="'+X(String(m))+'"';b+=" "+m}}return b}
;function Ib(){this.g=new Map}
Ib.prototype.format=function(a){var b=this,c=X("_safevalues_format_marker_:").toString();a=X(a).toString().replace(new RegExp("\\{"+c+"[\\w&#;]+\\}","g"),function(d){var l;if(l=b.g.get(d)){d="";switch(l.type){case "html":d=l.N;break;case "startTag":d="<"+l.tagName+l.attributes+">";break;case "endTag":d="</"+l.tagName+">"}l=d}else l=d;return l});
return O(a)};
Ib.prototype.text=function(a){a={type:"html",N:X(a).toString()};var b="{_safevalues_format_marker_:"+this.g.size+"_"+Math.random().toString(36).slice(2)+"}";this.g.set(X(b).toString(),a);return b};function Jb(a,b){var c=b.createRange();c.selectNode(b.body);a=O(a);return yb(c,a)}
;function Kb(a){a=a.nodeName;return typeof a==="string"?a:"FORM"}
function Lb(a){a=a.nodeType;return a===1||typeof a!=="number"}
;function Mb(a,b,c,d){var l=new Map(Nb);this.i=a;this.g=l;this.l=b;this.m=c;this.h=d}
function Ob(a,b,c){c=a.g.get(c);return(c==null?0:c.has(b))?c.get(b):a.l.has(b)?{j:1}:(c=a.m.get(b))?c:a.h&&[].concat(la(a.h)).some(function(d){return b.indexOf(d)===0})?{j:1}:{j:0}}
;var Pb="ARTICLE SECTION NAV ASIDE H1 H2 H3 H4 H5 H6 HEADER FOOTER ADDRESS P HR PRE BLOCKQUOTE OL UL LH LI DL DT DD FIGURE FIGCAPTION MAIN DIV EM STRONG SMALL S CITE Q DFN ABBR RUBY RB RT RTC RP DATA TIME CODE VAR SAMP KBD SUB SUP I B U MARK BDI BDO SPAN BR WBR NOBR INS DEL PICTURE PARAM TRACK MAP TABLE CAPTION COLGROUP COL TBODY THEAD TFOOT TR TD TH SELECT DATALIST OPTGROUP OPTION OUTPUT PROGRESS METER FIELDSET LEGEND DETAILS SUMMARY MENU DIALOG SLOT CANVAS FONT CENTER ACRONYM BASEFONT BIG DIR HGROUP STRIKE TT".split(" "),
Nb=[["A",new Map([["href",{j:7}]])],["AREA",new Map([["href",{j:7}]])],["LINK",new Map([["href",{j:5,conditions:new Map([["rel",new Set("alternate author bookmark canonical cite help icon license next prefetch dns-prefetch prerender preconnect preload prev search subresource".split(" "))]])}]])],["SOURCE",new Map([["src",{j:5}],["srcset",{j:6}]])],["IMG",new Map([["src",{j:5}],["srcset",{j:6}]])],["VIDEO",new Map([["src",{j:5}]])],["AUDIO",new Map([["src",{j:5}]])]],Qb="title aria-atomic aria-autocomplete aria-busy aria-checked aria-current aria-disabled aria-dropeffect aria-expanded aria-haspopup aria-hidden aria-invalid aria-label aria-level aria-live aria-multiline aria-multiselectable aria-orientation aria-posinset aria-pressed aria-readonly aria-relevant aria-required aria-selected aria-setsize aria-sort aria-valuemax aria-valuemin aria-valuenow aria-valuetext alt align autocapitalize autocomplete autocorrect autofocus autoplay bgcolor border cellpadding cellspacing checked cite color cols colspan controls controlslist coords crossorigin datetime disabled download draggable enctype face formenctype frameborder height hreflang hidden inert ismap label lang loop max maxlength media minlength min multiple muted nonce open playsinline placeholder preload rel required reversed role rows rowspan selected shape size sizes slot span spellcheck start step summary translate type usemap valign value width wrap itemscope itemtype itemid itemprop itemref".split(" "),
Rb=[["dir",{j:3,conditions:y(function(){return new Map([["dir",new Set(["auto","ltr","rtl"])]])})}],
["async",{j:3,conditions:y(function(){return new Map([["async",new Set(["async"])]])})}],
["loading",{j:3,conditions:y(function(){return new Map([["loading",new Set(["eager","lazy"])]])})}],
["poster",{j:5}],["target",{j:3,conditions:y(function(){return new Map([["target",new Set(["_self","_blank"])]])})}]],Sb=new Mb(new Set(Pb),new Set(Qb),new Map(Rb)),Tb=new Mb(new Set(Pb.concat(["BUTTON",
"INPUT"])),new Set(y(function(){return Qb.concat(["class","id","name"])})),new Map(y(function(){return Rb.concat([["style",
{j:1}]])}))),Ub=new Mb(new Set(y(function(){return Pb.concat("STYLE TITLE INPUT TEXTAREA BUTTON LABEL".split(" "))})),new Set(y(function(){return Qb.concat(["class",
"id","tabindex","contenteditable","name"])})),new Map(y(function(){return Rb.concat([["style",
{j:1}]])})),new Set(["data-",
"aria-"]));function Vb(a){this.g=a}
function Wb(a,b){var c=document.implementation.createHTMLDocument("");a=Xb(a,b,c);c=c.body;c.appendChild(a);c=(new XMLSerializer).serializeToString(c);c=c.slice(c.indexOf(">")+1,c.lastIndexOf("</"));return O(c)}
function Xb(a,b,c){b=Jb(b,c);b=document.createTreeWalker(b,5,function(e){if(e.nodeType===3)e=1;else if(Lb(e))if(e=Kb(e),e===null)e=2;else{var g=a.g;e=e!=="FORM"&&(g.i.has(e)||g.g.has(e))?1:2}else e=2;return e});
for(var d=b.nextNode(),l=c.createDocumentFragment(),m=l;d!==null;){var f=void 0;if(d.nodeType===3)f=document.createTextNode(d.data);else if(Lb(d))f=Yb(a,d,c);else throw Error("");m.appendChild(f);if(d=b.firstChild())m=f;else for(;!(d=b.nextSibling())&&(d=b.parentNode());)m=m.parentNode}return l}
function Yb(a,b,c){var d=Kb(b);c=c.createElement(d);b=b.attributes;for(var l=q(b),m=l.next();!m.done;m=l.next()){var f=m.value;m=f.name;f=f.value;var e=Ob(a.g,m,d),g;a:{if(g=e.conditions){g=q(g);for(var k=g.next();!k.done;k=g.next()){var n=q(k.value);k=n.next().value;n=n.next().value;var w=void 0;if((k=(w=b.getNamedItem(k))==null?void 0:w.value)&&!n.has(k)){g=!1;break a}}}g=!0}if(g)switch(e.j){case 1:Z(c,m,f);break;case 2:throw Error();case 3:Z(c,m,f.toLowerCase());break;case 4:Z(c,m,f);break;case 5:Z(c,
m,f);break;case 6:Z(c,m,f);break;case 7:e=Qa(f),f=e!==void 0&&Ra.indexOf(e.toLowerCase())!==-1?f:"about:invalid#zClosurez",Z(c,m,f)}}return c}
function Z(a,b,c){a.setAttribute(b,c)}
var Zb=y(function(){return new Vb(Sb)});
function $b(a){return Wb(Zb,a)}
var ac=y(function(){return new Vb(Tb)}),bc=y(function(){return new Vb(Ub)});function cc(){}
function dc(){cc.apply(this,arguments)}
ja(dc,cc);function ec(a){var b=a.split(/[?#]/),c=/[?]/.test(a)?"?"+b[1]:"";return{F:b[0],P:c,L:/[#]/.test(a)?"#"+(c?b[2]:b[1]):""}}
function fc(a,b,c,d){function l(f,e){f!=null&&(Array.isArray(f)?f.forEach(function(g){return l(g,e)}):(b+=m+encodeURIComponent(e)+"="+encodeURIComponent(f),m="&"))}
var m=b.length?"&":"?";d.constructor===Object&&(d=Object.entries(d));Array.isArray(d)?d.forEach(function(f){return l(f[1],f[0])}):d.forEach(l);
return C(a+b+c)}
var hc=/[^#]*/;function ic(a){return U(JSON.stringify(a).replace(/</g,"\\u003C"))}
;var jc={0:1,1:1},kc={0:.1,1:.1};function lc(a,b){var c;if(!(c=!b)){var d,l;c=!(Math.random()<((l=(d=b.Ga)!=null?d:jc[b.R[0]])!=null?l:0))}if(c||window.SAFEVALUES_REPORTING===!1||!("DocumentFragment"in window))return a;var m,f;Math.random()<((f=(m=b.Ca)!=null?m:kc[b.R[0]])!=null?f:0)&&mc(b,"HEARTBEAT");nc(a,b)||X(a).toString()!==a&&mc(b,"H_ESCAPE");return a}
function nc(a,b){try{Wb(bc,a)}catch(c){return mc(b,"H_SLSANITIZE"),!0}try{Wb(ac,a)}catch(c){return mc(b,"H_RSANITIZE"),!0}try{$b(a)}catch(c){return mc(b,"H_SANITIZE"),!0}return!1}
function mc(a,b){(oc?oc:typeof window!=="undefined"&&window.navigator&&window.navigator.sendBeacon!==void 0?navigator.sendBeacon.bind(navigator):pc)("https://csp.withgoogle.com/csp/lcreport/"+a.R,JSON.stringify({host:window.location.hostname,type:b,additionalData:void 0}))}
function pc(a,b){var c=new XMLHttpRequest;c.open("POST",a);c.setRequestHeader("Content-Type","application/json");c.send(b)}
var oc;function qc(a){return a===null?"null":a===void 0?"undefined":a}
;x("safevalues_raw.safeAttrPrefix",function(a){return new mb(z,a[0].toLowerCase())});
x("safevalues_raw.htmlFragment",function(a){return document.createRange().createContextualFragment(P(O(a[0])))});
x("safevalues_raw.svgFragment",function(a){var b=document.createElementNS("http://www.w3.org/2000/svg","svg"),c=document.createRange();c.selectNodeContents(b);return c.createContextualFragment(P(O(a[0])))});
x("safevalues_raw.concatHtmls",Ab);x("safevalues_raw.doctypeHtml",function(){return O("<!DOCTYPE html>")});
x("safevalues_raw.htmlEscape",X);x("safevalues_raw.joinHtmls",Bb);x("safevalues_raw.scriptToHtml",function(a,b){a=V(a).toString();var c="<script";if(b==null?0:b.id)c+=' id="'+Y(b.id)+'"';if(b==null?0:b.nonce)c+=' nonce="'+Y(b.nonce)+'"';if(b==null?0:b.type)c+=' type="'+Y(b.type)+'"';if(b==null?0:b.defer)c+=" defer";return O(c+(">"+a+"\x3c/script>"))});
x("safevalues_raw.scriptUrlToHtml",function(a,b){a=E(a).toString();a='<script src="'+Y(a)+'"';if(b==null?0:b.async)a+=" async";(b==null?void 0:b.attributionSrc)!==void 0&&(a+=' attributionsrc="'+Y(b.attributionSrc)+'"');if(b==null?0:b.ea)a+=' custom-element="'+Y(b.ea)+'"';if(b==null?0:b.defer)a+=" defer";if(b==null?0:b.id)a+=' id="'+Y(b.id)+'"';if(b==null?0:b.nonce)a+=' nonce="'+Y(b.nonce)+'"';if(b==null?0:b.type)a+=' type="'+Y(b.type)+'"';if(b==null?0:b.da)a+=' crossorigin="'+Y(b.da)+'"';return O(a+
">\x3c/script>")});
x("safevalues_raw.sanitizeHtml",function(a){return Wb(Zb,a)});
x("safevalues_raw.sanitizeHtmlAssertUnchanged",$b);x("safevalues_raw.sanitizeHtmlToFragment",function(a){var b=document.implementation.createHTMLDocument("");return Xb(Zb,a,b)});
x("safevalues_raw.HtmlSanitizerBuilder",dc);x("safevalues_raw.appendParams",function(a,b){a=ec(E(a).toString());return fc(a.F,a.P,a.L,b)});
x("safevalues_raw.replaceParams",function(a,b){a=ec(E(a).toString());return fc(a.F,"",a.L,b)});
x("safevalues_raw.appendPathSegment",function(a,b){a=ec(E(a).toString());b=a.F+(a.F.slice(-1)==="/"?"":"/")+encodeURIComponent(b);return C(b+a.P+a.L)});
x("safevalues_raw.objectUrlFromScript",function(a){a=V(a).toString();return C(URL.createObjectURL(new Blob([a],{type:"text/javascript"})))});
x("safevalues_raw.replaceFragment",function(a,b){a=E(a).toString();return C(hc.exec(a)[0]+(b.trim()?"#"+b:""))});
x("safevalues_raw.toAbsoluteResourceUrl",function(a){a=E(a).toString();a=new URL(a,window.document.baseURI);return C(a.toString())});
x("safevalues_raw.trustedResourceUrl",function(a){var b=u.apply(1,arguments);if(b.length===0)return C(a[0]);for(var c=a[0],d=0;d<b.length;d++)c+=encodeURIComponent(b[d])+a[d+1];return C(c)});
x("safevalues_raw.concatScripts",function(a){return U(a.map(V).join(""))});
x("safevalues_raw.safeScript",function(a){return U(a.join(""))});
x("safevalues_raw.safeScriptWithArgs",function(a){return function(){var b=u.apply(0,arguments).map(function(c){return ic(c).toString()});
return U("("+a.join("")+")("+b.join(",")+")")}});
x("safevalues_raw.valueAsScript",ic);x("safevalues_raw.concatStyleSheets",zb);x("safevalues_raw.safeStyleSheet",function(a){return W(a[0])});
x("safevalues_raw.addJavaScriptUrlSanitizationCallback",function(a){M.indexOf(a)===-1&&M.push(a);Ua=function(b){M.forEach(function(c){c(b)})}});
x("safevalues_raw.objectUrlFromSafeSource",Oa);x("safevalues_raw.removeJavaScriptUrlSanitizationCallback",function(a){a=M.indexOf(a);a!==-1&&M.splice(a,1)});
x("safevalues_raw.safeUrl",function(a){for(var b=u.apply(1,arguments),c=[a[0]],d=0;d<b.length;d++)c.push(String(b[d])),c.push(a[d+1]);return G(c.join(""))});
x("safevalues_raw.SanitizableUrlScheme",K);x("safevalues_raw.sanitizeUrl",function(a,b){b=b===void 0?Ma:b;b=Na(a,b);b===void 0&&Ua(a.toString());return b||Ja});
x("safevalues_raw.trySanitizeUrl",Na);x("safevalues_raw.SafeAttributePrefix",mb);x("safevalues_raw.unwrapAttributePrefix",nb);x("safevalues_raw.EMPTY_HTML",ab);x("safevalues_raw.isHtml",bb);x("safevalues_raw.SafeHtml",N);x("safevalues_raw.unwrapHtml",P);x("safevalues_raw.isResourceUrl",Ha);x("safevalues_raw.TrustedResourceUrl",B);x("safevalues_raw.unwrapResourceUrl",E);x("safevalues_raw.EMPTY_SCRIPT",ib);x("safevalues_raw.isScript",jb);x("safevalues_raw.SafeScript",T);
x("safevalues_raw.unwrapScript",V);x("safevalues_raw.isStyleSheet",tb);x("safevalues_raw.SafeStyleSheet",sb);x("safevalues_raw.unwrapStyleSheet",ub);x("safevalues_raw.ABOUT_BLANK",Ia);x("safevalues_raw.INNOCUOUS_URL",Ja);x("safevalues_raw.isUrl",Ka);x("safevalues_raw.SafeUrl",F);x("safevalues_raw.unwrapUrl",La);x("safevalues_raw.reportOnlyHtmlPassthrough",lc);x("safevalues_raw.HtmlFormatter",Ib);
x("safevalues_raw.createHtml",function(a,b,c){Gb(a);var d="<"+a;b&&(d+=Hb(b));Array.isArray(c)||(c=c===void 0?[]:[c]);Eb.indexOf(a.toUpperCase())!==-1?d+=">":(b=Ab(c.map(function(l){return bb(l)?l:X(String(l))})),d+=">"+b.toString()+"</"+a+">");
return O(d)});
x("safevalues_raw.styleSheetToHtml",function(a,b){var c={};if(b)for(var d=Object.keys(b),l=0;l<d.length;l++){var m=d[l];if(m.toLowerCase()==="type")throw Error("");c[m]=b[m]}c.type="text/css";b=Hb(c);Array.isArray(a)&&(a=zb(a));a=ub(a);return O("<style "+b+">"+a+"</style>")});
x("safevalues_raw.safeStyleRule",function(a){for(var b=u.apply(1,arguments),c=a[0],d=0;d<a.length-1;d++)c+=String(b[d]),c+=a[d+1];b=document.implementation.createHTMLDocument("");d=b.createElement("style");b.head.appendChild(d);b=d.sheet;b.insertRule(c,0);if(b.cssRules.length===1&&(c=b.cssRules[0],c instanceof CSSStyleRule))return W(c.cssText.replace(/</g,"\\3C "))});
x("safevalues_raw.dom.setAnchorHref",Va);x("safevalues_raw.dom.setAnchorHref",Va);x("safevalues_raw.dom.setAreaHref",Wa);x("safevalues_raw.dom.setBaseHref",Xa);x("safevalues_raw.dom.setButtonFormaction",Ya);x("safevalues_raw.dom.buildPrefixedAttributeSetter",function(a){var b=[a].concat(la(u.apply(1,arguments)));return function(c,d,l){ob(b,c,d,l)}});
x("safevalues_raw.dom.elementInsertAdjacentHtml",function(a,b,c){var d=b==="beforebegin"||b==="afterend"?a.parentElement:a;d!==null&&pb(d);a.insertAdjacentHTML(b,P(c))});
x("safevalues_raw.dom.setElementAttribute",function(a,b,c){if(a.namespaceURI!=="http://www.w3.org/1999/xhtml")throw Error("Cannot set attribute '"+b+"' on '"+a.tagName+"'.Element is not in the HTML namespace");b=b.toLowerCase();switch(a.tagName+" "+b){case "A href":Va(a,c);break;case "AREA href":Wa(a,c);break;case "BASE href":Xa(a,c);break;case "BUTTON formaction":Ya(a,c);break;case "EMBED src":Za(a,c);break;case "FORM action":$a(a,c);break;case "IFRAME src":cb(a,c);break;case "IFRAME srcdoc":Q(a,
c);break;case "IFRAME sandbox":throw Error("Can't set 'sandbox' on iframe tags. Use setIframeSrcWithIntent or setIframeSrcdocWithIntent instead");case "INPUT formaction":eb(a,c);break;case "LINK href":throw Error("Can't set 'href' attribute on link tags. Use setLinkHrefAndRel instead");case "LINK rel":throw Error("Can't set 'rel' attribute on link tags. Use setLinkHrefAndRel instead");case "OBJECT data":fb(a,c);break;case "SCRIPT src":lb(a,c);break;default:if(/^on./.test(b))throw Error('Attribute "'+
b+'" looks like an event handler attribute. Please use a safe alternative like addEventListener instead.');a.setAttribute(b,c)}});
x("safevalues_raw.dom.setElementInnerHtml",function(a,b){a.nodeType===1&&pb(a);a.innerHTML=P(b)});
x("safevalues_raw.dom.setElementOuterHtml",function(a,b){var c=a.parentElement;c!==null&&pb(c);a.outerHTML=P(b)});
x("safevalues_raw.dom.setElementPrefixedAttribute",ob);x("safevalues_raw.dom.setEmbedSrc",Za);x("safevalues_raw.dom.setFormAction",$a);x("safevalues_raw.dom.IframeIntent",db);x("safevalues_raw.dom.TypeCannotBeUsedWithIframeIntentError",S);x("safevalues_raw.dom.setIframeSrc",cb);
x("safevalues_raw.dom.setIframeSrcWithIntent",function(a,b,c){a.removeAttribute("srcdoc");switch(b){case 0:if(c instanceof B)throw new S("TrustedResourceUrl",0);R(a,[]);b=L(c);b!==void 0&&(a.src=b);break;case 1:if(!(c instanceof B))throw new S(typeof c,1);R(a,"allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation".split(" "));cb(a,c);break;case 2:if(c instanceof B)throw new S("TrustedResourceUrl",2);R(a,"allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation".split(" "));
b=L(c);b!==void 0&&(a.src=b);break;default:Ca(b)}});
x("safevalues_raw.dom.setIframeSrcdoc",Q);
x("safevalues_raw.dom.setIframeSrcdocWithIntent",function(a,b,c){a.removeAttribute("src");switch(b){case 0:if(c instanceof N)throw new S("SafeHtml",0);a.Ba="default-src 'none'";R(a,[]);Q(a,O(c));break;case 1:if(!(c instanceof N))throw new S("string",1);R(a,"allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation".split(" "));Q(a,c);break;case 2:if(c instanceof N)throw new S("SafeHtml",1);R(a,["allow-scripts","allow-forms","allow-popups",
"allow-popups-to-escape-sandbox","allow-storage-access-by-user-activation"]);Q(a,O(c));break;default:Ca(b)}});
x("safevalues_raw.dom.setInputFormaction",eb);x("safevalues_raw.dom.setLinkHrefAndRel",function(a,b,c){if(Ha(b))rb(a,b,c);else{if(qb.indexOf(c)===-1)throw Error('TrustedResourceUrl href attribute required with rel="'+c+'"');b=L(b);b!==void 0&&(a.href=b,a.rel=c)}});
x("safevalues_raw.dom.setLinkWithResourceUrlHrefAndRel",rb);x("safevalues_raw.dom.setObjectData",fb);x("safevalues_raw.dom.setScriptSrc",lb);x("safevalues_raw.dom.setScriptTextContent",function(a,b,c){a.textContent=V(b);(c==null?0:c.ga)||kb(a)});
x("safevalues_raw.dom.setStyleTextContent",function(a,b){a.textContent=ub(b)});
x("safevalues_raw.dom.setSvgAttribute",function(a,b,c){var d=b.toLowerCase();if(vb.indexOf(d)!==-1||d.indexOf("on")===0)throw Error("");a.setAttribute(b,c)});
x("safevalues_raw.dom.setSvgUseHref",function(a,b){var c=Qa(b);c!=="javascript:"&&c!=="data:"&&a.setAttribute("href",b)});
x("safevalues_raw.dom.documentExecCommand",function(a,b,c){b=String(b);var d=c;b.toLowerCase()==="inserthtml"&&(d=P(c));return a.execCommand(b,!1,d)});
x("safevalues_raw.dom.documentExecCommandInsertHtml",function(a,b){return a.execCommand("insertHTML",!1,P(b))});
x("safevalues_raw.dom.documentWrite",function(a,b){a.write(P(b))});
x("safevalues_raw.dom.domParserParseFromString",wb);x("safevalues_raw.dom.domParserParseHtml",function(a,b){return wb(a,b,"text/html")});
x("safevalues_raw.dom.domParserParseXml",function(a,b){a=wb(a,O(b),"text/xml");b=document.createNodeIterator(a,NodeFilter.SHOW_ELEMENT);for(var c;c=b.nextNode();)if(c=c.namespaceURI,c==="http://www.w3.org/1999/xhtml"||c==="http://www.w3.org/2000/svg"||c==="http://www.w3.org/1998/Math/MathML")throw Error("unsafe XML");return a});
x("safevalues_raw.dom.fetchResourceUrl",function(a,b){var c,d,l,m,f;return xa(function(e){if(e.g==1)return e.u(fetch(E(a).toString(),b),2);c=e.m;f=(d=c.headers.get("Content-Type"))==null?void 0:(l=d.split(";",2))==null?void 0:(m=l[0])==null?void 0:m.toLowerCase();return e.return({N:function(){var g;return xa(function(k){if(k.g==1){if(f!=="text/html")throw new xb(c.url,"SafeHtml","text/html");return k.u(c.text(),2)}g=k.m;return k.return(O(g))})},
script:function(){var g;return xa(function(k){if(k.g==1){if(f!=="text/javascript"&&f!=="application/javascript")throw new xb(c.url,"SafeScript","text/javascript");return k.u(c.text(),2)}g=k.m;return k.return(U(g))})},
styleSheet:function(){var g;return xa(function(k){if(k.g==1){if(f!=="text/css")throw new xb(c.url,"SafeStyleSheet","text/css");return k.u(c.text(),2)}g=k.m;return k.return(W(g))})}})})});
x("safevalues_raw.dom.globalEval",function(a,b){b=V(b);var c=a.eval(b);c===b&&(c=a.eval(b.toString()));return c});
x("safevalues_raw.dom.locationAssign",function(a,b){b=L(b);b!==void 0&&a.assign(b)});
x("safevalues_raw.dom.locationReplace",function(a,b){b=L(b);b!==void 0&&a.replace(b)});
x("safevalues_raw.dom.setLocationHref",function(a,b){b=L(b);b!==void 0&&(a.href=b)});
x("safevalues_raw.dom.rangeCreateContextualFragment",yb);x("safevalues_raw.dom.serviceWorkerContainerRegister",function(a,b,c){return a.register(E(b),c)});
x("safevalues_raw.dom.objectUrlFromSafeSource",function(a){return Oa(a).toString()});
x("safevalues_raw.dom.getScriptNonce",gb);x("safevalues_raw.dom.getStyleNonce",function(a){return hb("style",a)});
x("safevalues_raw.dom.windowOpen",function(a,b,c,d){b=L(b);return b!==void 0?a.open(b,c,d):null});
x("safevalues_raw.dom.createWorker",function(a,b){return new Worker(E(a),b)});
x("safevalues_raw.dom.createSharedWorker",function(a,b){return new SharedWorker(E(a),b)});
x("safevalues_raw.dom.workerGlobalScopeImportScripts",function(a){a.importScripts.apply(a,la(u.apply(1,arguments).map(function(b){return E(b)})))});
x("safevalues_raw.restricted.legacy.legacyUnsafeHtml",function(a,b){a=qc(a);return O(lc(a,b))});
x("safevalues_raw.restricted.legacy.legacyUnsafeScript",function(a){a=qc(a);return U(a)});
x("safevalues_raw.restricted.legacy.legacyUnsafeResourceUrl",function(a){a=qc(a);return C(a)});
x("safevalues_raw.restricted.legacy.legacyUnsafeStyleSheet",function(a){a=qc(a);return W(a)});
x("safevalues_raw.restricted.legacy.superLenientlySanitizeHtml",function(a){return Wb(bc,a)});
x("safevalues_raw.restricted.reviewed.htmlSafeByReview",function(a){return O(a)});
x("safevalues_raw.restricted.reviewed.scriptSafeByReview",function(a){return U(a)});
x("safevalues_raw.restricted.reviewed.resourceUrlSafeByReview",function(a){return C(a)});
x("safevalues_raw.restricted.reviewed.styleSheetSafeByReview",function(a){return W(a)});/*

 Copyright 2015 Bodymovin
 SPDX-License-Identifier: MIT

 Copyright 2014-2015, Epistemex by Ken Fyrstenberg and contributions by
 leeoniya SPDX-License-Identifier: MIT

 Copyright 2014 David Bau
 SPDX-License-Identifier: MIT

 Copyright 2014 - 2015, BezierEasing by Ga?tan Renaudeau
 SPDX-License-Identifier: MIT
 Transformation Matrix v2.0
          (c) Epistemex 2014-2015
          www.epistemex.com
          By Ken Fyrstenberg
          Contributions by leeoniya.
          License: MIT, header required.
*/
(function(){"undefined"!=typeof navigator&&function(R,ta){(R="undefined"!=typeof globalThis?globalThis:R||self).lottie=ta()}(this,function(){function R(c,a){var b,d,e=c.length;
for(b=0;b<e;b+=1)for(var f in d=c[b].prototype)Object.prototype.hasOwnProperty.call(d,f)&&(a.prototype[f]=d[f])}
function ta(c){return Array.apply(null,{length:c})}
function ya(c){return ya="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},ya(c)}
function pc(c,a,b,d){this.type=c;this.currentTime=a;this.totalTime=b;this.direction=d<0?-1:1}
function Gc(c,a){this.type=c;this.direction=a<0?-1:1}
function Vc(c,a,b,d){this.type=c;this.currentLoop=b;this.totalLoops=a;this.direction=d<0?-1:1}
function Wc(c,a,b){this.type=c;this.firstFrame=a;this.totalFrames=b}
function Xc(c,a){this.type=c;this.target=a}
function ud(c,a){this.type="renderFrameError";this.nativeError=c;this.currentTime=a}
function Dd(c){this.type="configError";this.nativeError=c}
function Yc(c,a,b){var d,e,f,k,n;switch(f=b*(1-a),k=b*(1-(e=6*c-(d=Math.floor(6*c)))*a),n=b*(1-(1-e)*a),d%6){case 0:var h=b;var g=n;var q=f;break;case 1:h=k;g=b;q=f;break;case 2:h=f;g=b;q=n;break;case 3:h=f;g=k;q=b;break;case 4:h=n;g=f;q=b;break;case 5:h=b,g=f,q=k}return[h,g,q]}
function qc(c,a,b){var d=Math.max(c,a,b),e=Math.min(c,a,b),f=d-e;switch(d){case e:var k=0;break;case c:k=(a-b+f*(a<b?6:0))/(6*f);break;case a:k=(b-c+2*f)/(6*f);break;case b:k=(c-a+4*f)/(6*f)}return[k,0===d?0:f/d,d/255]}
function Hc(c,a){c=qc(255*c[0],255*c[1],255*c[2]);return c[1]+=a,c[1]>1?c[1]=1:c[1]<=0&&(c[1]=0),Yc(c[0],c[1],c[2])}
function Zc(c,a){c=qc(255*c[0],255*c[1],255*c[2]);return c[2]+=a,c[2]>1?c[2]=1:c[2]<0&&(c[2]=0),Yc(c[0],c[1],c[2])}
function $c(c,a){c=qc(255*c[0],255*c[1],255*c[2]);return c[0]+=a/360,c[0]>1?--c[0]:c[0]<0&&(c[0]+=1),Yc(c[0],c[1],c[2])}
function X(c){return document.createElementNS("http://www.w3.org/2000/svg",c)}
function W(c){return W="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},W(c)}
function Ic(){}
function rc(c){return rc="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},rc(c)}
function vd(c,a){var b,d=this.offsetTime;"multidimensional"===this.propType&&(b=la("float32",this.pv.length));for(var e,f,k,n,h,g,q,r,v=a.lastIndex,p=v,l=this.keyframes.length-1,m=!0;m;){if(e=this.keyframes[p],f=this.keyframes[p+1],p===l-1&&c>=f.t-d){e.h&&(e=f);v=0;break}if(f.t-d>c){v=p;break}p<l-1?p+=1:(v=0,m=!1)}k=this.keyframesMetadata[p]||{};var t;m=f.t-d;d=e.t-d;if(e.to){k.bezierData||(k.bezierData=Xa.buildBezierData(e.s,f.s||e.e,e.to,e.ti));var u=k.bezierData;if(c>=m||c<d){var w=c>=m?u.points.length-
1:0;h=u.points[w].point.length;for(n=0;n<h;n+=1)b[n]=u.points[w].point[n]}else{k.__fnct?r=k.__fnct:(r=kb.getBezierEasing(e.o.x,e.o.y,e.i.x,e.i.y,e.n).get,k.__fnct=r);g=r((c-d)/(m-d));n=u.segmentLength*g;w=a.lastFrame<c&&a._lastKeyframeIndex===p?a._lastAddedLength:0;q=a.lastFrame<c&&a._lastKeyframeIndex===p?a._lastPoint:0;m=!0;for(h=u.points.length;m;){if(w+=u.points[q].partialLength,0===n||0===g||q===u.points.length-1){h=u.points[q].point.length;for(n=0;n<h;n+=1)b[n]=u.points[q].point[n];break}if(n>=
w&&n<w+u.points[q+1].partialLength){c=(n-w)/u.points[q+1].partialLength;h=u.points[q].point.length;for(n=0;n<h;n+=1)b[n]=u.points[q].point[n]+(u.points[q+1].point[n]-u.points[q].point[n])*c;break}q<h-1?q+=1:m=!1}a._lastPoint=q;a._lastAddedLength=w-u.points[q].partialLength;a._lastKeyframeIndex=p}}else{var x,D;if(l=e.s.length,t=f.s||e.e,this.sh&&1!==e.h)if(c>=m)b[0]=t[0],b[1]=t[1],b[2]=t[2];else if(c<=d)b[0]=e.s[0],b[1]=e.s[1],b[2]=e.s[2];else{k=sc(e.s);g=sc(t);p=b;m=(c-d)/(m-d);d=[];e=k[0];r=k[1];
f=k[2];k=k[3];l=g[0];var K=g[1];var J=g[2];g=g[3];c=((w=e*l+r*K+f*J+k*g)<0&&(w=-w,l=-l,K=-K,J=-J,g=-g),1-w>1E-6?(u=Math.acos(w),q=Math.sin(u),n=Math.sin((1-m)*u)/q,h=Math.sin(m*u)/q):(n=1-m,h=m),d[0]=n*e+h*l,d[1]=n*r+h*K,d[2]=n*f+h*J,d[3]=n*k+h*g,d);u=c[0];w=c[1];q=c[2];c=c[3];n=Math.atan2(2*w*c-2*u*q,1-2*w*w-2*q*q);h=Math.asin(2*u*w+2*q*c);u=Math.atan2(2*u*c-2*w*q,1-2*u*u-2*q*q);p[0]=n/qa;p[1]=h/qa;p[2]=u/qa}else for(p=0;p<l;p+=1)1!==e.h&&(c>=m?g=1:c<d?g=0:(e.o.x.constructor===Array?(k.__fnct||(k.__fnct=
[]),k.__fnct[p]?r=k.__fnct[p]:(K=void 0===e.o.x[p]?e.o.x[0]:e.o.x[p],J=void 0===e.o.y[p]?e.o.y[0]:e.o.y[p],x=void 0===e.i.x[p]?e.i.x[0]:e.i.x[p],D=void 0===e.i.y[p]?e.i.y[0]:e.i.y[p],r=kb.getBezierEasing(K,J,x,D).get,k.__fnct[p]=r)):k.__fnct?r=k.__fnct:(K=e.o.x,J=e.o.y,x=e.i.x,D=e.i.y,r=kb.getBezierEasing(K,J,x,D).get,e.keyframeMetadata=r),g=r((c-d)/(m-d)))),t=f.s||e.e,u=1===e.h?e.s[p]:e.s[p]+(t[p]-e.s[p])*g,"multidimensional"===this.propType?b[p]=u:b=u}return a.lastIndex=v,b}
function sc(c){var a=c[0]*qa,b=c[1]*qa,d=c[2]*qa;c=Math.cos(a/2);var e=Math.cos(b/2),f=Math.cos(d/2);a=Math.sin(a/2);b=Math.sin(b/2);d=Math.sin(d/2);return[a*b*f+c*e*d,a*e*f+c*b*d,c*b*f-a*e*d,c*e*f-a*b*d]}
function ad(){var c=this.comp.renderedFrame-this.offsetTime,a=this.keyframes[0].t-this.offsetTime,b=this.keyframes[this.keyframes.length-1].t-this.offsetTime;c===this._caching.lastFrame||this._caching.lastFrame!==Mb&&(this._caching.lastFrame>=b&&c>=b||this._caching.lastFrame<a&&c<a)||(this._caching.lastFrame>=c&&(this._caching._lastKeyframeIndex=-1,this._caching.lastIndex=0),this.pv=a=this.interpolateValue(c,this._caching));return this._caching.lastFrame=c,this.pv}
function tc(c){if("unidimensional"===this.propType){var a=c*this.mult;pd(this.v-a)>1E-5&&(this.v=a,this._mdf=!0)}else for(var b=0,d=this.v.length;b<d;)a=c[b]*this.mult,pd(this.v[b]-a)>1E-5&&(this.v[b]=a,this._mdf=!0),b+=1}
function uc(){if(this.elem.globalData.frameId!==this.frameId&&this.effectsSequence.length)if(this.lock)this.setVValue(this.pv);else{var c;this.lock=!0;this._mdf=this._isFirstFrame;var a=this.effectsSequence.length,b=this.kf?this.pv:this.data.k;for(c=0;c<a;c+=1)b=this.effectsSequence[c](b);this.setVValue(b);this.lock=this._isFirstFrame=!1;this.frameId=this.elem.globalData.frameId}}
function Eb(c){this.effectsSequence.push(c);this.container.addDynamicProperty(this)}
function Kc(c,a,b,d){this.propType="unidimensional";this.mult=b||1;this.data=a;this.v=b?a.k*b:a.k;this.pv=a.k;this._mdf=!1;this.elem=c;this.container=d;this.comp=c.comp;this.kf=this.k=!1;this.vel=0;this.effectsSequence=[];this._isFirstFrame=!0;this.getValue=uc;this.setVValue=tc;this.addEffect=Eb}
function Lc(c,a,b,d){this.propType="multidimensional";this.mult=b||1;this.data=a;this._mdf=!1;this.elem=c;this.container=d;this.comp=c.comp;this.kf=this.k=!1;this.frameId=-1;b=a.k.length;this.v=la("float32",b);this.pv=la("float32",b);this.vel=la("float32",b);for(c=0;c<b;c+=1)this.v[c]=a.k[c]*this.mult,this.pv[c]=a.k[c];this._isFirstFrame=!0;this.effectsSequence=[];this.getValue=uc;this.setVValue=tc;this.addEffect=Eb}
function Fd(c,a,b,d){this.propType="unidimensional";this.keyframes=a.k;this.keyframesMetadata=[];this.offsetTime=c.data.st;this.frameId=-1;this._caching={lastFrame:Mb,lastIndex:0,value:0,_lastKeyframeIndex:-1};this.kf=this.k=!0;this.data=a;this.mult=b||1;this.elem=c;this.container=d;this.comp=c.comp;this.pv=this.v=Mb;this._isFirstFrame=!0;this.getValue=uc;this.setVValue=tc;this.interpolateValue=vd;this.effectsSequence=[ad.bind(this)];this.addEffect=Eb}
function Gd(c,a,b,d){var e;this.propType="multidimensional";var f,k,n,h,g=a.k.length;for(e=0;e<g-1;e+=1)a.k[e].to&&a.k[e].s&&a.k[e+1]&&a.k[e+1].s&&(f=a.k[e].s,k=a.k[e+1].s,n=a.k[e].to,h=a.k[e].ti,(2===f.length&&(f[0]!==k[0]||f[1]!==k[1])&&Xa.pointOnLine2D(f[0],f[1],k[0],k[1],f[0]+n[0],f[1]+n[1])&&Xa.pointOnLine2D(f[0],f[1],k[0],k[1],k[0]+h[0],k[1]+h[1])||3===f.length&&(f[0]!==k[0]||f[1]!==k[1]||f[2]!==k[2])&&Xa.pointOnLine3D(f[0],f[1],f[2],k[0],k[1],k[2],f[0]+n[0],f[1]+n[1],f[2]+n[2])&&Xa.pointOnLine3D(f[0],
f[1],f[2],k[0],k[1],k[2],k[0]+h[0],k[1]+h[1],k[2]+h[2]))&&(a.k[e].to=null,a.k[e].ti=null),f[0]===k[0]&&f[1]===k[1]&&0===n[0]&&0===n[1]&&0===h[0]&&0===h[1]&&(2===f.length||f[2]===k[2]&&0===n[2]&&0===h[2])&&(a.k[e].to=null,a.k[e].ti=null));this.effectsSequence=[ad.bind(this)];this.data=a;this.keyframes=a.k;this.keyframesMetadata=[];this.offsetTime=c.data.st;this._isFirstFrame=this.kf=this.k=!0;this.mult=b||1;this.elem=c;this.container=d;this.comp=c.comp;this.getValue=uc;this.setVValue=tc;this.interpolateValue=
vd;this.frameId=-1;c=a.k[0].s.length;this.v=la("float32",c);this.pv=la("float32",c);for(e=0;e<c;e+=1)this.v[e]=Mb,this.pv[e]=Mb;this._caching={lastFrame:Mb,lastIndex:0,value:la("float32",c)};this.addEffect=Eb}
function Pa(){}
function lb(){this.c=!1;this._length=0;this._maxLength=8;this.v=ta(this._maxLength);this.o=ta(this._maxLength);this.i=ta(this._maxLength)}
function Ia(){this._length=0;this._maxLength=4;this.shapes=ta(this._maxLength)}
function fb(){Na.searchAnimations()}
function Ta(){}
function Za(){}
function vc(){}
function za(){}
function Ra(){}
function vb(c,a){return 1E5*Math.abs(c-a)<=Math.min(Math.abs(c),Math.abs(a))}
function Qa(c,a,b){return[c[0]*(1-b)+a[0]*b,c[1]*(1-b)+a[1]*b]}
function dc(c,a,b,d){return[3*a-c-3*b+d,3*c-6*a+3*b,-3*c+3*a,c]}
function wc(c){return new ma(c,c,c,c,!1)}
function ma(c,a,b,d,e){e&&mb(c,a)&&(a=Qa(c,d,1/3));e&&mb(b,d)&&(b=Qa(c,d,2/3));e=dc(c[0],a[0],b[0],d[0]);var f=dc(c[1],a[1],b[1],d[1]);this.a=[e[0],f[0]];this.b=[e[1],f[1]];this.c=[e[2],f[2]];this.d=[e[3],f[3]];this.points=[c,a,b,d]}
function dd(c,a){var b=c.points[0][a],d=c.points[c.points.length-1][a];if(b>d){var e=d;d=b;b=e}e=3*c.a[a];var f=2*c.b[a],k=c.c[a];0===e?e=[]:(k=f*f-4*e*k,k<0?e=[]:(f=-f/(2*e),0===k?e=[f]:(e=Math.sqrt(k)/(2*e),e=[f-e,f+e])));for(f=0;f<e.length;f+=1)e[f]>0&&e[f]<1&&(k=c.point(e[f])[a],k<b?b=k:k>d&&(d=k));return{min:b,max:d}}
function xc(c,a,b){var d=c.boundingBox();return{cx:d.cx,cy:d.cy,width:d.width,height:d.height,bez:c,t:(a+b)/2,t1:a,t2:b}}
function wa(c){var a=c.bez.split(.5);return[xc(a[0],c.t1,c.t),xc(a[1],c.t,c.t2)]}
function ec(c,a,b,d,e,f){2*Math.abs(c.cx-a.cx)<c.width+a.width&&2*Math.abs(c.cy-a.cy)<c.height+a.height&&(b>=f||c.width<=d&&c.height<=d&&a.width<=d&&a.height<=d?e.push([c.t,a.t]):(c=wa(c),a=wa(a),ec(c[0],a[0],b+1,d,e,f),ec(c[0],a[1],b+1,d,e,f),ec(c[1],a[0],b+1,d,e,f),ec(c[1],a[1],b+1,d,e,f)))}
function fc(c,a){return[c[1]*a[2]-c[2]*a[1],c[2]*a[0]-c[0]*a[2],c[0]*a[1]-c[1]*a[0]]}
function yc(c,a,b,d){b=[b[0],b[1],1];d=[d[0],d[1],1];c=fc(fc([c[0],c[1],1],[a[0],a[1],1]),fc(b,d));return Math.abs(c[2])<=1E-5?null:[c[0]/c[2],c[1]/c[2]]}
function gb(c,a,b){return[c[0]+Math.cos(a)*b,c[1]-Math.sin(a)*b]}
function zc(c,a){return Math.hypot(c[0]-a[0],c[1]-a[1])}
function mb(c,a){return vb(c[0],a[0])&&vb(c[1],a[1])}
function hb(){}
function Mc(c,a,b,d,e,f,k){var n=b-Math.PI/2,h=b+Math.PI/2,g=a[0]+Math.cos(b)*d*e;a=a[1]-Math.sin(b)*d*e;c.setTripleAt(g,a,g+Math.cos(n)*f,a-Math.sin(n)*f,g+Math.cos(h)*k,a-Math.sin(h)*k,c.length())}
function Fb(c,a,b,d,e,f,k){var n,h,g=0===b?a.length()-1:b-1,q=(b+1)%a.length();g=a.v[g];q=a.v[q];q=(n=[q[0]-g[0],q[1]-g[1]],h=.5*-Math.PI,[Math.cos(h)*n[0]-Math.sin(h)*n[1],Math.sin(h)*n[0]+Math.cos(h)*n[1]]);n=Math.atan2(0,1)-Math.atan2(q[1],q[0]);h=a.v[b%a._length];g=a.v[0===b?a._length-1:b-1];q=a.v[(b+1)%a._length];g=2===f?Math.sqrt(Math.pow(h[0]-g[0],2)+Math.pow(h[1]-g[1],2)):0;f=2===f?Math.sqrt(Math.pow(h[0]-q[0],2)+Math.pow(h[1]-q[1],2)):0;Mc(c,a.v[b%a._length],n,k,d,f/(2*(e+1)),g/(2*(e+1)))}
function Gb(c,a,b){var d=Math.atan2(a[0]-c[0],a[1]-c[1]);return[gb(c,d,b),gb(a,d,b)]}
function Hb(c,a){var b;var d=(b=Gb(c.points[0],c.points[1],a))[0];var e=b[1];var f=(b=Gb(c.points[1],c.points[2],a))[0];var k=b[1];c=(b=Gb(c.points[2],c.points[3],a))[0];b=b[1];a=yc(d,e,f,k);null===a&&(a=e);e=yc(c,b,f,k);return null===e&&(e=c),new ma(d,a,e,b)}
function ed(c,a,b,d,e){var f=a.points[3],k=b.points[0];return 3===d||mb(f,k)?f:2===d?(e=-a.tangentAngle(1),b=-b.tangentAngle(0)+Math.PI,a=(a=yc(f,gb(f,e+Math.PI/2,100),k,gb(k,e+Math.PI/2,100)))?zc(a,f):zc(f,k)/2,f=gb(f,e,2*a*Bb),c.setXYAt(f[0],f[1],"o",c.length()-1),f=gb(k,b,2*a*Bb),c.setTripleAt(k[0],k[1],k[0],k[1],f[0],f[1],c.length()),k):(k=yc(mb(f,a.points[2])?a.points[0]:a.points[2],f,k,mb(k,b.points[1])?b.points[3]:b.points[1]))&&zc(k,f)<e?(c.setTripleAt(k[0],k[1],k[0],k[1],k[0],k[1],c.length()),
k):f}
function Nc(c,a){c=c.intersections(a);return c.length&&vb(c[0][0],1)&&c.shift(),c.length?c[0]:null}
function Ib(c,a){var b=c.slice(),d=a.slice(),e=Nc(c[c.length-1],a[0]);return e&&(b[c.length-1]=c[c.length-1].split(e[0])[0],d[0]=a[0].split(e[1])[1]),c.length>1&&a.length>1&&(e=Nc(c[0],a[a.length-1]))?[[c[0].split(e[0])[0]],[a[a.length-1].split(e[1])[1]]]:[b,d]}
function fd(c,a){var b,d,e,f,k=c.inflectionPoints();if(0===k.length)return[Hb(c,a)];if(1===k.length||vb(k[1],1))return b=(e=c.split(k[0]))[0],d=e[1],[Hb(b,a),Hb(d,a)];b=(e=c.split(k[0]))[0];c=(k[1]-k[0])/(1-k[0]);return f=(e=e[1].split(c))[0],d=e[1],[Hb(b,a),Hb(f,a),Hb(d,a)]}
function hc(){}
function gd(c){for(var a=c.fStyle?c.fStyle.split(" "):[],b="normal",d="normal",e=a.length,f=0;f<e;f+=1)switch(a[f].toLowerCase()){case "italic":d="italic";break;case "bold":b="700";break;case "black":b="900";break;case "medium":b="500";break;case "regular":case "normal":b="400";break;case "light":case "thin":b="200"}return{style:d,weight:c.fWeight||b}}
function hd(c){this.animationData=c}
function xb(){}
function wd(c,a,b){this.p=Q.getProp(a,c.v,0,0,b)}
function xd(c,a,b){this.p=Q.getProp(a,c.v,0,0,b)}
function Oc(c,a,b){this.p=Q.getProp(a,c.v,1,0,b)}
function Hd(c,a,b){this.p=Q.getProp(a,c.v,1,0,b)}
function Id(c,a,b){this.p=Q.getProp(a,c.v,0,0,b)}
function Jd(c,a,b){this.p=Q.getProp(a,c.v,0,0,b)}
function Kd(c,a,b){this.p=Q.getProp(a,c.v,0,0,b)}
function Ld(){this.p={}}
function yd(c,a){var b=c.ef||[];this.effectElements=[];var d=b.length;for(c=0;c<d;c+=1){var e=new Ac(b[c],a);this.effectElements.push(e)}}
function Ac(c,a){this.init(c,a)}
function yb(){}
function nb(){}
function $a(c,a,b){this.initFrame();this.initRenderable();this.assetData=a.getAssetData(c.refId);this.footageData=a.imageLoader.getAsset(this.assetData);this.initBaseData(c,a,b)}
function Aa(c,a,b){this.initFrame();this.initRenderable();this.assetData=a.getAssetData(c.refId);this.initBaseData(c,a,b);this._canPlay=this._isPlaying=!1;b=this.globalData.getAssetsPath(this.assetData);this.audio=this.globalData.audioController.createAudio(b);this._currentTime=0;this.globalData.audioController.addAudio(this);this._volume=this._volumeMultiplier=1;this._previousVolume=null;this.tm=c.tm?Q.getProp(this,c.tm,0,a.frameRate,this):{_placeholder:!0};this.lv=Q.getProp(this,c.au&&c.au.lv?c.au.lv:
{k:[100]},1,.01,this)}
function ua(){}
function Wa(){}
function Fa(c,a,b){this.data=c;this.element=a;this.globalData=b;this.storedData=[];this.masksProperties=this.data.masksProperties||[];this.maskElement=null;b=this.globalData.defs;var d=this.masksProperties?this.masksProperties.length:0;this.viewData=ta(d);this.solidPath="";var e,f,k,n,h,g=this.masksProperties,q=0,r=[],v=Ca(),p="clipPath",l="clip-path";for(c=0;c<d;c+=1)if(("a"!==g[c].mode&&"n"!==g[c].mode||g[c].inv||100!==g[c].o.k||g[c].o.x)&&(p="mask",l="mask"),"s"!==g[c].mode&&"i"!==g[c].mode||0!==
q?f=null:((f=X("rect")).setAttribute("fill","#ffffff"),f.setAttribute("width",this.element.comp.data.w||0),f.setAttribute("height",this.element.comp.data.h||0),r.push(f)),a=X("path"),"n"===g[c].mode)this.viewData[c]={op:Q.getProp(this.element,g[c].o,0,.01,this.element),prop:ja.getShapeProp(this.element,g[c],3),elem:a,lastPath:""},b.appendChild(a);else{var m;if(q+=1,a.setAttribute("fill","s"===g[c].mode?"#000000":"#ffffff"),a.setAttribute("clip-rule","nonzero"),0!==g[c].x.k?(p="mask",l="mask",h=Q.getProp(this.element,
g[c].x,0,null,this.element),m=Ca(),(k=X("filter")).setAttribute("id",m),(n=X("feMorphology")).setAttribute("operator","erode"),n.setAttribute("in","SourceGraphic"),n.setAttribute("radius","0"),k.appendChild(n),b.appendChild(k),a.setAttribute("stroke","s"===g[c].mode?"#000000":"#ffffff")):(n=null,h=null),this.storedData[c]={elem:a,x:h,expan:n,lastPath:"",lastOperator:"",filterId:m,lastRadius:0},"i"===g[c].mode){var t=r.length;var u=X("g");for(e=0;e<t;e+=1)u.appendChild(r[e]);e=X("mask");e.setAttribute("mask-type",
"alpha");e.setAttribute("id",v+"_"+q);e.appendChild(a);b.appendChild(e);u.setAttribute("mask","url("+Ma+"#"+v+"_"+q+")");r.length=0;r.push(u)}else r.push(a);g[c].inv&&!this.solidPath&&(this.solidPath=this.createLayerSolidPath());this.viewData[c]={elem:a,lastPath:"",op:Q.getProp(this.element,g[c].o,0,.01,this.element),prop:ja.getShapeProp(this.element,g[c],3),invRect:f};this.viewData[c].prop.k||this.drawPath(g[c],this.viewData[c].prop.v,this.viewData[c])}this.maskElement=X(p);d=r.length;for(c=0;c<
d;c+=1)this.maskElement.appendChild(r[c]);q>0&&(this.maskElement.setAttribute("id",v),this.element.maskedElement.setAttribute(l,"url("+Ma+"#"+v+")"),b.appendChild(this.maskElement));this.viewData.length&&this.element.addRenderableComponent(this)}
function La(c){var a,b="SourceGraphic",d=c.data.ef?c.data.ef.length:0,e=Ca(),f=bc.createFilter(e,!0),k=0;this.filters=[];for(a=0;a<d;a+=1){var n=null;var h=c.data.ef[a].ty;Uc[h]&&(n=new Uc[h].effect(f,c.effectsManager.effectElements[a],c,Pc+k,b),b=Pc+k,Uc[h].countsAsEffect&&(k+=1));n&&this.filters.push(n)}k&&(c.globalData.defs.appendChild(f),c.layerElement.setAttribute("filter","url("+Ma+"#"+e+")"));this.filters.length&&c.addRenderableComponent(this)}
function ib(){}
function ab(){}
function Jb(){}
function ob(c,a,b){(this.assetData=a.getAssetData(c.refId))&&this.assetData.sid&&(this.assetData=a.slotManager.getProp(this.assetData));this.initElement(c,a,b);this.sourceRect={top:0,left:0,width:this.assetData.w,height:this.assetData.h}}
function jc(c,a){this.elem=c;this.pos=a}
function kc(){}
function lc(c,a,b){this.caches=[];this.styles=[];this.transformers=c;this.lStr="";this.sh=b;this.lvl=a;this._isAnimated=!!b.k;a=0;for(b=c.length;a<b;){if(c[a].mProps.dynamicProperties.length){this._isAnimated=!0;break}a+=1}}
function zd(c,a){this.data=c;this.type=c.ty;this.d="";this.lvl=a;this._mdf=!1;this.closed=!0===c.hd;this.pElem=X("path");this.msElem=null}
function Bc(c,a,b,d){this.elem=c;this.frameId=-1;this.dataProps=ta(a.length);this.renderer=b;this.k=!1;this.dashStr="";this.dashArray=la("float32",a.length?a.length-1:0);this.dashoffset=la("float32",1);this.initDynamicPropertyContainer(d);var e=a.length||0;for(b=0;b<e;b+=1)d=Q.getProp(c,a[b].v,0,0,this),this.k=d.k||this.k,this.dataProps[b]={n:a[b].n,p:d};this.k||this.getValue(!0);this._isAnimated=this.k}
function jd(c,a,b){this.initDynamicPropertyContainer(c);this.getValue=this.iterateDynamicProperties;this.o=Q.getProp(c,a.o,0,.01,this);this.w=Q.getProp(c,a.w,0,null,this);this.d=new Bc(c,a.d||{},"svg",this);this.c=Q.getProp(c,a.c,1,255,this);this.style=b;this._isAnimated=!!this._isAnimated}
function kd(c,a,b){this.initDynamicPropertyContainer(c);this.getValue=this.iterateDynamicProperties;this.o=Q.getProp(c,a.o,0,.01,this);this.c=Q.getProp(c,a.c,1,255,this);this.style=b}
function Cc(c,a,b){this.initDynamicPropertyContainer(c);this.getValue=this.iterateDynamicProperties;this.style=b}
function mc(c,a,b){this.data=a;this.c=la("uint8c",4*a.p);var d=a.k.k[0].s?a.k.k[0].s.length-4*a.p:a.k.k.length-4*a.p;this.o=la("float32",d);this._omdf=this._cmdf=!1;this._collapsable=this.checkCollapsable();this._hasOpacity=d;this.initDynamicPropertyContainer(b);this.prop=Q.getProp(c,a.k,1,null,this);this.k=this.prop.k;this.getValue(!0)}
function Kb(c,a,b){this.initDynamicPropertyContainer(c);this.getValue=this.iterateDynamicProperties;this.initGradientData(c,a,b)}
function ld(c,a,b){this.initDynamicPropertyContainer(c);this.getValue=this.iterateDynamicProperties;this.w=Q.getProp(c,a.w,0,null,this);this.d=new Bc(c,a.d||{},"svg",this);this.initGradientData(c,a,b);this._isAnimated=!!this._isAnimated}
function Dc(){this.it=[];this.prevViewData=[];this.gr=X("g")}
function nc(c,a,b){this.transform={mProps:c,op:a,container:b};this.elements=[];this._isAnimated=this.transform.mProps.dynamicProperties.length||this.transform.op.effectsSequence.length}
function Ba(c,a,b){this.shapes=[];this.shapesData=c.shapes;this.stylesList=[];this.shapeModifiers=[];this.itemsData=[];this.processedElements=[];this.animatedContents=[];this.initElement(c,a,b);this.prevViewData=[]}
function md(c,a,b,d,e,f){this.o=c;this.sw=a;this.sc=b;this.fc=d;this.m=e;this.p=f;this._mdf={o:!0,sw:!!a,sc:!!b,fc:!!d,m:!0,p:!0}}
function Sa(c,a){this._frameId=Rc;this.v=this.pv="";this.kf=!1;this._isFirstFrame=!0;this._mdf=!1;a.d&&a.d.sid&&(a.d=c.globalData.slotManager.getProp(a.d));this.data=a;this.elem=c;this.comp=this.elem.comp;this.keysIndex=0;this.canResize=!1;this.minimumFontSize=1;this.effectsSequence=[];this.currentData={ascent:0,boxWidth:this.defaultBoxWidth,f:"",fStyle:"",fWeight:"",fc:"",j:"",justifyOffset:"",l:[],lh:0,lineWidths:[],ls:"",of:"",s:"",sc:"",sw:0,t:0,tr:0,sz:0,ps:null,fillColorAnim:!1,strokeColorAnim:!1,
strokeWidthAnim:!1,yOffset:0,finalSize:0,finalText:[],finalLineHeight:0,__complete:!1};this.copyData(this.currentData,this.data.d.k[0].s);this.searchProperty()||this.completeTextData(this.currentData)}
function Ga(c,a,b){var d={propType:!1},e=Q.getProp,f=a.a;this.a={r:f.r?e(c,f.r,0,qa,b):d,rx:f.rx?e(c,f.rx,0,qa,b):d,ry:f.ry?e(c,f.ry,0,qa,b):d,sk:f.sk?e(c,f.sk,0,qa,b):d,sa:f.sa?e(c,f.sa,0,qa,b):d,s:f.s?e(c,f.s,1,.01,b):d,a:f.a?e(c,f.a,1,0,b):d,o:f.o?e(c,f.o,0,.01,b):d,p:f.p?e(c,f.p,1,0,b):d,sw:f.sw?e(c,f.sw,0,0,b):d,sc:f.sc?e(c,f.sc,1,0,b):d,fc:f.fc?e(c,f.fc,1,0,b):d,fh:f.fh?e(c,f.fh,0,0,b):d,fs:f.fs?e(c,f.fs,0,.01,b):d,fb:f.fb?e(c,f.fb,0,.01,b):d,t:f.t?e(c,f.t,0,0,b):d};this.s=Pd.getTextSelectorProp(c,
a.s,b);this.s.t=a.s.t}
function pb(c,a,b){this._isFirstFrame=!0;this._hasMaskedPath=!1;this._frameId=-1;this._textData=c;this._renderType=a;this._elem=b;this._animatorsData=ta(this._textData.a.length);this._pathData={};this._moreOptions={alignment:{}};this.renderedLetters=[];this.lettersChangedFlag=!1;this.initDynamicPropertyContainer(b)}
function oa(){}
function qb(c,a,b){this.textSpans=[];this.renderType="svg";this.initElement(c,a,b)}
function rb(c,a,b){this.initElement(c,a,b)}
function Ka(c,a,b){this.initFrame();this.initBaseData(c,a,b);this.initFrame();this.initTransform(c,a,b);this.initHierarchy()}
function pa(){}
function db(){}
function bb(c,a,b){this.layers=c.layers;this.supports3d=!0;this.completeLayers=!1;this.pendingElements=[];this.elements=this.layers?ta(this.layers.length):[];this.initElement(c,a,b);this.tm=c.tm?Q.getProp(this,c.tm,0,a.frameRate,this):{_placeholder:!0}}
function Ha(c,a){this.animationItem=c;this.layers=null;this.renderedFrame=-1;this.svgElement=X("svg");c="";if(a&&a.title){var b=X("title"),d=Ca();b.setAttribute("id",d);b.textContent=a.title;this.svgElement.appendChild(b);c+=d}a&&a.description&&(b=X("desc"),d=Ca(),b.setAttribute("id",d),b.textContent=a.description,this.svgElement.appendChild(b),c+=" "+d);c&&this.svgElement.setAttribute("aria-labelledby",c);c=X("defs");this.svgElement.appendChild(c);b=X("g");this.svgElement.appendChild(b);this.layerElement=
b;this.renderConfig={preserveAspectRatio:a&&a.preserveAspectRatio||"xMidYMid meet",imagePreserveAspectRatio:a&&a.imagePreserveAspectRatio||"xMidYMid slice",contentVisibility:a&&a.contentVisibility||"visible",progressiveLoad:a&&a.progressiveLoad||!1,hideOnTransparent:!(a&&!1===a.hideOnTransparent),viewBoxOnly:a&&a.viewBoxOnly||!1,viewBoxSize:a&&a.viewBoxSize||!1,className:a&&a.className||"",id:a&&a.id||"",focusable:a&&a.focusable,filterSize:{width:a&&a.filterSize&&a.filterSize.width||"100%",height:a&&
a.filterSize&&a.filterSize.height||"100%",x:a&&a.filterSize&&a.filterSize.x||"0%",y:a&&a.filterSize&&a.filterSize.y||"0%"},width:a&&a.width,height:a&&a.height,runExpressions:!a||void 0===a.runExpressions||a.runExpressions};this.globalData={_mdf:!1,frameNum:-1,defs:c,renderConfig:this.renderConfig};this.elements=[];this.pendingElements=[];this.destroyed=!1;this.rendererType="svg"}
var jb=function(){var c=globalThis.safevalues_raw;c||console.error("Could not load raw safevalues");return c}(),Ma="",Qc=!1,Rc=-999999,Ed=function(){function c(a){this.audios=[];
this.audioFactory=a;this._volume=1;this._isMuted=!1}
return c.prototype={addAudio:function(a){this.audios.push(a)},
pause:function(){var a,b=this.audios.length;for(a=0;a<b;a+=1)this.audios[a].pause()},
resume:function(){var a,b=this.audios.length;for(a=0;a<b;a+=1)this.audios[a].resume()},
setRate:function(a){var b,d=this.audios.length;for(b=0;b<d;b+=1)this.audios[b].setRate(a)},
createAudio:function(a){return this.audioFactory?this.audioFactory(a):window.Howl?new window.Howl({src:[a]}):{isPlaying:!1,play:function(){this.isPlaying=!0},
seek:function(){this.isPlaying=!1},
playing:function(){},
rate:function(){},
setVolume:function(){}}},
setAudioFactory:function(a){this.audioFactory=a},
setVolume:function(a){this._volume=a;this._updateVolume()},
mute:function(){this._isMuted=!0;this._updateVolume()},
unmute:function(){this._isMuted=!1;this._updateVolume()},
getVolume:function(){return this._volume},
_updateVolume:function(){var a,b=this.audios.length;for(a=0;a<b;a+=1)this.audios[a].volume(this._volume*(this._isMuted?0:1))}},function(){return new c}}(),la=function(){function c(a,b){var d,e=[];
switch(a){case "int16":case "uint8c":a=1;break;default:a=1.1}for(d=0;d<b;d+=1)e.push(a);return e}
return"function"==typeof Uint8ClampedArray&&"function"==typeof Float32Array?function(a,b){return"float32"===a?new Float32Array(b):"int16"===a?new Int16Array(b):"uint8c"===a?new Uint8ClampedArray(b):c(a,b)}:c}(),nd=!0,Lb=null,Ad="",Oa=/^((?!chrome|android).)*safari/i.test(navigator.userAgent),eb=Math.pow,oc=Math.sqrt,Ab=Math.floor,Nd=(Math.max,Math.min),cb={};
(function(){var c,a="abs acos acosh asin asinh atan atanh atan2 ceil cbrt expm1 clz32 cos cosh exp floor fround hypot imul log log1p log2 log10 max min pow random round sign sin sinh sqrt tan tanh trunc E LN10 LN2 LOG10E LOG2E PI SQRT1_2 SQRT2".split(" "),b=a.length;for(c=0;c<b;c+=1)cb[a[c]]=Math[a[c]]})();
cb.random=Math.random;cb.abs=function(c){if("object"===ya(c)&&c.length){var a,b=ta(c.length),d=c.length;for(a=0;a<d;a+=1)b[a]=Math.abs(c[a]);return b}return Math.abs(c)};
var sb=150,qa=Math.PI/180,Bb=.5519,Sc,Ca=(Sc=0,function(){return Ad+"__lottie_element_"+(Sc+=1)});
(function(){var c;for(c=0;c<256;c+=1){var a=c.toString(16);a.length}})();
var ra=function(){function c(g){return window.Worker&&window.Blob&&Qc?(g=new Blob(["var _workerSelf = self; self.onmessage = ",g.toString()],{type:"text/javascript"}),g=jb.trustedResourceUrl(g),jb.dom.createWorker(g)):(d=g,n)}
function a(){e||(e=c(function(g){if(h.dataManager||(h.dataManager=function(){function r(F,G){var B,z,y,C,N=F.length;for(z=0;z<N;z+=1)if("ks"in(B=F[z])&&!B.completed){if(B.completed=!0,B.hasMask){var P=B.masksProperties;var ea=P.length;for(y=0;y<ea;y+=1)if(P[y].pt.k.i)l(P[y].pt.k);else{var ia=P[y].pt.k.length;for(C=0;C<ia;C+=1)P[y].pt.k[C].s&&l(P[y].pt.k[C].s[0]),P[y].pt.k[C].e&&l(P[y].pt.k[C].e[0])}}0===B.ty?(B.layers=v(B.refId,G),r(B.layers,G)):4===B.ty?p(B.shapes):5===B.ty&&0===B.t.a.length&&B.t.p}}
function v(F,G){a:{for(var B=0,z=G.length;B<z;){if(G[B].id===F){F=G[B];break a}B+=1}F=null}return F?F.layers.__used?JSON.parse(JSON.stringify(F.layers)):(F.layers.__used=!0,F.layers):null}
function p(F){var G,B;for(G=F.length-1;G>=0;--G)if("sh"===F[G].ty)if(F[G].ks.k.i)l(F[G].ks.k);else{var z=F[G].ks.k.length;for(B=0;B<z;B+=1)F[G].ks.k[B].s&&l(F[G].ks.k[B].s[0]),F[G].ks.k[B].e&&l(F[G].ks.k[B].e[0])}else"gr"===F[G].ty&&p(F[G].it)}
function l(F){var G,B=F.i.length;for(G=0;G<B;G+=1)F.i[G][0]+=F.v[G][0],F.i[G][1]+=F.v[G][1],F.o[G][0]+=F.v[G][0],F.o[G][1]+=F.v[G][1]}
function m(F,G){G=G?G.split("."):[100,100,100];return F[0]>G[0]||!(G[0]>F[0])&&(F[1]>G[1]||!(G[1]>F[1])&&(F[2]>G[2]||!(G[2]>F[2])&&null))}
var t,u=function(){function F(B){var z,y,C,N=B.length;for(z=0;z<N;z+=1)5===B[z].ty&&(C=void 0,C=(y=B[z]).t.d,y.t.d={k:[{s:C,t:0}]})}
var G=[4,4,14];return function(B){if(m(G,B.v)&&(F(B.layers),B.assets)){var z,y=B.assets.length;for(z=0;z<y;z+=1)B.assets[z].layers&&F(B.assets[z].layers)}}}(),w=(t=[4,
7,99],function(F){if(F.chars&&!m(t,F.v)){var G,B=F.chars.length;for(G=0;G<B;G+=1){var z=F.chars[G];z.data&&z.data.shapes&&(p(z.data.shapes),z.data.ip=0,z.data.op=99999,z.data.st=0,z.data.sr=1,z.data.ks={p:{k:[0,0],a:0},s:{k:[100,100],a:0},a:{k:[0,0],a:0},r:{k:0,a:0},o:{k:100,a:0}},F.chars[G].t||(z.data.shapes.push({ty:"no"}),z.data.shapes[0].it.push({p:{k:[0,0],a:0},s:{k:[100,100],a:0},a:{k:[0,0],a:0},r:{k:0,a:0},o:{k:100,a:0},sk:{k:0,a:0},sa:{k:0,a:0},ty:"tr"})))}}}),x=function(){function F(B){var z,
y,C=B.length;
for(z=0;z<C;z+=1)5===B[z].ty&&(y=void 0,"number"==typeof(y=B[z].t.p).a&&(y.a={a:0,k:y.a}),"number"==typeof y.p&&(y.p={a:0,k:y.p}),"number"==typeof y.r&&(y.r={a:0,k:y.r}))}
var G=[5,7,15];return function(B){if(m(G,B.v)&&(F(B.layers),B.assets)){var z,y=B.assets.length;for(z=0;z<y;z+=1)B.assets[z].layers&&F(B.assets[z].layers)}}}(),D=function(){function F(z){var y,C,N=z.length;
for(y=0;y<N;y+=1)if("gr"===z[y].ty)F(z[y].it);else if("fl"===z[y].ty||"st"===z[y].ty)if(z[y].c.k&&z[y].c.k[0].i){var P=z[y].c.k.length;for(C=0;C<P;C+=1)z[y].c.k[C].s&&(z[y].c.k[C].s[0]/=255,z[y].c.k[C].s[1]/=255,z[y].c.k[C].s[2]/=255,z[y].c.k[C].s[3]/=255),z[y].c.k[C].e&&(z[y].c.k[C].e[0]/=255,z[y].c.k[C].e[1]/=255,z[y].c.k[C].e[2]/=255,z[y].c.k[C].e[3]/=255)}else z[y].c.k[0]/=255,z[y].c.k[1]/=255,z[y].c.k[2]/=255,z[y].c.k[3]/=255}
function G(z){var y,C=z.length;for(y=0;y<C;y+=1)4===z[y].ty&&F(z[y].shapes)}
var B=[4,1,9];return function(z){if(m(B,z.v)&&(G(z.layers),z.assets)){var y,C=z.assets.length;for(y=0;y<C;y+=1)z.assets[y].layers&&G(z.assets[y].layers)}}}(),K=function(){function F(z){var y,C;
for(y=z.length-1;y>=0;--y)if("sh"===z[y].ty)if(z[y].ks.k.i)z[y].ks.k.c=z[y].closed;else{var N=z[y].ks.k.length;for(C=0;C<N;C+=1)z[y].ks.k[C].s&&(z[y].ks.k[C].s[0].c=z[y].closed),z[y].ks.k[C].e&&(z[y].ks.k[C].e[0].c=z[y].closed)}else"gr"===z[y].ty&&F(z[y].it)}
function G(z){var y,C,N,P,ea=z.length;for(C=0;C<ea;C+=1){if((y=z[C]).hasMask){var ia=y.masksProperties;var S=ia.length;for(N=0;N<S;N+=1)if(ia[N].pt.k.i)ia[N].pt.k.c=ia[N].cl;else{var H=ia[N].pt.k.length;for(P=0;P<H;P+=1)ia[N].pt.k[P].s&&(ia[N].pt.k[P].s[0].c=ia[N].cl),ia[N].pt.k[P].e&&(ia[N].pt.k[P].e[0].c=ia[N].cl)}}4===y.ty&&F(y.shapes)}}
var B=[4,4,18];return function(z){if(m(B,z.v)&&(G(z.layers),z.assets)){var y,C=z.assets.length;for(y=0;y<C;y+=1)z.assets[y].layers&&G(z.assets[y].layers)}}}(),J={completeData:function(F){if(!F.__complete){D(F);
u(F);w(F);x(F);K(F);r(F.layers,F.assets);var G=F.chars,B=F.assets;if(G){var z,y=G.length;for(z=0;z<y;z+=1)1===G[z].t&&(G[z].data.layers=v(G[z].data.refId,B),r(G[z].data.layers,B))}F.__complete=!0}}};
return J.checkColors=D,J.checkChars=w,J.checkPathProperties=x,J.checkShapes=K,J.completeLayers=r,J}()),h.assetLoader||(h.assetLoader=function(){function r(v){var p=v.getResponseHeader("content-type");
return p&&"json"===v.responseType&&-1!==p.indexOf("json")||v.response&&"object"===W(v.response)?v.response:v.response&&"string"==typeof v.response?JSON.parse(v.response):v.responseText?JSON.parse(v.responseText):null}
return{load:function(v,p,l,m){var t,u=new XMLHttpRequest;try{u.responseType="json"}catch(w){}u.onreadystatechange=function(){if(4===u.readyState)if(200===u.status)t=r(u),l(t);else try{t=r(u),l(t)}catch(w){m&&m(w)}};
try{u.open("GET",v,!0)}catch(w){u.open("GET",p+"/"+v,!0)}u.send()}}}()),"loadAnimation"===g.data.type)h.assetLoader.load(g.data.path,g.data.fullPath,function(r){h.dataManager.completeData(r);
h.postMessage({id:g.data.id,payload:r,status:"success"})},function(){h.postMessage({id:g.data.id,
status:"error"})});
else if("complete"===g.data.type){var q=g.data.animation;h.dataManager.completeData(q);h.postMessage({id:g.data.id,payload:q,status:"success"})}else"loadData"===g.data.type&&h.assetLoader.load(g.data.path,g.data.fullPath,function(r){h.postMessage({id:g.data.id,payload:r,status:"success"})},function(){h.postMessage({id:g.data.id,
status:"error"})})}),e.onmessage=function(g){g=g.data;
var q=g.id,r=k[q];k[q]=null;"success"===g.status?r.onComplete(g.payload):r.onError&&r.onError()})}
function b(g,q){var r="processId_"+(f+=1);return k[r]={onComplete:g,onError:q},r}
var d,e,f=1,k=[],n={onmessage:function(){},
postMessage:function(g){d({data:g})}},h={postMessage:function(g){n.onmessage({data:g})}};
return{loadAnimation:function(g,q,r){a();q=b(q,r);e.postMessage({type:"loadAnimation",path:g,fullPath:window.location.origin+window.location.pathname,id:q})},
loadData:function(g,q,r){a();q=b(q,r);e.postMessage({type:"loadData",path:g,fullPath:window.location.origin+window.location.pathname,id:q})},
completeAnimation:function(g,q,r){a();q=b(q,r);e.postMessage({type:"complete",animation:g,id:q})}}}(),wb=function(){function c(){this.loadedAssets+=1;
this.loadedAssets===this.totalImages&&this.loadedFootagesCount===this.totalFootages&&this.imagesLoadedCb&&this.imagesLoadedCb(null)}
function a(){this.loadedFootagesCount+=1;this.loadedAssets===this.totalImages&&this.loadedFootagesCount===this.totalFootages&&this.imagesLoadedCb&&this.imagesLoadedCb(null)}
function b(n,h,g){n.e?h=n.p:h?(n=n.p,-1!==n.indexOf("images/")&&(n=n.split("/")[1]),h+=n):(h=g+(n.u?n.u:""),h+=n.p);return h}
function d(n){var h=0,g=setInterval(function(){(n.getBBox().width||h>500)&&(this._imageLoaded(),clearInterval(g));h+=1}.bind(this),50)}
function e(n){var h={assetData:n};n=b(n,this.assetsPath,this.path);return ra.loadData(n,function(g){h.img=g;this._footageLoaded()}.bind(this),function(){h.img={};
this._footageLoaded()}.bind(this)),h}
function f(){this._imageLoaded=c.bind(this);this._footageLoaded=a.bind(this);this.testImageLoaded=d.bind(this);this.createFootageData=e.bind(this);this.path=this.assetsPath="";this.loadedFootagesCount=this.loadedAssets=this.totalFootages=this.totalImages=0;this.imagesLoadedCb=null;this.images=[]}
var k=function(){var n=document.createElement("canvas");n.width=1;n.height=1;var h=n.getContext("2d");return h.fillStyle="rgba(0,0,0,0)",h.fillRect(0,0,1,1),n}();
return f.prototype={loadAssets:function(n,h){this.imagesLoadedCb=h;var g=n.length;for(h=0;h<g;h+=1)n[h].layers||(n[h].t&&"seq"!==n[h].t?3===n[h].t&&(this.totalFootages+=1,this.images.push(this.createFootageData(n[h]))):(this.totalImages+=1,this.images.push(this._createImageData(n[h]))))},
setAssetsPath:function(n){this.assetsPath=n||""},
setPath:function(n){this.path=n||""},
loadedImages:function(){return this.totalImages===this.loadedAssets},
loadedFootages:function(){return this.totalFootages===this.loadedFootagesCount},
destroy:function(){this.imagesLoadedCb=null;this.images.length=0},
getAsset:function(n){for(var h=0,g=this.images.length;h<g;){if(this.images[h].assetData===n)return this.images[h].img;h+=1}return null},
createImgData:function(n){var h=b(n,this.assetsPath,this.path),g=document.createElement("img");g.crossOrigin="anonymous";g.addEventListener("load",this._imageLoaded,!1);g.addEventListener("error",function(){q.img=k;this._imageLoaded()}.bind(this),!1);
g.src=h;var q={img:g,assetData:n};return q},
createImageData:function(n){var h=b(n,this.assetsPath,this.path),g=X("image");Oa?this.testImageLoaded(g):g.addEventListener("load",this._imageLoaded,!1);g.addEventListener("error",function(){q.img=k;this._imageLoaded()}.bind(this),!1);
g.setAttributeNS("http://www.w3.org/1999/xlink","href",h);this._elementHelper.append?this._elementHelper.append(g):this._elementHelper.appendChild(g);var q={img:g,assetData:n};return q},
imageLoaded:c,footageLoaded:a,setCacheType:function(n,h){"svg"===n?(this._elementHelper=h,this._createImageData=this.createImageData.bind(this)):this._createImageData=this.createImgData.bind(this)}},f}();
Ic.prototype={triggerEvent:function(c,a){if(this._cbs[c]){c=this._cbs[c];for(var b=0;b<c.length;b+=1)c[b](a)}},
addEventListener:function(c,a){return this._cbs[c]||(this._cbs[c]=[]),this._cbs[c].push(a),function(){this.removeEventListener(c,a)}.bind(this)},
removeEventListener:function(c,a){if(a){if(this._cbs[c]){for(var b=0,d=this._cbs[c].length;b<d;)this._cbs[c][b]===a&&(this._cbs[c].splice(b,1),--b,--d),b+=1;this._cbs[c].length||(this._cbs[c]=null)}}else this._cbs[c]=null}};
var Ua=function(){return function(c){for(var a=[],b=0;b<c.length;b+=1){var d=c[b];d={time:d.tm,duration:d.dr};try{d.payload=JSON.parse(c[b].cm)}catch(r){try{for(var e=d,f,k=void 0,n=c[b].cm.split("\r\n"),h={},g=0,q=0;q<n.length;q+=1)2===(k=n[q].split(":")).length&&(h[k[0]]=k[1].trim(),g+=1);if(0===g)throw Error();f=h;e.payload=f}catch(v){d.payload={name:c[b].cm}}}a.push(d)}return a}}(),Ec=function(){function c(a){this.compositions.push(a)}
return function(){function a(b){for(var d=0,e=this.compositions.length;d<e;){if(this.compositions[d].data&&this.compositions[d].data.nm===b)return this.compositions[d].prepareFrame&&this.compositions[d].data.xt&&this.compositions[d].prepareFrame(this.currentFrame),this.compositions[d].compInterface;d+=1}return null}
return a.compositions=[],a.currentFrame=0,a.registerComposition=c,a}}(),Fc={},U=function(){this._cbs=[];
this.path=this.name="";this.isLoaded=!1;this.frameMult=this.frameRate=this.totalFrames=this.firstFrame=this.currentRawFrame=this.currentFrame=0;this.playDirection=this.playSpeed=1;this.playCount=0;this.animationData={};this.assets=[];this.isPaused=!0;this.autoplay=!1;this.loop=!0;this.renderer=null;this.animationID=Ca();this.assetsPath="";this.segmentPos=this.timeCompleted=0;this.isSubframeEnabled=nd;this.segments=[];this._idle=!0;this._completedLoop=!1;this.projectInterface=Ec();this.imagePreloader=
new wb;this.audioController=Ed();this.markers=[];this.configAnimation=this.configAnimation.bind(this);this.onSetupError=this.onSetupError.bind(this);this.onSegmentComplete=this.onSegmentComplete.bind(this);this.drawnFrameEvent=new pc("drawnFrame",0,0,0);this.expressionsPlugin=Lb};
R([Ic],U);U.prototype.setParams=function(c){(c.wrapper||c.container)&&(this.wrapper=c.wrapper||c.container);var a="svg";c.animType?a=c.animType:c.renderer&&(a=c.renderer);var b=Fc[a];this.renderer=new b(this,c.rendererSettings);this.imagePreloader.setCacheType(a,this.renderer.globalData.defs);this.renderer.setProjectInterface(this.projectInterface);this.animType=a;""===c.loop||null===c.loop||void 0===c.loop||!0===c.loop?this.loop=!0:!1===c.loop?this.loop=!1:this.loop=parseInt(c.loop,10);this.autoplay=
!("autoplay"in c)||c.autoplay;this.name=c.name?c.name:"";this.autoloadSegments=!Object.prototype.hasOwnProperty.call(c,"autoloadSegments")||c.autoloadSegments;this.assetsPath=c.assetsPath;this.initialSegment=c.initialSegment;c.audioFactory&&this.audioController.setAudioFactory(c.audioFactory);c.animationData?this.setupAnimation(c.animationData):c.path&&(-1!==c.path.lastIndexOf("\\")?this.path=c.path.substr(0,c.path.lastIndexOf("\\")+1):this.path=c.path.substr(0,c.path.lastIndexOf("/")+1),this.fileName=
c.path.substr(c.path.lastIndexOf("/")+1),this.fileName=this.fileName.substr(0,this.fileName.lastIndexOf(".json")),ra.loadAnimation(c.path,this.configAnimation,this.onSetupError))};
U.prototype.onSetupError=function(){this.trigger("data_failed")};
U.prototype.setupAnimation=function(c){ra.completeAnimation(c,this.configAnimation)};
U.prototype.setData=function(c,a){a&&"object"!==rc(a)&&(a=JSON.parse(a));a={wrapper:c,animationData:a};c=c.attributes;a.path=c.getNamedItem("data-animation-path")?c.getNamedItem("data-animation-path").value:c.getNamedItem("data-bm-path")?c.getNamedItem("data-bm-path").value:c.getNamedItem("bm-path")?c.getNamedItem("bm-path").value:"";a.animType=c.getNamedItem("data-anim-type")?c.getNamedItem("data-anim-type").value:c.getNamedItem("data-bm-type")?c.getNamedItem("data-bm-type").value:c.getNamedItem("bm-type")?
c.getNamedItem("bm-type").value:c.getNamedItem("data-bm-renderer")?c.getNamedItem("data-bm-renderer").value:c.getNamedItem("bm-renderer")?c.getNamedItem("bm-renderer").value:function(){if(Fc.canvas)return"canvas";for(var d in Fc)if(Fc[d])return d;return""}()||"canvas";
var b=c.getNamedItem("data-anim-loop")?c.getNamedItem("data-anim-loop").value:c.getNamedItem("data-bm-loop")?c.getNamedItem("data-bm-loop").value:c.getNamedItem("bm-loop")?c.getNamedItem("bm-loop").value:"";"false"===b?a.loop=!1:"true"===b?a.loop=!0:""!==b&&(a.loop=parseInt(b,10));b=c.getNamedItem("data-anim-autoplay")?c.getNamedItem("data-anim-autoplay").value:c.getNamedItem("data-bm-autoplay")?c.getNamedItem("data-bm-autoplay").value:!c.getNamedItem("bm-autoplay")||c.getNamedItem("bm-autoplay").value;
a.autoplay="false"!==b;a.name=c.getNamedItem("data-name")?c.getNamedItem("data-name").value:c.getNamedItem("data-bm-name")?c.getNamedItem("data-bm-name").value:c.getNamedItem("bm-name")?c.getNamedItem("bm-name").value:"";"false"===(c.getNamedItem("data-anim-prerender")?c.getNamedItem("data-anim-prerender").value:c.getNamedItem("data-bm-prerender")?c.getNamedItem("data-bm-prerender").value:c.getNamedItem("bm-prerender")?c.getNamedItem("bm-prerender").value:"")&&(a.prerender=!1);a.path?this.setParams(a):
this.trigger("destroy")};
U.prototype.includeLayers=function(c){c.op>this.animationData.op&&(this.animationData.op=c.op,this.totalFrames=Math.floor(c.op-this.animationData.ip));var a,b,d=this.animationData.layers,e=d.length,f=c.layers,k=f.length;for(b=0;b<k;b+=1)for(a=0;a<e;){if(d[a].id===f[b].id){d[a]=f[b];break}a+=1}if((c.chars||c.fonts)&&(this.renderer.globalData.fontManager.addChars(c.chars),this.renderer.globalData.fontManager.addFonts(c.fonts,this.renderer.globalData.defs)),c.assets)for(e=c.assets.length,a=0;a<e;a+=
1)this.animationData.assets.push(c.assets[a]);this.animationData.__complete=!1;ra.completeAnimation(this.animationData,this.onSegmentComplete)};
U.prototype.onSegmentComplete=function(c){this.animationData=c;(c=Lb)&&c.initExpressions(this);this.loadNextSegment()};
U.prototype.loadNextSegment=function(){var c=this.animationData.segments;if(!c||0===c.length||!this.autoloadSegments)return this.trigger("data_ready"),void(this.timeCompleted=this.totalFrames);c=c.shift();this.timeCompleted=c.time*this.frameRate;c=this.path+this.fileName+"_"+this.segmentPos+".json";this.segmentPos+=1;ra.loadData(c,this.includeLayers.bind(this),function(){this.trigger("data_failed")}.bind(this))};
U.prototype.loadSegments=function(){this.animationData.segments||(this.timeCompleted=this.totalFrames);this.loadNextSegment()};
U.prototype.imagesLoaded=function(){this.trigger("loaded_images");this.checkLoaded()};
U.prototype.preloadImages=function(){this.imagePreloader.setAssetsPath(this.assetsPath);this.imagePreloader.setPath(this.path);this.imagePreloader.loadAssets(this.animationData.assets,this.imagesLoaded.bind(this))};
U.prototype.configAnimation=function(c){if(this.renderer)try{this.animationData=c,this.initialSegment?(this.totalFrames=Math.floor(this.initialSegment[1]-this.initialSegment[0]),this.firstFrame=Math.round(this.initialSegment[0])):(this.totalFrames=Math.floor(this.animationData.op-this.animationData.ip),this.firstFrame=Math.round(this.animationData.ip)),this.renderer.configAnimation(c),c.assets||(c.assets=[]),this.assets=this.animationData.assets,this.frameRate=this.animationData.fr,this.frameMult=
this.animationData.fr/1E3,this.renderer.searchExtraCompositions(c.assets),this.markers=Ua(c.markers||[]),this.trigger("config_ready"),this.preloadImages(),this.loadSegments(),this.updaFrameModifier(),this.waitForFontsLoaded(),this.isPaused&&this.audioController.pause()}catch(a){this.triggerConfigError(a)}};
U.prototype.waitForFontsLoaded=function(){this.renderer&&(this.renderer.globalData.fontManager.isLoaded?this.checkLoaded():setTimeout(this.waitForFontsLoaded.bind(this),20))};
U.prototype.checkLoaded=function(){if(!this.isLoaded&&this.renderer.globalData.fontManager.isLoaded&&(this.imagePreloader.loadedImages()||"canvas"!==this.renderer.rendererType)&&this.imagePreloader.loadedFootages()){this.isLoaded=!0;var c=Lb;c&&c.initExpressions(this);this.renderer.initItems();setTimeout(function(){this.trigger("DOMLoaded")}.bind(this),0);
this.gotoFrame();this.autoplay&&this.play()}};
U.prototype.resize=function(c,a){this.renderer.updateContainerSize("number"==typeof c?c:void 0,"number"==typeof a?a:void 0)};
U.prototype.setSubframe=function(c){this.isSubframeEnabled=!!c};
U.prototype.gotoFrame=function(){this.currentFrame=this.isSubframeEnabled?this.currentRawFrame:~~this.currentRawFrame;this.timeCompleted!==this.totalFrames&&this.currentFrame>this.timeCompleted&&(this.currentFrame=this.timeCompleted);this.trigger("enterFrame");this.renderFrame();this.trigger("drawnFrame")};
U.prototype.renderFrame=function(){if(!1!==this.isLoaded&&this.renderer)try{this.expressionsPlugin&&this.expressionsPlugin.resetFrame(),this.renderer.renderFrame(this.currentFrame+this.firstFrame)}catch(c){this.triggerRenderFrameError(c)}};
U.prototype.play=function(c){c&&this.name!==c||!0===this.isPaused&&(this.isPaused=!1,this.trigger("_play"),this.audioController.resume(),this._idle&&(this._idle=!1,this.trigger("_active")))};
U.prototype.pause=function(c){c&&this.name!==c||!1===this.isPaused&&(this.isPaused=!0,this.trigger("_pause"),this._idle=!0,this.trigger("_idle"),this.audioController.pause())};
U.prototype.togglePause=function(c){c&&this.name!==c||(!0===this.isPaused?this.play():this.pause())};
U.prototype.stop=function(c){c&&this.name!==c||(this.pause(),this.playCount=0,this._completedLoop=!1,this.setCurrentRawFrameValue(0))};
U.prototype.getMarkerData=function(c){for(var a,b=0;b<this.markers.length;b+=1)if((a=this.markers[b]).payload&&a.payload.name===c)return a;return null};
U.prototype.goToAndStop=function(c,a,b){b&&this.name!==b||(b=Number(c),isNaN(b)?(c=this.getMarkerData(c))&&this.goToAndStop(c.time,!0):a?this.setCurrentRawFrameValue(c):this.setCurrentRawFrameValue(c*this.frameModifier),this.pause())};
U.prototype.goToAndPlay=function(c,a,b){if(!b||this.name===b){var d=Number(c);isNaN(d)?(c=this.getMarkerData(c))&&(c.duration?this.playSegments([c.time,c.time+c.duration],!0):this.goToAndStop(c.time,!0)):this.goToAndStop(d,a,b);this.play()}};
U.prototype.advanceTime=function(c){if(!0!==this.isPaused&&!1!==this.isLoaded){c=this.currentRawFrame+c*this.frameModifier;var a=!1;c>=this.totalFrames-1&&this.frameModifier>0?this.loop&&this.playCount!==this.loop?c>=this.totalFrames?(this.playCount+=1,this.checkSegments(c%this.totalFrames)||(this.setCurrentRawFrameValue(c%this.totalFrames),this._completedLoop=!0,this.trigger("loopComplete"))):this.setCurrentRawFrameValue(c):this.checkSegments(c>this.totalFrames?c%this.totalFrames:0)||(a=!0,c=this.totalFrames-
1):c<0?this.checkSegments(c%this.totalFrames)||(!this.loop||this.playCount--<=0&&!0!==this.loop?(a=!0,c=0):(this.setCurrentRawFrameValue(this.totalFrames+c%this.totalFrames),this._completedLoop?this.trigger("loopComplete"):this._completedLoop=!0)):this.setCurrentRawFrameValue(c);a&&(this.setCurrentRawFrameValue(c),this.pause(),this.trigger("complete"))}};
U.prototype.adjustSegment=function(c,a){this.playCount=0;c[1]<c[0]?(this.frameModifier>0&&(this.playSpeed<0?this.setSpeed(-this.playSpeed):this.setDirection(-1)),this.totalFrames=c[0]-c[1],this.timeCompleted=this.totalFrames,this.firstFrame=c[1],this.setCurrentRawFrameValue(this.totalFrames-.001-a)):c[1]>c[0]&&(this.frameModifier<0&&(this.playSpeed<0?this.setSpeed(-this.playSpeed):this.setDirection(1)),this.totalFrames=c[1]-c[0],this.timeCompleted=this.totalFrames,this.firstFrame=c[0],this.setCurrentRawFrameValue(.001+
a));this.trigger("segmentStart")};
U.prototype.setSegment=function(c,a){var b=-1;this.isPaused&&(this.currentRawFrame+this.firstFrame<c?b=c:this.currentRawFrame+this.firstFrame>a&&(b=a-c));this.firstFrame=c;this.timeCompleted=this.totalFrames=a-c;-1!==b&&this.goToAndStop(b,!0)};
U.prototype.playSegments=function(c,a){if(a&&(this.segments.length=0),"object"===rc(c[0])){var b,d=c.length;for(b=0;b<d;b+=1)this.segments.push(c[b])}else this.segments.push(c);this.segments.length&&a&&this.adjustSegment(this.segments.shift(),0);this.isPaused&&this.play()};
U.prototype.resetSegments=function(c){this.segments.length=0;this.segments.push([this.animationData.ip,this.animationData.op]);c&&this.checkSegments(0)};
U.prototype.checkSegments=function(c){return!!this.segments.length&&(this.adjustSegment(this.segments.shift(),c),!0)};
U.prototype.destroy=function(c){c&&this.name!==c||!this.renderer||(this.renderer.destroy(),this.imagePreloader.destroy(),this.trigger("destroy"),this._cbs=null,this.onEnterFrame=null,this.onLoopComplete=null,this.onComplete=null,this.onSegmentStart=null,this.onDestroy=null,this.renderer=null,this.expressionsPlugin=null,this.imagePreloader=null,this.projectInterface=null)};
U.prototype.setCurrentRawFrameValue=function(c){this.currentRawFrame=c;this.gotoFrame()};
U.prototype.setSpeed=function(c){this.playSpeed=c;this.updaFrameModifier()};
U.prototype.setDirection=function(c){this.playDirection=c<0?-1:1;this.updaFrameModifier()};
U.prototype.setLoop=function(c){this.loop=c};
U.prototype.setVolume=function(c,a){a&&this.name!==a||this.audioController.setVolume(c)};
U.prototype.getVolume=function(){return this.audioController.getVolume()};
U.prototype.mute=function(c){c&&this.name!==c||this.audioController.mute()};
U.prototype.unmute=function(c){c&&this.name!==c||this.audioController.unmute()};
U.prototype.updaFrameModifier=function(){this.frameModifier=this.frameMult*this.playSpeed*this.playDirection;this.audioController.setRate(this.playSpeed*this.playDirection)};
U.prototype.getPath=function(){return this.path};
U.prototype.getAssetsPath=function(c){if(c.e)var a=c.p;else this.assetsPath?(c=c.p,-1!==c.indexOf("images/")&&(c=c.split("/")[1]),a=this.assetsPath+c):(a=this.path,a+=c.u?c.u:"",a+=c.p);return a};
U.prototype.getAssetData=function(c){for(var a=0,b=this.assets.length;a<b;){if(c===this.assets[a].id)return this.assets[a];a+=1}return null};
U.prototype.hide=function(){this.renderer.hide()};
U.prototype.show=function(){this.renderer.show()};
U.prototype.getDuration=function(c){return c?this.totalFrames:this.totalFrames/this.frameRate};
U.prototype.updateDocumentData=function(c,a,b){try{this.renderer.getElementByPath(c).updateDocumentData(a,b)}catch(d){}};
U.prototype.trigger=function(c){if(this._cbs&&this._cbs[c])switch(c){case "enterFrame":this.triggerEvent(c,new pc(c,this.currentFrame,this.totalFrames,this.frameModifier));break;case "drawnFrame":this.drawnFrameEvent.currentTime=this.currentFrame;this.drawnFrameEvent.totalTime=this.totalFrames;this.drawnFrameEvent.direction=this.frameModifier;this.triggerEvent(c,this.drawnFrameEvent);break;case "loopComplete":this.triggerEvent(c,new Vc(c,this.loop,this.playCount,this.frameMult));break;case "complete":this.triggerEvent(c,
new Gc(c,this.frameMult));break;case "segmentStart":this.triggerEvent(c,new Wc(c,this.firstFrame,this.totalFrames));break;case "destroy":this.triggerEvent(c,new Xc(c,this));break;default:this.triggerEvent(c)}"enterFrame"===c&&this.onEnterFrame&&this.onEnterFrame.call(this,new pc(c,this.currentFrame,this.totalFrames,this.frameMult));"loopComplete"===c&&this.onLoopComplete&&this.onLoopComplete.call(this,new Vc(c,this.loop,this.playCount,this.frameMult));"complete"===c&&this.onComplete&&this.onComplete.call(this,
new Gc(c,this.frameMult));"segmentStart"===c&&this.onSegmentStart&&this.onSegmentStart.call(this,new Wc(c,this.firstFrame,this.totalFrames));"destroy"===c&&this.onDestroy&&this.onDestroy.call(this,new Xc(c,this))};
U.prototype.triggerRenderFrameError=function(c){c=new ud(c,this.currentFrame);this.triggerEvent("error",c);this.onError&&this.onError.call(this,c)};
U.prototype.triggerConfigError=function(c){c=new Dd(c,this.currentFrame);this.triggerEvent("error",c);this.onError&&this.onError.call(this,c)};
var Na=function(){function c(m){var t=0;for(m=m.target;t<r;)g[t].animation===m&&(g.splice(t,1),--t,--r,m.isPaused||d()),t+=1}
function a(m,t){if(!m)return null;for(var u=0;u<r;){if(g[u].elem===m&&null!==g[u].elem)return g[u].animation;u+=1}u=new U;return e(u,m),u.setData(m,t),u}
function b(){v+=1;n()}
function d(){--v}
function e(m,t){m.addEventListener("destroy",c);m.addEventListener("_active",b);m.addEventListener("_idle",d);g.push({elem:t,animation:m});r+=1}
function f(m){var t,u=m-q;for(t=0;t<r;t+=1)g[t].animation.advanceTime(u);q=m;v&&!l?window.requestAnimationFrame(f):p=!0}
function k(m){q=m;window.requestAnimationFrame(f)}
function n(){!l&&v&&p&&(window.requestAnimationFrame(k),p=!1)}
var h={},g=[],q=0,r=0,v=0,p=!0,l=!1;return h.registerAnimation=a,h.loadAnimation=function(m){var t=new U;return e(t,null),t.setParams(m),t},h.setSpeed=function(m,t){var u;
for(u=0;u<r;u+=1)g[u].animation.setSpeed(m,t)},h.setDirection=function(m,t){var u;
for(u=0;u<r;u+=1)g[u].animation.setDirection(m,t)},h.play=function(m){var t;
for(t=0;t<r;t+=1)g[t].animation.play(m)},h.pause=function(m){var t;
for(t=0;t<r;t+=1)g[t].animation.pause(m)},h.stop=function(m){var t;
for(t=0;t<r;t+=1)g[t].animation.stop(m)},h.togglePause=function(m){var t;
for(t=0;t<r;t+=1)g[t].animation.togglePause(m)},h.searchAnimations=function(m,t,u){var w,x=[].concat([].slice.call(document.getElementsByClassName("lottie")),[].slice.call(document.getElementsByClassName("bodymovin"))),D=x.length;
for(w=0;w<D;w+=1)u&&x[w].setAttribute("data-bm-type",u),a(x[w],m);t&&0===D&&(u||(u="svg"),t=document.getElementsByTagName("body")[0],t.innerText="",w=document.createElement("div"),w.style.width="100%",w.style.height="100%",w.setAttribute("data-bm-type",u),t.appendChild(w),a(w,m))},h.resize=function(){var m;
for(m=0;m<r;m+=1)g[m].animation.resize()},h.goToAndStop=function(m,t,u){var w;
for(w=0;w<r;w+=1)g[w].animation.goToAndStop(m,t,u)},h.destroy=function(m){var t;
for(t=r-1;t>=0;--t)g[t].animation.destroy(m)},h.freeze=function(){l=!0},h.unfreeze=function(){l=!1;
n()},h.setVolume=function(m,t){var u;
for(u=0;u<r;u+=1)g[u].animation.setVolume(m,t)},h.mute=function(m){var t;
for(t=0;t<r;t+=1)g[t].animation.mute(m)},h.unmute=function(m){var t;
for(t=0;t<r;t+=1)g[t].animation.unmute(m)},h.getRegisteredAnimations=function(){var m,t=g.length,u=[];
for(m=0;m<t;m+=1)u.push(g[m].animation);return u},h}(),kb=function(){function c(e,f,k){return(((1-3*k+3*f)*e+(3*k-6*f))*e+3*f)*e}
function a(e){this._p=e;this._mSampleValues=d?new Float32Array(11):Array(11);this._precomputed=!1;this.get=this.get.bind(this)}
var b={},d="function"==typeof Float32Array;return a.prototype={get:function(e){var f=this._p[0],k=this._p[1],n=this._p[2],h=this._p[3];return this._precomputed||this._precompute(),f===k&&n===h?e:0===e?0:1===e?1:c(this._getTForX(e),k,h)},
_precompute:function(){var e=this._p[0],f=this._p[1],k=this._p[2],n=this._p[3];this._precomputed=!0;e===f&&k===n||this._calcSampleValues()},
_calcSampleValues:function(){for(var e=this._p[0],f=this._p[2],k=0;k<11;++k)this._mSampleValues[k]=c(k*.1,e,f)},
_getTForX:function(e){for(var f=this._p[0],k=this._p[2],n=this._mSampleValues,h=0,g=1;10!==g&&n[g]<=e;++g)h+=.1;n=h+(e-n[--g])/(n[g+1]-n[g])*.1;g=3*(1-3*k+3*f)*n*n+2*(3*k-6*f)*n+3*f;return g>=.001?function(q,r,v,p){for(var l=0;l<4;++l){var m=3*(1-3*p+3*v)*r*r+2*(3*p-6*v)*r+3*v;if(0===m)break;r-=(c(r,v,p)-q)/m}return r}(e,n,f,k):0===g?n:function(q,r,v,p,l){var m,t,u=0;
do(m=c(t=r+(v-r)/2,p,l)-q)>0?v=t:r=t;while(Math.abs(m)>1E-7&&++u<10);return t}(e,h,h+.1,f,k)}},{getBezierEasing:function(e,f,k,n,h){h=h||("bez_"+e+"_"+f+"_"+k+"_"+n).replace(/\./g,"p");
if(b[h])return b[h];e=new a([e,f,k,n]);return b[h]=e,e}}}(),T={double:function(c){return c.concat(ta(c.length))}},va=function(c,a,b){var d=0,e=c,f=ta(e);
return{newElement:function(){return d?f[--d]:a()},
release:function(k){d===e&&(f=T.double(f),e*=2);b&&b(k);f[d]=k;d+=1}}},cc=va(8,function(){return{addedLength:0,
percents:la("float32",sb),lengths:la("float32",sb)}}),od=va(8,function(){return{lengths:[],
totalLength:0}},function(c){var a,b=c.lengths.length;
for(a=0;a<b;a+=1)cc.release(c.lengths[a]);c.lengths.length=0}),Xa=function(){function c(g,q,r,v,p,l){g=g*v+q*p+r*l-p*v-l*g-r*q;
return g>-.001&&g<.001}
function a(g){this.segmentLength=0;this.points=Array(g)}
function b(g,q){this.partialLength=g;this.point=q}
function d(g,q){var r=q.percents,v=q.lengths,p=r.length,l=Ab((p-1)*g);g*=q.addedLength;q=0;if(l===p-1||0===l||g===v[l])return r[l];for(var m=v[l]>g?-1:1,t=!0;t;)if(v[l]<=g&&v[l+1]>g?(q=(g-v[l])/(v[l+1]-v[l]),t=!1):l+=m,l<0||l>=p-1){if(l===p-1)return r[l];t=!1}return r[l]+(r[l+1]-r[l])*q}
var e=Math,f=function(g,q,r,v){var p,l,m,t=sb,u=0,w=[],x=[],D=cc.newElement();var K=r.length;for(p=0;p<t;p+=1){var J=p/(t-1);for(l=m=0;l<K;l+=1){var F=eb(1-J,3)*g[l]+3*eb(1-J,2)*J*r[l]+3*(1-J)*eb(J,2)*v[l]+eb(J,3)*q[l];w[l]=F;null!==x[l]&&(m+=eb(w[l]-x[l],2));x[l]=w[l]}m&&(u+=oc(m));D.percents[p]=J;D.lengths[p]=u}return D.addedLength=u,D},k,n=(k={},function(g,q,r,v){var p=(g[0]+"_"+g[1]+"_"+q[0]+"_"+q[1]+"_"+r[0]+"_"+r[1]+"_"+v[0]+"_"+v[1]).replace(/\./g,"p");
if(!k[p]){var l,m,t,u=sb,w=0,x=null;2===g.length&&(g[0]!==q[0]||g[1]!==q[1])&&c(g[0],g[1],q[0],q[1],g[0]+r[0],g[1]+r[1])&&c(g[0],g[1],q[0],q[1],q[0]+v[0],q[1]+v[1])&&(u=2);var D=new a(u);var K=r.length;for(l=0;l<u;l+=1){var J=ta(K);var F=l/(u-1);for(m=t=0;m<K;m+=1){var G=eb(1-F,3)*g[m]+3*eb(1-F,2)*F*(g[m]+r[m])+3*(1-F)*eb(F,2)*(q[m]+v[m])+eb(F,3)*q[m];J[m]=G;null!==x&&(t+=eb(J[m]-x[m],2))}w+=t=oc(t);D.points[l]=new b(t,J);x=J}D.segmentLength=w;k[p]=D}return k[p]}),h=la("float32",8);
return{getSegmentsLength:function(g){var q=od.newElement(),r=g.c,v=g.v,p=g.o,l=g.i,m=g._length,t=q.lengths,u=0;for(g=0;g<m-1;g+=1)t[g]=f(v[g],v[g+1],p[g],l[g+1]),u+=t[g].addedLength;return r&&m&&(t[g]=f(v[g],v[0],p[g],l[0]),u+=t[g].addedLength),q.totalLength=u,q},
getNewSegment:function(g,q,r,v,p,l,m){p<0?p=0:p>1&&(p=1);var t=d(p,m);var u=d(l>1?1:l,m);l=g.length;var w=1-t,x=1-u;m=w*w*w;p=t*w*w*3;var D=t*t*w*3,K=t*t*t,J=w*w*x,F=t*w*x+w*t*x+w*w*u,G=t*t*x+w*t*u+t*w*u,B=t*t*u,z=w*x*x,y=t*x*x+w*u*x+w*x*u;w=t*u*x+w*u*u+t*x*u;t=t*u*u;var C=x*x*x,N=u*x*x+x*u*x+x*x*u;x=u*u*x+x*u*u+u*x*u;var P=u*u*u;for(u=0;u<l;u+=1)h[4*u]=e.round(1E3*(m*g[u]+p*r[u]+D*v[u]+K*q[u]))/1E3,h[4*u+1]=e.round(1E3*(J*g[u]+F*r[u]+G*v[u]+B*q[u]))/1E3,h[4*u+2]=e.round(1E3*(z*g[u]+y*r[u]+w*v[u]+
t*q[u]))/1E3,h[4*u+3]=e.round(1E3*(C*g[u]+N*r[u]+x*v[u]+P*q[u]))/1E3;return h},
getPointInSegment:function(g,q,r,v,p,l){p=d(p,l);l=1-p;return[e.round(1E3*(l*l*l*g[0]+(p*l*l+l*p*l+l*l*p)*r[0]+(p*p*l+l*p*p+p*l*p)*v[0]+p*p*p*q[0]))/1E3,e.round(1E3*(l*l*l*g[1]+(p*l*l+l*p*l+l*l*p)*r[1]+(p*p*l+l*p*p+p*l*p)*v[1]+p*p*p*q[1]))/1E3]},
buildBezierData:n,pointOnLine2D:c,pointOnLine3D:function(g,q,r,v,p,l,m,t,u){if(0===r&&0===l&&0===u)return c(g,q,v,p,m,t);var w,x=e.sqrt(e.pow(v-g,2)+e.pow(p-q,2)+e.pow(l-r,2));g=e.sqrt(e.pow(m-g,2)+e.pow(t-q,2)+e.pow(u-r,2));v=e.sqrt(e.pow(m-v,2)+e.pow(t-p,2)+e.pow(u-l,2));return(w=x>g?x>v?x-g-v:v-g-x:v>g?v-g-x:g-x-v)>-1E-4&&w<1E-4}}}(),Mb=Rc,pd=Math.abs,Q={getProp:function(c,a,b,d,e){if(a.sid&&(a=c.globalData.slotManager.getProp(a)),a.k.length)if("number"==typeof a.k[0])var f=new Lc(c,a,d,e);
else switch(b){case 0:f=new Fd(c,a,d,e);break;case 1:f=new Gd(c,a,d,e)}else f=new Kc(c,a,d,e);return f.effectsSequence.length&&e.addDynamicProperty(f),f}};
Pa.prototype={addDynamicProperty:function(c){-1===this.dynamicProperties.indexOf(c)&&(this.dynamicProperties.push(c),this.container.addDynamicProperty(this),this._isAnimated=!0)},
iterateDynamicProperties:function(){var c;this._mdf=!1;var a=this.dynamicProperties.length;for(c=0;c<a;c+=1)this.dynamicProperties[c].getValue(),this.dynamicProperties[c]._mdf&&(this._mdf=!0)},
initDynamicPropertyContainer:function(c){this.container=c;this.dynamicProperties=[];this._isAnimated=this._mdf=!1}};
var Ya=va(8,function(){return la("float32",2)});
lb.prototype.setPathData=function(c,a){this.c=c;this.setLength(a);for(c=0;c<a;)this.v[c]=Ya.newElement(),this.o[c]=Ya.newElement(),this.i[c]=Ya.newElement(),c+=1};
lb.prototype.setLength=function(c){for(;this._maxLength<c;)this.doubleArrayLength();this._length=c};
lb.prototype.doubleArrayLength=function(){this.v=this.v.concat(ta(this._maxLength));this.i=this.i.concat(ta(this._maxLength));this.o=this.o.concat(ta(this._maxLength));this._maxLength*=2};
lb.prototype.setXYAt=function(c,a,b,d,e){switch(this._length=Math.max(this._length,d+1),this._length>=this._maxLength&&this.doubleArrayLength(),b){case "v":b=this.v;break;case "i":b=this.i;break;case "o":b=this.o;break;default:b=[]}(!b[d]||b[d]&&!e)&&(b[d]=Ya.newElement());b[d][0]=c;b[d][1]=a};
lb.prototype.setTripleAt=function(c,a,b,d,e,f,k,n){this.setXYAt(c,a,"v",k,n);this.setXYAt(b,d,"o",k,n);this.setXYAt(e,f,"i",k,n)};
lb.prototype.reverse=function(){var c=new lb;c.setPathData(this.c,this._length);var a=this.v,b=this.o,d=this.i,e=0;this.c&&(c.setTripleAt(a[0][0],a[0][1],d[0][0],d[0][1],b[0][0],b[0][1],0,!1),e=1);for(var f=this._length-1,k=this._length;e<k;e+=1)c.setTripleAt(a[f][0],a[f][1],d[f][0],d[f][1],b[f][0],b[f][1],e,!1),--f;return c};
lb.prototype.length=function(){return this._length};
var Jc,O=((Jc=va(4,function(){return new lb},function(c){var a,b=c._length;
for(a=0;a<b;a+=1)Ya.release(c.v[a]),Ya.release(c.i[a]),Ya.release(c.o[a]),c.v[a]=null,c.i[a]=null,c.o[a]=null;c._length=0;c.c=!1})).clone=function(c){var a,b=Jc.newElement(),d=void 0===c._length?c.v.length:c._length;
b.setLength(d);b.c=c.c;for(a=0;a<d;a+=1)b.setTripleAt(c.v[a][0],c.v[a][1],c.o[a][0],c.o[a][1],c.i[a][0],c.i[a][1],a);return b},Jc);
Ia.prototype.addShape=function(c){this._length===this._maxLength&&(this.shapes=this.shapes.concat(ta(this._maxLength)),this._maxLength*=2);this.shapes[this._length]=c;this._length+=1};
Ia.prototype.releaseShapes=function(){var c;for(c=0;c<this._length;c+=1)O.release(this.shapes[c]);this._length=0};
var Cb,Da,Db,zb,Ea=(Cb={newShapeCollection:function(){return Da?zb[--Da]:new Ia},
release:function(c){var a,b=c._length;for(a=0;a<b;a+=1)O.release(c.shapes[a]);c._length=0;Da===Db&&(zb=T.double(zb),Db*=2);zb[Da]=c;Da+=1}},Da=0,zb=ta(Db=4),Cb),ja=function(){function c(v,p,l){var m,t;
var u=l.lastIndex;var w=this.keyframes;if(v<w[0].t-this.offsetTime)v=w[0].s[0],w=!0,u=0;else if(v>=w[w.length-1].t-this.offsetTime)v=w[w.length-1].s?w[w.length-1].s[0]:w[w.length-2].e[0],w=!0;else{var x;var D=u;u=w.length-1;for(x=!0;x&&(m=w[D],!((t=w[D+1]).t-this.offsetTime>v));)D<u-1?D+=1:x=!1;if(x=this.keyframesMetadata[D]||{},u=D,!(w=1===m.h)){if(v>=t.t-this.offsetTime)var K=1;else if(v<m.t-this.offsetTime)K=0;else{var J;x.__fnct?J=x.__fnct:(J=kb.getBezierEasing(m.o.x,m.o.y,m.i.x,m.i.y).get,x.__fnct=
J);K=J((v-(m.t-this.offsetTime))/(t.t-this.offsetTime-(m.t-this.offsetTime)))}var F=t.s?t.s[0]:m.e[0]}v=m.s[0]}m=p._length;t=v.i[0].length;l.lastIndex=u;for(l=0;l<m;l+=1)for(u=0;u<t;u+=1)D=w?v.i[l][u]:v.i[l][u]+(F.i[l][u]-v.i[l][u])*K,p.i[l][u]=D,D=w?v.o[l][u]:v.o[l][u]+(F.o[l][u]-v.o[l][u])*K,p.o[l][u]=D,D=w?v.v[l][u]:v.v[l][u]+(F.v[l][u]-v.v[l][u])*K,p.v[l][u]=D}
function a(){var v=this.comp.renderedFrame-this.offsetTime,p=this.keyframes[0].t-this.offsetTime,l=this.keyframes[this.keyframes.length-1].t-this.offsetTime,m=this._caching.lastFrame;return m!==h&&(m<p&&v<p||m>l&&v>l)||(this._caching.lastIndex=m<v?this._caching.lastIndex:0,this.interpolateShape(v,this.pv,this._caching)),this._caching.lastFrame=v,this.pv}
function b(){this.paths=this.localShapeCollection}
function d(v){a:{var p=this.v;if(p._length!==v._length||p.c!==v.c)p=!1;else{var l,m=p._length;for(l=0;l<m;l+=1)if(p.v[l][0]!==v.v[l][0]||p.v[l][1]!==v.v[l][1]||p.o[l][0]!==v.o[l][0]||p.o[l][1]!==v.o[l][1]||p.i[l][0]!==v.i[l][0]||p.i[l][1]!==v.i[l][1]){p=!1;break a}p=!0}}p||(this.v=O.clone(v),this.localShapeCollection.releaseShapes(),this.localShapeCollection.addShape(this.v),this._mdf=!0,this.paths=this.localShapeCollection)}
function e(){if(this.elem.globalData.frameId!==this.frameId)if(this.effectsSequence.length)if(this.lock)this.setVValue(this.pv);else{var v;this.lock=!0;this._mdf=!1;var p=this.kf?this.pv:this.data.ks?this.data.ks.k:this.data.pt.k;var l=this.effectsSequence.length;for(v=0;v<l;v+=1)p=this.effectsSequence[v](p);this.setVValue(p);this.lock=!1;this.frameId=this.elem.globalData.frameId}else this._mdf=!1}
function f(v,p,l){this.propType="shape";this.comp=v.comp;this.elem=this.container=v;this.data=p;this._mdf=this.kf=this.k=!1;v=3===l?p.pt.k:p.ks.k;this.v=O.clone(v);this.pv=O.clone(this.v);this.paths=this.localShapeCollection=Ea.newShapeCollection();this.paths.addShape(this.v);this.reset=b;this.effectsSequence=[]}
function k(v){this.effectsSequence.push(v);this.container.addDynamicProperty(this)}
function n(v,p,l){this.propType="shape";this.comp=v.comp;this.container=this.elem=v;this.offsetTime=v.data.st;this.keyframes=3===l?p.pt.k:p.ks.k;this.keyframesMetadata=[];this.kf=this.k=!0;v=this.keyframes[0].s[0].i.length;this.v=O.newElement();this.v.setPathData(this.keyframes[0].s[0].c,v);this.pv=O.clone(this.v);this.paths=this.localShapeCollection=Ea.newShapeCollection();this.paths.addShape(this.v);this.lastFrame=h;this.reset=b;this._caching={lastFrame:h,lastIndex:0};this.effectsSequence=[a.bind(this)]}
var h=-999999;f.prototype.interpolateShape=c;f.prototype.getValue=e;f.prototype.setVValue=d;f.prototype.addEffect=k;n.prototype.getValue=e;n.prototype.interpolateShape=c;n.prototype.setVValue=d;n.prototype.addEffect=k;var g=function(){function v(l,m){this.v=O.newElement();this.v.setPathData(!0,4);this.paths=this.localShapeCollection=Ea.newShapeCollection();this.localShapeCollection.addShape(this.v);this.d=m.d;this.elem=l;this.comp=l.comp;this.frameId=-1;this.initDynamicPropertyContainer(l);this.p=
Q.getProp(l,m.p,1,0,this);this.s=Q.getProp(l,m.s,1,0,this);this.dynamicProperties.length?this.k=!0:(this.k=!1,this.convertEllToPath())}
var p=Bb;return v.prototype={reset:b,getValue:function(){this.elem.globalData.frameId!==this.frameId&&(this.frameId=this.elem.globalData.frameId,this.iterateDynamicProperties(),this._mdf&&this.convertEllToPath())},
convertEllToPath:function(){var l=this.p.v[0],m=this.p.v[1],t=this.s.v[0]/2,u=this.s.v[1]/2,w=3!==this.d,x=this.v;x.v[0][0]=l;x.v[0][1]=m-u;x.v[1][0]=w?l+t:l-t;x.v[1][1]=m;x.v[2][0]=l;x.v[2][1]=m+u;x.v[3][0]=w?l-t:l+t;x.v[3][1]=m;x.i[0][0]=w?l-t*p:l+t*p;x.i[0][1]=m-u;x.i[1][0]=w?l+t:l-t;x.i[1][1]=m-u*p;x.i[2][0]=w?l+t*p:l-t*p;x.i[2][1]=m+u;x.i[3][0]=w?l-t:l+t;x.i[3][1]=m+u*p;x.o[0][0]=w?l+t*p:l-t*p;x.o[0][1]=m-u;x.o[1][0]=w?l+t:l-t;x.o[1][1]=m+u*p;x.o[2][0]=w?l-t*p:l+t*p;x.o[2][1]=m+u;x.o[3][0]=w?
l-t:l+t;x.o[3][1]=m-u*p}},R([Pa],v),v}(),q=function(){function v(p,l){this.v=O.newElement();
this.v.setPathData(!0,0);this.elem=p;this.comp=p.comp;this.data=l;this.frameId=-1;this.d=l.d;this.initDynamicPropertyContainer(p);1===l.sy?(this.ir=Q.getProp(p,l.ir,0,0,this),this.is=Q.getProp(p,l.is,0,.01,this),this.convertToPath=this.convertStarToPath):this.convertToPath=this.convertPolygonToPath;this.pt=Q.getProp(p,l.pt,0,0,this);this.p=Q.getProp(p,l.p,1,0,this);this.r=Q.getProp(p,l.r,0,qa,this);this.or=Q.getProp(p,l.or,0,0,this);this.os=Q.getProp(p,l.os,0,.01,this);this.localShapeCollection=Ea.newShapeCollection();
this.localShapeCollection.addShape(this.v);this.paths=this.localShapeCollection;this.dynamicProperties.length?this.k=!0:(this.k=!1,this.convertToPath())}
return v.prototype={reset:b,getValue:function(){this.elem.globalData.frameId!==this.frameId&&(this.frameId=this.elem.globalData.frameId,this.iterateDynamicProperties(),this._mdf&&this.convertToPath())},
convertStarToPath:function(){var p,l,m=2*Math.floor(this.pt.v),t=2*Math.PI/m,u=!0,w=this.or.v,x=this.ir.v,D=this.os.v,K=this.is.v,J=2*Math.PI*w/(2*m),F=2*Math.PI*x/(2*m),G=-Math.PI/2;G+=this.r.v;var B=3===this.data.d?-1:1;for(p=this.v._length=0;p<m;p+=1){var z=u?D:K;var y=u?J:F;var C=(l=u?w:x)*Math.cos(G);l*=Math.sin(G);var N=0===C&&0===l?0:l/Math.sqrt(C*C+l*l),P=0===C&&0===l?0:-C/Math.sqrt(C*C+l*l);C+=+this.p.v[0];l+=+this.p.v[1];this.v.setTripleAt(C,l,C-N*y*z*B,l-P*y*z*B,C+N*y*z*B,l+P*y*z*B,p,!0);
u=!u;G+=t*B}},
convertPolygonToPath:function(){var p,l=Math.floor(this.pt.v),m=2*Math.PI/l,t=this.or.v,u=this.os.v,w=2*Math.PI*t/(4*l),x=.5*-Math.PI,D=3===this.data.d?-1:1;x+=this.r.v;for(p=this.v._length=0;p<l;p+=1){var K=t*Math.cos(x),J=t*Math.sin(x),F=0===K&&0===J?0:J/Math.sqrt(K*K+J*J),G=0===K&&0===J?0:-K/Math.sqrt(K*K+J*J);K+=+this.p.v[0];J+=+this.p.v[1];this.v.setTripleAt(K,J,K-F*w*u*D,J-G*w*u*D,K+F*w*u*D,J+G*w*u*D,p,!0);x+=m*D}this.paths.length=0;this.paths[0]=this.v}},R([Pa],v),v}(),r=function(){function v(p,
l){this.v=O.newElement();
this.v.c=!0;this.localShapeCollection=Ea.newShapeCollection();this.localShapeCollection.addShape(this.v);this.paths=this.localShapeCollection;this.elem=p;this.comp=p.comp;this.frameId=-1;this.d=l.d;this.initDynamicPropertyContainer(p);this.p=Q.getProp(p,l.p,1,0,this);this.s=Q.getProp(p,l.s,1,0,this);this.r=Q.getProp(p,l.r,0,0,this);this.dynamicProperties.length?this.k=!0:(this.k=!1,this.convertRectToPath())}
return v.prototype={convertRectToPath:function(){var p=this.p.v[0],l=this.p.v[1],m=this.s.v[0]/2,t=this.s.v[1]/2,u=Nd(m,t,this.r.v),w=u*(1-Bb);this.v._length=0;2===this.d||1===this.d?(this.v.setTripleAt(p+m,l-t+u,p+m,l-t+u,p+m,l-t+w,0,!0),this.v.setTripleAt(p+m,l+t-u,p+m,l+t-w,p+m,l+t-u,1,!0),0!==u?(this.v.setTripleAt(p+m-u,l+t,p+m-u,l+t,p+m-w,l+t,2,!0),this.v.setTripleAt(p-m+u,l+t,p-m+w,l+t,p-m+u,l+t,3,!0),this.v.setTripleAt(p-m,l+t-u,p-m,l+t-u,p-m,l+t-w,4,!0),this.v.setTripleAt(p-m,l-t+u,p-m,l-
t+w,p-m,l-t+u,5,!0),this.v.setTripleAt(p-m+u,l-t,p-m+u,l-t,p-m+w,l-t,6,!0),this.v.setTripleAt(p+m-u,l-t,p+m-w,l-t,p+m-u,l-t,7,!0)):(this.v.setTripleAt(p-m,l+t,p-m+w,l+t,p-m,l+t,2),this.v.setTripleAt(p-m,l-t,p-m,l-t+w,p-m,l-t,3))):(this.v.setTripleAt(p+m,l-t+u,p+m,l-t+w,p+m,l-t+u,0,!0),0!==u?(this.v.setTripleAt(p+m-u,l-t,p+m-u,l-t,p+m-w,l-t,1,!0),this.v.setTripleAt(p-m+u,l-t,p-m+w,l-t,p-m+u,l-t,2,!0),this.v.setTripleAt(p-m,l-t+u,p-m,l-t+u,p-m,l-t+w,3,!0),this.v.setTripleAt(p-m,l+t-u,p-m,l+t-w,p-m,
l+t-u,4,!0),this.v.setTripleAt(p-m+u,l+t,p-m+u,l+t,p-m+w,l+t,5,!0),this.v.setTripleAt(p+m-u,l+t,p+m-w,l+t,p+m-u,l+t,6,!0),this.v.setTripleAt(p+m,l+t-u,p+m,l+t-u,p+m,l+t-w,7,!0)):(this.v.setTripleAt(p-m,l-t,p-m+w,l-t,p-m,l-t,1,!0),this.v.setTripleAt(p-m,l+t,p-m,l+t-w,p-m,l+t,2,!0),this.v.setTripleAt(p+m,l+t,p+m-w,l+t,p+m,l+t,3,!0)))},
getValue:function(){this.elem.globalData.frameId!==this.frameId&&(this.frameId=this.elem.globalData.frameId,this.iterateDynamicProperties(),this._mdf&&this.convertRectToPath())},
reset:b},R([Pa],v),v}();
return{getShapeProp:function(v,p,l){var m;return 3===l||4===l?m=(3===l?p.pt:p.ks).k.length?new n(v,p,l):new f(v,p,l):5===l?m=new r(v,p):6===l?m=new g(v,p):7===l&&(m=new q(v,p)),m.k&&v.addDynamicProperty(m),m},
getConstructorFunction:function(){return f},
getKeyframedConstructorFunction:function(){return n}}}(),Ja=function(){function c(){return this.props[0]=1,this.props[1]=0,this.props[2]=0,this.props[3]=0,this.props[4]=0,this.props[5]=1,this.props[6]=0,this.props[7]=0,this.props[8]=0,this.props[9]=0,this.props[10]=1,this.props[11]=0,this.props[12]=0,this.props[13]=0,this.props[14]=0,this.props[15]=1,this}
function a(H){if(0===H)return this;var A=P(H);H=ea(H);return this._t(A,-H,0,0,H,A,0,0,0,0,1,0,0,0,0,1)}
function b(H){if(0===H)return this;var A=P(H);H=ea(H);return this._t(1,0,0,0,0,A,-H,0,0,H,A,0,0,0,0,1)}
function d(H){if(0===H)return this;var A=P(H);H=ea(H);return this._t(A,0,H,0,0,1,0,0,-H,0,A,0,0,0,0,1)}
function e(H){if(0===H)return this;var A=P(H);H=ea(H);return this._t(A,-H,0,0,H,A,0,0,0,0,1,0,0,0,0,1)}
function f(H,A){return this._t(1,A,H,1,0,0)}
function k(H,A){return this.shear(ia(H),ia(A))}
function n(H,A){var E=P(A);A=ea(A);return this._t(E,A,0,0,-A,E,0,0,0,0,1,0,0,0,0,1)._t(1,0,0,0,ia(H),1,0,0,0,0,1,0,0,0,0,1)._t(E,-A,0,0,A,E,0,0,0,0,1,0,0,0,0,1)}
function h(H,A,E){return E||0===E||(E=1),1===H&&1===A&&1===E?this:this._t(H,0,0,0,0,A,0,0,0,0,E,0,0,0,0,1)}
function g(H,A,E,M,Z,fa,aa,ha,da,Y,na,sa,L,I,ca,xa){return this.props[0]=H,this.props[1]=A,this.props[2]=E,this.props[3]=M,this.props[4]=Z,this.props[5]=fa,this.props[6]=aa,this.props[7]=ha,this.props[8]=da,this.props[9]=Y,this.props[10]=na,this.props[11]=sa,this.props[12]=L,this.props[13]=I,this.props[14]=ca,this.props[15]=xa,this}
function q(H,A,E){return E=E||0,0!==H||0!==A||0!==E?this._t(1,0,0,0,0,1,0,0,0,0,1,0,H,A,E,1):this}
function r(H,A,E,M,Z,fa,aa,ha,da,Y,na,sa,L,I,ca,xa){var V=this.props;if(1===H&&0===A&&0===E&&0===M&&0===Z&&1===fa&&0===aa&&0===ha&&0===da&&0===Y&&1===na&&0===sa)return V[12]=V[12]*H+V[15]*L,V[13]=V[13]*fa+V[15]*I,V[14]=V[14]*na+V[15]*ca,V[15]*=xa,this._identityCalculated=!1,this;var ba=V[0],Nb=V[1],Ob=V[2],Pb=V[3],Qb=V[4],Rb=V[5],Sb=V[6],Tb=V[7],Ub=V[8],Vb=V[9],Wb=V[10],Xb=V[11],Yb=V[12],Zb=V[13],$b=V[14],ac=V[15];return V[0]=ba*H+Nb*Z+Ob*da+Pb*L,V[1]=ba*A+Nb*fa+Ob*Y+Pb*I,V[2]=ba*E+Nb*aa+Ob*na+Pb*
ca,V[3]=ba*M+Nb*ha+Ob*sa+Pb*xa,V[4]=Qb*H+Rb*Z+Sb*da+Tb*L,V[5]=Qb*A+Rb*fa+Sb*Y+Tb*I,V[6]=Qb*E+Rb*aa+Sb*na+Tb*ca,V[7]=Qb*M+Rb*ha+Sb*sa+Tb*xa,V[8]=Ub*H+Vb*Z+Wb*da+Xb*L,V[9]=Ub*A+Vb*fa+Wb*Y+Xb*I,V[10]=Ub*E+Vb*aa+Wb*na+Xb*ca,V[11]=Ub*M+Vb*ha+Wb*sa+Xb*xa,V[12]=Yb*H+Zb*Z+$b*da+ac*L,V[13]=Yb*A+Zb*fa+$b*Y+ac*I,V[14]=Yb*E+Zb*aa+$b*na+ac*ca,V[15]=Yb*M+Zb*ha+$b*sa+ac*xa,this._identityCalculated=!1,this}
function v(H){H=H.props;return this.transform(H[0],H[1],H[2],H[3],H[4],H[5],H[6],H[7],H[8],H[9],H[10],H[11],H[12],H[13],H[14],H[15])}
function p(){return this._identityCalculated||(this._identity=!(1!==this.props[0]||0!==this.props[1]||0!==this.props[2]||0!==this.props[3]||0!==this.props[4]||1!==this.props[5]||0!==this.props[6]||0!==this.props[7]||0!==this.props[8]||0!==this.props[9]||1!==this.props[10]||0!==this.props[11]||0!==this.props[12]||0!==this.props[13]||0!==this.props[14]||1!==this.props[15]),this._identityCalculated=!0),this._identity}
function l(H){for(var A=0;A<16;){if(H.props[A]!==this.props[A])return!1;A+=1}return!0}
function m(H){var A;for(A=0;A<16;A+=1)H.props[A]=this.props[A];return H}
function t(H){var A;for(A=0;A<16;A+=1)this.props[A]=H[A]}
function u(H,A,E){return{x:H*this.props[0]+A*this.props[4]+E*this.props[8]+this.props[12],y:H*this.props[1]+A*this.props[5]+E*this.props[9]+this.props[13],z:H*this.props[2]+A*this.props[6]+E*this.props[10]+this.props[14]}}
function w(H,A,E){return H*this.props[0]+A*this.props[4]+E*this.props[8]+this.props[12]}
function x(H,A,E){return H*this.props[1]+A*this.props[5]+E*this.props[9]+this.props[13]}
function D(H,A,E){return H*this.props[2]+A*this.props[6]+E*this.props[10]+this.props[14]}
function K(){var H=this.props[0]*this.props[5]-this.props[1]*this.props[4],A=this.props[5]/H,E=-this.props[1]/H,M=-this.props[4]/H,Z=this.props[0]/H,fa=(this.props[4]*this.props[13]-this.props[5]*this.props[12])/H;H=-(this.props[0]*this.props[13]-this.props[1]*this.props[12])/H;var aa=new Ja;return aa.props[0]=A,aa.props[1]=E,aa.props[4]=M,aa.props[5]=Z,aa.props[12]=fa,aa.props[13]=H,aa}
function J(H){return this.getInverseMatrix().applyToPointArray(H[0],H[1],H[2]||0)}
function F(H){var A,E=H.length,M=[];for(A=0;A<E;A+=1)M[A]=J(H[A]);return M}
function G(H,A,E){var M=la("float32",6);if(this.isIdentity())M[0]=H[0],M[1]=H[1],M[2]=A[0],M[3]=A[1],M[4]=E[0],M[5]=E[1];else{var Z=this.props[0],fa=this.props[1],aa=this.props[4],ha=this.props[5],da=this.props[12],Y=this.props[13];M[0]=H[0]*Z+H[1]*aa+da;M[1]=H[0]*fa+H[1]*ha+Y;M[2]=A[0]*Z+A[1]*aa+da;M[3]=A[0]*fa+A[1]*ha+Y;M[4]=E[0]*Z+E[1]*aa+da;M[5]=E[0]*fa+E[1]*ha+Y}return M}
function B(H,A,E){return this.isIdentity()?[H,A,E]:[H*this.props[0]+A*this.props[4]+E*this.props[8]+this.props[12],H*this.props[1]+A*this.props[5]+E*this.props[9]+this.props[13],H*this.props[2]+A*this.props[6]+E*this.props[10]+this.props[14]]}
function z(H,A){if(this.isIdentity())return H+","+A;var E=this.props;return Math.round(100*(H*E[0]+A*E[4]+E[12]))/100+","+Math.round(100*(H*E[1]+A*E[5]+E[13]))/100}
function y(){for(var H=0,A=this.props,E="matrix3d(";H<16;)E+=S(1E4*A[H])/1E4,E+=15===H?")":",",H+=1;return E}
function C(H){return H<1E-6&&H>0||H>-1E-6&&H<0?S(1E4*H)/1E4:H}
function N(){var H=this.props;return"matrix("+C(H[0])+","+C(H[1])+","+C(H[4])+","+C(H[5])+","+C(H[12])+","+C(H[13])+")"}
var P=Math.cos,ea=Math.sin,ia=Math.tan,S=Math.round;return function(){this.reset=c;this.rotate=a;this.rotateX=b;this.rotateY=d;this.rotateZ=e;this.skew=k;this.skewFromAxis=n;this.shear=f;this.scale=h;this.setTransform=g;this.translate=q;this.transform=r;this.multiply=v;this.applyToPoint=u;this.applyToX=w;this.applyToY=x;this.applyToZ=D;this.applyToPointArray=B;this.applyToTriplePoints=G;this.applyToPointStringified=z;this.toCSS=y;this.to2dCSS=N;this.clone=m;this.cloneFromProps=t;this.equals=l;this.inversePoints=
F;this.inversePoint=J;this.getInverseMatrix=K;this._t=this.transform;this.isIdentity=p;this._identity=!0;this._identityCalculated=!1;this.props=la("float32",16);this.reset()}}(),ka={};
ka.play=Na.play;ka.pause=Na.pause;ka.setLocationHref=function(c){Ma=c};
ka.togglePause=Na.togglePause;ka.setSpeed=Na.setSpeed;ka.setDirection=Na.setDirection;ka.stop=Na.stop;ka.searchAnimations=fb;ka.registerAnimation=Na.registerAnimation;ka.loadAnimation=function(c){return Na.loadAnimation(c)};
ka.setSubframeRendering=function(c){nd=!!c};
ka.resize=Na.resize;ka.goToAndStop=Na.goToAndStop;ka.destroy=Na.destroy;ka.setQuality=function(c){if("string"==typeof c)switch(c){case "high":sb=200;break;default:case "medium":sb=50;break;case "low":sb=10}else!isNaN(c)&&c>1&&(sb=c)};
ka.inBrowser=function(){return"undefined"!=typeof navigator};
ka.installPlugin=function(c,a){"expressions"===c&&(Lb=a)};
ka.freeze=Na.freeze;ka.unfreeze=Na.unfreeze;ka.setVolume=Na.setVolume;ka.mute=Na.mute;ka.unmute=Na.unmute;ka.getRegisteredAnimations=Na.getRegisteredAnimations;ka.useWebWorker=function(c){Qc=!!c};
ka.setIDPrefix=function(c){Ad=c};
ka.__getFactory=function(c){switch(c){case "propertyFactory":return Q;case "shapePropertyFactory":return ja;case "matrix":return Ja;default:return null}};
ka.version="5.12.2";var bd="",cd=document.getElementsByTagName("script"),qd=cd[cd.length-1]||{src:""};bd=qd.src?qd.src.replace(/^[^\?]+\??/,""):"";(function(c){for(var a=bd.split("&"),b=0;b<a.length;b+=1){var d=a[b].split("=");if(decodeURIComponent(d[0])==c)return decodeURIComponent(d[1])}})("renderer");
var Od=setInterval(function(){"complete"===document.readyState&&(clearInterval(Od),fb())},100);
try{window.bodymovin=ka}catch(c){}var tb=function(){var c={},a={};return c.registerModifier=function(b,d){a[b]||(a[b]=d)},c.getModifier=function(b,d,e){return new a[b](d,e)},c}();
Ta.prototype.initModifierProperties=function(){};
Ta.prototype.addShapeToModifier=function(){};
Ta.prototype.addShape=function(c){if(!this.closed){c.sh.container.addDynamicProperty(c.sh);var a={shape:c.sh,data:c,localShapeCollection:Ea.newShapeCollection()};this.shapes.push(a);this.addShapeToModifier(a);this._isAnimated&&c.setAsAnimated()}};
Ta.prototype.init=function(c,a){this.shapes=[];this.elem=c;this.initDynamicPropertyContainer(c);this.initModifierProperties(c,a);this.frameId=Rc;this.k=this.closed=!1;this.dynamicProperties.length?this.k=!0:this.getValue(!0)};
Ta.prototype.processKeys=function(){this.elem.globalData.frameId!==this.frameId&&(this.frameId=this.elem.globalData.frameId,this.iterateDynamicProperties())};
R([Pa],Ta);R([Ta],Za);Za.prototype.initModifierProperties=function(c,a){this.s=Q.getProp(c,a.s,0,.01,this);this.e=Q.getProp(c,a.e,0,.01,this);this.o=Q.getProp(c,a.o,0,0,this);this.eValue=this.sValue=0;this.getValue=this.processKeys;this.m=a.m;this._isAnimated=!!this.s.effectsSequence.length||!!this.e.effectsSequence.length||!!this.o.effectsSequence.length};
Za.prototype.addShapeToModifier=function(c){c.pathsData=[]};
Za.prototype.calculateShapeEdges=function(c,a,b,d,e){var f=[];a<=1?f.push({s:c,e:a}):c>=1?f.push({s:c-1,e:a-1}):(f.push({s:c,e:1}),f.push({s:0,e:a-1}));var k;a=[];var n=f.length;for(c=0;c<n;c+=1)if(!((k=f[c]).e*e<d||k.s*e>d+b)){var h=k.s*e<=d?0:(k.s*e-d)/b;var g=k.e*e>=d+b?1:(k.e*e-d)/b;a.push([h,g])}return a.length||a.push([0,0]),a};
Za.prototype.releasePathsData=function(c){var a,b=c.length;for(a=0;a<b;a+=1)od.release(c[a]);return c.length=0,c};
Za.prototype.processShapes=function(c){var a,b,d;if(this._mdf||c){var e=this.o.v%360/360;if(e<0&&(e+=1),(a=this.s.v>1?1+e:this.s.v<0?0+e:this.s.v+e)>(b=this.e.v>1?1+e:this.e.v<0?0+e:this.e.v+e))e=a,a=b,b=e;a=1E-4*Math.round(1E4*a);b=1E-4*Math.round(1E4*b);this.sValue=a;this.eValue=b}else a=this.sValue,b=this.eValue;var f,k,n,h=this.shapes.length,g=0;if(b===a)for(e=0;e<h;e+=1)this.shapes[e].localShapeCollection.releaseShapes(),this.shapes[e].shape._mdf=!0,this.shapes[e].shape.paths=this.shapes[e].localShapeCollection,
this._mdf&&(this.shapes[e].pathsData.length=0);else if(1===b&&0===a||0===b&&1===a){if(this._mdf)for(e=0;e<h;e+=1)this.shapes[e].pathsData.length=0,this.shapes[e].shape._mdf=!0}else{var q,r=[];for(e=0;e<h;e+=1)if((q=this.shapes[e]).shape._mdf||this._mdf||c||2===this.m){if(k=(d=q.shape.paths)._length,n=0,!q.shape._mdf&&q.pathsData.length)n=q.totalShapeLength;else{var v=this.releasePathsData(q.pathsData);for(f=0;f<k;f+=1){var p=Xa.getSegmentsLength(d.shapes[f]);v.push(p);n+=p.totalLength}q.totalShapeLength=
n;q.pathsData=v}g+=n;q.shape._mdf=!0}else q.shape.paths=q.localShapeCollection;var l;d=a;v=b;p=0;for(e=h-1;e>=0;--e)if((q=this.shapes[e]).shape._mdf){(c=q.localShapeCollection).releaseShapes();2===this.m&&h>1?(l=this.calculateShapeEdges(a,b,q.totalShapeLength,p,g),p+=q.totalShapeLength):l=[[d,v]];k=l.length;for(f=0;f<k;f+=1)if(d=l[f][0],v=l[f][1],r.length=0,v<=1?r.push({s:q.totalShapeLength*d,e:q.totalShapeLength*v}):d>=1?r.push({s:q.totalShapeLength*(d-1),e:q.totalShapeLength*(v-1)}):(r.push({s:q.totalShapeLength*
d,e:q.totalShapeLength}),r.push({s:0,e:q.totalShapeLength*(v-1)})),n=this.addShapes(q,r[0]),r[0].s!==r[0].e){if(r.length>1)if(q.shape.paths.shapes[q.shape.paths._length-1].c){var m=n.pop();this.addPaths(n,c);n=this.addShapes(q,r[1],m)}else this.addPaths(n,c),n=this.addShapes(q,r[1]);this.addPaths(n,c)}q.shape.paths=c}}};
Za.prototype.addPaths=function(c,a){var b,d=c.length;for(b=0;b<d;b+=1)a.addShape(c[b])};
Za.prototype.addSegment=function(c,a,b,d,e,f,k){e.setXYAt(a[0],a[1],"o",f);e.setXYAt(b[0],b[1],"i",f+1);k&&e.setXYAt(c[0],c[1],"v",f);e.setXYAt(d[0],d[1],"v",f+1)};
Za.prototype.addSegmentFromArray=function(c,a,b,d){a.setXYAt(c[1],c[5],"o",b);a.setXYAt(c[2],c[6],"i",b+1);d&&a.setXYAt(c[0],c[4],"v",b);a.setXYAt(c[3],c[7],"v",b+1)};
Za.prototype.addShapes=function(c,a,b){var d,e,f,k,n,h=c.pathsData,g=c.shape.paths.shapes,q=c.shape.paths._length,r=0,v=[],p=!0;b?(f=b._length,n=b._length):(b=O.newElement(),f=0,n=0);v.push(b);for(c=0;c<q;c+=1){var l=h[c].lengths;b.c=g[c].c;var m=g[c].c?l.length:l.length+1;for(d=1;d<m;d+=1)if(r+(e=l[d-1]).addedLength<a.s)r+=e.addedLength,b.c=!1;else{if(r>a.e){b.c=!1;break}a.s<=r&&a.e>=r+e.addedLength?(this.addSegment(g[c].v[d-1],g[c].o[d-1],g[c].i[d],g[c].v[d],b,f,p),p=!1):(k=Xa.getNewSegment(g[c].v[d-
1],g[c].v[d],g[c].o[d-1],g[c].i[d],(a.s-r)/e.addedLength,(a.e-r)/e.addedLength,l[d-1]),this.addSegmentFromArray(k,b,f,p),p=!1,b.c=!1);r+=e.addedLength;f+=1}g[c].c&&l.length&&((e=l[d-1],r<=a.e)?(m=l[d-1].addedLength,a.s<=r&&a.e>=r+m?(this.addSegment(g[c].v[d-1],g[c].o[d-1],g[c].i[0],g[c].v[0],b,f,p),p=!1):(k=Xa.getNewSegment(g[c].v[d-1],g[c].v[0],g[c].o[d-1],g[c].i[0],(a.s-r)/m,(a.e-r)/m,l[d-1]),this.addSegmentFromArray(k,b,f,p),p=!1,b.c=!1)):b.c=!1,r+=e.addedLength,f+=1);if(b._length&&(b.setXYAt(b.v[n][0],
b.v[n][1],"i",n),b.setXYAt(b.v[b._length-1][0],b.v[b._length-1][1],"o",b._length-1)),r>a.e)break;c<q-1&&(b=O.newElement(),p=!0,v.push(b),f=0)}return v};
R([Ta],vc);vc.prototype.initModifierProperties=function(c,a){this.getValue=this.processKeys;this.amount=Q.getProp(c,a.a,0,null,this);this._isAnimated=!!this.amount.effectsSequence.length};
vc.prototype.processPath=function(c,a){a/=100;var b=[0,0],d=c._length,e;for(e=0;e<d;e+=1)b[0]+=c.v[e][0],b[1]+=c.v[e][1];b[0]/=d;b[1]/=d;var f=O.newElement();f.c=c.c;for(e=0;e<d;e+=1){var k=c.v[e][0]+(b[0]-c.v[e][0])*a;var n=c.v[e][1]+(b[1]-c.v[e][1])*a;var h=c.o[e][0]+(b[0]-c.o[e][0])*-a;var g=c.o[e][1]+(b[1]-c.o[e][1])*-a;var q=c.i[e][0]+(b[0]-c.i[e][0])*-a;var r=c.i[e][1]+(b[1]-c.i[e][1])*-a;f.setTripleAt(k,n,h,g,q,r,e)}return f};
vc.prototype.processShapes=function(c){var a,b,d,e,f=this.shapes.length,k=this.amount.v;if(0!==k)for(a=0;a<f;a+=1){if(e=(d=this.shapes[a]).localShapeCollection,d.shape._mdf||this._mdf||c){e.releaseShapes();d.shape._mdf=!0;var n=d.shape.paths.shapes;var h=d.shape.paths._length;for(b=0;b<h;b+=1)e.addShape(this.processPath(n[b],k))}d.shape.paths=d.localShapeCollection}this.dynamicProperties.length||(this._mdf=!1)};
var rd=function(){function c(b,d,e){if(this.elem=b,this.frameId=-1,this.propType="transform",this.data=d,this.v=new Ja,this.pre=new Ja,this.appliedTransformations=0,this.initDynamicPropertyContainer(e||b),d.p&&d.p.s?(this.px=Q.getProp(b,d.p.x,0,0,this),this.py=Q.getProp(b,d.p.y,0,0,this),d.p.z&&(this.pz=Q.getProp(b,d.p.z,0,0,this))):this.p=Q.getProp(b,d.p||{k:[0,0,0]},1,0,this),d.rx){if(this.rx=Q.getProp(b,d.rx,0,qa,this),this.ry=Q.getProp(b,d.ry,0,qa,this),this.rz=Q.getProp(b,d.rz,0,qa,this),d.or.k[0].ti){var f=
d.or.k.length;for(e=0;e<f;e+=1)d.or.k[e].to=null,d.or.k[e].ti=null}this.or=Q.getProp(b,d.or,1,qa,this);this.or.sh=!0}else this.r=Q.getProp(b,d.r||{k:0},0,qa,this);d.sk&&(this.sk=Q.getProp(b,d.sk,0,qa,this),this.sa=Q.getProp(b,d.sa,0,qa,this));this.a=Q.getProp(b,d.a||{k:[0,0,0]},1,0,this);this.s=Q.getProp(b,d.s||{k:[100,100,100]},1,.01,this);d.o?this.o=Q.getProp(b,d.o,0,.01,b):this.o={_mdf:!1,v:1};this._isDirty=!0;this.dynamicProperties.length||this.getValue(!0)}
var a=[0,0];return c.prototype={applyToMatrix:function(b){var d=this._mdf;this.iterateDynamicProperties();this._mdf=this._mdf||d;this.a&&b.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);this.s&&b.scale(this.s.v[0],this.s.v[1],this.s.v[2]);this.sk&&b.skewFromAxis(-this.sk.v,this.sa.v);this.r?b.rotate(-this.r.v):b.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);this.data.p.s?this.data.p.z?b.translate(this.px.v,this.py.v,
-this.pz.v):b.translate(this.px.v,this.py.v,0):b.translate(this.p.v[0],this.p.v[1],-this.p.v[2])},
getValue:function(b){if(this.elem.globalData.frameId!==this.frameId){if(this._isDirty&&(this.precalculateMatrix(),this._isDirty=!1),this.iterateDynamicProperties(),this._mdf||b){if(this.v.cloneFromProps(this.pre.props),this.appliedTransformations<1&&this.v.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]),this.appliedTransformations<2&&this.v.scale(this.s.v[0],this.s.v[1],this.s.v[2]),this.sk&&this.appliedTransformations<3&&this.v.skewFromAxis(-this.sk.v,this.sa.v),this.r&&this.appliedTransformations<
4?this.v.rotate(-this.r.v):!this.r&&this.appliedTransformations<4&&this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]),this.autoOriented){var d,e;if(b=this.elem.globalData.frameRate,this.p&&this.p.keyframes&&this.p.getValueAtTime)this.p._caching.lastFrame+this.p.offsetTime<=this.p.keyframes[0].t?(d=this.p.getValueAtTime((this.p.keyframes[0].t+.01)/b,0),e=this.p.getValueAtTime(this.p.keyframes[0].t/b,0)):this.p._caching.lastFrame+
this.p.offsetTime>=this.p.keyframes[this.p.keyframes.length-1].t?(d=this.p.getValueAtTime(this.p.keyframes[this.p.keyframes.length-1].t/b,0),e=this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length-1].t-.05)/b,0)):(d=this.p.pv,e=this.p.getValueAtTime((this.p._caching.lastFrame+this.p.offsetTime-.01)/b,this.p.offsetTime));else if(this.px&&this.px.keyframes&&this.py.keyframes&&this.px.getValueAtTime&&this.py.getValueAtTime){d=[];e=[];var f=this.px,k=this.py;f._caching.lastFrame+f.offsetTime<=
f.keyframes[0].t?(d[0]=f.getValueAtTime((f.keyframes[0].t+.01)/b,0),d[1]=k.getValueAtTime((k.keyframes[0].t+.01)/b,0),e[0]=f.getValueAtTime(f.keyframes[0].t/b,0),e[1]=k.getValueAtTime(k.keyframes[0].t/b,0)):f._caching.lastFrame+f.offsetTime>=f.keyframes[f.keyframes.length-1].t?(d[0]=f.getValueAtTime(f.keyframes[f.keyframes.length-1].t/b,0),d[1]=k.getValueAtTime(k.keyframes[k.keyframes.length-1].t/b,0),e[0]=f.getValueAtTime((f.keyframes[f.keyframes.length-1].t-.01)/b,0),e[1]=k.getValueAtTime((k.keyframes[k.keyframes.length-
1].t-.01)/b,0)):(d=[f.pv,k.pv],e[0]=f.getValueAtTime((f._caching.lastFrame+f.offsetTime-.01)/b,f.offsetTime),e[1]=k.getValueAtTime((k._caching.lastFrame+k.offsetTime-.01)/b,k.offsetTime))}else d=e=a;this.v.rotate(-Math.atan2(d[1]-e[1],d[0]-e[0]))}this.data.p&&this.data.p.s?this.data.p.z?this.v.translate(this.px.v,this.py.v,-this.pz.v):this.v.translate(this.px.v,this.py.v,0):this.v.translate(this.p.v[0],this.p.v[1],-this.p.v[2])}this.frameId=this.elem.globalData.frameId}},
precalculateMatrix:function(){if(this.appliedTransformations=0,this.pre.reset(),!this.a.effectsSequence.length&&(this.pre.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]),this.appliedTransformations=1,!this.s.effectsSequence.length)){if(this.pre.scale(this.s.v[0],this.s.v[1],this.s.v[2]),this.appliedTransformations=2,this.sk){if(this.sk.effectsSequence.length||this.sa.effectsSequence.length)return;this.pre.skewFromAxis(-this.sk.v,this.sa.v);this.appliedTransformations=3}this.r?this.r.effectsSequence.length||
(this.pre.rotate(-this.r.v),this.appliedTransformations=4):this.rz.effectsSequence.length||this.ry.effectsSequence.length||this.rx.effectsSequence.length||this.or.effectsSequence.length||(this.pre.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]),this.appliedTransformations=4)}},
autoOrient:function(){}},R([Pa],c),c.prototype.addDynamicProperty=function(b){this._addDynamicProperty(b);
this.elem.addDynamicProperty(b);this._isDirty=!0},c.prototype._addDynamicProperty=Pa.prototype.addDynamicProperty,{getTransformProperty:function(b,d,e){return new c(b,d,e)}}}();
R([Ta],za);za.prototype.initModifierProperties=function(c,a){this.getValue=this.processKeys;this.c=Q.getProp(c,a.c,0,null,this);this.o=Q.getProp(c,a.o,0,null,this);this.tr=rd.getTransformProperty(c,a.tr,this);this.so=Q.getProp(c,a.tr.so,0,.01,this);this.eo=Q.getProp(c,a.tr.eo,0,.01,this);this.data=a;this.dynamicProperties.length||this.getValue(!0);this._isAnimated=!!this.dynamicProperties.length;this.pMatrix=new Ja;this.rMatrix=new Ja;this.sMatrix=new Ja;this.tMatrix=new Ja;this.matrix=new Ja};
za.prototype.applyTransforms=function(c,a,b,d,e,f){var k=f?-1:1,n=d.s.v[0]+(1-d.s.v[0])*(1-e),h=d.s.v[1]+(1-d.s.v[1])*(1-e);c.translate(d.p.v[0]*k*e,d.p.v[1]*k*e,d.p.v[2]);a.translate(-d.a.v[0],-d.a.v[1],d.a.v[2]);a.rotate(-d.r.v*k*e);a.translate(d.a.v[0],d.a.v[1],d.a.v[2]);b.translate(-d.a.v[0],-d.a.v[1],d.a.v[2]);b.scale(f?1/n:n,f?1/h:h);b.translate(d.a.v[0],d.a.v[1],d.a.v[2])};
za.prototype.init=function(c,a,b,d){this.elem=c;this.arr=a;this.pos=b;this.elemsData=d;this._currentCopies=0;this._elements=[];this._groups=[];this.frameId=-1;this.initDynamicPropertyContainer(c);for(this.initModifierProperties(c,a[b]);b>0;)--b,this._elements.unshift(a[b]);this.dynamicProperties.length?this.k=!0:this.getValue(!0)};
za.prototype.resetElements=function(c){var a,b=c.length;for(a=0;a<b;a+=1)c[a]._processed=!1,"gr"===c[a].ty&&this.resetElements(c[a].it)};
za.prototype.cloneElements=function(c){c=JSON.parse(JSON.stringify(c));return this.resetElements(c),c};
za.prototype.changeGroupRender=function(c,a){var b,d=c.length;for(b=0;b<d;b+=1)c[b]._render=a,"gr"===c[b].ty&&this.changeGroupRender(c[b].it,a)};
za.prototype.processShapes=function(c){var a,b,d=!1;if(this._mdf||c){var e,f=Math.ceil(this.c.v);if(this._groups.length<f){for(;this._groups.length<f;)d={it:this.cloneElements(this._elements),ty:"gr"},d.it.push({a:{a:0,ix:1,k:[0,0]},nm:"Transform",o:{a:0,ix:7,k:100},p:{a:0,ix:2,k:[0,0]},r:{a:1,ix:6,k:[{s:0,e:0,t:0},{s:0,e:0,t:1}]},s:{a:0,ix:3,k:[100,100]},sa:{a:0,ix:5,k:0},sk:{a:0,ix:4,k:0},ty:"tr"}),this.arr.splice(0,0,d),this._groups.splice(0,0,d),this._currentCopies+=1;this.elem.reloadShapes();
d=!0}for(c=b=0;c<=this._groups.length-1;c+=1){if(e=b<f,this._groups[c]._render=e,this.changeGroupRender(this._groups[c].it,e),!e){var k=this.elemsData[c].it;k=k[k.length-1];0!==k.transform.op.v?(k.transform.op._mdf=!0,k.transform.op.v=0):k.transform.op._mdf=!1}b+=1}this._currentCopies=f;c=this.o.v;b=c%1;var n=c>0?Math.floor(c):Math.ceil(c);e=this.pMatrix.props;f=this.rMatrix.props;k=this.sMatrix.props;this.pMatrix.reset();this.rMatrix.reset();this.sMatrix.reset();this.tMatrix.reset();this.matrix.reset();
var h,g,q=0;if(c>0){for(;q<n;)this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,1,!1),q+=1;b&&(this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,b,!1),q+=b)}else if(c<0){for(;q>n;)this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,1,!0),--q;b&&(this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,-b,!0),q-=b)}c=1===this.data.m?0:this._currentCopies-1;var r=1===this.data.m?1:-1;for(b=this._currentCopies;b;){if(g=(n=(a=this.elemsData[c].it)[a.length-
1].transform.mProps.v.props).length,a[a.length-1].transform.mProps._mdf=!0,a[a.length-1].transform.op._mdf=!0,a[a.length-1].transform.op.v=1===this._currentCopies?this.so.v:this.so.v+(this.eo.v-this.so.v)*(c/(this._currentCopies-1)),0!==q){(0!==c&&1===r||c!==this._currentCopies-1&&-1===r)&&this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,1,!1);this.matrix.transform(f[0],f[1],f[2],f[3],f[4],f[5],f[6],f[7],f[8],f[9],f[10],f[11],f[12],f[13],f[14],f[15]);this.matrix.transform(k[0],
k[1],k[2],k[3],k[4],k[5],k[6],k[7],k[8],k[9],k[10],k[11],k[12],k[13],k[14],k[15]);this.matrix.transform(e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8],e[9],e[10],e[11],e[12],e[13],e[14],e[15]);for(h=0;h<g;h+=1)n[h]=this.matrix.props[h];this.matrix.reset()}else for(this.matrix.reset(),h=0;h<g;h+=1)n[h]=this.matrix.props[h];q+=1;--b;c+=r}}else for(b=this._currentCopies,c=0,r=1;b;)(a=this.elemsData[c].it)[a.length-1].transform.mProps.v.props,a[a.length-1].transform.mProps._mdf=!1,a[a.length-1].transform.op._mdf=
!1,--b,c+=r;return d};
za.prototype.addShape=function(){};
R([Ta],Ra);Ra.prototype.initModifierProperties=function(c,a){this.getValue=this.processKeys;this.rd=Q.getProp(c,a.r,0,null,this);this._isAnimated=!!this.rd.effectsSequence.length};
Ra.prototype.processPath=function(c,a){var b,d=O.newElement();d.c=c.c;var e,f,k,n,h,g,q,r,v,p=c._length,l=0;for(b=0;b<p;b+=1){var m=c.v[b];var t=c.o[b];var u=c.i[b];m[0]===t[0]&&m[1]===t[1]&&m[0]===u[0]&&m[1]===u[1]?0!==b&&b!==p-1||c.c?(e=0===b?c.v[p-1]:c.v[b-1],k=(f=Math.sqrt(Math.pow(m[0]-e[0],2)+Math.pow(m[1]-e[1],2)))?Math.min(f/2,a)/f:0,n=r=m[0]+(e[0]-m[0])*k,h=v=m[1]-(m[1]-e[1])*k,g=n-(n-m[0])*Bb,q=h-(h-m[1])*Bb,d.setTripleAt(n,h,g,q,r,v,l),l+=1,e=b===p-1?c.v[0]:c.v[b+1],k=(f=Math.sqrt(Math.pow(m[0]-
e[0],2)+Math.pow(m[1]-e[1],2)))?Math.min(f/2,a)/f:0,n=g=m[0]+(e[0]-m[0])*k,h=q=m[1]+(e[1]-m[1])*k,r=n-(n-m[0])*Bb,v=h-(h-m[1])*Bb,d.setTripleAt(n,h,g,q,r,v,l),l+=1):(d.setTripleAt(m[0],m[1],t[0],t[1],u[0],u[1],l),l+=1):(d.setTripleAt(c.v[b][0],c.v[b][1],c.o[b][0],c.o[b][1],c.i[b][0],c.i[b][1],l),l+=1)}return d};
Ra.prototype.processShapes=function(c){var a,b,d,e,f=this.shapes.length,k=this.rd.v;if(0!==k)for(a=0;a<f;a+=1){if(e=(d=this.shapes[a]).localShapeCollection,d.shape._mdf||this._mdf||c){e.releaseShapes();d.shape._mdf=!0;var n=d.shape.paths.shapes;var h=d.shape.paths._length;for(b=0;b<h;b+=1)e.addShape(this.processPath(n[b],k))}d.shape.paths=d.localShapeCollection}this.dynamicProperties.length||(this._mdf=!1)};
ma.prototype.point=function(c){return[((this.a[0]*c+this.b[0])*c+this.c[0])*c+this.d[0],((this.a[1]*c+this.b[1])*c+this.c[1])*c+this.d[1]]};
ma.prototype.derivative=function(c){return[(3*c*this.a[0]+2*this.b[0])*c+this.c[0],(3*c*this.a[1]+2*this.b[1])*c+this.c[1]]};
ma.prototype.tangentAngle=function(c){c=this.derivative(c);return Math.atan2(c[1],c[0])};
ma.prototype.normalAngle=function(c){c=this.derivative(c);return Math.atan2(c[0],c[1])};
ma.prototype.inflectionPoints=function(){var c=this.a[1]*this.b[0]-this.a[0]*this.b[1];if(Math.abs(c)<=1E-5)return[];var a=-.5*(this.a[1]*this.c[0]-this.a[0]*this.c[1])/c;c=a*a-1/3*(this.b[1]*this.c[0]-this.b[0]*this.c[1])/c;if(c<0)return[];c=Math.sqrt(c);return Math.abs(c)<=1E-5?c>0&&c<1?[a]:[]:[a-c,a+c].filter(function(b){return b>0&&b<1})};
ma.prototype.split=function(c){if(c<=0)return[wc(this.points[0]),this];if(c>=1)return[this,wc(this.points[this.points.length-1])];var a=Qa(this.points[0],this.points[1],c),b=Qa(this.points[1],this.points[2],c),d=Qa(this.points[2],this.points[3],c),e=Qa(a,b,c);b=Qa(b,d,c);c=Qa(e,b,c);return[new ma(this.points[0],a,e,c,!0),new ma(c,b,d,this.points[3],!0)]};
ma.prototype.bounds=function(){return{x:dd(this,0),y:dd(this,1)}};
ma.prototype.boundingBox=function(){var c=this.bounds();return{left:c.x.min,right:c.x.max,top:c.y.min,bottom:c.y.max,width:c.x.max-c.x.min,height:c.y.max-c.y.min,cx:(c.x.max+c.x.min)/2,cy:(c.y.max+c.y.min)/2}};
ma.prototype.intersections=function(c,a,b){void 0===a&&(a=2);void 0===b&&(b=7);var d=[];return ec(xc(this,0,1),xc(c,0,1),0,a,d,b),d};
ma.shapeSegment=function(c,a){var b=(a+1)%c.length();return new ma(c.v[a],c.o[a],c.i[b],c.v[b],!0)};
ma.shapeSegmentInverted=function(c,a){var b=(a+1)%c.length();return new ma(c.v[b],c.i[b],c.o[a],c.v[a],!0)};
R([Ta],hb);hb.prototype.initModifierProperties=function(c,a){this.getValue=this.processKeys;this.amplitude=Q.getProp(c,a.s,0,null,this);this.frequency=Q.getProp(c,a.r,0,null,this);this.pointsType=Q.getProp(c,a.pt,0,null,this);this._isAnimated=0!==this.amplitude.effectsSequence.length||0!==this.frequency.effectsSequence.length||0!==this.pointsType.effectsSequence.length};
hb.prototype.processPath=function(c,a,b,d){var e=c._length,f=O.newElement();if(f.c=c.c,c.c||--e,0===e)return f;var k=-1,n=ma.shapeSegment(c,0);Fb(f,c,0,a,b,d,k);for(var h=0;h<e;h+=1){var g=f,q=a,r=b,v=d;k=-k;for(var p=0;p<r;p+=1){var l=(p+1)/(r+1),m=2===v?Math.sqrt(Math.pow(n.points[3][0]-n.points[0][0],2)+Math.pow(n.points[3][1]-n.points[0][1],2)):0,t=n.normalAngle(l);Mc(g,n.point(l),t,k,q,m/(2*(r+1)),m/(2*(r+1)));k=-k}n=h!==e-1||c.c?ma.shapeSegment(c,(h+1)%e):null;Fb(f,c,h+1,a,b,d,k)}return f};
hb.prototype.processShapes=function(c){var a,b,d,e,f=this.shapes.length,k=this.amplitude.v,n=Math.max(0,Math.round(this.frequency.v)),h=this.pointsType.v;if(0!==k)for(a=0;a<f;a+=1){if(e=(d=this.shapes[a]).localShapeCollection,d.shape._mdf||this._mdf||c){e.releaseShapes();d.shape._mdf=!0;var g=d.shape.paths.shapes;var q=d.shape.paths._length;for(b=0;b<q;b+=1)e.addShape(this.processPath(g[b],k,n,h))}d.shape.paths=d.localShapeCollection}this.dynamicProperties.length||(this._mdf=!1)};
R([Ta],hc);hc.prototype.initModifierProperties=function(c,a){this.getValue=this.processKeys;this.amount=Q.getProp(c,a.a,0,null,this);this.miterLimit=Q.getProp(c,a.ml,0,null,this);this.lineJoin=a.lj;this._isAnimated=0!==this.amount.effectsSequence.length};
hc.prototype.processPath=function(c,a,b,d){var e=O.newElement();e.c=c.c;var f,k=c.length();c.c||--k;var n=[];for(f=0;f<k;f+=1){var h=ma.shapeSegment(c,f);n.push(fd(h,a))}if(!c.c)for(f=k-1;f>=0;--f)h=ma.shapeSegmentInverted(c,f),n.push(fd(h,a));f=n;for(n=1;n<f.length;n+=1){var g=Ib(f[n-1],f[n]);f[n-1]=g[0];f[n]=g[1]}n=(f.length>1&&(g=Ib(f[f.length-1],f[0]),f[f.length-1]=g[0],f[0]=g[1]),f);a=c=null;for(f=0;f<n.length;f+=1)for(k=n[f],a&&(c=ed(e,a,k[0],b,d)),a=k[k.length-1],g=0;g<k.length;g+=1)h=k[g],
c&&mb(h.points[0],c)?e.setXYAt(h.points[1][0],h.points[1][1],"o",e.length()-1):e.setTripleAt(h.points[0][0],h.points[0][1],h.points[1][0],h.points[1][1],h.points[0][0],h.points[0][1],e.length()),e.setTripleAt(h.points[3][0],h.points[3][1],h.points[3][0],h.points[3][1],h.points[2][0],h.points[2][1],e.length()),c=h.points[3];return n.length&&ed(e,a,n[0][0],b,d),e};
hc.prototype.processShapes=function(c){var a,b,d,e,f=this.shapes.length,k=this.amount.v,n=this.miterLimit.v,h=this.lineJoin;if(0!==k)for(a=0;a<f;a+=1){if(e=(d=this.shapes[a]).localShapeCollection,d.shape._mdf||this._mdf||c){e.releaseShapes();d.shape._mdf=!0;var g=d.shape.paths.shapes;var q=d.shape.paths._length;for(b=0;b<q;b+=1)e.addShape(this.processPath(g[b],k,h,n))}d.shape.paths=d.localShapeCollection}this.dynamicProperties.length||(this._mdf=!1)};
var Va=function(){function c(h,g){var q=document.createElement("span");q.setAttribute("aria-hidden",!0);q.style.fontFamily=g;var r=document.createElement("span");r.innerText="giItT1WQy@!-/#";q.style.position="absolute";q.style.left="-10000px";q.style.top="-10000px";q.style.fontSize="300px";q.style.fontVariant="normal";q.style.fontStyle="normal";q.style.fontWeight="normal";q.style.letterSpacing="0";q.appendChild(r);document.body.appendChild(q);var v=r.offsetWidth,p=r.style,l=h.split(","),m=l.length,
t=[];for(h=0;h<m;h+=1)"sans-serif"!==l[h]&&"monospace"!==l[h]&&t.push(l[h]);h=t.join(",");return p.fontFamily=h+", "+g,{node:r,w:v,parent:q}}
function a(h,g){var q=document.body&&g?"svg":"canvas",r=gd(h);if("svg"===q){var v=X("text");v.style.fontSize="100px";v.setAttribute("font-family",h.fFamily);v.setAttribute("font-style",r.style);v.setAttribute("font-weight",r.weight);v.textContent="1";h.fClass?(v.style.fontFamily="inherit",v.setAttribute("class",h.fClass)):v.style.fontFamily=h.fFamily;g.appendChild(v);var p=v}else g=(new OffscreenCanvas(500,500)).getContext("2d"),g.font=r.style+" "+r.weight+" 100px "+h.fFamily,p=g;return{measureText:function(l){return"svg"===
q?(p.textContent=l,p.getComputedTextLength()):p.measureText(l).width}}}
function b(h){var g=0,q=h.charCodeAt(0);q>=55296&&q<=56319&&(h=h.charCodeAt(1),h>=56320&&h<=57343&&(g=1024*(q-55296)+h-56320+65536));return g}
function d(h){h=b(h);return h>=127462&&h<=127487}
var e={w:0,size:0,shapes:[],data:{shapes:[]}},f=[];f=f.concat([2304,2305,2306,2307,2362,2363,2364,2364,2366,2367,2368,2369,2370,2371,2372,2373,2374,2375,2376,2377,2378,2379,2380,2381,2382,2383,2387,2388,2389,2390,2391,2402,2403]);var k=["d83cdffb","d83cdffc","d83cdffd","d83cdffe","d83cdfff"],n=function(){this.fonts=[];this.chars=null;this.typekitLoaded=0;this._warned=this.isLoaded=!1;this.initTime=Date.now();this.setIsLoadedBinded=this.setIsLoaded.bind(this);this.checkLoadedFontsBinded=this.checkLoadedFonts.bind(this)};
n.isModifier=function(h,g){h=h.toString(16)+g.toString(16);return-1!==k.indexOf(h)};
n.isZeroWidthJoiner=function(h){return 8205===h};
n.isFlagEmoji=function(h){return d(h.substr(0,2))&&d(h.substr(2,2))};
n.isRegionalCode=d;n.isCombinedCharacter=function(h){return-1!==f.indexOf(h)};
n.isRegionalFlag=function(h,g){var q=b(h.substr(g,2));if(q!==127988)return!1;var r=0;for(g+=2;r<5;){if((q=b(h.substr(g,2)))<917601||q>917626)return!1;r+=1;g+=2}return 917631===b(h.substr(g,2))};
n.isVariationSelector=function(h){return 65039===h};
n.BLACK_FLAG_CODE_POINT=127988;return n.prototype={addChars:function(h){if(h){var g;this.chars||(this.chars=[]);var q,r=h.length,v=this.chars.length;for(g=0;g<r;g+=1){var p=0;for(q=!1;p<v;)this.chars[p].style===h[g].style&&this.chars[p].fFamily===h[g].fFamily&&this.chars[p].ch===h[g].ch&&(q=!0),p+=1;q||(this.chars.push(h[g]),v+=1)}}},
addFonts:function(h,g){if(h){if(this.chars)return this.isLoaded=!0,void(this.fonts=h.list);if(!document.body)return this.isLoaded=!0,h.list.forEach(function(t){t.helper=a(t);t.cache={}}),void(this.fonts=h.list);
var q=h.list,r=q.length,v=r;for(h=0;h<r;h+=1){var p,l,m=!0;if(q[h].loaded=!1,q[h].monoCase=c(q[h].fFamily,"monospace"),q[h].sansCase=c(q[h].fFamily,"sans-serif"),q[h].fPath)if("p"===q[h].fOrigin||3===q[h].origin){if((p=document.querySelectorAll('style[f-forigin="p"][f-family="'+q[h].fFamily+'"], style[f-origin="3"][f-family="'+q[h].fFamily+'"]')).length>0&&(m=!1),m)p=document.createElement("style"),p.setAttribute("f-forigin",q[h].fOrigin),p.setAttribute("f-origin",q[h].origin),p.setAttribute("f-family",
q[h].fFamily),p.type="text/css",p.innerText="@font-face {font-family: "+q[h].fFamily+"; font-style: normal; src: url('"+q[h].fPath+"');}",g.appendChild(p)}else if("g"===q[h].fOrigin||1===q[h].origin){p=document.querySelectorAll('link[f-forigin="g"], link[f-origin="1"]');for(l=0;l<p.length;l+=1)-1!==p[l].href.indexOf(q[h].fPath)&&(m=!1);m&&(p=document.createElement("link"),p.setAttribute("f-forigin",q[h].fOrigin),p.setAttribute("f-origin",q[h].origin),p.type="text/css",p.rel="stylesheet",p.href=q[h].fPath,
document.body.appendChild(p))}else{if("t"===q[h].fOrigin||2===q[h].origin){p=document.querySelectorAll('script[f-forigin="t"], script[f-origin="2"]');for(l=0;l<p.length;l+=1)q[h].fPath===p[l].src&&(m=!1);m&&(p=document.createElement("link"),p.setAttribute("f-forigin",q[h].fOrigin),p.setAttribute("f-origin",q[h].origin),p.setAttribute("rel","stylesheet"),p.setAttribute("href",q[h].fPath),g.appendChild(p))}}else q[h].loaded=!0,--v;q[h].helper=a(q[h],g);q[h].cache={};this.fonts.push(q[h])}0===v?this.isLoaded=
!0:setTimeout(this.checkLoadedFonts.bind(this),100)}else this.isLoaded=!0},
getCharData:function(h,g,q){for(var r=0,v=this.chars.length;r<v;){if(this.chars[r].ch===h&&this.chars[r].style===g&&this.chars[r].fFamily===q)return this.chars[r];r+=1}return("string"==typeof h&&13!==h.charCodeAt(0)||!h)&&console&&console.warn&&!this._warned&&(this._warned=!0,console.warn("Missing character from exported characters list: ",h,g,q)),e},
getFontByName:function(h){for(var g=0,q=this.fonts.length;g<q;){if(this.fonts[g].fName===h)return this.fonts[g];g+=1}return this.fonts[0]},
measureText:function(h,g,q){g=this.getFontByName(g);if(!g.cache[h]){var r=g.helper;if(" "===h){var v=r.measureText("|"+h+"|");r=r.measureText("||");g.cache[h]=(v-r)/100}else g.cache[h]=r.measureText(h)/100}return g.cache[h]*q},
checkLoadedFonts:function(){var h,g,q,r=this.fonts.length,v=r;for(h=0;h<r;h+=1)this.fonts[h].loaded?--v:"n"===this.fonts[h].fOrigin||0===this.fonts[h].origin?this.fonts[h].loaded=!0:(g=this.fonts[h].monoCase.node,q=this.fonts[h].monoCase.w,g.offsetWidth!==q?(--v,this.fonts[h].loaded=!0):(g=this.fonts[h].sansCase.node,q=this.fonts[h].sansCase.w,g.offsetWidth!==q&&(--v,this.fonts[h].loaded=!0)),this.fonts[h].loaded&&(this.fonts[h].sansCase.parent.parentNode.removeChild(this.fonts[h].sansCase.parent),
this.fonts[h].monoCase.parent.parentNode.removeChild(this.fonts[h].monoCase.parent)));0!==v&&Date.now()-this.initTime<5E3?setTimeout(this.checkLoadedFontsBinded,20):setTimeout(this.setIsLoadedBinded,10)},
setIsLoaded:function(){this.isLoaded=!0}},n}();
hd.prototype.getProp=function(c){return this.animationData.slots&&this.animationData.slots[c.sid]?Object.assign(c,this.animationData.slots[c.sid].p):c};
xb.prototype={initRenderable:function(){this.isTransparent=this.hidden=this.isInRange=!1;this.renderableComponents=[]},
addRenderableComponent:function(c){-1===this.renderableComponents.indexOf(c)&&this.renderableComponents.push(c)},
removeRenderableComponent:function(c){-1!==this.renderableComponents.indexOf(c)&&this.renderableComponents.splice(this.renderableComponents.indexOf(c),1)},
prepareRenderableFrame:function(c){this.checkLayerLimits(c)},
checkTransparency:function(){this.finalTransform.mProp.o.v<=0?!this.isTransparent&&this.globalData.renderConfig.hideOnTransparent&&(this.isTransparent=!0,this.hide()):this.isTransparent&&(this.isTransparent=!1,this.show())},
checkLayerLimits:function(c){this.data.ip-this.data.st<=c&&this.data.op-this.data.st>c?!0!==this.isInRange&&(this.globalData._mdf=!0,this._mdf=!0,this.isInRange=!0,this.show()):!1!==this.isInRange&&(this.globalData._mdf=!0,this.isInRange=!1,this.hide())},
renderRenderable:function(){var c,a=this.renderableComponents.length;for(c=0;c<a;c+=1)this.renderableComponents[c].renderFrame(this._isFirstFrame)},
sourceRectAtTime:function(){return{top:0,left:0,width:100,height:100}},
getLayerSize:function(){return 5===this.data.ty?{w:this.data.textData.width,h:this.data.textData.height}:{w:this.data.width,h:this.data.height}}};
var Tc,ub=(Tc={0:"source-over",1:"multiply",2:"screen",3:"overlay",4:"darken",5:"lighten",6:"color-dodge",7:"color-burn",8:"hard-light",9:"soft-light",10:"difference",11:"exclusion",12:"hue",13:"saturation",14:"color",15:"luminosity"},function(c){return Tc[c]||""});
R([Pa],Ac);Ac.prototype.getValue=Ac.prototype.iterateDynamicProperties;Ac.prototype.init=function(c,a){this.data=c;this.effectElements=[];this.initDynamicPropertyContainer(a);var b=this.data.ef.length,d=this.data.ef;for(c=0;c<b;c+=1){switch(d[c].ty){case 0:var e=new wd(d[c],a,this);break;case 1:e=new xd(d[c],a,this);break;case 2:e=new Oc(d[c],a,this);break;case 3:e=new Hd(d[c],a,this);break;case 4:case 7:e=new Kd(d[c],a,this);break;case 10:e=new Id(d[c],a,this);break;case 11:e=new Jd(d[c],a,this);
break;case 5:e=new yd(d[c],a,this);break;default:e=new Ld(d[c],a,this)}e&&this.effectElements.push(e)}};
yb.prototype={checkMasks:function(){if(!this.data.hasMask)return!1;for(var c=0,a=this.data.masksProperties.length;c<a;){if("n"!==this.data.masksProperties[c].mode&&!1!==this.data.masksProperties[c].cl)return!0;c+=1}return!1},
initExpressions:function(){},
setBlendMode:function(){var c=ub(this.data.bm);(this.baseElement||this.layerElement).style["mix-blend-mode"]=c},
initBaseData:function(c,a,b){this.globalData=a;this.comp=b;this.data=c;this.layerId=Ca();this.data.sr||(this.data.sr=1);this.effectsManager=new yd(this.data,this,this.dynamicProperties)},
getType:function(){return this.type},
sourceRectAtTime:function(){}};
nb.prototype={initFrame:function(){this._isFirstFrame=!1;this.dynamicProperties=[];this._mdf=!1},
prepareProperties:function(c,a){var b=this.dynamicProperties.length;for(c=0;c<b;c+=1)(a||this._isParent&&"transform"===this.dynamicProperties[c].propType)&&(this.dynamicProperties[c].getValue(),this.dynamicProperties[c]._mdf&&(this.globalData._mdf=!0,this._mdf=!0))},
addDynamicProperty:function(c){-1===this.dynamicProperties.indexOf(c)&&this.dynamicProperties.push(c)}};
$a.prototype.prepareFrame=function(){};
R([xb,yb,nb],$a);$a.prototype.getBaseElement=function(){return null};
$a.prototype.renderFrame=function(){};
$a.prototype.destroy=function(){};
$a.prototype.initExpressions=function(){};
$a.prototype.getFootageData=function(){return this.footageData};
Aa.prototype.prepareFrame=function(c){(this.prepareRenderableFrame(c,!0),this.prepareProperties(c,!0),this.tm._placeholder)?this._currentTime=c/this.data.sr:this._currentTime=c=this.tm.v;this._volume=this.lv.v[0];c=this._volume*this._volumeMultiplier;this._previousVolume!==c&&(this._previousVolume=c,this.audio.volume(c))};
R([xb,yb,nb],Aa);Aa.prototype.renderFrame=function(){this.isInRange&&this._canPlay&&(this._isPlaying?(!this.audio.playing()||Math.abs(this._currentTime/this.globalData.frameRate-this.audio.seek())>.1)&&this.audio.seek(this._currentTime/this.globalData.frameRate):(this.audio.play(),this.audio.seek(this._currentTime/this.globalData.frameRate),this._isPlaying=!0))};
Aa.prototype.show=function(){};
Aa.prototype.hide=function(){this.audio.pause();this._isPlaying=!1};
Aa.prototype.pause=function(){this.audio.pause();this._canPlay=this._isPlaying=!1};
Aa.prototype.resume=function(){this._canPlay=!0};
Aa.prototype.setRate=function(c){this.audio.rate(c)};
Aa.prototype.volume=function(c){this._volumeMultiplier=c;this._previousVolume=c*this._volume;this.audio.volume(this._previousVolume)};
Aa.prototype.getBaseElement=function(){return null};
Aa.prototype.destroy=function(){};
Aa.prototype.sourceRectAtTime=function(){};
Aa.prototype.initExpressions=function(){};
ua.prototype.checkLayers=function(c){var a;var b=this.layers.length;this.completeLayers=!0;for(--b;b>=0;--b)this.elements[b]||(a=this.layers[b]).ip-a.st<=c-this.layers[b].st&&a.op-a.st>c-this.layers[b].st&&this.buildItem(b),this.completeLayers=!!this.elements[b]&&this.completeLayers;this.checkPendingElements()};
ua.prototype.createItem=function(c){switch(c.ty){case 2:return this.createImage(c);case 0:return this.createComp(c);case 1:return this.createSolid(c);default:return this.createNull(c);case 4:return this.createShape(c);case 5:return this.createText(c);case 6:return this.createAudio(c);case 13:return this.createCamera(c);case 15:return this.createFootage(c)}};
ua.prototype.createCamera=function(){throw Error("You're using a 3d camera. Try the html renderer.");};
ua.prototype.createAudio=function(c){return new Aa(c,this.globalData,this)};
ua.prototype.createFootage=function(c){return new $a(c,this.globalData,this)};
ua.prototype.buildAllItems=function(){var c,a=this.layers.length;for(c=0;c<a;c+=1)this.buildItem(c);this.checkPendingElements()};
ua.prototype.includeLayers=function(c){var a;this.completeLayers=!1;var b,d=c.length,e=this.layers.length;for(a=0;a<d;a+=1)for(b=0;b<e;){if(this.layers[b].id===c[a].id){this.layers[b]=c[a];break}b+=1}};
ua.prototype.setProjectInterface=function(c){this.globalData.projectInterface=c};
ua.prototype.initItems=function(){this.globalData.progressiveLoad||this.buildAllItems()};
ua.prototype.buildElementParenting=function(c,a,b){for(var d=this.elements,e=this.layers,f=0,k=e.length;f<k;)e[f].ind==a&&(d[f]&&!0!==d[f]?(b.push(d[f]),d[f].setAsParent(),void 0!==e[f].parent?this.buildElementParenting(c,e[f].parent,b):c.setHierarchy(b)):(this.buildItem(f),this.addPendingElement(c))),f+=1};
ua.prototype.addPendingElement=function(c){this.pendingElements.push(c)};
ua.prototype.searchExtraCompositions=function(c){var a,b=c.length;for(a=0;a<b;a+=1)if(c[a].xt){var d=this.createComp(c[a]);d.initExpressions();this.globalData.projectInterface.registerComposition(d)}};
ua.prototype.getElementById=function(c){var a,b=this.elements.length;for(a=0;a<b;a+=1)if(this.elements[a].data.ind===c)return this.elements[a];return null};
ua.prototype.getElementByPath=function(c){var a=c.shift();if("number"==typeof a)var b=this.elements[a];else{var d,e=this.elements.length;for(d=0;d<e;d+=1)if(this.elements[d].data.nm===a){b=this.elements[d];break}}return 0===c.length?b:b.getElementByPath(c)};
ua.prototype.setupGlobalData=function(c,a){this.globalData.fontManager=new Va;this.globalData.slotManager=new hd(c);this.globalData.fontManager.addChars(c.chars);this.globalData.fontManager.addFonts(c.fonts,a);this.globalData.getAssetData=this.animationItem.getAssetData.bind(this.animationItem);this.globalData.getAssetsPath=this.animationItem.getAssetsPath.bind(this.animationItem);this.globalData.imageLoader=this.animationItem.imagePreloader;this.globalData.audioController=this.animationItem.audioController;
this.globalData.frameId=0;this.globalData.frameRate=c.fr;this.globalData.nm=c.nm;this.globalData.compSize={w:c.w,h:c.h}};
Wa.prototype={initTransform:function(){var c=new Ja;this.finalTransform={mProp:this.data.ks?rd.getTransformProperty(this,this.data.ks,this):{o:0},_matMdf:!1,_localMatMdf:!1,_opMdf:!1,mat:c,localMat:c,localOpacity:1};this.data.ao&&(this.finalTransform.mProp.autoOriented=!0);this.data.ty},
renderTransform:function(){if(this.finalTransform._opMdf=this.finalTransform.mProp.o._mdf||this._isFirstFrame,this.finalTransform._matMdf=this.finalTransform.mProp._mdf||this._isFirstFrame,this.hierarchy){var c=this.finalTransform.mat;var a=0;var b=this.hierarchy.length;if(!this.finalTransform._matMdf)for(;a<b;){if(this.hierarchy[a].finalTransform.mProp._mdf){this.finalTransform._matMdf=!0;break}a+=1}if(this.finalTransform._matMdf)for(a=this.finalTransform.mProp.v.props,c.cloneFromProps(a),a=0;a<
b;a+=1)c.multiply(this.hierarchy[a].finalTransform.mProp.v)}this.finalTransform._matMdf&&(this.finalTransform._localMatMdf=this.finalTransform._matMdf);this.finalTransform._opMdf&&(this.finalTransform.localOpacity=this.finalTransform.mProp.o.v)},
renderLocalTransform:function(){if(this.localTransforms){var c=0,a=this.localTransforms.length;if(this.finalTransform._localMatMdf=this.finalTransform._matMdf,!this.finalTransform._localMatMdf||!this.finalTransform._opMdf)for(;c<a;)this.localTransforms[c]._mdf&&(this.finalTransform._localMatMdf=!0),this.localTransforms[c]._opMdf&&!this.finalTransform._opMdf&&(this.finalTransform.localOpacity=this.finalTransform.mProp.o.v,this.finalTransform._opMdf=!0),c+=1;if(this.finalTransform._localMatMdf){var b=
this.finalTransform.localMat;this.localTransforms[0].matrix.clone(b);for(c=1;c<a;c+=1){var d=this.localTransforms[c].matrix;b.multiply(d)}b.multiply(this.finalTransform.mat)}if(this.finalTransform._opMdf){b=this.finalTransform.localOpacity;for(c=0;c<a;c+=1)b*=.01*this.localTransforms[c].opacity;this.finalTransform.localOpacity=b}}},
searchEffectTransforms:function(){if(this.renderableEffectsManager){var c=this.renderableEffectsManager.getEffects("transformEFfect");if(c.length){this.localTransforms=[];this.finalTransform.localMat=new Ja;var a,b=c.length;for(a=0;a<b;a+=1)this.localTransforms.push(c[a])}}},
globalToLocal:function(c){var a=[];a.push(this.finalTransform);var b=!0;for(var d=this.comp;b;)d.finalTransform?(d.data.hasMask&&a.splice(0,0,d.finalTransform),d=d.comp):b=!1;var e=a.length;for(b=0;b<e;b+=1)d=a[b].mat.applyToPointArray(0,0,0),c=[c[0]-d[0],c[1]-d[1],0];return c},
mHelper:new Ja};Fa.prototype.getMaskProperty=function(c){return this.viewData[c].prop};
Fa.prototype.renderFrame=function(c){var a,b=this.element.finalTransform.mat,d=this.masksProperties.length;for(a=0;a<d;a+=1)if((this.viewData[a].prop._mdf||c)&&this.drawPath(this.masksProperties[a],this.viewData[a].prop.v,this.viewData[a]),(this.viewData[a].op._mdf||c)&&this.viewData[a].elem.setAttribute("fill-opacity",this.viewData[a].op.v),"n"!==this.masksProperties[a].mode&&(this.viewData[a].invRect&&(this.element.finalTransform.mProp._mdf||c)&&this.viewData[a].invRect.setAttribute("transform",
b.getInverseMatrix().to2dCSS()),this.storedData[a].x&&(this.storedData[a].x._mdf||c))){var e=this.storedData[a].expan;this.storedData[a].x.v<0?("erode"!==this.storedData[a].lastOperator&&(this.storedData[a].lastOperator="erode",this.storedData[a].elem.setAttribute("filter","url("+Ma+"#"+this.storedData[a].filterId+")")),e.setAttribute("radius",-this.storedData[a].x.v)):("dilate"!==this.storedData[a].lastOperator&&(this.storedData[a].lastOperator="dilate",this.storedData[a].elem.setAttribute("filter",
null)),this.storedData[a].elem.setAttribute("stroke-width",2*this.storedData[a].x.v))}};
Fa.prototype.getMaskelement=function(){return this.maskElement};
Fa.prototype.createLayerSolidPath=function(){var c="M0,0 ";return c+=" h"+this.globalData.compSize.w,c+=" v"+this.globalData.compSize.h,c+=" h-"+this.globalData.compSize.w,c+(" v-"+this.globalData.compSize.h+" ")};
Fa.prototype.drawPath=function(c,a,b){var d,e=" M"+a.v[0][0]+","+a.v[0][1];var f=a._length;for(d=1;d<f;d+=1)e+=" C"+a.o[d-1][0]+","+a.o[d-1][1]+" "+a.i[d][0]+","+a.i[d][1]+" "+a.v[d][0]+","+a.v[d][1];if(a.c&&f>1&&(e+=" C"+a.o[d-1][0]+","+a.o[d-1][1]+" "+a.i[0][0]+","+a.i[0][1]+" "+a.v[0][0]+","+a.v[0][1]),b.lastPath!==e)d="",b.elem&&(a.c&&(d=c.inv?this.solidPath+e:e),b.elem.setAttribute("d",d)),b.lastPath=e};
Fa.prototype.destroy=function(){this.masksProperties=this.data=this.maskElement=this.globalData=this.element=null};
var bc=function(){var c={};return c.createFilter=function(a,b){var d=X("filter");d.setAttribute("id",a);!0!==b&&(d.setAttribute("filterUnits","objectBoundingBox"),d.setAttribute("x","0%"),d.setAttribute("y","0%"),d.setAttribute("width","100%"),d.setAttribute("height","100%"));return d},c.createAlphaToLuminanceFilter=function(){var a=X("feColorMatrix");
return a.setAttribute("type","matrix"),a.setAttribute("color-interpolation-filters","sRGB"),a.setAttribute("values","0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 1"),a},c}(),ic=function(){var c={maskType:!0,
svgLumaHidden:!0,offscreenCanvas:"undefined"!=typeof OffscreenCanvas};return(/MSIE 10/i.test(navigator.userAgent)||/MSIE 9/i.test(navigator.userAgent)||/rv:11.0/i.test(navigator.userAgent)||/Edge\/\d./i.test(navigator.userAgent))&&(c.maskType=!1),/firefox/i.test(navigator.userAgent)&&(c.svgLumaHidden=!1),c}(),Uc={},Pc="filter_result_";
La.prototype.renderFrame=function(c){var a,b=this.filters.length;for(a=0;a<b;a+=1)this.filters[a].renderFrame(c)};
La.prototype.getEffects=function(c){var a,b=this.filters.length,d=[];for(a=0;a<b;a+=1)this.filters[a].type===c&&d.push(this.filters[a]);return d};
ib.prototype={initRendererElement:function(){this.layerElement=X("g")},
createContainerElements:function(){this.matteElement=X("g");this.maskedElement=this.transformedElement=this.layerElement;this._sizeChanged=!1;var c=null;if(this.data.td){this.matteMasks={};var a=X("g");a.setAttribute("id",this.layerId);a.appendChild(this.layerElement);c=a;this.globalData.defs.appendChild(a)}else this.data.tt?(this.matteElement.appendChild(this.layerElement),c=this.matteElement,this.baseElement=this.matteElement):this.baseElement=this.layerElement;if(this.data.ln&&this.layerElement.setAttribute("id",
this.data.ln),this.data.cl&&this.layerElement.setAttribute("class",this.data.cl),0===this.data.ty&&!this.data.hd){var b=X("clipPath"),d=X("path");d.setAttribute("d","M0,0 L"+this.data.w+",0 L"+this.data.w+","+this.data.h+" L0,"+this.data.h+"z");a=Ca();(b.setAttribute("id",a),b.appendChild(d),this.globalData.defs.appendChild(b),this.checkMasks())?(b=X("g"),b.setAttribute("clip-path","url("+Ma+"#"+a+")"),b.appendChild(this.layerElement),this.transformedElement=b,c?c.appendChild(this.transformedElement):
this.baseElement=this.transformedElement):this.layerElement.setAttribute("clip-path","url("+Ma+"#"+a+")")}0!==this.data.bm&&this.setBlendMode()},
renderElement:function(){this.finalTransform._localMatMdf&&this.transformedElement.setAttribute("transform",this.finalTransform.localMat.to2dCSS());this.finalTransform._opMdf&&this.transformedElement.setAttribute("opacity",this.finalTransform.localOpacity)},
destroyBaseElement:function(){this.matteElement=this.layerElement=null;this.maskManager.destroy()},
getBaseElement:function(){return this.data.hd?null:this.baseElement},
createRenderableComponents:function(){this.maskManager=new Fa(this.data,this,this.globalData);this.renderableEffectsManager=new La(this);this.searchEffectTransforms()},
getMatte:function(c){if(this.matteMasks||(this.matteMasks={}),!this.matteMasks[c]){var a,b,d,e,f=this.layerId+"_"+c;if(1===c||3===c){var k=X("mask");k.setAttribute("id",f);k.setAttribute("mask-type",3===c?"luminance":"alpha");(d=X("use")).setAttributeNS("http://www.w3.org/1999/xlink","href","#"+this.layerId);k.appendChild(d);this.globalData.defs.appendChild(k);ic.maskType||1!==c||(k.setAttribute("mask-type","luminance"),a=Ca(),b=bc.createFilter(a),this.globalData.defs.appendChild(b),b.appendChild(bc.createAlphaToLuminanceFilter()),
(e=X("g")).appendChild(d),k.appendChild(e),e.setAttribute("filter","url("+Ma+"#"+a+")"))}else if(2===c){k=X("mask");k.setAttribute("id",f);k.setAttribute("mask-type","alpha");var n=X("g");k.appendChild(n);a=Ca();b=bc.createFilter(a);d=X("feComponentTransfer");d.setAttribute("in","SourceGraphic");b.appendChild(d);var h=X("feFuncA");h.setAttribute("type","table");h.setAttribute("tableValues","1.0 0.0");d.appendChild(h);this.globalData.defs.appendChild(b);h=X("rect");h.setAttribute("width",this.comp.data.w);
h.setAttribute("height",this.comp.data.h);h.setAttribute("x","0");h.setAttribute("y","0");h.setAttribute("fill","#ffffff");h.setAttribute("opacity","0");n.setAttribute("filter","url("+Ma+"#"+a+")");n.appendChild(h);(d=X("use")).setAttributeNS("http://www.w3.org/1999/xlink","href","#"+this.layerId);n.appendChild(d);ic.maskType||(k.setAttribute("mask-type","luminance"),b.appendChild(bc.createAlphaToLuminanceFilter()),e=X("g"),n.appendChild(h),e.appendChild(this.layerElement),n.appendChild(e));this.globalData.defs.appendChild(k)}this.matteMasks[c]=
f}return this.matteMasks[c]},
setMatte:function(c){this.matteElement&&this.matteElement.setAttribute("mask","url("+Ma+"#"+c+")")}};
ab.prototype={initHierarchy:function(){this.hierarchy=[];this._isParent=!1;this.checkParenting()},
setHierarchy:function(c){this.hierarchy=c},
setAsParent:function(){this._isParent=!0},
checkParenting:function(){void 0!==this.data.parent&&this.comp.buildElementParenting(this,this.data.parent,[])}};
R([xb,function(c){function a(){}
return a.prototype=c,a}({initElement:function(c,a,b){this.initFrame();
this.initBaseData(c,a,b);this.initTransform(c,a,b);this.initHierarchy();this.initRenderable();this.initRendererElement();this.createContainerElements();this.createRenderableComponents();this.createContent();this.hide()},
hide:function(){this.hidden||this.isInRange&&!this.isTransparent||((this.baseElement||this.layerElement).style.display="none",this.hidden=!0)},
show:function(){this.isInRange&&!this.isTransparent&&(this.data.hd||((this.baseElement||this.layerElement).style.display="block"),this.hidden=!1,this._isFirstFrame=!0)},
renderFrame:function(){this.data.hd||this.hidden||(this.renderTransform(),this.renderRenderable(),this.renderLocalTransform(),this.renderElement(),this.renderInnerContent(),this._isFirstFrame&&(this._isFirstFrame=!1))},
renderInnerContent:function(){},
prepareFrame:function(c){this._mdf=!1;this.prepareRenderableFrame(c);this.prepareProperties(c,this.isInRange);this.checkTransparency()},
destroy:function(){this.innerElem=null;this.destroyBaseElement()}})],Jb);
R([yb,Wa,ib,ab,nb,Jb],ob);ob.prototype.createContent=function(){var c=this.globalData.getAssetsPath(this.assetData);this.innerElem=X("image");this.innerElem.setAttribute("width",this.assetData.w+"px");this.innerElem.setAttribute("height",this.assetData.h+"px");this.innerElem.setAttribute("preserveAspectRatio",this.assetData.pr||this.globalData.renderConfig.imagePreserveAspectRatio);this.innerElem.setAttributeNS("http://www.w3.org/1999/xlink","href",c);this.layerElement.appendChild(this.innerElem)};
ob.prototype.sourceRectAtTime=function(){return this.sourceRect};
kc.prototype={addShapeToModifiers:function(c){var a,b=this.shapeModifiers.length;for(a=0;a<b;a+=1)this.shapeModifiers[a].addShape(c)},
isShapeInAnimatedModifiers:function(c){for(var a=this.shapeModifiers.length;0<a;)if(this.shapeModifiers[0].isAnimatedWithShape(c))return!0;return!1},
renderModifiers:function(){if(this.shapeModifiers.length){var c,a=this.shapes.length;for(c=0;c<a;c+=1)this.shapes[c].sh.reset();for(c=this.shapeModifiers.length-1;c>=0&&!this.shapeModifiers[c].processShapes(this._isFirstFrame);--c);}},
searchProcessedElement:function(c){for(var a=this.processedElements,b=0,d=a.length;b<d;){if(a[b].elem===c)return a[b].pos;b+=1}return 0},
addProcessedElement:function(c,a){for(var b=this.processedElements,d=b.length;d;)if(b[--d].elem===c)return void(b[d].pos=a);b.push(new jc(c,a))},
prepareFrame:function(c){this.prepareRenderableFrame(c);this.prepareProperties(c,this.isInRange)}};
var id={1:"butt",2:"round",3:"square"},sd={1:"miter",2:"round",3:"bevel"};lc.prototype.setAsAnimated=function(){this._isAnimated=!0};
zd.prototype.reset=function(){this.d="";this._mdf=!1};
Bc.prototype.getValue=function(c){if((this.elem.globalData.frameId!==this.frameId||c)&&(this.frameId=this.elem.globalData.frameId,this.iterateDynamicProperties(),this._mdf=this._mdf||c,this._mdf)){var a=this.dataProps.length;"svg"===this.renderer&&(this.dashStr="");for(c=0;c<a;c+=1)"o"!==this.dataProps[c].n?"svg"===this.renderer?this.dashStr+=" "+this.dataProps[c].p.v:this.dashArray[c]=this.dataProps[c].p.v:this.dashoffset[0]=this.dataProps[c].p.v}};
R([Pa],Bc);R([Pa],jd);R([Pa],kd);R([Pa],Cc);mc.prototype.comparePoints=function(c,a){for(var b=0,d=this.o.length/2;b<d;){if(Math.abs(c[4*b]-c[4*a+2*b])>.01)return!1;b+=1}return!0};
mc.prototype.checkCollapsable=function(){if(this.o.length/2!=this.c.length/4)return!1;if(this.data.k.k[0].s)for(var c=0,a=this.data.k.k.length;c<a;){if(!this.comparePoints(this.data.k.k[c].s,this.data.p))return!1;c+=1}else if(!this.comparePoints(this.data.k.k,this.data.p))return!1;return!0};
mc.prototype.getValue=function(c){if(this.prop.getValue(),this._mdf=!1,this._cmdf=!1,this._omdf=!1,this.prop._mdf||c){var a,b=4*this.data.p;for(a=0;a<b;a+=1){var d=a%4==0?100:255;d=Math.round(this.prop.v[a]*d);this.c[a]!==d&&(this.c[a]=d,this._cmdf=!c)}if(this.o.length)for(b=this.prop.v.length,a=4*this.data.p;a<b;a+=1)d=a%2==0?Math.round(100*this.prop.v[a]):this.prop.v[a],this.o[a-4*this.data.p]!==d&&(this.o[a-4*this.data.p]=d,this._omdf=!c);this._mdf=!c}};
R([Pa],mc);Kb.prototype.initGradientData=function(c,a,b){this.o=Q.getProp(c,a.o,0,.01,this);this.s=Q.getProp(c,a.s,1,null,this);this.e=Q.getProp(c,a.e,1,null,this);this.h=Q.getProp(c,a.h||{k:0},0,.01,this);this.a=Q.getProp(c,a.a||{k:0},0,qa,this);this.g=new mc(c,a.g,this);this.style=b;this.stops=[];this.setGradientData(b.pElem,a);this.setGradientOpacity(a,b);this._isAnimated=!!this._isAnimated};
Kb.prototype.setGradientData=function(c,a){var b=Ca(),d=X(1===a.t?"linearGradient":"radialGradient");d.setAttribute("id",b);d.setAttribute("spreadMethod","pad");d.setAttribute("gradientUnits","userSpaceOnUse");var e,f=[];var k=4*a.g.p;for(e=0;e<k;e+=4){var n=X("stop");d.appendChild(n);f.push(n)}c.setAttribute("gf"===a.ty?"fill":"stroke","url("+Ma+"#"+b+")");this.gf=d;this.cst=f};
Kb.prototype.setGradientOpacity=function(c,a){if(this.g._hasOpacity&&!this.g._collapsable){var b,d,e=X("mask"),f=X("path");e.appendChild(f);var k=Ca(),n=Ca();e.setAttribute("id",n);var h=X(1===c.t?"linearGradient":"radialGradient");h.setAttribute("id",k);h.setAttribute("spreadMethod","pad");h.setAttribute("gradientUnits","userSpaceOnUse");var g=c.g.k.k[0].s?c.g.k.k[0].s.length:c.g.k.k.length;var q=this.stops;for(d=4*c.g.p;d<g;d+=2)(b=X("stop")).setAttribute("stop-color","rgb(255,255,255)"),h.appendChild(b),
q.push(b);f.setAttribute("gf"===c.ty?"fill":"stroke","url("+Ma+"#"+k+")");"gs"===c.ty&&(f.setAttribute("stroke-linecap",id[c.lc||2]),f.setAttribute("stroke-linejoin",sd[c.lj||2]),1===c.lj&&f.setAttribute("stroke-miterlimit",c.ml));this.of=h;this.ms=e;this.ost=q;this.maskId=n;a.msElem=f}};
R([Pa],Kb);R([Kb,Pa],ld);var td=function(c,a,b,d){if(0===a)return"";var e=c.o,f=c.i,k=c.v,n=" M"+d.applyToPointStringified(k[0][0],k[0][1]);for(c=1;c<a;c+=1)n+=" C"+d.applyToPointStringified(e[c-1][0],e[c-1][1])+" "+d.applyToPointStringified(f[c][0],f[c][1])+" "+d.applyToPointStringified(k[c][0],k[c][1]);return b&&a&&(n+=" C"+d.applyToPointStringified(e[c-1][0],e[c-1][1])+" "+d.applyToPointStringified(f[0][0],f[0][1])+" "+d.applyToPointStringified(k[0][0],k[0][1]),n+="z"),n},Cd=function(){function c(g,
q,r){(r||q.transform.op._mdf)&&q.transform.container.setAttribute("opacity",q.transform.op.v);
(r||q.transform.mProps._mdf)&&q.transform.container.setAttribute("transform",q.transform.mProps.v.to2dCSS())}
function a(){}
function b(g,q,r){var v,p,l,m,t,u=q.styles.length,w=q.lvl;for(m=0;m<u;m+=1){if(p=q.sh._mdf||r,q.styles[m].lvl<w){var x=h.reset();var D=w-q.styles[m].lvl;for(v=q.transformers.length-1;!p&&D>0;)p=q.transformers[v].mProps._mdf||p,--D,--v;if(p)for(D=w-q.styles[m].lvl,v=q.transformers.length-1;D>0;)x.multiply(q.transformers[v].mProps.v),--D,--v}else x=n;if(v=(t=q.sh.paths)._length,p){var K="";for(D=0;D<v;D+=1)(l=t.shapes[D])&&l._length&&(K+=td(l,l._length,l.c,x));q.caches[m]=K}else K=q.caches[m];q.styles[m].d+=
!0===g.hd?"":K;q.styles[m]._mdf=p||q.styles[m]._mdf}}
function d(g,q,r){g=q.style;(q.c._mdf||r)&&g.pElem.setAttribute("fill","rgb("+Ab(q.c.v[0])+","+Ab(q.c.v[1])+","+Ab(q.c.v[2])+")");(q.o._mdf||r)&&g.pElem.setAttribute("fill-opacity",q.o.v)}
function e(g,q,r){f(g,q,r);k(g,q,r)}
function f(g,q,r){var v,p,l=q.gf,m=q.g._hasOpacity,t=q.s.v,u=q.e.v;if(q.o._mdf||r){var w="gf"===g.ty?"fill-opacity":"stroke-opacity";q.style.pElem.setAttribute(w,q.o.v)}if(q.s._mdf||r){w=1===g.t?"x1":"cx";var x="x1"===w?"y1":"cy";l.setAttribute(w,t[0]);l.setAttribute(x,t[1]);m&&!q.g._collapsable&&(q.of.setAttribute(w,t[0]),q.of.setAttribute(x,t[1]))}if(q.g._cmdf||r){w=q.cst;var D=q.g.c;var K=w.length;for(x=0;x<K;x+=1)(v=w[x]).setAttribute("offset",D[4*x]+"%"),v.setAttribute("stop-color","rgb("+D[4*
x+1]+","+D[4*x+2]+","+D[4*x+3]+")")}if(m&&(q.g._omdf||r))for(D=q.g.o,K=(w=q.g._collapsable?q.cst:q.ost).length,x=0;x<K;x+=1)v=w[x],q.g._collapsable||v.setAttribute("offset",D[2*x]+"%"),v.setAttribute("stop-opacity",D[2*x+1]);if(1===g.t)(q.e._mdf||r)&&(l.setAttribute("x2",u[0]),l.setAttribute("y2",u[1]),m&&!q.g._collapsable&&(q.of.setAttribute("x2",u[0]),q.of.setAttribute("y2",u[1])));else if((q.s._mdf||q.e._mdf||r)&&(p=Math.sqrt(Math.pow(t[0]-u[0],2)+Math.pow(t[1]-u[1],2)),l.setAttribute("r",p),m&&
!q.g._collapsable&&q.of.setAttribute("r",p)),q.e._mdf||q.h._mdf||q.a._mdf||r)p||(p=Math.sqrt(Math.pow(t[0]-u[0],2)+Math.pow(t[1]-u[1],2))),g=Math.atan2(u[1]-t[1],u[0]-t[0]),r=q.h.v,r>=1?r=.99:r<=-1&&(r=-.99),r*=p,p=Math.cos(g+q.a.v)*r+t[0],t=Math.sin(g+q.a.v)*r+t[1],l.setAttribute("fx",p),l.setAttribute("fy",t),m&&!q.g._collapsable&&(q.of.setAttribute("fx",p),q.of.setAttribute("fy",t))}
function k(g,q,r){g=q.style;var v=q.d;v&&(v._mdf||r)&&v.dashStr&&(g.pElem.setAttribute("stroke-dasharray",v.dashStr),g.pElem.setAttribute("stroke-dashoffset",v.dashoffset[0]));q.c&&(q.c._mdf||r)&&g.pElem.setAttribute("stroke","rgb("+Ab(q.c.v[0])+","+Ab(q.c.v[1])+","+Ab(q.c.v[2])+")");(q.o._mdf||r)&&g.pElem.setAttribute("stroke-opacity",q.o.v);(q.w._mdf||r)&&(g.pElem.setAttribute("stroke-width",q.w.v),g.msElem&&g.msElem.setAttribute("stroke-width",q.w.v))}
var n=new Ja,h=new Ja;return{createRenderFunction:function(g){switch(g.ty){case "fl":return d;case "gf":return f;case "gs":return e;case "st":return k;case "sh":case "el":case "rc":case "sr":return b;case "tr":return c;case "no":return a;default:return null}}}}();
R([yb,Wa,ib,kc,ab,nb,Jb],Ba);Ba.prototype.initSecondaryElement=function(){};
Ba.prototype.identityMatrix=new Ja;Ba.prototype.buildExpressionInterface=function(){};
Ba.prototype.createContent=function(){this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,0,[],!0);this.filterUniqueShapes()};
Ba.prototype.filterUniqueShapes=function(){var c,a,b,d=this.shapes.length,e=this.stylesList.length,f=[];for(b=0;b<e;b+=1){var k=this.stylesList[b];var n=!1;for(c=f.length=0;c<d;c+=1)-1!==(a=this.shapes[c]).styles.indexOf(k)&&(f.push(a),n=a._isAnimated||n);f.length>1&&n&&this.setShapesAsAnimated(f)}};
Ba.prototype.setShapesAsAnimated=function(c){var a,b=c.length;for(a=0;a<b;a+=1)c[a].setAsAnimated()};
Ba.prototype.createStyleElement=function(c,a){a=new zd(c,a);var b=a.pElem;if("st"===c.ty)var d=new jd(this,c,a);else"fl"===c.ty?d=new kd(this,c,a):"gf"===c.ty||"gs"===c.ty?(d=new ("gf"===c.ty?Kb:ld)(this,c,a),this.globalData.defs.appendChild(d.gf),d.maskId&&(this.globalData.defs.appendChild(d.ms),this.globalData.defs.appendChild(d.of),b.setAttribute("mask","url("+Ma+"#"+d.maskId+")"))):"no"===c.ty&&(d=new Cc(this,c,a));return"st"!==c.ty&&"gs"!==c.ty||(b.setAttribute("stroke-linecap",id[c.lc||2]),
b.setAttribute("stroke-linejoin",sd[c.lj||2]),b.setAttribute("fill-opacity","0"),1===c.lj&&b.setAttribute("stroke-miterlimit",c.ml)),2===c.r&&b.setAttribute("fill-rule","evenodd"),c.ln&&b.setAttribute("id",c.ln),c.cl&&b.setAttribute("class",c.cl),c.bm&&(b.style["mix-blend-mode"]=ub(c.bm)),this.stylesList.push(a),this.addToAnimatedContents(c,d),d};
Ba.prototype.createGroupElement=function(c){var a=new Dc;return c.ln&&a.gr.setAttribute("id",c.ln),c.cl&&a.gr.setAttribute("class",c.cl),c.bm&&(a.gr.style["mix-blend-mode"]=ub(c.bm)),a};
Ba.prototype.createTransformElement=function(c,a){var b=rd.getTransformProperty(this,c,this);a=new nc(b,b.o,a);return this.addToAnimatedContents(c,a),a};
Ba.prototype.createShapeElement=function(c,a,b){var d=4;"rc"===c.ty?d=5:"el"===c.ty?d=6:"sr"===c.ty&&(d=7);a=new lc(a,b,ja.getShapeProp(this,c,d,this));return this.shapes.push(a),this.addShapeToModifiers(a),this.addToAnimatedContents(c,a),a};
Ba.prototype.addToAnimatedContents=function(c,a){for(var b=0,d=this.animatedContents.length;b<d;){if(this.animatedContents[b].element===a)return;b+=1}this.animatedContents.push({fn:Cd.createRenderFunction(c),element:a,data:c})};
Ba.prototype.setElementStyles=function(c){var a=c.styles,b=this.stylesList.length;for(c=0;c<b;c+=1)this.stylesList[c].closed||a.push(this.stylesList[c])};
Ba.prototype.reloadShapes=function(){var c;this._isFirstFrame=!0;var a=this.itemsData.length;for(c=0;c<a;c+=1)this.prevViewData[c]=this.itemsData[c];this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,0,[],!0);this.filterUniqueShapes();a=this.dynamicProperties.length;for(c=0;c<a;c+=1)this.dynamicProperties[c].getValue();this.renderModifiers()};
Ba.prototype.searchShapes=function(c,a,b,d,e,f,k){var n,h,g,q=[].concat(f);var r=c.length-1;var v=[],p=[];for(f=r;f>=0;--f){if((g=this.searchProcessedElement(c[f]))?a[f]=b[g-1]:c[f]._render=k,"fl"===c[f].ty||"st"===c[f].ty||"gf"===c[f].ty||"gs"===c[f].ty||"no"===c[f].ty)g?a[f].style.closed=!1:a[f]=this.createStyleElement(c[f],e),c[f]._render&&a[f].style.pElem.parentNode!==d&&d.appendChild(a[f].style.pElem),v.push(a[f].style);else if("gr"===c[f].ty){if(g){var l=a[f].it.length;for(r=0;r<l;r+=1)a[f].prevViewData[r]=
a[f].it[r]}else a[f]=this.createGroupElement(c[f]);this.searchShapes(c[f].it,a[f].it,a[f].prevViewData,a[f].gr,e+1,q,k);c[f]._render&&a[f].gr.parentNode!==d&&d.appendChild(a[f].gr)}else"tr"===c[f].ty?(g||(a[f]=this.createTransformElement(c[f],d)),n=a[f].transform,q.push(n)):"sh"===c[f].ty||"rc"===c[f].ty||"el"===c[f].ty||"sr"===c[f].ty?(g||(a[f]=this.createShapeElement(c[f],q,e)),this.setElementStyles(a[f])):"tm"===c[f].ty||"rd"===c[f].ty||"ms"===c[f].ty||"pb"===c[f].ty||"zz"===c[f].ty||"op"===c[f].ty?
(g?(h=a[f]).closed=!1:((h=tb.getModifier(c[f].ty)).init(this,c[f]),a[f]=h,this.shapeModifiers.push(h)),p.push(h)):"rp"===c[f].ty&&(g?(h=a[f]).closed=!0:(h=tb.getModifier(c[f].ty),a[f]=h,h.init(this,c,f,a),this.shapeModifiers.push(h),k=!1),p.push(h));this.addProcessedElement(c[f],f+1)}r=v.length;for(f=0;f<r;f+=1)v[f].closed=!0;r=p.length;for(f=0;f<r;f+=1)p[f].closed=!0};
Ba.prototype.renderInnerContent=function(){var c;this.renderModifiers();var a=this.stylesList.length;for(c=0;c<a;c+=1)this.stylesList[c].reset();this.renderShape();for(c=0;c<a;c+=1)(this.stylesList[c]._mdf||this._isFirstFrame)&&(this.stylesList[c].msElem&&(this.stylesList[c].msElem.setAttribute("d",this.stylesList[c].d),this.stylesList[c].d="M0 0"+this.stylesList[c].d),this.stylesList[c].pElem.setAttribute("d",this.stylesList[c].d||"M0 0"))};
Ba.prototype.renderShape=function(){var c,a=this.animatedContents.length;for(c=0;c<a;c+=1){var b=this.animatedContents[c];(this._isFirstFrame||b.element._isAnimated)&&!0!==b.data&&b.fn(b.data,b.element,this._isFirstFrame)}};
Ba.prototype.destroy=function(){this.destroyBaseElement();this.itemsData=this.shapesData=null};
md.prototype.update=function(c,a,b,d,e,f){this._mdf.o=!1;this._mdf.sw=!1;this._mdf.sc=!1;this._mdf.fc=!1;this._mdf.m=!1;var k=this._mdf.p=!1;return this.o!==c&&(this.o=c,this._mdf.o=!0,k=!0),this.sw!==a&&(this.sw=a,this._mdf.sw=!0,k=!0),this.sc!==b&&(this.sc=b,this._mdf.sc=!0,k=!0),this.fc!==d&&(this.fc=d,this._mdf.fc=!0,k=!0),this.m!==e&&(this.m=e,this._mdf.m=!0,k=!0),!f.length||this.p[0]===f[0]&&this.p[1]===f[1]&&this.p[4]===f[4]&&this.p[5]===f[5]&&this.p[12]===f[12]&&this.p[13]===f[13]||(this.p=
f,this._mdf.p=!0,k=!0),k};
Sa.prototype.defaultBoxWidth=[0,0];Sa.prototype.copyData=function(c,a){for(var b in a)Object.prototype.hasOwnProperty.call(a,b)&&(c[b]=a[b]);return c};
Sa.prototype.setCurrentData=function(c){c.__complete||this.completeTextData(c);this.currentData=c;this.currentData.boxWidth=this.currentData.boxWidth||this.defaultBoxWidth;this._mdf=!0};
Sa.prototype.searchProperty=function(){return this.searchKeyframes()};
Sa.prototype.searchKeyframes=function(){return this.kf=this.data.d.k.length>1,this.kf&&this.addEffect(this.getKeyframeValue.bind(this)),this.kf};
Sa.prototype.addEffect=function(c){this.effectsSequence.push(c);this.elem.addDynamicProperty(this)};
Sa.prototype.getValue=function(c){if(this.elem.globalData.frameId!==this.frameId&&this.effectsSequence.length||c){this.currentData.t=this.data.d.k[this.keysIndex].s.t;var a=this.currentData,b=this.keysIndex;if(this.lock)this.setCurrentData(this.currentData);else{this.lock=!0;this._mdf=!1;var d=this.effectsSequence.length,e=c||this.data.d.k[this.keysIndex].s;for(c=0;c<d;c+=1)e=b!==this.keysIndex?this.effectsSequence[c](e,e.t):this.effectsSequence[c](this.currentData,e.t);a!==e&&this.setCurrentData(e);
this.pv=this.v=this.currentData;this.lock=!1;this.frameId=this.elem.globalData.frameId}}};
Sa.prototype.getKeyframeValue=function(){for(var c=this.data.d.k,a=this.elem.comp.renderedFrame,b=0,d=c.length;b<=d-1&&!(b===d-1||c[b+1].t>a);)b+=1;return this.keysIndex!==b&&(this.keysIndex=b),this.data.d.k[this.keysIndex].s};
Sa.prototype.buildFinalText=function(c){for(var a,b,d=[],e=0,f=c.length,k,n=!1,h;e<f;)k=n,n=!1,a=c.charCodeAt(e),h=c.charAt(e),Va.isCombinedCharacter(a)?k=!0:a>=55296&&a<=56319?Va.isRegionalFlag(c,e)?h=c.substr(e,14):(b=c.charCodeAt(e+1))>=56320&&b<=57343&&(Va.isModifier(a,b)?(h=c.substr(e,2),k=!0):h=Va.isFlagEmoji(c.substr(e,4))?c.substr(e,4):c.substr(e,2)):a>56319?(b=c.charCodeAt(e+1),Va.isVariationSelector(a)&&(k=!0)):Va.isZeroWidthJoiner(a)&&(k=!0,n=!0),k?d[d.length-1]+=h:d.push(h),e+=h.length;
return d};
Sa.prototype.completeTextData=function(c){c.__complete=!0;var a,b,d=this.elem.globalData.fontManager,e=this.data,f=[],k=0,n=e.m.g,h=0,g=0,q=0,r=[],v=0,p=d.getFontByName(c.f),l=0;var m=gd(p);c.fWeight=m.weight;c.fStyle=m.style;c.finalSize=c.s;c.finalText=this.buildFinalText(c.t);var t=c.finalText.length;c.finalLineHeight=c.lh;var u=c.tr/1E3*c.finalSize;if(c.sz)for(var w,x,D=!0,K=c.sz[0],J=c.sz[1];D;){var F=w=0;t=(x=this.buildFinalText(c.t)).length;u=c.tr/1E3*c.finalSize;var G=-1;for(m=0;m<t;m+=1){var B=
x[m].charCodeAt(0);var z=!1;" "===x[m]?G=m:13!==B&&3!==B||(F=0,z=!0,w+=c.finalLineHeight||1.2*c.finalSize);d.chars?(b=d.getCharData(x[m],p.fStyle,p.fFamily),l=z?0:b.w*c.finalSize/100):l=d.measureText(x[m],c.f,c.finalSize);F+l>K&&" "!==x[m]?(-1===G?t+=1:m=G,w+=c.finalLineHeight||1.2*c.finalSize,x.splice(m,G===m?1:0,"\r"),G=-1,F=0):(F+=l,F+=u)}w+=p.ascent*c.finalSize/100;this.canResize&&c.finalSize>this.minimumFontSize&&J<w?(--c.finalSize,c.finalLineHeight=c.finalSize*c.lh/c.s):(c.finalText=x,t=c.finalText.length,
D=!1)}F=-u;l=0;var y;for(m=w=0;m<t;m+=1)if(z=!1,13===(B=(y=c.finalText[m]).charCodeAt(0))||3===B?(w=0,r.push(F),v=F>v?F:v,F=-2*u,a="",z=!0,q+=1):a=y,d.chars?(b=d.getCharData(y,p.fStyle,d.getFontByName(c.f).fFamily),l=z?0:b.w*c.finalSize/100):l=d.measureText(a,c.f,c.finalSize)," "===y?w+=l+u:(F+=l+u+w,w=0),f.push({l:l,an:l,add:h,n:z,anIndexes:[],val:a,line:q,animatorJustifyOffset:0}),2==n){if(h+=l,""===a||" "===a||m===t-1){for(""!==a&&" "!==a||(h-=l);g<=m;)f[g].an=h,f[g].ind=k,f[g].extra=l,g+=1;k+=
1;h=0}}else if(3==n){if(h+=l,""===a||m===t-1){for(""===a&&(h-=l);g<=m;)f[g].an=h,f[g].ind=k,f[g].extra=l,g+=1;h=0;k+=1}}else f[k].ind=k,f[k].extra=0,k+=1;if(c.l=f,v=F>v?F:v,r.push(F),c.sz)c.boxWidth=c.sz[0],c.justifyOffset=0;else switch(c.boxWidth=v,c.j){case 1:c.justifyOffset=-c.boxWidth;break;case 2:c.justifyOffset=-c.boxWidth/2;break;default:c.justifyOffset=0}c.lineWidths=r;var C;d=e.a;a=d.length;k=[];for(z=0;z<a;z+=1){(b=d[z]).a.sc&&(c.strokeColorAnim=!0);b.a.sw&&(c.strokeWidthAnim=!0);(b.a.fc||
b.a.fh||b.a.fs||b.a.fb)&&(c.fillColorAnim=!0);h=0;n=b.s.b;for(m=0;m<t;m+=1)(C=f[m]).anIndexes[z]=h,(1==n&&""!==C.val||2==n&&""!==C.val&&" "!==C.val||3==n&&(C.n||" "==C.val||m==t-1)||4==n&&(C.n||m==t-1))&&(1===b.s.rn&&k.push(h),h+=1);e.a[z].s.totalChars=h;var N;n=-1;if(1===b.s.rn)for(m=0;m<t;m+=1)n!=(C=f[m]).anIndexes[z]&&(n=C.anIndexes[z],N=k.splice(Math.floor(Math.random()*k.length),1)[0]),C.anIndexes[z]=N}c.yOffset=c.finalLineHeight||1.2*c.finalSize;c.ls=c.ls||0;c.ascent=p.ascent*c.finalSize/100};
Sa.prototype.updateDocumentData=function(c,a){a=void 0===a?this.keysIndex:a;var b=this.copyData({},this.data.d.k[a].s);b=this.copyData(b,c);this.data.d.k[a].s=b;this.recalculate(a);this.setCurrentData(b);this.elem.addDynamicProperty(this)};
Sa.prototype.recalculate=function(c){c=this.data.d.k[c].s;c.__complete=!1;this.keysIndex=0;this._isFirstFrame=!0;this.getValue(c)};
Sa.prototype.canResizeFont=function(c){this.canResize=c;this.recalculate(this.keysIndex);this.elem.addDynamicProperty(this)};
Sa.prototype.setMinimumFontSize=function(c){this.minimumFontSize=Math.floor(c)||1;this.recalculate(this.keysIndex);this.elem.addDynamicProperty(this)};
var Pd=function(){function c(e,f){this._currentTextLength=-1;this.k=!1;this.data=f;this.elem=e;this.comp=e.comp;this.finalE=this.finalS=0;this.initDynamicPropertyContainer(e);this.s=Q.getProp(e,f.s||{k:0},0,0,this);this.e="e"in f?Q.getProp(e,f.e,0,0,this):{v:100};this.o=Q.getProp(e,f.o||{k:0},0,0,this);this.xe=Q.getProp(e,f.xe||{k:0},0,0,this);this.ne=Q.getProp(e,f.ne||{k:0},0,0,this);this.sm=Q.getProp(e,f.sm||{k:100},0,0,this);this.a=Q.getProp(e,f.a,0,.01,this);this.dynamicProperties.length||this.getValue()}
var a=Math.max,b=Math.min,d=Math.floor;return c.prototype={getMult:function(e){this._currentTextLength!==this.elem.textProperty.currentData.l.length&&this.getValue();var f=0,k=0,n=1,h=1;this.ne.v>0?f=this.ne.v/100:k=-this.ne.v/100;this.xe.v>0?n=1-this.xe.v/100:h=1+this.xe.v/100;f=kb.getBezierEasing(f,k,n,h).get;k=0;n=this.finalS;h=this.finalE;var g=this.data.sh;2===g?k=f(k=h===n?e>=h?1:0:a(0,b(.5/(h-n)+(e-n)/(h-n),1))):3===g?k=f(k=h===n?e>=h?0:1:1-a(0,b(.5/(h-n)+(e-n)/(h-n),1))):4===g?(h===n?k=0:
(k=a(0,b(.5/(h-n)+(e-n)/(h-n),1)))<.5?k*=2:k=1-2*(k-.5),k=f(k)):5===g?(h===n?k=0:(k=h-n,e=-k/2+b(a(0,e+.5-n),h-n),k/=2,k=Math.sqrt(1-e*e/(k*k))),k=f(k)):6===g?(h===n?k=0:(e=b(a(0,e+.5-n),h-n),k=(1+Math.cos(Math.PI+2*Math.PI*e/(h-n)))/2),k=f(k)):(e>=d(n)&&(k=a(0,b(e-n<0?b(h,1)-(n-e):h-e,1))),k=f(k));100!==this.sm.v&&(e=.01*this.sm.v,0===e&&(e=1E-8),f=.5-.5*e,k<f?k=0:(k=(k-f)/e)>1&&(k=1));return k*this.a.v},
getValue:function(e){this.iterateDynamicProperties();this._mdf=e||this._mdf;this._currentTextLength=this.elem.textProperty.currentData.l.length||0;e&&2===this.data.r&&(this.e.v=this._currentTextLength);var f=2===this.data.r?1:100/this.data.totalChars,k=this.o.v/f;e=this.s.v/f+k;f=this.e.v/f+k;e>f&&(k=e,e=f,f=k);this.finalS=e;this.finalE=f}},R([Pa],c),{getTextSelectorProp:function(e,f,k){return new c(e,f,k)}}}();
pb.prototype.searchProperties=function(){var c,a=this._textData.a.length,b=Q.getProp;for(c=0;c<a;c+=1){var d=this._textData.a[c];this._animatorsData[c]=new Ga(this._elem,d,this)}this._textData.p&&"m"in this._textData.p?(this._pathData={a:b(this._elem,this._textData.p.a,0,0,this),f:b(this._elem,this._textData.p.f,0,0,this),l:b(this._elem,this._textData.p.l,0,0,this),r:b(this._elem,this._textData.p.r,0,0,this),p:b(this._elem,this._textData.p.p,0,0,this),m:this._elem.maskManager.getMaskProperty(this._textData.p.m)},
this._hasMaskedPath=!0):this._hasMaskedPath=!1;this._moreOptions.alignment=b(this._elem,this._textData.m.a,1,0,this)};
pb.prototype.getMeasures=function(c,a){if(this.lettersChangedFlag=a,this._mdf||this._isFirstFrame||a||this._hasMaskedPath&&this._pathData.m._mdf){this._isFirstFrame=!1;var b,d,e,f,k,n,h,g,q,r,v=this._moreOptions.alignment.v,p=this._animatorsData,l=this._textData,m=this.mHelper,t=this._renderType,u=this.renderedLetters.length,w=c.l;if(this._hasMaskedPath){if(r=this._pathData.m,!this._pathData.n||this._pathData._mdf){var x=r.v;this._pathData.r.v&&(x=x.reverse());var D={tLength:0,segments:[]};var K=
x._length-1;for(a=g=0;a<K;a+=1){var J=Xa.buildBezierData(x.v[a],x.v[a+1],[x.o[a][0]-x.v[a][0],x.o[a][1]-x.v[a][1]],[x.i[a+1][0]-x.v[a+1][0],x.i[a+1][1]-x.v[a+1][1]]);D.tLength+=J.segmentLength;D.segments.push(J);g+=J.segmentLength}a=K;r.v.c&&(J=Xa.buildBezierData(x.v[a],x.v[0],[x.o[a][0]-x.v[a][0],x.o[a][1]-x.v[a][1]],[x.i[0][0]-x.v[0][0],x.i[0][1]-x.v[0][1]]),D.tLength+=J.segmentLength,D.segments.push(J),g+=J.segmentLength);this._pathData.pi=D}if(D=this._pathData.pi,b=this._pathData.f.v,k=0,f=1,
d=0,h=D.segments,b<0&&r.v.c)for(D.tLength<Math.abs(b)&&(b=-Math.abs(b)%D.tLength),f=(n=h[k=h.length-1].points).length-1;b<0;)b+=n[f].partialLength,--f<0&&(f=(n=h[--k].points).length-1);var F=(n=h[k].points)[f-1];var G=(x=n[f]).partialLength}K=w.length;J=D=0;var B,z,y,C=1.2*c.finalSize*.714,N=!0;var P=p.length;var ea,ia,S,H,A,E,M,Z,fa,aa=-1,ha=b,da=k,Y=f,na=-1,sa="",L=this.defaultPropsArray;if(2===c.j||1===c.j){var I=S=0;var ca=2===c.j?-.5:-1;var xa=0,V=!0;for(a=0;a<K;a+=1)if(w[a].n){for(S&&(S+=I);xa<
a;)w[xa].animatorJustifyOffset=S,xa+=1;S=0;V=!0}else{for(e=0;e<P;e+=1)(B=p[e].a).t.propType&&(V&&2===c.j&&(I+=B.t.v*ca),(y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars)).length?S+=B.t.v*y[0]*ca:S+=B.t.v*y*ca);V=!1}for(S&&(S+=I);xa<a;)w[xa].animatorJustifyOffset=S,xa+=1}for(a=0;a<K;a+=1){if(m.reset(),S=1,w[a].n)D=0,J+=c.yOffset,J+=N?1:0,b=ha,N=!1,this._hasMaskedPath&&(f=Y,F=(n=h[k=da].points)[f-1],G=(x=n[f]).partialLength,d=0),e=M=fa=sa="",L=this.defaultPropsArray;else{if(this._hasMaskedPath){if(na!==
w[a].line){switch(c.j){case 1:b+=g-c.lineWidths[w[a].line];break;case 2:b+=(g-c.lineWidths[w[a].line])/2}na=w[a].line}aa!==w[a].ind&&(w[aa]&&(b+=w[aa].extra),b+=w[a].an/2,aa=w[a].ind);b+=v[0]*w[a].an*.005;for(e=I=0;e<P;e+=1)(B=p[e].a).p.propType&&((y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars)).length?I+=B.p.v[0]*y[0]:I+=B.p.v[0]*y),B.a.propType&&((y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars)).length?I+=B.a.v[0]*y[0]:I+=B.a.v[0]*y);e=!0;for(this._pathData.a.v&&(b=.5*w[0].an+(g-
this._pathData.f.v-.5*w[0].an-.5*w[w.length-1].an)*aa/(K-1),b+=this._pathData.f.v);e;)d+G>=b+I||!n?(q=(b+I-d)/x.partialLength,ea=F.point[0]+(x.point[0]-F.point[0])*q,ia=F.point[1]+(x.point[1]-F.point[1])*q,m.translate(-v[0]*w[a].an*.005,-v[1]*C*.01),e=!1):n&&(d+=x.partialLength,(f+=1)>=n.length&&(f=0,h[k+=1]?n=h[k].points:r.v.c?(f=0,n=h[k=0].points):(d-=x.partialLength,n=null)),n&&(F=x,G=(x=n[f]).partialLength));I=w[a].an/2-w[a].add;m.translate(-I,0,0)}else I=w[a].an/2-w[a].add,m.translate(-I,0,0),
m.translate(-v[0]*w[a].an*.005,-v[1]*C*.01,0);for(e=0;e<P;e+=1)(B=p[e].a).t.propType&&(y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars),0===D&&0===c.j||(this._hasMaskedPath?y.length?b+=B.t.v*y[0]:b+=B.t.v*y:y.length?D+=B.t.v*y[0]:D+=B.t.v*y));c.strokeWidthAnim&&(A=c.sw||0);c.strokeColorAnim&&(H=c.sc?[c.sc[0],c.sc[1],c.sc[2]]:[0,0,0]);c.fillColorAnim&&c.fc&&(E=[c.fc[0],c.fc[1],c.fc[2]]);for(e=0;e<P;e+=1)(B=p[e].a).a.propType&&((y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars)).length?
m.translate(-B.a.v[0]*y[0],-B.a.v[1]*y[1],B.a.v[2]*y[2]):m.translate(-B.a.v[0]*y,-B.a.v[1]*y,B.a.v[2]*y));for(e=0;e<P;e+=1)(B=p[e].a).s.propType&&((y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars)).length?m.scale(1+(B.s.v[0]-1)*y[0],1+(B.s.v[1]-1)*y[1],1):m.scale(1+(B.s.v[0]-1)*y,1+(B.s.v[1]-1)*y,1));for(e=0;e<P;e+=1){if(B=p[e].a,y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars),B.sk.propType&&(y.length?m.skewFromAxis(-B.sk.v*y[0],B.sa.v*y[1]):m.skewFromAxis(-B.sk.v*y,B.sa.v*y)),B.r.propType&&
(y.length?m.rotateZ(-B.r.v*y[2]):m.rotateZ(-B.r.v*y)),B.ry.propType&&(y.length?m.rotateY(B.ry.v*y[1]):m.rotateY(B.ry.v*y)),B.rx.propType&&(y.length?m.rotateX(B.rx.v*y[0]):m.rotateX(B.rx.v*y)),B.o.propType&&(y.length?S+=(B.o.v*y[0]-S)*y[0]:S+=(B.o.v*y-S)*y),c.strokeWidthAnim&&B.sw.propType&&(y.length?A+=B.sw.v*y[0]:A+=B.sw.v*y),c.strokeColorAnim&&B.sc.propType)for(ca=0;ca<3;ca+=1)y.length?H[ca]+=(B.sc.v[ca]-H[ca])*y[0]:H[ca]+=(B.sc.v[ca]-H[ca])*y;if(c.fillColorAnim&&c.fc){if(B.fc.propType)for(ca=0;ca<
3;ca+=1)y.length?E[ca]+=(B.fc.v[ca]-E[ca])*y[0]:E[ca]+=(B.fc.v[ca]-E[ca])*y;B.fh.propType&&(E=y.length?$c(E,B.fh.v*y[0]):$c(E,B.fh.v*y));B.fs.propType&&(E=y.length?Hc(E,B.fs.v*y[0]):Hc(E,B.fs.v*y));B.fb.propType&&(E=y.length?Zc(E,B.fb.v*y[0]):Zc(E,B.fb.v*y))}}for(e=0;e<P;e+=1)(B=p[e].a).p.propType&&(y=p[e].s.getMult(w[a].anIndexes[e],l.a[e].s.totalChars),this._hasMaskedPath?y.length?m.translate(0,B.p.v[1]*y[0],-B.p.v[2]*y[1]):m.translate(0,B.p.v[1]*y,-B.p.v[2]*y):y.length?m.translate(B.p.v[0]*y[0],
B.p.v[1]*y[1],-B.p.v[2]*y[2]):m.translate(B.p.v[0]*y,B.p.v[1]*y,-B.p.v[2]*y));if(c.strokeWidthAnim&&(M=A<0?0:A),c.strokeColorAnim&&(Z="rgb("+Math.round(255*H[0])+","+Math.round(255*H[1])+","+Math.round(255*H[2])+")"),c.fillColorAnim&&c.fc&&(fa="rgb("+Math.round(255*E[0])+","+Math.round(255*E[1])+","+Math.round(255*E[2])+")"),this._hasMaskedPath){if(m.translate(0,-c.ls),m.translate(0,v[1]*C*.01+J,0),this._pathData.p.v)e=(x.point[1]-F.point[1])/(x.point[0]-F.point[0]),e=180*Math.atan(e)/Math.PI,x.point[0]<
F.point[0]&&(e+=180),m.rotate(-e*Math.PI/180);m.translate(ea,ia,0);b-=v[0]*w[a].an*.005;w[a+1]&&aa!==w[a+1].ind&&(b+=w[a].an/2,b+=.001*c.tr*c.finalSize)}else{switch(m.translate(D,J,0),c.ps&&m.translate(c.ps[0],c.ps[1]+c.ascent,0),c.j){case 1:m.translate(w[a].animatorJustifyOffset+c.justifyOffset+(c.boxWidth-c.lineWidths[w[a].line]),0,0);break;case 2:m.translate(w[a].animatorJustifyOffset+c.justifyOffset+(c.boxWidth-c.lineWidths[w[a].line])/2,0,0)}m.translate(0,-c.ls);m.translate(I,0,0);m.translate(v[0]*
w[a].an*.005,v[1]*C*.01,0);D+=w[a].l+.001*c.tr*c.finalSize}"html"===t?sa=m.toCSS():"svg"===t?sa=m.to2dCSS():L=[m.props[0],m.props[1],m.props[2],m.props[3],m.props[4],m.props[5],m.props[6],m.props[7],m.props[8],m.props[9],m.props[10],m.props[11],m.props[12],m.props[13],m.props[14],m.props[15]];e=S}u<=a?(z=new md(e,M,Z,fa,sa,L),this.renderedLetters.push(z),u+=1,this.lettersChangedFlag=!0):(z=this.renderedLetters[a],this.lettersChangedFlag=z.update(e,M,Z,fa,sa,L)||this.lettersChangedFlag)}}};
pb.prototype.getValue=function(){this._elem.globalData.frameId!==this._frameId&&(this._frameId=this._elem.globalData.frameId,this.iterateDynamicProperties())};
pb.prototype.mHelper=new Ja;pb.prototype.defaultPropsArray=[];R([Pa],pb);oa.prototype.initElement=function(c,a,b){this.lettersChangedFlag=!0;this.initFrame();this.initBaseData(c,a,b);this.textProperty=new Sa(this,c.t,this.dynamicProperties);this.textAnimator=new pb(c.t,this.renderType,this);this.initTransform(c,a,b);this.initHierarchy();this.initRenderable();this.initRendererElement();this.createContainerElements();this.createRenderableComponents();this.createContent();this.hide();this.textAnimator.searchProperties(this.dynamicProperties)};
oa.prototype.prepareFrame=function(c){this._mdf=!1;this.prepareRenderableFrame(c);this.prepareProperties(c,this.isInRange)};
oa.prototype.createPathShape=function(c,a){var b,d,e=a.length,f="";for(b=0;b<e;b+=1)"sh"===a[b].ty&&(d=a[b].ks.k,f+=td(d,d.i.length,!0,c));return f};
oa.prototype.updateDocumentData=function(c,a){this.textProperty.updateDocumentData(c,a)};
oa.prototype.canResizeFont=function(c){this.textProperty.canResizeFont(c)};
oa.prototype.setMinimumFontSize=function(c){this.textProperty.setMinimumFontSize(c)};
oa.prototype.applyTextPropertiesToMatrix=function(c,a,b,d,e){switch(c.ps&&a.translate(c.ps[0],c.ps[1]+c.ascent,0),a.translate(0,-c.ls,0),c.j){case 1:a.translate(c.justifyOffset+(c.boxWidth-c.lineWidths[b]),0,0);break;case 2:a.translate(c.justifyOffset+(c.boxWidth-c.lineWidths[b])/2,0,0)}a.translate(d,e,0)};
oa.prototype.buildColor=function(c){return"rgb("+Math.round(255*c[0])+","+Math.round(255*c[1])+","+Math.round(255*c[2])+")"};
oa.prototype.emptyProp=new md;oa.prototype.destroy=function(){};
oa.prototype.validateText=function(){(this.textProperty._mdf||this.textProperty._isFirstFrame)&&(this.buildNewText(),this.textProperty._isFirstFrame=!1,this.textProperty._mdf=!1)};
var Md={shapes:[]};return R([yb,Wa,ib,ab,nb,Jb,oa],qb),qb.prototype.createContent=function(){this.data.singleShape&&!this.globalData.fontManager.chars&&(this.textContainer=X("text"))},qb.prototype.buildTextContents=function(c){for(var a=0,b=c.length,d=[],e="";a<b;)c[a]===String.fromCharCode(13)||c[a]===String.fromCharCode(3)?(d.push(e),e=""):e+=c[a],a+=1;
return d.push(e),d},qb.prototype.buildShapeData=function(c,a){if(c.shapes&&c.shapes.length){var b=c.shapes[0];
b.it&&(b=b.it[b.it.length-1],b.s&&(b.s.k[0]=a,b.s.k[1]=a))}return c},qb.prototype.buildNewText=function(){this.addDynamicProperty(this);
var c=this.textProperty.currentData;this.renderedLetters=ta(c?c.l.length:0);c.fc?this.layerElement.setAttribute("fill",this.buildColor(c.fc)):this.layerElement.setAttribute("fill","rgba(0,0,0,0)");c.sc&&(this.layerElement.setAttribute("stroke",this.buildColor(c.sc)),this.layerElement.setAttribute("stroke-width",c.sw));this.layerElement.setAttribute("font-size",c.finalSize);var a=this.globalData.fontManager.getFontByName(c.f);if(a.fClass)this.layerElement.setAttribute("class",a.fClass);else{this.layerElement.setAttribute("font-family",
a.fFamily);var b=c.fWeight;var d=c.fStyle;this.layerElement.setAttribute("font-style",d);this.layerElement.setAttribute("font-weight",b)}this.layerElement.setAttribute("aria-label",c.t);var e,f=c.l||[],k=!!this.globalData.fontManager.chars;d=f.length;var n=this.mHelper,h=this.data.singleShape,g=0,q=0,r=!0,v=.001*c.tr*c.finalSize;if(!h||k||c.sz){var p=this.textSpans.length;for(b=0;b<d;b+=1){if(this.textSpans[b]||(this.textSpans[b]={span:null,childSpan:null,glyph:null}),!k||!h||0===b){if(e=p>b?this.textSpans[b].span:
X(k?"g":"text"),p<=b){if(e.setAttribute("stroke-linecap","butt"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("stroke-miterlimit","4"),this.textSpans[b].span=e,k){var l=X("g");e.appendChild(l);this.textSpans[b].childSpan=l}this.textSpans[b].span=e;this.layerElement.appendChild(e)}e.style.display="inherit"}if(n.reset(),h&&(f[b].n&&(g=-v,q+=c.yOffset,q+=r?1:0,r=!1),this.applyTextPropertiesToMatrix(c,n,f[b].line,g,q),g+=f[b].l||0,g+=v),k){if(1===(l=this.globalData.fontManager.getCharData(c.finalText[b],
a.fStyle,this.globalData.fontManager.getFontByName(c.f).fFamily)).t)var m=new bb(l.data,this.globalData,this);else m=Md,l.data&&l.data.shapes&&(m=this.buildShapeData(l.data,c.finalSize)),m=new Ba(m,this.globalData,this);if(this.textSpans[b].glyph){var t=this.textSpans[b].glyph;this.textSpans[b].childSpan.removeChild(t.layerElement);t.destroy()}this.textSpans[b].glyph=m;m._debug=!0;m.prepareFrame(0);m.renderFrame();this.textSpans[b].childSpan.appendChild(m.layerElement);1===l.t&&this.textSpans[b].childSpan.setAttribute("transform",
"scale("+c.finalSize/100+","+c.finalSize/100+")")}else h&&e.setAttribute("transform","translate("+n.props[12]+","+n.props[13]+")"),e.textContent=f[b].val,e.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve")}h&&e&&e.setAttribute("d","")}else{a=this.textContainer;switch(c.j){case 1:e="end";break;case 2:e="middle";break;default:e="start"}a.setAttribute("text-anchor",e);a.setAttribute("letter-spacing",v);v=this.buildTextContents(c.finalText);d=v.length;q=c.ps?c.ps[1]+c.ascent:
0;for(b=0;b<d;b+=1)(e=this.textSpans[b].span||X("tspan")).textContent=v[b],e.setAttribute("x",0),e.setAttribute("y",q),e.style.display="inherit",a.appendChild(e),this.textSpans[b]||(this.textSpans[b]={span:null,glyph:null}),this.textSpans[b].span=e,q+=c.finalLineHeight;this.layerElement.appendChild(a)}for(;b<this.textSpans.length;)this.textSpans[b].span.style.display="none",b+=1;this._sizeChanged=!0},qb.prototype.sourceRectAtTime=function(){if(this.prepareFrame(this.comp.renderedFrame-this.data.st),
this.renderInnerContent(),this._sizeChanged){this._sizeChanged=!1;
var c=this.layerElement.getBBox();this.bbox={top:c.y,left:c.x,width:c.width,height:c.height}}return this.bbox},qb.prototype.getValue=function(){var c,a,b=this.textSpans.length;
this.renderedFrame=this.comp.renderedFrame;for(c=0;c<b;c+=1)(a=this.textSpans[c].glyph)&&(a.prepareFrame(this.comp.renderedFrame-this.data.st),a._mdf&&(this._mdf=!0))},qb.prototype.renderInnerContent=function(){if(this.validateText(),(!this.data.singleShape||this._mdf)&&(this.textAnimator.getMeasures(this.textProperty.currentData,this.lettersChangedFlag),this.lettersChangedFlag||this.textAnimator.lettersChangedFlag)){var c;
this._sizeChanged=!0;var a,b,d,e=this.textAnimator.renderedLetters,f=this.textProperty.currentData.l;var k=f.length;for(c=0;c<k;c+=1)f[c].n||(a=e[c],b=this.textSpans[c].span,(d=this.textSpans[c].glyph)&&d.renderFrame(),a._mdf.m&&b.setAttribute("transform",a.m),a._mdf.o&&b.setAttribute("opacity",a.o),a._mdf.sw&&b.setAttribute("stroke-width",a.sw),a._mdf.sc&&b.setAttribute("stroke",a.sc),a._mdf.fc&&b.setAttribute("fill",a.fc))}},R([ob],rb),rb.prototype.createContent=function(){var c=X("rect");
c.setAttribute("width",this.data.sw);c.setAttribute("height",this.data.sh);c.setAttribute("fill",this.data.sc);this.layerElement.appendChild(c)},Ka.prototype.prepareFrame=function(c){this.prepareProperties(c,!0)},Ka.prototype.renderFrame=function(){},Ka.prototype.getBaseElement=function(){return null},Ka.prototype.destroy=function(){},Ka.prototype.sourceRectAtTime=function(){},Ka.prototype.hide=function(){},R([yb,
Wa,ab,nb],Ka),R([ua],pa),pa.prototype.createNull=function(c){return new Ka(c,this.globalData,this)},pa.prototype.createShape=function(c){return new Ba(c,this.globalData,this)},pa.prototype.createText=function(c){return new qb(c,this.globalData,this)},pa.prototype.createImage=function(c){return new ob(c,this.globalData,this)},pa.prototype.createSolid=function(c){return new rb(c,this.globalData,this)},pa.prototype.configAnimation=function(c){this.svgElement.setAttribute("xmlns","http://www.w3.org/2000/svg");
this.svgElement.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");this.renderConfig.viewBoxSize?this.svgElement.setAttribute("viewBox",this.renderConfig.viewBoxSize):this.svgElement.setAttribute("viewBox","0 0 "+c.w+" "+c.h);this.renderConfig.viewBoxOnly||(this.svgElement.setAttribute("width",c.w),this.svgElement.setAttribute("height",c.h),this.svgElement.style.width="100%",this.svgElement.style.height="100%",this.svgElement.style.transform="translate3d(0,0,0)",this.svgElement.style.contentVisibility=
this.renderConfig.contentVisibility);this.renderConfig.width&&this.svgElement.setAttribute("width",this.renderConfig.width);this.renderConfig.height&&this.svgElement.setAttribute("height",this.renderConfig.height);this.renderConfig.className&&this.svgElement.setAttribute("class",this.renderConfig.className);this.renderConfig.id&&this.svgElement.setAttribute("id",this.renderConfig.id);void 0!==this.renderConfig.focusable&&this.svgElement.setAttribute("focusable",this.renderConfig.focusable);this.svgElement.setAttribute("preserveAspectRatio",
this.renderConfig.preserveAspectRatio);this.animationItem.wrapper.appendChild(this.svgElement);var a=this.globalData.defs;this.setupGlobalData(c,a);this.globalData.progressiveLoad=this.renderConfig.progressiveLoad;this.data=c;var b=X("clipPath"),d=X("rect");d.setAttribute("width",c.w);d.setAttribute("height",c.h);d.setAttribute("x",0);d.setAttribute("y",0);var e=Ca();b.setAttribute("id",e);b.appendChild(d);this.layerElement.setAttribute("clip-path","url("+Ma+"#"+e+")");a.appendChild(b);this.layers=
c.layers;this.elements=ta(c.layers.length)},pa.prototype.destroy=function(){var c;
this.animationItem.wrapper&&(this.animationItem.wrapper.innerText="");this.layerElement=null;this.globalData.defs=null;var a=this.layers?this.layers.length:0;for(c=0;c<a;c+=1)this.elements[c]&&this.elements[c].destroy&&this.elements[c].destroy();this.elements.length=0;this.destroyed=!0;this.animationItem=null},pa.prototype.updateContainerSize=function(){},pa.prototype.findIndexByInd=function(c){var a,b=this.layers.length;
for(a=0;a<b;a+=1)if(this.layers[a].ind===c)return a;return-1},pa.prototype.buildItem=function(c){var a=this.elements;
if(!a[c]&&99!==this.layers[c].ty){a[c]=!0;var b=this.createItem(this.layers[c]);if(a[c]=b,Lb&&(0===this.layers[c].ty&&this.globalData.projectInterface.registerComposition(b),b.initExpressions()),this.appendElementInPos(b,c),this.layers[c].tt){var d="tp"in this.layers[c]?this.findIndexByInd(this.layers[c].tp):c-1;-1!==d&&(this.elements[d]&&!0!==this.elements[d]?(c=a[d].getMatte(this.layers[c].tt),b.setMatte(c)):(this.buildItem(d),this.addPendingElement(b)))}}},pa.prototype.checkPendingElements=function(){for(;this.pendingElements.length;){var c=
this.pendingElements.pop();
if(c.checkParenting(),c.data.tt)for(var a=0,b=this.elements.length;a<b;){if(this.elements[a]===c){b="tp"in c.data?this.findIndexByInd(c.data.tp):a-1;a=this.elements[b].getMatte(this.layers[a].tt);c.setMatte(a);break}a+=1}}},pa.prototype.renderFrame=function(c){if(this.renderedFrame!==c&&!this.destroyed){var a;
null===c?c=this.renderedFrame:this.renderedFrame=c;this.globalData.frameNum=c;this.globalData.frameId+=1;this.globalData.projectInterface.currentFrame=c;this.globalData._mdf=!1;var b=this.layers.length;this.completeLayers||this.checkLayers(c);for(a=b-1;a>=0;--a)(this.completeLayers||this.elements[a])&&this.elements[a].prepareFrame(c-this.layers[a].st);if(this.globalData._mdf)for(a=0;a<b;a+=1)(this.completeLayers||this.elements[a])&&this.elements[a].renderFrame()}},pa.prototype.appendElementInPos=
function(c,a){if(c=c.getBaseElement()){for(var b,d=0;d<a;)this.elements[d]&&!0!==this.elements[d]&&this.elements[d].getBaseElement()&&(b=this.elements[d].getBaseElement()),d+=1;
b?this.layerElement.insertBefore(c,b):this.layerElement.appendChild(c)}},pa.prototype.hide=function(){this.layerElement.style.display="none"},pa.prototype.show=function(){this.layerElement.style.display="block"},R([yb,
Wa,ab,nb,Jb],db),db.prototype.initElement=function(c,a,b){this.initFrame();this.initBaseData(c,a,b);this.initTransform(c,a,b);this.initRenderable();this.initHierarchy();this.initRendererElement();this.createContainerElements();this.createRenderableComponents();!this.data.xt&&a.progressiveLoad||this.buildAllItems();this.hide()},db.prototype.prepareFrame=function(c){if(this._mdf=!1,this.prepareRenderableFrame(c),this.prepareProperties(c,this.isInRange),this.isInRange||this.data.xt)for(this.tm._placeholder?
this.renderedFrame=c/this.data.sr:(c=this.tm.v,c===this.data.op&&(c=this.data.op-1),this.renderedFrame=c),c=this.elements.length,this.completeLayers||this.checkLayers(this.renderedFrame),--c;c>=0;--c)(this.completeLayers||this.elements[c])&&(this.elements[c].prepareFrame(this.renderedFrame-this.layers[c].st),this.elements[c]._mdf&&(this._mdf=!0))},db.prototype.renderInnerContent=function(){var c,a=this.layers.length;
for(c=0;c<a;c+=1)(this.completeLayers||this.elements[c])&&this.elements[c].renderFrame()},db.prototype.setElements=function(c){this.elements=c},db.prototype.getElements=function(){return this.elements},db.prototype.destroyElements=function(){var c,a=this.layers.length;
for(c=0;c<a;c+=1)this.elements[c]&&this.elements[c].destroy()},db.prototype.destroy=function(){this.destroyElements();
this.destroyBaseElement()},R([pa,
db,ib],bb),bb.prototype.createComp=function(c){return new bb(c,this.globalData,this)},R([pa],Ha),Ha.prototype.createComp=function(c){return new bb(c,this.globalData,this)},Fc.svg=Ha,tb.registerModifier("tm",Za),tb.registerModifier("pb",vc),tb.registerModifier("rp",za),tb.registerModifier("rd",Ra),tb.registerModifier("zz",hb),tb.registerModifier("op",hc),ka})}).call(globalThis);}).call(this);
