import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../src/modules/auth/auth.validation.js";

test("register schema normalizes email and username", () => {
  const result = registerSchema.parse({
    email: "Person@Example.com",
    username: "Some_User",
    password: "long-password-123",
    displayName: "Person"
  });
  assert.equal(result.email, "person@example.com");
  assert.equal(result.username, "some_user");
});

test("register schema rejects weak passwords", () => {
  assert.equal(registerSchema.safeParse({
    email: "person@example.com",
    username: "person",
    password: "short",
    displayName: "Person"
  }).success, false);
});

test("login requires identifier and password", () => {
  assert.equal(loginSchema.safeParse({ identifier: "person", password: "x" }).success, true);
  assert.equal(loginSchema.safeParse({ identifier: "", password: "x" }).success, false);
});
