package de.comfyremote.h3;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
public class MainActivity extends Activity {
  private WebView web;
  private ValueCallback<Uri[]> upload;
  private static final int PICK=7041;
  private static final String SERVER="https://chillioneer.pythonanywhere.com";
  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().setStatusBarColor(Color.rgb(12,16,26));
    getWindow().setNavigationBarColor(Color.rgb(12,16,26));
    LinearLayout layout=new LinearLayout(this);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.setBackgroundColor(Color.rgb(12,16,26));
    TextView title=new TextView(this);
    title.setText("ComfyRemote H3 Online");
    title.setTextColor(Color.rgb(146,235,204));
    title.setTextSize(17);
    title.setPadding(20,18,20,18);
    layout.addView(title);
    web=new WebView(this);
    WebSettings settings=web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowContentAccess(true);
    settings.setAllowFileAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    CookieManager.getInstance().setAcceptCookie(true);
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req) {
        Uri u=req.getUrl();
        if ("https".equalsIgnoreCase(u.getScheme()) && "chillioneer.pythonanywhere.com".equalsIgnoreCase(u.getHost())) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW,u)); } catch(Exception e) { Toast.makeText(MainActivity.this,"Link konnte nicht geöffnet werden",Toast.LENGTH_SHORT).show(); }
        return true;
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params) {
        if(upload!=null) upload.onReceiveValue(null);
        upload=callback;
        Intent pick=new Intent(Intent.ACTION_GET_CONTENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType("*/*");
        pick.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"image/*","video/*"});
        try { startActivityForResult(Intent.createChooser(pick,"Datei auswählen"),PICK); return true; }
        catch(Exception e) { upload=null; return false; }
      }
    });
    layout.addView(web,new LinearLayout.LayoutParams(-1,0,1));
    setContentView(layout);
    web.loadUrl(SERVER);
  }
  @Override protected void onActivityResult(int req,int result,Intent data) {
    super.onActivityResult(req,result,data);
    if(req!=PICK||upload==null) return;
    Uri[] files=null;
    if(result==RESULT_OK&&data!=null) {
      if(data.getData()!=null) files=new Uri[]{data.getData()};
      else if(data.getClipData()!=null&&data.getClipData().getItemCount()>0) files=new Uri[]{data.getClipData().getItemAt(0).getUri()};
    }
    upload.onReceiveValue(files); upload=null;
  }
  @Override public void onBackPressed() { if(web!=null&&web.canGoBack()) web.goBack(); else super.onBackPressed(); }
  @Override protected void onDestroy() { if(upload!=null)upload.onReceiveValue(null); if(web!=null)web.destroy(); super.onDestroy(); }
}