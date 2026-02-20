@echo off
chcp 65001 >nul
echo =========================================
echo       اداة الرفع الى Github (Reels Maker)
echo =========================================

set /p commit_msg="ادخل اسم التحديث (مثال: تحديث واجهة المستخدم): "

IF "%commit_msg%"=="" (
    set commit_msg="تحديث جديد للمنصة"
)

echo.
echo جاري تجهيز الملفات...
git add .

echo.
echo جاري حفظ التحديثات...
git commit -m "%commit_msg%"

echo.
echo جاري الرفع الى Github...
echo (تأكد من أنك قمت بربط المستودع الخارجي مسبقاً باستخدام: git remote add origin [URL])
git push origin main

echo.
echo =========================================
echo       [+] تمت عملية الرفع بنجاح!
echo =========================================
pause
