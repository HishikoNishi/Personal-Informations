# Hồ sơ cá nhân

## Cách chỉnh nội dung

Toàn bộ nội dung hồ sơ được lưu trong `src/data/profile.ts`. Hãy chỉnh thông tin tại đó; các mục chưa biết để trống sẽ hiển thị “Chưa điền”. Đặt ảnh đại diện tại `public/images/avatar.jpg`, rồi điền đường dẫn `/images/avatar.jpg` vào trường `photo` trong tệp hồ sơ.

Chạy `npm run dev` để xem giao diện độc lập. Dùng `npm run typecheck`, `npm test` và `npm run build` để kiểm tra mã và tạo bản dựng trong `dist/`.

## Cloudflare Worker cục bộ

- Tạo bản dựng giao diện: `npm run build`.
- Áp dụng migration vào D1 cục bộ: `npm run db:migrate:local`.
- Chạy Worker cùng D1 cục bộ: `npm run worker:dev`.
- Wrangler phục vụ SPA từ `dist/` và chuyển `/api/*` đến Worker.

Worker tự seed D1 cục bộ từ dữ liệu hiện có trong `src/data/profile.ts` khi database trống. Phần hướng dẫn triển khai Worker sẽ được hoàn thiện cùng cấu hình Workers Builds.
