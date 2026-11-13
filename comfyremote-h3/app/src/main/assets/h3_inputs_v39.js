/* COMFYREMOTE_H3_INPUTS_V40
   Restore I2V/FL2V/T2V/Long input fields from the H3 agent's known API contract.
   Do not touch the working UltraSharp/V34 flow, other profiles, or the agent.
*/
(function () {
  'use strict';
  if (window.__comfyH3InputsV39) return;
  window.__comfyH3InputsV39 = true;

  const KIND = {
    'EROS_OUTPUT_P_ROOT_API_EROS15_DMDV2':'i2v',
    'EROS_FL2V_OUTPUT_P_ROOT_API_EROS15_DMDV2':'fl2v',
    'EROS_OUTPUT_P_ROOT_API':'t2v',
    'h3_i2v_long':'i2v_long',
    'h3_fl2v_long':'fl2v_long',
    'h3_fl2v_3frames':'fl2v_3frames',
    'h3_fl2v_4frames':'fl2v_4frames'
  };
  const CATALOG = ['576x320','768x448','864x480','1152x640','1344x768','640x1152','768x1344'];
  const BASE_STEPS = [8,12,16,20];
  const remembered = new Map();
  let lastSchema = '';
  let lastProfile = '';

  function options(values, format) {
    return values.map(function(value){return {value:value,label:format ? format(value):String(value)};});
  }
  function schema(id) {
    const kind = KIND[id];
    if (!kind) return [];
    const isLong = kind.indexOf('_long') !== -1;
    const needsImage = kind !== 't2v';
    const needsLast = kind === 'fl2v' || kind === 'fl2v_long' || kind === 'fl2v_3frames' || kind === 'fl2v_4frames';
    const result = [];
    if (needsImage) result.push({key:'input_image',type:'image',label:'Startbild auswählen',required:true,hint:'Neues PNG-, JPG- oder WebP-Bild vom Gerät hochladen oder ein vorhandenes H3-Eingabebild wählen.'});
    if (kind === 'fl2v_3frames' || kind === 'fl2v_4frames') {
      const count = kind === 'fl2v_3frames' ? 1 : 2;
      for (let i = 1; i <= count; i++) result.push({key:'middle_image_'+i,type:'image',label:count === 1 ? 'MIDDLE – Zwischenbild' : 'MIDDLE '+i+' – Zwischenbild',required:true,hint:count === 1 ? 'Referenzbild fuer die Videomitte (50 %).' : 'Referenzbild fuer '+(i === 1 ? '33 %' : '67 %')+' der Videodauer.'});
    }
    if (needsLast) result.push({key:'last_image',type:'image',label:'Endbild auswählen',required:true,hint:'Ein zweites, separates Bild für den letzten Videoframe.'});
    result.push({key:'positive_prompt',type:'textarea',label:'Positiver Prompt / Handlung',required:true,hint:'Beschreibe die gewünschte Bewegung beziehungsweise Szene.'});
    result.push({key:'duration_seconds',type:'select',label:isLong?'Gesamtdauer':'Videodauer',default:isLong?10:5,
      options:options(isLong?[10,15,20,25,30]:[5,10,15],function(n){return n+' Sekunden';})});
    result.push({key:'h3_resolution',type:'select',label:'Auflösungsbudget',default:'768x448',options:options(CATALOG),
      hint:needsImage?'Das Bild wird automatisch proportional eingepasst (kein Zuschnitt).':'Die nächste unterstützte H3-Auflösung wird gewählt.'});
    result.push({key:'sampler_steps',type:'select',label:isLong?'Sampling-Schritte je Segment':'Sampling-Schritte',default:(kind === 'fl2v_3frames' || kind === 'fl2v_4frames')?8:12,options:options(BASE_STEPS)});
    result.push({key:'seed',type:'number',label:'Seed (-1 = zufällig)',default:-1,min:-1,step:1});
    if (needsImage) result.push({key:'auto_aspect_ratio',type:'checkbox',label:'Seitenverhältnis automatisch beibehalten',default:true});
    return result;
  }

  function activeProfile() {
    const select = document.getElementById('workflowSelect');
    if (!select) return null;
    try {
      if (typeof profileById === 'function') return profileById(select.value);
      if (typeof state !== 'undefined') return (state.profiles || []).find(p=>p.id===select.value);
    } catch(e) { console.warn('[H3 INPUTS V39] profile lookup:',e); }
    return null;
  }
  function isSupported(p) { return !!(p && Object.prototype.hasOwnProperty.call(KIND,p.id)); }

  function fillFields(p) {
    if (!isSupported(p)) return;
    const id=p.id;
    const incoming=Array.isArray(p.fields)?p.fields.filter(f=>f&&typeof f.key==='string'):[];
    // A heartbeat occasionally contains empty field lists; keep the actual agent
    // schema (including Smart Director fields) from the last complete update.
    if (incoming.length) {
      const prior=remembered.get(id)||[];
      const hasExtra=incoming.some(f=>!schema(id).some(base=>base.key===f.key));
      if (hasExtra || !prior.length) remembered.set(id,incoming.slice());
    }
    const fromAgent=incoming.length?incoming:(remembered.get(id)||[]);
    const base=schema(id);
    const fieldMap=new Map(fromAgent.map(f=>[f.key,f]));
    // Agent definitions win: do not replace its Long/Smart Director controls.
    const combined=base.map(f=>fieldMap.get(f.key)||f);
    for(const f of fromAgent) if(!combined.some(item=>item.key===f.key)) combined.push(f);
    p.fields=combined;
  }

  function setInitialUploadMode() {
    const root=document.getElementById('dynamicFields');
    if (!root) return;
    for(const row of root.querySelectorAll('.image-field')) {
      const mode=row.querySelector('.image-source');
      const uploader=row.querySelector('.image-upload');
      if (mode && uploader) {
        mode.value='upload';
        mode.dispatchEvent(new Event('change',{bubbles:true}));
        uploader.accept='image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';
        uploader.setAttribute('aria-label',(row.querySelector('label')?.textContent||'Bild')+' vom Gerät auswählen');
      }
    }
    for(const control of root.querySelectorAll('[data-key="auto_aspect_ratio"]')) {
      if(control.type==='checkbox') control.checked=true;
    }
    for(const control of root.querySelectorAll('input[type="file"]')) {
      control.addEventListener('change',function(){
        const name=this.files&&this.files[0]?this.files[0].name:'';
        this.title=name;
      });
    }
  }

  function init() {
    if (typeof window.renderFields!=='function' || typeof window.collect!=='function') {
      console.warn('[H3 INPUTS V39] Existing ComfyRemote form API not available.');
      return;
    }
    const nativeRender=window.renderFields;
    const nativeCollect=window.collect;

    window.renderFields=function(){
      const p=activeProfile();
      if (!isSupported(p)) {
        lastSchema='';lastProfile='';
        return nativeRender.apply(this,arguments);
      }
      fillFields(p);
      const newSchema=p.id+'|'+JSON.stringify(p.fields);
      const root=document.getElementById('dynamicFields');
      const button=document.getElementById('renderBtn');
      // The base page calls renderFields() every three seconds. Rebuilding the DOM
      // destroys FileList and textareas. Only rebuild when the profile/schema changed.
      if (newSchema===lastSchema && lastProfile===p.id && root && root.children.length) {
        if(button && button.textContent.trim()==='Rendering starten') {
          const online=typeof state!=='undefined'&&!!state.agent?.online;
          button.disabled=(!online || p.workflow_available===false);
        }
        return;
      }
      lastProfile=p.id;
      lastSchema=newSchema;
      const response=nativeRender.apply(this,arguments);
      setInitialUploadMode();
      return response;
    };

    window.collect=async function(){
      const p=activeProfile();
      if(!isSupported(p)) return nativeCollect.apply(this,arguments);
      const root=document.getElementById('dynamicFields');
      if(root) {
        for(const inp of root.querySelectorAll('input.image-upload')) {
          if (inp.files && inp.files[0] && inp.files[0].size>20*1024*1024)
            throw new Error('Bild zu groß: maximal 20 MB je Bild.');
        }
      }
      const params=await nativeCollect.apply(this,arguments);
      // H3 Short uses width/height, while H3 Long already reads h3_resolution.
      if (!p.long_segments && params.h3_resolution && !params.width && !params.height) {
        const m=/^(\d{3,4})x(\d{3,4})$/.exec(String(params.h3_resolution));
        if(m){params.width=Number(m[1]);params.height=Number(m[2]);}
      }
      if (!params.positive_prompt || !String(params.positive_prompt).trim())
        throw new Error('Bitte einen positiven Prompt eingeben.');
      return params;
    };
    const select=document.getElementById('workflowSelect');
    if(select)select.onchange=function(){
      // The original page assigned onchange=renderFields (a captured function).
      // Replace that handler so a profile switch always uses this guarded renderer.
      window.renderFields();
    };
    window.renderFields();
    console.info('[H3 INPUTS V40] Bild-Uploads fuer I2V, FL2V, H3 Long sowie 3/4 Referenzbilder aktiv.');
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
