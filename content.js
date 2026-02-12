// Manipulate! - Content Script v2.4.1

let savedRange = null;
let activeElement = null; 
let initialState = null; 

// Background.js'den gelen mesajı dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "open_modal") {
    saveSelection();
    if (savedRange && request.selectedText && request.selectedText.trim().length > 0) {
      const selection = window.getSelection();
      const parentElement = selection.anchorNode.parentElement;
      
      // Hata önlemi: parentElement yoksa body al
      const targetElement = parentElement || document.body;
      const computedStyle = window.getComputedStyle(targetElement);

      // Orijinal stilleri kaydet (Restore işlemi için)
      initialState = {
        text: request.selectedText,
        fontSize: computedStyle.fontSize,
        color: computedStyle.color,
        fontWeight: computedStyle.fontWeight,
        fontStyle: computedStyle.fontStyle,
        textDecoration: computedStyle.textDecoration,
        fontFamily: computedStyle.fontFamily
      };
      
      createLiveElement(request.selectedText);
      createShadowModal(request.selectedText);
    } else {
      console.log("Manipulate: Metin seçilmedi.");
    }
  }
});

function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
  }
}

function createLiveElement(text) {
  try {
    savedRange.deleteContents();
    activeElement = document.createElement("span");
    activeElement.textContent = text;
    
    // Orijinal stilleri uygula
    activeElement.style.fontSize = initialState.fontSize;
    activeElement.style.color = initialState.color;
    activeElement.style.fontWeight = initialState.fontWeight;
    activeElement.style.fontStyle = initialState.fontStyle;
    activeElement.style.textDecoration = initialState.textDecoration;
    activeElement.style.fontFamily = initialState.fontFamily;
    activeElement.style.display = "inline-block"; 
    activeElement.dataset.manipulated = "true"; 
    
    savedRange.insertNode(activeElement);
  } catch (e) {
    console.error("Element oluşturma hatası:", e);
  }
}

