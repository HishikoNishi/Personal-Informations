import { stdin, stdout } from "node:process";
import { emitKeypressEvents } from "node:readline";
import { webcrypto } from "node:crypto";
import { inspectPasswordHash, verifyPassword } from "../worker/password.mjs";

function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Hãy chạy lệnh trong terminal tương tác để dữ liệu không bị hiển thị.");
  }

  emitKeypressEvents(stdin);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(prompt);

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(Boolean(wasRaw));
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === "c") return finish(new Error("Đã hủy thao tác."));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") {
        value = Array.from(value).slice(0, -1).join("");
        return;
      }
      if (!key.ctrl && !key.meta && character) value += character;
    };
    stdin.on("keypress", onKeypress);
  });
}

try {
  const password = await readHidden("Mật khẩu cần kiểm tra (không hiển thị): ");
  const passwordHash = (await readHidden("ADMIN_PASSWORD_HASH (không hiển thị): ")).trim();
  const format = inspectPasswordHash(passwordHash);

  if (!format.valid) {
    console.log("NO MATCH");
    console.log(`Hash không hợp lệ: ${format.message}`);
    process.exitCode = 1;
  } else {
    console.log(await verifyPassword(password, passwordHash, webcrypto) ? "MATCH" : "NO MATCH");
  }
} catch {
  console.error("Không thể kiểm tra mật khẩu. Hãy chạy lại trong terminal tương tác.");
  process.exitCode = 1;
}
