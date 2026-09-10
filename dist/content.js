var i=class{static extractReadableContent(){let e=["nav","footer","header","aside",".ads",".sidebar",".cookie-banner",".popup",".social-widgets",".comments","script","style","form"],t=document.body.cloneNode(!0);return e.forEach(s=>{t.querySelectorAll(s).forEach(m=>m.remove())}),t.querySelectorAll("*").forEach(s=>{let o=window.getComputedStyle(s);(o.display==="none"||o.visibility==="hidden"||parseInt(o.opacity)===0)&&s.remove()}),t.innerText.trim()}};function a(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}var p={enabled:!0,provider:"ollama",ollamaUrl:"http://localhost:11434",ollamaModel:"llama3.2",apiUrl:"",apiKey:"",apiModel:"",theme:"system",responseStyle:"normal",maxText:3e4},l="browsemind_settings";async function c(){return new Promise(r=>{chrome.storage.local.get([l],e=>{r(e[l]||p)})})}var d=class{askAIButton=null;responsePanel=null;currentSelection="";constructor(){this.init(),this.injectStyles()}injectStyles(){let e=document.createElement("style");e.textContent=`
      .bm-response-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 600px;
        z-index: 10001;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: sans-serif;
        transition: all 0.3s ease;
      }
      .bm-theme-light { background: white; color: #333; border: 1px solid #ccc; }
      .bm-theme-dark { background: #222; color: #eee; border: 1px solid #444; }
      .bm-panel-header {
        padding: 10px 16px;
        background: rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        border-bottom: 1px solid rgba(0,0,0,0.1);
      }
      .bm-theme-dark .bm-panel-header { background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); }
      .bm-panel-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
      }
      .bm-panel-content {
        padding: 16px;
        overflow-y: auto;
        line-height: 1.5;
      }
      .bm-ask-ai-btn {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .bm-error { color: #dc3545; font-weight: bold; }
    `,document.head.appendChild(e)}async init(){document.addEventListener("mouseup",()=>this.handleSelection()),document.addEventListener("mousedown",e=>this.handleMouseDown(e)),chrome.runtime.onMessage.addListener((e,t,n)=>{e.type==="EXTRACT_CONTENT"?n({content:i.extractReadableContent()}):e.type==="AI_RESPONSE"&&(this.showResponsePanel("Thinking..."),this.updateResponsePanel(e.data.text,e.data.error))})}async handleSelection(){let e=window.getSelection(),t=e?.toString().trim();if(!t){this.removeAskAIButton();return}(await c()).enabled&&(this.currentSelection=t,this.showAskAIButton(e))}handleMouseDown(e){this.askAIButton&&this.askAIButton.contains(e.target)||this.responsePanel&&this.responsePanel.contains(e.target)||this.removeAskAIButton()}showAskAIButton(e){this.removeAskAIButton();let n=e.getRangeAt(0).getBoundingClientRect();this.askAIButton=document.createElement("button"),this.askAIButton.innerText="Ask AI",this.askAIButton.className="bm-ask-ai-btn",this.askAIButton.style.position="fixed",this.askAIButton.style.top=`${n.top+window.scrollY-30}px`,this.askAIButton.style.left=`${n.left+window.scrollX}px`,this.askAIButton.style.zIndex="10000",this.askAIButton.onclick=()=>{this.sendAIRequest("ASK",this.currentSelection,"What does this mean?"),this.removeAskAIButton()},document.body.appendChild(this.askAIButton)}removeAskAIButton(){this.askAIButton&&(this.askAIButton.remove(),this.askAIButton=null)}async sendAIRequest(e,t,n){this.showResponsePanel("Thinking..."),chrome.runtime.sendMessage({type:"AI_REQUEST",data:{type:e,text:t,question:n}},s=>{if(chrome.runtime.lastError){this.updateResponsePanel("Error: "+chrome.runtime.lastError.message);return}this.updateResponsePanel(s.text,s.error)})}showResponsePanel(e){this.responsePanel||(this.responsePanel=document.createElement("div"),this.responsePanel.className="bm-response-panel",this.responsePanel.innerHTML=`
        <div class="bm-panel-header">
          <span>BrowseMind</span>
          <button class="bm-panel-close">\xD7</button>
        </div>
        <div class="bm-panel-content"></div>
      `,this.responsePanel.querySelector(".bm-panel-close")?.addEventListener("click",()=>{this.responsePanel?.remove(),this.responsePanel=null}),document.body.appendChild(this.responsePanel)),this.updateResponsePanel(e)}updateResponsePanel(e,t){let n=this.responsePanel?.querySelector(".bm-panel-content");n&&(c().then(s=>{let o=s.theme==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":s.theme;this.responsePanel&&(this.responsePanel.className=`bm-response-panel bm-theme-${o}`)}),t?n.innerHTML=`<div class="bm-error">${a(t)}</div>`:n.innerHTML=`<div class="bm-text">${a(e)}</div>`)}};new d;
