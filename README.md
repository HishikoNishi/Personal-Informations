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

### Cách đăng nhập và cấu hình cục bộ

1. Sao chép `.dev.vars.example` thành `.dev.vars`.
2. Chạy `node scripts/hash-password.mjs` trong terminal tương tác. Nhập mật khẩu tại lời nhắc ẩn; lệnh in hash PBKDF2 và session secret ngẫu nhiên, không in mật khẩu.
3. Trong `.dev.vars`, đặt `ADMIN_USERNAME` thành username bạn muốn dùng. Thêm `ADMIN_PASSWORD_HASH` và `SESSION_SECRET` từ kết quả script. Cả ba phải có giá trị không rỗng.
4. Khởi động lại `npm run worker:dev` sau khi đổi `.dev.vars`.
5. Mở trang cục bộ, mở Developer Tools → Console, rồi gọi hàm đăng nhập với username và mật khẩu tương ứng:

   ```js
   await window.profileLogin("YOUR_USERNAME", "YOUR_PASSWORD")
   ```

   Thay hai giá trị mẫu bằng thông tin đăng nhập của bạn. Worker so sánh username với `ADMIN_USERNAME` và kiểm tra mật khẩu với `ADMIN_PASSWORD_HASH`. Không lưu hoặc chia sẻ dòng lệnh có mật khẩu.

Không có hộp thoại đăng nhập trên trang; `window.profileLogin(username, password)` gửi POST JSON đến `/api/auth/login`. Thiếu/rỗng biến hoặc hash/secret sai định dạng sẽ trả HTTP 503 với `Chưa cấu hình đăng nhập`. Sai thông tin đăng nhập trả HTTP 401. Sau năm lần sai trong 15 phút từ cùng địa chỉ IP, Worker trả HTTP 429 cùng thông báo giới hạn riêng.

`ADMIN_PASSWORD_HASH` hiện có dạng `pbkdf2$sha256-chain4$100000$<salt-base64url>$<digest-base64url>`. Cloudflare Workers giới hạn mỗi phép PBKDF2 ở 100.000 vòng, vì vậy Worker thực hiện bốn lượt PBKDF2-SHA256 nối tiếp, mỗi lượt 100.000 vòng, với salt riêng theo từng lượt. Hash có salt ngẫu nhiên 16 byte và digest 32 byte; kết quả được so sánh bằng phép so sánh thời gian hằng. Hash cũ dạng `pbkdf2$sha256$310000$...` không chạy được trên Cloudflare và cần được tạo lại bằng script hiện tại. `SESSION_SECRET` là chuỗi Base64URL ngẫu nhiên; cần ít nhất 32 byte sau giải mã.

### Kiểm tra lỗi đăng nhập

Nếu `/api/auth/login` vẫn trả 401, chạy `node scripts/verify-password.mjs` từ thư mục dự án trong terminal tương tác. Nhập mật khẩu gốc và đúng giá trị của `ADMIN_PASSWORD_HASH` khi được nhắc; cả hai trường đều không hiển thị khi gõ. Với Cloudflare, nhập riêng phần giá trị bắt đầu bằng `pbkdf2$...`, không nhập tên biến hoặc tiền tố `ADMIN_PASSWORD_HASH=`. Script dùng chung hàm PBKDF2 với Worker và chỉ in `MATCH` hoặc `NO MATCH`; hash sai tiền tố/thuật toán, sai số phần, Base64URL lỗi hoặc tham số không hợp lệ sẽ in `NO MATCH` kèm lý do định dạng. Không truyền mật khẩu/hash qua đối số lệnh, không chụp màn hình và không chia sẻ chúng.

`MATCH` xác nhận mật khẩu đó khớp với hash đã nhập tại máy này; nó không xác nhận Cloudflare đã lưu cùng hash, username đúng, hoặc Worker production đã triển khai đúng cấu hình. Hash cũ có 310.000 vòng/lượt phải được tạo lại bằng `node scripts/hash-password.mjs`, rồi cập nhật đúng giá trị hash mới trong Secret `ADMIN_PASSWORD_HASH` và triển khai Worker.

`.dev.vars` và dữ liệu Wrangler cục bộ đã được Git bỏ qua. Không chia sẻ hoặc commit chúng. Đăng nhập dùng cookie HttpOnly/Secure/SameSite=Strict và mọi thao tác ghi yêu cầu CSRF header cùng Origin phù hợp.

## Cloudflare Workers Builds (triển khai production)

Các lệnh trong phần này chỉ để bạn chạy khi sẵn sàng triển khai. Chúng chưa được chạy trong quá trình phát triển này.

1. Trong thư mục dự án, tạo D1 production:

   ```sh
   npx wrangler d1 create personal-informations
   ```

   Sao chép `database_id` UUID Wrangler trả về vào `d1_databases[0].database_id` trong `wrangler.jsonc`, thay `REPLACE_WITH_D1_DATABASE_ID`. Giữ `binding` là `DB` và tên database là `personal-informations`.

2. Tạo hash và session secret production tại máy cá nhân bằng `node scripts/hash-password.mjs`. Trên Cloudflare Dashboard, mở **Workers & Pages → personal-informations → Settings → Variables and Secrets**. Tạo đủ ba biến runtime sau:

   - `ADMIN_USERNAME`: **Variable** (text), username bạn sẽ nhập qua `window.profileLogin()`.
   - `ADMIN_PASSWORD_HASH`: **Secret**, hash PBKDF2 do script tạo.
   - `SESSION_SECRET`: **Secret**, secret ngẫu nhiên do script tạo.

   Khi nhập trên Dashboard, điền tên vào ô **Variable name** và chỉ điền giá trị vào ô **Value**. Ví dụ, với dòng script in `ADMIN_PASSWORD_HASH=pbkdf2$sha256-chain4$100000$...`, tên là `ADMIN_PASSWORD_HASH`, còn giá trị bắt đầu từ `pbkdf2$sha256-chain4$100000$...`; không dán cả phần `ADMIN_PASSWORD_HASH=` vào ô Value và không thêm dấu ngoặc kép. Làm tương tự với `SESSION_SECRET`. Mật khẩu gốc không phải giá trị của Secret này.

   Cả ba giá trị phải được đặt cho môi trường production của Worker. Nếu dùng Preview deployments, hãy tắt preview hoặc cấu hình username/hash/session riêng và D1 cô lập cho preview; không dùng secrets production trong preview. Không đưa mật khẩu gốc, hash hoặc session secret vào mã nguồn, biến build, log hay chat.

3. Kết nối repository tại **Workers & Pages → personal-informations → Settings → Build**. Đặt **Build command** là:

   ```sh
   npm run build
   ```

   Đặt **Deploy command** là chính xác:

   ```sh
   npx wrangler d1 migrations apply DB --remote && npx wrangler deploy
   ```

   Giữ root directory ở thư mục chứa `wrangler.jsonc` nếu đây không phải monorepo. Workers Builds đọc phiên bản Wrangler đã khai báo trong `package.json`.

4. Chạy build production đầu tiên và xem log để xác nhận migration cùng Worker đã được triển khai. Mở Developer Tools → Console trên trang production và đăng nhập bằng `await window.profileLogin("YOUR_USERNAME", "YOUR_PASSWORD")`. Không cần R2, biến build hay công cụ thiết kế ngoài dự án.

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
