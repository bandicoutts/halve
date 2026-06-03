package today.halve.halve

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != "android.intent.action.MY_PACKAGE_REPLACED"
        ) return

        val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean("flutter.halve:reminder", false)
        if (!enabled) return

        val hour = prefs.getInt("flutter.halve:reminder_hour", 8)
        val ampm = prefs.getString("flutter.halve:reminder_ampm", "am") ?: "am"
        val triggerMs = nextOccurrenceMs(toHour24(hour, ampm))

        val pi = PendingIntent.getBroadcast(
            context,
            0,
            Intent(context, HalveNotificationReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // Exact alarms require the SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM permission. On
        // API 31+ we check canScheduleExactAlarms() before calling setExactAndAllowWhileIdle
        // to avoid a SecurityException, mirroring the try/catch fallback in
        // NotificationService.scheduleDaily().
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
        if (canExact) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMs, pi)
        } else {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMs, pi)
        }
    }

    private fun toHour24(hour: Int, ampm: String): Int = when {
        ampm != "pm" && hour == 12 -> 0       // 12 AM → midnight
        ampm == "pm" && hour != 12 -> hour + 12 // 1–11 PM → 13–23
        else -> hour                            // 1–11 AM → 1–11; 12 PM → 12
    }

    private fun nextOccurrenceMs(hour24: Int): Long {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour24)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        if (cal.timeInMillis <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        return cal.timeInMillis
    }
}
