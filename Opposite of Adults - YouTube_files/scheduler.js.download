(function(){'use strict';var g,aa=typeof Object.create=="function"?Object.create:function(a){function b(){}
b.prototype=a;return new b},h=typeof Object.defineProperties=="function"?Object.defineProperty:function(a,b,c){if(a==Array.prototype||a==Object.prototype)return a;
a[b]=c.value;return a};
function ba(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");}
var ea=ba(this);function k(a,b){if(b)a:{var c=ea;a=a.split(".");for(var d=0;d<a.length-1;d++){var e=a[d];if(!(e in c))break a;c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&b!=null&&h(c,a,{configurable:!0,writable:!0,value:b})}}
var l;if(typeof Object.setPrototypeOf=="function")l=Object.setPrototypeOf;else{var m;a:{var fa={a:!0},n={};try{n.__proto__=fa;m=n.a;break a}catch(a){}m=!1}l=m?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null}var p=l;
function q(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}
function r(a){var b=typeof Symbol!="undefined"&&Symbol.iterator&&a[Symbol.iterator];if(b)return b.call(a);if(typeof a.length=="number")return{next:q(a)};throw Error(String(a)+" is not an iterable or ArrayLike");}
k("Symbol",function(a){function b(f){if(this instanceof b)throw new TypeError("Symbol is not a constructor");return new c(d+(f||"")+"_"+e++,f)}
function c(f,v){this.g=f;h(this,"description",{configurable:!0,writable:!0,value:v})}
if(a)return a;c.prototype.toString=function(){return this.g};
var d="jscomp_symbol_"+(Math.random()*1E9>>>0)+"_",e=0;return b});
k("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");h(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return ha(q(this))}});
return a});
function ha(a){a={next:a};a[Symbol.iterator]=function(){return this};
return a}
k("Symbol.dispose",function(a){return a?a:Symbol("Symbol.dispose")});
function ia(a,b){a instanceof String&&(a+="");var c=0,d=!1,e={next:function(){if(!d&&c<a.length){var f=c++;return{value:b(f,a[f]),done:!1}}d=!0;return{done:!0,value:void 0}}};
e[Symbol.iterator]=function(){return e};
return e}
k("Object.values",function(a){return a?a:function(b){var c=[],d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&c.push(b[d]);return c}});
k("Array.prototype.values",function(a){return a?a:function(){return ia(this,function(b,c){return c})}});/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
var t=this||self;function u(a){a=a.split(".");for(var b=t,c=0;c<a.length;c++)if(b=b[a[c]],b==null)return null;return b}
function w(a,b){a=a.split(".");for(var c=t,d;a.length&&(d=a.shift());)a.length||b===void 0?c[d]&&c[d]!==Object.prototype[d]?c=c[d]:c=c[d]={}:c[d]=b}
;var x=Math.max,ja=x.apply,y=Object.values({ca:1,ba:2,aa:4,ga:8,ia:16,ea:32,V:64,Y:128,W:256,ha:512,X:1024,Z:2048,fa:4096,da:8192}),z;if(y instanceof Array)z=y;else{for(var ka=r(y),A,B=[];!(A=ka.next()).done;)B.push(A.value);z=B}ja.call(x,Math,z);function C(){this.u=this.u;this.A=this.A}
C.prototype.u=!1;C.prototype.dispose=function(){this.u||(this.u=!0,this.H())};
C.prototype[Symbol.dispose]=function(){this.dispose()};
C.prototype.H=function(){if(this.A)for(;this.A.length;)this.A.shift()()};var D=t.window,E,F,G=(D==null?void 0:(E=D.yt)==null?void 0:E.config_)||(D==null?void 0:(F=D.ytcfg)==null?void 0:F.data_)||{};w("yt.config_",G);function H(a,b){var c={};a=("EXPERIMENT_FLAGS"in G?G.EXPERIMENT_FLAGS:c)[a];return a!==void 0?a:b}
;var la=Number(H("web_emulated_idle_callback_delay",300)||0),I=1E3/60-3,J=[8,5,4,3,2,1,0];
function K(a){a=a===void 0?{}:a;C.call(this);this.i=[];this.h={};this.F=this.g=0;this.D=this.l=!1;this.v=[];this.C=this.G=!1;for(var b=r(J),c=b.next();!c.done;c=b.next())this.i[c.value]=[];this.j=0;this.O=a.timeout||1;this.o=I;this.m=0;this.I=this.S.bind(this);this.N=this.U.bind(this);this.K=this.P.bind(this);this.L=this.R.bind(this);this.M=this.T.bind(this);if(b=!!window.requestIdleCallback&&!!window.cancelIdleCallback)b=H("disable_scheduler_requestIdleCallback"),b=!(typeof b==="string"&&b==="false"?
0:b);this.J=b;(this.B=a.useRaf!==!1&&!!window.requestAnimationFrame)&&document.addEventListener("visibilitychange",this.I)}
K.prototype=aa(C.prototype);K.prototype.constructor=K;if(p)p(K,C);else for(var L in C)if(L!="prototype")if(Object.defineProperties){var M=Object.getOwnPropertyDescriptor(C,L);M&&Object.defineProperty(K,L,M)}else K[L]=C[L];function N(a,b){var c=Date.now();O(b);b=Date.now()-c;a.l||(a.o-=b)}
function P(a,b,c,d){++a.F;if(c===10)return N(a,b),a.F;var e=a.F;a.h[e]=b;a.l&&!d?a.v.push({id:e,priority:c}):(a.i[c].push(e),a.D||a.l||(a.g!==0&&Q(a)!==a.m&&R(a),a.start()));return e}
function S(a){a.v.length=0;for(var b=5;b>=0;b--)a.i[b].length=0;a.i[8].length=0;a.h={};R(a)}
function Q(a){if(a.i[8].length){if(a.C)return 4;if(!document.hidden&&a.B)return 3}for(var b=5;b>=a.j;b--)if(a.i[b].length>0)return b>0?!document.hidden&&a.B?3:2:1;return 0}
function T(a){var b=u("yt.logging.errors.log");b&&b(a)}
function O(a){try{a()}catch(b){T(b)}}
function U(a){for(var b=r(J),c=b.next();!c.done;c=b.next())if(a.i[c.value].length)return!0;return!1}
g=K.prototype;g.R=function(a){var b=void 0;a&&(b=a.timeRemaining());this.G=!0;V(this,b);this.G=!1};
g.U=function(){V(this)};
g.P=function(){ma(this)};
g.T=function(a){this.C=!0;var b=Q(this);b===4&&b!==this.m&&(R(this),this.start());V(this,void 0,a);this.C=!1};
g.S=function(){document.hidden||ma(this);this.g&&(R(this),this.start())};
function ma(a){R(a);a.l=!0;for(var b=Date.now(),c=a.i[8];c.length;){var d=c.shift(),e=a.h[d];delete a.h[d];e&&O(e)}na(a);a.l=!1;U(a)&&a.start();a.o-=Date.now()-b}
function na(a){for(var b=0,c=a.v.length;b<c;b++){var d=a.v[b];a.i[d.priority].push(d.id)}a.v.length=0}
function V(a,b,c){a.C&&a.m===4&&a.g||R(a);a.l=!0;b=Date.now()+(b||a.o);for(var d=a.i[5];d.length;){var e=d.shift(),f=a.h[e];delete a.h[e];if(f)try{f(c)}catch(ta){T(ta)}}for(d=a.i[4];d.length;)c=d.shift(),e=a.h[c],delete a.h[c],e&&O(e);d=a.G?0:1;d=a.j>d?a.j:d;if(!(Date.now()>=b)){do{a:{c=a;e=d;for(f=3;f>=e;f--)for(var v=c.i[f];v.length;){var ca=v.shift(),da=c.h[ca];delete c.h[ca];if(da){c=da;break a}}c=null}c&&O(c)}while(c&&Date.now()<b)}a.l=!1;na(a);a.o=I;U(a)&&a.start()}
g.start=function(){this.D=!1;if(this.g===0)switch(this.m=Q(this),this.m){case 1:var a=this.L;this.g=this.J?window.requestIdleCallback(a,{timeout:3E3}):window.setTimeout(a,la);break;case 2:this.g=window.setTimeout(this.N,this.O);break;case 3:this.g=window.requestAnimationFrame(this.M);break;case 4:this.g=window.setTimeout(this.K,0)}};
function R(a){if(a.g){switch(a.m){case 1:var b=a.g;a.J?window.cancelIdleCallback(b):window.clearTimeout(b);break;case 2:case 4:window.clearTimeout(a.g);break;case 3:window.cancelAnimationFrame(a.g)}a.g=0}}
g.H=function(){S(this);R(this);this.B&&document.removeEventListener("visibilitychange",this.I);C.prototype.H.call(this)};var W=u("yt.scheduler.instance.timerIdMap_")||{},oa=Number(H("kevlar_tuner_scheduler_soft_state_timer_ms",800)||0),X=0,Y=0;function Z(){var a=u("ytglobal.schedulerInstanceInstance_");if(!a||a.u)a=new K(("scheduler"in G?G.scheduler:void 0)||{}),w("ytglobal.schedulerInstanceInstance_",a);return a}
function pa(){qa();var a=u("ytglobal.schedulerInstanceInstance_");a&&(a&&typeof a.dispose=="function"&&a.dispose(),w("ytglobal.schedulerInstanceInstance_",null))}
function qa(){S(Z());for(var a in W)W.hasOwnProperty(a)&&delete W[Number(a)]}
function ra(a,b,c){if(!c)return c=c===void 0,-P(Z(),a,b,c);var d=window.setTimeout(function(){var e=P(Z(),a,b);W[d]=e},c);
return d}
function sa(a){var b=Z();N(b,a)}
function ua(a){var b=Z();if(a<0)delete b.h[-a];else{var c=W[a];c?(delete b.h[c],delete W[a]):window.clearTimeout(a)}}
function va(){wa()}
function wa(){window.clearTimeout(X);Z().start()}
function xa(){var a=Z();R(a);a.D=!0;window.clearTimeout(X);X=window.setTimeout(va,oa)}
function ya(){window.clearTimeout(Y);Y=window.setTimeout(function(){za(0)},oa)}
function za(a){ya();var b=Z();b.j=a;b.start()}
function Aa(a){ya();var b=Z();b.j>a&&(b.j=a,b.start())}
function Ba(){window.clearTimeout(Y);var a=Z();a.j=0;a.start()}
;u("yt.scheduler.initialized")||(w("yt.scheduler.instance.dispose",pa),w("yt.scheduler.instance.addJob",ra),w("yt.scheduler.instance.addImmediateJob",sa),w("yt.scheduler.instance.cancelJob",ua),w("yt.scheduler.instance.cancelAllJobs",qa),w("yt.scheduler.instance.start",wa),w("yt.scheduler.instance.pause",xa),w("yt.scheduler.instance.setPriorityThreshold",za),w("yt.scheduler.instance.enablePriorityThreshold",Aa),w("yt.scheduler.instance.clearPriorityThreshold",Ba),w("yt.scheduler.initialized",!0));}).call(this);
