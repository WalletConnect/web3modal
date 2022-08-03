(function($,_){typeof exports=="object"&&typeof module<"u"?_(exports):typeof define=="function"&&define.amd?define(["exports"],_):($=typeof globalThis<"u"?globalThis:$||self,_($["@web3modal/core"]={}))})(this,function($){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const _=window.ShadowRoot&&(window.ShadyCSS===void 0||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,M=Symbol(),V=new WeakMap;class q{constructor(t,e,i){if(this._$cssResult$=!0,i!==M)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(_&&t===void 0){const i=e!==void 0&&e.length===1;i&&(t=V.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&V.set(e,t))}return t}toString(){return this.cssText}}const w=n=>new q(typeof n=="string"?n:n+"",void 0,M),F=(n,...t)=>{const e=n.length===1?n[0]:t.reduce((i,s,r)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+n[r+1],n[0]);return new q(e,n,M)},at=(n,t)=>{_?n.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{const i=document.createElement("style"),s=window.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,n.appendChild(i)})},K=_?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return w(e)})(n):n;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var R;const J=window.trustedTypes,dt=J?J.emptyScript:"",Z=window.reactiveElementPolyfillSupport,B={toAttribute(n,t){switch(t){case Boolean:n=n?dt:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let e=n;switch(t){case Boolean:e=n!==null;break;case Number:e=n===null?null:Number(n);break;case Object:case Array:try{e=JSON.parse(n)}catch{e=null}}return e}},G=(n,t)=>t!==n&&(t==t||n==n),j={attribute:!0,type:String,converter:B,reflect:!1,hasChanged:G};class y extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this.u()}static addInitializer(t){var e;(e=this.h)!==null&&e!==void 0||(this.h=[]),this.h.push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const s=this._$Ep(i,e);s!==void 0&&(this._$Ev.set(s,i),t.push(s))}),t}static createProperty(t,e=j){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i=typeof t=="symbol"?Symbol():"__"+t,s=this.getPropertyDescriptor(t,i,e);s!==void 0&&Object.defineProperty(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(s){const r=this[t];this[e]=s,this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||j}static finalize(){if(this.hasOwnProperty("finalized"))return!1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const e=this.properties,i=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(const s of i)this.createProperty(s,e[s])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const s of i)e.unshift(K(s))}else t!==void 0&&e.push(K(t));return e}static _$Ep(t,e){const i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}u(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,i;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((i=t.hostConnected)===null||i===void 0||i.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;const e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return at(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var i;return(i=e.hostConnected)===null||i===void 0?void 0:i.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var i;return(i=e.hostDisconnected)===null||i===void 0?void 0:i.call(e)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=j){var s,r;const o=this.constructor._$Ep(t,i);if(o!==void 0&&i.reflect===!0){const d=((r=(s=i.converter)===null||s===void 0?void 0:s.toAttribute)!==null&&r!==void 0?r:B.toAttribute)(e,i.type);this._$El=t,d==null?this.removeAttribute(o):this.setAttribute(o,d),this._$El=null}}_$AK(t,e){var i,s;const r=this.constructor,o=r._$Ev.get(t);if(o!==void 0&&this._$El!==o){const d=r.getPropertyOptions(o),l=d.converter,h=(s=(i=l?.fromAttribute)!==null&&i!==void 0?i:typeof l=="function"?l:null)!==null&&s!==void 0?s:B.fromAttribute;this._$El=o,this[o]=h(e,d.type),this._$El=null}}requestUpdate(t,e,i){let s=!0;t!==void 0&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||G)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),i.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,i))):s=!1),!this.isUpdatePending&&s&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((s,r)=>this[r]=s),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),(t=this._$ES)===null||t===void 0||t.forEach(s=>{var r;return(r=s.hostUpdate)===null||r===void 0?void 0:r.call(s)}),this.update(i)):this._$Ek()}catch(s){throw e=!1,this._$Ek(),s}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(i=>{var s;return(s=i.hostUpdated)===null||s===void 0?void 0:s.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,i)=>this._$EO(i,this[i],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}}y.finalized=!0,y.elementProperties=new Map,y.elementStyles=[],y.shadowRootOptions={mode:"open"},Z?.({ReactiveElement:y}),((R=globalThis.reactiveElementVersions)!==null&&R!==void 0?R:globalThis.reactiveElementVersions=[]).push("1.3.4");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var z;const m=globalThis.trustedTypes,Q=m?m.createPolicy("lit-html",{createHTML:n=>n}):void 0,f=`lit$${(Math.random()+"").slice(9)}$`,X="?"+f,ct=`<${X}>`,A=document,C=(n="")=>A.createComment(n),P=n=>n===null||typeof n!="object"&&typeof n!="function",Y=Array.isArray,ut=n=>Y(n)||typeof n?.[Symbol.iterator]=="function",k=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,tt=/-->/g,et=/>/g,g=RegExp(`>|[ 	
\f\r](?:([^\\s"'>=/]+)([ 	
\f\r]*=[ 	
\f\r]*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),it=/'/g,st=/"/g,nt=/^(?:script|style|textarea|title)$/i,pt=n=>(t,...e)=>({_$litType$:n,strings:t,values:e}),$t=pt(1),b=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),ot=new WeakMap,vt=(n,t,e)=>{var i,s;const r=(i=e?.renderBefore)!==null&&i!==void 0?i:t;let o=r._$litPart$;if(o===void 0){const d=(s=e?.renderBefore)!==null&&s!==void 0?s:null;r._$litPart$=o=new U(t.insertBefore(C(),d),d,void 0,e??{})}return o._$AI(n),o},E=A.createTreeWalker(A,129,null,!1),ft=(n,t)=>{const e=n.length-1,i=[];let s,r=t===2?"<svg>":"",o=k;for(let l=0;l<e;l++){const h=n[l];let v,a,c=-1,p=0;for(;p<h.length&&(o.lastIndex=p,a=o.exec(h),a!==null);)p=o.lastIndex,o===k?a[1]==="!--"?o=tt:a[1]!==void 0?o=et:a[2]!==void 0?(nt.test(a[2])&&(s=RegExp("</"+a[2],"g")),o=g):a[3]!==void 0&&(o=g):o===g?a[0]===">"?(o=s??k,c=-1):a[1]===void 0?c=-2:(c=o.lastIndex-a[2].length,v=a[1],o=a[3]===void 0?g:a[3]==='"'?st:it):o===st||o===it?o=g:o===tt||o===et?o=k:(o=g,s=void 0);const N=o===g&&n[l+1].startsWith("/>")?" ":"";r+=o===k?h+ct:c>=0?(i.push(v),h.slice(0,c)+"$lit$"+h.slice(c)+f+N):h+f+(c===-2?(i.push(void 0),l):N)}const d=r+(n[e]||"<?>")+(t===2?"</svg>":"");if(!Array.isArray(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return[Q!==void 0?Q.createHTML(d):d,i]};class x{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,o=0;const d=t.length-1,l=this.parts,[h,v]=ft(t,e);if(this.el=x.createElement(h,i),E.currentNode=this.el.content,e===2){const a=this.el.content,c=a.firstChild;c.remove(),a.append(...c.childNodes)}for(;(s=E.nextNode())!==null&&l.length<d;){if(s.nodeType===1){if(s.hasAttributes()){const a=[];for(const c of s.getAttributeNames())if(c.endsWith("$lit$")||c.startsWith(f)){const p=v[o++];if(a.push(c),p!==void 0){const N=s.getAttribute(p.toLowerCase()+"$lit$").split(f),O=/([.?@])?(.*)/.exec(p);l.push({type:1,index:r,name:O[2],strings:N,ctor:O[1]==="."?gt:O[1]==="?"?mt:O[1]==="@"?At:H})}else l.push({type:6,index:r})}for(const c of a)s.removeAttribute(c)}if(nt.test(s.tagName)){const a=s.textContent.split(f),c=a.length-1;if(c>0){s.textContent=m?m.emptyScript:"";for(let p=0;p<c;p++)s.append(a[p],C()),E.nextNode(),l.push({type:2,index:++r});s.append(a[c],C())}}}else if(s.nodeType===8)if(s.data===X)l.push({type:2,index:r});else{let a=-1;for(;(a=s.data.indexOf(f,a+1))!==-1;)l.push({type:7,index:r}),a+=f.length-1}r++}}static createElement(t,e){const i=A.createElement("template");return i.innerHTML=t,i}}function S(n,t,e=n,i){var s,r,o,d;if(t===b)return t;let l=i!==void 0?(s=e._$Cl)===null||s===void 0?void 0:s[i]:e._$Cu;const h=P(t)?void 0:t._$litDirective$;return l?.constructor!==h&&((r=l?._$AO)===null||r===void 0||r.call(l,!1),h===void 0?l=void 0:(l=new h(n),l._$AT(n,e,i)),i!==void 0?((o=(d=e)._$Cl)!==null&&o!==void 0?o:d._$Cl=[])[i]=l:e._$Cu=l),l!==void 0&&(t=S(n,l._$AS(n,t.values),l,i)),t}class _t{constructor(t,e){this.v=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}p(t){var e;const{el:{content:i},parts:s}=this._$AD,r=((e=t?.creationScope)!==null&&e!==void 0?e:A).importNode(i,!0);E.currentNode=r;let o=E.nextNode(),d=0,l=0,h=s[0];for(;h!==void 0;){if(d===h.index){let v;h.type===2?v=new U(o,o.nextSibling,this,t):h.type===1?v=new h.ctor(o,h.name,h.strings,this,t):h.type===6&&(v=new bt(o,this,t)),this.v.push(v),h=s[++l]}d!==h?.index&&(o=E.nextNode(),d++)}return r}m(t){let e=0;for(const i of this.v)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class U{constructor(t,e,i,s){var r;this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$C_=(r=s?.isConnected)===null||r===void 0||r}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$C_}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=S(this,t,e),P(t)?t===u||t==null||t===""?(this._$AH!==u&&this._$AR(),this._$AH=u):t!==this._$AH&&t!==b&&this.T(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.k(t):ut(t)?this.S(t):this.T(t)}j(t,e=this._$AB){return this._$AA.parentNode.insertBefore(t,e)}k(t){this._$AH!==t&&(this._$AR(),this._$AH=this.j(t))}T(t){this._$AH!==u&&P(this._$AH)?this._$AA.nextSibling.data=t:this.k(A.createTextNode(t)),this._$AH=t}$(t){var e;const{values:i,_$litType$:s}=t,r=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=x.createElement(s.h,this.options)),s);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===r)this._$AH.m(i);else{const o=new _t(r,this),d=o.p(this.options);o.m(i),this.k(d),this._$AH=o}}_$AC(t){let e=ot.get(t.strings);return e===void 0&&ot.set(t.strings,e=new x(t)),e}S(t){Y(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new U(this.j(C()),this.j(C()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for((i=this._$AP)===null||i===void 0||i.call(this,!1,!0,e);t&&t!==this._$AB;){const s=t.nextSibling;t.remove(),t=s}}setConnected(t){var e;this._$AM===void 0&&(this._$C_=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}}class H{constructor(t,e,i,s,r){this.type=1,this._$AH=u,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=u}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,s){const r=this.strings;let o=!1;if(r===void 0)t=S(this,t,e,0),o=!P(t)||t!==this._$AH&&t!==b,o&&(this._$AH=t);else{const d=t;let l,h;for(t=r[0],l=0;l<r.length-1;l++)h=S(this,d[i+l],e,l),h===b&&(h=this._$AH[l]),o||(o=!P(h)||h!==this._$AH[l]),h===u?t=u:t!==u&&(t+=(h??"")+r[l+1]),this._$AH[l]=h}o&&!s&&this.P(t)}P(t){t===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class gt extends H{constructor(){super(...arguments),this.type=3}P(t){this.element[this.name]=t===u?void 0:t}}const yt=m?m.emptyScript:"";class mt extends H{constructor(){super(...arguments),this.type=4}P(t){t&&t!==u?this.element.setAttribute(this.name,yt):this.element.removeAttribute(this.name)}}class At extends H{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){var i;if((t=(i=S(this,t,e,0))!==null&&i!==void 0?i:u)===b)return;const s=this._$AH,r=t===u&&s!==u||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==u&&(s===u||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;typeof this._$AH=="function"?this._$AH.call((i=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&i!==void 0?i:this.element,t):this._$AH.handleEvent(t)}}class bt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t)}}const rt=window.litHtmlPolyfillSupport;rt?.(x,U),((z=globalThis.litHtmlVersions)!==null&&z!==void 0?z:globalThis.litHtmlVersions=[]).push("2.2.7");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var L,D;class T extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return(t=(e=this.renderOptions).renderBefore)!==null&&t!==void 0||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=vt(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)===null||t===void 0||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)===null||t===void 0||t.setConnected(!1)}render(){return b}}T.finalized=!0,T._$litElement$=!0,(L=globalThis.litElementHydrateSupport)===null||L===void 0||L.call(globalThis,{LitElement:T});const lt=globalThis.litElementPolyfillSupport;lt?.({LitElement:T}),((D=globalThis.litElementVersions)!==null&&D!==void 0?D:globalThis.litElementVersions=[]).push("3.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Et=n=>t=>typeof t=="function"?((e,i)=>(window.customElements.define(e,i),i))(n,t):((e,i)=>{const{kind:s,elements:r}=i;return{kind:s,elements:r,finisher(o){window.customElements.define(e,o)}}})(n,t);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const St=(n,t)=>t.kind==="method"&&t.descriptor&&!("value"in t.descriptor)?{...t,finisher(e){e.createProperty(t.key,n)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:t.key,initializer(){typeof t.initializer=="function"&&(this[t.key]=t.initializer.call(this))},finisher(e){e.createProperty(t.key,n)}};function wt(n){return(t,e)=>e!==void 0?((i,s,r)=>{s.constructor.createProperty(r,i)})(n,t,e):St(n,t)}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var I;((I=window.HTMLSlotElement)===null||I===void 0?void 0:I.prototype.assignedElements)!=null;function Ct(n){return{fontFamily:w(`font-family: ${n??'-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif;'};`)}}var Pt=F`
  *,
  *::after,
  *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    ${Ct().fontFamily}
  }
