# Hồ sơ cá nhân

Trang hồ sơ cá nhân bằng tiếng Việt, có giao diện tiếng Anh, chín mục nội dung và chế độ sáng/tối. Người xem chỉ nhận dữ liệu công khai; chủ sở hữu đăng nhập để chỉnh sửa nội dung lưu trong Cloudflare D1.

## Phát triển cục bộ

Yêu cầu Node.js 20.19+ hoặc 22.12+ (phù hợp với Vite hiện tại).

```sh
npm install
npm run build
npm run db:migrate:local
npm run worker:dev
```

Wrangler chạy Worker cùng D1 cục bộ và phục vụ ứng dụng từ `dist/`. Worker tự tạo nội dung ban đầu từ `src/data/profile.ts` khi cơ sở dữ liệu chưa có dữ liệu. Để xem giao diện tĩnh với dữ liệu dự phòng, có thể chạy `npm run dev`.

### Tạo thông tin đăng nhập cục bộ

1. Sao chép `.dev.vars.example` thành `.dev.vars`.
2. Chạy `node scripts/hash-password.mjs` trong terminal tương tác. Nhập mật khẩu tại lời nhắc ẩn; lệnh in hash PBKDF2 và session secret ngẫu nhiên, không in mật khẩu.
3. Điền hai giá trị được tạo vào `.dev.vars` dưới các tên `ADMIN_PASSWORD_HASH` và `SESSION_SECRET`.
4. Khởi động lại `npm run worker:dev` sau khi đổi `.dev.vars`.

`.dev.vars` và dữ liệu Wrangler cục bộ đã được Git bỏ qua. Không chia sẻ hoặc commit chúng. Đăng nhập dùng cookie HttpOnly/Secure/SameSite=Strict, khóa sau năm lần sai trong 15 phút và yêu cầu CSRF header cùng Origin phù hợp cho mọi thao tác ghi.

## Cloudflare Workers Builds (triển khai production)

Các lệnh trong phần này chỉ để bạn chạy khi sẵn sàng triển khai. Chúng chưa được chạy trong quá trình phát triển này.

1. Trong thư mục dự án, tạo D1 production:

   ```sh
   npx wrangler d1 create personal-informations
   ```

   Sao chép `database_id` UUID Wrangler trả về vào `d1_databases[0].database_id` trong `wrangler.jsonc`, thay `REPLACE_WITH_D1_DATABASE_ID`. Giữ `binding` là `DB` và tên database là `personal-informations`.

2. Tạo thông tin đăng nhập production tại máy cá nhân bằng `node scripts/hash-password.mjs`. Trên Cloudflare Dashboard, mở **Workers & Pages → personal-informations → Settings → Variables and Secrets**. Thêm hai biến runtime dạng **Secret**:

   - `ADMIN_PASSWORD_HASH`: hash PBKDF2 do script tạo.
   - `SESSION_SECRET`: secret ngẫu nhiên do script tạo.

   Không đưa mật khẩu gốc, hash hoặc session secret vào mã nguồn, biến build, log hay chat.

3. Kết nối repository tại **Workers & Pages → personal-informations → Settings → Build**. Đặt **Build command** là:

   ```sh
   npm run build
   ```

   Đặt **Deploy command** là chính xác:

   ```sh
   npx wrangler d1 migrations apply DB --remote && npx wrangler deploy
   ```

   Giữ root directory ở thư mục chứa `wrangler.jsonc` nếu đây không phải monorepo. Workers Builds đọc phiên bản Wrangler đã khai báo trong `package.json`.

4. Chạy build production đầu tiên và xem log để xác nhận migration cùng Worker đã được triển khai. Sau đó kiểm tra trang công khai và đăng nhập chủ sở hữu. Không cần R2, biến build hay công cụ thiết kế ngoài dự án.

## Sao lưu, phục hồi và rollback

- Khi đã đăng nhập, dùng **Xuất JSON** thường xuyên và lưu tệp ở nơi riêng tư. Bản sao lưu chứa cả nội dung riêng tư và ảnh, vì vậy hãy bảo vệ tệp như dữ liệu cá nhân.
- Phục hồi: đăng nhập, chọn **Nhập JSON**, kiểm tra số dự án/ảnh trong bản xem trước, xác nhận thay thế, rồi xác nhận thông báo nhập thành công. Worker kiểm tra cấu trúc, kích thước, URL và magic bytes của ảnh trước khi thay dữ liệu.
- Nếu cần hoàn nguyên mã Worker, chạy trong thư mục dự án:

  ```sh
  npx wrangler rollback
  ```

  Wrangler sẽ chọn phiên bản triển khai trước đó và yêu cầu xác nhận trong terminal tương tác. Có thể chọn phiên bản cụ thể bằng `npx wrangler rollback <VERSION_ID>`. Rollback chỉ khôi phục mã Worker; nó không hoàn tác thay đổi dữ liệu hoặc migration D1. Dùng bản sao lưu JSON để phục hồi nội dung. Trước migration có thay đổi dữ liệu, xuất bản sao lưu và kiểm tra tính tương thích với phiên bản Worker cần khôi phục.

## Lệnh kiểm tra

```sh
npx tsc --noEmit
npm test
npm run build
```
