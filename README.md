# Hồ sơ cá nhân

## Cách chỉnh nội dung

Toàn bộ nội dung hồ sơ được lưu trong `src/data/profile.ts`. Hãy chỉnh thông tin tại đó; các mục chưa biết để trống sẽ hiển thị “Chưa điền”. Đặt ảnh đại diện tại `public/images/avatar.jpg`, rồi điền đường dẫn `/images/avatar.jpg` vào trường `photo` trong tệp hồ sơ.

Chạy `npm run dev` để xem trang khi phát triển. Dùng `npm run typecheck` để kiểm tra kiểu và `npm run build` để tạo bản dựng trong thư mục `dist/`.

## Deploy

- Lệnh build: `npm run build`
- Thư mục đầu ra: `dist`
- Phiên bản Node.js: `22.22.0` (được ghim trong `.mise.toml`).

Trang có thể triển khai trực tiếp trên Cloudflare Pages với các thiết lập trên.
