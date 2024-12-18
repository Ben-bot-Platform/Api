# استفاده از تصویر رسمی Node.js
FROM node:18

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی فایل‌های پکیج و نصب وابستگی‌ها
COPY package*.json ./
RUN npm install

# کپی سایر فایل‌های پروژه
COPY . .

# تنظیم پورت
EXPOSE 8080

# اجرای برنامه
CMD ["npm", "start"]
