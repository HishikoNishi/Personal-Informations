import { describe, expect, it } from "vitest";
import { filterPublic } from "../worker/public-filter";

describe("public content filter", () => {
  it("removes private sections, items, and individual fields before serialization", () => {
    const filtered = filterPublic({
      hero: { visibility: "public", fields: {
        nickname: { visibility: "public", value: { vi: "Tên công khai" } },
        location: { visibility: "private", value: { vi: "Địa chỉ riêng tư" } },
      } },
      health: { visibility: "private", items: [{ id: "health-1", visibility: "private", fields: { label: { visibility: "public", value: { vi: "Ghi chú" } } } }] },
      overview: { visibility: "public", items: [
        { id: "overview-1", visibility: "public", fields: { label: { visibility: "public", value: { vi: "Biệt danh" } }, value: { visibility: "public", value: { vi: "Bảo" } } } },
        { id: "overview-2", visibility: "private", fields: { value: { visibility: "public", value: { vi: "Ẩn hoàn toàn" } } } },
      ] },
    });
    const serialized = JSON.stringify(filtered);
    expect(serialized).toContain("Tên công khai");
    expect(serialized).toContain("Bảo");
    expect(serialized).not.toContain("Địa chỉ riêng tư");
    expect(serialized).not.toContain("health");
    expect(serialized).not.toContain("Ẩn hoàn toàn");
    expect(serialized).not.toContain("visibility");
  });

  it("filters private projects and images too", () => {
    const filtered = filterPublic([
      { id: "project-public", visibility: "public", fields: { name: { visibility: "public", value: { vi: "Công khai" } } } },
      { id: "project-private", visibility: "private", fields: { name: { visibility: "public", value: { vi: "Bí mật" } } } },
    ]);
    expect(JSON.stringify(filtered)).toContain("Công khai");
    expect(JSON.stringify(filtered)).not.toContain("Bí mật");
  });
});
