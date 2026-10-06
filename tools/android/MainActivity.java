package ru.xenoroi.game;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

// Полноэкранный режим: прячем строку состояния и навигацию (появляются по свайпу от края),
// экран не гаснет во время игры.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
        clearCacheAfterUpdate();
    }

    // После обновления APK чистим кэш встроенного браузера, чтобы загрузилась новая версия игры.
    private void clearCacheAfterUpdate() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            String ver = String.valueOf(info.versionCode);
            SharedPreferences prefs = getSharedPreferences("xenoroi", MODE_PRIVATE);
            if (ver.equals(prefs.getString("webCacheVer", ""))) return;
            WebView wv = getBridge().getWebView();
            wv.clearCache(true);
            prefs.edit().putString("webCacheVer", ver).apply();
            wv.reload();
        } catch (Exception e) {
            // не вышло — игра просто запустится как обычно
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
