"use strict";(()=>{var h=Object.defineProperty;var b=(r,e,t)=>e in r?h(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var l=(r,e,t)=>(b(r,typeof e!="symbol"?e+"":e,t),t);var c=class{static async extractContent(e=3e4){let t=document.title,o=window.location.href,n=["nav","footer","header","aside",".ads",".sidebar","#footer","#header",".cookie-banner",".popup","script","style","noscript"],a=Array.from(document.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, td")),p="";for(let g of a)this.isNoise(g,n)||(p+=g.textContent?.trim()+"\\n");return`Title: ${t}\\nURL: ${o}\\n\\nContent:\\n${p}`.substring(0,e)}static isNoise(e,t){for(let o of t)if(e.closest(o))return!0;return!1}};var s={provider:"ollama",ollama:{url:"http://localhost:11434",model:"llama3.2"},openai:{baseUrl:"https://api.openai.com/v1",apiKey:"",model:"gpt-4o"}},u={enabled:!0,theme:"system",responseStyle:"normal",maxWebpageText:3e4,debugMode:!1},f=50;var i=class{static async getConfig(){let e=await chrome.storage.local.get("config");return e.config?{...s,...e.config,ollama:{...s.ollama,...e.config.ollama},openai:{...s.openai,...e.config.openai}}:s}static async setConfig(e){await chrome.storage.local.set({config:e})}static async getPreferences(){return(await chrome.storage.local.get("preferences")).preferences||u}static async setPreferences(e){await chrome.storage.local.set({preferences:e})}static async getDebugLogs(){return(await chrome.storage.local.get("debugLogs")).debugLogs||[]}static async addDebugLog(e){let t=await this.getDebugLogs(),o=[e,...t].slice(0,f);await chrome.storage.local.set({debugLogs:o})}static async clearDebugLogs(){await chrome.storage.local.remove("debugLogs")}};function m(r){let e=document.createElement("p");return e.textContent=r,e.innerHTML}var d=class{constructor(){l(this,"floatingButton",null);l(this,"responsePanel",null);l(this,"shadowRoot",null);this.init()}async init(){this.setupSelectionListener(),this.setupMessageListener()}setupSelectionListener(){document.addEventListener("mouseup",async()=>{let e=window.getSelection(),t=e?.toString().trim();if(!(await i.getPreferences()).enabled||!t){this.removeFloatingButton();return}this.showFloatingButton(e)}),document.addEventListener("mousedown",e=>{this.floatingButton&&e.target!==this.floatingButton&&this.removeFloatingButton()})}showFloatingButton(e){this.removeFloatingButton();let o=e.getRangeAt(0).getBoundingClientRect();this.floatingButton=document.createElement("button"),this.floatingButton.textContent="Send to AI",this.floatingButton.className="bm-floating-button",this.floatingButton.style.position="fixed",this.floatingButton.style.top=`${o.top-30}px`,this.floatingButton.style.left=`${o.left+o.width/2}px`,this.floatingButton.style.transform="translateX(-50%)",this.floatingButton.style.zIndex="10000",this.floatingButton.onclick=()=>{let n=e.toString().trim();chrome.runtime.sendMessage({action:"send-selected-text",payload:n}),this.removeFloatingButton()},document.body.appendChild(this.floatingButton)}removeFloatingButton(){this.floatingButton&&(this.floatingButton.remove(),this.floatingButton=null)}async createResponsePanel(){if(this.responsePanel)return;let e=document.createElement("div");e.id="bm-response-container",document.body.appendChild(e),this.shadowRoot=e.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=`
      :host {
        position: fixed;
        left: 20px;
        bottom: 20px;
        width: 350px;
        max-height: 500px;
        z-index: 10001;
        font-family: system-ui, -apple-system, sans-serif;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
      }
      .panel {
        background: var(--bm-bg, #fff);
        color: var(--bm-text, #333);
        border: 1px solid var(--bm-border, #ddd);
        display: flex;
        flex-direction: column;
        max-height: 500px;
      }
      .header {
        padding: 12px;
        background: var(--bm-header-bg, #f5f5f5);
        border-bottom: 1px solid var(--bm-border, #ddd);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }
      .close-btn {
        cursor: pointer;
        border: none;
        background: none;
        font-size: 20px;
        color: inherit;
      }
      .content {
        padding: 15px;
        overflow-y: auto;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-style: italic;
      }
      .error {
        color: #d32f2f;
        padding: 15px;
        font-weight: 500;
      }
    `,this.shadowRoot.appendChild(t);let o=document.createElement("div");o.className="panel";let n=document.createElement("div");n.className="header",n.innerHTML='<span>BrowseMind</span><button class="close-btn">&times;</button>';let a=document.createElement("div");a.className="content",o.appendChild(n),o.appendChild(a),this.shadowRoot.appendChild(o),n.querySelector(".close-btn")?.addEventListener("click",()=>{e.remove(),this.responsePanel=null,this.shadowRoot=null}),this.responsePanel=o,this.applyTheme()}async applyTheme(){let t=(await i.getPreferences()).theme;t==="system"&&(t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");let o=this.shadowRoot;if(!o)return;let n=t==="dark"?{bg:"#222",text:"#eee",border:"#444",headerBg:"#333"}:{bg:"#fff",text:"#333",border:"#ddd",headerBg:"#f5f5f5"};o.style.setProperty("--bm-bg",n.bg),o.style.setProperty("--bm-text",n.text),o.style.setProperty("--bm-border",n.border),o.style.setProperty("--bm-header-bg",n.headerBg)}showResponse(e){this.createResponsePanel();let t=this.shadowRoot?.querySelector(".content");t&&(t.innerHTML=m(e))}showError(e){this.createResponsePanel();let t=this.shadowRoot?.querySelector(".content");t&&(t.innerHTML=`<div class="error">Error: ${e.message||"An unknown error occurred"}</div>`)}setupMessageListener(){chrome.runtime.onMessage.addListener(async e=>{e.action==="show-response"?this.showResponse(e.response.content):e.action==="show-error"&&this.showError(e.error)}),chrome.runtime.onMessage.addListener((e,t,o)=>{if(e.action==="start-scan")return c.extractContent().then(n=>{o({content:n})}),!0})}};new d;})();
//# sourceMappingURL=content.js.map
