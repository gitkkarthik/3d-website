import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/razorpay";
import { sniff } from "@/lib/files";
import { isSameOrigin } from "@/lib/security";
import { videoEmbed } from "@/lib/memories";

describe("razorpay signatures", () => {
  const secret = "test_secret";
  it("accepts a valid checkout signature and rejects tampering", () => {
    const sig = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyCheckoutSignature("order_1", "pay_1", sig, secret)).toBe(true);
    expect(verifyCheckoutSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyCheckoutSignature("order_1", "pay_1", sig, "other")).toBe(false);
    expect(verifyCheckoutSignature("order_1", "pay_1", "short", secret)).toBe(false);
  });
  it("verifies webhook bodies byte-for-byte", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
  });
});

describe("file sniffing ignores names and declared types", () => {
  it("detects real formats", () => {
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime).toBe("image/jpeg");
    expect(sniff(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(sniff(Buffer.from("RIFF0000WEBPVP8 ", "latin1"))?.mime).toBe("image/webp");
    expect(sniff(Buffer.from("\0\0\0\x18ftypisom", "latin1"))?.family).toBe("video");
    expect(sniff(Buffer.from("\0\0\0\x18ftypheic", "latin1"))?.mime).toBe("image/heic");
    expect(sniff(Buffer.from("ID3\x03", "latin1"))?.family).toBe("audio");
  });
  it("rejects everything else", () => {
    expect(sniff(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniff(Buffer.from("%PDF-1.7"))).toBeNull();
    expect(sniff(Buffer.from("MZ\x90\x00", "latin1"))).toBeNull();
    expect(sniff(Buffer.from("<html><script>alert(1)</script>"))).toBeNull();
  });
});

describe("same-origin guard", () => {
  const req = (origin: string | null, host = "pawsome.in") => new Request("https://pawsome.in/api/x", { method: "POST", headers: { host, ...(origin ? { origin } : {}) } });
  it("allows our origin only", () => {
    expect(isSameOrigin(req("https://pawsome.in"))).toBe(true);
    expect(isSameOrigin(req("https://evil.example"))).toBe(false);
    expect(isSameOrigin(req(null))).toBe(false);
  });
});

describe("video embeds", () => {
  it("only embeds YouTube/Vimeo over https, privacy-enhanced", () => {
    expect(videoEmbed("https://youtu.be/abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(videoEmbed("https://www.youtube.com/watch?v=xyz")).toBe("https://www.youtube-nocookie.com/embed/xyz");
    expect(videoEmbed("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345?dnt=1");
    expect(videoEmbed("http://youtu.be/abc")).toBeNull();
    expect(videoEmbed("https://evil.example/embed")).toBeNull();
    expect(videoEmbed("javascript:alert(1)")).toBeNull();
  });
});
