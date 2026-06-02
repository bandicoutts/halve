package today.halve.halve

import android.os.Build
import android.os.Bundle
import android.widget.Toast
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    private var lastBackPressMs = 0L
    private var myBackCallback: OnBackInvokedCallback? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register before super.onCreate so Flutter's callback (registered in onResume)
        // has higher LIFO priority and fires first. On Android 14+ with predictive back,
        // Flutter unregisters its callback when nothing can be popped; ours then becomes
        // the active callback and implements the double-tap-to-exit guard.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            myBackCallback = OnBackInvokedCallback {
                val now = System.currentTimeMillis()
                if (now - lastBackPressMs < 2_000L) {
                    lastBackPressMs = 0L
                    finish()
                } else {
                    lastBackPressMs = now
                    Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show()
                }
            }
            window.onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                myBackCallback!!,
            )
        }
        super.onCreate(savedInstanceState)
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            myBackCallback?.let {
                window.onBackInvokedDispatcher.unregisterOnBackInvokedCallback(it)
            }
        }
        super.onDestroy()
    }
}
