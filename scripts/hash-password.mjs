import { stdin, stdout } from "node:process";
import { emitKeypressEvents } from "node:readline";
import { randomBytes, webcrypto } from "node:crypto";

function readHiddenPassword() {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this script in an interactive terminal so the password can stay hidden.");
  }
  emitKeypressEvents(stdin);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write("Mật khẩu (không hiển thị khi nhập): ");
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(Boolean(wasRaw));
      stdout.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === "c") return finish(new Error("Đã hủy."));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") { value = Array.from(value).slice(0, -1).join(""); return; }
      if (!key.ctrl && !key.meta && character) value += character;
    };
    stdin.on("keypress", onKeypress);
  });
}

try {
  const password = await readHiddenPassword();
  if (password.length < 12 || password.length > 1024) throw new Error("Mật khẩu cần dài từ 12 đến 1024 ký tự.");
  const salt = randomBytes(16);
  const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(await webcrypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 310_000 }, key, 256));
  const encode = (bytes) => Buffer.from(bytes).toString("base64url");
  const passwordHash = `pbkdf2$sha256$310000$${encode(salt)}$${encode(hash)}`;
  const sessionSecret = randomBytes(32).toString("base64url");
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Không thể tạo thông tin xác thực.");
  process.exitCode = 1;
}
