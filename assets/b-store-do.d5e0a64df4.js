/* store.js */
try{(function(){"use strict";var A=["biz","party","item","doc","meta","bin","log","ver"],P={biz:1,party:1,item:1,doc:1},J=30,$={log:1,ver:1},Q=window.NS_CFG||{},G=Q.vault||"https://my.niveshsahayak.in/vault.html",L=new URL(G,location.href).origin,p,Sn=0,_={},N=null,D,z;function En(){return z||(z=new Promise(function(n,t){var e=indexedDB.open("ns-local",3);e.onupgradeneeded=function(){A.forEach(function(i){e.result.objectStoreNames.contains(i)||e.result.createObjectStore(i,{keyPath:"id"})})},e.onblocked=M;var r=setTimeout(M,4e3);e.onsuccess=function(){clearTimeout(r);var i=e.result;i.onversionchange=function(){i.close(),z=null},X(),n(i)},e.onerror=function(){clearTimeout(r),t(e.error)}}),z)}function k(n,t,e){return En().then(function(r){return new Promise(function(i,u){var o=r.transaction(n,t),c=e(o.objectStore(n));o.oncomplete=function(){i(c&&"result"in c?c.result:c)},o.onerror=function(){u(o.error)}})})}var S={list:function(n){return k(n.store,"readonly",function(t){return t.getAll()})},get:function(n){return k(n.store,"readonly",function(t){return t.get(n.id)})},put:function(n){var t=Array.isArray(n.value)?n.value:[n.value];return k(n.store,"readwrite",function(e){t.forEach(function(r){e.put(r)})})},del:function(n){return k(n.store,"readwrite",function(t){t.delete(n.id)})},clear:function(n){return k(n.store,"readwrite",function(t){t.clear()})},exportAll:function(){var n={};return Promise.all(A.map(function(t){return S.list({store:t}).then(function(e){n[t]=e})})).then(function(){return n})},importAll:function(n){var t=n.data||{},e=0;return Promise.all(A.map(function(r){var i=(t[r]||[]).filter(function(u){return u&&u.id});return(n.replace&&!$[r]?S.clear({store:r}):Promise.resolve()).then(function(){return S.list({store:r})}).then(function(u){var o={};u.forEach(function(l){o[l.id]=l});var c=i.filter(function(l){return!o[l.id]||!$[r]&&(l.updated||0)>(o[l.id].updated||0)});return e+=c.length,c.length?S.put({store:r,value:c}):0})})).then(function(){return e})},logAdd:function(n){return S.importAll({data:{log:[].concat(n.value)}})},logCheck:function(){return Promise.resolve(null)},persist:function(){return navigator.storage&&navigator.storage.persist?navigator.storage.persist():Promise.resolve(!1)},estimate:function(){return navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null)}};function M(){if(!(document.getElementById("ns-blocked")||!document.body)){var n=window.NS&&NS.t?NS.t("db.blocked"):"Close the other Nivesh Sahayak tabs, or reload them. This page then continues by itself.",t=document.createElement("div");t.id="ns-blocked",t.className="remind",t.setAttribute("role","alert"),t.innerHTML='<div class="wrap"><span></span> <button type="button" class="btn sm"></button></div>',t.firstChild.firstChild.textContent=n;var e=t.querySelector("button");e.textContent=window.NS&&NS.t?NS.t("blk.reload"):"Reload the page",e.onclick=function(){location.reload()},document.body.insertBefore(t,document.body.firstChild)}}function X(){var n=document.getElementById("ns-blocked");n&&n.remove()}window.addEventListener("message",function(n){n.origin!==L||!n.data||n.data.ns!=="vault"||(n.data.blocked?M():"ready"in n.data&&X(),n.data.af&&document.dispatchEvent(new CustomEvent("ns-autosave",{detail:n.data.af})))});var d=null;try{Q.inApp&&window.parent!==window&&window.parent.NSStore&&window.parent.NSStore._call&&(d=window.parent.NSStore)}catch{d=null}if(d)try{window.parent.document.addEventListener("ns-data",function(){document.dispatchEvent(new CustomEvent("ns-data"))})}catch{}var Nn={snapshot:1,restoreFiles:1,deskBackup:1},bn={put:1,del:1,clear:1,importAll:1},Pn={list:1,get:1};function m(n,t){var e=Z(n,t);return Pn[n]?e.catch(function(r){return r&&/did not answer/.test(r.message)?Z(n,t):Promise.reject(r)}):e}function Z(n,t){return d?d._send(n,t):new Promise(function(e,r){var i=++Sn;_[i]={res:e,rej:r,t:setTimeout(function(){delete _[i],r(new Error("The data home did not answer"))},Nn[n]?6e5:bn[n]?6e4:15e3)},p.contentWindow.postMessage({ns:"vault",id:i,op:n,args:t||{}},L)})}var j={put:1,del:1,clear:1,importAll:1},An={lastBackup:1,autosave:1};function Dn(n,t){if(!j[n])return!1;if(t&&t.store==="meta"){var e=[].concat(t.value||{id:t.id});if(e.every(function(r){return r&&An[r.id]}))return!1}return!0}var F=0,E=null;document.addEventListener("ns-data",function(){F++});function a(n,t){return j[n]&&F++,d?d._call(n,t):y().then(function(){return N==="local"?S[n](t||{}):m(n,t)}).then(function(e){return Dn(n,t)&&document.dispatchEvent(new CustomEvent("ns-saved")),e})}window.addEventListener("message",function(n){if(!(n.origin!==L||!n.data||n.data.ns!=="vault"||!n.data.id)){var t=_[n.data.id];t&&(clearTimeout(t.t),delete _[n.data.id],n.data.ok?t.res(n.data.result):t.rej(new Error(n.data.result)),!n.data.ok&&/^NSAUTH: (login|this browser)/.test(String(n.data.result||""))&&document.dispatchEvent(new CustomEvent("ns-login",{detail:String(n.data.result)})))}});function y(){return D||(d?D=d.ready().then(function(n){return N=n,n}):(D=new Promise(function(n){var t=!1;function e(o){t||(t=!0,N=o,n(o))}if(!("indexedDB"in window))return e("local");var r=window.__nsVF;if(r&&r.src===G){if(p=r,window.__nsVR){var i=window.__nsVR;return window.__nsVR=null,e(i.ready?"vault":"local")}}else r=null;r||(p=document.createElement("iframe"),p.src=G),p.title="Nivesh Sahayak data home",p.setAttribute("aria-hidden","true"),p.tabIndex=-1,p.style.cssText="position:fixed;width:1px;height:1px;border:0;left:0;top:0;opacity:0;pointer-events:none;clip-path:inset(50%)";function u(o){if(!(o.origin!==L||!o.data||o.data.ns!=="vault"||!("ready"in o.data))){if(window.removeEventListener("message",u),!t)return e(o.data.ready?"vault":"local");if(o.data.ready&&N==="local"){N="vault";var c=function(){document.dispatchEvent(new CustomEvent("ns-data"))};nn().then(c,c)}}}window.addEventListener("message",u),setTimeout(function(){e("local")},6e3),r||(document.body||document.documentElement).appendChild(p)}).then(function(n){return n==="vault"?nn().then(function(){return n},function(){return n}):n}),D))}function nn(){return S.exportAll().then(function(n){var t=A.reduce(function(e,r){return e+(n[r]||[]).length},0);if(t)return m("importAll",{data:n}).then(function(){return Promise.all(A.map(function(e){return S.clear({store:e})}))})})}function v(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}var I=null;function g(){return I!=null?Promise.resolve(I):a("get",{store:"meta",id:"who"}).then(function(n){return I=n&&n.v||"",I},function(){return""})}function V(n,t,e){return e=e||{},n==null||typeof n!="object"?(e[t]=n,e):(Object.keys(n).forEach(function(r){if(!(!t&&(r==="id"||r==="created"||r==="updated"))){var i=n[r],u=t?t+"."+r:r;i&&typeof i=="object"?V(i,u,e):e[u]=i}}),e)}function tn(n){return n==null||n===""?"":(n=String(n),/^data:/.test(n)?"[picture]":n.length>120?n.slice(0,117)+"...":n)}function R(n,t){var e=V(n||{},""),r=V(t||{},""),i=[];return Object.keys(Object.assign({},e,r)).forEach(function(u){var o=tn(e[u]),c=tn(r[u]);o!==c&&i.push([u,o,c])}),i}function b(n){return a("logAdd",{value:n}).catch(function(t){if(/Unknown operation/.test(t&&t.message))return a("put",{store:"log",value:n});throw t})}function H(n,t,e,r,i){return!P[n]&&n!=="meta"||e&&e.sample?Promise.resolve():g().then(function(u){var o=Object.assign({id:v(),at:Date.now(),who:u,site:location.hostname,store:n,rid:e&&e.id,act:t,no:e&&(e.no||e.billNo)||"",type:e&&e.type||"",name:e&&(e.name||e.desc||e.buyer&&e.buyer.name)||"",ch:(r||[]).slice(0,60)},i||{});return e&&e.date&&n==="doc"&&(o.date=e.date),Object.keys(o).forEach(function(c){o[c]===void 0&&delete o[c]}),b(o)}).catch(function(){})}function en(n,t,e){return!t||t.sample?Promise.resolve(""):g().then(function(r){var i={id:v(),rid:t.id,store:n,at:Date.now(),who:r,act:e,rec:t};return a("put",{store:"ver",value:i}).then(function(){return i.id})}).catch(function(){return""})}var w=null,rn=0;function U(){return w&&Date.now()-rn<3e3?Promise.resolve(w):a("list",{store:"biz"}).then(function(n){return w=n||[],rn=Date.now(),w},function(){return[]})}function s(n){return String(n||"").trim().toLowerCase().replace(/\s+/g," ")}function x(n,t){var e=s(n&&n.name);if(!e)return"";var r=t.filter(function(u){return u&&u.id&&s(u.name)===e});if(r.length)return r.length===1?r[0].id:"";var i=t.filter(function(u){return u&&u.id&&(u.oldNames||[]).some(function(o){return s(o)===e})});return i.length===1?i[0].id:""}function zn(n,t){var e=n&&n.bizId&&t[n.bizId];return e&&n.seller&&s(n.seller.name)!==s(e.name)&&(n.seller.name=e.name),n}function K(n){return!n||!(Array.isArray(n)?n:[n]).some(function(t){return t&&t.bizId})?Promise.resolve(n):U().then(function(t){var e={};return t.forEach(function(r){e[r.id]=r}),(Array.isArray(n)?n:[n]).forEach(function(r){zn(r,e)}),n})}function un(){var n=function(){return a("list",{store:"doc"})};return N==="vault"&&!d?m("noBiz",{}).then(function(t){return Array.isArray(t)?t:n()},n):n()}function on(){return w=null,Promise.all([U(),un()]).then(function(n){var t=n[0],e=[];return(n[1]||[]).forEach(function(r){if(r&&!r.bizId&&r.seller){var i=x(r.seller,t);i&&(r.bizId=i,e.push(r))}}),e.length?a("put",{store:"doc",value:e}).then(function(){var r={};return e.forEach(function(i){r[i.bizId]=(r[i.bizId]||0)+1}),g().then(function(i){return b({id:v(),at:Date.now(),who:i,site:location.hostname,store:"doc",act:"link",n:e.length,ch:Object.keys(r).map(function(u){var o=t.filter(function(c){return c.id===u})[0];return["bizId",o?o.name:u,String(r[u])]})})}).catch(function(){})}).then(function(){return e.length}):0}).catch(function(){return 0})}function kn(n,t,e){return w=null,Promise.all([U(),un()]).then(function(r){var i=r[0].filter(function(o){return o&&o.id===t})[0];if(!i)throw new Error("No such business");var u=(r[1]||[]).filter(function(o){return o&&!o.bizId&&o.seller&&(n==null||s(o.seller.name)===s(n))});return u.length?(u.forEach(function(o){o.bizId=t}),a("put",{store:"doc",value:u}).then(function(){return g().then(function(o){return b({id:v(),at:Date.now(),who:o,site:location.hostname,store:"doc",act:"link",n:u.length,why:e||"",ch:[["bizId",n==null?"":String(n),i.name+" ("+u.length+")"]]})}).catch(function(){})}).then(function(){return u.length})):0})}function In(n){var t={};return(n||[]).forEach(function(e){if(e&&!e.bizId&&e.seller&&!e.sample){var r=String(e.seller.name||"").trim(),i=s(r);t[i]=t[i]||{name:r,n:0},t[i].n++}}),Object.keys(t).map(function(e){return t[e]}).sort(function(e,r){return r.n-e.n})}var Tn={status:1,paidBy:1,invNo:1,nextNo:1,nextType:1,chq:1,rec:1,bizId:1};function q(n){return a("get",{store:"meta",id:"settings"}).then(function(t){var e=t&&t.v||{};return!e.byBiz||!NS.cfgFor||!n||!n.seller?e.lockBefore||"":a("list",{store:"biz"}).then(function(r){return NS.cfgFor(e,n.seller,r||[]).lockBefore||""},function(){return e.lockBefore||""})},function(){return""})}function an(n){var t=new Error(NS.t?NS.t("b1.locked",{d:NS.fmtDate?NS.fmtDate(n):n}):"Locked: documents dated before "+n+" cannot be changed");return t.locked=!0,t}function W(n,t,e){return n!=="doc"?Promise.resolve():q(e||t).then(function(r){if(r){var i=t&&t.date&&t.date<r,u=e&&e.date&&e.date<r;if(!(!i&&!u)&&!(t&&e&&i&&u&&R(t,e).every(function(o){return Tn[o[0].split(".")[0]]})))throw an(r)}})}var cn=!1;function On(){return a("list",{store:"bin"}).then(function(n){var t=(n||[]).filter(function(e){return Date.now()-(e.at||0)>J*864e5});return Promise.all(t.map(function(e){return a("del",{store:"bin",id:e.id})}))}).catch(function(){})}var Cn={settings:1,pin:1,groups:1,heads:1,sf:1,sfcfg:1};function T(n,t,e){try{if(sessionStorage.getItem("ns-sf-role")!=="staff")return!1}catch{return!1}return n==="del"||t==="meta"&&!!Cn[e]}function O(){var n=new Error(window.NS&&NS.t?NS.t("sfd.denied"):"An employee cannot do this. Ask the owner.");return n.denied=!0,Promise.reject(n)}var ln="This opening balance is carried from a closed year. Reopen that year (Year end) to change it.";function fn(n,t,e){if(T("put",n,t&&t.id))return O();if(n==="log"||n==="ver")return a("put",{store:n,value:t});if(n==="doc"&&t&&t.cyc)return Promise.reject(new Error(ln));t.id||(t.id=v());var r,i="";return e=e||{},(P[n]?a("get",{store:n,id:t.id}):Promise.resolve()).then(function(u){return r=u,W(n,r,t)}).then(function(){if(n==="doc"&&t.seller)return U().then(function(u){var o=x(t.seller,u);o?t.bizId=o:!t.bizId&&r&&r.bizId&&(t.bizId=r.bizId)});if(n==="biz"&&r&&s(r.name)&&s(r.name)!==s(t.name))return t.oldNames=(t.oldNames||r.oldNames||[]).filter(function(u){return s(u)!==s(t.name)}),t.oldNames.map(s).indexOf(s(r.name))<0&&t.oldNames.push(r.name),on()}).then(function(){if(r&&!r.sample&&P[n]&&R(r,t).length)return en(n,r,e.act||"edit").then(function(u){i=u})}).then(function(){return t.created||(t.created=Date.now()),t.updated=Date.now(),a("put",{store:n,value:t})}).then(function(){if(n==="biz"&&(w=null),P[n]){var u=R(r,t);(!r||u.length)&&H(n,e.act||(r?"edit":"add"),t,r?u:[],{ver:i||void 0,why:e.why||void 0})}return t})}var Bn={invoice:1,cashmemo:1,note:1,receipt:1,voucher:1,self:1,expinv:1,pbill:1,pharma:1,jewel:1,garment:1,resto:1,lr:1,fee:1};function sn(n){var t=new Date(n);return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")}function dn(n){var t=+String(n).slice(0,4),e=+String(n).slice(5,7);return e<4&&t--,t}function hn(n){return s(String(n||"").replace(/\d+\s*$/,""))}function mn(n){var t=String(n||"").match(/(\d+)\s*$/);return t?+t[1]:NaN}function vn(n,t,e,r){if(!n||n.sample||!Bn[n.type||"invoice"]||!String(n.no||"").trim()||!(n.seller&&String(n.seller.gstin||"").trim())||e&&e.allowDel||n.created&&sn(n.created)===sn(r||Date.now()))return"";if((n.type||"invoice")==="pbill")return"cancel";var i=mn(n.no),u=hn(n.no),o=dn(n.date),c=n.bizId||s(n.seller.name);if(!isFinite(i))return"cancel";var l=(t||[]).some(function(f){return f&&f.id!==n.id&&(f.type||"invoice")===(n.type||"invoice")&&(f.kind||"")===(n.kind||"")&&dn(f.date)===o&&hn(f.no)===u&&(f.bizId||s(f.seller&&f.seller.name))===c&&mn(f.no)>i});return l?"cancel":""}function Ln(){var n=new Error(window.NS&&NS.t?NS.t("au.mustcancel"):"This voucher has a number in a GST series. Cancel it instead of deleting it.");return n.mustCancel=!0,n}function gn(n,t,e){return a("get",{store:"doc",id:n}).then(function(r){if(!r)throw new Error("gone");return!e&&r.cancelled||e&&!r.cancelled?r:g().then(function(i){var u=JSON.parse(JSON.stringify(r)),o=String(t||"").trim();return e?delete u.cancelled:u.cancelled={at:Date.now(),who:i,why:o},fn("doc",u,{act:e?"uncancel":"cancel",why:o})})})}function _n(n,t,e){if(T("del",n,t))return O();if(n==="log"||n==="ver")return Promise.reject(new Error("The edit history cannot be changed or removed"));if(n==="doc"&&/^cy-/.test(String(t)))return Promise.reject(new Error(ln));if(!P[n])return a("del",{store:n,id:t});var r=!1,i,u="";return m("can",{store:n,id:t,act:"del"}).catch(function(){return!0}).then(function(o){if(o===!1)throw new Error("NSAUTH: no right to delete this");return a("get",{store:n,id:t})}).then(function(o){if(i=o,!!i){r=!!(e&&e.hard&&i.sample);var c=!!(e&&e.batch&&i.src&&i.src.batch===e.batch);return W(n,i,null).then(function(){if(!(n!=="doc"||i.sample||c))return Promise.all([a("list",{store:"doc"}),a("get",{store:"meta",id:"settings"})]).then(function(l){var f=l[1]&&l[1].v||{},h=i.bizId&&f.byBiz&&f.byBiz[i.bizId];if(vn(i,l[0],h&&"allowDel"in h?h:f))throw e&&e.quiet||Rn(i),Ln()})}).then(function(){if(!(r||i.sample||c))return en(n,i,"del").then(function(l){return u=l,g()}).then(function(l){return a("put",{store:"bin",value:{id:n+":"+t,store:n,rec:i,at:Date.now(),who:l}})}).catch(function(){})})}}).then(function(){if(i)return a("del",{store:n,id:t})}).then(function(){if(n==="biz"&&(w=null),i&&!r)return H(n,"del",i,[],{ver:u||void 0})})}function Fn(n,t,e){if(t=(t||[]).filter(function(i){return i&&i.rec&&i.rec.src&&i.rec.src.batch===n&&!/^cy-/.test(String(i.rec.id))&&!(i.store==="log"||i.store==="ver")}),!t.length)return Promise.resolve(0);if(T("del",t[0].store,t[0].rec.id))return O();var r={};return t.forEach(function(i){i.store in r||(r[i.store]=i.rec.id)}),Promise.all(Object.keys(r).map(function(i){return m("can",{store:i,id:r[i],act:"del"}).catch(function(){return!0}).then(function(u){if(u===!1)throw new Error("NSAUTH: no right to delete this")})})).then(function(){var i=t.filter(function(u){return u.store==="doc"});return i.length?q(i[0].rec):""}).then(function(i){var u=i&&t.filter(function(o){return o.store==="doc"&&o.rec.date&&o.rec.date<i})[0];if(u)throw an(i);return g()}).then(function(i){var u=0;function o(){var c=t.slice(u,u+50);return c.length?(u+=c.length,Promise.all(c.map(function(l){return a("del",{store:l.store,id:l.rec.id})})).then(function(){var l=c.filter(function(f){return P[f.store]}).map(function(f){var h=f.rec,B={id:v(),at:Date.now(),who:i,site:location.hostname,store:f.store,rid:h.id,act:"del",no:h.no||h.billNo||"",type:h.type||"",name:h.name||h.desc||h.buyer&&h.buyer.name||"",ch:[],imp:n};return h.date&&f.store==="doc"&&(B.date=h.date),Object.keys(B).forEach(function(yn){B[yn]===void 0&&delete B[yn]}),B});return l.length?b(l).catch(function(){}):null}).then(function(){return e&&e(u,t.length),new Promise(function(l){setTimeout(l,0)})}).then(o)):Promise.resolve(t.length)}return o()}).then(function(i){return w=null,i})}function Rn(n){setTimeout(function(){window.NS&&NS.cancelDoc&&NS.cancelDoc(n,{fromDelete:!0})},0)}function Hn(n){return a("get",{store:"bin",id:n}).then(function(t){if(!t||!t.rec)throw new Error("gone");var e=t.rec;return W(t.store,null,e).then(function(){return e.updated=Date.now(),a("put",{store:t.store,value:e})}).then(function(){return H(t.store,"restore",e,[]),a("del",{store:"bin",id:n})}).then(function(){return t})})}var Un={settings:1,heads:1,groups:1,pin:1},Gn=/(^|\.)(lockBefore|allowDel|prefix|digits)$|(^|\.)closed\./;function Mn(n,t,e){if(n==="pin")return!t==!e?t&&e&&t.hash!==e.hash?[["pin","on","changed"]]:[]:[["pin",t?"on":"off",e?"on":"off"]];var r=R(t&&typeof t=="object"?t:{v:t},e&&typeof e=="object"?e:{v:e});return n==="settings"?r.filter(function(i){return Gn.test(i[0])}):r}function Vn(n,t,e){var r={id:n,v:t,updated:Date.now()};if(!Un[n])return a("put",{store:"meta",value:r});var i;return a("get",{store:"meta",id:n}).then(function(u){i=u?u.v:void 0},function(){}).then(function(){return a("put",{store:"meta",value:r})}).then(function(u){var o=Mn(n,i,t);return o.length&&H("meta",o.some(function(c){return/lockBefore|closed/.test(c[0])})?"lock":"meta",{id:n,name:n},o.slice(0,60),{why:e&&e.why||void 0}),u})}function xn(n){try{return crypto.subtle.digest("SHA-256",new TextEncoder().encode(n)).then(function(t){return Array.prototype.map.call(new Uint8Array(t),function(e){return("0"+e.toString(16)).slice(-2)}).join("")},function(){return""})}catch{return Promise.resolve("")}}window.NSStore={ready:function(){return y().then(function(n){return cn||(cn=!0,On()),n})},mode:function(){return d?d.mode():N},_call:a,_send:m,auth:function(n,t){return y().then(function(e){return e==="vault"?m(n,t||{}):n==="authStatus"?{on:!1,local:!0}:Promise.reject(new Error("The data home is not reachable"))})},list:function(n){if(n==="doc"){if(E&&E.gen===F&&Date.now()-E.t<2500)return E.p.then(function(r){return r.slice()});var t=F,e=NSStore.list0("doc");return E={p:e,t:Date.now(),gen:t},e.catch(function(){E&&E.p===e&&(E=null)}),e.then(function(r){return r.slice()})}return NSStore.list0(n)},list0:function(n){return a("list",{store:n}).then(function(t){return t=t||[],n==="doc"?K(t):t},function(t){if(n==="bin"||n==="log"||n==="ver")return[];throw t})},get:function(n,t){return a("get",{store:n,id:t}).then(function(e){return n==="doc"&&e?K(e):e})},delImport:Fn,docStat:function(n){return y().then(function(t){return t==="vault"?m("docStat",{}).then(null,function(){return null}):null}).then(function(t){return t&&typeof t.n=="number"?t:n?null:a("list",{store:"doc"}).then(function(e){return e=e||[],{n:e.length,oldest:e.length?Math.min.apply(null,e.map(function(r){return r.created||Date.now()})):0}})})},docsFrom:function(n){return y().then(function(t){var e=t==="vault"?m("docsFrom",{closed:n||{}}).then(null,function(r){if(/NSAUTH/.test(r&&r.message))throw r;return null}):Promise.resolve(null);return e.then(function(r){return r&&Array.isArray(r.docs)?r:a("list",{store:"doc"}).then(function(i){return{docs:i||[],cut:{}}})})}).then(function(t){return K(t.docs).then(function(e){return t.docs=e||[],t})})},put:fn,del:_n,restore:Hn,binDays:J,lockDate:q,exportAll:function(){return a("exportAll")},snapshot:function(n,t){return y().then(function(e){return e==="vault"?m("snapshot",{have:n||{},auto:!!t}).then(null,function(r){if(/NSAUTH|office network/.test(r&&r.message))throw r;return null}):null})},restoreFiles:function(n,t){return y().then(function(e){if(e!=="vault")throw new Error("The data home is not reachable");return m("restoreFiles",{files:n,note:t||""})}).then(function(e){return g().then(function(r){return b({id:v(),at:Date.now(),who:r,site:location.hostname,act:"restore-files",n:n.length,file:t||"",ch:[]})}).catch(function(){}).then(function(){return e})})},deskBackup:function(n,t){return y().then(function(e){return e==="vault"?m("deskBackup",Object.assign({op:n},t||{})):null})},importAll:function(n,t,e){e=e||{};var r={};return Object.keys(n||{}).forEach(function(i){Array.isArray(n[i])&&(r[i]=n[i].length)}),Promise.all([a("importAll",{data:n,replace:!!t}),xn(JSON.stringify(n||{}))]).then(function(i){var u=i[0],o=e.wipe?"wipe":e.file||t?"restore-file":"import";return(u||o!=="import")&&g().then(function(c){return b({id:v(),at:Date.now(),who:c,site:location.hostname,act:o,n:u||0,file:e.file||"",replace:!!t,counts:r,fileHash:i[1],ch:[]})}).catch(function(){}),u})},cancel:function(n,t){return gn(n,t,!1)},uncancel:function(n,t){return gn(n,t,!0)},mustCancel:vn,linkBiz:on,linkTo:kn,unlinked:In,bizIdFor:x,logCheck:function(){return a("logCheck")},wipe:function(n){if(T("del","doc"))return O();var t={};return Promise.all(["biz","party","item","doc","bin"].map(function(e){return a("list",{store:e}).then(function(r){return t[e]=(r||[]).filter(function(i){return!i.sample}).length,a("clear",{store:e})})})).then(function(){return w=null,window.NSStore.note("wipe",{counts:t,why:n||void 0})})},note:function(n,t){return g().then(function(e){return b(Object.assign({id:v(),at:Date.now(),who:e,site:location.hostname,act:n,ch:[]},t||{}))}).catch(function(){})},persist:function(){return a("persist")},estimate:function(){return a("estimate")},autosave:function(n,t){return y().then(function(e){return e==="vault"?m(n,t):null})},meta:function(n,t){return arguments.length<2?a("get",{store:"meta",id:n}).then(function(e){return e?e.v:void 0}):T("put","meta",n)?O():(n==="who"&&(I=t||""),Vn(n,t,arguments[2]))},sfTag:function(){return Promise.all([a("get",{store:"meta",id:"sf"}),a("get",{store:"meta",id:"sf-tag"})]).then(function(n){return n[0]&&n[0].v&&n[0].v.on&&n[1]&&n[1].v||""},function(){return""})},sfClaim:function(n){return Y().then(function(t){return t?(n.owner=C,pn(t),t.claim(n).then(function(e){return e||null},function(){return null})):null})},sfRelease:function(){return Y().then(function(n){return n?n.release(C):null})},sfEditing:function(n,t){return Y().then(function(e){return e?(pn(e),e.setEditing(C,n||null,t||"").then(function(){return n?e.editorOf(n):null},function(){return null})):null})},uid:v};var C="o"+Math.random().toString(36).slice(2,10),wn=!1;function Y(){try{var n=d?window.parent:window;return n.NS&&n.NS.sf&&n.NS.sf.ready?n.NS.sf.ready().then(Kn):Promise.resolve(null)}catch{return Promise.resolve(null)}}function Kn(){try{var n=d?window.parent:window;return n.NS&&n.NS.sf&&n.NS.sf.engine&&n.NS.sf.engine()?n.NS.sf:null}catch{return null}}function pn(n){wn||(wn=!0,window.addEventListener("pagehide",function(){try{n.release(C),n.setEditing(C,null)}catch{}}))}})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* core.js */
try{(function(){"use strict";var r=window.NS=window.NS||{};r.startQuery=location.search,r.$=function(t,e){return(e||document).querySelector(t)},r.$$=function(t,e){return Array.prototype.slice.call((e||document).querySelectorAll(t))},r.esc=function(t){return String(t??"").replace(/[&<>"']/g,function(e){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[e]})},r.el=function(t,e,n){var a=document.createElement(t);return e&&Object.keys(e).forEach(function(o){e[o]!=null&&a.setAttribute(o,e[o])}),n!=null&&(a.innerHTML=n),a},r.STATES=[["01","Jammu and Kashmir"],["02","Himachal Pradesh"],["03","Punjab"],["04","Chandigarh"],["05","Uttarakhand"],["06","Haryana"],["07","Delhi"],["08","Rajasthan"],["09","Uttar Pradesh"],["10","Bihar"],["11","Sikkim"],["12","Arunachal Pradesh"],["13","Nagaland"],["14","Manipur"],["15","Mizoram"],["16","Tripura"],["17","Meghalaya"],["18","Assam"],["19","West Bengal"],["20","Jharkhand"],["21","Odisha"],["22","Chhattisgarh"],["23","Madhya Pradesh"],["24","Gujarat"],["26","Dadra and Nagar Haveli and Daman and Diu"],["27","Maharashtra"],["29","Karnataka"],["30","Goa"],["31","Lakshadweep"],["32","Kerala"],["33","Tamil Nadu"],["34","Puducherry"],["35","Andaman and Nicobar Islands"],["36","Telangana"],["37","Andhra Pradesh"],["38","Ladakh"],["97","Other Territory"],["96","Outside India (export)"]],r.stateName=function(t){var e=r.STATES.filter(function(n){return n[0]===t})[0];return e?e[1]:""},r.stateLoc=function(t){var e="st."+t,n=r.t?r.t(e):e;return n&&n!==e?n:r.stateName(t)},r.gstinCheck=function(t){if(t=String(t||"").toUpperCase().replace(/\s/g,""),!t)return{ok:!0,empty:!0};if(!/^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]Z[0-9A-Z]$/.test(t)&&!/^[0-9]{2}[A-Z0-9]{13}$/.test(t))return{ok:!1,msg:r.t("gst.len")};for(var e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",n=0,a=0;a<14;a++){var o=e.indexOf(t[a])*(a%2?2:1);n+=Math.floor(o/36)+o%36}var i=e[(36-n%36)%36];if(i!==t[14])return{ok:!1,msg:r.t("gst.chk")};var u=t.slice(0,2);return{ok:!0,state:r.stateName(u)?u:"",pan:t.slice(2,12)}},r.num=function(t){var e=parseFloat(String(t??"").replace(/,/g,""));return isFinite(e)?e:0},r.r2=function(t){return Math.round((t+Number.EPSILON)*100)/100},r.money=function(t,e){var n=r.r2(t);return(n<0?"-":"")+(e===!1?"":"₹")+Math.abs(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})},r.qty=function(t){return r.r2(t).toLocaleString("en-IN",{maximumFractionDigits:3})};var k=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],$=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];function M(t){return t<20?k[t]:$[Math.floor(t/10)]+(t%10?" "+k[t%10]:"")}function it(t){return(t>=100?k[Math.floor(t/100)]+" Hundred"+(t%100?" ":""):"")+(t%100?M(t%100):"")}function Wt(t){if(t===0)return"Zero";var e=[],n=Math.floor(t/1e7);t%=1e7,n&&e.push((n>999?Wt(n):it(n))+" Crore");var a=Math.floor(t/1e5);t%=1e5,a&&e.push(M(a)+" Lakh");var o=Math.floor(t/1e3);return t%=1e3,o&&e.push(M(o)+" Thousand"),t&&e.push(it(t)),e.join(" ")}r.inWords=function(t){t=r.r2(Math.abs(t));var e=Math.floor(t),n=Math.round((t-e)*100);return"Rupees "+Wt(e)+(n?" and "+M(n)+" Paise":"")+" Only"},r.today=function(){var t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,10)},r.fmtDate=function(t){if(!t)return"";var e=t.split("-");return e.length!==3?t:e[2]+"-"+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+e[1]-1]+"-"+e[0]},r.fy=function(t){var e=t?new Date(t+"T00:00:00"):new Date,n=e.getFullYear(),a=e.getMonth()>=3?n:n-1;return a+"-"+String(a+1).slice(2)},r.periodPresets=function(t){t=t||r.today();var e=+t.slice(0,4),n=+t.slice(5,7),a=r.fy(t).slice(0,4)+"-04-01",o=+a.slice(0,4),i=function(f,m){return f+"-"+String(m).padStart(2,"0")+"-"+String(new Date(f,m,0).getDate()).padStart(2,"0")},u=n===1?e-1:e,s=n===1?12:n-1,c=n>=10?10:n>=7?7:n>=4?4:1,l=c===1?e-1:e,d=c===1?10:c-3;return{today:[t,t],month:[t.slice(0,8)+"01",t],lmonth:[u+"-"+String(s).padStart(2,"0")+"-01",i(u,s)],quarter:[e+"-"+String(c).padStart(2,"0")+"-01",t],lquarter:[l+"-"+String(d).padStart(2,"0")+"-01",i(l,d+2)],fy:[a,t],lfy:[o-1+"-04-01",o+"-03-31"]}},r.period=function(){var t=null;try{t=JSON.parse(localStorage.getItem("ns-period")||"null")}catch{}var e=t&&/^\d{4}-\d{2}-\d{2}$/.test(t.to||"")?t.to:r.today(),n=t&&/^\d{4}-\d{2}-\d{2}$/.test(t.from||"")?t.from:r.fy(e).slice(0,4)+"-04-01";if(t&&t.pre&&t.pre!=="custom"){var a=r.periodPresets()[t.pre];a&&(n=a[0],e=a[1])}return{from:n,to:e,pre:t&&t.pre||""}},r.periodSet=function(t,e,n){var a=r.period();if(t=t||a.from,e=e||a.to,t>e){var o=t;t=e,e=o}if(n===void 0){var i=r.periodPresets();n=Object.keys(i).filter(function(u){return i[u][0]===t&&i[u][1]===e})[0]||"custom"}try{localStorage.setItem("ns-period",JSON.stringify({from:t,to:e,pre:n}))}catch{}try{window.dispatchEvent(new CustomEvent("ns-period",{detail:{from:t,to:e}}))}catch{}return[t,e]},r.periodPre=function(t,e){var n=r.periodPresets();return Object.keys(n).filter(function(a){return n[a][0]===t&&n[a][1]===e})[0]||"custom"},r.toast=function(t,e){var n=r.$("#ns-toast");n||(n=r.el("div",{id:"ns-toast",role:"status","aria-live":"polite"}),document.body.appendChild(n));var a=!!document.querySelector("dialog[open]")&&!!n.showPopover;try{a?(n.setAttribute("popover","manual"),n.matches(":popover-open")||n.showPopover()):n.hasAttribute("popover")&&n.removeAttribute("popover")}catch{}n.textContent=t,n.className="show"+(e?" "+e:""),clearTimeout(n._h),n._h=setTimeout(function(){n.className="",setTimeout(function(){try{!n.className&&n.matches(":popover-open")&&n.hidePopover()}catch{}},300)},3200)};function Et(t){var e=document.documentElement;t==="light"||t==="dark"?e.setAttribute("data-theme",t):e.removeAttribute("data-theme"),r.$$("[data-theme-btn]").forEach(function(n){n.setAttribute("aria-label",r.t?r.t("theme"):"Colour theme"),n.title=r.t?r.t("theme"):"Colour theme"})}r.initTheme=function(){var t;try{t=localStorage.getItem("ns-theme")}catch{}Et(t),document.addEventListener("ns-lang",function(){var e;try{e=localStorage.getItem("ns-theme")}catch{}Et(e)}),r.$$("[data-theme-btn]").forEach(function(e){e.addEventListener("click",function(){var n;try{n=localStorage.getItem("ns-theme")}catch{}var a=n?n==="dark":matchMedia("(prefers-color-scheme: dark)").matches,o=a?"light":"dark";try{localStorage.setItem("ns-theme",o)}catch{}Et(o)})})};var Je=0;r.suggest=function(t,e,n,a){var o=r.el("datalist",{id:"ns-dl-"+ ++Je});t.setAttribute("list",o.id),t.setAttribute("autocomplete","off"),t.parentNode.appendChild(o);var i=[];function u(){return Promise.resolve(e()).then(function(l){i=l||[],o.innerHTML=i.map(function(d){return'<option value="'+r.esc(n(d))+'"></option>'}).join("")})}t.addEventListener("focus",u),t.addEventListener("input",function(){var l=t.value.trim().toLowerCase();if(l){var d=i.filter(function(f){return n(f).toLowerCase()===l})[0];d&&t._picked!==d.id&&(t._picked=d.id,a(d))}});var s=String(e),c=/["']item["']/.test(s)?"item":/["']party["']/.test(s)&&t.id!=="s-name"?"party":"";return c&&(t._qa={kind:c,known:function(l){return l=String(l||"").trim().toLowerCase(),!l||i.some(function(d){return n(d).toLowerCase()===l})},done:function(l){u().then(function(){t.value=n(l),t._picked=l.id,a(l),t.dispatchEvent(new Event("change",{bubbles:!0}))})}}),u(),{refresh:u}};var We={"dl-party":"party","dl-item":"item"};function Z(t){if(!t||t.tagName!=="INPUT")return null;if(t._qa)return t._qa;var e=We[t.getAttribute("list")||""]||t.getAttribute("data-qa");return e?{kind:e,known:function(n){n=String(n||"").trim().toLowerCase();var a=document.getElementById(t.getAttribute("list")||"");return!n||!a||[].some.call(a.options,function(o){return o.value.toLowerCase()===n})},done:function(n){var a=document.getElementById(t.getAttribute("list")||"");a&&a.appendChild(r.el("option",{value:e==="item"?n.desc:n.name})),document.dispatchEvent(new CustomEvent("ns-qa",{detail:{kind:e,rec:n,inp:t}})),t.value=e==="item"?n.desc:n.name,t.dispatchEvent(new Event("input",{bubbles:!0})),t.dispatchEvent(new Event("change",{bubbles:!0}))}}:null}function Zt(t,e){var n=t._qaChip,a=t.value.trim();if(!a||e.known(a)){n&&(n.hidden=!0);return}n||(n=t._qaChip=r.el("div",{class:"qa-new"}),t.insertAdjacentElement("afterend",n),n.addEventListener("mousedown",function(o){o.preventDefault()}),n.addEventListener("click",function(o){o.target.closest("button")&&r.quickAdd(t)})),n.innerHTML="<span>"+r.esc(r.t(e.kind==="item"?"qa.newitem":"qa.newparty",{n:a}))+'</span> <button type="button" class="btn sm">'+r.esc(r.t(e.kind==="item"?"qa.additem":"qa.addparty"))+"</button> <kbd>F2</kbd>",n.hidden=!1}document.addEventListener("focusout",function(t){var e=Z(t.target);e&&setTimeout(function(){Zt(t.target,e)},150)},!0),document.addEventListener("input",function(t){var e=Z(t.target);e&&t.target._qaChip&&!t.target._qaChip.hidden&&Zt(t.target,e)},!0),document.addEventListener("keydown",function(t){if(!(t.key!=="F2"||t.altKey||t.ctrlKey||t.metaKey||t.shiftKey)){var e=Z(document.activeElement);e&&(t.preventDefault(),t.stopPropagation(),r.quickAdd(document.activeElement))}},!0);function Ze(){var t=(document.querySelector("dialog[open][data-kind]")||{getAttribute:function(){return""}}).getAttribute("data-kind");return t?/^(mout|pbill|pret|exp|po)$/.test(t)?"supplier":"customer":/^(purchase|purchase-order|voucher|debit-note|self-invoice)\./i.test(location.host)?"supplier":"customer"}r.quickAddNew=function(t){var e=t==="item",n=r.el("input",{"data-qa":e?"item":"party"});return NSStore.list(e?"item":"party").then(function(a){var o={};(a||[]).forEach(function(i){o[String((e?i.desc:i.name)||"").trim().toLowerCase()]=1}),n._qa={kind:e?"item":"party",known:function(i){return!!o[String(i||"").trim().toLowerCase()]},done:function(){window.NSApp&&NSApp.show&&NSApp.show()}},r.quickAdd(n)})},r.quickAdd=function(t){var e=Z(t);if(e){var n=function(){return window.NSPM.quick(t,e,Ze())};if(window.NSPM)return n();var a=window.NS_CFG&&NS_CFG.lazy||{};return r.loadJs(a["pmforms.js"]||"/assets/pmforms.js").then(n,function(){r.toast("Could not open the form. Check the internet connection and try again.","bad")})}},r.docNav=function(t,e){if(!(!t||!window.NSStore)){var n=function(){return NSStore.list("doc").then(function(i){return i.filter(function(u){return u&&u.id&&e.mine(u)}).sort(function(u,s){return String(u.date||"").localeCompare(String(s.date||""))||String(u.no||"").localeCompare(String(s.no||""),void 0,{numeric:!0})||(u.created||0)-(s.created||0)})})},a=t.querySelector("#dn-nav");if(!a){a=document.createElement("div"),a.id="dn-nav",a.className="dn-nav",a.setAttribute("role","group"),a.setAttribute("aria-label","Saved documents");var o=t.querySelector(".tool-top");o&&o.parentNode?o.parentNode.insertBefore(a,o.nextSibling):t.insertBefore(a,t.firstChild),a.addEventListener("click",function(i){var u=i.target.closest("[data-dnav]");if(!(!u||u.disabled)){var s=u.getAttribute("data-dnav");if(s==="list"){a._o.list();return}n().then(function(c){var l=c.map(function(f){return f.id}).indexOf(a._o.current());l<0&&(l=c.length);var d=s==="first"?0:s==="last"?c.length-1:s==="back"?l-1:l+1;d>=0&&d<c.length&&a._o.open(c[d])})}}),a.addEventListener("keydown",function(i){if(!(i.key!=="Enter"||!i.target.classList.contains("vt-find"))){i.preventDefault();var u=String(i.target.value||"").trim().toLowerCase();u&&n().then(function(s){var c=s.filter(function(l){return String(l.no||"").toLowerCase()===u})[0]||s.filter(function(l){return String(l.no||"").toLowerCase().indexOf(u)>=0}).slice(-1)[0];c?(i.target.value="",a._o.open(c)):r.toast("Nothing saved with number "+i.target.value,"bad")})}})}a._o=e,r.mkNav=e,n().then(function(i){var u=i.map(function(w){return w.id}).indexOf(e.current()),s=i.length,c=u>=0;a.hidden=!s,document.dispatchEvent(new CustomEvent("ns-mknav",{detail:{n:s,at:u}}));var l=function(w,v,g,E){return'<button type="button" class="btn sm" data-dnav="'+w+'" title="'+r.esc(g)+'" aria-label="'+r.esc(g)+'"'+(E?" disabled":"")+">"+v+"</button>"},d=a.querySelector(".vt-find"),f=d?d.value:"",m=d&&document.activeElement===d,p=function(w,v){return r.t("dnv."+w,v)};a.innerHTML=l("first","|◀",p("first"),!s||u===0)+l("back","◀",p("back"),!s||u===0)+'<span class="vt-pos soft">'+(c?p("pos",{a:u+1,n:s}):p("new",{n:s}))+"</span>"+l("next","▶",p("next"),!c||u>=s-1)+l("last","▶|",p("last"),!s||u===s-1)+'<input class="vt-find" type="search" placeholder="'+r.esc(p("find"))+'" aria-label="'+r.esc(p("findh"))+'" autocomplete="off">'+l("list",r.esc(p("list")),p("listh"));var h=a.querySelector(".vt-find");f&&(h.value=f),m&&h.focus()},function(){})}};var Ye="/assets/vendor/zxing-reader-3.1.6.js",Xe="/assets/vendor/zxing_reader-3.1.6.wasm",tn=["code_128","ean_13","ean_8","upc_a","upc_e","qr_code","code_39","itf","data_matrix"];r.codeReader=function(){if("BarcodeDetector"in window)return window.BarcodeDetector.getSupportedFormats().then(function(e){var n=e.filter(function(o){return tn.indexOf(o)>=0});if(!n.length)throw new Error("none");var a=new window.BarcodeDetector({formats:n});return{read:function(o){return a.detect(o).then(function(i){return i&&i[0]?i[0].rawValue:""},function(){return""})}}}).catch(function(){return t()});return t();function t(){return r.loadJs(Ye).then(function(){var e=window.ZXingWASM;if(!e)throw new Error("load");e.prepareZXingModule({overrides:{locateFile:function(o,i){return/\.wasm$/.test(o)?Xe:i+o}},fireImmediately:!0});var n=document.createElement("canvas"),a=n.getContext("2d",{willReadFrequently:!0});return{read:function(o){if(!o.videoWidth)return Promise.resolve("");var i=Math.min(o.videoWidth,1280),u=Math.round(o.videoHeight*i/o.videoWidth);return n.width=i,n.height=u,a.drawImage(o,0,0,i,u),e.readBarcodes(a.getImageData(0,0,i,u),{tryHarder:!0,maxNumberOfSymbols:1}).then(function(s){return s&&s[0]&&s[0].isValid?s[0].text:""},function(){return""})}}})}},r.scanCode=function(t){return new Promise(function(e){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){r.toast("This browser cannot use the camera. A USB barcode scanner works: it types into the box.","bad"),e("");return}var n=document.createElement("dialog");n.className="b2-dlg ns-scan",n.innerHTML="<h3>"+r.esc(t||"Scan a barcode or QR code")+'</h3><div class="ns-scan-v"><video playsinline muted></video><span class="ns-scan-line"></span></div><p class="soft ns-scan-msg">Starting the camera…</p><div class="row" style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn" data-x>Close</button></div>',document.body.appendChild(n),n.showModal();var a=n.querySelector("video"),o=n.querySelector(".ns-scan-msg"),i=null,u=!1,s=0,c=function(l){if(!u){u=!0,clearTimeout(s);try{i&&i.getTracks().forEach(function(d){d.stop()})}catch{}n.open&&n.close(),n.remove(),e(l||"")}};n.querySelector("[data-x]").addEventListener("click",function(){c("")}),n.addEventListener("cancel",function(l){l.preventDefault(),c("")}),navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280}},audio:!1}).then(function(l){return i=l,a.srcObject=l,a.play()}).then(function(){return o.textContent="Hold the code inside the box.",r.codeReader()}).then(function(l){var d=function(){u||l.read(a).then(function(f){f?(navigator.vibrate&&navigator.vibrate(60),c(f)):s=setTimeout(d,180)})};d()}).catch(function(l){o.textContent=l&&l.name==="NotAllowedError"?"Camera permission was refused. Allow the camera for this site and try again.":"The camera could not be started on this device."})})};var Mt=null;function Yt(){var t=window.NS_CFG&&NS_CFG.lazy||{};return r.loadJs(t["rpcore.js"]||"/assets/rpcore.js").then(function(){return Promise.all(NSRp.LIB.map(function(e){return r.loadJs(e)}))}).then(function(){return window.NSRp})}function en(){try{return JSON.parse(localStorage.getItem("ns-rp")||"null")||{}}catch{return{}}}r.rpCan=function(){return"usb"in navigator||"serial"in navigator||!!r.helperUp},r.rpReady=function(){var t=en();return r.rpCan()&&!!t.dev&&t.direct!==!1},r.rpSetup=function(t){return Yt().then(function(e){return e.setup(t)})},r.rpForget=function(){if(window.NSRp)NSRp.forget();else try{localStorage.removeItem("ns-rp")}catch{}},r.rpPrint=function(t,e){if(e=e||function(){},!r.rpCan())return r.toast(r.t("tpr.nobrowser"),"bad"),e(),Promise.resolve(!1);if(t&&t.nodeType){var n=document.createElement("div");n.style.cssText="position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;width:"+(t.offsetWidth||320)+"px",n.setAttribute("aria-hidden","true"),n.innerHTML=t.innerHTML,document.body.appendChild(n),t=n}var a=t;return Yt().then(function(o){var i=a&&a.nodeType?o.fromSheets(a):null;a&&a.nodeType&&a.remove();var u=function(){return i?o.printPlans(i):o.printWith(a)};return o.has()?u().then(function(){return!0}):o.setup({thenClose:!0}).then(function(s){return s?u().then(function(){return!0}):!1})}).then(function(o){return o&&r.toast(r.t("tpr.sent")),o},function(){return a&&a.nodeType&&a.parentNode&&a.remove(),r.toast(r.t("tpr.noans2"),"bad"),e(),!1})},r.rpButtons=function(t,e){Mt=e,r.$$('[data-do="print"]').forEach(function(n){var a=n.parentNode.querySelector('[data-do="rprint"]'),o=n.parentNode.querySelector('[data-do="rpset"]');a||(a=document.createElement("button"),a.type="button",a.className=n.className.replace(/\bprimary\b/,""),a.setAttribute("data-do","rprint"),a.setAttribute("data-ic","print"),a.setAttribute("data-i18n","tpr.btn"),a.textContent=r.t("tpr.btn"),a.addEventListener("click",function(){Mt&&Mt()}),o=document.createElement("button"),o.type="button",o.className=a.className,o.setAttribute("data-do","rpset"),o.setAttribute("data-i18n","tpr.set"),o.textContent=r.t("tpr.set"),o.addEventListener("click",function(){r.rpSetup()}),n.insertAdjacentElement("afterend",a),a.insertAdjacentElement("afterend",o),o.setAttribute("data-ic","gear"),window.matchMedia&&matchMedia("(max-width:600px)").matches&&n.closest(".actions")&&(o.removeAttribute("data-i18n"),o.setAttribute("data-i18n-label","tpr.set"),o.setAttribute("data-i18n-title","tpr.set"),o.setAttribute("aria-label",r.t("tpr.set")),o.title=r.t("tpr.set"),o.textContent="",o.classList.add("rp-gear"))),a.hidden=!t,o&&(o.hidden=!t)})};var nn="/assets/vendor/signature_pad-5.1.4.min.js";function rn(t){for(var e=t.width,n=t.height,a=t.getContext("2d").getImageData(0,0,e,n).data,o=e,i=n,u=-1,s=-1,c=0;c<n;c++)for(var l=0;l<e;l++)a[(c*e+l)*4+3]>8&&(l<o&&(o=l),l>u&&(u=l),c<i&&(i=c),c>s&&(s=c));if(u<0)return"";var d=6,f=document.createElement("canvas");return o=Math.max(0,o-d),i=Math.max(0,i-d),u=Math.min(e-1,u+d),s=Math.min(n-1,s+d),f.width=u-o+1,f.height=s-i+1,f.getContext("2d").drawImage(t,o,i,f.width,f.height,0,0,f.width,f.height),f.toDataURL("image/png")}r.drawSign=function(t){return r.loadJs(nn).then(function(){return new Promise(function(e){var n=document.createElement("dialog");n.className="b2-dlg ns-sign",n.innerHTML="<h3>"+r.esc(t||"Draw your signature")+'</h3><p class="soft">Sign inside the box with your finger, a pen or the mouse.</p><div class="ns-sign-box"><canvas></canvas><span class="ns-sign-ln"></span></div><div class="row" style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" data-k="undo">Undo</button><button type="button" class="btn" data-k="clear">Clear</button><button type="button" class="btn" data-k="x">Cancel</button><button type="button" class="btn primary" data-k="ok">Use this signature</button></div>',document.body.appendChild(n),n.showModal();var a=n.querySelector("canvas"),o=Math.max(window.devicePixelRatio||1,1),i=n.querySelector(".ns-sign-box");a.width=i.clientWidth*o,a.height=i.clientHeight*o,a.getContext("2d").scale(o,o);var u=new window.SignaturePad(a,{penColor:"#0b2a6f",minWidth:.8,maxWidth:2.6}),s=function(c){try{u.off()}catch{}n.open&&n.close(),n.remove(),e(c||"")};n.addEventListener("cancel",function(c){c.preventDefault(),s("")}),n.addEventListener("click",function(c){var l=c.target.closest("button[data-k]");if(l){var d=l.getAttribute("data-k");if(d==="x")s("");else if(d==="clear")u.clear();else if(d==="undo"){var f=u.toData();f.length&&(f.pop(),u.fromData(f))}else if(d==="ok"){if(u.isEmpty()){r.toast("Draw the signature first","bad");return}s(rn(a))}}})})},function(){return r.toast("The signature box could not load. Upload a picture of the signature instead.","bad"),""})};function Xt(){var t=document.documentElement;if(!(!t.classList.contains("embed")||t.classList.contains("appdoc"))){var e=document.querySelector("#tool.tool")||document.querySelector("section.tool")||document.querySelector(".tool"),n=e||document.querySelector(".gt")||document.querySelector('[id$="-tool"]')||document.querySelector(".hub"),a=document.querySelector("main");if(n&&a){for(var o=n;o.parentNode&&o.parentNode!==a;)o=o.parentNode;o.parentNode===a&&(o.classList.add("appdoc-keep"),t.classList.add("appdoc-cut"))}if(t.classList.add("appdoc"),!n&&a&&!a.querySelector(".hero")&&a.querySelector(":scope>article.prose, :scope>.prose")){t.classList.add("appdoc-page");return}if(!e){if(!n)return;var i=function(){var g=n.querySelector("[data-prl-sheet]");g&&(u.disconnect(),an(n,g))},u=new MutationObserver(i);u.observe(n,{childList:!0,subtree:!0}),i(),setTimeout(function(){u.disconnect()},15e3);return}var s=e.querySelector(".grid2"),c=e.querySelector(".dc-grid");if(!(!s&&!c)){t.classList.add("appdoc-pv");var l=e.querySelector(".actions");l||(l=document.createElement("div"),l.className="actions appdoc-bar",e.appendChild(l));var d=document.createElement("button");d.type="button",d.className="btn appdoc-pvb",d.setAttribute("data-ic","eye");var f=l.querySelector('[data-do="save"]');if(f?f.parentNode.insertBefore(d,f.nextSibling):l.insertBefore(d,l.firstChild),c){var m=e.querySelector('[data-dc="print"]');if(m){var p=document.createElement("button");p.type="button",p.className="btn primary",p.setAttribute("data-ic","print"),p.textContent=m.textContent,p.addEventListener("click",function(){m.click()}),l.insertBefore(p,d.nextSibling)}}var h=function(){return c?c.classList.contains("pv-on"):e.getAttribute("data-tab")==="preview"},w=function(){d.textContent=r.t(h()?"tab.edit":"tab.preview"),d.setAttribute("data-ic",h()?"edit":"eye"),d.setAttribute("aria-pressed",String(h()))},v=function(g){if(c)c.classList.toggle("pv-on",g);else{var E=e.querySelector('[data-tab-btn="'+(g?"preview":"edit")+'"]');E?E.click():e.setAttribute("data-tab",g?"preview":"edit")}w(),window.scrollTo(0,0)};!c&&e.getAttribute("data-tab")!=="edit"&&v(!1),d.addEventListener("click",function(){v(!h())}),document.addEventListener("keydown",function(g){g.key==="Escape"&&h()&&!document.querySelector("dialog[open]")&&(g.preventDefault(),g.stopImmediatePropagation(),v(!1))},!0),document.addEventListener("ns-lang",w),w()}}}function an(t,e){var n=document.documentElement;n.classList.add("appdoc-pv");var a=document.createElement("div");a.className="actions appdoc-bar appdoc-keep",t.parentNode.insertBefore(a,t.nextSibling);var o=document.createElement("button");o.type="button",o.className="btn appdoc-pvb",a.appendChild(o);var i=document.createElement("button");i.type="button",i.className="btn primary",i.setAttribute("data-ic","print"),i.textContent=r.t("b.print"),i.addEventListener("click",function(){var l=t.querySelector("[data-prl-print]");l&&l.click()}),a.appendChild(i);var u=function(){return t.classList.contains("pv-sheet")},s=function(){o.textContent=r.t(u()?"tab.edit":"tab.preview"),o.setAttribute("data-ic",u()?"edit":"eye"),o.setAttribute("aria-pressed",String(u()))},c=function(l){t.classList.toggle("pv-sheet",l),s(),window.scrollTo(0,0)};o.addEventListener("click",function(){c(!u())}),document.addEventListener("keydown",function(l){l.key==="Escape"&&u()&&!document.querySelector("dialog[open]")&&(l.preventDefault(),l.stopImmediatePropagation(),c(!1))},!0),document.addEventListener("ns-lang",s),s()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",function(){setTimeout(Xt,0)}):setTimeout(Xt,0),r.typingIn=function(t){return!!t&&(t.isContentEditable||t.tagName==="TEXTAREA"||t.tagName==="INPUT"&&!/^(checkbox|radio|button|submit|reset|range|file|color|image)$/i.test(t.type))},window.addEventListener("keydown",function(t){if(!(t.key!=="Escape"||t.defaultPrevented||t.altKey||t.ctrlKey||t.metaKey||window.parent===window||document.querySelector("dialog[open]"))){var e=!1;try{e=!!window.parent.document}catch{}if(!e){var n=t.target;if(r.typingIn(n)){n.list&&n.value||n.blur();return}t.preventDefault();try{window.parent.postMessage({nsEsc:1},"*")}catch{}}}});var O="nivesh-sahayak-backup";r.backupData=function(){return NSStore.exportAll().then(function(t){return{app:"Nivesh Sahayak",kind:"backup",version:1,saved:new Date().toISOString(),data:t}})},r.downloadBackup=function(){return r.backupData().then(function(t){var e=new Blob([JSON.stringify(t,null,1)],{type:"application/json"}),n=r.el("a",{href:URL.createObjectURL(e),download:O+"-"+r.today()+".json"});return document.body.appendChild(n),n.click(),n.remove(),setTimeout(function(){URL.revokeObjectURL(n.href)},4e3),NSStore.meta("lastBackup",Date.now())}).then(function(){r.toast(r.t("bk.saved")),xt()})},r.restoreFromFile=function(t){return t.text().then(function(e){var n=JSON.parse(e);if(!n||n.app!=="Nivesh Sahayak"||!n.data)throw new Error(r.t("bk.notours"));return NSStore.importAll(n.data,!1,{file:t.name||""})}).then(function(e){return r.toast(e?r.t("bk.restored",{n:e}):r.t("bk.nothing")),e},function(e){throw r.toast(e instanceof SyntaxError?r.t("bk.unread"):e.message||r.t("bk.unread"),"bad"),e})};function xt(){var t=r.$("#ns-remind");t&&(t.hidden=!0)}r.checkReminder=function(){var t=NSStore.docStat?NSStore.docStat():NSStore.list("doc").then(function(e){return{n:e.length,oldest:e.length?Math.min.apply(null,e.map(function(n){return n.created||Date.now()})):0}});return Promise.all([NSStore.meta("lastBackup"),t,NSStore.meta("settings")]).then(function(e){var n=e[0]||0,a=e[1].n,o=e[2]&&e[2].remindDays!=null?+e[2].remindDays:7;if(!(!a||!o)){var i=e[1].oldest||Date.now();if(!(!n&&a<3&&Date.now()-i<864e5)){var u=(Date.now()-n)/864e5;if(!(u<o)){var s=r.$("#ns-remind");s&&(r.$("[data-remind-text]",s).textContent=n?r.t("rm.ago",{n:Math.floor(u)}):r.t("rm.none",{n:a}),s.hidden=!1)}}}}).catch(function(){})};var on="ns-folder";function te(){return new Promise(function(t,e){var n=indexedDB.open(on,1);n.onupgradeneeded=function(){n.result.createObjectStore("h")},n.onsuccess=function(){t(n.result)},n.onerror=function(){e(n.error)}})}function ee(t){return te().then(function(e){return new Promise(function(n){var a=e.transaction("h").objectStore("h").get(t);a.onsuccess=function(){n(a.result)},a.onerror=function(){n(null)}})})}function Lt(t,e){return te().then(function(n){return new Promise(function(a){var o=n.transaction("h","readwrite");e==null?o.objectStore("h").delete(t):o.objectStore("h").put(e,t),o.oncomplete=a,o.onerror=a})})}function N(){return ee("dir")}function At(t){return Lt("dir",t)}var st=new URL("/",(window.NS_CFG||{}).vault||"https://my.niveshsahayak.in/vault.html",location.href),sn=(function(){var t=(window.NS_CFG||{}).tools||[];return/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?null:"https://app.niveshsahayak.in/"})();function ne(){try{return window.top.NS_CFG&&!!window.top.NS_CFG.inapp&&window.top.location.origin===location.origin}catch{return!1}}r.folderHere=function(){return ne()||location.origin===st.origin&&window.top===window},r.folderSupported=function(){return"showDirectoryPicker"in window&&!/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)&&!(window.matchMedia&&matchMedia("(pointer: coarse)").matches&&!matchMedia("(any-pointer: fine)").matches)};var re=/[?&]autosave=1/.test(location.search);r.folderHome=function(){var t=sn;if(!t){var e=document.querySelector("#ns-side a[data-ic=app]");t=e?e.href:"https://app.niveshsahayak.in/"}window.open(t+(t.indexOf("?")<0?"?":"&")+"autosave=1","_blank","noopener")};var Y="NSBiz",un=30;function H(t,e){var n=t.name===Y?Promise.resolve(t):t.getDirectoryHandle(Y,{create:!0});return(e||[]).reduce(function(a,o){return a.then(function(i){return i.getDirectoryHandle(String(o).replace(/[\\\/:*?"<>|]+/g,"-"),{create:!0})})},n)}function X(t){return t.name===Y?Y:t.name+" › "+Y}function tt(t,e,n){return t.getFileHandle(e,{create:!0}).then(function(a){return a.createWritable()}).then(function(a){return a.write(n).then(function(){return a.close()})})}function ae(t){var e=t.entries(),n=[],a=function(){return e.next().then(function(o){return o.done?n:(o.value[1].kind==="file"&&n.push(o.value[0]),a())})};return a()}function cn(t,e){return H(t,["Backups"]).then(function(n){return tt(n,O+"-"+r.today()+".json",e).then(function(){return ae(n)}).then(function(a){var o=a.filter(function(i){return i.indexOf(O+"-")===0&&/\.json$/.test(i)}).sort().reverse().slice(un);return Promise.all(o.map(function(i){return n.removeEntry(i).catch(function(){})}))})}).catch(function(){})}r.nsFolder={dir:H,place:X};var Nt=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],et="backup-info.json",C={last:0,t:0,run:null},ln=12e4,oe="NSBIZBK1";function dn(t){return Array.prototype.map.call(new Uint8Array(t),function(e){return("0"+e.toString(16)).slice(-2)}).join("")}function Ct(t){return crypto.subtle.digest("SHA-256",t).then(dn)}function Tt(t,e){return t.getFileHandle(e).then(function(n){return n.getFile()}).then(function(n){return n.text()}).then(JSON.parse).catch(function(){return null})}function Pt(t){return String(t).split("/").filter(Boolean)}function Dt(t,e,n){return e.reduce(function(a,o){return a.then(function(i){return i.getDirectoryHandle(o,{create:!!n})})},Promise.resolve(t))}function fn(t,e,n){var a=Pt(e);return Dt(t,a.slice(0,-1),!0).then(function(o){return tt(o,a[a.length-1],n)})}function pn(t,e){var n=Pt(e);return Dt(t,n.slice(0,-1)).then(function(a){return a.getFileHandle(n[n.length-1])}).then(function(a){return a.getFile()}).then(function(a){return a.arrayBuffer()}).then(function(a){return new Uint8Array(a)})}function ie(t,e){var n=t.entries(),a=[],o=function(){return n.next().then(function(i){if(i.done)return a;var u=i.value[0],s=i.value[1];return s.kind==="file"?(a.push((e||"")+"/"+u),o()):ie(s,(e||"")+"/"+u).then(function(c){return a=a.concat(c),o()})})};return o()}function hn(t,e){var n=Pt(e);return Dt(t,n.slice(0,-1)).then(function(a){return a.removeEntry(n[n.length-1])}).catch(function(){})}function se(t,e,n){return H(t,["Backup",e]).then(function(a){return Tt(a,et).then(function(o){var i=r.today(),u={},s={};return o&&!n&&o.date===i&&(o.files||[]).forEach(function(c){u[c.name]=c.stamp,s[c.name]=c}),NSStore.snapshot(u,!0).then(function(c){if(!c||c.desk||!c.files)return c&&c.desk?"desk":"none";var l=[];return c.files.reduce(function(d,f){return d.then(function(){if(f.same&&s[f.name]){l.push(s[f.name]);return}return Ct(f.bytes).then(function(m){return fn(a,f.name,f.bytes).then(function(){l.push({name:f.name,stamp:f.stamp||"",size:f.bytes.length,sha256:m})})})})},Promise.resolve()).then(function(){var d={};return l.forEach(function(f){d[f.name]=1}),d["/"+et]=1,ie(a).then(function(f){return Promise.all(f.filter(function(m){return!d[m]}).map(function(m){return hn(a,m)}))})}).then(function(){var d={app:"NSBiz",kind:"nsbiz-files",version:1,saved:new Date(c.at).toISOString(),at:c.at,date:i,folder:e,logins:!!c.logins,cipher:!!c.cipher,files:l};return tt(a,et,JSON.stringify(d,null,1)).then(function(){return"ok"})})})})})}function Ot(t,e){if(!window.NSStore||!NSStore.snapshot)return Promise.resolve("none");var n=ln-(Date.now()-C.last);return!e&&n>0?(clearTimeout(C.t),C.t=setTimeout(function(){Ot(t,!0).catch(function(){})},n),Promise.resolve("wait")):(C.run||(C.run=se(t,Nt[new Date().getDay()],!1).then(function(a){return C.last=Date.now(),C.run=null,a},function(a){throw C.run=null,a})),C.run)}function ue(t,e){return!t||t.kind!=="nsbiz-files"||!Array.isArray(t.files)?Promise.reject(new Error(r.t("fb.e_notns"))):e.reduce(function(n,a,o){return n.then(function(){var i=t.files[o];if(!a.bytes||a.bytes.length!==i.size)throw new Error(r.t("fb.e_damaged",{f:i.name}));return Ct(a.bytes).then(function(u){if(u!==i.sha256)throw new Error(r.t("fb.e_mismatch",{f:i.name}))})})},Promise.resolve()).then(function(){return{head:t,files:e}})}r.fileBackup={days:Nt,copy:function(t){return N().then(function(e){return e?e.queryPermission({mode:"readwrite"}).then(function(n){return n!=="granted"?"ask":t?se(e,t,!0):Ot(e,!0)}):"off"})},list:function(){return N().then(function(t){return t?t.queryPermission({mode:"readwrite"}).then(function(e){return e!=="granted"?null:Promise.all(Nt.concat(["Before restore"]).map(function(n){return H(t,["Backup"]).then(function(a){return a.getDirectoryHandle(n)}).then(function(a){return Tt(a,et)}).then(function(a){return a&&a.kind==="nsbiz-files"?{folder:n,date:a.date,at:a.at,logins:a.logins,n:a.files.length,size:a.files.reduce(function(o,i){return o+(i.size||0)},0)}:null}).catch(function(){return null})}))}):null}).then(function(t){return t&&t.filter(Boolean).sort(function(e,n){return n.at-e.at})})},readFolder:function(t,e){var n=e?Promise.resolve(e):N().then(function(a){return H(a,["Backup",t])});return n.then(function(a){return Tt(a,et).then(function(o){if(!o||o.kind!=="nsbiz-files")throw new Error(r.t("fb.e_nofolder"));return Promise.all(o.files.map(function(i){return pn(a,i.name).then(function(u){return{name:i.name,bytes:u}},function(){return{name:i.name,bytes:null}})})).then(function(i){return ue(o,i)})})})},pack:function(){return NSStore.snapshot({},!1).then(function(t){if(!t||!t.files)throw new Error(r.t("fb.e_notdata"));return Promise.all(t.files.map(function(e){return Ct(e.bytes)})).then(function(e){var n={app:"NSBiz",kind:"nsbiz-files",version:1,saved:new Date(t.at).toISOString(),at:t.at,date:r.today(),logins:!!t.logins,cipher:!!t.cipher,files:t.files.map(function(i,u){return{name:i.name,stamp:i.stamp||"",size:i.bytes.length,sha256:e[u]}})},a=new TextEncoder().encode(JSON.stringify(n)),o=new Uint8Array(4);return new DataView(o.buffer).setUint32(0,a.length,!0),new Blob([oe,o,a].concat(t.files.map(function(i){return i.bytes})),{type:"application/octet-stream"})})})},unpack:function(t){return t.arrayBuffer().then(function(e){var n=new Uint8Array(e);if(n.length<12||new TextDecoder().decode(n.subarray(0,8))!==oe)throw new Error(r.t("fb.e_notfile"));var a=new DataView(e,8,4).getUint32(0,!0),o;try{o=JSON.parse(new TextDecoder().decode(n.subarray(12,12+a)))}catch{throw new Error(r.t("fb.e_filedamaged"))}var i=12+a,u=(o.files||[]).map(function(s){var c=n.subarray(i,i+s.size);return i+=s.size,{name:s.name,bytes:c.length===s.size?c.slice():null}});return ue(o,u)})},restore:function(t,e){var n=NSStore.deskBackup?NSStore.deskBackup("bkDays").catch(function(){return null}):Promise.resolve(null),a=n.then(function(o){return o?"desk":r.fileBackup.copy("Before restore")}).then(function(o){return o==="ok"||o==="desk"?o:r.addon.here()?r.fileBackup.pack().then(function(i){return i.arrayBuffer()}).then(function(i){return x("before",{pack:i},[i])}).then(function(){return"addon"}):r.fileBackup.pack().then(function(i){var u=r.el("a",{href:URL.createObjectURL(i),download:"NSBiz-before-restore-"+r.today()+".nsbiz"});return document.body.appendChild(u),u.click(),u.remove(),setTimeout(function(){URL.revokeObjectURL(u.href)},4e3),"download"})});return a.then(function(o){return NSStore.restoreFiles(t.files,e).then(function(i){return i.saved=o,i})})}};var y={ver:document.documentElement.getAttribute("data-nsbiz-addon")||"",origin:"",frame:null,wait:{},n:0,ready:null,last:0,day:0,dated:0,db:0,t:0};function mn(){return y.ready||(y.ready=new Promise(function(t,e){var n=setTimeout(function(){window.removeEventListener("message",a),y.ready=null,e(new Error("addon"))},8e3);function a(o){o.source!==window||!o.data||o.data.nsbizAddon!=="ready"||!/^(chrome|moz|ms-browser)-extension:\/\//.test(o.data.origin||"")||(window.removeEventListener("message",a),clearTimeout(n),y.origin=o.data.origin,y.frame=document.getElementById("nsbiz-addon-bridge"),y.frame?t():e(new Error("addon")))}window.addEventListener("message",a),window.postMessage({nsbizAddon:"bridge"},location.origin)})),y.ready}window.addEventListener("message",function(t){var e=t.data;if(!(!y.origin||t.origin!==y.origin||!e||!e.nsbizRes||!y.wait[e.nsbizRes])){var n=y.wait[e.nsbizRes];delete y.wait[e.nsbizRes],clearTimeout(n.t),e.err?n.rej(new Error(e.err)):n.res(e.res)}});function x(t,e,n){return mn().then(function(){return new Promise(function(a,o){var i="x"+ ++y.n+"-"+Date.now();y.wait[i]={res:a,rej:o,t:setTimeout(function(){delete y.wait[i],o(new Error("addon"))},10*6e4)},y.frame.contentWindow.postMessage({nsbizReq:i,op:t,arg:e||{}},y.origin,n||[])})})}function vn(){return NSStore.exportAll().then(function(t){var e=window.NSBooks,n=t.doc||[],a={data:t,ledger:[],totals:{}};return e&&((t.biz||[]).forEach(function(o){var i=[];try{i=e.inBooks(n,o.name)}catch{i=[]}i.forEach(function(u){var s=[];try{s=e.postings(u)}catch{}var c=e.partyName?e.partyName(u):"";s.forEach(function(l){a.ledger.push({biz:o.name,date:u.date||"",id:u.id||"",type:u.virt||u.type||"",no:u.no||"",party:c,a:l.a,dr:l.dr||0,cr:l.cr||0})})})}),n.forEach(function(o){if(o.items&&e.itemTotals)try{a.totals[o.id]=e.itemTotals(o)}catch{}})),a})}function ce(t){var e=null;if(t)e={locked:!0};else if(window.NSHomeUI&&NSHomeUI.digest)try{e=NSHomeUI.digest()}catch{e=null}return!e||!e.locked&&!e.biz?Promise.resolve():(e.app=location.origin+location.pathname,x("digest",e).catch(function(){}))}var le=/^ns-(gstin-recent|pl-draft-)/;function de(t,e){return!t||!t.prefs||!t.prefs.sync?Promise.resolve():NSStore.meta("prefs").then(function(n){if(n=n||{},e)return x("syncGet").then(function(o){var i=0;return Object.keys(o||{}).forEach(function(u){var s=o[u];le.test(u)||!s||(!n[u]||(n[u].t||0)<(s.t||0))&&(n[u]=s,i++)}),i?NSStore.meta("prefs",n).then(function(){r.prefPull&&r.prefPull()}):null});var a={};return Object.keys(n).forEach(function(o){le.test(o)||(a[o]=n[o])}),x("syncPut",{prefs:a})}).catch(function(){})}r.helperUp=!1,r.helper=function(t,e){var n=r.addonAny&&r.addonAny();return n?n.call("helper",Object.assign({op:t},e||{})):Promise.reject(new Error("The NSBiz Helper add-on is not in this browser"))},r.helperCheck=function(){var t=r.addonAny&&r.addonAny();return t?t.status().then(function(e){return e&&e.helper?r.helper("hello"):null}).then(function(e){var n=!!(e&&e.ok);return n!==r.helperUp&&(r.helperUp=n,r.helperInfo=e||null,document.dispatchEvent(new CustomEvent("ns-helper"))),n},function(){return!1}):Promise.resolve(!1)};var bn="https://github.com/raimayank7/ns-desktop-releases/releases/download/helper-v1.0.0/NSBiz-Helper-Setup.exe";function gn(t,e){t=String(t||"0").split("."),e=String(e).split(".");for(var n=0;n<3;n++){var a=+t[n]||0,o=+e[n]||0;if(a!==o)return a>o}return!0}r.helperState=function(){var t=r.addonAny&&r.addonAny();if(!t)return Promise.resolve({addon:!1});var e={addon:!0,ver:t.version||""};return t.status().then(function(n){return e.sw=!!(n&&n.helper),e.sw?r.helper("hello").then(function(a){return e.prog=!!(a&&a.ok),e.info=a||null,e},function(a){return e.prog=!1,e.err=String(a&&a.message||a),e}):e},function(n){return e.err=String(n&&n.message||n),e}).then(function(n){var a=!!n.prog;return a!==r.helperUp&&(r.helperUp=a,r.helperInfo=n.info||null,document.dispatchEvent(new CustomEvent("ns-helper"))),n})};function fe(t){var e=r.t,n=r.esc,a='<i class="md-dot on"></i>',o='<i class="md-dot"></i>',i='<i class="md-dot warn"></i>',u=r.browserName?r.browserName():"",s=r.addonStores&&r.addonStores[u],c='<p class="soft">'+n(e("hx.intro"))+"</p>";if(c+=r.mdRow("1. "+e("hx.add"),t.addon?a+n(e("hx.add_on")):o+n(e("hx.add_off")),e("hx.add_tip"),t.addon?"":s?'<a class="btn sm primary" href="'+n(s)+'" target="_blank" rel="noopener">'+n(e("hx.add_get",{b:u}))+" ↗</a>":""),!t.addon&&!s&&(c+='<p class="note">'+n(e(r.onComputer&&r.onComputer()?"hx.add_soon":"hx.add_pc",{b:u||e("oa.thisbr")}))+"</p>"),t.addon){var l=gn(t.ver,"1.0.2");c+=r.mdRow("2. "+e("hx.sw"),t.sw?a+n(e("hx.sw_on")):i+n(e("hx.sw_off")),e("hx.sw_how"),t.sw?"":l?'<button type="button" class="btn sm primary" data-hx="open">'+n(e("hx.sw_open"))+"</button>":""),t.sw||(c+='<p class="note">'+n(e("hx.sw_how"))+"</p>")}if(t.addon&&t.sw){var d=t.info||{};c+=r.mdRow("3. "+e("hx.prog"),t.prog?a+n(e("hx.prog_on"))+n(e(d.excel?"hx.prog_xl":"hx.prog_noxl"))+(d.folder?"<br>"+n(e("hx.prog_dir",{f:d.folder})):""):i+n(e("hx.prog_off")),e("hx.prog_tip"),t.prog?"":'<a class="btn sm primary" href="'+bn+'" rel="nofollow" download>'+n(e("hx.prog_get"))+"</a>"),!t.prog&&t.err&&(c+='<p class="soft">'+n(e("hx.err",{e:t.err}))+"</p>"),t.prog||(c+='<p class="note">'+n(e("hx.prog_after"))+"</p>")}else t.addon&&(c+=r.mdRow("3. "+e("hx.prog"),o+n(e("hx.prog_wait")),e("hx.prog_tip"),""));var f=[];return t.addon&&f.push("hx.c1","hx.c2","hx.c3","hx.c4"),t.prog&&f.push("hx.c5","hx.c6","hx.c7","hx.c8"),c+="<h3>"+n(e("hx.can"))+"</h3>"+(f.length?'<ul class="hx-list">'+f.map(function(m){return"<li>"+n(e(m))+"</li>"}).join("")+"</ul>":'<p class="soft">'+n(e("hx.none"))+"</p>"),t.addon&&!t.prog&&(c+='<p class="soft">'+n(e("hx.later"))+"</p>"),c+='<div class="md-bar"><button type="button" class="btn sm" data-hx="again" data-ic="refresh">'+n(e("hx.again"))+"</button></div>",c}function ut(t){t&&(t.innerHTML='<p class="soft">'+r.esc(r.t("hx.checking"))+"</p>",r.helperState().then(function(e){t.innerHTML=fe(e)},function(){t.innerHTML=fe({addon:!1})}))}r.mdExt=(r.mdExt||[]).concat([function(t){Promise.resolve().then(function(){var e=r.$(".md-nav",t),n=r.$(".md-panes",t);if(!(!e||!n||r.$("#md-t-hx",t))){var a=r._mdTab==="hx",o=r.el("button",{type:"button",role:"tab",id:"md-t-hx","aria-controls":"md-p-hx","aria-selected":String(a),tabindex:a?"0":"-1","data-md-tab":"hx","data-ic":"tool"});o.textContent=r.t("hx.tab"),e.appendChild(o);var i=r.el("section",{class:"md-pane",role:"tabpanel",id:"md-p-hx","aria-labelledby":"md-t-hx","data-md-pane":"hx"});a||(i.hidden=!0),n.appendChild(i),a&&(r.$$("[data-md-tab]",t).forEach(function(u){u!==o&&(u.setAttribute("aria-selected","false"),u.tabIndex=-1)}),r.$$(".md-pane",t).forEach(function(u){u!==i&&(u.hidden=!0)}),ut(i)),o.addEventListener("click",function(){ut(i)})}})}]),r.openHelperStatus=function(){r._mdTab="hx";var t=window.top!==window&&window.top.NS&&window.top.NS.openHelperStatus;try{if(t&&window.top.location.origin===location.origin)return t()}catch{}r.openMyData()},document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-hx], [data-hx-status]");if(e){if(e.hasAttribute("data-hx-status")){t.preventDefault(),r.openHelperStatus();return}var n=e.getAttribute("data-hx"),a=e.closest('[data-md-pane="hx"]');if(n==="again")ut(a);else if(n==="open"){var o=r.addonAny&&r.addonAny();o&&o.call("openWindow",{part:"hlp"}).then(function(){r.toast(r.t("hx.opened"))},function(){r.toast(r.t("hx.sw_how"),"bad")})}}}),window.addEventListener("focus",function(){var t=r.$("#md-p-hx");t&&!t.hidden&&t.closest("dialog[open]")&&ut(t)});function pe(t){for(var e="",n=0;n<t.length;n+=32768)e+=String.fromCharCode.apply(null,t.subarray(n,n+32768));return btoa(e)}function he(t){for(var e=atob(t),n=new Uint8Array(e.length),a=0;a<e.length;a++)n[a]=e.charCodeAt(a);return n}r.u8b64=pe,r.b64u8=he,r.helperXL={fill:function(t,e,n){return r.helper("xlFill",{b64:pe(t instanceof Uint8Array?t:new Uint8Array(t)),ext:e,spec:n}).then(function(a){return{ok:!0,written:a.written,errors:a.errors||[],bytes:he(a.b64||"")}},function(a){var o=String(a&&a.message||a);return{ok:!1,noexcel:/Excel is not installed/i.test(o),errors:[o]}})}},r.addonStart=function(){return setTimeout(function(){r.helperCheck()},2e3),x("hello").then(function(t){return NSStore.auth("authStatus").then(function(e){return!!(e&&e.on)},function(){return!1}).then(function(e){return Promise.all([ce(e),e?null:de(t,!0)])})}).catch(function(){})};function me(t,e){var n=Date.now();return!e&&n-y.last<3e4?(clearTimeout(y.t),y.t=setTimeout(function(){nt()},3e4-(n-y.last)),Promise.resolve("wait")):(y.last=n,x("hello").then(function(a){return NSStore.auth("authStatus").then(function(o){return!!(o&&o.on)},function(){return!1}).then(function(o){ce(o),o||de(a,!1);var i=e||n-y.day>6e5,u=e||n-y.dated>36e5,s=t||o?Promise.resolve(null):r.backupData().then(function(l){return JSON.stringify(l,null,1)}),c=i&&NSStore.snapshot?r.fileBackup.pack().then(function(l){return l.arrayBuffer()},function(){return null}):Promise.resolve(null);return Promise.all([s,c]).then(function(l){return!l[0]&&!l[1]?"none":x("backup",{json:l[0],pack:l[1],dated:u,day:i&&!t},l[1]?[l[1]]:[]).then(function(){return l[1]&&(y.day=n),l[0]&&u&&(y.dated=n),a&&a.prefs&&a.prefs.dbcopy&&!o&&(e||n-y.db>12e4)?(y.db=n,vn().then(function(d){return x("dbcopy",{payload:d})}).catch(function(){}).then(function(){return"ok"})):"ok"})})})}).catch(function(){return"fail"}))}r.addonAny=function(){if(r.addon&&r.addon.on)return r.addon;try{var t=window.top!==window&&window.top.location.origin===location.origin&&window.top.NS&&window.top.NS.addon;return t&&t.on?t:null}catch{return null}},r.addon={on:!!y.ver,version:y.ver,call:x,here:function(){return!!y.ver&&r.folderHere()},kept:function(){return x("keptData")},status:function(){return x("status")},show:function(){return x("show")},now:function(){return nt(!0)}},r.addonRestore=function(){return x("keptData").then(function(t){if(!t||!t.bytes)throw new Error(r.t("ax.none"));return r.fileBackup.unpack(new Blob([t.bytes])).then(function(e){var n=new Date(t.at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});return(r.ask?r.ask(r.t("ax.ask",{when:n}),{ok:r.t("ax.restore"),danger:!0}):Promise.resolve(window.confirm(r.t("ax.ask",{when:n})))).then(function(a){return a?r.fileBackup.restore(e,"add-on copy "+n).then(function(o){return r.toast(r.t("ax.back")),document.dispatchEvent(new CustomEvent("ns-data")),o}):null})})}).catch(function(t){throw r.toast(t&&t.message&&t.message!=="addon"?t.message:r.t("ax.fail"),"bad"),t})};var Q={t:0,st:"",note:null};function ct(t){return window.NSStore?NSStore.meta("autosave",t).catch(function(){}):Promise.resolve()}function nt(t){t=t===!0;var e=function(){return N().then(function(n){return!n||!r.folderSupported()?r.addon.here()?me(!1,t).then(function(a){if(a!=="ok")return a;var o=Date.now();return NSStore.meta("lastBackup",o).then(function(){return ct({name:r.t("ax.name"),last:o,host:location.hostname,addon:!0})}).then(function(){return"ok"})}):"off":(r.addon.here()&&me(!0,t).catch(function(){}),n.queryPermission({mode:"readwrite"}).then(function(a){return a!=="granted"?"ask":NSStore.auth("authStatus").then(function(o){return!!(o&&o.on)},function(){return!1}).then(function(o){return o?null:(NSStore.docStat?NSStore.docStat().catch(function(){return null}):Promise.resolve(null)).then(function(i){var u=i&&i.n>5e3,s=Date.now();return!t&&u&&Q.jsonAt&&s-Q.jsonAt<6e5?null:(Q.jsonAt=s,NSStore.exportAll().then(function(c){var l={app:"Nivesh Sahayak",kind:"backup",version:1,saved:new Date().toISOString(),data:c},d=JSON.stringify(l,null,u?0:1);return H(n,["Data"]).then(function(f){return tt(f,O+".json",d)}).then(function(){return cn(n,d)})}))})}).then(function(){return Ot(n).catch(function(){})}).then(function(){var o=Date.now();return Lt("last",o).then(function(){return NSStore.meta("lastBackup",o)}).then(function(){return ct({name:X(n)+" › Data",last:o,host:location.hostname})}).then(function(){return"ok"})})}))}).catch(function(){return"fail"})};return(navigator.locks&&navigator.locks.request?navigator.locks.request("ns-af-top",e):e()).then(function(n){return Q.st=n,I(n==="ask"?"oa.paused":null),n==="ok"&&xt(),n==="ask"&&wn(),n==="ask"&&window.NSStore&&NSStore.meta("autosave").then(function(a){a&&a.name&&!a.paused&&ct(Object.assign({},a,{paused:!0}))}).catch(function(){}),n})}var ve=!1;function wn(){if(!(ve||!r.folderHere())){ve=!0;var t=function(e){e.target&&e.target.closest&&e.target.closest('[data-act^="folder"],[data-act="af-later"]')||(document.removeEventListener("pointerdown",t,!0),document.removeEventListener("keydown",t,!0),I.later||r.folderAllow())};document.addEventListener("pointerdown",t,!0),document.addEventListener("keydown",t,!0)}}r.browserName=function(){var t=navigator.userAgent;return/Edg(e|A|iOS)?\//.test(t)?"Edge":/OPR\/|Opera/.test(t)?"Opera":navigator.brave?"Brave":/Vivaldi\//.test(t)?"Vivaldi":/SamsungBrowser\//.test(t)?"Samsung Internet":/Firefox\/|FxiOS\//.test(t)?"Firefox":/Chrome\/|CriOS\//.test(t)?"Chrome":/Safari\//.test(t)?"Safari":""},r.onComputer=function(){return!/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)},r.addonStores={Chrome:"https://chromewebstore.google.com/detail/cgfkgeplflfadejffmomnnhcopjkknpm",Firefox:"https://addons.mozilla.org/en-US/firefox/addon/nsbiz-helper/"},r.isInstalled=function(){return!!(window.matchMedia&&matchMedia("(display-mode: standalone), (display-mode: window-controls-overlay)").matches)||navigator.standalone===!0};function R(t){!r.folderHere()||!(r.folderSupported()||r.addon.on)||(clearTimeout(Q.t),Q.t=setTimeout(function(){if(Date.now()-be<2e3)return R(2500);nt()},t??1500))}var be=0;document.addEventListener("keydown",function(){be=Date.now()},!0);function ge(t){r.toast(r.t("oa.done",{name:t})),xt(),I(null)}r.folderPick=function(){return r.folderHere()?window.showDirectoryPicker({id:"ns-backup",mode:"readwrite",startIn:"documents"}).then(function(t){return At(t).then(nt).then(function(e){if(e==="ok")return ge(X(t)+" › Data"),t.name;throw r.toast(r.t("oa.fail"),"bad"),new Error(e)})}):(r.folderHome(),Promise.reject(new Error("elsewhere")))},r.folderAllow=function(){return r.folderHere()?N().then(function(t){return t?t.requestPermission({mode:"readwrite"}).then(function(e){return e!=="granted"?!1:nt().then(function(n){return n==="ok"&&ge(X(t)+" › Data"),n==="ok"})}):!1}).catch(function(){return!1}):(r.folderHome(),Promise.resolve(!1))},r.folderOff=function(){return At(null).then(function(){return Lt("last",null)}).then(function(){return ct(null)}).then(function(){return window.NSStore?NSStore.autosave("afOff").catch(function(){}):null}).then(function(){r.toast(r.t("oa.offt")),I(null)})},r.folderStatus=function(){if(r.addon.here()&&window.NSStore){var t=function(){return NSStore.meta("lastBackup").then(function(e){return{supported:!0,on:!0,here:!0,addon:!0,allowed:!0,name:r.t("ax.name"),file:O+".json",last:e||0,canFolder:r.folderSupported()}})};return r.folderSupported()?N().then(function(e){return e?null:t()}).catch(function(){return null}).then(function(e){return e||we()}):t().catch(function(){return{supported:!0,on:!1,here:!0}})}return we()};function we(){return r.folderSupported()?window.NSStore?r.folderHere()?Promise.all([N(),ee("last")]).then(function(t){var e=t[0];return e?e.queryPermission({mode:"readwrite"}).then(function(n){return{supported:!0,on:!0,here:!0,name:X(e)+" › Data",file:O+".json",allowed:n==="granted",last:t[1]||0}}):NSStore.meta("autosave").then(function(n){return{supported:!0,on:!1,here:!0,other:n&&n.host!==location.hostname?n:null}})}).catch(function(){return{supported:!0,on:!1,here:!0}}):NSStore.meta("autosave").then(function(t){return t&&t.name?{supported:!0,on:!0,elsewhere:!0,allowed:!t.paused,name:t.name,file:O+".json",last:t.last||0,host:t.host||""}:{supported:!0,on:!1}},function(){return{supported:!0,on:!1,home:!1}}):Promise.resolve({supported:!0,on:!1,home:!1}):window.NSStore?NSStore.meta("autodl").then(function(t){return{supported:!1,autodl:!!t}},function(){return{supported:!1}}):Promise.resolve({supported:!1})}function ye(t,e,n,a){return r.folderSupported()?N().then(function(o){return o?o.queryPermission({mode:"readwrite"}).then(function(i){return i!=="granted"?t==="put"?!1:null:H(o,e).then(function(u){if(t==="put")return tt(u,n,a).then(function(){return!0});var s=new RegExp(a,"i");return ae(u).then(function(c){var l=c.filter(function(d){return s.test(d)}).sort().pop();return l?u.getFileHandle(l).then(function(d){return d.getFile()}).then(function(d){return{name:l,blob:d}}):null})})}):t==="put"?!1:null}).catch(function(){return t==="put"?!1:null}):Promise.resolve(t==="put"?!1:null)}var U={n:0,wait:{}};r.folderFile=function(t,e,n,a){return r.folderHere()?ye(t,e,n,a):window.top===window?Promise.resolve(t==="put"?!1:null):new Promise(function(o){var i="f"+ ++U.n+"-"+Date.now(),u=setTimeout(function(){delete U.wait[i],o(t==="put"?!1:null)},6e3);U.wait[i]=function(s){clearTimeout(u),o(s)};try{window.top.postMessage({nsf:t,id:i,path:e,name:n,data:a},"*")}catch{clearTimeout(u),o(t==="put"?!1:null)}})},window.addEventListener("message",function(t){var e=t.data;if(!(!e||typeof e!="object")){if(e.nsfr&&U.wait[e.nsfr]){var n=U.wait[e.nsfr];delete U.wait[e.nsfr],n(e.res);return}if(!(!e.nsf||!e.id||!r.folderHere()||!t.source)){var a="";try{a=new URL(t.origin).hostname}catch{return}!/(^|\.)niveshsahayak\.in$|^localhost$|^127\.0\.0\.1$/.test(a)||!/^(put|find)$/.test(e.nsf)||!Array.isArray(e.path)||ye(e.nsf,e.path.slice(0,4),String(e.name||""),e.data).then(function(o){t.source.postMessage({nsfr:e.id,res:o},t.origin)})}}}),r.folderWrite=function(){return R(),Promise.resolve(!0)};function I(t){var e=r.$("#ns-afbar");if(!t){e&&e.remove();return}if(!(e||!document.body||I.later||window.top!==window)){e=r.el("div",{id:"ns-afbar",class:"remind",role:"status"}),e.innerHTML='<div class="wrap"><span></span><button type="button" class="btn" data-act="folder-allow"></button><button type="button" class="btn" data-act="af-later"></button></div>',r.$("span",e).textContent=r.t(t),r.$('[data-act="folder-allow"]',e).textContent=r.t("oa.resume"),r.$('[data-act="af-later"]',e).textContent=r.t("later");var n=r.$("#main")||document.body;n.insertBefore(e,n.firstChild)}}document.addEventListener("ns-saved",function(){R()}),document.addEventListener("ns-autosave",function(t){t.detail==="chg"&&R()});function Se(){if(!(window.top!==window||!window.NSStore)){if(r.addon.here()&&NSStore.ready().then(function(){r.addonStart(),R(800)}).catch(function(){}),!r.folderSupported()){re&&r.folderHere()&&r.openMyData&&(r._mdTab="af",r.openMyData());return}if(!r.folderHere()){location.origin!==st.origin&&N().then(function(t){t&&At(null)}).catch(function(){});return}NSStore.ready().then(function(){return N().then(function(t){t&&R(200)})}).then(function(){re&&r.openMyData&&(r._mdTab="af",r.openMyData())}).catch(function(){})}}document.readyState==="complete"?setTimeout(Se,1500):window.addEventListener("load",function(){setTimeout(Se,1500)});function zt(t){r.folderSupported()||!r.folderHere()||!window.NSStore||r.addon.on||Promise.all([NSStore.meta("autodl"),NSStore.meta("lastBackup"),NSStore.list("doc"),NSStore.list("party")]).then(function(e){if(!(!e[0]||!e[2].length&&!e[3].length)&&!(!t&&Date.now()-(e[1]||0)<20*36e5))return r.downloadBackup()}).catch(function(){})}window.top===window&&(setTimeout(function(){zt()},6e3),setInterval(function(){zt()},36e5)),r.splitStore=function(){var t=navigator.userAgent;return/AppleWebKit/.test(t)&&!/Chrome\/|Chromium\/|Edg\//.test(t)};function ke(){if(!(!r.splitStore()||window.top!==window||ne()||!window.NSStore||r.$("#ns-wknote"))){try{if(localStorage.getItem("ns-wk-note"))return}catch{return}var t=r.$("#ns-side a[data-ic=app]"),e=t?t.href:"https://app.niveshsahayak.in/",n=location.hostname.split(".")[0],a=location.origin===st.origin||!/niveshsahayak\.in$/.test(location.hostname)?e:e.replace(/\/?$/,"/")+"#do/"+n+"/",o=r.el("div",{id:"ns-wknote",class:"remind",role:"note"});o.innerHTML='<div class="wrap"><span></span><a class="btn primary" data-ic="app"></a><button type="button" class="btn" data-wk-ok></button></div>',r.$("span",o).textContent=r.t("wk.note");var i=r.$("a",o);i.href=a,i.textContent=r.t("wk.open"),r.$("[data-wk-ok]",o).textContent=r.t("wk.ok"),r.$("[data-wk-ok]",o).onclick=function(){try{localStorage.setItem("ns-wk-note","1")}catch{}o.remove()};var u=r.$("#main")||document.body;u.insertBefore(o,u.firstChild)}}document.readyState==="complete"?setTimeout(ke,1200):window.addEventListener("load",function(){setTimeout(ke,1200)});var lt=/^ns-(aato|tally-led|prl|bc-set|gstcal|gstcal-told|gstcal-note|pl-draft-.+|hsn-band|stock-(sv|lv|mv)|gstin-recent|c8|g1|g3|td|dash|qe|period|ageing|tb-style|lg-view|rep-col|rep-smby|pack|dens|tsize)$/,qt=Storage.prototype.setItem,Ee=Storage.prototype.removeItem,V={},Me=0;function dt(t){if(t){try{qt.call(localStorage,"ns-prefs-t",JSON.stringify(t))}catch{}return t}try{return JSON.parse(localStorage.getItem("ns-prefs-t")||"{}")||{}}catch{return{}}}function xe(){var t=V;V={},!(!Object.keys(t).length||!window.NSStore)&&NSStore.ready().then(function(e){if(e!=="vault"){Object.assign(V,t);return}return NSStore.meta("prefs").then(function(n){return n=n||{},Object.keys(t).forEach(function(a){(!n[a]||(n[a].t||0)<=t[a].t)&&(n[a]=t[a])}),NSStore.meta("prefs",n)})}).catch(function(){})}function Le(t,e){var n=Date.now(),a=dt();a[t]=n,dt(a),V[t]={v:e,t:n},clearTimeout(Me),Me=setTimeout(xe,800)}try{Storage.prototype.setItem=function(t,e){qt.call(this,t,e),this===window.localStorage&&lt.test(t)&&Le(t,String(e))},Storage.prototype.removeItem=function(t){Ee.call(this,t),this===window.localStorage&&lt.test(t)&&Le(t,null)}}catch{}function _t(){window.NSStore&&NSStore.ready().then(function(t){if(t==="vault")return NSStore.meta("prefs").then(function(e){e=e||{};for(var n=dt(),a={},o=0,i=0;i<localStorage.length;i++){var u=localStorage.key(i);lt.test(u)&&(a[u]=1)}Object.keys(e).forEach(function(s){var c=e[s];if(!(!lt.test(s)||!c||(n[s]||0)>=(c.t||0))){try{c.v==null?Ee.call(localStorage,s):qt.call(localStorage,s,c.v)}catch{return}n[s]=c.t,o++}}),Object.keys(a).forEach(function(s){e[s]&&(e[s].t||0)>=(n[s]||0)||(V[s]={v:localStorage.getItem(s),t:n[s]||Date.now()})}),dt(n),Object.keys(V).length&&xe(),o&&document.dispatchEvent(new CustomEvent("ns-prefs",{detail:o}))})}).catch(function(){})}r.prefPull=_t,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_t):setTimeout(_t,0);var yn=0;r.mdRow=function(t,e,n,a){var o=r.esc,i=n?"md-tip-"+ ++yn:"";return'<div class="md-row"><div class="md-rl"><b>'+o(t)+"</b>"+(n?'<button type="button" class="hp-q" data-md-tip aria-expanded="false" aria-controls="'+i+'" aria-label="'+o(r.t("hp.btn",{what:t}))+'" title="'+o(r.t("hp.btn",{what:t}))+'">?</button>':"")+(e?'<span class="md-st">'+e+"</span>":"")+(n?'<p class="hp-tip" id="'+i+'" hidden>'+o(n)+"</p>":"")+"</div>"+(a?'<div class="md-rb">'+a+"</div>":"")+"</div>"},r.openMyData=function(){var t=r.$("#ns-mydata");if(t){var e=r.$("[data-mydata-body]",t);t.classList.add("md-dlg"),t.open||(e.innerHTML='<p class="soft">'+r.esc(r.t("md.loading"))+"</p>",clearTimeout(r._mdSlow),r._mdSlow=setTimeout(function(){if(!(!t.open||!/md-loading|^<p class="soft">/.test(e.innerHTML)||r.$(".md-wrap",e))){e.innerHTML='<p class="note">'+r.esc(r.t("md.slow"))+'</p><div class="md-bar"><button type="button" class="btn sm primary" data-md-reload>'+r.esc(r.t("md.reload"))+"</button></div>";var n=r.$("[data-md-reload]",e);n&&n.addEventListener("click",function(){location.reload()})}},8e3),t.showModal?t.showModal():t.setAttribute("open","")),Promise.all(["biz","party","item","doc"].map(function(n){return NSStore.list(n)})).then(function(n){return Promise.all([r.folderStatus(),NSStore.meta("lastBackup")]).then(function(a){return[n,a[0],a[1]]})}).then(function(n){var a=n[0],o=n[1],i=n[2],u=NSStore.mode()==="vault",s=r.t,c=r.esc,l=function(S,W,Jt){return'<button type="button" class="btn sm'+(Jt?" primary":"")+'" data-act="'+S+'">'+c(s(W))+"</button>"},d=i?new Date(i).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):s("md.never"),f='<i class="md-dot on"></i>',m='<i class="md-dot"></i>',p='<i class="md-dot warn"></i>',h=o.supported?o.home===!1?p+c(s("oa.nohome")):o.on?(o.allowed?f+c(s("md2.on")):p+c(s("md2.ask")))+' · <bdi class="mono">'+c(o.name)+"</bdi>"+(o.elsewhere&&o.host?" · "+c(s("oa.by",{host:o.host})):""):m+c(s("md2.off")):"",w=r.folderHere(),v=w?"":" ↗",g=function(S,W,Jt){return'<button type="button" class="btn sm'+(Jt?" primary":"")+'" data-act="'+S+'">'+c(s(W))+v+"</button>"},E='<label class="md-chk"><input type="checkbox" data-autodl'+(o.autodl?" checked":"")+"> <b>"+c(s("oa.dl"))+'</b></label><p class="soft">'+c(s("oa.dlp"))+"</p>",j=o.supported&&o.on&&w&&!r.isInstalled()?'<p class="note">'+c(s("oa.inst2",{b:r.browserName()||s("oa.thisbr")}))+' <button type="button" class="btn sm" data-desk-install>'+c(s("desk.install"))+"</button></p>":"",F=function(S){return new Date(S).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})},yt=o.addon?r.mdRow(s("ax.t"),f+c(s("md2.on"))+' · <bdi class="mono">'+c(o.name)+"</bdi>"+(o.last?"<br>"+c(s("md.last"))+" "+c(F(o.last)):""),s("ax.tip"),l("addon-show","ax.open",1)+l("addon-now","ax.now")+l("addon-restore","ax.restore"))+(o.canFolder?'<p class="soft">'+c(s("ax.folder"))+'</p><div class="md-bar">'+g("folder-pick","md.choose")+"</div>":""):"",D=!o.addon&&r.onComputer()&&r.addonStores[r.browserName()],q=D?'<p class="note">'+c(s("ax.get",{b:r.browserName()}))+' <a class="btn sm" href="'+D+'" target="_blank" rel="noopener">'+c(s("ax.getbtn",{b:r.browserName()}))+" ↗</a></p>":"",_=o.addon?yt:o.supported?j+r.mdRow(s("oa.t"),h+(o.on&&o.last?"<br>"+c(s("md.last"))+" "+c(new Date(o.last).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})):""),o.on?s("oa.on",{file:o.file||O+".json",name:o.name})+(o.allowed?"":" "+s("oa.ask")):s("oa.off"),o.home===!1?"":o.elsewhere?g("folder-pick","oa.open",1):o.on?(o.allowed?"":g("folder-allow","md.allow",1))+l("folder-off","md.turnoff"):g("folder-pick","md.choose",1))+(o.other?'<p class="note">'+c(s("oa.other",{host:o.other.host||""}))+"</p>":"")+'<p class="soft">'+c(s("oa.all"))+" "+c(s(w?"oa.here":"oa.away2"))+"</p>":"<p>"+m+c(s("ux.af.pc"))+'</p><div class="md-bar">'+l("backup","md.save",1)+"</div>"+E;_=q+_;var A='<label class="btn sm">'+c(s("md.restore"))+'<input type="file" accept=".json,application/json" data-act="restore" hidden></label>',B=!!(window.NSApp&&NSApp.openUrl),St=location.origin===st.origin?"":'<a class="btn sm" href="'+(B?'#do/my/" data-close-box':'https://my.niveshsahayak.in/" target="_blank" rel="noopener"')+">"+c(s("md2.open"))+(B?"":" ↗")+"</a>",Ge=[["ov","md2.ov"],["bk","md2.bk"],["af","md2.folder"],["ac","b3.ac.t"]],Gt=r._mdTab&&Ge.some(function(S){return S[0]===r._mdTab})?r._mdTab:"ov",kt=function(S,W){return'<section class="md-pane" role="tabpanel" id="md-p-'+S+'" aria-labelledby="md-t-'+S+'" data-md-pane="'+S+'"'+(S===Gt?"":" hidden")+">"+W+"</section>"};e.innerHTML='<div class="md-wrap"><div class="md-nav" role="tablist" aria-orientation="vertical">'+Ge.map(function(S){return'<button type="button" role="tab" id="md-t-'+S[0]+'" aria-controls="md-p-'+S[0]+'" aria-selected="'+(S[0]===Gt)+'" tabindex="'+(S[0]===Gt?0:-1)+'" data-md-tab="'+S[0]+'" data-ic="'+{ov:"home",bk:"data",af:"save",ac:"send"}[S[0]]+'">'+c(s(S[1]))+"</button>"}).join("")+'</div><div class="md-panes">'+kt("ov",'<table class="md-counts"><tr>'+[[a[0],"md.biz"],[a[1],"md.party"],[a[2],"md.item"],[a[3],"md.doc"]].map(function(S){return"<td><b>"+S[0].length+"</b><span>"+c(s(S[1]))+"</span></td>"}).join("")+'</tr></table><dl class="md-stat"><div><dt>'+c(s("md2.where"))+"</dt><dd>"+(u?f:p)+c(s(u?"desk.shared":"desk.local"))+'<button type="button" class="hp-q" data-md-tip aria-expanded="false" aria-controls="md-tip-w" aria-label="'+c(s("hp.btn",{what:s("md2.where")}))+'">?</button></dd></div><div><dt>'+c(s("md.last").replace(/[:：]\s*$/,""))+"</dt><dd>"+(i?f:p)+c(d)+"</dd></div>"+(o.supported?"<div><dt>"+c(s("md2.folder"))+"</dt><dd>"+h+"</dd></div>":"")+'</dl><p class="hp-tip" id="md-tip-w" hidden>'+c(s(u?"md.shared":"md.local"))+'</p><div class="md-bar">'+l("backup","md.save",1)+A+St+"</div>")+kt("bk",r.mdRow(s("md2.file"),(i?f:p)+c(s("md.last"))+" "+c(d),s("md.move"),l("backup","md.save",1)+A))+kt("af",_)+kt("ac","")+"</div></div>",(r.mdExt||[]).forEach(function(S){try{S(e)}catch{}})}).catch(function(){e.innerHTML='<p class="note bad">'+r.esc(r.t("md.err"))+"</p>"})}};function Ae(t,e){var n=t.closest(".md-wrap"),a=t.getAttribute("data-md-tab");r._mdTab=a,r.$$("[data-md-tab]",n).forEach(function(o){var i=o===t;o.setAttribute("aria-selected",i),o.tabIndex=i?0:-1}),r.$$(".md-pane",n).forEach(function(o){o.hidden=o.getAttribute("data-md-pane")!==a}),e&&t.focus()}document.addEventListener("keydown",function(t){var e=t.target.closest&&t.target.closest("[data-md-tab]");if(!(!e||!/^(Arrow(Up|Down|Left|Right)|Home|End)$/.test(t.key))){var n=r.$$("[data-md-tab]",e.parentNode),a=n.indexOf(e),o=n.length,i=t.key==="ArrowUp"||t.key===(document.documentElement.dir==="rtl"?"ArrowRight":"ArrowLeft");a=t.key==="Home"?0:t.key==="End"?o-1:i?(a-1+o)%o:(a+1)%o,t.preventDefault(),Ae(n[a],!0)}}),document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-act]"),n=t.target.closest&&t.target.closest("[data-md-tab],[data-md-tip]");if(n&&n.hasAttribute("data-md-tab"))Ae(n);else if(n){var a=document.getElementById(n.getAttribute("aria-controls")),o=a.hidden;a.hidden=!o,n.setAttribute("aria-expanded",o)}if(e){var i=e.getAttribute("data-act");if(i==="backup")r.downloadBackup().then(function(){document.getElementById("my-app")?document.dispatchEvent(new CustomEvent("ns-data")):r.openMyData()});else if(i==="folder-pick")r.folderPick().then(rt,function(){});else if(i==="folder-allow")r.folderAllow().then(rt);else if(i==="folder-off")r.folderOff().then(rt);else if(i==="af-later")I.later=!0,I(null);else if(i==="addon-show")r.addon.show().catch(function(){r.toast(r.t("ax.fail"),"bad")});else if(i==="addon-now")e.disabled=!0,r.addon.now().then(function(s){r.toast(r.t(s==="ok"?"ax.saved":"ax.fail"),s==="ok"?"":"bad"),rt()});else if(i==="addon-restore")r.addonRestore().then(rt,function(){});else if(i==="my-data")r._mdTab=e.getAttribute("data-tab")||"ov",r.openMyData();else if(i==="remind-later"){var u=r.$("#ns-remind");u&&(u.hidden=!0),NSStore.meta("lastBackup",Date.now()-4*864e5)}}});function rt(){r.$("#ns-mydata[open]")&&r.openMyData()}document.addEventListener("change",function(t){if(!(!t.target.matches||!t.target.matches("[data-autodl]"))){var e=t.target.checked;NSStore.meta("autodl",e?!0:null).then(function(){r.toast(r.t(e?"oa.dlon":"oa.dloff")),e&&zt(!0)})}}),document.addEventListener("change",function(t){var e=t.target;e.getAttribute&&e.getAttribute("data-act")==="restore"&&e.files&&e.files[0]&&(r.restoreFromFile(e.files[0]).then(function(){r.onRestore&&r.onRestore(),document.getElementById("my-app")||r.openMyData()},function(){}),e.value="")}),(function(){function t(){var o=document.querySelector("header.hd"),i=o&&o.getClientRects().length&&/sticky|fixed/.test(getComputedStyle(o).position)?o.offsetHeight:0;document.documentElement.style.setProperty("--hd-h",i+"px")}function e(){var o=document.querySelector(".tool-top");if(o){var i=parseFloat(getComputedStyle(o).top)||0,u=getComputedStyle(o).position==="sticky";u&&document.documentElement.style.setProperty("--bar-h",o.offsetHeight+"px"),o.classList.toggle("stuck",u&&window.scrollY>0&&o.getBoundingClientRect().top<=i+16)}}function n(){var o=document.querySelector("#tool .actions"),i=document.querySelector("#tool .tool-top");!o||!i||o.querySelector(".act-x")||["history","new"].forEach(function(u){var s=i.querySelector('[data-do="'+u+'"]');if(s){var c=document.createElement("button");c.type="button",c.className="btn act-x",c.setAttribute("data-noic","");var l=function(){c.innerHTML=s.innerHTML};l(),new MutationObserver(l).observe(s,{childList:!0,subtree:!0,characterData:!0}),c.addEventListener("click",function(){s.click()}),o.insertBefore(c,o.firstChild)}})}function a(){t(),e(),n()}window.addEventListener("scroll",e,{passive:!0}),window.addEventListener("resize",a),window.ResizeObserver&&document.addEventListener("DOMContentLoaded",function(){var o=document.querySelector("header.hd");o&&new ResizeObserver(a).observe(o)}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a):a()})(),r.defaultBiz=function(t){var e=new URLSearchParams(location.search).get("biz")||((window.NS_CFG||{}).inApp?r.curBiz():""),n=e?NSStore.get("biz",e).catch(function(){}):Promise.resolve();return n.then(function(a){return a||(t&&t.defBiz?NSStore.get("biz",t.defBiz).catch(function(){}):NSStore.list("biz").then(function(o){return o&&o.length===1?o[0]:void 0},function(){}))})},r.curBiz=function(){var t="";try{t=sessionStorage.getItem("ns-app-biz")||""}catch{}if(!t)try{t=localStorage.getItem("ns-app-biz")||"",t&&sessionStorage.setItem("ns-app-biz",t)}catch{}return t},r.setCurBiz=function(t){try{t?(sessionStorage.setItem("ns-app-biz",t),localStorage.setItem("ns-app-biz",t)):(sessionStorage.removeItem("ns-app-biz"),localStorage.removeItem("ns-app-biz"))}catch{}},r.liveDraft=function(t){return!t||!t.id?Promise.resolve(t):NSStore.get("doc",t.id).then(function(e){return e?t:null},function(){return t})};var ft={defBiz:1,remindDays:1,features:1,byBiz:1,bizSplit:1,pin:1,closed:1,prefs:1};r.CFG_GLOBAL=ft,r.bizCache=[];function at(t){return t==null?t:JSON.parse(JSON.stringify(t))}r.bizIdOf=function(t,e){if(!t)return"";if(e=e||r.bizCache||[],typeof t=="string")return t;if(t.id&&e.some(function(o){return o.id===t.id}))return t.id;var n=String(t.name||"").trim().toLowerCase(),a=n&&e.filter(function(o){return String(o.name||"").trim().toLowerCase()===n})[0];return a?a.id:""},r.cfgFor=function(t,e,n){t=t||{};var a=r.bizIdOf(e,n),o=a&&t.byBiz&&t.byBiz[a]||{},i=at(t)||{};return Object.keys(o).forEach(function(u){ft[u]||(i[u]=at(o[u]))}),delete i.byBiz,delete i.bizSplit,Object.defineProperty(i,"_biz",{value:a,enumerable:!1}),i},r.cfgSave=function(t,e,n){return Object.keys(n||{}).forEach(function(a){a==="byBiz"||a==="bizSplit"||a.charAt(0)==="_"||(ft[a]||!e?t[a]=at(n[a]):(t.byBiz=t.byBiz||{},(t.byBiz[e]=t.byBiz[e]||{})[a]=at(n[a])))}),t},r.cfgSplit=function(t,e){return!t||t.bizSplit||!e||!e.length?!1:(t.byBiz=t.byBiz||{},e.forEach(function(n){if(!(!n||!n.id)){var a=t.byBiz[n.id]=t.byBiz[n.id]||{};Object.keys(t).forEach(function(o){!ft[o]&&o.charAt(0)!=="_"&&!(o in a)&&(a[o]=at(t[o]))})}}),t.bizSplit=1,!0)},r.loadCfg=function(){return Promise.all([NSStore.meta("settings"),NSStore.list("biz")]).then(function(t){var e=t[0]||{};return r.bizCache=t[1]||[],r.cfgSplit(e,r.bizCache)?NSStore.meta("settings",e).then(function(){return e},function(){return e}):e})},r.creditAsk=function(t,e,n,a,o){var i=window.NSBooks;return!i||!i.creditCheck||!String(e||"").trim()||!window.NSStore?Promise.resolve():Promise.all([NSStore.list("party"),NSStore.list("doc")]).then(function(u){var s=u[0].filter(function(d){return i.key(d.name)===i.key(e)})[0];if(!(!s||!(+s.climit>0||+s.cdays>0||s.cpolicy))){var c=i.creditCheck(u[1],t,s,n,a||r.today(),o);if(c.any){var l=[c.over?r.t("bw.cr_over",{name:s.name,limit:r.money(c.limit),now:r.money(Math.max(0,c.bal)),after:r.money(c.after)}):"",c.late?r.t("bw.cr_late",{name:s.name,no:c.oldest.no||"",d:c.overdueDays,a:r.money(c.oldest.left)}):""].filter(Boolean).join(" ");if(c.block)throw r.toast(l+" "+r.t("bw.cr_block",{name:s.name}),"bad"),new Error("cancel");return(r.ask?r.ask(l+" "+r.t("bw.cr_ask")):Promise.resolve(window.confirm(l))).then(function(d){if(!d)throw new Error("cancel")})}}})},r.creditAskDoc=function(t,e){var n=window.NSBooks,a=t&&t.buyer&&String(t.buyer.name||"").trim();if(!n||!a)return Promise.resolve();var o="p:"+n.key(a),i=0;try{n.postings(t).forEach(function(u){u.a===o&&(i+=u.dr-u.cr)})}catch{return Promise.resolve()}return i>.004?r.creditAsk(t.seller&&t.seller.name,a,Math.round(i*100)/100,t.date,e):Promise.resolve()},r.cfgEdit=function(t,e,n){return r.loadCfg().then(function(a){var o=r.bizIdOf(t),i=r.cfgFor(a,o);return e(i),r.cfgSave(a,o,i),NSStore.meta("settings",a,n).then(function(){return a})})},r.active=function(t){return(t||[]).filter(function(e){return!e||!e.inactive})},r.forBiz=function(t,e){var n=r.bizIdOf(e);return(t||[]).filter(function(a){return!a||!a.biz||!n||a.biz===n})},r.liveSeller=function(t,e,n){var a=String(t&&t.name||"").trim().toLowerCase();function o(i){return String(i.name||"").trim().toLowerCase()===a}return NSStore.list("biz").then(function(i){if(!i||!i.length)return null;var u=n&&(new URLSearchParams(location.search).get("biz")||((window.NS_CFG||{}).inApp?r.curBiz():"")),s=u&&i.filter(function(c){return c.id===u})[0];return s?o(s)?null:s:a&&i.some(o)?null:r.defaultBiz(e).then(function(c){return c||null})},function(){return null})};var Bt={debtors:["grp.debtors","Sundry Debtors"],creditors:["grp.creditors","Sundry Creditors"]};function Ne(t){var e=r.t?r.t(Bt[t][0]):"";return e&&e!==Bt[t][0]?e:Bt[t][1]}r.groupsOf=function(t,e){var n=(t&&t[e]||[]).filter(function(a){return a&&a.id&&String(a.name||"").trim()});return e!=="party"?n.slice():[{id:"debtors",name:Ne("debtors"),under:"",builtin:!0},{id:"creditors",name:Ne("creditors"),under:"",builtin:!0}].concat(n)};function pt(t,e){return t.filter(function(n){return n.id===e})[0]}function Ce(t,e,n){var a=e.under?pt(t,e.under):null,o=n?e.builtin?e.id:a&&a.builtin?a.id:a&&a.under||"debtors":a?a.id:e.id;return{id:e.id,name:e.name,top:o,under:e.under||""}}r.partyGroup=function(t,e){var n=r.groupsOf(e,"party"),a=t&&t.group&&pt(n,t.group);return a||(a=pt(n,t&&t.role==="supplier"?"creditors":"debtors")),Ce(n,a,!0)},r.itemGroup=function(t,e){var n=r.groupsOf(e,"item"),a=t&&t.group&&pt(n,t.group),o=String(t&&t.cat||"").trim().toLowerCase();return!a&&o&&(a=n.filter(function(i){return String(i.name).trim().toLowerCase()===o})[0]),a?Ce(n,a,!1):{id:"",name:"",top:"",under:""}};var K=null,Sn=null;r.dispatch=function(t){return K&&!t?Promise.resolve(K):window.NSStore?Sn=NSStore.meta("dispatch").then(function(e){return K={tr:e&&e.tr||[],veh:e&&e.veh||[]},K},function(){return K||{tr:[],veh:[]}}):Promise.resolve({tr:[],veh:[]})},r.dispatchSave=function(t){return r.dispatch(!0).then(function(e){return t(e),NSStore.meta("dispatch",{tr:e.tr,veh:e.veh}).then(function(){return K=e,e})})},r.EWB_TT=[["","Auto (Regular, or Bill To - Ship To)"],["1","Regular"],["2","Bill To - Ship To"],["3","Bill From - Dispatch From"],["4","Combination of 2 and 3"]],r.ewbDay=function(t){t=String(t||"").trim();var e=t.match(/^(\d{4})-(\d{2})-(\d{2})/);return e?e[0]:(e=t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/),e?e[3]+"-"+("0"+e[2]).slice(-2)+"-"+("0"+e[1]).slice(-2):"")},r.gstRatesFor=function(t){var e=[["2026-02-01",[0,.1,.25,1.5,3,5,12,18,40]],["2025-09-22",[0,.1,.25,1.5,3,5,12,18,28,40]],["",[0,.1,.25,3,5,12,18,28]]];return e.filter(function(n){return String(t||"")>=n[0]})[0][1]},r.noPick=function(t){var e=String(t||"").trim();if(!e)return function(){return!0};var n=[],a=[],o=!0;return e.split(/[,;]+/).forEach(function(i){if(i=i.trim(),!!i){var u=/^(\d+)\s*(?:-|to)\s*(\d+)$/i.exec(i),s=/^\d+$/.test(i);if(u){var c=+u[1],l=+u[2];if(c>l){var d=c;c=l,l=d}n.push([c,l])}else s?n.push([+i,+i]):/[A-Za-z/\\]/.test(i)?a.push(i.replace(/\s+/g,"").toUpperCase()):o=!1}}),!o||!n.length&&!a.length?null:function(i){var u=String(i||"").replace(/\s+/g,"").toUpperCase();if(a.indexOf(u)>=0)return!0;var s=/(\d+)\D*$/.exec(u);if(!s)return!1;var c=+s[1];return n.some(function(l){return c>=l[0]&&c<=l[1]})}},r.vehNo=function(t){return String(t||"").toUpperCase().replace(/[\s.\-]/g,"")};var Ht=[["veh",/(^|-)(veh|dpveh)$/],["tname",/(^|-)(tname|dptname)$/],["tid",/(^|-)tid$/],["driver",/(^|-)driver$/],["dphone",/(^|-)dphone$/]];function ht(t){for(var e=t&&t.id||"",n=0;n<Ht.length;n++)if(Ht[n][1].test(e))return Ht[n][0];return""}function kn(t){return t.closest("fieldset,details,.fg,form,dialog")||document}function P(t,e){for(var n=t.querySelectorAll("input"),a=0;a<n.length;a++)if(ht(n[a])===e)return n[a];return null}function mt(t,e){!t||!e||String(t.value||"").trim()||(t.value=e,t.dispatchEvent(new Event("input",{bubbles:!0})),t.dispatchEvent(new Event("change",{bubbles:!0})))}function Te(t,e){var n="ns-dl-"+t,a=document.getElementById(n);a||(a=document.createElement("datalist"),a.id=n,document.body.appendChild(a));var o=t==="veh"?e.veh.map(function(i){return[i.no,[i.type,i.driver].filter(Boolean).join(" · ")]}):t==="tname"?e.tr.map(function(i){return[i.name,i.tid||""]}):t==="tid"?e.tr.filter(function(i){return i.tid}).map(function(i){return[i.tid,i.name]}):t==="driver"?e.veh.filter(function(i){return i.driver}).map(function(i){return[i.driver,i.no]}):[];return a.innerHTML=o.map(function(i){return'<option value="'+r.esc(i[0])+'"'+(i[1]?' label="'+r.esc(i[1])+'"':"")+">"}).join(""),n}document.addEventListener("focusin",function(t){var e=t.target,n=e&&e.tagName==="INPUT"&&ht(e);!n||n==="dphone"||r.dispatch().then(function(a){var o=Te(n,a);e.getAttribute("list")||e.setAttribute("list",o)})}),document.addEventListener("change",function(t){var e=t.target,n=e&&e.tagName==="INPUT"&&ht(e),a=String(e&&e.value||"").trim();if(!(!n||!a||!window.NSStore)){var o=kn(e);r.dispatch().then(function(i){if(n==="veh"){var u=r.vehNo(a),s=i.veh.filter(function(v){return r.vehNo(v.no)===u})[0];if(e.value!==u&&/^[A-Z]{2}\d/.test(u)&&(e.value=u,e.dispatchEvent(new Event("input",{bubbles:!0}))),s){mt(P(o,"driver"),s.driver),mt(P(o,"dphone"),s.dphone);return}if(!/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{3,4}$|^(TR|BH)/.test(u))return;var c=P(o,"tname"),l=c&&i.tr.filter(function(v){return r.key0(v.name)===r.key0(c.value)})[0],d=P(o,"driver"),f=P(o,"dphone");return r.dispatchSave(function(v){v.veh.some(function(g){return r.vehNo(g.no)===u})||v.veh.push({id:"v"+Date.now().toString(36),no:u,tr:"",driver:d?d.value.trim():"",dphone:f?f.value.trim():""})})}if(n==="tname"||n==="tid"){var m=n==="tname"?i.tr.filter(function(v){return r.key0(v.name)===r.key0(a)})[0]:i.tr.filter(function(v){return String(v.tid||"").toUpperCase()===a.toUpperCase()})[0];if(m){mt(P(o,"tname"),m.name),mt(P(o,"tid"),m.tid);return}if(n!=="tname")return;var p=P(o,"tid"),h=P(o,"veh"),w=h?r.vehNo(h.value):"";return r.dispatchSave(function(v){var g=v.tr.filter(function(E){return r.key0(E.name)===r.key0(a)})[0];g||(g={id:"t"+Date.now().toString(36),name:a,tid:p?p.value.trim().toUpperCase():""},v.tr.push(g))})}})}}),r.key0=function(t){return String(t||"").trim().toLowerCase().replace(/\s+/g," ")};var En=/invoice|billing|bill\s?book|accounting|gst\s?software|vyapar|khatabook|zoho|tally|busy|marg|quickbooks|refrens|swipe/i;r.sponsor=function(){var t=r.$("[data-sponsor]");if(!(!t||r._sp)){r._sp=!0;var e=/Calcutta|Kolkata/.test((Intl.DateTimeFormat().resolvedOptions()||{}).timeZone||""),n=function(){return'<p class="sp-promo"><a href="https://promo.niveshsahayak.in/" target="_blank" rel="noopener">'+r.esc(r.t("sp.promo"))+" →</a></p>"},a=function(i){var u=i.imgs&&i.imgs.length?i.imgs[Math.floor(Math.random()*i.imgs.length)]:i.img_icon||"";return'<a class="sponsor" href="'+r.esc(i.href)+'" target="_blank" rel="'+(i.own?"noopener":"sponsored noopener")+'">'+(u?'<img src="'+r.esc(u)+'" alt="" loading="lazy" width="96" height="96">':"")+"<span><small>"+r.esc(i.tag||r.t("sp.label"))+"</small><b>"+r.esc(i.title||"")+"</b>"+(i.line?"<span>"+r.esc(i.line)+"</span>":"")+(i.cta?"<em>"+r.esc(i.cta)+" →</em>":"")+"</span></a>"},o=function(i){var u=0,s=function(){t.innerHTML=(i.length?a(i[u%i.length]):"")+n()};s(),t.hidden=!1,document.addEventListener("ns-lang",s),!(t.getAttribute("data-sponsor")!=="rotate"||i.length<2)&&setInterval(function(){document.hidden||t.matches(":hover,:focus-within")||(t.classList.add("sp-out"),setTimeout(function(){u++,s(),t.classList.remove("sp-out")},250))},3e4)};fetch("https://share.groupchaton.com/promos.json",{mode:"cors"}).then(function(i){return i.json()}).then(function(i){for(var u=(i.promos||[]).filter(function(d){return!d||!d.href||(d.own||d.family)&&d.family!=="designs"||d.india&&!e?!1:!En.test([d.title,d.line,d.href].join(" "))}),s=u.length-1;s>0;s--){var c=Math.floor(Math.random()*(s+1)),l=u[s];u[s]=u[c],u[c]=l}o(u)}).catch(function(){o([])})}};var It={},Mn=[["https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js","sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H"],["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk"]];r.loadJs=function(t,e){return It[t]||(It[t]=new Promise(function(n,a){var o=document.createElement("script");o.src=t,e&&(o.integrity=e,o.crossOrigin="anonymous"),o.referrerPolicy="no-referrer",o.onload=n,o.onerror=function(){delete It[t],a(new Error("load"))},document.head.appendChild(o)}))},r.dropHints=function(t){Array.prototype.forEach.call(t.querySelectorAll(".ph"),function(e){e.tagName==="P"?e.remove():e.style.visibility="hidden"})};var Pe={a4:[210,297],a5:[148,210],a3:[297,420],a6:[105,148],letter:[215.9,279.4],legal:[215.9,355.6],th80:[80,0],th58:[58,0]},jt={a4:["A4 (normal page)","size:A4;margin:0"],a5:["A5 (half page)","size:A5;margin:0"],a3:["A3 (large sheet)","size:297mm 420mm;margin:0"],a6:["A6 (quarter page)","size:105mm 148mm;margin:0"],letter:["Letter (US, 8.5 × 11 in)","size:215.9mm 279.4mm;margin:0"],legal:["Legal (US, 8.5 × 14 in)","size:215.9mm 355.6mm;margin:0"],th80:["Thermal roll 80 mm","size:80mm 297mm;margin:0"],th58:["Thermal roll 58 mm","size:58mm 297mm;margin:0"]};r.longTasks=[];try{new PerformanceObserver(function(t){t.getEntries().forEach(function(e){if(!(e.duration<200)){r.longTasks.push([Math.round(e.startTime),Math.round(e.duration),location.hash||"/"]),r.longTasks.length>100&&r.longTasks.shift();try{localStorage.getItem("ns-perf")==="1"&&console.warn("Slow: "+Math.round(e.duration)+" ms on "+(location.hash||"/"))}catch{}}})}).observe({type:"longtask",buffered:!0})}catch{}r.eachSeq=function(t,e,n){n=n||{},t=t||[];var a=t.length,o=null,i=!1,u=0,s=0,c=Date.now(),l=n.label||r.t("prog.work");function d(){o&&(o.querySelector(".ns-prog-t").textContent=r.t("prog.of",{l,a:u,n:a}),o.querySelector("i").style.width=(a?Math.round(u/a*100):100)+"%")}function f(){o&&(o.remove(),o=null)}return a>40&&(o=document.createElement("div"),o.className="ns-prog",o.setAttribute("role","status"),o.innerHTML='<span class="ns-prog-t"></span><span class="ns-prog-b"><i></i></span><button type="button" class="btn sm">'+r.esc(r.t("prog.cancel"))+"</button>",o.querySelector("button").addEventListener("click",function(){i=!0,this.disabled=!0}),document.body.appendChild(o),d()),new Promise(function(m,p){function h(){if(i||s>=a)return f(),i&&u<a&&r.toast(r.t("prog.stopped",{a:u,n:a})),m({done:u,cancelled:i&&u<a});var w=t[s],v=s;s++,Promise.resolve().then(function(){return e(w,v)}).then(function(){u++,Date.now()-c>40?(c=Date.now(),d(),setTimeout(h,0)):h()},function(g){f(),p(g)})}h()})},r.SHEETS=["a4","a5","a3","a6","letter","legal"],r.ROLLS=["th80","th58"],r.PAPER_ALL=r.SHEETS.concat(r.ROLLS),r.ppName=function(t){return/^(a4|a5|th80|th58)$/.test(t)?r.t("pp."+t):(jt[t]||[t])[0]},r.paperCss=function(t){return(jt[t]||jt.a4)[1]},r.paperClass=function(t){return(t==="a5"?" a5":"")+(/^(a3|a6|letter|legal)$/.test(t)?" pz-"+t:"")},r.paperRx=/^(a4|a5|a3|a6|letter|legal|th80|th58)$/,r.rollTables=function(t){Array.prototype.forEach.call(t.querySelectorAll(".sh.roll table.lines"),function(e){var n=e.querySelectorAll("thead tr"),a=0,o=[];if(Array.prototype.forEach.call(n,function(c,l){var d=0;Array.prototype.forEach.call(c.querySelectorAll("th,td"),function(f){for(;o[d]&&o[d].rs>l;)d++;for(var m=+f.getAttribute("colspan")||1,p=+f.getAttribute("rowspan")||1,h=(f.textContent||"").replace(/\s+/g," ").trim(),w=0;w<m;w++){var v=o[d+w]=o[d+w]||{t:[],rs:0};h&&v.t.indexOf(h)<0&&v.t.push(h),v.rs=Math.max(v.rs,l+p)}d+=m}),a=Math.max(a,d)}),a<6||!n.length)return;var i=document.createElement("div");i.className="rl";function u(c){var l=document.createElement("div");return l.innerHTML=c.innerHTML.replace(/<\/?(br|small|span|b|i|em|p)(\s[^>]*)?>/gi," "),(l.textContent||"").replace(/\s+/g," ").trim()}function s(c,l){var d=0,f=[],m="";Array.prototype.forEach.call(c.querySelectorAll("td,th"),function(h){var w=+h.getAttribute("colspan")||1,v=u(h),g=((o[d]||{t:[]}).t.join(" ")||"").trim();v&&!/^(0|0\.00|−|-|—)$/.test(v)&&(!m&&!l&&!h.classList.contains("n")&&!/^\d+$/.test(v)?m=v:g!=="#"&&f.push([w>1||!g?"":g,v])),d+=w});var p=document.createElement("div");p.className="rl-row"+(l?" rl-foot":""),p.innerHTML=(m?'<b class="rl-h">'+r.esc(m)+"</b>":"")+f.map(function(h){return'<span class="rl-p"><i>'+r.esc(h[0])+"</i><em>"+r.esc(h[1])+"</em></span>"}).join(""),p.innerHTML&&i.appendChild(p)}Array.prototype.forEach.call(e.querySelectorAll("tbody tr"),function(c){s(c,!1)}),Array.prototype.forEach.call(e.querySelectorAll("tfoot tr"),function(c){s(c,!0)}),e.parentNode.replaceChild(i,e)})};function De(t){Array.prototype.forEach.call(t.querySelectorAll("*"),function(e){var n=getComputedStyle(e);if(!(n.webkitBackgroundClip!=="text"&&n.backgroundClip!=="text")){var a=/nsb-n/.test(e.className)?"#0C5F57":n.color&&n.color!=="rgba(0, 0, 0, 0)"?n.color:"#0C5F57";e.style.setProperty("background-image","none","important"),e.style.setProperty("-webkit-background-clip","border-box","important"),e.style.setProperty("background-clip","border-box","important"),e.style.setProperty("color",a,"important"),e.style.setProperty("-webkit-text-fill-color",a,"important"),e.style.setProperty("filter","none","important")}})}r.pdfPlain=De,r.makePdf=function(t,e,n){return Promise.all(Mn.map(function(a){return r.loadJs(a[0],a[1])})).then(function(){var a=document.createElement("div");a.style.cssText="position:fixed;left:-12000px;top:0;background:#fff",document.body.appendChild(a);var o=Pe[e]||Pe.a4,i=null,u=Array.prototype.map.call(t,function(s){var c=s.cloneNode(!0);return c.classList.remove("a5"),c.className=c.className.replace(/\bpz-\w+\b/g,"").trim(),r.dropHints(c),a.appendChild(c),De(c),c});return u.reduce(function(s,c){return s.then(function(){return window.html2canvas(c,{scale:2,backgroundColor:"#ffffff",logging:!1})}).then(function(l){var d=o[0],f=[l];if(o[1]){var m=Math.floor(l.width*o[1]/o[0]);if(l.height>m+4){f=[];for(var p=0;p<l.height;p+=m){var h=document.createElement("canvas");h.width=l.width,h.height=Math.min(m,l.height-p);var w=h.getContext("2d");w.fillStyle="#fff",w.fillRect(0,0,h.width,h.height),w.drawImage(l,0,p,l.width,h.height,0,0,l.width,h.height),f.push(h)}}}f.forEach(function(v,g){var E=[d,o[1]||v.height*d/v.width];if(i?i.addPage(E,"portrait"):i=new window.jspdf.jsPDF(Object.assign({unit:"mm",format:E,orientation:"portrait",compress:!0},n&&n.password?{encryption:{userPassword:String(n.password),ownerPassword:String(n.password)+"-"+Math.random().toString(36).slice(2),userPermissions:["print"]}}:{})),i.addImage(v.toDataURL("image/jpeg",.92),"JPEG",0,0,d,v.height*d/v.width),!g)try{var j=String(c.innerText||"").replace(/[^\x20-\x7E\n₹]/g," ").replace(/₹/g,"Rs ").replace(/[ \t]+/g," ").trim();i.setFontSize(6),i.text(i.splitTextToSize(j,d-10).slice(0,400),5,5,{renderingMode:"invisible"})}catch{}})})},Promise.resolve()).then(function(){return a.remove(),i.output("blob")},function(s){throw a.remove(),s})})};function vt(t,e){var n=document.createElement("a"),a=URL.createObjectURL(t);n.href=a,n.download=e,document.body.appendChild(n),n.click(),n.remove(),setTimeout(function(){URL.revokeObjectURL(a)},4e3)}r.waBar=function(t,e,n){var a=document.querySelector(".pdf-wa");a&&a.remove();var o=String(n||"").replace(/\D/g,"").slice(-10),i="https://wa.me/"+(o.length===10?"91"+o:"")+"?text="+encodeURIComponent(String(e||"")+`
`+r.t("pdf.attached",{file:t})),u=r.el("div",{class:"pdf-wa",role:"status"},"<span>"+r.esc(r.t("pdf.wamsg",{file:t}))+'</span> <a class="btn sm primary" target="_blank" rel="noopener" href="'+r.esc(i)+'">'+r.esc(r.t("pdf.waopen"))+'</a> <button type="button" class="btn sm" data-x>'+r.esc(r.t("pdf.waclose"))+"</button>");u.addEventListener("click",function(s){var c=s.target.closest("a,button");c&&setTimeout(function(){u.remove()},200)}),document.body.appendChild(u),setTimeout(function(){u.remove()},6e4)};var G=null,Oe=0;r.addonSend=function(){var t=r.addonAny&&r.addonAny();return t?G!==null&&Date.now()-Oe<6e4?Promise.resolve(G):t.status().then(function(e){return G=!!(e&&e.send),Oe=Date.now(),G},function(){return!1}):Promise.resolve(!1)};function xn(t){return new Promise(function(e,n){var a=new FileReader;a.onload=function(){e(String(a.result).split(",")[1]||"")},a.onerror=n,a.readAsDataURL(t)})}r.addonSendTo=function(t,e,n,a){var o=r.addonAny();return o?(n?xn(n):Promise.resolve("")).then(function(i){return o.call("send",{via:t,phone:e.phone||"",email:e.email||"",subject:e.subject||"",text:e.text||"",file:i?{name:a,b64:i,type:"application/pdf"}:null})}):Promise.reject(new Error("addon"))},r.sendBar=function(t,e,n,a,o){o=o||{};var i=document.querySelector(".pdf-wa");i&&i.remove();var u=String(o.phone||"").replace(/\D/g,""),s=function(l,d){return r.esc(r.t(l,d))},c=r.el("div",{class:"pdf-wa",role:"status"},"<span>"+s("ax.sv_ready",{file:e})+"</span> "+(u.length>=10?'<button type="button" class="btn sm primary" data-sv="wa">'+s("ax.sv_wa")+"</button> ":"")+'<button type="button" class="btn sm'+(u.length>=10?"":" primary")+'" data-sv="mail">'+s("ax.sv_mail")+'</button> <button type="button" class="btn sm" data-sv="save">'+s("ax.sv_save")+'</button> <button type="button" class="btn sm" data-x>'+s("pdf.waclose")+"</button>");c.addEventListener("click",function(l){var d=l.target.closest("button");if(d){var f=d.getAttribute("data-sv");if(c.remove(),f==="save"){vt(t,e),r.toast(r.t("pdf.saved",{file:e}));return}f&&r.addonSendTo(f,{phone:o.phone,email:o.email,subject:n,text:a},t,e).then(function(){r.toast(r.t(f==="wa"?"ax.sv_waok":"ax.sv_mailok"))},function(){r.toast(r.t("ax.sv_fail"),"bad"),vt(t,e)})}}),document.body.appendChild(c),setTimeout(function(){c.remove()},12e4)};function Ln(t){try{var e=new URL(t);return e.hostname!=="wa.me"?null:{phone:e.pathname.replace(/\D/g,""),text:e.searchParams.get("text")||""}}catch{return null}}function ze(t){var e=Ln(t);return e?(r.addonSendTo("wa",e).catch(function(){window.__nsOpen&&window.__nsOpen.call(window,t,"_blank","noopener")}),!0):!1}window.__nsOpen||(window.__nsOpen=window.open,window.open=function(t){return G===!0&&typeof t=="string"&&/^https:\/\/wa\.me\//.test(t)&&ze(t)?null:window.__nsOpen.apply(window,arguments)},document.addEventListener("click",function(t){if(!(G!==!0||t.defaultPrevented||t.button)){var e=t.target.closest&&t.target.closest('a[href^="https://wa.me/"]');e&&ze(e.href)&&t.preventDefault()}},!0),setTimeout(function(){r.addonSend()},1500),document.addEventListener("visibilitychange",function(){document.hidden||r.addonSend()})),r.sharePdf=function(t,e,n,a,o,i){var u=String(e).replace(/[\\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,90)+".pdf";return r.toast(r.t("pdf.making")),r.makePdf(t,n,i).then(function(l){return r.addonSend().then(function(d){return d?r.sendBar(l,u,a,o,i):s(l)})}).catch(c);function s(l){var d=new File([l],u,{type:"application/pdf"}),f=navigator.canShare&&navigator.canShare({files:[d]});if(!f){vt(l,u),r.toast(r.t("pdf.saved",{file:u})),r.waBar(u,o,i&&i.phone);return}var m=function(){return navigator.share({files:[d],title:a,text:o})};return m().catch(function(p){if(!(p&&p.name==="AbortError")){var h=r.el("button",{type:"button",class:"btn primary pdf-again"},r.esc(r.t("pdf.tap")));h.addEventListener("click",function(){h.remove(),m().catch(function(){vt(l,u)})}),document.body.appendChild(h),setTimeout(function(){h.remove()},2e4)}})}function c(l){try{console.warn("PDF could not be made",l)}catch{}if(!(window.matchMedia&&matchMedia("(pointer:coarse)").matches)){r.toast(r.t("pdf.failp"),"bad"),setTimeout(function(){window.print()},400);return}r.toast(r.t("pdf.fail"),"bad"),navigator.share?navigator.share({title:a,text:o}).catch(function(){}):window.open("https://wa.me/?text="+encodeURIComponent(o),"_blank","noopener")}},r.motion=function(){if(!window.MutationObserver||!Element.prototype.animate||!document.body)return;var t=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)"),e=0,n=0,a=[],o=!1,i=function(d){(!d||d.isTrusted!==!1)&&(e=Date.now())};document.addEventListener("pointerdown",i,!0),document.addEventListener("click",i,!0),window.addEventListener("hashchange",i),document.addEventListener("input",function(){n=Date.now()},!0),document.addEventListener("keydown",function(d){d.key!=="Enter"&&d.key!==" "&&(n=Date.now())},!0);var u="option,datalist,script,style,svg,canvas,img,#ns-toast,.boot,dialog";function s(d){if(!d||d.nodeType!==1||d.matches(u)||d.closest("[data-still],.boot"))return!1;var f=d.offsetHeight;return f>24}function c(){o=!1;var d=a;a=[],d.forEach(function(f){d.some(function(m){return m!==f&&m.contains(f)})||f._nsMoved&&Date.now()-f._nsMoved<400||(f._nsMoved=Date.now(),f.animate([{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"none"}],{duration:240,easing:"cubic-bezier(.2,.7,.3,1)"}))})}function l(d){a.indexOf(d)<0&&a.push(d),o||(o=!0,requestAnimationFrame(c))}new MutationObserver(function(d){if(!(t&&t.matches)&&!document.documentElement.classList.contains("ns-soft")){var f=Date.now(),m=f-e<1500&&f-n>700;d.forEach(function(p){if(p.type==="attributes"){m&&p.oldValue!==null&&!p.target.hidden&&s(p.target)&&l(p.target);return}if(!(!m||!p.addedNodes.length)){var h=p.target;if(h===document.body||h.id==="main"){Array.prototype.forEach.call(p.addedNodes,function(w){s(w)&&l(w)});return}s(h)&&l(h)}})}}).observe(document.body,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["hidden"],attributeOldValue:!0})};var Ft={save:"M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",print:"M7 9V4h10v5M7 17H5v-7h14v7h-2M7 14h10v6H7z",share:"M12 15V3M8 7l4-4 4 4M5 12v8h14v-8",down:"M12 4v11M7 10l5 5 5-5M5 20h14",up:"M12 16V5M7 10l5-5 5 5M5 20h14",trash:"M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",plus:"M12 5v14M5 12h14",edit:"M4 20h4L19 9l-4-4L4 16zM13 7l4 4",copy:"M9 9h11v11H9zM5 15H4V4h11v1",x:"M6 6l12 12M18 6L6 18",back:"M19 12H5M11 6l-6 6 6 6",go:"M5 12h14M13 6l6 6-6 6",search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",list:"M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1",gear:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1",lock:"M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",send:"M4 12l16-8-6 16-3-7z",flag:"M5 21V4M5 4h11l-2 4 2 4H5",reset:"M4 12a8 8 0 1 0 3-6.2M4 4v5h5",check:"M5 12l5 5 9-10",data:"M5 6c0-1.7 3-3 7-3s7 1.3 7 3-3 3-7 3-7-1.3-7-3M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3 3 7 3s7-1.3 7-3",ext:"M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",wa:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",money:"M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M6 10v4M18 10v4",clock:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16M12 8v4l3 2",home:"M3 11l9-7 9 7v9h-6v-6H9v6H3z",people:"M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 7",box:"M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",shop:"M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-6h6v6",book:"M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z",bank:"M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18",filter:"M3 5h18l-7 8v6l-4 2v-8z",chart:"M4 4v16h16M8 16v-5M12 16V8M16 16v-3",keyboard:"M3 6h18v12H3zM7 10h1M11 10h1M15 10h1M7 14h10",eye:"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",camera:"M4 7h4l2-3h4l2 3h4v13H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7",calc:"M6 3h12v18H6zM9 7h6M9 11h1M12 11h1M15 11h1M9 15h1M12 15h1M15 15h1",calendar:"M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",cart:"M4 5h2l2 10h10l2-7H7M9 19h.01M17 19h.01",folder:"M3 6h6l2 2h10v11H3z",repeat:"M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",layers:"M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",coins:"M12 4c4 0 7 1.1 7 2.5S16 9 12 9 5 7.9 5 6.5 8 4 12 4zM5 6.5v5C5 12.9 8 14 12 14s7-1.1 7-2.5v-5M5 11.5v5C5 17.9 8 19 12 19s7-1.1 7-2.5v-5",scale:"M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 006 0zM19 7l-3 7a3 3 0 006 0z",shield:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",writeoff:"M6 3h9l4 4v14H6zM14 3v5h5M8 16l8-6",cap:"M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6",star:"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",bed:"M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3M7 10.5a1.5 1.5 0 1 0 0 .01",wrench:"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z",more:"M12 5.5h.01M12 12h.01M12 18.5h.01",sort:"M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4",phone:"M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 2-3",mail:"M3 6h18v12H3zM3 7l9 7 9-7",chev:"M6 9l6 6 6-6",pulse:"M3 12h4l3-7 4 14 3-7h4",bell:"M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",file:"M6 3h9l4 4v14H6zM14 3v5h5",link:"M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"},$t=[[/whats\s?app|\bwa\b/,"wa"],[/print/,"print"],[/stop repeat/,"x"],[/see and make|repeating|renewals?\b/,"repeat"],[/write.?off/,"writeoff"],[/comments file|choose the file/,"up"],[/make the link/,"link"],[/s-backup/,"data"],[/desk\.keys|keyboard|shortcut/,"keyboard"],[/preview/,"eye"],[/scan|camera/,"camera"],[/\bpf\b|work out|calculat/,"calc"],[/filt|\bcf\b|post-dated|bounce|below zero/,"filter"],[/get name|gst portal/,"search"],[/restore|import|upload/,"up"],[/backup|download|export|excel|csv|install/,"down"],[/\bpdf\b|share/,"share"],[/delete|remove|\brm\b|bin|trash|clear|-off\b/,"trash"],[/report|tell|mistake/,"flag"],[/later/,"clock"],[/\bsend\b|reminder|remind/,"send"],[/lock|\bpin\b/,"lock"],[/reset|again|undo|refresh|reload/,"reset"],[/\bnext\b|continue/,"go"],[/setting|configur/,"gear"],[/\bsave\b|submit|\bok\b|use these|apply|done/,"save"],[/\bnew\b|\badd\b|create/,"plus"],[/edit|change|rename|series/,"edit"],[/copy|duplicate/,"copy"],[/close|cancel|dismiss/,"x"],[/\bback\b|fback/,"back"],[/search|find|lookup|fetch|check gstin/,"search"],[/history|saved|list|register/,"list"],[/setting|configur/,"gear"],[/my.?data|vault/,"data"],[/new tab|external|portal/,"ext"],[/all tools by job|group summary|rent board/,"layers"],[/feedback|loyalty/,"star"],[/staff view/,"people"],[/room diary/,"calendar"],[/\brooms?\b/,"bed"],[/\bunits\b/,"home"],[/products and variants/,"box"],[/service visits?/,"wrench"],[/all contracts|\bcontracts?\b/,"file"],[/attendance/,"calendar"],[/\besi\b/,"shield"],[/staff advance|\bsalary\b/,"money"],[/\bloans?\b|\bemi\b/,"coins"],[/trial balance|balance sheet/,"scale"],[/profit and loss/,"chart"],[/students?\b/,"cap"],[/fee set.?up/,"gear"],[/month end/,"calendar"],[/business health|health \d/,"pulse"],[/\breminders\b/,"bell"],[/paid|payment|money|receiv|cash|\bpay\b/,"money"],[/later|ageing|due/,"clock"],[/open|convert|toinv|make invoice|next|go\b/,"go"],[/doc|bill|invoice|statement|receipt|stmt/,"file"],[/\bbk\b|book/,"book"],[/b2pv|by item|by party|month|\bday\b|today|sale/,"chart"],[/financial year|\bfy\b|year/,"calendar"],[/salesm|customer|supplier|part(y|ies)|tenant|employee/,"people"],[/count|stock|godown|item/,"box"],[/bank/,"bank"],[/\bdef\b|default/,"check"],[/purchase|order/,"cart"],[/folder/,"folder"]];function An(t){if(t.getAttribute("data-ic"))return t.getAttribute("data-ic");var e=(t.textContent||"").trim();if(!e||!/^[\p{L}\p{N}]/u.test(e))return"";var n=[].map.call(t.attributes,function(o){return/^data-/.test(o.name)?o.name.slice(5)+" "+o.value:o.name==="type"&&o.value==="submit"?"submit":""}).join(" ");n+=" "+(t.getAttribute("data-i18n")||"")+" "+(r.meaning?r.meaning(e):"")+" "+e,n=n.toLowerCase();for(var a=0;a<$t.length;a++)if($t[a][0].test(n))return $t[a][1];return""}var Qt=".btn,button.link,.sbar .linkish,[data-tab-btn]";function qe(t){if(!(!t.matches||!t.matches(Qt)||t.classList.contains("icon-btn")||t.classList.contains("hp-q")||t.querySelector("svg,img")||t.closest("[data-noic]"))){var e=t.firstChild&&t.firstChild.nodeType===3?t.firstChild:null;e&&/^\s*\+\s*(?=[\p{L}\p{N}])/u.test(e.nodeValue)&&(e.nodeValue=e.nodeValue.replace(/^\s*\+\s*/,""),t.setAttribute("data-ic","plus"));var n=An(t);!n||!Ft[n]||t.insertAdjacentHTML("afterbegin",Be(n))}}var _e=/[?&]print=1\b/.test(location.search);r.autoPrint=function(){var t=_e;return _e=!1,t};var ot=0;r.creditLine=function(t){return ot++,'<p class="ns-cl'+(t?" "+t:"")+'"><b class="nsb nsb-in nsb-wm" aria-label="NSBiz"><svg class="nsb-wm-s" viewBox="-230 0 3434 1120" width="3.434em" height="1.12em" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="nsbA'+ot+'" gradientUnits="userSpaceOnUse" x1="657" y1="978" x2="895" y2="-374"><stop offset="0" stop-color="#127F74"/><stop offset="1" stop-color="#063F39"/></linearGradient><linearGradient id="nsbB'+ot+'" gradientUnits="userSpaceOnUse" x1="2308" y1="2.5" x2="2504" y2="1117.5"><stop offset="0" stop-color="#E9BC52"/><stop offset="1" stop-color="#B47F23"/></linearGradient></defs><g transform="translate(0 862) scale(1 -1)" fill="url(#nsbA'+ot+')"><path transform="translate(0 0)" d="M1142 -135Q1081 -173 1010 -173Q948 -173 881 -136Q812 -99 746 -31L307 423V71Q307 45 325.0 27.5Q343 10 368 10H387V0H21V10H40Q65 10 83.0 27.5Q101 45 101 71V637Q-53 801 -169 801Q-198 801 -225 791L-230 800Q-174 840 -109 840Q-66 840 -21.5 823.5Q23 807 56 786Q118 745 166 696L577 271V629Q576 655 558.0 672.5Q540 690 515 690H496V700H862V690H844Q819 690 801.0 672.5Q783 655 782 630V59L800 40Q800 40 823.5 15.0Q847 -10 855.5 -18.0Q864 -26 890.0 -49.5Q916 -73 932.0 -82.5Q948 -92 976.0 -107.5Q1004 -123 1027 -127Q1053 -133 1082.0 -133.0Q1111 -133 1138 -125Z"/><path transform="translate(881 0)" d="M647 170Q647 127 628.0 78.5Q609 30 567.0 -11.0Q525 -52 459.0 -78.0Q393 -104 315.0 -104.0Q237 -104 175 -79Q59 -33 24 82Q15 113 15 140Q15 227 68 303L77 296Q44 237 44 182Q44 114 78.0 62.0Q112 10 169.0 -19.0Q226 -48 285.5 -48.0Q345 -48 386.0 -29.0Q427 -10 446.0 22.0Q465 54 465.0 89.0Q465 124 440.0 160.5Q415 197 366 224L203 320Q79 393 79 508Q79 611 151 667Q211 714 314 714Q380 714 482 704H560L539 541H529Q529 596 486.0 630.0Q443 664 376.0 664.0Q309 664 273.0 641.0Q237 618 234 580Q231 554 248 536Q263 520 278.0 511.5Q293 503 305.0 496.0Q317 489 322 487L509 380Q572 345 607 293Q647 234 647 170Z"/></g><rect x="1608" y="126" width="1596" height="868" rx="434" fill="url(#nsbB'+ot+')"/><g fill="#fff"><path transform="translate(1762.0 757) scale(0.70 -0.70)" d="M402 -16Q-9 -16 -9 321Q-9 350 -6 380L4 381Q4 195 127 103V628Q126 655 107.0 672.5Q88 690 63 690H50V700H358Q528 700 608 623Q651 581 651 522Q651 457 608 413Q589 392 565 383Q570 383 575 383Q643 383 700.0 336.0Q757 289 757.0 209.0Q757 129 700 76Q603 -16 402 -16ZM436 486V516Q433 581 410.0 613.0Q387 645 332 649V38Q422 39 472.0 86.5Q522 134 522 211Q522 296 475.0 334.0Q428 372 366 372V381Q387 381 401.5 392.5Q416 404 423 421Q436 458 436 486Z"/><path transform="translate(2290.5 757) scale(0.70 -0.70)" d="M43 10Q69 10 87.5 28.5Q106 47 107 73V628Q106 654 87.5 672.0Q69 690 43 690H30V700H389V690H376Q350 690 331.5 672.0Q313 654 312 628V73Q312 47 331.0 28.5Q350 10 376 10H389V0H30V10Z"/><path transform="translate(2583.1 757) scale(0.70 -0.70)" d="M49 719Q64 713 101.5 707.0Q139 701 154.5 701.0Q170 701 170 701H515Q557 701 586.0 706.0Q615 711 621 714V705L285 50H426Q499 50 555.0 98.5Q611 147 634 232H644L606 0H35V9L367 651H187Q127 650 93.0 615.5Q59 581 59 521V513H49Z"/></g></svg></b><span class="cl-by">by</span><img src="/icons/mark-light-48.webp" alt="" width="20" height="14"><span class="cl-ns">Nivesh Sahayak</span></p>'},r.creditCss=".ns-cl{display:flex;align-items:center;justify-content:center;gap:4px;font:11px Arial,Helvetica,sans-serif;color:#374151;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ns-cl img{height:1.6em;width:auto}.ns-cl b{display:inline-flex;align-items:center;font-size:1.45em;line-height:1;direction:ltr}.ns-cl .nsb-wm-s{display:block;width:3.434em;height:1.12em;margin-left:-.23em;overflow:visible}.ns-cl .cl-by,.ns-cl .cl-ns{font-weight:700;color:#374151}.ns-cl .cl-by{margin-inline-start:2px}@media print{.ns-fx{position:fixed;left:0;right:0;bottom:5mm;margin:0}}",r.creditDoc=function(){return r.creditLine("ns-fx")},r.creditText="NSBiz by Nivesh Sahayak",r.pageBoxes=function(t){return'@page{@top-left{content:""}@top-center{content:""}@top-right{content:""}@bottom-left{content:""}@bottom-right{content:""}@bottom-center{content:"'+(t?r.creditText:"")+'";font:8pt Arial,sans-serif;color:#555}}'},(function(){var t=null;function e(){for(var n=document.querySelectorAll(".ns-cl, .made"),a=0;a<n.length;a++)if(!n[a].closest("header, footer, nav, #ns-side, .hd, .ft, [hidden], dialog:not([open])"))return!0;return!1}window.addEventListener("beforeprint",function(){t||e()||(t=document.createElement("div"),t.setAttribute("data-ns-pcredit",""),t.className="ns-pcredit",t.innerHTML=r.creditDoc()+"<style>@media print{"+r.pageBoxes(!1)+"}</style>",document.body.appendChild(t))}),window.addEventListener("afterprint",function(){t&&(t.remove(),t=null)})})(),(function(){var t=".stsheet, [data-sheet]";function e(o){!o.isConnected||!/^(DIV|SECTION|ARTICLE)$/.test(o.tagName)||o.querySelector(".ns-cl")||o.parentNode&&o.parentNode.closest&&o.parentNode.closest(t)||o.classList.contains("no-credit")||o.insertAdjacentHTML("beforeend",r.creditLine("st-ft"))}function n(o){!o||o.nodeType!==1||(o.matches&&o.matches(t)&&e(o),o.querySelectorAll&&Array.prototype.forEach.call(o.querySelectorAll(t),e))}function a(){n(document.body),new MutationObserver(function(o){o.forEach(function(i){Array.prototype.forEach.call(i.addedNodes,n);var u=i.target;if(u&&u.nodeType===1&&u.closest){var s=u.closest(t);s&&e(s)}})}).observe(document.body,{childList:!0,subtree:!0})}document.body?a():document.addEventListener("DOMContentLoaded",a)})();function Be(t){return'<svg class="bi'+(t==="wa"?" bi-fill":"")+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+Ft[t]+'"/></svg>'}r.icSvg=function(t){return Ft[t]?Be(t):""};var He="script,style,textarea,input,select,option,title,noscript,code,pre,svg,[contenteditable],.brand,.nsb,#sheet,.sh,.stsheet,[data-sheet],#vch-print,.no-nsb";function Nn(t){if(!(!t||t.nodeType!==1||t.closest&&t.closest(He))){for(var e=document.createTreeWalker(t,NodeFilter.SHOW_TEXT,{acceptNode:function(o){return o.nodeValue.indexOf("NSBiz")>=0&&!(o.parentNode&&o.parentNode.closest&&o.parentNode.closest(He))?1:2}}),n=[],a;a=e.nextNode();)n.push(a);n.forEach(function(o){var i=o.nodeValue.split("NSBiz"),u=document.createDocumentFragment();i.forEach(function(s,c){if(s&&u.appendChild(document.createTextNode(s)),c<i.length-1){var l=document.createElement("b");l.className="nsb nsb-in",l.setAttribute("aria-label","NSBiz"),l.innerHTML='<span class="nsb-n" aria-hidden="true">NS</span><span class="nsb-b" aria-hidden="true">Biz</span>',u.appendChild(l)}}),o.parentNode.replaceChild(u,o)})}}r.nsbMarks=function(){if(!document.body)return;var t=new Set,e=!1;function n(){e=!1,t.forEach(function(o){o.isConnected&&Nn(o.nodeType===3?o.parentNode:o)}),t.clear()}function a(o){o&&(t.add(o),e||(e=!0,setTimeout(n,20)))}a(document.body),new MutationObserver(function(o){o.forEach(function(i){i.type==="characterData"?a(i.target):[].forEach.call(i.addedNodes,function(u){a(u.nodeType===3?u.parentNode:u)})})}).observe(document.body,{subtree:!0,childList:!0,characterData:!0})},r.dragSort=function(t,e,n){if(!(!t||t._dragSort)){t._dragSort=1;var a=function(){return[].slice.call(t.children).filter(function(s){return s.tagName==="LI"})},o=-1,i=function(){a().forEach(function(s,c){var l=!n||n(c);s.draggable=l,s.classList.toggle("ds-row",l)})};i(),new MutationObserver(i).observe(t,{childList:!0});var u=function(){a().forEach(function(s){s.classList.remove("ds-drag","ds-a","ds-b")})};t.addEventListener("dragstart",function(s){var c=s.target.closest&&s.target.closest("li");if(!(!c||c.parentNode!==t)){o=a().indexOf(c),c.classList.add("ds-drag");try{s.dataTransfer.effectAllowed="move",s.dataTransfer.setData("text/plain",String(o))}catch{}}}),t.addEventListener("dragover",function(s){if(!(o<0)){var c=s.target.closest&&s.target.closest("li");if(!(!c||c.parentNode!==t)){var l=a().indexOf(c);if(!(n&&!n(l))&&(s.preventDefault(),u(),a()[o].classList.add("ds-drag"),l!==o)){var d=c.getBoundingClientRect();c.classList.add(s.clientY<d.top+d.height/2?"ds-a":"ds-b")}}}}),t.addEventListener("drop",function(s){var c=s.target.closest&&s.target.closest("li");if(!(o<0||!c)){s.preventDefault();var l=c.getBoundingClientRect(),d=a().indexOf(c)+(s.clientY<l.top+l.height/2?0:1);o<d&&d--;var f=o;o=-1,u(),d!==f&&(!n||n(d))&&e(f,d)}}),t.addEventListener("dragend",function(){o=-1,u()})}},r.btnIcons=function(){if(!document.body)return;var t=new Set,e=!1;function n(){e=!1,t.forEach(function(o){o.isConnected&&(qe(o),o.querySelectorAll&&[].forEach.call(o.querySelectorAll(Qt),qe))}),t.clear()}function a(o){o.nodeType===1&&(t.add(o),e||(e=!0,setTimeout(n,16)))}a(document.body),new MutationObserver(function(o){o.forEach(function(i){i.target.nodeType===1&&i.target.matches(Qt)&&a(i.target),[].forEach.call(i.addedNodes,a)}),e&&n()}).observe(document.body,{subtree:!0,childList:!0})};var L;function T(t){return typeof t=="function"?t():t}r.focusSel=function(t){if(t){t.focus();try{t.select&&/^(text|search|number|tel|email|url|)$/.test(t.type||"")&&t.tagName==="INPUT"&&t.select()}catch{}}},r.enterNext=function(t){!t||t._enterNext||(t._enterNext=1,t.addEventListener("keydown",function(e){var n=e.target;if(!(e.defaultPrevented||e.key!=="Enter"||e.shiftKey||e.ctrlKey||e.metaKey||e.altKey||!n||!/^(INPUT|SELECT)$/.test(n.tagName)||/^(checkbox|radio|file|submit|button|color|range)$/.test(n.type))){var a=Array.prototype.slice.call(t.querySelectorAll("input,select,textarea")).filter(function(i){return!i.disabled&&!i.readOnly&&i.type!=="hidden"&&i.type!=="file"&&i.type!=="checkbox"&&i.type!=="radio"&&i.offsetParent!==null&&!i.closest("details:not([open])")&&!i.closest("[hidden]")}),o=a.indexOf(n);o<0||o>=a.length-1||(e.preventDefault(),r.focusSel(a[o+1]))}}))},r.seriesLink=function(t,e){if(!(!t||!window.NSStore)){var n=t.closest(".f")||t.parentNode;if(!(!n||n.querySelector("[data-series]"))){var a=r.el("button",{type:"button",class:"link series-link","data-series":""},r.esc(r.t("sr.btn")));n.appendChild(a),a.addEventListener("click",function(){r.loadCfg().then(function(o){var i=T(e.biz),u=r.cfgFor(o,i),s=T(e.type),c=T(e.kind)||"",l=u[s]||{},d=u.invoice||{},f=c?(l.prefixes||{})[c]:l.prefix;s==="invoice"&&f==null&&(f=d.prefix),f==null&&(f=T(e.def)||"");var m=e.digits||+d.digits||3,p=e.fy!=null?e.fy:d.fy!==!1,h=r.fy(r.today()),w=h.slice(2,4)+"-"+h.slice(5);L||(L=r.el("dialog",{id:"ns-series","aria-labelledby":"ns-series-h"}),document.body.appendChild(L)),L.innerHTML='<div class="dlg-h"><h2 id="ns-series-h">'+r.esc(r.t("sr.title",{doc:T(e.name)}))+'</h2><form method="dialog"><button class="btn sm">'+r.esc(r.t("close"))+'</button></form></div><form class="dlg-b" data-ser novalidate><p class="soft">'+r.esc(r.t("sr.p"))+'</p><div class="f"><label for="ser-pre">'+r.esc(r.t("hub.pfx"))+'</label><input id="ser-pre" dir="ltr" maxlength="8" autocapitalize="characters" value="'+r.esc(f)+'"></div><p>'+r.esc(r.t("hub.nextno"))+' <b class="mono" data-ser-pv></b></p><p class="soft">'+r.esc(r.t("sr.more"))+' <a href="'+(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?"http://localhost:8862/":"https://my.niveshsahayak.in/")+'#settings" target="_blank" rel="noopener">'+r.esc(r.t("mydata"))+' ›</a></p><div class="btns"><button type="submit" class="btn primary">'+r.esc(r.t("sr.save"))+"</button></div></form>";var v=r.$("[data-ser]",L),g=r.$("#ser-pre",L);function E(){return g.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g,"")}var j=1;function F(){var D=E();r.$("[data-ser-pv]",L).textContent=(D?D+"/":"")+(p?w+"/":"")+String(j).padStart(m,"0")}g.addEventListener("input",F),F();var yt=/(\d+)\s*$/.exec(t.value||"");yt&&!T(e.saved)?(j=+yt[1],F()):NSStore.list("doc").then(function(D){var q=String(i&&i.name||"").trim().toLowerCase(),_=r.fy(r.today()),A=0;D.forEach(function(B){if(!(B.type!==s||r.fy(B.date)!==_||String(B.seller&&B.seller.name||"").trim().toLowerCase()!==q)){var St=/(\d+)\s*$/.exec(B.no||"");St&&(A=Math.max(A,+St[1]))}}),j=A+1,F()}).catch(function(){}),v.addEventListener("submit",function(D){D.preventDefault(),r.cfgEdit(i,function(q){var _=E(),A=q[s]=q[s]||{};c?(A.prefixes=A.prefixes||{},A.prefixes[c]=_):A.prefix=_}).then(function(q){L.close(),r.toast(r.t("sr.saved")),e.apply&&e.apply(q)}).catch(function(){r.toast(r.t("sr.fail"),"bad")})}),L.showModal?L.showModal():L.setAttribute("open",""),g.focus(),g.select()})})}}};var Cn={exp:"expinv"};r.VTYPES=[["invoice","","INV","Doc.invoice"],["cashmemo","","CM","Doc.cashmemo"],["quote","quote","QT","k.quote"],["quote","estimate","EST","k.estimate"],["proforma","","PI","Doc.proforma"],["so","","SO","Doc.so"],["challan","","DC","Doc.challan"],["po","","PO","Doc.po"],["note","credit","CN","k.credit"],["note","debit","DN","k.debit"],["note","creditp","PCN","k.creditp"],["note","debitp","PDN","k.debitp"],["self","","SI","Doc.self"],["exp","","EXP","Doc.exp"],["receipt","","RCT","Doc.receipt"],["voucher","","PV","Doc.voucher"],["rent","","RR","Doc.rent"],["salary","","SAL","Doc.salary"],["petty","","PCB","Doc.petty"],["contra","","CV","desk.v_contra"],["jv","","JV","app.d_jv"]],r.nxDocType=function(t){return Cn[t]||t},r.nxKind=function(t){return t?t.type==="note"?(t.kind||"credit")+(t.side==="purchase"?"p":""):t.type==="quote"?t.kind||"quote":"":""},r.nxOutward=function(t){if(!t)return!1;var e=t.type||"invoice";return e==="invoice"||e==="cashmemo"||e==="expinv"||e==="exp"||e==="self"?!t.counter||e==="invoice":e==="note"?t.side!=="purchase":e==="receipt"?!!(t.gstAdv||t.kind==="ref"):!1},r.nxSubs=function(t,e){return(t&&t.vsub||[]).filter(function(n){return n&&n.base===e&&!n.off})},r.nxSub=function(t,e){return e&&(t&&t.vsub||[]).filter(function(n){return n&&n.id===e})[0]||null};function bt(t){return String(t??"").trim().replace(/[^A-Za-z0-9\/\-]/g,"")}r.seriesOf=function(t,e,n,a,o){t=t||{},o=o||{};var i=t[e]||{},u=t.invoice||{},s=(t.series||{})[n?e+"."+n:e]||{},c=typeof a=="object"?a:r.nxSub(t,a),l=n?(i.prefixes||{})[n]:i.prefix;e==="invoice"&&l==null&&(l=u.prefix),(l==null||n&&l==="")&&(l=o.def!=null?o.def:"");var d={key:c?"sub:"+c.id:n?e+"."+n:e,method:s.method||"auto",prefix:bt(l),suffix:bt(s.suffix),fy:s.fy!=null?s.fy!==!1:o.fy!=null?!!o.fy:(i.fy!=null?i.fy:u.fy)!==!1,width:Math.min(6,Math.max(1,+s.width||+i.digits||+o.width||+u.digits||3)),start:Math.max(1,Math.floor(+s.start||1)),restart:s.restart||"year",dup:s.dup||"block",sub:c?c.id:""};return c&&["method","fy","width","start","restart","dup"].forEach(function(f){c[f]!=null&&c[f]!==""&&(d[f]=f==="fy"?c.fy!==!1:f==="width"?Math.min(6,Math.max(1,+c.width||3)):f==="start"?Math.max(1,Math.floor(+c.start||1)):c[f])}),c&&(d.prefix=bt(c.prefix!=null&&c.prefix!==""?c.prefix:d.prefix),d.suffix=bt(c.suffix||""),d.start=Math.max(1,Math.floor(+c.start||1))),d};function J(t){return String(t||"").trim().toLowerCase()}function Ie(t,e){return e==="never"?"":e==="month"?String(t||"").slice(0,7):r.fy(t)}r.nxHead=function(t,e,n){var a=r.fy(e||r.today()),o=a.slice(2,4)+"-"+a.slice(5);return(t.prefix?t.prefix+"/":"")+(t.fy?o+"/":"")+(t.restart==="month"?String(e||"").slice(5,7)+"/":"")+(n||"")},r.nxNum=function(t,e){var n=String(t||"").trim();e&&n.slice(-e.length).toUpperCase()===e.toUpperCase()&&(n=n.slice(0,-e.length));var a=/(\d+)\s*$/.exec(n);return a?+a[1]:0},r.nxIn=function(t,e,n){return!t||(t.type||"invoice")!==r.nxDocType(e.type)||!!t.counter!=!!e.counter||e.skip&&t.id===e.skip||e.kind&&r.nxKind(t)!==e.kind||(t.vt||"")!==(n.sub||"")||e.seller!=null&&J(t.seller&&t.seller.name)!==J(typeof e.seller=="object"?e.seller.name:e.seller)||e.match&&!e.match(t)?!1:Ie(t.date,n.restart)===Ie(e.date,n.restart)},r.nextNo=function(t,e){e=e||{};var n=e.series||r.seriesOf(e.cfg,e.type,e.kind,e.sub,e),a=0,o=[];(t||[]).forEach(function(s){if(r.nxIn(s,e,n)){var c=r.nxNum(s.no,n.suffix);c&&(a=Math.max(a,c),o.push(s.no))}});var i=Math.max(a,n.start-1)+1,u=r.nxHead(n,e.date,e.tag);return{no:n.method==="manual"?"":u+String(i).padStart(n.width,"0")+n.suffix,head:u,width:n.width,suffix:n.suffix,nos:o,n:i,series:n,manual:n.method==="manual"}},r.noProblem=function(t,e,n){n=n||{};var a=String(e&&e.no||"").trim(),o=n.series||r.seriesOf(n.cfg,n.type||e.type,n.kind!=null?n.kind:r.nxKind(e),e.vt||"",n);if(!a)return{code:"empty",block:!0,msg:r.t("nx.empty")};var i=r.nxOutward(e);if(i&&a.length>16)return{code:"len",block:!0,msg:r.t("nx.len",{no:a})};var u=e.type||"invoice",s=J(e.seller&&e.seller.name),c=r.fy(e.date),l=(t||[]).filter(function(d){return d.id!==e.id&&(n.skip==null||d.id!==n.skip)&&(d.type||"invoice")===u&&!d.counter==!e.counter&&J(d.no)===J(a)&&r.fy(d.date)===c&&J(d.seller&&d.seller.name)===s})[0];return l?{code:"dup",other:l,block:i||o.dup!=="warn",msg:r.t(u==="invoice"?"app.qe_dup":"nx.dup",{no:a})}:""},r.noBox=function(t,e){!t||!e||(t.readOnly=e.method==="fixed",e.method==="manual"?t.setAttribute("placeholder",r.t("nx.typeno")):t.removeAttribute("placeholder"))},r.subPick=function(t,e){if(t){var n=t.closest(".f")||t.parentNode,a=r.nxSubs(T(e.cfg),T(e.type)),o=n.querySelector("[data-subpick]");if(!a.length){o&&o.remove();return}o||(o=r.el("label",{class:"subpick","data-subpick":""}),n.appendChild(o));var i=T(e.get)||"";o.innerHTML="<span>"+r.esc(r.t("nx.series"))+"</span> <select>"+['<option value="">'+r.esc(r.t("nx.main"))+"</option>"].concat(a.map(function(s){return'<option value="'+r.esc(s.id)+'"'+(s.id===i?" selected":"")+">"+r.esc(s.name||s.id)+"</option>"})).join("")+"</select>";var u=o.querySelector("select");u.disabled=!!T(e.saved),u.addEventListener("change",function(){e.set(u.value)})}},r.VT_FIELDS=["copies","design","paper","notes","terms","printAfter","shareAfter","afterSave","showBank","showSign"],r.vtCfg=function(t,e,n,a){t=t||{};var o=t.vt||{},i={};return[o[e],n&&/p$/.test(n)?o[e+"."+n.slice(0,-1)]:null,n?o[e+"."+n]:null,(r.nxSub(t,typeof a=="object"&&a?a.id:a)||{}).def].forEach(function(u){u&&r.VT_FIELDS.forEach(function(s){u[s]!=null&&u[s]!==""&&(i[s]=u[s])})}),i},r.vtApply=function(t,e,n){return!t||!e||["copies","design","paper","notes","terms"].forEach(function(a){if(!(e[a]==null||e[a]===""||n&&n.indexOf(a)<0))if(a==="copies")t.copies=Math.min(3,Math.max(1,+e.copies||1));else{if(a==="paper"&&n&&t.papers&&t.papers.indexOf(e.paper)<0)return;t[a]=e[a]}}),t},r.vtAfterSave=function(t,e,n){t&&(t.printAfter&&e?setTimeout(e,150):t.shareAfter&&n&&setTimeout(n,150))},r.bizModeOf=function(t,e){return r.bizMode(Object.assign({},t||{},{id:r.bizIdOf(t)}),e)},r.bizMode=function(t,e){t=t||{},e=e||{};var n=(e.features||{})[t.id],a=function(s){return!(n&&n.sw&&s in n.sw&&!n.sw[s])},o=a("inv"),i=t.reg||"",u=!/^(comp|unreg)$/.test(i)&&!!String(t.gstin||"").trim();return{inv:o,gst:u,comp:i==="comp",godown:o&&a("godown"),batch:o&&a("batch"),billwise:a("billwise")}},r.DESIGNS=["classic","modern","compact","band","elegant","grid","minimal","ribbon","letter","typewriter"],r.designField=function(t,e){return'<div class="f wide dpick-f"><span class="lbl" id="'+t+'-lbl">'+r.esc(r.t("l.design"))+'</span><select id="'+t+'"'+(e||"")+' hidden tabindex="-1" aria-hidden="true">'+r.DESIGNS.map(function(n){return'<option value="'+n+'">'+r.esc(r.t("ds."+n))+"</option>"}).join("")+'</select><div class="dpick" role="radiogroup" aria-labelledby="'+t+'-lbl" data-for="'+t+'">'+r.DESIGNS.map(function(n){return'<button type="button" role="radio" class="dp" data-dp="'+n+'" aria-checked="false" tabindex="-1"><i class="dp-mini dp-'+n+'" aria-hidden="true"></i><span>'+r.esc(r.t("ds."+n))+"</span></button>"}).join("")+'</div><small class="hint">'+r.esc(r.t("h.design3"))+"</small></div>"},r.designSync=function(t,e,n){r.$$(".dpick",t).forEach(function(a){var o=r.DESIGNS.indexOf(e)<0?"classic":e;n&&a.style.setProperty("--c",n),r.$$(".dp",a).forEach(function(i){var u=i.getAttribute("data-dp")===o;i.setAttribute("aria-checked",String(u)),i.tabIndex=u?0:-1})})},(function(){function t(e){var n=e.closest(".dpick"),a=n&&document.getElementById(n.getAttribute("data-for"));a&&(r.designSync(n.parentNode,e.getAttribute("data-dp")),a.value!==e.getAttribute("data-dp")&&(a.value=e.getAttribute("data-dp"),a.dispatchEvent(new Event("change",{bubbles:!0}))))}document.addEventListener("click",function(e){var n=e.target.closest&&e.target.closest(".dpick .dp");n&&t(n)}),document.addEventListener("keydown",function(e){var n=e.target.closest&&e.target.closest(".dpick .dp"),a={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!(!n||!a)){var o=r.$$(".dp",n.parentNode),i=getComputedStyle(n).direction==="rtl"&&/Left|Right/.test(e.key),u=o[(o.indexOf(n)+(i?-a:a)+o.length)%o.length];e.preventDefault(),u.focus(),t(u)}})})();var je="input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button]):not([type=range]):not([type=color]):not([type=password]):not([data-ac]),textarea:not([data-ac]),select:not([data-ac])",Tn=/name|addr|city|town|district|pin|zip|postal|state|country|phone|mobile|tel|email|mail|upi|gst|pan|party|cust|supp|payee|buyer|seller|ship|consign|landlord|tenant|guest|patient|bank|ifsc|acc/i;function Rt(t){if(!(!t||t.nodeType!==1)){var e=t.matches&&t.matches(je)?[t]:[];t.querySelectorAll&&(e=e.concat([].slice.call(t.querySelectorAll(je)))),e.forEach(function(n){if(!(n.type==="search"||n.getAttribute("data-ac-done"))){n.setAttribute("data-ac-done","1");var a=n.getAttribute("autocomplete");if(!(a&&a!=="on"&&a!=="off")){var o=n.closest("label")||n.id&&document.querySelector('label[for="'+n.id+'"]'),i=(n.id||"")+" "+(n.name||"")+" "+(n.getAttribute("list")||"")+" "+(n.type||"")+" "+(n.placeholder||"")+" "+(o?(r.meaning?r.meaning(o.textContent.trim())+" ":"")+o.textContent:"");n.setAttribute("autocomplete",Tn.test(i)?"transaction-currency":"off")}}}),t.tagName==="FORM"&&!t.getAttribute("autocomplete")&&t.setAttribute("autocomplete","off"),t.querySelectorAll&&[].forEach.call(t.querySelectorAll("form:not([autocomplete])"),function(n){n.setAttribute("autocomplete","off")})}}r.noAutofill=function(){document.body&&(Rt(document.body),window.MutationObserver&&new MutationObserver(function(t){t.forEach(function(e){[].forEach.call(e.addedNodes,Rt)})}).observe(document.body,{childList:!0,subtree:!0}),document.addEventListener("focusin",function(t){Rt(t.target)},!0))};var b={box:null,inp:null,at:0};function Fe(t){var e=[t.getAttribute("list")||""].concat(t._pkLists||[]),n={},a=[];return e.forEach(function(o){var i=document.getElementById(o);i&&[].forEach.call(i.options,function(u){var s=String(u.value||"").trim();!s||n[s.toLowerCase()]||(n[s.toLowerCase()]=1,a.push({v:s,l:u.label&&u.label!==s?u.label:""}))})}),a}function Pn(t){var e=Z(t);return e?e.kind==="item"?r.t("pk.newi"):r.t("pk.newp"):""}function z(t){if(b.box){var e=b.inp;b.box.remove(),b.box=null,b.inp=null,document.removeEventListener("mousedown",Re,!0),window.removeEventListener("resize",$e),window.removeEventListener("scroll",Qe,!0),t&&e&&document.contains(e)&&(e._pkSkip=Date.now(),e.focus())}}function $e(){z(!1)}function Qe(t){b.box&&!b.box.contains(t.target)&&Ue()}function Re(t){b.box&&!b.box.contains(t.target)&&t.target!==b.inp&&z(!1)}function Ue(){var t=b.box,e=b.inp.getBoundingClientRect(),n=Math.max(e.width,300),a=window.innerHeight,o=window.innerWidth;t.style.width=Math.min(n,o-16)+"px",t.style.left=Math.max(8,Math.min(e.left,o-Math.min(n,o-16)-8))+"px";var i=a-e.bottom-8,u=Math.min(360,Math.max(i,e.top-8));t.style.maxHeight=u+"px",i>=220||i>=e.top?(t.style.top=e.bottom+2+"px",t.style.bottom=""):(t.style.top="",t.style.bottom=a-e.top+2+"px")}function Ve(t){var e=b.inp;if(e){z(!1),e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}));var n=e.form||e.closest("form, dialog, .card, section")||document.body,a=[].filter.call(n.querySelectorAll("input,select,textarea"),function(i){return!i.disabled&&i.type!=="hidden"&&i.type!=="checkbox"&&i.offsetParent!==null&&!i.closest("details:not([open])")}),o=a.indexOf(e);e._pkSkip=Date.now(),o>=0&&a[o+1]?a[o+1].focus():e.focus()}}function Ut(){var t=b.box.querySelector(".pk-q"),e=b.box.querySelector(".pk-ul"),n=t.value.trim().toLowerCase(),a=b.opts.filter(function(s){return!n||(s.v+" "+s.l).toLowerCase().indexOf(n)>=0});a.sort(function(s,c){var l=s.v.toLowerCase().indexOf(n)===0?0:1,d=c.v.toLowerCase().indexOf(n)===0?0:1;return l-d}),a=a.slice(0,200);var o=Pn(b.inp),i=a.some(function(s){return s.v.toLowerCase()===n}),u=a.map(function(s,c){return'<li role="option" class="pk-o" data-v="'+r.esc(s.v)+'" id="pk-o'+c+'"><b>'+r.esc(s.v)+"</b>"+(s.l?"<small>"+r.esc(s.l)+"</small>":"")+"</li>"});n&&!i&&u.push('<li role="option" class="pk-o pk-typed" data-v="'+r.esc(t.value.trim())+'">'+r.esc(r.t("pk.use",{v:t.value.trim()}))+"</li>"),o&&u.push('<li role="option" class="pk-o pk-new" data-new="1">+ '+r.esc(o)+(n&&!i?": "+r.esc(t.value.trim()):"")+"</li>"),e.innerHTML=u.join("")||'<li class="pk-none">'+r.esc(r.t("pk.none"))+"</li>",b.at=0,gt()}function gt(){var t=b.box.querySelectorAll(".pk-o");t.length&&(b.at=Math.max(0,Math.min(b.at,t.length-1)),[].forEach.call(t,function(e,n){e.classList.toggle("on",n===b.at),e.setAttribute("aria-selected",n===b.at?"true":"false")}),t[b.at].scrollIntoView({block:"nearest"}))}function Vt(t){if(t){if(t.getAttribute("data-new")){var e=b.inp,n=b.box.querySelector(".pk-q").value.trim();z(!1),e.value=n,e._pkSkip=Date.now(),e.focus(),r.quickAdd(e);return}Ve(t.getAttribute("data-v"))}}function wt(t,e){b.box&&z(!1);var n=b.box=r.el("div",{class:"pk-box",role:"dialog","aria-label":(t.labels&&t.labels[0]?t.labels[0].textContent:"")||r.t("pk.pick")});n.innerHTML='<input class="pk-q" type="search" role="combobox" aria-expanded="true" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="'+r.esc(r.t("pk.find"))+'"><ul class="pk-ul" role="listbox"></ul><p class="pk-hint">'+r.esc(r.t("pk.hint"))+"</p>",(t.closest("dialog[open]")||document.body).appendChild(n),b.inp=t,b.opts=Fe(t);var a=n.querySelector(".pk-q");if(a.value=e??t.value,Ue(),Ut(),a.focus(),e==null&&a.select(),a.addEventListener("input",Ut),window.MutationObserver){var o=new MutationObserver(function(){if(b.inp!==t){o.disconnect();return}var i=b.at;b.opts=Fe(t),Ut(),b.at=i,gt()});[t.getAttribute("list")||""].concat(t._pkLists||[]).forEach(function(i){var u=document.getElementById(i);u&&o.observe(u,{childList:!0})})}a.addEventListener("keydown",function(i){if(i.key==="ArrowDown")i.preventDefault(),b.at++,gt();else if(i.key==="ArrowUp")i.preventDefault(),b.at--,gt();else if(i.key==="Enter"){i.preventDefault(),i.stopPropagation();var u=n.querySelector(".pk-o.on");u?Vt(u):a.value.trim()?Ve(a.value.trim()):z(!0)}else if(i.key==="Escape")i.preventDefault(),i.stopPropagation(),z(!0);else if(i.key==="Tab"){var s=n.querySelector(".pk-o.on:not(.pk-new)");s&&a.value.trim()?(i.preventDefault(),Vt(s)):z(!1)}}),n.addEventListener("mousedown",function(i){i.target!==a&&i.preventDefault()}),n.addEventListener("click",function(i){var u=i.target.closest(".pk-o");u&&Vt(u)}),document.addEventListener("mousedown",Re,!0),window.addEventListener("resize",$e),window.addEventListener("scroll",Qe,!0)}function Ke(t){return t&&t.tagName==="INPUT"&&t.getAttribute("list")&&t.type!=="search"&&!t.hasAttribute("data-nopick")&&!t.closest("[data-nopick], .pk-box")}function Kt(t){t&&t.querySelectorAll&&[].forEach.call(t.querySelectorAll("input:not([list])"),function(n){var a=ht(n);a&&a!=="dphone"&&(n.setAttribute("list","ns-dl-"+a),r.dispatch().then(function(o){Te(a,o)}))});var e=t&&t.querySelectorAll?[].slice.call(t.querySelectorAll("input[list]")):[];Ke(t)&&e.push(t),e.forEach(function(n){!Ke(n)||n.hasAttribute("data-pk")||(n.setAttribute("data-pk",""),n.readOnly||(n.readOnly=!0,n.setAttribute("data-pkro","")))})}r.pickers=function(){if(!(!document.body||r._pk)){r._pk=1,Kt(document.body),window.MutationObserver&&new MutationObserver(function(a){a.forEach(function(o){[].forEach.call(o.addedNodes,function(i){i.nodeType===1&&Kt(i)}),o.type==="attributes"&&(o.oldValue&&o.oldValue!==o.target.getAttribute("list")&&(o.target._pkLists=o.target._pkLists||[]).push(o.oldValue),Kt(o.target))})}).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeOldValue:!0,attributeFilter:["list"]});var t=function(a){return a&&a.hasAttribute&&a.hasAttribute("data-pkro")&&!a.disabled},e=function(a){return r.mkFresh&&document.documentElement.hasAttribute("data-maker")&&t(a)&&!a.closest("dialog")},n=function(a){var o=a.target;e(o)&&(o.readOnly=!1,o.removeAttribute("data-pkro"),o.setAttribute("data-pkfree",""))};document.addEventListener("pointerdown",n,!0),document.addEventListener("focusin",n,!0),document.addEventListener("click",function(a){var o=a.target;t(o)&&!b.box&&wt(o)},!0),document.addEventListener("keydown",function(a){var o=a.target;if(t(o)){var i=a.key;i.length===1&&!a.ctrlKey&&!a.metaKey&&!a.altKey?(a.preventDefault(),wt(o,i)):(i==="ArrowDown"||i==="F4"||i==="Enter"&&!o.value.trim()||i==="Backspace"||i==="Delete")&&(a.preventDefault(),a.stopPropagation(),wt(o,i==="Backspace"?o.value.slice(0,-1):i==="Delete"?"":null))}},!0),document.addEventListener("submit",function(a){var o=a.target,i=o&&o.querySelector&&[].filter.call(o.querySelectorAll("input[data-pkro][required]"),function(u){return!u.disabled&&u.offsetParent!==null&&!u.value.trim()})[0];i&&(a.preventDefault(),a.stopImmediatePropagation(),r.toast(r.t("pk.need"),"bad"),i.focus(),wt(i))},!0)}},r.start=function(){var t=r.initLang?r.initLang():null;r.initTheme(),r.motion(),r.noAutofill(),r.pickers(),r.btnIcons(),r.nsbMarks();var e=r.$("[data-year]");e&&(e.textContent=new Date().getFullYear()),r.sponsor(),"serviceWorker"in navigator&&location.protocol==="https:"&&navigator.serviceWorker.register("/sw.js").catch(function(){});var n=function(){var a=function(){r.leaving||document.documentElement.classList.add("ready")},o=r.$("#app:not([data-secs])")&&!document.documentElement.classList.contains("embed"),i=o?function(){if(window.__nsAppData)return a();var c=function(){clearTimeout(l),document.removeEventListener("ns-app-data",c),a()},l=setTimeout(c,Math.max(0,5e3-performance.now()));document.addEventListener("ns-app-data",c)}:a,u=r.$(".boot");if(!window.NS_BOOT_T||!u)return i();if(!u.getAnimations)return setTimeout(i,Math.max(0,NS_BOOT_T-performance.now()));var s=u.getAnimations({subtree:!0}).filter(function(c){return c.effect&&c.effect.getComputedTiming().iterations!==1/0}).map(function(c){return c.finished});Promise.race([Promise.all(s),new Promise(function(c){setTimeout(c,3e3)})]).then(i,i)};t&&t.then?Promise.race([t,new Promise(function(a){setTimeout(a,1200)})]).then(n,n):n()},document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r.start):r.start()})(),(function(){"use strict";if(window.self!==window.top){try{if(window.parent.location.origin===location.origin)return}catch{}var r=/(^|\.)niveshsahayak\.in$/;document.addEventListener("click",function(k){var $=k.target.closest&&k.target.closest("a[href]");if(!(!$||k.defaultPrevented||k.button||k.ctrlKey||k.metaKey||k.shiftKey||k.altKey||$.hasAttribute("download")||$.target==="_blank")){var M;try{M=new URL($.href)}catch{return}if(/^https?:$/.test(M.protocol)&&!(M.origin===location.origin&&M.pathname===location.pathname&&M.search===location.search)){if(k.preventDefault(),r.test(M.hostname))try{window.parent.postMessage({nsOpen:M.href},"*");return}catch{}window.open(M.href,"_blank","noopener")}}},!0)}})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* login.js */
try{(function(){"use strict";if(!window.NSStore||!NSStore.auth)return;var a=function(e){return String(e??"").replace(/[&<>"']/g,function(n){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[n]})},t=function(e,n){return window.NS&&NS.t?NS.t("lgn."+e,n):e},l=null,i=null,o=null,S=0,d=15;try{d=+(localStorage.getItem("nsbiz-idle")||15)||15}catch{}function f(){return NSStore.auth("authStatus").then(function(e){return i=e||{},l=i.me||null,i},function(){return{}})}var g=[[/^login$/,"e_login"],[/^no right/,"e_noright"],[/^back date: entries older than (\d+)/,"e_back"],[/^only the owner can bring back/,"e_restore"],[/^only the owner can use the recovery code/,"e_rconly"],[/^only the owner$/,"e_owner"],[/^logins are already on/,"e_already"],[/^name and a password/,"e_namepw"],[/^wrong name or password/,"e_wrong"],[/^wrong recovery code/,"e_rcwrong"],[/^a password of 6/,"e_pw6"],[/^give a new name/,"e_newname"],[/^there is one owner/,"e_oneowner"],[/^no such user/,"e_nouser"],[/^the owner stays the owner/,"e_staysowner"],[/^the old password is wrong/,"e_oldwrong"],[/^the owner role is fixed/,"e_ownerfixed"],[/^this browser cannot open data protected by logins/,"e_browser"]];function h(e){for(var n=String(e&&e.message||e||"").replace(/^NSAUTH: /,""),c=0;c<g.length;c++){var r=g[c][0].exec(n);if(r)return t(g[c][1],{n:r[1]||""})}return n.replace(/^./,function(s){return s.toUpperCase()})}function p(e){if(o){var n=o.querySelector("[data-lmsg]");n&&e&&(n.textContent=e);return}var c=i&&i.users||[];o=document.createElement("dialog"),o.className="b2-dlg ns-login",o.setAttribute("aria-labelledby","nsl-h"),o.innerHTML='<form method="dialog" data-lf><h2 id="nsl-h">'+a(t("title"))+'</h2><p class="soft" data-lmsg>'+a(e||t("intro"))+"</p><label>"+a(t("user"))+' <select name="u" required>'+c.map(function(u){return"<option>"+a(u.name)+"</option>"}).join("")+"</select></label><label>"+a(t("pw"))+' <input name="p" type="password" autocomplete="current-password" required minlength="1"></label><div class="row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" type="submit">'+a(t("go"))+'</button><button class="btn" type="button" data-lrec>'+a(t("forgot"))+'</button></div><div data-lrecbox hidden style="margin-top:12px"><p class="soft">'+a(t("rcp"))+"</p><label>"+a(t("rc"))+' <input name="rc" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" dir="ltr"></label><label>'+a(t("newpw"))+' <input name="np" type="password" autocomplete="new-password" minlength="6"></label><button class="btn" type="button" data-lrecgo>'+a(t("userc"))+"</button></div></form>",document.body.appendChild(o),o.addEventListener("cancel",function(u){u.preventDefault()});var r=o.querySelector("[data-lf]"),s=function(u){o.querySelector("[data-lmsg]").textContent=u};r.addEventListener("submit",function(u){u.preventDefault(),s(t("checking")),NSStore.auth("login",{name:r.u.value,pw:r.p.value}).then(function(){location.reload()},function(v){r.p.value="",r.p.focus(),s(h(v)||t("e_wrong"))})}),o.querySelector("[data-lrec]").addEventListener("click",function(){o.querySelector("[data-lrecbox]").hidden=!1}),o.querySelector("[data-lrecgo]").addEventListener("click",function(){s(t("checkrc")),NSStore.auth("recover",{name:r.u.value,code:r.rc.value,pw:r.np.value}).then(function(){location.reload()},function(u){s(h(u))})}),o.showModal(),setTimeout(function(){r.p.focus()},50)}function w(){clearTimeout(S),l&&(S=setTimeout(b,d*6e4))}function b(){NSStore.auth("logout").then(function(){return l=null,f()}).then(function(){p(t("locked",{n:d}))})}["keydown","pointerdown","wheel"].forEach(function(e){document.addEventListener(e,w,{passive:!0,capture:!0})}),document.addEventListener("ns-login",function(e){var n=String(e.detail||"");f().then(function(){/this browser/.test(n)?p(h(n)):i.on&&!l&&p()})}),NS.login={me:function(){return l},status:f,word:h,can:function(e,n){return!i||!i.on?!0:!!(l&&l.rights&&l.rights[e]&&l.rights[e][n])},logout:function(){return NSStore.auth("logout").then(function(){location.reload()})},switchUser:function(){return NSStore.auth("logout").then(function(){return l=null,f()}).then(function(){p(t("choose"))})},setIdle:function(e){d=Math.max(1,+e||15);try{localStorage.setItem("nsbiz-idle",String(d))}catch{}w()}};var m=function(){f().then(function(e){e.on&&!e.me&&p(),e.on&&e.me&&(w(),document.documentElement.classList.add("ns-logged"))})};NSStore.ready?NSStore.ready().then(m,m):m()})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* safe.js */
try{(function(C){"use strict";var I=/^(gd|lastBackup$|pin|lock|logHead$)/i,J={log:1,ver:1};function w(t){return t&&t.updated||0}function A(t,n,e){var r={},i={local:{put:{},del:{}},remote:{},seen:{},clashes:[],changed:0};return[t,n].forEach(function(s){Object.keys(s||{}).forEach(function(d){r[d]=1})}),Object.keys(r).forEach(function(s){var d={},u={},f={},g=(e||{})[s]||{},k=[],N={};((t||{})[s]||[]).forEach(function(p){p&&p.id&&!(s==="meta"&&I.test(p.id))&&(d[p.id]=p,f[p.id]=1)}),((n||{})[s]||[]).forEach(function(p){p&&p.id&&!(s==="meta"&&I.test(p.id))&&(u[p.id]=p,f[p.id]=1)}),i.local.put[s]=[],i.local.del[s]=[],Object.keys(f).forEach(function(p){var h=d[p],b=u[p],y=g[p],v=null;if(h&&b)if(w(h)===w(b))v=h;else if(y!=null&&w(h)===y)v=b,i.local.put[s].push(b);else if(y!=null&&w(b)===y)v=h;else{v=w(h)>=w(b)?h:b;var X=v===h?b:h;JSON.stringify(O(h))!==JSON.stringify(O(b))&&i.clashes.push({store:s,id:p,rec:X,from:v===h?"drive":"here",at:Date.now()}),v===b&&i.local.put[s].push(b)}else if(h){if(y!=null&&w(h)<=y&&!J[s]){i.local.del[s].push(p);return}v=h}else{if(y!=null&&w(b)<=y)return;v=b,i.local.put[s].push(b)}k.push(v),N[p]=w(v)}),i.remote[s]=k,i.seen[s]=N,i.changed+=i.local.put[s].length+i.local.del[s].length}),i}function O(t){var n={};return Object.keys(t||{}).sort().forEach(function(e){e!=="updated"&&(n[e]=t[e])}),n}if(C.NSSyncMerge=A,typeof module<"u"&&module.exports){module.exports={merge:A};return}var a=C.NS=C.NS||{},j=C.NS_CFG||{};function o(t,n){return a.t?a.t(t,n):t}function c(t){return a.esc(t)}function T(t){for(var n="",e=new Uint8Array(t),r=0;r<e.length;r+=32768)n+=String.fromCharCode.apply(null,e.subarray(r,r+32768));return btoa(n)}function L(t){for(var n=atob(t),e=new Uint8Array(n.length),r=0;r<n.length;r++)e[r]=n.charCodeAt(r);return e}var P=6e5;function x(t,n,e){return crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]).then(function(r){return crypto.subtle.deriveKey({name:"PBKDF2",salt:n,iterations:e,hash:"SHA-256"},r,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])})}a.lockData=function(t,n){var e=crypto.getRandomValues(new Uint8Array(16)),r=crypto.getRandomValues(new Uint8Array(12));return x(n,e,P).then(function(i){return crypto.subtle.encrypt({name:"AES-GCM",iv:r},i,new TextEncoder().encode(JSON.stringify(t)))}).then(function(i){return{app:"Nivesh Sahayak",kind:"backup",version:2,saved:new Date().toISOString(),locked:{alg:"AES-GCM-256",kdf:"PBKDF2-SHA-256",iter:P,salt:T(e),iv:T(r)},box:T(i)}})},a.unlockData=function(t,n){var e=t.locked||{};return x(n,L(e.salt),+e.iter||P).then(function(r){return crypto.subtle.decrypt({name:"AES-GCM",iv:L(e.iv)},r,L(t.box))}).then(function(r){return JSON.parse(new TextDecoder().decode(r))},function(){throw new Error("pw")})},a.askPassword=function(t,n){return new Promise(function(e){var r=document.createElement("dialog");r.className="pw-dlg",r.setAttribute("aria-labelledby","pw-h"),r.innerHTML='<form method="dialog" class="pw-f"><h2 id="pw-h">'+c(o(t==="set"?"b3.pw.set":"b3.pw.open"))+"</h2>"+(n?'<p class="note bad" role="alert">'+c(n)+"</p>":"")+'<p class="soft">'+c(o(t==="set"?"b3.pw.why":"b3.pw.ask"))+'</p><label for="pw-1">'+c(o("b3.pw.pw"))+'</label><input id="pw-1" type="password" autocomplete="'+(t==="set"?"new-password":"current-password")+'" minlength="'+(t==="set"?8:1)+'" required dir="ltr">'+(t==="set"?'<label for="pw-2">'+c(o("b3.pw.again"))+'</label><input id="pw-2" type="password" autocomplete="new-password" required dir="ltr">':"")+'<label class="chk"><input type="checkbox" data-pw-show> '+c(o("b3.pw.show"))+"</label>"+(t==="set"?'<p class="note">'+c(o("b3.pw.warn"))+"</p>":"")+'<p class="note bad" data-pw-err hidden></p><div class="btns"><button class="btn primary" value="ok">'+c(o(t==="set"?"b3.pw.lock":"b3.pw.unlock"))+'</button><button class="btn" value="no" formnovalidate>'+c(o("b3.cancel"))+"</button></div></form>",document.body.appendChild(r);var i=r.querySelector("#pw-1"),s=r.querySelector("#pw-2"),d=r.querySelector("[data-pw-err]");r.querySelector("[data-pw-show]").addEventListener("change",function(u){[i,s].forEach(function(f){f&&(f.type=u.target.checked?"text":"password")})}),r.querySelector("form").addEventListener("submit",function(u){if(!(u.submitter&&u.submitter.value==="no")){if(t==="set"&&i.value.length<8){u.preventDefault(),d.textContent=o("b3.pw.short"),d.hidden=!1;return}if(t==="set"&&i.value!==s.value){u.preventDefault(),d.textContent=o("b3.pw.diff"),d.hidden=!1;return}}}),r.addEventListener("close",function(){var u=r.returnValue==="ok"?i.value:null;r.remove(),e(u)}),r.showModal?r.showModal():r.setAttribute("open",""),i.focus()})};function R(t,n){var e=a.el("a",{href:URL.createObjectURL(t),download:n});document.body.appendChild(e),e.click(),e.remove(),setTimeout(function(){URL.revokeObjectURL(e.href)},4e3)}a.saveFile=R,a.downloadLockedBackup=function(){return a.askPassword("set").then(function(t){return t?(a.toast(o("b3.pw.making")),a.backupData().then(function(n){return a.lockData(n,t)}).then(function(n){return R(new Blob([JSON.stringify(n)],{type:"application/json"}),"nivesh-sahayak-backup-locked-"+a.today()+".json"),NSStore.meta("lastBackup",Date.now())}).then(function(){var n=a.$("#ns-remind");return n&&(n.hidden=!0),a.toast(o("b3.pw.saved")),!0})):!1})};var _=a.restoreFromFile;a.restoreFromFile=function(t){return t.text().then(function(n){var e;try{e=JSON.parse(n)}catch{e=null}if(!e||e.app!=="Nivesh Sahayak"||!e.box||!e.locked)return _(t);function r(i,s){return a.askPassword("open",s).then(function(d){if(d==null){var u=new Error(o("b3.pw.stopped"));throw u.quiet=!0,u}return a.unlockData(e,d).catch(function(){if(i>=3)throw new Error(o("b3.pw.wrong3"));return r(i+1,o("b3.pw.wrong"))})})}return r(1).then(function(i){if(!i||i.app!=="Nivesh Sahayak"||!i.data)throw new Error(o("bk.notours"));return NSStore.importAll(i.data,!1,{file:e&&e.name||""})}).then(function(i){return a.toast(i?o("bk.restored",{n:i}):o("bk.nothing")),i},function(i){throw a.toast(i.message||o("bk.unread"),i.quiet?"":"bad"),i})})};var M="nivesh-sahayak-sync.json",F="https://www.googleapis.com/auth/drive.file",z="https://www.googleapis.com",G=/^(my|app)\.niveshsahayak\.in$|^(localhost|127\.0\.0\.1)$/,m=null,B=0,q=null,S=null,D=null,l=a.gdrive={enabled:function(){return!!j.gdriveClient},here:function(){return l.enabled()&&G.test(location.hostname)},state:function(){return NSStore.meta("gdSync").then(function(t){return t||{}})},signedIn:function(){return!!m&&Date.now()<B}};function K(){return window.google&&google.accounts&&google.accounts.oauth2?Promise.resolve():a.loadJs("https://accounts.google.com/gsi/client")}l.signIn=function(){return K().then(function(){return new Promise(function(t,n){q=google.accounts.oauth2.initTokenClient({client_id:j.gdriveClient,scope:F,callback:function(e){e&&e.access_token&&google.accounts.oauth2.hasGrantedAllScopes(e,F)?(m=e.access_token,B=Date.now()+((+e.expires_in||3600)-120)*1e3,t(!0)):n(new Error(o("b3.gd.denied")))},error_callback:function(e){n(new Error(e&&e.type==="popup_closed"?o("b3.gd.closed"):o("b3.gd.nosign")))}}),q.requestAccessToken({prompt:""})})},function(){throw new Error(o("b3.gd.noload"))})};function E(t,n){return n=n||{},n.headers=Object.assign({Authorization:"Bearer "+m},n.headers||{}),fetch(z+t,n).then(function(e){if(e.status===401)throw m=null,new Error(o("b3.gd.again"));return e.ok?e:e.text().then(function(r){var i=new Error(o("b3.gd.fail",{code:e.status}));throw i.code=e.status,i.body=r,i})})}function V(t){var n=t.fileId?E("/drive/v3/files/"+t.fileId+"?fields=id,trashed").then(function(e){return e.json()}).then(function(e){return e.trashed?null:e.id},function(e){if(e.code===404)return null;throw e}):Promise.resolve(null);return n.then(function(e){if(e)return e;var r=encodeURIComponent("name='"+M+"' and trashed=false");return E("/drive/v3/files?q="+r+"&spaces=drive&orderBy=createdTime&pageSize=5&fields=files(id)").then(function(i){return i.json()}).then(function(i){return i.files&&i.files[0]?i.files[0].id:null})})}function Y(t,n){if(t)return E("/upload/drive/v3/files/"+t+"?uploadType=media&fields=id",{method:"PATCH",headers:{"Content-Type":"application/json"},body:n}).then(function(){return t});var e="ns"+Math.random().toString(36).slice(2),r={name:M,mimeType:"application/json",description:"Nivesh Sahayak data, kept in step by my.niveshsahayak.in. Please do not edit or rename."},i="--"+e+`\r
Content-Type: application/json; charset=UTF-8\r
\r
`+JSON.stringify(r)+`\r
--`+e+`\r
Content-Type: application/json\r
\r
`+n+`\r
--`+e+"--";return E("/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",headers:{"Content-Type":"multipart/related; boundary="+e},body:i}).then(function(s){return s.json()}).then(function(s){return s.id})}l.sync=function(){return S||(l.signedIn()?(S=Promise.all([l.state(),NSStore.exportAll()]).then(function(t){var n=t[0],e=t[1];return V(n).then(function(r){var i=r?E("/drive/v3/files/"+r+"?alt=media").then(function(s){return s.json()}):Promise.resolve(null);return i.then(function(s){if(s&&(s.app!=="Nivesh Sahayak"||s.kind!=="sync"))throw new Error(o("b3.gd.badfile"));var d=A(e,s?s.data:{},r&&r===n.fileId?n.seen:{});return Q(d).then(function(){var u=JSON.stringify({app:"Nivesh Sahayak",kind:"sync",version:1,saved:new Date().toISOString(),data:d.remote});return Y(r,u)}).then(function(u){return NSStore.meta("gdClash").then(function(f){var g=(d.clashes||[]).concat(f||[]).slice(0,50);return NSStore.meta("gdClash",g)}).then(function(){return NSStore.meta("gdSync",{on:!0,fileId:u,last:Date.now(),seen:d.seen})}).then(function(){return d})})})})}).then(function(t){return S=null,t.changed&&a.onRestore&&a.onRestore(),t},function(t){throw S=null,t}),S):Promise.reject(new Error(o("b3.gd.again"))))};function Q(t){var n=[];return Object.keys(t.local.del).forEach(function(e){t.local.del[e].forEach(function(r){n.push(function(){return NSStore.del(e,r)})})}),Object.keys(t.local.put).forEach(function(e){t.local.put[e].length&&(n.push(function(){return Promise.all(t.local.put[e].map(function(r){return NSStore.del(e,r.id)}))}),n.push(function(){var r={};return r[e]=t.local.put[e],NSStore.importAll(r,!1)}))}),n.reduce(function(e,r){return e.then(r)},Promise.resolve())}l.connect=function(){return l.signIn().then(l.sync).then(function(t){return H(),a.toast(o("b3.gd.done",{n:t.changed})),t})},l.syncNow=function(){return(l.signedIn()?Promise.resolve():l.signIn()).then(l.sync).then(function(t){return H(),a.toast(o("b3.gd.done",{n:t.changed})),t})},l.disconnect=function(){if(m&&window.google&&google.accounts)try{google.accounts.oauth2.revoke(m,function(){})}catch{}return m=null,clearInterval(D),l.state().then(function(t){return t.on=!1,NSStore.meta("gdSync",t)})};function H(){clearInterval(D),D=setInterval(function(){l.signedIn()&&l.sync().catch(function(){})},5*6e4)}document.addEventListener("visibilitychange",function(){document.visibilityState==="hidden"&&l.signedIn()&&l.sync().catch(function(){})});function U(t){return t?new Date(t).toLocaleString("en-IN"):o("md.never")}a.gdriveCard=function(t){if(l.enabled()){var n=a.el("div",{class:"card gd-card","data-gd":""});if(t.appendChild(n),!l.here()){n.innerHTML="<h3>"+c(o("b3.gd.t"))+'</h3><p class="note">'+o("b3.gd.there",{link:'<a href="https://my.niveshsahayak.in/#backup" target="_blank" rel="noopener">my.niveshsahayak.in</a>'})+"</p>";return}Promise.all([l.state(),NSStore.meta("gdClash")]).then(function(e){var r=e[0],i=e[1]||[];n.innerHTML="<h3>"+c(o("b3.gd.t"))+'</h3><p class="note">'+c(o("b3.gd.p"))+"</p>"+(r.on?"<p>"+c(o("b3.gd.last"))+" <b>"+c(U(r.last))+'</b></p><div class="btns"><button type="button" class="btn primary" data-gd-act="sync">'+c(o("b3.gd.now"))+'</button><button type="button" class="btn" data-gd-act="off">'+c(o("b3.gd.off"))+"</button></div>":'<div class="btns"><button type="button" class="btn primary" data-gd-act="on">'+c(o("b3.gd.on"))+"</button></div>")+'<p class="soft" data-gd-msg aria-live="polite"></p>'+(i.length?'<details class="gd-cl"><summary>'+c(o("b3.gd.clash",{n:i.length}))+'</summary><p class="soft">'+c(o("b3.gd.clashp"))+"</p><ul>"+i.map(function(u,f){var g=u.rec||{},k=g.no||g.name||g.desc||g.id;return"<li><span>"+c(o("b3.gd.st."+u.store)||u.store)+": <b>"+c(k)+"</b> <small>"+c(U(g.updated))+'</small></span><button type="button" class="btn sm" data-gd-use="'+f+'">'+c(o("b3.gd.use"))+'</button><button type="button" class="btn sm" data-gd-drop="'+f+'">'+c(o("b3.gd.drop"))+"</button></li>"}).join("")+"</ul></details>":"");var s=a.$("[data-gd-msg]",n);function d(u){return s.textContent=o("b3.gd.busy"),u.then(function(){a.gdriveRefresh(n)},function(f){s.textContent=f.message||String(f)})}n.addEventListener("click",function(u){var f=u.target.closest("[data-gd-act],[data-gd-use],[data-gd-drop]");if(f){var g=f.getAttribute("data-gd-act");if(g==="on")d(l.connect());else if(g==="sync")d(l.syncNow());else if(g==="off"&&a.okSync(o("b3.gd.offc")))d(l.disconnect());else if(f.hasAttribute("data-gd-use")||f.hasAttribute("data-gd-drop")){var k=+(f.getAttribute("data-gd-use")||f.getAttribute("data-gd-drop")),N=i[k],p=f.hasAttribute("data-gd-use")?NSStore.put(N.store,Object.assign({},N.rec)):Promise.resolve();d(p.then(function(){return i.splice(k,1),NSStore.meta("gdClash",i)}).then(function(){f.hasAttribute("data-gd-use")&&a.onRestore&&a.onRestore()}))}}})})}},a.gdriveRefresh=function(t){var n=t.parentNode;t.remove(),a.gdriveCard(n)},a.loadLazy=function(t){var n=j.lazy||{};return t.reduce(function(e,r){return e.then(function(){if(!n[r])throw new Error("missing "+r);return a.loadJs(n[r])})},Promise.resolve())},a.openAccountant=function(){var t=[];return window.NSBooks||t.push("books.js"),a.xlsx||t.push("xlsx.js"),a.tally||t.push("tally.js"),a.acct||t.push("acct.js"),a.loadLazy(t).then(function(){a.acct.open()},function(){a.toast(o("b3.ac.noload"),"bad")})},a.openCAShareLazy=function(){var t=[];return window.NSBooks||t.push("books.js"),window.NSCAshare||t.push("cashare.js"),window.NSCAUI||t.push("caui.js"),a.loadLazy(t).then(function(){a.openCAShare()},function(){a.toast(o("b3.ac.noload"),"bad")})};function $(t,n){var e=a.el("div",{class:"b3-extra"});e.innerHTML="<h3>"+c(o("b3.pw.t"))+'</h3><p class="note">'+c(o("b3.pw.p"))+'</p><div class="btns"><button type="button" class="btn" data-act="backup-lock">'+c(o("b3.pw.b"))+"</button></div><h3>"+c(o("b3.ac.t"))+'</h3><p class="note">'+c(o("b3.ac.p"))+'</p><div class="btns"><button type="button" class="btn" data-act="acct">'+c(o("b3.ac.b"))+'</button> <button type="button" class="btn" data-act="cashare">'+c(o("ca.mk"))+"</button></div>",n&&(e.className+=" card"),t.appendChild(e),a.gdriveCard(t)}function W(t){var n=a.$('[data-md-pane="bk"]',t),e=a.$('[data-md-pane="ac"]',t);if(!n||!e||!a.mdRow){$(t,!1);return}n.insertAdjacentHTML("beforeend",a.mdRow(o("b3.pw.t"),"",o("b3.pw.p"),'<button type="button" class="btn sm" data-act="backup-lock">'+c(o("b3.pw.b"))+"</button>")),e.insertAdjacentHTML("beforeend",a.mdRow(o("b3.ac.t"),"",o("b3.ac.p"),'<button type="button" class="btn sm primary" data-act="acct">'+c(o("b3.ac.b"))+'</button> <button type="button" class="btn sm" data-act="cashare">'+c(o("ca.mk"))+"</button>")),a.gdriveCard(a.$('[data-md-pane="af"]',t)||n)}a.mdExt=(a.mdExt||[]).concat([W]),a.hubBackupExt=(a.hubBackupExt||[]).concat([function(t){var n=a.$("[data-backup-ext]",t)||t;$(n,!0)}]),document.addEventListener("click",function(t){var n=t.target.closest&&t.target.closest("[data-act]");if(n){var e=n.getAttribute("data-act");e==="backup-lock"?a.downloadLockedBackup().then(function(r){r&&a.$("#ns-mydata[open]")&&a.openMyData()}).catch(function(){a.toast(o("b3.pw.fail"),"bad")}):e==="acct"?a.openAccountant():e==="cashare"&&a.openCAShareLazy()}})})(typeof window<"u"?window:globalThis);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* help.js */
try{(function(){"use strict";var a=window.NS;if(!a)return;var o={"lg.biz":"hp.biz","lg.details":"hp.details","lg.billto":"hp.billto","lg.qto":"hp.billto","lg.custto":"hp.billto","lg.issuedto":"hp.billto","lg.vendor":"hp.vendor","lg.supplier":"hp.supplier","lg.consignee":"hp.consignee","lg.items":"hp.items","lg.notes":"hp.notes","lg.einv":"hp.einv","lg.exp":"hp.exp","s.lg.from":"hp.s.from","s.lg.pay":"hp.s.pay","s.lg.to":"hp.s.to","s.lg.lines":"hp.s.lines","s.lg.tdsrcm":"hp.s.tdsrcm","s.lg.sign":"hp.s.sign","s.lg.tenant":"hp.s.tenant","s.lg.landlord":"hp.s.landlord","s.lg.rent":"hp.s.rent","s.lg.emp":"hp.s.emp","s.lg.employer":"hp.s.employer","s.lg.att":"hp.s.att","s.lg.earn":"hp.s.earn","s.lg.ded":"hp.s.ded","s.lg.entries":"hp.s.entries","app.home":"hp.a.home","app.sales":"hp.a.sales","app.buy":"hp.a.buy","app.money":"hp.a.money","app.dues":"hp.a.dues","app.parties":"hp.a.parties","app.cash":"hp.a.cash","app.khata":"hp.a.khata","app.preg":"hp.a.preg","app.ebook":"hp.a.ebook","app.chq":"hp.a.chq","app.books":"hp.a.books","my.t.biz":"hp.m.biz","my.t.party":"hp.m.party","my.t.item":"hp.m.item","my.t.doc":"hp.m.doc","my.t.settings":"hp.m.settings","hub.backup":"hp.m.backup","b3.pw.t":"hp.lock","b3.ac.t":"hp.acct","b3.gd.t":"hp.gdrive"},b="main legend, main h2, main h3, dialog h2, dialog h3",p=null,f=0;function v(t){return t.replace(/[.*+?^$()|[\]\\]/g,"\\$&").replace(/\\?\{\w+\\?\}|\{\w+\}/g,".+")}function y(){p=Object.keys(o).map(function(t){var e=a.t(t);return e&&e!==t?[new RegExp("^"+v(e)+"$","i"),o[t]]:null}).filter(Boolean)}function x(t){var e=t.firstChild,n=e&&e.nodeType===3&&e.textContent.trim()?e.textContent:t.textContent;return n.replace(/\s+/g," ").trim()}function h(){p||y(),a.$$(b).forEach(function(t){if(!(t.hasAttribute("data-hp")||t.closest(".hp-tip,.prose,.ft,.hd,.sheet,.paper"))){for(var e=x(t),n=null,r=0;r<p.length&&!n;r++)p[r][0].test(e)&&(n=p[r][1]);if(t.setAttribute("data-hp",n||""),!!n){var g="hp-"+ ++f,i=a.el("button",{type:"button",class:"hp-q","aria-expanded":"false","aria-controls":g,"aria-label":a.t("hp.btn",{what:e}),title:a.t("hp.btn",{what:e})},"?"),s=a.el("p",{id:g,class:"hp-tip",hidden:""});s.textContent=a.t(n),t.appendChild(i),t.tagName,t.parentNode.insertBefore(s,t.nextSibling),i.addEventListener("click",function(c){c.preventDefault(),c.stopPropagation();var m=s.hidden;s.hidden=!m,i.setAttribute("aria-expanded",m?"true":"false")})}}})}var l;function d(){clearTimeout(l),l=setTimeout(h,120)}function u(){h(),new MutationObserver(function(t){for(var e=0;e<t.length;e++)if(t[e].addedNodes.length){d();return}}).observe(document.body,{childList:!0,subtree:!0}),document.addEventListener("ns-lang",function(){p=null,a.$$("[data-hp]").forEach(function(t){t.removeAttribute("data-hp");var e=a.$(".hp-q",t);if(e){var n=document.getElementById(e.getAttribute("aria-controls"));n&&n.remove(),e.remove()}}),d()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u):u()})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* sfcore.js */
try{/* NSSF: the merge rules of the SHARED FOLDER mode (pure functions, no browser needed: node scripts/test_sharedfolder.js).
   Several computers keep one folder (a Windows shared folder, or a OneDrive / Google Drive folder). Nothing here talks to the folder:
   sharedfolder.js reads and writes the files, this file decides what the records are.

   Every computer writes ONLY its own files:  entries/<device>/<yyyy-mm>.ndjson   (one operation per line, only ever added to).
   An operation (op):
     i  id "<device>-<n>"           d  device            n  number on that device (1, 2, 3 ...)
     h  clock (hybrid: never behind anything this device has seen, even when its own clock is wrong)
     s  store (biz party item doc meta log)   r  record id
     o  'p' = the record as saved (rec holds the whole record)   'x' = the record was deleted   'k' = a conflict was looked at (key)
     par  ids of the ops this edit was made on top of (what this computer had when the person pressed Save)
     ch  names of the fields that changed   cf  conflicts that were still open when this edit was made (so they are never lost)
     who  who was signed in   t  wall clock time (for the month file and for people to read)
   A record is the result of all its ops:
     - one newest op (nothing concurrent)                      -> that op
     - several ops made without knowing of each other (heads)  -> field by field against their common ancestor: a field changed by
       one side only is taken; changed by both with different values -> the later clock wins AND it is listed as a conflict
     - delete against an edit made without knowing of each other -> the record stays (the edit survives) and it is listed
   Nothing is ever dropped silently: every op stays in the files, and every lost value stays listed until someone looks at it. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.NSSF = factory();
})(this, function () {
  'use strict';
  var SYNC = { biz: 1, party: 1, item: 1, doc: 1, meta: 1, log: 1 };
  /* only these meta records are shared; the rest (lastBackup, pin, who, language ...) belongs to one computer */
  var META_OK = { settings: 1, groups: 1, heads: 1, staff: 1, sfcfg: 1 };
  var MAX_CF = 20;

  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }
  function hash(v) {   /* FNV-1a twice with different seeds: 52 bits, enough to tell two versions of one record apart */
    var s = stable(v), a = 0x811c9dc5, b = 0x01000193 ^ 0x9e3779b9, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      a ^= c; a = Math.imul(a, 16777619) >>> 0;
      b ^= c + i; b = Math.imul(b, 2246822519) >>> 0;
    }
    return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  }
  function eq(a, b) { return stable(a) === stable(b); }
  function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }
  function keyOf(store, rid) { return store + '/' + rid; }
  function cmpOp(a, b) { return a.h - b.h || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || a.n - b.n; }
  function syncable(store, rec) {
    if (!SYNC[store] || !rec || typeof rec !== 'object' || rec.id == null || rec.sample) return false;
    return store !== 'meta' || !!META_OK[rec.id];
  }

  /* ---------- the clock ---------- */
  function Clock(h) { this.h = h || 0; }
  Clock.prototype.tick = function (now) { this.h = Math.max(now == null ? Date.now() : now, this.h + 1); return this.h; };
  /* an op from another computer: this clock never falls behind it (so an edit made after seeing it always sorts after it, even when this
     computer's own clock is wrong). A computer whose clock is far off is shown as a warning, see skew(). */
  Clock.prototype.see = function (h) { if (h > this.h) this.h = h; };

  /* ---------- the files: one JSON op per line ---------- */
  function validOp(o) {
    if (!o || typeof o !== 'object' || typeof o.i !== 'string' || typeof o.d !== 'string' || !(o.n >= 0) || !(o.h >= 0)) return false;
    if (o.o === 'k') return typeof o.key === 'string';
    if (!SYNC[o.s] || o.r == null) return false;
    if (o.o === 'x') return true;
    return o.o === 'p' && o.rec && typeof o.rec === 'object' && String(o.rec.id) === String(o.r) && (o.s !== 'meta' || !!META_OK[o.r]);
  }
  /* text from byte position `pos` on (file only grows). Returns the good ops, how many lines were not understood, and the new position:
     a last line without its end-of-line (the other computer is still writing, or the copy was cut) is left for next time */
  function parseNdjson(text, pos) {
    var ops = [], bad = 0, p = pos || 0, nl;
    while (p < text.length) {
      nl = text.indexOf('\n', p);
      if (nl < 0) {   /* no end of line: whole if it reads as JSON, otherwise wait */
        var tail = text.slice(p);
        try { var t = JSON.parse(tail); if (validOp(t)) { ops.push(t); p = text.length; } else { bad++; p = text.length; } } catch (e) {}
        break;
      }
      var line = text.slice(p, nl).trim(); p = nl + 1;
      if (!line) continue;
      try { var o = JSON.parse(line); if (validOp(o)) ops.push(o); else bad++; } catch (e) { bad++; }
    }
    return { ops: ops, bad: bad, pos: p };
  }
  function line(op) { return JSON.stringify(op) + '\n'; }
  function monthOf(t) { return new Date(t).toISOString().slice(0, 7); }
  function fileFor(op) { return 'entries/' + op.d + '/' + monthOf(op.t || op.h) + '.ndjson'; }

  /* ---------- the log: every op of every computer ---------- */
  function Log() { this.ops = {}; this.byRec = {}; this.acks = {}; this.bad = 0; this.devs = {}; }
  Log.prototype.add = function (op) {
    if (!validOp(op)) { this.bad++; return false; }
    if (this.ops[op.i]) return false;   /* the same op twice (a OneDrive copy of a file, a re-read): ignored */
    this.ops[op.i] = op;
    var d = this.devs[op.d] || (this.devs[op.d] = { n: 0, h: 0, t: 0 });
    if (op.n > d.n) d.n = op.n; if (op.h > d.h) d.h = op.h; if ((op.t || 0) > d.t) d.t = op.t;
    if (op.o === 'k') { this.acks[op.key] = op; return true; }
    var k = keyOf(op.s, op.r);
    (this.byRec[k] || (this.byRec[k] = [])).push(op);
    return true;
  };
  Log.prototype.addAll = function (ops) { var n = 0; for (var i = 0; i < ops.length; i++) if (this.add(ops[i])) n++; return n; };
  Log.prototype.heads = function (key) {
    var list = this.byRec[key]; if (!list) return [];
    var refs = {}; list.forEach(function (o) { (o.par || []).forEach(function (p) { refs[p] = 1; }); });
    return list.filter(function (o) { return !refs[o.i]; }).sort(cmpOp);
  };
  /* ids of the ops an op was made on, all the way back (only those that are here) */
  Log.prototype.ancestors = function (op) {
    var seen = {}, st = [op], me = this;
    while (st.length) { var o = st.pop(); if (!o || seen[o.i]) continue; seen[o.i] = 1; (o.par || []).forEach(function (p) { if (me.ops[p]) st.push(me.ops[p]); }); }
    return seen;
  };
  /* the newest saved version that both sides were made from (null when it is not here: the older file is missing, or was tidied away) */
  Log.prototype.base = function (op, others) {
    var mine = this.ancestors(op), common = {}, me = this, best = null;
    others.forEach(function (o) { var a = me.ancestors(o); Object.keys(a).forEach(function (id) { if (mine[id]) common[id] = 1; }); });
    Object.keys(common).forEach(function (id) { var c = me.ops[id]; if (c.o === 'p' && (!best || cmpOp(c, best) > 0)) best = c; });
    return best;
  };
  function cfKey(store, rid, field, a, b) { var x = hash(a), y = hash(b); return store + '/' + rid + '/' + field + '/' + (x < y ? x + '|' + y : y + '|' + x); }
  /* b (the later one) over a, against base. Returns the record and the fields where both sides had changed it differently */
  function merge2(a, b, base, opA, opB) {
    var out = {}, conf = [], keys = {}, k;
    Object.keys(a).forEach(function (x) { keys[x] = 1; }); Object.keys(b).forEach(function (x) { keys[x] = 1; });
    Object.keys(keys).forEach(function (f) {
      var va = a[f], vb = b[f], vo = base ? base[f] : undefined, pick;
      if (f === 'updated') pick = Math.max(va || 0, vb || 0);
      else if (f === 'created') pick = Math.min(va || Infinity, vb || Infinity);
      else if (eq(va, vb)) pick = va;
      else if (base && eq(va, vo)) pick = vb;
      else if (base && eq(vb, vo)) pick = va;
      else {
        pick = vb;
        conf.push({ kind: 'field', store: opB.s, rid: opB.r, field: f, a: clone(va), b: clone(vb), aWho: opA.who || '', bWho: opB.who || '', aT: opA.t, bT: opB.t, key: cfKey(opB.s, opB.r, f, va, vb), baseKnown: !!base });
      }
      if (pick !== undefined && pick !== Infinity) out[f] = clone(pick);
    });
    return { rec: out, conflicts: conf };
  }
  /* what the record is now: { dead } | { rec }, with the ids of the heads (the next edit is made on top of all of them) and the open conflicts */
  Log.prototype.resolve = function (key) {
    var heads = this.heads(key); if (!heads.length) return null;
    var ids = heads.map(function (o) { return o.i; });
    if (heads.length === 1) return heads[0].o === 'x' ? { dead: true, heads: ids, conflicts: [] } : { rec: clone(heads[0].rec), heads: ids, conflicts: [] };
    var puts = heads.filter(function (o) { return o.o === 'p'; }), dels = heads.filter(function (o) { return o.o === 'x'; });
    if (!puts.length) return { dead: true, heads: ids, conflicts: [] };
    var rec = clone(puts[0].rec), conflicts = [], acc = puts[0], me = this, prev = [puts[0]];
    for (var i = 1; i < puts.length; i++) {
      var b = puts[i], base = me.base(b, prev), m = merge2(rec, b.rec, base ? base.rec : null, acc, b);
      rec = m.rec; conflicts = conflicts.concat(m.conflicts); acc = b; prev.push(b);
    }
    dels.forEach(function (x) {
      conflicts.push({ kind: 'del', store: x.s, rid: x.r, field: '', who: x.who || '', t: x.t, key: x.s + '/' + x.r + '/del/' + x.i, editedBy: puts.map(function (p) { return p.who || ''; }).join(', ') });
    });
    return { rec: rec, heads: ids, conflicts: conflicts };
  };
  /* every conflict still to be looked at: those of records with several heads now, and those that were open when someone saved over them */
  Log.prototype.conflicts = function () {
    var out = [], seen = {}, me = this;
    function put(c) { if (seen[c.key] || me.acks[c.key]) return; seen[c.key] = 1; out.push(c); }
    Object.keys(this.byRec).forEach(function (k) {
      var list = me.byRec[k];
      if (list.length > 1) { var r = me.resolve(k); if (r && r.conflicts) r.conflicts.forEach(put); }
      list.forEach(function (o) { (o.cf || []).forEach(put); });
    });
    return out;
  };
  Log.prototype.keys = function () { return Object.keys(this.byRec); };

  /* ---------- one computer ---------- */
  /* state = { seen: { store: { rid: { hash, heads: [op ids] } } }, seq: last op number, h: last clock }. It belongs to this computer only (never to a backup). */
  function Replica(dev, who, state) {
    this.dev = dev; this.who = who || '';
    state = state || {};
    this.pending = []; this.seen = state.seen || {}; this.seq = state.seq || 0; this.clock = new Clock(state.h || 0);
    this.log = new Log();
  }
  Replica.prototype.state = function () { return { seen: this.seen, seq: this.seq, h: this.clock.h }; };
  Replica.prototype.setWho = function (w) { this.who = w || ''; };
  /* ops read from the folder (this computer's own included: after a restart they bring seq and clock back) */
  Replica.prototype.ingest = function (ops, now) {
    var n = 0, me = this;
    ops.forEach(function (o) {
      if (me.log.add(o)) { n++; me.clock.see(o.h); if (o.d === me.dev && o.n > me.seq) me.seq = o.n; }
    });
    return n;
  };
  Replica.prototype.mk = function (fields, now) {
    var n = ++this.seq, op = { i: this.dev + '-' + n, d: this.dev, n: n, h: this.clock.tick(now), who: this.who, t: now == null ? Date.now() : now };
    for (var k in fields) op[k] = fields[k];
    return op;
  };
  Replica.prototype.ack = function (key, now) { var op = this.mk({ o: 'k', key: key }, now); this.log.add(op); this.pending.push(op); return op; };
  /* Save pressed on a record: the op for it. Used by the cycle, and by the conflict screen. */
  Replica.prototype.putOp = function (store, rec, now) {
    var key = keyOf(store, rec.id), s = (this.seen[store] || {})[rec.id], par = s ? s.heads.slice() : [];
    var prev = s && s.heads.length ? this.log.resolve(key) : null, ch = [];
    var before = prev && prev.rec || {};
    Object.keys(Object.assign({}, before, rec)).forEach(function (f) { if (!eq(before[f], rec[f])) ch.push(f); });
    var f = { s: store, r: String(rec.id), o: 'p', rec: clone(rec), par: par, ch: ch.slice(0, 60) };
    if (prev && prev.heads.length > 1) { var cf = this.log.conflicts().filter(function (c) { return c.store === store && String(c.rid) === String(rec.id); }); if (cf.length) f.cf = cf.slice(0, MAX_CF); }
    var op = this.mk(f, now);
    this.log.add(op);
    (this.seen[store] || (this.seen[store] = {}))[rec.id] = { hash: hash(rec), heads: [op.i] };
    return op;
  };
  Replica.prototype.delOp = function (store, rid, now) {
    var s = (this.seen[store] || {})[rid];
    var op = this.mk({ s: store, r: String(rid), o: 'x', par: s ? s.heads.slice() : [] }, now);
    this.log.add(op);
    if (this.seen[store]) delete this.seen[store][rid];
    return op;
  };
  /* The whole round, given this computer's records now: local = { store: [records] }.
       1. what was saved or deleted here since last time becomes ops (to be appended to this computer's file)
       2. what the log says the records are (all computers) is compared with what is here: the actions to make here
     opts.confirmDeletes: allow a big delete batch.  Returns { ops, actions, held, conflicts }. */
  Replica.prototype.cycle = function (local, opts, now) {
    opts = opts || {}; var me = this, ops = this.pending.splice(0), actions = [], held = 0, localMap = {};
    Object.keys(SYNC).forEach(function (st) {
      localMap[st] = {}; (local[st] || []).forEach(function (r) { if (syncable(st, r)) localMap[st][r.id] = r; });
    });
    /* 1a. new or changed here */
    Object.keys(localMap).forEach(function (st) {
      Object.keys(localMap[st]).forEach(function (rid) {
        var r = localMap[st][rid], s = (me.seen[st] || {})[rid], h = hash(r);
        if (s && s.hash === h) return;
        if (!s) {   /* never seen here: if the log already says exactly this, adopt it; else it is new here (or an old copy: written as concurrent, so nothing is overwritten) */
          var res = me.log.resolve(keyOf(st, rid));
          if (res && !res.dead && hash(res.rec) === h) { (me.seen[st] || (me.seen[st] = {}))[rid] = { hash: h, heads: res.heads }; return; }
        }
        if (st === 'log' && s) return;   /* the audit log is only ever added to */
        ops.push(me.putOp(st, r, now));
      });
    });
    /* 1b. gone from here (the log store is never deleted from) */
    var gone = [], total = 0;
    Object.keys(this.seen).forEach(function (st) {
      if (st === 'log') return;
      Object.keys(me.seen[st]).forEach(function (rid) { total++; if (!localMap[st] || !localMap[st][rid]) gone.push([st, rid]); });
    });
    if (gone.length && gone.length > Math.max(5, total * 0.2) && !opts.confirmDeletes) held = gone.length;
    else gone.forEach(function (g) { ops.push(me.delOp(g[0], g[1], now)); });
    /* 2. what the log says */
    this.log.keys().forEach(function (k) {
      var i = k.indexOf('/'), st = k.slice(0, i), rid = k.slice(i + 1), res = me.log.resolve(k);
      if (!res) return;
      var cur = localMap[st] && localMap[st][rid], s = (me.seen[st] || (me.seen[st] = {}))[rid];
      var unchanged = cur && s && s.hash === hash(cur);
      if (res.dead) {
        if (cur && unchanged) { actions.push({ act: 'del', store: st, id: cur.id }); delete me.seen[st][rid]; }
        else if (!cur && s && !held) delete me.seen[st][rid];
        return;
      }
      var h = hash(res.rec);
      if (!cur) { if (s && held) return; actions.push({ act: 'put', store: st, rec: res.rec }); me.seen[st][rid] = { hash: h, heads: res.heads }; return; }
      if (hash(cur) === h) { me.seen[st][rid] = { hash: h, heads: res.heads }; return; }
      if (unchanged) { actions.push({ act: 'put', store: st, rec: res.rec }); me.seen[st][rid] = { hash: h, heads: res.heads }; }
      /* changed here after step 1 (typing right now): left for the next round */
    });
    return { ops: ops, actions: actions, held: held, conflicts: this.log.conflicts() };
  };
  /* an action could not be done (storage busy): forget that it was, so the next round tries again */
  Replica.prototype.undoSeen = function (store, rid) { if (this.seen[store]) delete this.seen[store][rid]; };

  /* ---------- documents numbered twice ---------- */
  function dupNumbers(docs) {
    var by = {}, out = [];
    (docs || []).forEach(function (d) {
      if (!d || !d.no || d.counter) return;
      var k = [d.type, String(d.seller && d.seller.name || '').trim().toLowerCase(), String(d.no).trim().toUpperCase()].join('|');
      (by[k] || (by[k] = [])).push(d);
    });
    Object.keys(by).forEach(function (k) { if (by[k].length > 1) out.push({ no: by[k][0].no, type: by[k][0].type, docs: by[k].map(function (d) { return { id: d.id, date: d.date, who: d.by || '' }; }) }); });
    return out;
  }
  /* the letter that makes this computer's invoice numbers its own: INV/26-27/A001. devices = [{id, tag, joined}] from the devices folder. */
  var LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   /* no I or O (look like 1 and 0) */
  function pickTag(devices, me) {
    var taken = {};
    devices.forEach(function (d) { if (d.id !== me && d.tag) taken[d.tag] = 1; });
    for (var i = 0; i < LETTERS.length; i++) if (!taken[LETTERS[i]]) return LETTERS[i];
    for (var j = 0; j < LETTERS.length; j++) for (var k = 0; k < LETTERS.length; k++) if (!taken[LETTERS[j] + LETTERS[k]]) return LETTERS[j] + LETTERS[k];
    return 'Z' + me.slice(-3).toUpperCase();
  }
  /* two computers took the same letter at the same moment: the one that joined later (then the larger id) takes another for FUTURE numbers */
  function mustRepick(devices, me) {
    var mine = devices.filter(function (d) { return d.id === me; })[0];
    if (!mine || !mine.tag) return true;
    return devices.some(function (d) {
      return d.id !== me && d.tag === mine.tag && ((d.joined || 0) < (mine.joined || 0) || ((d.joined || 0) === (mine.joined || 0) && d.id < me));
    });
  }
  /* how far a computer's clock is from the others: ops of the last hour whose wall time is far from the newest clock seen */
  function skew(log, dev, now) {
    var d = log.devs[dev]; return d && d.t ? d.t - now : 0;
  }
  /* the next number of a series, as the makers work it out: prefix = "INV/26-27/" + this computer's letter; only numbers that start with the
     whole prefix count, so every computer counts its own series */
  var AUTO_NO = /^[A-Z]+\/\d\d-\d\d\/[A-Z]{0,3}\d+$/;
  function nextNumber(nos, prefix, digits) {
    var max = 0;
    (nos || []).forEach(function (n) { n = String(n || ''); if (n.indexOf(prefix) !== 0) return; var m = n.match(/(\d+)\s*$/); if (m) max = Math.max(max, +m[1]); });
    return prefix + String(max + 1).padStart(digits || 3, '0');
  }
  /* ---------- one common series (the default): numbers are RESERVED live by writing a small file, numbers/<series>/<number>.<computer> ---------- */
  /* Why: with no server, two computers can pick the same next number at the same moment. Each one writes its claim, waits a moment, lists the
     claims again and keeps the number only if no other live computer with a smaller id claimed it too; the loser takes the next number.
     A reservation that is never used (form closed, computer gone) is given back: a computer whose heartbeat stopped holds nothing. */
  function seriesDir(scope, prefix) {
    var raw = String(scope || '') + '|' + prefix, h = 5381;
    for (var i = 0; i < raw.length; i++) h = ((h * 33) ^ raw.charCodeAt(i)) >>> 0;
    return String(prefix).replace(/[^A-Za-z0-9-]+/g, '_').slice(0, 30) + '.' + h.toString(36);
  }
  function claimName(n, dev) { return String(n).padStart(7, '0') + '.' + dev; }
  function parseClaim(name) { var m = /^(\d{7,})\.([A-Za-z0-9]+)$/.exec(String(name)); return m ? { n: +m[1], dev: m[2] } : null; }
  function tailNum(no) { var m = String(no || '').match(/(\d+)\s*$/); return m ? +m[1] : 0; }
  /* the number to try: a free hole left by a computer that is gone, else one after the highest number in use or reserved */
  function pickCandidate(claims, used, me, held, fresh, skip) {
    var live = {}, holes = [], max = 0;
    Object.keys(used).forEach(function (n) { max = Math.max(max, +n); });
    Object.keys(skip || {}).forEach(function (n) { max = Math.max(max, +n); });
    claims.forEach(function (c) {
      if (used[c.n]) return;
      if (c.dev === me ? held[c.n] : fresh(c.dev)) { live[c.n] = 1; max = Math.max(max, c.n); } else holes.push(c.n);
    });
    holes = holes.filter(function (n) { return !live[n] && !(skip || {})[n]; }).sort(function (a, b) { return a - b; });
    return holes.length ? holes[0] : max + 1;
  }
  /* io = { list(series) -> names[], put(series, name), del(series, name), wait(ms) }
     o  = { series, me, used: {number: 1}, held: {number: 1}, fresh(dev) -> bool, settle(ms) } */
  function claimNumber(io, o) {
    var skip = {}, tries = 0;
    function go() {
      if (++tries > 40) return Promise.reject(new Error('numbers busy'));
      return io.list(o.series).then(function (names) {
        var claims = names.map(parseClaim).filter(Boolean), n = pickCandidate(claims, o.used, o.me, o.held, o.fresh, skip), mine = claimName(n, o.me);
        return io.put(o.series, mine).then(function () { return io.wait(o.settle); }).then(function () { return io.list(o.series); }).then(function (names2) {
          var rivals = names2.map(parseClaim).filter(function (c) { return c && c.n === n && c.dev !== o.me && o.fresh(c.dev); });
          if (!rivals.some(function (c) { return c.dev < o.me; })) return n;
          skip[n] = 1;
          return io.del(o.series, mine).then(go);
        });
      });
    }
    return go();
  }

  function activeDevices(devices, now, mins) { return devices.filter(function (d) { return now - (d.last || 0) <= (mins || 10) * 60000; }); }

  /* ---------- roles: a convenience lock, not security (anyone who can open the folder can read and change its files) ---------- */
  var CAN = { owner: { bill: 1, del: 1, settings: 1, fin: 1, backup: 1, team: 1, conflicts: 1 }, staff: { bill: 1, conflicts: 1 } };
  function can(role, cap) { return !!(CAN[role] && CAN[role][cap]); }
  var STAFF_HIDDEN = ['fin', 'fam', 'capl', 'acx', 'stf', 'grp'];   /* App sections a staff member does not see */
  function blockedHash(role, hash) { return role === 'staff' && STAFF_HIDDEN.indexOf(String(hash || '').replace(/^#/, '').split('/')[0]) >= 0; }
  var STAFF_NO_META = { settings: 1, pin: 1, groups: 1, heads: 1, sf: 1, sfcfg: 1 };
  function denied(role, op, store, id) { return role === 'staff' && (op === 'del' || (store === 'meta' && !!STAFF_NO_META[id])); }

  return {
    SYNC: SYNC, META_OK: META_OK, stable: stable, hash: hash, eq: eq, clone: clone, Clock: Clock, Log: Log, Replica: Replica, merge2: merge2,
    parseNdjson: parseNdjson, line: line, fileFor: fileFor, monthOf: monthOf, validOp: validOp, syncable: syncable,
    dupNumbers: dupNumbers, pickTag: pickTag, mustRepick: mustRepick, activeDevices: activeDevices, seriesDir: seriesDir, claimName: claimName, parseClaim: parseClaim, tailNum: tailNum, pickCandidate: pickCandidate, claimNumber: claimNumber, nextNumber: nextNumber, AUTO_NO: AUTO_NO, skew: skew,
    can: can, blockedHash: blockedHash, denied: denied, STAFF_HIDDEN: STAFF_HIDDEN
  };
});

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* sharedfolder.js */
try{/* Shared folder mode (App and My data, computers with Chrome or Edge).
   Several computers keep one folder (a Windows shared folder, or a OneDrive / Google Drive folder). Each computer writes only its own
   files there (entries/<computer>/<month>.ndjson) and reads everybody's; the merge rules are in sfcore.js. Every computer also keeps its
   own copy of all records in its browser, as always, so the App stays fast and keeps working when the folder is out of reach.
   Off by default. When off, nothing in this file runs and nothing about saving changes.
   The folder is chosen by a TOP-LEVEL page of the App (or My data), like the auto save folder (core.js): a browser only asks for it there.
   Roles (owner PIN, staff PINs) are a convenience lock for everyday use. They are NOT security: anyone who can open the folder can read it. */
(function () {
  'use strict';
  var C = window.NSSF;
  if (!C || !window.NS) return;
  var NS = window.NS, T = function (k, v) { return NS.t(k, v); }, E = function (s) { return NS.esc(s); };

  /* ---------- the engine: no page, no NSStore in here, so it can be run twice in one test page ---------- */
  /* o = { dir: () => Promise<DirectoryHandle|null>, kv: { get(k), set(k, v) }, store: { list(s), put(s, rec), del(s, id), meta(k, v?) },
           now(), onEvent(name), who(), perm(handle) => Promise<'granted'|...> } */
  function create(o) {
    var now = o.now || Date.now, rep = null, dev = null, devInfo = null, team = null, teamRev = 0, locked = false;
    var fileCache = {}, st = { state: 'off', last: 0, users: 0, devices: [], conflicts: [], dups: [], held: 0, copies: 0, bad: 0, skew: [], err: '' };
    var newOps = 0, dirty = true, timer = 0, queued = false, running = null, lastDocs = [], lastLocal = {}, confirmDel = false;
    var held = {}, editing = {}, claimQ = Promise.resolve(), lastBeat = 0, beatDirty = false;

    function sub(dir, names, make) {   /* entries/<id>: walk down, creating when asked */
      return names.reduce(function (p, n) { return p.then(function (d) { return d.getDirectoryHandle(n, { create: !!make }); }); }, Promise.resolve(dir));
    }
    function readText(fh) { return fh.getFile().then(function (f) { return f.text().then(function (t) { return { text: t, size: f.size, mod: f.lastModified }; }); }); }
    function tryRead(dir, names, file) {
      return sub(dir, names, false).then(function (d) { return d.getFileHandle(file); }).then(readText).then(function (r) { return r.text; }, function () { return null; });
    }
    function writeWhole(dir, names, file, text) {
      return sub(dir, names, true).then(function (d) { return d.getFileHandle(file, { create: true }); }).then(function (fh) { return fh.createWritable(); })
        .then(function (w) { return w.write(text).then(function () { return w.close(); }); });
    }
    function appendTo(dir, names, file, text) {
      return sub(dir, names, true).then(function (d) { return d.getFileHandle(file, { create: true }); }).then(function (fh) {
        return fh.getFile().then(function (f) {
          /* a file that does not end with a line break (cut by a crash or a copy): start on a new line, so the next op is never glued to the broken one */
          return (f.size ? f.slice(f.size - 1).text() : Promise.resolve('\n')).then(function (last) {
            return fh.createWritable({ keepExistingData: true }).then(function (w) { return w.seek(f.size).then(function () { return w.write((last === '\n' ? '' : '\n') + text); }).then(function () { return w.close(); }); });
          });
        });
      });
    }
    function eachEntry(dh, fn) {   /* async iterator over a directory */
      var it = dh.values(), out = [];
      return (function step() { return it.next().then(function (r) { if (r.done) return out; out.push(r.value); return step(); }); })();
    }

    /* ---- this computer ---- */
    function uid(n) { var s = '', a = 'abcdefghjkmnpqrstuvwxyz23456789'; for (var i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
    function loadDev() {
      return o.kv.get('sfdev').then(function (d) {
        if (!d || !d.id) { d = { id: 'c' + uid(6), inst: uid(10), name: '', joined: now() }; return o.kv.set('sfdev', d).then(function () { return d; }); }
        return d;
      });
    }
    /* two computers with one id (a browser profile copied): the folder says someone else is using it -> take a new id */
    function checkInst(dir) {
      return tryRead(dir, ['devices'], dev.id + '.json').then(function (t) {
        var j = null; try { j = t && JSON.parse(t); } catch (e) {}
        if (j && j.inst && j.inst !== dev.inst && now() - (j.last || 0) < 3600e3) {
          dev = { id: 'c' + uid(6), inst: uid(10), name: dev.name, joined: now() };
          return o.kv.set('sfdev', dev).then(function () { return o.kv.set('sfstate', null); }).then(function () { rep = null; });
        }
      });
    }
    function loadRep() {
      if (rep) return Promise.resolve();
      return Promise.all([o.kv.get('sfstate'), o.store.meta('sf-vault')]).then(function (r) {
        var s = r[0] || {}, vault = r[1];
        function build(v) {
          /* the records here are not the ones this state was made for (a backup restored, browser data cleared): start the "what I have seen" list over,
             so nothing missing here is taken as deleted */
          if (s.vault !== v) s = { seq: s.seq || 0, h: s.h || 0, seen: {}, vault: v };
          rep = new C.Replica(dev.id, o.who ? o.who() : '', s); rep.vault = v; fileCache = {};
        }
        if (vault) return build(vault);
        var v = 'v' + uid(10); return o.store.meta('sf-vault', v).then(function () { build(v); });
      });
    }

    /* ---- read everything the others wrote ---- */
    function readEntries(dir) {
      return sub(dir, [], false).then(function (root) {
        return root.getDirectoryHandle('entries').then(function (ent) {
          return eachEntry(ent).then(function (devs) {
            var jobs = [];
            devs.forEach(function (dd) {
              if (dd.kind !== 'directory') return;
              jobs.push(eachEntry(dd).then(function (files) {
                return Promise.all(files.filter(function (f) { return f.kind === 'file' && /\.ndjson$/i.test(f.name); }).map(function (f) {
                  var key = dd.name + '/' + f.name;
                  return f.getFile().then(function (file) {
                    var c = fileCache[key];
                    if (c && c.size === file.size && c.mod === file.lastModified) return 0;
                    return file.text().then(function (text) {
                      var pos = c && c.size <= file.size ? c.pos : 0, r = C.parseNdjson(text, pos);
                      fileCache[key] = { size: file.size, mod: file.lastModified, pos: r.pos };
                      st.bad += r.bad;
                      if (!/^\d{4}-\d\d\.ndjson$/.test(f.name)) st.copies++;   /* "2026-11 (1).ndjson", "...-PCNAME.ndjson": a copy made by the sync program */
                      var k = rep.ingest(r.ops, now()); newOps += k; return k;
                    });
                  }, function () { return 0; });
                }));
              }));
            });
            return Promise.all(jobs);
          });
        }, function () { return []; });   /* no entries folder yet: first computer */
      });
    }
    function readDevices(dir) {
      return sub(dir, [], false).then(function (root) {
        return root.getDirectoryHandle('devices').then(function (dd) {
          return eachEntry(dd).then(function (fs) {
            return Promise.all(fs.filter(function (f) { return f.kind === 'file' && /\.json$/.test(f.name); }).map(function (f) {
              return readText(f).then(function (r) { try { return JSON.parse(r.text); } catch (e) { return null; } }, function () { return null; });
            }));
          });
        }, function () { return []; });
      }).then(function (l) { return l.filter(function (x) { return x && x.id; }); });
    }
    function readTeam(dir) {
      return tryRead(dir, [], 'team.json').then(function (t) { try { var j = t && JSON.parse(t); if (j && (j.rev || 0) >= teamRev) { team = j; teamRev = j.rev || 0; } } catch (e) {} });
    }

    /* ---- one round ---- */
    function cycle(dir, opts) {
      var stores = ['biz', 'party', 'item', 'doc', 'meta', 'log'];
      newOps = 0;
      return (opts && opts.beatOnly && lastLocal.doc ? Promise.resolve() : readEntries(dir)).then(function () { return readDevices(dir); }).then(function (devices) {
        /* a poll with nothing new in the folder and nothing saved here: only the heartbeat (the work grows with the number of records) */
        if ((opts && opts.poll && !dirty && !newOps || opts && opts.beatOnly) && lastLocal.doc) return { out: { ops: [], actions: [], held: st.held, conflicts: st.conflicts }, devices: devices };
        return readTeam(dir).then(function () {
          if (o.who) rep.setWho(o.who());
          return Promise.all(stores.map(function (s) { return o.store.list(s); })).then(function (lists) {
            var local = {}; stores.forEach(function (s, i) { local[s] = lists[i] || []; });
            local.meta = local.meta.filter(function (r) { return C.META_OK[r.id]; });
            lastLocal = local; lastDocs = local.doc;
            Object.keys(held).forEach(function (k) { if (lastDocs.some(function (d) { return d.no === held[k].no; })) delete held[k]; });   /* saved: the number is used now */
            var out = rep.cycle(local, { confirmDeletes: confirmDel || (opts && opts.confirmDeletes) }, now());
            confirmDel = false; dirty = false;
            /* write what this computer did, then change the records here */
            var byFile = {};
            out.ops.forEach(function (op) { var f = C.fileFor(op); (byFile[f] || (byFile[f] = [])).push(op); });
            return Promise.all(Object.keys(byFile).map(function (f) {
              var p = f.split('/'); return appendTo(dir, [p[0], p[1]], p[2], byFile[f].map(C.line).join(''));
            })).then(function () {
              var seq = Promise.resolve();
              out.actions.forEach(function (a) {
                seq = seq.then(function () { return a.act === 'put' ? o.store.put(a.store, a.rec) : o.store.del(a.store, a.id); }).catch(function () { rep.undoSeen(a.store, a.rec ? a.rec.id : a.id); });
              });
              return seq.then(function () { return { out: out, devices: devices, wrote: out.ops.length }; });
            });
          });
        });
      }).then(function (r) {
        /* the folder says who is here: heartbeat (also: which bill each computer is editing), and the letter in letters mode */
        var devices = r.devices.filter(function (d) { return d.id !== dev.id; });
        var mine = r.devices.filter(function (d) { return d.id === dev.id; })[0] || {};
        var tag = '';
        if (numbering() === 'letters') {
          tag = mine.tag || '';
          if (!tag || C.mustRepick(r.devices.concat(mine.id ? [] : [{ id: dev.id, tag: tag, joined: dev.joined }]), dev.id)) tag = C.pickTag(devices, dev.id);
        }
        var edit = []; Object.keys(editing).forEach(function (k) { edit.push({ id: editing[k].id, no: editing[k].no }); });
        devInfo = { v: 1, id: dev.id, inst: dev.inst, name: dev.name || '', tag: tag, joined: dev.joined, last: now(), who: o.who ? o.who() : '', ops: rep.seq, edit: edit };
        var due = !(opts && opts.poll) || r.wrote || beatDirty || now() - lastBeat > 10000;   /* a quick poll rewrites the heartbeat file only every 10 s */
        var show = function () {
          var all = devices.concat([devInfo]);
          st.devices = all; st.users = C.activeDevices(all, now(), 10).length; st.tag = tag; st.numbering = numbering();
          st.live = devices.filter(function (d) { return now() - (d.last || 0) < 45000; }).length;
          st.conflicts = r.out.conflicts; st.held = r.out.held; st.dups = C.dupNumbers(lastDocs); st.reserved = reservedList();
          st.state = r.out.held ? 'hold' : 'ok'; st.last = now(); st.err = '';
          if (o.setTag) o.setTag(tag);
        };
        if (!due) { show(); return; }
        beatDirty = false; lastBeat = now();
        return writeWhole(dir, ['devices'], dev.id + '.json', JSON.stringify(devInfo)).then(function () {
          show();
          var s = rep.state(); s.vault = rep.vault;
          /* the file's own "modified" time is set by the folder's computer or by this one: a big difference to this clock means the clock is wrong */
          return o.kv.set('sfstate', s).then(function () { return sub(dir, ['devices'], false).then(function (d) { return d.getFileHandle(dev.id + '.json'); }).then(function (fh) { return fh.getFile(); }); })
            .then(function (f) { st.clockOff = Math.round((f.lastModified - now()) / 60000); }, function () {});
        });
      });
    }
    function run(opts) {
      if (running) { queued = true; return running; }
      running = Promise.resolve().then(function () { return o.dir(); }).then(function (h) {
        if (!h) { st.state = 'off'; return; }
        return o.perm(h).then(function (p) {
          if (p !== 'granted') { st.state = 'ask'; return; }
          return (dev ? Promise.resolve() : loadDev().then(function (d) { dev = d; })).then(function () { return checkInst(h); }).then(function () { return loadRep(); }).then(function () { return cycle(h, opts); });
        });
      }).catch(function (e) { st.state = 'err'; st.err = String(e && e.message || e); }).then(function () {
        running = null; if (o.onEvent) o.onEvent('status');
        if (queued) { queued = false; return run(); }
      });
      return running;
    }
    /* ---- one common series: numbers reserved live (see sfcore.js claimNumber) ---- */
    function cfgv() { var r = (lastLocal.meta || []).filter(function (x) { return x.id === 'sfcfg'; })[0]; return r && r.v || {}; }
    function numbering() { return cfgv().numbering === 'letters' ? 'letters' : 'common'; }
    function settleMs() { return cfgv().slow ? 2000 : 700; }
    function reservedList() { return Object.keys(held).map(function (k) { return held[k].no; }); }
    function heldSet(sid) { var s = {}; Object.keys(held).forEach(function (k) { if (held[k].sid === sid) s[held[k].n] = 1; }); return s; }
    function claimIo(dir) {
      return {
        list: function (series) { return sub(dir, ['numbers', series], true).then(function (d) { return eachEntry(d).then(function (es) { return es.filter(function (e) { return e.kind === 'file'; }).map(function (e) { return e.name; }); }); }); },
        put: function (series, name) {
          return sub(dir, ['numbers', series], true).then(function (d) { return d.getFileHandle(name, { create: true }); })
            .then(function (fh) { return fh.createWritable(); }).then(function (w) { return w.write(String(now())).then(function () { return w.close(); }); });
        },
        del: function (series, name) { return sub(dir, ['numbers', series], true).then(function (d) { return d.removeEntry(name); }).catch(function () {}); },
        wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
      };
    }
    function dropHeld(owner, h) {
      var e = held[owner]; if (!e) return Promise.resolve();
      delete held[owner];
      if (lastDocs.some(function (d) { return d.no === e.no; })) return Promise.resolve();   /* a bill has it: the number stays used */
      return claimIo(h).del(e.sid, e.name);
    }
    function doClaim(a) {
      return Promise.resolve().then(function () { return o.dir(); }).then(function (h) {
        if (!h) return null;
        return o.perm(h).then(function (p) {
          if (p !== 'granted') return null;
          return (dev && rep ? Promise.resolve() : run()).then(function () {
            if (!dev || numbering() !== 'common') return null;
            var sid = C.seriesDir(a.scope, a.prefix), cur = held[a.owner], used = {};
            (a.nos || []).forEach(function (no) { var n = C.tailNum(no); if (n) used[n] = 1; });
            /* this form already has a number reserved in this series and no bill took it yet: the same number again */
            if (cur && cur.sid === sid && !used[cur.n]) return cur.no;
            return dropHeld(a.owner, h).then(function () { return readDevices(h); }).then(function (devs) {
              var by = {}, t = now(); devs.forEach(function (d) { by[d.id] = d; });
              var fresh = function (id) { if (id === dev.id) return true; var d = by[id]; return !d || t - (d.last || 0) < 180000; };
              return C.claimNumber(claimIo(h), { series: sid, me: dev.id, used: used, held: heldSet(sid), fresh: fresh, settle: settleMs() }).then(function (n) {
                var no = a.prefix + String(n).padStart(a.digits || 3, '0');
                held[a.owner] = { sid: sid, n: n, no: no, name: C.claimName(n, dev.id) };
                st.reserved = reservedList(); return no;
              });
            });
          });
        });
      });
    }
    function claim(a) {   /* a = { owner, scope, prefix, digits, nos }; null = no common number (mode off, letters mode, folder out of reach): the maker numbers as usual */
      claimQ = claimQ.then(function () { return doClaim(a); }).catch(function (e) { st.err = String(e && e.message || e); return null; });
      return claimQ;
    }
    function release(owner) {
      /* read the bills again first: a bill saved a moment ago has used its number and must keep it */
      return Promise.all([o.dir(), o.store.list('doc')]).then(function (r) { if (r[1]) lastDocs = r[1]; return r[0] ? dropHeld(owner, r[0]) : null; }).then(function () { st.reserved = reservedList(); }, function () {});
    }
    function setEditing(owner, id, no) {
      if (id) editing[owner] = { id: id, no: no || '' }; else delete editing[owner];
      beatDirty = true; return run({ poll: true });
    }
    function editorOf(id) {
      var t = now(), hit = null;
      (st.devices || []).forEach(function (d) {
        if (hit || !dev || d.id === dev.id || t - (d.last || 0) > 90000) return;
        if ((d.edit || []).some(function (e) { return String(e.id) === String(id); })) hit = { name: d.name || d.id, who: d.who || '' };
      });
      return hit;
    }
    function soon(ms) { dirty = true; clearTimeout(timer); timer = setTimeout(run, ms == null ? 1200 : ms); }

    return {
      run: run, soon: soon, status: function () { return st; }, team: function () { return team; }, setTeam: function (t, dir) { t.rev = (teamRev || 0) + 1; team = t; teamRev = t.rev; return writeWhole(dir, [], 'team.json', JSON.stringify(t)); },
      device: function () { return dev; }, setName: function (n) { return loadDev().then(function (d) { dev = d; dev.name = n; return o.kv.set('sfdev', dev); }); },
      claim: claim, release: release, setEditing: setEditing, editorOf: editorOf, numbering: numbering, reserved: reservedList,
      ack: function (key) { rep.ack(key); return run(); }, confirmDeletes: function () { confirmDel = true; return run(); },
      replica: function () { return rep; }, local: function () { return lastLocal; },
      reset: function () { rep = null; dev = null; fileCache = {}; st.state = 'off'; return o.kv.set('sfstate', null); },
      label: function (store, rid) {
        var r = (lastLocal[store] || []).filter(function (x) { return String(x.id) === String(rid); })[0];
        return r ? (r.no ? r.no + (r.buyer && r.buyer.name ? ' · ' + r.buyer.name : '') : r.name || r.desc || String(rid)) : String(rid);
      }
    };
  }

  /* ---------- this page: the real folder, the real browser storage ---------- */
  var FOLDER_DB = 'ns-folder';
  function kdb() { return new Promise(function (res, rej) { var r = indexedDB.open(FOLDER_DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('h'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  var kv = {
    get: function (k) { return kdb().then(function (d) { return new Promise(function (res) { var q = d.transaction('h').objectStore('h').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; }); }); },
    set: function (k, v) { return kdb().then(function (d) { return new Promise(function (res) { var t = d.transaction('h', 'readwrite'); v == null ? t.objectStore('h').delete(k) : t.objectStore('h').put(v, k); t.oncomplete = res; t.onerror = res; }); }); }
  };
  var SS = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };
  var curTag = null;
  function setTag(t) { t = t || ''; if (t === curTag) return; curTag = t; NSStore.meta('sf-tag', t || null).catch(function () {}); try { if (t) localStorage.setItem('ns-sf-tag', t); else localStorage.removeItem('ns-sf-tag'); } catch (e) {} }
  var pageStore = {
    list: function (s) { return NSStore._call('list', { store: s }).then(function (r) { return r || []; }, function () { return []; }); },
    put: function (s, rec) { return NSStore._call('put', { store: s, value: rec }); },
    del: function (s, id) { return NSStore._call('del', { store: s, id: id }); },
    meta: function (k, v) { return arguments.length < 2 ? NSStore.meta(k) : NSStore.meta(k, v); }
  };
  function role() { return SS.get('ns-sf-role') || ''; }
  function who() { return SS.get('ns-sf-who') || ''; }

  var eng = null, On = false, dirH = null;
  function pageEngine() {
    if (eng) return eng;
    eng = create({
      dir: function () { return dirH ? Promise.resolve(dirH) : kv.get('sfdir').then(function (h) { dirH = h || null; return dirH; }); },
      kv: kv, store: pageStore, who: who, setTag: setTag,
      perm: function (h) { return h.queryPermission({ mode: 'readwrite' }); },
      onEvent: function (n) { if (n === 'status') { afterRun(); } }
    });
    return eng;
  }
  function afterRun() {
    document.dispatchEvent(new CustomEvent('ns-sf'));
    var s = eng.status();
    if (s.state === 'ok' || s.state === 'hold') { document.dispatchEvent(new CustomEvent('ns-data')); }
    bar(s.state === 'ask' ? 'sfd.paused' : null);
    gate();
  }
  var barOn = null;
  function bar(key) {
    var b = NS.$('#ns-sfbar');
    if (!key) { if (b) b.remove(); return; }
    if (b || !document.body || window.top !== window) return;
    b = NS.el('div', { id: 'ns-sfbar', class: 'remind', role: 'status' });
    b.innerHTML = '<div class="wrap"><span></span><button type="button" class="btn" data-sf="allow"></button></div>';
    NS.$('span', b).textContent = T(key); NS.$('button', b).textContent = T('sfd.allow');
    var at = NS.$('#main') || document.body; at.insertBefore(b, at.firstChild);
  }

  /* ---------- roles ---------- */
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function hashPin(pin, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, k, 256);
    }).then(b64);
  }
  function mkPin(pin) { var salt = crypto.getRandomValues(new Uint8Array(16)); return hashPin(pin, salt).then(function (h) { return { salt: b64(salt), hash: h }; }); }
  function chkPin(rec, pin) { return rec ? hashPin(pin, unb64(rec.salt)).then(function (h) { return h === rec.hash; }) : Promise.resolve(false); }
  function applyRole(r, name) {
    SS.set('ns-sf-role', r); SS.set('ns-sf-who', name);
    document.documentElement.classList.toggle('sf-staff', r === 'staff');
    /* the name written into the edit history: the staff member's; the owner keeps whatever name was typed in Settings */
    if (r === 'staff') {
      if (SS.get('ns-sf-prev') == null) NSStore.meta('who').then(function (w) { SS.set('ns-sf-prev', w || ''); NSStore.meta('who', name).catch(function () {}); }, function () {});
      else NSStore.meta('who', name).catch(function () {});
      guardHash();
    } else if (SS.get('ns-sf-prev') != null) { var pw = SS.get('ns-sf-prev'); SS.set('ns-sf-prev', null); NSStore.meta('who', pw).catch(function () {}); }
    document.dispatchEvent(new CustomEvent('ns-sf'));
  }
  /* sign out: the role is forgotten and the name in the edit history goes back to what was typed in Settings */
  function clearRole() {
    SS.set('ns-sf-role', null); SS.set('ns-sf-who', null); document.documentElement.classList.toggle('sf-staff', false);
    var pw = SS.get('ns-sf-prev'); if (pw != null) { SS.set('ns-sf-prev', null); NSStore.meta('who', pw).catch(function () {}); }
  }
  function guardHash() { if (C.blockedHash('staff', location.hash)) location.hash = '#home'; }
  window.addEventListener('hashchange', function () { if (role() === 'staff') guardHash(); });
  var wrong = 0, waitUntil = 0;
  /* sign-in box: shown on the App page when the folder is shared and an owner PIN is set */
  function gate() {
    if (!On || window.top !== window || role() || NS.$('#ns-sfgate')) return;
    var tm = eng && eng.team();
    if (!tm || !tm.owner) { applyRole('owner', T('sfd.g.owner')); return; }   /* nobody set a PIN yet: everybody is the owner */
    var d = NS.el('dialog', { id: 'ns-sfgate', class: 'sf-gate', 'aria-labelledby': 'sf-g-h' });
    var names = [{ v: '', t: T('sfd.g.owner') }].concat((tm.staff || []).map(function (s, i) { return { v: String(i + 1), t: s.name }; }));
    d.innerHTML = '<form novalidate><h2 id="sf-g-h"></h2><div class="f"><label for="sf-g-who"></label><select id="sf-g-who"></select></div>' +
      '<div class="f"><label for="sf-g-pin"></label><input id="sf-g-pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" dir="ltr"></div>' +
      '<p class="sf-msg" aria-live="assertive"></p><button type="submit" class="btn primary"></button></form>';
    NS.$('h2', d).textContent = T('sfd.g.t'); NS.$('label[for=sf-g-who]', d).textContent = T('sfd.g.who'); NS.$('label[for=sf-g-pin]', d).textContent = T('sfd.pin');
    NS.$('button', d).textContent = T('sfd.g.go');
    NS.$('select', d).innerHTML = names.map(function (n) { return '<option value="' + E(n.v) + '">' + E(n.t) + '</option>'; }).join('');
    document.body.appendChild(d); d.showModal ? d.showModal() : d.setAttribute('open', '');
    d.addEventListener('cancel', function (e) { e.preventDefault(); });
    NS.$('form', d).addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = NS.$('.sf-msg', d), v = NS.$('select', d).value, pin = NS.$('#sf-g-pin', d).value;
      if (Date.now() < waitUntil) { msg.textContent = T('sfd.g.wait', { n: Math.ceil((waitUntil - Date.now()) / 1000) }); return; }
      var rec = v ? (tm.staff || [])[+v - 1] : tm.owner;
      chkPin(rec, pin).then(function (ok) {
        if (ok) { wrong = 0; applyRole(v ? 'staff' : 'owner', v ? rec.name : T('sfd.g.owner')); d.close(); d.remove(); return; }
        wrong++; NS.$('#sf-g-pin', d).value = ''; msg.textContent = T('sfd.g.wrong');
        if (wrong >= 5) { waitUntil = Date.now() + 30000; wrong = 0; msg.textContent = T('sfd.g.wait', { n: 30 }); }
      });
    });
  }

  /* ---------- turning it on and off ---------- */
  var SUPPORT = function () { return NS.folderSupported && NS.folderSupported(); };
  function choose() {
    if (!NS.folderHere()) { NS.folderHome(); return Promise.reject(new Error('elsewhere')); }
    var pick = window.__sfPick || function () { return window.showDirectoryPicker({ id: 'ns-shared', mode: 'readwrite', startIn: 'documents' }); };
    return pick().then(function (h) {
      dirH = h;
      return kv.set('sfdir', h).then(function () { return NSStore.meta('sf', { on: true, name: h.name, since: Date.now() }); }).then(function () { On = true; return pageEngine().run(); });
    });
  }
  function allow() {
    return kv.get('sfdir').then(function (h) { return h ? h.requestPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? pageEngine().run() : null; }) : null; });
  }
  function stop() {
    On = false; dirH = null; setTag('');
    return Promise.all([kv.set('sfdir', null), NSStore.meta('sf', null)]).then(function () { return eng ? eng.reset() : null; }).then(function () { clearRole(); bar(null); document.dispatchEvent(new CustomEvent('ns-sf')); });
  }

  /* ---------- the tab in My data ---------- */
  function ago(ts) {
    if (!ts) return T('sfd.never');
    var m = Math.round((Date.now() - ts) / 60000);
    return m < 1 ? T('sfd.just') : m < 60 ? T('sfd.ago.m', { n: m }) : T('sfd.ago.h', { n: Math.round(m / 60) });
  }
  function shortV(v) { var s = typeof v === 'string' ? v : v === undefined ? '' : JSON.stringify(v); return s.length > 60 ? s.slice(0, 57) + '...' : s || '—'; }
  function conflictRow(c) {
    var lab = eng.label(c.store, c.rid);
    if (c.kind === 'del') return '<li><span>' + E(T('sfd.c.del', { rec: lab, who: c.who || '?' })) + '</span><span class="sf-act"><button type="button" class="btn sm" data-sf="ack" data-k="' + E(c.key) + '">' + E(T('sfd.keep')) + '</button>' +
      (role() !== 'staff' ? '<button type="button" class="btn sm danger" data-sf="deleteit" data-k="' + E(c.key) + '" data-s="' + E(c.store) + '" data-r="' + E(c.rid) + '">' + E(T('sfd.del')) + '</button>' : '') + '</span></li>';
    return '<li><span>' + E(T('sfd.c.f', { rec: lab, field: c.field, a: shortV(c.a), aw: c.aWho || '?', b: shortV(c.b), bw: c.bWho || '?' })) + '</span><span class="sf-act">' +
      '<button type="button" class="btn sm" data-sf="ack" data-k="' + E(c.key) + '">' + E(T('sfd.keep')) + '</button>' +
      '<button type="button" class="btn sm" data-sf="useother" data-k="' + E(c.key) + '" data-s="' + E(c.store) + '" data-r="' + E(c.rid) + '" data-f="' + E(c.field) + '">' + E(T('sfd.use')) + '</button></span></li>';
  }
  function panelHtml() {
    if (!SUPPORT()) return '<p class="note">' + E(T('sfd.no')) + '</p>';
    var s = eng ? eng.status() : { state: 'off' }, h = '<p>' + E(T('sfd.p')) + '</p>';
    if (!On) {
      return h + '<p class="soft">' + E(T('sfd.safe')) + '</p><div class="md-bar"><button type="button" class="btn primary" data-sf="choose">' + E(T('sfd.choose')) + (NS.folderHere() ? '' : ' ↗') + '</button></div>';
    }
    var dot = s.state === 'ok' ? 'on' : s.state === 'err' || s.state === 'hold' || s.state === 'ask' ? 'warn' : '';
    h += '<dl class="md-stat"><div><dt>' + E(T('sfd.folder')) + '</dt><dd><i class="md-dot ' + dot + '"></i><bdi class="mono">' + E(dirH ? dirH.name : '') + '</bdi></dd></div>' +
      '<div><dt>' + E(T('sfd.st')) + '</dt><dd>' + E(s.state === 'ask' ? T('sfd.paused') : s.state === 'err' ? T('sfd.err', { e: s.err }) : T('sfd.synced', { when: ago(s.last) })) + (s.users > 1 ? ' · ' + E(T('sfd.users', { n: s.users })) : s.last ? ' · ' + E(T('sfd.user1')) : '') + '</dd></div>' +
      '<div><dt>' + E(T('sfd.signed')) + '</dt><dd>' + E(who() || T('sfd.g.owner')) + (role() === 'staff' ? '' : '') + '</dd></div></dl>' +
      '<div class="md-bar"><button type="button" class="btn sm primary" data-sf="sync">' + E(T('sfd.sync')) + '</button>' + (s.state === 'ask' ? '<button type="button" class="btn sm" data-sf="allow">' + E(T('sfd.allow')) + '</button>' : '') +
      (role() && team() && team().owner ? '<button type="button" class="btn sm" data-sf="switch">' + E(T('sfd.switch')) + '</button>' : '') +
      (role() !== 'staff' ? '<button type="button" class="btn sm danger" data-sf="stop">' + E(T('sfd.stop')) + '</button>' : '') + '</div>';
    if (s.held) h += '<p class="note bad">' + E(T('sfd.held', { n: s.held })) + ' <button type="button" class="btn sm" data-sf="confirmdel">' + E(T('sfd.held.ok')) + '</button></p>';
    if (Math.abs(s.clockOff || 0) >= 3) h += '<p class="note bad">' + E(T('sfd.skew', { m: Math.abs(s.clockOff) })) + '</p>';
    if (s.copies) h += '<p class="soft">' + E(T('sfd.copies', { n: s.copies })) + '</p>';
    h += '<h3>' + E(T('sfd.conf.t', { n: s.conflicts.length })) + '</h3>' + (s.conflicts.length ? '<ul class="sf-list">' + s.conflicts.slice(0, 50).map(conflictRow).join('') + '</ul>' : '<p class="soft">' + E(T('sfd.conf.none')) + '</p>');
    if (s.dups.length) h += '<h3>' + E(T('sfd.dup.t')) + '</h3><ul class="sf-list">' + s.dups.map(function (d) { return '<li><span>' + E(T('sfd.dup', { no: d.no, n: d.docs.length })) + '</span></li>'; }).join('') + '</ul>';
    var dv = eng.device() || {}, tag = s.tag || '';
    h += numHtml(s);
    h += '<h3>' + E(T('sfd.comp')) + '</h3><div class="f"><label for="sf-name">' + E(T('sfd.comp.n')) + '</label><input id="sf-name" data-sf-name maxlength="30" value="' + E(dv.name || '') + '"><small class="hint">' + E(T('sfd.comp.h')) + '</small></div>' +
      (tag ? '<p class="soft">' + E(T('sfd.series', { tag: tag })) + ' ' + E(T('sfd.sites')) + '</p>' : '') +
      '<ul class="sf-list">' + (s.devices || []).map(function (d) { return '<li><span><b>' + E(d.name || d.id) + '</b> · ' + E(d.who || '') + (d.tag ? ' · ' + E(d.tag) : '') + '</span><span class="soft">' + E(ago(d.last)) + '</span></li>'; }).join('') + '</ul>';
    if (role() !== 'staff') h += rolesHtml();
    return h + '<p class="soft">' + E(T('sfd.limits')) + '</p>';
  }
  function team() { return eng && eng.team(); }
  /* bill numbers: one common series (default) or a letter for every computer */
  function numHtml(s) {
    var mode = s.numbering === 'letters' ? 'letters' : 'common', dis = role() === 'staff' ? ' disabled' : '';
    var h = '<h3>' + E(T('sfd.num.t')) + '</h3><div class="sf-num" role="radiogroup" aria-label="' + E(T('sfd.num.t')) + '">' +
      '<label class="sf-opt"><input type="radio" name="sfnum" data-sf-num="common"' + (mode === 'common' ? ' checked' : '') + dis + '> <span><b>' + E(T('sfd.num.common')) + '</b><small class="hint">' + E(T('sfd.num.common.h')) + '</small></span></label>' +
      '<label class="sf-opt"><input type="radio" name="sfnum" data-sf-num="letters"' + (mode === 'letters' ? ' checked' : '') + dis + '> <span><b>' + E(T('sfd.num.letters')) + '</b><small class="hint">' + E(T('sfd.num.letters.h')) + '</small></span></label></div>';
    if (mode === 'common') {
      h += '<label class="sf-opt"><input type="checkbox" data-sf-slow' + (cfgNow().slow ? ' checked' : '') + dis + '> <span>' + E(T('sfd.num.slow')) + '</span></label>';
      var res = (s.reserved || []);
      h += '<p class="soft">' + E(res.length ? T('sfd.reserved', { list: res.join(', ') }) : T('sfd.reserved.none')) + '</p>';
    }
    return h;
  }
  var cfgCache = {};
  function cfgNow() { return cfgCache; }
  function loadCfg() { return NSStore.meta('sfcfg').then(function (v) { cfgCache = v || {}; return cfgCache; }, function () { return cfgCache; }); }
  function rolesHtml() {
    var tm = team() || {}, h = '<h3>' + E(T('sfd.roles.t')) + '</h3><p class="soft">' + E(T('sfd.roles.p')) + '</p>';
    h += '<form class="sf-form" data-sf-owner novalidate><div class="f"><label for="sf-op">' + E(T(tm.owner ? 'sfd.owner.new' : 'sfd.owner.pin')) + '</label><input id="sf-op" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" dir="ltr"></div><button type="submit" class="btn sm">' + E(T('sfd.set')) + '</button></form>';
    if (tm.owner) {
      h += '<ul class="sf-list">' + (tm.staff || []).map(function (s, i) { return '<li><span>' + E(s.name) + '</span><button type="button" class="btn sm" data-sf="rmstaff" data-i="' + i + '">' + E(T('sfd.remove')) + '</button></li>'; }).join('') + '</ul>' +
        '<form class="sf-form" data-sf-staff novalidate><div class="f"><label for="sf-sn">' + E(T('sfd.staff.name')) + '</label><input id="sf-sn" maxlength="30"></div><div class="f"><label for="sf-sp">' + E(T('sfd.pin')) + '</label><input id="sf-sp" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" dir="ltr"></div><button type="submit" class="btn sm">' + E(T('sfd.staff.add')) + '</button></form>';
    }
    return h;
  }
  function render() {
    var pane = NS.$('[data-md-pane="sf"]');
    if (!pane) return;
    loadCfg().then(function () {
      if (NS.$('[data-md-pane="sf"]') !== pane) return;
      /* a round every few seconds must not wipe what is being typed (a PIN, the name of this computer) */
      var ae = document.activeElement;
      if (ae && pane.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.type !== 'radio' && ae.type !== 'checkbox') return;
      var html = panelHtml(); if (html === NS.sfHtml && pane.innerHTML) return;
      NS.sfHtml = pane.innerHTML = html; wireName();
    });
    return;
  }
  function wireName() {
    var pane = NS.$('[data-md-pane="sf"]'); if (!pane) return;

    var again = NS.$('#sf-name'); if (again) again.addEventListener('change', function () { eng.setName(again.value.trim()).then(function () { eng.run(); }); });
  }
  function mdPart(body) {
    var nav = NS.$('.md-nav', body), panes = NS.$('.md-panes', body);
    if (!nav || !panes) return;
    var cur = NS._mdTab === 'sf';
    var b = NS.el('button', { type: 'button', role: 'tab', id: 'md-t-sf', 'aria-controls': 'md-p-sf', 'aria-selected': String(cur), tabindex: cur ? '0' : '-1', 'data-md-tab': 'sf', 'data-ic': 'data' });
    b.textContent = T('sfd.tab'); nav.appendChild(b);
    var p = NS.el('section', { class: 'md-pane', role: 'tabpanel', id: 'md-p-sf', 'aria-labelledby': 'md-t-sf', 'data-md-pane': 'sf' }); if (!cur) p.hidden = true;
    panes.appendChild(p);
    if (cur) {   /* opened on this tab: the others step back */
      NS.$$('[data-md-tab]', body).forEach(function (x) { if (x !== b) { x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; } });
      NS.$$('.md-pane', body).forEach(function (x) { if (x !== p) x.hidden = true; });
    }
    kv.get('sfdir').then(function (h) { dirH = h || dirH; On = !!dirH; if (On) pageEngine(); render(); }, render);
    if (On && eng) eng.run();
  }
  NS.mdExt = (NS.mdExt || []).concat([mdPart]);
  document.addEventListener('ns-sf', render);

  /* ---------- clicks ---------- */
  function done(p) { return Promise.resolve(p).then(render, function (e) { if (e && e.name !== 'AbortError' && e.message !== 'elsewhere') NS.toast(T('sfd.err', { e: e && e.message || e }), 'bad'); render(); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sf]'); if (!b) return;
    var a = b.getAttribute('data-sf'), k = b.getAttribute('data-k');
    if (a === 'choose') done(choose());
    else if (a === 'allow') done(allow());
    else if (a === 'sync') done(eng.run());
    else if (a === 'switch') { clearRole(); NS.$('#ns-mydata') && NS.$('#ns-mydata').close(); gate(); }
    else if (a === 'stop') { var go = function () { return stop(); }; NS.ask ? NS.ask(T('sfd.stopq'), { danger: true, ok: T('sfd.stop') }).then(function (y) { if (y) done(go()); }) : done(go()); }
    else if (a === 'confirmdel') done(eng.confirmDeletes());
    else if (a === 'ack') done(eng.ack(k));
    else if (a === 'useother') {
      var c = eng.status().conflicts.filter(function (x) { return x.key === k; })[0]; if (!c) return;
      var store = b.getAttribute('data-s'), rid = b.getAttribute('data-r'), f = b.getAttribute('data-f');
      done(NSStore.get(store, rid).then(function (rec) { if (!rec) return; rec = JSON.parse(JSON.stringify(rec)); rec[f] = c.a; return NSStore.put(store, rec); }).then(function () { return eng.ack(k); }));
    }
    else if (a === 'deleteit') done(NSStore.del(b.getAttribute('data-s'), b.getAttribute('data-r')).then(function () { return eng.ack(k); }));
    else if (a === 'rmstaff') { var tm = JSON.parse(JSON.stringify(team())); tm.staff.splice(+b.getAttribute('data-i'), 1); done(kv.get('sfdir').then(function (h) { return eng.setTeam(tm, h); })); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    var set = function (patch) { return NSStore.meta('sfcfg').then(function (c) { return NSStore.meta('sfcfg', Object.assign({}, c || {}, patch)); }).then(function () { cfgCache = Object.assign({}, cfgCache, patch); return eng ? eng.run() : null; }); };
    if (t.matches('[data-sf-num]')) done(set({ numbering: t.getAttribute('data-sf-num') }));
    else if (t.matches('[data-sf-slow]')) done(set({ slow: !!t.checked }));
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches) return;
    if (f.matches('[data-sf-owner]')) {
      e.preventDefault(); var pin = NS.$('input', f).value;
      if (!/^\d{4,8}$/.test(pin)) { NS.toast(T('sfd.pin.bad'), 'bad'); return; }
      done(mkPin(pin).then(function (rec) { var tm = JSON.parse(JSON.stringify(team() || { v: 1, staff: [] })); tm.owner = rec; return kv.get('sfdir').then(function (h) { return eng.setTeam(tm, h); }); }).then(function () { applyRole('owner', T('sfd.g.owner')); NS.toast(T('sfd.saved')); }));
    } else if (f.matches('[data-sf-staff]')) {
      e.preventDefault(); var nm = NS.$('#sf-sn', f).value.trim(), sp = NS.$('#sf-sp', f).value;
      if (!nm || !/^\d{4,8}$/.test(sp)) { NS.toast(T('sfd.pin.bad'), 'bad'); return; }
      done(mkPin(sp).then(function (rec) { rec.name = nm; var tm = JSON.parse(JSON.stringify(team())); tm.staff = (tm.staff || []).concat([rec]); return kv.get('sfdir').then(function (h) { return eng.setTeam(tm, h); }); }).then(function () { NS.toast(T('sfd.saved')); }));
    }
  });

  /* ---------- page start: the App (or My data) as a top-level page, when it was switched on ---------- */
  var readyRes, readyP = new Promise(function (r) { readyRes = r; });   /* the makers wait for this before asking for a number: the mode is known to be on or off */
  function start() {
    if (window.top !== window || !window.NSStore || !SUPPORT() || !NS.folderHere()) { readyRes(); return; }
    NSStore.ready().then(function () { return Promise.all([NSStore.meta('sf'), kv.get('sfdir')]); }).then(function (r) {
      if (!r[0] || !r[0].on || !r[1]) { readyRes(); return; }
      On = true; dirH = r[1]; pageEngine(); readyRes();
      if (role() === 'staff') document.documentElement.classList.add('sf-staff');
      return eng.run().then(function () {
        /* the folder is read again now and then, and when the person comes back to this window */
        (function tick() {   /* live: every 3 s while another computer is here, every 15 s alone, a heartbeat only (45 s) while this window is in the background */
          var s = eng.status(), wait = document.hidden ? 45000 : s.live > 0 ? 3000 : 15000;
          setTimeout(function () { if (!On) return tick(); eng.run({ poll: true, beatOnly: document.hidden }).then(tick, tick); }, wait);
        })();
        document.addEventListener('visibilitychange', function () { if (!document.hidden && On) eng.run(); });
        document.addEventListener('ns-saved', function () { if (On) eng.soon(); });
        document.addEventListener('ns-autosave', function (ev) { if (On && ev.detail === 'chg') eng.soon(); });
        var f = function () { if (On && eng.status().state === 'ask') { /* the browser asks again only after a click */ } };
        document.addEventListener('pointerdown', function h() { if (On && eng.status().state === 'ask') { document.removeEventListener('pointerdown', h, true); allow(); } }, true);
      });
    }).catch(function () { readyRes(); });
  }
  if (document.readyState === 'complete') setTimeout(start, 1800); else window.addEventListener('load', function () { setTimeout(start, 1800); });

  NS.sf = { create: create, role: role, who: who, can: function (cap) { return C.can(role() || 'owner', cap); }, engine: function () { return eng; }, choose: choose, stop: stop, ready: function () { return Promise.race([readyP, new Promise(function (r) { setTimeout(r, 8000); })]); },
    /* for the makers (through NSStore.sfClaim / sfRelease / sfEditing): the number of a new bill, and who is editing which bill */
    claim: function (a) { return On && eng ? eng.claim(a) : Promise.resolve(null); }, release: function (owner) { return eng ? eng.release(owner) : Promise.resolve(); },
    setEditing: function (owner, id, no) { return On && eng ? eng.setEditing(owner, id, no) : Promise.resolve(); }, editorOf: function (id) { return On && eng ? eng.editorOf(id) : null; } };
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* gstcore.js */
try{(function(h){"use strict";function f(t){var n=parseFloat(String(t??"").replace(/,/g,""));return isFinite(n)?n:0}function c(t){return Math.round((t+Number.EPSILON)*100)/100}function m(t){return/^\d{4}-\d{2}-\d{2}$/.test(String(t||""))}function y(t,n){var a=new Date(t+"T00:00:00Z");return a.setUTCDate(a.getUTCDate()+(+n||0)),a.toISOString().slice(0,10)}var O=["taxable","nil","exempt","nongst"],x=["ok","blocked","ineligible"],p={from:"2025-09-22",old:[12,28],note:"Notification 9/2025-CT(Rate): 5/18/40 from 22 Sep 2025"};function g(t){var n=t&&t.tax,a=n&&Array.isArray(n.hist)?n.hist.filter(function(r){return r&&r.rate!==""&&r.rate!=null&&isFinite(+r.rate)}):[];return a=a.map(function(r){return{from:m(r.from)?r.from:"",rate:+r.rate}}),!a.length&&t&&t.gst!==""&&t.gst!=null&&isFinite(+t.gst)&&(a=[{from:"",rate:+t.gst}]),a.sort(function(r,e){return r.from.localeCompare(e.from)})}function S(t){var n=t&&t.tax&&t.tax.kind;return O.indexOf(n)>=0?n:"taxable"}function A(t){var n=t&&t.tax&&t.tax.itc;return x.indexOf(n)>=0?n:"ok"}function d(t,n){var a=g(t),r=String(n||""),e=null;a.forEach(function(o){(!o.from||o.from<=r)&&(e=o)}),!e&&a.length&&(e=a[0]);var i=S(t),u=e?e.rate:null;return i!=="taxable"&&(u=0),{rate:u,tk:i,itc:A(t),rcm:!!(t&&t.tax&&t.tax.rcm),from:e?e.from:""}}function Z(t,n,a,r){var e=JSON.parse(JSON.stringify(t||{})),i=g(e).filter(function(o){return o.from!==(n||"")});i.push({from:m(n)?n:"",rate:+a}),e.tax=Object.assign({},e.tax||{},{hist:i.sort(function(o,l){return o.from.localeCompare(l.from)})});var u=d(e,r||"9999-12-31");return u.rate!=null&&(e.gst=u.rate),e}function z(t,n){var a=n||p.from;return(t||[]).filter(function(r){if(!r||r.inactive||S(r)!=="taxable")return!1;var e=d(r,a).rate;return p.old.indexOf(+e)>=0&&!g(r).some(function(i){return i.from&&i.from>=p.from})}).map(function(r){return{item:r,rate:d(r,a).rate,hsn:r.hsn||""}})}function D(t,n,a){var r={},e=0;return(n||[]).forEach(function(i){i&&i.desc&&(r[String(i.desc).trim().toLowerCase()]=i)}),(t||[]).forEach(function(i){var u=i&&r[String(i.desc||"").trim().toLowerCase()];if(!(!u||!g(u).some(function(l){return l.from}))){var o=d(u,a);o.rate==null||+i.gst===o.rate&&(i.tk||"taxable")===o.tk||(i.gst=o.rate,o.tk!=="taxable"?i.tk=o.tk:delete i.tk,e++)}}),e}function M(t,n,a,r){var e=d(n,a);return e.rate!=null&&(t.gst=e.rate),e.tk!=="taxable"?t.tk=e.tk:delete t.tk,r&&e.itc!=="ok"?t.itc=e.itc:r&&delete t.itc,e}function q(t,n){var a={nil:0,exempt:0,nongst:0};return(t&&t.items||[]).forEach(function(r){var e=r.qty===""||r.qty==null?1:f(r.qty),i=f(r.rate);if(!(!r.desc&&!i)){var u=c(e*i-e*i*f(r.disc)/100),o=O.indexOf(r.tk)>0?r.tk:f(r.gst)?"":n||"nil";o&&a[o]!=null&&(a[o]=c(a[o]+u))}}),a}function P(t,n){var a=t&&t.itc||n&&typeof n.itc=="string"&&n.itc||"ok";return x.indexOf(a)>=0?a:"ok"}function U(t){if(!m(t))return"";var n=+t.slice(0,4),a=+t.slice(5,7);return(a>=4?n+1:n)+"-11-30"}function $(t,n,a){if(t&&/^\d{4}-\d{2}$/.test(t.itcPeriod||""))return t.itcPeriod;var r="";return Object.keys(n||{}).forEach(function(e){var i=e.lastIndexOf("|");if(!(i<0||e.slice(0,i)!==a)){var u=e.slice(i+1),o=n[e];o&&Array.isArray(o.ok)&&o.ok.indexOf(t.id)>=0&&(!r||u<r)&&(r=u)}}),r}function B(t,n,a){return(a||[]).every(function(r){return!!(t&&t[n+"|"+r])})}function G(t,n){for(var a=[],r=t.slice(0,7);r<=n.slice(0,7)&&a.length<24;){a.push(r);var e=+r.slice(0,4),i=+r.slice(5,7)+1;i>12&&(i=1,e++),r=e+"-"+(i<10?"0":"")+i}return a}function R(t,n){return c((t.by||[]).reduce(function(a,r){return a+((r.date||"")<=n?f(r.amt):0)},0))}function J(t,n,a){var r={rev:{igst:0,cgst:0,sgst:0},back:{igst:0,cgst:0,sgst:0},rows:[]};return(t||[]).forEach(function(e){if(!(e.side!=="pay"||!m(e.date)||!(e.total>0))){var i=n(e.id);if(!(!i||!(f(i.igst)+f(i.cgst)+f(i.sgst)>0))){var u=y(e.date,181),o=y(e.date,180);if(!(u>a.to)){var l=c(e.total-R(e,o));if(l>.004){var F=Math.min(1,l/e.total),L=["igst","cgst","sgst"];if(u>=a.from){var k={};L.forEach(function(s){k[s]=c(f(i[s])*F),r.rev[s]=c(r.rev[s]+k[s])}),r.rows.push({id:e.id,no:e.no,party:e.party,date:e.date,day181:u,unpaid:l,total:e.total,rev:k})}var v=c((e.by||[]).reduce(function(s,I){var w=I.date||"";return s+(w>=u&&w>=a.from&&w<=a.to?f(I.amt):0)},0));if(v=Math.min(v,l),v>.004){var C={};L.forEach(function(s){C[s]=c(f(i[s])*v/e.total),r.back[s]=c(r.back[s]+C[s])}),r.rows.push({id:e.id,no:e.no,party:e.party,date:e.date,day181:u,unpaid:l,total:e.total,paid:v,back:C})}}}}}}),r}function b(t,n,a){var r={igst:0,cgst:0,sgst:0,share:0};return n=f(n),a=f(a),!(n>0)||!(a>0)||(r.share=Math.min(1,n/a),["igst","cgst","sgst"].forEach(function(e){r[e]=c(Math.max(0,f(t&&t[e]))*r.share)})),r}var T=["regular","comp","unreg","sez","uin","overseas","eco"];function N(t){if(!t)return"unreg";if(T.indexOf(t.reg)>=0)return t.reg;var n=String(t.gst&&t.gst.type||"").toLowerCase(),a=String(t.gstin||"").toUpperCase();return/composition/.test(n)?"comp":/sez/.test(n)?"sez":/un body|embassy|uin|united nations/.test(n)?"uin":/non.?resident|oidar/.test(n)?"overseas":/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(a)?"regular":"unreg"}function j(t){var n=String(t||"").toUpperCase().charAt(3);return n==="P"?"ind":n==="H"?"huf":n==="C"?"co":n==="F"?"firm":/^[ABTGLJ]$/.test(n)?"other":""}var E={num:f,r2:c,TK:O,ITC:x,REG:T,GST2:p,hist:g,kindOf:S,itcOf:A,itemRate:d,addRate:Z,gst2List:z,relines:D,fillLine:M,zeroSplit:q,lineItc:P,deadline164:U,claimPeriod:$,has2b:B,monthsOf:G,rule37:J,rule42:b,paidBy:R,partyReg:N,deducteeOf:j,addDays:y};typeof module<"u"&&module.exports?module.exports=E:(h.NSGst=E,h.NS&&(h.NS.itemRate=d,h.NS.partyReg=N))})(this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* books.js */
try{(function(yt){"use strict";function f(e){var t=parseFloat(String(e??"").replace(/,/g,""));return isFinite(t)?t:0}function c(e){return Math.round((e+Number.EPSILON)*100)/100}function x(e){return String(e||"").trim().toLowerCase().replace(/\s+/g," ")}var pe={"04":1,26:1,31:1,35:1,38:1},bt={upi:1,cheque:1,bank:1,card:1,dd:1,other:1};function N(e){return e==="bank"||String(e||"").indexOf("bank:")===0}function ee(e){var t=x(e);return t?"bank:"+t:"bank"}function Z(e){return e&&N(e.bacct)?e.bacct:"bank"}function C(e,t){return bt[e]?N(t)?t:"bank":"cash"}var H={};function dt(e){H={},(e||[]).forEach(function(t){t&&N(t.k)&&String(t.name||"").trim()&&(H[t.k]=String(t.name).trim())})}function kt(e){return H[e]&&(e!=="bank"||Object.keys(H).length>1)?H[e]:e==="bank"?"Bank":"Bank: "+String(e).slice(5).replace(/(^|\s)\S/g,function(t){return t.toUpperCase()})}function Et(e,t,n){if(!e)return[];var i=[{k:"bank",def:1,name:String(e.bankName||"").trim()||n||"Bank",acc:e.bankAcc||"",ifsc:e.bankIfsc||"",branch:e.bankBranch||""}];return(e.id&&t&&t[e.id]||[]).forEach(function(r){r&&String(r.name||"").trim()&&ee(r.name)!=="bank"&&!i.some(function(a){return a.k===ee(r.name)})&&i.push(Object.assign({},r,{k:ee(r.name)}))}),i}function V(e,t,n){return t==="cash"?"cash":N(t)?t==="bank"?Z(e):t:n==="cash"?"cash":Z(e)}function xt(e){var t=V(e,e.from,"cash"),n=V(e,e.to,"bank");return t==="cash"?"dep":n==="cash"?"wd":"xfer"}function te(e){return!!(e.chq&&e.chq.st==="bounce"&&e.mode==="cheque")}function T(e,t){return e.mode==="cheque"&&e.chq&&e.chq.st&&e.chq.st!=="ok"?t?"chq-out":"chq-in":C(e.mode,e.bacct)}function re(e){return!!e&&(e.type==="expinv"||e.type==="exp"&&Array.isArray(e.items)&&!!e.seller&&!e.app)}var St={expwp:"EXPWP",expwop:"EXPWOP",sezwp:"SEZWP",sezwop:"SEZWOP"};function jt(e){if(!re(e))return e;var t=Object.assign({},e,{type:"invoice",kind:"tax",expKind:e.kind});return t.einv=Object.assign({},e.einv||{},{sup:e.einv&&e.einv.sup&&e.einv.sup!=="B2B"?e.einv.sup:St[e.kind]||"EXPWOP"}),/^exp/.test(e.kind||"exp")&&!t.pos&&(t.pos="96"),t}function ge(e,t){return!e.type||/^(invoice|cashmemo|note)$/.test(e.type)||e.status==="paid"||e.paidBy?0:e.paid==="paid"||e.status2==="paid"?c(t):c(Math.min(f(e.adv),t))}function D(e){var t=e.kind==="supply"||e.kind==="plain"||e.withGst===!1||e.type==="pbill"&&e.noGst,n=e.type==="pbill",i=n?e.buyer&&e.buyer.state:e.seller&&e.seller.state,r=n?e.seller&&e.seller.state:e.pos||e.buyer&&e.buyer.state||i;i=i||r;var a=(!i||!r||i===r||e.type==="hotel")&&!re(e),s={taxable:0,cgst:0,sgst:0,igst:0};(e.items||[]).forEach(function(l){var g=l.qty===""||l.qty==null?1:f(l.qty),v=f(l.rate);if(!(!l.desc&&!v)){var h=c(g*v-g*v*f(l.disc)/100),k=t?0:c(h*f(l.gst)/100);a&&(k=c(c(k/2)*2)),s.taxable+=h,a?(s.cgst+=k/2,s.sgst+=k/2):s.igst+=k}});var o=Ce(e);(e.charges||[]).forEach(function(l){var g=c(f(l.amt));if(g){var v=t?0:c(g*(l.gst===""||l.gst==null||l.gst==="main"?o:f(l.gst))/100);a&&(v=c(c(v/2)*2)),s.taxable+=g,a?(s.cgst+=v/2,s.sgst+=v/2):s.igst+=v}}),s.taxable=c(s.taxable),s.cgst=c(s.cgst),s.sgst=c(s.sgst),s.igst=c(s.igst),s.tcs=e.tcs&&e.tcs.on?c((e.tcs.base==="taxable"?s.taxable:s.taxable+s.cgst+s.sgst+s.igst)*Te(e)/100):0;var p=c(s.taxable+s.cgst+s.sgst+s.igst+s.tcs);return s.total=e.total!=null&&e.total!==""?f(e.total):p,s.round=c(s.total-p),s.ut=!n&&pe[i]&&a,s}function ve(e){return/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(e||"").toUpperCase())}function Le(e){var t=e.tcs||{},n=String(e.buyer&&e.buyer.gstin||"").toUpperCase();return ve(t.pan)?String(t.pan).toUpperCase():ve(n.slice(2,12))?n.slice(2,12):""}function Te(e){var t=e.tcs||{},n=f(t.rate);return!t.on||!n?0:Le(e)||t.nopanOk?n:Math.min(20,Math.max(2*n,5))}function Ce(e){var t=-1,n=0;return(e.items||[]).forEach(function(i){var r=i.qty===""||i.qty==null?1:f(i.qty),a=r*f(i.rate)*(1-f(i.disc)/100);(i.desc||f(i.rate))&&a>t&&(t=a,n=f(i.gst))}),n}function wt(e){var t=-1,n=null;return(e.items||[]).forEach(function(i){var r=i.qty===""||i.qty==null?1:f(i.qty),a=r*f(i.rate)*(1-f(i.disc)/100);(i.desc||f(i.rate))&&a>t&&(t=a,n=i)}),(e.charges||[]).filter(function(i){return f(i.amt)}).map(function(i){var r=!(i.gst===""||i.gst==null||i.gst==="main");return{desc:i.name||"Charges",hsn:r?i.hsn||"":n&&n.hsn||"",qty:1,unit:n&&n.unit||"",rate:f(i.amt),disc:"",gst:r?f(i.gst):n?f(n.gst):0,charge:1}})}function M(e){return String(e.buyer&&e.buyer.name||"").trim()}function Ot(e){return x(e.seller&&e.seller.name)}function I(e){if(te(e)||e.cancelled)return"";switch(e.type||"invoice"){case"invoice":case"cashmemo":case"pharma":case"jewel":case"garment":return"sale";case"resto":return e.status==="open"?"":"sale";case"lr":return"sale";case"visit":case"svc":return f(e.total)?"sale":"";case"fee":return"sale";case"rentb":return e.print==="bill"?"sale":"";case"hotel":return e.print==="bill"&&e.stay!=="cancel"?"sale":"";case"tsh":return"sale";case"gjob":return e.print==="bill"?"sale":"";case"job":return e.print==="bill"?"sale":"";case"rabill":return"sale";case"note":return e.side==="purchase"?e.kind==="debit"?"pret":"buy":e.kind==="debit"?"sdeb":"sret";case"receipt":return e.kind==="ref"?"refund":"in";case"voucher":return e.forBill?"out":"outexp";case"self":return"buy";case"pbill":return e.kind==="return"?"pret":"buy";case"expinv":return"sale";case"exp":return re(e)?"sale":"exp";case"ob":return"ob";case"contra":return"contra";case"jv":return"jv";case"fa":return e.kind==="sale"?"fasale":"fabuy";case"don":return"oinc";case"oinc":return"oinc";case"taxpay":return"taxpay";case"gstset":return"gstset";case"wo":return"wo";case"pdd":return"pdd";case"advadj":return"advadj";case"salary":return e.acct?"sal":"";case"salpay":return"salpay";case"rent":return e.acct?"rentin":"";case"pettyl":return"pettyl";case"sadv":return"sadv";case"loan":return e.recv?"loan":"";case"emi":return"emi";case"stk":return e.kind==="adj"&&e.val?"stkadj":""}return""}var Pe={invoice:1,cashmemo:1,pharma:1,jewel:1,garment:1,expinv:1,exp:1,resto:1,gjob:1,job:1};function At(e){if(!e)return"";var t=e.type||"invoice";if(t==="challan")return e.kind==="sale"||e.kind==="approval"||!e.kind?"dn":e.kind==="transfer"?String(e.toGd||"").trim()?"dnmove":"":e.kind==="job"?"dnjob":"";var n=I(e);return n==="sale"?Pe[t]?"sale":"":t==="pbill"?e.kind==="return"?"pret":"buy":t==="self"?"buy":t==="note"&&e.reason==="ret"?n==="pret"?"pret":n==="sret"?"sret":"":""}var he={damage:"exp:loss by damage",expired:"exp:loss by damage",lost:"exp:loss by theft",short:"exp:stock shortage",own:"drw:drawings",sample:"exp:free samples",gift:"exp:gifts and free goods"};function Re(e){var t=[];return(e&&e.lines||[]).forEach(function(n){var i=he[n.reason];if(i){var r=c(f(n.value));r>0&&t.push([i,r,"purchases"]);var a=n.itcRev||{};["igst","cgst","sgst"].forEach(function(s){var o=c(f(a[s]));o>0&&t.push([i,o,"gst-in-"+s])})}}),t}function Mt(e){var t={igst:0,cgst:0,sgst:0};return I(e)==="stkadj"&&(e.lines||[]).forEach(function(n){he[n.reason]&&["igst","cgst","sgst"].forEach(function(i){t[i]=c(t[i]+f(n.itcRev&&n.itcRev[i]))})}),t}function G(e){var t=I(e),n="p:"+x(M(e)),i=[];function r(j,q){q=c(q),q&&i.push({a:j,dr:q,cr:0})}function a(j,q){q=c(q),q&&i.push({a:j,dr:0,cr:q})}var s,o;if(e.gen&&(t==="in"||t==="out"||t==="outexp"))return ar(e,r,a),i;if(t==="sale"||t==="sret"||t==="sdeb"){s=D(e);var p=t==="sret"?a:r,l=t==="sret"?r:a,g=t==="sret"?"sales-return":"sales";p(M(e)?n:"p:cash-customer",s.total),qe(e,s.taxable,"sl",g).forEach(function(j){l(j[0],j[1])}),l("gst-out-cgst",s.cgst),l(s.ut?"gst-out-utgst":"gst-out-sgst",s.sgst),l("gst-out-igst",s.igst),l("tcs-payable",s.tcs),s.round&&(s.round>0?l:p)("round-off",Math.abs(s.round));var v=t==="sale"?Math.min(f(e.exch),s.total):0;if(v>0&&(r("purchases",v),a(M(e)?n:"p:cash-customer",v)),t==="sale"&&e.status==="paid"&&!e.paidBy&&(r(C(e.payMode||"cash",e.bacct),c(s.total-v)),a(M(e)?n:"p:cash-customer",c(s.total-v))),t==="sale"){var h=ge(e,s.total);h>0&&(r(C(e.payMode||"cash",e.bacct),h),a(M(e)?n:"p:cash-customer",h))}}else if(t==="in"){o=f(e.amount);var k=f(e.tds),S=f(e.disc);r(T(e),o),r("tds-receivable",k),r(He,S),a(n,o+k+S);var w=ye(e);w&&(r(me,w.tax),a("gst-out-cgst",w.cgst),a(w.ut?"gst-out-utgst":"gst-out-sgst",w.sgst),a("gst-out-igst",w.igst))}else if(t==="advadj")r("gst-out-cgst",e.cgst),r(e.ut?"gst-out-utgst":"gst-out-sgst",e.sgst),r("gst-out-igst",e.igst),a(me,c(f(e.cgst)+f(e.sgst)+f(e.igst)));else if(t==="oinc"){o=f(e.amount);var u=f(e.tds);r(T(e),o),r("tds-receivable",u),a("inc:"+x(e.head||"Miscellaneous income"),o+u)}else if(t==="taxpay"){var y=Qe(e),b=e.kind==="gstref"||e.kind==="itref";y.lines.forEach(function(j){(b?a:r)(j[0],j[1])}),b?r(T(e),y.total):a(T(e,!0),y.total)}else if(t==="gstset")ze(e).forEach(function(j){r(j[0],j[1]),a(j[2],j[1])});else if(t==="wo")o=f(e.amount),e.side==="pay"?(r(n,o),a(e.reason==="small"?Nt:Ve,o)):(r(e.reason==="bad"?Rt:He,o),a(n,o));else if(t==="pdd")o=f(e.change),o>0?(r(Ke,o),a("pdd",o)):o<0&&(r("pdd",-o),a(Ke,-o));else if(t==="refund")o=f(e.amount),r(n,o),a(T(e,!0),o);else if(t==="out"||t==="outexp"){var m=(e.lines||[]).reduce(function(j,q){return j+f(q.amt)},0),d=c(m*f(e.tdsRate)/100);t==="out"?(r(n,m+f(e.disc)),a(Ve,f(e.disc))):(e.lines||[]).forEach(function(j){r(ie(j.head),f(j.amt))}),a(T(e,!0),m-d),a("tds-payable",d);var E=Ne(e);E&&(E.itc==="ok"?(r("gst-in-igst",E.igst),r("gst-in-cgst",E.cgst),r("gst-in-sgst",E.sgst)):r(t==="out"?"purchases":ie((e.lines||[])[0]&&e.lines[0].head),E.tax),a("gst-rcm-payable",E.tax))}else if(t==="buy"||t==="pret"){s=D(e);var A=t==="pret"?a:r,L=t==="pret"?r:a,Q=t==="pret"?"purchase-return":"purchases";e.type==="self"&&(e.items||[]).length&&e.items.every(function(j){return!String(j.desc||"").trim()||/^99/.test(String(j.hsn||""))})&&(Q="exp:prof");var R=Ue(e);if(Q==="purchases"||Q==="purchase-return"){var De=qe(e,s.taxable,"pl",Q);De[0][1]=c(De[0][1]+R.tax),De.forEach(function(j){A(j[0],j[1])})}else A(Q,c(s.taxable+R.tax));s=Object.assign({},s,{cgst:c(s.cgst-R.cgst),sgst:c(s.sgst-R.sgst),igst:c(s.igst-R.igst)}),e.type==="self"?(A("gst-in-cgst",s.cgst),A("gst-in-sgst",s.sgst),A("gst-in-igst",s.igst),s=Object.assign({},s,{cgst:c(s.cgst+R.cgst),sgst:c(s.sgst+R.sgst),igst:c(s.igst+R.igst)}),L("gst-rcm-payable",s.cgst+s.sgst+s.igst),L(n,s.taxable),e.status==="sipaid"&&(r(n,s.taxable),a(C(e.payMode||"cash",e.bacct),s.taxable))):(A("gst-in-cgst",s.cgst),A("gst-in-sgst",s.sgst),A("gst-in-igst",s.igst),A("tcs-receivable",s.tcs),s.round&&(s.round>0?A:L)("round-off",Math.abs(s.round)),L(n,s.total),t==="buy"&&P(e)&&(r(n,P(e)),a("tds-payable",P(e))))}else if(t==="exp"){o=f(e.amount);var Ie=f(e.gst),F=e.itc&&Ie?c(o*Ie/(100+Ie)):0;r("exp:"+x(e.cat||"Miscellaneous"),o-F),F&&(e.inter?r("gst-in-igst",F):(r("gst-in-cgst",c(F/2)),r("gst-in-sgst",F-c(F/2)))),e.mode==="credit"?a(M(e)?n:"p:unknown",o-P(e)):a(C(e.mode,e.bacct),o-P(e)),a("tds-payable",P(e))}else if(t==="contra")o=f(e.amount),r(V(e,e.to,"bank"),o),a(V(e,e.from,"cash"),o);else if(t==="jv")(e.lines||[]).forEach(function(j){var q=Ee(j);q&&(r(q,f(j.dr)),a(q,f(j.cr)))});else if(t==="fabuy"){o=f(e.amount);var z=e.itc?f(e.gstAmt):0,pt="fa:"+x(e.name||"Fixed asset");if(e.mode==="own")return r(pt,o),a("opening",o),i;r(pt,o+(e.itc?0:f(e.gstAmt))),z&&(e.inter?r("gst-in-igst",z):(r("gst-in-cgst",c(z/2)),r("gst-in-sgst",z-c(z/2)))),e.mode==="credit"?a(M(e)?n:"p:unknown",o+f(e.gstAmt)):a(C(e.mode,e.bacct),o+f(e.gstAmt))}else if(t==="fasale"){o=f(e.amount);var le=f(e.bv),fr="fa:"+x(e.name||"Fixed asset"),U=f(e.gstAmt);e.mode==="credit"?r(M(e)?n:"p:unknown",o+U):r(C(e.mode,e.bacct),o+U),U&&(e.inter?a("gst-out-igst",U):(a("gst-out-cgst",c(U/2)),a("gst-out-sgst",U-c(U/2)))),a(fr,le),o>le?a("inc:profit on sale of assets",o-le):r("exp:loss on sale of assets",le-o)}else if(t==="sal"){var B=de(e),gt=c(f(e.prov&&e.prov.grat)),vt=c(f(e.prov&&e.prov.bonus));r(Bt,c(B.gross-gt-vt)),r("ocl:provision for gratuity",gt),r("ocl:bonus payable",vt),r(qt,B.erPf+B.erEsi),a("inc:notice pay recovered",B.notice),a("pf-payable",B.pf+B.erPf),a("esi-payable",B.esi+B.erEsi),a("pt-payable",B.pt),a("tds-payable",B.tds),(B.lwf||B.erLwf)&&(r(Lt,B.erLwf),a("lwf-payable",B.lwf+B.erLwf)),B.adv&&a(ae+x(M(e)||"staff"),B.adv),a(Dt,B.other),a($e,B.net)}else if(t==="salpay")r($e,f(e.amount)),a(T(e,!0),f(e.amount));else if(t==="rentin")o=Fe(e),r(C(e.mode,e.bacct),o),a("inc:rent received",o);else if(t==="pettyl")e.kind==="frombank"?(r("cash",f(e.amount)),a(Z(e),f(e.amount))):(r(ie(e.head),f(e.amount)),a("cash",f(e.amount)));else if(t==="sadv"){o=f(e.amount);var ht=ae+x(e.emp||M(e)||"staff");e.kind==="back"?(r(T(e),o),a(ht,o)):(r(ht,o),a(T(e,!0),o))}else if(t==="loan")r(T(e),f(e.amount)),a(be(e),f(e.amount));else if(t==="emi")r(be(e),f(e.principal)),r(It,f(e.interest)),a(T(e,!0),c(f(e.principal)+f(e.interest)));else if(t==="stkadj")Re(e).forEach(function(j){r(j[0],j[1]),a(j[2],j[1])});else if(t==="ob")if(o=f(e.amount),e.side==="cash"||e.side==="bank"){var mt=e.side==="bank"?Z(e):"cash";o<0?(r("opening",-o),a(mt,-o)):(r(mt,o),a("opening",o))}else e.side==="pay"?(r("opening",o),a(n,o)):(r(n,o),a("opening",o));return i}function Ne(e){if(!e||!e.rcm||(e.type||"")!=="voucher"||te(e))return null;var t=c((e.lines||[]).reduce(function(l,g){return l+f(g.amt)},0)),n=f(e.rcmRate),i=c(t*n/100);if(!(i>0))return null;var r=e.seller&&e.seller.state||"",a=String(e.buyer&&e.buyer.gstin||"").toUpperCase(),s=e.rcmState||e.buyer&&e.buyer.state||(/^\d{2}[A-Z]/.test(a)?a.slice(0,2):""),o=e.rcmInter===!0||e.rcmInter!==!1&&!!(s&&r&&s!==r),p={base:t,rate:n,tax:i,inter:o,igst:0,cgst:0,sgst:0,ut:!o&&!!pe[r],itc:/^(blocked|ineligible)$/.test(e.rcmItc||"")?e.rcmItc:"ok"};return o?p.igst=i:(p.cgst=c(i/2),p.sgst=c(i-p.cgst)),p}function We(e,t){var n=e&&e.itc||typeof t.itc=="string"&&t.itc||"ok";return/^(blocked|ineligible)$/.test(n)?n:"ok"}function Ue(e){var t={cgst:0,sgst:0,igst:0,tax:0,blk:{cgst:0,sgst:0,igst:0},inel:{cgst:0,sgst:0,igst:0}};return!e||!/^(pbill|self|note)$/.test(e.type||"")||(["blocked","ineligible"].forEach(function(n){var i=(e.items||[]).filter(function(o){return We(o,e)===n}),r=typeof e.itc=="string"&&e.itc===n?e.charges:[];if(!(!i.length&&!(r&&r.length))){var a=D(Object.assign({},e,{items:i,charges:r||[],tcs:null,total:null})),s=n==="blocked"?t.blk:t.inel;["cgst","sgst","igst"].forEach(function(o){s[o]=a[o],t[o]=c(t[o]+a[o])})}}),t.tax=c(t.cgst+t.sgst+t.igst)),t}var me="gst-adv";function ye(e){if(!e||e.type!=="receipt"||e.kind!=="adv"||!e.gstAdv||te(e)||e.cancelled)return null;var t=f(e.rate),n=c(f(e.amount));if(!t||!n)return null;var i=e.pos||(/^\d{2}[A-Z]/.test(String(e.buyer&&e.buyer.gstin||"").toUpperCase())?String(e.buyer.gstin).slice(0,2):""),r=e.seller&&e.seller.state,a=i||r,s=!i||!r||i===r,o=c(n*t/(100+t)),p={rate:t,total:n,tax:o,taxable:c(n-o),pos:a,intra:s,cgst:0,sgst:0,igst:0};return s?(p.cgst=c(o/2),p.sgst=c(o-p.cgst)):p.igst=o,p.ut=!!(s&&pe[r||a]),p}var ne={docs:null,biz:null,out:null};function Ge(e,t){if(ne.docs===e&&ne.biz===t)return ne.out;var n={},i=!1,r=[];if(se(e,t).forEach(function(p){var l=ye(p);l&&l.tax&&(n[p.id]={d:p,a:l,used:0,tx:{cgst:0,sgst:0,igst:0}},i=!0)}),i){var a={},s=[],o={};(e||[]).forEach(function(p){p&&p.id&&(o[p.id]=p)}),$(e,t).every.forEach(function(p){(p.by||[]).forEach(function(l){var g=n[l.id];if(!(!g||!(f(l.amt)>0))){var v=o[p.id],h=v&&v.items||[];if(!(p.type!=="receipt"&&h.some(function(w){return String(w.hsn||"").trim()})&&!h.some(function(w){return/^99/.test(String(w.hsn||"").trim())}))){var k=l.id+">"+p.id,S=a[k];S||(S=a[k]={c:g,b:p,amt:0,date:(p.date||"")>(g.d.date||"")?p.date:g.d.date},s.push(S)),S.amt=c(S.amt+f(l.amt))}}})}),s.sort(function(p,l){return(p.date||"").localeCompare(l.date||"")||String(p.b.id).localeCompare(String(l.b.id))}),s.forEach(function(p){var l=p.c,g=l.a,v=Math.min(p.amt,c(g.total-l.used));if(v>0){l.used=c(l.used+v);var h=l.used>=g.total-.004,k=function(m){var d=c(h?g[m]-l.tx[m]:g[m]*v/g.total);return l.tx[m]=c(l.tx[m]+d),d},S=k("cgst"),w=k("sgst"),u=k("igst"),y=c(S+w+u),b=p.b.type==="receipt";r.push({type:"advadj",id:"advadj:"+l.d.id+">"+p.b.id,date:p.date,no:"",rv:l.d.no||"",rvId:l.d.id,rvDate:l.d.date,bill:p.b.no||"",billId:p.b.id,billType:p.b.type,refund:b,pname:M(l.d),pos:g.pos,rate:g.rate,gross:v,taxable:c(v-y),cgst:S,sgst:w,igst:u,ut:g.ut,seller:l.d.seller,created:0,narr:"GST on advance "+(l.d.no||"")+" adjusted "+(b?"on refund ":"against bill ")+(p.b.no||"")})}})}return ne={docs:e,biz:t,out:r},r}var Bt="exp:salary",qt="exp:employer contribution to pf and esi",$e="sal-payable",Dt="ocl:other deductions from salary",ae="sadv:",It="exp:interest on loan",Lt="exp:employer contribution to labour welfare fund";function P(e){return e&&e.tds&&(e.type==="pbill"||e.type==="exp")?c(f(e.tds.amt)):0}function ie(e){var t=x(e||"Miscellaneous");return/^(advance to staff|staff advance|advance to employee|employee advance)s?$/.test(t)?ae+"staff":"exp:"+t}function be(e){return(e.lt==="od"?"od:":"loan:")+x(e.lender||M(e)||"loan")}function Xe(e){var t=String(e||"");return/provident|\bE?PF\b/i.test(t)?"pf":/\bESIC?\b/i.test(t)?"esi":/professional|\bPT\b/i.test(t)?"pt":/\bTDS\b|income.?tax/i.test(t)?"tds":/labour welfare|\bLWF\b/i.test(t)?"lwf":/notice pay/i.test(t)?"notice":/advance|loan/i.test(t)?"adv":"other"}function de(e){var t={gross:0,pf:0,esi:0,pt:0,tds:0,lwf:0,notice:0,adv:0,other:0,ded:0,erPf:c(f(e.erPf)),erEsi:c(f(e.erEsi)),erLwf:c(f(e.erLwf))};return(e.earn||[]).forEach(function(n){t.gross+=f(n.amt)}),(e.ded||[]).forEach(function(n){var i=f(n.amt);i&&(t[Xe(n.desc)]+=i,t.ded+=i)}),["gross","pf","esi","pt","tds","lwf","notice","adv","other","ded"].forEach(function(n){t[n]=c(t[n])}),t.net=c(t.gross-t.ded),t.cost=c(t.gross+t.erPf+t.erEsi+t.erLwf),t}function Fe(e){var t=String(e.from||""),n=String(e.to||"")>=t?String(e.to):t,i=0;if(/^\d{4}-\d{2}$/.test(t))for(var r=t;r<=n&&i<24;){i++;var a=+r.slice(0,4),s=+r.slice(5,7)+1;s>12&&(s=1,a++),r=a+"-"+String(s).padStart(2,"0")}return c(f(e.rent)*(i||1))}function Tt(e){if((e.type==="mandi"||e.type==="pump"||e.type==="mpay")&&e.books&&e.books.length)return e.books.map(function(r,a){return Object.assign({no:e.no},r,{id:e.id+"#bk"+a,src:e.id,date:r.date||e.date,seller:e.seller,created:e.created||0})});if(e.type==="dairy"&&e.books&&e.books.length)return e.books.map(function(r,a){return Object.assign({no:e.no},r,{id:e.id+"#bk"+a,src:e.id,date:r.date||e.date,seller:e.seller,created:e.created||0})});if(e.type==="petty"){if(!e.acct)return[];var t=[];return(e.lines||[]).forEach(function(r,a){f(r.paid)>0&&t.push({type:"pettyl",id:e.id+"#"+a,src:e.id,no:e.no||"",vno:r.vno||"",date:r.date||e.date,head:r.head||"",desc:r.desc||"",amount:c(f(r.paid)),seller:e.seller,created:e.created||0}),f(r.recd)>0&&/bank|atm|withdr|cheque|chq/i.test((r.desc||"")+" "+(r.head||""))&&t.push({type:"pettyl",kind:"frombank",id:e.id+"#r"+a,src:e.id,no:e.no||"",vno:r.vno||"",date:r.date||e.date,head:"",desc:r.desc||"",amount:c(f(r.recd)),seller:e.seller,created:e.created||0})}),t}var n=e.pay||(e.payDate?{date:e.payDate,mode:e.payMode}:null);if(e.type==="salary"&&e.acct&&n&&n.date){var i={type:"salpay",id:e.id+"#pay",src:e.id,no:e.no||"",date:n.date,mode:n.mode||"bank",bacct:n.bacct||e.payBacct||"",chq:n.chq,amount:de(e).net,seller:e.seller,buyer:e.buyer,created:e.created||0};return i.amount>0?[e,i]:[e]}return[e]}function ke(e,t){var n=+e.slice(0,4),i=+e.slice(5,7)-1+t,r=+e.slice(8,10);n+=Math.floor(i/12),i=(i%12+12)%12;var a=new Date(Date.UTC(n,i+1,0)).getUTCDate();return n+"-"+String(i+1).padStart(2,"0")+"-"+String(Math.min(r,a)).padStart(2,"0")}function Ze(e,t,n){var i=f(t)/1200;return e=f(e),n=Math.round(f(n)),!(e>0)||!(n>0)?0:c(i?e*i*Math.pow(1+i,n)/(Math.pow(1+i,n)-1):e/n)}function Ct(e,t){var n=f(e.amount),i=Math.round(f(e.months)),r=f(e.rate)/1200,a=f(e.emi)||Ze(n,e.rate,i),s=[],o=n,p=/^\d{4}-\d{2}-\d{2}$/.test(String(e.first||""))?e.first:e.date?ke(e.date,1):"",l={};(t||[]).forEach(function(S){S&&S.type==="emi"&&S.loanId===e.id&&(l[f(S.n)]=S)});for(var g=1;g<=Math.min(i,600)&&o>.004;g++){var v=l[g],h=c(v?f(v.interest):o*r),k=c(v?f(v.principal):g===i?o:Math.min(o,a-h));o=c(o-k),s.push({n:g,date:v?v.date:p?ke(p,g-1):"",emi:c(h+k),interest:h,principal:k,bal:o,paid:v||null})}return s}function Pt(e,t){var n=f(e.amount);return(t||[]).forEach(function(i){i&&i.type==="emi"&&i.loanId===e.id&&(n-=f(i.principal))}),c(n)}var He="exp:discount allowed",Ve="inc:discount received",Rt="exp:bad debts",Nt="inc:balances written back",Ke="exp:provision for doubtful debts";function Wt(e,t,n,i){var r=0;return W(e,t).forEach(function(a){I(a)==="pdd"&&a.id!==i&&(!n||a.date<=n)&&(r=c(r+f(a.change)))}),r}var Ut=["igst","cgst","sgst","cess"],Gt=["tax","int","pen","fee","oth"],_e="exp:interest on late payment of tax",Je="exp:late fee and penalty",$t="exp:gst input credit reversed",Ye="gst-itc-held";function Qe(e){var t=[];function n(i,r){r=c(f(r)),r&&t.push([i,r])}return e.kind==="gst"||e.kind==="gstref"?Ut.forEach(function(i){var r=e.gst&&e.gst[i]||{};n("gstcash-"+i,Gt.reduce(function(a,s){return a+f(r[s])},0))}):/^(tds|tcs|pf|esi|pt|lwf)$/.test(e.kind)?(n(e.kind+"-payable",e.tax),n(_e,e.int),n(Je,e.fee)):n(e.to==="oca"?"oca:advance income tax":"drw:drawings",e.amount),{lines:t,total:c(t.reduce(function(i,r){return i+r[1]},0))}}function ze(e){var t=[],n=!!e.ut;function i(a){return"gst-out-"+(a==="sgst"&&n?"utgst":a)}function r(a,s,o){s=c(f(s)),s>0&&t.push([a,s,o])}return["igst","cgst","sgst"].forEach(function(a){var s=e.use&&e.use[a]||{};Object.keys(s).forEach(function(p){p!=="cess"&&r(i(a),s[p],"gst-in-"+p)}),r(i(a),e.cash&&e.cash[a],"gstcash-"+a),r("gst-rcm-payable",e.rcm&&e.rcm[a],"gstcash-"+a),r(_e,e.int&&e.int[a],"gstcash-"+a),r(Je,e.fee&&e.fee[a],"gstcash-"+a),r($t,e.rev&&e.rev[a],"gst-in-"+a);var o=c(f(e.r37&&e.r37[a]));o>0?r(Ye,o,"gst-in-"+a):o<0&&r("gst-in-"+a,-o,Ye)}),t}function Ee(e){return e?e.a==="party"?e.party?"p:"+x(e.party):"":String(e.a||"").trim():""}function K(e){var t={};return I(e)==="jv"||e.gen&&I(e)?(e.lines||[]).forEach(function(n){n.a==="party"&&String(n.party||"").trim()&&(t[x(n.party)]=String(n.party).trim())}):M(e)&&(t[x(M(e))]=M(e)),t}var et={ob:0,sale:1,sdeb:1,buy:1,exp:1,fabuy:1,sret:2,pret:2,in:3,out:3,outexp:3,refund:3,fasale:3,oinc:3,taxpay:3,sal:1,rentin:3,salpay:3,pettyl:3,sadv:3,loan:3,emi:3,advadj:4,wo:4,contra:4,jv:5,gstset:6,pdd:7,stkadj:3};function tt(e,t){return(e.date||"").localeCompare(t.date||"")||et[I(e)]-et[I(t)]||(e.created||0)-(t.created||0)}function se(e,t){var n=x(t),i=[];return(e||[]).forEach(function(r){!r||r.type==="advadj"||r.type==="salpay"||r.type==="pettyl"||n&&Ot(r)!==n||Tt(r).forEach(function(a){I(a)&&i.push(a)})}),i.sort(tt)}function W(e,t){var n=se(e,t),i=Ge(e,t);return i.length?n.concat(i).sort(tt):n}function xe(e,t){var n={};return W(e,t).forEach(function(i){var r=K(i),a=G(i);Object.keys(r).forEach(function(s){var o=r[s],p=a.filter(function(g){return g.a==="p:"+s});if(p.length){var l=n[s]||(n[s]={key:s,name:o,bal:0,n:0,last:""});p.forEach(function(g){l.bal=c(l.bal+g.dr-g.cr)}),l.n++,l.last=i.date||l.last,i.buyer&&i.buyer.phone&&(l.phone=i.buyer.phone)}})}),n}function Xt(e,t,n){var i={};return W(e,t).forEach(function(r){n&&r.date>n||G(r).forEach(function(a){i[a.a]=c((i[a.a]||0)+a.dr-a.cr)})}),i}function $(e,t,n){var i=se(e,t).filter(function(u){return!n||K(u)[n]}),r={},a={},s=[],o=ot(t);function p(u){return x(M(u))}var l={};i.forEach(function(u){I(u)==="refund"&&u.rv&&(l[p(u)+"|"+x(u.rv)]=u.id)});function g(u,y,b){if(!(b<=0)){var m={id:u.id,no:u.no||u.billNo||"",date:u.date,due:u.due||"",side:y,total:c(b),left:c(b),type:u.type,kind:u.kind,party:M(u),by:[]};(r[p(u)]=r[p(u)]||[]).push(m),a[u.id]=m}}i.forEach(function(u){var y=I(u),b;if(y==="jv"||u.gen){(u.lines||[]).forEach(function(m,d){if(!(m.a!=="party"||!String(m.party||"").trim())){var E=x(m.party),A=m.side==="pay",L={id:u.id+"#"+d,no:u.no,date:u.date,due:m.due||"",type:u.gen?u.type:"jv",kind:u.gen?"gen":"",buyer:{name:String(m.party).trim()}};n&&E!==n||(f(m.dr)&&(A?s.push({side:"pay",amt:f(m.dr),d:L,alloc:m.alloc}):g(L,"recv",f(m.dr))),f(m.cr)&&(A?g(L,"pay",f(m.cr)):s.push({side:"recv",amt:f(m.cr),d:L,alloc:m.alloc})))}});return}if(M(u)){if(y==="fabuy"){u.mode==="credit"&&g(u,"pay",f(u.amount)+f(u.gstAmt));return}if(y==="fasale"){u.mode==="credit"&&g(u,"recv",f(u.amount)+f(u.gstAmt));return}y==="sale"?(b=D(u).total,g(u,"recv",b),u.status==="paid"&&!u.paidBy?s.push({side:"recv",amt:b,to:u.id,date:u.date}):ge(u,b)>0?s.push({side:"recv",amt:ge(u,b),to:u.id,date:u.date}):f(u.exch)>0&&s.push({side:"recv",amt:Math.min(f(u.exch),b),to:u.id,date:u.date})):y==="sdeb"?g(u,"recv",D(u).total):y==="buy"?(b=D(u),g(u,"pay",u.type==="self"?b.taxable:c(b.total-P(u))),u.type==="self"&&u.status==="sipaid"&&s.push({side:"pay",amt:b.taxable,to:u.id,date:u.date})):y==="exp"&&u.mode==="credit"?g(u,"pay",c(f(u.amount)-P(u))):y==="ob"&&u.side!=="cash"&&u.side!=="bank"?ct(u).forEach(function(m){g(m[0],u.side==="pay"?"pay":"recv",m[1])}):y==="in"?s.push({side:"recv",amt:f(u.amount)+f(u.tds)+f(u.disc),alloc:u.alloc,d:u,first:l[p(u)+"|"+x(u.no)]}):y==="wo"?s.push({side:u.side==="pay"?"pay":"recv",amt:f(u.amount),alloc:u.alloc,d:u}):y==="refund"?g(u,"recv",f(u.amount)):y==="sret"?s.push({side:"recv",amt:D(u).total,origNo:u.orig&&u.orig.no,d:u,alloc:u.alloc}):y==="out"?s.push({side:"pay",amt:(u.lines||[]).reduce(function(m,d){return m+f(d.amt)},0)+f(u.disc),alloc:u.alloc,d:u}):y==="pret"&&s.push({side:"pay",amt:D(u).total,origNo:u.orig&&u.orig.no,d:u,alloc:u.alloc})}});var v={},h={};s.forEach(function(u){var y=c(u.amt),b=u.d?p(u.d):null,m=u.d?{id:u.d.id,no:u.d.no||"",date:u.d.date,type:u.d.type,kind:u.d.kind,pname:M(u.d)}:{id:u.to,no:"",date:u.date,type:"paid"};function d(E,A){var L=c(Math.min(E.left,A??y,y));L>0&&(E.left=c(E.left-L),y=c(y-L),E.by.push(Object.assign({amt:L},m)))}if(u.to&&a[u.to]){d(a[u.to]);return}u.first&&a[u.first]&&d(a[u.first]),(u.alloc||[]).forEach(function(E){var A=a[E.id];A&&A.side===u.side&&d(A,f(E.amt))}),u.origNo&&(r[b]||[]).forEach(function(E){E.side===u.side&&x(E.no)===x(u.origNo)&&d(E)}),o||(r[b]||[]).forEach(function(E){y>0&&E.side===u.side&&d(E)}),y>0&&b&&(v[b]=v[b]||{recv:0,pay:0},v[b][u.side]=c(v[b][u.side]+y),(h[b]=h[b]||{recv:[],pay:[]})[u.side].push(Object.assign({left:y},m)))}),o||Object.keys(v).forEach(function(u){["recv","pay"].forEach(function(y){(r[u]||[]).forEach(function(b){if(v[u][y]>0&&b.side===y&&b.left>0){var m=Math.min(b.left,v[u][y]);b.left=c(b.left-m),v[u][y]=c(v[u][y]-m),(h[u]&&h[u][y]||[]).forEach(function(d){var E=c(Math.min(d.left,m));E>0&&(d.left=c(d.left-E),m=c(m-E),b.by.push({id:d.id,no:d.no,date:d.date,type:d.type,kind:d.kind,amt:E,adv:1}))})}})})});var k=[],S=[];Object.keys(r).forEach(function(u){r[u].forEach(function(y){S.push(y),y.left>.004&&k.push(y)})});var w=[];return Object.keys(h).forEach(function(u){["recv","pay"].forEach(function(y){h[u][y].forEach(function(b){b.left>.004&&w.push(Object.assign({party:b.pname||u,pkey:u,side:y},b,{left:c(b.left)}))})})}),{bills:k,advances:v,every:S,onacc:w,strict:o}}function oe(e,t){return Math.round((new Date(t+"T00:00:00")-new Date(e+"T00:00:00"))/864e5)}function Se(e,t,n){var i=[0,0,0,0];return e.forEach(function(r){var a=oe(n&&r.due?r.due:r.date,t),s=a<=30?0:a<=60?1:a<=90?2:3;i[s]=c(i[s]+r.left)}),i}function Ft(e,t,n){return c(e.reduce(function(i,r){var a=r.due||(n?X(r.date,n):"");return a&&a<t?i+r.left:i},0))}function X(e,t){var n=new Date(e+"T00:00:00");return n.setDate(n.getDate()+(+t||0)),n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")}function rt(e,t,n,i,r){var a="p:"+n,s=0,o=[],p;return W(e,t).forEach(function(l){if(K(l)[n]){var g=0,v=0;if(G(l).forEach(function(h){h.a===a&&(g+=h.dr,v+=h.cr)}),g=c(g),v=c(v),!(!g&&!v)){if(i&&l.date<i){s=c(s+g-v);return}r&&l.date>r||o.push({d:l,date:l.date,dr:g,cr:v})}}}),p=s,o.forEach(function(l){p=c(p+l.dr-l.cr),l.bal=p}),{open:s,rows:o,close:p,dr:c(o.reduce(function(l,g){return l+g.dr},0)),cr:c(o.reduce(function(l,g){return l+g.cr},0))}}var ce=typeof WeakMap<"u"?new WeakMap:null;function Zt(e,t,n){var i=e&&typeof e=="object",r=ce&&i?ce.get(e):null,a=t+"|"+n;if(r&&r[a]&&r[a].n===e.length)return r[a].v;var s=[];return W(e,t).map(function(o){return{d:o,date:N(n)&&o.mode==="cheque"&&o.chq&&o.chq.st==="ok"&&o.chq.on?o.chq.on:o.date}}).sort(function(o,p){return(o.date||"").localeCompare(p.date||"")}).forEach(function(o){var p=0,l=0;G(o.d).forEach(function(g){g.a===n&&(p+=g.dr,l+=g.cr)}),(p||l)&&s.push({d:o.d,date:o.date,dr:p,cr:l})}),ce&&i&&(r=r||{},r[a]={n:e.length,v:s},ce.set(e,r)),s}function Ht(e,t,n,i,r){var a=0,s=[];Zt(e,t,n).forEach(function(p){if(i&&p.date<i){a=c(a+p.dr-p.cr);return}r&&p.date>r||s.push({d:p.d,date:p.date,dr:c(p.dr),cr:c(p.cr)})});var o=a;return s.forEach(function(p){o=c(o+p.dr-p.cr),p.bal=o}),{open:a,rows:s,close:o}}function nt(e){var t=I(e);return{sale:"sales",fasale:"sales",sret:"notes",sdeb:"notes",in:"receipts",refund:"payments",out:"payments",outexp:"payments",buy:"purchases",pret:"purchases",exp:"purchases",fabuy:"purchases",jv:"journal",ob:"opening",contra:"journal",oinc:"receipts",taxpay:"payments",gstset:"journal",wo:"journal",pdd:"journal",advadj:"journal"}[t]||"other"}function Vt(e,t,n,i,r,a){var s=rt(e,t,n,i,r),o=a&&a.length?a:null;return s.rows.forEach(function(p){p.vt=nt(p.d)}),o&&(s.rows=s.rows.filter(function(p){return o.indexOf(p.vt)>=0})),s.dr=c(s.rows.reduce(function(p,l){return p+l.dr},0)),s.cr=c(s.rows.reduce(function(p,l){return p+l.cr},0)),s}function Kt(e,t,n,i){var r=i?e.filter(function(o){return!o.date||o.date<=i}):e,a=$(r,t,n),s=a.every.filter(function(o){return x(o.party)===n}).sort(function(o,p){return(o.date||"").localeCompare(p.date||"")});return{bills:s,advances:a.advances[n]||{recv:0,pay:0},due:{recv:c(s.reduce(function(o,p){return p.side==="recv"?o+p.left:o},0)),pay:c(s.reduce(function(o,p){return p.side==="pay"?o+p.left:o},0))}}}var _={debtors:"Sundry Debtors",creditors:"Sundry Creditors"};function je(e,t){var n=e&&e[t||"party"];return Array.isArray(n)?n:[]}function at(e,t){return je(e,"party").filter(function(n){return n.id===t})[0]}function we(e,t){for(var n=[],i={};e&&!_[e]&&!i[e];){i[e]=1;var r=at(t,e);if(!r)return n.length?n.concat(["debtors"]):[];n.push(e),e=r.under}return _[e]?n.concat([e]):n.concat(["debtors"])}function _t(e,t){e=e||{};var n=e.group,i=n?we(n,t):[];i.length||(n=e.role==="supplier"?"creditors":"debtors",i=[n]);var r=at(t,n);return{id:n,name:r?r.name:_[n],top:i[i.length-1]}}function Oe(e,t,n){return!t||e===t||we(e,n).indexOf(t)>=0}function Ae(e){var t=je(e,"party"),n=[];function i(r,a){t.filter(function(s){return s.under===r}).sort(function(s,o){return String(s.name).localeCompare(String(o.name))}).forEach(function(s){n.push({id:s.id,name:s.name,under:s.under,depth:a}),a<3&&i(s.id,a+1)})}return["debtors","creditors"].forEach(function(r){n.push({id:r,name:_[r],under:"",depth:0,builtin:1}),i(r,1)}),t.forEach(function(r){n.some(function(a){return a.id===r.id})||n.push({id:r.id,name:r.name,under:"debtors",depth:1})}),n}function Jt(e,t,n,i){var r={};return W(e,t).forEach(function(a){if(!(i&&a.date>i)){var s=K(a),o=G(a),p=I(a),l=n&&a.date<n;Object.keys(s).forEach(function(g){var v=o.filter(function(k){return k.a==="p:"+g});if(v.length){var h=r[g]||(r[g]={key:g,name:s[g],open:0,dr:0,cr:0,close:0,sales:0,buys:0});v.forEach(function(k){l?h.open=c(h.open+k.dr-k.cr):(h.dr=c(h.dr+k.dr),h.cr=c(h.cr+k.cr))}),!l&&(p==="sale"||p==="sdeb"?h.sales=c(h.sales+D(a).total):p==="sret"?h.sales=c(h.sales-D(a).total):p==="buy"?h.buys=c(h.buys+(a.type==="self"?D(a).taxable:D(a).total)):p==="pret"?h.buys=c(h.buys-D(a).total):p==="exp"&&a.mode==="credit"&&(h.buys=c(h.buys+f(a.amount))))}})}}),Object.keys(r).forEach(function(a){var s=r[a];s.close=c(s.open+s.dr-s.cr)}),r}function it(e,t){return t.some(function(n){return n.id===e})?e:"debtors"}function Yt(e,t,n){var i=Ae(n),r={};return Object.keys(e).forEach(function(a){var s=it(t(a)||"debtors",i);(r[s]=r[s]||[]).push(e[a])}),i.map(function(a){var s=(r[a.id]||[]).slice().sort(function(p,l){return p.name.localeCompare(l.name)}),o={open:0,dr:0,cr:0,close:0,n:0};return Object.keys(r).forEach(function(p){Oe(p,a.id,n)&&r[p].forEach(function(l){o.open=c(o.open+l.open),o.dr=c(o.dr+l.dr),o.cr=c(o.cr+l.cr),o.close=c(o.close+l.close),o.n++})}),Object.assign({},a,{rows:s,sum:o})})}function Qt(e,t,n,i,r){var a=Ae(n),s={};return e.forEach(function(o){var p=it(t(x(o.party))||"debtors",a);(s[p]=s[p]||[]).push(o)}),a.map(function(o){var p=[],l=[];Object.keys(s).forEach(function(h){Oe(h,o.id,n)&&s[h].forEach(function(k){(k.side==="pay"?l:p).push(k)})});var g=Se(p,i,r),v=Se(l,i,r);return Object.assign({},o,{recv:g,pay:v,rt:c(g[0]+g[1]+g[2]+g[3]),pt:c(v[0]+v[1]+v[2]+v[3])})})}function zt(e,t,n,i){var r=function(a){return t==="recv"?a.close:t==="pay"?-a.close:a[t]||0};return Object.keys(e).map(function(a){return e[a]}).filter(function(a){return r(a)>.004&&(!i||i(a.key))}).sort(function(a,s){return r(s)-r(a)}).slice(0,n||10).map(function(a){return Object.assign({value:c(r(a))},a)})}var st={};function er(e,t){st[x(e)]=t==="strict"}function ot(e){return!!st[x(e)]}function ct(e){var t=[],n=0;(Array.isArray(e.bills)?e.bills:[]).forEach(function(r,a){var s=c(f(r&&r.amt));s>0&&(n=c(n+s),t.push([{id:e.id+"#ob"+a,no:String(r.no||"").trim()||"Opening",date:r.date||e.date,due:r.due||"",type:"ob",kind:e.side,buyer:e.buyer,ob:e.id},s]))});var i=c(f(e.amount)-n);return(i>.004||!t.length)&&t.push([e,t.length?i:f(e.amount)]),t}var J={};function tr(e){J={},Object.keys(e||{}).forEach(function(t){J[x(t)]=e[t]||{}})}var Me={};function Be(e,t){var n=x(e);if(!n)return t;var i=(/^purchase/.test(t)?"purchases:":"sales:")+n;return Me[i]||(Me[i]=String(e).trim()),i}function rr(e){return Me[e]||""}function qe(e,t,n,i){var r={},a=[],s=0;function o(v,h){v in r||(r[v]=0,a.push(v)),r[v]=c(r[v]+h),s=c(s+h)}var p=e[n]||"";if(!p&&!(e.items||[]).some(function(v){return v&&(v[n]||J[x(v.desc)]&&J[x(v.desc)][n])}))return[[i,c(t)]];(e.items||[]).forEach(function(v){var h=v.qty===""||v.qty==null?1:f(v.qty),k=f(v.rate);if(!(!v.desc&&!k)){var S=J[x(v.desc)]||{};o(Be(v[n]||S[n]||p,i),c(h*k-h*k*f(v.disc)/100))}});var l=c(t-s);l&&o(Be(p,i),l);var g=a.map(function(v){return[v,r[v]]}).filter(function(v){return v[1]}).sort(function(v,h){return Math.abs(h[1])-Math.abs(v[1])});return g.length?g:[[i,c(t)]]}function nr(e){return e=String(e||""),e.indexOf("sales:")===0?"sales":e.indexOf("purchases:")===0?"purchases":e}function ut(e,t){return e.mode==="cheque"&&e.chq&&e.chq.st&&e.chq.st!=="ok"?t>=0?"chq-in":"chq-out":N(e.acct)?e.acct:e.acct==="cash"?"cash":C(e.mode,e.bacct)}function ar(e,t,n){var i=0;(e.lines||[]).forEach(function(a){var s=Ee(a);s&&(t(s,f(a.dr)),n(s,f(a.cr)),i=c(i+f(a.cr)-f(a.dr)))});var r=ut(e,i);i>0?t(r,i):i<0&&n(r,-i)}function ir(e){return c(Math.abs((e.lines||[]).reduce(function(t,n){return t+f(n.cr)-f(n.dr)},0)))}var ue=typeof WeakMap<"u"?new WeakMap:null;function ft(e,t){if(!t||!e||typeof e!="object")return e;var n=ue&&ue.get(e);if(n&&n.n===e.length&&n.v[t])return n.v[t];var i=e.some(function(r){return r&&r.date&&r.date>t})?e.filter(function(r){return r&&(!r.date||r.date<=t)}):e;return ue&&((!n||n.n!==e.length)&&(n={n:e.length,v:{}},ue.set(e,n)),n.v[t]=i),i}var fe=typeof WeakMap<"u"?new WeakMap:null;function sr(e,t){var n=fe&&e&&typeof e=="object"?fe.get(e):null;if(n&&n.n===e.length&&n.biz===t)return n;var i=$(e,t),r={};i.every.forEach(function(s){var o=x(s.party);(r[o]||(r[o]=[])).push(s)});var a={n:e&&e.length,biz:t,R:i,idx:r};return fe&&e&&typeof e=="object"&&fe.set(e,a),a}function or(e,t,n,i,r){r=r||{},i=i||"";var a=f(r.rate),s=i?ft(e||[],i):e||[],o=sr(s,t),p=[],l=0;return(n?o.idx[n]||[]:o.R.every).forEach(function(g){if(n&&x(g.party)!==n||r.side&&g.side!==r.side||g.type==="receipt"||g.type==="voucher")return;var v=g.due||(f(r.cdays)>0?X(g.date,f(r.cdays)):""),h=X(r.from==="date"?g.date:v||g.date,f(r.grace)),k=(g.by||[]).map(function(d){return{date:d.date&&d.date>g.date?d.date:g.date,amt:f(d.amt)}}).sort(function(d,E){return d.date.localeCompare(E.date)}),S=g.total,w=h,u=[],y=0,b=0;function m(d){var E=oe(w,d);if(!(!(E>0)||!(S>.004))){var A=c(S*a/100*E/365);u.push({from:w,to:d,days:E,bal:c(S),amt:A}),y=c(y+A),b+=E}}k.forEach(function(d){d.date>w&&(m(d.date),w=d.date),S=c(S-d.amt)}),i&&i>w&&m(i),!(!u.length&&!(g.left>.004))&&(l=c(l+y),p.push({id:g.id,no:g.no,date:g.date,due:v,start:h,party:g.party,side:g.side,total:g.total,left:g.left,days:b,interest:y,slices:u,type:g.type}))}),{bills:p,total:l,rate:a}}function cr(e,t,n,i,r,a){n=n||{},r=r||"";var s=x(n.name),o=(e||[]).filter(function(m){return m&&m.id!==a}),p=xe(o,t)[s]||{bal:0},l=f(n.climit),g=c(p.bal),v=c(g+f(i)),h=f(n.cdays),k=f(n.cgrace),S=null,w=0;s&&r&&$(o,t,s).bills.forEach(function(m){if(m.side==="recv"){var d=m.due||(h>0?X(m.date,h):"");if(d){var E=oe(X(d,k),r);E>w&&(w=E,S={id:m.id,no:m.no,date:m.date,due:d,left:m.left})}}});var u=l>0&&v>l+.004,y=w>0&&(h>0||!!(S&&S.due)),b=n.cpolicy==="block"?"block":"warn";return{limit:l,bal:g,after:v,over:u,oldest:S,overdueDays:w,late:y,policy:b,block:b==="block"&&(u||y),any:u||y}}function ur(e,t,n){var i=n?(e||[]).filter(function(l){return l&&(!l.date||l.date<=n)}):e||[],r=$(i,t),a=xe(i,t),s=[],o={};function p(l,g){return o[l]||(o[l]={name:g,recv:[],pay:[],net:0})}return r.bills.forEach(function(l){var g=p(x(l.party),l.party);g[l.side].push({no:l.no||"",date:l.date,due:l.due||"",amt:c(l.left)}),g.net=c(g.net+(l.side==="recv"?l.left:-l.left))}),r.onacc.forEach(function(l){var g=p(l.pkey,l.party);g.onacc=c((g.onacc||0)+(l.side==="recv"?-l.left:l.left)),g.net=c(g.net+(l.side==="recv"?-l.left:l.left))}),Object.keys(a).forEach(function(l){var g=p(l,a[l].name);g.bal=c(a[l].bal)}),Object.keys(o).forEach(function(l){var g=o[l],v=function(k){return c(k.reduce(function(S,w){return S+w.amt},0))};g.recv.length&&s.push({side:"recv",name:g.name,amount:v(g.recv),bills:g.recv}),g.pay.length&&s.push({side:"pay",name:g.name,amount:v(g.pay),bills:g.pay});var h=c((g.bal||0)-(g.net-(g.onacc||0)));Math.abs(h)>.004&&s.push({side:h>0?"recv":"pay",name:g.name,amount:Math.abs(h),bills:[]})}),s}var O={num:f,r2:c,key:x,role:I,itemTotals:D,postings:G,inBooks:W,parties:xe,accounts:Xt,taxPay:Qe,gstSet:ze,rcmTax:Ne,itcBlk:Ue,lineItc:We,provision:Wt,salSplit:de,dedKind:Xe,tdsBk:P,rentTotal:Fe,expAcct:ie,loanAcct:be,schedule:Ct,emiOf:Ze,loanLeft:Pt,addMonths:ke,SADV:ae,advTax:ye,advAdjust:Ge,inBooks0:se,GADV:me,bills:$,ageing:Se,overdue:Ft,chargeLines:wt,tcsRate:Te,tcsPan:Le,panOk:ve,addDays:X,mainRate:Ce,statement:rt,book:Ht,isExpInv:re,asInvoice:jt,daysBetween:oe,moneyAcct:C,payAcct:T,isBank:N,bankKey:ee,bankOf:Z,setBanks:dt,bankName:kt,bankList:Et,contraKind:xt,contraSide:V,bounced:te,partyName:M,partiesOf:K,jvAcct:Ee,vtype:nt,ledger:Vt,billwise:Kt,groupsOf:je,groupChain:we,partyGroup:_t,inGroup:Oe,groupTree:Ae,partyMoves:Jt,groupSummary:Yt,groupDues:Qt,topParties:zt,BUILTIN:_};O.setBillwise=er,O.isStrict=ot,O.obBills=ct,O.ledSplit=qe,O.setItemLedgers=tr,O.ledAcct=Be,O.ledName=rr,O.baseAcct=nr,O.genTotal=ir,O.genAcct=ut,O.interest=or,O.creditCheck=cr,O.openBillsAt=ur,O.stockRole=At,O.STK_SALE=Pe,O.stkAdj=Re,O.adjItc=Mt,O.ADJH=he;var Y=null;function lt(e,t){return function(n){if(!Y||!n||typeof n!="object")return t.apply(this,arguments);var i=Y.get(n);i||(i={},Y.set(n,i));for(var r=[].slice.call(arguments,1),a=e,s=0;s<r.length;s++){var o=r[s];if(o&&typeof o=="object"){var p=i.$ids||(i.$ids=[]),l=p.indexOf(o);l<0&&(p.push(o),l=p.length-1),a+="|#"+l}else a+="|"+(o===void 0?"~":String(o))}return Object.prototype.hasOwnProperty.call(i,a)?i[a]:i[a]=t.apply(this,arguments)}}O.memo=function(e){Y=e?new WeakMap:null},O.memoOn=function(){return!!Y},O.memoize=lt,O.upto=ft,["inBooks","parties","accounts","bills"].forEach(function(e){O[e]=lt(e,O[e])}),typeof module<"u"&&module.exports?module.exports=O:yt.NSBooks=O})(this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* staffcore.js */
try{/* NSStaff: the employee list (Accounts coverage WP-5), shared by the salary slip maker, the App (Staff, salary and loans) and
   My data. Kept in the data home as meta 'staff' = { emps: [{ id, name, biz (business name), code, desig, dept, doj, pan, uan, esi,
   bankName, bankAcc, bankIfsc, earn: [{ desc, amt }] (usual monthly pay), left (date the employee left), updated }] }.
   The list fills itself: saving a salary slip keeps that employee's details and pay (keep()); picking a name on a new slip
   fills the slip from the list (fillSlip()). An employee with no business belongs to every business. */
(function () {
  'use strict';
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  var EMPK = ['code', 'desig', 'dept', 'doj', 'pan', 'uan', 'esi', 'bankName', 'bankAcc', 'bankIfsc'];
  var M = null;
  function load() {
    return NSStore.meta('staff').then(function (m) { M = m && typeof m === 'object' && Array.isArray(m.emps) ? m : { emps: [] }; return M; })
      .catch(function () { M = M || { emps: [] }; return M; });
  }
  function save() { return NSStore.meta('staff', M); }
  function mineOf(list, biz) { var b = key(biz); return list.filter(function (e) { return !b || !e.biz || key(e.biz) === b; }); }
  /* employees of a business (all when no business is given), by name */
  function list(biz) { return load().then(function (m) { return mineOf(m.emps, biz).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }); }); }
  function forSlip(biz) { return list(biz).then(function (l) { return l.filter(function (e) { return !e.left; }); }); }
  function find(name, biz) { var k = key(name); return M ? mineOf(M.emps, biz).filter(function (e) { return key(e.name) === k; })[0] : null; }
  /* a new slip from the list: the employee's details and usual pay; days are left for this month */
  function fillSlip(doc, e) {
    doc.buyer = Object.assign(doc.buyer || {}, { name: e.name });
    doc.emp = {}; EMPK.forEach(function (k) { doc.emp[k] = e[k] || ''; });
    if (e.earn && e.earn.length) doc.earn = e.earn.map(function (l) { return { desc: l.desc, amt: String(l.amt == null ? '' : l.amt) }; });
    doc.days = ''; doc.paid = '';
  }
  /* after a salary slip is saved: add the employee, or bring the details and the usual pay up to date */
  function keep(doc) {
    return load().then(function (m) {
      var nm = String(doc.buyer && doc.buyer.name || '').trim(), b = String(doc.seller && doc.seller.name || '').trim(); if (!nm) return;
      var e = find(nm, b);
      if (!e) { e = { id: newId(), name: nm, biz: b }; m.emps.push(e); }
      EMPK.forEach(function (k) { var v = String((doc.emp || {})[k] || '').trim(); if (v) e[k] = v; });
      var earn = (doc.earn || []).filter(function (l) { return String(l.desc || '').trim() && num(l.amt); });
      if (earn.length) e.earn = earn.map(function (l) { return { desc: String(l.desc).trim(), amt: String(l.amt) }; });
      e.updated = Date.now();
      return save();
    }).catch(function () {});
  }
  function newId() { return 'emp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  /* add or change one employee (the App and My data forms); a name already in that business is refused */
  function put(e) {
    return load().then(function (m) {
      var clash = mineOf(m.emps, e.biz).filter(function (x) { return x.id !== e.id && key(x.name) === key(e.name); })[0];
      if (clash) return Promise.reject(new Error('dup'));
      var i = -1; m.emps.forEach(function (x, j) { if (x.id === e.id) i = j; });
      e = Object.assign({}, e, { id: e.id || newId(), updated: Date.now() });
      if (i >= 0) m.emps[i] = e; else m.emps.push(e);
      return save().then(function () { return e; });
    });
  }
  function remove(id) { return load().then(function (m) { m.emps = m.emps.filter(function (x) { return x.id !== id; }); return save(); }); }
  window.NSStaff = { load: load, list: list, forSlip: forSlip, find: find, fillSlip: fillSlip, keep: keep, put: put, remove: remove, EMPK: EMPK, key: key };
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* payrollcore.js */
try{/* NSPayroll: attendance, PF return (ECR text file) and ESI monthly contribution, pure functions (node scripts/test_payroll.js) plus the
   small store part that keeps attendance and the payroll settings in the data home (meta 'attendance', meta 'payroll').

   ATTENDANCE  meta 'attendance' = { months: { 'YYYY-MM': { <empId>: { d: { '1': 'P', '2': 'A', ... }, ot: hours } } },
                                     cfg: { wo: [0] (weekly-off weekdays, 0 = Sunday), hol: { 'YYYY-MM-DD': 'name' } } }
     codes  P present, A absent, H half day, PL paid leave, UL unpaid leave, HOL holiday, WO weekly off.  A day with no mark is
     weekly off / holiday when the settings say so, else "not marked" (never counted as paid until someone marks it).
     paid days = P + H/2 + PL + HOL + WO; the days before the joining date and after the leaving date are not paid.

   PF (ECR text file for the EPFO unified portal, one line per member, 11 fields joined by #~#):
     UAN, member name, gross wages, EPF wages, EPS wages, EDLI wages, EPF contribution (employee 12%), EPS contribution (8.33%),
     EPF-EPS difference (employer's own EPF share), NCP days (days not paid), refund of advances.
     EPF wages = basic up to the wage ceiling (or the whole basic when the employer pays on it), EPS and EDLI wages are capped at the ceiling.
     ***The field list was first taken from payroll vendors' descriptions; on 15 Nov 2026 it was compared with EPFO's own ECR FAQ
     (archived copy of epfo.gov.in): 11 fields joined by #~#, matching. The portal's information sheet was not read, so one real
     upload by the owner is still the final check; the rates and the ceiling are typed settings.***

   ESI (monthly contribution sheet of the ESIC employer portal; checked 15 Nov 2026 against ESIC's own MC_Template1.xls, archived copy):
     six text columns IP number (10 digits), IP name (letters and spaces only), days for which wages were paid or payable (whole days),
     total monthly wages, reason code (0-13, used when no days), last working day (needed for codes 2-6 and 10), saved as .xls. Employee 0.75% and employer 3.25% of wages, each rounded UP to the
     next rupee (Social Security (Central) Rules, 2026, rule 19, published 8 May 2026); no employee share when the average daily wage is
     Rs 176 or less (esic.gov.in/contribution, reviewed 4 Apr 2025); wage limit Rs 21,000 a month (typed setting: not confirmed from an
     official page on 14 Nov 2026); once covered, an employee stays covered to the end of the contribution period (Apr-Sep, Oct-Mar). */
(function (root) {
  'use strict';
  var N = {};
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(v) { return Math.round((v + 1e-9) * 100) / 100; }
  function rup(v) { return Math.round(v + 1e-9); }               /* to the nearest rupee, halves up */
  function up(v) { return Math.ceil(v - 1e-9); }                 /* to the next higher rupee */
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- attendance ---------- */
  var CODES = ['P', 'A', 'H', 'PL', 'UL', 'HOL', 'WO'], BASE = CODES.slice();
  var PAID = { P: 1, A: 0, H: 0.5, PL: 1, UL: 0, HOL: 1, WO: 1 };
  N.CODES = CODES;
  function dim(ym) { return new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); }
  function dow(ym, d) { return new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, d).getDay(); }
  function iso(ym, d) { return ym + '-' + pad(d); }
  N.daysIn = dim; N.weekday = dow; N.iso = iso;
  N.defaultCfg = function () { return { wo: [0], hol: {} }; };
  /* the code of one day: the mark, else NA (not employed that day), HOL, WO, or '' (not marked) */
  N.dayCode = function (rec, ym, d, cfg, emp) {
    var s = iso(ym, d); cfg = cfg || N.defaultCfg();
    if (emp && (emp.doj && s < emp.doj || emp.left && s > emp.left)) return 'NA';   /* not employed that day: a mark there is ignored */
    var m = rec && rec.d && rec.d[d]; if (m) return m;
    if (cfg.hol && cfg.hol[s]) return 'HOL';
    if ((cfg.wo || []).indexOf(dow(ym, d)) >= 0) return 'WO';
    return '';
  };
  N.summary = function (rec, ym, cfg, emp) {
    var n = dim(ym), c = { P: 0, A: 0, H: 0, PL: 0, UL: 0, HOL: 0, WO: 0, NA: 0, unmarked: 0 }, paid = 0, d, k;
    for (d = 1; d <= n; d++) {
      k = N.dayCode(rec, ym, d, cfg, emp);
      if (!k) c.unmarked++; else { c[k] = (c[k] || 0) + 1; paid += PAID[k] || 0; }
    }
    c.days = n; c.paid = r2(paid); c.lop = r2(n - paid); c.ot = r2(num(rec && rec.ot)); c.any = !!(rec && rec.d && Object.keys(rec.d).length);
    return c;
  };
  /* cycle one cell: unmarked > P > A > H > PL > UL > HOL > WO > unmarked */
  N.next = function (c) { var i = CODES.indexOf(c); return i < 0 ? CODES[0] : i === CODES.length - 1 ? '' : CODES[i + 1]; };
  N.setDay = function (rec, d, code) { rec.d = rec.d || {}; if (code) rec.d[d] = code; else delete rec.d[d]; return rec; };
  /* mark every day that is not marked and not a weekly off / holiday / outside employment as present */
  N.fillPresent = function (rec, ym, cfg, emp, today) {
    rec.d = rec.d || {};
    var cm = today ? String(today).slice(0, 7) : '', lim = !today || ym < cm ? dim(ym) : ym === cm ? +String(today).slice(8, 10) : 0;   /* with today given: not the days still to come (F6-6) */
    for (var d = 1; d <= lim; d++) if (!N.dayCode(rec, ym, d, cfg, emp)) rec.d[d] = 'P';
    return rec;
  };
  /* mark one day for many employees; days that are a weekly off / holiday are changed too (the caller chose that day) */
  N.markDay = function (month, ids, d, code) { ids.forEach(function (id) { month[id] = month[id] || { d: {} }; N.setDay(month[id], d, code); }); return month; };

  /* sheet: header [Employee, Code, 1..n, Present, Absent, Half days, Paid leave, Unpaid leave, Holidays, Weekly off, Paid days, Overtime hours] */
  N.sheetRows = function (ym, emps, month, cfg) {
    var n = dim(ym), head = ['Employee', 'Code'], d, rows = [];
    for (d = 1; d <= n; d++) head.push(String(d));
    head = head.concat(['Present', 'Absent', 'Half days', 'Paid leave', 'Unpaid leave', 'Holidays', 'Weekly off', 'Paid days', 'Overtime hours']);
    emps.forEach(function (e) {
      var rec = month && month[e.id] || {}, s = N.summary(rec, ym, cfg, e), row = [e.name, e.code || ''];
      for (d = 1; d <= n; d++) { var c = N.dayCode(rec, ym, d, cfg, e); row.push(c === 'NA' ? '' : c); }
      rows.push(row.concat([s.P, s.A, s.H, s.PL + LEAVE.reduce(function (x, t) { return x + (s[t.code] || 0); }, 0), s.UL, s.HOL, s.WO, s.paid, s.ot]));   /* leave types count as paid leave */
    });
    return [head].concat(rows);
  };
  var ALIAS = { P: 'P', PRESENT: 'P', '1': 'P', A: 'A', ABSENT: 'A', H: 'H', HD: 'H', HALF: 'H', '0.5': 'H', PL: 'PL', L: 'PL', CL: 'PL', EL: 'PL', SL: 'PL', UL: 'UL', LWP: 'UL', LOP: 'UL', HOL: 'HOL', HOLIDAY: 'HOL', WO: 'WO', OFF: 'WO', W: 'WO', '0': 'A' };
  /* rows read from a CSV/Excel file in the layout above (day columns are headed 1, 2, 3 ...). Matches the employee by code, else by name.
     Returns { month: {empId: rec}, matched, unknown: [names], bad: ['Name day 5: x'] }. A cell left empty stays unmarked. */
  N.parseSheet = function (rows, ym, emps) {
    var out = { month: {}, matched: 0, unknown: [], bad: [] }, hi = -1, i, n = dim(ym);
    for (i = 0; i < Math.min(rows.length, 15); i++) if (/^employee|^name/i.test(String(rows[i][0] || '').trim())) { hi = i; break; }
    if (hi < 0) { out.error = 'head'; return out; }
    var head = rows[hi].map(function (h) { return String(h).trim(); }), col = {}, otc = -1;
    head.forEach(function (h, c) { if (/^\d+$/.test(h) && +h >= 1 && +h <= n) col[+h] = c; if (/overtime|^ot\b/i.test(h)) otc = c; });
    if (!Object.keys(col).length) { out.error = 'days'; return out; }
    var byCode = {}, byName = {}; emps.forEach(function (e) { if (e.code) byCode[key(e.code)] = e; byName[key(e.name)] = e; });
    rows.slice(hi + 1).forEach(function (r) {
      var nm = String(r[0] || '').trim(); if (!nm) return;
      var e = byName[key(nm)] || (r[1] && byCode[key(r[1])]); if (!e) { out.unknown.push(nm); return; }
      var rec = { d: {}, ot: otc >= 0 ? num(r[otc]) : 0 };
      Object.keys(col).forEach(function (d) {
        var v = String(r[col[d]] == null ? '' : r[col[d]]).trim().toUpperCase(); if (!v) return;
        var c = ALIAS[v]; if (!c) { out.bad.push(nm + ' day ' + d + ': ' + v); return; }
        rec.d[d] = c;
      });
      out.month[e.id] = rec; out.matched++;
    });
    return out;
  };
  N.toCsv = function (rows) {
    return rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
  };
  /* the days for a salary slip: days in the month and paid days (null when nothing was marked for that employee) */
  N.slipDays = function (rec, ym, cfg, emp) {
    if (!rec || !rec.d || !Object.keys(rec.d).length) return null;
    var s = N.summary(rec, ym, cfg, emp); return { days: s.days, paid: s.paid, unmarked: s.unmarked, ot: s.ot };
  };

  /* ---------- PF ---------- */
  N.PF = { ceil: 25000, epf: 12, eps: 8.33, edli: 0.5, admin: 0.5, adminMin: 500, due: 15 };   /* due: EPF Scheme 2026 para 28(3), 15 days after the month (gazette G.S.R. 525(E)) */
  function pfCfg(c) { return Object.assign({}, N.PF, c || {}); }
  /* m: { uan, name, gross, basic, days, paid, noEps (employee not in the pension scheme, e.g. joined after 58), full (pay PF on the whole basic) } */
  N.pfLine = function (m, cfg) {
    cfg = pfCfg(cfg);
    var errs = [], uan = String(m.uan || '').replace(/\s/g, ''), basic = num(m.basic), gross = num(m.gross);
    if (!/^\d{12}$/.test(uan)) errs.push('uan');
    if (!(basic > 0)) errs.push('basic');
    var epfW = m.full ? basic : Math.min(basic, cfg.ceil), epsW = m.noEps ? 0 : Math.min(epfW, cfg.ceil), edliW = Math.min(epfW, cfg.ceil);
    epfW = rup(epfW); epsW = rup(epsW); edliW = rup(edliW);
    var epf = rup(epfW * cfg.epf / 100), eps = rup(epsW * cfg.eps / 100), diff = epf - eps;
    var ncp = Math.max(0, Math.round(num(m.days) - num(m.paid)));
    gross = rup(Math.max(gross, epfW));
    var name = String(m.name || '').replace(/#~#|[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!name) errs.push('name');
    return { ok: !errs.length, errs: errs, uan: uan, name: name, gross: gross, epfW: epfW, epsW: epsW, edliW: edliW, epf: epf, eps: eps, diff: diff, ncp: ncp, line: [uan, name, gross, epfW, epsW, edliW, epf, eps, diff, ncp, 0].join('#~#') };
  };
  N.pfFile = function (lines) { return lines.filter(function (l) { return l.ok; }).map(function (l) { return l.line; }).join('\r\n') + (lines.some(function (l) { return l.ok; }) ? '\r\n' : ''); };
  /* the challan: A/c 01 (employees' 12% and the employer's EPF share), A/c 10 (pension), A/c 02 (administration, minimum), A/c 21 (EDLI) */
  N.pfChallan = function (lines, cfg) {
    cfg = pfCfg(cfg);
    var L = lines.filter(function (l) { return l.ok; }), s = function (k) { return L.reduce(function (a, l) { return a + l[k]; }, 0); };
    var epfW = s('epfW'), edliW = s('edliW'), ee = s('epf'), er = s('diff'), eps = s('eps');
    var admin = L.length ? Math.max(cfg.adminMin, rup(epfW * cfg.admin / 100)) : 0, edli = rup(edliW * cfg.edli / 100);
    var a01 = { employee: ee, employer: er, total: ee + er };
    return { members: L.length, epfW: epfW, edliW: edliW, ac01: a01, ac10: eps, ac02: admin, ac21: edli, ac22: 0, total: a01.total + eps + admin + edli };
  };

  /* ---------- ESI ---------- */
  N.ESI = { ceil: 21000, ee: 0.75, er: 3.25, daily: 176 };
  function esiCfg(c) { return Object.assign({}, N.ESI, c || {}); }
  /* contribution period of a month: 'YYYY-04' .. 'YYYY-09' = Apr-Sep, else Oct-Mar; returns its first month */
  N.periodStart = function (ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7); return m >= 4 && m <= 9 ? y + '-04' : m >= 10 ? y + '-10' : (y - 1) + '-10'; };
  /* earlier months of the same period in which this employee's pay was within the limit => stays covered */
  N.covered = function (history, ym, cfg) {
    cfg = esiCfg(cfg); var from = N.periodStart(ym);
    return (history || []).some(function (h) { return h.ym >= from && h.ym < ym && num(h.gross) > 0 && num(h.gross) <= cfg.ceil; });
  };
  /* Sheet rules from ESIC's own "Sample MC Excel Template" (MC_Template1.xls, sheet "Instructions & Reason Codes", read 15 Nov 2026 from
     the Internet Archive copy of esic.in): every employee mapped to the employer must be in the sheet, also those with no wages (days 0 +
     a reason code); days are a whole number, fractions rounded UP; the IP name has only letters and spaces; the last working day is given
     only when days are 0 and the reason is 2, 3, 4, 5, 6 or 10 (it then leaves the employer's list); a reason with no last day leaves it
     blank; dates DD/MM/YYYY; the file is Excel 97-2003 (.xls) with every column as text. */
  var LASTDAY = { 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 10: 1 };
  N.ESI_LASTDAY = LASTDAY;
  /* m: { ip, name, gross, paid (days paid), days, covered, lastDay, reason } */
  N.esiLine = function (m, cfg) {
    cfg = esiCfg(cfg);
    var gross = num(m.gross), paid = num(m.paid), errs = [], ip = String(m.ip || '').replace(/\s/g, '');
    var applies = gross > 0 && (gross <= cfg.ceil || !!m.covered);
    var hasIp = /^\d{10}$/.test(ip), zero = !(gross > 0);
    if ((applies || (zero && ip)) && !hasIp) errs.push('ip');
    var daily = paid > 0 ? gross / paid : gross / 26, exempt = daily <= cfg.daily;
    var er = applies ? up(gross * cfg.er / 100) : 0, ee = applies && !exempt ? up(gross * cfg.ee / 100) : 0;
    var days = zero ? 0 : Math.max(0, Math.ceil(paid - 1e-9));
    var name = String(m.name || '').replace(/[^A-Za-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
    var inSheet = applies || (zero && hasIp);
    if (inSheet && !name) errs.push('name');
    var reason = days > 0 ? 0 : (num(m.reason) || 0);
    var lastDay = days === 0 && LASTDAY[reason] ? (m.lastDay || '') : '';
    if (days === 0 && LASTDAY[reason] && !lastDay) errs.push('lastday');
    return { ok: inSheet && !errs.length, applies: applies, errs: errs, ip: ip, name: name, days: days, wages: rup(gross), ee: ee, er: er, exempt: applies && exempt,
      reason: reason, lastDay: lastDay, over: gross > cfg.ceil && !!m.covered };
  };
  /* the headings exactly as in ESIC's template */
  N.ESI_HEAD = ['IP Number \n(10 Digits)', 'IP Name\n( Only alphabets and space )', 'No of Days for which wages paid/payable during the month', 'Total Monthly Wages',
    ' Reason Code for Zero workings days(numeric only; provide 0 for all other reasons- Click on the link for reference)', ' Last Working Day\n( Format DD/MM/YYYY  or DD-MM-YYYY)'];
  N.esiRows = function (lines) {
    return [N.ESI_HEAD].concat(lines.filter(function (l) { return l.ok; }).map(function (l) {
      return [l.ip, l.name, String(l.days), String(l.wages), String(l.days > 0 ? 0 : l.reason), l.lastDay ? l.lastDay.split('-').reverse().join('/') : ''];
    }));
  };
  N.esiChallan = function (lines) {
    var L = lines.filter(function (l) { return l.applies; }), s = function (k) { return L.reduce(function (a, l) { return a + l[k]; }, 0); };
    return { members: L.length, wages: s('wages'), ee: s('ee'), er: s('er'), total: s('ee') + s('er') };
  };
  /* reason codes for a month with no wages, as in ESIC's template (0 = no particular reason) */
  N.ESI_REASONS = [[0, 'Without reason'], [1, 'On leave'], [2, 'Left service'], [3, 'Retired'], [4, 'Out of coverage'], [5, 'Expired'], [6, 'Non implemented area'], [7, 'Compliance by immediate employer'],
    [8, 'Suspension of work'], [9, 'Strike / lockout'], [10, 'Retrenchment'], [11, 'No work'], [12, 'Does not belong to this employer'], [13, 'Duplicate IP']];

  /* ---------- leave types and balances (ERP round 2, T-B16) ----------
     meta 'payroll'.leave = { types: [{ code 'CL' | 'EL' | ..., name, perYear (days), accrue 'm' (perYear/12 a month worked) | 'y' (all at
     the start of the leave year, less for joiners) | 'w20' (1 day for every 20 days worked), carry (days that move to the next year),
     encash (paid out on leaving) }], yearStart (month the leave year starts, 1 = January), lateN (late marks that make a half day cut) }.
     Each type's code becomes an attendance mark (paid). Opening balances: meta 'attendance'.leave = { open: { <leave year>: { empId:
     { code: days } } } }. Leave taken beyond the balance is not paid: the salary run cuts those days. */
  var LEAVE = [];
  N.setLeave = function (types) {
    var seen = {};
    LEAVE = (types || []).filter(function (t) { var ok = t && /^[A-Z]{1,4}$/.test(t.code) && BASE.indexOf(t.code) < 0 && !seen[t.code]; if (ok) seen[t.code] = 1; return ok; });
    CODES.length = 0; BASE.forEach(function (c) { CODES.push(c); });   /* the array is kept (screens hold it): rebuilt from the fixed marks */
    LEAVE.forEach(function (t, i) { CODES.splice(CODES.indexOf('PL') + 1 + i, 0, t.code); PAID[t.code] = 1; ALIAS[t.code] = t.code; });
    return LEAVE;
  };
  N.BASE = BASE;
  N.leaveTypes = function () { return LEAVE.slice(); };
  N.leaveType = function (code) { return LEAVE.filter(function (t) { return t.code === code; })[0] || null; };
  N.leaveYear = function (ym, start) { start = +start || 1; var y = +ym.slice(0, 4), m = +ym.slice(5, 7); return String(m >= start ? y : y - 1); };
  function lyMonths(year, start, upto) { var out = [], m = +year + '-' + pad(+start || 1); while (m <= upto && out.length < 12) { out.push(m); var y = +m.slice(0, 4), mo = +m.slice(5, 7) + 1; if (mo > 12) { mo = 1; y++; } m = y + '-' + pad(mo); } return out; }
  /* Earned leave by the OSH Code (accrue 'w20'), Occupational Safety, Health and Working Conditions Code, 2020, s.32 (Bill 122 of 2020
     text and the Labour Ministry FAQ, read 19 Nov 2026): a worker who worked 180 days or more in a calendar year gets, in the next
     year, 1 day for every 20 days worked (s.32(1)(i)-(ii)); days of lay-off, maternity leave and leave taken count towards the 180 but
     earn nothing (s.32(1)(iii)); one who joined during the year qualifies with a quarter of the days left in that year (s.32(1)(v)); on
     leaving, leave due for the current year is paid even without the 180 days (s.32(1)(vi)).
     oshEarn(att, emp, year, start) -> { worked (P + H/2), counted (worked + leave taken), need, ok, earned, data (any attendance that year) } */
  N.oshEarn = function (att, emp, year, start, upto) {
    var months = lyMonths(year, start, upto || (+year + (+start > 1 ? 1 : 0)) + '-' + pad(((+start || 1) + 10) % 12 + 1)), acfg = att.cfg || N.defaultCfg(), worked = 0, counted = 0, data = false;
    months.forEach(function (m) {
      var rec = (att.months || {})[m] && att.months[m][emp.id]; if (rec && rec.d && Object.keys(rec.d).length) data = true;
      var sm = N.summary(rec, m, acfg, emp); worked += sm.P + sm.H / 2;
      counted += sm.P + sm.H / 2 + sm.PL + LEAVE.reduce(function (x, t) { return x + (sm[t.code] || 0); }, 0);
    });
    var first = months[0] + '-01', need = 180;
    if (emp.doj && emp.doj > first && emp.doj.slice(0, 7) <= months[months.length - 1]) {
      var last = months[months.length - 1] + '-' + pad(dim(months[months.length - 1])), left = Math.round((new Date(last + 'T00:00:00') - new Date(emp.doj + 'T00:00:00')) / 864e5) + 1;
      need = Math.ceil(left / 4);
    }
    worked = r2(worked); counted = r2(counted);
    return { worked: worked, counted: counted, need: need, ok: counted >= need, earned: counted >= need ? Math.floor(worked / 20) : 0, data: data };
  };
  /* balance of one type for one employee up to month 'upto' (included): { open, earned, taken, bal, before (available before 'upto'), month (taken in 'upto') };
     o.leaving: the employee leaves in 'upto', so this year's earned leave by the OSH Code is due too (s.32(1)(vi)) */
  N.leaveBal = function (att, emp, type, upto, cfg, o) {
    cfg = cfg || {}; var start = +cfg.yearStart || 1, year = N.leaveYear(upto, start), months = lyMonths(year, start, upto), acfg = att.cfg || N.defaultCfg();
    var open = num((((att.leave || {}).open || {})[year] || {})[emp.id] && att.leave.open[year][emp.id][type.code]), earned = 0, taken = 0, worked = 0, tm = 0, em = 0;
    months.forEach(function (m) {
      var first = m + '-01', last = m + '-' + pad(dim(m)); if (emp.doj && emp.doj > last || emp.left && emp.left < first) return;
      em++; var rec = (att.months || {})[m] && att.months[m][emp.id], s = N.summary(rec, m, acfg, emp), t = s[type.code] || 0;
      taken += t; if (m === upto) tm = t; worked += s.P + s.H / 2;
    });
    var osh = null;
    if (type.accrue === 'w20') {   /* earned on last year's work, only with 180 days (OSH Code s.32) */
      osh = N.oshEarn(att, emp, String(+year - 1), start); earned = osh.earned;
      if (o && o.leaving) { var cur = N.oshEarn(att, emp, year, start, upto); earned += Math.floor(cur.worked / 20); osh.now = Math.floor(cur.worked / 20); }
    }
    else if (type.accrue === 'y') { var jm = emp.doj && emp.doj.slice(0, 7) > months[0] ? 12 - (months.indexOf(emp.doj.slice(0, 7)) < 0 ? 0 : months.indexOf(emp.doj.slice(0, 7))) : 12; earned = r2(num(type.perYear) * jm / 12); }
    else earned = r2(num(type.perYear) / 12 * em);
    earned = r2(earned); var bal = r2(open + earned - taken);
    return { year: year, open: open, earned: earned, taken: taken, bal: bal, month: tm, before: r2(open + earned - (taken - tm)), osh: osh };
  };
  /* days of month ym to cut as unpaid: leave taken beyond the balance, and every lateN late marks = half a day */
  N.unpaidLeave = function (att, emp, ym, cfg) {
    var cut = 0, why = [];
    LEAVE.forEach(function (t) { var b = N.leaveBal(att, emp, t, ym, cfg); var x = Math.max(0, b.month - Math.max(0, b.before)); if (x) { cut += x; why.push(t.code + ' ' + x); } });
    var rec = (att.months || {})[ym] && att.months[ym][emp.id], ln = num(cfg && cfg.lateN);
    if (ln > 0 && rec && num(rec.late) >= ln) { var h = Math.floor(num(rec.late) / ln) / 2; cut += h; why.push('late ' + rec.late); }
    return { days: r2(cut), why: why };
  };
  /* the opening balance of next leave year: what is left now, at most 'carry' days */
  N.carryOver = function (att, emp, type, lastYm, cfg) { var b = N.leaveBal(att, emp, type, lastYm, cfg); return Math.max(0, Math.min(b.bal, type.carry == null || type.carry === '' ? b.bal : num(type.carry))); };

  /* ---------- store ---------- */
  N.Store = {
    att: function () { return NSStore.meta('attendance').then(function (m) { m = m && typeof m === 'object' ? m : {}; m.months = m.months || {}; m.cfg = Object.assign(N.defaultCfg(), m.cfg || {}); return m; }).catch(function () { return { months: {}, cfg: N.defaultCfg() }; }); },
    saveAtt: function (m) { return NSStore.meta('attendance', m); },
    cfg: function () { return NSStore.meta('payroll').then(function (m) { m = m && typeof m === 'object' ? m : {}; m.pf = m.pf || {}; m.esi = m.esi || {}; m.flags = m.flags || {}; return m; }).catch(function () { return { pf: {}, esi: {}, flags: {} }; }); },
    saveCfg: function (m) { return NSStore.meta('payroll', m); },
    /* fill a slip's days and paid days from the attendance of its month (only boxes still empty); resolves true when it did */
    fillDays: function (doc, e, force) {
      if (!e || !doc || !doc.month) return Promise.resolve(false);
      return N.Store.att().then(function (m) {
        var sd = N.slipDays((m.months[doc.month] || {})[e.id], doc.month, m.cfg, e); if (!sd) return false;
        var did = false;
        if (force || !String(doc.days || '').trim()) { doc.days = String(sd.days); did = true; }
        if (force || !String(doc.paid || '').trim()) { doc.paid = String(sd.paid); did = true; }
        return did;
      }).catch(function () { return false; });
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = N; else root.NSPayroll = N;
})(typeof window !== 'undefined' ? window : this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* heads.js */
try{(function(o){"use strict";function r(e){return String(e||"").trim().toLowerCase().replace(/\s+/g," ")}var b=[["wages","Wages","dexp","emp","none","","factory wages|labour charges|majdoori|mazdoori|labour"],["freight_in","Freight and cartage inward","dexp","oth","rcm","194C","freight inward|carriage inward|cartage|freight in|cartage inward"],["transport","Transport and freight","dexp","oth","rcm","194C","freight|transport|transport charges"],["fuel","Fuel","dexp","oth","none","","diesel|petrol|fuel"],["power_f","Power and fuel (factory)","dexp","oth","ok","","factory power|factory electricity|power and fuel"],["jobwork","Job work charges","dexp","oth","ok","194C","job work|job charges|processing charges"],["loading","Loading and unloading","dexp","oth","ok","194C","hammali|loading|unloading"],["packing","Packing material","dexp","oth","ok","","packing|packaging"],["consum","Consumable stores","dexp","oth","ok","","consumables|stores and spares"],["customs","Customs duty on imports","dexp","oth","none","","customs|import duty|custom duty|basic customs duty"],["rent","Rent","iexp","oth","ok","194I","rent|shop rent|office rent|godown rent"],["power","Electricity","iexp","oth","ok","","electricity|electricity bill|light bill|bijli"],["salary","Salary and wages","iexp","emp","none","192","salary|salaries|staff salary"],["bonus","Bonus","iexp","emp","none","192","bonus|incentive to staff"],["pfesi","Employer's PF and ESI","iexp","emp","none","","pf|esi|provident fund|employer pf|employer esi|epf"],["welfare","Employee welfare","iexp","emp","blocked","","employee welfare|staff welfare|tea|refreshment|staff food"],["phone","Phone and internet","iexp","oth","ok","","telephone|mobile|internet|phone"],["repair","Repairs and maintenance","iexp","oth","ok","194C","repair|repairs|maintenance",1],["office","Office expenses","iexp","oth","ok","","office|general expenses"],["print","Printing and stationery","iexp","oth","ok","","stationery|printing"],["postage","Postage and courier","iexp","oth","ok","","courier|postage|post"],["travel","Travelling and conveyance","iexp","oth","ok","","travel|travelling|conveyance|local conveyance"],["vehicle","Vehicle running and repairs","iexp","oth","blocked","","car expenses|vehicle expenses|vehicle maintenance|car repair"],["bank","Bank charges","iexp","oth","ok","","bank charges|bank fees|bank commission"],["interest","Interest on loans","iexp","fin","none","194A","interest|interest paid|loan interest|od interest|cc interest"],["int_tax","Interest on late payment of tax","iexp","fin","none","","interest on gst|interest on tds|interest on tax"],["penalty","Late fee and penalty","iexp","oth","none","","late fee|penalty|gst late fee|tds late fee"],["prof","Professional fees","iexp","oth","ok","194J","professional charges|consultancy|ca fees|accountant fees"],["legal","Legal fees (advocate)","iexp","oth","rcm","194J","legal fees|advocate fees|lawyer fees"],["audit","Audit fees","iexp","oth","ok","194J","audit|audit fees"],["ads","Advertising","iexp","oth","ok","194C","advertisement|advertising|marketing|publicity"],["comm","Commission and brokerage paid","iexp","oth","ok","194H","commission|brokerage|commission paid"],["disc_all","Discount allowed","iexp","oth","none","","discount allowed|cash discount|discount given"],["bad_debt","Bad debts","iexp","oth","none","","bad debts|bad debt|bad debts written off"],["pdd_x","Provision for doubtful debts","iexp","oth","none","","provision for bad debts|provision for bad and doubtful debts"],["insure","Insurance","iexp","oth","ok","","insurance|insurance premium"],["rates","Rates, taxes and licence fees","iexp","oth","none","","rates and taxes|licence fees|municipal tax|property tax|trade licence"],["software","Software and subscriptions","iexp","oth","ok","","software|subscription|subscriptions"],["gifts","Gifts to customers","iexp","oth","blocked","","gifts|diwali gifts|gift"],["donation","Donations","iexp","oth","none","","donation|charity"],["dep","Depreciation","iexp","dep","none","","depreciation"],["loss_fa","Loss on sale of assets","iexp","oth","none","","loss on sale of assets|loss on sale of fixed assets"],["misc","Miscellaneous","iexp","oth","ok","","miscellaneous|misc|sundry expenses|other expenses"],["int_recd","Interest received","oinc","oinc","none","194A","interest received|interest income|fd interest|bank interest|savings interest"],["rent_recd","Rent received","oinc","oinc","inv","194I","rent received|rental income"],["comm_recd","Commission received","oinc","oinc","inv","194H","commission received|commission income|brokerage received"],["div","Dividend received","oinc","oinc","none","194","dividend|dividend income"],["disc_recd","Discount received","oinc","oinc","none","","discount received|cash discount received"],["scrap","Sale of scrap","oinc","oinc","inv","","scrap|scrap sale|kabaad"],["claim","Insurance claim received","oinc","oinc","none","","insurance claim|claim received"],["bd_recd","Bad debts recovered","oinc","oinc","none","","bad debts recovered|bad debt recovered"],["wback","Balances written back","oinc","oinc","none","","sundry balances written back|written back"],["grant","Subsidy and grants","oinc","oinc","none","","subsidy|grant|government subsidy"],["job_inc","Job work income","dinc","oinc","inv","194C","job work income|job work received|processing income"],["profit_fa","Profit on sale of assets","oinc","oinc","none","","profit on sale of assets|profit on sale of fixed assets"],["misc_inc","Miscellaneous income","oinc","oinc","none","","other income|miscellaneous income|misc income|sundry income"]],a=b.map(function(e){return{id:e[0],en:e[1],t:e[2],s3:e[3],gst:e[4],tds:e[5],alias:e[6]?e[6].split("|"):[],fa:!!e[7]}}),l={};a.forEach(function(e){l[e.id]=e});var s={rent:1,power:1,salary:1,transport:1,phone:1,repair:1,office:1,fuel:1,bank:1,prof:1,ads:1,misc:1},p=["dexp","iexp","oinc","dinc"],f={dexp:"Direct Expenses",iexp:"Indirect Expenses",dinc:"Direct Incomes",oinc:"Indirect Incomes"},c=[],t=null;function d(e){var n=o.NS;if(!n||!n.t)return"";var i=n.t(e);return i&&i!==e?i:""}function u(e){return e?e.custom?e.name:(s[e.id]?d("app.ex_"+e.id):d("hd."+e.id))||e.en:""}function x(){t={};function e(n,i){n=r(n),n&&!t[n]&&(t[n]=i)}c.forEach(function(n){e(n.name,n)}),a.forEach(function(n){e(n.en,n),e(n.id,n)}),a.forEach(function(n){e(u(n),n),s[n.id]&&e(d("app.ex_"+n.id),n),n.alias.forEach(function(i){e(i,n)})}),o.NS&&o.NS.EN&&a.forEach(function(n){var i=o.NS.EN[(s[n.id]?"app.ex_":"hd.")+n.id];i&&e(i,n)})}o.document&&o.document.addEventListener("ns-lang",function(){t=null});function m(e){c=(e||[]).filter(function(n){return n&&String(n.name||"").trim()&&p.indexOf(n.t)>=0}).map(function(n){var i=n.t;return{custom:!0,id:"c:"+r(n.name),name:String(n.name).trim(),en:String(n.name).trim(),t:i,s3:i==="oinc"||i==="dinc"?"oinc":n.s3||"oth",gst:n.gst||"ok",tds:n.tds||"",alias:[]}}),t=null}function v(e){t||x();var n=r(e).replace(/^(exp|inc):/,"");return n&&t[n]||null}function h(e){var n=a.concat(c);return e?n.filter(function(i){return e.indexOf(i.t)>=0}):n}function y(e){return!!e&&(e.t==="oinc"||e.t==="dinc")}function k(e){return e?f[e.t]:""}function w(e){return e?"393 (old "+e+")":""}var g={HEADS:a,TYPES:p,TALLY:f,APPCODE:s,byId:function(e){return l[e]||null},key:r,label:u,find:v,list:h,setCustom:m,custom:function(){return c.slice()},isIncome:y,tallyGroup:k,tdsLabel:w};typeof module<"u"&&module.exports&&(module.exports=g),o.NSHeads=g,o.NSStore&&o.NSStore.ready&&o.NSStore.ready().then(function(){return o.NSStore.meta("heads")}).then(function(e){e&&e.custom&&m(e.custom)}).catch(function(){})})(typeof window<"u"?window:globalThis);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* reuse.js */
try{(function(E){"use strict";function o(t){return String(t??"").trim().toLowerCase().replace(/\s+/g," ")}function f(t){var e=parseFloat(String(t??"").replace(/,/g,""));return isFinite(e)?e:0}function p(t){return Math.round((t+Number.EPSILON)*100)/100}var g={invoice:1,cashmemo:1,pharma:1,resto:1};function h(t){return t&&(t.type==="pbill",t.buyer&&t.buyer.name)||""}function v(t,e){return!e||o(t.seller&&t.seller.name)===o(e)}function C(t,e,a,n){var i=o(a),u=null;return(t||[]).forEach(function(r){var c=r.type||"invoice";!v(r,e)||o(h(r))!==i||!r.items||!r.items.length||(n==="buy"?!(c==="pbill"&&r.kind!=="return"):!g[c])||(!u||String(r.date)>String(u.date)||r.date===u.date&&String(r.created||"")>String(u.created||""))&&(u=r)}),u}function R(t){return{desc:t.desc||"",hsn:t.hsn||"",qty:f(t.qty)||1,unit:t.unit||"",rate:t.rate===""||t.rate==null?"":f(t.rate),gst:t.gst===""||t.gst==null?18:f(t.gst),disc:f(t.disc)||0}}function T(t){return!t||!t.items?null:{buyer:{name:h(t),gstin:t.buyer&&t.buyer.gstin||"",state:t.buyer&&t.buyer.state||""},items:t.items.filter(function(e){return String(e.desc||"").trim()}).map(function(e){var a=R(e);return{desc:a.desc,hsn:a.hsn,qty:a.qty,rate:a.rate,gst:a.gst}}),round:t.round!==!1,noGst:!!t.noGst}}function M(t,e,a,n){var i=o(a),u={};return(t||[]).forEach(function(r){var c=r.type||"invoice";!v(r,e)||o(h(r))!==i||!r.items||(n==="buy"?!(c==="pbill"&&r.kind!=="return"):!g[c])||r.items.forEach(function(l){var s=o(l.desc),m=f(l.rate);if(!(!s||!m)){var y=p(m-m*(f(l.disc)||0)/100);(!u[s]||String(r.date)>u[s].date)&&(u[s]={item:String(l.desc).trim(),rate:y,date:r.date})}})}),Object.keys(u).map(function(r){return u[r]}).sort(function(r,c){return r.item.localeCompare(c.item)})}function b(t,e,a,n,i,u){var r=o(a),c=o(n),l=[];return c?((t||[]).forEach(function(s){var m=s.type||"invoice";s.cancelled||!v(s,e)||r&&o(h(s))!==r||!s.items||(i==="buy"?!(m==="pbill"&&s.kind!=="return"||m==="self"):!(g[m]||m==="expinv"))||s.items.forEach(function(y){o(y.desc)!==c||!f(y.rate)||l.push({rate:p(f(y.rate)-f(y.rate)*(f(y.disc)||0)/100),date:s.date||"",no:s.no||"",type:m,party:h(s)})})}),l.sort(function(s,m){return String(m.date).localeCompare(String(s.date))}),l.slice(0,u||5)):l}function O(t,e,a){return b(t,e,"",a,"buy",1)[0]||null}function P(t,e){var a=o(e),n=t&&t.prices;if(!a||!n||!n.length)return null;for(var i=0;i<n.length;i++)if(o(n[i].item)===a&&f(n[i].rate)>0)return f(n[i].rate);return null}function q(t){var e=[],a={};return String(t||"").split(/\r?\n/).forEach(function(n){if(n=n.trim(),!!n){var i=/^(.*?)\s*(?:=|:|\||\t|-{1,2}>?)\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)\s*$/i.exec(n)||/^(.*\D)\s+([\d,]+(?:\.\d+)?)\s*$/.exec(n);if(!(!i||!i[1].trim()||!(f(i[2])>0))){var u={item:i[1].trim(),rate:p(f(i[2]))},r=o(u.item);a[r]!=null?e[a[r]]=u:(a[r]=e.length,e.push(u))}}}),e}function w(t){return(t||[]).map(function(e){return e.item+" = "+e.rate}).join(`
`)}var d={week:{days:7},fortnight:{days:14},month:{months:1},quarter:{months:3},half:{months:6},year:{months:12}};function S(t,e){var a=t.split("-"),n=+a[0],i=+a[1]-1+e,u=+a[2];n+=Math.floor(i/12),i=(i%12+12)%12;var r=new Date(Date.UTC(n,i+1,0)).getUTCDate();return n+"-"+String(i+1).padStart(2,"0")+"-"+String(Math.min(u,r)).padStart(2,"0")}function k(t,e){var a=new Date(t+"T00:00:00Z");return a.setUTCDate(a.getUTCDate()+e),a.toISOString().slice(0,10)}function D(t,e,a){var n=d[e];if(!n)return null;var i=n.days?k(t,n.days*a):S(t,n.months*a);return{date:i,period:n.days?i:i.slice(0,7)}}function A(t,e,a){var n=t&&t.rec;if(!n||!d[n.every]||n.stop||!t.date)return[];for(var i=[],u=Object.keys(e||{}).length,r=f(n.max),c=1;c<400;c++){var l=D(t.date,n.every,c);if(l.date>a||n.until&&l.date>n.until||r>0&&c>r)break;(!e||!e[l.period])&&i.push(l)}return r>0&&(i=i.slice(0,Math.max(0,r-u))),i.slice(-3)}var x={key:o,lastBill:C,orderAgain:T,lastRates:M,rateHistory:b,lastPurchase:O,partyRate:P,parsePrices:q,pricesText:w,dueDates:A,nth:D,FREQ:d,addMonths:S,addDays:k};typeof module<"u"&&module.exports?module.exports=x:E.NSReuse=x})(this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* extras.js */
try{(function(){"use strict";var a=window.NS,h=a.$,et=a.$$,c=a.esc;function m(t,n){return a.t("b1."+t,n)}function v(t){return a.num(t)}function k(t){return a.r2(t)}function D(t){return String(t||"").trim().toLowerCase().replace(/\s+/g," ")}function w(t){var n=new Date(t);return a.fmtDate(n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0"))+" "+String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")}a.when=w;function M(t,n){var e=document.getElementById(t);return e||(e=a.el("dialog",{id:t,class:"b1-dlg","aria-labelledby":t+"-h"}),e.innerHTML='<div class="dlg-h"><h2 id="'+t+'-h"></h2><form method="dialog"><button class="btn sm">'+c(a.t("close"))+'</button></form></div><div class="dlg-b"></div>',document.body.appendChild(e)),h("h2",e).textContent=n,e.open||(e.showModal?e.showModal():e.setAttribute("open","")),h(".dlg-b",e)}a.b1box=M;var K={add:"a_add",edit:"a_edit",del:"a_del",restore:"a_restore",import:"a_import"},O={cancel:"a_cancel",uncancel:"a_uncancel","restore-file":"a_restorefile","restore-files":"a_restorefile",wipe:"a_wipe",lock:"a_lock",meta:"a_meta",link:"a_link",binempty:"a_binempty"};function H(t){return O[t]?a.t("au."+O[t]):m(K[t]||"a_edit")}function X(t){var n=[];return t.why&&n.push('<span class="au-why">'+c(a.t("au.why"))+": "+c(t.why)+"</span>"),t.file&&n.push("<span>"+c(a.t("au.file"))+": "+c(t.file)+"</span>"),t.counts&&n.push("<span>"+c(Object.keys(t.counts).filter(function(e){return t.counts[e]}).map(function(e){return e+" "+t.counts[e]}).join(", ")||"0")+"</span>"),t.fileHash&&n.push('<span class="mono soft" title="SHA-256">'+c(t.fileHash.slice(0,16))+"…</span>"),t.ver&&n.push('<button type="button" class="link" data-au-ver="'+c(t.ver)+'">'+c(a.t("au.seever"))+"</button>"),n.length?'<div class="au-x">'+n.join(" · ")+"</div>":""}function q(t){return String(t).replace(/^items\.(\d+)\./,function(n,e){return m("itemn",{n:+e+1})+" · "}).replace(/^charges\.(\d+)\./,function(n,e){return m("chargen",{n:+e+1})+" · "})}a.logHtml=function(t,n){return t.length?'<ul class="b1-log">'+t.map(function(e){return'<li><div class="b1-lh"><b>'+c(H(e.act))+"</b>"+(n&&(e.no||e.name)?" · "+c([e.no,e.name].filter(Boolean).join(" · ")):"")+(e.act==="import"||e.act==="restore-file"||e.act==="link"?" · "+c(m("nrec",{n:e.n||0})):"")+'<span class="soft">'+c(w(e.at))+" · "+c(e.who||m("thisdev"))+" · "+c(e.site||"")+"</span></div>"+(e.ch&&e.ch.length?'<ul class="b1-ch">'+e.ch.slice(0,30).map(function(r){return"<li><span>"+c(q(r[0]))+"</span> <s>"+c(r[1]||"—")+"</s> → <b>"+c(r[2]||"—")+"</b></li>"}).join("")+(e.ch.length>30?"<li>…</li>":"")+"</ul>":"")+X(e)+"</li>"}).join("")+"</ul>":'<p class="soft">'+c(m("nolog"))+"</p>"},a.showLog=function(t,n){var e=M("ns-log",n||m("hist"));return e.innerHTML='<p class="soft">'+c(a.t("md.loading"))+"</p>",Promise.all([NSStore.list("log"),t?null:NSStore.lockDate({}).catch(function(){return""})]).then(function(r){var u=r[0].filter(function(o){return!t||o.rid===t}).sort(function(o,i){return i.at-o.at});e.innerHTML='<p class="soft">'+c(m("logp"))+"</p><div></div>",a.logView(e.lastChild,u,r[1]||"",!t)})},a.logView=function(t,n,e,r){function u(s){var d=n.filter(function(l){return!s||(s==="lock"?l.date&&e&&l.date<e&&l.act!=="add":s==="back"?a.backDated(l):s==="set"?l.store==="meta"||/^(lock|meta|wipe|binempty|restore-files?|link)$/.test(l.act):s==="cx"?/cancel/.test(l.act):!0)});h(".au-list",t).innerHTML=a.logHtml(d.slice(0,300),r)+(d.length>300?'<p class="soft">'+c(m("logmore",{n:d.length}))+"</p>":"")}t.innerHTML=(r?'<div class="au-tools"><label>'+c(a.t("au.show"))+' <select data-au-f><option value="">'+c(a.t("au.f_all"))+"</option>"+(e?'<option value="lock">'+c(a.t("au.f_lock",{d:a.fmtDate(e)}))+"</option>":"")+'<option value="back">'+c(a.t("au.f_back"))+'</option><option value="cx">'+c(a.t("au.f_cx"))+'</option><option value="set">'+c(a.t("au.f_set"))+'</option></select></label> <button type="button" class="btn sm" data-au-check>'+c(a.t("au.check"))+'</button><p class="au-res" role="status"></p></div>':"")+'<div class="au-list"></div>',u("");var o=h("[data-au-f]",t);o&&o.addEventListener("change",function(){u(o.value)});var i=h("[data-au-check]",t);i&&i.addEventListener("click",function(){a.checkLog(h(".au-res",t))})},a.backDated=function(t){if(!t||!t.date||t.act!=="add")return!1;var n=Date.parse(t.date+"T00:00:00");return isFinite(n)&&t.at-n>8*864e5},a.checkLog=function(t){return t.textContent=a.t("md.loading"),t.className="au-res",NSStore.logCheck().then(function(n){return n?n.ok?(t.textContent=a.t("au.ck_ok",{n:n.sealed})+(n.unsealed?" "+a.t("au.ck_old",{n:n.unsealed}):""),t.className="au-res ok",n):(t.className="au-res bad",t.innerHTML=c(a.t("au.ck_bad",{n:n.bad.length}))+"<ul>"+n.bad.slice(0,20).map(function(e){return"<li>"+c(e.kind==="changed"?a.t("au.ck_changed",{d:w(e.at)}):e.kind==="tail"?a.t("au.ck_tail",{d:w(e.at)}):a.t("au.ck_missing",{a:e.after?w(e.after):"—",b:w(e.at)}))+"</li>"}).join("")+"</ul>",n):(t.textContent=a.t("au.ck_local"),n)},function(){t.textContent=a.t("au.ck_local")})},a.showVersion=function(t){var n=M("ns-ver",a.t("au.vert"));return n.innerHTML='<p class="soft">'+c(a.t("md.loading"))+"</p>",NSStore.get("ver",t).then(function(e){if(!e||!e.rec){n.innerHTML='<p class="soft">'+c(a.t("au.vergone"))+"</p>";return}var r=e.rec,u=Array.isArray(r.items)?r.items:Array.isArray(r.lines)?r.lines:[],o=[];(function i(s,d){Object.keys(s||{}).forEach(function(l){if(!(!d&&/^(id|created|updated|items|lines)$/.test(l))){var f=s[l],p=d?d+"."+l:l;f&&typeof f=="object"?i(f,p):f!==""&&f!=null&&o.push([p,/^data:/.test(String(f))?"[picture]":String(f)])}})})(r,""),n.innerHTML='<p class="soft">'+c(a.t("au.verp",{d:w(e.at),w:e.who||m("thisdev"),a:H(e.act)}))+"</p>"+(u.length?'<div class="tbl-wrap"><table class="tbl au-vt"><thead><tr><th>#</th><th>'+c(a.t("au.v_desc"))+'</th><th class="n">'+c(a.t("au.v_qty"))+'</th><th class="n">'+c(a.t("au.v_rate"))+'</th><th class="n">GST %</th><th class="n">'+c(a.t("au.v_amt"))+"</th></tr></thead><tbody>"+u.map(function(i,s){return"<tr><td>"+(s+1)+"</td><td>"+c(i.desc||i.nm||i.a||i.head||"")+'</td><td class="n">'+c(i.qty==null?"":i.qty)+'</td><td class="n">'+c(i.rate==null?"":i.rate)+'</td><td class="n">'+c(i.gst==null?"":i.gst)+'</td><td class="n">'+c(i.amt!=null?i.amt:i.amount!=null?i.amount:i.qty!=null&&i.rate!=null?a.r2(v(i.qty)*v(i.rate)*(1-v(i.disc)/100)):"")+"</td></tr>"}).join("")+"</tbody></table></div>":"")+'<dl class="au-vd">'+o.slice(0,120).map(function(i){return"<dt>"+c(q(i[0]))+"</dt><dd>"+c(i[1].length>200?i[1].slice(0,197)+"...":i[1])+"</dd>"}).join("")+"</dl>"})},document.addEventListener("click",function(t){var n=t.target.closest&&t.target.closest("[data-au-ver]");n&&(t.preventDefault(),a.showVersion(n.getAttribute("data-au-ver")))}),a.guard=function(t){return t=t||{},NSStore.meta("pin").catch(function(){return null}).then(function(n){return t.nopin&&(n=null),!n&&!t.why?{why:""}:new Promise(function(e,r){var u=a.el("dialog",{class:"b1-dlg au-g","aria-labelledby":"au-g-h"});u.innerHTML='<form method="dialog" novalidate><div class="dlg-h"><h2 id="au-g-h"></h2></div><div class="dlg-b">'+(t.msg?'<p class="au-msg"></p>':"")+(n?'<div class="f"><label for="au-g-pin">'+c(m("pin"))+'</label><input id="au-g-pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" dir="ltr"></div>':"")+(t.why?'<div class="f"><label for="au-g-why">'+c(a.t(t.why==="need"?"au.whyneed":"au.whyask"))+'</label><textarea id="au-g-why" rows="2" maxlength="300"></textarea></div>':"")+'<p class="au-err bad" aria-live="assertive"></p><div class="quick"><button type="submit" class="btn '+(t.danger?"danger":"primary")+'" value="ok"></button> <button type="button" class="btn" data-no></button></div></div></form>',h("h2",u).textContent=t.title||a.t("au.confirm"),t.msg&&(h(".au-msg",u).textContent=t.msg),h("[type=submit]",u).textContent=t.ok||a.t("au.ok"),h("[data-no]",u).textContent=a.t("au.no"),document.body.appendChild(u);var o=!1;function i(s,d){if(!o)if(o=!0,u.close(),u.remove(),d){var l=new Error("closed");l.quiet=!0,r(l)}else e(s)}h("[data-no]",u).addEventListener("click",function(){i(null,!0)}),u.addEventListener("cancel",function(){i(null,!0)}),h("form",u).addEventListener("submit",function(s){s.preventDefault();var d=h("#au-g-why",u),l=d?d.value.trim():"",f=h(".au-err",u);if(t.why==="need"&&!l){f.textContent=a.t("au.whyreq"),d.focus();return}(n?a.pin.check(h("#au-g-pin",u).value):Promise.resolve(!0)).then(function(p){if(!p){f.textContent=m("pin_wrong"),h("#au-g-pin",u).value="",h("#au-g-pin",u).focus();return}i({why:l})})}),u.showModal?u.showModal():u.setAttribute("open",""),setTimeout(function(){var s=h("input,textarea",u);s&&s.focus()},30)})})},a.cancelDoc=function(t,n){if(n=n||{},!t||!t.id)return Promise.resolve(null);var e=[t.no,t.buyer&&t.buyer.name].filter(Boolean).join(" · ");return t.cancelled?a.uncancelDoc(t):a.guard({title:a.t("au.cxt",{n:e}),msg:a.t(n.fromDelete?"au.cxdel":"au.cxp"),why:"need",ok:a.t("au.cxok"),danger:1,nopin:1}).then(function(r){return NSStore.cancel(t.id,r.why)}).then(function(r){return a.toast(a.t("au.cxdone",{n:t.no||""})),document.dispatchEvent(new CustomEvent("ns-data")),r},function(r){return r.quiet||a.toast(r.message,"bad"),null})},a.uncancelDoc=function(t){return a.guard({title:a.t("au.uncxt",{n:t.no||""}),msg:a.t("au.uncxp"),why:"need",ok:a.t("au.uncxok")}).then(function(n){return NSStore.uncancel(t.id,n.why)}).then(function(n){return a.toast(a.t("au.uncxdone",{n:t.no||""})),document.dispatchEvent(new CustomEvent("ns-data")),n},function(n){return n.quiet||a.toast(n.message,"bad"),null})},a.cxPill=function(t){return t&&t.cancelled?' <span class="pill cx" title="'+c(t.cancelled.why||"")+'">'+c(a.t("au.cxpill"))+"</span>":""},a.cxBtn=function(t,n){if(!t||!t.id)return"";var e=a.t(t.cancelled?"au.uncxb":"au.cxb"),r=/(^|\s)ib(\s|$)/.test(n||"")&&a.icSvg;return'<button type="button" class="'+(n||"btn sm")+'" data-au-cx="'+c(t.id)+'" title="'+c(e)+'" aria-label="'+c(e)+'">'+(r?a.icSvg(t.cancelled?"reset":"x"):c(e))+"</button>"},document.addEventListener("click",function(t){var n=t.target.closest&&t.target.closest("[data-au-cx]");if(n){t.preventDefault(),t.stopPropagation();var e=n.hasAttribute("data-close-box")&&n.closest("dialog");e&&e.close(),NSStore.get("doc",n.getAttribute("data-au-cx")).then(function(r){r&&a.cancelDoc(r)})}},!0);function Y(){var t=document.querySelector("dialog#app-form[open]"),n=window.NSApp,e=t&&n&&n.vh&&n.vh().cur(),r=e&&e.rec,u=t&&t.querySelector(".dlg-foot");if(!(!u||u.querySelector("[data-au-cxf]")||!r||!r.id||!r.no)&&!(!r.cancelled&&!(window.NSBooks&&NSBooks.role(r))&&!/^(challan|note|cashmemo|self|expinv)$/.test(r.type||""))){var o=a.el("button",{type:"button",class:"btn"+(r.cancelled?"":" danger"),"data-au-cxf":r.id},c(a.t(r.cancelled?"au.uncxb":"au.cxb")));if(u.insertBefore(o,u.querySelector("[data-close]")),r.cancelled){Array.prototype.forEach.call(u.querySelectorAll("[type=submit]"),function(d){d.disabled=!0});var i=a.el("p",{class:"au-cxnote",role:"note"},'<span class="pill cx">'+c(a.t("au.cxpill"))+"</span> "+c(r.cancelled.why||"")),s=u.parentNode;s.insertBefore(i,s.firstChild)}o.addEventListener("click",function(){NSStore.get("doc",r.id).then(function(d){return d&&a.cancelDoc(d)}).then(function(d){d&&(t.removeAttribute("data-dirty"),a.vsLeave?a.vsLeave(null,t):t.close())})})}}var B=0;new MutationObserver(function(){B||(B=setTimeout(function(){B=0,Y()},30))}).observe(document.documentElement,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["open"]});function $(t){return btoa(String.fromCharCode.apply(null,new Uint8Array(t)))}function W(t){return Uint8Array.from(atob(t),function(n){return n.charCodeAt(0)})}function R(t,n){return crypto.subtle.importKey("raw",new TextEncoder().encode(String(t)),"PBKDF2",!1,["deriveBits"]).then(function(e){return crypto.subtle.deriveBits({name:"PBKDF2",salt:n,iterations:15e4,hash:"SHA-256"},e,256)}).then($)}var y="ns-unlocked",x="ns-pin-on";function S(t,n){try{if(n===void 0)return sessionStorage.getItem(t);n===null?sessionStorage.removeItem(t):sessionStorage.setItem(t,n)}catch{return null}}function N(t,n){try{if(n===void 0)return localStorage.getItem(t);n===null?localStorage.removeItem(t):localStorage.setItem(t,n)}catch{return null}}a.pin={get:function(){return NSStore.meta("pin")},set:function(t,n){var e=crypto.getRandomValues(new Uint8Array(16));return R(t,e).then(function(r){return N(x,"1"),S(y,String(Date.now())),NSStore.meta("pin",{salt:$(e),hash:r,mins:+n||15,on:Date.now()})})},mins:function(t){return NSStore.meta("pin").then(function(n){if(n)return n.mins=+t||15,NSStore.meta("pin",n)})},check:function(t){return NSStore.meta("pin").then(function(n){return n?R(t,W(n.salt)).then(function(e){return e===n.hash}):!0})},remove:function(){return N(x,null),NSStore.meta("pin",null)},lock:function(){return S(y,null),_()}};var P=15,E=Date.now(),C=0,j=0;function Z(){var t=h("#ns-lock");if(t)return t;t=a.el("div",{id:"ns-lock",role:"dialog","aria-modal":"true","aria-labelledby":"ns-lock-h"}),t.innerHTML='<form class="lk" novalidate><h2 id="ns-lock-h">'+c(m("pin_enter"))+'</h2><p class="soft">'+c(m("pin_why"))+'</p><label for="ns-lock-in" class="sr">'+c(m("pin"))+'</label><input id="ns-lock-in" type="password" inputmode="numeric" autocomplete="off" maxlength="8" dir="ltr"><p class="lk-msg" aria-live="assertive"></p><button type="submit" class="btn primary">'+c(m("unlock"))+'</button><button type="button" class="link" data-forgot>'+c(m("forgot"))+'</button><div class="lk-forgot" hidden><p>'+c(m("forgotp"))+'</p><button type="button" class="btn danger" data-erase>'+c(m("erase"))+'</button><label class="btn" data-rest hidden>'+c(a.t("md.restore"))+'<input type="file" accept=".json,application/json" hidden></label></div></form>',document.body.appendChild(t);var n=h("form",t),e=h("input",t),r=h(".lk-msg",t);return n.addEventListener("submit",function(u){if(u.preventDefault(),Date.now()<j){r.textContent=m("pin_wait",{n:Math.ceil((j-Date.now())/1e3)});return}a.pin.check(e.value).then(function(o){if(o){C=0,S(y,String(Date.now())),E=Date.now(),t.remove(),document.documentElement.classList.remove("pin-wait");return}C++,e.value="",r.textContent=m("pin_wrong"),C>=5&&(j=Date.now()+3e4,C=0,r.textContent=m("pin_wait",{n:30}))})}),h("[data-forgot]",t).addEventListener("click",function(){h(".lk-forgot",t).hidden=!1}),h("[data-erase]",t).addEventListener("click",function(){a.okSync(m("erase_c1"))&&prompt(a.t("my.wipe.c2"))==="DELETE"&&NSStore.importAll({},!0,{wipe:!0}).then(function(){N(x,null),S(y,String(Date.now())),h("[data-erase]",t).hidden=!0,h("[data-rest]",t).hidden=!1,r.textContent=m("erased")})}),h("[data-rest] input",t).addEventListener("change",function(u){var o=u.target.files[0];o&&a.restoreFromFile(o).then(function(){return a.pin.remove()}).then(function(){location.reload()},function(){})}),setTimeout(function(){e.focus()},30),t}function _(){return NSStore.meta("pin").then(function(t){var n=document.documentElement;if(!t)return N(x,null),n.classList.remove("pin-wait"),!1;N(x,"1"),P=+t.mins||15;var e=+S(y)||0;return e&&Date.now()-Math.max(e,E)<P*6e4?(n.classList.remove("pin-wait"),!1):(S(y,null),Z(),n.classList.remove("pin-wait"),!0)}).catch(function(){document.documentElement.classList.remove("pin-wait")})}function Q(){E=Date.now(),S(y)&&S(y,String(E))}function F(){return(document.getElementById("my-app")||document.getElementById("app"))&&!document.documentElement.classList.contains("embed")}F()&&N(x)==="1"&&!S(y)&&document.documentElement.classList.add("pin-wait");function G(){if(!F()){document.documentElement.classList.remove("pin-wait");return}NSStore.ready().then(_),["pointerdown","keydown"].forEach(function(t){document.addEventListener(t,Q,{passive:!0})}),setInterval(function(){S(y)&&Date.now()-E>P*6e4&&_()},3e4),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&!h("#ns-lock")&&_()})}a.sample={has:function(t){return["biz","party","item","doc"].some(function(n){return(t[n]||[]).some(function(e){return e.sample||/ \(sample\)$/.test(e.name||e.desc||"")})})},remove:function(){var t=0,n={};return NSStore.list("biz").then(function(e){return e.forEach(function(r){(r.sample||/ \(sample\)$/.test(r.name||""))&&(n[D(r.name)]=1)}),NSStore.list("doc")}).then(function(e){return Promise.all(e.filter(function(r){return!r.sample&&n[D(r.seller&&r.seller.name)]}).map(function(r){return t++,NSStore.del("doc",r.id).catch(function(){})}))}).then(function(){return Promise.all(["doc","party","item","biz"].map(function(e){return NSStore.list(e).then(function(r){return Promise.all(r.filter(function(u){return u.sample||/ \(sample\)$/.test(u.name||u.desc||"")}).map(function(u){return t++,NSStore.del(e,u.id,{hard:!0})}))})}))}).then(function(){return Promise.all([NSStore.list("party"),NSStore.list("item"),NSStore.meta("groups")]).then(function(e){var r=e[2];if(!(!r||typeof r!="object")){var u=e[0].concat(e[1]).map(function(i){return i.group}),o=!1;if(["party","item"].forEach(function(i){var s=Array.isArray(r[i])?r[i]:[];r[i]=s.filter(function(d){var l=d.sample&&u.indexOf(d.id)<0&&!s.some(function(f){return f.under===d.id&&!f.sample});return l&&(o=!0),!l})}),o)return NSStore.meta("groups",r)}})}).then(function(){return NSStore.list("biz")}).then(function(e){return NSStore.meta("settings").then(function(r){if(r&&r.defBiz&&!e.some(function(u){return u.id===r.defBiz}))return r.defBiz=e[0]?e[0].id:"",NSStore.meta("settings",r)})}).then(function(){return t})},note:function(){return'<div class="b1-sample" role="note"><span>'+c(m("samp_on"))+'</span><button type="button" class="btn sm" data-sample-rm>'+c(m("samp_rm"))+"</button></div>"}},document.addEventListener("click",function(t){var n=t.target.closest&&t.target.closest("[data-sample-rm]");!n||!a.okSync(m("samp_rmc"))||a.sample.remove().then(function(e){a.toast(m("samp_gone",{n:e})),document.dispatchEvent(new CustomEvent("ns-data"))})}),a.nextInvNo=function(t,n,e,r,u){return a.nextNo(t,{type:"invoice",seller:n||"",date:e,cfg:r||{},def:"INV",sub:u||""}).no};function U(t,n){var e=t.split("-"),r=+e[0],u=+e[1]-1+n,o=+e[2];r+=Math.floor(u/12),u=(u%12+12)%12;var i=new Date(r,u+1,0).getDate();return r+"-"+String(u+1).padStart(2,"0")+"-"+String(Math.min(o,i)).padStart(2,"0")}a.addMonths=U,a.recurringMade=function(t){var n={};return(t||[]).forEach(function(e){e&&e.recOf&&((n[e.recOf]||(n[e.recOf]={}))[e.recFor]=1)}),n},a.recurringDue=function(t,n){var e=[],r=(t||[]).filter(function(o){var i=o&&o.rec;return i&&i.every&&!i.stop&&o.date});if(!r.length)return e;var u=a.recurringMade(t);return r.forEach(function(o){var i=o.rec,s=u[o.id]||{},d=[];if(window.NSReuse)d=NSReuse.dueDates(o,s,n);else{for(var l=i.every==="quarter"?3:1,f=1;f<200;f++){var p=U(o.date,f*l);if(p>n||i.until&&p>i.until)break;var g=p.slice(0,7);s[g]||d.push({date:p,period:g})}d=d.slice(-3)}d.forEach(function(b){e.push({tpl:o,date:b.date,period:b.period})})}),e.sort(function(o,i){return o.date.localeCompare(i.date)})},a.repLabel=function(t){return a.t(t==="month"?"b1.rep_m":t==="quarter"?"b1.rep_q":"cap.rep_"+t)},a.recurringMake=function(t,n,e){var r=t.tpl,u=JSON.parse(JSON.stringify(r)),o=r.due?NSBooks.daysBetween(r.date,r.due):0;return["id","created","updated","rec","irn","einv","paidBy","invNo","nextNo","nextType","fromId"].forEach(function(i){delete u[i]}),u.date=t.date,u.due=r.due?NSBooks.addDays(t.date,o):"",u.status="unpaid",u.recOf=r.id,u.recFor=t.period,u.no=a.nextInvNo(n,r.seller&&r.seller.name,t.date,e),(a.creditAskDoc?a.creditAskDoc(u):Promise.resolve()).then(function(){return NSStore.put("doc",u)})};var z=["/assets/vendor/xlsx-0.20.3.full.min.js",""];function tt(t,n){for(var e=String(t).replace(/[\[\]:*?\/\\]/g," ").trim().slice(0,28)||"Sheet",r=e,u=2;n[e.toLowerCase()];)e=r.slice(0,25)+" "+u++;return n[e.toLowerCase()]=1,e}a.xlsx=function(t,n){return a.toast(m("xl_making")),a.loadJs(z[0],z[1]).then(function(){var e=window.XLSX,r=e.utils.book_new(),u={};n.forEach(function(o){var i=e.utils.aoa_to_sheet(o.rows.length?o.rows:[[m("xl_none")]]),s={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};Object.keys(i).forEach(function(d){if(!(d.charAt(0)==="!"||/^[A-Z]+1$/.test(d))){var l=i[d],f=typeof l.v=="string"&&/^(\d{2})-([A-Z][a-z]{2})-(\d{4})$/.exec(l.v);f&&s[f[2]]!=null?(l.t="n",l.v=Math.round((Date.UTC(+f[3],s[f[2]],+f[1])-Date.UTC(1899,11,30))/864e5),l.z="dd-mmm-yyyy"):l.t==="n"&&Math.round(l.v*100)!==Math.round(l.v)*100?l.z="#,##0.00":l.t==="n"&&Math.abs(l.v)>=1e3&&(l.z="#,##0")}}),i["!cols"]=(o.rows[0]||[]).map(function(d,l){return{wch:Math.min(48,Math.max(8,o.rows.reduce(function(f,p){return Math.max(f,String(p[l]==null?"":p[l]).length)},0)+2))}}),e.utils.book_append_sheet(r,i,tt(o.name,u))}),r.Props={Title:t.replace(/\.xlsx$/,""),Author:"Nivesh Sahayak",Company:"Nivesh Sahayak"},e.writeFile(r,t),a.toast(m("xl_saved",{file:t}))}).catch(function(){a.toast(m("xl_fail"),"bad")})};var L={invoice:"Invoice",cashmemo:"Cash memo",credit:"Credit note",debit:"Debit note",receipt:"Receipt",adv:"Advance received",ref:"Refund paid",voucher:"Payment",pbill:"Purchase bill",pret:"Purchase return",exp:"Expense",ob:"Opening balance",self:"Self invoice",pharma:"Pharmacy bill",resto:"Restaurant bill",lr:"Lorry receipt",fee:"Fee receipt",job:"Service bill",rabill:"RA bill",contra:"Contra"};L.jewel="Jewellery bill",L.garment="Garment bill",L.gjob="Service bill";function I(t){var n=t.type||"invoice";return L[n==="note"||n==="receipt"&&t.kind!=="pay"?t.kind:n==="pbill"&&t.kind==="return"?"pret":n]||n}function J(t,n,e){return(!n||t.date>=n)&&(!e||t.date<=e)}function T(t,n,e){if(t.length<2)return t;var r=t[0].map(function(u,o){var i=t.slice(1).filter(function(s){return typeof s[o]=="number"});return o<n||!i.length?"":i.reduce(function(s,d){return k(s+d[o])},0)});return r[0]=e||"Total",t.concat([r])}var nt=a.reports={sales:function(t,n,e){var r=NSBooks,u=[["Date","Document","Number","Party","GSTIN","State","Taxable value","CGST","SGST/UTGST","IGST","TCS","Round off","Total","Due date","Status"]];return t.filter(function(o){return/^(sale|sret|sdeb)$/.test(r.role(o))&&J(o,n,e)}).sort(function(o,i){return(o.date||"").localeCompare(i.date||"")}).forEach(function(o){var i=r.itemTotals(o),s=r.role(o)==="sret"?-1:1;u.push([a.fmtDate(o.date),I(o),o.no||"",r.partyName(o),o.buyer&&o.buyer.gstin||"",a.stateName(o.pos||o.buyer&&o.buyer.state||"")||"",s*i.taxable,s*i.cgst,s*i.sgst,s*i.igst,s*(i.tcs||0),s*i.round,s*i.total,a.fmtDate(o.due||""),o.status==="paid"?"Paid":r.role(o)==="sale"?"Not paid":""])}),{name:"Sales register",rows:T(u,6)}},purchases:function(t,n,e){var r=NSBooks,u=[["Date","Document","Bill number","Supplier / payee","GSTIN","Taxable value","CGST","SGST","IGST","TCS","Total","Paid"]];return t.filter(function(o){return/^(buy|pret|exp)$/.test(r.role(o))&&J(o,n,e)}).sort(function(o,i){return(o.date||"").localeCompare(i.date||"")}).forEach(function(o){if(o.type==="exp"){var i=v(o.amount),s=v(o.gst),d=o.itc&&s?k(i*s/(100+s)):0,l=o.inter?d:0,f=o.inter?0:k(d/2);u.push([a.fmtDate(o.date),"Expense: "+(o.cat||""),o.no||o.billNo||"",r.partyName(o),o.gstin||"",k(i-d),f,o.inter?0:k(d-f),l,0,i,o.mode==="credit"?"No":"Yes"]);return}var p=r.itemTotals(o),g=r.role(o)==="pret"?-1:1;u.push([a.fmtDate(o.date),I(o),o.no||"",r.partyName(o),o.buyer&&o.buyer.gstin||"",g*p.taxable,g*p.cgst,g*p.sgst,g*p.igst,g*(p.tcs||0),g*p.total,""])}),{name:"Purchase register",rows:T(u,5)}},dues:function(t,n,e,r,u){var o=NSBooks,i=o.bills(t,n),s={},d={};(e||[]).forEach(function(f){d[D(f.name)]=f}),i.bills.filter(function(f){return f.side===u}).forEach(function(f){var p=D(f.party);(s[p]=s[p]||{name:f.party,list:[]}).list.push(f)});var l=[[u==="recv"?"Customer":"Supplier","Phone","Credit limit","Credit days","0-30 days","31-60 days","61-90 days","Over 90 days","Total due","Past due date","Over credit limit"]];return Object.keys(s).sort(function(f,p){return s[f].name.localeCompare(s[p].name)}).forEach(function(f){var p=d[f]||{},g=s[f].list.map(function(A){return A.due||!p.cdays?A:Object.assign({},A,{due:o.addDays(A.date,p.cdays)})}),b=o.ageing(g,r,!0),V=k(b[0]+b[1]+b[2]+b[3]);l.push([s[f].name,p.phone||"",v(p.climit)||"",v(p.cdays)||"",b[0],b[1],b[2],b[3],V,o.overdue(g,r),v(p.climit)&&V>v(p.climit)?"Yes":""])}),{name:u==="recv"?"Dues to receive":"Dues to pay",rows:T(l,4)}},stock:function(t,n,e,r,u){var o=[["Item","Category","Unit","Opening","In","Out","Adjusted","Closing","Average cost","Value"]];if(!window.NSStock)return{name:"Stock summary",rows:o};var i={};return(n||[]).forEach(function(s){i[D(s.desc)]=s.cat||""}),NSStock.summary(t,n||[],e,r,u).items.forEach(function(s){o.push([s.name,i[s.k]||"",s.unit||"",s.open,s.inq,s.outq,s.adj,s.close,s.cost,s.value])}),{name:"Stock summary",rows:T(o,9)}},statement:function(t,n,e,r,u,o){var i=NSBooks.statement(t,n,e,u,o),s=function(l){return l},d=[["Date","Document","Number","Debit","Credit","Balance (+ they owe you)"]];return d.push([a.fmtDate(u),"Opening balance","","","",s(i.open)]),i.rows.forEach(function(l){d.push([a.fmtDate(l.date),I(l.d),l.d.no||"",l.dr||"",l.cr||"",l.bal])}),d.push(["","Closing balance","",i.dr,i.cr,i.close]),{name:r,rows:d}},items:function(t){var n=[["Item","Category","Item code","HSN/SAC","Unit","MRP","Retail rate","Wholesale rate","Purchase price","GST %"]];return(t||[]).slice().sort(function(e,r){return String(e.cat||"").localeCompare(String(r.cat||""))||String(e.desc).localeCompare(String(r.desc))}).forEach(function(e){n.push([e.desc,e.cat||"",e.code||"",e.hsn||"",e.unit||"",v(e.mrp)||"",v(e.rate)||"",v(e.wrate)||"",v(e.prate)||"",e.gst===""||e.gst==null?"":v(e.gst)])}),{name:"Items and prices",rows:n}},log:function(t){var n=[["When","Who","Site","Action","Record","Number","Name","Changes"]];return t.slice().sort(function(e,r){return e.at-r.at}).forEach(function(e){n.push([w(e.at),e.who||"This device",e.site||"",{add:"Added",edit:"Changed",del:"Deleted",restore:"Restored",import:"Backup restored"}[e.act]||e.act,e.type||e.store||"",e.no||"",e.name||"",(e.ch||[]).map(function(r){return r[0]+": "+(r[1]||"-")+" -> "+(r[2]||"-")}).join("; ")||(e.act==="import"?e.n+" records":"")])}),{name:"Edit history",rows:n}}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",G):G()})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* gstfetch.js */
try{(function(){"use strict";var o=window.NS=window.NS||{},i=function(a,r){return o.t(a,r)},l=function(a){return o.esc(a)},m="https://services.gst.gov.in/services/searchtp",S={C:"gf.h.C",P:"gf.h.P",F:"gf.h.F",H:"gf.h.H",A:"gf.h.A",T:"gf.h.T",B:"gf.h.B",L:"gf.h.L",J:"gf.h.J",G:"gf.h.G"};o.gstinFacts=function(a){a=String(a||"").toUpperCase().replace(/\s/g,"");var r=o.gstinCheck(a);if(!r.ok||r.empty)return null;var e=S[a[5]];return{gstin:a,state:r.state,pan:r.pan,holder:e?i(e):""}};var h=[["legal",/legal\s*name(\s*of\s*business)?/i],["trade",/trade\s*name/i],["since",/effective\s*date\s*of\s*registration|date\s*of\s*registration/i],["constitution",/constitution\s*of\s*business/i],["status",/gstin\s*\/?\s*uin\s*status|^status/i],["type",/taxpayer\s*type/i],["addr",/principal\s*place\s*of\s*business(\s*address)?/i]],A=/^(administrative\s*office|other\s*office|whether|nature\s*of|jurisdiction|state\s*jurisdiction|centre|center|date\s*of\s*cancellation|field\s*visit|e-?kyc|aadhaar|search\s*result|gstin\s*\/?\s*uin\s*:?$|core\s*business)/i;function w(a){return String(a||"").replace(/\r/g,"").split(/\n|\t{2,}/).map(function(r){return r.replace(/\s+/g," ").trim()}).filter(Boolean)}function k(a,r,e){var n=a[r].replace(e,"").replace(/^[\s:\-–]+/,"").trim();if(n)return n;for(var s=r+1;s<a.length&&s<r+3;s++){if(L(a[s]))return"";if(a[s]!==":")return a[s].replace(/^[\s:]+/,"")}return""}function L(a){return A.test(a)||h.some(function(r){return r[1].test(a)&&a.replace(r[1],"").replace(/[\s:]/g,"").length<2})}o.parseGstPortal=function(a){var r=w(a),e={};h.forEach(function(s){for(var c=0;c<r.length;c++)if(s[1].test(r[c])&&r[c].search(s[1])<3){var f=k(r,c,s[1]);if(f){e[s[0]]=f;break}}});var n=String(a||"").toUpperCase().match(/\b[0-9]{2}[A-Z0-9]{10}[0-9A-Z]Z[0-9A-Z]\b/);return n&&(e.gstin=n[0]),e.addr&&T(e),e.type&&(e.reg=/compos/i.test(e.type)?"comp":/sez/i.test(e.type)?"sez":/regular|normal/i.test(e.type)?"regular":""),e.name=(/propriet/i.test(e.constitution||"")&&e.trade?e.trade:e.legal)||e.trade||"",e};function T(a){var r=a.addr,e=r.match(/\b([1-9][0-9]{5})\b(?!.*\b[1-9][0-9]{5}\b)/);e&&(a.pin=e[1],r=r.replace(e[0],""));for(var n=r.split(",").map(function(u){return u.trim()}).filter(Boolean),s=function(u){return u.toLowerCase().replace(/[^a-z]/g,"")},c=n.length-1;c>=0&&c>=n.length-3;c--){var f=o.STATES.filter(function(u){return s(u[1])===s(n[c])})[0];if(f){a.state=f[0],n.splice(c,1);break}}if(n.length>1)for(a.city=n.pop(),n.length>1&&(a.district=a.city,a.city=n.pop());n.length>1&&s(n[n.length-1])===s(a.city);)n.pop();a.addr=n.join(", ")}var d;function E(){return d||(d=document.createElement("dialog"),d.className="gf-dlg",d.setAttribute("aria-labelledby","gf-t"),document.body.appendChild(d),d)}o.gstFetch=function(a,r){var e=o.gstinFacts(a);if(!e){o.toast(i("gf.first"),"bad");return}var n=E(),s=null;n.innerHTML='<div class="gf-hd"><h2 id="gf-t">'+l(i("gf.title"))+'</h2><button type="button" class="icon-btn" data-gf-x aria-label="'+l(i("close"))+'">✕</button></div><div class="gf-bd"><p class="gf-g mono" dir="ltr">'+l(e.gstin)+'</p><ul class="gf-facts"><li>'+l(i("gf.state"))+": <b>"+l(e.state+" · "+(o.stateLoc(e.state)||"—"))+'</b></li><li>PAN: <b class="mono">'+l(e.pan)+"</b></li>"+(e.holder?"<li>"+l(i("gf.holder"))+": <b>"+l(e.holder)+"</b></li>":"")+'</ul><ol class="gf-steps"><li>'+l(i("gf.s1"))+'<br><button type="button" class="btn primary" data-gf-open>'+l(i("gf.open"))+" ↗</button></li><li>"+l(i("gf.s2"))+"</li><li>"+l(i("gf.s3"))+'</li></ol><label class="gf-lbl" for="gf-paste">'+l(i("gf.paste"))+'</label><textarea id="gf-paste" rows="4" dir="auto" placeholder="'+l(i("gf.ph"))+'"></textarea><div data-gf-out aria-live="polite"></div></div><div class="gf-ft"><button type="button" class="btn primary" data-gf-ok disabled>'+l(i("gf.use"))+'</button><button type="button" class="btn" data-gf-x>'+l(i("my.cancel"))+"</button></div>";var c=n.querySelector("#gf-paste"),f=n.querySelector("[data-gf-out]"),u=n.querySelector("[data-gf-ok]");Array.prototype.forEach.call(n.querySelectorAll("[data-gf-x]"),function(t){t.onclick=function(){n.close()}}),n.querySelector("[data-gf-open]").onclick=function(){var t=function(){window.open(m,"_blank","noopener")};navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(e.gstin).then(function(){o.toast(i("gf.copied")),t()},t):t()};function b(t,v,p,g){return'<div class="f"><label for="gf-'+t+'">'+l(i(v))+'</label><input id="gf-'+t+'" data-k="'+t+'" value="'+l(p||"")+'"'+(g?' dir="ltr"':' dir="auto"')+"></div>"}function q(){var t=o.parseGstPortal(c.value);if(s=null,u.disabled=!0,!c.value.trim()){f.innerHTML="";return}if(!t.legal&&!t.trade){f.innerHTML='<p class="note bad">'+l(i("gf.none"))+"</p>";return}if(t.gstin&&t.gstin!==e.gstin){f.innerHTML='<p class="note bad">'+l(i("gf.other",{g:t.gstin}))+"</p>";return}t.gstin=e.gstin,t.state=t.state||e.state,t.state!==e.state&&(t.state=e.state);var v=t.status&&!/^active/i.test(t.status)?'<p class="note bad">'+l(i("gf.inactive",{s:t.status}))+"</p>":"";f.innerHTML=v+'<p class="soft">'+l(i("gf.check"))+'</p><div class="fg">'+b("name","gf.name",t.name)+(t.trade&&t.legal&&t.trade!==t.legal?'<p class="gf-alt wide"><button type="button" class="link" data-gf-alt>'+l(t.name===t.trade?i("gf.uselegal",{n:t.legal}):i("gf.usetrade",{n:t.trade}))+"</button></p>":"")+b("addr","l.addr",t.addr)+b("city","l.city",t.city)+b("pin","l.pin",t.pin,1)+'</div><ul class="gf-facts">'+[["gf.legal",t.legal],["gf.trade",t.trade],["gf.status",t.status],["gf.type",t.type],["gf.since",t.since],["gf.const",t.constitution]].filter(function(g){return g[1]}).map(function(g){return"<li>"+l(i(g[0]))+": <b>"+l(g[1])+"</b></li>"}).join("")+"</ul>";var p=f.querySelector("[data-gf-alt]");p&&(p.onclick=function(){var g=f.querySelector("#gf-name"),y=g.value!==t.trade;g.value=y?t.trade:t.legal,p.textContent=y?i("gf.uselegal",{n:t.legal}):i("gf.usetrade",{n:t.trade})}),s=t,u.disabled=!1}c.addEventListener("input",q),u.onclick=function(){if(s){if(Array.prototype.forEach.call(f.querySelectorAll("input[data-k]"),function(t){s[t.getAttribute("data-k")]=t.value.trim()}),!s.name){o.toast(i("hub.v.name"),"bad");return}s.checked=o.today(),n.close(),r(s)}},n.showModal?n.showModal():n.setAttribute("open",""),n.querySelector("[data-gf-open]").focus()},o.gstFetchButton=function(a,r){if(!a||a.getAttribute("data-gf"))return;a.setAttribute("data-gf","1");var e=document.createElement("button");e.type="button",e.className="link gf-btn",e.textContent=i("gf.btn"),e.hidden=!0;var n=a.parentNode.querySelector(".hint")||a;n.parentNode.insertBefore(e,n.nextSibling);function s(){e.hidden=!o.gstinFacts(a.value)}return a.addEventListener("input",s),a.addEventListener("gf-sync",s),s(),e.onclick=function(){o.gstFetch(a.value,r)},e}})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* cfields.js */
try{(function(g){"use strict";function y(t){return String(t??"").trim().toLowerCase().replace(/\s+/g," ")}function It(t){return String(t).padStart(2,"0")}var pt=["text","num","money","date","list","yesno","phone"],Kt=["invoice","cashmemo","quote","proforma","so","challan","po","note","self","expinv","pbill","receipt","voucher","exp","contra","jv","rent","salary","petty"],vt=["pharma","resto","lr","fee","job","rabill","jewel","garment","hotel","visit","svc","gjob","pump","mandi","dairy","amc","rentb","subs","tsh"],q={invoice:1,cashmemo:1,quote:1,proforma:1,so:1,challan:1,po:1,note:1,self:1,expinv:1,pbill:1},_e=["invoice","quote","proforma","so","challan","po","note","cashmemo","self"],mt=20,ht=10;function Vt(t){var e=[],n={};function i(r,a){(r||[]).forEach(function(o){!o||!o.id||!String(o.label||"").trim()||n[o.id]||(n[o.id]=1,e.push({id:o.id,label:String(o.label).trim(),on:(o.types&&o.types.length?o.types:_e).map(function(l){return"vt:"+l}),level:"head",type:"text",print:o.print?"meta":"none",carry:!0,biz:a?[a]:[],legacy:!0}))})}return t&&(i(t.cfields),Object.keys(t.byBiz||{}).forEach(function(r){i(t.byBiz[r]&&t.byBiz[r].cfields,r)})),e}function bt(t,e){var n=(t&&t.defs||[]).filter(function(r){return r&&r.id&&String(r.label||"").trim()}),i={};return n.forEach(function(r){i[r.id]=1}),n.concat(Vt(e).filter(function(r){return!i[r.id]}))}function gt(t,e){var n=t.on||[];return n.indexOf(e)>=0||e.indexOf("vt:")===0&&n.indexOf("vt:*")>=0&&(t.level!=="line"||q[e.slice(3)])}function w(t,e,n,i,r){return(t||[]).filter(function(a){return(r||!a.off)&&(a.level||"head")===(n||"head")&&gt(a,e)&&(!a.biz||!a.biz.length||!i||a.biz.indexOf(i)>=0)}).sort(function(a,o){return(+a.order||9999)-(+o.order||9999)||String(a.label).localeCompare(String(o.label))})}function L(t){return t&&t.type||"invoice"}function yt(t,e){var n=t&&t.type||"text";if(e!=null){if(n==="yesno"){if(e===!0||e===!1)return e;var i=y(e);return/^(yes|y|true|1|haan|ha)$/.test(i)?!0:/^(no|n|false|0|nahi)$/.test(i)?!1:void 0}var r=String(e).trim();if(r){if(n==="num"||n==="money"){var a=parseFloat(r.replace(/[,₹\s]/g,""));return isFinite(a)?n==="money"?Math.round(a*100)/100:a:void 0}if(n==="date"){if(/^\d{4}-\d{2}-\d{2}$/.test(r))return r;var o=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(r);return o?o[3]+"-"+It(o[2])+"-"+It(o[1]):void 0}return n==="phone"?(r=r.replace(/[^\d+\-\s]/g,"").trim(),r||void 0):r.slice(0,200)}}}function C(t,e,n){var i=yt(e,n);return t.cf=t.cf||{},i===void 0?delete t.cf[e.id]:t.cf[e.id]=i,Object.keys(t.cf).length||delete t.cf,t}function T(t,e){if(e==null||e==="")return"";var n=t&&t.type||"text";if(n==="yesno")return e===!0?"Yes":e===!1?"No":"";if(n==="date"&&/^\d{4}-\d{2}-\d{2}$/.test(String(e)))return String(e).slice(8,10)+"-"+String(e).slice(5,7)+"-"+String(e).slice(0,4);if(n==="money"){var i=+e;return isFinite(i)?i.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}):String(e)}return String(e)}function Y(t,e){return(t||[]).filter(function(n){if(!n.req)return!1;var i=e&&e[n.id];return i==null||i===""}).map(function(n){return n.label})}function xt(t,e){var n=[];return(e||[]).forEach(function(i,r){String(i&&i.desc||"").trim()&&Y(t,i.cf).forEach(function(a){n.push({line:r+1,label:a})})}),n}function Xt(t,e,n,i){var r={},a=t&&t.cf||{};return w(n,"vt:"+e,"head",i,!0).forEach(function(o){o.carry!==!1&&a[o.id]!=null&&a[o.id]!==""&&(r[o.id]=a[o.id])}),r}function W(t,e,n,i){var r=t&&t.cf||{};return w(e,"vt:"+L(t),"head",n,!0).filter(function(a){return(a.print||"meta")===(i||"meta")&&T(a,r[a.id])!==""}).map(function(a){return[a.label,T(a,r[a.id])]})}function Ut(t,e,n,i){var r=t&&t.cf||{};return w(n,"vt:"+L(e),"line",i,!0).filter(function(a){return(a.print||"note")!=="none"&&T(a,r[a.id])!==""}).map(function(a){return a.label+": "+T(a,r[a.id])}).join(" · ")}function Yt(t,e,n){var i=t&&t.cf||{};return w(e,"vt:"+L(t),"head",n,!0).filter(function(r){return T(r,i[r.id])!==""}).map(function(r){return r.label+": "+T(r,i[r.id])}).join("; ")}function Z(t,e,n){var i={},r=[];return(e||[]).forEach(function(a){w(t,a,"head",n,!0).forEach(function(o){o.filter&&!i[o.id]&&(i[o.id]=1,r.push(o))})}),r}function Wt(t,e,n){var i={};return(e||[]).forEach(function(r){i["vt:"+L(r)]=1}),Z(t,Object.keys(i),n)}function St(t,e,n){var i=t&&t.cf||{};return Object.keys(e||{}).every(function(r){var a=e[r];if(a==null||a===""||typeof a=="object"&&(a.from==null||a.from==="")&&(a.to==null||a.to===""))return!0;var o=(n||[]).filter(function(x){return x.id===r})[0]||{type:"text"},l=i[r];if(o.type==="yesno")return l===!0==(a===!0||a==="yes");if(typeof a=="object"){if(l==null||l==="")return!1;var s=o.type==="date",f=s?String(l):+l,m=a.from==null||a.from===""?null:s?String(a.from):+a.from,d=a.to==null||a.to===""?null:s?String(a.to):+a.to;return(m===null||f>=m)&&(d===null||f<=d)}return o.type==="list"?y(l)===y(a):y(T(o,l)).indexOf(y(a))>=0})}function Zt(t,e,n,i){var r=0,a=function(o){return o&&o[t]!=null&&o[t]!==""};return(e||[]).forEach(function(o){(a(o.cf)||(o.items||[]).some(function(l){return l&&a(l.cf)}))&&r++}),(n||[]).concat(i||[]).forEach(function(o){a(o&&o.cf)&&r++}),r}function Qt(t){var e;do e="f"+Math.random().toString(36).slice(2,6);while((t||[]).some(function(n){return n.id===e}));return e}function kt(t){var e={id:t.id,label:String(t.label||"").trim().slice(0,30),on:(t.on||[]).filter(Boolean),level:t.level==="line"?"line":"head",type:pt.indexOf(t.type)>=0?t.type:"text"};return e.type==="list"&&(e.opts=(Array.isArray(t.opts)?t.opts:String(t.opts||"").split(/[\n,]+/)).map(function(n){return String(n).trim()}).filter(function(n,i,r){return n&&r.indexOf(n)===i}).slice(0,60)),t.req&&(e.req=!0),e.type==="text"&&t.remember!==!1&&(e.remember=!0),e.print=e.level==="line"?t.print==="none"?"none":"note":t.print==="foot"||t.print==="none"?t.print:"meta",t.filter&&(e.filter=!0),e.carry=t.carry!==!1,t.last&&e.level==="head"&&(e.last=!0),e.biz=(t.biz||[]).filter(Boolean),t.off&&(e.off=!0),e.order=+t.order||0,e.level==="line"&&(e.on=e.on.filter(function(n){return n==="vt:*"||n.indexOf("vt:")===0&&q[n.slice(3)]})),e}function Jt(t,e){if(!t.label)return"label";if(!t.on.length)return"on";if(t.type==="list"&&!(t.opts||[]).length)return"opts";if((e||[]).some(function(i){return i.id!==t.id&&y(i.label)===y(t.label)&&i.level===t.level&&i.on.some(function(r){return t.on.indexOf(r)>=0})}))return"dup";var n=t.level==="line"?ht:mt;return t.on.some(function(i){return w(e,i,t.level).filter(function(r){return r.id!==t.id}).length>=n})?"max":""}var Rt=200,Ae=/^(payment against bill|payment on account|part advance|goods on credit|depreciation for fy|receipt against|opening balance)/i;function Et(t,e){return e=String(e??"").replace(/[ \t]+/g," ").trim(),!e||e.length>400||Ae.test(e)?"":/^km:/.test(t)?/^\d{1,4}$/.test(e)&&+e>0?e:"":/^\d[\d,.\s]*$/.test(e)||/^narr:/.test(t)&&(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\w{3}\b/.test(e)||/(^|\D)\d{10}(\D|$)/.test(e))?"":e}function tt(t,e){return(t.n||1)/(1+Math.max(0,(e||0)-(t.t||0))/864e5/30)}function Gt(t,e,n,i,r,a){if(n=Et(e,n),!n)return!1;t.v=1,t.k=t.k||{};var o=t.k[e]=t.k[e]||[],l=o.filter(function(s){return y(s.v)===y(n)})[0];return l&&a&&(l.d||[]).indexOf(a)>=0?(l.v=n,l.t=r,!0):(l?(l.v=n,l.n=(l.n||0)+1,l.t=r):o.push(l={v:n,n:1,t:r}),a&&(l.d=[a].concat((l.d||[]).filter(function(s){return s!==a})).slice(0,3)),i&&(l.p=(l.p||[]).filter(function(s){return s!==i}),l.p.unshift(i),l.p=l.p.slice(0,5)),o.length>Rt&&(o.sort(function(s,f){return tt(f,r)-tt(s,r)}),o.length=Rt),!0)}function te(t,e,n,i,r,a){var o=(t&&t.k&&t.k[e]||[]).filter(function(l){return!r||y(l.v).indexOf(y(r))>=0}).slice();return o.sort(function(l,s){var f=n&&(l.p||[]).indexOf(n)>=0?1:0,m=n&&(s.p||[]).indexOf(n)>=0?1:0;return m-f||tt(s,i)-tt(l,i)}),o.slice(0,a||8).map(function(l){return l.v})}function et(t,e,n){!t||!t.k||!t.k[e]||(n==null?delete t.k[e]:(t.k[e]=t.k[e].filter(function(i){return y(i.v)!==y(n)}),t.k[e].length||delete t.k[e]))}function wt(t,e,n,i,r){var a=y(n),o=null;return(t||[]).forEach(function(l){l.id===r||l.cancelled||L(l)!==e||y(l.buyer&&l.buyer.name)!==a||!l.cf||l.cf[i]==null||l.cf[i]===""||(!o||String(l.date)>String(o.date)||l.date===o.date&&(l.created||0)>(o.created||0))&&(o=l)}),o?o.cf[i]:void 0}function _t(t){var e=String(t&&t.seller&&t.seller.pin||"").replace(/\D/g,""),n=String(t&&(t.ship&&t.ship.pin||t.buyer&&t.buyer.pin)||"").replace(/\D/g,"");return/^\d{6}$/.test(e)&&/^\d{6}$/.test(n)?"km:"+e+"-"+n:""}function ee(t,e){if(!t||t.sample)return[];var n=L(t),i=[],r=function(o,l){l=Et(o,l),l&&i.push([o,l])};q[n]&&(r("notes:"+n,t.notes),r("terms:"+n,t.terms)),t.disp&&(r("disp.through",t.disp.through),r("disp.dest",t.disp.dest)),t.ship&&(r("ship.addr",t.ship.addr),r("ship.city",t.ship.city));var a=_t(t);return a&&t.einv&&r(a,t.einv.dist),n==="receipt"&&r("narr:receipt",t.purpose),n==="voucher"&&r("narr:voucher",t.lines&&t.lines[0]&&t.lines[0].desc),(n==="exp"||n==="contra")&&r("narr:"+n,t.notes),n==="jv"&&r("narr:jv",t.narr),(e||[]).forEach(function(o){!o.remember||(o.type||"text")!=="text"||(o.level==="line"?(t.items||[]).forEach(function(l){l&&l.cf&&r("cf:"+o.id,l.cf[o.id])}):t.cf&&r("cf:"+o.id,t.cf[o.id]))}),i}var ne={key:y,TYPES:pt,VTS:Kt,LINES:q,legacy:Vt,all:bt,defs:w,clean:yt,setCf:C,fmt:T,missing:Y,lineMissing:xt,carry:Xt,narr:Yt,printRows:W,lineText:Ut,cols:Z,colsFor:Wt,match:St,uses:Zt,newId:Qt,tidy:kt,invalid:Jt,KITS:vt,rcVal:Et,rcAdd:Gt,rcList:te,rcForget:et,rcFrom:ee,kmKey:_t,lastValue:wt,MAXH:mt,MAXL:ht};if(typeof module<"u"&&module.exports){module.exports=ne;return}if(!g.NS)return;var p=g.NS,E=p.$,nt=p.$$,c=p.esc;function u(t,e){return p.t("ufd."+t,e)}var v=[],rt=null,At=null,D=[],Q=[],Nt=[],re=null;function jt(){return g.NSStore?re=Promise.all([NSStore.meta("fields"),NSStore.meta("settings")]).then(function(t){rt=t[0]||{v:1,defs:[]},At=t[1]||{};var e=ie();v=bt(rt,At),M&&b&&ie()!==e&&lt()},function(){}):Promise.resolve()}function ie(){return v.map(function(t){return t.id+(t.off?"-":"")+t.label+t.type}).join("|")}var Lt=null;function it(){return g.NSStore?Lt=Promise.all([NSStore.list("doc"),NSStore.list("party"),NSStore.list("item")]).then(function(t){D=t[0]||[],Q=t[1]||[],Nt=t[2]||[]},function(){}):Promise.resolve()}var ae=0;function oe(){clearTimeout(ae),ae=setTimeout(function(){jt(),it()},400)}["ns-data","ns-saved"].forEach(function(t){document.addEventListener(t,oe)}),window.addEventListener("focus",oe);function B(t){try{return p.bizIdOf?p.bizIdOf(t):""}catch{return""}}function le(){var t=g.NSApp;return t&&t.biz&&t.biz()&&t.biz().id||""}function Ot(t,e,n,i){var r=t.type||"text",a=' id="'+n+'"'+(i||"")+(t.req?' aria-required="true"':"");if(r==="list")return"<select"+a+'><option value=""></option>'+(t.opts||[]).concat(e&&(t.opts||[]).indexOf(e)<0?[e]:[]).map(function(l){return"<option"+(l===e?" selected":"")+">"+c(l)+"</option>"}).join("")+"</select>";if(r==="yesno")return"<select"+a+'><option value=""></option><option value="yes"'+(e===!0?" selected":"")+">"+c(u("yes"))+'</option><option value="no"'+(e===!1?" selected":"")+">"+c(u("no"))+"</option></select>";var o=e==null?"":String(e);return r==="date"?'<input type="date"'+a+' value="'+c(o)+'">':r==="num"||r==="money"?"<input"+a+' inputmode="decimal" dir="ltr" autocomplete="off" value="'+c(o)+'">':r==="phone"?'<input type="tel"'+a+' inputmode="tel" dir="ltr" autocomplete="off" value="'+c(o)+'">':"<input"+a+' dir="auto" autocomplete="off" maxlength="200" value="'+c(o)+'"'+(t.remember?' data-recall="cf:'+c(t.id)+'"':"")+">"}function at(t,e,n){return e=e||{},t.map(function(i){var r=n+i.id;return'<div class="f cf-f"><label for="'+r+'">'+c(i.label)+(i.req?" *":"")+"</label>"+Ot(i,e[i.id],r,' data-cfid="'+c(i.id)+'"')+"</div>"}).join("")}function ot(t,e){var n={};return e.forEach(function(i){var r=t&&t.querySelector('[data-cfid="'+i.id+'"]');r&&C(n,i,r.value)}),n.cf||{}}function ce(t,e){var n=w(v,t,"head","");return n.length?'<fieldset class="card cf-box" data-cfbox="'+t+'"><legend>'+c(u("box"))+'</legend><div class="fg">'+at(n,e&&e.cf,"mcf-")+"</div></fieldset>":""}function ue(t,e,n){var i=e&&e.querySelector('[data-cfbox="'+t+'"]');if(!i)return!0;var r=w(v,t,"head",""),a=ot(i,r),o=Object.assign({},n.cf||{});r.forEach(function(s){a[s.id]!=null?o[s.id]=a[s.id]:delete o[s.id]}),Object.keys(o).length?n.cf=o:delete n.cf;var l=Y(r,n.cf);return l.length&&p.toast(u("need",{f:l.join(", ")}),"bad"),!0}(p.hubExt=p.hubExt||[]).push({form:function(t,e){return t==="party"||t==="item"?ce(t,e):""},read:function(t,e,n){(t==="party"||t==="item")&&ue(t,n,e)}});var b=null,M=null;function H(){return b?L(b.doc()):""}function Tt(){return b?B(b.doc().seller):""}function zt(){return b?w(v,"vt:"+H(),"head",Tt()):[]}function Ne(){return b&&q[H()]?w(v,"vt:"+H(),"line",Tt()):[]}function lt(){if(M){var t=zt();M.hidden=!t.length,E(".fg",M).innerHTML=at(t,b.doc().cf,"dcf-")}}p.docExt=p.docExt||[];var K={editor:function(t,e){return b=e,'<fieldset class="card cf-box" id="cf-mbox" hidden><legend>'+c(u("box"))+'</legend><div class="fg"></div></fieldset>'},wire:function(t){if(M=E("#cf-mbox",t),!!M){lt();var e=function(n){var i=n.target,r=i.getAttribute&&i.getAttribute("data-cfid");if(r){var a=v.filter(function(o){return o.id===r})[0];a&&(n.stopPropagation(),C(b.doc(),a,i.value),b.changed())}};M.addEventListener("input",e,!0),M.addEventListener("change",e,!0)}},fill:function(){lt()},sheet:function(t){for(var e=W(t,v,B(t.seller),"meta"),n="",i=0;i<e.length;i+=2)n+="<tr><th>"+c(e[i][0])+"</th><td"+(e[i+1]?"":' colspan="3"')+">"+c(e[i][1])+"</td>"+(e[i+1]?"<th>"+c(e[i+1][0])+"</th><td>"+c(e[i+1][1])+"</td>":"")+"</tr>";var r=W(t,v,B(t.seller),"foot");return(n?'<table class="meta cf-meta">'+n+"</table>":"")+(r.length?'<p class="cf-foot">'+r.map(function(a){return"<b>"+c(a[0])+":</b> "+c(a[1])}).join(" &nbsp; ")+"</p>":"")},line:function(t){var e=Ne();if(!e.length)return"";var n=t.it,i=t.i;return e.map(function(r){var a="it-cf"+r.id+"-"+i;return'<div class="f it-x cf-f"><label for="'+a+'">'+c(r.label)+(r.req?" *":"")+"</label>"+Ot(r,(n.cf||{})[r.id],a,' data-lcf="'+c(r.id)+'"')+"</div>"}).join("")},lineNote:function(t){var e=b?Ut(t,b.doc(),v,Tt()):"";return e?'<br><small class="ln-x cf-ln">'+c(e)+"</small>":""},block:function(t){var e=Y(w(v,"vt:"+L(t),"head",B(t.seller)),t.cf);if(e.length)return u("need",{f:e.join(", ")});var n=q[L(t)]?xt(w(v,"vt:"+L(t),"line",B(t.seller)),t.items):[];return n.length?u("needl",{n:n[0].line,f:n[0].label}):""}};p.docExt.push(K);function je(t){return K.editor(null,t)}function Le(t,e){var n=K.sheet(t);if(!n)return e;var i=e.lastIndexOf('<div class="signs');return i<0?e.replace(/<\/div>\s*$/,n+"</div>"):e.slice(0,i)+'<div class="cf-slip">'+n+"</div>"+e.slice(i)}document.addEventListener("input",se,!0),document.addEventListener("change",se,!0);function se(t){var e=t.target,n=e&&e.getAttribute&&e.getAttribute("data-lcf"),i=n&&e.closest(".it[data-i]");if(!(!i||!b)){var r=v.filter(function(o){return o.id===n})[0],a=b.doc().items[+i.getAttribute("data-i")];!r||!a||(t.stopPropagation(),C(a,r,e.value),b.changed())}}var V="",P=null,fe="",Oe={sale:"invoice",pbill:"pbill",pret:"pbill",min:"receipt",mout:"voucher",exp:"exp",contra:"contra",csale:"cashmemo"};function Te(t,e){return Oe[t]||(t==="vdoc"&&e&&e.vd?e.vd.ty==="exp"?"expinv":e.vd.ty:"")}function X(t){return w(v,"vt:"+t,"head",le())}function Dt(){return q[V]?w(v,"vt:"+V,"line",le()):[]}function de(t,e){var n=X(t);return(n.length?"<legend>"+c(u("box"))+'</legend><div class="fg">'+at(n,e,"fcf-")+"</div>":"")+'<p class="cf-add"><button type="button" class="link" data-cfnew="vt:'+c(t)+'">+ '+c(u("addf"))+"</button></p>"}function ze(t,e,n){var i=Te(t,e);return V=i,P=null,fe=n&&n.id||"",i?'<fieldset class="cf-box'+(X(i).length?"":" cf-empty")+'" data-cfbox="vt:'+c(i)+'">'+de(i,n&&n.cf)+"</fieldset>":""}function De(t,e){P=null;var n=t&&t.querySelector('[data-cfbox^="vt:"]');if(!n)return!0;var i=n.getAttribute("data-cfbox").slice(3),r=X(i),a=ot(n,r),o=Y(r,a);if(o.length){p.toast(u("need",{f:o.join(", ")}),"bad");var l=n.querySelector('[data-cfid="'+r.filter(function(d){return d.label===o[0]})[0].id+'"]');return l&&l.focus(),!1}var s=Dt(),f=e&&e.lines?e.lines.map(function(d){return{desc:d.desc,cf:pe(d)}}):[],m=xt(s,f);return m.length?(p.toast(u("needl",{n:m[0].line,f:m[0].label}),"bad"),!1):(P={type:i,cf:a,ids:r.map(function(d){return d.id}),at:Date.now()},!0)}function pe(t){var e=Object.assign({},t.cf||{});return Dt().forEach(function(n){var i="cf."+n.id;if(i in t){var r={};C(r,n,t[i]),r.cf?e[n.id]=r.cf[n.id]:delete e[n.id]}}),Object.keys(e).length?e:null}function Pe(){var t=g.NSApp;if(!(!t||t._cfl)){t._cfl=1;var e=t.lineX,n=t.lineCopy;t.lineX=function(i,r,a){var o=e&&e(i,r,a)||"",l=Dt();return l.length?o+l.map(function(s){var f="cf."+s.id;f in i||(i[f]=i.cf&&i.cf[s.id]!=null?s.type==="yesno"?i.cf[s.id]?"yes":"no":i.cf[s.id]:"");var m=s.type==="yesno"?yt(s,i[f]):i[f];return'<label class="lc lc-cf"><span>'+c(s.label)+(s.req?" *":"")+"</span>"+Ot(s,m,"lcf-"+s.id+"-"+r,' data-li="'+r+'" data-lk="'+c(f)+'"')+"</label>"}).join(""):o},t.lineCopy=function(i,r){var a=n?n(i,r):r,o=pe(i);return o?a.cf=o:delete a.cf,a}}}function qe(){if(!(!g.NSStore||NSStore._cfw)){NSStore._cfw=1;var t=NSStore.put;NSStore.put=function(e,n){if(e==="doc"&&n&&P&&Date.now()-P.at<2e4&&L(n)===P.type){var i=Object.assign({},n.cf||{});P.ids.forEach(function(r){delete i[r]}),Object.assign(i,P.cf),Object.keys(i).length?n.cf=i:delete n.cf,P=null}return t.apply(this,arguments).then(function(r){try{e==="doc"&&me(r&&r.id?r:n)}catch{}return r})}}}qe();function Me(t,e,n,i){var r=Xt(t,n||L(e),v,i??B(e.seller));return Object.keys(r).length&&(e.cf=Object.assign({},e.cf||{},r)),e}var ct=[],ve=0,F=null;function $e(t){var e=t&&(t.buyer&&t.buyer.name||t.payer||t.lender)||"";return e?"p:"+y(e):""}function me(t){var e=ee(t,v);if(e.length){var n=$e(t),i=Date.now();e.forEach(function(r){ct.push([r[0],r[1],n,i,t.id||""])}),clearTimeout(ve),ve=setTimeout(Pt,2e3)}}function J(t){return NSStore.meta("recall").then(function(e){return e=e&&e.k?e:{v:1,k:{}},t(e),F=e,NSStore.meta("recall",e).then(function(){return e})})}function Pt(){if(!(!ct.length||!g.NSStore)){var t=ct;ct=[],J(function(e){t.forEach(function(n){Gt(e,n[0],n[1],n[2],n[3],n[4])})}).catch(function(){})}}window.addEventListener("pagehide",Pt);function qt(t){return F&&!t?Promise.resolve(F):g.NSStore?NSStore.meta("recall").then(function(e){return F=e&&e.k?e:{v:1,k:{}},F},function(){return F||{v:1,k:{}}}):Promise.resolve({k:{}})}document.addEventListener("ns-data",function(){F=null});function Mt(t){if(!t||!/^(INPUT|TEXTAREA)$/.test(t.tagName)||t.type==="date"||t.type==="checkbox")return"";var e=t.getAttribute("data-recall");if(e)return e;var n=t.id||"";return n==="d-notes"||n==="f-vnotes"?"notes:"+(b&&E("#d-notes")===t?H():V||"invoice"):n==="d-terms"?"terms:"+(b?H():"invoice"):/^(dp|f-dp)-?through$/.test(n)?"disp.through":/^(dp|f-dp)-?dest$/.test(n)?"disp.dest":/^(sh-addr|f-shaddr)$/.test(n)?"ship.addr":/^(sh-city|f-shcity)$/.test(n)?"ship.city":n==="f-note"&&/^(receipt|voucher|exp|contra)$/.test(V)&&t.closest("#app-form")?"narr:"+V:n==="jv-narr"?"narr:jv":n==="ei-dist"&&b?_t(b.doc()):""}function Ce(t){var e=t.closest("form,dialog,#tool,.tool")||document,n=e.querySelector("#f-party,#b-name");return n&&n.value.trim()?"p:"+y(n.value):""}var k=null,N=null;function U(){k&&(k.remove(),k=null,N=null)}function $t(t){var e=Mt(t);e&&qt().then(function(n){if(document.activeElement===t){var i=te(n,e,Ce(t),Date.now(),t.value.length>1&&t.value.length<60?t.value:"",8).filter(function(a){return a!==t.value});if(!i.length){N===t&&U();return}if(!k||N!==t){U(),k=document.createElement("div"),k.className="rc-pop",k.setAttribute("role","listbox"),N=t;var r=t.parentNode;getComputedStyle(r).position==="static"&&(r.style.position="relative"),r.appendChild(k),k.addEventListener("mousedown",function(a){a.preventDefault()}),k.addEventListener("click",function(a){var o=a.target.closest("[data-rcx]"),l=a.target.closest("[data-rcv]"),s=Mt(t);if(o){var f=o.getAttribute("data-rcx");J(function(m){et(m,s,f)}).then(function(){$t(t)});return}l&&(t.value=l.getAttribute("data-rcv"),t.dispatchEvent(new Event("input",{bubbles:!0})),t.dispatchEvent(new Event("change",{bubbles:!0})),U())})}k.innerHTML='<p class="rc-h">'+c(u("recent"))+"</p>"+i.map(function(a){return'<div class="rc-row" role="option"><button type="button" class="rc-v" data-rcv="'+c(a)+'">'+c(a.length>90?a.slice(0,88)+"…":a)+'</button><button type="button" class="rc-x" data-rcx="'+c(a)+'" title="'+c(u("forget"))+'" aria-label="'+c(u("forget"))+'">×</button></div>'}).join("")}})}document.addEventListener("focusin",function(t){Mt(t.target)?$t(t.target):k&&!k.contains(t.target)&&U()}),document.addEventListener("input",function(t){N===t.target&&$t(t.target)}),document.addEventListener("focusout",function(t){k&&(N===t.target||k.contains(t.target))&&setTimeout(function(){var e=document.activeElement;N&&e!==N&&!(k&&k.contains(e))&&U()},150)}),document.addEventListener("keydown",function(t){if(k){var e=N===t.target,n=k.contains(t.target),i=nt(".rc-v",k),r=i.indexOf(t.target);if(!(!e&&!n)){if(t.key==="Escape"){t.preventDefault(),t.stopPropagation(),n?N.focus():U();return}if(t.key==="ArrowDown"&&i.length&&(e||r>=0)){t.preventDefault(),t.stopPropagation(),i[e?0:Math.min(i.length-1,r+1)].focus();return}if(t.key==="ArrowUp"&&r>=0){t.preventDefault(),t.stopPropagation(),r===0?N.focus():i[r-1].focus();return}if(t.key==="Delete"&&r>=0){t.preventDefault(),t.stopPropagation();var a=t.target.parentNode.querySelector(".rc-x");a&&a.click(),N.focus();return}if(t.key==="Enter"&&r>=0){t.preventDefault(),t.stopPropagation();var o=N;t.target.click(),o&&o.focus()}}}},!0),p.recall={learn:me,flush:Pt,get:qt,edit:J,offer:function(t,e){t&&t.setAttribute("data-recall",e)},forget:function(t,e){return J(function(n){et(n,t,e)})}};function ut(t){return p.money?p.money(t):String(t)}function he(t){try{return p.fmtDate?p.fmtDate(t):t}catch{return t}}function Be(t,e){try{if(!g.NSStock||!NSStock.summary)return null;var n=NSStock.summary(D,Nt,e,"",p.today()).items.filter(function(i){return y(i.name)===y(t)})[0];return n?{q:n.close,unit:n.unit||""}:null}catch{return null}}function He(t){var e=t.closest(".it[data-i]");if(e&&b&&e.closest("#items")){var n=b.doc(),i=n.items[+e.getAttribute("data-i")],r=H();return i&&{row:e,at:e,desc:i.desc,party:n.buyer&&n.buyer.name,biz:n.seller&&n.seller.name,buy:r==="po"||r==="self"||r==="note"&&n.side==="purchase",rate:function(x){var h=E("#it-rate-"+e.getAttribute("data-i"),e);h&&(h.value=x,h.dispatchEvent(new Event("input",{bubbles:!0})),h.dispatchEvent(new Event("change",{bubbles:!0})))}}}var a=t.closest("#app-form .line[data-row]"),o=g.NSApp;if(a&&o){var l=a.closest("form"),s=(l.closest("dialog")||{}).getAttribute?l.closest("dialog").getAttribute("data-kind"):"",f=a.querySelector('[data-lk="desc"]'),m=E('label[for="f-party"]',l),d=E("#f-party",l);return f&&{row:a,at:a,desc:f.value,party:d?d.value:"",biz:o.bizName?o.bizName():"",buy:/^(pbill|pret)$/.test(s)||s==="vdoc"&&!!m&&o.T&&m.textContent===o.T("supp"),rate:function(x){var h=a.querySelector('[data-lk="rate"]');h&&(h.value=x,h.dispatchEvent(new Event("input",{bubbles:!0})),h.dispatchEvent(new Event("change",{bubbles:!0})))}}}return null}var _=null,Ct=null;function R(){_&&(_.remove(),_=null,Ct=null)}function Fe(t){var e=He(t);if(!e||!String(e.desc||"").trim()||!g.NSReuse){R();return}var n=g.NSReuse,i=e.party?n.rateHistory(D,e.biz,e.party,e.desc,e.buy?"buy":"sale",5):[],r=n.lastPurchase(D,e.biz,e.desc),a=Be(e.desc,e.biz),o=[];if(i.length&&o.push('<span class="cs-l">'+c(u(e.buy?"s_lastb":"s_last"))+":</span> "+i.map(function(l){return'<button type="button" class="link cs-r" data-csrate="'+l.rate+'" title="'+c(u("s_use"))+'">'+c(String(l.rate))+"</button> <small>("+c(he(l.date))+")</small>"}).join(", ")),r&&!(e.buy&&i.length&&i[0].date===r.date&&i[0].rate===r.rate)&&o.push('<span class="cs-l">'+c(u("s_pur"))+':</span> <button type="button" class="link cs-r" data-csrate="'+r.rate+'" title="'+c(u("s_use"))+'">'+c(String(r.rate))+"</button> <small>("+c(he(r.date))+")</small>"),a&&o.push('<span class="cs-l">'+c(u("s_stock"))+":</span> <b"+(a.q<=0?' class="bad"':"")+">"+c(String(Math.round(a.q*1e3)/1e3))+(a.unit?" "+c(a.unit):"")+"</b>"),!o.length){R();return}(!_||Ct!==e.row)&&(R(),_=document.createElement("div"),_.className="cf-strip",_.setAttribute("aria-live","polite"),Ct=e.row,e.at.insertAdjacentElement(e.at.classList.contains("line")?"afterend":"beforeend",_)),_.innerHTML=o.join(" · "),_._rate=e.rate}document.addEventListener("mousedown",function(t){t.target.closest&&t.target.closest("[data-csrate]")&&t.preventDefault()},!0),document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-csrate]");e&&_&&_._rate&&_._rate(e.getAttribute("data-csrate"))});function be(t){var e=String(t.value||"").trim(),n=t.closest(".f")||t.parentNode,i=n.querySelector(".cf-pstrip"),r=g.NSBooks,a=g.NSApp,o=t.id==="b-name"&&b?b.doc().seller&&b.doc().seller.name:a&&a.bizName?a.bizName():"";if(!e||!r){i&&i.remove();return}var l=y(e),s=Q.filter(function(j){return y(j.name)===l})[0],f=[];try{var m=((r.parties(D,o)||{})[r.key?r.key(e):l]||{}).bal||0;Math.abs(m)>=.01&&f.push('<span class="cs-l">'+c(u("s_bal"))+":</span> <b>"+c(u(m>0?"s_recv":"s_pay",{a:ut(Math.abs(m))}))+"</b>");var d=(r.bills(D,o,r.key?r.key(e):l).bills||[]).filter(function(j){return j.side===(m<0?"pay":"recv")}),x=p.today(),h=0,O=0;d.forEach(function(j){var z=j.due||(s&&+s.cdays?r.addDays(j.date,+s.cdays):"");z&&z<x&&(h+=j.left,O=Math.max(O,Math.round((new Date(x)-new Date(z))/864e5)))}),h>.004&&f.push('<span class="bad">'+c(u("s_over",{a:ut(h),n:O}))+"</span>");var S=s&&+s.climit||0;S>0&&f.push('<span class="cs-l">'+c(u("s_lim"))+":</span> "+c(ut(S))+(m>S?' <span class="bad">'+c(u("s_overlim",{a:ut(m-S)}))+"</span>":""))}catch{}if(!f.length){i&&i.remove();return}var A=i||document.createElement("div");A.className="cf-strip cf-pstrip",A.innerHTML=f.join(" · "),i||n.appendChild(A)}function Ie(t){var e=String(t.value||"").trim();if(e){var n=g.NSApp&&NSApp.data?NSApp.data().party:Q,i=n.filter(function(f){return y(f.name)===y(e)})[0];if(t.id==="b-name"&&b){var r=b.doc(),a=0;zt().forEach(function(f){i&&i.cf&&gt(f,"party")&&i.cf[f.id]!=null&&(!r.cf||r.cf[f.id]==null||r.cf[f.id]==="")&&(C(r,f,i.cf[f.id]),a++)}),zt().forEach(function(f){if(!(!f.last||r.cf&&r.cf[f.id]!=null&&r.cf[f.id]!=="")){var m=wt(D,H(),e,f.id,b.id&&b.id());m!==void 0&&(C(r,f,m),a++)}}),a&&(lt(),b.changed());return}var o=t.form&&t.form.querySelector('[data-cfbox^="vt:"]');if(o){var l=o.getAttribute("data-cfbox").slice(3),s=g.NSApp&&NSApp.data?NSApp.data().doc:D;X(l).forEach(function(f){var m=o.querySelector('[data-cfid="'+f.id+'"]'),d=i&&i.cf&&gt(f,"party")?i.cf[f.id]:void 0;d==null&&f.last&&(d=wt(s,l,e,f.id,fe)),!(!m||d==null||String(m.value).trim())&&(m.value=f.type==="yesno"?d?"yes":"no":d,m.dispatchEvent(new Event("change",{bubbles:!0})))})}}}function ge(t){return t&&(t.id==="f-party"&&!!t.closest("#app-form")||t.id==="b-name"&&!!b)}var ye=0;document.addEventListener("change",function(t){if(ge(t.target)){var e=t.target;Ie(e),(Lt||it()).then(function(){be(e)})}}),document.addEventListener("input",function(t){if(ge(t.target)){var e=t.target;clearTimeout(ye),ye=setTimeout(function(){be(e)},500)}}),document.addEventListener("focusin",function(t){var e=t.target;e.closest&&(e.closest(".it[data-i]")||e.closest("#app-form .line[data-row]"))?(Lt||it()).then(function(){document.activeElement===e&&Fe(e)}):_&&!(e.closest&&e.closest(".cf-strip"))&&(Bt?Ht=!0:R())});var Bt=!1,Ht=!1;document.addEventListener("pointerdown",function(){Bt=!0},!0),document.addEventListener("pointerup",function(){setTimeout(function(){if(Bt=!1,!!Ht){Ht=!1;var t=document.activeElement;_&&!(t&&t.closest&&(t.closest(".cf-strip")||t.closest(".it[data-i]")||t.closest("#app-form .line[data-row]")))&&R()}},0)},!0);var I={};function Ke(t){return Z(v,t,"")}function Ve(t,e){var n=Ke(e);if(!n.length)return"";var i=I[t]||{};return'<div class="cf-filt" data-cfscope="'+c(t)+'">'+n.map(function(r){var a=i[r.id],o="cff-"+t+"-"+r.id,l="<span>"+c(r.label)+"</span> ";if(r.type==="list")return"<label>"+l+'<select data-cff="'+c(r.id)+'"><option value="">'+c(u("any"))+"</option>"+(r.opts||[]).map(function(m){return"<option"+(m===a?" selected":"")+">"+c(m)+"</option>"}).join("")+"</select></label>";if(r.type==="yesno")return"<label>"+l+'<select data-cff="'+c(r.id)+'"><option value="">'+c(u("any"))+'</option><option value="yes"'+(a==="yes"?" selected":"")+">"+c(u("yes"))+'</option><option value="no"'+(a==="no"?" selected":"")+">"+c(u("no"))+"</option></select></label>";if(r.type==="num"||r.type==="money"||r.type==="date"){var s=a||{},f=r.type==="date"?' type="date"':' inputmode="decimal" size="6"';return"<label>"+l+"<input"+f+' data-cff="'+c(r.id)+'" data-cfr="from" value="'+c(s.from||"")+'" aria-label="'+c(r.label+" "+u("from"))+'"> – <input'+f+' data-cff="'+c(r.id)+'" data-cfr="to" value="'+c(s.to||"")+'" aria-label="'+c(r.label+" "+u("to"))+'"></label>'}return"<label>"+l+'<input id="'+o+'" type="search" data-cff="'+c(r.id)+'" value="'+c(a||"")+'" placeholder="'+c(u("contains"))+'"></label>'}).join("")+"</div>"}document.addEventListener("change",function(t){var e=t.target,n=e&&e.getAttribute&&e.getAttribute("data-cff"),i=n&&e.closest("[data-cfscope]");if(i){var r=i.getAttribute("data-cfscope"),a=I[r]=I[r]||{},o=e.getAttribute("data-cfr");o?(a[n]=a[n]||{},a[n][o]=e.value):e.value?a[n]=e.value:delete a[n],g.NSApp&&NSApp.show&&NSApp.show()}});function Xe(t,e){return St(t,I[e],v)}function Ue(t,e){if(!I[e]||!Object.keys(I[e]).length)return!0;var n=g.NSApp&&NSApp.data?NSApp.data().party:Q,i=n.filter(function(r){return y(r.name)===t})[0];return St(i||{},I[e],v)}p.cfText=function(t){if(!t)return"";var e=[],n=function(i){Object.keys(i||{}).forEach(function(r){var a=v.filter(function(o){return o.id===r})[0];a&&e.push(T(a,i[r]))})};return n(t.cf),(t.items||[]).forEach(function(i){i&&n(i.cf)}),e.join(" ")};function Ye(t){return t.map(function(e){return"<th>"+c(e.label)+"</th>"}).join("")}function We(t,e){return t.map(function(n){return"<td>"+c(T(n,e&&e.cf&&e.cf[n.id]))+"</td>"}).join("")}function Ze(t,e){return t.map(function(n){var i=e&&e.cf&&e.cf[n.id];return n.type==="num"||n.type==="money"?i??"":T(n,i)})}function st(t){var e=p.t("ufd.vt_"+t);return e!=="ufd.vt_"+t?e:(e=p.t("ufd.kt_"+t),e==="ufd.kt_"+t?t:e)}function Qe(t){return(t.on||[]).map(function(e){return e==="party"?u("t_party"):e==="item"?u("t_item"):e==="vt:*"?u("t_all"):st(e.slice(3))}).join(", ")}function Ft(t){return NSStore.meta("fields").then(function(e){return e=e&&e.defs?e:{v:1,defs:[]},t(e.defs),NSStore.meta("fields",e).then(function(){return rt=e,v=bt(rt,At),e})})}function G(t,e,n){var i=g.NSApp,r=i&&i.acx;if(r){var a=t||Object.assign({id:"",label:"",on:[],level:"head",type:"text",print:"meta",carry:!0,remember:!0,filter:!1,biz:[]},e||{}),o=function(d,x){return'<label class="chk"><input type="checkbox" data-cfon="'+c(d)+'"'+((a.on||[]).indexOf(d)>=0?" checked":"")+"> "+c(x)+"</label>"},l=function(d,x,h,O){return'<div class="f wide"><label class="chk"><input type="checkbox" id="'+d+'"'+(h?" checked":"")+"> <span>"+c(x)+"</span></label>"+(O?'<small class="hint">'+c(O)+"</small>":"")+"</div>"},s=i.biz&&i.biz(),f=i.data&&i.data().biz.length>1,m='<div class="fg">'+r.fld("cf-label",u("f_label"),r.inp("cf-label",a.label,{req:1}),{hint:u("f_labelh")})+r.fld("cf-type",u("f_type"),r.sel("cf-type",a.type,pt.map(function(d){return[d,u("ty_"+d)]})))+r.fld("cf-level",u("f_level"),r.sel("cf-level",a.level||"head",[["head",u("lv_head")],["line",u("lv_line")]]))+'<div class="f wide" data-cfopts><label for="cf-opts">'+c(u("f_opts"))+'</label><textarea id="cf-opts" rows="3" dir="auto">'+c((a.opts||[]).join(`
`))+'</textarea><small class="hint">'+c(u("f_optsh"))+'</small></div><fieldset class="f wide cf-on"><legend>'+c(u("f_on"))+'</legend><small class="hint">'+c(u("f_onh"))+"</small><div data-cfmasters>"+o("party",u("t_party"))+o("item",u("t_item"))+"</div>"+o("vt:*",u("t_all"))+'<div class="cf-vts">'+Kt.map(function(d){return o("vt:"+d,st(d))}).join("")+'</div><details class="cf-kits"'+(vt.some(function(d){return(a.on||[]).indexOf("vt:"+d)>=0})?" open":"")+"><summary>"+c(u("kits"))+'</summary><div class="cf-vts">'+vt.map(function(d){return o("vt:"+d,st(d))}).join("")+"</div></details></fieldset>"+r.fld("cf-print",u("f_print"),r.sel("cf-print",a.print||"meta",[["meta",u("pr_meta")],["foot",u("pr_foot")],["note",u("pr_note")],["none",u("pr_none")]]))+l("cf-req",u("f_req"),a.req)+l("cf-rem",u("f_rem"),a.remember!==!1,u("f_remh"))+l("cf-filter",u("f_filter"),a.filter,u("f_filterh"))+l("cf-carry",u("f_carry"),a.carry!==!1,u("f_carryh"))+l("cf-last",u("f_last"),a.last,u("f_lasth"))+(f&&s?l("cf-biz",u("f_biz",{b:s.name}),(a.biz||[]).length>0):"")+(t?l("cf-off",u("f_off"),a.off,u("f_offh")):"")+'</div><p class="soft">'+c(u("f_h"))+"</p>";r.open(u(t?"alter":"create"),m,function(){var d=E(".acx-dlg form"),x=function(S){var A=E("#"+S,d);return A?A.type==="checkbox"?A.checked:A.value:""},h=kt({id:a.id||Qt(v),label:x("cf-label"),type:x("cf-type"),level:x("cf-level"),opts:x("cf-opts"),on:nt("[data-cfon]",d).filter(function(S){return S.checked}).map(function(S){return S.getAttribute("data-cfon")}),req:x("cf-req"),remember:x("cf-rem"),print:x("cf-print"),filter:x("cf-filter"),carry:x("cf-carry"),last:x("cf-last"),biz:x("cf-biz")&&s?[s.id]:t&&!E("#cf-biz",d)?a.biz:[],off:x("cf-off"),order:a.order||v.length+1});h.level==="line"&&h.on.some(function(S){return S==="party"||S==="item"})&&(h.on=h.on.filter(function(S){return S!=="party"&&S!=="item"}));var O=Jt(h,v);if(O){p.toast(u("bad_"+O,{n:h.level==="line"?ht:mt}),"bad");return}Ft(function(S){var A=S.findIndex(function(j){return j.id===h.id});A>=0?S[A]=h:S.push(h)}).then(function(){E(".acx-dlg").close(),p.toast(u("saved")),n?n(h):i.show&&i.show()},function(S){p.toast(p.t("nosave",{e:S&&S.message||""}),"bad")})},function(d){function x(){var h=E("#cf-level",d).value==="line",O=E("#cf-type",d).value;E("[data-cfopts]",d).hidden=O!=="list",E("[data-cfmasters]",d).hidden=h,nt(".cf-vts [data-cfon]",d).forEach(function(z){var we=!h||q[z.getAttribute("data-cfon").slice(3)];z.closest("label").hidden=!we,we||(z.checked=!1)});var S=E("#cf-print",d),A=h?["note","none"]:["meta","foot","none"];nt("option",S).forEach(function(z){z.hidden=A.indexOf(z.value)<0}),A.indexOf(S.value)<0&&(S.value=A[0]);var j=E("#cf-rem",d);j&&(j.closest(".f").hidden=O!=="text"),E("#cf-last",d).closest(".f").hidden=h}["cf-level","cf-type"].forEach(function(h){E("#"+h,d).addEventListener("change",x)}),x()})}}function xe(t){var e=g.NSApp,n=e&&e.data?e.data():{doc:D,party:Q,item:Nt};return Zt(t.id,n.doc,n.party,n.item)}function Je(t){var e=xe(t),n=g.NSApp;if(t.legacy){p.toast(u("legacyh"),"bad");return}if(e){p.toast(u("inuse",{n:e}),"bad");return}(p.ask?p.ask(u("delq",{x:t.label}),{danger:!0,ok:p.t("desk.del")}):Promise.resolve(confirm(u("delq",{x:t.label})))).then(function(i){i&&Ft(function(r){var a=r.findIndex(function(o){return o.id===t.id});a>=0&&r.splice(a,1)}).then(function(){p.toast(u("deleted")),n.show()})})}function Re(t){var e=kt(Object.assign({},t,{remember:!0}));delete e.legacy,Ft(function(n){n.push(e)}).then(function(){G(e)})}function Ge(){var t=v.slice().sort(function(e,n){return(+e.order||0)-(+n.order||0)});return t.length?'<div class="tbl-wrap"><table class="tbl ms-tbl"><thead><tr><th>'+c(u("f_label"))+"</th><th>"+c(u("f_on"))+"</th><th>"+c(u("f_level"))+"</th><th>"+c(u("f_type"))+"</th><th>"+c(u("c_flags"))+'</th><th class="n">'+c(u("c_uses"))+'</th><th class="noprint"></th></tr></thead><tbody>'+t.map(function(e){var n=[e.req?u("fl_req"):"",e.filter?u("fl_filter"):"",e.print&&e.print!=="none"?u("fl_print"):"",e.carry!==!1?u("fl_carry"):"",e.off?u("fl_off"):"",e.legacy?u("fl_old"):""].filter(Boolean).join(", "),i=function(r,a,o,l){return'<button type="button" class="btn sm ib'+(l?" "+l:"")+'" '+r+' title="'+c(o)+'" aria-label="'+c(o)+'">'+p.icSvg(a)+"</button>"};return"<tr"+(e.off?' class="soft"':"")+'><td class="l">'+c(e.label)+'</td><td class="l">'+c(Qe(e))+'</td><td class="l">'+c(u(e.level==="line"?"lv_line":"lv_head"))+'</td><td class="l">'+c(u("ty_"+(e.type||"text")))+(e.type==="list"?' <small class="soft">('+c((e.opts||[]).join(", "))+")</small>":"")+'</td><td class="l">'+c(n)+'</td><td class="n">'+xe(e)+'</td><td class="noprint ms-acts">'+(e.legacy?i('data-cfadopt="'+c(e.id)+'"',"edit",u("adopt")):i('data-cfalt="'+c(e.id)+'"',"edit",u("alter"))+i('data-cfdel="'+c(e.id)+'"',"trash",p.t("desk.del"),"danger"))+"</td></tr>"}).join("")+'</tbody></table></div><p class="soft">'+c(u("h"))+"</p>":'<p class="soft">'+c(u("none"))+'</p><p class="soft">'+c(u("ex"))+"</p>"}var $=null,ft=null;function dt(t){var e=/^(notes|terms|narr):(.+)$/.exec(t);if(e)return u("rk_"+e[1],{t:st(e[2])});if(/^km:/.test(t))return u("rk_km",{a:t.slice(3,9),b:t.slice(10)});if(/^cf:/.test(t)){var n=v.filter(function(i){return i.id===t.slice(3)})[0];return n?n.label:t}return u("rk_"+t.replace(".","_"))}function tn(){if(!$)return Promise.all([qt(!0),p.dispatch?p.dispatch(!0):Promise.resolve({tr:[]})]).then(function(e){$=e[0],ft=(e[1].tr||[]).map(function(n){return y(n.name)}),/^#masters\/rem/.test(location.hash)&&g.NSApp.show()}),'<p class="soft">…</p>';var t=Object.keys($.k||{}).sort(function(e,n){return dt(e).localeCompare(dt(n))});return t.length?'<p class="soft">'+c(u("rem_h"))+"</p>"+t.map(function(e){var n=$.k[e].slice().sort(function(i,r){return(r.n||0)-(i.n||0)});return'<section class="card cf-rk"><h3>'+c(dt(e))+' <span class="pill">'+n.length+'</span> <button type="button" class="btn sm" data-rkall="'+c(e)+'">'+c(u("forgetall"))+'</button></h3><ul class="cf-rkl">'+n.map(function(i){return'<li><span dir="auto">'+c(i.v)+'</span> <small class="soft">'+c(u("used",{n:i.n||1}))+"</small> "+(e==="disp.through"&&p.dispatchSave&&ft&&ft.indexOf(y(i.v))<0?'<button type="button" class="btn sm" data-rkpro="'+c(i.v)+'">'+c(u("promote"))+"</button> ":"")+'<button type="button" class="rc-x" data-rkx="'+c(e)+'" data-rkv="'+c(i.v)+'" title="'+c(u("forget"))+'" aria-label="'+c(u("forget"))+'">×</button></li>'}).join("")+"</ul></section>"}).join(""):'<p class="soft">'+c(u("rem_none"))+"</p>"}function Se(t){t._cfRw||(t._cfRw=1,t.addEventListener("click",function(e){if(!(!/^#masters\/(cf|rem)/.test(location.hash)&&!/^#masters\/?$/.test(location.hash))){var n=e.target.closest("button");if(n){var i=function(l){return n.getAttribute(l)};if(i("data-msnew")==="cf"){e.stopPropagation(),G();return}if(i("data-cfalt"))return G(v.filter(function(l){return l.id===i("data-cfalt")})[0]);if(i("data-cfdel"))return Je(v.filter(function(l){return l.id===i("data-cfdel")})[0]);if(i("data-cfadopt"))return Re(v.filter(function(l){return l.id===i("data-cfadopt")})[0]);if(i("data-rkpro")){var r=i("data-rkpro");return p.dispatchSave(function(l){l.tr.some(function(s){return y(s.name)===y(r)})||l.tr.push({id:"t"+Date.now().toString(36),name:r,tid:""})}).then(function(l){ft=l.tr.map(function(s){return y(s.name)}),p.toast(u("promoted",{n:r})),g.NSApp.show()})}if(i("data-rkx")||i("data-rkall")){var a=i("data-rkx")||i("data-rkall"),o=i("data-rkall")?null:i("data-rkv");(o==null&&p.ask?p.ask(u("forgetq",{x:dt(a)}),{danger:!0}):Promise.resolve(!0)).then(function(l){l&&J(function(s){et(s,a,o)}).then(function(s){$=s,g.NSApp.show()})})}}}},!0))}g.NSMsExt=(g.NSMsExt||[]).concat([{id:"cf",newKey:"ufd.create",html:Ge,wire:Se,count:function(){return v.length}},{id:"rem",html:function(){return tn()},wire:function(t){$=$&&/^#masters\/rem/.test(location.hash)?$:null,Se(t)}}]),document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-cfnew]");if(e){t.preventDefault();var n=e.closest("[data-cfbox]"),i=e.getAttribute("data-cfnew");G(null,{on:[i]},function(){if(!(!n||!n.isConnected)){var r=ot(n,X(i.slice(3)));n.innerHTML=de(i.slice(3),r),n.classList.toggle("cf-empty",!X(i.slice(3)).length),g.NSApp&&NSApp.redrawLines&&NSApp.redrawLines()}})}});var ke=document.createElement("style");ke.textContent=".rc-pop{position:absolute;left:0;right:0;top:100%;z-index:60;background:var(--surface-solid,var(--bg,#fff));border:1px solid var(--line,#ccd);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);max-height:260px;overflow:auto;padding:4px}.rc-h{margin:2px 6px;font-size:.75rem;opacity:.7}.rc-row{display:flex;align-items:stretch}.rc-v{flex:1;text-align:start;background:none;border:0;padding:7px 8px;cursor:pointer;color:inherit;font:inherit;border-radius:6px;white-space:normal}.rc-v:hover,.rc-v:focus{background:var(--hover,rgba(0,0,0,.06))}.rc-x{background:none;border:0;cursor:pointer;color:inherit;opacity:.6;padding:0 10px;font-size:1.1rem;min-width:32px}.rc-x:hover{opacity:1;color:#b42318}.cf-strip{font-size:.82rem;margin:4px 0 6px;padding:5px 8px;border-radius:6px;background:var(--soft-bg,rgba(11,59,91,.06));line-height:1.6;grid-column:1/-1}.cf-strip .cs-l{opacity:.75}.cf-strip .cs-r{font-weight:600;padding:0 2px;min-height:0}.cf-strip .bad{color:#b42318}.cf-box.cf-empty{border:0;padding:0;margin:4px 0}.cf-add{margin:4px 0}.cf-filt{display:flex;flex-wrap:wrap;gap:8px 14px;margin:6px 0}.cf-filt label{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.cf-filt input,.cf-filt select{max-width:11rem}.cf-on .chk{display:inline-flex;margin:2px 12px 2px 0}.cf-vts{margin-top:4px}.cf-rkl{list-style:none;padding:0;margin:0}.cf-rkl li{display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid var(--line,#eee)}.cf-rkl li span{flex:1}.cf-foot{margin:6px 0;font-size:.9em}@media print{.rc-pop,.cf-strip,.cf-add{display:none!important}}",(document.head||document.documentElement).appendChild(ke);function Ee(){Pe()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ee):setTimeout(Ee,0),g.NSStore&&(NSStore.ready?NSStore.ready():Promise.resolve()).then(function(){jt(),it()}),g.NSCF=Object.assign({},ne,{ready:function(){return re||jt()},list:function(){return v},inputs:at,readBox:ot,formHtml:ce,formRead:ue,appBlock:ze,slipEditor:je,slipWire:function(t){K.wire(t)},slipFill:function(){K.fill()},slipPrint:Le,slipBlock:function(t){return K.block(t)},appTake:De,carryInto:Me,fieldForm:G,filterBar:Ve,pass:Xe,partyPass:Ue,colsOf:function(t){return Wt(v,t,"")},colsTargets:function(t){return Z(v,t,"")},colHead:Ye,colCells:We,colVals:Ze,groupDefs:function(t){return Z(v,t,"").filter(function(e){return e.type==="list"||e.type==="text"||e.type==="yesno"})},get:function(t){return v.filter(function(e){return e.id===t})[0]},narr:function(t){return Yt(t,v,"")},thermalRows:function(t){var e=B(t.seller);return W(t,v,e,"meta").concat(W(t,v,e,"foot"))}})})(this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* pmforms.js */
try{/* NSBiz party and item forms (owner 26 Nov 2026: "New Party looks too simple and lacks options the vouchers need; New Item the same;
   organize them like the masters of Tally or Busy"). ONE sectioned form for the three places that make a party or an item:
     NS.quickAdd (core.js)      the small box opened from a voucher box (F2), the Dashboard shortcuts and the add-on inbox
     My data (vault/my.js)      Customers and suppliers / Items and services
     Masters (engine/masters.js) ledger form for a party, Stock item form
   The sections are tabs (Basics, GST and tax, Addresses, Credit and prices, Bank, Opening and more for a party; Basics, Tax, Prices,
   Stock, Manufacturing, Notes for an item, plus Custom fields when the business has some). Only fields are ADDED to the records:
   every field is optional, a saved party or item loads as before, and the keys already in use keep their names.

   NSPM.html(kind, rec, o)         the tabs and panes as HTML (kind 'party' | 'item')
   NSPM.wire(form, kind, rec, o)   tabs, GSTIN / IFSC / PAN checks, GST portal fill, ship-to places, Enter moves to the next box
   NSPM.read(form, kind, rec, o)   copies the boxes into rec; returns '' or { msg, el } when something must be put right
   NSPM.opening(form, kind, rec, o) Promise: the opening balance (party) or opening stock (item) entry, when one was typed
   NSPM.quick(inp, q, side)        the small dialog of NS.quickAdd
   o = { ctx: 'quick' | 'my' | 'masters', skip: ['name', ...], groups: [group rows], groupHtml(kind, value), biz: [businesses],
         godowns: [names], units: [names], ob: existing opening-balance document, seller(): business record or Promise, slots: { tax: html } }
   Where each field is used by the vouchers is written next to it below ("V:"); a field with no "V:" is kept for reference only. */
(function () {
  'use strict';
  if (!window.NS) return;
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num;
  function T(k, v) { return NS.t(k, v); }
  function W(k, v) { return NS.t('pm.' + k, v); }
  var UNITS = ['Nos', 'Pcs', 'Kg', 'Gram', 'Litre', 'Meter', 'Box', 'Pack', 'Set', 'Dozen', 'Bag', 'Ton', 'Sq ft', 'Pair', 'Hours', 'Day', 'Month'];
  var RATES = [0, 0.1, 0.25, 1.5, 3, 5, 12, 18, 28, 40];
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function get(o, k) { return k.split('.').reduce(function (a, p) { return a == null ? a : a[p]; }, o); }
  function set(o, k, v) { var p = k.split('.'), l = p.pop(), c = o; p.forEach(function (x) { c = c[x] = c[x] && typeof c[x] === 'object' ? c[x] : {}; }); c[l] = v; }
  function unset(o, k) {
    var p = k.split('.'), l = p.pop(), c = o, trail = [];
    for (var i = 0; i < p.length; i++) { if (!c || typeof c[p[i]] !== 'object') return; trail.push([c, p[i]]); c = c[p[i]]; }
    delete c[l];
    for (var j = trail.length - 1; j >= 0; j--) { var po = trail[j][0][trail[j][1]]; if (po && !Object.keys(po).length) delete trail[j][0][trail[j][1]]; else break; }
  }
  function fid(k) { return 'pm-' + k.replace(/\./g, '-'); }
  function fyStart() { var t = NS.today(), y = +t.slice(0, 4), m = +t.slice(5, 7); return (m < 4 ? y - 1 : y) + '-04-01'; }

  /* ---------- the fields ----------
     [key, label key, type, { wide, hint, ph, max, mode, upper, opts, only, not }]
     types: text ltr num date area sel state gst unit check group usedby img head + the blocks ships ob prices alts bom last open cf */
  var SIDE = [['recv', 'ms.dr'], ['pay', 'ms.cr']];
  var PARTY = [
    { id: 'basic', t: 'pm.s_basic', f: [
      ['name', 'my.f.name', 'text', { wide: 1 }], ['pname', 'pm.pname', 'text', { hint: 'pm.pname_h' }],   /* V: the name printed on the party's bills (docs.js) */
      ['role', 'hub.role', 'sel', { opts: [['customer', 'hub.r.customer'], ['supplier', 'hub.r.supplier'], ['both', 'hub.r.both']] }],
      ['group', 'grp.group', 'group', { hint: 'grp.h_pgroup' }],
      ['phone', 'pm.mobile', 'ltr', { mode: 'tel' }], ['email', 'l.email', 'ltr', { mode: 'email' }],
      ['contact', 'pm.contact', 'text', { hint: 'pm.contact_h' }], ['agent', 'ms.agent', 'text', { hint: 'ms.h_agent' }]] },
    { id: 'gst', t: 'pm.s_gst', f: [
      ['gstin', 'l.cgstin', 'gstin', { wide: 1 }],   /* V: GSTIN, state and type decide CGST+SGST or IGST on every bill */
      ['reg', 'ms.reg', 'sel', { opts: [['', 'ms.reg_auto'], ['regular', 'ms.reg_regular'], ['comp', 'ms.reg_comp'], ['unreg', 'ms.reg_unreg'], ['sez', 'ms.reg_sez'], ['uin', 'ms.reg_uin'], ['overseas', 'ms.reg_overseas'], ['eco', 'ms.reg_eco']] }],
      ['pan', 'ms.pan', 'ltr', { max: 10, upper: 1 }], ['state', 'l.state', 'state'],
      ['_', 'pm.h_tds', 'head'],
      ['deductee', 'ms.ded', 'sel', { opts: [['', 'ms.ded_auto'], ['ind', 'ms.ded_ind'], ['huf', 'ms.ded_huf'], ['co', 'ms.ded_co'], ['firm', 'ms.ded_firm'], ['other', 'ms.ded_other']] }],   /* V: money paid / TDS (tdsbook.js) */
      ['tdsSec', 'ms.tdssec', 'ltr', { hint: 'ms.tdssech' }],
      ['panOp', 'ms.panop', 'sel', { opts: [['', 'ms.panop_ok'], ['inoperative', 'ms.panop_in']], hint: 'ms.panoph' }], ['nr', 'ms.nr', 'sel', { opts: [['', 'ms.nr_no'], ['1', 'ms.nr_yes']] }],
      ['ldc.no', 'ms.ldcno', 'ltr', { hint: 'ms.ldch' }], ['ldc.rate', 'ms.ldcrate', 'num'], ['ldc.limit', 'ms.ldclim', 'num'], ['ldc.from', 'ms.ldcfrom', 'date'], ['ldc.to', 'ms.ldcto', 'date'],
      ['tcsOn', 'pm.tcson', 'check', { hint: 'pm.tcson_h' }], ['tcsRate', 'pm.tcsrate', 'num', { hint: 'pm.tcsrate_h' }],   /* V: sale bills switch TCS on for this party (docs.js) */
      ['_', 'pm.h_msme', 'head'],
      ['msme', 'cp.f_size', 'sel', { opts: [['', 'cp.sz_none'], ['micro', 'cp.sz_micro'], ['small', 'cp.sz_small'], ['medium', 'cp.sz_medium'], ['other', 'cp.sz_other']], hint: 'cp.h_size' }],
      ['udyam', 'cp.f_ud', 'ltr', { max: 22, upper: 1, ph: 'UDYAM-XX-00-0000000' }], ['agdays', 'cp.f_ag', 'num', { hint: 'cp.f_ag_h' }]] },
    { id: 'addr', t: 'pm.s_addr', f: [
      ['_', 'pm.h_bill', 'head'],
      ['addr', 'l.addr', 'area', { wide: 1 }], ['city', 'l.city', 'text'], ['pin', 'l.pin', 'ltr', { mode: 'numeric', max: 6 }],
      ['km', 'ms.km', 'num', { hint: 'ms.h_km' }],   /* V: the e-way bill distance (docs.js) */
      ['route', 'rtb.route', 'text', { hint: 'rtb.h_route' }], ['scheme', 'rtb.scheme', 'text', { hint: 'rtb.h_scheme' }],
      ['_', 'pm.h_ship', 'head'], ['ships', 'pm.ships', 'ships', { wide: 1 }]] },   /* V: the default place fills the bill's ship-to, the others are picked in the bill */
    { id: 'credit', t: 'pm.s_credit', f: [
      ['ptype', 'b1.ptype', 'sel', { opts: [['retail', 'b1.pt_retail'], ['wholesale', 'b1.pt_whole']], hint: 'b1.h_ptype' }],   /* V: item price list used on the party's bills */
      ['disc', 'pm.disc', 'num', { hint: 'pm.disc_h' }],   /* V: discount % on every new line of the party's bills */
      ['climit', 'b1.climit', 'num', { hint: 'b1.h_climit' }], ['cdays', 'b1.cdays', 'num', { hint: 'b1.h_cdays' }],   /* V: due date and credit limit warning */
      ['int.rate', 'pm.intrate', 'num', { hint: 'pm.intrate_h' }], ['int.grace', 'pm.intgrace', 'num'],   /* V: interest on late payment (Dues and the party's ledger) */
      ['prices', 'pm.prices', 'prices', { wide: 1 }]] },   /* V: the party's own item prices */
    { id: 'bank', t: 'pm.s_bank', f: [
      ['bankName', 'l.bank', 'text'], ['bankBranch', 'l.branch', 'text'], ['bankAcc', 'l.acc', 'ltr', { mode: 'numeric' }], ['bankIfsc', 'l.ifsc', 'ltr', { max: 11, upper: 1 }],
      ['upi', 'l.upi', 'ltr', { wide: 1, ph: 'name@bank' }], ['_', 'pm.bank_h', 'note']] },
    { id: 'more', t: 'pm.s_more', f: [
      ['_', 'pm.h_open', 'head'], ['ob', 'pm.ob', 'ob', { wide: 1 }],
      ['_', 'pm.h_trn', 'head'], ['tname', 'pm.tname', 'text', { hint: 'pm.tname_h' }], ['tid', 'pm.tid', 'ltr', { hint: 'pm.tid_h' }],   /* V: the transporter on the bill's dispatch details and e-way bill */
      ['_', 'pm.h_other', 'head'],
      ['notes', 'pm.notes', 'area', { wide: 1 }], ['biz', 'pb.usedby', 'usedby', { hint: 'pb.usedbyh' }], ['inactive', 'pm.inactive', 'check', { hint: 'pm.inactive_h' }]] }
  ];
  var ITEM = [
    { id: 'basic', t: 'pm.s_basic', f: [
      ['desc', 'hub.f.iname', 'text', { wide: 1 }], ['pname', 'pm.ipname', 'text', { hint: 'pm.ipname_h' }],
      ['kind', 'l.type', 'sel', { opts: [['goods', 'hub.k.goods'], ['service', 'hub.k.service']] }], ['group', 'grp.group', 'group', { hint: 'grp.h_igroup' }],
      ['code', 'hub.f.code', 'ltr'], ['barcode', 'pm.barcode', 'ltr', { hint: 'pm.barcode_h' }],   /* V: a scanned barcode finds the item (billing scan button) */
      ['unit', 'l.unit', 'unit'], ['alts', 'ms.alts', 'alts', { wide: 1 }],
      ['descr', 'pm.descr', 'area', { hint: 'pm.descr_h' }]] },   /* V: printed under the item name on bills */
    { id: 'tax', t: 'pm.s_tax', f: [
      ['hsn', 'l.hsn', 'ltr', { mode: 'numeric', max: 8, hint: 'pm.hsn_h' }], ['gst', 'l.gst', 'gst'],
      ['tax.kind', 'ms.tk', 'sel', { opts: [['taxable', 'ms.tk_taxable'], ['nil', 'ms.tk_nil'], ['exempt', 'ms.tk_exempt'], ['nongst', 'ms.tk_nongst']] }],
      ['tax.itc', 'ms.itc', 'sel', { opts: [['ok', 'ms.itc_ok'], ['blocked', 'ms.itc_blocked'], ['ineligible', 'ms.itc_inel']], hint: 'ms.itch' }],
      ['_slot', 'tax', 'slot'],
      ['incl', 'pm.incl', 'check', { hint: 'pm.incl_h' }]] },   /* V: the saved rates include GST: the bill takes the rate before tax */
    { id: 'price', t: 'pm.s_price', f: [
      ['rate', 'b1.retail', 'num', { hint: 'b1.h_retail' }], ['wrate', 'b1.whole', 'num'], ['mrp', 'b1.mrp', 'num'], ['prate', 'b1.prate', 'num'],
      ['disc', 'pm.idisc', 'num', { hint: 'pm.idisc_h' }],   /* V: discount % filled on the bill line */
      ['sl', 'bw.isl', 'text', { hint: 'bw.islh', only: 'multiled' }], ['pl', 'bw.ipl', 'text', { only: 'multiled' }],
      ['last', 'pm.last', 'last', { wide: 1 }]] },
    { id: 'stock', t: 'pm.s_stock', f: [
      ['track', 'ms.track', 'sel', { opts: [['', 'ms.tr_none'], ['batch', 'ms.tr_batch'], ['serial', 'ms.tr_serial'], ['both', 'ms.tr_both']], hint: 'pm.track_h' }],   /* V: batch / expiry / serial boxes on bill lines */
      ['min', 'ms.rlevel', 'num'], ['rq', 'ms.rqty', 'num'], ['max', 'ms.rmax', 'num'], ['lead', 'ms.rlead', 'num'], ['supplier', 'ms.rsup', 'text'],
      ['_', 'pm.h_ostock', 'head'], ['open', 'pm.open', 'open', { wide: 1 }],
      ['_', 'pm.stock_h', 'note']] },
    { id: 'mfg', t: 'pm.s_mfg', f: [['src', 'pm.src', 'sel', { opts: [['', 'pm.src_none'], ['bought', 'pm.src_bought'], ['made', 'pm.src_made'], ['both', 'pm.src_both']] }], ['bom', 'pm.bom', 'bom', { wide: 1 }]] },
    { id: 'more', t: 'pm.s_inote', f: [
      ['img', 'pm.img', 'img', { wide: 1 }], ['notes', 'pm.notes', 'area', { wide: 1 }],
      ['biz', 'pb.usedby', 'usedby', { hint: 'pb.usedbyh' }], ['inactive', 'pm.inactive', 'check', { hint: 'pm.iinactive_h' }]] }
  ];
  function secs(kind) { return kind === 'item' ? ITEM : PARTY; }
  function fobj(a) { return { key: a[0], lbl: a[1], type: a[2], x: a[3] || {} }; }
  function allFields(kind) { var out = []; secs(kind).forEach(function (s) { s.f.forEach(function (a) { if (a[2] !== 'head' && a[2] !== 'note' && a[2] !== 'slot') out.push(fobj(a)); }); }); return out; }

  /* ---------- html ---------- */
  function optHtml(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function groupOpts(list, kind, cur) {
    list = list || []; var out = kind === 'item' ? optHtml('', T('grp.none'), cur) : '';
    var sub = function (id, lv) { list.filter(function (x) { return x.under === id; }).forEach(function (x) { out += optHtml(x.id, (lv ? ' '.repeat(lv) : '') + x.name, cur); sub(x.id, lv + 1); }); };
    list.filter(function (g) { return !g.under; }).forEach(function (g) { out += optHtml(g.id, g.name, cur); sub(g.id, 1); });
    return out;
  }
  function field(f, rec, o) {
    var k = f.key, x = f.x, v = get(rec, k), id = fid(k), cls = 'pm-f' + (x.wide || f.type === 'area' ? ' wide' : '');
    if (v == null) v = '';
    if (f.type === 'head') return '<h4 class="pm-h">' + esc(T(f.lbl)) + '</h4>';
    if (f.type === 'note') return '<p class="pm-n soft wide">' + esc(T(f.lbl)) + '</p>';
    if (f.type === 'slot') return (o.slots && o.slots[f.lbl]) || '';
    if (x.only === 'multiled' && !o.multiLed) return '';
    var lbl = '<label for="' + id + '">' + esc(T(f.lbl)) + '</label>', hint = x.hint ? '<small class="hint">' + esc(T(x.hint)) + '</small>' : '', h;
    var nm = ' id="' + id + '" name="' + esc(k) + '"';
    switch (f.type) {
      case 'area': h = '<textarea' + nm + ' rows="2" dir="auto">' + esc(v) + '</textarea>'; break;
      case 'sel': h = '<select' + nm + '>' + x.opts.map(function (p) { return optHtml(p[0], T(p[1]), String(v === true ? '1' : v)); }).join('') + '</select>'; break;
      case 'state': h = '<select' + nm + '><option value="">—</option>' + NS.STATES.map(function (s) { return optHtml(s[0], s[0] + ' · ' + (NS.stateLoc ? NS.stateLoc(s[0]) : s[1]), v); }).join('') + '</select>'; break;
      case 'gst': {
        var cur = v === '' ? '' : +v, list = RATES.slice(); if (cur !== '' && list.indexOf(cur) < 0) list.push(cur); list.sort(function (a, b) { return a - b; });
        h = '<select' + nm + '>' + list.map(function (g) { return optHtml(g, g + '%' + (RATES.indexOf(g) < 0 ? ' ⚠' : ''), cur); }).join('') + '</select>'; break; }
      case 'unit': h = '<input' + nm + ' value="' + esc(v) + '" list="pm-units" dir="ltr" autocomplete="off">'; break;
      case 'check': return '<div class="' + cls + '"><label class="chk" for="' + id + '"><input type="checkbox"' + nm + (v ? ' checked' : '') + '> <span>' + esc(T(f.lbl)) + '</span></label>' + hint + '</div>';
      case 'group':
        if (o.groupHtml) h = '<select' + nm + '>' + o.groupHtml(rec, v) + '</select><span class="gnew" data-gnew hidden><label class="sr" for="' + id + '-new">' + esc(T('grp.newname')) + '</label><input id="' + id + '-new" dir="auto" maxlength="60" placeholder="' + esc(T('grp.newname')) + '"><button type="button" class="btn sm" data-gnew-add>' + esc(T('grp.addbtn')) + '</button></span>';
        else { var gc = v; if (o.kind === 'item' && o.meta && NS.itemGroup) { try { gc = NS.itemGroup(rec, o.meta).id || v; } catch (e) {} } h = '<select' + nm + '>' + groupOpts(o.groups, o.kind, gc) + '</select>'; }
        break;
      case 'usedby': {
        var bz = o.biz || []; if (bz.length < 2 && !v) return '';
        h = '<select' + nm + '><option value="">' + esc(T('pb.allbiz')) + '</option>' + bz.map(function (b) { return optHtml(b.id, T('pb.only', { b: b.name }), v); }).join('') + '</select>'; break; }
      case 'img': h = '<div class="pm-img"><img alt="" data-pmimg' + (v ? ' src="' + esc(v) + '"' : ' hidden') + '><input type="file" accept="image/*" data-pmimgin id="' + id + '"><button type="button" class="link" data-pmimgrm' + (v ? '' : ' hidden') + '>' + esc(T('hub.rmimg')) + '</button></div>'; break;
      case 'ships': return '<div class="' + cls + '" data-pmships>' + shipsHtml(rec) + '<button type="button" class="btn sm" data-pmshipadd>+ ' + esc(W('shipadd')) + '</button><small class="hint">' + esc(W('ships_h')) + '</small></div>';
      case 'ob': {
        var ob = o.ob, amt = ob ? num(ob.amount) : '', side = ob ? (ob.side === 'pay' ? 'pay' : 'recv') : (o.side === 'supplier' || (rec.role === 'supplier') ? 'pay' : 'recv');
        if (o.ob === false) return '';
        return '<div class="' + cls + '"><span class="pm-lbl">' + esc(T('ms.obal', { d: NS.fmtDate(fyStart()) })) + '</span><div class="pm-row"><input id="pm-obamt" name="obamt" inputmode="decimal" dir="ltr" value="' + esc(amt) + '" aria-label="' + esc(T('ms.obal', { d: NS.fmtDate(fyStart()) })) + '">' +
          '<select name="obside" aria-label="' + esc(T('ms.drcr')) + '">' + SIDE.map(function (p) { return optHtml(p[0], T(p[1]), side); }).join('') + '</select></div><small class="hint">' + esc(W('ob_h')) + (o.ctx === 'my' ? ' ' + esc(W('ob_link')) : ' <a href="#money" data-pmlink>' + esc(W('ob_link')) + '</a>') + '</small></div>'; }
      case 'prices': if (!window.NSReuse) return '';
        return '<div class="' + cls + '"><label for="' + id + '">' + esc(T(f.lbl)) + '</label><textarea' + nm.replace(' name="prices"', ' name="pricestext"') + ' rows="4" dir="auto" placeholder="' + esc(T('cap.prices_ph')) + '">' + esc(NSReuse.pricesText(rec.prices)) + '</textarea><small class="hint">' + esc(T('cap.prices_h')) + '</small>' +
          '<button type="button" class="btn sm" data-pmfillprices>' + esc(T('cap.prices_fill')) + '</button></div>';
      case 'alts': {
        var altv = window.NSMfg && NSMfg.altsOf ? NSMfg.altsOf(rec) : (rec.alt ? [rec.alt] : []);
        h = '<input' + nm.replace('name="alts"', 'name="altstext"') + ' dir="ltr" autocomplete="off" value="' + esc(altv.map(function (a) { return a.unit + ' = ' + a.per; }).join(', ')) + '" placeholder="Box = 12, Carton = 144">'; hint = '<small class="hint">' + esc(T('ms.altsh')) + '</small>'; break; }
      case 'bom': {
        var lines = rec.bom && (rec.bom.lines || []).length ? rec.bom.lines.map(function (l) { return l.desc + ' ' + l.qty; }).join(', ') : '';
        return '<div class="' + cls + '"><span class="pm-lbl">' + esc(T(f.lbl)) + '</span><p class="soft">' + esc(lines ? T('b2.hasbom', { l: lines }) : W('bom_none')) + '</p><small class="hint">' + esc(W('bom_h')) + (o.ctx === 'my' ? ' ' + esc(W('bom_link')) : ' <a href="#b2make" data-pmlink>' + esc(W('bom_link')) + '</a>') + '</small></div>'; }
      case 'open':
        if (rec.id || o.open === false) return '<div class="' + cls + '"><small class="hint">' + esc(W('open_edit')) + '</small></div>';
        return '<div class="' + cls + '"><span class="pm-lbl">' + esc(T('ms.oqty', { d: NS.fmtDate(fyStart()) })) + '</span><div class="pm-row"><input name="openqty" inputmode="decimal" dir="ltr" aria-label="' + esc(T('ms.oqty', { d: NS.fmtDate(fyStart()) })) + '" placeholder="' + esc(W('open_qty')) + '">' +
          '<input name="openrate" inputmode="decimal" dir="ltr" aria-label="' + esc(T('ms.orate')) + '" placeholder="' + esc(T('ms.orate')) + '">' +
          '<select name="opengd" aria-label="' + esc(W('godown')) + '">' + optHtml('', W('godown_main'), '') + (o.godowns || []).map(function (g) { return optHtml(g, g, ''); }).join('') + '</select></div></div>';
      case 'last': return '<div class="' + cls + '" data-pmlast><span class="pm-lbl">' + esc(T(f.lbl)) + '</span><p class="soft" data-pmlastbody>' + esc(rec.id ? '…' : W('last_new')) + '</p></div>';
      default: {
        var a = nm + ' value="' + esc(v) + '"';
        a += f.type === 'ltr' || f.type === 'gstin' || f.type === 'num' ? ' dir="ltr"' : ' dir="auto"';
        if (f.type === 'date') a += ' type="date"';
        if (x.mode === 'email') a += ' type="email" inputmode="email" autocapitalize="none"'; else if (x.mode) a += ' inputmode="' + x.mode + '"';
        if (f.type === 'num') a += ' inputmode="decimal"';
        if (x.max) a += ' maxlength="' + x.max + '"';
        if (f.type === 'gstin') { a += ' maxlength="15" autocapitalize="characters" spellcheck="false"'; hint = '<small class="hint" data-pmgst aria-live="polite"></small>'; }
        if (x.upper) a += ' autocapitalize="characters" spellcheck="false"';
        if (x.ph) a += ' placeholder="' + esc(x.ph) + '"';
        if (k === 'hsn') a += ' autocomplete="off"';
        h = '<input' + a + '>';
        if (f.type === 'gstin') h += '<span data-pmgstbtn></span>';
      }
    }
    return '<div class="' + cls + '">' + lbl + h + hint + '</div>';
  }
  function shipRow(s, i) {
    s = s || {};
    return '<div class="pm-ship" data-pmship><div class="pm-shh"><b>' + esc(i ? W('ship_n', { n: i + 1 }) : W('ship_def')) + '</b><button type="button" class="link" data-pmshiprm>' + esc(T('it.rm')) + '</button></div><div class="pm-g">' +
      '<div class="pm-f wide"><label>' + esc(T('l.shname')) + '</label><input data-sk="name" dir="auto" value="' + esc(s.name || '') + '"></div>' +
      '<div class="pm-f wide"><label>' + esc(T('l.shaddr')) + '</label><textarea data-sk="addr" rows="2" dir="auto">' + esc(s.addr || '') + '</textarea></div>' +
      '<div class="pm-f"><label>' + esc(T('l.shcity')) + '</label><input data-sk="city" dir="auto" value="' + esc(s.city || '') + '"></div>' +
      '<div class="pm-f"><label>' + esc(T('l.shpin')) + '</label><input data-sk="pin" inputmode="numeric" maxlength="6" dir="ltr" value="' + esc(s.pin || '') + '"></div>' +
      '<div class="pm-f"><label>' + esc(T('l.shstate')) + '</label><select data-sk="state"><option value="">—</option>' + NS.STATES.map(function (z) { return optHtml(z[0], z[0] + ' · ' + (NS.stateLoc ? NS.stateLoc(z[0]) : z[1]), s.state || ''); }).join('') + '</select></div>' +
      '<div class="pm-f"><label>' + esc(W('ship_gstin')) + '</label><input data-sk="gstin" maxlength="15" dir="ltr" autocapitalize="characters" value="' + esc(s.gstin || '') + '"></div></div></div>';
  }
  function shipsHtml(rec) {
    var list = []; if (rec.ship && (rec.ship.addr || rec.ship.name)) list.push(rec.ship); (rec.ships || []).forEach(function (s) { list.push(s); });
    return '<div data-pmshiplist>' + list.map(shipRow).join('') + '</div>';
  }
  var CSSDONE = false;
  function css() {
    if (CSSDONE) return; CSSDONE = true;
    var s = document.createElement('style'); s.id = 'pm-css';
    s.textContent = '.fg>.pm,.pm-g>.pm{grid-column:1/-1}.pm{min-width:0}.pm-tabs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:thin;border-bottom:1px solid var(--line);margin:0 0 12px;-webkit-overflow-scrolling:touch}' +
      '.pm-tabs button{flex:none;background:none;border:0;border-bottom:3px solid transparent;color:var(--soft);font:inherit;font-weight:600;font-size:.92rem;padding:10px 12px;min-height:44px;cursor:pointer;white-space:nowrap}' +
      '.pm-tabs button[aria-selected=true]{color:var(--ink);border-bottom-color:var(--accent)}.pm-tabs button:hover{color:var(--ink)}.pm-tabs button:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}' +
      '.pm-tabs button.pm-bad{color:var(--bad)}.pm-tabs button .pm-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-inline-start:6px;vertical-align:middle}' +
      '.pm-pane[hidden]{display:none}.pm-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
      '.pm-f{display:flex;flex-direction:column;gap:4px;min-width:0}.pm-f.wide,.pm-g>.wide,.pm-g>.pm-h,.pm-g>.pm-n{grid-column:1/-1}' +
      '.pm-f label,.pm-lbl{font-size:.86rem;font-weight:600}.pm-f label.chk{display:flex;align-items:center;gap:8px;min-height:44px;font-size:.95rem;font-weight:500}' +
      '.pm-h{margin:10px 0 0;font-size:.95rem;padding-top:10px;border-top:1px solid var(--line)}.pm-g>.pm-h:first-child{border-top:0;padding-top:0;margin-top:0}.pm-n{margin:4px 0}' +
      '.pm-row{display:flex;gap:8px;flex-wrap:wrap}.pm-row>*{flex:1 1 110px;min-width:0}' +
      '.pm-ship{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:0 0 10px}.pm-shh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}' +
      '.pm-img{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.pm-img img{max-width:120px;max-height:120px;border-radius:8px;border:1px solid var(--line)}' +
      '.pm .hint{color:var(--soft);font-size:.82rem}.pm .hint.good{color:var(--ok)}.pm .hint.bad{color:var(--bad)}.pm-msg{color:var(--bad);margin:8px 0 0;font-weight:600}' +
      '.pm input,.pm select,.pm textarea{width:100%;box-sizing:border-box}.pm input[type=checkbox]{width:20px}.pm input[type=file]{width:auto}' +
      '.pm-last table{border-collapse:collapse;font-size:.85rem}.pm-last td,.pm-last th{padding:3px 10px 3px 0;text-align:left}' +
      '.qa-dlg.pm-dlg .qa-form{max-width:780px}.acx-dlg.pm-wide{max-width:min(860px,96vw)}#hub-form.pm-wide{max-width:min(860px,96vw)}' +
      '@media (max-width:420px){.pm-row{flex-direction:column}.pm-row>*{flex:none}}@media (max-width:560px){.pm-g{grid-template-columns:1fr}.pm-tabs button{padding:10px 10px;font-size:.88rem}}';
    document.head.appendChild(s);
  }
  function html(kind, rec, o) {
    css(); rec = rec || {}; o = o || {}; o.kind = kind;
    var skip = {}; (o.skip || []).forEach(function (k) { skip[k] = 1; });
    var panes = [], tabs = [], first = true;
    var hasCf = window.NSCF && NSCF.formHtml && NSCF.formHtml(kind, rec);
    secs(kind).forEach(function (s) {
      var body = s.f.filter(function (a) { return !skip[a[0]] || a[2] === 'head'; }).map(function (a) { return field(fobj(a), rec, o); }).join('');
      body = body.replace(/(<h4 class="pm-h">[^<]*<\/h4>)(?=(<h4 class="pm-h">|$))/g, '');   /* a heading with nothing under it */
      if (!body.replace(/<h4[^>]*>.*?<\/h4>/g, '').trim()) return;
      tabs.push('<button type="button" role="tab" id="pmt-' + s.id + '" data-pmt="' + s.id + '" aria-controls="pmp-' + s.id + '" aria-selected="' + (first ? 'true' : 'false') + '" tabindex="' + (first ? 0 : -1) + '">' + esc(T(s.t)) + '</button>');
      panes.push('<div class="pm-pane" role="tabpanel" id="pmp-' + s.id + '" data-pmp="' + s.id + '" aria-labelledby="pmt-' + s.id + '"' + (first ? '' : ' hidden') + '><div class="pm-g">' + body + '</div></div>');
      first = false;
    });
    if (hasCf) {
      tabs.push('<button type="button" role="tab" id="pmt-cf" data-pmt="cf" aria-controls="pmp-cf" aria-selected="false" tabindex="-1">' + esc(W('s_cf')) + '</button>');
      panes.push('<div class="pm-pane" role="tabpanel" id="pmp-cf" data-pmp="cf" aria-labelledby="pmt-cf" hidden>' + hasCf + '</div>');
    }
    return '<div class="pm" data-pm="' + kind + '"><div class="pm-tabs" role="tablist" aria-label="' + esc(W(kind === 'item' ? 'tabs_item' : 'tabs_party')) + '">' + tabs.join('') + '</div>' + panes.join('') +
      '<datalist id="pm-units">' + (o.units || UNITS).map(function (u) { return '<option value="' + esc(u) + '">'; }).join('') + '</datalist><p class="pm-msg" role="alert" hidden data-pmmsg></p></div>';
  }

  /* ---------- behaviour ---------- */
  function showTab(root, id, focus) {
    $$('[data-pmt]', root).forEach(function (b) { var on = b.getAttribute('data-pmt') === id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$('[data-pmp]', root).forEach(function (p) { p.hidden = p.getAttribute('data-pmp') !== id; });
  }
  function say(root, msg) { var m = $('[data-pmmsg]', root); if (m) { m.textContent = msg || ''; m.hidden = !msg; } }
  function fail(form, el, msg) {
    var root = $('.pm', form), pane = el && el.closest && el.closest('[data-pmp]');
    if (pane) { showTab(root, pane.getAttribute('data-pmp')); var b = $('[data-pmt="' + pane.getAttribute('data-pmp') + '"]', root); if (b) { b.classList.add('pm-bad'); setTimeout(function () { b.classList.remove('pm-bad'); }, 4000); } }
    say(root, msg); if (el && el.focus) el.focus(); NS.toast(msg, 'bad');
    return { msg: msg, el: el };
  }
  function gstHint(form) {
    var g = form.elements.gstin; if (!g) return;
    g.value = g.value.toUpperCase().replace(/\s/g, '');
    var c = NS.gstinCheck(g.value), h = $('[data-pmgst]', form), st = form.elements.state;
    if (h) {
      if (c.empty) { h.textContent = ''; h.className = 'hint'; }
      else if (g.value.length < 15) { h.textContent = T('hub.gst.typing', { n: 15 - g.value.length }); h.className = 'hint'; }
      else { h.textContent = c.ok ? T('hub.gst.ok', { state: NS.stateLoc(c.state) || '—', pan: c.pan }) : c.msg; h.className = 'hint ' + (c.ok ? 'good' : 'bad'); }
    }
    if (c.ok) {
      if (c.state && st && !st.value) st.value = c.state;
      if (form.elements.pan && !form.elements.pan.value) form.elements.pan.value = g.value.slice(2, 12);
      var rg = form.elements.reg; if (rg && (rg.value === '' || rg.value === 'unreg') && rg.querySelector('option[value=regular]')) rg.value = rg.value === 'unreg' ? 'regular' : rg.value;
    }
  }
  function ifscHint(form) {
    var i = form.elements.bankIfsc; if (!i) return; i.value = i.value.toUpperCase().replace(/\s/g, '');
    var ok = !i.value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(i.value); i.setCustomValidity(''); i.classList.toggle('pm-badin', !ok);
    i.setAttribute('aria-invalid', ok ? 'false' : 'true');
  }
  function shrink(file, max) {
    return new Promise(function (res) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () { var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .82)); };
      img.onerror = function () { NS.toast(T('img.bad'), 'bad'); res(''); };
      img.src = url;
    });
  }
  function lastRates(form, kind, rec) {
    var box = $('[data-pmlastbody]', form); if (!box || !rec.desc || !window.NSReuse || !NSReuse.rateHistory) return;
    NSStore.list('doc').then(function (docs) {
      var one = function (side) { try { return NSReuse.rateHistory(docs, '', '', rec.desc, side, 3) || []; } catch (e) { return []; } };
      var s = one('sale'), b = one('buy');
      var row = function (lbl, L) { return L.length ? '<tr><th>' + esc(lbl) + '</th><td>' + L.map(function (x) { return esc(NS.money(x.rate)) + (x.date ? ' <small>(' + esc(NS.fmtDate(x.date)) + ')</small>' : ''); }).join(' · ') + '</td></tr>' : ''; };
      var h = row(W('last_sale'), s) + row(W('last_buy'), b);
      box.parentNode.classList.add('pm-last'); box.outerHTML = h ? '<table>' + h + '</table>' : '<p class="soft">' + esc(W('last_none')) + '</p>';
    }, function () {});
  }
  function wire(form, kind, rec, o) {
    css(); rec = rec || {}; o = o || {};
    var root = $('.pm', form); if (!root || root._pmWired) return; root._pmWired = 1;
    form._pmRec = rec; form._pmO = o;
    var tabs = $('.pm-tabs', root);
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-pmt]'); if (b) showTab(root, b.getAttribute('data-pmt')); });
    tabs.addEventListener('keydown', function (e) {
      var L = $$('[data-pmt]', tabs), i = L.indexOf(document.activeElement); if (i < 0 || !/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return;
      e.preventDefault(); var rtl = getComputedStyle(root).direction === 'rtl', n = e.key === 'Home' ? 0 : e.key === 'End' ? L.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1) + L.length) % L.length;
      showTab(root, L[n].getAttribute('data-pmt'), true);
    });
    /* a dot on a tab that holds something typed in it, so a long form shows where the data is */
    function dots() { $$('[data-pmp]', root).forEach(function (p) { var has = [].some.call(p.querySelectorAll('input:not([type=file]):not([type=checkbox]),textarea,select'), function (x) { return x.value && x.defaultValue !== undefined && (x.tagName === 'SELECT' ? x.selectedIndex > 0 && !x.name.match(/^(role|kind|ptype|tax\.kind|tax\.itc|gst|unit|group|obside|reg)$/) : x.value !== ''); }) || [].some.call(p.querySelectorAll('input[type=checkbox]'), function (c) { return c.checked; });
      var b = $('[data-pmt="' + p.getAttribute('data-pmp') + '"]', root), d = $('.pm-dot', b); if (has && !d) b.insertAdjacentHTML('beforeend', '<span class="pm-dot" aria-hidden="true"></span>'); else if (!has && d) d.remove(); }); }
    form.addEventListener('input', dots); form.addEventListener('change', dots); setTimeout(dots, 0);
    if (form.elements.gstin) {
      form.elements.gstin.addEventListener('input', function () { gstHint(form); }); gstHint(form);
      var slot = $('[data-pmgstbtn]', form);
      if (NS.gstFetchButton) NS.gstFetchButton(form.elements.gstin, function (d) {
        ['name', 'addr', 'city', 'pin', 'state'].forEach(function (k) { var el = form.elements[k]; if (el && d[k] && (k !== 'name' || !el.value.trim())) el.value = d[k]; });
        if (d.reg && form.elements.reg) form.elements.reg.value = d.reg;
        form._pmGst = { legal: d.legal || '', trade: d.trade || '', status: d.status || '', type: d.type || '', since: d.since || '', checked: d.checked };
        gstHint(form); dots();
      });
      void slot;
    }
    if (form.elements.bankIfsc) form.elements.bankIfsc.addEventListener('input', function () { ifscHint(form); });
    if (form.elements.pan) form.elements.pan.addEventListener('input', function () { this.value = this.value.toUpperCase().replace(/\s/g, ''); });
    if (form.elements.role) form.elements.role.addEventListener('change', function () {
      if (form.elements.group && !o.groupHtml && /^(debtors|creditors)$/.test(form.elements.group.value)) form.elements.group.value = this.value === 'supplier' ? 'creditors' : 'debtors';
      if (form.elements.obside && !(o.ob && o.ob.id)) form.elements.obside.value = this.value === 'supplier' ? 'pay' : 'recv';
    });
    if (form.elements.hsn) form.elements.hsn.addEventListener('input', function () {
      var v = this.value.replace(/\D/g, ''); if (/^99/.test(v) && form.elements.kind) form.elements.kind.value = 'service';
      if (v.length >= 4 && NS.hsnRate && form.elements.gst && !form.elements.gst._pmTouched) { try { var r = NS.hsnRate(v); if (r && r.one != null && !isNaN(+r.one)) form.elements.gst.value = String(+r.one); } catch (e) {} }
    });
    if (form.elements.gst) form.elements.gst.addEventListener('change', function () { this._pmTouched = true; });
    /* ship-to places */
    var sh = $('[data-pmships]', form);
    if (sh) {
      var redraw = function () { $$('[data-pmship]', sh).forEach(function (r, i) { $('b', r).textContent = i ? W('ship_n', { n: i + 1 }) : W('ship_def'); }); };
      sh.addEventListener('click', function (e) {
        if (e.target.closest('[data-pmshipadd]')) { $('[data-pmshiplist]', sh).insertAdjacentHTML('beforeend', shipRow({}, $$('[data-pmship]', sh).length)); redraw(); var l = $$('[data-pmship]', sh); $('input', l[l.length - 1]).focus(); }
        var rm = e.target.closest('[data-pmshiprm]'); if (rm) { rm.closest('[data-pmship]').remove(); redraw(); }
      });
      if (!$$('[data-pmship]', sh).length) $('[data-pmshiplist]', sh).innerHTML = shipRow({}, 0);
    }
    /* picture */
    var imgin = $('[data-pmimgin]', form);
    if (imgin) {
      var im = $('[data-pmimg]', form), rm = $('[data-pmimgrm]', form); form._pmImg = rec.img || '';
      imgin.addEventListener('change', function () { var f = imgin.files[0]; if (f) shrink(f, 480).then(function (u) { form._pmImg = u; im.src = u; im.hidden = !u; rm.hidden = !u; }); });
      rm.addEventListener('click', function () { form._pmImg = ''; im.hidden = true; rm.hidden = true; imgin.value = ''; });
    }
    /* special prices: fill from the last bills of this party */
    var fp = $('[data-pmfillprices]', form);
    if (fp && window.NSReuse) fp.addEventListener('click', function () {
      var ta = form.elements.pricestext, nm = form.elements.name && form.elements.name.value.trim() || rec.name;
      if (!nm) { NS.toast(T('cap.prices_name'), 'bad'); return; }
      var side = form.elements.role && form.elements.role.value === 'supplier' ? 'buy' : 'sale';
      NSStore.list('doc').then(function (docs) {
        var have = NSReuse.parsePrices(ta.value), seen = {}; have.forEach(function (x) { seen[NSReuse.key(x.item)] = 1; });
        var add = NSReuse.lastRates(docs, '', nm, side).filter(function (x) { return !seen[NSReuse.key(x.item)]; });
        if (!add.length && !have.length) { NS.toast(T('cap.prices_none'), 'bad'); return; }
        ta.value = NSReuse.pricesText(have.concat(add.map(function (x) { return { item: x.item, rate: x.rate }; }))); NS.toast(T('cap.prices_filled', { n: add.length }));
      }).catch(function () { NS.toast(T('cap.prices_none'), 'bad'); });
    });
    if (kind === 'item') lastRates(form, kind, rec);
    /* links to other screens inside the App close the form first */
    root.addEventListener('click', function (e) { var a = e.target.closest('[data-pmlink]'); if (!a) return; var d = form.closest('dialog'); if (d && d.close) d.close(); });
    /* Enter moves to the next box, on every tab; on the last one it saves */
    form.addEventListener('keydown', function (e) {
      var t = e.target; if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || !t || !/^(INPUT|SELECT)$/.test(t.tagName) || /^(checkbox|radio|submit|button|file)$/.test(t.type) || t.closest('.pk-box')) return;
      if (t.hasAttribute('list') && t.getAttribute('aria-expanded') === 'true') return;
      var all = $$('input,select,textarea', form).filter(function (x) { return !x.disabled && x.type !== 'hidden' && x.type !== 'file' && !x.closest('[hidden]') || (x.closest('[data-pmp][hidden]') && !x.closest('[data-gnew]') && !x.disabled && x.type !== 'hidden' && x.type !== 'file'); });
      var i = all.indexOf(t); if (i < 0) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (i < all.length - 1) { var n = all[i + 1], p = n.closest('[data-pmp]'); if (p) showTab(root, p.getAttribute('data-pmp')); n.focus(); if (n.select && /^(text|search|tel|email|number|)$/.test(n.type)) { try { n.select(); } catch (x) {} } }
      else if (form.requestSubmit) form.requestSubmit();
    }, true);
  }

  /* ---------- reading the boxes ---------- */
  function read(form, kind, rec, o) {
    o = o || form._pmO || {}; rec = rec || form._pmRec || {};
    var skip = {}; (o.skip || []).forEach(function (k) { skip[k] = 1; }); var els = form.elements, bad = null;
    var v = function (k) { var e = els[k]; return e ? String(e.value || '').trim() : ''; };
    allFields(kind).forEach(function (f) {
      var k = f.key; if (skip[k] || bad) return;
      var e = els[k]; if (!e && f.type !== 'prices' && f.type !== 'alts') return;
      switch (f.type) {
        case 'ships': case 'ob': case 'bom': case 'last': case 'open': case 'img': case 'prices': case 'alts': return;
        case 'check': if (e.checked) set(rec, k, true); else unset(rec, k); return;
        case 'num': { var s = v(k); if (s === '') unset(rec, k); else set(rec, k, num(s)); return; }
        case 'gst': { var g = v(k); if (g === '') unset(rec, k); else rec.gst = +g; return; }
        case 'group': return;
        case 'unit': { var u = v(k); rec.unit = u || 'Nos'; return; }
        case 'sel': {
          var sv = v(k);
          if (k === 'role' || k === 'kind' || k === 'ptype') { rec[k] = sv || rec[k] || (k === 'role' ? 'customer' : k === 'kind' ? 'goods' : 'retail'); if (k === 'ptype' && rec.ptype === 'retail' && !rec.id) delete rec.ptype; return; }
          if (k === 'nr') { if (sv) rec.nr = true; else delete rec.nr; return; }
          if (k === 'tax.kind') { if (sv && sv !== 'taxable') set(rec, k, sv); else unset(rec, k); return; }
          if (k === 'tax.itc') { if (sv && sv !== 'ok') set(rec, k, sv); else unset(rec, k); return; }
          if (sv) set(rec, k, sv); else unset(rec, k); return; }
        case 'usedby': if (e) { if (e.value) rec.biz = e.value; else delete rec.biz; } return;
        default: {
          var t = v(k); if (f.x.upper || f.type === 'gstin') t = t.toUpperCase().replace(/\s/g, '');
          if (k === 'hsn') t = t.replace(/\D/g, '');
          if (k === 'ldc.no' || k.indexOf('ldc.') === 0) return;   /* the certificate is read as one piece below */
          if (t === '') unset(rec, k); else set(rec, k, t);
        }
      }
    });
    if (bad) return bad;
    var nm = v(kind === 'item' ? 'desc' : 'name').replace(/\s+/g, ' ');
    if (!skip[kind === 'item' ? 'desc' : 'name']) {
      if (!nm) return fail(form, els[kind === 'item' ? 'desc' : 'name'], T('hub.v.name'));
      rec[kind === 'item' ? 'desc' : 'name'] = nm;
    }
    var gs = v('gstin');
    if (kind === 'party') {
      if (gs) { var ck = NS.gstinCheck(gs); if (!ck.ok) return fail(form, els.gstin, ck.msg || T('qa.badgst')); if (!rec.state && ck.state) rec.state = ck.state; }
      var pan = v('pan'); if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return fail(form, els.pan, T('ms.panbad'));
      if (v('pin') && !/^\d{6}$/.test(v('pin'))) return fail(form, els.pin, W('badpin'));
      if (v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) return fail(form, els.email, W('bademail'));
      if (v('bankIfsc') && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v('bankIfsc'))) return fail(form, els.bankIfsc, T('hub.v.ifsc'));
      if (v('udyam')) { var ud = /^UDYAM([A-Z]{2})(\d{2})(\d{7})$/.exec(v('udyam').toUpperCase().replace(/[^A-Z0-9]/g, '')); if (!ud) return fail(form, els.udyam, T('cp.udbad')); rec.udyam = 'UDYAM-' + ud[1] + '-' + ud[2] + '-' + ud[3]; }
      if (rec.agdays != null) rec.agdays = Math.max(0, Math.min(45, Math.floor(rec.agdays)));
      if (rec.disc != null && (rec.disc < 0 || rec.disc > 100)) return fail(form, els.disc, W('baddisc'));
      if (!rec.msme) delete rec.msme;
      /* GSTIN look-up result and the PAN-based deductee type */
      if (form._pmGst) rec.gst = Object.assign({}, rec.gst || {}, form._pmGst);
      if (!rec.deductee && rec.pan && window.NSGst && NSGst.deducteeOf) { var dd = NSGst.deducteeOf(rec.pan); if (dd) rec.deductee = dd; }
      var lno = v('ldc.no'); if (els['ldc.no']) { if (lno) rec.ldc = [{ no: lno, rate: num(v('ldc.rate')), limit: num(v('ldc.limit')), from: v('ldc.from'), to: v('ldc.to'), sec: rec.tdsSec || '' }]; else delete rec.ldc; }
      if (rec.int && rec.int.rate == null && rec.int.grace == null) delete rec.int;
      if (rec.int && rec.int.rate != null && rec.int.rate < 0) return fail(form, els['int.rate'], W('badint'));
      /* ship-to places: the first is the default one (rec.ship, as before), the others are rec.ships */
      var rows = $$('[data-pmship]', form).map(function (r) { var s = {}; $$('[data-sk]', r).forEach(function (i) { var x = i.value.trim(); if (x) s[i.getAttribute('data-sk')] = i.getAttribute('data-sk') === 'gstin' ? x.toUpperCase() : x; }); return s; }).filter(function (s) { return s.addr || s.name; });
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].gstin && !NS.gstinCheck(rows[i].gstin).ok) return fail(form, $$('[data-pmship]', form)[i].querySelector('[data-sk=gstin]'), NS.gstinCheck(rows[i].gstin).msg || T('qa.badgst'));
        if (rows[i].pin && !/^\d{6}$/.test(rows[i].pin)) return fail(form, $$('[data-pmship]', form)[i].querySelector('[data-sk=pin]'), W('badpin'));
      }
      if (rows.length) rec.ship = rows[0]; else if ($('[data-pmships]', form)) delete rec.ship;
      if (rows.length > 1) rec.ships = rows.slice(1); else if ($('[data-pmships]', form)) delete rec.ships;
      if (els.pricestext && window.NSReuse) { var pl = NSReuse.parsePrices(els.pricestext.value); if (pl.length) rec.prices = pl; else delete rec.prices; }
      var grp = els.group && !skip.group ? els.group.value : null;
      if (grp != null) { if (grp === '+' || !grp || grp === 'debtors' || grp === 'creditors') delete rec.group; else rec.group = grp; }
      if (rec.role === 'both' && els.role) rec.role = 'both';
    } else {
      var hs = v('hsn'); if (hs && !/^(\d{2}|\d{4}|\d{6}|\d{8})$/.test(hs)) return fail(form, els.hsn, T('ms.hsnbad'));
      if (rec.disc != null && (rec.disc < 0 || rec.disc > 100)) return fail(form, els.disc, W('baddisc'));
      if (els.altstext) {
        var al = parseAlts(els.altstext.value, rec.unit); if (al === null) return fail(form, els.altstext, T('ms.altsbad'));
        if (al.length) { rec.alts = al; rec.alt = al[0]; } else { delete rec.alts; delete rec.alt; }
      }
      ['min', 'rq', 'max', 'lead'].forEach(function (k) { if (rec[k] != null && !(rec[k] > 0)) delete rec[k]; });
      if (!rec.track) delete rec.track;
      if (form._pmImg !== undefined && $('[data-pmimgin]', form)) { if (form._pmImg) rec.img = form._pmImg; else delete rec.img; }
      if (els.group && !skip.group) {
        var gv = els.group.value;
        if (gv && gv !== '+') { rec.group = gv; rec.cat = (els.group.options[els.group.selectedIndex].text || '').replace(/^[\s ]+/, ''); } else if (gv !== '+') { if (rec.group || !rec.cat) rec.cat = ''; delete rec.group; }   /* an old item that only has a category name keeps it */
      }
      if (rec.tax && !Object.keys(rec.tax).length) delete rec.tax;
    }
    /* the opening entry typed on the form, for NSPM.opening */
    form._pmX = { obAmt: els.obamt ? num(els.obamt.value) : null, obSide: els.obside ? els.obside.value : 'recv', hasOb: !!els.obamt,
      openQty: els.openqty ? num(els.openqty.value) : 0, openRate: els.openrate ? num(els.openrate.value) : 0, openGd: els.opengd ? els.opengd.value : '' };
    if (window.NSCF && NSCF.formRead && $('[data-cfbox]', form)) NSCF.formRead(kind, form, rec);
    say($('.pm', form), '');
    return '';
  }
  function parseAlts(txt, base) {
    var out = [], bad = false, uk = function (s) { return String(s || '').trim().toLowerCase(); };
    String(txt || '').split(/[,;]+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (part) {
      var m = /^(.+?)\s*(?:=|:|\s)\s*([0-9]*\.?[0-9]+)\s*(?:[A-Za-z. ]*)$/.exec(part);
      if (!m || !(parseFloat(m[2]) > 0) || uk(m[1]) === uk(base)) { bad = true; return; }
      out.push({ unit: m[1].trim(), per: parseFloat(m[2]) });
    });
    return bad ? null : out;
  }

  /* ---------- opening balance / opening stock ---------- */
  function findOb(docs, name, bizName) {
    var k = key(name), b = key(bizName); return (docs || []).filter(function (d) { return d.type === 'ob' && !d.bacct && d.side !== 'bank' && key(d.buyer && d.buyer.name) === k && (!b || key(d.seller && d.seller.name) === b); })[0] || null;
  }
  function opening(form, kind, rec, o) {
    o = o || form._pmO || {}; var x = form._pmX || {}, sp = Promise.resolve(typeof o.seller === 'function' ? o.seller() : o.seller);
    if (kind === 'party') {
      if (!x.hasOb) return Promise.resolve();
      var amt = Math.round((x.obAmt || 0) * 100) / 100, old = o.ob || null;
      if (amt > 0) return sp.then(function (b) {
        if (!b && !old) return null;
        var d = Object.assign(old ? JSON.parse(JSON.stringify(old)) : { type: 'ob', app: 1, no: '', date: fyStart(), seller: b }, { buyer: { name: rec.name }, side: x.obSide === 'pay' ? 'pay' : 'recv', amount: amt, total: amt });
        return NSStore.put('doc', d);
      });
      if (old && old.id) return NSStore.del('doc', old.id);
      return Promise.resolve();
    }
    if (x.openQty > 0 && rec.kind !== 'service') return sp.then(function (b) {
      if (!b) return null;
      var d = { type: 'stk', kind: 'open', date: fyStart(), no: '', seller: b, lines: [{ desc: rec.desc, unit: rec.unit, qty: x.openQty, rate: x.openRate || rec.prate || '' }] };
      if (x.openGd) d.gd = x.openGd;
      return NSStore.put('doc', d);
    });
    return Promise.resolve();
  }

  /* ---------- the small box of NS.quickAdd ---------- */
  function load() {
    return Promise.all([NSStore.meta('groups').catch(function () { return {}; }), NSStore.list('biz').catch(function () { return []; }), NSStore.meta('settings').catch(function () { return {}; })]).then(function (r) {
      var S = r[2] || {}, gd = (S.godowns || []).slice(); try { var b = S.byBiz || {}; Object.keys(b).forEach(function (id) { (b[id].godowns || []).forEach(function (g) { if (gd.indexOf(g) < 0) gd.push(g); }); }); } catch (e) {}
      return { meta: r[0] || {}, biz: r[1] || [], godowns: gd, multiLed: !!(S.multiLed) };
    });
  }
  function quick(inp, q, side) {
    var item = q.kind === 'item', name = (inp.value || '').trim(), d = document.getElementById('qa-dlg');
    if (!d) { d = NS.el('dialog', { id: 'qa-dlg', 'class': 'qa-dlg' }); document.body.appendChild(d); }
    d.classList.add('pm-dlg');
    return load().then(function (L) {
      var rec = item ? { kind: 'goods', unit: 'Nos', gst: 18 } : { role: side || 'customer' };
      if (name) rec[item ? 'desc' : 'name'] = name;
      var P = q.pre && !item ? q.pre : null;
      if (P) ['gstin', 'phone', 'addr', 'city', 'state', 'pan', 'pin', 'email', 'km', 'agent'].forEach(function (k) { if (P[k] != null && String(P[k]).trim() !== '') rec[k] = String(P[k]).trim(); });
      if (P && P.role) rec.role = P.role;
      var groups = NS.groupsOf(L.meta, item ? 'item' : 'party');
      var o = { ctx: 'quick', meta: L.meta, groups: groups, biz: L.biz, godowns: L.godowns, multiLed: L.multiLed, side: side,
        seller: function () { return window.NSApp && NSApp.biz && NSApp.biz() ? NSApp.biz() : NS.defaultBiz(); } };
      d.innerHTML = '<div class="dlg-hd"><h2>' + esc(T(item ? 'qa.titem' : 'qa.tparty')) + '</h2></div><form class="qa-form" novalidate>' + html(item ? 'item' : 'party', rec, o) +
        '<div class="qa-acts"><button type="submit" class="btn primary">' + esc(T('qa.save')) + '</button><button type="button" class="btn" data-qa-x>' + esc(T('qa.cancel')) + '</button></div></form>';
      var form = d.querySelector('form');
      if (!item) { var gs = form.elements.group; gs.value = (rec.role === 'supplier') ? 'creditors' : 'debtors'; if (form.elements.obside) form.elements.obside.value = rec.role === 'supplier' ? 'pay' : 'recv'; }
      wire(form, item ? 'item' : 'party', rec, o);
      if (P && P.gstin && form.elements.gstin) gstHint(form);
      d.querySelector('[data-qa-x]').addEventListener('click', function () { d.removeAttribute('data-dirty'); d.close(); inp.focus(); });
      d.addEventListener('close', function () { setTimeout(function () { if (document.contains(inp)) inp.focus(); }, 0); }, { once: true });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nm = (form.elements[item ? 'desc' : 'name'].value || '').trim().replace(/\s+/g, ' ');
        if (!nm) { fail(form, form.elements[item ? 'desc' : 'name'], T('qa.needname')); return; }
        if (q.known(nm) && nm.toLowerCase() !== name.toLowerCase()) { fail(form, form.elements[item ? 'desc' : 'name'], T('qa.exists')); return; }
        var r = JSON.parse(JSON.stringify(rec)), er = read(form, item ? 'item' : 'party', r, o); if (er) return;
        if (!item && !r.role) r.role = side || 'customer';
        opening(form, item ? 'item' : 'party', r, o).then(function () { return NSStore.put(item ? 'item' : 'party', r); }).then(function (saved) {
          var s2 = saved && saved.id ? saved : r;
          d.removeAttribute('data-dirty'); d.close(); if (inp._qaChip) inp._qaChip.hidden = true;
          NS.toast(T(item ? 'qa.itemok' : 'qa.partyok', { n: nm })); q.done(s2);
        }, function (er2) { say($('.pm', form), (er2 && er2.message) || T('qa.fail')); });
      });
      if (!d._qaKeys) { d._qaKeys = 1; d.addEventListener('keydown', function (e) {
        var k = (e.key || '').toLowerCase(), f = d.querySelector('form'); if (!f) return;
        if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 's' || k === 'enter')) { e.preventDefault(); e.stopImmediatePropagation(); if (f.requestSubmit) f.requestSubmit(); }
      }); }
      d.showModal();
      setTimeout(function () { var x = form.elements[item ? 'hsn' : 'gstin']; ((name && x) ? x : form.elements[item ? 'desc' : 'name']).focus(); if (name && x) showTab($('.pm', form), item ? 'tax' : 'gst'); }, 30);
    });
  }

  window.NSPM = { html: html, wire: wire, read: read, opening: opening, quick: quick, findOb: findOb, fields: allFields, sections: secs, parseAlts: parseAlts, groupOpts: groupOpts, show: showTab, load: load, fail: fail };
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* my.js */
try{/* my.niveshsahayak.in: the Configuration Hub of the Nivesh Sahayak document tools.
   Masters (businesses, customers and suppliers, items and services) can be added, edited, imported and exported here;
   Settings (default business, numbering, new-document defaults, backup reminder) are saved in the data home as meta 'settings'
   and read by every document tool (docs.js). Everything stays in this browser. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t;
  var UNITS = ['Nos', 'Pcs', 'Kg', 'Gm', 'Ltr', 'Ml', 'Mtr', 'Sq ft', 'Box', 'Pack', 'Set', 'Pair', 'Dozen', 'Bag', 'Ton', 'Hrs', 'Days', 'Month', 'Job'];
  /* GST rates in use today (same list as the document makers from 1 Feb 2026: 28% is gone); an old saved rate still shows so it can be changed */
  var RATES = [0, 0.1, 0.25, 1.5, 3, 5, 12, 18, 40];
  function ratesWith(v) { return v === '' || v == null || RATES.some(function (g) { return String(g) === String(v); }) ? RATES : RATES.concat([Number(v)]).sort(function (a, b) { return a - b; }); }
  var ACCENTS = ['#0B3B5B', '#1D4ED8', '#047857', '#B45309', '#9D174D', '#334155'];
  var LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var BILLING = LOCAL ? 'http://localhost:8861/' : 'https://billing.niveshsahayak.in/';
  /* every document tool [site, host, name key, line key, local port] (build.py TOOLS); which site makes which document type */
  var TOOLS = (window.NS_CFG && NS_CFG.tools) || [['billing', 'billing.niveshsahayak.in', 'nav.billing', 'hub.billing', 8861]];
  var SITEOF = { invoice: 'billing', quote: 'quotation', proforma: 'proforma', so: 'sales-order', challan: 'challan', po: 'purchase-order', self: 'self-invoice', note: 'credit-note', cashmemo: 'cash-memo',
    receipt: 'receipt', voucher: 'voucher', rent: 'rent-receipt', salary: 'salary-slip', petty: 'petty-cash' };
  /* shop and trade records (kit.js): type -> [site, name key]; they open in their own site with ?open=<id> */
  var KITOF = { pos: ['pos', 'nav.pos'], pharma: ['pharmacy', 'nav.pharmacy'], resto: ['restaurant', 'nav.restaurant'], lr: ['bilty', 'nav.bilty'], job: ['job-card', 'nav.jobcard'], hotel: ['hotel', 'nav.hotel'], rentb: ['rent', 'nav.rentmgr'],
    rabill: ['contractor-bill', 'nav.contractorbill'], fee: ['fee-receipt', 'nav.feereceipt'] };
  KITOF.visit = ['clinic', 'nav.clinic']; KITOF.svc = ['salon', 'nav.salon'];
  KITOF.jewel = ['jewellery', 'nav.jewellery']; KITOF.garment = ['garment', 'nav.garment'];   /* group C trade tools */
  KITOF.dairy = ['dairy', 'nav.dairy']; KITOF.subs = ['subscribers', 'nav.subs'];   /* India plan B */
  KITOF.mandi = ['mandi', 'nav.mandi']; KITOF.pump = ['petrol', 'nav.petrol']; KITOF.tsh = ['tripsheet', 'nav.tripsheet'];   /* group E trade tools */
  function toolUrl(site) { if (site === 'app') return APP; var x = TOOLS.filter(function (x) { return x[0] === site; })[0] || TOOLS[0]; return LOCAL ? 'http://localhost:' + x[4] + '/' : 'https://' + x[1] + '/'; }
  /* records made in NSBiz (purchase bills, expenses, opening balances) open there */
  var APP = LOCAL ? 'http://localhost:8880/' : 'https://app.niveshsahayak.in/';
  var APPDOC = { pbill: ['Purchase bill', '#buy'], exp: ['Expense', '#buy'], ob: ['Opening balance', '#money'],
    /* records made only in the App (F7-1: they showed raw codes and a billing link that cannot open them) */
    jv: ['Journal entry', '#b2jv'], fa: ['Fixed asset', '#b2fa'], stk: ['Stock entry', '#b2gd'], contra: ['Cash and bank transfer', '#cash'], oinc: ['Other income', '#acx'],
    taxpay: ['Tax payment', '#acx'], gstset: ['GST set-off', '#acx'], wo: ['Write off', '#dues'], pdd: ['Provision for doubtful debts', '#acx'], sadv: ['Employee advance', '#stf'],
    loan: ['Loan', '#stf'], emi: ['Loan EMI', '#stf'], cap: ['Capital', '#capl'] };
  /* number prefixes of the other documents (Settings); quotation and credit note have two series each */
  var PREFIXES = [['quote', 'quote', 'QT', 'k.quote'], ['quote', 'estimate', 'EST', 'k.estimate'], ['proforma', '', 'PI', 'Doc.proforma'], ['so', '', 'SO', 'Doc.so'], ['challan', '', 'DC', 'Doc.challan'],
    ['po', '', 'PO', 'Doc.po'], ['self', '', 'SI', 'Doc.self'], ['note', 'credit', 'CN', 'k.credit'], ['note', 'creditp', 'PCN', 'k.creditp'], ['note', 'debit', 'DN', 'k.debit'], ['note', 'debitp', 'PDN', 'k.debitp'], ['cashmemo', '', 'CM', 'Doc.cashmemo'], ['receipt', '', 'RCT', 'Doc.receipt'],
    ['voucher', '', 'PV', 'Doc.voucher'], ['rent', '', 'RR', 'Doc.rent'], ['salary', '', 'SAL', 'Doc.salary'], ['petty', '', 'PCB', 'Doc.petty'], ['refund', '', 'RFV', 'k.ref'],   /* refund voucher: its own series on the receipt maker (slip.js C.refund) */
    /* shop and trade sites (kit.js): fixed digits (5th item), always with the financial year */
    ['exp', '', 'EXP', 'Doc.exp'], ['pos', '', 'POS', 'nav.pos', 4], ['pharma', '', 'PH', 'nav.pharmacy', 4], ['resto', '', 'RB', 'nav.restaurant', 4], ['lr', '', 'LR', 'nav.bilty', 4],
    ['job', '', 'JC', 'nav.jobcard', 4], ['hotel', '', 'HT', 'nav.hotel', 4], ['rentb', '', 'RM', 'nav.rentmgr', 4], ['rabill', '', 'RA', 'nav.contractorbill', 3], ['fee', '', 'FR', 'nav.feereceipt', 4]];
  PREFIXES.push(['visit', '', 'OPD', 'nav.clinic', 4], ['svc', '', 'SV', 'nav.salon', 4]);
  PREFIXES.push(['jewel', '', 'JW', 'nav.jewellery', 4], ['garment', '', 'GM', 'nav.garment', 4]);
  PREFIXES.push(['dairy', '', 'DY', 'nav.dairy', 3], ['subs', '', 'SUB', 'nav.subs', 3]);   /* India plan B */
  PREFIXES.push(['mandi', '', 'MN', 'nav.mandi', 3], ['pump', '', 'SR', 'nav.petrol', 4], ['tsh', '', 'TS', 'nav.tripsheet', 4]);
  /* Settings: one small card per document, grouped: [group key, [[type, maker site, name key], ...]]; a card shows that type's PREFIXES rows */
  /* the App's own vouchers (numbered by the App, same settings: S[type].prefix, S.series[type]) */
  PREFIXES.push(['contra', '', 'CV', 'hub.v.contra'], ['jv', '', 'JV', 'hub.v.jv'], ['oinc', '', 'OI', 'hub.v.oinc'], ['taxpay', '', 'TX', 'hub.v.taxpay'], ['wo', '', 'WO', 'hub.v.wo'], ['pdd', '', 'PDD', 'hub.v.pdd'],
    ['make', '', 'PRD', 'hub.v.make'], ['jobout', '', 'JWO', 'hub.v.jobout'], ['jobin', '', 'JWR', 'hub.v.jobin'], ['sadv', '', 'SA', 'hub.v.sadv'], ['loan', '', 'LN', 'hub.v.loan'], ['emi', '', 'EMI', 'hub.v.emi']);
  /* Settings: one small card per voucher, grouped like Tally's voucher types (owner 20 Nov): [group key, [[type, maker site ('' = made in the App), name key, kind], ...]] */
  var DOCCARDS = [
    ['hub.grp.acc', [['cashmemo', 'cash-memo', 'Doc.cashmemo'], ['exp', 'export-invoice', 'Doc.exp'], ['note', 'credit-note', 'nav.note', 'credit'], ['note', 'debit-note', 'nav.dnote', 'debit'],
      ['receipt', 'receipt', 'Doc.receipt'], ['refund', 'receipt', 'k.ref'], ['voucher', 'voucher', 'Doc.voucher'], ['contra', '', 'hub.v.contra'], ['jv', '', 'hub.v.jv'], ['self', 'self-invoice', 'Doc.self'],
      ['oinc', '', 'hub.v.oinc'], ['taxpay', '', 'hub.v.taxpay'], ['wo', '', 'hub.v.wo'], ['pdd', '', 'hub.v.pdd']]],
    ['hub.grp.ord', [['quote', 'quotation', 'nav.quote'], ['proforma', 'proforma', 'Doc.proforma'], ['so', 'sales-order', 'Doc.so'], ['po', 'purchase-order', 'Doc.po']]],
    ['hub.grp.inv', [['challan', 'challan', 'Doc.challan'], ['make', '', 'hub.v.make'], ['jobout', '', 'hub.v.jobout'], ['jobin', '', 'hub.v.jobin']]],
    ['hub.grp.pay', [['salary', 'salary-slip', 'Doc.salary'], ['sadv', '', 'hub.v.sadv'], ['loan', '', 'hub.v.loan'], ['emi', '', 'hub.v.emi']]],
    ['hub.grp.oth', [['petty', 'petty-cash', 'Doc.petty'], ['rent', 'rent-receipt', 'Doc.rent']]],
    ['hub.grp.trade', [['pos', 'pos', 'nav.pos'], ['pharma', 'pharmacy', 'nav.pharmacy'], ['resto', 'restaurant', 'nav.restaurant'], ['lr', 'bilty', 'nav.bilty'], ['job', 'job-card', 'nav.jobcard'], ['hotel', 'hotel', 'nav.hotel'], ['rentb', 'rent', 'nav.rentmgr'],
      ['rabill', 'contractor-bill', 'nav.contractorbill'], ['fee', 'fee-receipt', 'nav.feereceipt'], ['visit', 'clinic', 'nav.clinic'], ['svc', 'salon', 'nav.salon']]]];
  DOCCARDS[DOCCARDS.length - 1][1].push(['jewel', 'jewellery', 'nav.jewellery'], ['garment', 'garment', 'nav.garment']);
  DOCCARDS.filter(function (g) { return g[0] === 'hub.grp.trade'; })[0][1].push(['dairy', 'dairy', 'nav.dairy'], ['subs', 'subscribers', 'nav.subs']);   /* India plan B */
  DOCCARDS.filter(function (g) { return g[0] === 'hub.grp.trade'; })[0][1].push(['mandi', 'mandi', 'nav.mandi'], ['pump', 'petrol', 'nav.petrol'], ['tsh', 'tripsheet', 'nav.tripsheet']);
  /* ERP A-6 / C-11 on the document cards: each series row folds out its numbering (settings.series[<type>|<type>.<kind>]), each card its
     printing defaults (settings.vt[<type>|<type>.<kind>]); only values that differ from what the type gives by itself are kept */
  var INVX = ['invoice', '', 'INV', 'Doc.invoice'], INVD = ['invoice', 'billing', 'Doc.invoice'];   /* the invoice block at the top of Settings */
  var NXOUT = { invoice: 1, cashmemo: 1, exp: 1, self: 1, 'note.credit': 1, 'note.debit': 1 };
  function serKey(x) { return x[1] ? x[0] + '.' + x[1] : x[0]; }
  function serDef(S, x) { var k = serKey(x), keep = JSON.parse(JSON.stringify(S || {})); if (keep.series) delete keep.series[k]; return NS.seriesOf(keep, x[0], x[1], '', { def: x[2], width: x[4] || null, fy: x[4] ? true : null }); }
  function selH(name, v, opts) { return '<select data-sx="' + name + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function serHtml(S, x, lite) {
    var s = NS.seriesOf(S, x[0], x[1], '', { def: x[2], width: x[4] || null, fy: x[4] ? true : null }), out = NXOUT[serKey(x)], L = function (k, h) { return '<label class="dc-f"><span>' + esc(t('ms.' + k)) + '</span>' + h + '</label>'; };
    return '<details class="dc-more" data-ser="' + esc(serKey(x)) + '"><summary>' + esc(t('ms.vt_num')) + '</summary>' +
      L('vt_meth', selH('method', s.method, [['auto', t('ms.vt_m_auto')], ['fixed', t('ms.vt_m_fixed')], ['manual', t('ms.vt_m_manual')]])) +
      L('vt_sfx', '<input data-sx="suffix" dir="ltr" maxlength="6" value="' + esc(s.suffix) + '">') + L('vt_start', '<input data-sx="start" inputmode="numeric" dir="ltr" value="' + s.start + '">') +
      (lite ? '' : L('vt_width', selH('width', s.width, [1, 2, 3, 4, 5, 6].map(function (n) { return [n, n]; })))) +
      L('vt_rst', selH('restart', s.restart, [['year', t('ms.vt_r_year')], ['month', t('ms.vt_r_month')], ['never', t('ms.vt_r_never')]])) +
      L('vt_dup', selH('dup', out ? 'block' : s.dup, out ? [['block', t('ms.vt_d_block')]] : [['block', t('ms.vt_d_block')], ['warn', t('ms.vt_d_warn')]])) +
      (lite ? '' : '<label class="chk"><input type="checkbox" data-sx="fy"' + (s.fy ? ' checked' : '') + '> ' + esc(t('ms.vt_fy')) + '</label>') + '</details>';
  }
  function vtKeyOf(d) { return d[3] ? d[0] + '.' + d[3] : d[0]; }
  function vtcHtml(S, d, lite) {
    var v = (S.vt || {})[vtKeyOf(d)] || {}, L = function (lbl, h) { return '<label class="dc-f"><span>' + esc(lbl) + '</span>' + h + '</label>'; };
    return '<details class="dc-more" data-vtc="' + esc(vtKeyOf(d)) + '"' + (Object.keys(v).length ? ' open' : '') + '><summary>' + esc(t('ms.vt_print')) + '</summary>' +
      L(t('ms.vt_copies'), selH('copies', v.copies || '', [['', t('ms.vt_tool')], [1, 1], [2, 2], [3, 3]])) +
      L(t('ms.vt_paper'), selH('paper', v.paper || '', [['', t('ms.vt_tool')], ['a4', 'A4'], ['a5', 'A5'], ['th80', '80 mm'], ['th58', '58 mm']])) +
      L(t('l.design'), selH('design', v.design || '', [['', t('ms.vt_tool')]].concat(NS.DESIGNS.map(function (k) { return [k, t('ds.' + k)]; })))) +
      (lite ? '' : L(t('l.notes'), '<input data-sx="notes" dir="auto" value="' + esc(v.notes || '') + '">') + L(t('ms.vt_terms'), '<input data-sx="terms" dir="auto" value="' + esc(v.terms || '') + '">')) +
      '<label class="chk"><input type="checkbox" data-sx="printAfter"' + (v.printAfter ? ' checked' : '') + '> ' + esc(t('ms.vt_pafter')) + '</label>' +
      '<label class="chk"><input type="checkbox" data-sx="shareAfter"' + (v.shareAfter ? ' checked' : '') + '> ' + esc(t('ms.vt_safter')) + '</label><small class="hint">' + esc(t('ms.vt_printh')) + '</small></details>';
  }
  function readSx(box) { var o = {}; $$('[data-sx]', box).forEach(function (e) { o[e.getAttribute('data-sx')] = e.type === 'checkbox' ? e.checked : e.value.trim(); }); return o; }
  function siteUrl(site) { return TOOLS.some(function (x) { return x[0] === site; }) ? toolUrl(site) : 'https://' + site + '.niveshsahayak.in/'; }

  /* field: [key, label key, kind, extra]; kinds: text, area, state, gstin, sel, num, img, unit, gst, ltr */
  var FORM = {
    biz: [
      ['name', 'l.bname', 'text', { req: 1, wide: 1 }], ['addr', 'l.addr', 'area', { wide: 1 }], ['city', 'l.city', 'text'], ['pin', 'l.pin', 'ltr', { mode: 'numeric', max: 6 }], ['state', 'l.state', 'state'], ['gstin', 'l.gstin', 'gstin'],
      ['reg', 'hub.reg', 'sel', { opts: [['regular', 'hub.rg.regular'], ['comp', 'hub.rg.comp'], ['unreg', 'hub.rg.unreg'], ['sez', 'hub.rg.sez']] }],
      ['aato', 'ei.aato', 'sel', { opts: [['', 'ei.a.none'], ['lt5', 'ei.a.lt5'], ['5to10', 'ei.a.5to10'], ['10p', 'ei.a.10p']] }],
      ['phone', 'l.phone', 'ltr', { mode: 'tel' }], ['email', 'l.email', 'ltr', { type: 'email' }], ['tan', 'hub.tan', 'ltr', { max: 10, upper: 1 }],   /* ERP round 2: TAN for TDS certificates and returns */
      ['bankName', 'l.bank', 'text'], ['bankAcc', 'l.acc', 'ltr', { mode: 'numeric' }], ['bankIfsc', 'l.ifsc', 'ltr', { max: 11, upper: 1 }], ['bankBranch', 'l.branch', 'text'],
      ['upi', 'l.upi', 'ltr', { wide: 1, ph: 'name@bank' }], ['logo', 'l.logo', 'img', { max: 360 }], ['sign', 'l.sign', 'img', { max: 420 }]
    ],
    party: [
      ['role', 'hub.role', 'sel', { opts: [['customer', 'hub.r.customer'], ['supplier', 'hub.r.supplier'], ['both', 'hub.r.both']] }],
      ['group', 'grp.group', 'pgroup', { hint: 'grp.h_pgroup' }], ['biz', 'pb.usedby', 'usedby', { hint: 'pb.usedbyh' }],
      ['name', 'my.f.name', 'text', { req: 1 }], ['phone', 'l.phone', 'ltr', { mode: 'tel' }], ['email', 'l.email', 'ltr', { type: 'email' }],
      ['gstin', 'l.cgstin', 'gstin'], ['state', 'l.state', 'state'], ['addr', 'l.addr', 'area', { wide: 1 }], ['city', 'l.city', 'text'], ['pin', 'l.pin', 'ltr', { mode: 'numeric', max: 6 }],
      ['ship.addr', 'l.shaddr', 'area', { wide: 1, hint: 'hub.h.ship' }], ['ship.state', 'l.shstate', 'state'],
      /* Batch 1: price type and credit terms */
      ['ptype', 'b1.ptype', 'sel', { opts: [['retail', 'b1.pt_retail'], ['wholesale', 'b1.pt_whole']], hint: 'b1.h_ptype' }],
      ['climit', 'b1.climit', 'num', { hint: 'b1.h_climit' }], ['cdays', 'b1.cdays', 'num', { hint: 'b1.h_cdays' }],
      /* India plan A: route / beat and scheme (distributors) */
      ['route', 'rtb.route', 'text', { hint: 'rtb.h_route' }], ['scheme', 'rtb.scheme', 'text', { hint: 'rtb.h_scheme' }],
      /* Evershine's account master (owner 19 Nov 2026): agent (salesman) and the road distance in km for e-way bills */
      ['agent', 'ms.agent', 'text', { hint: 'ms.h_agent' }], ['km', 'ms.km', 'num', { hint: 'ms.h_km' }],
      /* compliance pack: MSME payables (size, Udyam number as typed by the supplier, days agreed in writing) */
      ['msme', 'cp.f_size', 'sel', { opts: [['', 'cp.sz_none'], ['micro', 'cp.sz_micro'], ['small', 'cp.sz_small'], ['medium', 'cp.sz_medium'], ['other', 'cp.sz_other']], hint: 'cp.h_size' }],
      ['udyam', 'cp.f_ud', 'ltr', { max: 22, upper: 1, ph: 'UDYAM-XX-00-0000000' }], ['agdays', 'cp.f_ag', 'num', { hint: 'cp.f_ag_h' }],
      /* ERP round 1 (r1-gst S-2): GST registration type and PAN (gstcore.js partyReg; empty = worked out from the GSTIN) */
      ['reg', 'ms.reg', 'sel', { opts: [['', 'ms.reg_auto'], ['regular', 'ms.reg_regular'], ['comp', 'ms.reg_comp'], ['unreg', 'ms.reg_unreg'], ['sez', 'ms.reg_sez'], ['uin', 'ms.reg_uin'], ['overseas', 'ms.reg_overseas'], ['eco', 'ms.reg_eco']] }],
      ['pan', 'ms.pan', 'ltr', { max: 10, upper: 1 }]
    ],
    item: [
      ['desc', 'hub.f.iname', 'text', { req: 1, wide: 1 }], ['kind', 'l.type', 'sel', { opts: [['goods', 'hub.k.goods'], ['service', 'hub.k.service']] }],
      ['group', 'grp.group', 'igroup', { hint: 'grp.h_igroup' }], ['biz', 'pb.usedby', 'usedby', { hint: 'pb.usedbyh' }],
      ['code', 'hub.f.code', 'ltr'], ['hsn', 'l.hsn', 'ltr', { mode: 'numeric', max: 8 }], ['unit', 'l.unit', 'unit'],
      ['rate', 'b1.retail', 'num', { hint: 'b1.h_retail' }], ['wrate', 'b1.whole', 'num'], ['mrp', 'b1.mrp', 'num'], ['prate', 'b1.prate', 'num'], ['gst', 'l.gst', 'gst'],
      /* ERP Round 2 (r2-billwise, A-9): the item's own sales / purchase ledger in the accounts; empty = Sales / Purchases */
      ['sl', 'bw.isl', 'text', { hint: 'bw.islh' }], ['pl', 'bw.ipl', 'text'],
      /* ERP round 1 (r1-gst S-1, S-5): taxability and input tax credit; dated rate changes are made in the App's Masters */
      ['tax.kind', 'ms.tk', 'sel', { opts: [['taxable', 'ms.tk_taxable'], ['nil', 'ms.tk_nil'], ['exempt', 'ms.tk_exempt'], ['nongst', 'ms.tk_nongst']] }],
      ['tax.itc', 'ms.itc', 'sel', { opts: [['ok', 'ms.itc_ok'], ['blocked', 'ms.itc_blocked'], ['ineligible', 'ms.itc_inel']], hint: 'ms.itch' }]
    ]
  };
  /* CSV columns (English headers, so a file works in any language) */
  var CSV = {
    biz: [['name', 'Name'], ['addr', 'Address'], ['city', 'City'], ['pin', 'PIN code'], ['state', 'State code'], ['gstin', 'GSTIN'], ['phone', 'Phone'], ['email', 'Email'], ['bankName', 'Bank'], ['bankAcc', 'Account no'], ['bankIfsc', 'IFSC'], ['bankBranch', 'Branch'], ['upi', 'UPI ID'], ['gst.legal', 'Legal name'], ['gst.trade', 'Trade name']],
    party: [['role', 'Type'], ['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['addr', 'Address'], ['city', 'City'], ['pin', 'PIN code'], ['state', 'State code'], ['gstin', 'GSTIN'], ['ship.addr', 'Ship-to address'], ['ship.state', 'Ship-to state code'], ['gst.legal', 'Legal name'], ['gst.trade', 'Trade name'],
      ['ptype', 'Price type'], ['climit', 'Credit limit'], ['cdays', 'Credit days'], ['route', 'Route / beat'], ['scheme', 'Scheme'], ['msme', 'MSME size'], ['udyam', 'Udyam no'], ['agdays', 'Agreed credit days'], ['group', 'Group'],
      ['pname', 'Print name'], ['contact', 'Contact person'], ['reg', 'GST registration'], ['pan', 'PAN'], ['tdsSec', 'TDS section'], ['deductee', 'Deductee type'], ['tcsRate', 'TCS rate'], ['disc', 'Discount %'], ['int.rate', 'Interest % a year'], ['agent', 'Agent'], ['km', 'Distance km'],
      ['bankName', 'Bank'], ['bankBranch', 'Bank branch'], ['bankAcc', 'Account no'], ['bankIfsc', 'IFSC'], ['upi', 'UPI ID'], ['tname', 'Transporter'], ['tid', 'Transporter ID'], ['notes', 'Notes']],
    item: [['desc', 'Name'], ['kind', 'Type'], ['cat', 'Group'], ['code', 'Item code'], ['hsn', 'HSN/SAC'], ['unit', 'Unit'], ['rate', 'Rate'], ['wrate', 'Wholesale rate'], ['mrp', 'MRP'], ['prate', 'Purchase price'], ['gst', 'GST %'], ['sl', 'Sales ledger'], ['pl', 'Purchase ledger'],
      ['pname', 'Print name'], ['barcode', 'Barcode'], ['descr', 'Description'], ['disc', 'Discount %'], ['min', 'Reorder level'], ['rq', 'Reorder quantity'], ['max', 'Maximum stock'], ['lead', 'Lead days'], ['supplier', 'Usual supplier'], ['track', 'Batch or serial'], ['src', 'Made or bought'], ['notes', 'Notes']]
  };
  var NAMEKEY = { biz: 'name', party: 'name', item: 'desc' };
  var SECS = ['home', 'c-biz', 'c-docs', 'c-ops', 'c-safe', 'c-pref', 'biz', 'party', 'pgroups', 'item', 'igroups', 'doc', 'settings', 'backup', 'bin', 'log'];
  var GSEC = { pgroups: 'party', igroups: 'item' };   /* the Groups screen of each master */
  var NUMS = { rate: 1, wrate: 1, mrp: 1, prate: 1, climit: 1, cdays: 1, agdays: 1, disc: 1, tcsRate: 1, km: 1, min: 1, rq: 1, max: 1, lead: 1 };
  var cur = 'home', q = '', gf = '', S = {}, RAW = {}, SB = '', cache = {}, G = { party: [], item: [] };

  function key(s) { return String(s || '').trim().toLowerCase(); }
  function get(o, k) { return k.split('.').reduce(function (a, p) { return a == null ? a : a[p]; }, o); }
  function set(o, k, v) { var p = k.split('.'), last = p.pop(); p.forEach(function (x) { o = o[x] = o[x] && typeof o[x] === 'object' ? o[x] : {}; }); o[last] = v; }
  function load() {
    return Promise.all(['biz', 'party', 'item', 'doc', 'bin', 'log'].map(function (s) { return NSStore.list(s); }).concat([NSStore.meta('settings'), NSStore.meta('lastBackup'), NSStore.meta('who'), NSStore.meta('pin'), NSStore.meta('groups')])).then(function (r) {
      cache = { biz: r[0], party: r[1], item: r[2], doc: r[3], bin: r[4], log: r[5] };
      /* settings per business: the stored record (RAW) and the copy for the business chosen on the Settings screen (S) */
      RAW = r[6] || {}; NS.bizCache = cache.biz;
      if (NS.cfgSplit(RAW, cache.biz)) NSStore.meta('settings', RAW).catch(function () {});
      /* inside the App: the App tab's own business first (round C: Settings opened on another business) */
      var inApp = document.documentElement.classList.contains('embed') && NS.curBiz ? NS.curBiz() : '';
      if (!cache.biz.some(function (b) { return b.id === SB; })) SB = inApp && cache.biz.some(function (b) { return b.id === inApp; }) ? inApp : cache.biz.some(function (b) { return b.id === RAW.defBiz; }) ? RAW.defBiz : (cache.biz[0] || {}).id || '';
      S = NS.cfgFor(RAW, SB); S._last = r[7] || 0; S._who = r[8] || ''; S._pin = r[9] || null;
      G = gNorm(r[10]);
      return catGroups();
    }).then(function () { return cache; });
  }
  function title(s, r) {
    if (s === 'doc' && APPDOC[r.type]) { var ak = 'app.d_' + (r.type === 'pbill' && r.kind === 'return' ? 'pret' : r.type), av = t(ak); return (av !== ak ? av : r.type === 'pbill' && r.kind === 'return' ? 'Purchase return' : APPDOC[r.type][0]) + ' ' + (r.no || ''); }   /* in the screen language (round C) */
    if (s === 'doc') return t(r.kind === 'estimate' ? 'doc.estimate' : r.type === 'note' ? 'k.' + r.kind : 'doc.' + (r.type || 'invoice')).replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + (r.no || '');
    return r[NAMEKEY[s]] || t('my.noname');
  }
  /* POS bills are saved as invoices (counter: 1) but open in the POS site */
  function kitType(r) { return r.counter && (!r.type || r.type === 'invoice') ? 'pos' : r.type; }
  function sub(s, r) {
    if (s === 'doc') return NS.fmtDate(r.date) + ' · ' + esc(r.buyer && r.buyer.name || (r.type === 'exp' ? (function (c) { var k = 'app.ex_' + c, v = t(k); return v !== k ? v : c; })(r.cat || r.head || '') : t('h.nocust'))) + ' · <b>' + NS.money(r.total || 0) + '</b> · ' + esc(r.seller && r.seller.name || '') +
      (!r.type || r.type === 'invoice' || r.type === 'cashmemo' ? ' <span class="pill' + (r.status === 'paid' ? ' ok' : '') + '">' + esc(t(r.status === 'paid' ? 'h.paidp' : 'h.unpaidp')) + '</span>'
        : r.status ? ' <span class="pill' + (/^(acc|inv|sdone|prec|nadj|nref|nrecv|npaid|paid)$/.test(r.status) ? ' ok' : '') + '">' + esc(r.status === 'paid' ? t('h.paidp') : r.status === 'unpaid' ? t('h.unpaidp') : t('qs.' + r.status)) + '</span>' : '') +
      (APPDOC[r.type] ? ' <a href="' + APP + APPDOC[r.type][1] + '" target="_blank" rel="noopener">NSBiz ›</a>' :
      KITOF[kitType(r)] ? ' <a href="' + siteUrl(KITOF[kitType(r)][0]) + '?open=' + encodeURIComponent(r.id) + '" target="_blank" rel="noopener">' + esc(t(KITOF[kitType(r)][1])) + ' ›</a>' :
      ' <a href="' + toolUrl(r.type === 'note' && r.kind === 'debit' ? 'debit-note' : SITEOF[r.type || 'invoice']) + '" target="_blank" rel="noopener">' + esc(t(TOOLS.filter(function (x) { return x[0] === (r.type === 'note' && r.kind === 'debit' ? 'debit-note' : SITEOF[r.type || 'invoice']); }).map(function (x) { return x[2]; })[0] || 'nav.billing')) + ' ›</a>');
    if (s === 'item') return [NS.itemGroup(r, G).id && '<span class="pill">' + esc(gPath('item', NS.itemGroup(r, G).id)) + '</span>', r.code && esc(r.code), r.hsn && 'HSN ' + esc(r.hsn), !(NS.num(r.rate) > 0) && NS.num(r.prate) > 0 && esc(t('prl.c.prate')) + ' ' + NS.money(NS.num(r.prate)), NS.num(r.rate) > 0 && NS.money(NS.num(r.rate)) + (r.unit ? ' / ' + esc(r.unit) : ''),
      NS.num(r.wrate) && esc(t('b1.whole')) + ' ' + NS.money(NS.num(r.wrate)), NS.num(r.mrp) && 'MRP ' + NS.money(NS.num(r.mrp)), r.gst !== '' && r.gst != null && 'GST ' + esc(r.gst) + '%', r.kind === 'service' && esc(t('hub.k.service')), r.sample && '<span class="b1-pill">' + esc(t('b1.sample')) + '</span>'].filter(Boolean).join(' · ');
    var bits = [r.gstin && '<span class="mono">' + esc(r.gstin) + '</span>', r.state && esc(NS.stateName(r.state)), r.phone && esc(r.phone)];
    if (s === 'party' && r.role && r.role !== 'customer') bits.unshift(esc(t('hub.r.' + r.role)));
    if (s === 'party') { var pg = NS.partyGroup(r, G); bits.unshift('<span class="pill">' + esc(gPath('party', pg.id)) + '</span>'); }
    if (r.gst && r.gst.legal && key(r.gst.legal) !== key(r.name)) bits.push(esc(t('gf.legal')) + ': ' + esc(r.gst.legal));
    if (s === 'party' && r.ptype === 'wholesale') bits.push(esc(t('b1.pt_whole')));
    if (s === 'party' && NS.num(r.climit)) bits.push(esc(t('b1.climit')) + ' ' + NS.money(NS.num(r.climit)));
    if (s === 'party' && NS.num(r.cdays)) bits.push(esc(t('b1.ndays', { n: NS.num(r.cdays) })));
    if (s === 'party' && r.route) bits.push(esc(t('rtb.route')) + ': ' + esc(r.route));
    if (s === 'party' && r.scheme) bits.push(esc(t('rtb.scheme')) + ': ' + esc(r.scheme));
    if (r.sample) bits.push('<span class="b1-pill">' + esc(t('b1.sample')) + '</span>');
    return bits.filter(Boolean).join(' · ');
  }

  /* ---------- sections ---------- */
  function show(sec, focus) {
    if (SECS.indexOf(sec) < 0) sec = 'home';
    if (cur !== sec) gf = '';
    cur = sec; q = '';
    $$('[data-sec]').forEach(function (b) {
      var on = b.getAttribute('data-sec') === sec;
      b.setAttribute('aria-current', on ? 'page' : 'false');
      if (on && b.parentNode.scrollWidth > b.parentNode.clientWidth) b.parentNode.scrollLeft = b.offsetLeft - 40;
    });
    if (routed && location.hash.slice(1) !== sec) history.replaceState(null, '', sec === 'home' ? location.pathname : '#' + sec);   /* not before the first routing: an early redraw wiped #biz, #item... (F5-1) */
    secPick();
    return load().then(function () {
      counts();
      var pane = $('[data-pane]');
      pane.innerHTML = (NS.sample.has(cache) ? NS.sample.note() : '') + (GSEC[sec] ? groupsHtml(GSEC[sec]) : /^c-/.test(sec) ? catHtml(sec) : sec === 'home' ? homeHtml() : sec === 'settings' ? settingsHtml() : sec === 'backup' ? backupHtml() : sec === 'bin' ? binHtml() : sec === 'log' ? logHtml() : listHtml(sec));
      if (sec === 'home' && !cache.biz.length) wireWizard(pane);
      if (sec === 'home' || /^c-/.test(sec)) wireLanding(pane);
      if (sec === 'settings') { wireSettings(pane); wirePin(pane); setNav(pane); }
      if (sec === 'backup') wireBackup(pane);
      if (FORM[sec] || sec === 'doc') renderList();
      if (focus) { var h = $('h2', pane); if (h) { h.tabIndex = -1; h.focus(); } }
    });
  }
  /* screen readers: "My businesses, 2" instead of the name and count run together */
  function secNames() {
    $$('[data-sec]').forEach(function (b) {
      var l = $('span', b), c = $('.n', b), n = c ? c.textContent.trim() : '';
      if (l && l.textContent.trim()) b.setAttribute('aria-label', l.textContent.trim() + (n ? ', ' + n : ''));
    });
  }
  document.addEventListener('ns-lang', function () { setTimeout(secNames, 0); });
  /* the sections as a settings tree on the left (owner 26 Nov 2026: "this section needs to branch like settings"): groups that fold,
     an icon and a count on every line, the chosen section on the right. On phones the tree is one bar that opens the list.
     The link list (.hub-nav) stays in the page, hidden, so section links, counts and the parts other files add keep working. */
  var ICON = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.6 3.5 2.5 3.5 5.6"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>', folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5 4 4 0 0 1 17.5 18z"/><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', db: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    chev: '<path d="M6 9l6 6 6-6"/>'
  };
  function ic(k) { return '<svg class="ht-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[k] || '') + '</svg>'; }
  var TREE = [
    { sec: 'home', icon: 'home', key: 'pm.t_all' },
    { id: 'biz', k: 'pm.g_business', icon: 'briefcase', items: [['biz', 'briefcase']] },
    { id: 'pi', k: 'pm.g_pi', icon: 'users', items: [['party', 'users'], ['pgroups', 'folder', 'pm.t_pgroups'], ['item', 'box'], ['igroups', 'folder', 'pm.t_igroups']] },
    { id: 'docs', k: 'pm.g_docs', icon: 'file', items: [['doc', 'file'], ['numbers', 'hash', 'pm.t_numbers']] },
    { id: 'data', k: 'pm.g_data', icon: 'db', items: [['backup', 'cloud'], ['bin', 'trash'], ['log', 'clock']] },
    { id: 'pref', k: 'pm.g_pref', icon: 'gear', items: [['settings', 'gear']] }
  ];
  function treeFold(id, set) { var o = {}; try { o = JSON.parse(localStorage.getItem('ns-hubtree') || '{}') || {}; } catch (e) {} if (set !== undefined) { o[id] = set; try { localStorage.setItem('ns-hubtree', JSON.stringify(o)); } catch (e) {} } return !!o[id]; }
  function secPick() {
    var nav = $('.hub-nav'), hub = nav && nav.parentNode; if (!nav) return;
    var box = $('.hub-tree', hub);
    if (!box) {
      box = NS.el('nav', { 'class': 'hub-tree', 'aria-label': t('pm.tree') });
      hub.insertBefore(box, nav); hub.classList.add('picked', 'tree');
      box.addEventListener('click', function (e) {
        var g = e.target.closest('[data-htg]');
        if (g) { var id = g.getAttribute('data-htg'), shut = g.getAttribute('aria-expanded') === 'true'; treeFold(id, shut); secPick(); return; }
        if (e.target.closest('[data-htbar]')) { box.classList.toggle('open'); $('[data-htbar]', box).setAttribute('aria-expanded', box.classList.contains('open') ? 'true' : 'false'); return; }
        var a = e.target.closest('[data-htsec]'); if (!a) return;
        e.preventDefault(); var sec = a.getAttribute('data-htsec'); box.classList.remove('open');
        if (sec === 'numbers') { show('settings', true).then(function () { var nh = $$('.set-nh').filter(function (h) { return /number series/i.test(h.textContent); })[0], b = nh && nh.nextElementSibling; if (b && b.classList.contains('set-ni')) b.click(); }); return; }
        show(sec, true);
      });
      new MutationObserver(function () { clearTimeout(secPick.t); secPick.t = setTimeout(secPick, 30); }).observe(nav, { childList: true, subtree: true, characterData: true });
    }
    hub.classList.toggle('no-tree', cur === 'home');
    var info = {}; $$('[data-sec]', nav).forEach(function (a) { var sp = $('span', a), c = $('.n', a); info[a.getAttribute('data-sec')] = { l: sp ? sp.textContent.trim() : a.textContent.trim(), n: c ? c.textContent.trim() : '' }; });
    var curLabel = /^c-/.test(cur) ? (CATS.filter(function (c) { return c.id === cur; })[0] || {}).k : cur === 'pgroups' ? t('pm.t_pgroups') : cur === 'igroups' ? t('pm.t_igroups') : (info[cur] || {}).l || '';
    var item = function (sec, icon, key, lvl) {
      var i = info[sec === 'numbers' ? 'settings' : sec] || { l: '', n: '' }, on = sec === cur, label = key ? t(key) : i.l;
      if (sec === 'numbers') i = { n: '' };
      return '<a href="#' + (sec === 'numbers' ? 'settings' : sec === 'home' ? '' : sec) + '" class="ht-i' + (on ? ' on' : '') + (lvl ? ' ht-l2' : '') + '" data-htsec="' + sec + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(icon) + '<span>' + esc(label) + '</span>' + (i.n ? '<i class="n">' + esc(i.n) + '</i>' : '') + '</a>';
    };
    var html = '<button type="button" class="ht-bar" data-htbar aria-expanded="' + (box.classList.contains('open') ? 'true' : 'false') + '"><span class="ht-barl">' + esc(t('pm.t_show')) + '</span><b>' + esc(curLabel) + '</b>' + ic('chev') + '</button><div class="ht-body">' +
      TREE.map(function (g) {
        if (g.sec) return item(g.sec, g.icon, g.key, 0);
        var has = g.items.some(function (x) { return x[0] === cur; }), shut = treeFold(g.id) && !has;
        return '<div class="ht-g"><button type="button" class="ht-gh" data-htg="' + g.id + '" aria-expanded="' + (shut ? 'false' : 'true') + '">' + ic(g.icon) + '<span>' + esc(t(g.k)) + '</span>' + ic('chev') + '</button>' +
          '<div class="ht-gi"' + (shut ? ' hidden' : '') + '>' + g.items.map(function (x) { return item(x[0], x[1], x[2], 1); }).join('') + '</div></div>';
      }).join('') + '</div>';
    if (box._h !== html) { box.innerHTML = html; box._h = html; }
    var onI = $('.ht-i.on', box); if (onI && innerWidth > 860 && box.scrollHeight > box.clientHeight && (onI.offsetTop + onI.offsetHeight > box.scrollTop + box.clientHeight || onI.offsetTop < box.scrollTop)) box.scrollTop = Math.max(0, onI.offsetTop - box.clientHeight / 2);   /* the chosen line is always in view */
  }
  function counts() {
    var n = { biz: cache.biz.length, party: cache.party.length, item: cache.item.length, doc: cache.doc.length, bin: cache.bin.length || '', pgroups: G.party.length || '', igroups: G.item.length || '' };
    $$('[data-sec]').forEach(function (b) { var c = $('.n', b), s = b.getAttribute('data-sec'); if (c) c.textContent = n[s] != null ? n[s] : ''; });
    secNames(); secPick();
    var m = $('[data-mode]'); if (m) m.textContent = t(NSStore.mode() === 'vault' ? 'my.vault' : 'my.local');
  }

  /* ---------- the landing view: category cards like the Free tools screen (owner 26 Nov 2026) ----------
     [label, section, settings line to open inside Settings, words the search also reads] */
  var CATS = [
    { id: 'c-biz', icon: 'briefcase', k: 'Business and parties', d: 'Your businesses, customers, suppliers and items.', items: [
      ['My businesses', 'biz', '', 'gstin address bank logo company'], ['Customers and suppliers', 'party', '', 'gstin credit limit ship-to parties debtors creditors'], ['Items and services', 'item', '', 'hsn gst rate stock price products'],
      ['Customer and supplier groups', 'pgroups', '', 'sundry debtors creditors'], ['Item groups', 'igroups', '', 'categories stock groups']] },
    { id: 'c-docs', icon: 'file', k: 'Documents and numbering', d: 'Saved documents, invoice numbers and defaults for new ones.', items: [
      ['Documents', 'doc', '', 'invoices bills saved list register csv'], ['Number series', 'settings', 'Accounting vouchers', 'prefix numbering invoice number'], ['Invoice defaults', 'settings', 'Invoice (Billing)', 'terms notes round off format design']] },
    { id: 'c-ops', icon: 'box', k: 'Stock and accounts', d: 'Godowns, salesmen, stock value, final accounts and heads.', items: [
      ['Godowns and branches', 'settings', 'Godowns and branches', 'warehouse store'], ['Salesmen', 'settings', 'Salesmen', 'agent commission'], ['Stock valuation', 'settings', 'Stock valuation', 'fifo average'],
      ['Final accounts', 'settings', 'Final accounts', 'balance sheet profit loss t format'], ['Income and expense heads', 'settings', 'Income and expense heads', 'ledger heads'], ['Employees', 'settings', 'Employees', 'staff salary payroll']] },
    { id: 'c-safe', icon: 'cloud', k: 'Backup and safety', d: 'Backups, other devices, the recycle bin, edit history and locks.', items: [
      ['Backup and other devices', 'backup', '', 'restore export drive folder auto save'], ['Recycle bin', 'bin', '', 'deleted restore'], ['Edit history', 'log', '', 'audit trail changes'],
      ['Safety', 'settings', 'Safety', 'lock period closed year'], ['PIN lock', 'settings', 'PIN lock', 'password pin'], ['Users and logins', 'settings', 'Users and logins', 'rights roles']] },
    { id: 'c-pref', icon: 'gear', k: 'Preferences', d: 'Default business, language, reminders and custom fields.', items: [
      ['General settings', 'settings', 'General', 'default business language reminder backup'], ['Custom fields on documents', 'settings', 'Custom fields on documents', 'extra boxes']] }
  ];
  function catOf(id) { return CATS.filter(function (c) { return c.id === id; })[0]; }
  function entryAttrs(x) { return 'href="#' + x[1] + '" data-go data-sec="' + x[1] + '" data-sub="' + esc(x[2] || '') + '"'; }
  function landingFind(q) { return '<div class="fz-find"><input type="search" data-fz-q placeholder="' + esc('Find a setting…') + '" value="' + esc(q || '') + '" aria-label="' + esc('Find a setting') + '" autocomplete="off"></div>'; }
  function landingCards() {
    return '<div class="fz-cards" data-fz-home>' + CATS.map(function (c) {
      return '<a class="fz-gc" href="#' + c.id + '"><span class="fz-gi">' + ic(c.icon) + '</span><span class="fz-gt"><b>' + esc(c.k) + '</b><small>' + c.items.length + (c.items.length === 1 ? ' item' : ' items') + '</small></span>' +
        '<span class="fz-gd">' + esc(c.d) + '</span><span class="fz-gn">' + c.items.slice(0, 4).map(function (x) { return esc(x[0]); }).join(' · ') + (c.items.length > 4 ? ' …' : '') + '</span></a>';
    }).join('') + '</div>';
  }
  function catHtml(id) {
    var c = catOf(id) || CATS[0];
    return '<div class="pane-hd fz-hd"><a class="btn sm" href="#" data-go data-sec="home" data-ic="back">' + esc(t('hub.home') === 'Overview' ? 'All settings' : t('hub.home')) + '</a><h2>' + esc(c.k) + '</h2></div><p class="soft">' + esc(c.d) + '</p>' +
      '<div class="fz-tools">' + c.items.map(function (x) { return '<a class="fz-tc" ' + entryAttrs(x) + '><b>' + esc(x[0]) + '</b><span>' + esc(x[3] ? x[3].split(' ').slice(0, 5).join(' · ') : '') + '</span></a>'; }).join('') + '</div>';
  }
  function wireLanding(pane) {
    var q = $('[data-fz-q]', pane), found = $('[data-fz-found]', pane), home = $('[data-fz-home]', pane);
    if (!q || !found) return;
    q.addEventListener('input', function () {
      var w = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!w.length) { found.hidden = true; if (home) home.hidden = false; return; }
      var hit = []; CATS.forEach(function (c) { c.items.forEach(function (x) { var hay = (x[0] + ' ' + x[3] + ' ' + c.k).toLowerCase(); if (w.every(function (z) { return hay.indexOf(z) >= 0; })) hit.push([x, c]); }); });
      found.innerHTML = hit.length ? '<div class="fz-tools">' + hit.map(function (h) { return '<a class="fz-tc" ' + entryAttrs(h[0]) + '><b>' + esc(h[0][0]) + '</b><span>' + esc(h[1].k) + '</span></a>'; }).join('') + '</div>' : '<p class="soft">No setting found. Try another word.</p>';
      found.hidden = false; if (home) home.hidden = true;
    });
  }
  /* an entry: open its section, and inside Settings the line it names */
  function goEntry(sec, sub) {
    return show(sec, true).then(function () {
      if (sec !== 'settings' || !sub) return;
      var b = $$('.set-ni').filter(function (x) { return x.textContent.trim() === sub; })[0]; if (b) b.click();
    });
  }
  function homeHtml() {
    var c = cache, steps = [
      ['biz', c.biz.length > 0, 'hub.s1', '#biz'], ['party', c.party.length > 0, 'hub.s2', '#party'], ['item', c.item.length > 0, 'hub.s3', '#item'],
      ['settings', !!(S.invoice || S.defBiz), 'hub.s4', '#settings'], ['doc', c.doc.length > 0, 'hub.s5', BILLING], ['backup', !!S._last, 'hub.s6', '#backup']
    ];
    var done = steps.filter(function (s) { return s[1]; }).length;
    return '<div class="pane-hd"><h2>' + esc(t('hub.home')) + '</h2></div>' + (c.biz.length ? '' : wizardHtml()) + landingFind('') + '<div class="fz-found" data-fz-found hidden></div>' + landingCards() +
      '<div class="card"><h3>' + esc(t('hub.start')) + ' <small class="soft">' + done + ' / ' + steps.length + '</small></h3><ol class="steps">' + steps.map(function (s) {
        var ext = /^http/.test(s[3]);
        return '<li class="' + (s[1] ? 'ok' : '') + '"><span class="tick" aria-hidden="true">' + (s[1] ? '✓' : '') + '</span><a href="' + s[3] + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(t(s[2])) + '</a>' +
          (s[1] ? '<span class="sr">' + esc(t('hub.done')) + '</span>' : '') + '</li>';
      }).join('') + '</ol></div>' +
      '<div class="card"><h3>' + esc(t('hub.tools')) + '</h3><div class="cards">' + '<a href="' + APP + '" target="_blank" rel="noopener"><b>' + esc(t('nav.app')) + '</b><span>' + esc(t('hub.app')) + '</span></a>' + TOOLS.map(function (x) {
        return '<a href="' + toolUrl(x[0]) + '" target="_blank" rel="noopener"><b>' + esc(t(x[2])) + '</b><span>' + esc(t(x[3])) + '</span></a>'; }).join('') + '</div>' +
      '<p class="soft">' + esc(t('hub.toolsp')) + '</p></div>';
  }

  /* ---------- masters list ---------- */
  function listHtml(s) {
    var add = s === 'doc' ? '<a class="btn primary" href="' + BILLING + '" target="_blank" rel="noopener">' + esc(t('hub.newdoc')) + '</a>'
      : '<button type="button" class="btn primary" data-add>+ ' + esc(t('hub.add.' + s)) + '</button>';
    return '<div class="pane-hd"><h2>' + esc(t('my.t.' + s)) + '</h2>' + add + '</div>' + gTabs(s, false) +
      '<p class="soft">' + esc(t('hub.p.' + s)) + '</p>' +
      '<div class="tools-row"><label class="sr" for="my-q">' + esc(t('my.search')) + '</label><input id="my-q" type="search" placeholder="' + esc(t('my.ph')) + '">' +
      (s === 'doc' ? '' : '<label class="btn sm">' + esc(t('hub.imp')) + '<input type="file" accept=".csv,text/csv" data-imp hidden></label>') +
      (s === 'party' || s === 'item' ? '<button type="button" class="btn sm" data-xlimp data-ic="up">' + esc(t('xi.open')) + '</button>' : '') +
      (s === 'party' || s === 'item' ? '<button type="button" class="btn sm" data-swimp data-ic="up">' + esc(t('sw.open')) + '</button>' : '') +
      '<button type="button" class="btn sm" data-exp>' + esc(t('hub.exp')) + '</button>' +
      (s === 'doc' ? '<button type="button" class="btn sm" data-xl>' + esc(t('b1.xl_reg')) + '</button>' : s === 'item' ? '<button type="button" class="btn sm" data-xl>' + esc(t('b1.xl_items')) + '</button>' : '') +
      (s === 'doc' ? '' : '<button type="button" class="link" data-tpl>' + esc(t('hub.tpl')) + '</button>') + '</div>' +
      (s === 'party' || s === 'item' ? gFilter(s) : '') +
      '<ul class="my-list" data-list></ul>';
  }
  function renderList() {
    var list = $('[data-list]'); if (!list) return;
    var s = cur, rows = (cache[s] || []).filter(function (r) {
      return !q || JSON.stringify([title(s, r), r.gstin, r.hsn, r.code, r.cat, r.phone, r.buyer && r.buyer.name, r.seller && r.seller.name]).toLowerCase().indexOf(q) >= 0;
    }).filter(function (r) { return !gf || (s !== 'party' && s !== 'item') || (gf === '-' ? !NS.itemGroup(r, G).id : inGroup(s, r, gf)); });
    rows.sort(function (a, b) { return s === 'doc' ? (b.date || '').localeCompare(a.date || '') || (b.no || '').localeCompare(a.no || '') : title(s, a).localeCompare(title(s, b)); });
    list.innerHTML = rows.length ? rows.map(function (r) {
      var def = s === 'biz' && S.defBiz === r.id;
      return '<li data-id="' + esc(r.id) + '"><div class="hd2"><div class="who">' + (s === 'biz' && r.logo ? '<img src="' + esc(r.logo) + '" alt="">' : '') +
        '<div><b class="ttl">' + esc(title(s, r)) + '</b>' + (def ? ' <span class="pill ok">' + esc(t('hub.default')) + '</span>' : '') + '<div class="sub">' + sub(s, r) + (s === 'doc' && r.sample ? ' <span class="b1-pill">' + esc(t('b1.sample')) + '</span>' : '') + (s === 'doc' && r.rec && r.rec.every ? ' <span class="pill">' + esc(t(r.rec.every === 'quarter' ? 'b1.rep_q' : 'b1.rep_m')) + '</span>' : '') + '</div></div></div><div class="row">' +
        (s === 'biz' && !def ? '<button type="button" class="btn sm" data-def>' + esc(t('hub.makedef')) + '</button>' : '') +
        (s === 'doc' ? '' : '<button type="button" class="btn sm" data-edit>' + esc(t('my.edit')) + '</button>') +
        '<button type="button" class="btn sm" data-log>' + esc(t('b1.changes')) + '</button>' +
        '<button type="button" class="btn sm danger" data-del>' + esc(t('h.del')) + '</button></div></div></li>';
    }).join('') : '<li class="empty">' + esc(t(q ? 'h.nomatch' : 'hub.empty.' + s)) + '</li>';
  }

  /* ---------- add / edit form ---------- */
  function fieldHtml(f, r) {
    var k = f[0], lbl = t(f[1]), kind = f[2], x = f[3] || {}, v = get(r, k), id = 'fm-' + k.replace('.', '-');
    v = v == null ? '' : v;
    var cls = 'f' + (x.wide || kind === 'area' ? ' wide' : ''), req = x.req ? ' required' : '', h;
    if (kind === 'area') h = '<textarea id="' + id + '" name="' + k + '" rows="2" dir="auto">' + esc(v) + '</textarea>';
    else if (kind === 'state') h = '<select id="' + id + '" name="' + k + '"><option value="">—</option>' + NS.STATES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === v ? ' selected' : '') + '>' + s[0] + ' · ' + esc(NS.stateLoc(s[0])) + '</option>'; }).join('') + '</select>';
    else if (kind === 'usedby') {   /* with two or more businesses: this customer / item for every business, or only one */
      if (cache.biz.length < 2 && !v) return '';
      h = '<select id="' + id + '" name="' + k + '"><option value="">' + esc(t('pb.allbiz')) + '</option>' + cache.biz.map(function (b) { return '<option value="' + esc(b.id) + '"' + (b.id === v ? ' selected' : '') + '>' + esc(t('pb.only', { b: b.name })) + '</option>'; }).join('') + '</select>';
    }
    else if (kind === 'sel') h = '<select id="' + id + '" name="' + k + '">' + x.opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('') + '</select>';
    else if (kind === 'pgroup' || kind === 'igroup') {
      var gk = kind === 'pgroup' ? 'party' : 'item';
      v = gk === 'party' ? NS.partyGroup(r, G).id : NS.itemGroup(r, G).id;
      h = '<select id="' + id + '" name="' + k + '">' + (gk === 'item' ? '<option value="">' + esc(t('grp.none')) + '</option>' : '') + gOptions(gk, v) +
        '<option value="+">' + esc(t('grp.newopt')) + '</option></select>' +
        '<span class="gnew" data-gnew hidden><label class="sr" for="' + id + '-new">' + esc(t('grp.newname')) + '</label><input id="' + id + '-new" dir="auto" maxlength="60" placeholder="' + esc(t('grp.newname')) + '">' +
        '<button type="button" class="btn sm" data-gnew-add>' + esc(t('grp.addbtn')) + '</button></span>';
    }
    else if (kind === 'gst') h = '<select id="' + id + '" name="' + k + '"><option value="">—</option>' + ratesWith(v).map(function (g) { return '<option value="' + g + '"' + (String(g) === String(v) ? ' selected' : '') + '>' + g + '%' + (RATES.indexOf(g) < 0 ? ' ⚠' : '') + '</option>'; }).join('') + '</select>';
    else if (kind === 'img') h = '<div class="imgf"><img alt="" data-img="' + k + '"' + (v ? ' src="' + esc(v) + '"' : ' hidden') + '><input id="' + id + '" type="file" accept="image/*" data-imgin="' + k + '" data-max="' + x.max + '">' +
      (k === 'sign' ? '<button type="button" class="btn" data-imgdraw="' + k + '">Draw signature</button>' : '') +
      '<button type="button" class="link" data-imgrm="' + k + '"' + (v ? '' : ' hidden') + '>' + esc(t('hub.rmimg')) + '</button></div>';
    else {
      var attrs = ' id="' + id + '" name="' + k + '" value="' + esc(v) + '"' + req;
      if (kind === 'ltr' || kind === 'gstin' || kind === 'num' || kind === 'unit') attrs += ' dir="ltr"'; else attrs += ' dir="auto"';
      if (x.type) attrs += ' type="' + x.type + '"';
      if (x.mode) attrs += ' inputmode="' + x.mode + '"';
      if (kind === 'num') attrs += ' inputmode="decimal"';
      if (x.max) attrs += ' maxlength="' + x.max + '"';
      if (kind === 'gstin') attrs += ' maxlength="15" autocapitalize="characters" spellcheck="false"';
      if (x.upper) attrs += ' autocapitalize="characters"';
      if (x.ph) attrs += ' placeholder="' + esc(x.ph) + '"';
      if (kind === 'unit') attrs += ' list="hub-units"';
      if (kind === 'cat') attrs += ' list="hub-cats"';
      h = '<input' + attrs + '>';
    }
    var hint = kind === 'gstin' ? '<small class="hint" data-gst-hint aria-live="polite"></small>' : x.hint ? '<small class="hint">' + esc(t(x.hint)) + '</small>' : '';
    return '<div class="' + cls + '"><label for="' + id + '">' + esc(lbl) + (x.req ? ' *' : '') + '</label>' + h + hint + '</div>';
  }
  /* what the shared party / item form needs from this screen */
  function pmOpts(s, r) {
    var bz = function () { var b = cache.biz.filter(function (x) { return x.id === S.defBiz; })[0] || cache.biz[0]; if (!b) return null; var c = JSON.parse(JSON.stringify(b)); delete c.id; delete c.created; delete c.updated; return c; };
    var gd = (S.godowns || []).slice(); Object.keys(S.byBiz || {}).forEach(function (b) { ((S.byBiz[b] || {}).godowns || []).forEach(function (x) { if (gd.indexOf(x) < 0) gd.push(x); }); });
    var b0 = bz();
    return { ctx: 'my', biz: cache.biz, godowns: gd, units: UNITS, multiLed: !!S.multiLed || Object.keys(S.byBiz || {}).some(function (b) { return (S.byBiz[b] || {}).multiLed; }),
      groupHtml: function (rec) { return gSelect(s, s === 'party' ? NS.partyGroup(rec, G).id : NS.itemGroup(rec, G).id); },
      ob: s === 'party' && r.id ? NSPM.findOb(cache.doc || [], r.name, b0 && b0.name) : null, seller: bz, side: r.role };
  }
  function openForm(s, id) {
    var dlg = $('#hub-form'), r = id ? JSON.parse(JSON.stringify(cache[s].filter(function (x) { return x.id === id; })[0] || {})) : (s === 'party' ? { role: 'customer' } : s === 'item' ? { kind: 'goods', unit: 'Nos', gst: 18 } : {});
    var imgs = { logo: r.logo || '', sign: r.sign || '' };
    $('[data-form-title]', dlg).textContent = t(id ? 'hub.edit.' + s : 'hub.add.' + s);
    var f = $('form', dlg);
    var pm = (s === 'party' || s === 'item') && window.NSPM, po = pm ? pmOpts(s, r) : null;
    /* party and item: the sectioned form shared with the App (pmforms.js, owner 26 Nov 2026); the other sections of hubExt are inside it now */
    f.innerHTML = (pm ? NSPM.html(s, r, po) : '<div class="fg">' + FORM[s].map(function (x) { return fieldHtml(x, r); }).join('') + '</div>' +
      hubExt('form', s, r)) +   /* sections added by other files (hubmore.js: stock tracking) */
      '<datalist id="hub-units">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary">' + esc(t(id ? 'my.savech' : 'hub.save')) + '</button>' +
      (id ? '' : '<button type="submit" class="btn" data-again>' + esc(t('hub.saveadd')) + '</button>') +
      '<button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    if (r.gst && r.gst.legal && key(r.gst.legal) !== key(r.name) && $('[name=name]', f)) {
      var lh = document.createElement('small'); lh.className = 'hint'; lh.textContent = t('gf.legal') + ': ' + r.gst.legal;
      $('[name=name]', f).parentNode.appendChild(lh);
    }
    var g = $('[name=gstin]', f);
    function gstHint(ev) {
      if (!g) return;
      g.value = g.value.toUpperCase().replace(/\s/g, '');
      var c = NS.gstinCheck(g.value), h = $('[data-gst-hint]', f), st = $('[name=state]', f);
      if (c.empty) { h.textContent = ''; h.className = 'hint'; return; }
      if (g.value.length < 15) { h.textContent = t('hub.gst.typing', { n: 15 - g.value.length }); h.className = 'hint'; return; }
      h.textContent = c.ok ? t('hub.gst.ok', { state: NS.stateLoc(c.state) || '—', pan: c.pan }) : c.msg;
      h.className = 'hint ' + (c.ok ? 'good' : 'bad');
      if (c.ok && c.state && st && !st.value) st.value = c.state;
      /* a valid GSTIN on a business marked "not registered": it is registered (round C) */
      var rg = $('[name=reg]', f); if (ev && c.ok && rg && rg.value === 'unreg') { rg.value = 'regular'; NS.toast(t('hub.rg.toreg')); }
    }
    if (g && !pm) { g.addEventListener('input', gstHint); gstHint(); }
    wireGroupField(s, f);
    if (pm) NSPM.wire(f, s, r, po);
    if (g && !pm && NS.gstFetchButton) NS.gstFetchButton(g, function (d) {
      ['name', 'addr', 'city', 'pin', 'state'].forEach(function (k) { var el = f.elements[k]; if (el && d[k]) el.value = d[k]; });
      if (s === 'biz' && d.reg && f.elements.reg) f.elements.reg.value = d.reg;
      var cs = String(d.constitution || ''), bt = /limited liability|\bllp\b/i.test(cs) ? 'llp' : /partnership/i.test(cs) ? 'firm' : /company|limited/i.test(cs) ? 'co' : /trust|society|association|club/i.test(cs) ? 'npo' : /propriet/i.test(cs) ? 'prop' : '';
      if (s === 'biz' && bt && f.elements.fmbtype) { f.elements.fmbtype.value = bt; f.elements.fmbtype.dispatchEvent(new Event('change', { bubbles: true })); }   /* F7-4 */
      if (s === 'party' && d.reg) r.reg = d.reg;
      r.gst = { legal: d.legal || '', trade: d.trade || '', status: d.status || '', type: d.type || '', since: d.since || '', checked: d.checked };
      gstHint();
      if (f.requestSubmit) f.requestSubmit(); else $('[type=submit]', f).click();
    });
    $$('[data-imgin]', f).forEach(function (inp) {
      inp.addEventListener('change', function () {
        var file = inp.files[0], k = inp.getAttribute('data-imgin');
        if (file) shrink(file, +inp.getAttribute('data-max')).then(function (u) { imgs[k] = u; var im = $('[data-img="' + k + '"]', f); im.src = u; im.hidden = !u; $('[data-imgrm="' + k + '"]', f).hidden = !u; });
      });
    });
    $$('[data-imgdraw]', f).forEach(function (b) {   /* draw the signature on screen (NS.drawSign, signature_pad) */
      b.addEventListener('click', function () { var k = b.getAttribute('data-imgdraw'); NS.drawSign().then(function (u) { if (!u) return; imgs[k] = u; var im = $('[data-img="' + k + '"]', f); im.src = u; im.hidden = false; $('[data-imgrm="' + k + '"]', f).hidden = false; }); });
    });
    $$('[data-imgrm]', f).forEach(function (b) {
      b.addEventListener('click', function () { var k = b.getAttribute('data-imgrm'); imgs[k] = ''; $('[data-img="' + k + '"]', f).hidden = true; b.hidden = true; $('[data-imgin="' + k + '"]', f).value = ''; });
    });
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    var again = false;
    var ag = $('[data-again]', f); if (ag) ag.addEventListener('click', function () { again = true; });
    f.onsubmit = function (e) {
      e.preventDefault();
      if (pm) { if (NSPM.read(f, s, r, po)) { again = false; return; } }
      else FORM[s].forEach(function (x) {
        if (x[2] === 'img') { r[x[0]] = imgs[x[0]]; return; }
        var el = f.elements[x[0]]; if (!el) return;
        var v = el.value.trim();
        if (x[2] === 'gstin' || (x[3] && x[3].upper)) v = v.toUpperCase().replace(/\s/g, '');
        set(r, x[0], v);
      });
      if (s === 'item' && !pm) { if (r.gst !== '') r.gst = +r.gst; }
      if (s === 'item' && window.NSGst && r.tax) {   /* r1-gst: a rate changed here on an item with dated rates applies from today; defaults are not stored */
        if (r.tax.kind === 'taxable') delete r.tax.kind; if (r.tax.itc === 'ok') delete r.tax.itc;
        if (r.gst != null && r.gst !== '' && NSGst.hist(r).some(function (h) { return h.from; }) && NSGst.itemRate(r, NS.today()).rate !== r.gst) Object.assign(r, NSGst.addRate(r, NS.today(), r.gst, NS.today()));
        if (!Object.keys(r.tax).length) delete r.tax;
      }
      if (s === 'party' && r.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(r.pan)) { NS.toast(NS.t('ms.panbad'), 'bad'); return; }
      if (r.group === '+') r.group = '';
      if (!r.biz) delete r.biz;
      if (s === 'item') { if (r.group) r.cat = gName('item', r.group); else { delete r.group; r.cat = ''; } }
      if (s === 'party' && (!r.group || r.group === (r.role === 'supplier' ? 'creditors' : 'debtors'))) delete r.group;   /* the built-in for its type: follows the type */
      Object.keys(NUMS).forEach(function (k) { if (r[k] != null && r[k] !== '') r[k] = NS.num(r[k]); });
      hubExt('read', s, r, f);
      if (s === 'party' && r.ship && !r.ship.addr) delete r.ship;
      var nm = key(r[NAMEKEY[s]]);
      if (!nm) { NS.toast(t('hub.v.name'), 'bad'); again = false; return; }
      if (cache[s].some(function (x) { return x.id !== r.id && key(x[NAMEKEY[s]]) === nm; })) { NS.toast(t('hub.v.dup', { name: r[NAMEKEY[s]] }), 'bad'); again = false; return; }
      if (r.gstin && !NS.gstinCheck(r.gstin).ok) { NS.toast(NS.gstinCheck(r.gstin).msg, 'bad'); if (g) g.focus(); again = false; return; }
      if (s === 'party') {   /* compliance pack: Udyam number (format only, nothing is looked up), agreed days at most 45 */
        if (r.udyam) { var ud = udyamFmt(r.udyam); if (!ud) { NS.toast(t('cp.udbad'), 'bad'); if (f.elements.udyam) f.elements.udyam.focus(); again = false; return; } r.udyam = ud; } else delete r.udyam;
        if (r.agdays != null && r.agdays !== '') r.agdays = Math.max(0, Math.min(45, Math.floor(r.agdays))); else delete r.agdays;
        if (!r.msme) delete r.msme;
      }
      if (r.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(r.bankIfsc)) { NS.toast(t('hub.v.ifsc'), 'bad'); if (f.elements.bankIfsc) f.elements.bankIfsc.focus(); again = false; return; }
      var first = s === 'biz' && !cache.biz.length && !S.defBiz;
      NSStore.put(s, r).then(function (saved) {
        NS.toast(t('my.saved'));
        var p = pm ? NSPM.opening(f, s, saved && saved.id ? saved : r, po) : null;   /* opening balance / opening stock typed on the form */
        if (first) { S.defBiz = saved.id; return Promise.resolve(p).then(saveSettings); }
        return p;
      }).then(function () {
        var a = again; again = false;
        return show(s).then(function () { if (a) openForm(s); else dlg.close(); });
      }).catch(function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    };
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    var firstIn = $('input:not([type=file]),select,textarea', f); if (pm) { var nf = $('[name=' + (s === 'item' ? 'desc' : 'name') + ']', f); if (nf) nf.focus(); } else if (firstIn && !(s === 'party')) firstIn.focus(); else if ($('[name=name]', f)) $('[name=name]', f).focus();
    if (pm) dlg.classList.add('pm-wide'); else dlg.classList.remove('pm-wide');
  }
  function udyamFmt(s) { var m = /^UDYAM([A-Z]{2})(\d{2})(\d{7})$/.exec(String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')); return m ? 'UDYAM-' + m[1] + '-' + m[2] + '-' + m[3] : ''; }
  function shrink(file, max) {
    return new Promise(function (res) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/png'));
      };
      img.onerror = function () { NS.toast(t('img.bad'), 'bad'); res(''); };
      img.src = url;
    });
  }

  /* ---------- party and stock groups (meta 'groups'; reader NS.groupsOf / NS.partyGroup / NS.itemGroup in core.js) ---------- */
  var gq = Promise.resolve();
  function gNorm(m) { m = m && typeof m === 'object' ? m : {}; return { party: Array.isArray(m.party) ? m.party : [], item: Array.isArray(m.item) ? m.item : [] }; }
  function gNewId() { return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  /* read the newest list, change it, save it: one change at a time, so two quick saves never lose each other's groups */
  function editGroups(fn) {
    gq = gq.catch(function () {}).then(function () { return NSStore.meta('groups'); }).then(function (m) {
      var fresh = gNorm(m);
      if (fn(fresh) === false) { G = fresh; return; }
      return NSStore.meta('groups', fresh).then(function () { G = fresh; });
    });
    return gq;
  }
  /* every item category typed so far becomes an item group (items keep their cat text) */
  function catGroups() {
    var have = {}, add = [];
    G.item.forEach(function (g) { have[key(g.name)] = 1; });
    cache.item.forEach(function (i) { var c = String(i.cat || '').trim(); if (c && !have[key(c)] && !(i.group && G.item.some(function (g) { return g.id === i.group; }))) { have[key(c)] = 1; add.push(c); } });
    if (!add.length) return Promise.resolve();
    return editGroups(function (m) {
      var n = 0;
      add.forEach(function (c) { if (!m.item.some(function (g) { return key(g.name) === key(c); })) m.item.push({ id: gNewId() + (n++), name: c, under: '' }); });
      return n > 0;
    });
  }
  function gList(kind) { return NS.groupsOf(G, kind); }
  function gGet(kind, id) { return gList(kind).filter(function (g) { return g.id === id; })[0]; }
  function gName(kind, id) { var g = gGet(kind, id); return g ? g.name : ''; }
  function gPath(kind, id) {
    var g = gGet(kind, id); if (!g) return '';
    var up = g.under && gGet(kind, g.under);
    return up && !up.builtin ? up.name + ' › ' + g.name : g.name;
  }
  function gKids(kind, id) { return gList(kind).filter(function (g) { return g.under === id && !g.builtin; }); }
  function gRoots(kind) { return kind === 'party' ? gList('party').filter(function (g) { return g.builtin; }) : gList('item').filter(function (g) { return !g.under || !gGet('item', g.under); }); }
  function gOf(kind, r) { return kind === 'party' ? NS.partyGroup(r, G) : NS.itemGroup(r, G); }
  /* a record is in a group when it is in it, in one of its sub-groups, or (built-ins) anywhere under it */
  function inGroup(kind, r, id) { var g = gOf(kind, r); return g.id === id || g.under === id || (kind === 'party' && g.top === id); }
  function members(kind, id) { return cache[kind].filter(function (r) { return gOf(kind, r).id === id; }); }
  /* <option>s: tops then their sub-groups, indented; skip = ids left out; topOnly = no sub-groups (only groups that may hold a sub-group) */
  function gOptions(kind, sel, skip, topOnly) {
    skip = skip || [];
    var opt = function (g, lv) { return skip.indexOf(g.id) >= 0 ? '' : '<option value="' + esc(g.id) + '"' + (g.id === sel ? ' selected' : '') + '>' + new Array(lv * 3 + 1).join(' ') + esc(g.name) + '</option>'; };
    return gRoots(kind).map(function (r) {
      var h = opt(r, 0);
      if (kind === 'party') h += gKids('party', r.id).map(function (g) { return opt(g, 1) + (topOnly ? '' : gKids('party', g.id).map(function (x) { return opt(x, 2); }).join('')); }).join('');
      else if (!topOnly) h += gKids('item', r.id).map(function (g) { return opt(g, 1); }).join('');
      return h;
    }).join('');
  }
  function gTabs(s, groups) {
    if (s !== 'party' && s !== 'item') return '';
    return '<nav class="seg cats gtabs" aria-label="' + esc(t('my.t.' + s)) + '"><a class="btn sm" href="#' + s + '"' + (groups ? '' : ' aria-current="page"') + '>' + esc(t('grp.list')) + '</a>' +
      '<a class="btn sm" href="#' + (s === 'party' ? 'pgroups' : 'igroups') + '"' + (groups ? ' aria-current="page"' : '') + '>' + esc(t('grp.nav')) + ' <small class="mono">' + (s === 'party' ? G.party.length + 2 : G.item.length) + '</small></a></nav>';
  }
  function gFilter(s) {
    if (s === 'item' && !G.item.length) return '';
    return '<div class="gfilter"><label for="my-gf">' + esc(t('grp.group')) + '</label><select id="my-gf"><option value="">' + esc(t('grp.all')) + '</option>' + gOptions(s, gf) +
      (s === 'item' ? '<option value="-"' + (gf === '-' ? ' selected' : '') + '>' + esc(t('grp.none')) + '</option>' : '') + '</select></div>';
  }
  function gSelect(kind, sel) { return (kind === 'item' ? '<option value="">' + esc(t('grp.none')) + '</option>' : '') + gOptions(kind, sel) + '<option value="+">' + esc(t('grp.newopt')) + '</option>'; }
  /* the Group select on the party and item forms: "+ New group…" opens a name box under it */
  function wireGroupField(s, f) {
    var sel = f.elements.group; if (!sel) return;
    var box = $('[data-gnew]', f), inp = $('input', box), last = sel.value;
    sel.addEventListener('change', function () {
      if (sel.value === '+') { box.hidden = false; inp.focus(); } else { box.hidden = true; last = sel.value; }
    });
    if (s === 'party' && f.elements.role) f.elements.role.addEventListener('change', function () {
      var g = gGet('party', sel.value);
      if (!g || g.builtin) { sel.value = last = f.elements.role.value === 'supplier' ? 'creditors' : 'debtors'; box.hidden = true; }
    });
    function add() {
      var nm = inp.value.trim().replace(/\s+/g, ' ');
      if (!nm) { NS.toast(t('grp.v_name'), 'bad'); inp.focus(); return; }
      if (gDup(s, nm)) { NS.toast(t('grp.v_dup', { name: nm }), 'bad'); inp.focus(); return; }
      var id = gNewId(), under = s === 'party' ? (f.elements.role && f.elements.role.value === 'supplier' ? 'creditors' : 'debtors') : '';
      editGroups(function (m) { m[s].push({ id: id, name: nm, under: under }); }).then(function () {
        sel.innerHTML = gSelect(s, id); sel.value = last = id; inp.value = ''; box.hidden = true; sel.focus(); NS.toast(t('grp.saved')); counts();
      }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    }
    $('[data-gnew-add]', box).addEventListener('click', add);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  }
  function gDup(kind, nm, not) {
    var k = key(nm);
    if (kind === 'party' && ['sundry debtors', 'sundry creditors', 'customers', 'suppliers'].indexOf(k) >= 0) return true;
    return gList(kind).some(function (g) { return g.id !== not && key(g.name) === k; });
  }
  function groupsHtml(kind) {
    var noun = function (n) { return t(kind === 'party' ? 'grp.n_party' : 'grp.n_item', { n: n }); };
    function row(g, lv) {
      var n = members(kind, g.id).length, kids = gKids(kind, g.id), all = cache[kind].filter(function (r) { return inGroup(kind, r, g.id); }).length;
      var bits = [noun(all)];
      if (kids.length) bits.push(t('grp.subs', { n: kids.length }));
      if (g.builtin) bits.push(t('grp.builtin'), 'Tally: ' + (g.id === 'debtors' ? 'Sundry Debtors' : 'Sundry Creditors'));
      return '<li data-gid="' + esc(g.id) + '" class="glv' + lv + '"><div class="hd2"><div class="who"><div><b class="ttl">' + esc(g.name) + '</b><div class="sub">' + esc(bits.join(' · ')) + '</div></div></div>' +
        (g.builtin ? '' : '<div class="row"><button type="button" class="btn sm" data-gedit>' + esc(t('grp.rename')) + '</button><button type="button" class="btn sm" data-gmerge>' + esc(t('grp.merge')) + '</button>' +
          '<button type="button" class="btn sm danger" data-gdel' + (n || kids.length ? ' aria-disabled="true" title="' + esc(t('grp.notempty', { name: g.name })) + '"' : '') + '>' + esc(t('grp.del')) + '</button></div>') + '</div></li>' +
        kids.map(function (x) { return row(x, lv + 1); }).join('');
    }
    var roots = gRoots(kind), none = kind === 'item' ? cache.item.filter(function (r) { return !NS.itemGroup(r, G).id; }).length : 0;
    return '<div class="pane-hd"><h2>' + esc(t('grp.t_' + kind)) + '</h2><button type="button" class="btn primary" data-gadd>+ ' + esc(t('grp.add')) + '</button></div>' + gTabs(kind, true) +
      '<p class="soft">' + esc(t('grp.p_' + kind)) + '</p><ul class="my-list glist">' +
      (roots.length ? roots.map(function (g) { return row(g, 0); }).join('') : '<li class="empty">' + esc(t('grp.empty')) + '</li>') + '</ul>' +
      (none ? '<p class="soft">' + esc(t('grp.none')) + ': ' + esc(noun(none)) + '</p>' : '');
  }
  function openDlg(ttl, html, ok) {
    var dlg = $('#hub-form'), f = $('form', dlg);
    $('[data-form-title]', dlg).textContent = ttl;
    f.onsubmit = null;
    f.innerHTML = html + '<div class="dlg-foot"><button type="submit" class="btn primary">' + esc(ok) + '</button><button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    return f;
  }
  /* new group, or rename / move one; a group with sub-groups stays at the top (one level of sub-groups) */
  function groupForm(kind, id) {
    var g = id ? gGet(kind, id) : null, kids = id ? gKids(kind, id) : [];
    var under = g ? g.under : kind === 'party' ? (gf && gGet('party', gf) && gGet('party', gf).builtin ? gf : 'debtors') : '';
    var opts = kind === 'party' ? (kids.length ? gRoots('party').map(function (r) { return '<option value="' + r.id + '"' + (r.id === under ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') : gOptions('party', under, [id], true))
      : '<option value="">' + esc(t('grp.top')) + '</option>' + (kids.length ? '' : gOptions('item', under, [id], true));
    var f = openDlg(t(id ? 'grp.edit' : 'grp.add'), '<div class="fg"><div class="f wide"><label for="gf-name">' + esc(t('grp.name')) + ' *</label><input id="gf-name" name="name" dir="auto" maxlength="60" required value="' + esc(g ? g.name : '') + '"></div>' +
      '<div class="f wide"><label for="gf-under">' + esc(t('grp.under')) + '</label><select id="gf-under" name="under">' + opts + '</select><small class="hint">' + esc(t('grp.h_under')) + '</small></div></div>',
      t(id ? 'my.savech' : 'hub.save'));
    var nmIn = f.elements.name; nmIn.focus();
    f.onsubmit = function (e) {
      e.preventDefault();
      var nm = nmIn.value.trim().replace(/\s+/g, ' '), up = f.elements.under.value;
      if (!nm) { NS.toast(t('grp.v_name'), 'bad'); nmIn.focus(); return; }
      if (gDup(kind, nm, id)) { NS.toast(t('grp.v_dup', { name: nm }), 'bad'); nmIn.focus(); return; }
      var moved = kind === 'item' && g && g.name !== nm ? members('item', id) : [];
      editGroups(function (m) {
        var x = id && m[kind].filter(function (y) { return y.id === id; })[0];
        if (x) { x.name = nm; x.under = up; } else m[kind].push({ id: gNewId(), name: nm, under: up });
      }).then(function () {
        /* items keep cat = their group's name, for code that reads cat */
        return moved.reduce(function (p, r) { return p.then(function () { r.group = id; r.cat = nm; return NSStore.put('item', r); }); }, Promise.resolve());
      }).then(function () { NS.toast(t('grp.saved')); $('#hub-form').close(); return show(cur); }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    };
  }
  /* merge: every member moves to the chosen group, sub-groups go under it, then the group is deleted */
  function mergeForm(kind, id) {
    var g = gGet(kind, id), kids = gKids(kind, id), skip = [id].concat(kids.map(function (k) { return k.id; }));
    var opts = gOptions(kind, '', skip, kids.length > 0);
    if (!opts) { NS.toast(t('grp.nomerge'), 'bad'); return; }
    var f = openDlg(t('grp.mergeinto', { name: g.name }), '<div class="fg"><div class="f wide"><label for="gf-into">' + esc(t('grp.mergeinto', { name: g.name })) + '</label><select id="gf-into" name="into">' + opts + '</select>' +
      '<small class="hint">' + esc(t('grp.h_merge', { name: g.name })) + '</small></div></div>', t('grp.mergebtn'));
    f.onsubmit = function (e) {
      e.preventDefault();
      var to = f.elements.into.value, toG = gGet(kind, to), recs = members(kind, id);
      if (!toG || !NS.okSync(t('grp.c_merge', { n: recs.length, a: g.name, b: toG.name }))) return;
      recs.reduce(function (p, r) {
        return p.then(function () {
          r.group = to;
          if (kind === 'item') r.cat = toG.name;
          if (kind === 'party' && to === (r.role === 'supplier' ? 'creditors' : 'debtors')) delete r.group;
          return NSStore.put(kind, r);
        });
      }, Promise.resolve()).then(function () {
        return editGroups(function (m) { m[kind] = m[kind].filter(function (y) { return y.id !== id; }); m[kind].forEach(function (y) { if (y.under === id) y.under = to; }); });
      }).then(function () { NS.toast(t('grp.merged', { n: recs.length })); $('#hub-form').close(); return show(cur); }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    };
  }
  function delGroup(kind, id) {
    var g = gGet(kind, id); if (!g || g.builtin) return;
    if (members(kind, id).length || gKids(kind, id).length) { NS.toast(t('grp.notempty', { name: g.name }), 'bad'); return; }
    if (!NS.okSync(t('grp.c_del', { name: g.name }))) return;
    editGroups(function (m) { m[kind] = m[kind].filter(function (y) { return y.id !== id; }); })
      .then(function () { NS.toast(t('grp.deleted')); return show(cur); }, function (err) { NS.toast(err.message, 'bad'); });
  }
  /* CSV: a group name -> its id; a name not known yet becomes a new group (parties: under Customers or Suppliers by type) */
  function gFromCsv(kind, nm, role, made) {
    var k = key(nm); if (!k) return '';
    if (kind === 'party') { if (k === 'sundry debtors' || k === 'customers') return 'debtors'; if (k === 'sundry creditors' || k === 'suppliers') return 'creditors'; }
    var hit = gList(kind).concat(made).filter(function (g) { return key(g.name) === k; })[0];
    if (hit) return hit.id;
    var g = { id: gNewId() + made.length, name: String(nm).trim(), under: kind === 'party' ? (role === 'supplier' ? 'creditors' : 'debtors') : '' };
    made.push(g); return g.id;
  }

  /* ---------- Batch 1: getting started, categories, recycle bin, edit history, Excel ---------- */
  function wizardHtml() {
    return '<div class="card b1-wiz"><h3>' + esc(t('b1.wiz')) + '</h3><p class="soft">' + esc(t('b1.wizp')) + '</p><form data-wiz novalidate><div class="fg">' +
      '<div class="f wide"><label for="wz-name">' + esc(t('l.bname')) + ' *</label><input id="wz-name" name="name" dir="auto" required></div>' +
      '<div class="f"><label for="wz-state">' + esc(t('l.state')) + '</label><select id="wz-state" name="state"><option value="">—</option>' + NS.STATES.map(function (x) { return '<option value="' + x[0] + '">' + x[0] + ' · ' + esc(NS.stateLoc(x[0])) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="wz-gstin">' + esc(t('l.gstin')) + '</label><input id="wz-gstin" name="gstin" dir="ltr" maxlength="15" autocapitalize="characters" spellcheck="false"><small class="hint">' + esc(t('b1.wiz_gst')) + '</small></div>' +
      '<div class="f"><label for="wz-phone">' + esc(t('l.phone')) + '</label><input id="wz-phone" name="phone" dir="ltr" inputmode="tel"></div>' +
      '<div class="f"><label for="wz-gst">' + esc(t('hub.defgst')) + '</label><select id="wz-gst" name="gst">' + RATES.map(function (g) { return '<option value="' + g + '"' + (g === 18 ? ' selected' : '') + '>' + g + '%</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="wz-pre">' + esc(t('hub.prefix')) + '</label><input id="wz-pre" name="prefix" dir="ltr" maxlength="8" value="INV" autocapitalize="characters"></div>' +
      '</div><div class="btns"><button type="submit" class="btn primary">' + esc(t('b1.wiz_go')) + '</button><a class="btn" href="' + APP + '">' + esc(t('b1.samp_try')) + '</a></div>' +
      '<p class="soft">' + esc(t('b1.samp_h')) + '</p></form></div>';
  }
  function wireWizard(pane) {
    var f = $('[data-wiz]', pane); if (!f) return;
    f.elements.gstin.addEventListener('input', function () {
      var g = f.elements.gstin; g.value = g.value.toUpperCase().replace(/\s/g, '');
      var c = NS.gstinCheck(g.value); if (c.ok && c.state && !f.elements.state.value) f.elements.state.value = c.state;
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var E = f.elements, name = E.name.value.trim(), g = E.gstin.value.trim();
      if (!name) { NS.toast(t('hub.v.name'), 'bad'); E.name.focus(); return; }
      if (g && !NS.gstinCheck(g).ok) { NS.toast(NS.gstinCheck(g).msg, 'bad'); E.gstin.focus(); return; }
      NSStore.put('biz', { name: name, state: E.state.value, gstin: g, phone: E.phone.value.trim(), reg: g ? 'regular' : 'unreg' }).then(function (b) {
        S.defBiz = b.id;
        S.invoice = Object.assign(S.invoice || {}, { prefix: E.prefix.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), gst: +E.gst.value });
        return saveSettings();
      }).then(function () { NS.toast(t('b1.wiz_done')); show('home'); }, function (err) { NS.toast(t('nosave', { e: err.message }), 'bad'); });
    });
  }
  function binHtml() {
    /* a record that is back (restored here or from a backup file) no longer shows in the bin (round C) */
    var rows = cache.bin.filter(function (b) { var id = (b.rec || {}).id; return !id || !(cache[b.store] || []).some(function (x) { return x.id === id; }); }).sort(function (a, b) { return b.at - a.at; });
    return '<div class="pane-hd"><h2>' + esc(t('b1.bin')) + '</h2>' + (rows.length ? '<button type="button" class="btn sm danger" data-binempty>' + esc(t('b1.binempty')) + '</button>' : '') + '</div>' +
      '<p class="soft">' + esc(t('b1.binp', { n: NSStore.binDays })) + '</p><ul class="my-list">' + (rows.length ? rows.map(function (b) {
        var left = Math.max(0, NSStore.binDays - Math.floor((Date.now() - b.at) / 864e5));
        /* a deleted document says what it was: date, party or head, amount (round C: only "Expense") */
        return '<li data-id="' + esc(b.id) + '"><div class="hd2"><div class="who"><div><b class="ttl">' + esc(title(b.store, b.rec || {})) + '</b>' + (b.store === 'doc' && b.rec ? '<div class="sub">' + sub('doc', b.rec) + '</div>' : '') + '<div class="sub">' + esc(t('my.t.' + b.store)) + ' · ' +
          esc(t('b1.delon', { d: NS.when(b.at) })) + (b.who ? ' · ' + esc(b.who) : '') + ' · ' + esc(t('b1.daysleft', { n: left })) + '</div></div></div><div class="row">' +
          '<button type="button" class="btn sm primary" data-restore>' + esc(t('b1.restore')) + '</button></div></div></li>';
      }).join('') : '<li class="empty">' + esc(t('b1.binnone')) + '</li>') + '</ul>';
  }
  function logHtml() {
    var rows = cache.log.slice().sort(function (a, b) { return b.at - a.at; });
    return '<div class="pane-hd"><h2>' + esc(t('b1.hist')) + '</h2>' + (rows.length ? '<button type="button" class="btn sm" data-xllog>' + esc(t('b1.xl')) + '</button>' : '') + '</div>' +
      '<p class="soft">' + esc(t('b1.logp')) + '</p><p class="soft">' + esc(t('b1.logrule')) + '</p>' +
      (NS.logView ? '<div data-au-view></div>' + logLater(rows) : NS.logHtml(rows.slice(0, 300), true) + (rows.length > 300 ? '<p class="soft">' + esc(t('b1.logmore', { n: rows.length })) + '</p>' : ''));
  }
  /* filters and "Check edit history" (extras.js NS.logView), filled once the pane is on the page (ERP Round 1, A-1 / C-18) */
  function logLater(rows) {
    setTimeout(function () { var el = document.querySelector('[data-au-view]'); if (el) NS.logView(el, rows, S.lockBefore || '', true); }, 0);
    return '';
  }
  function excel(s) {
    if (s === 'item') return NS.xlsx('items-and-prices-' + NS.today() + '.xlsx', [NS.reports.items(cache.item)]);
    var D = cache.doc, biz = (cache.biz.filter(function (b) { return b.id === S.defBiz; })[0] || cache.biz[0] || {}).name || '';
    NS.xlsx('registers-' + NS.today() + '.xlsx', [NS.reports.sales(D), NS.reports.purchases(D), NS.reports.dues(D, biz, cache.party, NS.today(), 'recv'), NS.reports.dues(D, biz, cache.party, NS.today(), 'pay')]);
  }

  /* ---------- settings ---------- */
  function saveSettings(why) {
    var o = JSON.parse(JSON.stringify(S));
    Object.keys(o).forEach(function (k) { if (k.charAt(0) === '_') delete o[k]; });
    /* years closed in the App (Batch 2) and its feature switches are changed there only: keep the newest */
    delete o.closed; delete o.features;
    return NSStore.meta('settings').then(function (fresh) {
      fresh = fresh || {}; NS.cfgSplit(fresh, cache.biz);
      NS.cfgSave(fresh, SB, o);   /* business keys under this business, the rest shared */
      RAW = fresh; S.closed = fresh.closed; S.features = fresh.features;
      return NSStore.meta('settings', fresh, { why: typeof why === 'string' ? why : '' });   /* lock moves are logged with their reason (A-4) */
    });
  }
  function settingsHtml() {
    var c = S.invoice || {}, sel = function (v, w) { return String(v) === String(w) ? ' selected' : ''; };
    var gst = c.gst != null && c.gst !== '' ? c.gst : 18, acc = c.accent || ACCENTS[0];
    var pick = cache.biz.length > 1 ? '<div class="card set-biz"><div class="f"><label for="st-for">' + esc(t('pb.setfor')) + '</label><select id="st-for" data-setbiz>' +
      cache.biz.map(function (b) { return '<option value="' + esc(b.id) + '"' + sel(b.id, SB) + '>' + esc(b.name) + '</option>'; }).join('') + '</select><small class="hint">' + esc(t('pb.setforh')) + '</small></div></div>' : '';
    return '<h2>' + esc(t('my.t.settings')) + '</h2><p class="soft">' + esc(t('hub.p.settings')) + '</p>' + pick + '<form class="set" data-set>' +
      '<fieldset class="card"><legend>' + esc(t('hub.g.gen')) + '</legend><div class="fg">' +
        '<div class="f wide"><label for="st-def">' + esc(t('hub.defbiz')) + '</label><select id="st-def" name="defBiz"><option value="">' + esc(t('hub.nodef')) + '</option>' +
          cache.biz.map(function (b) { return '<option value="' + esc(b.id) + '"' + sel(b.id, S.defBiz) + '>' + esc(b.name) + '</option>'; }).join('') + '</select><small class="hint">' + esc(t('hub.h.defbiz')) + '</small></div>' +
        '<div class="f"><label for="st-rem">' + esc(t('hub.remind')) + '</label><select id="st-rem" name="remindDays">' + [7, 15, 30, 0].map(function (d) {
          return '<option value="' + d + '"' + sel(d, S.remindDays != null ? S.remindDays : 7) + '>' + esc(d ? t('hub.every', { n: d }) : t('hub.never')) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="st-lang">' + esc(t('lang')) + '</label>' + NS.langSelect('st-lang') + '<small class="hint">' + esc(t('hub.h.lang2')) + '</small></div>' +
      '</div></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('hub.g.inv')) + '</legend><p class="dc-top"><a class="dc-open" href="' + siteUrl('billing') + '" target="_blank" rel="noopener">' + esc(t('hub.openmk')) + ' ›</a></p>' +
        '<h3 class="dc-sub">' + esc(t('hub.g.num')) + '</h3><div class="fg">' +
        '<div class="f"><label for="st-pre">' + esc(t('hub.prefix')) + '</label><input id="st-pre" name="prefix" dir="ltr" maxlength="8" value="' + esc(c.prefix != null ? c.prefix : 'INV') + '" autocapitalize="characters"></div>' +
        '<div class="f"><label for="st-dig">' + esc(t('hub.digits')) + '</label><select id="st-dig" name="digits">' + [1, 2, 3, 4, 5, 6].map(function (d) { return '<option' + sel(d, NS.seriesOf(S, 'invoice', '', '', { def: 'INV' }).width) + '>' + d + '</option>'; }).join('') + '</select></div>' +
        '<div class="f wide"><label class="chk"><input type="checkbox" name="fy"' + (NS.seriesOf(S, 'invoice', '', '', { def: 'INV' }).fy ? ' checked' : '') + '> ' + esc(t('hub.fy')) + '</label></div>' +
        '<div class="f wide"><span class="lbl">' + esc(t('hub.next')) + '</span><b class="mono preview-no" data-no-pv></b><small class="hint">' + esc(t('hub.h.num')) + '</small></div>' +
        '<div class="f wide dc-inv">' + serHtml(S, INVX, 1) + vtcHtml(S, INVD, 1) + '</div>' +   /* ERP A-6 / C-11 for the invoice */
      '</div>' +
        '<h3 class="dc-sub">' + esc(t('hub.g.new')) + '</h3><div class="fg">' +
        '<div class="f"><label for="st-kind">' + esc(t('l.type')) + '</label><select id="st-kind" name="kind">' + ['tax', 'supply', 'plain'].map(function (k) { return '<option value="' + k + '"' + sel(k, c.kind || 'tax') + '>' + esc(t('k.' + k)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="st-gst">' + esc(t('hub.defgst')) + '</label><select id="st-gst" name="gst">' + ratesWith(gst).map(function (g) { return '<option value="' + g + '"' + sel(g, gst) + '>' + g + '%</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="st-unit">' + esc(t('hub.defunit')) + '</label><input id="st-unit" name="unit" dir="ltr" list="st-units" value="' + esc(c.unit || 'Nos') + '"><datalist id="st-units">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist></div>' +
        '<div class="f"><label class="chk"><input type="checkbox" name="round"' + (c.round === false ? '' : ' checked') + '> ' + esc(t('l.round')) + '</label></div>' +
        '<div class="f wide"><span class="lbl" id="st-acc-l">' + esc(t('l.colour')) + '</span><div class="swatches" role="radiogroup" aria-labelledby="st-acc-l">' + ACCENTS.map(function (a, i) {
          return '<button type="button" role="radio" aria-checked="' + (a === acc) + '" data-acc="' + a + '" style="background:' + a + '" aria-label="' + esc(t('l.colour')) + ' ' + (i + 1) + '"></button>'; }).join('') + '</div></div>' +
        '<div class="f wide"><label for="st-notes">' + esc(t('l.notes')) + '</label><textarea id="st-notes" name="notes" rows="2" dir="auto" placeholder="' + esc(t('ph.notes')) + '">' + esc(c.notes || '') + '</textarea></div>' +
        '<div class="f wide"><label for="st-terms">' + esc(t('l.terms')) + '</label><textarea id="st-terms" name="terms" rows="3" dir="auto" placeholder="' + esc(t('ph.terms')) + '">' + esc(c.terms || '') + '</textarea><small class="hint">' + esc(t('hub.h.new')) + '</small></div>' +
      '</div></fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('hub.g.docs')) + '</legend><p class="hint">' + esc(t('hub.h.docs')) + '</p>' + DOCCARDS.map(function (g) {
        return '<h3 class="dc-sub">' + esc(t(g[0])) + '</h3><div class="dcards">' + g[1].map(function (d) {
          var rows = PREFIXES.filter(function (x) { return x[0] === d[0] && (!d[3] || x[1].indexOf(d[3]) === 0); }), c2 = S[d[0]] || {};
          return '<div class="dcard"><div class="dc-h"><b>' + esc(t(d[2])) + '</b>' + (d[1] ? '<a class="dc-open" href="' + siteUrl(d[1]) + '" target="_blank" rel="noopener">' + esc(t('hub.openmk')) + ' ›</a>' : '<span class="soft dc-app">' + esc(t('hub.inapp')) + '</span>') + '</div>' + rows.map(function (x) {
            var v = x[1] ? (c2.prefixes || {})[x[1]] : c2.prefix, id = 'st-p-' + x[0] + (x[1] ? '-' + x[1] : '');
            return '<div class="dc-row"><label for="' + id + '">' + esc(rows.length > 1 ? t(x[3]) : t('hub.pfx')) + '</label><input id="' + id + '" data-pre="' + x[0] + '|' + x[1] + '"' + (x[4] ? ' data-fix="' + x[4] + '"' : '') + ' dir="ltr" maxlength="8" autocapitalize="characters" value="' + esc(v != null ? v : x[2]) + '">' +
              '<small class="dc-next">' + esc(t('hub.nextno')) + ' <b class="mono" data-pre-pv></b></small>' + serHtml(S, x) + '</div>'; }).join('') + vtcHtml(S, d) + '</div>'; }).join('') + '</div>'; }).join('') +
      '</fieldset>' +
      '<fieldset class="card"><legend>' + esc(t('b1.g_safe')) + '</legend><div class="fg">' +
        '<div class="f"><label for="st-who">' + esc(t('b1.who')) + '</label><input id="st-who" name="who" dir="auto" maxlength="40" value="' + esc(S._who) + '"><small class="hint">' + esc(t('b1.h_who')) + '</small></div>' +
        '<div class="f"><label for="st-lock">' + esc(t('b1.lock')) + '</label><input id="st-lock" name="lockBefore" type="date" value="' + esc(S.lockBefore || '') + '"><small class="hint">' + esc(t('b1.h_lock')) + '</small></div>' +
        '<div class="f"><label class="chk"><input type="checkbox" name="allowDel"' + (S.allowDel ? ' checked' : '') + '> ' + esc(t('au.allowdel')) + '</label><small class="hint">' + esc(t('au.allowdelh')) + '</small></div>' +
      '</div></fieldset>' +
      '<div class="btns sticky-save"><button type="submit" class="btn primary">' + esc(t('hub.saveset')) + '</button><button type="button" class="btn" data-reset>' + esc(t('hub.reset')) + '</button></div></form>' + pinHtml() +
      hubExt('settings', S);
  }
  /* other files add sections to the item form and Settings: NS.hubExt.push({ form(s, r), read(s, r, f), settings(S), wireSettings(pane, S, save) }) */
  function hubExt(hook) {
    var a = [].slice.call(arguments, 1);
    return (NS.hubExt || []).map(function (x) { try { return x[hook] ? x[hook].apply(null, a) || '' : ''; } catch (e) { console.error(e); return ''; } }).join('');
  }
  function pinHtml() {
    var on = !!S._pin, mins = on ? S._pin.mins || 15 : 15;
    var pinIn = function (id, lbl) { return '<div class="f"><label for="' + id + '">' + esc(lbl) + '</label><input id="' + id + '" name="' + id + '" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" dir="ltr"></div>'; };
    return '<form class="card" data-pin novalidate><h3>' + esc(t('b1.pin_t')) + ' <span class="pill' + (on ? ' ok' : '') + '">' + esc(t(on ? 'b1.pin_on' : 'b1.pin_off')) + '</span></h3><p class="soft">' + esc(t('b1.pin_p')) + '</p><div class="fg">' +
      (on ? pinIn('pin-cur', t('b1.pin_cur')) : '') + pinIn('pin-new', t(on ? 'b1.pin_new2' : 'b1.pin_new')) + pinIn('pin-rep', t('b1.pin_rep')) +
      '<div class="f"><label for="pin-mins">' + esc(t('b1.pin_after')) + '</label><select id="pin-mins" name="pin-mins">' + [5, 15, 30, 60].map(function (m) { return '<option value="' + m + '"' + (m === mins ? ' selected' : '') + '>' + esc(t('b1.mins', { n: m })) + '</option>'; }).join('') + '</select></div>' +
      '</div><div class="btns"><button type="submit" class="btn primary">' + esc(t(on ? 'b1.pin_change' : 'b1.pin_set')) + '</button>' +
      (on ? '<button type="button" class="btn" data-pin-lock>' + esc(t('b1.pin_lock')) + '</button><button type="button" class="btn danger" data-pin-off>' + esc(t('b1.pin_rm')) + '</button>' : '') + '</div></form>';
  }
  function wirePin(pane) {
    var f = $('[data-pin]', pane); if (!f) return;
    var E = f.elements, on = !!S._pin;
    function cur() { return on ? NS.pin.check(E['pin-cur'].value) : Promise.resolve(true); }
    function done(k) { NS.toast(t(k)); show('settings'); }
    E['pin-mins'].addEventListener('change', function () { if (on) NS.pin.mins(E['pin-mins'].value).then(function () { NS.toast(t('hub.setsaved')); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = E['pin-new'].value, b = E['pin-rep'].value;
      if (!/^\d{4,8}$/.test(a)) { NS.toast(t('b1.pin_v'), 'bad'); E['pin-new'].focus(); return; }
      if (a !== b) { NS.toast(t('b1.pin_v2'), 'bad'); E['pin-rep'].focus(); return; }
      cur().then(function (ok) {
        if (!ok) { NS.toast(t('b1.pin_wrong'), 'bad'); E['pin-cur'].focus(); return; }
        return NS.pin.set(a, E['pin-mins'].value).then(function () { done('b1.pin_saved'); });
      });
    });
    var off = $('[data-pin-off]', f), lk = $('[data-pin-lock]', f);
    if (off) off.addEventListener('click', function () {
      cur().then(function (ok) { if (!ok) { NS.toast(t('b1.pin_wrong'), 'bad'); E['pin-cur'].focus(); return; } return NS.pin.remove().then(function () { done('b1.pin_gone'); }); });
    });
    if (lk) lk.addEventListener('click', function () { NS.pin.lock(); });
  }


  /* the settings page as a list of groups (Tally F12 style): one group shown at a time, the choice remembered in this browser */
  function setNav(pane) {
    var form = $('form.set', pane); if (!form || $('.set-nav', pane)) return;
    /* every part of the page: the main settings form and the forms or cards other files add (each with its own Save button).
       A group = one card; it is shown inside its own form, so that form's Save button shows with it and never on its own. */
    var host = form.parentNode, holders = [form].concat([].slice.call(host.children).filter(function (c) { return c !== form && !c.classList.contains('set-biz') && (c.tagName === 'FORM' || c.classList.contains('card') || c.tagName === 'SECTION'); }));
    var items = [], uid = 0;
    holders.forEach(function (hd) {
      var fs = [].slice.call(hd.querySelectorAll(':scope > fieldset.card'));
      (fs.length ? fs : [hd]).forEach(function (c) {
        var lg = c.querySelector(':scope > legend, :scope > h3, :scope > h2, legend, h3'), name = lg ? lg.textContent.replace(/\s+(On|Off|चालू|बंद)$/, '').trim() : 'More';
        var subs = [].slice.call(c.querySelectorAll(':scope > h3.dc-sub')).filter(function (h) { return h.nextElementSibling && h.nextElementSibling.classList.contains('dcards'); });
        if (subs.length > 1) subs.forEach(function (h) { items.push({ id: 'g' + (uid++), card: c, hold: hd, sub: h, name: h.textContent.trim(), head: name }); });
        else items.push({ id: 'g' + (uid++), card: c, hold: hd, name: name });
      });
    });
    if (items.length < 3) return;
    var nav = NS.el('nav', { 'class': 'set-nav', 'aria-label': 'Settings' }), last = '';
    nav.innerHTML = items.map(function (x) { var h = x.head && x.head !== last ? '<p class="set-nh">' + esc(x.head) + '</p>' : ''; last = x.head || ''; return h + '<button type="button" class="set-ni' + (x.head ? ' sub' : '') + '" data-setgo="' + x.id + '">' + esc(x.name) + '</button>'; }).join('');
    var wrap = NS.el('div', { 'class': 'set-wrap' }), body = NS.el('div', { 'class': 'set-body' });
    host.insertBefore(wrap, form); wrap.appendChild(nav); wrap.appendChild(body);
    holders.forEach(function (hd) { body.appendChild(hd); });
    var save = $('.sticky-save', form);
    function pick(id) {
      var x = items.filter(function (y) { return y.id === id; })[0] || items[0];
      holders.forEach(function (hd) { hd.hidden = hd !== x.hold; });
      [].slice.call(x.hold.querySelectorAll(':scope > fieldset.card')).forEach(function (c) { c.hidden = c !== x.card; });
      [].slice.call(x.card.children).forEach(function (e) {
        var isSub = e.tagName === 'H3' && e.classList.contains('dc-sub');
        if (isSub || e.classList.contains('dcards')) e.hidden = x.sub ? !(isSub ? e === x.sub : e.previousElementSibling === x.sub) : false;
      });
      if (save) save.hidden = x.hold !== form;
      [].slice.call(nav.querySelectorAll('[data-setgo]')).forEach(function (b) { var me = b.getAttribute('data-setgo') === x.id; b.classList.toggle('on', me); if (me) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      try { localStorage.setItem('ns-setpick', x.name); } catch (e) {}
    }
    /* like a desktop settings window: the list and the chosen group each scroll by themselves and fill the window, so a group
       always opens from its first line and the page does not move (owner 20 Nov: groups opened cut off or out of view) */
    function fit() {
      if (innerWidth <= 760) { wrap.style.height = ''; wrap.classList.remove('set-win'); return; }
      var hp = $('.hub-pick', document), off = hp && /sticky|fixed/.test(getComputedStyle(hp).position) ? hp.getBoundingClientRect().height + 10 : 10;
      wrap.classList.add('set-win'); wrap.style.scrollMarginTop = off + 'px'; wrap.style.height = Math.max(360, innerHeight - off - 12) + 'px';
    }
    function show() { fit(); body.scrollTop = 0; if (innerWidth > 760) wrap.scrollIntoView({ block: 'start' }); else body.scrollIntoView({ behavior: 'smooth', block: 'start' }); }   /* phone test 21 Nov: on a phone the chosen group opens below the list; bring it into view */
    window.addEventListener('resize', fit);
    nav.addEventListener('click', function (e) { var b = e.target.closest('[data-setgo]'); if (!b) return; pick(b.getAttribute('data-setgo')); show(); });
    var k = ''; try { k = localStorage.getItem('ns-setpick') || ''; } catch (e) {}
    pick((items.filter(function (y) { return y.name === k; })[0] || items[0]).id); fit();
    var on = $('.set-ni.on', nav); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function wireSettings(pane) {
    var sb = $('[data-setbiz]', pane);
    var setDirty = false; pane.addEventListener('input', function (e) { if (e.target !== sb) setDirty = true; }); pane.addEventListener('submit', function () { setDirty = false; }, true); pane.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button[type=submit],[data-save]')) setTimeout(function () { setDirty = false; }, 0); });
    if (sb) sb.addEventListener('change', function () { var prev = SB, go = function () { SB = sb.value; show('settings'); }; if (!setDirty) return go(); NS.ask(t('pb.unsaved')).then(function (y) { if (y) go(); else sb.value = prev; }); });   /* settings of another business; unsaved changes ask first (F7-5) */
    hubExt('wireSettings', pane, S, saveSettings);
    var f = $('[data-set]', pane), acc = (S.invoice && S.invoice.accent) || ACCENTS[0];
    function pv() {
      var fy = NS.fy(NS.today()), short = fy.slice(2, 4) + '-' + fy.slice(5), pre = f.elements.prefix.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, '');
      f.elements.prefix.value = pre;
      var ix = readSx($('[data-ser="invoice"]', f)), isfx = String(ix.suffix || '').toUpperCase().replace(/[^A-Z0-9\/\-]/g, '');
      $('[data-no-pv]', f).textContent = ix.method === 'manual' ? t('ms.vt_manual') : (pre ? pre + '/' : '') + (f.elements.fy.checked ? short + '/' : '') + (ix.restart === 'month' ? NS.today().slice(5, 7) + '/' : '') + String(Math.max(1, +ix.start || 1)).padStart(+f.elements.digits.value, '0') + isfx;
      $$('[data-pre]', f).forEach(function (inp) {
        var p2 = inp.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), fix = +inp.getAttribute('data-fix'), sb = $('[data-ser]', inp.parentNode), x = sb ? readSx(sb) : {};
        var w = +x.width || fix || +f.elements.digits.value, sfx = String(x.suffix || '').toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), withFy = sb ? x.fy : (fix || f.elements.fy.checked);
        $('[data-pre-pv]', inp.parentNode).textContent = x.method === 'manual' ? t('ms.vt_manual') : (p2 ? p2 + '/' : '') + (withFy ? short + '/' : '') + (x.restart === 'month' ? NS.today().slice(5, 7) + '/' : '') + String(Math.max(1, +x.start || 1)).padStart(w, '0') + sfx;
      });
    }
    $$('[data-pre]', f).forEach(function (inp) { inp.addEventListener('input', pv); });
    $$('[data-ser] [data-sx]', f).forEach(function (e) { e.addEventListener('input', pv); e.addEventListener('change', pv); });
    ['prefix', 'digits', 'fy'].forEach(function (n) { f.elements[n].addEventListener('input', pv); f.elements[n].addEventListener('change', pv); });
    pv();
    $$('[data-acc]', f).forEach(function (b) {
      b.addEventListener('click', function () { acc = b.getAttribute('data-acc'); $$('[data-acc]', f).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var E = f.elements;
      S.defBiz = E.defBiz.value || '';
      S.remindDays = +E.remindDays.value;
      /* moving the lock earlier or clearing it opens old entries: PIN (when set) and a reason, logged (A-4, C-18) */
      var oldLk = S.lockBefore || '', newLk = E.lockBefore.value || '', earlier = oldLk && (!newLk || newLk < oldLk);
      if (newLk !== oldLk && !earlier && !NS.okSync(newLk ? t('b1.lockc', { d: NS.fmtDate(newLk) }) : t('b1.unlockc'))) return;
      (earlier || !!S.allowDel !== !!(E.allowDel && E.allowDel.checked) && E.allowDel.checked ? NS.guard({ title: t(earlier ? 'au.lockt' : 'au.allowdel'), msg: earlier ? t('au.lockp') : t('au.allowdelh'), why: 'need' }) : Promise.resolve({ why: '' })).then(function (g) { saveSet(E, g.why); }, function () {});
    });
    function saveSet(E, why) {
      S.lockBefore = E.lockBefore.value || '';
      S.allowDel = !!(E.allowDel && E.allowDel.checked);
      NSStore.meta('who', E.who.value.trim());
      S.invoice = { prefix: E.prefix.value.trim(), digits: +E.digits.value, fy: E.fy.checked, kind: E.kind.value, gst: +E.gst.value, unit: E.unit.value.trim() || 'Nos',
        round: E.round.checked, accent: acc, notes: E.notes.value.trim(), terms: E.terms.value.trim() };
      $$('[data-pre]', f).forEach(function (inp) {
        var k = inp.getAttribute('data-pre').split('|'), v = inp.value.trim().toUpperCase().replace(/[^A-Z0-9\/\-]/g, ''), c2 = S[k[0]] = S[k[0]] || {};
        if (k[1]) { c2.prefixes = c2.prefixes || {}; c2.prefixes[k[1]] = v; } else c2.prefix = v;
      });
      /* numbering of each series and printing of each card (A-6, C-11) */
      S.series = S.series || {}; S.vt = S.vt || {};
      $$('[data-ser]', f).forEach(function (b) {
        var k = b.getAttribute('data-ser'), x = k === 'invoice' ? INVX : PREFIXES.filter(function (p) { return serKey(p) === k; })[0]; if (!x) return;
        var r = readSx(b), d00 = serDef(S, x); if (r.width == null) r.width = d00.width; if (r.fy == null) r.fy = d00.fy;
        var nx = { method: r.method, suffix: String(r.suffix || '').toUpperCase().replace(/[^A-Z0-9\/\-]/g, '').slice(0, 6), fy: !!r.fy, width: +r.width, start: Math.max(1, Math.floor(+r.start || 1)), restart: r.restart, dup: r.dup };
        var d0 = serDef(S, x), o = {}; Object.keys(nx).forEach(function (q) { if (nx[q] !== d0[q]) o[q] = nx[q]; });
        if (Object.keys(o).length) S.series[k] = o; else delete S.series[k];
      });
      $$('[data-vtc]', f).forEach(function (b) {
        var k = b.getAttribute('data-vtc'), r = readSx(b), o = {}, old = (S.vt || {})[k] || {};
        Object.keys(old).forEach(function (q) { if (!(q in r)) o[q] = old[q]; });
        if (r.copies) o.copies = +r.copies; ['paper', 'design', 'notes', 'terms'].forEach(function (q) { if (r[q]) o[q] = r[q]; }); if (r.printAfter) o.printAfter = true; if (r.shareAfter) o.shareAfter = true;
        if (Object.keys(o).length) S.vt[k] = o; else delete S.vt[k];
      });
      saveSettings(why).then(function () { NS.toast(t('hub.setsaved')); counts(); });
    }
    $('[data-reset]', f).addEventListener('click', function () {
      if (!NS.okSync(t('hub.c.reset'))) return;
      delete S.invoice; PREFIXES.forEach(function (x) { delete S[x[0]]; }); delete S.series; delete S.vt; S.remindDays = 7;
      saveSettings().then(function () { NS.toast(t('hub.setsaved')); show('settings'); });
    });
  }

  /* ---------- backup and devices ---------- */
  function backupHtml() {
    return '<h2>' + esc(t('hub.backup')) + '</h2><p class="soft">' + esc(t('hub.p.backup')) + '</p>' +
      '<div class="card"><p>' + esc(t('md.last')) + ' <b>' + (S._last ? esc(NS.fmtDate(new Date(S._last - new Date(S._last).getTimezoneOffset() * 6e4).toISOString().slice(0, 10)) + ', ' + new Date(S._last).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })) : esc(t('md.never'))) + '</b></p>' +
      '<div class="btns"><button type="button" class="btn primary" data-act="backup">' + esc(t('md.save')) + '</button>' +
      '<label class="btn"><span>' + esc(t('md.restore')) + '</span><input type="file" accept=".json,application/json" data-act="restore" hidden></label>' +
      '<button type="button" class="btn" data-act="my-data" data-tab="af">' + esc(t('my.auto')) + '</button></div>' +
      '<p class="soft" data-store-info></p><p class="soft">' + t('hub.move', { link: '<a href="' + BILLING + 'move-data/" target="_blank" rel="noopener">' + esc(t('nav.move')) + '</a>' }) + '</p></div>' +
      '<div data-backup-ext></div>' +
      '<div class="card danger-zone"><h3>' + esc(t('my.wipe.t')) + '</h3><p class="soft">' + esc(t('my.wipe.p')) + '</p>' +
      '<button type="button" class="btn danger" data-wipe>' + esc(t('my.wipe.b')) + '</button></div>';
  }
  function wireBackup(pane) {
    NSStore.estimate().then(function (e) {
      if (e && e.usage != null) $('[data-store-info]', pane).textContent = t('hub.used', { mb: (e.usage / 1048576).toFixed(1) });
    }).catch(function () {});
    (NS.hubBackupExt || []).forEach(function (f) { try { f(pane); } catch (e) {} });   /* locked backup, Drive sync, send to accountant (safe.js) */
    $('[data-wipe]', pane).addEventListener('click', function () {
      if (!NS.okSync(t('my.wipe.c1'))) return;
      if (prompt(t('my.wipe.c2')) !== 'DELETE') return;
      /* PIN when set, a reason; the edit history and earlier versions stay (A-1, C-18) */
      NS.guard({ title: t('au.wipet'), msg: t('au.wipep'), why: 'ask', danger: 1 }).then(function (g) { return NSStore.wipe(g.why); })
        .then(function () { NS.toast(t('my.wiped')); show('backup'); }, function (err) { if (!err.quiet) NS.toast(err.message, 'bad'); });
    });
  }

  /* ---------- CSV import / export ---------- */
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function download(name, text) {
    var a = NS.el('a', { href: URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function exportCsv(s, blankOnly) {
    if (s === 'doc') {
      var hd = ['Type', 'Number', 'Date', 'Customer', 'Customer GSTIN', 'Business', 'Total', 'Status'];
      var rows = cache.doc.slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }).map(function (d) {
        return [d.type, d.no, d.date, d.buyer && d.buyer.name, d.buyer && d.buyer.gstin, d.seller && d.seller.name, NS.r2(d.total || 0), d.type === 'quote' ? { open: 'Waiting for reply', acc: 'Accepted', dec: 'Not accepted', inv: 'Invoice made' }[d.status] || '' : d.status === 'paid' ? 'Paid' : 'Not paid'];
      });
      return download('documents-' + NS.today() + '.csv', [hd].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'));
    }
    var cols = csvCols(s), lines = [cols.map(function (c) { return c[1]; })];
    if (blankOnly) lines.push(cols.map(function (c) { return { role: 'customer', kind: 'goods', unit: 'Nos', gst: '18', state: '03' }[c[0]] || ''; }));
    else cache[s].forEach(function (r) { lines.push(cols.map(function (c) { return csvGet(s, r, c[0]); })); });
    download((blankOnly ? 'template-' : '') + { biz: 'businesses', party: 'customers-suppliers', item: 'items-services' }[s] + (blankOnly ? '' : '-' + NS.today()) + '.csv', lines.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'));
  }
  /* group columns hold the group's name (built-ins in English, so the file reads back in any language) */
  /* the party / item custom fields as extra columns named by their label (ERP Round 2, cfields.js) */
  function csvCols(s) { return CSV[s].concat(window.NSCF && (s === 'party' || s === 'item') ? NSCF.defs(NSCF.list(), s, 'head', '', true).map(function (f) { return ['cf.' + f.id, f.label]; }) : []); }
  function csvGet(s, r, k) {
    if (k.indexOf('cf.') === 0 && window.NSCF) { var cfd = NSCF.get(k.slice(3)); return cfd ? NSCF.fmt(cfd, r.cf && r.cf[cfd.id]) : ''; }
    if (s === 'party' && k === 'group') { var pg = NS.partyGroup(r, G); return pg.id === 'debtors' ? 'Customers' : pg.id === 'creditors' ? 'Suppliers' : pg.name; }
    if (s === 'item' && k === 'cat') return NS.itemGroup(r, G).name || r.cat || '';
    return get(r, k);
  }
  function parseCsv(txt) {
    txt = txt.replace(/^﻿/, '');
    var rows = [], row = [], cell = '', inq = false, i, c;
    var sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (i = 0; i < txt.length; i++) {
      c = txt[i];
      if (inq) { if (c === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else inq = false; } else cell += c; }
      else if (c === '"') inq = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  }
  function stateCode(v) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^\d{1,2}$/.test(v)) { v = v.padStart(2, '0'); return NS.stateName(v) ? v : ''; }
    var hit = NS.STATES.filter(function (s) { return key(s[1]) === key(v); })[0];
    return hit ? hit[0] : '';
  }
  function importCsv(s, file) {
    file.text().then(function (txt) {
      var rows = parseCsv(txt);
      if (rows.length < 2) throw new Error(t('hub.imp.empty'));
      var cols = csvCols(s), head = rows[0].map(function (h) { return key(h).replace(/[^a-z0-9%]/g, ''); });
      var idx = cols.map(function (c) { var n = key(c[1]).replace(/[^a-z0-9%]/g, ''), alt = key(c[0]).replace(/[^a-z0-9]/g, ''); var i = head.indexOf(n); if (i < 0) i = head.indexOf(alt); if (i < 0 && c[0] === 'cat') i = head.indexOf('category'); return i; });
      var nameCol = cols.map(function (c) { return c[0]; }).indexOf(NAMEKEY[s]);
      if (idx[nameCol] < 0) throw new Error(t('hub.imp.nohead', { col: cols[nameCol][1] }));
      var byName = {}; cache[s].forEach(function (r) { byName[key(r[NAMEKEY[s]])] = r; });
      var add = 0, upd = 0, bad = [], puts = [], made = [];
      rows.slice(1).forEach(function (cells, n) {
        var r = {}, line = n + 2;
        cols.forEach(function (c, j) { if (idx[j] >= 0 && cells[idx[j]] != null && String(cells[idx[j]]).trim() !== '') set(r, c[0], String(cells[idx[j]]).trim()); });
        var nm = key(r[NAMEKEY[s]]); if (!nm) return;
        if (r.state) r.state = stateCode(r.state);
        if (r.ship && r.ship.state) r.ship.state = stateCode(r.ship.state);
        if (r.gstin) { r.gstin = r.gstin.toUpperCase().replace(/\s/g, ''); var g = NS.gstinCheck(r.gstin); if (!g.ok) { bad.push(line); return; } if (!r.state && g.state) r.state = g.state; }
        if (r.role) r.role = /supp/i.test(r.role) ? (/both|cust/i.test(r.role) ? 'both' : 'supplier') : /both/i.test(r.role) ? 'both' : 'customer';
        if (r.kind) r.kind = /serv/i.test(r.kind) ? 'service' : 'goods';
        Object.keys(NUMS).forEach(function (k) { if (r[k] != null) r[k] = NS.num(r[k]); });
        if (r.int && r.int.rate != null) r.int.rate = NS.num(r.int.rate);
        if (r.track && ['batch', 'serial', 'both'].indexOf(String(r.track).toLowerCase()) < 0) delete r.track; else if (r.track) r.track = String(r.track).toLowerCase();
        if (r.src && ['made', 'bought', 'both'].indexOf(String(r.src).toLowerCase()) < 0) delete r.src; else if (r.src) r.src = String(r.src).toLowerCase();
        if (r.reg && ['regular', 'comp', 'unreg', 'sez', 'uin', 'overseas', 'eco'].indexOf(String(r.reg).toLowerCase()) < 0) delete r.reg; else if (r.reg) r.reg = String(r.reg).toLowerCase();
        if (r.bankIfsc) { r.bankIfsc = String(r.bankIfsc).toUpperCase().replace(/\s/g, ''); if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(r.bankIfsc)) delete r.bankIfsc; }
        if (r.pan) { r.pan = String(r.pan).toUpperCase().replace(/\s/g, ''); if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(r.pan)) delete r.pan; }
        if (r.ptype) r.ptype = /whole/i.test(r.ptype) ? 'wholesale' : 'retail';
        if (r.msme) { var mz = String(r.msme).toLowerCase().trim(); if (['micro', 'small', 'medium', 'other'].indexOf(mz) >= 0) r.msme = mz; else delete r.msme; }
        if (r.udyam) { var uz = udyamFmt(r.udyam); if (uz) r.udyam = uz; else delete r.udyam; }
        if (r.agdays !== undefined && r.agdays !== '') r.agdays = Math.max(0, Math.min(45, Math.floor(+r.agdays || 0))); else delete r.agdays;
        if (r.gst != null) r.gst = NS.num(String(r.gst).replace('%', ''));
        if (r.cf && window.NSCF) { var cf0 = r.cf; r.cf = {}; Object.keys(cf0).forEach(function (id) { var cfd = NSCF.get(id); if (cfd) NSCF.setCf(r, cfd, cf0[id]); }); if (!r.cf || !Object.keys(r.cf).length) delete r.cf; }   /* custom field columns, typed values */
        var have = byName[nm];
        if (s === 'party' && r.group) {
          var role = r.role || (have && have.role) || 'customer';
          r.group = gFromCsv('party', r.group, role, made);
          if (r.group === (role === 'supplier' ? 'creditors' : 'debtors')) { r.group = ''; if (have) delete have.group; delete r.group; }
        }
        if (s === 'item' && r.cat) { r.group = gFromCsv('item', r.cat, '', made); r.cat = gList('item').concat(made).filter(function (g) { return g.id === r.group; })[0].name; }
        if (have) { Object.keys(r).forEach(function (k) { if (k === 'ship' || k === 'cf') have[k] = Object.assign(have[k] || {}, r[k]); else have[k] = r[k]; }); puts.push(have); upd++; }
        else { if (s === 'party' && !r.role) r.role = 'customer'; if (s === 'item' && !r.kind) r.kind = 'goods'; byName[nm] = r; puts.push(r); add++; }
      });
      /* say what will happen before anything is saved, like the Excel import does (round C) */
      var q = t('hub.imp.ask', { a: add, u: upd }) + (bad.length ? ' ' + t('hub.imp.bad', { rows: bad.slice(0, 8).join(', ') + (bad.length > 8 ? '…' : '') }) : '');   /* F7-6 */
      return (NS.ask ? NS.ask(q) : Promise.resolve(confirm(q))).then(function (ok) {
        if (!ok) { load(); return show(s); }
        var gp = made.length ? editGroups(function (m) { made.forEach(function (g) { m[s].push(g); }); }) : Promise.resolve();
        return gp.then(function () { return NS.eachSeq(puts, function (r) { return NSStore.put(s, r); }, {}); }).then(function () {
          NS.toast(t('hub.imp.done', { a: add, u: upd }) + (bad.length ? ' ' + t('hub.imp.bad', { rows: bad.slice(0, 8).join(', ') + (bad.length > 8 ? '…' : '') }) : ''), bad.length ? 'bad' : '');
          return show(s);
        });
      });
    }).catch(function (e) { NS.toast(e.message || t('bk.unread'), 'bad'); });
  }

  /* the Excel import (xlimport.js) reads the same columns */
  NS.hubCsv = { cols: CSV, stateCode: stateCode };

  /* ---------- start ---------- */
  var routed = false;   /* true once the address (#biz, #item, #settings/gd...) has been opened */
  function init() {
    if (!$('#my-app')) return;
    /* #biz/new (App "Add my business") opens the section with its add form */
    function go(h) {
      var m = /^(\w+)\/new$/.exec(h || '');
      if (m && SECS.indexOf(m[1]) >= 0) return show(m[1]).then(function () { history.replaceState(null, '', '#' + m[1]); openForm(m[1]); });
      /* #settings/gd: the section, scrolled to that part (godown names, salesmen) with the cursor in it */
      var a = /^(\w+)\/([\w-]+)$/.exec(h || '');
      if (a && SECS.indexOf(a[1]) >= 0) return show(a[1]).then(function () { history.replaceState(null, '', '#' + a[1]); setTimeout(function () { var el = document.getElementById('set-' + a[2]); if (!el) return; el.scrollIntoView({ block: 'start' }); var i = el.querySelector('textarea,input,select'); if (i) i.focus({ preventScroll: true }); }, 60); });
      return show(h || 'home');
    }
    NSStore.ready().then(function () { routed = true; return go(location.hash.slice(1)); });
    $$('[data-sec]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); show(b.getAttribute('data-sec'), true); });
    });
    window.addEventListener('hashchange', function () { var h = location.hash.slice(1) || 'home'; if (h !== cur) go(h); });
    var pane = $('[data-pane]');
    pane.addEventListener('click', function (e) {
      var ge = e.target.closest('[data-go]'); if (ge) { e.preventDefault(); goEntry(ge.getAttribute('data-sec'), ge.getAttribute('data-sub')); return; }
      var a = e.target.closest('a[href^="#"]');
      if (a && SECS.indexOf(a.getAttribute('href').slice(1)) >= 0) { e.preventDefault(); show(a.getAttribute('href').slice(1), true); return; }
      if (e.target.closest('[data-add]')) return openForm(cur);
      if (e.target.closest('[data-exp]')) return exportCsv(cur);
      if (e.target.closest('[data-tpl]')) return exportCsv(cur, true);
      if (e.target.closest('[data-xlimp]')) return NS.xlImport && NS.xlImport.open();
      if (e.target.closest('[data-swimp]')) return NS.swImport && NS.swImport.open();
      if (e.target.closest('[data-xl]')) return excel(cur);
      if (e.target.closest('[data-xllog]')) return NS.xlsx('edit-history-' + NS.today() + '.xlsx', [NS.reports.log(cache.log)]);
      if (e.target.closest('[data-binempty]')) {   /* PIN when set, logged (C-18) */
        if (NS.okSync(t('b1.binemptyc'))) NS.guard({ title: t('au.bint'), msg: t('au.binp'), why: 'ask', danger: 1 }).then(function (g) {
          var n = cache.bin.length;
          return Promise.all(cache.bin.map(function (b) { return NSStore.del('bin', b.id); })).then(function () { return NSStore.note('binempty', { n: n, why: g.why || undefined }); });
        }).then(function () { show('bin'); }, function () {});
        return;
      }
      if (e.target.closest('[data-gadd]')) return groupForm(GSEC[cur]);
      var gl = e.target.closest('li[data-gid]');
      if (gl) {
        var gid = gl.getAttribute('data-gid');
        if (e.target.closest('[data-gedit]')) groupForm(GSEC[cur], gid);
        else if (e.target.closest('[data-gmerge]')) mergeForm(GSEC[cur], gid);
        else if (e.target.closest('[data-gdel]')) delGroup(GSEC[cur], gid);
        return;
      }
      var li = e.target.closest('li[data-id]'); if (!li) return;
      var id = li.getAttribute('data-id');
      if (e.target.closest('[data-edit]')) openForm(cur, id);
      else if (e.target.closest('[data-def]')) { S.defBiz = id; saveSettings().then(function () { NS.toast(t('hub.setsaved')); show('biz'); }); }
      else if (e.target.closest('[data-log]')) NS.showLog(id, t('b1.changesof', { no: $('.ttl', li).textContent }));
      else if (e.target.closest('[data-restore]')) {
        /* F4-12: a deleted bill whose number has since been given to another bill of the same series and year is not brought back as a second copy */
        var bn = cache.bin.filter(function (x) { return x.id === id; })[0], rr = bn && bn.store === 'doc' && bn.rec, lk = function (v) { return String(v || '').trim().toLowerCase(); };
        var clash = rr && rr.no && cache.doc.filter(function (x) { return x.id !== rr.id && (x.type || 'invoice') === (rr.type || 'invoice') && lk(x.no) === lk(rr.no) && NS.fy(x.date) === NS.fy(rr.date) && lk(x.seller && x.seller.name) === lk(rr.seller && rr.seller.name); })[0];
        if (clash) { NS.toast(t('b1.resdup', { no: rr.no }), 'bad'); return; }
        NSStore.restore(id).then(function () { NS.toast(t('b1.restored')); show('bin'); }, function (err) { NS.toast(err.message, 'bad'); });
      }
      else if (e.target.closest('[data-del]')) {
        /* a party with saved documents says so before it goes (round C); the site's own box, not the browser's confirm() */
        var nm = $('.ttl', li).textContent, kk = String(nm || '').trim().toLowerCase(), nd = cur === 'party' ? (cache.doc || []).filter(function (d) { return String((d.buyer || {}).name || '').trim().toLowerCase() === kk; }).length : 0;
        if (cur === 'item') nd = (cache.doc || []).filter(function (d) { return (d.items || []).concat(d.lines || []).some(function (l) { return l && String(l.desc || '').trim().toLowerCase() === kk; }); }).length;
        if (nd && (cur === 'party' || cur === 'item')) { NS.toast(t('ms.inuse', { n: nd }), 'bad'); return; }   /* used in vouchers: alter it, never delete (as in an accounting program) */
        var msg = nd ? t('b1.cdelp', { x: nm, n: nd }) : t('b1.cdel', { x: nm });
        (NS.ask ? NS.ask(msg, { danger: true }) : Promise.resolve(confirm(msg))).then(function (ok) {
          if (!ok) return;
          NSStore.del(cur, id).then(function () {
            if (cur === 'biz' && S.defBiz === id) { S.defBiz = ''; return saveSettings(); }
          }).then(function () { NS.toast(t('b1.binned')); show(cur); }, function (err) { NS.toast(err.message, 'bad'); });
        });
      }
    });
    pane.addEventListener('input', function (e) { if (e.target.id === 'my-q') { q = e.target.value.trim().toLowerCase(); renderList(); } });
    pane.addEventListener('change', function (e) { if (e.target.id === 'my-gf') { gf = e.target.value; renderList(); return; } if (e.target.hasAttribute('data-imp') && e.target.files[0]) { importCsv(cur, e.target.files[0]); e.target.value = ''; } });
    NS.onRestore = function () { show(cur); };
    document.addEventListener('ns-data', function () { if (routed) show(cur); });
    document.addEventListener('ns-lang', function () { if (routed) show(cur); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubusers.js */
try{/* My data › Settings › Users and logins (owner 20 Nov 2026, SQLite Stage 2), through NS.hubExt (my.js).
   Off: the owner turns logins on (name + password; the data files get locked with a key only passwords open) and prints the
   recovery code. On: the owner (or a user with the Users right) adds users, gives each a role, switches users off, resets
   passwords and makes own roles; every user changes their own password; the idle lock time is set per computer.
   Words: 'us.*' (My data is a site of its own, so they are in every language; Release B, 21 Nov 2026). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, T = function (k, o) { return NS.t('us.' + k, o); };
  var AREAS = ['sales', 'purchase', 'money', 'stock', 'masters', 'reports', 'gst', 'settings', 'users'];
  var ACTS = ['view', 'add', 'edit', 'del', 'print', 'export'];
  var FIXED = { owner: 1, accountant: 1, billing: 1, store: 1, viewer: 1 };
  function areaName(a) { return T('a_' + a); }
  function actName(a) { return T('x_' + a); }
  function roleName(r) { return r && FIXED[r.id] ? T('r_' + r.id) : (r && r.name || ''); }
  function settings() { return '<fieldset class="card us-set" data-usset><legend>' + esc(T('title')) + '</legend><div data-usbox><p class="soft">…</p></div></fieldset>'; }
  function say(pane, t, bad) { var m = $('[data-usmsg]', pane); if (m) { m.textContent = t; m.className = bad ? 'bad' : 'soft'; } }
  function err(e) { return NS.login && NS.login.word ? NS.login.word(e) : String(e && e.message || e || '').replace(/^NSAUTH: /, ''); }
  function offHtml(st) {
    if (st.sqlite === false) return '<p class="soft">' + esc(T('nostore')) + '</p>';
    return '<p>' + esc(T('offp')) + '</p>' +
      '<form data-usup class="grid2"><label>' + esc(T('oname')) + ' <input name="n" required autocomplete="username"></label><span></span>' +
      '<label>' + esc(T('opw')) + ' <input name="p" type="password" required minlength="6" autocomplete="new-password"></label>' +
      '<label>' + esc(T('pw2')) + ' <input name="p2" type="password" required minlength="6" autocomplete="new-password"></label>' +
      '<label class="full"><input type="checkbox" name="enc" checked> ' + esc(T('enc')) + '</label>' +
      '<p class="full warn"><b>' + esc(T('imp')) + '</b> ' + esc(T('impp')) + '</p>' +
      '<p class="full"><button class="btn primary" type="submit">' + esc(T('turnon')) + '</button> <span data-usmsg class="soft"></span></p></form>';
  }
  function roleSel(roles, cur) { return roles.filter(function (r) { return r.id !== 'owner'; }).map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === cur ? ' selected' : '') + '>' + esc(roleName(r)) + '</option>'; }).join(''); }
  function grid(r, edit) {
    return '<div class="tbl-wrap"><table class="tbl us-grid"><thead><tr><th class="l">' + esc(T('area')) + '</th>' + ACTS.map(function (a) { return '<th>' + esc(actName(a)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      AREAS.map(function (ar) {
        return '<tr><th scope="row" class="l">' + esc(areaName(ar)) + '</th>' + ACTS.map(function (a) {
          var on = r.rights && r.rights[ar] && r.rights[ar][a];
          return '<td>' + (edit ? '<input type="checkbox" data-rg="' + ar + '.' + a + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(areaName(ar) + ' ' + actName(a)) + '">' : on ? '✓' : '·') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function onHtml(st, users) {
    var me = st.me || {}, canU = me.rights && me.rights.users && me.rights.users.edit, roles = st.roles || [];
    var h = '<p>' + esc(T(st.cipher ? 'onlocked' : 'on')) + ' ' + esc(T('youare', { name: me.name, role: roleName({ id: me.role, name: me.roleName }) || me.role })) +
      ' <button type="button" class="btn sm" data-uslogout>' + esc(T('logout')) + '</button> <button type="button" class="btn sm" data-usswitch>' + esc(T('switch')) + '</button></p>';
    if (canU) {
      h += '<h3>' + esc(T('users')) + '</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th class="l">' + esc(T('name')) + '</th><th class="l">' + esc(T('role')) + '</th><th>' + esc(T('canlog')) + '</th><th></th></tr></thead><tbody>' +
        users.map(function (u) {
          return '<tr data-uid="' + esc(u.id) + '"><th scope="row" class="l">' + esc(u.name) + '</th><td class="l">' + (u.role === 'owner' ? esc(T('r_owner')) : '<select data-usrole>' + roleSel(roles, u.role) + '</select>') + '</td>' +
            '<td>' + (u.role === 'owner' ? '✓' : '<input type="checkbox" data-usact' + (u.active ? ' checked' : '') + ' aria-label="' + esc(T('canlogof', { name: u.name })) + '">') + '</td>' +
            '<td><button type="button" class="btn sm" data-uspw>' + esc(T('newpw')) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<form data-usadd class="grid2" style="margin-top:10px"><label>' + esc(T('nuname')) + ' <input name="n" required autocomplete="off"></label><label>' + esc(T('role')) + ' <select name="r">' + roleSel(roles, 'billing') + '</select></label>' +
        '<label>' + esc(T('pw')) + ' <input name="p" type="password" required minlength="6" autocomplete="new-password"></label><p><button class="btn" type="submit">' + esc(T('add')) + '</button></p></form>' +
        '<h3>' + esc(T('roles')) + '</h3><p class="soft">' + esc(T('rolesp')) + '</p>' +
        '<label>' + esc(T('role')) + ' <select data-usrview>' + roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(roleName(r)) + '</option>'; }).join('') + '</select></label>' +
        '<div data-usgrid>' + grid(roles[0], false) + '</div>' +
        '<form data-usnewrole class="grid2" style="margin-top:10px"><label>' + esc(T('nrname')) + ' <input name="n" required></label><label>' + esc(T('copyof')) + ' <select name="from">' + roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(roleName(r)) + '</option>'; }).join('') + '</select></label>' +
        '<label>' + esc(T('backdays')) + ' <input name="bd" type="number" min="0" value="3"></label><label>' + esc(T('maxdisc')) + ' <input name="md" type="number" min="0" value="0"></label>' +
        '<label class="full"><input type="checkbox" name="cost"> ' + esc(T('seecost')) + '</label><div class="full" data-usnewgrid></div><p><button class="btn" type="submit">' + esc(T('saverole')) + '</button></p></form>';
    }
    if (me.role === 'owner') h += '<h3>' + esc(T('lo_t')) + '</h3><p class="soft">' + esc(T('lo_p')) + '</p><form data-usoff class="grid2"><label>' + esc(T('lo_pw')) + ' <input name="p" type="password" required autocomplete="current-password"></label><p><button class="btn danger" type="submit">' + esc(T('lo_t')) + '</button></p></form>';
    h += '<h3>' + esc(T('mypw')) + '</h3><form data-usmypw class="grid2"><label>' + esc(T('oldpw')) + ' <input name="o" type="password" required autocomplete="current-password"></label><label>' + esc(T('newpw2')) + ' <input name="p" type="password" required minlength="6" autocomplete="new-password"></label><p><button class="btn" type="submit">' + esc(T('changemy')) + '</button></p></form>' +
      '<p><label>' + esc(T('idle1')) + ' <input type="number" min="1" max="240" value="' + (localStorage.getItem('nsbiz-idle') || 15) + '" data-usidle style="width:5em"> ' + esc(T('idle2')) + '</label></p>';
    return h + '<p data-usmsg class="soft"></p>';
  }
  function draw(pane) {
    var box = $('[data-usbox]', pane); if (!box) return;
    NSStore.auth('authStatus').then(function (st) {
      if (!st.on) { box.innerHTML = offHtml(st); wireOff(pane); return; }
      var me = st.me || {};
      (me.rights && me.rights.users && me.rights.users.edit ? NSStore.auth('users') : Promise.resolve([])).then(function (users) { box.innerHTML = onHtml(st, users); wireOn(pane, st); });
    }, function (e) { box.innerHTML = '<p class="bad">' + esc(err(e)) + '</p>'; });
  }
  function wireOff(pane) {
    var f = $('[data-usup]', pane); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.p.value !== f.p2.value) return say(pane, T('notsame'), true);
      say(pane, T('turning'));
      NSStore.auth('setupOwner', { name: f.n.value, pw: f.p.value, encrypt: f.enc.checked }).then(function (r) {
        var box = $('[data-usbox]', pane);
        box.innerHTML = '<div class="us-rc"><p><b>' + esc(T('nowon')) + '</b> ' + esc(T('keeprc')) + '</p>' +
          '<p class="us-code" dir="ltr">' + esc(r.recovery) + '</p><p><button class="btn" type="button" data-usprint>' + esc(T('print')) + '</button> <button class="btn primary" type="button" data-usdone>' + esc(T('kept')) + '</button></p></div>';
        $('[data-usprint]', box).addEventListener('click', function () { window.print(); });
        $('[data-usdone]', box).addEventListener('click', function () { location.reload(); });
      }, function (er) { say(pane, err(er), true); });
    });
  }
  function wireOn(pane, st) {
    var q = function (s) { return $(s, pane); }, roles = st.roles || [];
    var lo = q('[data-uslogout]'); if (lo) lo.addEventListener('click', function () { NS.login ? NS.login.logout() : NSStore.auth('logout').then(function () { location.reload(); }); });
    var sw = q('[data-usswitch]'); if (sw) sw.addEventListener('click', function () { if (NS.login) NS.login.switchUser(); });
    $$('[data-uid]', pane).forEach(function (tr) {
      var id = tr.getAttribute('data-uid'), r = $('[data-usrole]', tr), a = $('[data-usact]', tr), pw = $('[data-uspw]', tr);
      if (r) r.addEventListener('change', function () { NSStore.auth('setUser', { id: id, role: r.value }).then(function () { say(pane, T('rolechanged')); }, function (e) { say(pane, err(e), true); }); });
      if (a) a.addEventListener('change', function () { NSStore.auth('setUser', { id: id, active: a.checked }).then(function () { say(pane, T(a.checked ? 'canagain' : 'cannot')); }, function (e) { say(pane, err(e), true); }); });
      if (pw) pw.addEventListener('click', function () { var p = prompt(T('newpwask')); if (p) NSStore.auth('setUser', { id: id, pw: p }).then(function () { say(pane, T('pwchanged')); }, function (e) { say(pane, err(e), true); }); });
    });
    var ad = q('[data-usadd]'); if (ad) ad.addEventListener('submit', function (e) { e.preventDefault(); NSStore.auth('addUser', { name: ad.n.value, pw: ad.p.value, role: ad.r.value }).then(function () { draw(pane); }, function (er) { say(pane, err(er), true); }); });
    var rv = q('[data-usrview]'); if (rv) rv.addEventListener('change', function () { var r = roles.filter(function (x) { return x.id === rv.value; })[0]; q('[data-usgrid]').innerHTML = grid(r, false); });
    var nr = q('[data-usnewrole]');
    if (nr) {
      var fill = function () { var r = roles.filter(function (x) { return x.id === nr.from.value; })[0]; q('[data-usnewgrid]').innerHTML = grid(r, true); };
      nr.from.addEventListener('change', fill); fill();
      nr.addEventListener('submit', function (e) {
        e.preventDefault();
        var rights = {}; AREAS.forEach(function (a) { rights[a] = {}; ACTS.forEach(function (x) { rights[a][x] = false; }); });
        $$('[data-rg]', nr).forEach(function (c) { var k = c.getAttribute('data-rg').split('.'); rights[k[0]][k[1]] = c.checked; });
        var id = 'r-' + (nr.n.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now().toString(36));
        NSStore.auth('setRole', { role: { id: id, name: nr.n.value, rights: rights, limits: { backDays: +nr.bd.value || 0, maxDisc: +nr.md.value || 0, seeCost: nr.cost.checked } } }).then(function () { draw(pane); }, function (er) { say(pane, err(er), true); });
      });
    }
    var mp = q('[data-usmypw]'); if (mp) mp.addEventListener('submit', function (e) { e.preventDefault(); NSStore.auth('changePw', { old: mp.o.value, pw: mp.p.value }).then(function () { mp.reset(); say(pane, T('mychanged')); }, function (er) { say(pane, err(er), true); }); });
    var of = q('[data-usoff]');
    if (of) of.addEventListener('submit', function (e) {
      e.preventDefault();
      var go = function () {
        say(pane, T('lo_ing'));
        NSStore.auth('loginsOff', { pw: of.p.value }).then(function () { say(pane, T('lo_done')); setTimeout(function () { location.reload(); }, 1200); }, function (er) { of.p.value = ''; say(pane, err(er), true); });
      };
      (NS.ask ? NS.ask(T('lo_ask'), { ok: T('lo_t'), danger: 1 }) : Promise.resolve(confirm(T('lo_ask')))).then(function (yes) { if (yes) go(); });
    });
    var il = q('[data-usidle]'); if (il) il.addEventListener('change', function () { if (NS.login) NS.login.setIdle(il.value); say(pane, T('idlesaved')); });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: draw });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubfiles.js */
try{/* My data › Backup › "Copies of the data files" (owner 21 Nov 2026, SQLite Stage 4), through NS.hubBackupExt (my.js).
   Like Tally and Evershine: the data files themselves are copied every day into NSBiz › Backup › Mon … Sun (the last seven days
   are always there), and the whole data can be saved as one .nsbiz file (pen drive, another PC). Once logins are on, the copies
   stay locked: they open only with the NSBiz passwords of that data. Bringing a copy back replaces all data on this device; the
   data as it is now is saved first (Backup › Before restore, or a downloaded file). The copying itself is in core.js
   (NS.fileBackup); the Windows program copies into Public Documents\NSBiz\Backup by itself (ns-desktop sqlhome.js).
   Words: 'fb.*' (My data is a site of its own, so they are in every language). */
(function () {
  'use strict';
  if (!window.NS || !NS.fileBackup) return;
  var $ = NS.$, esc = NS.esc, FB = NS.fileBackup, T = function (k, o) { return NS.t('fb.' + k, o); };
  var DESK = false;
  var DAYKEY = { Sun: 'd_sun', Mon: 'd_mon', Tue: 'd_tue', Wed: 'd_wed', Thu: 'd_thu', Fri: 'd_fri', Sat: 'd_sat', 'Before restore': 'd_before' };
  function dayName(f) { return DAYKEY[f] ? T(DAYKEY[f]) : f; }
  function mb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function when(at) { var d = new Date(at); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
  function err(e) { return String(e && e.message || e || '').replace(/^NSAUTH: /, ''); }
  function say(box, t, bad) { var m = $('[data-fbmsg]', box); if (m) { m.textContent = t || ''; m.className = bad ? 'bad' : 'soft'; } }

  function rows(list, desk) {
    if (!list || !list.length) return '<p class="soft">' + esc(T(desk ? 'none_desk' : 'none')) + '</p>';
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="l">' + esc(T('th_copy')) + '</th><th class="l">' + esc(T('th_saved')) + '</th><th>' + esc(T('th_files')) + '</th><th>' + esc(T('th_size')) + '</th><th></th></tr></thead><tbody>' +
      list.map(function (c) {
        return '<tr><th scope="row" class="l">' + esc(dayName(c.folder)) + (c.logins ? ' <span class="soft" title="' + esc(T('lockedtip')) + '">· ' + esc(T('lockedtag')) + '</span>' : '') + '</th>' +
          '<td class="l">' + esc(when(c.at)) + '</td><td>' + (c.n || 0) + '</td><td>' + esc(mb(c.size || 0)) + '</td>' +
          '<td><button type="button" class="btn sm" data-fbback="' + esc(c.folder) + '">' + esc(T('back')) + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function card(x) {
    var box = NS.el('div', { class: 'card fb-card' });
    box.innerHTML = '<h3>' + esc(T('title')) + '</h3><p class="soft">…</p>';
    x.appendChild(box);
    /* only where the data is in the NSBiz files (SQLite): the Windows program, or Chrome / Edge with the newer data store */
    Promise.all([NSStore.deskBackup ? NSStore.deskBackup('bkDays').catch(function () { return null; }) : null, NSStore.auth('authStatus').catch(function () { return {}; })]).then(function (r) {
      var desk = r[0], st = r[1] || {};
      DESK = !!desk;
      if (!desk && st.sqlite === false) { box.remove(); return; }
      if (desk) return draw(box, desk.days || [], { desk: desk, st: st });
      var pick = NS.folderSupported && NS.folderSupported();
      return (pick ? FB.list().catch(function () { return null; }) : Promise.resolve(null)).then(function (list) { draw(box, list, { st: st, pick: pick }); });
    });
  }

  function draw(box, list, o) {
    var desk = o.desk, folderOn = !!list;
    var where = desk ? '<b>' + esc(desk.dir) + '</b>' : esc(T('where'));
    box.innerHTML = '<h3>' + esc(T('title')) + '</h3>' +
      '<p>' + esc(T('p1', { where: '\u0001' })).replace('\u0001', where) + (o.st.on ? ' ' + esc(T('locked_p')) : '') + '</p>' +
      (desk || folderOn ? rows(list, !!desk) : '<p class="soft">' + esc(T(o.pick ? 'need_folder' : 'on_computer')) + '</p>') +
      '<div class="btns">' +
      (desk || folderOn ? '<button type="button" class="btn" data-fbnow>' + esc(T('now')) + '</button>' : '') +
      '<button type="button" class="btn" data-fbsave>' + esc(T('save')) + '</button>' +
      '<label class="btn"><span>' + esc(T('fromfile')) + '</span><input type="file" accept=".nsbiz" data-fbfile hidden></label>' +
      (o.pick && !desk ? '<button type="button" class="btn" data-fbdir>' + esc(T('fromdir')) + '</button>' : '') +
      '</div><p data-fbmsg class="soft"></p>' +
      '<p class="soft">' + esc(T(desk ? 'rep_pc' : 'rep_dev')) + (o.st.on ? ' ' + esc(T('owneronly')) : '') + '</p>';
    wire(box, o);
  }

  function again(box) { var x = box.parentNode; box.remove(); if (x) card(x); }
  function ask(what, at) {
    var msg = T(DESK ? 'ask_pc' : 'ask_dev', { what: what + (at ? T('saved_at', { when: when(at) }) : '') });
    return NS.ask ? NS.ask(msg, { ok: T('ok'), danger: 1 }) : Promise.resolve(confirm(msg));
  }
  function done(r) {
    NS.toast(T('done', { n: r.n }) + (r.saved === 'download' ? ' ' + T('done_dl') : ''));
    try { localStorage.setItem('nsbiz-restored', String(Date.now())); } catch (e) {}
    /* the whole App starts again (its screens and the login belonged to the replaced data) */
    setTimeout(function () { var w = window; try { if (window.top !== window && window.top.location.origin === location.origin) w = window.top; } catch (e) {} w.location.reload(); }, 1200);
  }

  function wire(box, o) {
    var desk = o.desk, busy = false;
    function run(btn, fn) {
      if (busy) return; busy = true; if (btn) btn.disabled = true; say(box, T('working'));
      return Promise.resolve().then(fn).then(function (v) { busy = false; if (btn) btn.disabled = false; return v; }, function (e) { busy = false; if (btn) btn.disabled = false; say(box, err(e), true); });
    }
    var now = $('[data-fbnow]', box);
    if (now) now.addEventListener('click', function () {
      run(now, function () {
        return (desk ? NSStore.deskBackup('bkNow') : FB.copy()).then(function (st) {
          if (st === 'ask') { NS.folderAllow && NS.folderAllow(); throw new Error(T('askok')); }
          NS.toast(T('copied')); again(box);
        });
      });
    });
    $('[data-fbsave]', box).addEventListener('click', function (e) {
      run(e.currentTarget, function () {
        return FB.pack().then(function (blob) {
          var name = 'NSBiz-backup-' + NS.today() + '.nsbiz';
          var a = NS.el('a', { href: URL.createObjectURL(blob), download: name });
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          say(box, T('savedfile', { name: name, size: mb(blob.size) }));
          return NSStore.meta('lastBackup', Date.now());
        });
      });
    });
    var fi = $('[data-fbfile]', box);
    fi.addEventListener('change', function () {
      var f = fi.files && fi.files[0]; fi.value = '';
      if (!f) return;
      run(null, function () {
        return FB.unpack(f).then(function (set) {
          say(box, '');
          return ask(T('w_file', { name: f.name }), set.head.at).then(function (yes) {
            if (!yes) return;
            say(box, T('bringing'));
            return FB.restore(set, f.name).then(done);
          });
        });
      });
    });
    var dirB = $('[data-fbdir]', box);
    if (dirB) dirB.addEventListener('click', function () {
      run(dirB, function () {
        return window.showDirectoryPicker({ id: 'ns-restore', mode: 'read' }).then(function (h) {
          return FB.readFolder(null, h).then(function (set) {
            return ask(T('w_dir', { name: h.name }), set.head.at).then(function (yes) {
              if (!yes) return;
              say(box, T('bringing'));
              return FB.restore(set, 'folder ' + h.name).then(done);
            });
          });
        }, function () { say(box, ''); });
      });
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fbback]'); if (!b) return;
      var day = b.getAttribute('data-fbback'), name = day === 'Before restore' ? T('w_before') : T('w_day', { day: dayName(day) });
      run(b, function () {
        if (desk) {
          return ask(name).then(function (yes) {
            if (!yes) return;
            say(box, T('bringing'));
            return NSStore.deskBackup('bkRestoreDay', { day: day }).then(function (r) { r.saved = 'folder'; done(r); });
          });
        }
        return FB.readFolder(day).then(function (set) {
          return ask(name, set.head.at).then(function (yes) {
            if (!yes) return;
            say(box, T('bringing'));
            return FB.restore(set, 'Backup › ' + day).then(done);
          });
        });
      });
    });
  }

  NS.hubBackupExt = (NS.hubBackupExt || []).concat([function (pane) { var x = $('[data-backup-ext]', pane) || pane; card(x); }]);
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubmore.js */
try{/* Batch 2 in My data (my.niveshsahayak.in), through NS.hubExt (my.js):
     item form   "Stock tracking": track '' | 'batch' (batch and expiry) | 'serial' (serial or IMEI numbers) | 'both'
     Settings    godowns [names], salesmen [{ name, rate, basis 'sales' | 'paid' }],
                 custom fields on documents cfields [{ id, label, types: [document types], print }],
                 stock valuation stockValue 'avg' (weighted average, default) | 'fifo' (NSStock.valuation),
                 and the financial years closed in the App's Year end (shown here, changed there). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t;
  var TYPES = ['invoice', 'quote', 'proforma', 'so', 'challan', 'po', 'note', 'cashmemo', 'self'];
  var TRACK = ['', 'batch', 'serial', 'both'];
  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur || '') ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  function form(s, r) {
    if (s !== 'item') return '';
    var bom = r.bom && (r.bom.lines || []).length ? '<p class="hint">' + esc(t('b2.hasbom', { l: r.bom.lines.map(function (l) { return l.desc + ' ' + l.qty; }).join(', ') })) + '</p>' : '';
    return '<fieldset class="card b2-sec"><legend>' + esc(t('b2.trackt')) + '</legend><div class="fg"><div class="f wide"><label for="b2-track">' + esc(t('b2.track')) + '</label><select id="b2-track" name="b2track">' +
      TRACK.map(function (k) { return opt(k, t('b2.tr_' + (k || 'none')), r.track); }).join('') + '</select><small class="hint">' + esc(t('b2.trackh')) + '</small></div></div>' + bom + '</fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'item' || !f.elements.b2track) return;
    if (f.elements.b2track.value) r.track = f.elements.b2track.value; else delete r.track;
  }

  var SM = [], CF = [];
  function smRow(x, i) {
    return '<div class="b2-row" data-smi="' + i + '"><label><span>' + esc(t('b2.smname')) + '</span><input data-sm="name" dir="auto" value="' + esc(x.name || '') + '"></label>' +
      '<label><span>' + esc(t('b2.smrate')) + '</span><input data-sm="rate" inputmode="decimal" dir="ltr" value="' + esc(x.rate == null ? '' : x.rate) + '"></label>' +
      '<label><span>' + esc(t('b2.smbasis')) + '</span><select data-sm="basis">' + opt('sales', t('b2.on_sales'), x.basis) + opt('paid', t('b2.on_paid'), x.basis) + '</select></label>' +
      '<button type="button" class="icon-btn" data-smrm="' + i + '" aria-label="' + esc(t('b2.rm')) + '">✕</button></div>';
  }
  function cfRow(x, i) {
    return '<div class="b2-row cf" data-cfi="' + i + '"><label><span>' + esc(t('b2.cflabel')) + '</span><input data-cf="label" dir="auto" maxlength="40" value="' + esc(x.label || '') + '" placeholder="' + esc(t('b2.cfph')) + '"></label>' +
      '<label class="chk"><input type="checkbox" data-cf="print"' + (x.print ? ' checked' : '') + '> ' + esc(t('b2.cfprint')) + '</label>' +
      '<button type="button" class="icon-btn" data-cfrm="' + i + '" aria-label="' + esc(t('b2.rm')) + '">✕</button>' +
      '<fieldset class="b2-types"><legend>' + esc(t('b2.cftypes')) + '</legend>' + TYPES.map(function (ty) {
        var on = !x.types || !x.types.length || x.types.indexOf(ty) >= 0;
        return '<label class="chk"><input type="checkbox" data-cft="' + ty + '"' + (on ? ' checked' : '') + '> ' + esc(t('Doc.' + ty)) + '</label>'; }).join('') + '</fieldset></div>';
  }
  function settings(S) {
    SM = JSON.parse(JSON.stringify(S.salesmen || [])); CF = JSON.parse(JSON.stringify(S.cfields || []));
    var closed = []; Object.keys(S.closed || {}).forEach(function (b) { (S.closed[b] || []).forEach(function (fy) { closed.push(fy); }); });
    return '<form class="set b2-set" data-b2set>' +
      '<fieldset class="card" id="set-gd"><legend>' + esc(t('b2.gds')) + '</legend><p class="hint">' + esc(t('b2.gdsh')) + '</p><div class="fg"><div class="f wide"><label for="b2-gds">' + esc(t('b2.gdlist')) + '</label>' +
        '<textarea id="b2-gds" rows="3" dir="auto" placeholder="' + esc(t('b2.gdph')) + '">' + esc((S.godowns || []).join('\n')) + '</textarea></div></div></fieldset>' +
      '<fieldset class="card" id="set-sm"><legend>' + esc(t('b2.sms')) + '</legend><p class="hint">' + esc(t('b2.smsh')) + '</p><div data-sms></div><button type="button" class="btn sm" data-smadd>+ ' + esc(t('b2.smadd')) + '</button></fieldset>' +
      (window.NSCF ? '<fieldset class="card"><legend>' + esc(t('b2.cfs')) + '</legend><p class="hint">' + esc(t('ufd.inapp')) + '</p></fieldset>' :   /* ERP Round 2: custom fields live in the App's Masters */
        '<fieldset class="card"><legend>' + esc(t('b2.cfs')) + '</legend><p class="hint">' + esc(t('b2.cfsh')) + '</p><div data-cfs></div><button type="button" class="btn sm" data-cfadd>+ ' + esc(t('b2.cfadd')) + '</button></fieldset>') +
      '<fieldset class="card"><legend>' + esc(t('fr.val')) + '</legend><div class="fg"><div class="f wide"><label for="b2-val">' + esc(t('fr.valq')) + '</label><select id="b2-val">' +
        [['avg', 'fr.val_avg'], ['fifo', 'fr.val_fifo']].map(function (o) { return '<option value="' + o[0] + '"' + ((S.stockValue === 'fifo' ? 'fifo' : 'avg') === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('') +
        '</select><small class="hint">' + esc(t('fr.valh')) + '</small></div></div></fieldset>' +
      (closed.length ? '<fieldset class="card"><legend>' + esc(t('b2.closedy')) + '</legend><p>' + esc(closed.sort().join(', ')) + '</p><p class="hint">' + esc(t('b2.closedyh')) + '</p></fieldset>' : '') +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(t('b2.saveset')) + '</button></div></form>';
  }
  function wireSettings(pane, S, save) {
    var f = $('[data-b2set]', pane); if (!f) return;
    function readSm() { $$('[data-smi]', f).forEach(function (row) { var x = SM[+row.getAttribute('data-smi')]; $$('[data-sm]', row).forEach(function (i) { x[i.getAttribute('data-sm')] = i.value.trim(); }); }); }
    function readCf() {
      $$('[data-cfi]', f).forEach(function (row) {
        var x = CF[+row.getAttribute('data-cfi')];
        x.label = $('[data-cf=label]', row).value.trim(); x.print = $('[data-cf=print]', row).checked;
        var ty = $$('[data-cft]', row).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-cft'); });
        x.types = ty.length === TYPES.length ? [] : ty;
      });
    }
    function draw() {
      $('[data-sms]', f).innerHTML = SM.map(smRow).join('') || '<p class="soft">' + esc(t('b2.nosm')) + '</p>';
      if ($('[data-cfs]', f)) $('[data-cfs]', f).innerHTML = CF.map(cfRow).join('') || '<p class="soft">' + esc(t('b2.nocf')) + '</p>';
      $$('[data-smrm]', f).forEach(function (b) { b.addEventListener('click', function () { readSm(); SM.splice(+b.getAttribute('data-smrm'), 1); draw(); }); });
      $$('[data-cfrm]', f).forEach(function (b) { b.addEventListener('click', function () { readCf(); CF.splice(+b.getAttribute('data-cfrm'), 1); draw(); }); });
    }
    draw();
    $('[data-smadd]', f).addEventListener('click', function () { readSm(); SM.push({ name: '', rate: '', basis: 'sales' }); draw(); var i = $$('[data-sm=name]', f); i[i.length - 1].focus(); });
    if ($('[data-cfadd]', f)) $('[data-cfadd]', f).addEventListener('click', function () { readCf(); CF.push({ id: 'f' + Date.now().toString(36), label: '', types: [], print: true }); draw(); var i = $$('[data-cf=label]', f); i[i.length - 1].focus(); });
    /* godown names and the stock value method save as soon as they change: a far-away Save button was missed (round C) */
    ['#b2-gds', '#b2-val'].forEach(function (s) { var i = $(s, f); if (i) i.addEventListener('change', function () { if (f.requestSubmit) f.requestSubmit(); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); readSm(); readCf();
      var seen = {};
      S.godowns = $('#b2-gds', f).value.split(/\n+/).map(function (x) { return x.trim(); }).filter(function (x) { var k = x.toLowerCase(); if (!x || seen[k] || k === 'main') return false; seen[k] = 1; return true; });
      S.salesmen = SM.filter(function (x) { return x.name; }).map(function (x) { return { name: x.name, rate: NS.num(x.rate), basis: x.basis === 'paid' ? 'paid' : 'sales' }; });
      S.cfields = CF.filter(function (x) { return x.label; });
      S.stockValue = $('#b2-val', f).value === 'fifo' ? 'fifo' : 'avg';
      save().then(function () { NS.toast(t('hub.setsaved')); });
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read, settings: settings, wireSettings: wireSettings });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* tfcore.js */
try{/* NSTF: final accounts in the traditional T format (horizontal), the way shop owners, firms, their accountants, banks and
   Tally show them. Pure functions over the same trial balance lines as the Schedule III view (NSPL.fromBooks: rows with a
   head g, dr, cr), so both views always give the same net profit and the same balance sheet totals.
     Trading account     Dr: opening stock, purchases less returns, materials, direct expenses, gross profit c/d
                         Cr: sales less returns, closing stock, gross loss c/d
     Profit and loss     Dr: gross loss b/d, indirect expenses, depreciation, interest, tax, net profit (to capital)
                         Cr: gross profit b/d, other income, net loss
     Balance sheet       Liabilities: capital account (per owner / partner), loans, sundry creditors, duties and taxes,
                         other current liabilities | Assets: fixed assets, investments, closing stock, sundry debtors,
                         cash, bank, loans and advances, GST input credit, TDS receivable
   Direct or indirect: every expense line of the heads 'emp' and 'oth' (depreciation, interest and tax always stay in the
   profit and loss part). Defaults follow Tally practice: freight inward / transport on purchases, carriage, wages, factory
   power and fuel, packing for production are direct; everything else indirect. The user changes it per expense in
   My data › Settings: settings.tf = { fmt: '' (by business type) | 't' | 'v', dx: { account key: true | false } };
   a typed line (profit-loss.) carries its own dx.
   Each output line: { t (what it is), v (amount), row (the trial balance line, when it is one), parts (inner lines), name }.
   Screens put the words on it: English on paper, the user's language on screen. */
(function (G) {
  'use strict';
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  var CRH = { cap: 1, res: 1, ltb: 1, stb: 1, tpay: 1, ocl: 1, rev: 1, oinc: 1 };
  function amt(x) { return CRH[x.g] ? r2(num(x.cr) - num(x.dr)) : r2(num(x.dr) - num(x.cr)); }

  /* a company files Schedule III (vertical); proprietors and firms keep the T format. Company = PAN holder type C
     (4th letter of the PAN, 6th of the GSTIN) or a constitution naming a company */
  function isCompany(biz) {
    biz = biz || {};
    var c = String(biz.constitution || biz.gst && (biz.gst.constitution || biz.gst.const) || '');
    if (/company|limited|pvt|private ltd/i.test(c)) return true;
    var pan = String(biz.pan || '').toUpperCase(), g = String(biz.gstin || '').toUpperCase();
    return pan.length === 10 ? pan[3] === 'C' : g.length === 15 ? g[5] === 'C' : false;
  }
  function fmt(settings, biz) {
    var f = settings && settings.tf && settings.tf.fmt;
    return f === 't' || f === 'v' ? f : isCompany(biz) ? 'v' : 't';
  }

  /* expense codes of the App's expense form (app.js EXP) that are direct by default */
  var DIRECT_CODES = { transport: 1, fuel: 1 }, INDIRECT_CODES = { rent: 1, power: 1, salary: 1, phone: 1, repair: 1, office: 1, bank: 1, prof: 1, ads: 1, misc: 1 };
  var DIRECT_RE = /freight|carriage|cartage|wage|factory|packing|loading|unloading|octroi|import duty|custom duty|customs|clearing|power and fuel|coal|job ?work|manufactur|production|labour|labor|majdoori|mazdoori|hammali/;
  /* default for an account key (exp:transport) and its name */
  function defaultDirect(k, name) {
    var code = String(k || '').indexOf('exp:') === 0 ? String(k).slice(4) : '';
    if (DIRECT_CODES[code]) return true;
    if (INDIRECT_CODES[code]) return false;   /* the App's own heads: office salary, office electricity ... */
    var H = G.NSHeads || (typeof NSHeads !== 'undefined' ? NSHeads : null), hh = H && H.find(name || code);   /* the heads list (heads.js) knows its type */
    if (hh && !H.isIncome(hh)) return hh.t === 'dexp';
    var n = key(name) + ' ' + key(code);
    if (/office|admin|sales|selling|outward/.test(n)) return false;
    return DIRECT_RE.test(n);
  }
  /* can this trial balance line be a direct expense at all */
  function canDirect(x) { return (x.g === 'emp' || x.g === 'oth') && x.k !== 'round-off'; }
  function isDirect(x, dx) {
    if (!canDirect(x)) return false;
    if (x.dx != null) return !!x.dx;   /* a typed line says it itself */
    if (dx && dx[x.k] != null) return !!dx[x.k];
    return defaultDirect(x.k, x.en || x.name);
  }

  /* Trading and Profit and Loss Account. rows = trial balance lines, cs = closing stock, dx = settings.tf.dx */
  function tradingPL(rows, cs, dx) {
    cs = r2(num(cs));
    var os = 0, sal = 0, sret = 0, pur = 0, pret = 0, mat = [], dir = [], ind = [], dep = [], fin = [], tax = [], oinc = [];
    rows.forEach(function (x) {
      var v = amt(x);
      if (x.g === 'osk') os = r2(os + v);
      else if (x.g === 'rev') { if (x.k === 'sales-return') sret = r2(sret - v); else sal = r2(sal + v); }
      else if (x.g === 'pur') { if (x.k === 'purchase-return') pret = r2(pret - v); else pur = r2(pur + v); }
      else if (x.g === 'mat') mat.push({ t: 'row', row: x, v: v });
      else if (x.g === 'emp' || x.g === 'oth') (isDirect(x, dx) ? dir : ind).push({ t: 'row', row: x, v: v });
      else if (x.g === 'dep') dep.push({ t: 'row', row: x, v: v });
      else if (x.g === 'fin') fin.push({ t: 'row', row: x, v: v });
      else if (x.g === 'tax') tax.push({ t: 'row', row: x, v: v });
      else if (x.g === 'oinc') oinc.push({ t: 'row', row: x, v: v });
    });
    function sum(a) { return r2(a.reduce(function (s, y) { return s + y.v; }, 0)); }
    var salesNet = r2(sal - sret), purNet = r2(pur - pret);
    var gross = r2(salesNet + cs - os - purNet - sum(mat) - sum(dir));
    var trDr = [], trCr = [];
    if (os) trDr.push({ t: 'osk', v: os });
    if (pur || pret) trDr.push({ t: 'pur', v: purNet, parts: pret ? [{ t: 'purg', v: pur }, { t: 'pret', v: pret }] : null });
    trDr = trDr.concat(mat);
    if (dir.length) trDr.push({ t: 'dirh', v: sum(dir), parts: dir });
    if (gross >= 0) trDr.push({ t: 'gpcd', v: gross });
    if (sal || sret) trCr.push({ t: 'sales', v: salesNet, parts: sret ? [{ t: 'salg', v: sal }, { t: 'sret', v: sret }] : null });
    trCr.push({ t: 'csk', v: cs });
    if (gross < 0) trCr.push({ t: 'glcd', v: -gross });
    var trTot = r2(Math.max(sum(trDr), sum(trCr)));
    var net = r2(gross + sum(oinc) - sum(ind) - sum(dep) - sum(fin) - sum(tax));
    var plDr = [], plCr = [];
    if (gross < 0) plDr.push({ t: 'glbd', v: -gross });
    if (ind.length) plDr.push({ t: 'indh', v: sum(ind), parts: ind });
    plDr = plDr.concat(dep, fin, tax);
    if (net >= 0) plDr.push({ t: 'np', v: net });
    if (gross >= 0) plCr.push({ t: 'gpbd', v: gross });
    plCr = plCr.concat(oinc);
    if (net < 0) plCr.push({ t: 'nl', v: -net });
    var plTot = r2(Math.max(sum(plDr), sum(plCr)));
    return { tr: { dr: trDr, cr: trCr, tot: trTot, drTot: sum(trDr), crTot: sum(trCr) }, pl: { dr: plDr, cr: plCr, tot: plTot, drTot: sum(plDr), crTot: sum(plCr) },
      gross: gross, net: net, os: os, cs: cs, sales: salesNet, purchases: purNet, direct: sum(dir), indirect: sum(ind) };
  }

  /* Balance sheet. opt: { capOpen: { account key: credit balance on the day before the period }, dep: { fa account: depreciation
     of the period } }. Capital accounts are cap:<owner> / drw:<owner> (finrep.js capital form); with one owner (or none) every
     capital line is one capital account, with several each partner gets an account and the rest stays undivided.
     opt.firm = NSFA.firm(...) for a partnership firm / LLP (famore.js A.famFirm): each partner's capital account then carries
     interest, salary and share of profit or loss, exactly as the Schedule III balance sheet, nothing left undivided. */
  function balanceSheet(rows, cs, net, opt) {
    opt = opt || {}; cs = r2(num(cs)); net = r2(num(net));
    var capOpen = opt.capOpen || {}, depMap = opt.dep || {};
    var owners = {}, otherCap = 0, otherDrw = [], res = 0, L = [], A = [];
    function own(k, name, row) { var o = owners[k] = owners[k] || { k: k, name: name, open: 0, add: 0, drw: 0 }; if (row && !o.row) o.row = row; return o; }
    var grp = { ltb: [], stb: [], tpay: [], duty: [], ocl: [], ppe: [], ninv: [], trec: [], cash: [], bank: [], chq: [], oca: [], gstin: [], tdsr: [] };
    rows.forEach(function (x) {
      var v = amt(x);
      if (x.g === 'cap') {
        if (x.k.indexOf('cap:') === 0) { var o = own(x.k.slice(4), x.en || x.name, x), op = r2(num(capOpen[x.k])); o.open = r2(o.open + op); o.add = r2(o.add + v - op); }
        else otherCap = r2(otherCap + v);
      } else if (x.g === 'drw') {
        if (x.k.indexOf('drw:') === 0 && (owners[x.k.slice(4)] || rows.some(function (y) { return y.k === 'cap:' + x.k.slice(4); }))) own(x.k.slice(4), '').drw += v;
        else otherDrw.push({ t: 'row', row: x, v: v });
      } else if (x.g === 'res') res = r2(res + v);
      else if (x.g === 'ltb') grp.ltb.push(x);
      else if (x.g === 'stb') grp.stb.push(x);
      else if (x.g === 'tpay') grp.tpay.push(x);
      else if (x.g === 'ocl') (x.k === 'gst' || /^gst-/.test(x.k) || x.k === 'tds-payable' || /\b(gst|tds|tcs|tax|duty|duties|cess)\b/i.test(x.en || x.name || '') ? grp.duty : grp.ocl).push(x);
      else if (x.g === 'ppe') grp.ppe.push(x);
      else if (x.g === 'ninv') grp.ninv.push(x);
      else if (x.g === 'trec') grp.trec.push(x);
      else if (x.g === 'cash') (/^bank(:|$)/.test(x.k) ? grp.bank : x.k === 'chq-in' ? grp.chq : grp.cash).push(x);
      else if (x.g === 'oca') (x.k === 'gst' || /^gst-/.test(x.k) ? grp.gstin : x.k === 'tds-receivable' ? grp.tdsr : grp.oca).push(x);
    });
    /* owners whose name came only from drawings */
    Object.keys(owners).forEach(function (k) { var o = owners[k]; o.drw = r2(o.drw); if (!o.name) { var d = rows.filter(function (y) { return y.k === 'drw:' + k; })[0]; o.name = d ? d.en || d.name : k; } });
    var list = Object.keys(owners).map(function (k) { return owners[k]; }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    function sum(a) { return r2(a.reduce(function (s, y) { return s + y.v; }, 0)); }
    var oDrw = sum(otherDrw), fc = opt.firm && opt.firm.caps && opt.firm.caps.length ? opt.firm.caps : null;
    if (fc) {
      var inF = {}; fc.forEach(function (c) { inF[c.k] = 1; });
      fc.forEach(function (c) {
        var p = [{ t: 'capopen', v: c.open }];
        if (c.intro) p.push({ t: 'capadd', v: c.intro });
        if (c.int) p.push({ t: 'capint', v: c.int });
        if (c.sal) p.push({ t: 'capsal', v: c.sal });
        if (c.share) p.push({ t: c.share < 0 ? 'capshl' : 'capsh', v: c.share });
        if (c.drw) p.push({ t: 'capdrw', v: -c.drw });
        L.push({ t: 'cap', name: c.name, own: owners[c.k] && owners[c.k].row, v: c.close, parts: p });
      });
      /* capital not in a partner's account (an old 'Capital' line, earlier profit) and any gap between the two profit figures */
      /* capital brought in (or taken out) during the period stays visible as such, not folded into "Opening balance" (round C) */
      var rest = r2(otherCap + res), q = [], add2 = 0, drw2 = 0;
      list.forEach(function (o) { if (!inF[o.k]) { rest = r2(rest + o.open); add2 = r2(add2 + o.add); drw2 = r2(drw2 + o.drw); } });
      if (rest) q.push({ t: 'capopen', v: rest });
      if (add2) q.push({ t: 'capadd', v: add2 });
      if (drw2) q.push({ t: 'capdrw', v: -drw2 });
      var gap = r2(net - num(opt.firm.appr && opt.firm.appr.profit));
      if (gap) q.push({ t: gap < 0 ? 'capnl' : 'capnp', v: gap });
      otherDrw.forEach(function (y) { q.push({ t: 'capdrw', row: y.row, v: -y.v }); });
      if (q.length && r2(sum(q))) L.push({ t: 'capo', v: sum(q), parts: q });
    } else if (list.length <= 1) {
      var o1 = list[0] || { k: '', name: '', open: 0, add: 0, drw: 0 };
      var parts = [{ t: 'capopen', v: r2(o1.open + otherCap + res) }];
      if (o1.add) parts.push({ t: 'capadd', v: o1.add });
      parts.push({ t: net < 0 ? 'capnl' : 'capnp', v: net });
      if (o1.drw) parts.push({ t: 'capdrw', v: -o1.drw });
      otherDrw.forEach(function (y) { parts.push({ t: 'capdrw', row: y.row, v: -y.v }); });
      L.push({ t: 'cap', name: o1.name, own: o1.row, v: sum(parts), parts: parts });
    } else {
      list.forEach(function (o) {
        var p = [{ t: 'capopen', v: o.open }]; if (o.add) p.push({ t: 'capadd', v: o.add }); if (o.drw) p.push({ t: 'capdrw', v: -o.drw });
        L.push({ t: 'cap', name: o.name, own: o.row, v: sum(p), parts: p });
      });
      var q = []; if (r2(otherCap + res)) q.push({ t: 'capopen', v: r2(otherCap + res) });
      q.push({ t: net < 0 ? 'capnl' : 'capnp', v: net });
      otherDrw.forEach(function (y) { q.push({ t: 'capdrw', row: y.row, v: -y.v }); });
      L.push({ t: 'capu', v: sum(q), parts: q });
    }
    function rowsOf(a) { return a.map(function (x) { return { t: 'row', row: x, v: amt(x) }; }); }
    function grpLine(t, a, always) { if (!a.length && !always) return; var p = rowsOf(a); L.push({ t: t, v: sum(p), parts: p.length > 1 || always && p.length ? p : null, row: p.length === 1 ? a[0] : null }); }
    grpLine('loans', grp.ltb); grpLine('stl', grp.stb);
    if (grp.tpay.length) L.push({ t: 'cred', v: sum(rowsOf(grp.tpay)), row: grp.tpay[0] });
    grpLine('duty', grp.duty); grpLine('ocl', grp.ocl);
    function aLine(t, a, always) { if (!a.length && !always) return; var p = rowsOf(a); A.push({ t: t, v: sum(p), parts: p.length > 1 ? p : null, row: p.length === 1 ? a[0] : null }); }
    if (grp.ppe.length) {
      var fp = grp.ppe.map(function (x) {
        var v = amt(x), d = r2(num(depMap[x.k]));
        return { t: 'row', row: x, v: v, parts: d ? [{ t: 'fagross', v: r2(v + d) }, { t: 'fadep', v: -d }] : null };
      });
      A.push({ t: 'fa', v: sum(fp), parts: fp });
    }
    aLine('inv', grp.ninv);
    A.push({ t: 'csk', v: cs });
    if (grp.trec.length) {   /* sundry debtors, less the provision for doubtful debts (WP-3) */
      var pdr = grp.trec.filter(function (x) { return x.k === 'pdd'; })[0], dv = sum(rowsOf(grp.trec));
      A.push(pdr && amt(pdr) ? { t: 'debt', v: dv, row: grp.trec.filter(function (x) { return x.k !== 'pdd'; })[0] || pdr, pdd: -amt(pdr), gross: r2(dv - amt(pdr)) } : { t: 'debt', v: dv, row: grp.trec[0] });
    }
    aLine('cash', grp.cash); aLine('chq', grp.chq); aLine('bank', grp.bank);
    aLine('adv', grp.oca); aLine('gstin', grp.gstin); aLine('tdsr', grp.tdsr);
    var tl = sum(L), ta = sum(A);
    return { liab: L, assets: A, tl: tl, ta: ta, diff: r2(ta - tl), owners: list.length };
  }

  /* depreciation of the period per fixed asset account, from the journal entries that post it (exp:depreciation + fa: lines) */
  function depOf(docs, from, to) {
    var o = {};
    (docs || []).forEach(function (d) {
      if (d.type !== 'jv' || from && d.date < from || to && d.date > to) return;
      var L = d.lines || []; if (!L.some(function (l) { return l.a === 'exp:depreciation'; })) return;
      L.forEach(function (l) { if (String(l.a || '').indexOf('fa:') === 0) o[l.a] = r2((o[l.a] || 0) + num(l.cr) - num(l.dr)); });
    });
    return o;
  }

  var API = { isCompany: isCompany, fmt: fmt, defaultDirect: defaultDirect, canDirect: canDirect, isDirect: isDirect, DIRECT_CODES: DIRECT_CODES,
    tradingPL: tradingPL, balanceSheet: balanceSheet, depOf: depOf, amt: amt };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSTF = API;
})(typeof window !== 'undefined' ? window : this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubtf.js */
try{/* Final accounts in My data › Settings (my.niveshsahayak.in), through NS.hubExt (my.js):
     settings.tf.fmt  '' = by business type (T format; Schedule III for a company) | 't' T format (horizontal) | 'v' Schedule III (vertical)
     settings.tf.dx   { expense account key ('exp:' + head): true = direct (Trading account) | false = indirect (Profit and Loss) }
   Listed: the App's own expense heads in the screen language, then every other head found in the saved expenses and journal
   entries. The default of each comes from NSTF.defaultDirect (tfcore.js), the same rule the statements use. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t, TF = window.NSTF; if (!TF) return;
  var CODES = ['transport', 'fuel', 'salary', 'rent', 'power', 'phone', 'repair', 'office', 'bank', 'prof', 'ads', 'misc'];
  function key(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  function settings(S) {
    var f = S.tf && S.tf.fmt || '';
    return '<form class="set tf-set" data-tfset id="tf-set"><fieldset class="card"><legend>' + esc(t('tf.set')) + '</legend><div class="fg"><div class="f wide"><label for="tf-fmt">' + esc(t('tf.setfmt')) + '</label><select id="tf-fmt">' +
      opt('', t('tf.f_auto'), f) + opt('t', t('tf.f_t'), f) + opt('v', t('tf.f_v'), f) + '</select><small class="hint">' + esc(t('tf.fmth')) + '</small></div></div>' +
      '<h3 class="dc-sub">' + esc(t('tf.dxt')) + '</h3><p class="hint">' + esc(t('tf.dxh')) + '</p><div data-tfdx><p class="soft">…</p></div></fieldset>' +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(t('tf.save')) + '</button></div></form>';
  }
  function wireSettings(pane, S, save) {
    var f = $('[data-tfset]', pane); if (!f) return;
    var dx = S.tf && S.tf.dx || {};
    NSStore.list('doc').then(function (docs) {
      var rows = [], seen = {};
      function add(k, name, code) { if (seen[k]) return; seen[k] = 1; rows.push({ k: k, name: name, code: code }); }
      CODES.forEach(function (c) { var n = t('app.ex_' + c); add('exp:' + key(n), n, c); });
      (docs || []).forEach(function (d) {
        var c = key(d.cat);   /* sample data and older records keep the App's code (power, rent ...) */
        if (d.type === 'exp' && d.cat && CODES.indexOf(c) < 0) add('exp:' + c, String(d.cat).trim());
        if (d.type === 'jv') (d.lines || []).forEach(function (l) { if (String(l.a || '').indexOf('exp:') === 0 && l.a !== 'exp:depreciation' && !/interest/.test(l.a)) add(l.a, l.nm || l.a.slice(4)); });
      });
      var box = $('[data-tfdx]', f);
      box.innerHTML = '<div class="tbl-wrap"><table class="tbl tf-dx"><thead><tr><th class="l">' + esc(t('tf.head')) + '</th><th class="l">' + esc(t('tf.goes')) + '</th></tr></thead><tbody>' + rows.map(function (r, i) {
        var def = r.code ? TF.defaultDirect('exp:' + r.code, '') : TF.defaultDirect(r.k, r.name);
        var on = dx[r.k] != null ? !!dx[r.k] : def;
        return '<tr><th scope="row" class="l"><label for="tf-dx' + i + '">' + esc(r.name) + '</label></th><td><select id="tf-dx' + i + '" data-k="' + esc(r.k) + '"' + (r.code ? ' data-k2="exp:' + r.code + '"' : '') + ' data-def="' + (def ? 1 : 0) + '">' +
          opt('1', t('tf.direct'), on ? '1' : '0') + opt('0', t('tf.indirect'), on ? '1' : '0') + '</select></td></tr>';
      }).join('') + '</tbody></table></div>';
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var o = {};
      Object.keys(dx).forEach(function (k) { o[k] = dx[k]; });
      $$('[data-k]', f).forEach(function (s) {
        var v = s.value === '1', same = v === (s.getAttribute('data-def') === '1');
        [s.getAttribute('data-k'), s.getAttribute('data-k2')].forEach(function (k) { if (!k) return; if (same) delete o[k]; else o[k] = v; });   /* only what differs from the default is kept; App heads also under their code */
      });
      var fm = $('#tf-fmt', f).value;
      S.tf = { fmt: fm === 't' || fm === 'v' ? fm : '', dx: o };
      save().then(function () { NS.toast(t('hub.setsaved')); });
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubheads.js */
try{/* Income and expense heads in My data › Settings (my.niveshsahayak.in), through NS.hubExt (my.js); Accounts coverage WP-1.
   Lists the ready heads of heads.js (NSHeads) by type with their Tally group, GST credit rule and usual TDS section, and the
   business's own heads (meta 'heads' = { custom: [{ name, t }] }, shared by every business like the other masters).
   An own head can also be made from the App's expense form: a new name asks its type once (acctx.js). */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, t = NS.t, H = window.NSHeads; if (!H) return;
  var TYPES = ['dexp', 'iexp', 'oinc', 'dinc'];
  function tl(k, v) { return t('hd.' + k, v); }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  var META = { custom: [] };
  function settings() {
    return '<form class="set hd-set" data-hdset id="hd-set"><fieldset class="card"><legend>' + esc(tl('set')) + '</legend><p class="hint">' + esc(tl('seth')) + '</p>' +
      '<div data-hdlist><p class="soft">…</p></div>' +
      '<h3 class="dc-sub">' + esc(tl('own')) + '</h3><p class="hint">' + esc(tl('ownh')) + '</p><div data-hdown></div>' +
      '<p><button type="button" class="btn sm" data-hdadd>' + esc(tl('add')) + '</button></p></fieldset>' +
      '<div class="btns"><button type="submit" class="btn primary">' + esc(tl('save')) + '</button></div></form>';
  }
  function gstText(g) { return tl('g_' + g); }
  function readyTable() {
    return TYPES.map(function (ty) {
      var rows = H.HEADS.filter(function (h) { return h.t === ty; });
      return '<details class="hd-grp"><summary><b>' + esc(tl('t_' + ty)) + '</b> <span class="soft">(' + rows.length + ') · Tally: ' + esc(H.TALLY[ty]) + '</span></summary>' +
        '<div class="tbl-wrap"><table class="tbl hd-t"><thead><tr><th class="l">' + esc(tl('head')) + '</th><th class="l">' + esc(tl('gst')) + '</th><th class="l">TDS</th></tr></thead><tbody>' +
        rows.map(function (h) { return '<tr><th scope="row" class="l">' + esc(H.label(h)) + (h.fa ? ' <small class="soft">' + esc(tl('fahint')) + '</small>' : '') + '</th><td class="l">' + esc(gstText(h.gst)) + '</td><td class="l" dir="ltr">' + esc(H.tdsLabel(h.tds)) + '</td></tr>'; }).join('') +
        '</tbody></table></div></details>';
    }).join('');
  }
  function ownRow(c, i) {
    return '<div class="hd-own" data-hdrow="' + i + '"><label class="lc"><span>' + esc(tl('head')) + '</span><input id="hd-n' + i + '" value="' + esc(c.name || '') + '" dir="auto" autocomplete="off"></label>' +
      '<label class="lc"><span>' + esc(tl('type')) + '</span><select id="hd-t' + i + '">' + TYPES.map(function (ty) { return opt(ty, tl('t_' + ty), c.t || 'iexp'); }).join('') + '</select></label>' +
      '<button type="button" class="icon-btn rm" data-hdrm="' + i + '" aria-label="' + esc(tl('rm', { h: c.name || '' })) + '">✕</button></div>';
  }
  function wireSettings(pane) {
    var f = $('[data-hdset]', pane); if (!f) return;
    var own = [];
    function drawOwn() {
      $('[data-hdown]', f).innerHTML = own.length ? own.map(ownRow).join('') : '<p class="soft">' + esc(tl('noown')) + '</p>';
      $$('[data-hdrm]', f).forEach(function (b) { b.addEventListener('click', function () { read(); own.splice(+b.getAttribute('data-hdrm'), 1); drawOwn(); }); });
    }
    function read() { own.forEach(function (c, i) { var n = $('#hd-n' + i, f), s = $('#hd-t' + i, f); if (n) c.name = n.value.trim(); if (s) c.t = s.value; }); }
    NSStore.meta('heads').then(function (m) {
      META = m && typeof m === 'object' ? m : { custom: [] };
      own = (META.custom || []).map(function (c) { return { name: c.name, t: c.t }; });
      H.setCustom(own);
      $('[data-hdlist]', f).innerHTML = readyTable();
      drawOwn();
    });
    $('[data-hdadd]', f).addEventListener('click', function () { read(); own.push({ name: '', t: 'iexp' }); drawOwn(); var n = $('#hd-n' + (own.length - 1), f); if (n) n.focus(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); read();
      var seen = {}, bad = '';
      own = own.filter(function (c) { return c.name; }).filter(function (c) {
        var k = H.key(c.name), r = H.find(c.name);
        if (seen[k]) return false; seen[k] = 1;
        if (r && !r.custom) { bad = bad || c.name; return false; }   /* a ready head of the same name: use it instead */
        return true;
      });
      META.custom = own.map(function (c) { return { name: c.name, t: c.t }; });
      NSStore.meta('heads', META).then(function () { H.setCustom(META.custom); drawOwn(); NS.toast(bad ? tl('isready', { h: bad }) : t('hub.setsaved')); });
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubtheme.js */
try{/* My data › Settings: "Look and feel" (colour pack, light / dark, spacing, text size) and "Print designs" (opens the App's screen).
   The picker itself is NSTheme.panel (engine/themes.js); the choice is kept with the other screen choices and follows the person
   to their other devices through the data home (meta prefs). English only (App screens). */
(function () {
  'use strict';
  var NS = window.NS; if (!NS) return;
  var $ = NS.$;
  function appHref() {
    var h = location.hostname, framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
    return (framed || /^app\./.test(h)) ? '/#pd' : 'https://app.niveshsahayak.in/#pd';
  }
  function settings() {
    return '<form class="set th-set" data-thset onsubmit="return false"><fieldset class="card"><legend>Look and feel</legend>' +
      '<p class="hint">Pick the colours, spacing and text size that suit you. It changes at once on every NSBiz screen on this device and follows you to your other devices.</p>' +
      '<div data-thpanel></div></fieldset></form>' +
      '<form class="set th-set" data-pdset onsubmit="return false"><fieldset class="card"><legend>Print designs</legend>' +
      '<p class="hint">Choose how your bills and documents look on paper: the design, the paper size and the colour, for each kind of document, with a preview made from your own business details.</p>' +
      '<p><a class="btn primary" href="' + appHref() + '" target="_top">Choose print designs</a></p></fieldset></form>';
  }
  function wireSettings(pane) {
    var box = $('[data-thpanel]', pane); if (box && NS.theme) NS.theme.panel(box);
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubstaff.js */
try{/* Employees in My data › Settings (my.niveshsahayak.in), through NS.hubExt (my.js); Accounts coverage WP-5.
   Shows the employee list kept in the data home (NSStaff, meta 'staff', filled by every saved salary slip and by the App's
   Staff, salary and loans screen) with their business, and opens the App to add or change them. */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, t = NS.t, S = window.NSStaff; if (!S) return;
  function F(k, v) { return t('sf.' + k, v); }
  var APP = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8985/' : 'https://app.niveshsahayak.in/';
  function settings() {
    return '<fieldset class="card sf-set" data-sfset><legend>' + esc(F('t_emp')) + '</legend><p class="hint">' + esc(F('myh')) + '</p><div data-sflist><p class="soft">…</p></div>' +
      '<p><a class="btn sm" href="' + APP + '#stf/emp" target="_blank" rel="noopener">' + esc(F('manage')) + ' ›</a></p></fieldset>';
  }
  function wireSettings(pane) {
    var box = $('[data-sflist]', pane); if (!box) return;
    S.list('').then(function (l) {
      box.innerHTML = l.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="l">' + esc(F('name')) + '</th><th class="l">' + esc(F('desig')) + '</th><th class="l">' + esc(F('biz')) + '</th><th class="l">' + esc(F('status')) + '</th></tr></thead><tbody>' +
        l.map(function (e) { return '<tr><th scope="row" class="l">' + esc(e.name) + '</th><td class="l">' + esc(e.desig || '') + '</td><td class="l">' + esc(e.biz || F('allbiz')) + '</td><td class="l">' + esc(e.left ? F('leftp', { d: NS.fmtDate(e.left) }) : F('working')) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="soft">' + esc(F('noemps')) + '</p>';
    });
  }
  (NS.hubExt = NS.hubExt || []).push({ settings: settings, wireSettings: wireSettings });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* mfghub.js */
try{/* Manufacturing extras in My data (my.niveshsahayak.in), through NS.hubExt (my.js):
     item form   "Second unit": alt { unit, per } = 1 alt unit holds per main units (1 Box = 12 Pcs). Bills, purchases and
                 stock entries may use either unit; the stock register (mfgcore.js) counts everything in the main unit. */
(function () {
  'use strict';
  var esc = NS.esc, t = NS.t;
  function form(s, r) {
    if (s !== 'item') return '';
    var a = r.alt || {};
    return '<fieldset class="card b2-sec"><legend>' + esc(t('mf.altt')) + '</legend><div class="fg">' +
      '<div class="f"><label for="mf-alt">' + esc(t('mf.alt')) + '</label><input id="mf-alt" name="mfalt" dir="auto" list="hub-units" autocomplete="off" value="' + esc(a.unit || '') + '"></div>' +
      '<div class="f"><label for="mf-per">' + esc(t('mf.altper')) + '</label><input id="mf-per" name="mfper" inputmode="decimal" dir="ltr" autocomplete="off" value="' + esc(a.per || '') + '"></div>' +
      '<div class="f wide"><small class="hint">' + esc(t('mf.alth')) + '</small></div></div></fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'item' || !f.elements.mfalt) return;
    var u = f.elements.mfalt.value.trim(), p = NS.num(f.elements.mfper.value);
    if (u && p > 0 && u.toLowerCase() !== String(r.unit || '').trim().toLowerCase()) r.alt = { unit: u, per: p }; else delete r.alt;
  }
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* fahub.js */
try{/* Type of business and partners in My data (my.niveshsahayak.in), through NS.hubExt (my.js); the App's final accounts read them
   (facore.js / famore.js):
     business form   btype 'prop' (proprietor, the default) | 'firm' (partnership firm) | 'llp' | 'co' (company) | 'npo' (trust or
                     society, non-profit, school); partners [{ name, share (profit share %), ic (interest on capital % a year),
                     sal (salary / remuneration a year) }] for a firm or LLP; apprMode 'deed' = interest and salary as per the deed even
                     in a loss (none = only out of profit, the default). */
(function () {
  'use strict';
  var esc = NS.esc, t = NS.t, $ = NS.$, $$ = NS.$$;
  var TYPES = ['prop', 'firm', 'llp', 'co', 'npo'];
  function row(p) {
    p = p || {};
    function inp(n, v, lbl, ltr) { return '<label><span>' + esc(t(lbl)) + '</span><input data-fmp="' + n + '" value="' + esc(v == null ? '' : v) + '"' + (ltr ? ' inputmode="decimal" dir="ltr"' : ' dir="auto"') + ' autocomplete="off"></label>'; }
    return '<div class="fm-prow" data-fmrow>' + inp('name', p.name, 'fm.p_name') + inp('share', p.share, 'fm.p_share', 1) + inp('ic', p.ic, 'fm.p_ic', 1) + inp('sal', p.sal, 'fm.p_sal', 1) +
      '<button type="button" class="btn sm" data-fmrm aria-label="' + esc(t('fm.p_rm')) + '">' + esc(t('fm.p_rm')) + '</button></div>';
  }
  function form(s, r) {
    if (s !== 'biz') return '';
    var bt = TYPES.indexOf(r.btype) >= 0 ? r.btype : 'prop', P = (r.partners || []).length ? r.partners : [{}, {}];
    return '<fieldset class="card b2-sec fm-biz"><legend>' + esc(t('fm.btype')) + '</legend><div class="fg">' +
      '<div class="f"><label for="fm-bt" class="vh">' + esc(t('fm.btype')) + '</label><select id="fm-bt" name="fmbtype" data-fmbt>' + TYPES.map(function (k) {
        return '<option value="' + k + '"' + (k === bt ? ' selected' : '') + '>' + esc(t('fm.b_' + k)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f wide"><small class="hint">' + esc(t('fm.btypeh')) + '</small></div></div>' +
      '<div data-fmparts' + (bt === 'firm' || bt === 'llp' ? '' : ' hidden') + '><h4>' + esc(t('fm.partners')) + '</h4><div data-fmlist>' + P.map(row).join('') + '</div>' +
      '<button type="button" class="btn sm" data-fmadd>' + esc(t('fm.p_add')) + '</button><small class="hint">' + esc(t('fm.p_h')) + '</small>' +
      '<div class="f wide"><label for="fm-appr">' + esc(t('fx.fm_mode')) + '</label><select id="fm-appr" name="fmappr">' +
        '<option value="profit"' + (r.apprMode !== 'deed' ? ' selected' : '') + '>' + esc(t('fx.fm_mprofit')) + '</option><option value="deed"' + (r.apprMode === 'deed' ? ' selected' : '') + '>' + esc(t('fx.fm_mdeed')) + '</option></select>' +
        '<small class="hint">' + esc(t('fx.fm_modeh')) + '</small></div></div></fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'biz' || !f.elements.fmbtype) return;
    var bt = f.elements.fmbtype.value;
    if (bt && bt !== 'prop') r.btype = bt; else delete r.btype;
    var P = $$('[data-fmrow]', f).map(function (el) {
      function v(n) { return $('[data-fmp="' + n + '"]', el).value.trim(); }
      return { name: v('name'), share: NS.num(v('share')), ic: NS.num(v('ic')), sal: NS.num(v('sal')) };
    }).filter(function (p) { return p.name; });
    if (bt === 'firm' || bt === 'llp') { if (P.length) r.partners = P; else delete r.partners; if (f.elements.fmappr && f.elements.fmappr.value === 'deed') r.apprMode = 'deed'; else delete r.apprMode; }   /* another type keeps the list, in case it is switched back */
  }
  /* add / remove partner rows and show them only for a firm or LLP (the form is drawn again on every open) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-fmadd],[data-fmrm]'); if (!a) return;
    var box = a.closest('.fm-biz'); if (!box) return;
    if (a.hasAttribute('data-fmadd')) { var l = $('[data-fmlist]', box); l.insertAdjacentHTML('beforeend', row({})); $('[data-fmrow]:last-child input', l).focus(); }
    else a.closest('[data-fmrow]').remove();
  });
  document.addEventListener('change', function (e) {
    var s = e.target; if (!s.hasAttribute || !s.hasAttribute('data-fmbt')) return;
    var p = $('[data-fmparts]', s.closest('.fm-biz')); if (p) p.hidden = !(s.value === 'firm' || s.value === 'llp');
  });
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* hubprices.js */
try{/* A party's own prices in My data (my.niveshsahayak.in), through NS.hubExt (my.js): plat-capture.
     party form   "Special prices": one line per item ("Cement OPC 53 = 380"). Saved as party.prices = [{ item, rate }].
                  The document makers and the App's purchase bill form use a party's rate first when the item is picked for that party
                  (customer: the rate on the sale; supplier: the rate on the purchase bill), before the item's own rates.
                  "Fill from the last bills" adds the rate each item had on that party's newest bills; lines already there are kept.
   Nothing is changed on bills already made. */
(function () {
  'use strict';
  var esc = NS.esc, t = NS.t, R = window.NSReuse;
  function form(s, r) {
    if (s !== 'party' || !R) return '';
    return '<fieldset class="card b2-sec"><legend>' + esc(t('cap.prices_t')) + '</legend><div class="fg">' +
      '<div class="f wide"><label for="pr-text">' + esc(t('cap.prices_l')) + '</label><textarea id="pr-text" name="pricestext" rows="5" dir="auto" autocomplete="off" placeholder="' + esc(t('cap.prices_ph')) + '">' + esc(R.pricesText(r.prices)) + '</textarea>' +
      '<small class="hint">' + esc(t('cap.prices_h')) + '</small></div>' +
      '<div class="f wide"><button type="button" class="btn sm" data-fillprices>' + esc(t('cap.prices_fill')) + '</button></div></div></fieldset>';
  }
  function read(s, r, f) {
    if (s !== 'party' || !f.elements.pricestext) return;
    var list = R.parsePrices(f.elements.pricestext.value);
    if (list.length) r.prices = list; else delete r.prices;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fillprices]'); if (!b || !R) return;
    var f = b.closest('form'), ta = f && f.elements.pricestext, nm = f && f.elements.name && f.elements.name.value.trim();
    if (!ta) return;
    if (!nm) { NS.toast(t('cap.prices_name'), 'bad'); return; }
    var side = f.elements.role && f.elements.role.value === 'supplier' ? 'buy' : 'sale';
    NSStore.list('doc').then(function (docs) {
      var have = R.parsePrices(ta.value), seen = {};
      have.forEach(function (x) { seen[R.key(x.item)] = 1; });
      var add = R.lastRates(docs, '', nm, side).filter(function (x) { return !seen[R.key(x.item)]; });
      if (!add.length && !have.length) { NS.toast(t('cap.prices_none'), 'bad'); return; }
      ta.value = R.pricesText(have.concat(add.map(function (x) { return { item: x.item, rate: x.rate }; })));
      NS.toast(t('cap.prices_filled', { n: add.length }));
    }).catch(function () { NS.toast(t('cap.prices_none'), 'bad'); });
  });
  (NS.hubExt = NS.hubExt || []).push({ form: form, read: read });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* xlimport.js */
try{/* Excel import in My data (my.niveshsahayak.in): items, customers and suppliers, and opening balances from ONE .xlsx.
   Blank template with sheets Items, Parties, Opening balances (English headers = the CSV headers of my.js, so a file works in any language).
   The file is read with SheetJS (same copy as extras.js NS.xlsx), every row is checked and shown first (GSTIN check digit, HSN digits,
   GST rate, names twice in the file), then "Import N rows" saves the good rows: a name already saved is updated, a new one is added.
   Opening balances become the App's own 'ob' documents (side recv | pay | cash | bank) for the default business; a second import of the
   same party and side replaces the amount instead of adding another one. Screen words: NS.t('xi.*'). */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, t = NS.t;
  var XL = ['/assets/vendor/xlsx-0.20.3.full.min.js', ''];   /* SheetJS 0.20.3 kept inside NSBiz (0.18.5 had CVE-2023-30533, CVE-2024-22363) */
  var RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];
  var OBCOLS = [['party', 'Party'], ['side', 'Type'], ['amount', 'Amount'], ['date', 'Date']];
  var SIDES = [['recv', /receiv|due to us|debtor|customer|recv|lena|^dr$/i], ['pay', /payab|we owe|creditor|supplier|pay|dena|^cr$/i], ['cash', /cash/i], ['bank', /bank/i]];
  var NUMS = { rate: 1, wrate: 1, mrp: 1, prate: 1, climit: 1, cdays: 1 };
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function hk(s) { return key(s).replace(/[^a-z0-9%]/g, ''); }
  function set(o, k, v) { var p = k.split('.'), last = p.pop(); p.forEach(function (x) { o = o[x] = o[x] && typeof o[x] === 'object' ? o[x] : {}; }); o[last] = v; }
  function cols(s) { return s === 'ob' ? OBCOLS : NS.hubCsv.cols[s]; }
  function fyStart() { return NS.fy(NS.today()).slice(0, 4) + '-04-01'; }

  /* ---------- template ---------- */
  function template() {
    var help = [['Sheet', 'What to type'],
      ['Items', 'One item or service a row. Name is needed. Type: Goods or Service. HSN/SAC: 4, 6 or 8 digits. GST %: 0, 0.25, 3, 5, 12, 18, 28 or 40. Group: any name (a new group is made).'],
      ['Parties', 'One customer or supplier a row. Name is needed. Type: Customer, Supplier or Both. GSTIN: 15 characters (state code is filled from it). State code: 2 digits, e.g. 03 for Punjab.'],
      ['Opening balances', 'Party: customer or supplier name (leave empty for Cash or Bank). Type: Receivable (they owe you), Payable (you owe them), Cash or Bank. Amount: more than 0. Date: the start date, e.g. 2026-04-01.'],
      ['', 'A name that is already saved is updated, a new name is added. Delete these help rows only if you like: this sheet is not read.']];
    var c = NS.hubCsv.cols;
    NS.xlsx('nivesh-sahayak-import-template.xlsx', [
      { name: 'Items', rows: [c.item.map(function (x) { return x[1]; })] },
      { name: 'Parties', rows: [c.party.map(function (x) { return x[1]; })] },
      { name: 'Opening balances', rows: [OBCOLS.map(function (x) { return x[1]; })] },
      { name: 'How to fill', rows: help }]);
  }

  /* ---------- read and check ---------- */
  function sheetOf(name) { var n = key(name); return /open|balance/.test(n) ? 'ob' : /item|product|service|stock/.test(n) ? 'item' : /part|customer|supplier|debtor|creditor|ledger/.test(n) ? 'party' : ''; }
  function cell(v) {
    if (v == null) return '';
    if (v instanceof Date) return v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0') + '-' + String(v.getDate()).padStart(2, '0');
    return String(v).trim();
  }
  function isoDate(v) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^\d{5}(\.\d+)?$/.test(v)) return new Date(Date.UTC(1899, 11, 30) + Math.round(+v) * 864e5).toISOString().slice(0, 10);
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v) || /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(v);
    if (!m) return null;
    var y = m[1].length === 4 ? m[1] : m[3], mo = m[2], d = m[1].length === 4 ? m[3] : m[1], out = y + '-' + mo.padStart(2, '0') + '-' + d.padStart(2, '0');
    return isNaN(new Date(out + 'T00:00:00')) ? null : out;
  }
  function readFile(file) {
    return NS.loadJs(XL[0], XL[1]).then(function () { return file.arrayBuffer(); }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: 'array' }), got = {};
      wb.SheetNames.forEach(function (n) {
        var s = sheetOf(n); if (!s || got[s]) return;
        got[s] = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }).map(function (r) { return r.map(cell); }).filter(function (r) { return r.some(Boolean); });
      });
      return got;
    });
  }
  /* rows of one sheet -> [{ line, rec, errs: [key, values], upd }] */
  function parse(s, rows, have, seen) {
    if (!rows || rows.length < 2) return [];
    var C = cols(s), head = rows[0].map(hk);
    var idx = C.map(function (c) {
      var i = head.indexOf(hk(c[1])); if (i < 0) i = head.indexOf(hk(c[0]));
      if (i < 0 && c[0] === 'cat') i = head.indexOf('category');
      if (i < 0 && c[0] === 'party') i = head.indexOf('name');
      return i;
    });
    var nameKey = s === 'item' ? 'desc' : s === 'ob' ? 'party' : 'name';
    return rows.slice(1).map(function (cells, n) {
      var r = {}, E = [], line = n + 2;
      C.forEach(function (c, j) { var v = idx[j] >= 0 ? cells[idx[j]] : ''; if (v !== '' && v != null) set(r, c[0], String(v).trim()); });
      if (s === 'ob') return obRow(r, line, E);
      var nm = key(r[nameKey]);
      if (!nm) { E.push(['noname']); return { line: line, rec: r, errs: E, s: s }; }
      if (seen[s + nm]) E.push(['twice', { row: seen[s + nm] }]); else seen[s + nm] = line;
      if (r.state) { var sc = NS.hubCsv.stateCode(r.state); if (!sc) E.push(['state', { v: r.state }]); r.state = sc; }
      if (r.ship && r.ship.state) r.ship.state = NS.hubCsv.stateCode(r.ship.state);
      if (r.gstin) {
        r.gstin = r.gstin.toUpperCase().replace(/\s/g, '');
        var g = NS.gstinCheck(r.gstin);
        if (!g.ok) E.push(['gstin', { g: r.gstin }]); else if (!r.state && g.state) r.state = g.state;
      }
      if (r.hsn) {
        r.hsn = r.hsn.replace(/\s/g, '');
        if (/^\d{3}$|^\d{5}$|^\d{7}$/.test(r.hsn)) r.hsn = '0' + r.hsn;   /* Excel drops the first 0 of 0401 */
        if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(r.hsn)) E.push(['hsn', { h: r.hsn }]);
      }
      if (r.gst != null) { r.gst = NS.num(String(r.gst).replace('%', '')); if (r.gst > 0 && r.gst < 1 && RATES.indexOf(r.gst) < 0) r.gst = Math.round(r.gst * 10000) / 100; if (RATES.indexOf(r.gst) < 0) E.push(['gst', { r: r.gst }]); }
      if (r.role) r.role = /supp/i.test(r.role) ? (/both|cust/i.test(r.role) ? 'both' : 'supplier') : /both/i.test(r.role) ? 'both' : 'customer';
      if (r.kind) r.kind = /serv/i.test(r.kind) ? 'service' : 'goods';
      if (r.ptype) r.ptype = /whole/i.test(r.ptype) ? 'wholesale' : 'retail';
      Object.keys(NUMS).forEach(function (k) { if (r[k] != null) { if (isNaN(NS.num(r[k])) || !/\d/.test(r[k])) E.push(['num', { v: r[k] }]); r[k] = NS.num(r[k]); } });
      return { line: line, rec: r, errs: E, s: s, upd: !!have[s][nm] };
    });
  }
  function obRow(r, line, E) {
    var side = '';
    SIDES.some(function (x) { if (x[1].test(r.side || '')) { side = x[0]; return true; } return false; });
    if (!side) E.push(['side', { v: r.side || '—' }]);
    var amt = NS.num(String(r.amount || '').replace(/[,₹\s]/g, ''));
    if (!(amt > 0)) E.push(['amt', { v: r.amount || '—' }]);
    var d = r.date ? isoDate(r.date) : fyStart();
    if (d === null) E.push(['date', { v: r.date }]);
    if ((side === 'recv' || side === 'pay') && !key(r.party)) E.push(['noparty']);
    return { line: line, rec: { party: side === 'cash' || side === 'bank' ? '' : String(r.party || '').trim(), side: side, amount: Math.round(amt * 100) / 100, date: d || '' }, errs: E, s: 'ob' };
  }

  /* ---------- the box ---------- */
  var DATA = null, rowsAll = [];
  function open() {
    var dlg = $('#hub-form'), f = $('form', dlg);
    $('[data-form-title]', dlg).textContent = t('xi.open');
    f.onsubmit = function (e) { e.preventDefault(); save(); };
    f.innerHTML = '<p class="soft">' + esc(t('xi.p')) + '</p>' +
      '<div class="btns xi-pick"><label class="btn primary" data-ic="up"><span>' + esc(t('xi.choose')) + '</span><input type="file" accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-xi-file hidden></label>' +
      '<button type="button" class="btn" data-xi-tpl>' + esc(t('xi.tpl')) + '</button></div>' +
      '<div data-xi-out aria-live="polite"></div>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary" data-xi-go disabled>' + esc(t('xi.go', { n: 0 })) + '</button><button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    $('[data-xi-tpl]', f).addEventListener('click', template);
    $('[data-xi-file]', f).addEventListener('change', function (e) { var fl = e.target.files[0]; if (fl) pick(fl, f); e.target.value = ''; });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  }
  function pick(file, f) {
    var out = $('[data-xi-out]', f);
    out.innerHTML = '<p class="soft">' + esc(t('st.load')) + '</p>';
    Promise.all([readFile(file), NSStore.list('party'), NSStore.list('item'), NSStore.list('doc'), NSStore.list('biz'), NSStore.meta('settings')]).then(function (x) {
      var got = x[0], have = { party: {}, item: {} };
      x[1].forEach(function (p) { have.party[key(p.name)] = p; });
      x[2].forEach(function (i) { have.item[key(i.desc)] = i; });
      var S = x[5] || {}, biz = x[4].filter(function (b) { return b.id === S.defBiz; })[0] || x[4][0] || null;
      DATA = { have: have, party: x[1], item: x[2], doc: x[3], biz: biz };
      var seen = {};
      rowsAll = ['item', 'party', 'ob'].reduce(function (a, s) { return a.concat(parse(s, got[s], have, seen)); }, []);
      if (!biz) rowsAll.forEach(function (r) { if (r.s === 'ob') r.errs.push(['nobiz']); });
      if (!rowsAll.length) { out.innerHTML = '<p class="callout">' + esc(t('xi.empty')) + '</p>'; go(f, 0); return; }
      draw(out, biz);
      go(f, rowsAll.filter(function (r) { return !r.errs.length; }).length);
    }).catch(function (e) { out.innerHTML = '<p class="callout">' + esc(t('xi.unread')) + '</p>'; console.error(e); go(f, 0); });
  }
  function go(f, n) { var b = $('[data-xi-go]', f); b.disabled = !n; b.textContent = t('xi.go', { n: n }); }
  function draw(out, biz) {
    var by = { item: [], party: [], ob: [] };
    rowsAll.forEach(function (r) { by[r.s].push(r); });
    var bad = rowsAll.filter(function (r) { return r.errs.length; }).length;
    var h = '<p><b>' + esc(t('xi.found', { i: by.item.length, p: by.party.length, o: by.ob.length })) + '</b>' + (bad ? ' <span class="pill bad">' + esc(t('xi.nbad', { n: bad })) + '</span>' : ' <span class="pill ok">' + esc(t('xi.allok')) + '</span>') + '</p>' +
      (by.ob.length && biz ? '<p class="soft">' + esc(t('xi.obfor', { b: biz.name })) + '</p>' : '');
    ['item', 'party', 'ob'].forEach(function (s) {
      if (!by[s].length) return;
      h += '<h3 class="xi-h">' + esc(t('xi.s.' + s)) + '</h3><div class="xi-tw"><table class="xi-t"><thead><tr><th>' + esc(t('xi.row')) + '</th><th>' + esc(t('xi.name')) + '</th><th>' + esc(t('xi.what')) + '</th></tr></thead><tbody>' +
        by[s].map(function (r) {
          var nm = s === 'item' ? r.rec.desc : s === 'ob' ? (r.rec.party || (r.rec.side ? t('xi.ob.' + r.rec.side) : '—')) + (r.rec.amount ? ' · ' + NS.money(r.rec.amount, false) : '') : r.rec.name;
          var what = r.errs.length ? r.errs.map(function (e) { return t('xi.e.' + e[0], e[1]); }).join(' ') : t(s === 'ob' ? 'xi.ob.' + r.rec.side : r.upd ? 'xi.upd' : 'xi.new');
          return '<tr class="' + (r.errs.length ? 'bad' : '') + '"><td class="n">' + r.line + '</td><td dir="auto">' + esc(nm || '—') + '</td><td>' + (r.errs.length ? '✕ ' : '✓ ') + esc(what) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    });
    out.innerHTML = h;
  }

  /* ---------- save ---------- */
  function groupsFor(recs) {
    /* party Group / item Group names -> group ids; names not known yet become new groups (like the CSV import) */
    var need = recs.filter(function (r) { return r.s === 'party' && r.rec.group || r.s === 'item' && r.rec.cat; });
    if (!need.length) return Promise.resolve();
    return NSStore.meta('groups').then(function (m) {
      m = m && typeof m === 'object' ? m : {}; m.party = m.party || []; m.item = m.item || [];
      var n = 0, made = 0;
      need.forEach(function (r) {
        var kind = r.s, nm = String(kind === 'item' ? r.rec.cat : r.rec.group).trim(), k = key(nm);
        if (kind === 'party') {
          var role = r.rec.role || (DATA.have.party[key(r.rec.name)] || {}).role || 'customer';
          if (/^(customers?|sundry debtors|debtors)$/.test(k)) { delete r.rec.group; return; }
          if (/^(suppliers?|sundry creditors|creditors)$/.test(k)) { delete r.rec.group; return; }
          var g = m.party.filter(function (x) { return key(x.name) === k; })[0];
          if (!g) { g = { id: 'g' + Date.now().toString(36) + (n++), name: nm, under: role === 'supplier' ? 'creditors' : 'debtors' }; m.party.push(g); made++; }
          r.rec.group = g.id;
        } else {
          var gi = m.item.filter(function (x) { return key(x.name) === k; })[0];
          if (!gi) { gi = { id: 'g' + Date.now().toString(36) + (n++), name: nm, under: '' }; m.item.push(gi); made++; }
          r.rec.group = gi.id; r.rec.cat = gi.name;
        }
      });
      return made ? NSStore.meta('groups', m) : null;
    });
  }
  function save() {
    var ok = rowsAll.filter(function (r) { return !r.errs.length; });
    if (!ok.length || !DATA) return;
    var f = $('#hub-form form'), b = $('[data-xi-go]', f); b.disabled = true;
    var biz = DATA.biz, seller = biz ? JSON.parse(JSON.stringify(biz)) : null;
    if (seller) { delete seller.id; delete seller.created; delete seller.updated; }
    var add = 0, upd = 0, ob = 0, partyRoles = {};
    groupsFor(ok).then(function () {
      var jobs = [];
      ok.forEach(function (r) {
        if (r.s === 'ob') { if (r.rec.party) partyRoles[key(r.rec.party)] = { name: r.rec.party, role: r.rec.side === 'pay' ? 'supplier' : 'customer' }; return; }
        var nm = key(r.s === 'item' ? r.rec.desc : r.rec.name), cur = DATA.have[r.s][nm];
        if (cur) { Object.keys(r.rec).forEach(function (k) { if (k === 'ship') cur.ship = Object.assign(cur.ship || {}, r.rec.ship); else cur[k] = r.rec[k]; }); jobs.push([r.s, cur]); upd++; }
        else { var rec = r.rec; if (r.s === 'party' && !rec.role) rec.role = 'customer'; if (r.s === 'item' && !rec.kind) rec.kind = 'goods'; DATA.have[r.s][nm] = rec; jobs.push([r.s, rec]); add++; }
      });
      /* a party named only in Opening balances: add it, or make a customer also a supplier when needed */
      Object.keys(partyRoles).forEach(function (k) {
        var want = partyRoles[k], cur = DATA.have.party[k];
        if (!cur) { cur = DATA.have.party[k] = { name: want.name, role: want.role }; jobs.push(['party', cur]); add++; }
        else if (cur.role && cur.role !== want.role && cur.role !== 'both') { cur.role = 'both'; if (!jobs.some(function (j) { return j[1] === cur; })) jobs.push(['party', cur]); }
      });
      ok.forEach(function (r) {
        if (r.s !== 'ob') return;
        var old = DATA.doc.filter(function (d) { return d.type === 'ob' && d.side === r.rec.side && key(d.seller && d.seller.name) === key(biz.name) && key(d.buyer && d.buyer.name) === key(r.rec.party); })[0];
        var d = Object.assign(old || { type: 'ob', app: 1 }, { date: r.rec.date, seller: seller, buyer: { name: r.rec.party }, side: r.rec.side, amount: r.rec.amount, total: r.rec.amount, no: '' });
        jobs.push(['doc', d]); ob++;
      });
      return jobs.reduce(function (p, j) { return p.then(function () { return NSStore.put(j[0], j[1]); }); }, Promise.resolve());
    }).then(function () {
      $('#hub-form').close();
      NS.toast(t('xi.done', { a: add, u: upd, o: ob }));
      document.dispatchEvent(new CustomEvent('ns-data'));
    }).catch(function (err) { b.disabled = false; NS.toast(t('nosave', { e: err.message }), 'bad'); });
  }

  /* a card in the Backup section too (the masters lists have their own button) */
  NS.hubBackupExt = (NS.hubBackupExt || []).concat([function (pane) {
    var x = $('[data-backup-ext]', pane) || pane, c = NS.el('div', { 'class': 'card' });
    c.innerHTML = '<h3>' + esc(t('xi.open')) + '</h3><p class="soft">' + esc(t('xi.p')) + '</p><div class="btns"><button type="button" class="btn" data-xlimp data-ic="up">' + esc(t('xi.open')) + '</button></div>';
    x.insertBefore(c, x.firstChild);
  }]);
  NS.xlImport = { open: open, template: template, parse: parse, isoDate: isoDate };
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* importcore.js */
try{/* NSImport: bring data in from other billing software (Vyapar, myBillBook, Busy, Tally, any Excel sheet). Pure functions, no screen.
   Input is a table (rows of cells, from CSV or Excel) or a Tally XML export. Nothing here saves anything.
   csvRows(text)            CSV text -> rows (BOM, comma / semicolon / tab / pipe, quotes, merged lines)
   tallyXml(text)           Tally's XML export of masters -> { tables: { party, item, bill }, skipped } (same row model as a sheet)
   detect(rows)             which kind of list it is and where the headings are -> { kind, header, heads, sub, score }
   headings(rows, header)   the heading texts, a two-row heading (group row above, names below) joined
   autoMap(heads, kind)     { field: column index } by what the heading says
   build(kind, rows, header, map, opts) -> checked rows { line, rec, errs: [[code, vars]], warns: [...] }
   plan(tables, existing, opts) -> what would be saved: parties, items, opening balances (ob), opening stock, counts
   Layouts: no vendor's export is matched by its brand. Headings are matched by their words (Party Name, Opening Balance, HSN, GST %, ...),
   the user can correct every column on the mapping screen. Tally's XML structure is read from Tally's documented import format. */
(function (G) {
  'use strict';
  var deps = { gstin: null, stateCode: null, today: function () { return new Date().toISOString().slice(0, 10); } };

  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function hk(s) { return key(s).replace(/[^a-z0-9%]/g, ''); }
  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  /* ---------- text -> rows ---------- */
  function csvRows(txt) {
    txt = String(txt || '').replace(/^﻿/, '');
    var lines = txt.split(/\r\n|\n|\r/).slice(0, 12), best = ',', bc = -1;
    [',', ';', '\t', '|'].forEach(function (sp) {
      var c = lines.reduce(function (a, l) { var q = false, n = 0; for (var i = 0; i < l.length; i++) { if (l[i] === '"') q = !q; else if (!q && l[i] === sp) n++; } return a + n; }, 0);
      if (c > bc) { bc = c; best = sp; }
    });
    var rows = [], row = [], cell = '', inq = false, i, c;
    for (i = 0; i < txt.length; i++) {
      c = txt[i];
      if (inq) { if (c === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else inq = false; } else cell += c; }
      else if (c === '"' && cell === '') inq = true;
      else if (c === best) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim(); }); });
  }

  /* ---------- numbers and dates ---------- */
  /* 1,23,456.50  ₹ 1,200  (500)  500-  1200 Dr  3.5 Cr  1234,50 (decimal comma) -> { n, side: 'dr' | 'cr' | '' } or null when it is not a number */
  function money(v) {
    if (typeof v === 'number') return isFinite(v) ? { n: v, side: '' } : null;
    var s = String(v == null ? '' : v).trim(); if (!s) return null;
    var side = '', m = /\b(dr|cr)\b\.?\s*$/i.exec(s) || /^(dr|cr)\b\.?\s*/i.exec(s);
    if (m) { side = m[1].toLowerCase(); s = s.replace(m[0], ''); }
    s = s.replace(/[₹\s]|rs\.?|inr/gi, '');
    var neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    if (/-$/.test(s)) { neg = true; s = s.slice(0, -1); }
    if (/^-/.test(s)) { neg = !neg; s = s.slice(1); }
    if (/^\+/.test(s)) s = s.slice(1);
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');   /* decimal comma */
    else s = s.replace(/,/g, '');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var n = parseFloat(s); if (!isFinite(n)) return null;
    return { n: neg ? -n : n, side: side };
  }
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  /* '' = empty, null = not a date, else yyyy-mm-dd. Day first (Indian), 2-digit years, month names, Excel serial numbers, Tally's 20260401 */
  function date(v) {
    if (v instanceof Date) return isNaN(v) ? null : v.getFullYear() + '-' + p2(v.getMonth() + 1) + '-' + p2(v.getDate());
    var s = String(v == null ? '' : v).trim(); if (!s) return '';
    var y, mo, d, m;
    if ((m = /^(\d{4})(\d{2})(\d{2})$/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if (/^\d{5}(\.\d+)?$/.test(s) && +s > 20000 && +s < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(+s) * 864e5).toISOString().slice(0, 10);
    else if ((m = /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = /^(\d{1,2})[\/.\-\s]([A-Za-z]{3})[a-z]*[\/.\-\s,]*(\d{2,4})$/.exec(s))) { d = +m[1]; mo = MON[m[2].toLowerCase()]; y = +m[3]; }
    else if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else return null;
    if (y < 100) y += y < 70 ? 2000 : 1900;
    if (!mo || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
    var dt = new Date(Date.UTC(y, mo - 1, d)); if (dt.getUTCMonth() !== mo - 1) return null;
    return y + '-' + p2(mo) + '-' + p2(d);
  }

  /* ---------- GSTIN (the same check-digit test as NS.gstinCheck) ---------- */
  function gstinCheck(g) {
    if (deps.gstin) return deps.gstin(g);
    g = String(g || '').toUpperCase().replace(/\s/g, '');
    if (!g) return { ok: true, empty: true };
    if (!/^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false };
    var C = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', sum = 0;
    for (var i = 0; i < 14; i++) { var v = C.indexOf(g[i]) * (i % 2 ? 2 : 1); sum += Math.floor(v / 36) + (v % 36); }
    if (C[(36 - (sum % 36)) % 36] !== g[14]) return { ok: false };
    return { ok: true, state: g.slice(0, 2) };
  }

  /* ---------- what a heading says ---------- */
  var FIELDS = {
    party: {
      name: ['partyname', 'name', 'customername', 'suppliername', 'ledgername', 'accountname', 'nameofparty', 'party', 'customer', 'supplier', 'ledger', 'accname', 'companyname', 'firmname', 'displayname', 'billingname', 'vendorname', 'vendor', 'clientname', 'client', 'accountsname', 'nameoftheparty'],
      gstin: ['gstin', 'gstinuin', 'gstnumber', 'gstno', 'gstinno', 'partygstin', 'gstinnumber', 'gstuin', 'gstregistrationnumber', 'gstidentificationnumber', 'gstin/uin', 'gst'],
      phone: ['phone', 'phoneno', 'phonenumber', 'mobile', 'mobileno', 'mobilenumber', 'contactno', 'contactnumber', 'contact', 'whatsapp', 'telephone', 'mob', 'cellno', 'phoneno.', 'mobileno.'],
      email: ['email', 'emailid', 'emailaddress', 'mail', 'e-mail'],
      addr: ['address', 'billingaddress', 'address1', 'addressline1', 'street', 'addr', 'location', 'billingaddr', 'addressline'],
      city: ['city', 'town', 'district'],
      pin: ['pin', 'pincode', 'zip', 'zipcode', 'postalcode', 'pinzip'],
      state: ['state', 'statecode', 'placeofsupply', 'statename', 'billingstate'],
      type: ['type', 'partytype', 'role', 'category', 'group', 'ledgergroup', 'parentgroup', 'under', 'accountgroup', 'partygroup', 'partycategory', 'ledgerunder'],
      open: ['openingbalance', 'opening', 'openingbal', 'balance', 'currentbalance', 'outstanding', 'closingbalance', 'openingamount', 'tocollect', 'topay', 'receivable', 'payable', 'dues', 'balanceamount', 'amount', 'openbalance', 'openingbalanceamount', 'obalance', 'outstandingbalance', 'currentbal'],
      baltype: ['balancetype', 'opentype', 'drcr', 'baltype', 'crdr', 'openingbalancetype', 'dr/cr', 'cr/dr', 'openingdrcr', 'balancedrcr', 'openingtype', 'balancetypedrcr'],
      opendr: ['debit', 'dr', 'drbalance', 'openingdebit', 'debitbalance', 'debitamount', 'tocollectamount'],
      opencr: ['credit', 'cr', 'crbalance', 'openingcredit', 'creditbalance', 'creditamount', 'topayamount']
    },
    item: {
      desc: ['itemname', 'name', 'productname', 'item', 'product', 'description', 'itemdescription', 'particulars', 'stockitem', 'stockitemname', 'goodsname', 'nameofitem', 'servicename', 'itemsname', 'productsname', 'nameofproduct', 'materialname', 'material', 'productdescription'],
      code: ['itemcode', 'code', 'sku', 'productcode', 'barcode', 'itemid', 'partno', 'productid', 'itemno'],
      hsn: ['hsn', 'hsncode', 'hsnsac', 'hsnsaccode', 'sac', 'saccode', 'hsnsacno', 'hsn/sac', 'hsn/saccode', 'hsnno', 'hsncodes'],
      unit: ['unit', 'uom', 'unitofmeasure', 'primaryunit', 'baseunit', 'units', 'measuringunit', 'unitname', 'unitofmeasurement'],
      gst: ['gst', 'gstrate', 'gstpercent', 'gst%', 'taxrate', 'tax', 'igst', 'igstrate', 'gstper', 'taxpercent', 'tax%', 'gstrateinpercent', 'gstpercentage', 'rateofgst', 'gstrate%', 'gst(%)', 'taxrate%'],
      rate: ['saleprice', 'sellingprice', 'salerate', 'rate', 'price', 'sellprice', 'salesprice', 'retailprice', 'sp', 'sellingrate', 'salepriceincltax', 'saleprice(inctax)', 'salesrate', 'unitprice', 'mrpprice'],
      prate: ['purchaseprice', 'purchaserate', 'buyingprice', 'costprice', 'cost', 'cp', 'purchasecost', 'buyprice', 'purchasepriceinctax', 'purchaseprice(inctax)', 'costrate', 'buyingrate'],
      mrp: ['mrp', 'maxretailprice', 'maximumretailprice'],
      wrate: ['wholesaleprice', 'wholesalerate', 'wholesale'],
      cat: ['category', 'itemcategory', 'group', 'itemgroup', 'stockgroup', 'productcategory', 'under', 'parentgroup', 'itemsgroup', 'categoryname'],
      kind: ['itemtype', 'type', 'producttype', 'goodsorservice', 'productservice', 'goods/service', 'nature'],
      qty: ['openingstock', 'openingquantity', 'openingqty', 'stock', 'currentstock', 'stockqty', 'quantity', 'qty', 'closingstock', 'stockquantity', 'currentquantity', 'openingstockqty', 'openingstockquantity', 'stockinhand', 'qtyinhand', 'availablestock', 'onhand', 'balanceqty'],
      stockvalue: ['openingstockvalue', 'stockvalue', 'openingvalue', 'value', 'stockvalueamount', 'totalvalue', 'closingvalue', 'openingstockamount', 'stockamount', 'valueofstock', 'openingstockvalue(inctax)']
    },
    bill: {
      party: ['partyname', 'name', 'customername', 'suppliername', 'party', 'customer', 'supplier', 'ledgername', 'accountname', 'vendorname', 'nameofparty'],
      no: ['invoiceno', 'invoicenumber', 'billno', 'billnumber', 'refno', 'reference', 'voucherno', 'vchno', 'invoice', 'bill', 'ref', 'referenceno', 'billref', 'invno', 'refnumber', 'vouchernumber', 'invoiceref', 'billrefno', 'transactionno'],
      date: ['date', 'invoicedate', 'billdate', 'billdt', 'vchdate', 'voucherdate', 'refdate', 'invdate', 'transactiondate'],
      amount: ['pendingamount', 'pending', 'outstanding', 'balance', 'dueamount', 'due', 'balanceamount', 'amountdue', 'amount', 'pendingbalance', 'openingamount', 'outstandingamount', 'balancedue', 'unpaidamount', 'pendingbal', 'openingbalance'],
      total: ['billamount', 'invoiceamount', 'totalamount', 'total', 'invoicevalue', 'billvalue', 'originalamount', 'invoicetotal'],
      baltype: ['balancetype', 'drcr', 'baltype', 'crdr', 'openingbalancetype', 'dr/cr', 'cr/dr', 'type', 'side', 'partytype', 'tocollectorpay', 'openingdrcr'],
      due: ['duedate', 'dueon', 'duedt']
    }
  };
  var LABEL = {
    party: { name: 'Party name', gstin: 'GSTIN', phone: 'Phone', email: 'Email', addr: 'Address', city: 'City', pin: 'PIN code', state: 'State', type: 'Customer or supplier', open: 'Opening balance', baltype: 'Balance type (Dr/Cr, To collect/To pay)', opendr: 'Debit amount', opencr: 'Credit amount' },
    item: { desc: 'Item name', code: 'Item code', hsn: 'HSN/SAC', unit: 'Unit', gst: 'GST %', rate: 'Sale price', prate: 'Purchase price', mrp: 'MRP', wrate: 'Wholesale price', cat: 'Group', kind: 'Goods or service', qty: 'Opening stock (quantity)', stockvalue: 'Opening stock value' },
    bill: { party: 'Party name', no: 'Bill number', date: 'Bill date', amount: 'Pending amount', total: 'Bill amount', baltype: 'Receivable or payable (Dr/Cr)', due: 'Due date' }
  };
  var NAMEF = { party: 'name', item: 'desc', bill: 'party' };
  var SETS = {};
  Object.keys(FIELDS).forEach(function (k) { SETS[k] = {}; Object.keys(FIELDS[k]).forEach(function (f) { SETS[k][f] = FIELDS[k][f].map(hk); }); });

  function matchField(kind, h) { var out = []; if (!h) return out; Object.keys(SETS[kind]).forEach(function (f) { if (SETS[kind][f].indexOf(h) >= 0) out.push(f); }); return out; }
  function rowScore(kind, row) {
    var seen = {}, n = 0;
    row.forEach(function (c) { var h = hk(c); if (!h || money(c)) return; matchField(kind, h).forEach(function (f) { if (!seen[f]) { seen[f] = 1; n++; } }); });
    return n;
  }
  /* kinds are told apart by the fields only one of them has (bill number, HSN, opening stock, GSTIN ...) */
  var HINT = { bill: ['no', 'due', 'total'], item: ['hsn', 'unit', 'rate', 'prate', 'qty', 'mrp', 'code', 'stockvalue', 'gst'], party: ['gstin', 'phone', 'email', 'addr', 'city', 'pin', 'state', 'open', 'type'] };
  function kindScores(row) {
    var heads = row.map(hk), sc = {};
    ['party', 'item', 'bill'].forEach(function (k) {
      var hit = {}, hint = 0;
      heads.forEach(function (h) { matchField(k, h).forEach(function (f) { hit[f] = 1; }); });
      var n = Object.keys(hit).length; if (!hit[NAMEF[k]]) n = Math.min(n, 1);
      HINT[k].forEach(function (f) { if (hit[f]) hint++; });
      sc[k] = n + (k === 'bill' ? hint * 0.4 : hint * 0.1);
    });
    return sc;
  }
  /* find the heading row among the first 30 rows; title rows and blank rows above it are skipped */
  function detect(rows, wantKind) {
    var best = null, i;
    for (i = 0; i < Math.min(rows.length, 30); i++) {
      var row = rows[i]; if (row.filter(function (c) { return String(c).trim(); }).length < 2) continue;
      var sc = kindScores(row);
      Object.keys(sc).forEach(function (k) {
        if (wantKind && k !== wantKind) return;
        if (sc[k] >= 2 && (!best || sc[k] > best.score + 0.01)) best = { kind: k, header: i, score: sc[k] };
      });
    }
    if (!best) return null;
    var lower = rows[best.header + 1], upper = rows[best.header - 1];
    best.sub = false;
    /* two-row heading: group names above, field names below */
    if (lower && lower.some(function (c) { return String(c).trim(); }) && !lower.some(function (c) { return money(c) && String(c).trim() !== ''; })) {
      var s1 = rowScore(best.kind, lower);
      if (s1 >= 1 && rows[best.header].some(function (c, j) { return !String(c).trim() && String(lower[j] || '').trim(); })) best.sub = true;
    }
    best.heads = headings(rows, best.header, best.sub);
    return best;
  }
  /* heading texts per column; with a two-row heading both rows are joined (the group name carried to the right over merged cells) */
  function headings(rows, header, sub) {
    var h = (rows[header] || []).map(function (c) { return String(c == null ? '' : c).trim(); });
    if (!sub) return h;
    var low = rows[header + 1] || [], up = h, carry = '', w = Math.max(up.length, low.length), out = [];
    for (var j = 0; j < w; j++) {
      if (String(up[j] || '').trim()) carry = String(up[j]).trim(); else if (String(low[j] || '').trim() === '') carry = '';
      var l = String(low[j] == null ? '' : low[j]).trim();
      out.push(l && carry && carry !== l ? carry + ' ' + l : l || carry);
    }
    return out;
  }
  /* column per field. When a joined two-row heading names nothing, the lower heading alone is tried (plain "Name") */
  function autoMap(heads, kind, rows, header) {
    var map = {}, used = {};
    function take(f, j) { if (map[f] == null && !used[j]) { map[f] = j; used[j] = 1; } }
    var order = Object.keys(SETS[kind]);
    /* an exact, specific word first (Opening Balance before the general "balance"); the first column wins */
    order.forEach(function (f) {
      heads.forEach(function (h, j) { var x = hk(h); if (x && SETS[kind][f].indexOf(x) >= 0 && SETS[kind][f].indexOf(x) < Math.ceil(SETS[kind][f].length / 2)) take(f, j); });
    });
    order.forEach(function (f) { heads.forEach(function (h, j) { var x = hk(h); if (x && SETS[kind][f].indexOf(x) >= 0) take(f, j); }); });
    /* the last word of a joined heading ("Party Details Name") */
    if (rows && header != null) {
      var low = rows[header + 1] || [];
      order.forEach(function (f) { if (map[f] == null) low.forEach(function (c, j) { var x = hk(c); if (x && !used[j] && SETS[kind][f].indexOf(x) >= 0) take(f, j); }); });
    }
    return map;
  }

  /* ---------- Tally XML (masters export) ---------- */
  function unent(s) { return String(s == null ? '' : s).replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&#4;/g, '').trim(); }
  function blocks(txt, tag) {
    var out = [], re = new RegExp('<' + tag + '(\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'g'), m;
    while ((m = re.exec(txt))) out.push({ attr: m[1] || '', body: m[2] });
    return out;
  }
  function one(body, tag) { var m = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>').exec(body); return m ? unent(m[1].replace(/<[^>]+>/g, '')) : ''; }
  function nameAttr(attr) { var m = /NAME="([^"]*)"/.exec(attr); return m ? unent(m[1]) : ''; }
  /* a file's bytes as text: Tally writes UTF-16 with a byte-order mark; Excel's CSV may be UTF-8 with a BOM or old Windows-1252 */
  function decode(buf) {
    var u = buf instanceof Uint8Array ? buf : new Uint8Array(buf), enc = 'utf-8';
    if (u[0] === 0xFF && u[1] === 0xFE) enc = 'utf-16le'; else if (u[0] === 0xFE && u[1] === 0xFF) enc = 'utf-16be';
    else if (u.length > 3 && u[1] === 0 && u[3] === 0 && u[0] !== 0) enc = 'utf-16le';
    var txt = new TextDecoder(enc).decode(u);
    if (enc === 'utf-8' && txt.indexOf('�') >= 0) { try { txt = new TextDecoder('windows-1252').decode(u); } catch (e) {} }
    return txt.replace(/^﻿/, '');
  }
  function tallyXml(txt) {
    var party = [], item = [], bill = [], skipped = 0, n;
    /* group chain: a ledger under a group of your own (e.g. Transporter under Sundry Creditors) still counts as a creditor */
    var gp = {}; blocks(txt, 'GROUP').forEach(function (g) { var gn = nameAttr(g.attr) || one(g.body, 'NAME'); if (gn) gp[gn] = one(g.body, 'PARENT'); });
    function root(p) { for (var i = 0; i < 12 && p; i++) { if (/^sundry\s*(debtor|creditor)s?$/i.test(p)) return p; p = gp[p]; } return ''; }
    blocks(txt, 'LEDGER').forEach(function (b) {
      var nm = nameAttr(b.attr) || one(b.body, 'NAME'), parent = root(one(b.body, 'PARENT'));
      if (!parent) { skipped++; return; }
      var own = b.body.replace(/<BILLALLOCATIONS\.LIST(\s[^>]*)?>[\s\S]*?<\/BILLALLOCATIONS\.LIST>/g, '');   /* the ledger's own fields, not those inside its bill lists */
      var ob = one(own, 'OPENINGBALANCE'), mo = money(ob), addr = blocks(b.body, 'ADDRESS').map(function (a) { return unent(a.body); }).filter(Boolean).join(', ');
      /* in Tally's XML a debit balance (the party owes you) is written with a minus sign, a credit balance without */
      var sd = mo && mo.n ? (mo.n < 0 ? 'Dr' : 'Cr') : '';
      party.push([nm, one(own, 'PARTYGSTIN') || one(own, 'GSTIN'), one(own, 'LEDGERPHONE') || one(own, 'LEDGERMOBILE'), one(own, 'EMAIL') || one(own, 'LEDGEREMAIL'), addr, '', one(own, 'PINCODE'), one(own, 'LEDSTATENAME') || one(own, 'STATENAME'), parent, mo ? Math.abs(mo.n) : '', sd]);
      blocks(b.body, 'BILLALLOCATIONS.LIST').forEach(function (a) {
        var ref = nameAttr(a.attr) || one(a.body, 'NAME'), am = money(one(a.body, 'OPENINGBALANCE')); if (!am || !am.n) return;
        bill.push([nm, ref, one(a.body, 'BILLDATE'), Math.abs(am.n), am.n < 0 ? 'Dr' : 'Cr']);
      });
    });
    blocks(txt, 'STOCKITEM').forEach(function (b) {
      var nm = nameAttr(b.attr) || one(b.body, 'NAME'); if (!nm) return;
      var ob = one(b.body, 'OPENINGBALANCE'), q = /^\s*(-?[\d,.]+)\s*(.*)$/.exec(ob) || [], hsn = one(b.body, 'HSNCODE'), gst = '';
      var rd = blocks(b.body, 'RATEDETAILS.LIST'), ig = rd.filter(function (x) { return /IGST/i.test(one(x.body, 'GSTRATEDUTYHEAD')); })[0];
      if (ig) gst = one(ig.body, 'GSTRATE'); else if (rd.length) gst = String(rd.reduce(function (a, x) { return a + (/CGST|SGST/i.test(one(x.body, 'GSTRATEDUTYHEAD')) ? (money(one(x.body, 'GSTRATE')) || { n: 0 }).n : 0); }, 0) || '');
      var ov = money(one(b.body, 'OPENINGVALUE'));
      item.push([nm, '', hsn || one(b.body, 'HSNMASTERNAME'), one(b.body, 'BASEUNITS') || (q[2] || '').trim(), gst, '', '', one(b.body, 'PARENT') && !/primary/i.test(one(b.body, 'PARENT')) ? one(b.body, 'PARENT') : '', q[1] ? Math.abs(money(q[1]).n) : '', ov ? Math.abs(ov.n) : '']);
    });
    var T = {};
    if (party.length) T.party = { heads: ['Party name', 'GSTIN', 'Phone', 'Email', 'Address', 'City', 'PIN code', 'State', 'Group', 'Opening balance', 'Balance type'], rows: party };
    if (item.length) T.item = { heads: ['Item name', 'Item code', 'HSN/SAC', 'Unit', 'GST %', 'Sale price', 'Purchase price', 'Group', 'Opening stock', 'Opening stock value'], rows: item };
    if (bill.length) T.bill = { heads: ['Party name', 'Bill number', 'Bill date', 'Pending amount', 'Dr/Cr'], rows: bill };
    return { tables: T, skipped: skipped, found: party.length + item.length };
  }

  /* ---------- check the rows of one list ---------- */
  var RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];
  function cellOf(cells, map, f) { var j = map[f]; if (j == null || j < 0) return ''; var v = cells[j]; return v == null ? '' : (typeof v === 'number' ? v : String(v).trim()); }
  function isTotalRow(name) { return /^(grand\s*)?total\b|^sub\s*total|^closing\s*balance|^opening\s*balance$|^net\s+(total|balance)|^report\b|^page\s+\d|^printed\b|^as\s+on\b/i.test(String(name).trim()); }
  function phoneFix(v) {
    var d = String(v == null ? '' : v).replace(/\.0+$/, '').replace(/\D/g, '');
    if (d.length === 12 && /^91/.test(d)) d = d.slice(2); if (d.length === 11 && /^0/.test(d)) d = d.slice(1);
    return d;
  }
  function stateOf(v) { return deps.stateCode ? deps.stateCode(v) : (/^\d{1,2}$/.test(String(v)) ? p2(+v) : ''); }
  function roleOf(v, dflt) { var s = key(v); if (!s) return dflt; if (/supp|creditor|vendor|payable|to pay/.test(s)) return /both|cust/.test(s) ? 'both' : 'supplier'; if (/both/.test(s)) return 'both'; if (/cust|debtor|client|receiv|collect/.test(s)) return 'customer'; return dflt; }

  /* opts: header (row index), sub (two-row heading), role (default for parties), dropBadGstin, asOf (date of opening balances) */
  function build(kind, rows, header, map, opts) {
    opts = opts || {};
    var out = [], seen = {}, nameF = NAMEF[kind], start = header + 1 + (opts.sub ? 1 : 0);
    rows.slice(start).forEach(function (cells, n) {
      var line = start + n + 1, E = [], W = [], rec = {};
      if (!cells.some(function (c) { return String(c == null ? '' : c).trim(); })) return;
      var name = String(cellOf(cells, map, nameF)).trim();
      if (!name) { var other = Object.keys(map).some(function (f) { return f !== nameF && String(cellOf(cells, map, f)).trim(); }); if (!other) return; return out.push({ line: line, kind: kind, rec: {}, errs: [['noname']], warns: [], skip: true }); }
      if (isTotalRow(name)) return;
      if (kind === 'party') party(cells, map, name, rec, E, W, opts);
      else if (kind === 'item') item(cells, map, name, rec, E, W, opts);
      else bill(cells, map, name, rec, E, W, opts);
      var k = kind + '|' + key(name) + (kind === 'bill' ? '|' + key(rec.no) : '');
      if (seen[k]) E.push(['twice', { row: seen[k], name: name }]); else seen[k] = line;
      out.push({ line: line, kind: kind, rec: rec, errs: E, warns: W });
    });
    return out;
  }
  function party(cells, map, name, rec, E, W, opts) {
    rec.name = name;
    var g = String(cellOf(cells, map, 'gstin')).toUpperCase().replace(/\s/g, ''), gs = null;
    if (g && !/^(NA|N\/A|NIL|UNREGISTERED|URD|-+)$/.test(g)) {
      gs = gstinCheck(g);
      if (!gs.ok) { if (opts.dropBadGstin) W.push(['gstinDropped', { g: g }]); else E.push(['gstin', { g: g }]); }
      else rec.gstin = g;
    }
    var ph = phoneFix(cellOf(cells, map, 'phone')); if (ph) { rec.phone = ph; if (ph.length !== 10) W.push(['phone', { p: ph }]); }
    var em = String(cellOf(cells, map, 'email')); if (em) { if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) rec.email = em; else W.push(['email', { e: em }]); }
    ['addr', 'city'].forEach(function (f) { var v = String(cellOf(cells, map, f)); if (v) rec[f] = v; });
    var pin = String(cellOf(cells, map, 'pin')).replace(/\.0+$/, '').replace(/\D/g, ''); if (pin) { if (/^\d{6}$/.test(pin)) rec.pin = pin; else W.push(['pin', { p: pin }]); }
    var st = cellOf(cells, map, 'state'); if (st !== '') { var sc = stateOf(st); if (sc) rec.state = sc; else W.push(['state', { v: st }]); }
    if (!rec.state && gs && gs.ok && gs.state) rec.state = gs.state;
    var tv = cellOf(cells, map, 'type'); rec.role = roleOf(tv, opts.role || 'customer');
    if (tv !== '' && !roleOf(tv, '')) rec._grp = String(tv);
    /* opening balance: side from Dr/Cr text, a balance-type column, debit / credit columns, else from the party's role and the sign */
    var ob = null, bt = String(cellOf(cells, map, 'baltype')), dr = money(cellOf(cells, map, 'opendr')), cr = money(cellOf(cells, map, 'opencr')), o = money(cellOf(cells, map, 'open'));
    var raw = cellOf(cells, map, 'open');
    if (raw !== '' && !o) W.push(['num', { v: raw }]);
    if (o && o.n) {
      var side = o.side || (/\bdr\b|collect|receiv|debit/i.test(bt) ? 'dr' : /\bcr\b|pay|credit/i.test(bt) ? 'cr' : '');
      var amt = o.n, recv;
      if (side) { recv = side === 'dr'; if (amt < 0) { recv = !recv; W.push(['neg', { v: Math.abs(amt) }]); } }
      else { recv = rec.role === 'supplier' ? false : true; if (opts.balMode === 'pay') recv = !recv; if (amt < 0) { recv = !recv; W.push(['neg', { v: Math.abs(amt) }]); } }
      ob = { side: recv ? 'recv' : 'pay', amount: r2(Math.abs(amt)) };
    } else if ((dr && dr.n) || (cr && cr.n)) {
      var d = dr ? dr.n : 0, c = cr ? cr.n : 0, net = d - c;
      if (net) ob = { side: net > 0 ? 'recv' : 'pay', amount: r2(Math.abs(net)) };
    }
    if (ob) {
      if (ob.side === 'pay' && rec.role === 'customer') W.push(['advance', { v: ob.amount }]);
      if (ob.side === 'recv' && rec.role === 'supplier') W.push(['supadv', { v: ob.amount }]);
      rec._ob = ob;
    }
    if (!rec.gstin) W.push(['nogstin']);
  }
  function item(cells, map, name, rec, E, W) {
    rec.desc = name;
    var hsn = String(cellOf(cells, map, 'hsn')).replace(/\.0+$/, '').replace(/[\s.\-]/g, '');
    if (hsn) {
      if (/^\d{3}$|^\d{5}$|^\d{7}$/.test(hsn)) hsn = '0' + hsn;
      if (/^\d{4}$|^\d{6}$|^\d{8}$/.test(hsn)) rec.hsn = hsn; else E.push(['hsn', { h: hsn }]);
    } else W.push(['nohsn']);
    var u = String(cellOf(cells, map, 'unit')); if (u) rec.unit = u;
    var c = String(cellOf(cells, map, 'code')); if (c) rec.code = c;
    var cat = String(cellOf(cells, map, 'cat')); if (cat && !/^(primary|general|none|default|-+)$/i.test(cat)) rec.cat = cat;
    var kv = key(cellOf(cells, map, 'kind')); rec.kind = /serv/.test(kv) ? 'service' : 'goods';
    var gv = cellOf(cells, map, 'gst');
    if (gv !== '') {
      var gm = money(String(gv).replace(/%/g, '').replace(/\bigst\b|\bgst\b/gi, ''));
      if (!gm) W.push(['gst', { r: gv }]);
      else { var g = gm.n; if (g > 0 && g < 1 && RATES.indexOf(g) < 0) g = r2(g * 100); if (RATES.indexOf(g) < 0) W.push(['gst', { r: g }]); else rec.gst = g; }
    }
    [['rate', 'rate'], ['prate', 'prate'], ['mrp', 'mrp'], ['wrate', 'wrate']].forEach(function (p) {
      var v = cellOf(cells, map, p[0]); if (v === '') return; var m = money(v);
      if (!m) E.push(['num', { v: v }]); else if (m.n < 0) E.push(['negprice', { v: v }]); else rec[p[1]] = r2(m.n);
    });
    var q = money(cellOf(cells, map, 'qty')), sv = money(cellOf(cells, map, 'stockvalue'));
    if (cellOf(cells, map, 'qty') !== '' && !q) W.push(['num', { v: cellOf(cells, map, 'qty') }]);
    if (q && q.n) {
      if (q.n < 0) W.push(['negstock', { v: q.n }]);
      else {
        var cost = rec.prate || (sv && sv.n > 0 ? r2(sv.n / q.n) : 0);
        rec._stk = { desc: name, unit: rec.unit || '', qty: Math.round(q.n * 1000) / 1000, rate: cost };
        if (!cost) W.push(['nocost']);
      }
    }
  }
  function bill(cells, map, name, rec, E, W, opts) {
    rec.party = name; rec.no = String(cellOf(cells, map, 'no'));
    var d = date(cellOf(cells, map, 'date'));
    if (d === null) { E.push(['date', { v: cellOf(cells, map, 'date') }]); d = ''; }
    rec.date = d;
    var a = money(cellOf(cells, map, 'amount')) || money(cellOf(cells, map, 'total'));
    if (!a || !a.n) { E.push(['amt', { v: cellOf(cells, map, 'amount') || '—' }]); return; }
    var bt = String(cellOf(cells, map, 'baltype')), side = a.side || (/\bdr\b|collect|receiv|debit|customer|debtor/i.test(bt) ? 'dr' : /\bcr\b|pay|credit|supplier|creditor/i.test(bt) ? 'cr' : ''), recv;
    if (side) recv = side === 'dr'; else recv = opts.billSide !== 'pay';
    if (a.n < 0) { recv = !recv; W.push(['neg', { v: Math.abs(a.n) }]); }
    rec.side = recv ? 'recv' : 'pay'; rec.amount = r2(Math.abs(a.n));
    if (!rec.no) W.push(['nobillno']);
  }

  /* ---------- what would be saved ---------- */
  /* tables: { party: rows[], item: rows[], bill: rows[] } of build() output. existing: { party: {key: rec}, item: {key: rec}, ob: [docs] }.
     Rows with errors are left out; a name that is already saved is left as it is (never overwritten). */
  function plan(tables, existing, opts) {
    opts = opts || {}; existing = existing || {};
    var have = { party: existing.party || {}, item: existing.item || {} }, asOf = opts.asOf || deps.today().slice(0, 4) + '-04-01';
    var P = [], I = [], OB = [], STK = [], rowsOut = [], c = { party: 0, item: 0, ob: 0, stock: 0, skip: 0, bad: 0, warn: 0, exists: 0 };
    var partyByKey = {}, bills = tables.bill || [], hasBill = {};
    bills.forEach(function (r) { if (!r.errs.length) hasBill[key(r.rec.party) + '|' + r.rec.side] = 1; });
    var obSeen = {};
    function addOb(name, side, amount, refs, role) {
      var k = key(name) + '|' + side;
      if (obSeen[k]) { obSeen[k].amount = r2(obSeen[k].amount + amount); if (refs) obSeen[k].refs = obSeen[k].refs.concat(refs); return; }
      var dup = (existing.ob || []).some(function (d) { return key(d.buyer && d.buyer.name) === key(name) && d.side === side; });
      if (dup) { c.exists++; return 'exists'; }
      obSeen[k] = { party: name, side: side, amount: amount, date: asOf, refs: refs || [] }; OB.push(obSeen[k]); c.ob++;
      if (!have.party[key(name)] && !partyByKey[key(name)]) { var np = { name: name, role: side === 'pay' ? 'supplier' : 'customer' }; partyByKey[key(name)] = np; P.push(np); c.party++; rowsOut.push({ s: 'party', line: 0, rec: np, errs: [], warns: [['fromBill']], status: 'new' }); }
    }
    (tables.party || []).forEach(function (r) {
      var o = { s: 'party', line: r.line, rec: r.rec, errs: r.errs, warns: r.warns.slice() };
      rowsOut.push(o);
      if (r.skip || r.errs.length) { o.status = 'bad'; c.bad++; return; }
      var k = key(r.rec.name);
      if (have.party[k]) { o.status = 'exists'; c.exists++; } else {
        var rec = Object.assign({}, r.rec); delete rec._ob; delete rec._grp;
        P.push(rec); partyByKey[k] = rec; c.party++; o.status = 'new';
      }
      if (r.rec._ob && !hasBill[k + '|' + r.rec._ob.side]) { var res = addOb(r.rec.name, r.rec._ob.side, r.rec._ob.amount, null); if (res === 'exists') o.warns.push(['obExists']); }
      else if (r.rec._ob) o.warns.push(['billsWin']);
    });
    (tables.item || []).forEach(function (r) {
      var o = { s: 'item', line: r.line, rec: r.rec, errs: r.errs, warns: r.warns.slice() }; rowsOut.push(o);
      if (r.skip || r.errs.length) { o.status = 'bad'; c.bad++; return; }
      var k = key(r.rec.desc);
      if (have.item[k]) { o.status = 'exists'; c.exists++; return; }
      var rec = Object.assign({}, r.rec), stk = rec._stk; delete rec._stk;
      I.push(rec); c.item++; o.status = 'new';
      if (stk) { STK.push(stk); c.stock++; }
    });
    var byPS = {};
    bills.forEach(function (r) {
      var o = { s: 'bill', line: r.line, rec: r.rec, errs: r.errs, warns: r.warns.slice() }; rowsOut.push(o);
      if (r.skip || r.errs.length) { o.status = 'bad'; c.bad++; return; }
      var k = key(r.rec.party) + '|' + r.rec.side; o.status = 'new';
      (byPS[k] = byPS[k] || { party: r.rec.party, side: r.rec.side, amount: 0, refs: [] });
      byPS[k].amount = r2(byPS[k].amount + r.rec.amount); byPS[k].refs.push({ no: r.rec.no, date: r.rec.date, amount: r.rec.amount });
    });
    Object.keys(byPS).forEach(function (k) { var b = byPS[k]; addOb(b.party, b.side, b.amount, b.refs); });
    rowsOut.forEach(function (o) { if (o.warns.length && o.status !== 'bad') c.warn++; });
    c.skip = c.exists;
    return { rows: rowsOut, parties: P, items: I, obs: OB, stock: STK, asOf: asOf, counts: c };
  }

  var API = { decode: decode, csvRows: csvRows, money: money, date: date, key: key, hk: hk, gstinCheck: gstinCheck, tallyXml: tallyXml, detect: detect, headings: headings, autoMap: autoMap, build: build, plan: plan, FIELDS: FIELDS, LABEL: LABEL, NAMEF: NAMEF, matchField: matchField,
    setDeps: function (d) { Object.keys(d || {}).forEach(function (k) { deps[k] = d[k]; }); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.NSImport = API;
})(this);

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* switchimp.js */
try{/* Switch-over import in My data: "Bring in my data from other billing software" (Vyapar, myBillBook, Busy, Tally, any Excel sheet).
   Reads an Excel / CSV file or a Tally XML export in the browser (nothing is uploaded), shows how each column was understood (the user can change it,
   and the choice is remembered), a preview with counts and problems, and saves only after the user confirms.
   Parsing and checking: engine/importcore.js (NSImport). Saves parties, items, opening balances (the App's 'ob' records, summed per party from
   outstanding bills when the file has them) and opening stock (one 'stk' open record). The last import can be undone with one tap: its ids are kept in
   meta 'lastImport' and only those records are removed. Screen words: NS.t('sw.*'). */
(function () {
  'use strict';
  var $ = NS.$, esc = NS.esc, t = NS.t, I = window.NSImport;
  var XL = ['/assets/vendor/xlsx-0.20.3.full.min.js', ''];   /* SheetJS 0.20.3 kept inside NSBiz (0.18.5 had CVE-2023-30533, CVE-2024-22363) */
  var MAPKEY = 'ns-imp-maps', KINDS = ['party', 'item', 'bill'];
  var ST = null;   /* { lists, opts, have, biz, plan, done } */
  function key(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }
  function fyStart() { return NS.fy(NS.today()).slice(0, 4) + '-04-01'; }
  function mem() { try { return JSON.parse(localStorage.getItem(MAPKEY) || '{}'); } catch (e) { return {}; } }
  function remember(l) {
    if (!l.kind) return;
    try { var m = mem(); m[l.kind + '|' + sig(l)] = { header: l.header, sub: l.sub, map: l.map }; localStorage.setItem(MAPKEY, JSON.stringify(m)); } catch (e) {}
  }
  function sig(l) { return I.hk(l.heads.join('|')); }

  /* ---------- reading the file ---------- */
  function lists(rows, name) {
    var d = I.detect(rows); if (!d) return null;
    var l = { name: name, rows: rows, kind: d.kind, header: d.header, sub: d.sub, heads: d.heads };
    return setup(l);
  }
  function setup(l) {
    l.heads = I.headings(l.rows, l.header, l.sub);
    var saved = mem()[l.kind + '|' + sig(l)];
    if (saved) { l.map = saved.map; l.remembered = true; } else { l.map = I.autoMap(l.heads, l.kind, l.rows, l.header); l.remembered = false; }
    return l;
  }
  function readFile(file) {
    var nm = file.name || '';
    if (/\.(csv|txt|tsv)$/i.test(nm)) return file.arrayBuffer().then(function (b) { var L = lists(I.csvRows(I.decode(b)), nm); return L ? [L] : []; });
    if (/\.xml$/i.test(nm)) return file.arrayBuffer().then(function (b) { return fromTally(I.decode(b)); });
    return NS.loadJs(XL[0], XL[1]).then(function () { return file.arrayBuffer(); }).then(function (buf) {
      var head = I.decode(new Uint8Array(buf.slice(0, 400)));
      if (/<ENVELOPE|<TALLYMESSAGE|<\?xml/i.test(head)) return fromTally(I.decode(buf));
      var wb = window.XLSX.read(buf, { type: 'array' }), out = [];
      wb.SheetNames.forEach(function (n) {
        var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }).map(function (r) { return r.map(function (c) { return c == null ? '' : c; }); });   /* blank rows kept: row numbers match Excel */
        var L = lists(rows, n); if (L) out.push(L);
      });
      return out;
    });
  }
  function fromTally(x) {
    var tx = I.tallyXml(x), out = [];
    KINDS.forEach(function (k) { var T = tx.tables[k]; if (!T) return; var rows = [T.heads].concat(T.rows); out.push(setup({ name: 'Tally: ' + k, rows: rows, kind: k, header: 0, sub: false, heads: T.heads })); });
    if (out.length) out.tally = tx.skipped;
    return out;
  }

  /* ---------- the checks ---------- */
  function compute() {
    var o = ST.opts, tables = { party: [], item: [], bill: [] };
    ST.lists.forEach(function (l) {
      if (!l.kind || l.off) return;
      var rows = I.build(l.kind, l.rows, l.header, l.map, { sub: l.sub, role: o.role, dropBadGstin: o.dropBad, billSide: o.billSide });
      tables[l.kind] = tables[l.kind].concat(rows);
    });
    var have = ST.have;
    ST.plan = I.plan(tables, have, { asOf: o.asOf });
    ST.noBiz = !ST.biz && (ST.plan.obs.length || ST.plan.stock.length);
  }

  /* ---------- screen ---------- */
  function open() {
    var dlg = $('#hub-form'), f = $('form', dlg);
    I.setDeps({ gstin: NS.gstinCheck, stateCode: NS.hubCsv && NS.hubCsv.stateCode, today: NS.today });
    ST = null;
    $('[data-form-title]', dlg).textContent = t('sw.title');
    f.onsubmit = function (e) { e.preventDefault(); save(); };
    f.innerHTML = '<p class="soft">' + esc(t('sw.p')) + '</p>' +
      '<div class="btns xi-pick"><label class="btn primary" data-ic="up"><span>' + esc(t('sw.choose')) + '</span><input type="file" accept=".xlsx,.xls,.ods,.csv,.txt,.tsv,.xml" data-sw-file hidden></label></div>' +
      '<p class="soft sw-how">' + esc(t('sw.how')) + '</p>' +
      '<div data-sw-last></div><div data-sw-out aria-live="polite"></div>' +
      '<div class="dlg-foot"><button type="submit" class="btn primary" data-sw-go disabled>' + esc(t('sw.go')) + '</button><button type="button" class="btn" data-close>' + esc(t('my.cancel')) + '</button></div>';
    $('[data-close]', f).addEventListener('click', function () { dlg.close(); });
    $('[data-sw-file]', f).addEventListener('change', function (e) { var fl = e.target.files[0]; if (fl) pick(fl, f); e.target.value = ''; });
    f.addEventListener('change', onChange);
    f.addEventListener('click', function (e) { if (e.target.closest('[data-sw-undo]')) undo(); });
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    lastCard(f);
  }
  function lastCard(f) {
    NSStore.meta('lastImport').then(function (li) {
      var box = $('[data-sw-last]', f); if (!box) return;
      box.innerHTML = li && li.ids ? '<div class="callout sw-last"><b>' + esc(t('sw.lastq', { p: li.ids.party.length, i: li.ids.item.length, d: li.ids.doc.length, on: NS.fmtDate(li.on) })) + '</b> <button type="button" class="btn sm" data-sw-undo>' + esc(t('sw.undo')) + '</button></div>' : '';
    });
  }
  function pick(file, f) {
    var out = $('[data-sw-out]', f);
    out.innerHTML = '<p class="soft">' + esc(t('st.load')) + '</p>';
    Promise.all([readFile(file), NSStore.list('party'), NSStore.list('item'), NSStore.list('doc'), NSStore.list('biz'), NSStore.meta('settings')]).then(function (x) {
      var ls = x[0], S = x[5] || {}, biz = x[4].filter(function (b) { return b.id === S.defBiz; })[0] || x[4][0] || null, have = { party: {}, item: {}, ob: [] };
      x[1].forEach(function (p) { have.party[key(p.name)] = p; }); x[2].forEach(function (i) { have.item[key(i.desc)] = i; });
      have.ob = x[3].filter(function (d) { return d.type === 'ob' && biz && key(d.seller && d.seller.name) === key(biz.name); });
      if (!ls.length) { ST = null; out.innerHTML = '<p class="callout">' + esc(t('sw.none')) + '</p>'; go(f); return; }
      ST = { lists: ls, have: have, biz: biz, file: file.name, tally: ls.tally || 0, opts: { role: 'customer', billSide: 'recv', dropBad: false, asOf: fyStart() } };
      compute(); drawAll(out); go(f);
    }).catch(function (e) { ST = null; out.innerHTML = '<p class="callout">' + esc(t('sw.unread')) + '</p>'; console.error(e); go(f); });
  }
  function go(f) {
    var b = $('[data-sw-go]', f), n = ST && ST.plan ? ST.plan.parties.length + ST.plan.items.length + ST.plan.obs.length + (ST.plan.stock.length ? 1 : 0) : 0;
    b.disabled = !n || (ST && ST.noBiz); b.textContent = t('sw.go') + (n ? ' (' + n + ')' : '');
  }
  function drawAll(out) {
    var h = '<p><b>' + esc(t('sw.file', { f: ST.file })) + '</b></p>' + (ST.tally ? '<p class="soft">' + esc(t('sw.tallyskip', { n: ST.tally })) + '</p>' : '') + '<div data-sw-lists>' + ST.lists.map(listHtml).join('') + '</div>' + optsHtml() + '<div data-sw-prev></div>';
    out.innerHTML = h; drawPrev();
  }
  function kindSel(l, i) {
    return '<select data-sw-kind="' + i + '"><option value="">' + esc(t('sw.skip')) + '</option>' + KINDS.map(function (k) { return '<option value="' + k + '"' + (l.kind === k && !l.off ? ' selected' : '') + '>' + esc(t('sw.k.' + k)) + '</option>'; }).join('') + '</select>';
  }
  function listHtml(l, i) {
    var sample = l.rows[l.header + 1 + (l.sub ? 1 : 0)] || [];
    return '<details class="sw-list card"' + (l.remembered || !l.kind ? '' : ' open') + ' data-sw-l="' + i + '"><summary><b dir="auto">' + esc(l.name) + '</b> · ' + kindSel(l, i) + (l.remembered ? ' <span class="pill ok">' + esc(t('sw.remembered')) + '</span>' : '') + ' <span class="soft">' + esc(t('sw.nrows', { n: Math.max(0, l.rows.length - l.header - 1 - (l.sub ? 1 : 0)) })) + '</span></summary>' +
      (l.kind ? '<div class="sw-ctl"><label>' + esc(t('sw.hdrrow')) + ' <input type="number" min="1" max="' + Math.min(l.rows.length, 60) + '" value="' + (l.header + 1) + '" data-sw-hdr="' + i + '"></label> <label class="tcheck"><input type="checkbox" data-sw-sub="' + i + '"' + (l.sub ? ' checked' : '') + '> ' + esc(t('sw.sub')) + '</label></div>' +
        '<div class="sw-map">' + Object.keys(I.FIELDS[l.kind]).map(function (f) {
          var cur = l.map[f], need = f === I.NAMEF[l.kind];
          return '<label class="sw-f' + (need ? ' req' : '') + '"><span>' + esc(t('sw.f.' + f)) + (need ? ' *' : '') + '</span><select data-sw-f="' + i + ':' + f + '"><option value="">' + esc(t('sw.nocol')) + '</option>' +
            l.heads.map(function (h, j) { return h ? '<option value="' + j + '"' + (cur === j ? ' selected' : '') + ' dir="auto">' + esc(h + (sample[j] !== undefined && String(sample[j]) !== '' ? '  (' + String(sample[j]).slice(0, 20) + ')' : '')) + '</option>' : ''; }).join('') + '</select></label>';
        }).join('') + '</div>' : '') + '</details>';
  }
  function optsHtml() {
    var o = ST.opts;
    return '<div class="sw-opts card"><label>' + esc(t('sw.o.asof')) + ' <input type="date" data-sw-o="asOf" value="' + o.asOf + '"></label>' +
      '<label>' + esc(t('sw.o.role')) + ' <select data-sw-o="role"><option value="customer"' + (o.role === 'customer' ? ' selected' : '') + '>' + esc(t('hub.r.customer')) + '</option><option value="supplier"' + (o.role === 'supplier' ? ' selected' : '') + '>' + esc(t('hub.r.supplier')) + '</option></select></label>' +
      '<label>' + esc(t('sw.o.bside')) + ' <select data-sw-o="billSide"><option value="recv"' + (o.billSide === 'recv' ? ' selected' : '') + '>' + esc(t('xi.ob.recv')) + '</option><option value="pay"' + (o.billSide === 'pay' ? ' selected' : '') + '>' + esc(t('xi.ob.pay')) + '</option></select></label>' +
      '<label class="tcheck"><input type="checkbox" data-sw-o="dropBad"' + (o.dropBad ? ' checked' : '') + '> ' + esc(t('sw.o.dropbad')) + '</label></div>';
  }
  function onChange(e) {
    if (!ST) return;
    var el = e.target, a;
    if ((a = el.getAttribute('data-sw-kind')) != null) { var l = ST.lists[+a]; if (!el.value) l.off = true; else { l.off = false; if (l.kind !== el.value) { l.kind = el.value; l.map = I.autoMap(l.heads, l.kind, l.rows, l.header); l.remembered = false; } } rerender(+a); }
    else if ((a = el.getAttribute('data-sw-hdr')) != null) { var l2 = ST.lists[+a]; l2.header = Math.max(0, Math.min(l2.rows.length - 1, (+el.value || 1) - 1)); setup(l2); rerender(+a); }
    else if ((a = el.getAttribute('data-sw-sub')) != null) { var l3 = ST.lists[+a]; l3.sub = el.checked; setup(l3); rerender(+a); }
    else if ((a = el.getAttribute('data-sw-f')) != null) { var p = a.split(':'), l4 = ST.lists[+p[0]]; if (el.value === '') delete l4.map[p[1]]; else l4.map[p[1]] = +el.value; l4.remembered = false; }
    else if ((a = el.getAttribute('data-sw-o')) != null) { ST.opts[a] = el.type === 'checkbox' ? el.checked : el.value; if (a === 'asOf' && !el.value) ST.opts.asOf = fyStart(); }
    else return;
    compute(); drawPrev(); go(el.closest('form'));
  }
  function rerender(i) {
    var box = $('[data-sw-l="' + i + '"]'); if (!box) return;
    var wrap = document.createElement('div'); wrap.innerHTML = listHtml(ST.lists[i], i);
    var nw = wrap.firstChild; nw.open = true; box.replaceWith(nw);
  }
  function drawPrev() {
    var P = ST.plan, c = P.counts, box = $('[data-sw-prev]'); if (!box) return;
    var recv = 0, pay = 0; P.obs.forEach(function (o) { if (o.side === 'recv') recv += o.amount; else pay += o.amount; });
    var h = '<div class="tiles sw-tiles">' + [['party', P.parties.length], ['item', P.items.length], ['ob', P.obs.length], ['stock', P.stock.length]].map(function (x) { return '<div class="tile"><span>' + esc(t('sw.t.' + x[0])) + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div>';
    if (P.obs.length) h += '<p class="soft">' + esc(t('sw.obsum', { r: NS.money(recv), p: NS.money(pay), d: NS.fmtDate(P.asOf) })) + '</p>';
    if (c.exists) h += '<p class="soft">' + esc(t('sw.exists', { n: c.exists })) + '</p>';
    if (ST.noBiz) h += '<p class="callout">' + esc(t('xi.e.nobiz')) + '</p>';
    var probs = P.rows.filter(function (r) { return r.errs.length || r.warns.length; });
    h += '<p><b>' + (c.bad ? '<span class="pill bad">' + esc(t('sw.nbad', { n: c.bad })) + '</span>' : '<span class="pill ok">' + esc(t('sw.allok')) + '</span>') + '</b>' + (c.warn ? ' <span class="pill">' + esc(t('sw.nwarn', { n: c.warn })) + '</span>' : '') + '</p>';
    if (probs.length) {
      h += '<div class="xi-tw"><table class="xi-t"><thead><tr><th>' + esc(t('xi.row')) + '</th><th>' + esc(t('xi.name')) + '</th><th>' + esc(t('xi.what')) + '</th></tr></thead><tbody>' +
        probs.slice(0, 200).map(function (r) {
          var nm = r.rec.name || r.rec.desc || r.rec.party || '—', msgs = r.errs.map(function (e) { return '✕ ' + t('sw.e.' + e[0], e[1]); }).concat(r.warns.map(function (w) { return '! ' + t('sw.w.' + w[0], w[1]); }));
          return '<tr class="' + (r.errs.length ? 'bad' : '') + '"><td class="n">' + (r.line || '') + '</td><td dir="auto">' + esc(nm) + '</td><td>' + esc(msgs.join(' ')) + '</td></tr>';
        }).join('') + '</tbody></table></div>' + (probs.length > 200 ? '<p class="soft">' + esc(t('sw.more', { n: probs.length - 200 })) + '</p>' : '');
    }
    box.innerHTML = h;
  }

  /* ---------- save (only after the user pressed Import) ---------- */
  function sellerCopy() { var s = JSON.parse(JSON.stringify(ST.biz)); delete s.id; delete s.created; delete s.updated; return s; }
  function save() {
    if (!ST || !ST.plan || ST.noBiz) return;
    var P = ST.plan, f = $('#hub-form form'), b = $('[data-sw-go]', f); b.disabled = true;
    var ids = { party: [], item: [], doc: [] }, jobs = [];
    P.parties.forEach(function (r) { jobs.push(['party', r]); });
    P.items.forEach(function (r) { r.kind = r.kind || 'goods'; jobs.push(['item', r]); });
    P.obs.forEach(function (o) { jobs.push(['doc', { type: 'ob', app: 1, date: o.date, seller: sellerCopy(), buyer: { name: o.party }, side: o.side, amount: o.amount, total: o.amount, no: '', refs: o.refs && o.refs.length ? o.refs : undefined, imported: 1 }]); });
    if (P.stock.length) jobs.push(['doc', { type: 'stk', kind: 'open', app: 1, date: P.asOf, no: 'OS/import', note: t('sw.stknote'), seller: sellerCopy(), lines: P.stock, imported: 1 }]);
    var made = [];
    jobs.reduce(function (p, j) { return p.then(function () { return NSStore.put(j[0], j[1]).then(function (rec) { ids[j[0]].push(rec.id); made.push(j[0] + ':' + rec.id); }); }); }, Promise.resolve())
      .then(function () { return NSStore.meta('lastImport', { on: NS.today(), file: ST.file, ids: ids }); })
      .then(function () {
        ST.lists.forEach(remember);
        $('#hub-form').close();
        NS.toast(t('sw.done', { p: ids.party.length, i: ids.item.length, d: ids.doc.length }));
        document.dispatchEvent(new CustomEvent('ns-data'));
      }).catch(function (err) {
        /* something failed half-way: what was already saved is kept as the "last import" so one tap removes it */
        NSStore.meta('lastImport', { on: NS.today(), file: ST.file, ids: ids }).catch(function () {});
        b.disabled = false; NS.toast(t('nosave', { e: err.message }), 'bad');
      });
  }
  function undo() {
    NSStore.meta('lastImport').then(function (li) {
      if (!li || !li.ids) return;
      var n = li.ids.party.length + li.ids.item.length + li.ids.doc.length;
      return (NS.ask ? NS.ask(t('sw.undoq', { n: n }), { danger: true }) : Promise.resolve(confirm(t('sw.undoq', { n: n })))).then(function (ok) {
        if (!ok) return;
        var jobs = []; ['party', 'item', 'doc'].forEach(function (s) { li.ids[s].forEach(function (id) { jobs.push([s, id]); }); });
        return jobs.reduce(function (p, j) { return p.then(function () { return NSStore.del(j[0], j[1], { hard: true }).catch(function () {}); }); }, Promise.resolve())
          .then(function () { return NSStore.meta('lastImport', null); })
          .then(function () { NS.toast(t('sw.undone', { n: n })); var d = $('#hub-form'); if (d && d.open) d.close(); document.dispatchEvent(new CustomEvent('ns-data')); });
      });
    });
  }

  NS.hubBackupExt = (NS.hubBackupExt || []).concat([function (pane) {
    var x = $('[data-backup-ext]', pane) || pane, c = NS.el('div', { 'class': 'card' });
    c.innerHTML = '<h3>' + esc(t('sw.title')) + '</h3><p class="soft">' + esc(t('sw.p')) + '</p><div class="btns"><button type="button" class="btn" data-swimp data-ic="up">' + esc(t('sw.open')) + '</button></div>';
    x.insertBefore(c, x.firstChild);
  }]);
  NS.swImport = { open: open, undo: undo };
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* usagecore.js */
try{/* Weekly usage report, the pure part (NSUsage): reads what the owner gets out of the Cloudflare Web Analytics dashboard (a CSV, a JSON, or a table
   pasted as text) and works out the week-on-week report. No network, no storage; scripts/test_usage.js checks it.
   There is NO free API that needs no login for this: the data comes from the owner's own dashboard or the owner's own API token, never from us.
   Rows: { date: 'YYYY-MM-DD' or '', host, path, visits, views }. Visits = a person's visit (Cloudflare counts a visit per referrer session),
   views = page views. A file with only one of them is used for both. */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;

  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[,\s]/g, '').replace(/%$/, '')); return isFinite(n) ? n : 0; }
  function splitUrl(u) {
    u = String(u || '').trim();
    var m = /^(?:https?:)?\/\/([^\/?#]+)([^?#]*)/i.exec(u);
    if (m) return { host: m[1].toLowerCase().replace(/^www\./, ''), path: m[2] || '/' };
    return { host: '', path: u.split(/[?#]/)[0] || '/' };
  }
  function normPath(p) { p = String(p || '/').split(/[?#]/)[0]; if (p.charAt(0) !== '/') p = '/' + p; p = p.replace(/\/index\.html?$/i, '/').replace(/\.html?$/i, ''); if (p.length > 1) p = p.replace(/\/+$/, ''); return p.toLowerCase(); }
  function isoDate(s) {
    s = String(s || '').trim(); var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);   /* dd/mm/yyyy (India) */
    return '';
  }
  /* find the first array of objects anywhere in a JSON value (Cloudflare's GraphQL answer nests it under data.viewer.accounts[0].<group>) */
  function findRows(x, depth) {
    if (depth > 8 || x == null) return null;
    if (Array.isArray(x)) { if (x.length && typeof x[0] === 'object' && x[0] && !Array.isArray(x[0])) { var deeper = findRows(x[0], depth + 1); return deeper || x; } for (var i = 0; i < x.length; i++) { var r = findRows(x[i], depth + 1); if (r) return r; } return null; }
    if (typeof x === 'object') for (var k in x) { var r2 = findRows(x[k], depth + 1); if (r2) return r2; }
    return null;
  }
  function flat(o, out, pre) {
    Object.keys(o).forEach(function (k) { var v = o[k]; if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, out, pre + k + '.'); else out[(pre + k).toLowerCase()] = v; });
    return out;
  }
  function pick(o, res) { for (var i = 0; i < res.length; i++) for (var k in o) if (res[i].test(k)) return o[k]; return undefined; }
  var RE = {
    path: [/(^|\.)(requestpath|path|page|pagepath|url|route|uri)$/, /path|page|url/],
    host: [/(^|\.)(requesthost|host|hostname|domain|site)$/, /host|domain/],
    visits: [/visit/, /^sum\.visits$/],
    views: [/page.?views?|pageloads?|views/, /(^|\.)count$/, /requests?|hits/],
    date: [/(^|\.)(date|day|datetime|time|timestamp)$/, /date|day|time/]
  };
  function fromObject(o) {
    var f = flat(o, {}, '');
    var pa = pick(f, RE.path), ho = pick(f, RE.host), vi = pick(f, RE.visits), pv = pick(f, RE.views), da = pick(f, RE.date);
    if (pa == null && ho == null) return null;
    var u = splitUrl(pa), host = (ho != null && String(ho) ? String(ho).toLowerCase().replace(/^www\./, '') : u.host);
    var visits = vi != null ? num(vi) : null, views = pv != null ? num(pv) : null;
    if (visits == null && views == null) return null;
    return { date: isoDate(da), host: host, path: normPath(u.path), visits: visits == null ? views : visits, views: views == null ? visits : views };
  }
  function splitLine(l) {
    if (l.indexOf('\t') >= 0) return l.split('\t');
    var out = [], cur = '', q = false;
    for (var i = 0; i < l.length; i++) { var c = l.charAt(i); if (c === '"') q = !q; else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c; }
    out.push(cur);
    return out.length > 1 ? out : l.trim().split(/\s{2,}|\s+(?=[\d,.]+%?(?:\s|$))/);
  }
  /* text in, { rows, problems } out */
  function parse(text) {
    var t = String(text || '').replace(/^﻿/, '').trim(), rows = [], problems = [];
    if (!t) return { rows: [], problems: ['empty'] };
    if (t.charAt(0) === '{' || t.charAt(0) === '[') {
      try {
        var list = findRows(JSON.parse(t), 0) || [];
        list.forEach(function (o) { var r = fromObject(o); if (r) rows.push(r); });
        if (!rows.length) problems.push('The JSON has no rows with a page (or site) and a visits or views number.');
        return { rows: rows, problems: problems };
      } catch (e) { problems.push('The JSON could not be read: ' + e.message); return { rows: [], problems: problems }; }
    }
    var lines = t.split(/\r?\n/).filter(function (l) { return l.trim(); });
    var head = splitLine(lines[0]).map(function (s) { return s.trim().replace(/^"|"$/g, ''); }), hasHead = head.some(function (h) { return /[a-z]{3}/i.test(h) && !/^\/|^https?:/i.test(h) && !/^[\d,.%\s]+$/.test(h); });
    var col = {};
    if (hasHead) {
      head.forEach(function (h, i) {
        var s = h.toLowerCase();
        ['path', 'host', 'visits', 'views', 'date'].forEach(function (k) { if (col[k] == null && RE[k].some(function (re) { return re.test(s); })) col[k] = i; });
      });
      /* "page views" also matches /page/ for the path: the path column is the one that is not a number column */
      if (col.path === col.views || col.path === col.visits) { col.path = null; head.forEach(function (h, i) { if (col.path == null && /^(path|page|url|request ?path|route)$/i.test(h.trim())) col.path = i; }); }
      lines = lines.slice(1);
    }
    lines.forEach(function (l, n) {
      var c = splitLine(l).map(function (s) { return s.trim().replace(/^"|"$/g, ''); });
      var pa, vi, pv, da = '', ho = '';
      if (hasHead && col.path != null) { pa = c[col.path]; vi = col.visits != null ? c[col.visits] : null; pv = col.views != null ? c[col.views] : null; da = col.date != null ? c[col.date] : ''; ho = col.host != null ? c[col.host] : ''; }
      else {   /* no heading: the first cell that looks like a path or address, then the numbers after it (visits, then views) */
        var pi = -1; c.forEach(function (x, i) { if (pi < 0 && (/^(https?:)?\/\//i.test(x) || x.charAt(0) === '/')) pi = i; });
        if (pi < 0) { problems.push('Line ' + (n + 1) + ' has no page address.'); return; }
        pa = c[pi]; var nums = c.slice(pi + 1).filter(function (x) { return /^[\d,.\s]+%?$/.test(x) && x; }); vi = nums[0]; pv = nums[1];
      }
      if (pa == null || pa === '') return;
      var u = splitUrl(pa), host = (ho || u.host).toLowerCase().replace(/^www\./, '');
      var visits = vi != null && vi !== '' ? num(vi) : null, views = pv != null && pv !== '' ? num(pv) : null;
      if (visits == null && views == null) { problems.push('Line ' + (n + 1) + ' has no number.'); return; }
      rows.push({ date: isoDate(da), host: host, path: normPath(u.path), visits: visits == null ? views : visits, views: views == null ? visits : views });
    });
    if (!rows.length && !problems.length) problems.push('No rows found. Each line needs a page address and a number.');
    return { rows: rows, problems: problems.slice(0, 5) };
  }

  /* the part of the address before the first dot is the site: billing.niveshsahayak.in -> billing; the bare domain is "www" */
  function siteOf(host) {
    host = String(host || '').toLowerCase();
    if (!host) return '(unknown)';
    var m = /^([a-z0-9-]+)\.niveshsahayak\.in$/.exec(host);
    return m ? m[1] : /^niveshsahayak\.in$/.test(host) ? 'www' : host;
  }
  function addDays(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  /* one file that spans two weeks or more: this = the 7 days ending on the newest date, last = the 7 days before */
  function splitWeeks(rows) {
    var dated = rows.filter(function (r) { return r.date; });
    if (!dated.length) return null;
    var max = dated.reduce(function (a, r) { return r.date > a ? r.date : a; }, ''), cutThis = addDays(max, -6), cutLast = addDays(max, -13);
    var cur = [], prev = [], older = 0;
    dated.forEach(function (r) { if (r.date >= cutThis) cur.push(r); else if (r.date >= cutLast) prev.push(r); else older++; });
    return { cur: cur, prev: prev, end: max, start: cutThis, older: older, undated: rows.length - dated.length };
  }
  function agg(rows) {
    var m = {}, tv = 0, tw = 0;
    rows.forEach(function (r) {
      var k = r.host + '|' + r.path, o = m[k] || (m[k] = { key: k, host: r.host, site: siteOf(r.host), path: r.path, visits: 0, views: 0 });
      o.visits += r.visits; o.views += r.views; tv += r.visits; tw += r.views;
    });
    return { map: m, list: Object.keys(m).map(function (k) { return m[k]; }), visits: tv, views: tw };
  }
  function pct(a, b) { return b > 0 ? Math.round((a - b) / b * 1000) / 10 : null; }
  var MINV = 20;   /* a page needs this many visits in the bigger week before a change counts */
  function report(cur, prev, o) {
    o = o || {}; var minv = o.min || MINV;
    var C = agg(cur), P = agg(prev), sites = {};
    C.list.forEach(function (x) { var s = sites[x.site] || (sites[x.site] = { site: x.site, visits: 0, views: 0, pvisits: 0, pviews: 0 }); s.visits += x.visits; s.views += x.views; });
    P.list.forEach(function (x) { var s = sites[x.site] || (sites[x.site] = { site: x.site, visits: 0, views: 0, pvisits: 0, pviews: 0 }); s.pvisits += x.visits; s.pviews += x.views; });
    var siteList = Object.keys(sites).map(function (k) { var s = sites[k]; s.change = pct(s.visits, s.pvisits); return s; }).sort(function (a, b) { return b.visits - a.visits; });
    var rows = {};
    C.list.concat(P.list).forEach(function (x) { rows[x.key] = rows[x.key] || { key: x.key, host: x.host, site: x.site, path: x.path }; });
    var all = Object.keys(rows).map(function (k) {
      var r = rows[k], c = C.map[k] || { visits: 0, views: 0 }, p = P.map[k] || { visits: 0, views: 0 };
      r.visits = c.visits; r.views = c.views; r.pvisits = p.visits; r.pviews = p.views; r.change = pct(c.visits, p.visits); r.perVisit = c.visits ? Math.round(c.views / c.visits * 100) / 100 : 0; return r;
    });
    var top = all.filter(function (r) { return r.visits > 0; }).sort(function (a, b) { return b.visits - a.visits; });
    var enough = function (r) { return Math.max(r.visits, r.pvisits) >= minv; };
    var fell = all.filter(function (r) { return enough(r) && r.pvisits > 0 && r.visits < r.pvisits; }).sort(function (a, b) { return (a.visits - a.pvisits) - (b.visits - b.pvisits); });
    var rose = all.filter(function (r) { return enough(r) && r.visits > r.pvisits; }).sort(function (a, b) { return (b.visits - b.pvisits) - (a.visits - a.pvisits); });
    var gone = all.filter(function (r) { return r.pvisits >= minv && r.visits === 0; });
    /* "came, looked once, left": many visits but about one page view per visit. It cannot say why; it says where to look. */
    var once = top.filter(function (r) { return r.visits >= minv && r.perVisit <= 1.1; });
    var depth = C.visits ? Math.round(C.views / C.visits * 100) / 100 : 0;
    return { visits: C.visits, views: C.views, pvisits: P.visits, pviews: P.views, change: pct(C.visits, P.visits), viewsChange: pct(C.views, P.views), depth: depth,
      sites: siteList, top: top.slice(0, 15), fell: fell.slice(0, 10), rose: rose.slice(0, 10), gone: gone.slice(0, 10), once: once.slice(0, 10), pages: all.length, min: minv, noPrev: !P.list.length };
  }
  /* the weekly totals the page keeps to draw a trend: add/replace the week that ends on `end` */
  function addHistory(h, end, rep) {
    h = (h || []).filter(function (x) { return x.end !== end; });
    h.push({ end: end, visits: rep.visits, views: rep.views }); h.sort(function (a, b) { return a.end < b.end ? -1 : 1; });
    return h.slice(-26);
  }
  root.NSUsage = { parse: parse, report: report, splitWeeks: splitWeeks, siteOf: siteOf, addHistory: addHistory, pct: pct, normPath: normPath, addDays: addDays };
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* usage.js */
try{/* Weekly usage report screen (my.niveshsahayak.in/usage/, owner only, noindex). Reads what the owner pastes or loads, shows engine/usagecore.js's report.
   Nothing leaves the browser. The weekly totals are kept in the data home (meta 'usageHistory') so the trend grows by itself.
   The screen is English only on purpose: it is the owner's own page, not part of the 23-language tools. */
(function () {
  'use strict';
  var root = document.getElementById('usage-app'), U = window.NSUsage;
  if (!root || !U) return;
  var $ = function (s) { return root.querySelector(s); }, esc = NS.esc;
  var A = $('#ua-a'), B = $('#ua-b'), out = $('#ua-out'), msg = $('#ua-msg');
  function say(t, bad) { msg.textContent = t || ''; msg.hidden = !t; msg.className = 'note' + (bad ? ' bad' : ''); }
  function load(input, area) {
    input.addEventListener('change', function () {
      var f = input.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { area.value = String(r.result || ''); }; r.onerror = function () { say('That file could not be read.', true); }; r.readAsText(f);
    });
  }
  load($('#ua-af'), A); load($('#ua-bf'), B);
  function num(n) { return Math.round(n).toLocaleString('en-IN'); }
  function chg(c) { return c == null ? '<span class="soft">new</span>' : '<b class="' + (c < 0 ? 'neg' : 'pos') + '">' + (c > 0 ? '+' : '') + c + '%</b>'; }
  function pg(r) { return esc(r.site) + ' <span class="soft">' + esc(r.path) + '</span>'; }
  function table(head, rows) {
    return rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + head.map(function (h, i) { return '<th' + (i ? ' class="n"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '';
  }
  function tr(cells) { return '<tr>' + cells.map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }
  function sentence(R, span) {
    var s = 'This week ' + num(R.visits) + ' visits and ' + num(R.views) + ' page views' + (span ? ' (' + span + ')' : '') + '. ';
    if (R.noPrev) return s + 'There is no earlier week to compare with, so only the top pages are shown.';
    s += 'Last week ' + num(R.pvisits) + ' visits' + (R.change == null ? '' : ': ' + (R.change >= 0 ? 'up ' : 'down ') + Math.abs(R.change) + '%') + '. ';
    s += 'A visit looked at ' + R.depth + ' pages on average. ';
    if (R.sites.length) s += 'Busiest site: ' + R.sites[0].site + ' (' + num(R.sites[0].visits) + ' visits). ';
    if (R.fell[0]) s += 'Biggest fall: ' + R.fell[0].site + ' ' + R.fell[0].path + ' (' + num(R.fell[0].pvisits) + ' to ' + num(R.fell[0].visits) + '). ';
    if (R.rose[0]) s += 'Biggest rise: ' + R.rose[0].site + ' ' + R.rose[0].path + ' (' + num(R.rose[0].pvisits) + ' to ' + num(R.rose[0].visits) + ').';
    return s;
  }
  function render(R, span, hist) {
    var h = '<div class="card"><h2>The week in a few lines</h2><p>' + esc(sentence(R, span)) + '</p></div>';
    h += '<div class="tiles"><div class="tile"><span>Visits</span><b>' + num(R.visits) + '</b><small>' + (R.noPrev ? '' : chg(R.change) + ' vs last week') + '</small></div>' +
      '<div class="tile"><span>Page views</span><b>' + num(R.views) + '</b><small>' + (R.noPrev ? '' : chg(R.viewsChange) + ' vs last week') + '</small></div>' +
      '<div class="tile"><span>Pages per visit</span><b>' + R.depth + '</b></div><div class="tile"><span>Pages seen</span><b>' + R.pages + '</b></div></div>';
    h += '<div class="card"><h2>Sites</h2>' + table(['Site', 'Visits', 'Last week', 'Change'], R.sites.map(function (s) { return tr([esc(s.site), num(s.visits), num(s.pvisits), chg(s.change)]); })) + '</div>';
    h += '<div class="card"><h2>Top pages and tools</h2>' + table(['Page', 'Visits', 'Views', 'Last week', 'Change'], R.top.map(function (r) { return tr([pg(r), num(r.visits), num(r.views), num(r.pvisits), chg(r.change)]); })) + '</div>';
    if (!R.noPrev) {
      h += '<div class="card"><h2>Fell most</h2>' + (R.fell.length ? table(['Page', 'This week', 'Last week', 'Change'], R.fell.map(function (r) { return tr([pg(r), num(r.visits), num(r.pvisits), chg(r.change)]); })) : '<p class="soft">Nothing fell with at least ' + R.min + ' visits.</p>') +
        (R.gone.length ? '<h3>Gone this week</h3>' + table(['Page', 'Last week'], R.gone.map(function (r) { return tr([pg(r), num(r.pvisits)]); })) : '') + '</div>';
      h += '<div class="card"><h2>Rose most</h2>' + (R.rose.length ? table(['Page', 'This week', 'Last week', 'Change'], R.rose.map(function (r) { return tr([pg(r), num(r.visits), num(r.pvisits), chg(r.change)]); })) : '<p class="soft">Nothing rose with at least ' + R.min + ' visits.</p>') + '</div>';
    }
    h += '<div class="card"><h2>Looked once and left</h2><p class="soft">Pages with at least ' + R.min + ' visits and about one page view per visit. Check each: a finished calculator is fine; a home page that nobody goes past needs a clearer next step.</p>' +
      (R.once.length ? table(['Page', 'Visits', 'Views per visit'], R.once.map(function (r) { return tr([pg(r), num(r.visits), r.perVisit]); })) : '<p class="soft">None.</p>') + '</div>';
    if (hist && hist.length > 1) h += '<div class="card"><h2>Weekly totals kept so far</h2>' + table(['Week ending', 'Visits', 'Page views'], hist.slice().reverse().map(function (x) { return tr([esc(x.end), num(x.visits), num(x.views)]); })) + '</div>';
    out.innerHTML = h;
    $('#ua-print').hidden = false;
  }
  function go() {
    say(''); out.innerHTML = '';
    var pa = U.parse(A.value), pb = B.value.trim() ? U.parse(B.value) : null, cur, prev, span = '', end = $('#ua-end').value, notes = [];
    if (!pa.rows.length) { say(pa.problems[0] || 'Box A has no rows.', true); return; }
    if (pb) {
      if (!pb.rows.length) { say('Box B: ' + (pb.problems[0] || 'no rows.'), true); return; }
      cur = pa.rows; prev = pb.rows;
    } else {
      var w = U.splitWeeks(pa.rows);
      if (w) {
        cur = w.cur; prev = w.prev; end = end || w.end; span = w.start + ' to ' + w.end;
        if (w.undated) notes.push(w.undated + ' lines without a date were left out.');
        if (w.older) notes.push(w.older + ' lines older than two weeks were left out.');
        if (!prev.length) notes.push('The file holds only one week, so there is nothing to compare with.');
      } else { cur = pa.rows; prev = []; notes.push('Box B is empty and box A has no dates: showing only this week.'); }
    }
    pa.problems.concat(pb ? pb.problems : []).forEach(function (p) { notes.push(p); });
    var R = U.report(cur, prev, { min: Math.max(1, +$('#ua-min').value || 20) });
    NSStore.ready().then(function () { return NSStore.meta('usageHistory'); }).then(function (h) { return Array.isArray(h) ? h : []; }, function () { return []; }).then(function (h) {
      if (end) { h = U.addHistory(h, end, R); NSStore.meta('usageHistory', h).catch(function () {}); }
      render(R, span, h);
      if (notes.length) say(notes.join(' '));
    });
  }
  $('#ua-go').addEventListener('click', go);
  $('#ua-clear').addEventListener('click', function () { A.value = ''; B.value = ''; out.innerHTML = ''; say(''); $('#ua-print').hidden = true; });
  $('#ua-print').addEventListener('click', function () { window.print(); });
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* altkeys.js */
try{(function(){if(window.NSAlt)return;var g=window.NS=window.NS||{},T=document.documentElement,m="SPNDEAXLWVBKCMORTHYIJUQ".split(""),x=[[/\bsave\b|^ok$|^done$|^accept|^apply|^update\b|^confirm|^yes\b/,"S"],[/\bprint\b/,"P"],[/\bpreview\b|\bview\b|^open\b|^show\b/,"V"],[/\badd (a )?(line|row)\b/,"A"],[/^\+?\s*new\b|\bcreate\b|^\+?\s*add (a |an )?(new |party|item|ledger|business|customer|supplier|employee|bank|group)/,"N"],[/\bdelete\b|\bremove\b|\bclear\b/,"D"],[/^edit\b|\bmodify\b|^change\b/,"E"],[/^\+?\s*add\b/,"A"],[/\bexcel\b|\bexport\b|\bdownload\b|\bcsv\b|\bpdf\b/,"X"],[/\blist\b|\bregister\b/,"L"],[/whatsapp|\bshare\b|\bsend\b|\bemail\b|\bmail\b/,"W"],[/^back\b|^previous\b|^prev\b/,"B"],[/\bsearch\b|\bfind\b/,"K"],[/^cancel\b|^close\b|^no\b|^not now|^later\b|^skip\b/,"C"],[/\bsettings?\b|\bconfigur|\boptions?\b/,"O"],[/\bhelp\b|\bguide\b/,"H"],[/\bcopy\b|\bduplicate\b|\brepeat\b/,"Y"],[/\bnext\b|\bforward\b/,"T"],[/^first\b/,"I"],[/^last\b/,"U"],[/\breceive|\bmoney in\b|\breceipt\b/,"R"],[/\bmoney (out|paid)\b|\bpay\b|\bpayment\b/,"Y"],[/\bmore\b|\bmenu\b/,"M"],[/\bfilter\b|\bperiod\b|\bdate\b/,"Q"]],M='a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=option],[role=switch],[tabindex]:not([tabindex="-1"])',f=null,h="",y=!1,w=!1,S=0,s=null;function K(e){if(e.disabled||e.closest('[hidden],[inert],[aria-hidden="true"],.ns-alt'))return null;for(var t=e.closest("details");t;t=t.parentElement&&t.parentElement.closest("details"))if(!t.open&&!(e.closest("summary")&&e.closest("summary").parentElement===t))return null;e.matches("input[type=radio],input[type=checkbox]")&&e.closest("label")&&!e.offsetWidth&&(e=e.closest("label"));var r=e.getBoundingClientRect(),n=e.closest(".sc-panel"),a=n&&n.getBoundingClientRect();if(a&&a.width>2&&r.height>=2&&(r.top<a.top||r.bottom>a.bottom))return{el:e,r,off:1};if(r.width<2||r.height<2||r.bottom<0||r.right<0||r.top>innerHeight||r.left>innerWidth)return null;var c=getComputedStyle(e);if(c.visibility==="hidden")return null;for(var l=e;l&&l!==document.body;l=l.parentElement)if(+getComputedStyle(l).opacity==0)return null;var p=Math.min(Math.max(r.left+Math.min(r.width/2,12),1),innerWidth-1),d=Math.min(Math.max(r.top+r.height/2,1),innerHeight-1),u=document.elementFromPoint(p,d);if(!u||u!==e&&!e.contains(u)){var v=e.labels&&e.labels[0];if(!(v&&(v===u||v.contains(u))))return null}return{el:e,r}}var $={sale:"SA",pbill:"PB",min:"MI",mout:"MO",contra:"CO",exp:"EX"},D={party:"NP",item:"NI"},R={"#dues":"DU","#stock":"SK","#books":"CB","#parties":"PA","#dlist":"DR","#clist":"CR","#fin/tb":"TB","#fin/bs":"BS","#fin/pl":"PL","#b2jv":"JE"};function B(e){if(!e.closest(".sc-panel"))return"";if(e.hasAttribute("data-sc-cust"))return"ZCU";var t=e.getAttribute("data-sccode")||"";if(!t){var r=/Alt\+G\s+([A-Z]{2})\b/.exec((e.querySelector("kbd")||{}).textContent||"");t=r?r[1]:""}return!t&&e.hasAttribute("data-dform")&&(t=$[e.getAttribute("data-dform")]||""),!t&&e.hasAttribute("data-qnew")&&(t=D[e.getAttribute("data-qnew")]||""),t||(t=R[e.getAttribute("href")||""]||""),/^[A-Z]{2}$/.test(t)?"Z"+t:""}function H(e){var t="";if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)){var r=e.labels&&e.labels[0];if(t=e.getAttribute("aria-label")||r&&r.innerText||e.placeholder||e.title||"",!t&&e.type&&/^(submit|button)$/.test(e.type)&&(t=e.value),!t){var n=e.closest("label,.fld,.field,.f");t=n?n.innerText:""}}else t=e.getAttribute("aria-label")||e.innerText||e.title||e.value||"";return String(t||"").replace(/\s+/g," ").trim().slice(0,60)}function q(e){var t=g.meaning?g.meaning(e):"";return((t?t.replace(/^\S+\s/,"")+" | ":"")+e).toLowerCase()}function W(){var e=Array.prototype.filter.call(document.querySelectorAll(".mb-drop,[role=menu]"),function(n){return!n.offsetWidth||n.closest("[hidden]")||getComputedStyle(n).visibility==="hidden"?!1:Array.prototype.some.call(n.querySelectorAll(M),function(a){return!!K(a)})}).pop();if(e)return e;var t=Array.prototype.filter.call(document.querySelectorAll("dialog[open]"),function(n){return n.offsetWidth});if(t.length){var r=t.filter(function(n){return n.matches(":modal")});return r.length?r[r.length-1]:t[t.length-1]}return document.body}function I(e){return e.closest(".vs-foot,.actions,.tool-top,.dlg-foot,menu,.btns,footer.f")||e.type==="submit"?0:e.matches("input,select,textarea,[role=switch]")&&!e.closest("table,.bigtable")?1:e.matches("[role=tab],.mb-t")||e.closest("[role=tablist],.tabs,.seg")?2:e.matches(".mb-m")||e.matches("button,.btn,[role=button],input,select,textarea")&&!e.closest("#ns-side,header,.sbar,nav")?3:e.closest("header,.mb,.menubar,.dk-top")?4:e.closest("#ns-side")?6:e.closest(".sbar,footer,.ft")?8:5}function A(){var e=W(),t=new Set,r=[];return Array.prototype.forEach.call(e.querySelectorAll(M),function(n){var a=K(n);!a||t.has(a.el)||(t.add(a.el),a.label=H(a.el),!(!a.label&&!a.el.matches("input,select,textarea"))&&(a.rank=I(a.el),a.mean=q(a.label),r.push(a)))}),r.sort(function(n,a){return n.rank-a.rank||n.r.top-a.r.top||n.r.left-a.r.left}),{scope:e,items:r}}function E(e){var t={},r=[],n=[],a=e.length>m.length?m.length-3:m.length;function c(i,o){return!o||t[o]||m.indexOf(o)<0||r.length>=a?!1:(t[o]=i,i.key=o,r.push(i),!0)}var l=0;e.forEach(function(i){i.rank===6&&i.el.matches("#ns-side a[data-sec]")&&l<9&&!(g.featHidden&&g.featHidden(i.el))&&(l++,i.key=String(l),i.side=1)});var p={},d=Array.prototype.slice.call(document.querySelectorAll(".sc-panel .sc-i"));e.filter(function(i){return!i.key&&i.el.closest(".sc-panel")&&!i.el.hasAttribute("data-sc-cust")}).forEach(function(i){var o=d.indexOf(i.el);o>=0&&o<10&&(i.key="Z"+(o+1)%10)}),e.forEach(function(i){var o=!i.key&&B(i.el);o&&!p[o]&&(p[o]=1,i.key=o)});var u=e.filter(function(i){return!i.key&&i.rank<6});u.forEach(function(i){for(var o=0;o<x.length;o++)if(x[o][0].test(i.mean)){c(i,x[o][1]);break}}),u.forEach(function(i){if(!i.key){var o=(i.mean.split(" | ")[0]||i.label).toUpperCase(),G=o.match(/[A-Z]+/g)||[];if(!G.some(function(X){return c(i,X[0])})){for(var P=0;P<o.length;P++)if(c(i,o[P]))return}}}),u.forEach(function(i){i.key||n.push(i)}),e.forEach(function(i){!i.key&&i.rank>=6&&n.push(i)});var v=m.filter(function(i){return!t[i]}),N=0;return n.forEach(function(i){if(!(r.length<a&&!v.length)&&v.length){var o=v[Math.floor(N/m.length)];o&&(i.key=o+m[N%m.length],N++)}}),e.filter(function(i){return i.key})}function Z(e){if(s&&s.remove(),s=document.createElement("div"),s.className="ns-alt",s.setAttribute("aria-hidden","true"),s.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:2147483646;background:none;border:0;margin:0;padding:0;width:auto;height:auto;overflow:visible;max-width:none;max-height:none",document.body.appendChild(s),e!==document.body&&s.showPopover)try{s.setAttribute("popover","manual"),s.showPopover()}catch{}return s}function U(e){if(e.key.length!==1||/^\d$/.test(e.key))return null;for(var t=document.createTreeWalker(e.el,NodeFilter.SHOW_TEXT),r,n=null;r=t.nextNode();)if(!(!r.parentElement||r.parentElement.closest("svg"))){var a=r.textContent,c=new RegExp("(^|[^A-Za-z])("+e.key+")","i"),l=c.exec(a);if(l){n=[r,l.index+l[1].length];break}if(!n){var p=a.toUpperCase().indexOf(e.key);p>=0&&(n=[r,p])}}if(!n)return null;var d=document.createRange();d.setStart(n[0],n[1]),d.setEnd(n[0],n[1]+1);var u=d.getBoundingClientRect();return u.width?u:null}function k(){var e=A(),t=E(e.items);if(!t.length)return!1;var r=Z(e.scope);t.forEach(function(a){if(!a.off){var c=document.createElement("span");c.className="ns-alt-k"+(a.key.length>1?" alt-two":"")+(a.side?" alt-side":""),c.textContent=a.key,c.setAttribute("data-k",a.key);var l=Math.max(2,a.r.top-7),p=Math.max(2,a.r.left-6);a.side&&(l=a.r.top+(a.r.height-18)/2,p=Math.max(2,a.r.right-22)),c.style.top=l+"px",c.style.left=p+"px",r.appendChild(c);var d=U(a);if(d){var u=document.createElement("i");u.className="ns-alt-u",u.style.cssText="top:"+(d.bottom-1)+"px;left:"+d.left+"px;width:"+d.width+"px",r.appendChild(u)}}});var n=document.createElement("div");return n.className="ns-alt-tip",n.textContent=g.t?g.t("alt.tip"):"Press a letter. Esc closes.",n.textContent==="alt.tip"&&(n.textContent="Press a letter. Esc closes."),r.appendChild(n),f={list:t,scope:e.scope},h="",T.classList.add("ns-alt-on"),!0}function b(){if(s){try{s.matches(":popover-open")&&s.hidePopover()}catch{}s.remove(),s=null}f=null,h="",T.classList.remove("ns-alt-on")}function C(e){var t=e.el;if(b(),e.side){t.click(),t.focus&&t.focus();return}if(t.matches("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea")){t.focus();try{t.select&&!/^(date|month|time|number)$/.test(t.type)&&t.select()}catch{}return}if(t.tagName==="SELECT"){t.focus();try{t.showPicker&&t.showPicker()}catch{}return}if(t.matches("input[type=checkbox],input[type=radio],[role=switch]")){t.click(),t.focus();return}if(t.tagName==="LABEL"){t.click();var r=t.querySelector("input");r&&r.focus();return}t.focus({preventScroll:!0}),t.click(),t.matches("[aria-haspopup],.mb-m,summary")&&setTimeout(function(){f||k()},120)}function L(){!f||!s||Array.prototype.forEach.call(s.querySelectorAll(".ns-alt-k"),function(e){var t=e.getAttribute("data-k");e.classList.toggle("alt-dim",t.indexOf(h)!==0)})}function O(e){var t=e.code||"";if(/^Key[A-Z]$/.test(t))return t.slice(3);if(/^Digit[0-9]$/.test(t))return t.slice(5);if(/^Numpad[0-9]$/.test(t))return t.slice(6);var r=(e.key||"").toUpperCase();return/^[A-Z0-9]$/.test(r)?r:""}function _(e){var t=A(),r=E(t.items),n=r.filter(function(a){return a.key===e&&!a.side})[0];return n?(C(n),!0):!1}window.addEventListener("keydown",function(e){if(e.key==="Alt"||e.key==="AltGraph"){if(e.ctrlKey||e.metaKey||e.key==="AltGraph")return;if(f){e.preventDefault();return}e.repeat||(y=!0,w=!1,clearTimeout(S),S=setTimeout(function(){y&&!w&&!f&&k()},450)),e.preventDefault();return}if(y&&(w=!0),f){if(e.ctrlKey||e.metaKey){b();return}if(e.key==="Escape"){e.preventDefault(),e.stopImmediatePropagation(),b();return}if(e.key==="Backspace"){e.preventDefault(),e.stopImmediatePropagation(),h=h.slice(0,-1),L();return}var t=O(e);if(!t){/^(Shift|Control|Meta|CapsLock)$/.test(e.key)||b();return}if(e.preventDefault(),e.stopImmediatePropagation(),e.altKey&&/^\d$/.test(t)){b();return}h+=t;var r=f.list.filter(function(a){return a.key===h})[0];if(r){C(r);return}f.list.some(function(a){return a.key.indexOf(h)===0})||(h=""),L();return}if(e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!(e.getModifierState&&e.getModifierState("AltGraph"))){var n=O(e);if(!n||/^\d$/.test(n)||n==="G"||n==="F")return;if(e.repeat){e.preventDefault();return}_(n)&&(e.preventDefault(),e.stopImmediatePropagation())}},!0),window.addEventListener("keyup",function(e){if(e.key==="Alt"){clearTimeout(S);var t=y&&!w;if(y=!1,!t){f&&w&&b();return}if(e.preventDefault(),f){!s||!s._fromHold?b():s._fromHold=!1;return}k()}},!0);var F=k;k=function(){var e=F();return e&&y&&s&&(s._fromHold=!0),e},["mousedown","wheel","resize","blur"].forEach(function(e){window.addEventListener(e,function(){y=!1,f&&b()},!0)}),window.addEventListener("scroll",function(){f&&b()},!0),window.NSAlt={show:function(){return k()},hide:b,keys:function(){var e=A();return E(e.items).map(function(t){return[t.key,t.label]})},press:function(e){var t=A(),r=E(t.items).filter(function(n){return n.key===e})[0];return r&&C(r),!!r}}})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* desk.js */
try{(function(){"use strict";if(!window.NS||!NS.$)return;var s=NS.$,g=NS.$$,v=NS.esc,_=document.documentElement;function k(t,e){return NS.t("desk."+t,e)}function w(){return window.NSApp}var tt=/^(localhost|127\.0\.0\.1)$/.test(location.hostname),J={get:function(t){try{return localStorage.getItem(t)}catch{return null}},set:function(t,e){try{localStorage.setItem(t,e)}catch{}}},Mt="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4";function dt(t){return'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+t+'"/></svg>'}var T={home:"home",sales:"doc",money:"money",dues:"clock",buy:"cart",parties:"people",cash:"bank",chq:"cheque",books:"book",khata:"book",preg:"cart",ebook:"cart",day:"calendar",inbox:"save",mkimp:"data",mig:"data",msg:"wa",pd:"doc",env:"doc",tools:"layers",repeat:"repeat",reports:"chart",b2jv:"journal",b2fa:"asset",b2gd:"box",b2make:"factory",b2profit:"trend",b2sman:"badge",b2year:"calendar",grp:"layers",fin:"scale",fam:"factory",capl:"coins",b2job:"wrench",ledger:"book",move:"trend",st:"list",stf:"badge",acx:"tax",tdsr:"tax",gststk:"tax",gtds:"tax",isd:"tax",charts:"chart",pdffill:"doc",ftools:"wrench",features:"toggle",bimp:"bimport",itx:"itax",msme:"coins",limits:"scale",trust:"coins",warr:"wrench",fees:"cap",packs:"pack",cadb:"dash",cadoc:"folder",cagst:"tax",cacom:"chat",saved:"save",entries:"list",low:"alert",biz:"shop",party:"people",pgroups:"list",item:"box",igroups:"list",doc:"doc",settings:"set",backup:"data",bin:"trash",log:"clock"};function R(){g(".hub-nav a[data-sec]:not([data-ic])").forEach(function(t){var e=T[t.getAttribute("data-sec")];e&&t.setAttribute("data-ic",e)})}var C;NS.ask=function(t,e){e=e||{},C||(C=NS.el("dialog",{id:"desk-ask",class:"desk-ask","aria-labelledby":"desk-ask-m"}),C.innerHTML='<p id="desk-ask-m"></p><div class="btns"><button type="button" class="btn primary" data-ok></button><button type="button" class="btn" data-no></button></div>',document.body.appendChild(C)),s("#desk-ask-m",C).textContent=t;var a=s("[data-ok]",C),i=s("[data-no]",C);a.textContent=e.ok||k("ok"),i.textContent=e.no||k("cancel"),a.classList.toggle("danger",!!e.danger),a.toggleAttribute("data-noic",!!e.danger);var n=a.querySelector("svg");return n&&e.danger&&n.remove(),new Promise(function(r){var o=!1;function l(d){o||(o=!0,a.onclick=i.onclick=null,C.onclose=null,C.open&&C.close(),r(d))}a.onclick=function(){l(!0)},i.onclick=function(){l(!1)},C.onclose=function(){l(!1)},C.showModal(),(e.danger?i:a).focus()})};var L=null,F={};document.addEventListener("click",function(t){L={el:t.target}},!0),document.addEventListener("submit",function(t){L={form:t.target,sub:t.submitter||null}},!0),NS.okSync=function(t,e){if(F[t])return delete F[t],!0;var a=L;return a?(NS.ask(t,e).then(function(i){if(i){F[t]=1,NS.okRetry=!0;try{a.form&&a.form.isConnected?a.form.requestSubmit?a.form.requestSubmit(a.sub&&a.sub.isConnected?a.sub:void 0):a.form.submit():a.el&&a.el.isConnected&&a.el.click()}finally{NS.okRetry=!1,setTimeout(function(){delete F[t]},0)}}}),!1):window.confirm(t)};function j(){var t;try{t=sessionStorage.getItem("ns-fr-installed")==="1"}catch{}return t||matchMedia("(display-mode: standalone), (display-mode: window-controls-overlay)").matches||navigator.standalone===!0}var A,O,D=null,ee=60;function ut(){return matchMedia("(min-width: 861px)").matches}function ft(t){var e=typeof t=="boolean"?t:!_.classList.contains("side-mini");_.classList.toggle("side-mini",e),typeof t!="boolean"&&J.set("ns-side-mini",e?"1":"0");var a=s("[data-side-mini]");a&&a.setAttribute("aria-pressed",String(e))}function pt(t){_.classList.toggle("side-open",t);var e=s("[data-side-btn]");e&&e.setAttribute("aria-expanded",String(t));var a=s("[data-side-shade]");if(a&&(a.hidden=!t),t){var i=s("a[aria-current=page], a",A);i&&i.focus()}}function xt(){ut()?ft():pt(!_.classList.contains("side-open"))}function ne(){R();var t=s("#app .hub-nav"),e=s(".side-own",A)||null;if(!(!t||t.hasAttribute("data-desk"))){if(t.setAttribute("data-desk",""),g("a[data-sec]",t).forEach(function(h,b){h.setAttribute("data-ic",T[h.getAttribute("data-sec")]||"dot"),b<9&&h.setAttribute("aria-keyshortcuts","Alt+"+(b+1));var p=P[h.getAttribute("data-sec")],S=p&&Q(h.getAttribute("data-sec"));if(p){var y=S||(p[1]?"Alt+"+p[1]:"Alt+G "+p[0]);h.setAttribute("data-kh",y),h.title=y+(p[1]||S?"  ·  Alt+G "+p[0]:"")}}),!e){e=NS.el("div",{class:"side-g side-own","data-g":"own"}),e.innerHTML='<h2 class="side-h"><span data-i18n="nav.app">'+v(NS.t("nav.app"))+"</span></h2>";var a=s(".side-g",A);A.insertBefore(e,a)}var i=s(".side-h",e);e.insertBefore(t,i.nextSibling);var n=s("a[data-ic=home]",e);if(n&&t.contains(n)===!1&&n.remove(),hn(t),nn(),_.classList.add("has-hub"),!s(".tabbar")){var r={home:"Dashboard",sales:"Sales",money:"Receipts",dues:"Dues",parties:"Parties",day:"My day",buy:"Purchases",books:"Day Book"},o=NS.el("nav",{class:"tabbar","aria-label":k("menu")});document.body.appendChild(o);var l=function(){var h=["home","sales","money","dues","parties","day"],b=g("a[data-sec]",t).filter(function(y){return y.getAttribute("data-sec")!=="features"&&!(NS.featHidden&&NS.featHidden(y))}),p=[];h.forEach(function(y){var u=b.filter(function(c){return c.getAttribute("data-sec")===y})[0];u&&p.length<4&&p.push(u)}),b.forEach(function(y){p.length<4&&p.indexOf(y)<0&&p.push(y)});var S=p.map(function(y){return y.getAttribute("data-sec")}).join();o.getAttribute("data-sig")!==S&&(o.setAttribute("data-sig",S),o.innerHTML=p.map(function(y){return y.outerHTML.replace(/\s(aria-keyshortcuts|title|id|aria-current)="[^"]*"/g,"")}).join("")+'<button type="button" data-side-btn data-ic="more" aria-expanded="false"><span data-i18n="desk.more">'+v(k("more"))+"</span></button>",g("a",o).forEach(function(y){y.addEventListener("click",function(){y.blur()})}),window.NSApp&&NSApp.data&&g("a[data-sec]",o).forEach(function(y){var u=r[y.getAttribute("data-sec")],c=s("span",y);u&&c&&(c.removeAttribute("data-i18n"),c.setAttribute("data-erp","1"),c.textContent=u)}))};l();var d=0;new MutationObserver(function(){clearTimeout(d),d=setTimeout(l,80)}).observe(t,{childList:!0,subtree:!0})}}}var ht=[["top",["home","day",{h:"coa",t:"v_coa",ic:"layers"}]],["masters",[{h:"masters",t:"v_masters",ic:"layers"},"§acc",{h:"masters/led",t:"v_ledgers",ic:"book"},{h:"masters/grp",t:"v_groups",ic:"layers"},{h:"masters/bank",t:"v_banks",ic:"bank"},{h:"masters/vt",t:"v_vtypes",ic:"list"},{f:"ob",t:"v_ob",ic:"scale"},"§inv",{h:"masters/item",t:"v_items",ic:"box"},{h:"masters/igrp",t:"v_sgroups",ic:"layers"},{h:"masters/unit",t:"v_units",ic:"box"},"b2gd","§pay",{h:"stf/emp",t:"v_emp",ic:"people"},{h:"stf/heads",t:"v_payheads",ic:"list"},"b2sman","§dsp",{h:"masters/trn",t:"v_trn",ic:"truck"},{h:"masters/veh",t:"v_veh",ic:"truck"},"§co",{h:"masters/biz",t:"v_biz",ic:"shop"}]],["trans",["§vch",{f:"sale",t:"v_sale",ic:"doc"},{f:"pbill",t:"v_pbill",ic:"cart"},{f:"min",t:"v_min",ic:"money"},{f:"mout",t:"v_mout",ic:"money"},{f:"contra",t:"v_contra",ic:"bank"},"b2jv",{f:"genr",t:"v_genr",ic:"money"},{f:"genp",t:"v_genp",ic:"money"},{f:"exp",t:"v_exp",ic:"cart"},{f:"pret",t:"v_pret",ic:"repeat"},"repeat","§ivch",{h:"ord",t:"v_ord",ic:"list"},{or:"grn",t:"v_grn",ic:"cart"},{or:"rejin",t:"v_rejin",ic:"repeat"},{or:"rejout",t:"v_rejout",ic:"repeat"},{or:"lc",t:"v_lc",ic:"truck"},"b2make","b2job","§payv",{h:"stf/run",t:"v_payrun",ic:"money"},{h:"stf/att",t:"v_att",ic:"clock"},{h:"stf/leave",t:"v_leave",ic:"clock"},{h:"stf/adv",t:"v_adv",ic:"money"},{h:"stf/loan",t:"v_sloan",ic:"money"},"§lists","sales","buy","money","chq","khata","preg","§assets","capl","b2fa","§trade","trust","fees","warr"]],["reports",["§final",{fin:"bs",t:"v_bs",ic:"scale"},{fin:"pl",t:"v_pl",ic:"chart"},{fin:"tb",t:"v_tb",ic:"list"},"fin","§books","books",{h:"ssum",t:"v_ssum",ic:"chart"},{h:"psum",t:"v_psum",ic:"chart"},{h:"vreg",t:"v_vreg",ic:"list"},{h:"cbsum",t:"v_cbsum",ic:"bank"},"grp","§os",{h:"os",t:"v_os",ic:"clock"},"dues",{h:"dlist",t:"v_dlist",ic:"people"},{h:"clist",t:"v_clist",ic:"people"},"parties",{h:"int",t:"v_int",ic:"clock"},"msme","§irep",{site:"stock"},"b2profit","§payr","stf",{h:"stf/year",t:"v_bonus",ic:"list"},"§xrep","charts",{h:"exc",t:"v_exc",ic:"flag"},"reports","cadb","ebook"]],["tax",["§gst",{site:"gstr1"},{site:"gstr3b"},{site:"gstr2b"},{site:"cmp08"},"gststk","gtds","isd","cagst","§itax","tdsr","acx","itx","limits","§payst",{h:"stf/pf",t:"v_pf",ic:"doc"},{h:"stf/esi",t:"v_esi",ic:"doc"},{h:"stf/tax",t:"v_saltds",ic:"doc"},"§audit","cacom","cadoc"]],["util",["§data",{my:"backup",t:"v_backup",ic:"data"},"bimp","mig","mkimp","msg","pd","env",{h:"mprint",t:"v_mprint",ic:"doc"},"b2year","§setup",{h:"config",t:"v_config",ic:"set"},{h:"bw",t:"v_bw",ic:"list"},"features","packs","§tools",{site:"tds"},{site:"declaration"},"pdffill","ftools","tools"]]],Ot={acc:"Accounting Masters",inv:"Inventory Masters",pay:"Payroll Masters",dsp:"Dispatch Masters",co:"Company",vch:"Accounting Vouchers",ivch:"Inventory Vouchers",payv:"Payroll Vouchers",payr:"Payroll Reports",payst:"Payroll Statutory",lists:"Lists and Registers",assets:"Assets and Loans",trade:"Trade Registers",final:"Final Accounts",books:"Books and Registers",os:"Outstandings",irep:"Inventory Reports",xrep:"Exceptions and Export",gst:"GST",itax:"TDS and Income Tax",audit:"Audit",data:"Data",setup:"Configuration",tools:"Tools"},ae={};ht.forEach(function(t){t[1].forEach(function(e){typeof e=="string"&&(ae[e]=t[0])})}),ae.st="masters";function re(t){var e=window.NSApp&&NSApp.data&&pe[t==="docs"?"x-docs":t];return e||(t==="docs"?NS.t("desk.sg_new"):NS.t("desk.um_"+t))}function ie(t){var e=w();if(e&&e.myUrl)return e.myUrl("#"+t);var a=s("#ns-side a[data-ic=set]");return(a?a.href.split("#")[0]:"https://my.niveshsahayak.in/")+"#"+t}function It(t){var e=Me.filter(function(a){return a[0]===t})[0];return e?e[2]||"Alt+G "+e[1]:""}function q(t){if($[t])return $[t];var e=P[t],a=e&&Q(t);return a||(e&&e[1]?"Alt+"+e[1]:e?"Alt+G "+e[0]:"")}function Qe(t){var e=NS.el("a",{class:"side-v","data-ic":t.ic||"dot"}),a="";if(t.f)e.href="#",e.setAttribute("data-dform",t.f),a=It(t.f),it(t.f)&&(e.hidden=!0);else if(t.or)e.href="#",e.setAttribute("data-oract",t.or),wt[t.or]&&(a="Alt+G "+wt[t.or]);else if(t.my)e.href=ie(t.my),e.setAttribute("data-my",t.my),Nt[t.my]&&(a="Alt+G "+Nt[t.my]);else if(t.fin)e.href="#fin/"+t.fin,e.setAttribute("data-hsec","fin/"+t.fin),a=q("fin/"+t.fin);else if(t.h)e.href="#"+t.h,e.setAttribute("data-hsec",t.h),a=q(t.h);else if(t.site){var i=s('#ns-side .side-g a[data-ic="t-'+t.site+'"]');return i?(e.href=i.href,e.setAttribute("data-ic","t-"+t.site),i.getAttribute("data-port")&&e.setAttribute("data-port",i.getAttribute("data-port")),e.innerHTML=i.innerHTML,e.title=(i.textContent||"").trim(),i.hidden=!0,e):null}return e.innerHTML='<span data-i18n="desk.'+t.t+'">'+v(NS.t("desk."+t.t))+"</span>",a?(e.setAttribute("data-kh",a),e.title=NS.t("desk."+t.t)+"  ·  "+a):e.title=NS.t("desk."+t.t),e}document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-qnew]");if(e){t.preventDefault(),U(),NS.quickAddNew(e.getAttribute("data-qnew"));return}var a=t.target.closest&&t.target.closest("[data-oract]");if(a){t.preventDefault(),U();var i=w();i&&i.orAct&&(i.whenReady||function(r){r()})(function(){i.biz()&&!s("dialog[open]")&&i.orAct(a.getAttribute("data-oract"))});return}var n=t.target.closest&&t.target.closest("[data-dform]");n&&(t.preventDefault(),U(),Lt(n.getAttribute("data-dform")))}),NS.crumbs=function(t){var e=t==="home"&&_.classList.contains("has-hub");return _.classList.toggle("sc-on",e),e?de()+'<div class="dash-logo" aria-hidden="true"><span class="brand"><img class="mk mk-l" src="/icons/mark-light-270.webp" alt=""><img class="mk mk-d" src="/icons/mark-dark-270.webp" alt=""><b class="nsb"><span class="nsb-b">Biz</span></b></span></div>':""};var se={sale:"shop",pbill:"cart",min:"money",mout:"send",contra:"bank",b2jv:"journal",exp:"coins",challan:"truck",credit:"repeat",debit:"repeat",note:"repeat"};function oe(){var t=[["v_newparty","q:party","people",$["q:party"]],["v_newitem","q:item","box",$["q:item"]]].concat([["sale","v_sale"],["pbill","v_pbill"],["min","v_min"],["mout","v_mout"],["contra","v_contra"],["b2jv","v_jv"],["exp","v_exp"]].map(function(e){return[e[1],e[0]==="b2jv"?"#b2jv":"f:"+e[0],se[e[0]]||"doc",e[0]==="b2jv"?q("b2jv"):It(e[0])]}),[["v_tb","#fin/tb","list",$["fin/tb"]],["v_bs","#fin/bs","scale",$["fin/bs"]],["v_pl","#fin/pl","chart",$["fin/pl"]],["v_ledger","#parties","people",q("parties")],["v_dlist","#dlist","people",q("dlist")],["v_clist","#clist","people",q("clist")],["v_dues","#dues","clock",q("dues")],["v_stock","#stock","box",q("stock")],["v_books","#books","book",q("books")]]);return t.filter(function(e){var a=e[1];if(/^q:/.test(a))return!!NS.quickAddNew;if(/^f:/.test(a))return!it(a.slice(2));if(/^#/.test(a)){var i=a.slice(1).split("/")[0];return i==="fin"||/^(dlist|clist|ssum|psum|vreg|cbsum|coa)$/.test(i)||s('#ns-side a[data-sec="'+i+'"]')&&!st(i)}return!0}).map(function(e){var a=/^f:/.test(e[1]),i=/^q:/.test(e[1]);return{id:e[1],t:NS.t("desk."+e[0]),html:'<a class="sc-i" href="'+(a||i?"#":v(e[1]))+'"'+(a?' data-dform="'+e[1].slice(2)+'"':"")+(i?' data-qnew="'+e[1].slice(2)+'"':"")+' data-ic="'+e[2]+'"><span>'+v(NS.t("desk."+e[0]))+"</span>"+(e[3]?"<kbd>"+v(e[3])+"</kbd>":"")+"</a>"}})}var Bt="ns-scp",ce=1/0,Ze=["q:party","q:item","f:sale","f:pbill","f:min","f:mout","f:exp","#fin/tb","#parties","#dues"];function Xe(){try{var t=JSON.parse(localStorage.getItem(Bt)||"null");return Array.isArray(t)?t:null}catch{return null}}function le(t){try{t?localStorage.setItem(Bt,JSON.stringify(t)):localStorage.removeItem(Bt)}catch{}}function Rt(){var t=oe(),e={};t.forEach(function(r){e[r.id]=r});var a=Xe();if(!a){var i=Ze.map(function(r){return e[r]}).filter(Boolean);return(i.length?i:t).slice(0,ce)}var n={};return rt().forEach(function(r){r.c&&!r.off&&(n[r.c]=r)}),a.map(function(r){if(e[r])return e[r];var o=/^c:/.test(r)&&n[r.slice(2)];if(!o)return null;var l=o.k||"Alt+G "+o.c,d=o.h&&(s('#ns-side a[href="#'+o.h+'"]')||s('#ns-side a[data-hsec="'+o.h+'"]')),h=d&&d.getAttribute("data-ic")||(o.k&&/^F|Alt\+[A-Z]$/.test(o.k)?"doc":"list");return{id:r,t:o.t,html:'<a class="sc-i" href="#" data-sccode="'+v(o.c)+'" data-ic="'+v(h==="dot"?"list":h)+'"><span>'+v(o.t)+"</span><kbd>"+v(l)+"</kbd></a>"}}).filter(Boolean).slice(0,ce)}function de(){return'<aside class="sc-panel" aria-label="'+v(NS.t("desk.sc_t"))+'"><h3><span>'+v(NS.t("desk.sc_t"))+'</span><button type="button" class="sc-cust" data-sc-cust title="Customize the shortcuts" aria-label="Customize the shortcuts">Customize</button></h3>'+Rt().map(function(t){return t.html}).join("")+"</aside>"}function ue(){var t=s(".sc-panel");if(t){var e=document.createElement("div");e.innerHTML=de(),t.replaceWith(e.firstChild)}}var I=null;function tn(){I||(I=NS.el("dialog",{class:"sc-dlg","aria-labelledby":"sc-dlg-h"}),document.body.appendChild(I));var t=oe(),e=rt().filter(function(u){return u.c&&!u.off}),a={},i=[];t.forEach(function(u){a[u.id]=u.t,i.push({id:u.id,t:u.t,g:"Common"})}),e.filter(function(u){return!t.some(function(c){return c.t===u.t})}).sort(function(u,c){return u.t.localeCompare(c.t)}).forEach(function(u){a["c:"+u.c]=u.t,i.push({id:"c:"+u.c,t:u.t,g:"All screens, entries and documents"})});var n=Rt().map(function(u){return u.id});I.innerHTML='<div class="dlg-hd"><h2 id="sc-dlg-h">Customize the shortcuts</h2><button type="button" class="btn sm" data-sc-reset>Reset to the standard list</button><button type="button" class="btn sm primary" data-sc-close>Done</button></div><p class="soft sc-help">Tick as many shortcuts as you like for the right of the Dashboard. The first ten get the Alt keys Z1 to Z9 and Z0; every one also keeps its own Alt key code. Drag the list on the right into your order (or Alt+Up / Alt+Down). Saved at once in this browser.</p><div class="sc-cols"><section class="sc-all" aria-label="Every screen"><input type="search" class="sc-q" placeholder="Search every screen…" aria-label="Search every screen"><div class="sc-opts" data-sc-opts></div></section><section class="sc-mine" aria-label="Your shortcuts"><h3>Your shortcuts <span class="soft" data-sc-n></span></h3><ol class="sc-list" data-sc-list></ol></section></div>';var r=s("[data-sc-opts]",I),o=s("[data-sc-list]",I),l=s(".sc-q",I);function d(){le(n.slice()),ue(),s("[data-sc-n]",I).textContent="("+n.length+")"}function h(u){if(o.innerHTML=n.map(function(f,m){return'<li draggable="true" tabindex="0" data-id="'+v(f)+'"><span class="sc-grip" aria-hidden="true">⠿</span><span class="sc-t">'+v(a[f]||f)+'</span><button type="button" class="btn sm" data-sc-top'+(m?"":" disabled")+' title="Move to the top">Top</button><button type="button" class="btn sm sc-x" data-sc-rm title="Remove" aria-label="Remove '+v(a[f]||f)+'">×</button></li>'}).join(""),s("[data-sc-n]",I).textContent="("+n.length+")",u){var c=s('li[data-id="'+u.replace(/"/g,"")+'"]',o);c&&c.focus()}}function b(){var u=l.value.trim().toLowerCase(),c="";r.innerHTML=i.filter(function(f){return!u||f.t.toLowerCase().indexOf(u)>=0}).map(function(f){var m=f.g!==c?'<p class="sc-g">'+v(f.g)+"</p>":"";return c=f.g,m+'<label class="chk sc-o"><input type="checkbox" data-sc-pick="'+v(f.id)+'"'+(n.indexOf(f.id)>=0?" checked":"")+"> "+v(f.t)+"</label>"}).join("")||'<p class="soft">Nothing found.</p>'}function p(u,c){var f=s('[data-sc-pick="'+u.replace(/"/g,"")+'"]',r);f&&(f.checked=c)}function S(u,c,f){c<0||c>=n.length||u===c||(n.splice(c,0,n.splice(u,1)[0]),d(),h(f))}h(),b(),l.addEventListener("input",b),r.addEventListener("change",function(u){var c=u.target.closest("[data-sc-pick]");if(c){var f=c.getAttribute("data-sc-pick"),m=n.indexOf(f);c.checked&&m<0?n.push(f):!c.checked&&m>=0&&n.splice(m,1),d(),h()}}),I.onclick=function(u){var c=u.target.closest("button");if(c){if(c.hasAttribute("data-sc-close")){I.close();return}if(c.hasAttribute("data-sc-reset")){le(null),ue(),n=Rt().map(function(M){return M.id}),h(),b();return}var f=c.closest("li");if(f){var m=f.getAttribute("data-id"),N=n.indexOf(m);c.hasAttribute("data-sc-top")?S(N,0,m):c.hasAttribute("data-sc-rm")&&(n.splice(N,1),d(),h(),p(m,!1))}}};var y=null;o.ondragstart=function(u){var c=u.target.closest("li");if(c){y=c.getAttribute("data-id"),c.classList.add("sc-drag");try{u.dataTransfer.effectAllowed="move",u.dataTransfer.setData("text/plain",y)}catch{}}},o.ondragover=function(u){if(y){u.preventDefault();var c=u.target.closest("li");if(g(".sc-over-a,.sc-over-b",o).forEach(function(m){m.classList.remove("sc-over-a","sc-over-b")}),c&&c.getAttribute("data-id")!==y){var f=c.getBoundingClientRect();c.classList.add(u.clientY<f.top+f.height/2?"sc-over-a":"sc-over-b")}}},o.ondrop=function(u){u.preventDefault();var c=u.target.closest("li");if(!(!y||!c)){var f=n.indexOf(y),m=c.getBoundingClientRect(),N=n.indexOf(c.getAttribute("data-id"))+(u.clientY<m.top+m.height/2?0:1);f<N&&N--;var M=y;y=null,S(f,N,M),h(M)}},o.ondragend=function(){y=null,g(".sc-drag,.sc-over-a,.sc-over-b",o).forEach(function(u){u.classList.remove("sc-drag","sc-over-a","sc-over-b")})},o.onkeydown=function(u){var c=u.target.closest("li");if(!(!c||u.target!==c)){var f=c.getAttribute("data-id"),m=n.indexOf(f);u.altKey&&u.key==="ArrowUp"?(u.preventDefault(),S(m,m-1,f)):u.altKey&&u.key==="ArrowDown"?(u.preventDefault(),S(m,m+1,f)):u.key==="ArrowUp"&&c.previousElementSibling?(u.preventDefault(),c.previousElementSibling.focus()):u.key==="ArrowDown"&&c.nextElementSibling?(u.preventDefault(),c.nextElementSibling.focus()):u.key==="Delete"&&(u.preventDefault(),n.splice(m,1),d(),h(n[m]||n[m-1]),p(f,!1))}},I.open||I.showModal(),l.focus()}document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-sc-cust], [data-sccode]");if(e){if(t.preventDefault(),e.hasAttribute("data-sc-cust")){tn();return}var a=rt().filter(function(i){return i.c===e.getAttribute("data-sccode")})[0];a&&a.run()}});var V=null;function U(){g(".mb-drop").forEach(function(t){t.remove()}),g('.mb-m[aria-expanded="true"]').forEach(function(t){t.setAttribute("aria-expanded","false")})}function en(){if(!(V||!s("#app .hub-nav, #app [data-pane]"))){var t=s("#main");if(t){V=NS.el("div",{class:"mbar",role:"menubar"});var e=ht.filter(function(n){return n[0]!=="top"}).map(function(n){return n[0]});e.splice(2,0,"docs"),V.innerHTML='<div class="mb-menus">'+e.map(function(n){return'<button type="button" class="mb-m" role="menuitem" aria-haspopup="true" aria-expanded="false" data-mb="'+n+'"><span data-i18n="'+(n==="docs"?"desk.sg_new":"desk.um_"+n)+'">'+v(re(n))+"</span> ▾</button>"}).join("")+'</div><div class="mb-tools" role="toolbar" aria-label="'+v(NS.t("desk.tb_t"))+'">'+[["sale","tb_sale"],["pbill","tb_pur"],["min","tb_rec"],["mout","tb_pay"],["contra","tb_contra"],["#b2jv","tb_jv"],["exp","tb_exp"],["@challan","tb_challan"],["@credit-note","tb_cn"],["@debit-note","tb_dn"]].map(function(n){var r=n[0],o=r.charAt(0)==="#"?q(r.slice(1)):r.charAt(0)==="@"?Q(r.slice(1))||(B[r.slice(1)]?B[r.slice(1)][1]?"Alt+"+B[r.slice(1)][1]:"Alt+G "+B[r.slice(1)][0]:""):It(r);return(r.charAt(0)==="@"||r.charAt(0)==="#"?st(r.slice(1)):it(r))?"":'<button type="button" class="mb-t" data-mbt="'+v(r)+'" data-ic="'+(se[r.replace(/^[#@]/,"").replace(/-note$/,"")]||(/note/.test(r)?"repeat":"doc"))+'" title="'+v(NS.t("desk."+n[1])+(o?"  ·  "+o:""))+'"><span data-i18n="desk.'+n[1]+'">'+v(NS.t("desk."+n[1]))+"</span>"+(o?"<kbd>"+v(o.replace("Alt+G ",""))+"</kbd>":"")+"</button>"}).join("")+"</div>";for(var a=s("#app",t);a&&a.parentNode!==t;)a=a.parentNode;t.insertBefore(V,a||t.firstChild),_.classList.add("mb-on");var i=function(){_.style.setProperty("--mb-h",(V.offsetHeight||0)+"px")};i(),window.addEventListener("resize",i),V.addEventListener("click",function(n){var r=n.target.closest("[data-mbt]");if(r){var o=r.getAttribute("data-mbt");U(),o.charAt(0)==="#"?Et(o.slice(1)):o.charAt(0)==="@"?$t(o.slice(1)):Lt(o);return}var l=n.target.closest("[data-mb]");if(l){var d=l.getAttribute("aria-expanded")==="true";if(U(),!d){var h=l.getAttribute("data-mb"),b=s(h==="docs"?'.side-g[data-g="docs"] .sg-b':'.sg[data-sg="'+h+'"] .sg-b',A),p=NS.el("div",{class:"mb-drop",role:"menu"});if(b&&g(":scope > a:not([hidden])",b).forEach(function(c){var f=c.getAttribute("data-sub");if(f&&p.lastSub!==f){p.lastSub=f;var m=s(':scope > .sg-sub[data-sub="'+f+'"]',b);m&&p.appendChild(NS.el("div",{class:"mb-sub",role:"presentation"},v(m.textContent)))}var N=c.cloneNode(!0);N.removeAttribute("id"),N.removeAttribute("aria-current"),N.setAttribute("role","menuitem"),N.classList.remove("on");var M=c.getAttribute("data-kh");M&&N.insertAdjacentHTML("beforeend","<kbd>"+v(M)+"</kbd>"),p.appendChild(N)}),!!p.children.length){var S=gt().map(function(c){return c.k});b&&g(":scope > a:not([hidden])",b).forEach(function(c,f){var m=ln(c),N=g("a",p)[f];!m||!N||N.insertAdjacentHTML("beforeend",'<button type="button" class="mb-pin'+(S.indexOf(m)>=0?" on":"")+'" data-pin="'+v(m)+'" title="Pin to the left" aria-label="Pin '+v((c.textContent||"").trim())+' to the left"></button>')});var y={sale:"sales",pbill:"buy",pret:"buy",exp:"buy",min:"money",mout:"money",contra:"books"};g("a[data-dform]",p).forEach(function(c){var f=c.getAttribute("data-dform");y[f]&&c.insertAdjacentHTML("beforeend",'<span class="mb-aml"><button type="button" data-vmod="'+f+'" title="Modify: open the last saved one">Modify</button><button type="button" data-vlist="'+y[f]+'" title="List of saved ones">List</button></span>')}),p.addEventListener("click",function(c){var f=c.target.closest("[data-vmod],[data-vlist]");if(f){c.preventDefault(),c.stopPropagation(),U();var m=w();if(f.hasAttribute("data-vlist")){location.hash=f.getAttribute("data-vlist");return}m&&m.vtModify&&(m.whenReady||function(N){N()})(function(){m.vtModify(f.getAttribute("data-vmod"))})}},!0),p.addEventListener("click",function(c){var f=c.target.closest(".mb-pin");if(f){c.preventDefault(),c.stopPropagation();var m=f.closest("a"),N=m?((m.querySelector("span")||m).textContent||"").trim():"";me(f.getAttribute("data-pin"),N),f.classList.toggle("on")}},!0),l.setAttribute("aria-expanded","true"),l.parentNode.appendChild(p),p.style.insetInlineStart=l.offsetLeft+"px";var u=s("a",p);u&&u.focus()}}}}),V.addEventListener("keydown",function(n){var r=s(".mb-drop",V);if(r){var o=g("a",r),l=o.indexOf(document.activeElement);if(n.key==="ArrowDown")n.preventDefault(),(o[l+1]||o[0]).focus();else if(n.key==="ArrowUp")n.preventDefault(),(o[l-1]||o[o.length-1]).focus();else if(n.key==="Escape"){n.preventDefault(),n.stopPropagation();var d=s('.mb-m[aria-expanded="true"]',V);U(),d&&d.focus()}}}),V.addEventListener("click",function(n){n.target.closest(".mb-drop a")&&setTimeout(U,0)},!0),document.addEventListener("click",function(n){n.target.closest(".mbar")||U()}),window.addEventListener("hashchange",U)}}}function vt(){try{return JSON.parse(localStorage.getItem("ns-sg")||"{}")||{}}catch{return{}}}var fe={};function bt(t){var e=NS.lang&&NS.lang()||"en",a=fe[e]||(fe[e]=new Intl.Collator(e,{sensitivity:"base"})),i=function(l,d){return a.compare((l.textContent||"").trim(),(d.textContent||"").trim())},n=g(":scope > a",t),r=g(":scope > .sg-sub",t),o=function(l){t.appendChild(l)};if(!r.length){n.sort(i).forEach(o);return}n.filter(function(l){return!l.getAttribute("data-sub")}).sort(i).forEach(o),r.forEach(function(l){var d=n.filter(function(h){return h.getAttribute("data-sub")===l.getAttribute("data-sub")}).sort(i);t.appendChild(l),d.forEach(o),l.hidden=!d.some(function(h){return!h.hidden&&getComputedStyle(h).display!=="none"})})}function nn(){var t=window.NS_CFG&&NS_CFG.inapp||{},e={};Object.keys(t).forEach(function(l){var d=t[l]||[];/^#/.test(String(d[2]||""))&&(e[l]=1,d[1]&&(e[":"+d[1]]=1))});var a=vt(),i=["docs","more","app"];g(".side-g:not(.side-own)",A).forEach(function(l){var d=l.getAttribute("data-g")||"x",h=s(".side-h",l);if(!(!h||l.hasAttribute("data-sgx"))){if(l.setAttribute("data-sgx",""),g("a",l).forEach(function(u){var c="",f=u.getAttribute("data-port");try{c=new URL(u.href,location.href).hostname.split(".")[0]}catch{}(e[c]||f&&e[":"+f])&&(u.hidden=!0)}),d==="docs"){var b=s("span",h);b&&!b.hasAttribute("data-erp")&&(b.setAttribute("data-i18n","desk.sg_new"),b.textContent=NS.t("desk.sg_new"))}var p=NS.el("button",{type:"button",class:"sg-h","aria-expanded":"true"});p.innerHTML=h.innerHTML,h.replaceWith(p);for(var S=NS.el("div",{class:"sg-b"});p.nextSibling;)S.appendChild(p.nextSibling);l.appendChild(S),l.classList.add("sg"),l.setAttribute("data-sg","x-"+d);var y=a["x-"+d]!==!1;l.classList.toggle("shut",y),p.setAttribute("aria-expanded",String(!y)),p.addEventListener("click",function(){var u=vt(),c=!l.classList.contains("shut");l.classList.toggle("shut",c),p.setAttribute("aria-expanded",String(!c)),u["x-"+d]=c;try{localStorage.setItem("ns-sg",JSON.stringify(u))}catch{}}),g(".sg-b a:not([hidden])",l).length||(l.hidden=!0),(d==="docs"||d==="more")&&(bt(S),document.addEventListener("ns-lang",function(){setTimeout(function(){bt(S)},50)}))}});var n=g(".side-g[data-sgx]",A).sort(function(l,d){var h=i.indexOf(l.getAttribute("data-g")),b=i.indexOf(d.getAttribute("data-g"));return(h<0?9:h)-(b<0?9:b)});n.forEach(function(l){A.appendChild(l)});var r=s('.sg[data-sg="trans"]',A),o=s('.side-g[data-g="docs"]',A);r&&o&&r.parentNode.insertBefore(o,r.nextSibling),en()}var an={"h:masters":"All Masters","h:masters/led":"Ledgers","h:masters/bank":"Bank Accounts","h:masters/biz":"Companies","h:masters/grp":"Account Groups","h:masters/item":"Stock Items","h:masters/igrp":"Stock Groups","h:masters/unit":"Units of Measure","h:masters/trn":"Transporters","h:masters/veh":"Vehicles","h:masters/vt":"Voucher Types","h:coa":"Chart of Accounts","s:parties":"Party Accounts","s:b2gd":"Godowns and Stock Transfer","s:stf":"Employees and Payroll","s:b2sman":"Salesmen and Agents","s:stf":"Salary Register","f:ob":"Opening Balances","s:trust":"Donors and Members","s:fees":"Students and Fees","s:warr":"Warranty and Service Register","f:sale":"Sales Voucher","f:pbill":"Purchase Voucher","f:min":"Receipt Voucher","f:mout":"Payment Voucher","f:contra":"Contra Voucher","f:exp":"Expense Voucher","f:pret":"Purchase Return","s:b2jv":"Journal Vouchers","s:capl":"Capital and Loans","s:chq":"Cheque Register","s:b2fa":"Fixed Asset Register","s:b2job":"Job Work (In and Out)","s:b2make":"Manufacturing Journal","s:money":"Receipts and Payments List","s:buy":"Purchases and Expenses List","s:sales":"Sales List","s:repeat":"Recurring Vouchers","s:khata":"Khata (Party Book)","s:preg":"Purchase Book","k:nav.billing":"Tax Invoice","k:nav.cashmemo":"Cash Memo","k:nav.challan":"Delivery Challan","k:nav.note":"Credit Note","k:nav.dnote":"Debit Note","k:nav.petty":"Petty Cash Book","k:nav.proforma":"Proforma Invoice","k:nav.po":"Purchase Order","k:nav.quote":"Quotation and Estimate","k:nav.receipt":"Money Receipt (print)","k:nav.rent":"Rent Receipt","k:nav.salary":"Salary Slip","k:nav.so":"Sales Order","k:nav.self":"Self Invoice (RCM)","k:nav.voucher":"Payment Voucher (print)","k:desk.v_bs":"Balance Sheet","k:desk.v_pl":"Profit and Loss A/c","k:desk.v_tb":"Trial Balance","h:os":"Bills Outstanding","s:books":"Day Book, Cash and Bank Books","h:cbsum":"Cash and Bank Summary","h:clist":"Sundry Creditors","h:dlist":"Sundry Debtors","s:dues":"Outstandings (Receivable and Payable)","s:fin":"Final Accounts","s:grp":"Group Summary","s:msme":"MSME Payables (45 days)","s:b2profit":"Bill-wise Gross Profit","s:reports":"Export Reports to Excel","h:ssum":"Sales Register","h:psum":"Purchase Register","h:exc":"Exception Reports","h:vreg":"Voucher Registers","s:cacom":"Auditor Comments","k:nav.cmp08":"CMP-08 Statement","k:nav.gstr1":"GSTR-1 Return","k:nav.gstr2b":"GSTR-2B Reconciliation","k:nav.gstr3b":"GSTR-3B Return","s:itx":"Income Tax Computation","s:limits":"Statutory Limits","s:acx":"Other Income and Tax Payments","k:nav.tds":"TDS and TCS Calculator","s:features":"Feature Settings","s:tools":"All Tools","k:desk.v_backup":"Backup and Restore","s:bimp":"Bank Statement Import","s:mig":"Bring Data from Other Software","s:mkimp":"Marketplace and Payment Reports","s:msg":"Messages (SMS and WhatsApp)","s:pd":"Print Designs","s:env":"Envelope Printing","h:mprint":"Print Many Vouchers","k:desk.v_settings":"Company Settings","s:packs":"Trade Packs","s:b2year":"Year-End Closing"},pe={trans:"Transactions (Vouchers)",reports:"Display and Reports",tax:"Statutory (GST and Tax)","x-docs":"Other Documents"};function rn(t){var e=t.querySelector("span"),a=e&&e.getAttribute("data-i18n");return t.getAttribute("data-hsec")?"h:"+t.getAttribute("data-hsec"):t.getAttribute("data-dform")?"f:"+t.getAttribute("data-dform"):t.getAttribute("data-sec")?"s:"+t.getAttribute("data-sec"):a?"k:"+a:""}function sn(t){window.NSApp&&NSApp.data&&(g(".sg-b > a, .side-g a",t).forEach(function(e){var a=an[rn(e)],i=e.querySelector("span");if(!(!a||!i||i.textContent===a)){i.removeAttribute("data-i18n"),i.setAttribute("data-erp","1"),i.textContent=a;var n=e.getAttribute("data-kh");e.title=a+(n?"  ·  "+n:"")}}),g(".sg[data-sg]",t).forEach(function(e){var a=pe[e.getAttribute("data-sg")],i=s(".sg-h span",e);a&&i&&i.textContent!==a&&(i.removeAttribute("data-i18n"),i.setAttribute("data-erp","1"),i.textContent=a)}))}var et=[["Other income and taxes","Other Income and Tax Payments"],["Fixed assets","Fixed Asset Register"],["Godowns and stock transfer","Godowns and Stock Transfer"],["Job work","Job Work (In and Out)"],["Journal entries","Journal Vouchers"],["Production","Manufacturing Journal"],["Profit report","Bill-wise Gross Profit"],["Salesmen","Salesmen and Agents"],["Year end","Year-End Closing"],["Bank statement import","Bank Statement Import"],["Cash and bank books","Day Book, Cash and Bank Books"],["Purchases and expenses","Purchases and Expenses List"],["CA comments","Auditor Comments"],["Cash and bank summary","Cash and Bank Summary"],["Cheques","Cheque Register"],["Creditors list","Sundry Creditors"],["Debtors list","Sundry Debtors"],["Dues","Outstandings (Receivable and Payable)"],["Things to check","Exception Reports"],["Cash and bank transfer","Contra Voucher"],["Expense","Expense Voucher"],["Money received","Receipt Voucher"],["Money paid","Payment Voucher"],["Opening balance","Opening Balance"],["Purchase bill","Purchase Voucher"],["Purchase return","Purchase Return"],["Sale bill","Sales Voucher"],["Additional features","Feature Settings"],["Student fees","Students and Fees"],["Balance sheet","Balance Sheet"],["Profit and loss","Profit and Loss A/c"],["Trial balance","Trial Balance"],["Group reports","Group Summary"],["Income tax planner","Income Tax Computation"],["Limits helper","Statutory Limits"],["Money in and out","Receipts and Payments List"],["Print many vouchers","Print Many Vouchers"],["MSME payables","MSME Payables (45 days)"],["Parties","Party Accounts"],["Purchase summary","Purchase Register"],["Sales summary","Sales Register"],["Repeating bills","Recurring Vouchers"],["Reports to Excel","Export Reports to Excel"],["Sales","Sales List"],["Employee salary and loans","Employees and Payroll"],["Staff, salary and loans","Employees and Payroll"],["All tools by job","All Tools"],["Donations and members","Donors and Members"],["Voucher registers","Voucher Registers"],["Warranty and service due","Warranty and Service Register"],["Bill-wise outstanding","Bills Outstanding"],["Capital and loans","Capital and Loans"],["Journal entry","Journal Voucher"],["Delivery challan","Delivery Challan"],["Credit note","Credit Note"],["Debit note","Debit Note"],["Cash memo","Cash Memo"],["Sales order","Sales Order"],["Purchase order","Purchase Order"],["Proforma invoice","Proforma Invoice"],["Self invoice","Self Invoice (RCM)"],["Export invoice","Export Invoice"]].sort(function(t,e){return e[0].length-t[0].length});function on(t){for(var e=t.firstChild;e&&!(e.nodeType===3&&e.nodeValue.trim())&&!(e.nodeType===1&&e.tagName==="SPAN"&&e.textContent.trim());)e=e.nextSibling;if(e){var a=e.nodeType===3?e.nodeValue:e.textContent,i=a.match(/^\s*/)[0],n=a.slice(i.length);if(!et.some(function(d){return n.indexOf(d[1])===0&&(n.length===d[1].length||/^[\s·:(\d?]/.test(n.slice(d[1].length)))}))for(var r=0;r<et.length;r++){var o=et[r][0];if(n===o||n.indexOf(o)===0&&/^[\s·:(\d]/.test(n.slice(o.length))){if(n.indexOf(et[r][1])===0)return;var l=i+et[r][1]+n.slice(o.length);e.nodeType===3?e.nodeValue=l:e.textContent=l;return}}}}var Ft=!1;function cn(){Ft=!1,g("[data-pane] h2, dialog[open] .dlg-hd h2, dialog[open] .dlg-h h2, dialog[open] > h2, #app-form h2").forEach(on)}window.NSApp&&NSApp.data&&new MutationObserver(function(){Ft||(Ft=!0,setTimeout(cn,20))}).observe(document.body,{childList:!0,subtree:!0});var he="ns-pins",Ht="ns-recent",mt=["data-sec","data-hsec","data-dform","data-oract","data-my","data-qnew"];function Kt(t){try{return JSON.parse(localStorage.getItem(t)||"[]")||[]}catch{return[]}}function ve(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch{}}function ln(t){for(var e=0;e<mt.length;e++)if(t.hasAttribute(mt[e]))return mt[e]+"="+t.getAttribute(mt[e]);var a=t.getAttribute("data-ic");return/^[td]-/.test(a||"")?"data-ic="+a:""}function dn(t){var e=t.split("=");return e[1]?s("#ns-side a["+e[0]+'="'+e.slice(1).join("=")+'"]:not(.gw-row)'):null}function un(t){var e=String(t||"").split("/")[0];return{st:"people",acl:"book",do:"doc",gsum:"layers",fin:"scale",masters:"set",stf:"people",os:"clock"}[e]||"list"}function be(t,e){var a=t.cloneNode(!0);return a.removeAttribute("id"),a.removeAttribute("aria-current"),a.classList.remove("on"),a.classList.add("gw-row"),a.hidden=!1,e&&a.insertAdjacentHTML("beforeend",e),a}function fn(){return!!(window.matchMedia&&matchMedia("(min-width: 901px)").matches)&&_.classList.contains("mb-on")}function gt(){return Kt(he)}function me(t,e){var a=gt(),i=a.map(function(n){return n.k}).indexOf(t);i>=0?a.splice(i,1):a.push({k:t,t:e}),ve(he,a.slice(0,12)),yt(),NS.toast(i>=0?"Unpinned: "+e:"Pinned: "+e)}function pn(){var t=location.hash.replace(/^#/,"");!t||/^(home|day|coa)$/.test(t)||/^do\/(my|page|web)\b/.test(t)||setTimeout(function(){var e=s('#ns-side a[href="#'+t+'"]:not(.gw-row)')||s('#ns-side a[data-hsec="'+t+'"]:not(.gw-row)')||s('#ns-side a[data-sec="'+t.split("/")[0]+'"]:not(.gw-row)'),a=((s("[data-pane]:not([hidden]) h2")||{}).textContent||"").replace(/\?$/,"").trim(),i=/^ftools\/./.test(t)&&a?a:e?(e.textContent||"").trim():a;if(i){var n=Kt(Ht).filter(function(r){return r.h!==t&&r.t!==i.slice(0,60)});n.unshift({h:t,t:i.slice(0,60)}),ve(Ht,n.slice(0,8)),yt()}},700)}function yt(){var t=w(),e=s("#ns-side .sg-top");if(!(!t||!t.biz||!e)){var a=s("#gw-box");if(!a){a=NS.el("div",{id:"gw-box",class:"gw"}),e.parentNode.insertBefore(a,e);var i=NS.el("div",{id:"gw-after",class:"gw"});e.parentNode.insertBefore(i,e.nextSibling)}if(t.biz()){var n=s("#gw-after"),r=t.biz()||{},o=t.mine?t.mine():[],l=NS.period?NS.period():null;if(!fn()){a.innerHTML="",n.innerHTML="";return}var d=o.reduce(function(c,f){return f&&f.date&&!f.cancelled&&f.date>c?f.date:c},""),h=l&&l.from?NS.fy(l.from):NS.fy(NS.today()),b='<div class="gw-co"><b>'+v(r.name||"")+"</b>"+(r.gstin?"<small>GSTIN "+v(r.gstin)+"</small>":"")+"<p><span>Financial year</span><b>"+v(h)+'</b></p><p><span>Period</span><button type="button" class="linkish" data-gw-per>'+v(l?NS.fmtDate(l.from)+" – "+NS.fmtDate(l.to):h)+"</button></p>"+(d?"<p><span>Last entry</span><b>"+v(NS.fmtDate(d))+"</b></p>":"")+"</div>",p=Kt(Ht).slice(0,4),S=[];p.forEach(function(c){var f=s('#ns-side a[href="#'+c.h+'"]:not(.gw-row)')||s('#ns-side a[data-hsec="'+c.h+'"]:not(.gw-row)'),m=f?be(f):NS.el("a",{href:"#"+c.h,class:"side-v gw-row","data-ic":un(c.h)},"<span>"+v(c.t)+"</span>");f||(m.title=c.t),S.push(m)}),o.filter(function(c){return c&&c.no&&c.id&&!c.cancelled&&c.type!=="ob"}).sort(function(c,f){return(f.updated||f.created||0)-(c.updated||c.created||0)}).slice(0,6-S.length).forEach(function(c){var f=c.buyer&&c.buyer.name||c.party||"",m=t.amountOf?t.amountOf(c):c.total,N=NS.el("a",{href:"#",class:"side-v gw-row gw-doc","data-ic":"doc","data-gwdoc":c.id,title:(t.docName?t.docName(c):c.type)+" "+c.no},"<span>"+v((t.docName?t.docName(c):c.type)+" "+c.no)+(f||m?"<small>"+v(f)+(f&&m?" · ":"")+(m?v(NS.money?NS.money(m):String(m)):"")+"</small>":"")+"</span>");S.push(N)}),a._h!==b&&(a.innerHTML=b,a._h=b);var y=n;n=document.createElement("div"),n.innerHTML=S.length?'<div class="gw-h">Recently opened</div>':"",S.forEach(function(c){n.appendChild(c)});var u=gt().map(function(c){var f=dn(c.k);return f?be(f,'<button type="button" class="gw-unpin" data-gw-unpin="'+v(c.k)+'" title="Unpin" aria-label="Unpin '+v(c.t)+'"></button>'):null}).filter(Boolean);u.length?(n.insertAdjacentHTML("beforeend",'<div class="gw-h">Pinned</div>'),u.forEach(function(c){n.appendChild(c)})):n.insertAdjacentHTML("beforeend",'<div class="gw-h">Pinned</div><p class="gw-hint">Point at any item in the top menu and press its pin to keep it here.</p>'),y.innerHTML!==n.innerHTML&&y.replaceChildren.apply(y,[].slice.call(n.childNodes))}}}document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-gw-unpin],[data-gw-per],[data-gwdoc]");if(e)if(t.preventDefault(),t.stopPropagation(),e.hasAttribute("data-gw-unpin")){var a=e.getAttribute("data-gw-unpin");me(a,(gt().filter(function(n){return n.k===a})[0]||{}).t||"")}else if(e.hasAttribute("data-gw-per"))NS.periodBox&&NS.periodBox();else{var i=w();i&&i.viewDoc&&i.viewDoc(e.getAttribute("data-gwdoc"))}},!0),window.addEventListener("hashchange",pn);var ge=0,nt=function(){clearTimeout(ge),ge=setTimeout(yt,250)};document.addEventListener("ns-saved",nt),document.addEventListener("ns-data",nt),window.addEventListener("resize",nt),NS.gateway=yt;function kt(){var t=s("[data-sbar] .s-l");if(!(!t||!w()||!w().biz)){var e=s("[data-s-path]",t);if(!e){e=NS.el("span",{class:"s-path","data-s-path":""});var a=s("[data-s-fy]",t);a&&a.parentNode?a.parentNode.insertBefore(e,a.nextSibling):t.appendChild(e)}var i=s("#app-form[open]"),n=[],r=location.hash.replace(/^#/,""),o=r?s('#ns-side a[href="#'+r+'"]:not(.gw-row)')||s('#ns-side a[data-hsec="'+r+'"]:not(.gw-row)')||s('#ns-side a[data-sec="'+r.split("/")[0]+'"]:not(.gw-row)'):null;if(i){var l=((s("h2",i)||{}).textContent||"").split(" · ")[0].trim(),d=s('#ns-side a[data-dform="'+i.getAttribute("data-kind")+'"]:not(.gw-row)');n=[d?ye(d):"Transactions (Vouchers)",ke(d),l]}else if(!r||r==="home"||s('#ns-side a[data-sec="home"][aria-current="page"]'))n=["Gateway"];else if(o)n=[ye(o),ke(o),(o.textContent||"").trim().split(`
`)[0]];else{var h=s("[data-pane]:not([hidden]) h2"),b=h?[].slice.call(h.childNodes).filter(function(p){return p.nodeType===3}).map(function(p){return p.textContent}).join(" ").replace(/\?$/,"").trim():"";n=b?[b]:[]}e.textContent=n.filter(Boolean).join(" › ")}}function ye(t){var e=t&&t.closest(".sg");if(!e)return"";var a=e.getAttribute("data-sg");return a==="top"?"":re(a)}function ke(t){var e=t&&t.getAttribute("data-sub");return e&&Ot[e]||""}window.addEventListener("hashchange",function(){setTimeout(kt,300)}),new MutationObserver(function(t){t.some(function(e){return e.target&&e.target.id==="app-form"})&&setTimeout(kt,60)}).observe(document.documentElement,{subtree:!0,attributes:!0,attributeFilter:["open"]});var H=null,Y=null,St=[];function Se(t){var e=String(t||"").replace(/,/g,"").replace(/×/g,"*").replace(/÷/g,"/").replace(/(\d+(?:\.\d+)?)%/g,"($1/100)");if(!/^[\d\s.+\-*/()]+$/.test(e)||!/\d/.test(e))return null;try{var a=Function('"use strict";return ('+e+")")();return typeof a=="number"&&isFinite(a)?Math.round(a*1e6)/1e6:null}catch{return null}}function we(){if(Y=document.activeElement&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)?document.activeElement:null,!H){H=NS.el("dialog",{class:"calc-dlg","aria-labelledby":"calc-h"}),H.innerHTML='<div class="dlg-hd"><h2 id="calc-h">Calculator</h2><button type="button" class="btn sm" data-calc-x>Close</button></div><div class="calc-b"><input id="calc-in" type="text" inputmode="decimal" autocomplete="off" aria-label="Sum to work out" placeholder="For example 1250*18% or (450+120)*3"><p class="calc-r" aria-live="polite">= <b data-calc-r>0</b></p><div class="calc-a"><button type="button" class="btn sm" data-calc-copy>Copy</button><button type="button" class="btn sm primary" data-calc-use>Use in the box</button></div><ol class="calc-h" data-calc-hist></ol><p class="soft">+ − × ÷ and %: 18% of 1250 is 1250*18%. Enter keeps the line below.</p></div>',document.body.appendChild(H);var t=s("#calc-in",H),e=s("[data-calc-r]",H),a=s("[data-calc-hist]",H),i=function(){var r=Se(t.value);return e.textContent=r===null?t.value.trim()?"…":"0":NS.money?String(r):r,r};t.addEventListener("input",i),t.addEventListener("keydown",function(r){if(r.key==="Enter"){r.preventDefault();var o=i();o!==null&&(St.unshift(t.value+" = "+o),St=St.slice(0,6),a.innerHTML=St.map(function(l){return"<li>"+v(l)+"</li>"}).join(""),t.value=String(o))}}),H.addEventListener("click",function(r){var o=r.target.closest("button");if(o){var l=Se(t.value);if(o.hasAttribute("data-calc-x"))H.close();else if(o.hasAttribute("data-calc-copy")&&l!==null)try{navigator.clipboard.writeText(String(l)),NS.toast("Copied "+l)}catch{}else o.hasAttribute("data-calc-use")&&l!==null&&(H.close(),Y&&Y.isConnected&&(Y.value=String(l),Y.dispatchEvent(new Event("input",{bubbles:!0})),Y.dispatchEvent(new Event("change",{bubbles:!0})),Y.focus()))}})}H.showModal();var n=s("#calc-in",H);n.focus(),n.select()}NS.calc=we;function hn(t){var e={},a=vt(),i={};function n(b){if(e[b])return e[b];var p=s('.sg[data-sg="'+b+'"]',t);if(!p){p=NS.el("div",{class:"sg"+(b==="top"?" sg-top":""),"data-sg":b}),p.innerHTML=(b==="top"?"":'<button type="button" class="sg-h" aria-expanded="true"><span data-i18n="desk.um_'+b+'">'+v(NS.t("desk.um_"+b))+"</span></button>")+'<div class="sg-b"></div>';var S=ht.map(function(m){return m[0]}).concat(["more"]),y=S.indexOf(b),u=null;g(".sg",t).forEach(function(m){!u&&S.indexOf(m.getAttribute("data-sg"))>y&&(u=m)}),t.insertBefore(p,u);var c=s(".sg-h",p);c&&c.addEventListener("click",function(){var m=vt(),N=!p.classList.contains("shut");p.classList.toggle("shut",N),this.setAttribute("aria-expanded",String(!N)),m["u-"+b]=N;try{localStorage.setItem("ns-sg",JSON.stringify(m))}catch{}});var f=window.matchMedia&&matchMedia("(min-width: 901px)").matches;c&&("u-"+b in a?a["u-"+b]:f)&&(p.classList.add("shut"),c.setAttribute("aria-expanded","false"))}return e[b]=s(".sg-b",p)}function r(){g(".sg-b",A||document).forEach(function(b){var p=Array.prototype.slice.call(b.children),S,y,u;for(S=0;S<p.length;S++)if(p[S].classList.contains("sg-sub")){for(u=!1,y=S+1;y<p.length&&!p[y].classList.contains("sg-sub");y++)if(!p[y].hidden&&getComputedStyle(p[y]).display!=="none"){u=!0;break}p[S].hidden=!u}})}NS.sideTidy=r;function o(){ht.forEach(function(u){var c=n(u[0]),f="";u[1].forEach(function(m){if(typeof m=="string"&&m.charAt(0)==="§"){f=m.slice(1),!s(':scope > .sg-sub[data-sub="'+f+'"]',c)&&Ot[f]&&c.appendChild(NS.el("div",{class:"sg-sub","data-sub":f},v(Ot[f])));return}if(typeof m=="string"){var N=s(':scope > a[data-sec="'+m+'"]',t)||s('.sg-b > a[data-sec="'+m+'"]',t);N&&(c.appendChild(N),f?N.setAttribute("data-sub",f):N.removeAttribute("data-sub"));return}var M=JSON.stringify(m);if(!i[M]){var Rn=Qe(m);i[M]=Rn||1}i[M]&&i[M]!==1&&(c.appendChild(i[M]),f&&i[M].setAttribute("data-sub",f))})}),g(":scope > a[data-sec]",t).forEach(function(u){n("more").appendChild(u)}),sn(A||document),g('.sg[data-sg="x-docs"] .sg-b, .sg[data-sg="x-more"] .sg-b',A||document).forEach(bt),g('#ns-side a[data-ic^="t-"], #ns-side a[data-ic^="d-"]').forEach(function(u){var c=u.getAttribute("data-ic").replace(/^[td]-/,""),f=B[c],m=qt[c]||P[c]&&P[c][0],N=f?f[1]?"Alt+"+f[1]:"Alt+G "+f[0]:m?"Alt+G "+m:"";N&&!u.getAttribute("data-kh")&&(u.setAttribute("data-kh",N),u.title=(u.textContent||"").trim()+"  ·  "+N)});var b=window.NSApp&&NSApp.stfTabs?NSApp.stfTabs():null;b&&g('a[data-hsec^="stf/"]',A||document).forEach(function(u){u.hidden=b.indexOf(u.getAttribute("data-hsec").slice(4))<0}),g("a[data-oract]",A||document).forEach(function(u){u.hidden=!(window.NSApp&&NSApp.orAct)}),Object.keys(e).forEach(function(u){u!=="top"&&bt(e[u])}),r(),nt(),setTimeout(kt,50);var p=s('a[aria-current="page"]',t);if(p){var S=p.closest(".sg");if(S&&S.classList.contains("shut")){S.classList.remove("shut");var y=s(".sg-h",S);y&&y.setAttribute("aria-expanded","true")}}}var l="";function d(){return[g("a",A||document).length,NS.lang&&NS.lang()||"",window.NSApp&&NSApp.stfTabs?String(NSApp.stfTabs()):"",!!(window.NSApp&&NSApp.orAct)].join("|")}var h=o;o=function(){h(),l=d()},o(),document.addEventListener("ns-lang",function(){setTimeout(o,60)}),new MutationObserver(function(){s(":scope > a[data-sec]",t)&&o()}).observe(t,{childList:!0}),window.addEventListener("hashchange",function(){setTimeout(function(){if(d()!==l)o();else{nt(),kt();var b=s('a[aria-current="page"]',t);if(b){var p=b.closest(".sg");if(p&&p.classList.contains("shut")){p.classList.remove("shut");var S=s(".sg-h",p);S&&S.setAttribute("aria-expanded","true")}}}},50)})}function vn(){if(A=s("#ns-side"),O=s("[data-sbar]"),!!A){var t=s("#ns-remind"),e=s("#main");t&&e&&e.insertBefore(t,e.firstChild),g("a",A).forEach(function(n){n.title||(n.title=(n.textContent||"").trim())}),/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent)&&g(".desk-cmdbtn kbd").forEach(function(n){n.textContent="⌘ K"}),tt&&g("a[data-port]",A).forEach(function(n){n.href="http://localhost:"+n.getAttribute("data-port")+"/"}),ne(),A.addEventListener("click",function(n){if(n.target.closest("[data-side-mini]")){ft();return}n.target.closest("a")&&!ut()&&pt(!1),n.target.closest("a[data-sec]")&&setTimeout(function(){window.scrollTo(0,0)},0)}),document.addEventListener("click",function(n){n.target.closest("[data-side-btn]")?xt():n.target.closest("[data-side-shade]")?pt(!1):n.target.closest("[data-desk-cmd]")?ot():n.target.closest("[data-desk-install]")?_e():n.target.closest("[data-s-keys]")?Pt():n.target.closest("[data-s-backup]")&&Gt('[data-act="my-data"]')}),(J.get("ns-side-mini")==="1"||ut()&&innerWidth<1100&&J.get("ns-side-mini")!=="0")&&ft(!0);var a=s("a[aria-current=page]",A);a&&a.scrollIntoView&&ut()&&a.scrollIntoView({block:"nearest"}),at();var i=s("[data-pane]");i&&new MutationObserver(function(){ne(),at()}).observe(i,{childList:!0}),j()&&_.classList.add("installed"),window.addEventListener("hashchange",Ne),Ne()}}function Ne(){if(!(!w()||!A)){var t=/^#do\/([a-z0-9-]+)/.exec(location.hash),e=null;g(".side-g:not(.side-own) a",A).forEach(function(a){var i=t&&(a.href.indexOf("//"+t[1]+".niveshsahayak.in")>0||a.getAttribute("data-port")&&(w().toolUrl(t[1])===a.href||t[1]==="my"&&a.getAttribute("data-ic")==="set"));i?(a.setAttribute("aria-current","page"),e=a):a.removeAttribute("aria-current")}),g("a[data-sec]",A).forEach(function(a){t&&a.setAttribute("aria-current","false")}),e&&e.scrollIntoView&&e.scrollIntoView({block:"nearest"})}}function bn(t){if(!t)return k("nobackup");var e=Math.floor((Date.now()-t)/864e5);return k("backup",{d:e<1?k("today"):k("days",{n:e})})}var Ae=null;function mn(){if(w()&&w().biz){var t=w().biz();return Promise.resolve(t?t.name:"")}return window.NSStore?Promise.all([NSStore.list("biz"),NSStore.meta("settings")]).then(function(e){var a=e[1]||{},i=NS.curBiz()||a.defBiz,n=e[0].filter(function(r){return r.id===i})[0]||e[0][0];return n?n.name:""}).catch(function(){return""}):Promise.resolve("")}function at(){if(O){var t=w()&&w().biz&&NS.period&&NS.period();s("[data-s-fy]",O).textContent=t?NS.fmtDate(t.from)+" – "+NS.fmtDate(t.to):k("fy",{y:NS.fy(NS.today())}),zt(),window.NSStore&&(clearTimeout(Ae),Ae=setTimeout(function(){NSStore.ready().then(function(){s("[data-s-store]",O).textContent=NSStore.mode()==="vault"?k("shared"):k("local"),mn().then(function(e){var a=s("[data-s-biz]",O);a.textContent=e,a.hidden=!e}),NSStore.meta("lastBackup").then(function(e){var a=s("[data-s-backup]",O);a.textContent=bn(e),a.classList.toggle("warn",!e||Date.now()-e>7*864e5)})}).catch(function(){})},60))}}function zt(){if(O){var t=s("[data-s-net]",O),e=navigator.onLine!==!1;t.textContent=k(e?"online":"offline"),t.className=e?"on":"off"}}function Gt(t){var e=s(t);e&&e.click()}window.addEventListener("beforeinstallprompt",function(t){t.preventDefault(),D=t;var e=s("[data-desk-install]");e&&!j()&&(e.hidden=!1)}),window.addEventListener("appinstalled",function(){D=null;var t=s("[data-desk-install]");t&&(t.hidden=!0),NS.toast(k("installed"))});var jt=!!(window.NS_CFG&&NS_CFG.inapp)&&window.top===window;function Ee(){return!!window.NSDesktopXL||/Electron\//.test(navigator.userAgent)}function gn(){var t=navigator.userAgent;if(/iPhone|iPad|iPod/.test(t)||/Macintosh/.test(t)&&navigator.maxTouchPoints>1)return"ios";var e=/Android/.test(t);return/SamsungBrowser/.test(t)?"samsung":/Firefox\//.test(t)?e?"ffandroid":"firefox":/Edg\//.test(t)?e?"android":"edge":/OPR\//.test(t)?e?"android":"opera":/Chrome\//.test(t)?e?"android":"chrome":/Safari\//.test(t)?"safari":"other"}var yn={chrome:["Click the <b>install</b> icon at the right end of the address bar,","or open the menu <b>&#8942;</b> › <b>Cast, save and share</b> › <b>Install page as app</b>.","Press <b>Install</b>."],edge:["Click the <b>App available</b> icon at the right end of the address bar,","or open the menu <b>…</b> › <b>Apps</b> › <b>Install this site as an app</b>.","Press <b>Install</b>."],opera:["Open the menu, choose <b>Install NSBiz</b> (or look for the install icon in the address bar)."],android:["Tap the menu <b>&#8942;</b> at the top right.","Tap <b>Add to home screen</b> (or <b>Install app</b>).","Tap <b>Install</b>. NSBiz now has its own icon on your home screen."],samsung:["Tap the menu <b>&#9776;</b> at the bottom.","Tap <b>Add page to</b> › <b>Home screen</b>."],ffandroid:["Tap the menu <b>&#8942;</b>.","Tap <b>Install</b> (or <b>Add to Home screen</b>)."],ios:["Tap the <b>Share</b> button (the square with an arrow).","Scroll down and tap <b>Add to Home Screen</b>.","Tap <b>Add</b>. NSBiz now has its own icon on your home screen."],safari:["In Safari on a Mac: open the <b>File</b> menu › <b>Add to Dock</b>."],firefox:["Firefox on a computer cannot install web apps.","Open <b>app.niveshsahayak.in</b> in <b>Chrome</b> or <b>Edge</b> and install it there, or download <b>NSBiz for Windows</b> below."],other:["Open your browser menu and look for <b>Install app</b> or <b>Add to home screen</b>.","If there is none, use Chrome or Edge, or download NSBiz for Windows below."]};function Le(){var t=s("#ns-inst");t&&t.remove();var e=gn(),a=/Windows/.test(navigator.userAgent),i=NS.el("dialog",{id:"ns-inst",class:"inst-dlg","aria-labelledby":"ns-inst-h"});i.innerHTML='<h2 id="ns-inst-h">Install NSBiz on this device</h2><ul class="inst-why"><li><b>Its own window and icon</b>, like any other program: no address bar, no tabs.</li><li><b>Opens without the internet</b> and starts faster.</li><li><b>Same data as now.</b> Nothing moves and nothing is sent to us.</li></ul>'+(D?'<p><button type="button" class="btn primary" data-inst-go>Install now</button></p>':'<p class="inst-how">How to install in this browser:</p><ol class="inst-steps">'+yn[e].map(function(r){return"<li>"+r+"</li>"}).join("")+"</ol>")+(a?'<p class="soft inst-win">Prefer a normal Windows program with automatic daily copies of your data and the office network? <a href="/desktop/">Download NSBiz for Windows</a> (free).</p>':"")+'<div class="inst-b"><button type="button" class="btn" data-inst-x>Close</button></div>',document.body.appendChild(i);var n=s("[data-inst-go]",i);n&&(n.onclick=function(){var r=D;r&&(r.prompt(),r.userChoice.finally(function(){D=null,i.close()}))}),s("[data-inst-x]",i).onclick=function(){i.close()},i.addEventListener("close",function(){i.remove()});try{i.showModal()}catch{i.setAttribute("open","")}}function Ce(){if(!(!jt||j()||Ee()||s("#ns-wncard")||s("#ns-instnote"))){var t=Date.now(),e=[],a=0;try{e=JSON.parse(localStorage.getItem("ns-inst-days")||"[]"),a=+localStorage.getItem("ns-inst-later")||0}catch{}var i=new Date().toISOString().slice(0,10);if(e.indexOf(i)<0){e.push(i),e=e.slice(-5);try{localStorage.setItem("ns-inst-days",JSON.stringify(e))}catch{}}if(!(e.length<3||t<a)){if(document.querySelector("dialog[open]")){setTimeout(Ce,5e3);return}var n=NS.el("div",{id:"ns-instnote",class:"remind",role:"status"});n.innerHTML='<div class="wrap"><span><b>Install NSBiz on this device:</b> its own window and icon, and it opens without the internet.</span><button type="button" class="btn primary" data-inst-open>Install</button><button type="button" class="btn" data-inst-later>Not now</button></div>',s("[data-inst-open]",n).onclick=function(){n.remove(),Le()},s("[data-inst-later]",n).onclick=function(){try{localStorage.setItem("ns-inst-later",String(t+30*864e5))}catch{}n.remove()},document.body.appendChild(n)}}}if(jt&&!j()&&!Ee()){var Te=function(){var t=s("[data-desk-install]");t&&(t.hidden=!1);var e=s("#ns-side"),a=e&&s(".side-g",e);if(a&&!s(".side-inst",e)){var i=NS.el("button",{type:"button",class:"side-a side-inst","data-desk-install":""});i.textContent="Install NSBiz on this device",a.parentNode.insertBefore(i,a)}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Te):Te(),window.addEventListener("load",function(){setTimeout(Ce,8e3)})}window.addEventListener("appinstalled",function(){var t=s("#ns-instnote");t&&t.remove()});function _e(){if(jt){Le();return}if(!D){NS.toast(k("installhow"));return}D.prompt(),D.userChoice.finally(function(){D=null;var t=s("[data-desk-install]");t&&(t.hidden=!0)})}var P={inbox:["FW"],home:["DB"],sales:["SL"],money:["MN"],acx:["OI"],stf:["SF"],itx:["IT"],bimp:["BI"],mig:["SW"],mkimp:["MQ"],msg:["MG"],pd:["PD"],env:["EO"],dues:["DU"],msme:["MS"],limits:["LH"],buy:["PE"],parties:["PA"],grp:["GR"],chq:["CQ"],books:["CB"],cash:["CK"],repeat:["RB"],reports:["RE"],day:["MD"],tools:["AT"],fin:["FA"],capl:["CL"],b2jv:["JE"],b2fa:["FX"],b2gd:["GD"],b2make:["PR"],b2job:["JW"],b2profit:["PF"],b2sman:["SM"],b2year:["YE"],features:["AF"],packs:["TP"],trust:["DM"],warr:["WS"],cacom:["CC"],fees:["FE"],stock:["SK"],fam:["MA"],cadb:["CD"],cadoc:["CA"],cagst:["CG"],ebook:["EB"],khata:["KH"],preg:["PG"],dlist:["DR"],clist:["CR"],ssum:["SY"],psum:["PY"],vreg:["VR"],cbsum:["CS"],mprint:["MV"],coa:["AC"],acl:["LA"],masters:["MT"],tdsr:["TQ"],gststk:["GF"],gtds:["GW"],isd:["GJ"],charts:["CH"],pdffill:["FQ"],ftools:["FT"],config:["CF"],gsum:["GS"],gvch:["GV"],os:["OS"],exc:["TC"],int:["IR"],bw:["BW"],ord:["OU"],"masters/led":["LD"],"masters/grp":["AG"],"masters/bank":["BK"],"masters/vt":["VT"],"masters/item":["IM"],"masters/igrp":["IG"],"masters/unit":["UM"],"masters/trn":["TN"],"masters/veh":["VH"],"masters/biz":["CY"],"stf/emp":["EP"],"stf/heads":["HD"],"stf/run":["RS"],"stf/att":["AD"],"stf/leave":["LV"],"stf/adv":["AV"],"stf/loan":["LN"],"stf/year":["BG"],"stf/pf":["EF"],"stf/esi":["EI"],"stf/tax":["SD"],"fin/bs":["BS"],"fin/pl":["PL"],"fin/tb":["TB"]},wt={grn:"GN",rejin:"GI",rejout:"GO",lc:"LC"},qt={gstr1:"GA",gstr3b:"GB",gstr2b:"GC",cmp08:"CP",tds:"TD",ca:"AW",amc:"AM","bank-reco":"BR",barcode:"BC",calc:"CU",declaration:"DF",distance:"DS","e-invoice":"EV","eway-bill":"EW","export-invoice":"XI",garage:"GG","gst-calendar":"DD",gstin:"GK",hsn:"HS",ifsc:"IF",learn:"LG",marketplace:"MK",compare:"NC",pincode:"PN","price-list":"LP","profit-loss":"PK",share:"SH",tally:"TL",file:"WF"},Nt={backup:"BU"},De={party:"NP",item:"NI"},Vt={q:"quick",p:"q:party",i:"q:item",t:"fin/tb",b:"fin/bs",l:"fin/pl",d:"dlist",r:"clist",s:"stock",c:"calc"},$={};Object.keys(Vt).forEach(function(t){$[Vt[t]]="Ctrl+Alt+"+t.toUpperCase()});function Ut(t){return $[t]||Q(t)}function Pe(t){if(/^q:/.test(t)){NS.quickAddNew&&NS.quickAddNew(t.slice(2));return}if(t==="calc"){we();return}if(t==="quick"){var e=w();e&&e.quickEntry&&e.quickEntry();return}if(t==="stock"){var a=s('#ns-side a[data-sec="stock"]');a?a.click():location.hash="do/stock/";return}location.hash=t}var B={billing:["IN"],quotation:["QT"],proforma:["PI"],"sales-order":["SO"],challan:["DC"],"purchase-order":["PO"],"credit-note":["CN"],"debit-note":["DN"],"cash-memo":["CM"],receipt:["RC"],voucher:["VC"],"self-invoice":["SI"],"rent-receipt":["RR"],"salary-slip":["SS"],"petty-cash":["PC"],pos:["PS"],pharmacy:["PH"],restaurant:["RT"],bilty:["LR"],"job-card":["JC"],hotel:["HT"],rent:["RN"],"contractor-bill":["CT"],"fee-receipt":["FR"],clinic:["CV"],salon:["SN"],jewellery:["JL"],garment:["GM"],mandi:["MI"],petrol:["PP"],dairy:["DY"],subscribers:["SU"],tripsheet:["TS"]},Me=[["sale","SB","F8"],["min","MR","F6"],["mout","MP","F5"],["pbill","PB","F9"],["exp","EX","F10"],["contra","CO","F4"],["pret","PT",""],["ob","OB",""],["genr","RV",""],["genp","PM",""]],At={F3:"biz",F4:"contra",F5:"mout",F6:"min",F7:"b2jv",F8:"sale",F9:"pbill",F10:"exp","Ctrl+F8":"credit-note","Ctrl+F9":"debit-note"},xe={};Object.keys(P).forEach(function(t){P[t][1]&&(xe[P[t][1].toLowerCase()]={sec:t})}),Object.keys(B).forEach(function(t){B[t][1]&&(xe[B[t][1].toLowerCase()]={site:t})});function Fn(t){var e=s('#ns-side a[data-sec="'+t+'"]');return e?(e.textContent||"").trim():""}function Et(t){var e=s('#ns-side a[data-sec="'+t+'"]');e?(e.click(),e.focus()):location.hash=t}function $t(t){var e=w();e&&e.newDoc?e.newDoc(t):Re(Be(t))}function Lt(t){var e=w();!e||!e.openForm||(e.whenReady||function(a){a()})(function(){e.biz()&&!s("dialog[open]")&&e.openForm(t)})}function Oe(t){var e=w();if(st(t)){NS.toast(NS.t("desk.offkey"));return}if(t==="biz"){e&&e.switchBiz&&(e.whenReady||function(a){a()})(e.switchBiz);return}if(P[t]){Et(t);return}if(B[t]){$t(t);return}Lt(t)}function Q(t){var e=[];return Object.keys(At).forEach(function(a){At[a]===t&&e.push(a)}),e[0]||""}function rt(){var t=w(),e=[];if(!t||!t.biz)return e;Me.forEach(function(r){e.push({g:"rec",off:it(r[0]),t:t.T(r[0]==="sale"?"qe_sale":r[0]),k:r[2],c:r[1],run:function(){Lt(r[0])}})}),e.push({g:"rec",t:NS.t("app.qe_title"),k:"Ctrl+Alt+Q",c:"QE",run:function(){t.quickEntry&&t.quickEntry()}}),g("#ns-side a[data-sec]").forEach(function(r){var o=r.getAttribute("data-sec"),l=P[o]||[];e.push({g:"go",off:Wt(o),t:(r.textContent||"").trim(),k:Ut(o)||(l[1]?"Alt+"+l[1]:""),c:l[0]||"",run:function(){Et(o)}})}),g("#ns-side a[data-hsec]").forEach(function(r){var o=r.getAttribute("data-hsec"),l=P[o]||[];e.some(function(d){return d.sec===o})||e.push({g:"go",sec:o,off:!1,t:(r.textContent||"").trim(),k:Ut(o)||(l[1]?"Alt+"+l[1]:""),c:l[0]||"",run:function(){location.hash=o}})});var a={};e.forEach(function(r){r.c&&(a[r.c]=1)}),Object.keys(P).forEach(function(r){var o=P[r];if(!(!o[0]||a[o[0]]||Wt(r))){var l=s('#ns-side a[data-sec="'+r+'"]'),d="app."+r,h=l?(l.textContent||"").trim():NS.t(d)!==d?NS.t(d):r,b={stock:"do/stock/",cadb:"do/ca/#cadb",cadoc:"do/ca/#cadoc",cagst:"do/ca/#cagst"},p=r==="acl"?"coa":b[r]||r;a[o[0]]=1,e.push({g:"go",sec:r,off:!1,t:r==="acl"?NS.t("desk.v_coa"):h,k:Ut(r)||(o[1]?"Alt+"+o[1]:""),c:o[0],run:function(){l&&!b[r]?Et(r):location.hash=p}})}}),(t.newDocs?t.newDocs():[]).forEach(function(r){var o=B[r[0]]||[];e.push({g:"new",off:Ie(r[0]),t:r[1],k:Q(r[0])||(o[1]?"Alt+"+o[1]:""),c:o[0]||"",run:function(){$t(r[0])}})});var i=function(r,o){var l=s(r);!l||l.hidden||e.push({g:"go",off:!1,t:(l.textContent||"").trim(),k:"",c:o,run:function(){l.click()}})};Object.keys(wt).forEach(function(r){i('#ns-side a[data-oract="'+r+'"]',wt[r])}),Object.keys(qt).forEach(function(r){i('#ns-side .sg a[data-ic="t-'+r+'"]',qt[r])}),Object.keys(Nt).forEach(function(r){i('#ns-side a[data-my="'+r+'"]',Nt[r])}),NS.quickAddNew&&Object.keys(De).forEach(function(r){e.push({g:"rec",off:!1,t:NS.t("desk.v_new"+r),k:$["q:"+r],c:De[r],run:function(){NS.quickAddNew(r)}})});var n={};return e.forEach(function(r){r.c&&(n[r.c]=1)}),e.forEach(function(r){if(!r.c)for(var o=(r.t||"").toUpperCase().replace(/[^A-Z]/g,""),l=1;l<o.length&&!r.c;l++){var d=o[0]+o[l];n[d]||(r.c=d,n[d]=1)}}),e}function Wt(t){var e=s('#ns-side a[data-sec="'+t+'"]');return!!(e&&NS.featHidden&&NS.featHidden(e))}function Ie(t){if(!NS.featHidden)return!1;var e=document.createElement("a");return e.setAttribute("data-ic","d-"+t),NS.featHidden(e)}function it(t){return!!(NS.featHidden&&NS.featHidden(t))}function st(t){return P[t]?Wt(t):B[t]?Ie(t):t==="biz"?!1:it(t)}NS.deskKeys=function(){return rt().filter(function(t){return!t.off})};var E,X,x=[],Z=[],W=0,kn=[["min","F6"],["mout","F5"],["pbill","F9"],["exp","F10"],["pret",""],["ob",""]],Sn={invoice:"billing",quote:"quotation",proforma:"proforma",so:"sales-order",challan:"challan",po:"purchase-order",self:"self-invoice",note:"credit-note",cashmemo:"cash-memo",receipt:"receipt",voucher:"voucher",rent:"rent-receipt",salary:"salary-slip",petty:"petty-cash"},wn={invoice:"Doc.invoice",quote:"Doc.quote",proforma:"Doc.proforma",so:"Doc.so",challan:"Doc.challan",po:"Doc.po",self:"Doc.self",note:"Doc.note",cashmemo:"Doc.cashmemo",receipt:"Doc.receipt",voucher:"Doc.voucher",rent:"Doc.rent",salary:"Doc.salary",petty:"Doc.petty"};function Nn(t){return t.type==="jv"?"jv":(t.type||"invoice")==="invoice"?"sale":t.type==="contra"?"contra":t.type==="exp"?"exp":t.type==="ob"?"ob":t.type==="pbill"?t.kind==="return"?"pret":"pbill":t.type==="receipt"?"min":"mout"}function Be(t){var e=s('#ns-side a[href*="//'+t+'.niveshsahayak.in"], #ns-side a[data-port][href*="localhost"]'),a=window.NS_CFG&&NS_CFG.tools||[],i=a.filter(function(n){return n[0]===t})[0];return i?tt?"http://localhost:"+i[4]+"/":"https://"+i[1]+"/":e?e.href:"https://"+t+".niveshsahayak.in/"}function Jt(t){var e=s("#ns-side a[data-ic=app]");return(e?e.href:"https://app.niveshsahayak.in/")+(t?"#"+t:"")}function Re(t){w()&&w().openUrl&&w().openUrl(t)||(location.href=t)}function Fe(t){return String(t||"").trim().toLowerCase().replace(/\s+/g," ")}function An(){var t=[];g("#ns-side .side-g").forEach(function(a){var i=a.getAttribute("data-g")==="about"?"act":"go";g("a",a).forEach(function(n){var r=!!(NS.featHidden&&NS.featHidden(n)),o=n.getAttribute("data-sec"),l=o?g("#ns-side a[data-sec]").indexOf(n):-1,d=(n.textContent||"").trim();t.push({off:r,s:r?NS.t("fr.offnote"):"",g:a.getAttribute("data-g")==="docs"||a.getAttribute("data-g")==="more"?"new":i,t:d,e:NS.meaning(d)+" "+(En[o]||""),k:n.getAttribute("data-ic")==="d-billing"?"Alt+G IN":B[(n.getAttribute("data-ic")||"").replace(/^[dt]-/,"")]?(function(h,b){return Q(b)||(h[1]?"Alt+"+h[1]:"Alt+G "+h[0])})(B[(n.getAttribute("data-ic")||"").replace(/^[dt]-/,"")],(n.getAttribute("data-ic")||"").replace(/^[dt]-/,"")):o&&P[o]?Q(o)||(P[o][1]?"Alt+"+P[o][1]:"Alt+G "+P[o][0]):l>=0&&l<9?"Alt+"+(l+1):"",run:function(){n.click()}})})});var e=w();return e&&e.biz&&e.biz()&&kn.forEach(function(a){var i=!!(NS.featHidden&&NS.featHidden(a[0]));t.push({off:i,s:i?NS.t("fr.offnote"):"",g:"rec",t:e.T(a[0]),e:NS.meaning(e.T(a[0])),k:a[1],run:function(){e.openForm(a[0])}})}),e&&s('#ns-side a[data-sec="fin"]')&&Ln.forEach(function(a){t.push({g:"go",t:NS.t(a[1]),e:a[2],run:function(){location.hash=a[0]}})}),t.concat(_n())}var En={fin:"final accounts trial balance profit loss balance sheet",cash:"cash book bank book",b2fa:"fixed assets depreciation register",b2jv:"journal entries",dues:"outstanding receivable payable ageing",capl:"capital loans drawings",books:"day book cash book bank book",st:"ledger statement",fam:"manufacturing account partners",b2year:"year end closing",reports:"excel reports registers",acx:"other income tax payment"},Ln=[["fin/tb","pl.t_tb","trial balance tb"],["fin/pl","pl.t_pl","profit and loss p&l income statement"],["fin/bs","pl.t_bs","balance sheet bs"]];function Cn(){var t=w(),e=t&&t.data?Promise.resolve({party:t.data().party,doc:t.mine?t.mine():t.data().doc}):window.NSStore?Promise.all([NSStore.list("party"),NSStore.list("doc")]).then(function(i){return{party:i[0],doc:i[1]}}):Promise.resolve({party:[],doc:[]}),a=t&&t.data&&t.data().item?Promise.resolve(t.data().item):window.NSStore?NSStore.list("item").catch(function(){return[]}):Promise.resolve([]);return Promise.all([e,a]).then(function(i){var n=i[0],r=[],o={},l={};return(i[1]||[]).forEach(function(d){var h=Fe(d.desc||d.name);!h||l[h]||d.sample||(l[h]=1,r.push({g:"item",e:NS.cfText?NS.cfText(d):"",t:d.desc||d.name,s:[d.hsn?"HSN "+d.hsn:"",d.rate?NS.money(d.rate):"",d.gst!==""&&d.gst!=null?d.gst+"%":""].filter(Boolean).join(" · "),run:function(){t&&t.biz?location.hash="do/my/#item":location.href=ie("item")}}))}),n.party.forEach(function(d){var h=Fe(d.name);!h||o[h]||(o[h]=1,r.push({g:"party",e:NS.cfText?NS.cfText(d):"",t:d.name,s:[d.gstin,d.phone,d.city].filter(Boolean).join(" · "),run:function(){t&&t.biz?location.hash="st/"+encodeURIComponent(h):location.href=Jt("st/"+encodeURIComponent(h))}}))}),n.doc.slice().sort(function(d,h){return(h.updated||0)-(d.updated||0)}).slice(0,400).forEach(function(d){var h=d.type==="note"&&d.kind==="debit"?"debit-note":Sn[d.type],b=d.app||/^(pbill|exp|ob|contra)$/.test(d.type);if(!(!h&&!b)){var p=d.buyer&&d.buyer.name||"",S=t&&t.docName?t.docName(d):NS.t(d.type==="note"&&(d.kind==="credit"||d.kind==="debit")?"k."+d.kind:wn[d.type]||"")||d.type;r.push({g:"doc",e:NS.cfText?NS.cfText(d):"",t:S+(d.no?" "+d.no:"")+(p?" · "+p:""),s:(d.date?NS.fmtDate(d.date):"")+(d.total?" · "+NS.money(d.total):""),run:function(){if(b){t&&t.openForm?t.openForm(Nn(d),{rec:d}):location.href=Jt("");return}Re(t&&t.docUrl&&t.docUrl(d)||Be(h)+"?open="+encodeURIComponent(d.id))}})}}),r}).catch(function(){return[]})}function Tn(){var t=w();return!t||!t.setBiz||!t.biz||!t.biz()?[]:t.data().biz.filter(function(e){return e.id!==t.biz().id}).map(function(e){return{g:"act",t:NS.t("app.biz")+": "+e.name,k:"F3",run:function(){t.setBiz(e.id)}}})}function _n(){return[{g:"act",t:k("a_theme"),run:function(){Gt("[data-theme-btn]")}},{g:"act",t:"Look and feel: colour pack, spacing, text size",run:function(){window.NSTheme&&NSTheme.open()}},{g:"act",t:NS.t("mydata"),run:function(){Gt('[data-act="my-data"]')}},{g:"act",t:NS.t("md.save"),run:function(){var t=NS.el("button",{"data-act":"backup",hidden:""});document.body.appendChild(t),t.click(),t.remove()}},{g:"act",t:k("mini"),k:"Ctrl+B",run:xt},{g:"act",t:k("keys"),k:"Ctrl /",run:Pt}].concat(Tn()).concat([{g:"act",t:k("lang"),run:function(){var t=s("[data-lang-pick]");if(t&&!t.offsetParent&&w()&&_.classList.contains("installed")){location.hash="#features";return}if(t&&(t.focus(),t.showPicker))try{t.showPicker()}catch{}}}]).concat(D?[{g:"act",t:k("install"),run:_e}]:[])}var Yt=null,Ct=!1,K=!1;function ot(t,e){if(window.MiniSearch||NS.loadJs(He).catch(function(){}),K=e==="go",!E){E=NS.el("dialog",{id:"desk-cmd",class:"desk-cmd"}),E.innerHTML='<div class="cmd-in">'+dt(Mt)+'<input type="search" role="combobox" aria-label="'+v(k("find"))+'" aria-expanded="true" aria-controls="desk-cmd-l" aria-autocomplete="list" autocomplete="off" spellcheck="false" dir="auto"><kbd>Esc</kbd></div><ul id="desk-cmd-l" role="listbox"></ul><p class="cmd-ft"></p>',document.body.appendChild(E),X=s("ul",E);var a=s("input",E);a.addEventListener("input",function(){W=0;var n=a.value.trim().toUpperCase();if(K&&/^[A-Z]{2}$/.test(n)){var r=x.filter(function(o){return o.code===n})[0];if(r){Ct=!0,E.close(),setTimeout(r.run,0);return}}Tt(a.value)}),a.addEventListener("keydown",function(n){n.key==="ArrowDown"||n.key==="ArrowUp"?(n.preventDefault(),Z.length&&(W=(W+(n.key==="ArrowDown"?1:-1)+Z.length)%Z.length,Qt())):n.key==="Enter"?(n.preventDefault(),Ge(W)):n.key==="Escape"&&(n.preventDefault(),E.close())}),X.addEventListener("click",function(n){var r=n.target.closest("li[data-i]");r&&Ge(+r.getAttribute("data-i"))}),X.addEventListener("mousemove",function(n){var r=n.target.closest("li[data-i]");r&&+r.getAttribute("data-i")!==W&&(W=+r.getAttribute("data-i"),Qt(!0))}),E.addEventListener("click",function(n){n.target===E&&E.close()}),E.addEventListener("close",function(){var n=Yt;Yt=null,n&&n.isConnected&&!Ct&&setTimeout(function(){try{var r=n.ownerDocument.defaultView;r&&r!==window&&r.focus(),n.focus()}catch{}},0),Ct=!1})}var i=s("input",E);E.setAttribute("aria-label",k("find")),i.placeholder=k(K?"go_ph":"ph"),i.setAttribute("aria-label",k(K?"go_ph":"ph")),s(".cmd-ft",E).textContent=k(K?"go_ft":"cmdft"),E.classList.toggle("cmd-go",K),x=K?NS.deskKeys().map(function(n){return{g:n.g,t:n.t,s:n.k,e:n.c,k:n.c,code:n.c,run:n.run}}):An(),i.value="",W=0,Tt(""),Yt=t||(document.activeElement!==document.body?document.activeElement:null),E.showModal(),i.focus(),setTimeout(function(){E.open&&document.activeElement!==i&&i.focus()},30),K||Cn().then(function(n){x=x.concat(n),E.open&&i.value&&Tt(i.value)}),K||(NS.cmdMore||[]).forEach(function(n){Promise.resolve().then(n).then(function(r){x=x.concat(r||[]),E.open&&i.value&&Tt(i.value)}).catch(function(){})})}var Dn=["go","rec","new","party","item","doc","help","act"],He="/assets/vendor/minisearch-7.2.0.js",ct=null,Ke=null,ze=-1;function Pn(){return window.MiniSearch?(ct&&Ke===x&&ze===x.length||(ct=new window.MiniSearch({fields:["t","s","e"],idField:"id",searchOptions:{boost:{t:3}}}),ct.addAll(x.map(function(t,e){return{id:e,t:String(t.t||""),s:String(t.s||""),e:String(t.e||"")}})),Ke=x,ze=x.length),ct):(NS.loadJs(He).catch(function(){}),null)}function Tt(t){var e=t.toLowerCase().split(/\s+/).filter(Boolean),a=K&&/^[a-z]$/i.test(t.trim())?t.trim().toUpperCase():"",i=a?x.filter(function(l){return l.code&&l.code.charAt(0)===a}):x.filter(function(l){var d=(l.t+" "+(l.s||"")+" "+(l.e||"")).toLowerCase();return e.every(function(h){return d.indexOf(h)>=0})});if(!a&&e.length&&t.trim().length>=3&&i.length<6){var n=Pn();if(n){var r=new Set(i);n.search(t,{fuzzy:.25,prefix:!0,combineWith:"AND"}).slice(0,12).forEach(function(l){var d=x[l.id];d&&!r.has(d)&&(r.add(d),i.push(d))})}}!e.length&&!K?i=i.filter(function(l){return!l.off&&l.g!=="doc"&&l.g!=="party"&&l.g!=="item"&&l.g!=="new"&&l.g!=="help"}):i=i.filter(function(l){return!l.off}),Z=[];var o="";Dn.forEach(function(l){var d=i.filter(function(h){return h.g===l}).slice(0,K?99:e.length?8:12);d.length&&(o+='<li class="cmd-g" role="presentation">'+v(k("g_"+l))+"</li>",d.forEach(function(h){var b=Z.length;Z.push(h),o+='<li role="option" id="cmd-o'+b+'" data-i="'+b+'"><span class="ct">'+v(h.t)+(h.s?"<small>"+v(h.s)+"</small>":"")+"</span>"+(h.k?"<kbd>"+v(h.k)+"</kbd>":"")+"</li>"}))}),X.innerHTML=o||'<li class="cmd-none" role="presentation">'+v(k("none"))+"</li>",Qt()}function Qt(t){g("li[role=option]",X).forEach(function(i){i.setAttribute("aria-selected",String(+i.getAttribute("data-i")===W))});var e=s("#cmd-o"+W,X),a=s("input",E);e?(a.setAttribute("aria-activedescendant",e.id),t||e.scrollIntoView({block:"nearest"})):a.removeAttribute("aria-activedescendant")}function Ge(t){var e=Z[t];e&&(Ct=!0,E.close(),setTimeout(e.run,0))}NS.deskPalette=function(t){E&&E.open?E.close():ot(t)};function lt(t){if(!t){var e=s("#app-form");e&&lt(e),g("dialog.b2-dlg").forEach(function(n){lt(n)}),new MutationObserver(function(n){n.forEach(function(r){[].forEach.call(r.addedNodes,function(o){o.nodeType===1&&o.matches("dialog.b2-dlg")&&lt(o)})})}).observe(document.body,{childList:!0});var a="#desk-ask,#ns-wncard,#ns-inst,#desk-cmd,#desk-keys,#ns-help,.nsf-dlg,.pk-dlg,.bz-dlg,#ns-mydata,.cap-dlg,#ns-tell,#ns-series,.sf-gate,.help-pnl,.qe-cus,.vt-cpd,.vt-ask",i=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){try{this.classList.contains("vs")?_t(this):!this.matches(a)&&s(".dlg-hd,.dlg-h",this)&&s("input:not([type=hidden]),select,textarea,table,button[type=submit]",this)&&lt(this)}catch{}if(this._at=Date.now(),this.classList.contains("vs")){ee+=1,this.style.zIndex=String(ee),Ue(this);var n=HTMLDialogElement.prototype.show.apply(this,arguments);return je(),this.addEventListener("close",je,{once:!0}),n}return i.apply(this,arguments)};return}t.classList.contains("vs")||(t.classList.add("vs","hub-dlg"),t.addEventListener("click",function(n){n.target.closest&&n.target.closest(".vs-back")&&(n.preventDefault(),n.stopPropagation(),NS.vsLeave(null,t))},!0),t.addEventListener("input",function(n){n.target.closest&&n.target.closest("form")&&t.setAttribute("data-dirty","1")}),t.addEventListener("change",function(n){n.target.closest&&n.target.closest("form")&&t.setAttribute("data-dirty","1")}),t.id!=="app-form"&&t.addEventListener("keydown",function(n){if(!n.defaultPrevented){var r=(n.key||"").toLowerCase(),o=n.target,l=s("button[type=submit]",t),d=l&&l.closest("form");if(d){if((n.ctrlKey||n.metaKey)&&!n.altKey&&r==="s"){n.preventDefault(),d.requestSubmit?d.requestSubmit(l):l.click();return}if(!(r!=="enter"||n.shiftKey||n.ctrlKey||!o||!/^(INPUT|SELECT)$/.test(o.tagName)||/^(checkbox|radio|file|submit|button)$/.test(o.type))){var h=g("input,select",d).filter(function(p){return!p.disabled&&p.type!=="hidden"&&p.type!=="file"&&p.type!=="checkbox"&&p.offsetParent!==null&&!p.closest("details:not([open])")}),b=h.indexOf(o);b>=0&&b<h.length-1&&(n.preventDefault(),NS.focusSel(h[b+1]))}}}}),t.addEventListener("cancel",function(n){t.getAttribute("data-dirty")&&(n.preventDefault(),NS.vsLeave(null,t))}),t.addEventListener("close",function(){t._parking||t.removeAttribute("data-dirty")}),new MutationObserver(function(){_t(t)}).observe(t,{childList:!0,subtree:!1}),g("form",t).forEach(function(n){new MutationObserver(function(){_t(t)}).observe(n,{childList:!0})}),_t(t))}function _t(t){var e=s(".vs-back",t)||s(".dlg-hd .icon-btn",t)||s(".dlg-hd [data-x]",t)||s(".dlg-h form[method=dialog] button",t)||s(".dlg-h > button:last-child",t);if(!e){var a=s(".dlg-hd,.dlg-h",t);a&&(e=NS.el("button",{type:"button"}),a.insertBefore(e,a.firstChild))}e&&!e.classList.contains("vs-back")&&(e.removeAttribute("onclick"),e.type="button",e.className="btn sm vs-back",e.setAttribute("aria-keyshortcuts","Escape"),e.innerHTML='<span data-i18n="app.back">'+v(NS.t("app.back"))+"</span>");var i=s("button[type=submit]",t),n=i&&(i.closest(".dlg-foot,.btns,.dlg-f")||i.parentNode);if(n&&n.classList.add("vs-foot"),n&&!s(".vs-keys",n)&&n.insertAdjacentHTML("beforeend",'<span class="vs-keys" aria-hidden="true">'+v(NS.t("app.vs_keys"))+"</span>"),t._resuming||Date.now()-(t._resumeAt||0)<1500){t._resuming=!1;return}t.removeAttribute("data-dirty"),t.scrollTop=0}var Zt=0;function je(){if(document.documentElement.classList.contains("embed"))try{var t=window.parent.document.documentElement,e=!!document.querySelector("dialog.vs[open]");t.classList.contains("fr-vs")!==e&&(t.classList.toggle("fr-vs",e),window.parent.dispatchEvent(new Event("resize")))}catch{}}function qe(t,e){if(!t.getAttribute("data-dirty")){t.close();return}NS.ask(NS.t("app.vs_leave"),{ok:NS.t("app.vs_discard"),no:NS.t("app.vs_stay"),danger:1}).then(function(a){if(a){t.removeAttribute("data-dirty"),t.close();return}e();var i=s("input,select",t);i&&i.focus()})}function Ve(t){if(t._cw){var e=t._cw;t._cw=null,e.onclose=null;try{e.destroy()}catch{}}}function Xt(t){if(t.open){Ve(t);try{t._cw=new CloseWatcher}catch{t._cw=null;return}t._cw.onclose=function(){t._cw=null,t.open&&qe(t,function(){Xt(t)})}}}function Mn(t){if(setTimeout(function(){Xt(t)},0),!t._cwWired){t._cwWired=1;var e=function(){t.open&&Xt(t)};t.addEventListener("click",e,!0),t.addEventListener("input",e,!0),t.addEventListener("close",function(){Ve(t)})}}function Ue(t){if(typeof CloseWatcher=="function"){Mn(t);return}if(!t._hist){t._hist=1;try{history.pushState({nsvs:Date.now()},"")}catch{t._hist=0;return}t._histWired||(t._histWired=1,t.addEventListener("close",function(){t._hist&&(t._hist=0,history.state&&history.state.nsvs&&(Zt+=1,history.back()))}))}}window.addEventListener("popstate",function(){if(Zt){Zt-=1;return}var t=g("dialog.vs[open]").filter(function(e){return e._hist}).sort(function(e,a){return(+a.style.zIndex||0)-(+e.style.zIndex||0)})[0];t&&(t._hist=0,qe(t,function(){Ue(t)}))}),document.addEventListener("keydown",function(t){if(!(t.key!=="Escape"||t.defaultPrevented||s("dialog:modal"))){var e=g("dialog.vs[open]");if(e.length){var a=e.sort(function(n,r){return(+r.style.zIndex||0)-(+n.style.zIndex||0)})[0];t.preventDefault();var i=new Event("cancel",{cancelable:!0});a.dispatchEvent(i)&&a.close()}}}),document.addEventListener("keydown",function(t){if(!(t.key!=="Escape"||t.defaultPrevented||t.altKey||t.ctrlKey||t.metaKey||s("dialog[open]")||!w()||_.classList.contains("side-open"))&&!s(".mb-drop")){var e=t.target;if(NS.typingIn(e)){e.blur();return}var a=location.hash.replace(/^#/,"");if(!(!a||a==="home")){var i=w().trail&&w().trail();if(i&&i.length>1&&!/^do\//.test(a)){t.preventDefault(),history.back();return}var n=function(o){return o&&o.offsetParent!==null},r=g("[data-fback]").filter(n)[0]||g('#main a.link[href^="#"]').filter(function(o){return n(o)&&/^\s*‹|back/i.test(o.textContent)})[0];t.preventDefault(),r?r.click():location.hash="home"}}}),NS.vsLeave=function(t,e){e=e||s("dialog.vs[open]");var a=function(){e&&(e.removeAttribute("data-dirty"),e.open&&e.close()),t&&setTimeout(t,0)};if(!e||!e.open||!e.getAttribute("data-dirty")){a();return}NS.ask(NS.t("app.vs_leave"),{ok:NS.t("app.vs_discard"),no:NS.t("app.vs_stay"),danger:1}).then(function(i){if(i)a();else{var n=s("input,select",e);n&&n.focus()}})},lt();var G=[];function xn(t){var e=t[t.length-1],a=t[0],i=((s(".dlg-hd h2,.dlg-h h2,h2",a)||{}).textContent||"").replace(/\s+/g," ").trim(),n=s('input[list="dl-party"],#b-name,#f-party',a),r=n&&n.value.trim();return(i||NS.t("desk.task"))+(r?" · "+r:"")+(e!==a?" + "+((s("h2",e)||{}).textContent||"").trim():"")}function te(){var t=s("#ns-tasks");!t&&O&&(t=NS.el("div",{id:"ns-tasks",class:"task-tray",role:"group"}),t.setAttribute("aria-label",NS.t("desk.tasks")),O.insertBefore(t,O.firstChild)),t&&(t.hidden=!G.length,t.innerHTML=G.length?'<span class="tt-l">'+v(NS.t("desk.tasks"))+"</span>"+G.map(function(e,a){return'<button type="button" class="tt-b" data-task="'+a+'" title="'+v(NS.t("desk.resume"))+'">'+NS.icSvg("edit")+"<span>"+v(e.name)+"</span></button>"}).join(""):"")}document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-task]");e&&NS.vsResume(+e.getAttribute("data-task"))});var $e=["[data-s-path]",".s-copy","[data-s-keys]",".task-tray .tt-l","[data-s-fy]","[data-s-store]","[data-s-backup]","[data-s-net]"],We=0,Dt=!1;function On(){var t=s("[data-sbar]");if(!(!t||Dt||!t.getClientRects().length)){Dt=!0,g(".sb-off",t).forEach(function(i){i.classList.remove("sb-off")});for(var e=function(){var i=s(".s-l",t);return t.scrollWidth>t.clientWidth+1||i&&i.scrollWidth>i.clientWidth+1},a=0;a<$e.length&&e();a++)g($e[a],t).forEach(function(i){i.classList.add("sb-off")});Dt=!1}}NS.sbFit=function(){clearTimeout(We),We=setTimeout(On,60)},window.addEventListener("resize",NS.sbFit),(function t(){var e=s("[data-sbar]");if(!e){document.readyState==="loading"&&document.addEventListener("DOMContentLoaded",t);return}new MutationObserver(function(){Dt||NS.sbFit()}).observe(e,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["hidden"]}),NS.sbFit()})(),NS.vsPark=function(t){var e=g("dialog.vs[open]");if(!e.length){t&&t();return}if(!e.some(function(r){return r.getAttribute("data-dirty")})){e.forEach(function(r){r.close()}),t&&t();return}for(var a={list:e,name:xn(e)},i=e.length-1;i>=0;i--){var n=e[i];n._parking=!0,n._parked=a,n._scroll=n.scrollTop,n.addEventListener("close",function(){var r=this;setTimeout(function(){r._parking=!1},0)},{once:!0}),n.close()}G.push(a),te(),NS.toast(NS.t("desk.parked",{n:a.name})),t&&setTimeout(t,0)},NS.vsResume=function(t){var e=typeof t=="number"?G[t]:G.filter(function(i){return i.list.indexOf(t)>=0})[0];if(e){var a=function(){G.splice(G.indexOf(e),1),te(),e.list.forEach(function(r){if(document.contains(r)){var o=r.getAttribute("data-dirty");r._resuming=!0,r._resumeAt=Date.now(),r.showModal(),r._parked=null,o&&r.setAttribute("data-dirty",o),r.scrollTop=r._scroll||0}});var i=e.list[e.list.length-1],n=i&&s("input:not([type=hidden]),select,textarea",i);n&&n.focus()};g("dialog.vs[open]").length?NS.vsPark(a):a()}},NS.vsDrop=function(t){var e=G.filter(function(a){return a.list.indexOf(t)>=0})[0];e&&(G.splice(G.indexOf(e),1),e.list.forEach(function(a){a._parked=null,a.removeAttribute("data-dirty")}),te())},NS.vsParked=function(t){return!!(t&&t._parked)},window.addEventListener("hashchange",function(){g("dialog.vs[open]").some(function(t){return Date.now()-(t._at||0)>400})&&NS.vsPark()}),(function(){var e=null;function a(){e&&(e.hidden=!0)}function i(n){if(!(!_.classList.contains("side-mini")||!n)){var r=(s("span",n)||n).textContent.trim()||n.getAttribute("aria-label")||"";if(r){e||(e=NS.el("div",{class:"side-tip",role:"tooltip",id:"side-tip"}),document.body.appendChild(e));var o=n.getAttribute("data-kh")||n.getAttribute("aria-keyshortcuts")||"";e.innerHTML=v(r)+(o?" <kbd>"+v(o.replace(/\+/g,"+"))+"</kbd>":""),e.hidden=!1;var l=n.getBoundingClientRect(),d=document.documentElement.dir==="rtl";e.style.top=Math.max(4,l.top+l.height/2-e.offsetHeight/2)+"px",d?(e.style.left="",e.style.right=innerWidth-l.left+8+"px"):(e.style.right="",e.style.left=l.right+8+"px"),n.setAttribute("aria-describedby","side-tip")}}}document.addEventListener("mouseover",function(n){var r=n.target.closest&&n.target.closest("#ns-side a, #ns-side button.side-fold");r?i(r):a()}),document.addEventListener("focusin",function(n){var r=n.target.closest&&n.target.closest("#ns-side a");r?i(r):a()}),document.addEventListener("scroll",a,!0),window.addEventListener("blur",a)})();var In=[["Alt G","k_go"],["Ctrl K","k_cmd"],["Ctrl B","k_menu"],["Alt 1 … 9","k_secs"],["Alt Z1 … Z0","+k_panel"],["F3","=app.biz"],["Ctrl Shift F","k_find"],["F1","k_hlp"],["Ctrl /","k_help"],["Ctrl S","k_save"],["F2","k_qadd"],["Ctrl P","k_print"],["Esc","k_esc"]],z;function Pt(){z||(z=NS.el("dialog",{id:"desk-keys",class:"desk-keys","aria-labelledby":"desk-keys-h"}),document.body.appendChild(z)),z.innerHTML='<div class="dk-hd"><h2 id="desk-keys-h">'+v(k("keys"))+'</h2><span><a class="btn sm" href="'+(w()?"/keyboard-shortcuts/":Jt("").replace(/#$/,"")+"keyboard-shortcuts/")+'" data-dk-full>'+v(k("k_full"))+"</a> "+(rt().length?'<button type="button" class="btn sm" data-dk-print>'+v(NS.t("b.print"))+"</button> ":"")+'<button type="button" class="icon-btn" aria-label="'+v(NS.t("close"))+'" data-close>✕</button></span></div><h3 class="dk-g">'+v(k("kg_gen"))+'</h3><table class="dk-t"><tbody>'+In.filter(function(e){return e[1].charAt(0)==="+"?!!w():e[1].charAt(0)!=="="||w()&&w().switchBiz&&w().data().biz.length>1}).map(function(e){return'<tr><th scope="row"><kbd>'+v(e[0])+"</kbd></th><td>"+v(e[1].charAt(0)==="="?NS.t(e[1].slice(1)):k(e[1].replace(/^\+/,"")))+"</td></tr>"}).join("")+"</tbody></table>"+Bn()+'<p class="dk-note">'+v(k("k_note"))+"</p>",s("[data-close]",z).onclick=function(){z.close()},s("[data-dk-full]",z).addEventListener("click",function(){z.close()});var t=s("[data-dk-print]",z);t&&(t.onclick=function(){var e=NS.el("div",{id:"dk-printarea"}),a=w()&&w().biz&&w().biz();e.innerHTML="<h1>NSBiz: "+v(k("keys"))+"</h1>"+(a?"<p>"+v(a.name)+"</p>":"")+g(".dk-g, .dk-t",z).map(function(n){return n.outerHTML}).join(""),document.body.appendChild(e),z.close(),_.classList.add("dk-print");var i=function(){_.classList.remove("dk-print"),e.remove(),window.removeEventListener("afterprint",i)};window.addEventListener("afterprint",i),setTimeout(function(){window.print()},60)}),z.showModal()}function Bn(){var t=NS.deskKeys();return t.length?[["rec","kg_rec"],["go","kg_go"],["new","kg_new"]].map(function(e){var a=t.filter(function(i){return i.g===e[0]});return a.length?'<h3 class="dk-g">'+v(k(e[1]))+'</h3><table class="dk-t dk-3"><thead><tr><th scope="col">'+v(k("k_what"))+'</th><th scope="col">'+v(k("k_key"))+'</th><th scope="col">Alt G +</th></tr></thead><tbody>'+a.map(function(i){return"<tr><td>"+v(i.t)+"</td><td>"+(i.k?"<kbd>"+v(i.k)+"</kbd>":"")+"</td><td><kbd>"+v(i.c)+"</kbd></td></tr>"}).join("")+"</tbody></table>":""}).join(""):""}NS.deskKeysSheet=function(){Pt()};function Je(t){var e=t.target;return e&&(e.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName))}document.addEventListener("keydown",function(t){var e=(t.key||"").toLowerCase();if((t.ctrlKey||t.metaKey)&&!t.altKey&&!t.shiftKey&&e==="k"){t.preventDefault(),E&&E.open?E.close():ot();return}if((t.ctrlKey||t.metaKey)&&!t.altKey&&e==="b"&&!Je(t)){t.preventDefault(),xt();return}if(t.key==="Escape"&&_.classList.contains("side-open")){pt(!1);var a=s("[data-side-btn]");a&&a.focus();return}var i=s("dialog.vs[open]");if(!(s("dialog[open]")&&!(i&&g("dialog[open]").length===1))){var n=w();if(n&&n.biz&&t.ctrlKey&&t.altKey&&!t.shiftKey&&!t.metaKey){var r=Vt[(t.code||"").replace("Key","").toLowerCase()];if(r&&!(Je(t)&&t.getModifierState&&t.getModifierState("AltGraph"))){if(t.preventDefault(),t.repeat)return;if(st(r)){NS.toast(NS.t("desk.offkey"));return}i?NS.vsPark(function(){Pe(r)}):Pe(r);return}}if(i){var o=/^F([3-9]|10)$/.test(t.key)&&!t.altKey&&!t.shiftKey&&!t.metaKey?At[(t.ctrlKey?"Ctrl+":"")+t.key]:null,l=t.altKey&&!t.ctrlKey&&!t.metaKey?(t.code||"").replace("Key","").toLowerCase():"";if(o){t.preventDefault(),t.repeat||NS.vsLeave(function(){Oe(o)});return}if(l==="g"){t.preventDefault(),t.repeat||NS.vsPark(function(){ot(null,"go")});return}return}if(n&&n.biz&&/^F([3-9]|10)$/.test(t.key)&&!t.altKey&&!t.shiftKey&&!t.metaKey){var d=At[(t.ctrlKey?"Ctrl+":"")+t.key];d&&(t.preventDefault(),t.repeat||Oe(d));return}if(t.altKey&&!t.ctrlKey&&!t.metaKey){var h=/^Digit([1-9])$/.exec(t.code||"");if(h){var b=g("#ns-side a[data-sec]").filter(function(y){return!(NS.featHidden&&NS.featHidden(y))})[+h[1]-1];b&&(t.preventDefault(),b.click(),b.focus());return}var p=(t.code||"").replace("Key","").toLowerCase();if(p==="g"&&n&&n.biz){t.preventDefault(),t.repeat||ot(null,"go");return}return}if((t.ctrlKey||t.metaKey)&&!t.altKey&&t.shiftKey&&(t.code==="KeyF"||(t.key||"").toLowerCase()==="f")){var S=s("[data-q], main input[type=search]");S&&(t.preventDefault(),S.focus(),S.select());return}if((t.ctrlKey||t.metaKey)&&!t.altKey&&!t.shiftKey&&(t.key==="/"||t.code==="Slash")){t.preventDefault(),Pt();return}}}),window.addEventListener("online",zt),window.addEventListener("offline",zt),document.addEventListener("ns-lang",at),window.addEventListener("focus",at),document.addEventListener("ns-data",at);function Ye(){vn()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ye):Ye()})(),(function(){var s=window.NS_CFG&&NS_CFG.wn;if(!s||window.top!==window||!window.NS)return;var g="ns-wn-seen",v="ns-wn-note",_=function(T){try{return localStorage.getItem(T)||""}catch{return null}},k=function(T){try{localStorage.setItem(T,s.d)}catch{}},w=_(g);if(w===null)return;if(/\/whats-new\/$/.test(location.pathname)&&[].forEach.call(document.querySelectorAll('#ns-side a[href$="whats-new/"]'),function(T){T.setAttribute("aria-current","page")}),/\/whats-new\/$/.test(location.pathname)||!w){k(g),k(v);return}if(w>=s.d)return;function tt(){[].forEach.call(document.querySelectorAll('#ns-side a[href$="whats-new/"]'),function(T){T.classList.add("wn-new")})}if(tt(),setTimeout(tt,1500),_(v)>=s.d)return;function J(){if(!s.h||!s.h.length||document.getElementById("ns-wncard"))return Mt();if(document.querySelector("dialog[open]")){setTimeout(J,4e3);return}var T=document.querySelector('#ns-side a[href$="whats-new/"]'),R=T?T.getAttribute("href"):"/whats-new/",C={new:"New",better:"Better",fix:"Fixed"},L=NS.el("dialog",{id:"ns-wncard",class:"wn-card","aria-labelledby":"ns-wncard-h"});L.innerHTML='<p class="wn-card-k">'+NS.esc(NS.t("wn.card_k"))+'</p><h2 id="ns-wncard-h"></h2><ul class="wn-card-l"></ul><p class="wn-card-more soft"></p><div class="wn-card-b"><a class="btn" data-ic="new"></a><button type="button" class="btn primary" data-wn-ok data-noic></button></div>',NS.$("h2",L).textContent=s.n||NS.t("wn.title"),NS.$("ul",L).innerHTML=s.h.map(function(D){return'<li class="t-'+NS.esc(D[0])+'"><span class="wn-tag">'+NS.esc(C[D[0]]||"")+"</span><b>"+NS.esc(D[1])+"</b><span>"+NS.esc(D[2]||"")+"</span></li>"}).join("");var F=(s.c||0)-s.h.length;NS.$(".wn-card-more",L).textContent=F>1?NS.t("wn.card_more",{n:F}):F===1?NS.t("wn.card_more1"):"";var j=NS.$("a",L);j.href=R,j.textContent=NS.t("wn.see");var A=NS.$("[data-wn-ok]",L);A.textContent=NS.t("wn.ok");var O=function(){k(v);try{L.close()}catch{}L.remove()};A.onclick=O,j.addEventListener("click",function(){k(v),k(g),L.remove()}),L.addEventListener("cancel",function(){k(v)}),L.addEventListener("close",function(){k(v),L.isConnected&&L.remove()}),document.body.appendChild(L);try{L.showModal(),A.focus()}catch{L.setAttribute("open","")}}function Mt(){if(!document.getElementById("ns-wnnote")){var T=NS.lang?NS.lang():"en",R=document.querySelector('#ns-side a[href$="whats-new/"]'),C=NS.el("div",{id:"ns-wnnote",class:"remind",role:"status"});C.innerHTML='<div class="wrap"><span></span><a class="btn primary" data-ic="new"></a><button type="button" class="btn" data-wn-ok></button></div>',NS.$("span",C).textContent=NS.t("wn.note")+" "+(s.t&&(s.t[T]||s.t.en)||"");var L=NS.$("a",C);L.href=R?R.getAttribute("href"):"/whats-new/",L.textContent=NS.t("wn.see");var F=NS.$("[data-wn-ok]",C);F.textContent=NS.t("wn.ok"),F.onclick=function(){k(v),C.remove()},L.addEventListener("click",function(){k(v)}),document.body.appendChild(C),document.addEventListener("ns-lang",function(){var j=NS.lang();NS.$("span",C).textContent=NS.t("wn.note")+" "+(s.t&&(s.t[j]||s.t.en)||""),L.textContent=NS.t("wn.see"),F.textContent=NS.t("wn.ok")})}}document.readyState==="complete"?setTimeout(J,2500):window.addEventListener("load",function(){setTimeout(J,2500)});function dt(){k(g),k(v),[].forEach.call(document.querySelectorAll("#ns-side a.wn-new"),function(R){R.classList.remove("wn-new")});var T=document.getElementById("ns-wnnote");T&&T.remove()}document.addEventListener("click",function(T){var R=T.target.closest&&T.target.closest('a[href*="whats-new"]');R&&dt()},!0),window.addEventListener("hashchange",function(){/whats-new/.test(location.hash)&&dt()})})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* helppanel.js */
try{(function(){"use strict";var h=NS.$,j=NS.$$,i=NS.esc;function u(e,n){return NS.t("hp."+e,n)}var N=window.NS_CFG&&NS_CFG.inApp,L={home:["dashboard","quick-entry","getting-started","search-and-shortcuts"],sales:["sales-screen","new-document-inside-the-app","repeating-bills"],money:["money-received","money-paid","opening-balances"],dues:["dues-and-reminders","party-ledger","interest-and-credit-limits"],parties:["party-ledger","group-reports"],st:["party-ledger","bill-wise-and-adjust","interest-and-credit-limits"],grp:["group-reports"],buy:["purchase-bill","expenses"],exp:["expenses"],cash:["cash-and-bank-books","cheques"],books:["cash-and-bank-books"],chq:["cheques"],stock:["stock-in-the-app"],b2make:["production"],b2job:["job-work"],b2jv:["journal-entries","receipt-payment-any-ledgers"],capl:["capital-and-loans"],b2fa:["fixed-assets"],fin:["final-accounts","trial-balance"],fam:["manufacturing-account","partnership-accounts","trust-income-expenditure"],b2year:["year-end"],reports:["reports-to-excel","gst-from-the-app"],acx:["gst-from-the-app"],stf:["process-salary","staff-salary-loans","attendance-pf-esi"],tdsr:["tds-on-bills-returns"],itx:["income-tax-planner"],bimp:["bank-statement-import"],mkimp:["marketplace-payment-reports","bank-statement-import"],day:["my-day","dues-and-reminders"],tools:["all-tools-by-job","new-document-inside-the-app"],packs:["trade-packs","additional-features"],features:["additional-features"],settings:["additional-features","where-data-is-kept"],coa:["final-accounts","trial-balance"],acl:["final-accounts","party-ledger"],dlist:["dues-and-reminders","party-ledger"],clist:["party-ledger","purchase-bill"],ssum:["sales-screen","reports-to-excel"],psum:["purchase-bill","reports-to-excel"],vreg:["money-received","money-paid"],cbsum:["cash-and-bank-books"],mprint:["sales-screen"],b2gd:["stock-in-the-app"],ord:["orders-and-pending-goods","receipt-notes-and-returns"],int:["interest-and-credit-limits","bill-wise-and-adjust"],bw:["bill-wise-and-adjust","interest-and-credit-limits","sales-and-purchase-ledgers","receipt-payment-any-ledgers"]};L.masters=(L.masters||[]).concat(["custom-fields"]),[["masters",["masters","bank-accounts","transporters-and-vehicles"]],["config",["voucher-screens","custom-fields"]],["sales",["voucher-screens","cancel-voucher"]],["buy",["voucher-screens","cancel-voucher"]],["money",["voucher-screens","cancel-voucher"]],["fin",["accounting-reports","working-period-and-drill-down"]],["coa",["accounting-reports"]],["os",["bill-wise-and-adjust","dues-and-reminders"]],["exc",["accounting-reports"]],["grp",["accounting-reports"]],["vreg",["accounting-reports"]]].forEach(function(e){var n=L[e[0]]||(L[e[0]]=[]);e[1].forEach(function(t){n.indexOf(t)<0&&n.push(t)})}),[["msg",["messages-sms-whatsapp","dues-and-reminders"]],["mig",["bring-data-from-other-software","opening-balances"]],["pd",["look-print-designs-envelopes"]],["env",["look-print-designs-envelopes"]],["inbox",["nsbiz-helper-add-on"]],["home",["look-print-designs-envelopes"]],["dues",["messages-sms-whatsapp"]],["settings",["nsbiz-helper-add-on"]]].forEach(function(e){var n=L[e[0]]||(L[e[0]]=[]);e[1].forEach(function(t){n.indexOf(t)<0&&n.push(t)})}),L.masters.sort(function(e,n){return(n==="masters")-(e==="masters")});var M={ifsc:["ifsc-code-checker","pin-code-finder"],pincode:["pin-code-finder","distance-calculator"],distance:["distance-calculator","pin-code-finder"]},s=null,x=null,U=!1;function W(){return location.origin}function q(){return N||s&&s.site||""}function $(){var e=NS.lang?NS.lang():"en";if(s&&s.want===e)return Promise.resolve(s);if(x&&x.want===e)return x;var n="/help/"+(N||A()||U?"all":"index"),t=function(a){return fetch(a,{cache:"no-cache"}).then(function(o){if(!o.ok)throw new Error(o.status);return o.json()})};return x=(e==="en"?t(n+".json"):t(n+"."+e+".json").then(function(a){return t(n+".json").then(function(o){var r={};return(a.articles||[]).forEach(function(f){r[(f.site||a.site)+"|"+f.slug]=1}),(o.articles||[]).forEach(function(f){r[(f.site||o.site)+"|"+f.slug]||a.articles.push(Object.assign({site:o.site,siteName:o.name,lang:"en"},f))}),a}).catch(function(){return a})}).catch(function(){return t(n+".json")})).catch(function(a){if(/all$/.test(n))return t("/help/index.json");throw a}).then(function(a){var o=(a.articles||[]).map(function(r){return Object.assign({site:a.site,siteName:a.name},r)});return o.forEach(function(r){r.lang=r.lang||a.lang||"en"}),s={site:N||a.site||(A()?"app":""),name:a.name||"",topics:a.topics||[],all:o,lang:a.lang||"en",want:e},A()&&!N&&(s.site="app"),s}).catch(function(a){throw x=null,a}),x.want=e,x}function A(){return!!(window.NSApp&&h("#app"))}function C(){return s?s.all.filter(function(e){return!e.site||e.site===q()}):[]}function V(){if(!s)return[];if(A()&&!N){var e=(location.hash||"#home").slice(1),n=e.split("/")[0]||"home";if(n==="do"){var t=e.split("/")[1],a=s.all.filter(function(r){return r.site===t}).slice(0,5);return a.length||!M[t]?a:s.all.filter(function(r){return r.site==="app"&&M[t].indexOf(r.slug)>=0}).sort(function(r,f){return M[t].indexOf(r.slug)-M[t].indexOf(f.slug)})}var o={};return s.all.forEach(function(r){r.site==="app"&&(o[r.slug]=r)}),(L[n]||L.home).map(function(r){return o[r]}).filter(Boolean)}return C().slice(0,5)}function _(e){return String(e||"").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(function(n){return n.length>1})}function X(e){var n=_(e);return!n.length||!s?[]:s.all.map(function(t){for(var a=(t.title+" "+(t.card||"")).toLowerCase(),o=((t.summary||"")+" "+(t.keywords||[]).join(" ")+" "+(t.topicName||"")+" "+(t.siteName||"")).toLowerCase(),r=0,f=0;f<n.length;f++){var w=n[f];if(a.indexOf(w)>=0)r+=3;else if(o.indexOf(w)>=0)r+=1;else return null}return t.site===q()&&(r+=1),{a:t,sc:r}}).filter(Boolean).sort(function(t,a){return a.sc-t.sc}).slice(0,30).map(function(t){return t.a})}function z(){var e=h("[data-help-find]");if(!e||e._on)return;e._on=1,e.getAttribute("data-help-find")==="all"&&(U=!0);var n=h("input",e),t=h(".hf-out",e),a;function o(d){return String(d||"").toLowerCase()}var r=" how what why when where which who can could do does did is are was the a an to of in on for and or my i me we our it this that with from by be at as if any not no will should would kaise kya kyon kab kahan kaun hai hain ka ki ke ko se me mein par aur ya kare karen karna karte hota hoti nu da di de vich te ate kiven ki hai ne ";function f(d){var l=_(d).filter(function(p){return r.indexOf(" "+p+" ")<0});return l.length?l:_(d)}function w(d){return d.length>4?d.replace(/(ies|es|s|ing|ed)$/,""):d}function m(d,l,p){var v=0,k=0;return d.forEach(function(g){var G=w(g);l.indexOf(G)>=0?(v+=3,k++):p.indexOf(G)>=0&&(v+=1,k++)}),k&&k>=Math.ceil(d.length/2)?v+k*2:0}function S(d){var l=[];return s.all.forEach(function(p){(p.faq||[]).forEach(function(v){var k=m(d,o(v[0]),o(v[1]));k&&l.push({a:p,f:v,sc:k})})}),l.sort(function(p,v){return v.sc-p.sc}).slice(0,5)}function T(d){return s.all.map(function(l){var p=m(d,o(l.title+" "+(l.card||"")),o((l.summary||"")+" "+(l.keywords||[]).join(" ")+" "+(l.topicName||"")+" "+(l.faq||[]).map(function(v){return v[0]}).join(" ")));return p?{a:l,sc:p+(l.site===q()?1:0)}:null}).filter(Boolean).sort(function(l,p){return p.sc-l.sc}).slice(0,8).map(function(l){return l.a})}function b(){var d=n.value.trim();if(!d){t.innerHTML="";return}$().then(function(){if(n.value.trim()===d){var l=f(d),p=T(l),v=S(l),k="";v.length&&(k+='<h3 class="hf-h">'+i(u("fq"))+"</h3>"+v.map(function(g){return'<details class="faq"><summary>'+i(g.f[0])+' <small class="hf-src">'+i(g.a.card||g.a.title)+"</small></summary><p>"+i(g.f[1])+'</p><p class="hf-more"><a href="'+i(D(g.a))+'">'+i(g.a.card||g.a.title)+" ›</a></p></details>"}).join("")),p.length&&(k+='<h3 class="hf-h">'+i(u("fa"))+'</h3><ul class="hf-list">'+p.map(function(g){return'<li><a href="'+i(D(g))+'"><b>'+i(g.card||g.title)+"</b><span>"+i(I(g.summary,120))+"</span>"+(g.site&&g.site!==s.site?"<small>"+i(g.siteName||g.site)+"</small>":"")+"</a></li>"}).join("")+"</ul>"),k+='<p class="hf-none">'+i(p.length||v.length?u("fnot"):u("fnone"))+' <button type="button" class="btn sm" data-hf-ask>'+i(u("fask"))+"</button></p>",t.innerHTML=k}},function(){t.innerHTML='<p class="soft">'+i(u("offline"))+"</p>"})}n.addEventListener("input",function(){clearTimeout(a),a=setTimeout(b,150)}),t.addEventListener("click",function(d){if(d.target.closest("[data-hf-ask]")){var l=h("#ask"),p=h(".help-ask textarea");p&&!p.value.trim()&&(p.value=n.value.trim()),l&&l.scrollIntoView({behavior:"smooth",block:"start"}),p&&setTimeout(function(){p.focus()},400)}}),/^#?q=/.test(location.hash)&&(n.value=decodeURIComponent(location.hash.replace(/^#?q=/,"")),b())}function D(e){return e.site&&e.site!==(s&&s.site)&&e.url||N&&e.url?e.url:e.path}var c,y,E,O="list";function J(){c=NS.el("dialog",{id:"ns-help",class:"help-pnl","aria-labelledby":"ns-help-t"}),c.innerHTML='<div class="hp-hd"><button type="button" class="icon-btn hp-back" data-hp-back hidden></button><h2 id="ns-help-t"></h2><button type="button" class="icon-btn" data-hp-x></button></div><div class="hp-find"><input type="search" dir="auto" autocomplete="off" spellcheck="false"></div><p class="hp-note" data-hp-note hidden></p><div class="hp-body" aria-live="polite"></div><p class="hp-ft"><a data-hp-all target="_blank" rel="noopener"></a></p>',document.body.appendChild(c),y=h(".hp-body",c),E=h("input",c),h("[data-hp-x]",c).addEventListener("click",function(){c.close()}),h("[data-hp-back]",c).addEventListener("click",function(){B(),E.focus()}),c.addEventListener("click",function(e){e.target===c&&c.close()}),E.addEventListener("input",function(){B()}),y.addEventListener("click",function(e){var n=e.target.closest("[data-hp-a]");if(n){e.preventDefault(),R(s.all[+n.getAttribute("data-hp-a")]);return}var t=e.target.closest("a[href]");if(t&&O==="art"&&/\/help\/[^#?]+/.test(t.pathname)&&/niveshsahayak\.in$|^localhost$|^127\.0\.0\.1$/.test(t.hostname)){var a=s&&s.all.filter(function(o){return t.pathname===o.path&&(t.host===location.host||o.url&&o.url.indexOf("//"+t.host+"/")>0)})[0];a&&(e.preventDefault(),R(a))}})}function K(){h("#ns-help-t",c).textContent=u("title"),h("[data-hp-x]",c).setAttribute("aria-label",NS.t("close")),h("[data-hp-x]",c).textContent="✕";var e=h("[data-hp-back]",c);e.setAttribute("aria-label",u("back")),e.textContent=document.documentElement.dir==="rtl"?"→":"←",E.placeholder=u("find"),E.setAttribute("aria-label",u("find"));var n=h("[data-hp-note]",c),t=NS.lang?NS.lang():"en";n.hidden=t==="en"||!!(s&&s.lang===t),n.textContent=u("en");var a=h("[data-hp-all]",c);a.textContent=u("all")+" ›",a.href=N&&s&&(C()[0]||{}).url?String((C()[0]||{}).url).replace(/\/help\/.*$/,"/help/"):"/help/"}function H(e,n){c||J(),K(),E.value=e||"",O="list",y.innerHTML='<p class="soft">'+i(u("loading"))+"</p>",c.open||c.showModal(),E.focus(),$().then(function(){K(),n?R(n):B()},function(){y.innerHTML='<p class="soft">'+i(u("offline"))+"</p>"})}function P(e){var n=s.all.indexOf(e);return'<li><button type="button" class="hp-it" data-hp-a="'+n+'"><b>'+i(e.card||e.title)+"</b><span>"+i(I(e.summary,110))+"</span>"+(e.site&&e.site!==s.site?"<small>"+i(e.siteName||e.site)+"</small>":"")+"</button></li>"}function I(e,n){return e=String(e||""),e.length>n?e.slice(0,n-1).replace(/\s+\S*$/,"")+"…":e}function B(){if(O="list",h("[data-hp-back]",c).hidden=!0,!!s){var e=E.value.trim(),n="";if(e){var t=X(e);n=t.length?"<h3>"+i(u("found",{n:t.length}))+'</h3><ul class="hp-l">'+t.map(P).join("")+"</ul>":'<p class="soft">'+i(u("none"))+"</p>"}else{var a=V(),o={};a.forEach(function(m){o[m.path+m.site]=1}),a.length&&(n+="<h3>"+i(u("screen"))+'</h3><ul class="hp-l">'+a.map(P).join("")+"</ul>");var r=C().filter(function(m){return!o[m.path+m.site]}),f={},w=[];r.forEach(function(m){var S=m.topicName||"";f[S]||(f[S]=[],w.push(S)),f[S].push(m)}),w.forEach(function(m){n+='<details class="hp-topic"><summary>'+i(m||u("more"))+' <span class="soft">('+f[m].length+')</span></summary><ul class="hp-l">'+f[m].map(P).join("")+"</ul></details>"}),n||(n='<p class="soft">'+i(u("none"))+"</p>")}y.innerHTML=n,y.scrollTop=0}}var F={};function R(e){if(e){O="art",h("[data-hp-back]",c).hidden=!1;var n=D(e),t=new URL(n,W()).href;y.innerHTML='<p class="soft">'+i(u("loading"))+"</p>",(F[t]?Promise.resolve(F[t]):fetch(t).then(function(a){if(!a.ok)throw new Error(a.status);return a.text()})).then(function(a){if(F[t]=a,O==="art"){var o=new DOMParser().parseFromString(a,"text/html"),r=o.querySelector(".help-art")||o.querySelector("main");if(!r)throw new Error("no article");j(".crumbs, .cta-box, script, .sponsor-slot, [data-sponsor]",r).forEach(function(b){b.remove()}),j("a[href]",r).forEach(function(b){b.setAttribute("href",new URL(b.getAttribute("href"),t).href),/\/help\//.test(b.getAttribute("href"))||(b.target="_blank",b.rel="noopener")}),j("img[src]",r).forEach(function(b){b.setAttribute("src",new URL(b.getAttribute("src"),t).href),b.loading="lazy"});var f=h("h1",r);if(f){var w=document.createElement("h3");w.className="hp-h1",w.innerHTML=f.innerHTML,f.replaceWith(w)}var m=e.lang||"en",S=/^(ur|ks|sd)$/.test(m);y.innerHTML=(m==="en"&&NS.lang&&NS.lang()!=="en"?'<p class="hp-note">'+i(u("en"))+"</p>":"")+'<article class="hp-art" lang="'+i(m)+'" dir="'+(S?"rtl":"ltr")+'">'+r.innerHTML+'</article><p class="hp-full"><a href="'+i(t)+'" target="_blank" rel="noopener">'+i(u("page"))+" ↗</a></p>",y.scrollTop=0;var T=h(".hp-h1",y);T&&(T.tabIndex=-1,T.focus())}}).catch(function(){y.innerHTML='<p class="soft">'+i(u("offline"))+'</p><p><a href="'+i(t)+'" target="_blank" rel="noopener">'+i(u("page"))+" ↗</a></p>"})}}NS.helpOpen=H,document.addEventListener("click",function(e){var n=e.target.closest("[data-help-open]");n&&(e.preventDefault(),H())}),document.addEventListener("keydown",function(e){e.key==="F1"&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&(e.preventDefault(),c&&c.open?c.close():H())}),(NS.cmdMore=NS.cmdMore||[]).push(function(){return $().then(function(){return s.all.map(function(e){return{g:"help",t:e.card||e.title,s:e.site&&e.site!==s.site?e.siteName:I(e.summary,70),e:e.title+" "+(e.keywords||[]).join(" "),run:function(){H("",e)}}})}).catch(function(){return[]})}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z()})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* themes.js */
try{(function(){"use strict";var s=window.NS;if(!s)return;var d=document.documentElement,h=[{id:"",name:"Classic",note:"Side menu, top menus and a Shortcuts column. The teal and gold look",l:["#F6F8FB","#FFFFFF","#0F1B2A","#0B3B5B"],d:["#0B1420","#111D2B","#E6EDF5","#F5A524"]},{id:"blue",name:"Horizon",note:"Menus across the top, no side menu, coloured title bar, home as tiles. Calm blue",l:["#F3F7FD","#FFFFFF","#0F1E33","#1D4ED8"],d:["#0A1424","#101D33","#E8F0FC","#6EA8FF"]},{id:"earth",name:"Ledger book",note:"Serif type, ruled paper lines, an index-style side menu. Warm earth",l:["#FBF6EE","#FFFDF9","#2B2117","#9A4A1D"],d:["#1A140E","#231B13","#F3E9DA","#E8A15B"]},{id:"graphite",name:"Console",note:"Dense and square, an icon rail instead of the side menu, figures in mono type. Graphite",l:["#F1F2F4","#FFFFFF","#1C1F24","#2F6F5E"],d:["#0F1113","#16191C","#E4E7EB","#5DC9A8"]},{id:"contrast",name:"Clear",note:"Big text, big buttons and strong lines, one column. High contrast",l:["#FFFFFF","#FFFFFF","#000000","#000000"],d:["#000000","#000000","#FFFFFF","#FFE600"]},{id:"rose",name:"Boutique",note:"Side menu on the right, soft rounded cards, tile home. Rose",l:["#FFF5F7","#FFFFFF","#3B1020","#BE185D"],d:["#1F0A12","#2A1019","#FDE8EE","#F472A6"]},{id:"forest",name:"Accounts desk",note:"Boxy grid tables and a green menu bar, like desktop accounting software",l:["#EEF4EC","#FFFFFF","#10241A","#14532D"],d:["#0B1A12","#12251A","#E6F4EA","#6EE7A0"]},{id:"ocean",name:"Studio",note:"A white sheet on a tinted desk, floating side panel. Ocean teal",l:["#D9ECF1","#FFFFFF","#0B2530","#0E7490"],d:["#06171D","#0D2530","#E3F4F9","#5FD0EA"]},{id:"dock",name:"Launcher",note:"Big rounded tiles and a dock at the bottom, no side menu. Violet",l:["#F6F4FF","#FFFFFF","#1B1533","#5B3FD0"],d:["#120E24","#1A1533","#EEEAFC","#A895FF"]}],E=[["","Comfortable","Roomy rows and buttons"],["compact","Compact","More on one screen (computers)"]],v=[["","Normal"],["large","Large"],["xl","Extra large"]],c=s.esc||function(t){return String(t).replace(/[&<>"]/g,function(e){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[e]})};function i(t){try{return localStorage.getItem(t)||""}catch{return""}}function u(t,e){try{e?localStorage.setItem(t,e):localStorage.removeItem(t)}catch{}}function f(t){return h.some(function(e){return e.id===t})?t:""}function l(){var t=f(i("ns-pack")),e=i("ns-dens")==="compact"?"compact":"",a=/^(large|xl)$/.test(i("ns-tsize"))?i("ns-tsize"):"";[["data-pack",t],["data-dens",e],["data-tsize",a]].forEach(function(r){r[1]?d.setAttribute(r[0],r[1]):d.removeAttribute(r[0])})}function y(){var t=d.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches}function A(t){t==="light"||t==="dark"?(d.setAttribute("data-theme",t),u("ns-theme",t)):(d.removeAttribute("data-theme"),u("ns-theme",""))}function B(t){var e=y()?t.d:t.l;return'<span class="th-mini" aria-hidden="true" style="background:'+e[0]+";border-color:"+e[2]+'55"><i class="th-bar" style="background:'+e[3]+'"></i><i class="th-card" style="background:'+e[1]+";border-color:"+e[2]+'33"><b style="background:'+e[2]+'"></b><b style="background:'+e[2]+';opacity:.45"></b><u style="background:'+e[3]+'"></u></i></span>'}function m(t,e,a,r){return'<div class="th-row'+(r?" th-wide":"")+'" role="radiogroup" aria-label="'+c(t)+'">'+e.map(function(o){var b=o[0]===a;return'<button type="button" role="radio" class="th-opt" aria-checked="'+b+'" data-th-'+t+'="'+c(o[0])+'"><span><b>'+c(o[1])+"</b>"+(o[2]?"<small>"+c(o[2])+"</small>":"")+"</span></button>"}).join("")+"</div>"}function g(){var t=f(i("ns-pack")),e=i("ns-dens")==="compact"?"compact":"",a=/^(large|xl)$/.test(i("ns-tsize"))?i("ns-tsize"):"",r=d.getAttribute("data-theme")||"";return'<div class="th-panel"><h3 class="th-h" id="th-h-pack">Colour pack</h3><div class="th-packs" role="radiogroup" aria-labelledby="th-h-pack">'+h.map(function(o){var b=o.id===t;return'<button type="button" role="radio" class="th-pack" aria-checked="'+b+'" data-th-pack="'+o.id+'">'+B(o)+"<span><b>"+c(o.name)+"</b><small>"+c(o.note)+"</small></span></button>"}).join("")+'</div><h3 class="th-h">Light or dark</h3>'+m("mode",[["","Like my device"],["light","Light"],["dark","Dark"]],r)+'<h3 class="th-h">Spacing</h3>'+m("dens",E,e)+'<h3 class="th-h">Text size</h3>'+m("size",v,a)+'<p class="th-note">Every pack has a light and a dark look. Printouts and PDFs always stay paper-like, whatever you choose here. Your choice is kept with your other settings, so it follows you to your other devices.</p></div>'}function F(t){t&&(t.innerHTML=g(),!t._thWired&&(t._thWired=!0,t.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-th-pack],[data-th-mode],[data-th-dens],[data-th-size]");a&&(a.hasAttribute("data-th-pack")?u("ns-pack",a.getAttribute("data-th-pack")):a.hasAttribute("data-th-mode")?A(a.getAttribute("data-th-mode")):a.hasAttribute("data-th-dens")?u("ns-dens",a.getAttribute("data-th-dens")):u("ns-tsize",a.getAttribute("data-th-size")),l(),D(t,a))})))}function D(t,e){var a=[].slice.call(e.attributes).filter(function(o){return/^data-th-/.test(o.name)})[0];t.innerHTML=g();var r=a&&t.querySelector("["+a.name+'="'+a.value+'"]');r&&r.focus()}s.theme={panel:F,apply:l,packs:h},window.NSTheme={panel:F,apply:l,open:k,packs:h};var n=null;function k(){n||(n=s.el("dialog",{class:"th-dlg","aria-labelledby":"th-dt"}),n.innerHTML='<div class="dlg-hd"><h2 id="th-dt">Look and feel</h2><button type="button" class="btn sm" data-thx data-noic>Done</button></div><div data-thbox></div>',document.body.appendChild(n),n.addEventListener("click",function(t){(t.target===n||t.target.closest("[data-thx]"))&&n.close()})),F(n.querySelector("[data-thbox]")),n.open||n.showModal()}var L='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.8-.4-1.1-.3-.4-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.3-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/></svg>';function p(){s.$$("[data-theme-btn]").forEach(function(t){if(!t.parentNode.querySelector("[data-pack-btn]")){var e=s.el("button",{type:"button",class:"icon-btn","data-pack-btn":"","aria-label":"Look and feel: colours, spacing, text size",title:"Look and feel"});e.innerHTML=L,e.addEventListener("click",k),t.insertAdjacentElement("afterend",e)}})}document.addEventListener("ns-prefs",function(){l(),n&&n.open&&F(n.querySelector("[data-thbox]"))}),window.addEventListener("storage",function(t){/^ns-(pack|dens|tsize|theme)$/.test(t.key||"")&&l()}),l(),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",p):p(),setTimeout(p,600)})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* contact.js */
try{(function(){"use strict";if(!window.NS||!NS.$)return;var f=NS.$,o=NS.esc,b=window.NS_CFG&&NS_CFG.contact,k=!!b&&/^https:\/\/formsubmit\.co\//.test(b),S="https://www.niveshsahayak.in/p/contact.html";function t(a){return NS.t("ct."+a)}var y={get:function(a){try{return localStorage.getItem(a)}catch{return null}},set:function(a,n){try{localStorage.setItem(a,n)}catch{}}},_=["err","bug","q","idea","other"],E=0;function T(a){return new Promise(function(n,r){var v=(window.NS_CFG&&NS_CFG.vault||"").replace(/vault\.html$/,"relay.html");if(!/relay\.html$/.test(v))return r(new Error("no"));var h=Date.now()+"-"+Math.random(),p=new URL(v).origin,c=!1,u,e=document.createElement("iframe");e.style.cssText="position:absolute;width:0;height:0;border:0;visibility:hidden",e.setAttribute("aria-hidden","true"),e.tabIndex=-1,e.title="";function d(i){c||(c=!0,clearTimeout(u),window.removeEventListener("message",g),e.parentNode&&e.parentNode.removeChild(e),i?n({ok:!0}):r(new Error("no")))}function g(i){var m=i.data;i.origin===p&&m&&m.ns==="contact-done"&&m.id===h&&d(!!m.ok)}window.addEventListener("message",g),u=setTimeout(function(){d(!1)},25e3),e.onload=function(){try{e.contentWindow.postMessage({ns:"contact-send",id:h,body:JSON.stringify(a)},p)}catch{d(!1)}},e.src=v,document.body.appendChild(e)})}function N(a){var n="ct"+ ++E,r=NS.el("form",{class:"ct-form",novalidate:""});r.innerHTML='<div class="ct-f"><label for="'+n+'-t">'+o(t("topic"))+'</label><select id="'+n+'-t" name="topic">'+_.map(function(e){return'<option value="'+e+'"'+(e===a?" selected":"")+">"+o(t("t_"+e))+"</option>"}).join("")+'</select></div><div class="ct-f"><label for="'+n+'-m">'+o(t("msg"))+'</label><textarea id="'+n+'-m" name="msg" rows="5" maxlength="3000" required placeholder="'+o(t("msg_ph"))+'"></textarea></div><div class="ct-2"><div class="ct-f"><label for="'+n+'-n">'+o(t("name"))+'</label><input id="'+n+'-n" name="name" maxlength="80" autocomplete="name"></div><div class="ct-f"><label for="'+n+'-r">'+o(t("reply"))+'</label><input id="'+n+'-r" name="reply" maxlength="120" autocomplete="email" inputmode="email"></div></div><div class="ct-hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div><p class="ct-priv">'+o(t("priv"))+'</p><p class="ct-out" role="status" aria-live="polite"></p><div class="ct-btns"><button type="submit" class="btn primary">'+o(t("send"))+"</button></div>";var v=Date.now(),h=f(".ct-out",r),p=f("[type=submit]",r);function c(e,d,g){h.className="ct-out"+(d?" bad":" ok"),h.innerHTML=o(e)+(g?' <a href="'+S+'" target="_blank" rel="noopener">'+o(t("other"))+"</a>":"")}function u(e){return r.elements.namedItem(e).value}return r.addEventListener("submit",function(e){e.preventDefault();var d=u("msg").trim();if(d.length<10){c(t("short"),!0),r.elements.namedItem("msg").focus();return}var g=+y.get("ns-ct-last")||0;if(Date.now()-g<6e4){c(t("wait"),!0);return}var i={topic:u("topic"),msg:d,name:u("name").trim(),reply:u("reply").trim(),website:u("website"),page:location.href.split("#")[0].slice(0,300),site:location.hostname,lang:NS.lang?NS.lang():"en",screen:innerWidth+"x"+innerHeight,agent:navigator.userAgent.slice(0,300),ms:String(Date.now()-v)},m;if(k){var w=i.reply,D=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w);if(i.website){c(t("ok")),r.reset();return}if(Date.now()-v<3e3){c(t("wait"),!0);return}var x={_subject:"Nivesh Sahayak: ["+i.topic+"] "+i.site,_captcha:"false",_template:"table",_honey:"",Topic:i.topic,Message:d,Name:i.name,Reply:w,Page:i.page,Language:i.lang,Screen:i.screen,Browser:i.agent};D&&(x.email=w),m=T(x)}else m=fetch(b,{method:"POST",body:new URLSearchParams(i)}).then(function(s){return s.json()});p.disabled=!0,p.textContent=t("sending"),h.textContent="",m.then(function(s){if(!s||!s.ok)throw new Error(s&&s.why||"no");y.set("ns-ct-last",String(Date.now())),r.reset(),c(t("ok"))}).catch(function(s){c(t(s&&s.message==="short"?"short":"fail"),!0,s&&s.message!=="short")}).then(function(){p.disabled=!1,p.textContent=t("send")})}),r}var l;function M(){if(!b){window.open(S,"_blank","noopener");return}l||(l=NS.el("dialog",{id:"ns-tell","aria-labelledby":"ns-tell-h"}),document.body.appendChild(l)),l.innerHTML='<div class="dlg-h"><h2 id="ns-tell-h">'+o(t("title"))+'</h2><form method="dialog"><button class="btn sm">'+o(NS.t("close"))+'</button></form></div><div class="dlg-b"></div>',f(".dlg-b",l).appendChild(N("err")),l.showModal?l.showModal():l.setAttribute("open","");var a=f("textarea",l);a&&a.focus()}function C(){var a=f("[data-tell]");a&&(f("[data-tell-text]",a).textContent=t("note"),f("[data-tell-open]",a).textContent=t("btn")),b&&NS.$$("[data-ns-contact]").forEach(function(n){var r=n.querySelector("textarea")&&n.querySelector("textarea").value;r||(n.innerHTML="",n.appendChild(N(n.getAttribute("data-topic")||"q")))})}function L(){document.addEventListener("click",function(a){a.target.closest("[data-tell-open]")&&M()}),C(),document.addEventListener("ns-lang",C)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",L):L()})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* phonesite.js */
try{(function(){"use strict";var b=document.documentElement;if(b.classList.contains("embed"))return;var k=window.matchMedia("(max-width:600px)");function i(t,e){return(e||document).querySelector(t)}function f(t,e){return Array.prototype.slice.call((e||document).querySelectorAll(t))}function l(t){return String(t??"").replace(/[&<>"]/g,function(e){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[e]})}function u(t,e){try{var n=window.NS&&NS.t?NS.t(t):"";return n&&n!==t?n:e}catch{return e}}function x(){var t=window.NSApp;return!!(t&&t.data&&!(t.door&&t.door()))}function L(){return k.matches&&!x()&&!b.hasAttribute("data-en-only")}function A(t){return(t&&t.textContent||"").replace(/\s+/g," ").trim()}var s=null,E=null;function h(){if(s){var t=s;s=null;try{t.close()}catch{}t.remove()}}function N(t,e,n){return t=t.replace(/\bNS\s+Biz\b/,"NSBiz"),'<i aria-hidden="true" data-ic="'+l(e||"dot")+'"></i><span>'+l(t.length>30?t.slice(0,29)+"…":t)+"</span>"}function M(){h();var t=i("#ns-side"),e=[],n="";i("[data-desk-cmd]")&&e.push(["find",u("desk.find","Search").replace(/[.…]+$/,""),"ps-search"]),i("[data-help-open]")&&e.push(["help",u("f.help","Help"),"info"]),i('[data-act="my-data"]')&&e.push(["data",u("mydata","My data"),"data"]),i("[data-theme-btn]")&&e.push(["theme",u("theme","Colour theme"),"ps-theme"]);var c=i("[data-desk-install]");c&&!c.hidden&&e.push(["install",u("desk.install","Install app"),"app"]),n+='<section class="ph-g ps-quick"><span class="ps-h" role="heading" aria-level="3">'+l(u("desk.g_act","Settings and help"))+'</span><div class="ph-grid">'+e.map(function(a){return'<button type="button" class="ph-tile" data-psq="'+a[0]+'">'+N(a[1],a[2])+"</button>"}).join("")+"</div>";var r=i("[data-lang-pick]");r&&r.options.length>1&&!b.hasAttribute("data-en-only")&&(n+='<label class="ps-lang"><span>'+l(u("lang","Language"))+"</span><select data-psl>"+f("option",r).map(function(a){return'<option value="'+l(a.value)+'"'+(a.value===r.value?" selected":"")+">"+l(a.textContent)+"</option>"}).join("")+"</select></label>"),n+="</section>";function p(a){return!a.hidden&&!a.closest("[hidden]")&&!(window.NS&&NS.featHidden&&NS.featHidden(a))&&!/^javascript/i.test(a.getAttribute("href"))&&A(a)}function S(a,o,m){var g='<div class="ph-grid">'+o.map(function(d){var y=d.getAttribute("aria-current")==="page";return'<a class="ph-tile'+(y?" ps-cur":"")+'" href="'+l(d.href)+'"'+(y?' aria-current="page"':"")+(d.target?' target="'+l(d.target)+'"':"")+">"+N(A(d),d.getAttribute("data-ic"))+"</a>"}).join("")+"</div>";return m?'<details class="ph-g ps-fold"><summary><span class="ps-h" role="heading" aria-level="3">'+l(a)+'</span><span class="ps-n">'+o.length+"</span></summary>"+g+"</details>":'<section class="ph-g"><span class="ps-h" role="heading" aria-level="3">'+l(a)+"</span>"+g+"</section>"}t&&f(".side-g",t).forEach(function(a){var o=A(i(".side-h",a))||u("desk.allmods","All tools"),m=a.getAttribute("data-g")||"",g=f(".sg",a);if(g.length){var d=f("a[href]",a).filter(function(v){return p(v)&&(!v.closest(".sg")||v.closest(".sg-top"))});d.length&&(n+=S(o,d,!1)),g.forEach(function(v){if(!v.classList.contains("sg-top")){var $=f("a[href]",v).filter(p);$.length&&(n+=S(A(i(".sg-h",v))||o,$,!i("a[aria-current=page]",v)))}});return}var y=f("a[href]",a).filter(p);y.length&&(n+=S(o,y,(m==="docs"||m==="more"||m==="about")&&!i("a[aria-current=page]",a)))}),s=document.createElement("dialog"),s.className="ph-sheet ps-sheet",s.setAttribute("aria-label",u("desk.menu","Menu")),s.innerHTML='<div class="ph-sh-h"><b>'+l(u("desk.allmods","All tools"))+'</b><button type="button" class="ph-ic ph-cl" aria-label="'+l(u("close","Close"))+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="ph-sh-b">'+n+"</div>",document.body.appendChild(s),s.addEventListener("click",function(a){if(a.target===s){h();return}if(a.target.closest(".ph-cl")){h();return}var o=a.target.closest("[data-psq]");if(o){var m=o.getAttribute("data-psq");h(),setTimeout(function(){var g={find:"[data-desk-cmd]",help:"[data-help-open]",data:'[data-act="my-data"]',theme:"[data-theme-btn]",install:"[data-desk-install]"}[m],d=g&&i(g);d&&d.click()},0);return}a.target.closest("a[href]")&&h()}),s.addEventListener("change",function(a){if(a.target.matches("[data-psl]")){var o=i("[data-lang-pick]");o&&(o.value=a.target.value,o.dispatchEvent(new Event("change",{bubbles:!0})),h())}}),s.addEventListener("close",function(){s&&(s.remove(),s=null),E&&E.focus&&E.focus()}),s.showModal()}document.addEventListener("click",function(t){if(L()){var e=t.target.closest("[data-side-btn]");if(e){if(t.preventDefault(),t.stopPropagation(),b.classList.contains("side-open")){b.classList.remove("side-open");var n=i("[data-side-shade]");n&&(n.hidden=!0)}E=e,M()}}},!0);function T(t){var e=i("#ns-side"),n;try{n=new URL(t.href,location.href)}catch{return"guide"}if(n.origin!==location.origin){var c=e&&f("a[href]",e).filter(function(p){try{return new URL(p.href).origin===n.origin}catch{return!1}})[0];if(c&&c.getAttribute("data-ic"))return c.getAttribute("data-ic");var r=n.hostname.split(".")[0];return r==="app"?"app":r==="my"?"set":e&&i('a[data-ic="d-'+r+'"]',e)?"d-"+r:e&&i('a[data-ic="t-'+r+'"]',e)?"t-"+r:"tool"}return/\/help\//.test(n.pathname)?"info":"guide"}function q(){L()&&f("main .cards").forEach(function(t){var e=f(":scope>a",t);if(e.length){var n=0;e.forEach(function(c){var r=i(":scope>.ps-ci",c),p;r||(p=T(c),r=document.createElement("i"),r.className="ps-ci",r.setAttribute("aria-hidden","true"),r.setAttribute("data-ic",p),c.insertBefore(r,c.firstChild)),p=r.getAttribute("data-ic"),/^(d-|t-|app$|set$|tool$)/.test(p)&&n++}),t.classList.toggle("ps-tiles",n===e.length&&e.length>2)}})}var C=0;function j(){var t=i("main");!t||!window.MutationObserver||new MutationObserver(function(){clearTimeout(C),C=setTimeout(q,120)}).observe(t,{childList:!0,subtree:!0})}function w(){b.classList.toggle("ps-on",L()),L()?q():h()}j(),k.addEventListener&&k.addEventListener("change",w),w(),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):setTimeout(w,0),window.addEventListener("load",w),window.NSPhoneSite={menu:M,close:h}})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
/* inapp.js */
try{/* The App's own copy of a document maker or of My data (app.niveshsahayak.in/do/<site>/, built by build.py inapp_pages).
   The page runs the same engine as the site, on the same data home, inside a frame of the App (same origin), so:
   - a link to another Nivesh Sahayak site (My data, another maker, a guide) opens on an App screen, not in a new tab;
   - a conversion (quotation -> invoice) asks the App to open the next maker, so the App's Back and history stay right;
   - the App's keys (Ctrl K search, Ctrl B menu, Alt + letter) work while the cursor is in the document. */
(function () {
  'use strict';
  var site = (window.NS_CFG || {}).inApp; if (!site) return;
  function app() { try { return window.parent !== window && window.parent.NSApp; } catch (e) { return null; } }
  NS.inApp = site;
  document.documentElement.classList.add('ns-soft');   /* one font and no screen fades, the same as the App around it (owner 19 Nov) */
  /* the App opens url on one of its screens; false when the App cannot (the caller then goes there itself) */
  NS.appGo = function (url) { var A = app(); try { return !!(A && A.openUrl && A.openUrl(new URL(url, location.href).href)); } catch (e) { return false; } };
  /* the address of another maker inside the App (used when the App is not there to ask) */
  NS.siteHref = function (s) { return '/do/' + s + '/'; };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || a.hasAttribute('download')) return;
    if (!/^https?:/.test(a.href) || new URL(a.href).origin === location.origin && a.getAttribute('href').charAt(0) === '#') return;
    if (a.hasAttribute('download') || /^(blob|data):/i.test(a.getAttribute('href') || '')) return;   /* a file download stays a download */
    if (NS.appGo(a.href)) e.preventDefault();
  });
  /* Esc with no box open: back to the App screen it came from (drafts keep what was typed) */
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]') || !app()) return;
    var a = document.activeElement; if (a && a.list && a.value) return;   /* a suggestion list may be open */
    if (NS.typingIn(a)) { a.blur(); return; }   /* the first Esc leaves the box, the next goes back (like the App's own screens) */
    try { var b = window.parent.document.querySelector('[data-fback]'); if (b) { e.preventDefault(); b.click(); } } catch (er) {}
  });
  /* the bottom bar shows the keys */
  (function keysHint() { var bar = document.querySelector('#tool .actions'); if (bar && app()) bar.setAttribute('data-keys', NS.t('app.vs_keys')); else if (!bar) setTimeout(keysHint, 300); })();
  /* keys that belong to the App window, not to the document */
  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;   /* the document's own Alt letter (altkeys.js) came first */
    var k = (e.key || '').toLowerCase(), P = window.parent;
    var mine = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && k === 'k' || (e.ctrlKey || e.metaKey) && !e.altKey && k === 'b' ||
      e.altKey && !e.ctrlKey && !e.metaKey && /^(Digit[1-9]|KeyG)$/.test(e.code || '') ||
      e.altKey && e.ctrlKey && !e.metaKey && !e.shiftKey && /^Key[PITBLDRSCQ]$/.test(e.code || '') ||   /* Ctrl+Alt keys of the Shortcuts panel (19 Nov 2026) */
      !e.altKey && !e.metaKey && !e.shiftKey && (/^F([3-9]|10)$/.test(e.key) && !e.ctrlKey || e.ctrlKey && /^F[89]$/.test(e.key));
    if (!mine || !app()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (k === 'k' && !e.altKey) try { if (P.NS && P.NS.deskPalette) { var f = document.activeElement; P.focus(); P.NS.deskPalette(f && f !== document.body ? f : null); return; } } catch (er) {}
    try { P.focus(); P.document.dispatchEvent(new P.KeyboardEvent('keydown', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, shiftKey: e.shiftKey, bubbles: true, cancelable: true })); } catch (er) {}
  }, true);
  /* the App's language changes while a document is open: follow THIS tab's App only (its ns-lang event). The storage event
     also fires for a choice made in another tab or window, which must not switch this one (it takes it on the next load). */
  try { if (app()) window.parent.document.addEventListener('ns-lang', function (e) { if (e.detail && NS.setLang && e.detail !== document.documentElement.getAttribute('lang')) NS.setLang(e.detail, true); }); } catch (e) {}
  window.addEventListener('storage', function (e) {
    if (e.key === 'ns-theme') { if (e.newValue === 'light' || e.newValue === 'dark') document.documentElement.setAttribute('data-theme', e.newValue); else document.documentElement.removeAttribute('data-theme'); }
  });
  /* once the document is saved, the App's address names it (?open=<id>), so a reload shows that document, not a new one
     and never converts a quotation a second time; the App's title row names it too */
  function saved() {
    var t = document.getElementById('tool'), A = app(), j = null;
    if (!t || !A || !A.frameAt) return;
    if (!t.classList.contains('live') || /[?&](open|from)=/.test(location.search)) return;   /* still loading what the App asked for */
    try { j = JSON.parse(localStorage.getItem('ns-draft-' + t.getAttribute('data-doc')) || 'null'); } catch (e) {}
    var no = document.querySelector('#d-no, #s-no, [data-b="no"]');   /* only the draft of the document on screen (not one left from before) */
    A.frameAt(site, j && j.id && j.doc && (!no || no.value === j.doc.no) ? j : null);
  }
  function watch() { var st = document.getElementById('tool-status'); if (st) new MutationObserver(saved).observe(st, { childList: true, characterData: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();

}catch(e){(self.reportError||function(x){setTimeout(function(){throw x})})(e)}
