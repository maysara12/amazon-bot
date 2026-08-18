package com.zerozeroseven.operations;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
    private WebView webView;
    private View splashView;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_CODE = 1001;

    // Keep the in-app portal on the exact same origin used by the public website.
    // This makes signup / recovery redirect_to URLs valid for both web and Android.
    private static final String PUBLIC_PORTAL_DOMAIN = "007-operations-portal.vercel.app";
    private static final String PUBLIC_PORTAL_ORIGIN = "https://" + PUBLIC_PORTAL_DOMAIN;
    private static final String LOCAL_PORTAL_URL =
            PUBLIC_PORTAL_ORIGIN + "/assets/www/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        splashView = findViewById(R.id.splashView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUserAgentString(settings.getUserAgentString() + " 007OperationsAndroid/1.0.4");

        webView.setBackgroundColor(android.graphics.Color.rgb(7, 17, 31));

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(PUBLIC_PORTAL_DOMAIN)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = assetLoader.shouldInterceptRequest(request.getUrl());
                return response != null ? response : super.shouldInterceptRequest(view, request);
            }

            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                WebResourceResponse response = assetLoader.shouldInterceptRequest(Uri.parse(url));
                return response != null ? response : super.shouldInterceptRequest(view, url);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (splashView.getVisibility() != View.VISIBLE) {
                    splashView.setAlpha(1f);
                    splashView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                splashView.animate()
                        .alpha(0f)
                        .setDuration(350)
                        .withEndAction(() -> splashView.setVisibility(View.GONE))
                        .start();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    splashView.setVisibility(View.GONE);
                    Toast.makeText(
                            MainActivity.this,
                            "تعذر تشغيل بوابة 007. حاول مرة أخرى.",
                            Toast.LENGTH_LONG
                    ).show();
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Local bundled portal assets remain inside the app.
                if (url.startsWith(PUBLIC_PORTAL_ORIGIN + "/assets/")) {
                    return false;
                }

                // Supabase Auth/API calls must remain inside the WebView flow.
                if (url.startsWith("https://gektzjagrxqgcbhyeihm.supabase.co/")) {
                    return false;
                }

                // All normal web links open in the user's browser.
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception ignored) {
                        view.loadUrl(url);
                    }
                    return true;
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {}
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params
            ) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/heic",
                        "image/heif",
                        "application/pdf"
                });
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
                startActivityForResult(intent, FILE_CHOOSER_CODE);
                return true;
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(LOCAL_PORTAL_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_CODE) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(results);
            }
            filePathCallback = null;
        }
    }
}
