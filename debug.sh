#!/bin/bash

# رنگ‌ها برای خروجی بهتر
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== شروع عیب‌یابی و تنظیم پروژه Next.js ===${NC}\n"

# تنظیم متغیرها
APP_DIR="/home/cp63896235438/qanaaryWebApp"
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

# 1. بررسی و نمایش اطلاعات سیستم
echo -e "${BLUE}>> بررسی محیط...${NC}"
echo "Node.js نسخه: $NODE_VERSION"
echo "NPM نسخه: $NPM_VERSION"
echo "مسیر پروژه: $APP_DIR"
echo ""

# 2. پاکسازی فایل‌های قبلی
echo -e "${BLUE}>> پاکسازی نصب قبلی...${NC}"
cd $APP_DIR
rm -rf .next node_modules package-lock.json
echo -e "${GREEN}✓ پاکسازی انجام شد${NC}\n"

# 3. تنظیم مجوزها
echo -e "${BLUE}>> تنظیم مجوزهای پوشه‌ها...${NC}"
mkdir -p .next/static/chunks .next/static/css .next/static/m3qdY8bIC6OveW2NtycZv public
chown -R cp63896235438:cp63896235438 .
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 server.js
echo -e "${GREEN}✓ مجوزها تنظیم شدند${NC}\n"

# 4. نصب وابستگی‌های ضروری
echo -e "${BLUE}>> نصب پکیج‌های ضروری...${NC}"
npm install --no-save next@13.5.9 react@18.2.0 react-dom@18.2.0
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ پکیج‌ها با موفقیت نصب شدند${NC}"
else
    echo -e "${RED}× خطا در نصب پکیج‌ها${NC}"
    echo "لاگ خطا:"
    cat npm-debug.log 2>/dev/null || echo "لاگ npm موجود نیست"
fi
echo ""

# 5. بررسی فایل‌های ضروری
echo -e "${BLUE}>> بررسی فایل‌های ضروری...${NC}"
FILES=(".next" "public" "package.json" "next.config.js" "server.js")
for file in "${FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "${GREEN}✓ $file موجود است${NC}"
    else
        echo -e "${RED}× $file پیدا نشد${NC}"
    fi
done
echo ""

# 6. نمایش وضعیت حافظه
echo -e "${BLUE}>> اطلاعات حافظه...${NC}"
free -m
echo ""

# 7. بررسی لاگ‌های خطا
echo -e "${BLUE}>> آخرین خطاهای ثبت شده...${NC}"
if [ -f "error.log" ]; then
    tail -n 20 error.log
else
    echo "فایل error.log پیدا نشد"
fi

# 8. نمایش راهنما
echo -e "\n${BLUE}=== مراحل بعدی ===${NC}"
echo "1. اگر همه موارد سبز است:"
echo "   - به بخش Setup Node.js App در cPanel بروید"
echo "   - Application root را روی $APP_DIR تنظیم کنید"
echo "   - Application startup file را روی server.js تنظیم کنید"
echo "   - روی Start Application کلیک کنید"
echo ""
echo "2. اگر خطایی مشاهده کردید:"
echo "   - خروجی این اسکریپت را کپی کنید"
echo "   - محتوای error.log را هم کپی کنید"
echo "   - هر دو را برای بررسی ارسال کنید"

# پایان
echo -e "\n${BLUE}=== پایان عیب‌یابی ===${NC}"