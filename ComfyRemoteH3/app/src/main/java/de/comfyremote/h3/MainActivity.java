package de.comfyremote.h3;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.net.URI;

/** Android Studio wrapper of the ComfyRemote H3 /comfy/ web UI.
 * No embedded token. WebView supports image and video upload. */
public class MainActivity extends Activity {
    private WebView webView;
    private String serverUrl = "https://chillioneer.pythonanywhere.com/comfy/";
    private ValueCallback<Uri[]> uploadCallback;
    private static final int FILE_CHOOSER_REQUEST = 7041;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(12, 16, 26));
        getWindow().setNavigationBarColor(Color.rgb(12, 16, 26));
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(12,16,26));
        TextView top=new TextView(this);
        top.setText("↗  ComfyRemote H3 Online");
        top.setTextColor(Color.rgb(146,235,204));
        top.setTextSize(14);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(22,12,18,12);
        
        root.addView(top,new LinearLayout.LayoutParams(-1,52));
        webView=new WebView(this);
        WebSettings s=webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true); // URI from Android's system document picker
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView,false);
        webView.setBackgroundColor(Color.rgb(12,16,26));
        webView.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                Uri u=request.getUrl();
                if("https".equalsIgnoreCase(u.getScheme()) &&
                   "chillioneer.pythonanywhere.com".equalsIgnoreCase(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW,u)); }
                catch (Exception e){ Toast.makeText(MainActivity.this,"Link nicht geöffnet",Toast.LENGTH_SHORT).show(); }
                return true;
            }
            @Override public void onReceivedError(WebView view,int code,String desc,String failing){
                if (failing.startsWith(serverUrl))Toast.makeText(MainActivity.this,"Online-Server nicht erreichbar.",Toast.LENGTH_LONG).show();
            }
        });
        webView.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params){
                if(uploadCallback!=null)uploadCallback.onReceiveValue(null);
                uploadCallback=callback;
                Intent it=new Intent(Intent.ACTION_GET_CONTENT);
                it.addCategory(Intent.CATEGORY_OPENABLE);
                it.setType("*/*");
                it.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"image/*","video/*"});
                it.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,false);
                try{startActivityForResult(Intent.createChooser(it,"Bild oder Video auswählen"),FILE_CHOOSER_REQUEST);return true;}
                catch(ActivityNotFoundException e){uploadCallback=null;return false;}
            }
        });
        root.addView(webView,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
        webView.loadUrl(serverUrl);
    }

    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=FILE_CHOOSER_REQUEST||uploadCallback==null)return;
        Uri[] results=null;
        if(result==RESULT_OK&&data!=null){
            if(data.getData()!=null)results=new Uri[]{data.getData()};
            else if(data.getClipData()!=null&&data.getClipData().getItemCount()>0)
                results=new Uri[]{data.getClipData().getItemAt(0).getUri()};
        }
        uploadCallback.onReceiveValue(results);uploadCallback=null;
    }
    @Override public void onBackPressed(){
        if(webView!=null&&webView.canGoBack())webView.goBack();else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(uploadCallback!=null){uploadCallback.onReceiveValue(null);uploadCallback=null;}
        if(webView!=null){webView.destroy();webView=null;}
        super.onDestroy();
    }
}
