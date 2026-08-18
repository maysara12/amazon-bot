package com.zerozeroseven.operations;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;

public class MainActivity extends Activity {
    private WebView webView;
    private View splashView;
    private View offlineView;
    private Button retryButton;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraPhotoUri;
    private boolean fallbackAttempted = false;

    private static final int FILE_CHOOSER_CODE = 1001;
    private static final String APP_VERSION = "1.3.3";
    private static final String PUBLIC_PORTAL_DOMAIN = "007-operations-portal.vercel.app";
    private static final String PUBLIC_PORTAL_ORIGIN = "https://" + PUBLIC_PORTAL_DOMAIN;
    private static final String LIVE_PORTAL_URL = PUBLIC_PORTAL_ORIGIN + "/portal?app=android&v=" + APP_VERSION;
    private static final String SUPABASE_ORIGIN = "https://gektzjagrxqgcbhyeihm.supabase.co";
    private static final String LOCAL_FALLBACK_URL = PUBLIC_PORTAL_ORIGIN + "/assets/www/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        splashView = findViewById(R.id.splashView);
        offlineView = findViewById(R.id.offlineView);
        retryButton = findViewById(R.id.retryButton);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " 007OperationsAndroid/" + APP_VERSION);

        webView.setBackgroundColor(android.graphics.Color.rgb(7, 17, 31));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(PUBLIC_PORTAL_DOMAIN)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        retryButton.setOnClickListener(v -> loadLivePortal());

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
                offlineView.setVisibility(View.GONE);
                if (url.startsWith(PUBLIC_PORTAL_ORIGIN)) {
                    splashView.setAlpha(1f);
                    splashView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url.startsWith(PUBLIC_PORTAL_ORIGIN)) {
                    offlineView.setVisibility(View.GONE);
                    splashView.animate()
                            .alpha(0f)
                            .setDuration(280)
                            .withEndAction(() -> splashView.setVisibility(View.GONE))
                            .start();
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    handleMainFrameFailure(request.getUrl().toString());
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) {
                    handleMainFrameFailure(request.getUrl().toString());
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                if (url.startsWith(PUBLIC_PORTAL_ORIGIN)) {
                    return false;
                }

                if (url.startsWith(SUPABASE_ORIGIN + "/")) {
                    return false;
                }

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
                } catch (Exception ignored) {
                }
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
                cameraPhotoUri = null;

                Intent fileIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                fileIntent.addCategory(Intent.CATEGORY_OPENABLE);
                fileIntent.setType("*/*");
                fileIntent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/heic",
                        "image/heif",
                        "application/pdf"
                });
                fileIntent.putExtra(
                        Intent.EXTRA_ALLOW_MULTIPLE,
                        params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE
                );

                Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                Parcelable[] initialIntents = new Parcelable[0];

                if (cameraIntent.resolveActivity(getPackageManager()) != null) {
                    try {
                        File photoFile = File.createTempFile("007-evidence-", ".jpg", getCacheDir());
                        cameraPhotoUri = FileProvider.getUriForFile(
                                MainActivity.this,
                                getPackageName() + ".fileprovider",
                                photoFile
                        );
                        cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
                        cameraIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        initialIntents = new Parcelable[]{cameraIntent};
                    } catch (Exception ignored) {
                        cameraPhotoUri = null;
                    }
                }

                Intent chooser = Intent.createChooser(fileIntent, "ارفع إثبات الحالة");
                chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, initialIntents);
                startActivityForResult(chooser, FILE_CHOOSER_CODE);
                return true;
            }
        });

        if (savedInstanceState == null) {
            loadLivePortal();
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void loadLivePortal() {
        fallbackAttempted = false;
        offlineView.setVisibility(View.GONE);
        splashView.setAlpha(1f);
        splashView.setVisibility(View.VISIBLE);
        webView.clearCache(true);
        webView.loadUrl(LIVE_PORTAL_URL);
    }

    private void handleMainFrameFailure(String failingUrl) {
        if (!fallbackAttempted && !failingUrl.startsWith(LOCAL_FALLBACK_URL)) {
            fallbackAttempted = true;
            webView.loadUrl(LOCAL_FALLBACK_URL);
            return;
        }
        showOffline();
    }

    private void showOffline() {
        splashView.setVisibility(View.GONE);
        offlineView.setVisibility(View.VISIBLE);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (offlineView.getVisibility() == View.VISIBLE) {
            loadLivePortal();
            return;
        }
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != FILE_CHOOSER_CODE) {
            return;
        }

        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getClipData() != null) {
                ClipData clipData = data.getClipData();
                results = new Uri[clipData.getItemCount()];
                for (int i = 0; i < clipData.getItemCount(); i++) {
                    results[i] = clipData.getItemAt(i).getUri();
                }
            } else if (data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            } else if (cameraPhotoUri != null) {
                results = new Uri[]{cameraPhotoUri};
            }
        }

        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(results);
        }
        filePathCallback = null;
        cameraPhotoUri = null;
    }
}
