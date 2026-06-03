package today.halve.halve

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

// Receives the one-shot alarm set by BootReceiver after a device reboot or package
// replacement. Posts the daily reminder using the same channel and notification ID
// (1) as flutter_local_notifications so the tray entry is indistinguishable from
// a Dart-scheduled one. Does NOT self-reschedule — once the user opens the app,
// NotificationService.rescheduleOnLaunch() restores the flutter_local_notifications
// alarm chain, which then owns subsequent firings.
class HalveNotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH,
            )
            context.getSystemService(NotificationManager::class.java)
                ?.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager
            .getLaunchIntentForPackage(context.packageName)
            ?.apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP }

        val tapPi = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Halve")
            .setContentText("Today's Halve puzzle is ready.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(tapPi)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }

    companion object {
        private const val CHANNEL_ID = "daily_puzzle"
        private const val CHANNEL_NAME = "Daily puzzle"
        private const val NOTIFICATION_ID = 1
    }
}
