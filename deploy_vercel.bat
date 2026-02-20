@echo off
chcp 65001 >nul
echo =========================================
echo       اداة النشر على Vercel (Reels Maker)
echo =========================================
echo ملاحظة: يجب ان تكون مسجلا الدخول في Vercel CLI (vercel login)
echo.

set /p deploy_type="اختر نوع النشر: (1) معاينة تجريبية [Preview] أو (2) نشر نهائي للجمهور [Production]؟ (1/2): "

echo.
IF "%deploy_type%"=="2" (
    echo جاري النشر النهائي على Vercel (Production)...
    npx vercel --prod
) ELSE (
    echo جاري نشر نسخة تجريبية للمعاينة (Preview)...
    npx vercel
)

echo.
echo =========================================
echo       [+] انتهت عملية النشر!
echo =========================================
pause
