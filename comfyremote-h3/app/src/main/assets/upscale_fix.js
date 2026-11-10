/* COMFYREMOTE_UPSCALE_VIDEOUPLOAD_V3 - additive upload fix, no existing functions removed. */
(function () {
  'use strict';
  if (window.__comfyUpscaleVideoV3) return;
  window.__comfyUpscaleVideoV3 = true;

  var fileInput, panel, note, select, dynamic;
  var lastProfileId = '';
  var VIDEO_PATTERN = /\.(mp4|mov|mkv|webm|avi|m4v)$/i;
  var MAX_BYTES = 512 * 1024 * 1024; // H3 agent cap, not server cap.

  function selectedProfile() {
    if (!select) return null;
    var id = select.value;
    try {
      if (typeof profileById === 'function') return profileById(id);
    } catch (_) {}
    try {
      if (typeof state !== 'undefined' && state.profiles)
        return state.profiles.find(function (p) { return p.id === id; });
    } catch (_) {}
    return null;
  }

  function isUpscale() {
    if (!select || !select.value) return false;
    var profile = selectedProfile();
    if (profile) {
      if (profile.video_upscaler === true || profile.input_kind === 'video') return true;
      if ((profile.fields || []).some(function (f) {
        return f.type === 'video' || f.key === 'input_video';
      })) return true;
    }
    var label = select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : '';
    return /upscal|ultrasharp/i.test(select.value + ' ' + label);
  }

  function alreadyHasWorkingVideoField() {
    return !!(dynamic && dynamic.querySelector('.video-field .video-upload'));
  }

  function hideLegacyVideoTextField() {
    if (!dynamic) return;
    dynamic.querySelectorAll('input[data-key="input_video"]').forEach(function (el) {
      if (el.type === 'file') return;
      el.required = false;
      el.disabled = true;
      var parent = el.closest('.field');
      if (parent) parent.style.display = 'none';
    });
  }

  function updatePanel() {
    if (!panel || !select) return;
    var upscale = isUpscale();
    var nativeVideo = upscale && alreadyHasWorkingVideoField();
    panel.style.display = upscale && !nativeVideo ? 'block' : 'none';
    fileInput.required = upscale && !nativeVideo;
    if (upscale) hideLegacyVideoTextField();
    if (!upscale && lastProfileId !== select.value) {
      fileInput.value = '';
      note.textContent = '';
    }
    lastProfileId = select.value;
  }

  async function uploadVideo(file) {
    if (!file) throw new Error('Bitte ein Quellvideo auswählen.');
    if (!VIDEO_PATTERN.test(file.name))
      throw new Error('Unterstützt werden MP4, MOV, MKV, WEBM, AVI und M4V.');
    if (!file.size) throw new Error('Das Quellvideo ist leer.');
    if (file.size > MAX_BYTES) throw new Error('Das Quellvideo überschreitet 512 MB.');
    if (typeof api !== 'function' || typeof state === 'undefined')
      throw new Error('ComfyRemote-Serververbindung nicht initialisiert.');

    // The existing server has chunked uploads at /api/uploads/{id}/chunk.
    var init = await api('/api/uploads/init', {
      method: 'POST', body: JSON.stringify({filename: file.name, size: file.size})
    });
    var uploadId = init.upload_id;
    if (!uploadId) throw new Error('Keine Upload-ID vom Server erhalten.');
    var chunkSize = Math.max(256 * 1024, Math.min(Number(init.chunk_size) || 5 * 1024 * 1024, 8 * 1024 * 1024));
    for (var offset = 0; offset < file.size; offset += chunkSize) {
      var end = Math.min(file.size, offset + chunkSize);
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 180000);
      var response;
      try {
        response = await fetch(state.server.replace(/\/$/, '') + '/api/uploads/' + encodeURIComponent(uploadId) + '/chunk?offset=' + offset, {
          method: 'POST',
          headers: {'X-App-Token': state.token, 'Content-Type': 'application/octet-stream', 'Accept': 'application/json'},
          body: file.slice(offset, end),
          signal: controller.signal,
          cache: 'no-store'
        });
      } finally {
        clearTimeout(timer);
      }
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.error || ('Video-Upload: HTTP ' + response.status));
      var pct = Math.round(end / file.size * 100);
      note.textContent = 'Übertragung: ' + pct + ' %';
      if (typeof showMessage === 'function') showMessage('Video-Upload: ' + pct + ' %', 'info');
    }
    var done = await api('/api/uploads/' + encodeURIComponent(uploadId) + '/complete', {
      method: 'POST', body: '{}'
    });
    note.textContent = 'Video vollständig hochgeladen: ' + file.name;
    return {upload_id: done.upload_id || uploadId, filename: done.filename || file.name};
  }

  function init() {
    select = document.getElementById('workflowSelect');
    dynamic = document.getElementById('dynamicFields');
    var form = document.getElementById('workflowForm');
    var renderButton = document.getElementById('renderBtn');
    if (!select || !dynamic || !form || !renderButton) return;

    panel = document.createElement('div');
    panel.id = 'comfyUpscalerVideoV3';
    panel.className = 'field';
    panel.style.cssText = 'display:none;margin:14px 0 16px;';
    var label = document.createElement('label');
    label.htmlFor = 'comfyUpscaleFileV3';
    label.textContent = 'Quellvideo für Upscaler hochladen';
    fileInput = document.createElement('input');
    fileInput.id = 'comfyUpscaleFileV3';
    fileInput.type = 'file';
    fileInput.accept = '.mp4,.mov,.mkv,.webm,.avi,.m4v,video/*';
    fileInput.style.cssText = 'display:block;width:100%;max-width:100%;margin:8px 0;';
    var help = document.createElement('div');
    help.className = 'hint';
    help.textContent = 'Video auf dem Android-Gerät auswählen (MP4, MOV, MKV, WEBM, AVI, M4V; bis 512 MB). Kein Prompt erforderlich. Das Video wird beim Start hochgeladen.';
    note = document.createElement('div');
    note.className = 'hint';
    note.style.marginTop = '6px';
    fileInput.addEventListener('change', function () {
      note.textContent = fileInput.files && fileInput.files[0] ? 'Ausgewählt: ' + fileInput.files[0].name : '';
    });
    panel.appendChild(label);
    panel.appendChild(fileInput);
    panel.appendChild(help);
    panel.appendChild(note);
    form.insertBefore(panel, renderButton); // outside dynamicFields: survives 3-sec status rerender.

    if (typeof window.collect === 'function') {
      var oldCollect = window.collect;
      window.collect = async function () {
        // Preserve existing full video UI when the server is already updated.
        if (!isUpscale() || alreadyHasWorkingVideoField()) return oldCollect.apply(this, arguments);
        if (!fileInput.files || !fileInput.files[0]) throw new Error('Bitte ein Quellvideo auswählen.');
        var params = await oldCollect.apply(this, arguments);
        params.input_video = await uploadVideo(fileInput.files[0]);
        delete params.undefined;
        return params;
      };
    }

    select.addEventListener('change', updatePanel);
    new MutationObserver(updatePanel).observe(dynamic, {childList: true});
    new MutationObserver(updatePanel).observe(select, {childList: true});
    updatePanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