`;function W(n=1){return{light:{foreground:{accent:`rgba(51, 150, 255, ${n})`,inverse:`rgba(255, 255, 255, ${n})`,1:`rgba(20, 20, 20, ${n})`,2:`rgba(121, 134, 134, ${n})`,3:`rgba(158, 169, 169, ${n})`},background:{accent:`rgba(232, 242, 252, ${n})`,1:`rgba(255, 255, 255, ${n})`,2:`rgba(241, 243, 243, ${n})`,3:`rgba(228, 231, 231, ${n})`},overlay:{thin:"rgba(0, 0, 0, 0.1)",thick:"rgba(0, 0, 0, 0.4)"}},dark:{foreground:{accent:`rgba(71, 161, 255, ${n})`,inverse:`rgba(255, 255, 255, ${n})`,1:`rgba(228, 231, 231, ${n})`,2:`rgba(148, 158, 158, ${n})`,3:`rgba(110, 119, 119, ${n})`},background:{accent:`rgba(21, 38, 55, ${n})`,1:`rgba(20, 20, 20, ${n})`,2:`rgba(39, 42, 42, ${n})`,3:`rgba(59, 64, 64, ${n})`},overlay:{thin:"rgba(0, 0, 0, 0.1)",thick:"rgba(0, 0, 0, 0.4)"}}}}const kt=w(W().light.foreground.accent),xt=w(W().dark.foreground.accent),Ut=w(W().light.foreground.inverse);var Tt=F`
  :host button {
    border: none;
    transition: 0.2s filter ease-in-out;
    color: ${Ut};
  }

  :host button:hover {
    filter: brightness(90%);
  }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    :host button {
      background-color: ${xt};
    }

    :host button:hover {
      filter: brightness(110%);
    }
  }

  /* Light Mode */
  @media (prefers-color-scheme: light) {
    :host button {
      background-color: ${kt};
    }

    :host button:hover {
      filter: brightness(90%);
    }
  }
`,Ht=Object.defineProperty,Nt=Object.getOwnPropertyDescriptor,ht=(n,t,e,i)=>{for(var s=i>1?void 0:i?Nt(t,e):t,r=n.length-1,o;r>=0;r--)(o=n[r])&&(s=(i?o(t,e,s):o(s))||s);return i&&s&&Ht(t,e,s),s};$.ConnectButtonWC=class extends T{constructor(){super(...arguments),this.label="Connect Wallet"}render(){return $t`<button>${this.label}</button>`}},$.ConnectButtonWC.styles=[Pt,Tt],ht([wt({type:String})],$.ConnectButtonWC.prototype,"label",2),$.ConnectButtonWC=ht([Et("connect-button")],$.ConnectButtonWC),Object.defineProperty($,"__esModule",{value:!0})});
//# sourceMappingURL=index.umd.js.map
