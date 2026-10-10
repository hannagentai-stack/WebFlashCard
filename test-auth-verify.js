import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ XÁC THỰC (REGISTER / LOGIN) ---');

  // Test 1: Kiểm tra backend sống
  console.log('\n[Test 1] Kiểm tra endpoint /api/health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthData.status, 'ok');
  console.log('✅ Backend đang hoạt động bình thường trên cổng 3000.');

  // Test 2: Kiểm tra CORS preflight từ origin Vite (http://localhost:5173)
  console.log('\n[Test 2] Kiểm tra CORS Preflight OPTIONS từ http://localhost:5173...');
  const corsRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });
  assert.strictEqual(corsRes.status, 204);
  assert.strictEqual(corsRes.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.strictEqual(corsRes.headers.get('access-control-allow-credentials'), 'true');
  console.log('✅ CORS cấu hình đúng: Cho phép origin http://localhost:5173 và credentials: true.');

  // Test 3: Đăng ký tài khoản mới
  const testEmail = `user_${Date.now()}@flashcard.local`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Nguyễn Minh Anh';

  console.log(`\n[Test 3] Đăng ký tài khoản mới: ${testEmail}...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173'
    },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword
    })
  });
  const regData = await regRes.json();
  const setCookieReg = regRes.headers.get('set-cookie');

  assert.strictEqual(regRes.status, 201, `Đăng ký trả về ${regRes.status}`);
  assert.strictEqual(regData.success, true);
  assert.ok(regData.user.id);
  assert.strictEqual(regData.user.email, testEmail);
  assert.strictEqual(regData.user.displayName, testName);
  assert.strictEqual(regData.user.name, testName);
  assert.ok(regData.token, 'Response phải chứa token');
  assert.ok(setCookieReg && setCookieReg.includes('HttpOnly'), 'Cookie phải có cờ HttpOnly');
  assert.ok(setCookieReg.includes('Path=/'), 'Cookie phải có Path=/');
  assert.ok(setCookieReg.toLowerCase().includes('samesite=lax'), 'Cookie phải có SameSite=Lax');
  console.log('✅ Đăng ký thành công!');
  console.log('   - User:', regData.user);
  console.log('   - Set-Cookie:', setCookieReg);

  // Test 4: Đăng nhập lại với tài khoản vừa tạo
  console.log(`\n[Test 4] Đăng nhập lại với ${testEmail}...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173'
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      rememberMe: true
    })
  });
  const loginData = await loginRes.json();
  const setCookieLogin = loginRes.headers.get('set-cookie');

  assert.strictEqual(loginRes.status, 200, `Đăng nhập trả về ${loginRes.status}`);
  assert.strictEqual(loginData.success, true);
  assert.strictEqual(loginData.user.email, testEmail);
  assert.strictEqual(loginData.user.name, testName);
  assert.ok(loginData.token);
  assert.ok(setCookieLogin && setCookieLogin.includes('HttpOnly'));
  console.log('✅ Đăng nhập thành công!');
  console.log('   - User:', loginData.user);
  console.log('   - Token độ dài:', loginData.token.length);

  // Test 5: Kiểm tra xác thực qua cookie với GET /api/auth/me
  console.log('\n[Test 5] Xác thực GET /api/auth/me bằng Cookie...');
  // Tách cookie token
  const tokenCookie = setCookieLogin.split(';')[0];
  const meCookieRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Cookie': tokenCookie
    }
  });
  const meCookieData = await meCookieRes.json();
  assert.strictEqual(meCookieRes.status, 200);
  assert.strictEqual(meCookieData.success, true);
  assert.strictEqual(meCookieData.user.id, loginData.user.id);
  console.log('✅ Xác thực bằng Cookie httpOnly thành công!');

  // Test 6: Kiểm tra xác thực qua Bearer header (phòng hờ cross-site)
  console.log('\n[Test 6] Xác thực GET /api/auth/me bằng Authorization Bearer header...');
  const meBearerRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${loginData.token}`
    }
  });
  const meBearerData = await meBearerRes.json();
  assert.strictEqual(meBearerRes.status, 200);
  assert.strictEqual(meBearerData.success, true);
  assert.strictEqual(meBearerData.user.id, loginData.user.id);
  console.log('✅ Xác thực bằng Bearer token fallback thành công!');

  // Test 7: Kiểm tra xử lý lỗi khi đăng ký email trùng
  console.log('\n[Test 7] Kiểm tra lỗi trùng email...');
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nguyễn Văn B',
      email: testEmail,
      password: 'AnotherPassword123'
    })
  });
  const dupData = await dupRes.json();
  assert.strictEqual(dupRes.status, 409);
  assert.strictEqual(dupData.success, false);
  assert.ok(dupData.message.includes('đã được sử dụng'));
  console.log('✅ Xử lý lỗi trùng email đúng chuẩn (HTTP 409):', dupData.message);

  // Test 8: Kiểm tra xử lý lỗi khi mật khẩu sai
  console.log('\n[Test 8] Kiểm tra lỗi sai mật khẩu khi đăng nhập...');
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword123'
    })
  });
  const wrongPassData = await wrongPassRes.json();
  assert.strictEqual(wrongPassRes.status, 401);
  assert.strictEqual(wrongPassData.success, false);
  assert.ok(wrongPassData.message.includes('không chính xác'));
  console.log('✅ Xử lý lỗi sai mật khẩu đúng chuẩn (HTTP 401):', wrongPassData.message);

  console.log('\n🎉 TẤT CẢ 8 BÀI TEST KIỂM THỬ XÁC THỰC ĐỀU ĐÃ ĐẠT (PASS)!');
}

runTests().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
