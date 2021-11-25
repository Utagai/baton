import { pbkdf2Sync } from 'crypto';

import { createPasswordHash, passwordMatchesHash } from './Password';

describe('createPasswordHash', () => {
  // Unclear just how useful this test even is really...
  test('creates the correct hash', () => {
    const plaintextPassword = 'helloworld';
    const pwHashInfo = createPasswordHash(plaintextPassword);
    const saltUsed = pwHashInfo.salt;
    const itersUsed = pwHashInfo.iterations;
    const expectedHash = pbkdf2Sync(
      plaintextPassword,
      saltUsed,
      itersUsed,
      512,
      'sha512',
    ).toString('hex');
    expect(pwHashInfo.hash).toEqual(expectedHash);
  });

  // OK, _technically_ this is possible and could happen even for correct code.
  // _BUT_, the chance of this happen N (=10) times is _astronomically_ low
  // because it would require us to generate the _same exact_ 128 byte base64
  // salt each and every time... if this ever ends up happening, honestly, the
  // Earth will be swallowed up by the sun by then and it won't matter.
  test('with same passwords do not always give the same hash', () => {
    const numRuns = 10;
    type seenHashes = { [hash: string]: boolean };
    const hashes: seenHashes = {};
    for (let i = 0; i < numRuns; i += 1) {
      const { hash } = createPasswordHash(i.toString());
      hashes[hash] = true;
    }

    expect(Object.keys(hashes).length).toBe(numRuns);
  });
});

describe('passwordMatchesHash', () => {
  test('accepts correct password', () => {
    expect(
      passwordMatchesHash('hello world', {
        hash: 'fdc12617b434853ebbdd7b17de2c24533f82d309f2b23c9a7aa319a160a6b86dac97b786fcc7491b42b2925bc2fa77550f3526d17524163c5e7ea28af5daaed117322dd0e397def646c290594ee48b467ac9d9a64987d7d1c03441eb746562e87f7d106ba3f606b3395874ca348b21f14c9f9d4436239d3fe21e663fb72eb967e8bb059673ee7dc9aa3710867e924e6f0a2186a3b34cbf43824fd824ff6bcaa75631266facc5798ba11438ee8faf370e4a7851824c7c71ab65a7511d8f80c1d2fc59f7fe48659226715ec151ff29dc5371cea49095e2735eebb40ca04c3439adc4411b653034088808c4fc298479747b996751756bcc7da8bc3cbee1103602b5bde3fa2ce3651550f46ab207f22f0a9e7fda9e62515b7bcf3d72d4854785e3b3485eeb54fdc65719c75d534ea69522c2702346787b166db0209dfa2c7a330a7131a70909515ab15150df9940dd3b5ba252feb4ba0b9db7aceafc6bd14ca58510ff3f32fab6695dfb7bbb4a75cd33d0364010c42541d3365c702e2696df4bab224d7c45f64498ad40a918c801d5a9981f28c5adb4ed89bfeea0ee902953a9f8d560e01abe84e533d388bf095d7377efdeded95fe60588dd8a5ce8025790ca0ee5493e81cdc8397a34af4995fe12d9fc0323b0f5b8803fb63dc3a80bc5eeac543c24e076a998e40b7b928a75689ead8f50431192c67d6d614616e627c090549e65',
        salt: 'bar',
        iterations: 42,
      }),
    ).toBeTruthy();
  });

  test('rejects wrong password', () => {
    expect(
      passwordMatchesHash('hello world', {
        hash: 'lol this',
        salt: 'is totally wrong',
        iterations: 42,
      }),
    ).toBeFalsy();
  });
});