function createShadowModal(initialText) {
  const existingHost = document.getElementById("manipulator-extension-host");
  if (existingHost) existingHost.remove();

  const host = document.createElement("div");
  host.id = "manipulator-extension-host";
  host.style.position = "fixed"; 
  host.style.zIndex = "2147483647";
  host.style.top = "100px";
  host.style.right = "50px";
  
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; }
    
    .modal-container {
      background: #fff; width: 350px; border-radius: 10px;
      box-shadow: 0 15px 30px rgba(0,0,0,0.25); border: 1px solid #e5e7eb;
      display: flex; flex-direction: column;
      animation: fadeIn 0.2s ease-out;
    }
    
    /* Header Styles */
    .modal-header {
      background: #111827; color: #fff; padding: 12px 18px; cursor: move;
      display: flex; justify-content: space-between; align-items: center;
      user-select: none; border-radius: 9px 9px 0 0;
    }
    .header-info h3 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; }
    
    /* Prevent image dragging on the logo */
    .header-info img { pointer-events: none; -webkit-user-drag: none; user-select: none; }
    
    .header-info span.subtitle { font-size: 12px; color: #d1d5db; display: block; margin-top: 2px; }
    
    /* Header Control Buttons */
    .header-buttons { display: flex; align-items: center; gap: 12px; }

    .header-toggle-btn {
      cursor: pointer; color: #9ca3af; background: none; border: none; padding: 0;
      display: flex; align-items: center; transition: color 0.2s;
    }
    .header-toggle-btn:hover { color: #fff; } 
    .header-toggle-btn svg { width: 30px; height: 30px; transition: transform 0.3s ease; }
    .chevron-down { transform: rotate(180deg); }

    .close-btn { cursor: pointer; font-size: 30px; color: #9ca3af; background: none; border: none; line-height: 1; padding: 0; transition: color 0.2s; }
    .close-btn:hover { color: #fff; } 

    /* Body Styles */
    .modal-body { padding: 14px; }
    .label-text { font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 5px; }
    
    textarea {
      width: 100%; height: 65px; padding: 10px; border: 1px solid #d1d5db;
      border-radius: 6px; resize: none; font-size: 14px; margin-bottom: 15px;
      font-family: inherit; background-color: #f9fafb; color: #1f2937;
      transition: all 0.2s;
    }
    textarea:focus { outline: none; border-color: #F92672; background-color: #fff; box-shadow: 0 0 0 3px rgba(249, 38, 114, 0.1); }

    #style-section { transition: all 0.2s ease; }

    /* Toolbar Styles */
    .toolbar-top { display: flex; gap: 6px; margin-bottom: 10px; align-items: center; }
    
    .style-btn {
      width: 34px; height: 34px; border: 1px solid #e5e7eb; background: #fff;
      border-radius: 5px; cursor: pointer; font-weight: bold; color: #374151;
      display: flex; align-items: center; justify-content: center; font-size: 14px;
      transition: all 0.2s;
    }
    .style-btn:hover { background: #f3f4f6; }
    .style-btn.active { background: #8A1C7C; color: #fff; border-color: #8A1C7C; }
    
    input[type="number"] {
      width: 55px; height: 34px; padding: 5px; border: 1px solid #d1d5db; border-radius: 5px; text-align: center; font-size: 13px;
    }
    input[type="number"]:focus { outline: none; border-color: #F92672; }

    select#select-font {
      width: 100%; height: 34px; padding: 0 8px; border: 1px solid #d1d5db; border-radius: 5px;
      background-color: #fff; margin-bottom: 10px; font-size: 13px; color: #374151; cursor: pointer;
    }
    select#select-font:focus { outline: none; border-color: #F92672; }

    /* Color Palette */
    .color-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-bottom: 8px; padding: 4px; }
    .color-circle {
      width: 100%; aspect-ratio: 1; border-radius: 50%; cursor: pointer;
      border: 1px solid rgba(0,0,0,0.1); transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
    }
    .color-circle:hover { transform: scale(1.15); box-shadow: 0 4px 8px rgba(0,0,0,0.15); z-index: 2; }
    .color-circle.selected { transform: scale(1.15); box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 2; border-color: rgba(0,0,0,0.2); }
    .color-circle.selected::after {
      content: ''; position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);
      width: 4px; height: 9px; border: solid #fff; border-width: 0 2px 2px 0;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
    }

    /* Smart Color Copier */
    .color-footer { display: flex; justify-content: flex-end; margin-bottom: 15px; position: relative; }
    .hex-copier {
      font-family: monospace; font-size: 12px; color: #6b7280;
      background: #f3f4f6; padding: 6px 10px; border-radius: 4px;
      cursor: pointer; transition: all 0.2s; 
      display: flex; align-items: center; gap: 5px; letter-spacing: 0.5px;
    }
    .hex-copier:hover { color: #8A1C7C; background: #fdf2f8; }
    .hex-copier.copied { color: #8A1C7C; background: #fdf2f8; font-weight: bold; }

    /* Tooltips */
    [data-tip] { position: relative; }
    [data-tip]::before, [data-tip]::after {
      position: absolute; opacity: 0; visibility: hidden; transition: all 0.2s ease; pointer-events: none; z-index: 9999;
    }
    [data-tip]::before {
      content: ''; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(4px);
      border: 5px solid transparent; border-top-color: #1f2937;
    }
    [data-tip]::after {
      content: attr(data-tip); bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%) translateY(4px);
      background: #1f2937; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; white-space: nowrap;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2); letter-spacing: 0.3px;
    }
    [data-tip]:hover::before, [data-tip]:hover::after { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
    
    .tip-bottom::before { bottom: auto; top: 100%; border-top-color: transparent; border-bottom-color: #1f2937; transform: translateX(-50%) translateY(-4px); }
    .tip-bottom::after { bottom: auto; top: calc(100% + 8px); transform: translateX(-50%) translateY(-4px); }
    .tip-bottom:hover::before, .tip-bottom:hover::after { transform: translateX(-50%) translateY(0); }

    /* Action Buttons */
    .button-group { display: flex; gap: 10px; margin-top: 5px; }

    .action-btn {
      flex: 1; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 13px;
      transition: all 0.2s; letter-spacing: 0.5px;
    }

    #btn-done {
      background: linear-gradient(135deg, #8A1C7C 0%, #F92672 100%);
      color: white; border: none; box-shadow: 0 4px 10px rgba(249, 38, 114, 0.2);
    }
    #btn-done:hover { box-shadow: 0 6px 14px rgba(249, 38, 114, 0.35); transform: translateY(-1px); }

    #btn-restore {
      background: #fff; color: #4b5563; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    #btn-restore:hover { background: #fdf2f8; border-color: #F92672; color: #F92672; }
    #btn-restore svg { width: 14px; height: 14px; }

    /* Footer - Original Design Restored */
    .modal-footer {
      background: #f8fafc; padding: 16px 14px; border-top: 1px solid #e2e8f0;
      text-align: center; font-size: 13px; color: #64748b; border-radius: 0 0 9px 9px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .modal-footer a { color: #8A1C7C; text-decoration: none; font-weight: 600; }
    .modal-footer a:hover { color: #F92672; text-decoration: underline; }

    .bmc-btn {
      background: #fff !important; color: #374151 !important; border: 1px solid #d1d5db;
      padding: 8px 16px; border-radius: 20px; font-weight: 600; text-decoration: none; font-size: 13px;
      transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
    }
    .bmc-btn:hover { 
      background: #fdf2f8 !important; border-color: #F92672; color: #F92672 !important; 
      text-decoration: none !important; box-shadow: 0 4px 8px rgba(249, 38, 114, 0.1);
    }
    .bmc-btn svg { width: 16px; height: 16px; transition: stroke 0.2s; }
    .bmc-btn:hover svg { stroke: #F92672; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  const container = document.createElement("div");
  container.className = "modal-container";

  const colors = [
    '#000000', '#4B5563', '#9CA3AF', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8A1C7C', '#F92672', '#EC4899', '#E11D48'
  ];

  const iconUrl = chrome.runtime.getURL('icons/16.png');

  // GÜVENLİK DÜZELTMESİ YAPILDI AMA TASARIM ORİJİNAL HALİYLE KORUNDU
  // "The Web Text Changer" geri geldi.
  // "textarea" içi boş bırakıldı (XSS önlemi için).
  // Footer kısmı tamamen orijinal haline döndürüldü.
  
  container.innerHTML = `
    <div class="modal-header" id="drag-header">
      <div class="header-info">
        <h3>
          <img src="${iconUrl}" alt="Manipulate Icon" style="width:16px; height:16px; margin-right:6px; display:block;">
          Manipulate!
          <span style="font-size:12px; font-weight:400; color:#d1d5db; background:rgba(255,255,255,0.15); padding:2px 6px; border-radius:4px; margin-left:6px;">v2.4.1</span>
        </h3>
        <span class="subtitle">The Web Text Changer</span>
      </div>
      <div class="header-buttons">
        <button id="toggle-style-btn" class="header-toggle-btn" title="Toggle Style Settings">
          <svg id="style-chevron" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button class="close-btn" title="Close">&times;</button>
      </div>
    </div>

    <div class="modal-body">
      <span class="label-text">Content</span>
      <textarea id="input-text" spellcheck="false"></textarea> <div id="style-section">
        <span class="label-text">Style Settings</span>
        <div class="toolbar-top">
          <button class="style-btn" id="btn-bold" data-tip="Bold">B</button>
          <button class="style-btn" id="btn-italic" data-tip="Italic">I</button>
          <button class="style-btn" id="btn-underline" data-tip="Underline">U</button>
          <div style="margin-left: auto; display:flex; align-items:center; gap:4px;" data-tip="Font Size">
            <input type="number" id="input-size" value="${parseInt(initialState.fontSize)}">
            <span style="font-size:12px; color:#6b7280; font-weight:500;">px</span>
          </div>
        </div>
        
        <select id="select-font" data-tip="Choose Font Family">
            <option value="inherit">Default Font</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Verdana, sans-serif">Verdana</option>
        </select>
        
        <div class="color-grid">
          ${colors.map(c => `<div class="color-circle" style="background-color:${c}" data-color="${c}"></div>`).join('')}
        </div>
        
        <div class="color-footer">
           <div class="hex-copier" id="hex-copier" title="Click to copy color code">#000000</div>
        </div>
      </div>

      <div class="button-group">
        <button id="btn-restore" class="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          RESTORE
        </button>
        <button id="btn-done" class="action-btn">DONE</button>
      </div>
    </div>

    <div class="modal-footer">
      <div>Copyright &copy; 2021-2026 Developed by <a href="https://korayd.gr" target="_blank">koraydgr</a></div>
      
      <a href="https://buymeacoffee.com/koraydgr" target="_blank" class="bmc-btn tip-bottom" data-tip="Support the Developer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
        Buy Me a Coffee
      </a>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  // --- ELEMENT SEÇİMLERİ ---
  const textArea = shadow.getElementById('input-text');
  
  // GÜVENLİK DÜZELTMESİ BURADA DEVREYE GİRİYOR
  // HTML içine değil, DOM elementinin value özelliğine atıyoruz.
  textArea.value = initialText;

  const sizeInput = shadow.getElementById('input-size');
  const fontSelect = shadow.getElementById('select-font');
  const btnBold = shadow.getElementById('btn-bold');
  const btnItalic = shadow.getElementById('btn-italic');
  const btnUnderline = shadow.getElementById('btn-underline');
  const restoreBtn = shadow.getElementById('btn-restore');
  const hexCopier = shadow.getElementById('hex-copier');
  const styleSection = shadow.getElementById('style-section');
  const toggleStyleBtn = shadow.getElementById('toggle-style-btn');

  // --- RESTORE LOGIC ---
  restoreBtn.onclick = () => {
    if (!activeElement || !initialState) return;

    textArea.value = initialState.text;
    sizeInput.value = parseInt(initialState.fontSize);
    fontSelect.value = "inherit";
    btnBold.classList.remove('active');
    btnItalic.classList.remove('active');
    btnUnderline.classList.remove('active');
    shadow.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
    
    hexCopier.textContent = "#000000";

    activeElement.textContent = initialState.text;
    activeElement.style.fontSize = initialState.fontSize;
    activeElement.style.color = initialState.color;
    activeElement.style.fontWeight = initialState.fontWeight;
    activeElement.style.fontStyle = initialState.fontStyle;
    activeElement.style.textDecoration = initialState.textDecoration;
    activeElement.style.fontFamily = initialState.fontFamily;
  };

  // --- LIVE UPDATES ---
  textArea.oninput = (e) => { if (activeElement) activeElement.textContent = e.target.value; };
  sizeInput.oninput = (e) => { if (activeElement) activeElement.style.fontSize = e.target.value + "px"; };
  fontSelect.onchange = (e) => { if (activeElement) activeElement.style.fontFamily = e.target.value; };

  const styleToggle = (btn, prop, activeVal, normalVal) => {
    btn.onclick = () => {
      const isActive = btn.classList.toggle('active');
      if (activeElement) activeElement.style[prop] = isActive ? activeVal : normalVal;
    };
  };
  styleToggle(btnBold, 'fontWeight', 'bold', 'normal');
  styleToggle(btnItalic, 'fontStyle', 'italic', 'normal');
  styleToggle(btnUnderline, 'textDecoration', 'underline', 'none');

  let currentCopierHex = "#000000";
  
  shadow.querySelectorAll('.color-circle').forEach(circle => {
    circle.onmouseenter = () => {
      if (!hexCopier.classList.contains('copied')) {
        hexCopier.textContent = circle.dataset.color.toUpperCase();
      }
    };
    
    circle.onclick = () => {
      shadow.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
      circle.classList.add('selected');
      if (activeElement) activeElement.style.color = circle.dataset.color;
      currentCopierHex = circle.dataset.color.toUpperCase();
      
      if (!hexCopier.classList.contains('copied')) {
        hexCopier.textContent = currentCopierHex;
      }
    };
  });
  
  shadow.querySelector('.color-grid').onmouseleave = () => {
    if (!hexCopier.classList.contains('copied')) {
      hexCopier.textContent = currentCopierHex;
    }
  };

  // ELEGANT INLINE COPY ANIMATION
  hexCopier.onclick = () => {
    navigator.clipboard.writeText(currentCopierHex).then(() => {
      hexCopier.textContent = "COPIED!";
      hexCopier.classList.add('copied');
      
      setTimeout(() => {
        hexCopier.textContent = currentCopierHex;
        hexCopier.classList.remove('copied');
      }, 1500);
    });
  };

  toggleStyleBtn.onclick = () => {
    const isHidden = styleSection.style.display === 'none';
    styleSection.style.display = isHidden ? 'block' : 'none';
    const chevron = shadow.getElementById('style-chevron');
    chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  };

  const header = shadow.getElementById('drag-header');
  let isDragging = false, startX, startY, initialLeft, initialTop;
  header.onmousedown = (e) => {
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    const rect = host.getBoundingClientRect();
    initialLeft = rect.left; initialTop = rect.top;
    header.style.cursor = 'grabbing';
  };
  document.onmousemove = (e) => {
    if (!isDragging) return;
    let newLeft = initialLeft + (e.clientX - startX);
    let newTop = initialTop + (e.clientY - startY);
    const rect = host.getBoundingClientRect();
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - rect.width));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - 40));
    host.style.left = `${newLeft}px`; host.style.top = `${newTop}px`; host.style.right = 'auto';
  };
  document.onmouseup = () => { isDragging = false; header.style.cursor = 'move'; };

  shadow.querySelector('.close-btn').onclick = () => host.remove();
  shadow.getElementById('btn-done').onclick = () => host.remove();
}