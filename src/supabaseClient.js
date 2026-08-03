import { createClient } from '@supabase/supabase-js'

// هذه القيم تُقرأ من ملف .env (لا تكتبيها هنا مباشرة)
// انظري دليل النشر في README.md لمعرفة كيفية الحصول عليها من Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'تنبيه: لم يتم ضبط بيانات الاتصال بـ Supabase. تحققي من ملف .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
